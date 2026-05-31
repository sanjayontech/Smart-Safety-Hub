# Crash Detection Engine

Automatic accident-detection brain for Smart Safety Hub (project features 5 & 6:
IMU crash sensor + automatic accident detection).

It ingests a standardized sensor packet and returns a crash verdict with severity
and human-readable reasons, while suppressing false positives from speed breakers
and rough roads.

## Structure

```
Crash_Detection/
├── models/
│   └── sensor_data.py        # Standardized, validated SensorData schema
├── adapters/
│   ├── base_provider.py      # Abstract provider interface
│   ├── dummy_provider.py     # Synthetic packets for local testing
│   └── carla_provider.py     # Live CARLA IMU + collision sensor bridge
├── modules/crash_detection/
│   ├── detector.py           # Weighted sliding-window CrashDetector
│   └── thresholds.py         # Tunable score/threshold constants
├── tests/
│   └── test_detection.py     # 26 unit tests (pytest)
├── demo.py                   # Live demo using the dummy provider
└── README.md
```

## How it works

- **Rollover** → always `high` severity.
- **Impact force** and **acceleration** are each scored in 3 bands (warning/medium/high).
- Scores accumulate over a short sliding window (default 3 packets), sorted by
  timestamp so out-of-order CARLA delivery doesn't misalign signals.
- Acceleration spikes **without** a matching impact are treated as rough road /
  speed breaker — not a crash.

Result shape:

```python
{"accident_detected": bool, "severity": "low" | "medium" | "high", "reasons": list[str]}
```

## Run

```bash
# From inside Crash_Detection/
python demo.py                          # live demo
python -m pytest tests/test_detection.py -v   # run the 26 tests
```

Or use the project launcher: `python run.py` → option **8** (demo) or **9** (tests).

## Wiring to live CARLA

```python
from adapters.carla_provider import CarlaSensorProvider
from modules.crash_detection.detector import CrashDetector

provider = CarlaSensorProvider(vehicle)   # a CARLA vehicle actor
detector = CrashDetector()
result = detector.detect_accident(provider.stream_sensor_data())
if result["accident_detected"] and result["severity"] == "high":
    ...  # trigger Emergency_Alert
```
