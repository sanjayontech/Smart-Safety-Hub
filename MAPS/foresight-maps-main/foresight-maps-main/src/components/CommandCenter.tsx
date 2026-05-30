import { motion } from "motion/react";
import { Activity, AlertTriangle, Car, Users, Heart, TrendingUp, Clock } from "lucide-react";

export function CommandCenter() {
  const stats = [
    { label: "Active Vehicles", value: "1,284", change: "+12", icon: Car, color: "primary" },
    { label: "Monitoring Sessions", value: "742", change: "+8", icon: Activity, color: "accent" },
    { label: "Emergency Alerts", value: "18", change: "0", icon: AlertTriangle, color: "orange" },
    { label: "Lives Monitored", value: "4,827", change: "+24", icon: Users, color: "green" },
    { label: "Response Teams", value: "06", change: "0", icon: Heart, color: "red" },
    { label: "Safety Score", value: "87", unit: "/ 100", icon: TrendingUp, color: "green" },
  ];

  const recentIncidents = [
    { id: "INC-001", driver: "Arjun K", vehicle: "MH-12-KA-4421", time: "2 min ago", status: "monitoring", severity: "low" },
    { id: "INC-002", driver: "Priya M", vehicle: "DL-01-AB-1234", time: "15 min ago", status: "resolved", severity: "medium" },
    { id: "INC-003", driver: "Rahul S", vehicle: "KA-03-BC-5678", time: "32 min ago", status: "active", severity: "high" },
  ];

  const activeVehicles = [
    { id: "Alpha-7", driver: "Amit P.", location: "Mumbai Central", status: "safe", speed: "45 km/h" },
    { id: "Bravo-3", driver: "Neha K.", location: "Bandra West", status: "safe", speed: "52 km/h" },
    { id: "Charlie-12", driver: "Vikas M.", location: "Andheri East", status: "warning", speed: "78 km/h" },
  ];

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Mission Command Center</h1>
          <p className="text-muted-foreground">Real-time monitoring · All Systems Online</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Current Time</div>
            <div className="text-lg font-medium">19:24:31 UTC</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className={`relative p-6 rounded-2xl bg-card backdrop-blur-sm border overflow-hidden group hover:border-${stat.color}/50 transition-all`}
            style={{ borderColor: `rgba(var(--${stat.color}), 0.2)` }}
          >
            {/* Glow effect */}
            <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity`}
              style={{ background: `linear-gradient(135deg, var(--${stat.color}), transparent)` }}
            />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <stat.icon className={`w-5 h-5`} style={{ color: `var(--${stat.color})` }} />
                {stat.change && stat.change !== "0" && (
                  <span className="text-xs text-green">+{stat.change}</span>
                )}
              </div>
              <div className="flex items-baseline gap-1">
                <div className="text-3xl font-bold">{stat.value}</div>
                {stat.unit && <span className="text-sm text-muted-foreground">{stat.unit}</span>}
              </div>
              <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Incidents */}
        <div className="p-6 rounded-2xl bg-card backdrop-blur-sm border border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Live Incident Feed</h2>
            <div className="px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-xs text-primary font-medium">
              LIVE
            </div>
          </div>

          <div className="space-y-3">
            {recentIncidents.map((incident) => (
              <div
                key={incident.id}
                className="p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-sm">{incident.driver}</div>
                    <div className="text-xs text-muted-foreground">{incident.vehicle}</div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    incident.severity === "high" ? "bg-red/20 text-red border border-red/30" :
                    incident.severity === "medium" ? "bg-orange/20 text-orange border border-orange/30" :
                    "bg-green/20 text-green border border-green/30"
                  }`}>
                    {incident.severity.toUpperCase()}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {incident.time}
                  </div>
                  <div className={`px-2 py-0.5 rounded ${
                    incident.status === "active" ? "bg-primary/20 text-primary" :
                    incident.status === "resolved" ? "bg-green/20 text-green" :
                    "bg-accent/20 text-accent"
                  }`}>
                    {incident.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Vehicles */}
        <div className="p-6 rounded-2xl bg-card backdrop-blur-sm border border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Active Vehicles Tracking</h2>
            <div className="text-sm text-muted-foreground">1,284 vehicles</div>
          </div>

          <div className="space-y-3">
            {activeVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-sm flex items-center gap-2">
                      {vehicle.id}
                      <span className={`w-2 h-2 rounded-full ${
                        vehicle.status === "safe" ? "bg-green" : "bg-orange"
                      } animate-pulse`} />
                    </div>
                    <div className="text-xs text-muted-foreground">{vehicle.driver}</div>
                  </div>
                  <div className="text-xs text-right">
                    <div className="text-primary font-mono">{vehicle.speed}</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{vehicle.location}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
