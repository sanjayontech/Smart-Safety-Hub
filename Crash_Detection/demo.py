"""Live demo of the automatic crash-detection engine.

Streams synthetic IMU/collision packets from DummySensorProvider through the
CrashDetector and prints each verdict. Use this to show the detection brain
working without a CARLA simulation.

Run from inside the Crash_Detection/ folder:
    python demo.py
"""

from __future__ import annotations

import time

from adapters.dummy_provider import DummySensorProvider
from modules.crash_detection.detector import CrashDetector


def main() -> None:
    provider = DummySensorProvider()
    detector = CrashDetector(history_size=3)

    print("=" * 60)
    print("  Smart Safety Hub — Automatic Crash Detection Engine")
    print("  Streaming synthetic sensor data. Press Ctrl+C to stop.")
    print("=" * 60)

    try:
        while True:
            packet = provider.stream_sensor_data()
            result = detector.detect_accident(packet)

            flag = "CRASH" if result["accident_detected"] else "ok   "
            sev = result["severity"].upper().ljust(6)
            reasons = ", ".join(result["reasons"])

            print(
                f"  [{flag}] sev={sev} "
                f"accel={packet['acceleration']:5.1f}  "
                f"impact={packet['impact_force']:5.1f}  "
                f"rollover={str(packet['rollover_detected']):5}  "
                f"| {reasons}"
            )
            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\nStopped.")
    finally:
        provider.destroy()


if __name__ == "__main__":
    main()
