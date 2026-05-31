"""Sensor provider adapters package."""

from adapters.base_provider import BaseSensorProvider
from adapters.dummy_provider import DummySensorProvider

__all__ = ["BaseSensorProvider", "DummySensorProvider"]

# CarlaSensorProvider requires the CARLA Python library.
# Import it directly when needed:
#   from adapters.carla_provider import CarlaSensorProvider
