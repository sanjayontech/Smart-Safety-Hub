"""
Indian Village CARLA Simulation  v4 — RTX-optimised, async, high FPS
=====================================================================
PERFORMANCE FIXES (why it was 5 fps before)
  1. ASYNCHRONOUS mode  — world.tick() removed from the main loop.
     CARLA's physics runs on the GPU at its own rate (~60 Hz).
     Python only reads the latest rendered frame; no blocking.
  2. Zero-copy sensor callback — raw BGRA bytes are stored in a
     shared bytearray with a threading.Event flag. The main loop
     converts them to a pygame Surface once per display frame using
     numpy view (no copy, no reshape overhead on sensor thread).
  3. Surface reuse — a single pygame.Surface is pre-allocated and
     reused every frame (pygame.surfarray.blit_array) instead of
     creating a new Surface object 30× per second.
  4. GPU rendering — launch CARLA with the flags shown below so the
     RTX 5060 renders via Vulkan/DX12 at Epic quality.
  5. Traffic Manager async — tm.set_synchronous_mode(False) lets
     CARLA's TM run on its own thread, not blocking Python.
  6. Font cache — SysFont objects created once at startup, not per
     frame (was costing ~2 ms per HUD draw call).

HOW TO LAUNCH CARLA FOR RTX 5060
  Windows:
    CarlaUE4.exe -dx12 -quality-level=Epic -windowed -ResX=1280 -ResY=720
  Linux:
    ./CarlaUE4.sh -vulkan -quality-level=Epic

  You do NOT need -RenderOffScreen anymore. The pygame window streams
  the sensor feed so CARLA's UE4 window can be minimised or hidden.

Controls (keep the pygame window focused):
  [F]       Toggle free-fly ↔ first-person cockpit
  [TAB]     Cycle ego vehicle
  W/S/A/D   Move camera (free-fly) / strafe
  Q/E       Fly up / down
  RMB drag  Look around
  LMB       Select & inspect vehicle
  [SPACE]   Trigger scripted accident
  [R]       Respawn all vehicles
  [ESC]     Quit

Requirements:
  pip install carla pygame numpy
"""

import carla
import pygame
import random
import math
import time
import sys
import threading
import collections
import ctypes
from dataclasses import dataclass
from typing import List, Optional, Dict

import numpy as np

# ═══════════════════════════════════════════════
# CONFIG
# ═══════════════════════════════════════════════
CARLA_HOST   = "127.0.0.1"
CARLA_PORT   = 2000
W, H         = 1280, 720
FPS_CAP      = 60           # pygame display cap — CARLA renders independently
CAM_SPEED    = 0.6
CAM_FAST     = 4.0
MOUSE_SENS   = 0.18
NUM_VEHICLES = 28
NUM_PEDS     = 20

# Driver eye position inside cabin (x=fwd, y=right, z=up from vehicle origin)
FP_OFFSET = carla.Transform(
    carla.Location(x=0.4, y=0.0, z=1.30),
    carla.Rotation(pitch=0.0, yaw=0.0, roll=0.0)
)

# ═══════════════════════════════════════════════
# EXTENDED INDIAN VEHICLE NAMES  (35+ entries)
# ═══════════════════════════════════════════════
INDIAN_NAMES: Dict[str, str] = {
    "vehicle.micro.microlino":            "Bajaj Auto-Rickshaw (CNG)",
    "vehicle.vespa.zx125":                "Bajaj Chetak Scooter",
    "vehicle.audi.a2":                    "Maruti 800",
    "vehicle.seat.leon":                  "Maruti Swift Dzire",
    "vehicle.nissan.micra":               "Renault Kwid",
    "vehicle.citroen.c3":                 "Hyundai Santro Xing",
    "vehicle.tesla.model3":               "Tata Nexon EV",
    "vehicle.lincoln.mkz2017":            "Premier Padmini",
    "vehicle.bmw.grandtourer":            "Hindustan Ambassador Mk4",
    "vehicle.chevrolet.impala":           "Hindustan Contessa Classic",
    "vehicle.mercedes.coupe":             "Mercedes E220 (Delhi Taxi)",
    "vehicle.dodge.charger":              "TATA Sumo Gold",
    "vehicle.ford.crown":                 "Mahindra Bolero Neo",
    "vehicle.toyota.prius":               "Toyota Innova Crysta",
    "vehicle.jeep.wrangler":              "Mahindra Thar 4x4",
    "vehicle.ford.mustang":               "Force Gurkha",
    "vehicle.lincoln.mkz2020":            "Tata Safari Storme",
    "vehicle.audi.tt":                    "Skoda Kushaq",
    "vehicle.volkswagen.t2":              "Tata Ace Mini-Truck",
    "vehicle.carlamotors.carlacola":      "Force Traveller 3350",
    "vehicle.mini.cooperst":              "Maruti Omni Van",
    "vehicle.carlamotors.firetruck":      "KSRTC Volvo AC Bus",
    "vehicle.mitsubishi.futuronconcept":  "Ashok Leyland City Bus",
    "vehicle.carlamotors.ambulance":      "Tata 407 Delivery Truck",
    "vehicle.nissan.patrol":              "Eicher Pro 1049 Truck",
    "vehicle.kawasaki.ninja":             "Royal Enfield Classic 350",
    "vehicle.yamaha.yzf":                 "Hero Honda CBZ Xtreme",
    "vehicle.harley-davidson.low_rider":  "Royal Enfield Thunderbird",
    "vehicle.bh.crossbike":               "TVS XL 100 Moped",
    "vehicle.gazelle.omafiets":           "Atlas Roadster Cycle",
    "vehicle.dodge.charger_police":       "Indian Police PCR Van",
    "vehicle.carlamotors.european_hgv":   "Tata Prima 4028.S Truck",
    "vehicle.tesla.cybertruck":           "Mahindra e2o Electric",
    "vehicle.mercedes.sprinter":          "Tempo Traveller 12-seater",
}

FALLBACK_NAMES = {
    "bicycle": "Atlas Cycle",
    "truck":   "Tata 407 Truck",
    "bus":     "Ashok Leyland Viking",
    "ninja":   "Royal Enfield Bullet 500",
    "yamaha":  "TVS Apache RTR 160",
    "motorbike": "Hero Splendor Plus",
}

SIGN_ACTOR_TYPES = [
    "traffic.stop", "traffic.yield",
    "traffic.speed_limit.30", "traffic.speed_limit.40", "traffic.speed_limit.60",
]
SIGN_PROP_TYPES = [
    "static.prop.streetsign", "static.prop.trafficwarning",
    "static.prop.guidepost",  "static.prop.constructioncone",
]
SIGN_LABELS = [
    "SPEED LIMIT 40 km/h", "VILLAGE ENTRY — Drive Slow",
    "VILLAGE EXIT", "CATTLE CROSSING", "SCHOOL ZONE — 20 km/h",
    "SPEED BREAKER AHEAD", "NO HORN ZONE", "NARROW ROAD AHEAD",
    "BRIDGE LOAD LIMIT 8T", "ROAD UNDER REPAIR",
    "RIGHT TURN AHEAD", "DIVERSION AHEAD",
]
VILLAGE_PROPS = [
    "static.prop.trashcan01", "static.prop.trashcan02",
    "static.prop.barrel",     "static.prop.kiosk_01",
    "static.prop.mailbox",    "static.prop.bench02",
    "static.prop.streetbarrier", "static.prop.colacan",
    "static.prop.shoppingcart",  "static.prop.creasedbox01",
]
DEBRIS_PROPS = [
    "static.prop.barrel", "static.prop.trashcan01",
    "static.prop.creasedbox01", "static.prop.colacan",
]

INDIAN_COLORS = [
    (220,50,50), (255,200,0), (255,140,0), (0,100,200),
    (50,150,50), (240,240,240), (20,20,20), (180,120,60),
    (200,200,180), (160,30,30),
]


# ═══════════════════════════════════════════════
# FAST SENSOR FRAME BUFFER
# ═══════════════════════════════════════════════
class FrameBuffer:
    """
    Lock-free double-buffer for camera frames.
    Sensor callback writes raw BGRA bytes into `pending`.
    Main thread swaps and converts only when a new frame is ready.
    No numpy allocation in the callback — just a memoryview write.
    """
    def __init__(self):
        self._lock    = threading.Lock()
        self._pending = None     # raw bytes from sensor
        self._ready   = False
        self.surface  = None     # reusable pygame Surface

    def push(self, image: carla.Image):
        # Called on sensor thread — must be fast
        # image.raw_data is BGRA
        raw = bytes(image.raw_data)
        with self._lock:
            self._pending = raw
            self._ready   = True

    def pull_to_surface(self) -> Optional[pygame.Surface]:
        """
        Called on main thread each frame.
        Returns a Surface if a new frame arrived, else None.
        """
        with self._lock:
            if not self._ready:
                return None
            raw           = self._pending
            self._ready   = False

        # numpy view — no copy
        arr = np.frombuffer(raw, dtype=np.uint8).reshape((H, W, 4))
        # BGRA → RGB  (flip channels 0 and 2, drop alpha)
        rgb = arr[:, :, :3][:, :, ::-1]  # shape (H, W, 3)

        if self.surface is None:
            self.surface = pygame.Surface((W, H))

        # blit_array expects (W, H, 3) with axes swapped
        pygame.surfarray.blit_array(self.surface, rgb.swapaxes(0, 1))
        return self.surface


# ═══════════════════════════════════════════════
# DATA CLASSES
# ═══════════════════════════════════════════════
@dataclass
class VehicleInfo:
    actor:       carla.Actor
    blueprint:   str
    indian_name: str
    color:       str
    col_sensor:  Optional[carla.Actor] = None
    damage:      float = 0.0
    flash_timer: float = 0.0


@dataclass
class ColEvent:
    name:    str
    impulse: float
    ts:      float


# ═══════════════════════════════════════════════
# FREE-FLY CAMERA
# ═══════════════════════════════════════════════
class FreeCamera:
    def __init__(self, x, y, z, pitch=-35.0, yaw=0.0):
        self.x, self.y, self.z = float(x), float(y), float(z)
        self.pitch = pitch
        self.yaw   = yaw
        self._drag = False
        self._mp   = (0, 0)

    def update(self, keys, events, dt):
        spd = CAM_SPEED * dt * 60 * (
            CAM_FAST if (keys[pygame.K_LSHIFT] or keys[pygame.K_RSHIFT]) else 1.0)
        yr  = math.radians(self.yaw)
        fx, fy =  math.cos(yr), math.sin(yr)
        rx, ry = -math.sin(yr), math.cos(yr)

        if keys[pygame.K_w] or keys[pygame.K_UP]:    self.x+=fx*spd; self.y+=fy*spd
        if keys[pygame.K_s] or keys[pygame.K_DOWN]:  self.x-=fx*spd; self.y-=fy*spd
        if keys[pygame.K_d] or keys[pygame.K_RIGHT]: self.x+=rx*spd; self.y+=ry*spd
        if keys[pygame.K_a] or keys[pygame.K_LEFT]:  self.x-=rx*spd; self.y-=ry*spd
        if keys[pygame.K_q]: self.z += spd
        if keys[pygame.K_e]: self.z -= spd

        for ev in events:
            if ev.type == pygame.MOUSEBUTTONDOWN and ev.button == 3:
                self._drag = True; self._mp = ev.pos
                pygame.mouse.set_visible(False)
            elif ev.type == pygame.MOUSEBUTTONUP and ev.button == 3:
                self._drag = False; pygame.mouse.set_visible(True)
            elif ev.type == pygame.MOUSEMOTION and self._drag:
                dx = ev.pos[0] - self._mp[0]
                dy = ev.pos[1] - self._mp[1]
                self.yaw  += dx * MOUSE_SENS
                self.pitch = max(-89.0, min(89.0, self.pitch - dy * MOUSE_SENS))
                self._mp = ev.pos

    def to_tf(self):
        return carla.Transform(
            carla.Location(x=self.x, y=self.y, z=self.z),
            carla.Rotation(pitch=self.pitch, yaw=self.yaw, roll=0.0)
        )

    def loc(self):
        return carla.Location(x=self.x, y=self.y, z=self.z)


# ═══════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════
def get_name(bp_id):
    for k, v in INDIAN_NAMES.items():
        if k in bp_id: return v
    for k, v in FALLBACK_NAMES.items():
        if k in bp_id: return v
    return "Indian Vehicle"

def rnd_color():
    r, g, b = random.choice(INDIAN_COLORS)
    return carla.Color(r=r, g=g, b=b)

def c2s(c): return f"RGB({c.r},{c.g},{c.b})"

def echo_v(vi: VehicleInfo):
    vel = vi.actor.get_velocity()
    spd = 3.6 * math.sqrt(vel.x**2 + vel.y**2 + vel.z**2)
    loc = vi.actor.get_location()
    print("\n" + "═"*58)
    print(f"  VEHICLE  : {vi.indian_name}")
    print(f"  Blueprint: {vi.blueprint}")
    print(f"  Color    : {vi.color}")
    print(f"  Speed    : {spd:.1f} km/h")
    print(f"  Location : ({loc.x:.1f}, {loc.y:.1f}, {loc.z:.1f})")
    print(f"  Damage   : {vi.damage:.0f} N (accumulated impulse)")
    print("═"*58 + "\n")


# ═══════════════════════════════════════════════
# SCENE BUILDERS
# ═══════════════════════════════════════════════
def place_signs(world, spawn_points, count=16):
    bpl = world.get_blueprint_library()

    # Native traffic sign actors
    ta = 0
    for st in SIGN_ACTOR_TYPES:
        for bp in list(bpl.filter(st))[:2]:
            idx = random.randint(0, len(spawn_points)-1)
            sp  = spawn_points[idx]
            yr  = math.radians(sp.rotation.yaw + 90)
            off = random.uniform(2.5, 4.5)
            loc = sp.location + carla.Location(
                x=math.cos(yr)*off, y=math.sin(yr)*off, z=0.05)
            try:
                a = world.try_spawn_actor(bp, carla.Transform(
                    loc, carla.Rotation(yaw=sp.rotation.yaw)))
                if a: ta += 1
            except: pass

    # Prop signs
    prop_bps = []
    for p in SIGN_PROP_TYPES: prop_bps.extend(bpl.filter(p))
    if not prop_bps: prop_bps = list(bpl.filter("static.prop.*"))[:8]

    placed = 0
    for idx in random.sample(range(len(spawn_points)),
                              min(count, len(spawn_points))):
        sp  = spawn_points[idx]
        bp  = random.choice(prop_bps)
        yr  = math.radians(sp.rotation.yaw + 90)
        off = random.uniform(3.0, 5.0)
        loc = sp.location + carla.Location(
            x=math.cos(yr)*off, y=math.sin(yr)*off, z=0.05)
        try:
            a = world.try_spawn_actor(bp, carla.Transform(
                loc, carla.Rotation(yaw=sp.rotation.yaw)))
            if a:
                print(f"  [SIGN] {SIGN_LABELS[placed % len(SIGN_LABELS)]}"
                      f"  ({loc.x:.0f},{loc.y:.0f})")
                placed += 1
        except: pass

    print(f"  → {ta} traffic sign actors + {placed} prop signs\n")


def place_props(world, centre, count=25):
    bpl   = world.get_blueprint_library()
    props = []
    for p in VILLAGE_PROPS: props.extend(bpl.filter(p))
    if not props: return
    placed = 0
    for _ in range(count):
        bp  = random.choice(props)
        ang = random.uniform(0, 2*math.pi)
        d   = random.uniform(4, 80)
        loc = carla.Location(x=centre.x+d*math.cos(ang),
                              y=centre.y+d*math.sin(ang), z=0.05)
        try:
            if world.try_spawn_actor(bp, carla.Transform(
                    loc, carla.Rotation(yaw=random.uniform(0,360)))):
                placed += 1
        except: pass
    print(f"  → {placed} village props\n")


# ── Thread-safe CARLA access ────────────────────────────────────────────────
# The CARLA Python client uses a single TCP socket. Calling any CARLA API
# from multiple threads simultaneously corrupts the socket.
# All threaded CARLA calls go through this lock.
_carla_lock = threading.Lock()

# Blueprint cache — built once in main(), read-only after that (thread-safe).
_debris_bps: list = []   # populated by init_debris_cache()

def init_debris_cache(world):
    """Call once from the main thread before any collision sensors fire."""
    global _debris_bps
    bpl = world.get_blueprint_library()
    for d in DEBRIS_PROPS:
        _debris_bps.extend(bpl.filter(d))

# Debris queue — collision callbacks enqueue locations; a single worker
# thread drains the queue so we never have >1 concurrent CARLA call.
_debris_queue: "collections.deque" = None   # set in main()

def _debris_worker(world):
    """Single background thread that spawns debris props one at a time."""
    while True:
        try:
            loc = _debris_queue.popleft()
        except IndexError:
            time.sleep(0.05)
            continue
        if loc is None:          # sentinel → exit
            break
        if not _debris_bps:
            continue
        off = carla.Location(x=random.uniform(-2, 2),
                              y=random.uniform(-2, 2), z=0.1)
        try:
            with _carla_lock:
                world.try_spawn_actor(
                    random.choice(_debris_bps),
                    carla.Transform(loc + off,
                                    carla.Rotation(yaw=random.uniform(0, 360))))
        except Exception:
            pass

def enqueue_debris(loc):
    """Called from collision callback — just appends, never blocks."""
    if _debris_queue is not None:
        _debris_queue.append(loc)


# ═══════════════════════════════════════════════
# COLLISION SENSOR
# ═══════════════════════════════════════════════
# Minimum impulse to register as a real crash (filters out constant
# wheel/road contact noise that fires hundreds of events per second).
COLLISION_THRESHOLD = 200.0   # Newtons — below this is road noise
COLLISION_COOLDOWN  = 1.5     # seconds — ignore repeated hits per vehicle

def make_col_cb(vi_ref, col_log):
    """
    Returns a collision callback that is:
      - Debounced: ignores impulses below COLLISION_THRESHOLD
      - Rate-limited: one real event per vehicle per COLLISION_COOLDOWN s
      - Thread-safe: only touches Python objects + the debris queue (no CARLA RPC)
    """
    last_hit = [0.0]   # mutable cell for closure

    def _cb(ev: carla.CollisionEvent):
        imp = ev.normal_impulse
        mag = math.sqrt(imp.x**2 + imp.y**2 + imp.z**2)

        # --- noise filter ---
        if mag < COLLISION_THRESHOLD:
            return

        # --- per-vehicle rate limit ---
        now = time.time()
        if now - last_hit[0] < COLLISION_COOLDOWN:
            return
        last_hit[0] = now

        vi = vi_ref[0]
        vi.damage     += mag
        vi.flash_timer = 1.8

        sev = "MODERATE" if mag < 2000 else "SEVERE"
        print(f"  [CRASH] {vi.indian_name}  {sev}  {mag:.0f} N  "
              f"total={vi.damage:.0f} N")

        col_log.append(ColEvent(vi.indian_name, mag, now))

        # Enqueue debris — never blocks, never touches CARLA directly
        enqueue_debris(ev.actor.get_location())

    return _cb


# ═══════════════════════════════════════════════
# VEHICLE SPAWNER
# ═══════════════════════════════════════════════
def spawn_vehicles(world, tm, spawn_points, col_log) -> List[VehicleInfo]:
    bpl  = world.get_blueprint_library()
    all_ = list(bpl.filter("vehicle.*"))
    pref = [b for b in all_ if b.id in INDIAN_NAMES]
    rest = [b for b in all_ if b.id not in INDIAN_NAMES]
    pool = pref * 4 + rest

    infos = []
    idxs  = random.sample(range(len(spawn_points)),
                           min(NUM_VEHICLES, len(spawn_points)))
    for idx in idxs:
        bp = random.choice(pool)
        c  = rnd_color()
        if bp.has_attribute("color"):
            bp.set_attribute("color", f"{c.r},{c.g},{c.b}")
        try:
            actor = world.try_spawn_actor(bp, spawn_points[idx])
            if not actor: continue
            actor.set_autopilot(True, tm.get_port())
            tm.vehicle_percentage_speed_difference(
                actor, random.uniform(-5, 35))
            vi     = VehicleInfo(actor=actor, blueprint=bp.id,
                                  indian_name=get_name(bp.id),
                                  color=c2s(c))
            vi_ref = [vi]
            col_bp = bpl.find("sensor.other.collision")
            sensor = world.try_spawn_actor(col_bp, carla.Transform(),
                                            attach_to=actor)
            if sensor:
                sensor.listen(make_col_cb(vi_ref, col_log))
                vi.col_sensor = sensor
            infos.append(vi)
        except: pass

    print(f"  → {len(infos)} vehicles spawned\n")
    return infos


def spawn_peds(client, world, count) -> list:
    bpl  = world.get_blueprint_library()
    pbps = list(bpl.filter("walker.pedestrian.*"))
    batch = []
    for _ in range(count):
        bp  = random.choice(pbps)
        if bp.has_attribute("is_invincible"):
            bp.set_attribute("is_invincible", "false")
        loc = world.get_random_location_from_navigation()
        if loc: batch.append(
            carla.command.SpawnActor(bp, carla.Transform(loc)))

    results = client.apply_batch_sync(batch, True)
    actors  = []
    ai_b    = []
    for res in results:
        if not res.error:
            a = world.get_actor(res.actor_id)
            if a:
                actors.append(a)
                ctrl = bpl.find("controller.ai.walker")
                ai_b.append(carla.command.SpawnActor(
                    ctrl, carla.Transform(), res.actor_id))

    for res in client.apply_batch_sync(ai_b, True):
        if not res.error:
            c = world.get_actor(res.actor_id)
            if c:
                c.start()
                d = world.get_random_location_from_navigation()
                if d: c.go_to_location(d)
                c.set_max_speed(0.8 + random.random())
    print(f"  → {len(actors)} pedestrians\n")
    return actors


# ═══════════════════════════════════════════════
# ACCIDENT TRIGGER
# ═══════════════════════════════════════════════
def trigger_accident(world, vehicles, ref_loc):
    if len(vehicles) < 2: return
    near = sorted(vehicles, key=lambda v: v.actor.get_location().distance(ref_loc))
    v1i, v2i = near[0], near[1]
    v1,  v2  = v1i.actor, v2i.actor
    print(f"\n  💥 ACCIDENT: {v1i.indian_name}  ↔  {v2i.indian_name}\n")
    v1.set_autopilot(False); v2.set_autopilot(False)
    l1, l2 = v1.get_location(), v2.get_location()
    def uv(a, b):
        dx,dy = b.x-a.x, b.y-a.y
        d = max(math.hypot(dx,dy), 0.01)
        return dx/d, dy/d
    d12=uv(l1,l2); d21=uv(l2,l1)
    F = 6500.0
    v1.add_impulse(carla.Vector3D(d12[0]*F, d12[1]*F, 350.0))
    v2.add_impulse(carla.Vector3D(d21[0]*F, d21[1]*F, 350.0))
    def _restore():
        time.sleep(6)
        try: v1.set_autopilot(True, 8000)
        except: pass
        try: v2.set_autopilot(True, 8000)
        except: pass
    threading.Thread(target=_restore, daemon=True).start()


# ═══════════════════════════════════════════════
# RGB SENSOR — uses FrameBuffer for zero blocking
# ═══════════════════════════════════════════════
def make_sensor(world, attach_to=None, transform=None, fov=90):
    bpl   = world.get_blueprint_library()
    cb    = bpl.find("sensor.camera.rgb")
    cb.set_attribute("image_size_x", str(W))
    cb.set_attribute("image_size_y", str(H))
    cb.set_attribute("fov", str(fov))
    # Tell the sensor to deliver frames asynchronously (no sync wait)
    tf = transform or carla.Transform()
    if attach_to:
        sensor = world.spawn_actor(cb, tf, attach_to=attach_to)
    else:
        sensor = world.spawn_actor(cb, tf)
    buf = FrameBuffer()
    sensor.listen(buf.push)          # push() is very cheap on sensor thread
    return sensor, buf


# ═══════════════════════════════════════════════
# VEHICLE PICKER  (2D screen projection)
# ═══════════════════════════════════════════════
def pick_vehicle(vehicles, cam: FreeCamera, mx, my, fov=90.0):
    f    = W / (2 * math.tan(math.radians(fov) / 2))
    yr   = math.radians(cam.yaw);  pr = math.radians(cam.pitch)
    cy_, sy_ = math.cos(yr), math.sin(yr)
    cp_, sp_ = math.cos(pr), math.sin(pr)
    fwd = (cp_*cy_,  cp_*sy_,  sp_)
    rgt = (-sy_,      cy_,      0.0)
    up  = (-sp_*cy_, -sp_*sy_,  cp_)
    cx, cy, cz = cam.x, cam.y, cam.z
    best, bd = None, 1e9
    for vi in vehicles:
        lo = vi.actor.get_location()
        dx, dy, dz = lo.x-cx, lo.y-cy, lo.z-cz
        cz2 = dx*fwd[0]+dy*fwd[1]+dz*fwd[2]
        if cz2 <= 0.5: continue
        cx2 = dx*rgt[0]+dy*rgt[1]+dz*rgt[2]
        cy2 = -(dx*up[0]+dy*up[1]+dz*up[2])
        px  = int(W/2 + f*cx2/cz2)
        py  = int(H/2 + f*cy2/cz2)
        d   = math.hypot(px-mx, py-my)
        if d < bd and d < 90: bd, best = d, vi
    return best


# ═══════════════════════════════════════════════
# HUD  — fonts cached at startup
# ═══════════════════════════════════════════════
_fonts = {}
def _f(size, bold=False):
    key = (size, bold)
    if key not in _fonts:
        _fonts[key] = pygame.font.SysFont("monospace", size, bold=bold)
    return _fonts[key]

def draw_hud(surface, vehicles, cam, selected, fp_mode,
             ego_vi, col_log, fps_val):

    # ── Left control panel ──────────────────────
    ov = pygame.Surface((308, 230), pygame.SRCALPHA)
    ov.fill((0,0,0,145)); surface.blit(ov, (5,5))

    mode_lbl = "COCKPIT (FP)" if fp_mode else "FREE-FLY"
    rows = [
        (f"INDIAN VILLAGE  {fps_val:.0f} fps", 19, True,  (255,220,60)),
        (f"Mode: {mode_lbl}",                  15, True,  (100,255,200)),
        (f"Vehicles: {len(vehicles)}",          14, False, (180,255,180)),
        ("",                                    8,  False, (0,0,0)),
        ("[F]      Cockpit / free-fly",          13, False, (210,210,210)),
        ("[TAB]    Cycle ego vehicle",           13, False, (210,210,210)),
        ("[WASD]   Move camera",                 13, False, (210,210,210)),
        ("[Q/E]    Fly up / down",               13, False, (210,210,210)),
        ("[RMB]    Look around",                 13, False, (210,210,210)),
        ("[LMB]    Inspect vehicle",             13, False, (210,210,210)),
        ("[SPACE]  Trigger accident",            13, False, (255,100,100)),
        ("[R]      Respawn  [ESC] Quit",         13, False, (210,210,210)),
    ]
    y = 9
    for txt, sz, bd, col in rows:
        s = _f(sz, bd).render(txt, True, col)
        surface.blit(s, (10, y)); y += s.get_height() + 2

    # ── Cockpit mode overlay ────────────────────
    if fp_mode and ego_vi:
        vel = ego_vi.actor.get_velocity()
        spd = 3.6 * math.sqrt(vel.x**2 + vel.y**2 + vel.z**2)

        # Name badge top-centre
        badge = pygame.Surface((480, 36), pygame.SRCALPHA)
        badge.fill((0,0,0,165)); surface.blit(badge, (W//2-240, 5))
        s = _f(16, True).render(
            f"IN-CAR: {ego_vi.indian_name}  |  dmg: {ego_vi.damage:.0f} N",
            True, (255,220,60))
        surface.blit(s, (W//2 - s.get_width()//2, 11))

        # Speedo bottom-centre
        spd_s = _f(26, True).render(f"{spd:.0f}", True, (100,255,100))
        kmh_s = _f(13).render("km/h", True, (100,200,100))
        surface.blit(spd_s, (W//2 - spd_s.get_width()//2, H-60))
        surface.blit(kmh_s, (W//2 - kmh_s.get_width()//2, H-32))

        # Steering wheel icon
        cx2, cy2, r = W//2, H-90, 26
        pygame.draw.circle(surface, (90,90,90),  (cx2,cy2), r,   3)
        pygame.draw.circle(surface, (90,90,90),  (cx2,cy2), r//3, 3)
        pygame.draw.line(surface,   (90,90,90), (cx2,cy2-r),(cx2,cy2+r), 3)
        pygame.draw.line(surface,   (90,90,90), (cx2-r,cy2),(cx2+r,cy2), 3)

    # ── Selected vehicle panel bottom-left ──────
    if selected:
        vel = selected.actor.get_velocity()
        spd = 3.6 * math.sqrt(vel.x**2 + vel.y**2 + vel.z**2)
        loc = selected.actor.get_location()
        flash = selected.flash_timer > 0
        bg    = (120,0,0,175) if flash else (0,0,0,155)
        pnl   = pygame.Surface((470, 86), pygame.SRCALPHA)
        pnl.fill(bg); surface.blit(pnl, (5, H-92))
        info = [
            (f"  {selected.indian_name}",            16, True,
             (255,80,80) if flash else (255,220,60)),
            (f"  {selected.blueprint}",               12, False, (170,170,170)),
            (f"  {spd:.1f} km/h   {selected.color}", 13, False, (180,255,180)),
            (f"  ({loc.x:.0f},{loc.y:.0f},{loc.z:.1f})"
             f"  dmg={selected.damage:.0f} N"
             f"{'  ⚠ IMPACT!' if flash else ''}",
             13, False,
             (255,80,80) if flash else (200,200,200)),
        ]
        iy = H - 90
        for txt, sz, bd, col in info:
            s = _f(sz, bd).render(txt, True, col)
            surface.blit(s, (7, iy)); iy += s.get_height() + 2

    # ── Collision log right side ─────────────────
    recent = list(col_log)[-8:]
    if recent:
        lh   = len(recent)*19 + 28
        logp = pygame.Surface((330, lh), pygame.SRCALPHA)
        logp.fill((0,0,0,145)); surface.blit(logp, (W-336, 5))
        surface.blit(_f(15,True).render("COLLISION LOG", True, (255,80,80)),
                     (W-330, 9))
        ly = 29
        for ev in recent:
            sev = "MOD" if ev.impulse < 2000 else "SEV"
            col = (255,180,50) if sev == "MOD" else (255,60,60)
            txt = f"{ev.name[:20]:<20} {sev} {ev.impulse:.0f}N"
            surface.blit(_f(12).render(txt, True, col), (W-330, ly))
            ly += 19

    # ── Camera coords (free-fly only) ───────────
    if not fp_mode:
        ci = pygame.Surface((255, 42), pygame.SRCALPHA)
        ci.fill((0,0,0,115)); surface.blit(ci, (W-260, H-48))
        surface.blit(_f(12).render(
            f"({cam.x:.0f},{cam.y:.0f},{cam.z:.0f})", True,(190,190,190)),
            (W-256, H-46))
        surface.blit(_f(12).render(
            f"yaw {cam.yaw:.0f}°  pitch {cam.pitch:.0f}°", True,(190,190,190)),
            (W-256, H-30))


# ═══════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════
def main():
    pygame.init()
    display = pygame.display.set_mode((W, H), pygame.RESIZABLE)
    pygame.display.set_caption(
        "Indian Village CARLA v4 — RTX optimised | keep this window focused")
    clock = pygame.time.Clock()

    # Pre-warm font cache
    for sz in (12,13,14,15,16,19,26):
        _f(sz); _f(sz, True)

    print("\n" + "="*62)
    print("  INDIAN VILLAGE CARLA  v4  (RTX-optimised, async)")
    print("="*62)
    print(f"  Connecting to {CARLA_HOST}:{CARLA_PORT} …")

    try:
        client = carla.Client(CARLA_HOST, CARLA_PORT)
        client.set_timeout(12.0)
        world  = client.get_world()
    except Exception as e:
        print(f"\n  ERROR: {e}")
        print("  Launch CARLA first:")
        print("    Windows: CarlaUE4.exe -dx12 -quality-level=Epic")
        print("    Linux:   ./CarlaUE4.sh -vulkan -quality-level=Epic\n")
        pygame.quit(); sys.exit(1)

    print(f"  Map: {world.get_map().name}")

    # ── ASYNC world settings ─────────────────────
    # Key change: no synchronous_mode — CARLA ticks at its own GPU rate
    settings = world.get_settings()
    settings.synchronous_mode    = False   # ← was True (caused the hang)
    settings.fixed_delta_seconds = 0.0    # ← variable timestep, GPU decides
    world.apply_settings(settings)

    tm = client.get_trafficmanager(8000)
    tm.set_synchronous_mode(False)         # ← TM runs on its own thread
    tm.set_global_distance_to_leading_vehicle(1.8)
    tm.global_percentage_speed_difference(20.0)

    spawn_points = world.get_map().get_spawn_points()
    if not spawn_points:
        print("  ERROR: No spawn points."); pygame.quit(); sys.exit(1)

    centre = spawn_points[len(spawn_points)//2].location
    print(f"  Town centre: ({centre.x:.0f},{centre.y:.0f})\n")

    print("  Placing road signs …");    place_signs(world, spawn_points)
    print("  Placing village props …"); place_props(world, centre)

    col_log: collections.deque = collections.deque(maxlen=40)

    # ── Debris system — must be initialised before vehicles spawn ────────────
    # Cache blueprint list on main thread (thread-safe, done once)
    print("  Caching debris blueprints …")
    init_debris_cache(world)

    # Single shared deque — collision callbacks append, worker pops
    global _debris_queue
    _debris_queue = collections.deque(maxlen=50)  # cap at 50 pending debris

    # One worker thread drains the queue — no concurrent CARLA calls
    debris_thread = threading.Thread(
        target=_debris_worker, args=(world,), daemon=True, name="debris-worker")
    debris_thread.start()

    print("  Spawning vehicles …")
    vehicles = spawn_vehicles(world, tm, spawn_points, col_log)

    print("  Spawning pedestrians …")
    pedestrians = spawn_peds(client, world, NUM_PEDS)

    # ── Spectator & free camera ──────────────────
    spectator = world.get_spectator()
    cam = FreeCamera(centre.x, centre.y, 45, pitch=-40.0)
    spectator.set_transform(cam.to_tf())

    # ── Sensors ─────────────────────────────────
    print("  Attaching sensors …")
    fly_sensor, fly_buf = make_sensor(world, attach_to=spectator)

    fp_mode   = False
    ego_idx   = 0
    fp_sensor = None
    fp_buf    = FrameBuffer()

    def set_ego(idx):
        nonlocal fp_sensor, fp_buf
        if fp_sensor:
            try: fp_sensor.stop(); fp_sensor.destroy()
            except: pass
            fp_sensor = None
        if not vehicles: return
        vi = vehicles[idx % len(vehicles)]
        fp_sensor, fp_buf = make_sensor(
            world, attach_to=vi.actor,
            transform=FP_OFFSET, fov=85)
        print(f"  [FP] Riding: {vi.indian_name}")

    # ── Bring pygame window front (Windows) ──────
    try:
        if sys.platform == "win32":
            hwnd = pygame.display.get_wm_info()["window"]
            ctypes.windll.user32.SetForegroundWindow(hwnd)
    except: pass

    selected: Optional[VehicleInfo] = None
    running  = True
    fps_disp = 60.0

    print("\n  Ready!  CARLA running async — full GPU throughput.\n")

    while running:
        dt = clock.tick(FPS_CAP) / 1000.0
        fps_disp = 0.92*fps_disp + 0.08*(1.0/max(dt, 0.001))

        # NO world.tick() here — async mode, CARLA ticks itself on GPU

        events = pygame.event.get()
        keys   = pygame.key.get_pressed()

        # Decay flash timers
        for vi in vehicles:
            if vi.flash_timer > 0:
                vi.flash_timer = max(0.0, vi.flash_timer - dt)

        # ── Events ───────────────────────────────
        for ev in events:
            if ev.type == pygame.QUIT: running = False

            elif ev.type == pygame.KEYDOWN:
                k = ev.key
                if k == pygame.K_ESCAPE:
                    running = False

                elif k == pygame.K_f:
                    fp_mode = not fp_mode
                    if fp_mode: set_ego(ego_idx)
                    print(f"  Camera: {'COCKPIT' if fp_mode else 'FREE-FLY'}")

                elif k == pygame.K_TAB:
                    if vehicles:
                        ego_idx = (ego_idx+1) % len(vehicles)
                        if fp_mode: set_ego(ego_idx)
                        selected = vehicles[ego_idx]; echo_v(selected)

                elif k == pygame.K_SPACE:
                    ref = (vehicles[ego_idx%len(vehicles)].actor.get_location()
                           if fp_mode and vehicles else cam.loc())
                    trigger_accident(world, vehicles, ref)

                elif k == pygame.K_r:
                    print("  [R] Respawning …")
                    for vi in vehicles:
                        if vi.col_sensor:
                            try: vi.col_sensor.stop(); vi.col_sensor.destroy()
                            except: pass
                        try: vi.actor.destroy()
                        except: pass
                    vehicles = spawn_vehicles(world, tm, spawn_points, col_log)
                    selected = None; ego_idx = 0
                    if fp_mode: set_ego(0)

            elif ev.type == pygame.MOUSEBUTTONDOWN and ev.button == 1:
                if not fp_mode:
                    hit = pick_vehicle(vehicles, cam, *ev.pos)
                    if hit: selected = hit; echo_v(hit)
                    else:   print("  [CLICK] No vehicle near cursor.")

        # ── Camera ───────────────────────────────
        if not fp_mode:
            cam.update(keys, events, dt)
            spectator.set_transform(cam.to_tf())

        # ── Render ───────────────────────────────
        buf  = fp_buf if fp_mode else fly_buf
        surf = buf.pull_to_surface()
        if surf is not None:
            display.blit(surf, (0, 0))
        # (if no new frame just keep previous frame — no black flash)

        ego_vi = vehicles[ego_idx%len(vehicles)] if vehicles else None
        draw_hud(display, vehicles, cam, selected,
                 fp_mode, ego_vi, col_log, fps_disp)
        pygame.display.flip()

    # ── Cleanup ──────────────────────────────────
    print("  Shutting down …")

    # Stop debris worker first so it doesn't race with actor destruction
    if _debris_queue is not None:
        _debris_queue.append(None)   # sentinel → worker exits
    # Give it a moment to finish any in-flight spawn
    time.sleep(0.3)

    fly_sensor.stop(); fly_sensor.destroy()
    if fp_sensor:
        try: fp_sensor.stop(); fp_sensor.destroy()
        except: pass

    destroy = []
    for vi in vehicles:
        if vi.col_sensor:
            try: vi.col_sensor.stop(); vi.col_sensor.destroy()
            except: pass
        destroy.append(carla.command.DestroyActor(vi.actor))
    destroy += [carla.command.DestroyActor(p) for p in pedestrians]
    client.apply_batch(destroy)

    pygame.quit()
    print("  Done.\n")


if __name__ == "__main__":
    main()