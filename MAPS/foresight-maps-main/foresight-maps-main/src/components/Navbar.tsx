import { Link } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-cyber glow-primary">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-[Space_Grotesk] text-lg font-bold tracking-tight">
            PredictiveHeat<span className="text-primary">.ai</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="/#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="/#solutions" className="hover:text-foreground transition-colors">Solutions</a>
          <a href="/#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Sign in</Button>
          <Link to="/dashboard">
            <Button size="sm" className="bg-gradient-primary text-primary-foreground hover:opacity-90">
              Launch console
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}