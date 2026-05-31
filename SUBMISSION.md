# Smart Safety Hub — Hackathon Submission Document

**An AI-powered, real-time road-safety platform: detect hazards, predict crash severity, and alert emergency contacts — end to end.**

---

## 1. Project Snapshot

| | |
|---|---|
| **Project name** | Smart Safety Hub |
| **Category** | Road Safety / Computer Vision / IoT / Full-Stack |
| **Live dashboard** | https://smart-safety-hub.pages.dev |
| **Live API** | https://smart-safety-api.sanjayontech.workers.dev/status |
| **Source code** | https://github.com/sanjayontech/Smart-Safety-Hub |
| **Status** | Deployed and running on Cloudflare (frontend + API) |
| **Date** | May 2026 |

---

## 2. The Problem

Road traffic injuries kill ~1.35 million people a year (WHO), and the majority of crashes involve human error or delayed response. Existing safety systems are largely **reactive** — they record what happened *after* a collision. There are three concrete gaps:

1. **Detection is fragmented** — lane departure, speed, and object detection live in separate, siloed tools.
2. **Crash recognition is naive** — simple threshold alarms fire on speed breakers and rough roads (false positives), or miss real impacts.
3. **Response is slow** — by the time a human notices and calls for help, critical minutes are lost.

**Our thesis:** detection, crash classification, and emergency response should run as one continuous pipeline, with a single live operations dashboard on top.

---

## 3. Our Solution

Smart Safety Hub unifies six modules into one pipeline:

```
 Camera / CARLA  ─▶  YOLOv8 Detection  ─▶  Crash Detection Engine  ─▶  Emergency Alert
 (video feed)        (objects, speed,        (IMU + collision           (Twilio SMS/call)
                      stop signs)             severity scoring)
                          │                        │
                          └──────────┬─────────────┘
                                     ▼
                          Cloud API (Cloudflare Worker + KV)
                                     ▼
                          Live React Dashboard (7 pages)
```

The detector on a local machine pushes results to a serverless cloud API; the public dashboard polls that API every second and visualises the live state.

---

## 4. System Architecture

```
┌──────────────────────── CLOUDFLARE (public, always-on) ────────────────────────┐
│                                                                                  │
│   Workers API (api/worker.js)                Pages (React SPA, MAPS/)            │
│   ├─ GET  /status            ◀───── polls ── 7-page dashboard, 1s refresh        │
│   ├─ POST /update-state      ◀───── pushes ─ live detection results              │
│   ├─ GET  /accident-data                     Tailwind + Motion + Recharts        │
│   └─ KV namespace (state store, 5-min TTL)                                        │
└──────────────────────────────────────────────────────────────────────────────┘
                ▲                                          ▲
   POST results │                                          │ GET live metrics
                │                                          │
┌───────────────┴───────────────── LOCAL MACHINE ─────────┴───────────────────────┐
│                                                                                  │
│  Road Safety (YOLOv8)      Crash Detection Engine        CARLA Simulator         │
│  Road_Safety/main.py       Crash_Detection/              accident.py             │
│  • object detection        • IMU + collision fusion      • 28 vehicles +         │
│  • stop-sign / speed        • weighted sliding window       20 pedestrians       │
│  • writes shared_state      • severity: low/med/high      • collision sensors    │
│                            • false-positive suppression  • debris on impact      │
│                                                                                  │
│  Emergency Alert (Emergency_Alert/) — Twilio SMS + voice call to family contacts │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Design choice:** the cloud layer is stateless + KV, so the public site is always reachable and costs nothing at rest. Heavy compute (YOLO, CARLA) stays local where the GPU and camera are.

---

## 5. Modules in Detail

### 5.1 Road Safety Detection — `Road_Safety/road safety/`
- **YOLOv8** object detection on a video/camera feed (cars, trucks, motorcycles, people, stop signs).
- Lane detection via OpenCV Canny + Hough transform (`lane_detection.py`).
- Overspeed and stop-sign alerting; a Streamlit dashboard variant (`dashboard.py`).
- **Cross-platform audio alerts** (Windows `winsound` / macOS `afplay`) — fixed from the original macOS-only code.
- Pushes every frame's result to the cloud API (or a local `shared_state.json` fallback).

### 5.2 Crash Detection Engine — `Crash_Detection/`  *(headline module)*
A clean, testable accident-detection brain (~658 lines + 26 tests):
- **Provider abstraction** (`BaseSensorProvider`) with two implementations:
  - `DummySensorProvider` — synthetic packets for local testing.
  - `CarlaSensorProvider` — bridges live CARLA IMU + collision sensors (gravity-corrected, thread-safe).
- **Standardized `SensorData` schema** with validation, so the detector is provider-agnostic.
- **Weighted sliding-window detector** (`detector.py`): scores impact force + acceleration in three bands, accumulates over the last N packets, and returns `{accident_detected, severity, reasons}`.
- **False-positive suppression:** acceleration spikes without a matching impact are classified as *rough road* / *speed breaker*, not a crash.
- **Rollover** is always treated as high severity.
- **26 unit tests, all passing** (`pytest`), covering no-crash, suppression, rollover, severity tiers, sliding-window behaviour, and input handling.

### 5.3 CARLA Simulator — `accident.py`
- 958-line simulation spawning **28 vehicles + 20 pedestrians** with AI navigation.
- Collision sensors, debris spawning on impact, free-fly + cockpit cameras, real-time HUD.
- Lets us generate crash scenarios to feed the detection engine without real-world risk.

### 5.4 Accident API — `Accident_Project/` + `api/`
- Local Flask server (`server.py`) for development.
- Production: a **Cloudflare Worker** (`api/worker.js`) with the same endpoints, backed by a KV namespace. CORS-enabled.

### 5.5 Emergency Alert — `Emergency_Alert/`
- **Twilio** SMS + automated voice call to a configurable list of family contacts.
- Credentials read from a `.env` file (template provided) — no hardcoded secrets.

### 5.6 Frontend — `MAPS/` (React 19 + Vite + TanStack Router)
A 7-page operations console with a shared global navigation bar:
1. **Landing** — animated hero + risk heatmap preview.
2. **Live Dashboard** — KPIs, 24-h risk forecast, hotspots table, and a **Live Detection panel that shows real YOLO data** when the detector is running.
3. **Command Center** — incident feed and active-vehicle tracker.
4. **Detection Engine** — camera view with bounding boxes + AI-confidence gauge.
5. **Smart Map** — vehicle/ambulance/hospital markers and emergency routing.
6. **Risk Engine** — animated safety-index gauge + risk-vector breakdown.
7. **AURA AI Copilot** — conversational safety-analysis interface.

---

## 6. What Is Real vs. Demonstration Data

In the interest of honesty (and because judges may inspect the code), here is a clear breakdown:

| Capability | Status |
|---|---|
| YOLOv8 object detection on video | **Real** — runs locally, genuine inference |
| Lane detection (OpenCV) | **Real** |
| Crash Detection Engine + 26 tests | **Real** — fully implemented and tested |
| CARLA simulation | **Real** — requires a running CARLA server |
| Twilio emergency alerts | **Real** — requires Twilio credentials |
| Cloud API + KV state store | **Real** — deployed and live |
| Live dashboard polling the API | **Real** — updates from genuine detector output |
| Heatmap hotspots, "92.4% confidence", 24-h forecast | **Demonstration data** — illustrative UI, not a trained geospatial model yet |
| Command Center / Map / Risk vehicle records | **Demonstration data** — representative sample records |

`demo_mode.py` streams realistic synthetic detection data to the cloud so the public dashboard looks live during judging even without a local GPU.

---

## 7. Technology Stack

| Layer | Technology |
|---|---|
| Computer vision | YOLOv8 (Ultralytics), OpenCV |
| Crash detection | Python, dataclasses, pytest |
| Simulation | CARLA, Pygame, NumPy |
| Backend (dev) | Flask, Flask-CORS |
| Backend (prod) | Cloudflare Workers + KV (serverless) |
| Frontend | React 19, TypeScript, Vite, TanStack Router |
| UI / charts | Tailwind CSS, Motion, Recharts, Radix UI |
| Emergency comms | Twilio (SMS + voice) |
| Hosting | Cloudflare Pages + Workers (free tier) |

---

## 8. How to Run

**Prerequisites:** Python 3.10+, Node 18+ (for the frontend), optional CARLA + Twilio.

```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Launch any module from the menu
python run.py
#   1 Road Safety Dashboard (Streamlit)
#   2 Road Safety Detection (YOLO window)
#   3 Lane Detection
#   4 Accident API Server (Flask :5000)
#   5 Emergency Alert (Twilio)
#   6 Webcam Crash Capture
#   8 Crash Detection Demo (IMU engine)
#   9 Crash Detection Tests (pytest — 26 tests)

# 3. Run the test suite directly
cd Crash_Detection && python -m pytest tests/ -v

# 4. Frontend (local dev)
cd MAPS/foresight-maps-main/foresight-maps-main
npm install && npm run dev
```

**Live demo for judges (no GPU needed):**
```bash
python demo_mode.py        # streams synthetic data to the cloud API
# then open https://smart-safety-hub.pages.dev/dashboard
```

---

## 9. Engineering Highlights

- **Real, passing test suite** — 26 unit tests for the crash-detection logic (run them yourself: `pytest` in `Crash_Detection/`).
- **Clean abstractions** — the detector depends only on a `SensorData` schema, so dummy and CARLA providers are interchangeable.
- **Honest false-positive handling** — speed breakers and rough roads are explicitly suppressed, a common failure mode of naive threshold alarms.
- **Cloud-native, zero-cost-at-rest** — serverless Worker + KV; the public site needs no server babysitting.
- **Cross-platform** — Windows/macOS/Linux; the original macOS-only audio bug was fixed.
- **One-command launcher** — `run.py` runs any module without memorising paths.

---

## 10. Limitations & Honest Next Steps

We deliberately separate what is built from what is aspirational:

**Built:** detection, crash classification (tested), simulation, alerting, cloud API, live dashboard.

**Not yet built (roadmap):**
1. **Trained geospatial risk model** — the heatmap/forecast currently uses demonstration data; the next step is training on historical accident datasets.
2. **Auto-trigger** — wire a `high`-severity crash result directly into the Twilio alert (today the alert is run manually).
3. **Real camera/dashcam ingestion** — currently a sample video; switching to a live RTSP/USB feed is a one-line change.
4. **AURA Copilot** — connect the chat UI to a real LLM backend.
5. **Persistent incident database** — replace KV with a durable store for historical analytics.

---

## 11. Impact

If matured and deployed, the pipeline targets the two biggest levers in road-injury outcomes: **earlier hazard awareness** (predictive detection) and **faster response** (automated alerting). Even modest reductions in emergency-response time meaningfully reduce injury severity. The platform is designed for fleet operators, city traffic authorities, insurers, and emergency services.

---

## 12. Repository Map

```
Smart-Safety-Hub/
├── accident.py              # CARLA simulator (28 vehicles + 20 pedestrians)
├── run.py                   # one-command module launcher
├── demo_mode.py             # streams synthetic data to the cloud (judging)
├── requirements.txt
├── Crash_Detection/         # ★ crash-detection engine + 26 tests
│   ├── adapters/            #   dummy + CARLA sensor providers
│   ├── models/              #   SensorData schema
│   ├── modules/crash_detection/  # detector + thresholds
│   └── tests/               #   26 passing pytest tests
├── Road_Safety/             # YOLOv8 detection, lane detection, Streamlit
├── Accident_Project/        # Flask API + webcam capture
├── api/                     # Cloudflare Worker API (production)
├── Emergency_Alert/         # Twilio SMS + voice alerts
└── MAPS/                    # React 7-page dashboard (deployed)
```

---

*Smart Safety Hub — detect, predict, respond. Built end-to-end and deployed live.*
