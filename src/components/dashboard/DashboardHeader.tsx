import { Button } from "@/components/ui/button";
import { Leaf, LogOut, Settings, User } from "lucide-react";
import { Link } from "react-router-dom";

interface DashboardHeaderProps {
  displayName: string | null | undefined;
  onSignOut: () => void;
}

export function DashboardHeader({ displayName, onSignOut }: DashboardHeaderProps) {
  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-20">
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-sanctuary rounded-xl flex items-center justify-center shadow-sanctuary">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-semibold">Sanctuary</span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {displayName ? `Welcome, ${displayName}` : "Welcome back"}
            </span>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/journal">
                  <User className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link to="/chat">
                  <Settings className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={onSignOut}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
