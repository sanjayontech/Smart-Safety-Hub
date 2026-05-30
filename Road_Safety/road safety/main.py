import argparse
import urllib.request
from ultralytics import YOLO
import cv2
import random
import os
import sys
import json
import threading
import pandas as pd
from datetime import datetime

parser = argparse.ArgumentParser()
parser.add_argument("--headless", action="store_true", help="Run without OpenCV display window")
args = parser.parse_args()
HEADLESS = args.headless

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model = YOLO(os.path.join(BASE_DIR, "yolov8n.pt"))
cap = cv2.VideoCapture(os.path.join(BASE_DIR, "videos", "road.mp4"))

# API URL: set API_URL env var to point to deployed Render API in production
# e.g.  $env:API_URL = "https://smart-safety-api.onrender.com"
API_URL = os.getenv("API_URL", "http://127.0.0.1:5000")

# Local fallback file (used when cloud API is unreachable)
SHARED_STATE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(BASE_DIR)), "shared_state.json"
)

speed_limit = 50
overspeed_alert_played = False
stop_alert_played = False
logs = []


def play_alert(freq=1000, duration=500):
    if HEADLESS:
        return
    if sys.platform == "win32":
        import winsound
        threading.Thread(target=winsound.Beep, args=(freq, duration), daemon=True).start()
    elif sys.platform == "darwin":
        os.system(f"afplay /System/Library/Sounds/Glass.aiff &")


def write_shared_state(speed, alerts, detected_objects):
    state = {
        "speed": speed,
        "speed_limit": speed_limit,
        "alerts": alerts,
        "detected_objects": detected_objects,
        "timestamp": datetime.now().isoformat(),
    }
    payload = json.dumps(state).encode()

    # 1. Try posting to API (local or cloud)
    try:
        req = urllib.request.Request(
            f"{API_URL}/update-state",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        urllib.request.urlopen(req, timeout=1)
        return
    except Exception:
        pass

    # 2. Fallback: write to local shared_state.json
    try:
        with open(SHARED_STATE_PATH, "w") as f:
            json.dump(state, f)
    except Exception:
        pass


if HEADLESS:
    print("Road Safety Detector running in headless mode — writing to shared_state.json")

while True:
    ret, frame = cap.read()

    if not ret:
        # Loop the video instead of stopping
        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        continue

    current_speed = random.randint(30, 90)
    results = model(frame, verbose=False)

    stop_detected = False
    detected_objects = []
    active_alerts = []

    for r in results:
        for box in r.boxes:
            cls = int(box.cls)
            label = model.names[cls]
            detected_objects.append(label)
            if label == "stop sign":
                stop_detected = True

    # OVER SPEED
    if current_speed > speed_limit:
        active_alerts.append("OVER SPEED")
        if not overspeed_alert_played:
            play_alert(freq=1000, duration=500)
            overspeed_alert_played = True
            logs.append({"time": datetime.now(), "event": "OVER SPEED", "speed": current_speed})
    else:
        overspeed_alert_played = False

    # STOP SIGN
    if stop_detected:
        active_alerts.append("STOP SIGN")
        if not stop_alert_played:
            play_alert(freq=800, duration=400)
            stop_alert_played = True
            logs.append({"time": datetime.now(), "event": "STOP SIGN", "speed": current_speed})
    else:
        stop_alert_played = False

    write_shared_state(current_speed, active_alerts, detected_objects)

    if not HEADLESS:
        output = results[0].plot()
        cv2.rectangle(output, (0, 0), (500, 260), (30, 30, 30), -1)
        cv2.putText(output, "DRIVER SAFETY DASHBOARD", (20, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
        cv2.putText(output, f"Current Speed: {current_speed} km/h", (20, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        cv2.putText(output, f"Speed Limit: {speed_limit} km/h", (20, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

        if current_speed > speed_limit:
            cv2.putText(output, "ALERT: OVER SPEED!", (20, 170), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 3)
        if stop_detected:
            cv2.putText(output, "ALERT: STOP SIGN DETECTED!", (20, 210), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 165, 255), 2)

        cv2.imshow("Road Safety AI System", output)
        if cv2.waitKey(1) == 27:
            break

# Save logs
df = pd.DataFrame(logs)
df.to_csv(os.path.join(BASE_DIR, "hazard_log.csv"), index=False)
if not HEADLESS:
    cap.release()
    cv2.destroyAllWindows()
