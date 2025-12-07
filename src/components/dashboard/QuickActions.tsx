import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, BookOpen, Search, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

export function QuickActions() {
  const actions = [
    {
      icon: MessageCircle,
      label: "AI Guide",
      description: "Get support",
      href: "/chat",
      variant: "sanctuary" as const,
    },
    {
      icon: BookOpen,
      label: "Journal",
      description: "Reflect today",
      href: "/journal",
      variant: "soft" as const,
    },
    {
      icon: Search,
      label: "Safe Search",
      description: "Internal only",
      href: "/search",
      variant: "default" as const,
    },
    {
      icon: BarChart3,
      label: "Analytics",
      description: "View trends",
      href: "/analytics",
      variant: "default" as const,
    },
  ];

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant={action.variant}
            className="h-auto py-4 flex-col gap-2"
            asChild
          >
            <Link to={action.href}>
              <action.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{action.label}</span>
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
