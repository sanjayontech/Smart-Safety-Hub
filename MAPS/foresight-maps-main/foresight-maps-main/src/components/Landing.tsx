import { Link } from "@tanstack/react-router";
import {
  Activity, Brain, MapPin, Shield, Zap, TrendingUp, AlertTriangle,
  Radio, BarChart3, Globe2, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Heatmap } from "@/components/Heatmap";

const features = [
  { icon: Brain, title: "Predictive AI engine", desc: "XGBoost + spatial clustering forecasts accident probability per intersection with confidence scores." },
  { icon: MapPin, title: "Dynamic GIS heatmaps", desc: "Real-time PostGIS-backed risk overlays with zoom-aware clustering and time-based playback." },
  { icon: Radio, title: "Real-time streaming", desc: "WebSocket pipeline pushes traffic + weather updates to dashboards in under one second." },
  { icon: AlertTriangle, title: "Smart alert system", desc: "Spike detection, weather hazards, and predictive escalations routed to the right responders." },
  { icon: BarChart3, title: "Forecast analytics", desc: "Time-series trends, hotspot rankings, and geographic comparisons across regions." },
  { icon: Shield, title: "Enterprise-grade security", desc: "RBAC, JWT, audit logs, and granular API keys built for government deployments." },
];

const solutions = [
  { tag: "Smart cities", title: "Operate safer streets", desc: "Reduce intersection collisions with predictive deployments and signal-timing insights." },
  { tag: "Government", title: "Evidence-based policy", desc: "Quantify infrastructure risk and prioritize investment with auditable AI reports." },
  { tag: "Insurance", title: "Risk-priced regions", desc: "Hyperlocal accident probability for underwriting, telematics, and claims forecasting." },
];

const stats = [
  { v: "92.4%", k: "Prediction accuracy" },
  { v: "<1s", k: "Real-time latency" },
  { v: "37M+", k: "Events analyzed" },
  { v: "240+", k: "Cities supported" },
];

export function Landing() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute right-0 top-40 h-[400px] w-[500px] rounded-full bg-accent/20 blur-[120px]" />
        </div>
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              AI Geospatial Intelligence · v2.0
            </div>
            <h1 className="mt-6 font-[Space_Grotesk] text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              Predict accidents <br />
              <span className="text-gradient">before they happen.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              An AI-powered geospatial platform that fuses historical accident data, live traffic, weather, and road conditions
              to forecast high-risk zones in real time — for cities, agencies, and insurers.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/dashboard">
                <Button size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-90 glow-primary">
                  Open live console <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline">Book a city demo</Button>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.k}>
                  <div className="font-[Space_Grotesk] text-2xl font-bold text-foreground">{s.v}</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.k}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative float-slow">
            <Heatmap className="aspect-[5/4] w-full glow-primary" />
            <div className="glass absolute -bottom-6 -left-6 hidden w-64 rounded-xl p-4 md:block">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-primary" /> Forecast next 60 min
              </div>
              <div className="mt-2 font-[Space_Grotesk] text-2xl font-bold">
                Risk score <span className="text-destructive">87</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">Junction A2 · rain + rush hour</div>
            </div>
            <div className="glass absolute -right-6 top-6 hidden w-56 rounded-xl p-4 md:block">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Globe2 className="h-4 w-4 text-secondary" /> Live sectors
              </div>
              <div className="mt-2 font-[Space_Grotesk] text-2xl font-bold">12,418</div>
              <div className="mt-1 text-xs text-secondary">+218 in last hour</div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-2xl">
          <div className="text-sm uppercase tracking-[0.2em] text-primary">Platform</div>
          <h2 className="mt-3 font-[Space_Grotesk] text-4xl font-bold tracking-tight md:text-5xl">
            A full operating system for road risk.
          </h2>
          <p className="mt-4 text-muted-foreground">
            From raw sensor feeds to actionable forecasts — every layer of the geospatial intelligence stack, unified.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="group rounded-2xl border border-border bg-card/50 p-6 backdrop-blur transition hover:border-primary/40 hover:bg-card">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-gradient-cyber">
                <f.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="mt-4 font-[Space_Grotesk] text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SOLUTIONS */}
      <section id="solutions" className="border-y border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
            <div>
              <div className="text-sm uppercase tracking-[0.2em] text-secondary">Solutions</div>
              <h2 className="mt-3 font-[Space_Grotesk] text-4xl font-bold tracking-tight">
                Built for the people who keep cities moving.
              </h2>
            </div>
            <div className="grid gap-4">
              {solutions.map((s) => (
                <div key={s.title} className="flex items-start gap-5 rounded-2xl border border-border bg-background/40 p-6">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.tag}</div>
                    <h3 className="mt-1 font-[Space_Grotesk] text-xl font-semibold">{s.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PIPELINE */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-2xl">
          <div className="text-sm uppercase tracking-[0.2em] text-accent">Pipeline</div>
          <h2 className="mt-3 font-[Space_Grotesk] text-4xl font-bold tracking-tight">
            From sensor to forecast in under a second.
          </h2>
        </div>
        <ol className="mt-12 grid gap-4 md:grid-cols-5">
          {["Ingest", "Normalize", "Geospatial transform", "AI inference", "Live heatmap"].map((step, i) => (
            <li key={step} className="relative rounded-xl border border-border bg-card/50 p-5">
              <div className="text-xs text-muted-foreground">Step {i + 1}</div>
              <div className="mt-1 font-[Space_Grotesk] text-lg font-semibold">{step}</div>
              <div className="absolute -right-2 top-1/2 hidden h-px w-4 -translate-y-1/2 bg-primary/40 md:block last:hidden" />
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-10 text-center md:p-16">
          <div className="pointer-events-none absolute inset-0 bg-gradient-cyber opacity-20" />
          <h2 className="relative font-[Space_Grotesk] text-4xl font-bold tracking-tight md:text-5xl">
            Stop reacting. Start forecasting.
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-muted-foreground">
            Deploy predictive accident intelligence across your jurisdiction in days, not quarters.
          </p>
          <div className="relative mt-8 flex justify-center gap-3">
            <Link to="/dashboard">
              <Button size="lg" className="bg-gradient-primary text-primary-foreground glow-primary">
                Launch the console <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline">Talk to engineering</Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            © {new Date().getFullYear()} PredictiveHeat.ai — Geospatial Intelligence Systems
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}