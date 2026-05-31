"""Crash detection thresholds.

The detector uses three bands per signal (warning / medium / high) so it can
combine partial signals instead of relying on a single hard cutoff.  All
values are in SI units:

  acceleration  — m/s²  (gravity already subtracted by the CARLA provider)
  impact_force  — N·s   (magnitude of the CARLA collision normal impulse)

Adjust these values as you collect real crash data from CARLA runs.
"""

# ---- Acceleration thresholds (m/s²) ----------------------------------
# Gravity has been subtracted upstream, so 0 = stationary on flat ground.

ACCELERATION_WARNING_THRESHOLD: float = 8.0   # Hard braking / minor bump
ACCELERATION_MEDIUM_THRESHOLD: float  = 12.0  # Significant impact
ACCELERATION_HIGH_THRESHOLD: float    = 18.0  # Severe crash

# ---- Impact force thresholds (N·s) -----------------------------------

IMPACT_FORCE_WARNING_THRESHOLD: float = 15.0  # Low-speed contact
IMPACT_FORCE_MEDIUM_THRESHOLD: float  = 25.0  # Moderate collision
IMPACT_FORCE_HIGH_THRESHOLD: float    = 35.0  # High-energy collision

# ---- Rollover --------------------------------------------------------
# Roll angle (degrees) beyond which the vehicle is considered rolled over.
ROLLOVER_ANGLE_THRESHOLD: float = 45.0

# ---- Scoring ---------------------------------------------------------
# Total window score required to classify a crash at each severity level.
SCORE_HIGH_TOTAL: int   = 4   # OR any single packet score >= SCORE_HIGH_PACKET
SCORE_HIGH_PACKET: int  = 3
SCORE_MEDIUM_TOTAL: int = 2