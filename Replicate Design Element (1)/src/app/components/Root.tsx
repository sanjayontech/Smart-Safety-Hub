import { Outlet, Link, useLocation } from "react-router";
import { Activity, Map, Shield, Brain, MessageSquare, LayoutDashboard } from "lucide-react";

export function Root() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    return path !== "/" && location.pathname.startsWith(path);
  };

  const navItems = [
    { path: "/command", label: "Overview", icon: LayoutDashboard },
    { path: "/command", label: "Command Center", icon: Activity },
    { path: "/detection", label: "Live Detection", icon: Shield },
    { path: "/map", label: "Smart Map", icon: Map },
    { path: "/risk", label: "Risk Engine", icon: Brain },
    { path: "/aura", label: "AURA AI", icon: MessageSquare },
  ];

  return (
    <div className="h-screen w-full bg-background text-foreground overflow-hidden flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-border bg-secondary/50 backdrop-blur-xl">
        <div className="px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Shield className="w-6 h-6 text-background" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">SAFEROAD AI X</h1>
              <p className="text-xs text-muted-foreground">Mission Command Center</p>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.slice(1).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  isActive(item.path)
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-full bg-green/20 border border-green/30 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green animate-pulse" />
              <span className="text-xs text-green font-medium">LIVE</span>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">System Status</div>
              <div className="text-sm font-medium text-green">All Systems Operational</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
