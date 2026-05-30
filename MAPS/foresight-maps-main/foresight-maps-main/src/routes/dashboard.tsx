import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Activity, AlertTriangle, CloudRain, Car, MapPin, TrendingUp, Bell,
  Layers, Filter, ArrowLeft, Radio, Brain, Gauge, Wifi, WifiOff,
} from "lucide-react";
import { Heatmap } from "@/components/Heatmap";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip,
} from "recharts";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Live Console — Smart Safety Hub" },
      { name: "description", content: "Real-time road safety AI console — live detections, risk scores, alerts." },
    ],
  }),
  component: Dashboard,
});

type LiveData = {
  speed: number;
  speed_limit: number;
  alerts: string[];
  detected_objects: string[];
  timestamp: string | null;
  message?: string;
};

type Alert = {
  id: number;
  level: "critical" | "high" | "moderate";
  title: string;
  time: string;
  desc: string;
};

const trend = Array.from({ length: 24 }, (_, i) => ({
  h: `${i}:00`,
  risk: Math.round(35 + Math.sin(i / 3) * 18 + (i > 16 && i < 20 ? 22 : 0) + Math.random() * 6),
  incidents: Math.max(0, Math.round(2 + Math.sin(i / 2) * 2 + (i > 16 && i < 20 ? 4 : 0) + Math.random() * 1.5)),
}));

const hotspots = [
  { name: "Junction A2 · Marina Blvd", score: 91, type: "Critical", cause: "Rain + rush hour" },
  { name: "Ring Rd · Exit 14", score: 84, type: "High", cause: "Low visibility" },
  { name: "5th Ave & W 42nd", score: 78, type: "High", cause: "Congestion spike" },
  { name: "Highway 7 · KM 23", score: 71, type: "High", cause: "Wet surface" },
  { name: "Old Town Sq.", score: 64, type: "Moderate", cause: "Pedestrian density" },
  { name: "Industrial Park N", score: 52, type: "Moderate", cause: "Heavy vehicles" },
];

const seedAlerts: Alert[] = [
  { id: 1, level: "critical", title: "Spike: Junction A2", time: "just now", desc: "Risk score jumped 23 pts in 5 min." },
  { id: 2, level: "high", title: "Weather hazard", time: "2m", desc: "Rainfall + low visibility on Ring Rd." },
  { id: 3, level: "moderate", title: "Congestion warning", time: "6m", desc: "5th Ave traffic density 87%." },
];

function riskColor(type: string) {
  return type === "Critical"
    ? "text-destructive bg-destructive/10 border-destructive/30"
    : type === "High"
    ? "text-orange-400 bg-orange-500/10 border-orange-500/30"
    : "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
}

function objCounts(objs: string[]) {
  const counts: Record<string, number> = {};
  for (const o of objs) counts[o] = (counts[o] ?? 0) + 1;
  return Object.entries(counts);
}

function Dashboard() {
  const [alerts, setAlerts] = useState<Alert[]>(seedAlerts);
  const [now, setNow] = useState(new Date());
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [apiOnline, setApiOnline] = useState(false);
  const prevAlerts = useRef<string[]>([]);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Live detection polling — Flask API (local or cloud via VITE_API_URL)
  const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://127.0.0.1:5000";

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/status`);
        const data: LiveData = await res.json();
        setLiveData(data);
        setApiOnline(true);

        // Push real detection alerts into the panel
        const fresh = data.alerts.filter((a) => !prevAlerts.current.includes(a));
        if (fresh.length > 0 && data.timestamp) {
          const entries: Alert[] = fresh.map((a) => ({
            id: Date.now() + Math.random(),
            level: a === "OVER SPEED" ? "critical" : "high",
            title: a === "OVER SPEED" ? `Overspeed: ${data.speed} km/h` : "Stop Sign Detected",
            time: "live",
            desc: `Objects in frame: ${[...new Set(data.detected_objects)].join(", ") || "none"}`,
          }));
          setAlerts((prev) => [...entries, ...prev].slice(0, 6));
        }
        prevAlerts.current = data.alerts;
      } catch {
        setApiOnline(false);
      }
    };

    poll();
    const t = setInterval(poll, 1000);
    return () => clearInterval(t);
  }, []);

  // Simulated alert rotation (for non-live alerts)
  useEffect(() => {
    const samples: Alert[] = [
      { id: 0, level: "high", title: "AI escalation · Exit 14", time: "now", desc: "Forecast model raised severity." },
      { id: 0, level: "moderate", title: "Traffic surge · Old Town", time: "now", desc: "Density crossed 75% threshold." },
      { id: 0, level: "critical", title: "Predicted collision risk", time: "now", desc: "Junction B7 · next 12 min." },
    ];
    const t = setInterval(() => {
      const s = samples[Math.floor(Math.random() * samples.length)];
      setAlerts((prev) => [{ ...s, id: Date.now() }, ...prev].slice(0, 6));
    }, 9000);
    return () => clearInterval(t);
  }, []);

  // Derived live KPIs
  const riskScore = liveData
    ? Math.min(99, Math.round((liveData.speed / liveData.speed_limit) * 60 + liveData.alerts.length * 20))
    : 76;
  const objectCount = liveData?.detected_objects.length ?? 47;
  const activeAlertCount = liveData?.alerts.length ?? 0;

  const kpis = [
    {
      k: "Active risk score", v: String(riskScore),
      sub: liveData ? `Speed ${liveData.speed}/${liveData.speed_limit} km/h` : "+8 last hour",
      icon: Gauge, tone: riskScore > 80 ? "text-destructive" : riskScore > 60 ? "text-orange-400" : "text-primary",
    },
    {
      k: "Live alerts", v: String(activeAlertCount),
      sub: activeAlertCount > 0 ? liveData?.alerts.join(" · ") ?? "" : "All clear",
      icon: AlertTriangle, tone: activeAlertCount > 0 ? "text-destructive" : "text-orange-400",
    },
    {
      k: "Objects detected", v: String(objectCount),
      sub: liveData ? `${[...new Set(liveData.detected_objects)].join(", ") || "none"}` : "−5 vs avg",
      icon: Car, tone: "text-secondary",
    },
    {
      k: "Model confidence", v: "92.4%",
      sub: "YOLOv8n · stable",
      icon: Brain, tone: "text-primary",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-40 glass">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <div className="hidden h-5 w-px bg-border md:block" />
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-md bg-gradient-cyber">
                <Activity className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="font-[Space_Grotesk] text-sm font-semibold">Live Console</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {apiOnline ? (
              <span className="flex items-center gap-1.5 text-primary">
                <Wifi className="h-3.5 w-3.5" /> Detection Live
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <WifiOff className="h-3.5 w-3.5" /> API Offline
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-primary" /> Stream OK
            </span>
            <span className="hidden sm:inline">{now.toUTCString().slice(17, 25)} · UTC</span>
          </div>
        </div>
      </header>

      <div className="grid gap-6 px-6 py-6 lg:grid-cols-[260px_1fr_320px]">
        {/* Left sidebar */}
        <aside className="space-y-2">
          {[
            { i: Gauge, k: "Overview", active: true },
            { i: MapPin, k: "Live heatmap" },
            { i: Brain, k: "Predictive analytics" },
            { i: Car, k: "Traffic monitoring" },
            { i: TrendingUp, k: "Risk forecasting" },
            { i: Bell, k: "Smart alerts" },
            { i: Layers, k: "GIS layers" },
          ].map(({ i: Icon, k, active }) => (
            <button
              key={k}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:bg-card hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" /> {k}
            </button>
          ))}

          <div className="mt-6 rounded-xl border border-border bg-card/40 p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Filters</div>
            <div className="mt-3 space-y-2 text-sm">
              {["Weather impact", "Peak hours", "Heavy vehicles", "Pedestrian zones"].map((f) => (
                <label key={f} className="flex items-center gap-2 text-foreground/80">
                  <input type="checkbox" defaultChecked className="h-3.5 w-3.5 accent-primary" /> {f}
                </label>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-4 w-full">
              <Filter className="mr-2 h-3.5 w-3.5" /> Apply
            </Button>
          </div>
        </aside>

        {/* Main content */}
        <main className="space-y-6">
          {/* KPI cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((s) => (
              <div key={s.k} className="rounded-xl border border-border bg-card/60 p-4 backdrop-blur">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {s.k}
                  <s.icon className={`h-4 w-4 ${s.tone}`} />
                </div>
                <div className="mt-2 font-[Space_Grotesk] text-3xl font-bold">{s.v}</div>
                <div className="mt-1 truncate text-xs text-muted-foreground">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Heatmap */}
          <Heatmap className="h-120 w-full" />

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card/60 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">24h Risk forecast</div>
                  <div className="mt-1 font-[Space_Grotesk] text-lg font-semibold">Average risk score</div>
                </div>
                <CloudRain className="h-4 w-4 text-secondary" />
              </div>
              <div className="mt-4 h-55">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend}>
                    <defs>
                      <linearGradient id="r" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.72 0.18 235)" stopOpacity={0.7} />
                        <stop offset="100%" stopColor="oklch(0.72 0.18 235)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="oklch(0.28 0.04 265)" strokeDasharray="3 3" />
                    <XAxis dataKey="h" stroke="oklch(0.68 0.03 255)" fontSize={11} />
                    <YAxis stroke="oklch(0.68 0.03 255)" fontSize={11} />
                    <Tooltip contentStyle={{ background: "oklch(0.19 0.04 265)", border: "1px solid oklch(0.28 0.04 265)", borderRadius: 8 }} />
                    <Area dataKey="risk" stroke="oklch(0.72 0.18 235)" fill="url(#r)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card/60 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Incidents by hour</div>
                  <div className="mt-1 font-[Space_Grotesk] text-lg font-semibold">Reported events</div>
                </div>
                <TrendingUp className="h-4 w-4 text-accent" />
              </div>
              <div className="mt-4 h-55">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trend}>
                    <CartesianGrid stroke="oklch(0.28 0.04 265)" strokeDasharray="3 3" />
                    <XAxis dataKey="h" stroke="oklch(0.68 0.03 255)" fontSize={11} />
                    <YAxis stroke="oklch(0.68 0.03 255)" fontSize={11} />
                    <Tooltip contentStyle={{ background: "oklch(0.19 0.04 265)", border: "1px solid oklch(0.28 0.04 265)", borderRadius: 8 }} />
                    <Bar dataKey="incidents" fill="oklch(0.65 0.21 295)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Hotspots table */}
          <div className="rounded-xl border border-border bg-card/60">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Top predicted hotspots</div>
                <div className="mt-1 font-[Space_Grotesk] text-lg font-semibold">Next 60 minutes</div>
              </div>
              <Button variant="outline" size="sm">Export report</Button>
            </div>
            <div className="divide-y divide-border">
              {hotspots.map((h) => (
                <div key={h.name} className="flex items-center gap-4 px-5 py-4">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-background/60">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{h.name}</div>
                    <div className="text-xs text-muted-foreground">{h.cause}</div>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${riskColor(h.type)}`}>{h.type}</span>
                  <div className="w-12 text-right font-[Space_Grotesk] text-xl font-bold">{h.score}</div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Right sidebar */}
        <aside className="space-y-4">
          {/* Live Detection Feed */}
          <div className="rounded-xl border border-border bg-card/60 p-5">
            <div className="flex items-center justify-between">
              <div className="font-[Space_Grotesk] text-lg font-semibold">Live Detection</div>
              <span className={`h-2 w-2 rounded-full ${apiOnline ? "bg-primary animate-pulse" : "bg-muted-foreground"}`} />
            </div>

            {liveData ? (
              <div className="mt-3 space-y-3">
                {/* Speed gauge */}
                <div className="rounded-lg border border-border bg-background/40 p-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Speed</span>
                    <span>Limit: {liveData.speed_limit} km/h</span>
                  </div>
                  <div className={`mt-1 font-[Space_Grotesk] text-2xl font-bold ${liveData.speed > liveData.speed_limit ? "text-destructive" : "text-primary"}`}>
                    {liveData.speed} km/h
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background/60">
                    <div
                      className={`h-full transition-all ${liveData.speed > liveData.speed_limit ? "bg-destructive" : "bg-gradient-primary"}`}
                      style={{ width: `${Math.min(100, (liveData.speed / 90) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Active alerts */}
                {liveData.alerts.length > 0 && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                    <div className="text-xs font-medium uppercase tracking-wider text-destructive">Active Alerts</div>
                    {liveData.alerts.map((a) => (
                      <div key={a} className="mt-1 text-sm font-medium text-destructive">{a}</div>
                    ))}
                  </div>
                )}

                {/* Detected objects */}
                <div className="rounded-lg border border-border bg-background/40 p-3">
                  <div className="text-xs text-muted-foreground">Objects in frame</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {liveData.detected_objects.length === 0 ? (
                      <span className="text-xs text-muted-foreground">None detected</span>
                    ) : (
                      objCounts(liveData.detected_objects).map(([obj, count]) => (
                        <span key={obj} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary border border-primary/20">
                          {obj} ×{count}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Updated: {liveData.timestamp ? new Date(liveData.timestamp).toLocaleTimeString() : "—"}
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-lg border border-border bg-background/40 p-3">
                <p className="text-xs text-muted-foreground">
                  Start <span className="text-foreground font-medium">Road Safety Detection</span> module to see live data here.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Run: <code className="text-primary">python start.py</code></p>
              </div>
            )}
          </div>

          {/* Smart alerts */}
          <div className="rounded-xl border border-border bg-card/60 p-5">
            <div className="flex items-center justify-between">
              <div className="font-[Space_Grotesk] text-lg font-semibold">Smart alerts</div>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive pulse-critical" />
            </div>
            <div className="mt-4 space-y-3">
              {alerts.map((a) => (
                <div key={a.id} className="rounded-lg border border-border bg-background/40 p-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium uppercase tracking-wider ${
                      a.level === "critical" ? "text-destructive"
                        : a.level === "high" ? "text-orange-400"
                        : "text-yellow-400"
                    }`}>{a.level}</span>
                    <span className="text-xs text-muted-foreground">{a.time}</span>
                  </div>
                  <div className="mt-1 text-sm font-medium">{a.title}</div>
                  <div className="text-xs text-muted-foreground">{a.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI reasoning */}
          <div className="rounded-xl border border-border bg-card/60 p-5">
            <div className="font-[Space_Grotesk] text-lg font-semibold">AI reasoning</div>
            <p className="mt-3 text-sm text-muted-foreground">
              {liveData && liveData.speed > liveData.speed_limit
                ? <>Vehicle travelling at <span className="text-destructive font-medium">{liveData.speed} km/h</span> exceeds limit of {liveData.speed_limit} km/h. Recommend speed reduction and monitoring for collision risk.</>
                : <>Risk at <span className="text-foreground">Junction A2</span> elevated due to converging factors: rainfall intensity 4.1mm/h, traffic density 82%, and historical severity index 0.71. Recommended action: dispatch traffic patrol.</>
              }
            </p>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>Confidence</span>
              <span className="font-medium text-primary">92.4%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background/60">
              <div className="h-full bg-gradient-primary" style={{ width: "92%" }} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
