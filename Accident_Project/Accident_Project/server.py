from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

HERE = os.path.dirname(os.path.abspath(__file__))

# In-memory detection state (updated by local YOLO detector via POST)
_state: dict = {
    "speed": 0,
    "speed_limit": 50,
    "alerts": [],
    "detected_objects": [],
    "timestamp": None,
    "message": "Detection not running. Start Road Safety Detector locally.",
}


@app.route("/")
def home():
    return "Smart Safety Hub API — Running", 200


@app.route("/status")
def status():
    """Returns the latest detection state pushed by the local YOLO detector."""
    return jsonify(_state)


@app.route("/update-state", methods=["POST"])
def update_state():
    """Called by the local YOLO detector every frame to push live data."""
    global _state
    data = request.get_json(silent=True)
    if data:
        _state = data
        _state.pop("message", None)
        return jsonify({"ok": True})
    return jsonify({"ok": False, "error": "No JSON body"}), 400


@app.route("/accident-data")
def accident_data():
    crash_image = os.path.join(HERE, "crash_image.jpg")
    return jsonify({
        "image_name": "crash_image.jpg",
        "image_exists": os.path.exists(crash_image),
        "latitude": 13.0827,
        "longitude": 80.2707,
    })


@app.route("/crash-image")
def crash_image():
    return send_from_directory(HERE, "crash_image.jpg")


@app.route("/health")
def health():
    return jsonify({"status": "ok"}), 200


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    host = "0.0.0.0" if os.getenv("RENDER") else "127.0.0.1"
    print(f"Smart Safety Hub API → http://{host}:{port}")
    print("  GET  /status        — live detection state")
    print("  POST /update-state  — push detection data (from local detector)")
    print("  GET  /accident-data — accident metadata")
    app.run(host=host, port=port, debug=not os.getenv("RENDER"))
