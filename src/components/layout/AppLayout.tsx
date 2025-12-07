import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";

interface AppLayoutProps {
  children: ReactNode;
  onSignOut: () => void;
  displayName?: string | null;
}

export function AppLayout({ children, onSignOut, displayName }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-soft">
      <AppSidebar onSignOut={onSignOut} displayName={displayName} />
      
      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
