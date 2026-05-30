import { motion } from "motion/react";
import { Camera, Activity, AlertTriangle } from "lucide-react";
import { useState } from "react";

export function DetectionEngine() {
  const [aiConfidence, setAiConfidence] = useState(96);

  const detectedVehicles = [
    { id: "V-001", type: "Sedan", speed: "45 km/h", risk: "safe", x: 20, y: 30, w: 25, h: 18 },
    { id: "V-002", type: "SUV", speed: "62 km/h", risk: "warning", x: 55, y: 45, w: 30, h: 22 },
    { id: "V-003", type: "Bike", speed: "38 km/h", risk: "safe", x: 75, y: 60, w: 12, h: 15 },
  ];

  const metrics = [
    { label: "Vehicles Detected", value: "3", color: "primary" },
    { label: "AI Monitoring Confidence", value: `${aiConfidence}%`, color: "green" },
    { label: "Processing FPS", value: "30", color: "accent" },
  ];

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Live Detection Engine</h1>
          <p className="text-muted-foreground">Camera Feed · Real-time AI Inference</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-green/20 border border-green/30 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green animate-pulse" />
            <span className="text-sm text-green font-medium">LIVE</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-card border border-border text-sm">
            <span className="text-muted-foreground">Camera ID:</span>
            <span className="ml-2 font-mono text-primary">CAM-042</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Feed */}
        <div className="lg:col-span-2 space-y-4">
          {/* Video Feed */}
          <div className="relative aspect-video rounded-2xl bg-gradient-to-br from-secondary to-card border border-border overflow-hidden">
            {/* Simulated camera feed background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800">
              {/* Grid overlay */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `
                  linear-gradient(rgba(0, 212, 255, 0.3) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0, 212, 255, 0.3) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
              }} />
            </div>

            {/* Detected vehicles (bounding boxes) */}
            {detectedVehicles.map((vehicle) => (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute"
                style={{
                  left: `${vehicle.x}%`,
                  top: `${vehicle.y}%`,
                  width: `${vehicle.w}%`,
                  height: `${vehicle.h}%`,
                }}
              >
                {/* Bounding box */}
                <div className={`w-full h-full border-2 rounded ${
                  vehicle.risk === "safe" ? "border-green" :
                  vehicle.risk === "warning" ? "border-orange" :
                  "border-red"
                } relative animate-pulse`}>
                  {/* Corner markers */}
                  <div className={`absolute top-0 left-0 w-3 h-3 border-t-4 border-l-4 ${
                    vehicle.risk === "safe" ? "border-green" :
                    vehicle.risk === "warning" ? "border-orange" :
                    "border-red"
                  }`} />
                  <div className={`absolute top-0 right-0 w-3 h-3 border-t-4 border-r-4 ${
                    vehicle.risk === "safe" ? "border-green" :
                    vehicle.risk === "warning" ? "border-orange" :
                    "border-red"
                  }`} />
                  <div className={`absolute bottom-0 left-0 w-3 h-3 border-b-4 border-l-4 ${
                    vehicle.risk === "safe" ? "border-green" :
                    vehicle.risk === "warning" ? "border-orange" :
                    "border-red"
                  }`} />
                  <div className={`absolute bottom-0 right-0 w-3 h-3 border-b-4 border-r-4 ${
                    vehicle.risk === "safe" ? "border-green" :
                    vehicle.risk === "warning" ? "border-orange" :
                    "border-red"
                  }`} />

                  {/* Label */}
                  <div className={`absolute -top-8 left-0 px-2 py-1 rounded text-xs font-mono ${
                    vehicle.risk === "safe" ? "bg-green/90 text-background" :
                    vehicle.risk === "warning" ? "bg-orange/90 text-background" :
                    "bg-red/90 text-white"
                  } whitespace-nowrap`}>
                    {vehicle.id} · {vehicle.speed}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* HUD Overlay */}
            <div className="absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-none">
              <div className="px-3 py-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border">
                <div className="text-xs text-muted-foreground">Recording Mode</div>
                <div className="text-sm font-medium text-primary flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  AI INFERENCE
                </div>
              </div>
              <div className="text-right px-3 py-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border">
                <div className="text-xs text-muted-foreground">Timestamp</div>
                <div className="text-sm font-mono">19:24:35 UTC</div>
              </div>
            </div>

            {/* Bottom status */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
              <div className="px-3 py-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border text-xs">
                <span className="text-muted-foreground">Position:</span>
                <span className="ml-2 font-mono text-primary">19.0760° N, 72.8777° E</span>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-4">
            {metrics.map((metric, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-xl bg-card border border-border"
              >
                <div className="text-2xl font-bold mb-1" style={{ color: `var(--${metric.color})` }}>
                  {metric.value}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">{metric.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* AI Confidence Gauge */}
          <div className="p-6 rounded-2xl bg-card border border-border">
            <h3 className="text-lg font-bold mb-4">AI Monitoring Confidence</h3>
            <div className="relative w-40 h-40 mx-auto">
              {/* Circular progress */}
              <svg className="transform -rotate-90 w-40 h-40">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="rgba(15, 23, 42, 0.5)"
                  strokeWidth="10"
                  fill="none"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="var(--green)"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - aiConfidence / 100)}`}
                  className="transition-all duration-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-4xl font-bold text-green">{aiConfidence}%</div>
                <div className="text-xs text-muted-foreground">Monitoring confidence</div>
              </div>
            </div>
          </div>

          {/* Active Detections */}
          <div className="p-6 rounded-2xl bg-card border border-border">
            <h3 className="text-lg font-bold mb-4">Active Detections</h3>
            <div className="space-y-3">
              {detectedVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="p-3 rounded-lg bg-secondary/50 border border-border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-mono text-sm text-primary">{vehicle.id}</div>
                    <div className={`w-2 h-2 rounded-full ${
                      vehicle.risk === "safe" ? "bg-green" :
                      vehicle.risk === "warning" ? "bg-orange" :
                      "bg-red"
                    } animate-pulse`} />
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">{vehicle.type}</div>
                  <div className="text-sm font-medium">{vehicle.speed}</div>
                </div>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className="p-6 rounded-2xl bg-card border border-border">
            <h3 className="text-lg font-bold mb-4">System Events</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <Activity className="w-3 h-3 text-green mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-muted-foreground">Camera feed active</div>
                  <div className="text-green">Just now</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3 h-3 text-orange mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-muted-foreground">High speed detected on V-002</div>
                  <div className="text-orange">2 sec ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
