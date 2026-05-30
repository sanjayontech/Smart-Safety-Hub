import { motion } from "motion/react";
import { Send, Sparkles, Clock, TrendingUp, AlertTriangle } from "lucide-react";
import { useState } from "react";

export function AuraCopilot() {
  const [message, setMessage] = useState("");

  const conversation = [
    {
      role: "user",
      content: "AURA online. I have lots of light on 1284 vehicles and 88 response units. How can I assist?",
      time: "19:23:45",
    },
    {
      role: "assistant",
      content: "Brief me on incident ID: 002.",
      time: "19:24:12",
    },
    {
      role: "user",
      content: "Two vehicle collision on NH-24, KM 45. Severity moderate, ambulance in 10 min. Need help?",
      time: "19:24:18",
    },
  ];

  const systemEvents = [
    { label: "Incident Alerts", value: "3", color: "orange" },
    { label: "AI Queries", value: "147", color: "primary" },
    { label: "Reports Generated", value: "28", color: "green" },
  ];

  const suggestedPrompts = [
    "Summarize all active incidents",
    "Report vehicle MH-12-KA-4421 status",
    "Show me critical risk zones",
    "Generate safety analytics report",
  ];

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-background" />
            </div>
            AURA - AI Copilot
          </h1>
          <p className="text-muted-foreground">AI Unified Response Assistant · Real-time AI Page</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-green/20 border border-green/30 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green animate-pulse" />
            <span className="text-sm text-green font-medium">ONLINE</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-2 flex flex-col h-[calc(100vh-240px)]">
          <div className="flex-1 p-6 rounded-2xl bg-card border border-border flex flex-col">
            {/* Chat Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <h2 className="text-lg font-bold">Live Conversation</h2>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Session: 12m 34s
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {conversation.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex ${msg.role === "assistant" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[80%] ${msg.role === "assistant" ? "text-right" : "text-left"}`}>
                    <div
                      className={`inline-block p-4 rounded-2xl ${
                        msg.role === "assistant"
                          ? "bg-primary/20 border border-primary/30 text-foreground"
                          : "bg-secondary border border-border"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 px-2">{msg.time}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Suggested Prompts */}
            <div className="mb-4">
              <div className="text-xs text-muted-foreground mb-2">Suggested Prompts</div>
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.slice(0, 2).map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => setMessage(prompt)}
                    className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs hover:border-primary/30 hover:bg-primary/10 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask AURA anything about incidents, analytics, or predictions..."
                className="flex-1 px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && message.trim()) {
                    setMessage("");
                  }
                }}
              />
              <button
                className="px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!message.trim()}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* System Events */}
          <div className="p-6 rounded-2xl bg-card border border-border">
            <h3 className="text-lg font-bold mb-4">System Events</h3>
            <div className="space-y-4">
              {systemEvents.map((event, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">{event.label}</div>
                  <div className="text-2xl font-bold" style={{ color: `var(--${event.color})` }}>
                    {event.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="p-6 rounded-2xl bg-card border border-border">
            <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {[
                { action: "Incident Report", detail: "INC-002 analyzed", time: "2m ago", icon: AlertTriangle, color: "orange" },
                { action: "Safety Score", detail: "Updated to 87/100", time: "5m ago", icon: TrendingUp, color: "green" },
                { action: "Route Optimized", detail: "AMB-01 to hospital", time: "8m ago", icon: Sparkles, color: "primary" },
              ].map((activity, i) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `var(--${activity.color}20)`, borderColor: `var(--${activity.color}30)` }}
                    >
                      <activity.icon className="w-4 h-4" style={{ color: `var(--${activity.color})` }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{activity.action}</div>
                      <div className="text-xs text-muted-foreground">{activity.detail}</div>
                      <div className="text-xs text-muted-foreground mt-1">{activity.time}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Queries */}
          <div className="p-6 rounded-2xl bg-card border border-border">
            <h3 className="text-lg font-bold mb-4">Suggested Queries</h3>
            <div className="space-y-2">
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setMessage(prompt)}
                  className="w-full text-left p-3 rounded-lg bg-secondary/50 border border-border hover:border-primary/30 hover:bg-primary/10 transition-all text-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* AURA Capabilities */}
          <div className="p-6 rounded-2xl bg-card border border-border">
            <h3 className="text-lg font-bold mb-4">AURA Capabilities</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <div className="text-muted-foreground">Real-time incident analysis</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <div className="text-muted-foreground">Predictive risk modeling</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <div className="text-muted-foreground">Emergency response guidance</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <div className="text-muted-foreground">Safety analytics reporting</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
