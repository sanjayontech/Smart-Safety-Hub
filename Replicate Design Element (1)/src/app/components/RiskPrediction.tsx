import { motion } from "motion/react";
import { TrendingUp, AlertTriangle, Cloud, Activity, Gauge, Clock } from "lucide-react";
import { useState, useEffect } from "react";

export function RiskPrediction() {
  const [safetyIndex, setSafetyIndex] = useState(50);

  useEffect(() => {
    const timer = setTimeout(() => setSafetyIndex(50), 100);
    return () => clearTimeout(timer);
  }, []);

  const riskVectors = [
    { label: "Driver Behavior", value: 24, max: 100, color: "green", icon: Activity },
    { label: "Road Condition", value: 58, max: 100, color: "orange", icon: AlertTriangle },
    { label: "Traffic Density", value: 71, max: 100, color: "red", icon: TrendingUp },
    { label: "Weather", value: 82, max: 100, color: "red", icon: Cloud },
    { label: "Vehicle Health", value: 18, max: 100, color: "green", icon: Gauge },
    { label: "Fatigue", value: 44, max: 100, color: "orange", icon: Clock },
  ];

  const statusIndicators = [
    { label: "STATUS", value: "ELEVATED", color: "orange" },
    { label: "TREND", value: "▲ 2.34", color: "orange" },
    { label: "HORIZON", value: "12 MIN", color: "primary" },
  ];

  const getStatusColor = (index: number) => {
    if (index >= 75) return "green";
    if (index >= 50) return "orange";
    return "red";
  };

  const statusColor = getStatusColor(safetyIndex);
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (safetyIndex / 100) * circumference;

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Risk Prediction Engine</h1>
          <p className="text-muted-foreground">Holographic safety index · Updated 0.5s ago</p>
        </div>
        <div className="flex items-center gap-3">
          {statusIndicators.map((indicator, i) => (
            <div key={i} className="text-right">
              <div className="text-xs text-muted-foreground">{indicator.label}</div>
              <div className="text-sm font-medium" style={{ color: `var(--${indicator.color})` }}>
                {indicator.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Safety Index Gauge */}
        <div className="p-8 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">OVERALL SAFETY INDEX</h2>
            <div className="px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-xs text-primary font-medium">
              LIVE
            </div>
          </div>

          {/* Holographic Gauge */}
          <div className="relative w-full max-w-sm mx-auto aspect-square flex items-center justify-center">
            {/* Outer glow rings */}
            <motion.div
              className="absolute inset-0 rounded-full opacity-20"
              style={{
                background: `radial-gradient(circle, var(--${statusColor}) 0%, transparent 70%)`,
              }}
              animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Main circular gauge */}
            <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 280 280">
              {/* Background circle */}
              <circle
                cx="140"
                cy="140"
                r="120"
                stroke="rgba(15, 23, 42, 0.5)"
                strokeWidth="16"
                fill="none"
              />

              {/* Progress circle */}
              <motion.circle
                cx="140"
                cy="140"
                r="120"
                stroke={`var(--${statusColor})`}
                strokeWidth="16"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                style={{
                  filter: `drop-shadow(0 0 8px var(--${statusColor}))`,
                }}
              />

              {/* Inner decorative circle */}
              <circle
                cx="140"
                cy="140"
                r="100"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="1"
                fill="none"
                strokeDasharray="2,4"
              />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div
                className="text-7xl font-bold mb-2"
                style={{ color: `var(--${statusColor})` }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                {safetyIndex}
              </motion.div>
              <div className="text-sm text-muted-foreground mb-4">/ 100</div>
              <div className="text-xs text-center px-4">
                <div className="text-muted-foreground">SAFETY INDEX</div>
              </div>
            </div>

            {/* Tick marks */}
            <div className="absolute inset-0">
              {[...Array(12)].map((_, i) => {
                const angle = (i * 30) - 90;
                const x1 = 140 + 105 * Math.cos((angle * Math.PI) / 180);
                const y1 = 140 + 105 * Math.sin((angle * Math.PI) / 180);
                const x2 = 140 + 115 * Math.cos((angle * Math.PI) / 180);
                const y2 = 140 + 115 * Math.sin((angle * Math.PI) / 180);

                return (
                  <svg key={i} className="absolute inset-0 w-full h-full" viewBox="0 0 280 280">
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="rgba(255, 255, 255, 0.2)"
                      strokeWidth="2"
                    />
                  </svg>
                );
              })}
            </div>
          </div>

          {/* Driver Info */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Driver: <span className="text-foreground font-medium">R. Mehta</span> · Vehicle:{" "}
            <span className="text-foreground font-medium">MH 12 KA 4421</span>
          </div>
        </div>

        {/* Risk Vectors */}
        <div className="p-8 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">RISK VECTORS</h2>
            <div className="px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-xs text-primary font-medium">
              LIVE
            </div>
          </div>

          <div className="space-y-6">
            {riskVectors.map((vector, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <vector.icon className="w-5 h-5" style={{ color: `var(--${vector.color})` }} />
                    <span className="text-sm text-muted-foreground">{vector.label}</span>
                  </div>
                  <span className="text-2xl font-bold" style={{ color: `var(--${vector.color})` }}>
                    {vector.value}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      backgroundColor: `var(--${vector.color})`,
                      boxShadow: `0 0 8px var(--${vector.color})`,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(vector.value / vector.max) * 100}%` }}
                    transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="mt-8 pt-6 border-t border-border grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-secondary/50">
              <div className="text-xs text-muted-foreground mb-1">Critical Factors</div>
              <div className="text-2xl font-bold text-red">2</div>
            </div>
            <div className="p-4 rounded-xl bg-secondary/50">
              <div className="text-xs text-muted-foreground mb-1">Warnings Active</div>
              <div className="text-2xl font-bold text-orange">3</div>
            </div>
          </div>
        </div>
      </div>

      {/* Prediction Timeline */}
      <div className="p-6 rounded-2xl bg-card border border-border">
        <h2 className="text-xl font-bold mb-6">AI Risk Prediction Timeline</h2>
        <div className="grid grid-cols-5 gap-4">
          {[
            { time: "Now", risk: 50, color: "orange" },
            { time: "+5min", risk: 55, color: "orange" },
            { time: "+10min", risk: 62, color: "orange" },
            { time: "+15min", risk: 68, color: "red" },
            { time: "+20min", risk: 45, color: "orange" },
          ].map((prediction, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-4 rounded-xl bg-secondary/50 border border-border text-center"
            >
              <div className="text-xs text-muted-foreground mb-2">{prediction.time}</div>
              <div className="text-3xl font-bold mb-1" style={{ color: `var(--${prediction.color})` }}>
                {prediction.risk}
              </div>
              <div className="text-xs text-muted-foreground">Risk Score</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
