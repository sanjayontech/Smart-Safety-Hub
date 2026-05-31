"""Dummy crash-sensor provider for local testing.

Generates a predictable standardized payload so the detector can be tested
without a running CARLA simulation.  Rollover probability is kept very low
(~2 %) to avoid flooding tests with "high" severity results.
"""

from __future__ import annotations

import random
from datetime import datetime

from adapters.base_provider import BaseSensorProvider


class DummySensorProvider(BaseSensorProvider):
    """Generate synthetic crash-sensor packets with realistic probabilities."""

    # Probability that any single packet contains a rollover event.
    ROLLOVER_PROBABILITY: float = 0.02

    def stream_sensor_data(self) -> dict[str, object]:
        """Return a single synthetic sensor packet.

        Shape is identical to CarlaSensorProvider so CrashDetector never needs
        to know which provider is in use.
        """

        # Impact force is 0 the vast majority of the time; occasional spikes
        # simulate real collision events without saturating the test signal.
        impact_force = (
            round(random.uniform(10.0, 45.0), 2)
            if random.random() < 0.10          # ~10 % chance of an impact
            else 0.0
        )

        return {
            "acceleration": round(random.uniform(0.0, 20.0), 2),
            "impact_force": impact_force,
            "rollover_detected": random.random() < self.ROLLOVER_PROBABILITY,
            "timestamp": datetime.now().isoformat(timespec="seconds"),
        }

    def destroy(self) -> None:
        """No resources to release for the dummy provider."""