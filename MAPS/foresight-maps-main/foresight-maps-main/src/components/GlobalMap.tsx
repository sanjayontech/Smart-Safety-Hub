import { motion } from "motion/react";
import { MapPin, Navigation, Hospital, Shield, AlertTriangle, TrendingUp } from "lucide-react";
import { useState } from "react";

export function GlobalMap() {
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  const markers = [
    { id: "1", type: "vehicle", x: 25, y: 30, label: "V-Alpha", status: "safe" },
    { id: "2", type: "accident", x: 50, y: 45, label: "Incident", status: "critical" },
    { id: "3", type: "vehicle", x: 65, y: 35, label: "V-Bravo", status: "safe" },
    { id: "4", type: "hospital", x: 70, y: 55, label: "City Hospital", status: "available" },
    { id: "5", type: "vehicle", x: 35, y: 60, label: "V-Charlie", status: "warning" },
    { id: "6", type: "ambulance", x: 45, y: 70, label: "AMB-01", status: "enroute" },
  ];

  const routes = [
    { from: { x: 50, y: 45 }, to: { x: 70, y: 55 }, color: "red", label: "Emergency Route" },
    { from: { x: 45, y: 70 }, to: { x: 50, y: 45 }, color: "primary", label: "Ambulance Route" },
  ];

  const environmentalData = [
    { label: "Traffic Density", value: "High", color: "orange" },
    { label: "Weather", value: "Clear", color: "green" },
    { label: "Visibility", value: "Good", color: "green" },
    { label: "Road Condition", value: "Dry", color: "green" },
  ];

  const locations = [
    { icon: MapPin, label: "Active Incident", value: "19.0760° N, 72.8777° E", color: "red" },
    { icon: Hospital, label: "Nearest Hospital", value: "2.4 km away", color: "green" },
    { icon: Shield, label: "Police Station", value: "1.8 km away", color: "primary" },
  ];

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Global Smart Map</h1>
          <p className="text-muted-foreground">Live tracking · Emergency routing · Geospatial intelligence</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-card border border-border text-sm">
            <span className="text-muted-foreground">Coverage:</span>
            <span className="ml-2 text-primary font-medium">50 km radius</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative aspect-video rounded-2xl bg-gradient-to-br from-secondary to-card border border-border overflow-hidden">
            {/* Map background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
              {/* Road grid */}
              <svg className="absolute inset-0 w-full h-full opacity-30">
                <defs>
                  <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                    <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(0, 212, 255, 0.2)" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>

              {/* Simulated roads */}
              <svg className="absolute inset-0 w-full h-full">
                <path d="M 0 30 Q 200 50 400 40 T 800 45" stroke="rgba(0, 212, 255, 0.3)" strokeWidth="3" fill="none" />
                <path d="M 100 0 L 120 400" stroke="rgba(0, 212, 255, 0.3)" strokeWidth="3" fill="none" />
                <path d="M 300 0 Q 310 200 330 400" stroke="rgba(0, 212, 255, 0.3)" strokeWidth="3" fill="none" />
              </svg>

              {/* Routes */}
              {routes.map((route, i) => (
                <motion.svg
                  key={i}
                  className="absolute inset-0 w-full h-full"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, delay: i * 0.5 }}
                >
                  <line
                    x1={`${route.from.x}%`}
                    y1={`${route.from.y}%`}
                    x2={`${route.to.x}%`}
                    y2={`${route.to.y}%`}
                    stroke={`var(--${route.color})`}
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    className="animate-pulse"
                  />
                </motion.svg>
              ))}

              {/* Markers */}
              {markers.map((marker) => (
                <motion.div
                  key={marker.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: parseFloat(marker.id) * 0.1 }}
                  className="absolute cursor-pointer"
                  style={{
                    left: `${marker.x}%`,
                    top: `${marker.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  onClick={() => setSelectedMarker(marker.id)}
                >
                  {marker.type === "vehicle" && (
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                      marker.status === "safe" ? "bg-green/20 border-green" :
                      marker.status === "warning" ? "bg-orange/20 border-orange" :
                      "bg-red/20 border-red"
                    } animate-pulse shadow-lg`}>
                      <Navigation className="w-4 h-4" style={{ color: `var(--${
                        marker.status === "safe" ? "green" :
                        marker.status === "warning" ? "orange" :
                        "red"
                      })` }} />
                    </div>
                  )}
                  {marker.type === "accident" && (
                    <div className="w-10 h-10 rounded-full bg-red/20 border-2 border-red flex items-center justify-center animate-pulse shadow-lg shadow-red/30">
                      <AlertTriangle className="w-5 h-5 text-red" />
                    </div>
                  )}
                  {marker.type === "hospital" && (
                    <div className="w-8 h-8 rounded-full bg-green/20 border-2 border-green flex items-center justify-center shadow-lg">
                      <Hospital className="w-4 h-4 text-green" />
                    </div>
                  )}
                  {marker.type === "ambulance" && (
                    <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center animate-pulse shadow-lg shadow-primary/30">
                      <Shield className="w-4 h-4 text-primary" />
                    </div>
                  )}

                  {/* Label */}
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                    <div className="px-2 py-1 rounded bg-background/90 backdrop-blur-sm border border-border text-xs font-medium">
                      {marker.label}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Map Controls */}
            <div className="absolute top-4 right-4 space-y-2">
              <button className="p-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border hover:bg-background transition-all">
                <TrendingUp className="w-4 h-4" />
              </button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 p-3 rounded-lg bg-background/80 backdrop-blur-sm border border-border">
              <div className="text-xs font-medium mb-2">Map Legend</div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green" />
                  <span className="text-muted-foreground">Safe Vehicle</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red" />
                  <span className="text-muted-foreground">Accident</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Emergency Services</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Positional Override */}
          <div className="p-6 rounded-2xl bg-card border border-border">
            <h3 className="text-lg font-bold mb-4">Positional Override</h3>
            <div className="space-y-3">
              {locations.map((loc, i) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-start gap-2 mb-1">
                    <loc.icon className="w-4 h-4 mt-0.5" style={{ color: `var(--${loc.color})` }} />
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground">{loc.label}</div>
                      <div className="text-sm font-medium">{loc.value}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Environmental Data */}
          <div className="p-6 rounded-2xl bg-card border border-border">
            <h3 className="text-lg font-bold mb-4">Environmental</h3>
            <div className="space-y-3">
              {environmentalData.map((data, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">{data.label}</div>
                  <div className={`text-sm font-medium`} style={{ color: `var(--${data.color})` }}>
                    {data.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Incident Details */}
          <div className="p-6 rounded-2xl bg-card border border-border">
            <h3 className="text-lg font-bold mb-4">Active Incidents</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Severity</span>
                <span className="text-red font-medium">HIGH</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Response ETA</span>
                <span className="text-primary font-medium">4 mins</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Units Dispatched</span>
                <span className="text-green font-medium">2 AMB</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
