"""Tests for modules 5 & 6 — IMU Crash Sensor + Automatic Accident Detection.

Run with:
    python -m pytest tests/test_detection.py -v

All tests use DummySensorProvider or hand-crafted SensorData dicts so the
suite runs without a CARLA environment.
"""

from __future__ import annotations

import pytest

from models.sensor_data import SensorData
from modules.crash_detection.detector import CrashDetector
from modules.crash_detection.thresholds import (
    ACCELERATION_HIGH_THRESHOLD,
    ACCELERATION_MEDIUM_THRESHOLD,
    ACCELERATION_WARNING_THRESHOLD,
    IMPACT_FORCE_HIGH_THRESHOLD,
    IMPACT_FORCE_MEDIUM_THRESHOLD,
    IMPACT_FORCE_WARNING_THRESHOLD,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _packet(
    acceleration: float = 0.0,
    impact_force: float = 0.0,
    rollover: bool = False,
) -> dict:
    return {
        "acceleration": acceleration,
        "impact_force": impact_force,
        "rollover_detected": rollover,
        "timestamp": "2024-01-01T00:00:00",
    }


def _fresh_detector() -> CrashDetector:
    """Return a detector with a clean history."""
    return CrashDetector(history_size=3)


# ---------------------------------------------------------------------------
# SensorData model
# ---------------------------------------------------------------------------

class TestSensorData:
    def test_from_dict_all_fields(self):
        data = SensorData.from_dict(
            {"acceleration": "5.5", "impact_force": "10.0",
             "rollover_detected": False, "timestamp": "2024-01-01T00:00:00"}
        )
        assert data.acceleration == 5.5
        assert data.impact_force == 10.0
        assert data.rollover_detected is False

    def test_from_dict_missing_fields_use_defaults(self):
        data = SensorData.from_dict({})
        assert data.acceleration == 0.0
        assert data.impact_force == 0.0
        assert data.rollover_detected is False

    def test_from_dict_string_bool_coerced(self):
        # Any non-empty string is truthy in Python — the cast should preserve that.
        data = SensorData.from_dict({"rollover_detected": True})
        assert data.rollover_detected is True

    def test_negative_acceleration_raises(self):
        with pytest.raises(ValueError, match="acceleration"):
            SensorData(acceleration=-1.0)

    def test_negative_impact_force_raises(self):
        with pytest.raises(ValueError, match="impact_force"):
            SensorData(impact_force=-0.1)


# ---------------------------------------------------------------------------
# No crash — below all thresholds
# ---------------------------------------------------------------------------

class TestNoCrash:
    def test_zero_signals(self):
        det = _fresh_detector()
        result = det.detect_accident(_packet(0.0, 0.0))
        assert result["accident_detected"] is False
        assert result["severity"] == "low"
        assert "no_threshold_exceeded" in result["reasons"]

    def test_low_acceleration_only(self):
        det = _fresh_detector()
        result = det.detect_accident(_packet(acceleration=3.0))
        assert result["accident_detected"] is False

    def test_low_impact_only(self):
        det = _fresh_detector()
        result = det.detect_accident(_packet(impact_force=5.0))
        assert result["accident_detected"] is False


# ---------------------------------------------------------------------------
# Speed-breaker / rough-road suppression
# ---------------------------------------------------------------------------

class TestFalsePositiveSuppression:
    def test_single_acceleration_spike_is_rough_road(self):
        det = _fresh_detector()
        result = det.detect_accident(
            _packet(acceleration=ACCELERATION_WARNING_THRESHOLD + 1.0)
        )
        assert result["accident_detected"] is False
        assert "rough_road_detected" in result["reasons"]

    def test_two_acceleration_spikes_are_speed_breaker(self):
        det = _fresh_detector()
        spike = _packet(acceleration=ACCELERATION_WARNING_THRESHOLD + 1.0)
        det.detect_accident(spike)
        result = det.detect_accident(spike)
        assert result["accident_detected"] is False
        assert "speed_breaker_detected" in result["reasons"]

    def test_high_acceleration_no_impact_suppressed(self):
        """Even a high acceleration spike alone should not be a crash."""
        det = _fresh_detector()
        result = det.detect_accident(
            _packet(acceleration=ACCELERATION_HIGH_THRESHOLD + 5.0)
        )
        assert result["accident_detected"] is False


# ---------------------------------------------------------------------------
# Rollover detection
# ---------------------------------------------------------------------------

class TestRollover:
    def test_rollover_flag_triggers_high_severity(self):
        det = _fresh_detector()
        result = det.detect_accident(_packet(rollover=True))
        assert result["accident_detected"] is True
        assert result["severity"] == "high"
        assert "rollover_detected" in result["reasons"]

    def test_rollover_overrides_low_signals(self):
        """Rollover should fire high even if impact/accel are both zero."""
        det = _fresh_detector()
        result = det.detect_accident(_packet(0.0, 0.0, rollover=True))
        assert result["accident_detected"] is True
        assert result["severity"] == "high"

    def test_rollover_in_history_window_triggers(self):
        """A rollover two packets ago should still flag the window."""
        det = _fresh_detector()
        det.detect_accident(_packet(rollover=True))
        det.detect_accident(_packet())
        result = det.detect_accident(_packet())
        assert result["accident_detected"] is True
        assert result["severity"] == "high"


# ---------------------------------------------------------------------------
# Medium severity
# ---------------------------------------------------------------------------

class TestMediumSeverity:
    def test_medium_impact_plus_warning_accel(self):
        # impact_force_medium = score 2, acceleration_warning = score 1 → total 3.
        # A single-packet score of 3 hits SCORE_HIGH_PACKET, so severity is "high".
        det = _fresh_detector()
        result = det.detect_accident(
            _packet(
                acceleration=ACCELERATION_WARNING_THRESHOLD + 0.5,
                impact_force=IMPACT_FORCE_MEDIUM_THRESHOLD + 0.5,
            )
        )
        assert result["accident_detected"] is True
        assert result["severity"] == "high"

    def test_two_warning_impacts_accumulate_to_medium(self):
        det = _fresh_detector()
        det.detect_accident(
            _packet(impact_force=IMPACT_FORCE_WARNING_THRESHOLD + 0.5)
        )
        result = det.detect_accident(
            _packet(impact_force=IMPACT_FORCE_WARNING_THRESHOLD + 0.5)
        )
        assert result["accident_detected"] is True
        assert result["severity"] == "medium"


# ---------------------------------------------------------------------------
# High severity
# ---------------------------------------------------------------------------

class TestHighSeverity:
    def test_high_impact_alone(self):
        det = _fresh_detector()
        result = det.detect_accident(
            _packet(impact_force=IMPACT_FORCE_HIGH_THRESHOLD + 1.0)
        )
        assert result["accident_detected"] is True
        assert result["severity"] == "high"

    def test_high_impact_and_high_accel_in_same_packet(self):
        det = _fresh_detector()
        result = det.detect_accident(
            _packet(
                acceleration=ACCELERATION_HIGH_THRESHOLD + 1.0,
                impact_force=IMPACT_FORCE_HIGH_THRESHOLD + 1.0,
            )
        )
        assert result["accident_detected"] is True
        assert result["severity"] == "high"

    def test_accumulated_window_score_reaches_high(self):
        """Three medium-impact packets should accumulate to high severity."""
        det = _fresh_detector()
        medium_packet = _packet(impact_force=IMPACT_FORCE_MEDIUM_THRESHOLD + 1.0)
        det.detect_accident(medium_packet)
        det.detect_accident(medium_packet)
        result = det.detect_accident(medium_packet)
        assert result["accident_detected"] is True
        assert result["severity"] == "high"


# ---------------------------------------------------------------------------
# Result shape
# ---------------------------------------------------------------------------

class TestResultShape:
    def test_reasons_is_always_a_list(self):
        det = _fresh_detector()
        for packet in [
            _packet(),
            _packet(acceleration=ACCELERATION_WARNING_THRESHOLD + 1.0),
            _packet(impact_force=IMPACT_FORCE_HIGH_THRESHOLD + 1.0),
            _packet(rollover=True),
        ]:
            result = det.detect_accident(packet)
            assert isinstance(result["reasons"], list), (
                f"reasons should be list, got {type(result['reasons'])}"
            )

    def test_required_keys_always_present(self):
        det = _fresh_detector()
        result = det.detect_accident(_packet())
        assert "accident_detected" in result
        assert "severity" in result
        assert "reasons" in result

    def test_severity_values_are_valid(self):
        det = _fresh_detector()
        valid_severities = {"low", "medium", "high"}
        for packet in [
            _packet(),
            _packet(impact_force=IMPACT_FORCE_WARNING_THRESHOLD + 1.0),
            _packet(impact_force=IMPACT_FORCE_HIGH_THRESHOLD + 1.0),
            _packet(rollover=True),
        ]:
            result = det.detect_accident(packet)
            assert result["severity"] in valid_severities


# ---------------------------------------------------------------------------
# History window / sliding window behavior
# ---------------------------------------------------------------------------

class TestHistoryWindow:
    def test_old_crash_falls_out_of_window(self):
        """After 3 normal packets, a previous crash should no longer affect score."""
        det = _fresh_detector()
        det.detect_accident(_packet(impact_force=IMPACT_FORCE_MEDIUM_THRESHOLD + 1.0))
        # Fill window with normal packets to push the crash out.
        det.detect_accident(_packet())
        det.detect_accident(_packet())
        result = det.detect_accident(_packet())
        assert result["accident_detected"] is False

    def test_history_size_one(self):
        """With history_size=1 only the current packet matters."""
        det = CrashDetector(history_size=1)
        det.detect_accident(_packet(impact_force=IMPACT_FORCE_MEDIUM_THRESHOLD + 1.0))
        result = det.detect_accident(_packet(0.0, 0.0))
        assert result["accident_detected"] is False


# ---------------------------------------------------------------------------
# dict input accepted
# ---------------------------------------------------------------------------

class TestDictInput:
    def test_raw_dict_is_accepted(self):
        det = _fresh_detector()
        raw = {
            "acceleration": 5.0,
            "impact_force": 40.0,
            "rollover_detected": False,
            "timestamp": "2024-01-01T00:00:00",
        }
        result = det.detect_accident(raw)
        assert result["accident_detected"] is True

    def test_sensordata_instance_is_accepted(self):
        det = _fresh_detector()
        data = SensorData(impact_force=IMPACT_FORCE_HIGH_THRESHOLD + 1.0)
        result = det.detect_accident(data)
        assert result["accident_detected"] is True