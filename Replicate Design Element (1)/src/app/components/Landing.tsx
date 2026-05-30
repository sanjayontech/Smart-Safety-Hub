import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, Play, Zap } from "lucide-react";

export function Landing() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        {/* Animated grid */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(0, 212, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 212, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px',
            animation: 'grid-move 20s linear infinite',
          }} />
        </div>

        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: i % 3 === 0 ? '#00D4FF' : i % 3 === 1 ? '#8B5CF6' : '#00FF88',
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-6 py-24 flex flex-col items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-5xl"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">NEXT - GENERATION AI PLATFORM</span>
          </div>

          {/* Main Heading */}
          <h1 className="mb-6">
            <div className="text-5xl md:text-7xl font-bold mb-2">
              The future of
            </div>
            <div className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-accent to-green bg-clip-text text-transparent">
              road safety
            </div>
            <div className="text-5xl md:text-7xl font-bold">
              starts now.
            </div>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
            SafeRoad AI X fuses computer vision, predictive analytics, and autonomous decision-into one mission-control platform — detecting impacts in milliseconds and coordinating rescue teams in real time.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              to="/command"
              className="px-8 py-4 rounded-xl bg-primary text-primary-foreground font-medium flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40"
            >
              Start Monitoring
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              to="/detection"
              className="px-8 py-4 rounded-xl bg-secondary border border-border text-foreground font-medium flex items-center gap-2 hover:bg-secondary/80 transition-all"
            >
              <Play className="w-5 h-5" />
              View Live Demo
            </Link>

            <button className="px-8 py-4 rounded-xl bg-transparent border border-accent/50 text-accent font-medium flex items-center gap-2 hover:bg-accent/10 transition-all">
              <Zap className="w-5 h-5" />
              Watch AI Simulation
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { value: "87", label: "Safety Index", color: "text-green" },
              { value: "1,284", label: "Active Vehicles", color: "text-primary" },
              { value: "99.6%", label: "AI Confidence", color: "text-accent" },
              { value: "24/7", label: "Monitoring", color: "text-orange" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                className="relative p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border"
              >
                <div className={`text-3xl font-bold mb-1 ${stat.color}`}>{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes grid-move {
          0% { transform: translateY(0); }
          100% { transform: translateY(100px); }
        }
      `}</style>
    </div>
  );
}
