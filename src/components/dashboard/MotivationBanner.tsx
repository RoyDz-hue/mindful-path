import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface MotivationBannerProps {
  message: string;
  day: number;
}

export function MotivationBanner({ message, day }: MotivationBannerProps) {
  return (
    <Card variant="sanctuary" className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0 animate-breathe">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-primary uppercase tracking-wider">
              Day {day} of 7 · Your Daily Motivation
            </p>
            <p className="text-lg font-medium text-foreground leading-relaxed">
              "{message}"
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
