"""Base sensor provider contract.

This file defines the minimum interface that every sensor source must follow.
The rest of the project only depends on this abstraction, not on CARLA itself.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class BaseSensorProvider(ABC):
    """Common interface for dummy and CARLA-backed providers."""

    @abstractmethod
    def stream_sensor_data(self) -> dict[str, Any]:
        """Return the standardized crash-sensor payload."""

    @abstractmethod
    def destroy(self) -> None:
        """Release any hardware or simulation resources held by the provider."""