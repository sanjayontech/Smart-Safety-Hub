"""Standardized crash sensor schema.

Every provider must produce this exact structure so CrashDetector remains
independent of CARLA internals or any other provider implementation.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class SensorData:
    """Single normalized crash-sensor packet."""

    acceleration: float = 0.0
    impact_force: float = 0.0
    rollover_detected: bool = False
    timestamp: str = field(
        default_factory=lambda: datetime.now().isoformat(timespec="seconds")
    )

    # ------------------------------------------------------------------
    # Construction helpers
    # ------------------------------------------------------------------

    @classmethod
    def from_dict(cls, payload: dict[str, Any]) -> "SensorData":
        """Build a SensorData instance from any provider dictionary.

        All fields are explicitly cast to their expected types so a string
        value from a future provider (e.g. "0.0") does not slip through as
        truthy or cause arithmetic errors downstream.
        """

        return cls(
            acceleration=float(payload.get("acceleration", 0.0)),
            impact_force=float(payload.get("impact_force", 0.0)),
            rollover_detected=bool(payload.get("rollover_detected", False)),
            timestamp=str(
                payload.get(
                    "timestamp",
                    datetime.now().isoformat(timespec="seconds"),
                )
            ),
        )

    def __post_init__(self) -> None:
        """Validate field values after dataclass initialization."""

        if self.acceleration < 0:
            raise ValueError(
                f"acceleration must be >= 0, got {self.acceleration}"
            )
        if self.impact_force < 0:
            raise ValueError(
                f"impact_force must be >= 0, got {self.impact_force}"
            )