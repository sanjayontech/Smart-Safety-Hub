"""CARLA crash-sensor provider.

Bridges live CARLA IMU and collision sensors into standardized crash packets.

Fixes applied vs. original:
  - Sensors are spawned with a zero relative Transform (not the world transform).
  - Gravity (9.81 m/s²) is subtracted from the IMU Z axis before computing
    acceleration magnitude so a stationary vehicle reads ~0, not ~9.81.
  - impact_force is reset to 0.0 after each packet is consumed so the detector
    does not re-fire on a stale value.
  - A threading.Lock guards all shared sensor state because CARLA callbacks
    run on a background thread.
  - sensor.stop() is called before sensor.destroy() to prevent a callback
    firing mid-destruction.
"""

from __future__ import annotations

import math
import threading
from datetime import datetime
from typing import Any

import carla  # type: ignore  # only available inside CARLA environment

from adapters.base_provider import BaseSensorProvider

# Standard gravitational acceleration (m/s²).  CARLA's IMU includes gravity
# on the Z axis, so we subtract it before computing the crash-relevant magnitude.
_GRAVITY: float = 9.81


class CarlaSensorProvider(BaseSensorProvider):
    """Bridge CARLA sensors into standardized crash packets."""

    def __init__(self, vehicle: Any) -> None:
        """
        Parameters
        ----------
        vehicle:
            A CARLA vehicle actor that the sensors will be attached to.
        """

        self.vehicle = vehicle

        # Shared sensor state — written by callback threads, read by the main thread.
        self._latest_acceleration: float = 0.0
        self._latest_impact_force: float = 0.0
        self._rollover_detected: bool = False

        # Protects the three fields above against concurrent access.
        self._lock = threading.Lock()

        # Sensor actor references (kept so we can stop and destroy them cleanly).
        self._imu_sensor: Any = None
        self._collision_sensor: Any = None

        self._setup_sensors()

    # ------------------------------------------------------------------
    # SENSOR SETUP
    # ------------------------------------------------------------------

    def _setup_sensors(self) -> None:
        """Spawn and attach CARLA sensors to the vehicle."""

        world = self.vehicle.get_world()
        blueprint_library = world.get_blueprint_library()

        # A zero-offset relative Transform centers the sensor on the vehicle.
        # Passing self.vehicle.get_transform() (the world transform) here is
        # incorrect — the attach_to argument makes the spawn transform relative.
        relative_transform = carla.Transform()

        # ---- IMU sensor ------------------------------------------------
        imu_bp = blueprint_library.find("sensor.other.imu")
        self._imu_sensor = world.spawn_actor(
            imu_bp,
            relative_transform,
            attach_to=self.vehicle,
        )
        self._imu_sensor.listen(self._imu_callback)

        # ---- Collision sensor ------------------------------------------
        collision_bp = blueprint_library.find("sensor.other.collision")
        self._collision_sensor = world.spawn_actor(
            collision_bp,
            relative_transform,
            attach_to=self.vehicle,
        )
        self._collision_sensor.listen(self._collision_callback)

    # ------------------------------------------------------------------
    # SENSOR CALLBACKS  (run on CARLA background threads)
    # ------------------------------------------------------------------

    def _imu_callback(self, data: Any) -> None:
        """Handle IMU sensor updates from CARLA."""

        accel = data.accelerometer

        # Subtract gravity from Z so a stationary, level vehicle reads ~0.
        # Without this correction, magnitude ≈ 9.81 m/s² at rest, which already
        # exceeds ACCELERATION_WARNING_THRESHOLD (8.0) and causes constant false
        # positives.
        corrected_z = accel.z - _GRAVITY
        magnitude = math.sqrt(accel.x ** 2 + accel.y ** 2 + corrected_z ** 2)

        vehicle_rotation = self.vehicle.get_transform().rotation
        rollover = abs(vehicle_rotation.roll) > 45.0

        with self._lock:
            self._latest_acceleration = magnitude
            self._rollover_detected = rollover

    def _collision_callback(self, event: Any) -> None:
        """Handle collision events from CARLA."""

        impulse = event.normal_impulse
        force = math.sqrt(impulse.x ** 2 + impulse.y ** 2 + impulse.z ** 2)

        with self._lock:
            # Keep the highest force seen since the last packet was consumed.
            # This prevents a rapid double-collision from hiding the second hit.
            if force > self._latest_impact_force:
                self._latest_impact_force = force

    # ------------------------------------------------------------------
    # STANDARDIZED PAYLOAD
    # ------------------------------------------------------------------

    def get_imu_packet(self) -> dict[str, object]:
        """Return the latest normalized sensor packet and reset impact force.

        impact_force is cleared to 0.0 after it is read so the detector does
        not re-fire on a stale value on subsequent ticks.
        """

        with self._lock:
            packet = {
                "acceleration": float(self._latest_acceleration),
                "impact_force": float(self._latest_impact_force),
                "rollover_detected": bool(self._rollover_detected),
                "timestamp": datetime.now().isoformat(timespec="seconds"),
            }
            # Reset impact force — it is an event, not a continuous reading.
            self._latest_impact_force = 0.0

        return packet

    # ------------------------------------------------------------------
    # BaseSensorProvider interface
    # ------------------------------------------------------------------

    def stream_sensor_data(self) -> dict[str, object]:
        """Public provider interface required by BaseSensorProvider."""

        return self.get_imu_packet()

    # ------------------------------------------------------------------
    # CLEANUP
    # ------------------------------------------------------------------

    def destroy(self) -> None:
        """Stop listeners and destroy CARLA sensors safely.

        stop() detaches the callback before destroy() is called so the
        callback cannot fire on a partially-destroyed sensor object.
        """

        if self._imu_sensor is not None:
            self._imu_sensor.stop()
            self._imu_sensor.destroy()
            self._imu_sensor = None

        if self._collision_sensor is not None:
            self._collision_sensor.stop()
            self._collision_sensor.destroy()
            self._collision_sensor = None
