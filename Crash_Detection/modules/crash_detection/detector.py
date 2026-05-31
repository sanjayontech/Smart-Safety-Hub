"""Automatic accident detection logic.

The detector combines rollover, impact force, and acceleration into a weighted
score over a short sliding window so it can catch real crash patterns while
suppressing false positives from speed breakers and rough roads.

Changes vs. original:
  - _window_reason now returns a list[str] instead of a joined string so
    callers do not need to split on "+".
  - Packets in the window are sorted by timestamp before scoring so
    out-of-order CARLA delivery does not misalign impact + acceleration signals.
  - Speed-breaker / rough-road suppression is unchanged but documented more
    clearly.
  - All public scoring constants are imported from thresholds.py; the class
    accepts them as constructor overrides for easy unit testing.
"""

from __future__ import annotations

from collections import deque
from typing import Any

from models.sensor_data import SensorData
from modules.crash_detection.thresholds import (
    ACCELERATION_HIGH_THRESHOLD,
    ACCELERATION_MEDIUM_THRESHOLD,
    ACCELERATION_WARNING_THRESHOLD,
    IMPACT_FORCE_HIGH_THRESHOLD,
    IMPACT_FORCE_MEDIUM_THRESHOLD,
    IMPACT_FORCE_WARNING_THRESHOLD,
    SCORE_HIGH_PACKET,
    SCORE_HIGH_TOTAL,
    SCORE_MEDIUM_TOTAL,
)


class CrashDetector:
    """Detect accidents from the standardized crash-sensor packet.

    Typical usage
    -------------
    detector = CrashDetector()
    result = detector.detect_accident(provider.stream_sensor_data())
    # result = {"accident_detected": bool, "severity": str, "reasons": list[str]}
    """

    def __init__(
        self,
        history_size: int = 3,
        acceleration_warning_threshold: float = ACCELERATION_WARNING_THRESHOLD,
        acceleration_medium_threshold: float = ACCELERATION_MEDIUM_THRESHOLD,
        acceleration_high_threshold: float = ACCELERATION_HIGH_THRESHOLD,
        impact_force_warning_threshold: float = IMPACT_FORCE_WARNING_THRESHOLD,
        impact_force_medium_threshold: float = IMPACT_FORCE_MEDIUM_THRESHOLD,
        impact_force_high_threshold: float = IMPACT_FORCE_HIGH_THRESHOLD,
    ) -> None:
        self._packet_history: deque[SensorData] = deque(maxlen=history_size)

        # Threshold bands are constructor-injectable so tests and future teams
        # can tune them without patching module-level constants.
        self.acceleration_warning_threshold = acceleration_warning_threshold
        self.acceleration_medium_threshold  = acceleration_medium_threshold
        self.acceleration_high_threshold    = acceleration_high_threshold
        self.impact_force_warning_threshold = impact_force_warning_threshold
        self.impact_force_medium_threshold  = impact_force_medium_threshold
        self.impact_force_high_threshold    = impact_force_high_threshold

    # ------------------------------------------------------------------
    # PUBLIC API
    # ------------------------------------------------------------------

    def detect_accident(
        self,
        sensor_data: SensorData | dict[str, Any],
    ) -> dict[str, Any]:
        """Analyse one sensor packet and return a standardized crash result.

        Parameters
        ----------
        sensor_data:
            Either a SensorData instance or a raw provider dict.

        Returns
        -------
        dict with keys:
            accident_detected : bool
            severity          : "low" | "medium" | "high"
            reasons           : list[str]  — individual signal labels
        """

        data = (
            sensor_data
            if isinstance(sensor_data, SensorData)
            else SensorData.from_dict(sensor_data)
        )
        self._packet_history.append(data)

        # Sort window by timestamp so out-of-order CARLA delivery (collision
        # event arriving one tick late) does not misalign signals.
        window: list[SensorData] = sorted(
            self._packet_history, key=lambda p: p.timestamp
        )

        # ---- Rollover: strongest signal, always high severity ----------
        if any(packet.rollover_detected for packet in window):
            return self._build_result(True, "high", ["rollover_detected"])

        # ---- Score each packet in the window ---------------------------
        scored: list[tuple[int, list[str]]] = [
            self._score_packet(p) for p in window
        ]

        crash_score = sum(score for score, _ in scored)
        all_reasons: list[str] = [r for _, reasons in scored for r in reasons]

        has_impact_signal = any(
            score >= 1 and any(r.startswith("impact_force") for r in reasons)
            for score, reasons in scored
        )
        has_acceleration_signal = any(
            score >= 1 and any(r.startswith("acceleration") for r in reasons)
            for score, reasons in scored
        )

        # ---- Suppress acceleration-only spikes (speed breakers) --------
        # Rough roads and speed breakers produce repeated acceleration spikes
        # without a matching collision impulse.  We keep these as non-crashes
        # to avoid false positives in urban environments.
        if has_acceleration_signal and not has_impact_signal:
            accel_spike_count = sum(
                1
                for score, reasons in scored
                if score >= 1 and any(r.startswith("acceleration") for r in reasons)
            )
            if accel_spike_count >= 2:
                return self._build_result(False, "low", ["speed_breaker_detected"])
            return self._build_result(False, "low", ["rough_road_detected"])

        # ---- Score-based severity classification -----------------------
        max_single_score = max((score for score, _ in scored), default=0)

        if crash_score >= SCORE_HIGH_TOTAL or max_single_score >= SCORE_HIGH_PACKET:
            return self._build_result(True, "high", self._deduplicated(all_reasons))

        if crash_score >= SCORE_MEDIUM_TOTAL:
            return self._build_result(True, "medium", self._deduplicated(all_reasons))

        if crash_score == 1:
            return self._build_result(
                False, "low", self._deduplicated(all_reasons) or ["minor_spike_observed"]
            )

        return self._build_result(False, "low", ["no_threshold_exceeded"])

    # ------------------------------------------------------------------
    # INTERNAL SCORING
    # ------------------------------------------------------------------

    def _score_packet(self, packet: SensorData) -> tuple[int, list[str]]:
        """Return (total_score, reason_list) for a single packet."""

        impact_score, impact_reason = self._score_impact(packet.impact_force)
        accel_score,  accel_reason  = self._score_acceleration(packet.acceleration)

        total_score = impact_score + accel_score
        reasons = [r for r in (impact_reason, accel_reason) if r is not None]

        return total_score, reasons

    def _score_impact(self, impact_force: float) -> tuple[int, str | None]:
        """Map impact force to a score and reason label."""

        if impact_force >= self.impact_force_high_threshold:
            return 3, "impact_force_high"
        if impact_force >= self.impact_force_medium_threshold:
            return 2, "impact_force_medium"
        if impact_force >= self.impact_force_warning_threshold:
            return 1, "impact_force_warning"
        return 0, None

    def _score_acceleration(self, acceleration: float) -> tuple[int, str | None]:
        """Map acceleration magnitude to a score and reason label."""

        if acceleration >= self.acceleration_high_threshold:
            return 3, "acceleration_high"
        if acceleration >= self.acceleration_medium_threshold:
            return 2, "acceleration_medium"
        if acceleration >= self.acceleration_warning_threshold:
            return 1, "acceleration_warning"
        return 0, None

    # ------------------------------------------------------------------
    # RESULT BUILDING
    # ------------------------------------------------------------------

    @staticmethod
    def _build_result(
        accident_detected: bool,
        severity: str,
        reasons: list[str],
    ) -> dict[str, Any]:
        """Return the fixed-shape output dict consumed by all downstream teams.

        The shape is:
            {
                "accident_detected": bool,
                "severity":          "low" | "medium" | "high",
                "reasons":           list[str],   # individual signal labels
            }

        NOTE: "reasons" is a list — not a "+"-joined string — so callers can
        check membership directly:
            if "rollover_detected" in result["reasons"]: ...
        """

        return {
            "accident_detected": accident_detected,
            "severity": severity,
            "reasons": reasons,
        }

    @staticmethod
    def _deduplicated(reasons: list[str]) -> list[str]:
        """Return reasons with duplicates removed, preserving order."""

        seen: set[str] = set()
        unique: list[str] = []
        for r in reasons:
            if r not in seen:
                seen.add(r)
                unique.append(r)
        return unique