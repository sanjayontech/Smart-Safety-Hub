"""
Smart Safety Hub — Master Launcher
Run this file to start any module of the system.
"""

import subprocess
import sys
import os

BASE = os.path.dirname(os.path.abspath(__file__))
ROAD_SAFETY = os.path.join(BASE, "Road_Safety", "road safety")
ACCIDENT_PROJECT = os.path.join(BASE, "Accident_Project", "Accident_Project")
EMERGENCY_ALERT = os.path.join(BASE, "Emergency_Alert")
MAPS = os.path.join(BASE, "MAPS", "foresight-maps-main", "foresight-maps-main")
CRASH_DETECTION = os.path.join(BASE, "Crash_Detection")

MENU = """
╔══════════════════════════════════════════════╗
║         Smart Safety Hub  Launcher          ║
╠══════════════════════════════════════════════╣
║  Python Modules:                            ║
║                                             ║
║  1. Road Safety Dashboard  (Streamlit UI)   ║
║  2. Road Safety Detection  (OpenCV window)  ║
║  3. Lane Detection         (OpenCV window)  ║
║  4. Accident API Server    (Flask :5000)    ║
║  5. Emergency Alert System (Twilio)         ║
║  6. Webcam Crash Capture   (press C/Q)      ║
║  8. Crash Detection Demo   (IMU engine)     ║
║  9. Crash Detection Tests  (pytest)         ║
║                                             ║
║  Frontend:                                  ║
║  7. Predictive Map Dashboard (React)        ║
║                                             ║
║  0. Exit                                    ║
╚══════════════════════════════════════════════╝
"""


def run(cmd, cwd):
    try:
        subprocess.run(cmd, cwd=cwd)
    except KeyboardInterrupt:
        print("\nStopped.")
    except FileNotFoundError as e:
        print(f"\nError: {e}")
        print("Make sure all dependencies are installed:  pip install -r requirements.txt")


def check_env():
    env_file = os.path.join(EMERGENCY_ALERT, ".env")
    example = os.path.join(EMERGENCY_ALERT, ".env.example")
    if not os.path.exists(env_file):
        print(f"\nWARNING: {env_file} not found.")
        print(f"Copy {example} to {env_file} and fill in your Twilio credentials.\n")


def main():
    print(MENU)
    choice = input("Select module [0-9]: ").strip()

    if choice == "1":
        print("\nStarting Road Safety Dashboard (Streamlit)...")
        print("Open browser at http://localhost:8501\n")
        run(
            [sys.executable, "-m", "streamlit", "run",
             os.path.join(ROAD_SAFETY, "dashboard.py")],
            ROAD_SAFETY,
        )

    elif choice == "2":
        print("\nStarting Road Safety Detection (press ESC to quit)...\n")
        run([sys.executable, "main.py"], ROAD_SAFETY)

    elif choice == "3":
        print("\nStarting Lane Detection (press ESC to quit)...\n")
        run([sys.executable, "lane_detection.py"], ROAD_SAFETY)

    elif choice == "4":
        print("\nStarting Accident API Server...")
        print("API available at http://127.0.0.1:5000")
        print("  /status       — live detection state")
        print("  /accident-data — accident metadata + GPS")
        print("  /crash-image   — latest crash image")
        print("Press Ctrl+C to stop.\n")
        run([sys.executable, "server.py"], ACCIDENT_PROJECT)

    elif choice == "5":
        check_env()
        print("\nStarting Emergency Alert System...\n")
        run([sys.executable, "family_emergency_alert.py"], EMERGENCY_ALERT)

    elif choice == "6":
        print("\nStarting Webcam Crash Capture...")
        print("Press C to capture image, Q to quit.\n")
        run([sys.executable, "app.py"], ACCIDENT_PROJECT)

    elif choice == "7":
        print(f"""
Predictive Map Dashboard (React)
==================================
1. Open a new terminal window.

2. Navigate to the frontend directory:
   cd "{MAPS}"

3. Install dependencies (first time only):
   npm install

4. Start the dev server:
   npm run dev

5. Open your browser at:
   http://localhost:3000

The dashboard shows the predictive accident heatmap,
risk scores, hotspot table, and live alerts.
        """)

    elif choice == "8":
        print("\nStarting Crash Detection Engine demo (press Ctrl+C to stop)...\n")
        run([sys.executable, "demo.py"], CRASH_DETECTION)

    elif choice == "9":
        print("\nRunning Crash Detection test suite...\n")
        run([sys.executable, "-m", "pytest", "tests/test_detection.py", "-v"], CRASH_DETECTION)

    elif choice == "0":
        print("Goodbye!")
        sys.exit(0)

    else:
        print("Invalid choice. Please enter a number between 0 and 9.")


if __name__ == "__main__":
    main()
