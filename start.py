"""
Smart Safety Hub — One-Command Launcher
Starts all services and opens the dashboard in your browser.

Usage:
    python start.py

Services started:
  - Flask API          http://127.0.0.1:5000
  - Road Safety Detector (headless YOLO, feeds the API)
  - React Dashboard    http://localhost:8080

Press Ctrl+C to stop everything.
"""

import subprocess
import sys
import os
import time
import signal
import webbrowser
import threading

BASE = os.path.dirname(os.path.abspath(__file__))
ROAD_SAFETY = os.path.join(BASE, "Road_Safety", "road safety")
ACCIDENT_PROJECT = os.path.join(BASE, "Accident_Project", "Accident_Project")
MAPS = os.path.join(BASE, "MAPS", "foresight-maps-main", "foresight-maps-main")

processes: list[subprocess.Popen] = []


def start(name: str, cmd: list[str], cwd: str) -> subprocess.Popen:
    p = subprocess.Popen(
        cmd, cwd=cwd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    processes.append(p)

    def tail():
        assert p.stdout
        for line in p.stdout:
            print(f"  [{name}] {line}", end="")

    threading.Thread(target=tail, daemon=True).start()
    return p


def shutdown(sig=None, frame=None):
    print("\n\nShutting down all services...")
    for p in processes:
        p.terminate()
    print("Done. Goodbye!")
    sys.exit(0)


signal.signal(signal.SIGINT, shutdown)
signal.signal(signal.SIGTERM, shutdown)

print("""
╔══════════════════════════════════════════════════╗
║         Smart Safety Hub — Full Launch          ║
╚══════════════════════════════════════════════════╝
""")

npm = "npm.cmd" if sys.platform == "win32" else "npm"

# 1. Flask API
print("[1/3] Starting Flask API (port 5000)...")
start("API", [sys.executable, "server.py"], ACCIDENT_PROJECT)
time.sleep(2)

# 2. Headless YOLO detector (writes live data to shared_state.json)
print("[2/3] Starting Road Safety Detector (headless)...")
start("Detector", [sys.executable, "main.py", "--headless"], ROAD_SAFETY)
time.sleep(1)

# 3. React frontend
print("[3/3] Starting React Dashboard (port 8080)...")
start("React", [npm, "run", "dev"], MAPS)
time.sleep(4)

print(f"""
╔══════════════════════════════════════════════════╗
║  All services running!                          ║
║                                                  ║
║  Flask API      →  http://127.0.0.1:5000        ║
║  Detection Feed →  http://127.0.0.1:5000/status ║
║  Dashboard      →  http://localhost:8080         ║
║                                                  ║
║  Opening browser...  Press Ctrl+C to stop.      ║
╚══════════════════════════════════════════════════╝
""")

webbrowser.open("http://localhost:8080/dashboard")

# Keep alive — print status every 30 seconds
try:
    while True:
        time.sleep(30)
        alive = [p for p in processes if p.poll() is None]
        print(f"  [status] {len(alive)}/{len(processes)} services running.")
except KeyboardInterrupt:
    shutdown()
