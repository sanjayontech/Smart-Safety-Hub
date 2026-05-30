"""
Smart Safety Hub — Demo Mode
Pushes realistic simulated detection data to the cloud API continuously.
Use this when you can't run the full YOLO detector but want the dashboard
to show live-looking data for judges/reviewers.

Usage:
    python demo_mode.py
"""

import urllib.request
import json
import time
import random
import math
from datetime import datetime

API_URL = "https://smart-safety-api.sanjayontech.workers.dev"

VEHICLE_OBJECTS = ["car", "car", "car", "truck", "motorcycle", "person", "bus", "car"]
SPEED_LIMIT = 50

def simulate_frame(t: float) -> dict:
    """Generate realistic detection data that varies over time."""
    # Speed oscillates naturally (sine wave + noise)
    base_speed = 45 + 20 * math.sin(t / 30) + random.randint(-5, 5)
    speed = max(20, min(90, int(base_speed)))

    # Occasionally spike over limit
    if random.random() < 0.3:
        speed = random.randint(55, 75)

    alerts = []
    if speed > SPEED_LIMIT:
        alerts.append("OVER SPEED")

    # Random object detections
    n_objects = random.randint(2, 7)
    detected = random.choices(VEHICLE_OBJECTS, k=n_objects)

    # Occasionally detect stop sign
    if random.random() < 0.1:
        detected.append("stop sign")
        alerts.append("STOP SIGN")

    return {
        "speed": speed,
        "speed_limit": SPEED_LIMIT,
        "alerts": alerts,
        "detected_objects": detected,
        "timestamp": datetime.now().isoformat(),
    }


def push(state: dict) -> bool:
    try:
        payload = json.dumps(state).encode()
        req = urllib.request.Request(
            f"{API_URL}/update-state",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        urllib.request.urlopen(req, timeout=5)
        return True
    except Exception as e:
        print(f"  Push failed: {e}")
        return False


print("=" * 55)
print("  Smart Safety Hub — Demo Mode")
print(f"  Pushing to: {API_URL}")
print(f"  Dashboard:  https://smart-safety-hub.pages.dev/dashboard")
print("  Press Ctrl+C to stop.")
print("=" * 55)

t = 0
while True:
    state = simulate_frame(t)
    ok = push(state)

    speed = state["speed"]
    alerts = state["alerts"]
    objects = len(state["detected_objects"])
    status = "✓" if ok else "✗"

    print(f"  {status} {datetime.now().strftime('%H:%M:%S')} | "
          f"Speed: {speed} km/h | "
          f"Alerts: {alerts or 'none'} | "
          f"Objects: {objects}")

    t += 1
    time.sleep(1)
