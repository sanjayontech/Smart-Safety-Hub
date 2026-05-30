import streamlit as st
from ultralytics import YOLO
import cv2
import random
import pandas as pd
import time

# Page title
st.set_page_config(
    page_title="AI Road Safety System",
    layout="wide"
)

st.title("🚗 AI-Powered Road Safety Dashboard")

# Load YOLO model
model = YOLO("yolov8n.pt")

# Open video
cap = cv2.VideoCapture("videos/road.mp4")

# Dashboard placeholders
frame_placeholder = st.empty()

col1, col2 = st.columns(2)

speed_box = col1.empty()
alert_box = col2.empty()

log_data = []

speed_limit = 50

while cap.isOpened():

    ret, frame = cap.read()

    if not ret:
        break

    # Simulated speed
    current_speed = random.randint(30, 90)

    # AI detection
    results = model(frame)

    stop_detected = False

    detected_objects = []

    for r in results:

        for box in r.boxes:

            cls = int(box.cls)

            label = model.names[cls]

            detected_objects.append(label)

            if label == "stop sign":

                stop_detected = True

    # Draw AI boxes
    output = results[0].plot()

    # Convert BGR → RGB
    output = cv2.cvtColor(output, cv2.COLOR_BGR2RGB)

    # Show video
    frame_placeholder.image(
        output,
        channels="RGB",
        use_container_width=True
    )

    # Speed metrics
    speed_box.metric(
        "Current Speed",
        f"{current_speed} km/h"
    )

    # Alert logic
    if current_speed > speed_limit:

        alert_box.error(
            "⚠ OVER SPEED WARNING!"
        )

        log_data.append({
            "Event": "Overspeed",
            "Speed": current_speed
        })

    elif stop_detected:

        alert_box.warning(
            "🛑 STOP SIGN DETECTED!"
        )

        log_data.append({
            "Event": "Stop Sign",
            "Speed": current_speed
        })

    else:

        alert_box.success(
            "✅ SAFE DRIVING"
        )

    time.sleep(0.03)

# Logs table
if log_data:

    st.subheader("Hazard Logs")

    df = pd.DataFrame(log_data)

    st.dataframe(df)