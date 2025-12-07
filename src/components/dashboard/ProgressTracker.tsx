import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DAILY_LIMITS } from "@/lib/constants";
import { Check, Lock, Circle } from "lucide-react";

interface ProgressTrackerProps {
  currentDay: number;
}

export function ProgressTracker({ currentDay }: ProgressTrackerProps) {
  const days = Object.entries(DAILY_LIMITS).map(([day, minutes]) => ({
    day: parseInt(day),
    minutes,
  }));

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="text-lg">7-Day Reduction Program</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Progress line */}
          <div className="absolute left-[21px] top-6 bottom-6 w-0.5 bg-border" />
          <div 
            className="absolute left-[21px] top-6 w-0.5 bg-gradient-sanctuary transition-all duration-500"
            style={{ height: `${((currentDay - 1) / 6) * 100}%` }}
          />

          <div className="space-y-4">
            {days.map(({ day, minutes }) => {
              const isCompleted = day < currentDay;
              const isCurrent = day === currentDay;
              const isFuture = day > currentDay;

              return (
                <div key={day} className="flex items-center gap-4">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10
                    transition-all duration-300
                    ${isCompleted ? 'bg-gradient-sanctuary shadow-sanctuary' : ''}
                    ${isCurrent ? 'bg-primary/20 border-2 border-primary animate-pulse-soft' : ''}
                    ${isFuture ? 'bg-muted border border-border' : ''}
                  `}>
                    {isCompleted && <Check className="w-5 h-5 text-primary-foreground" />}
                    {isCurrent && <Circle className="w-4 h-4 text-primary fill-current" />}
                    {isFuture && <Lock className="w-4 h-4 text-muted-foreground" />}
                  </div>

                  <div className={`
                    flex-1 p-3 rounded-lg transition-all duration-300
                    ${isCurrent ? 'bg-primary/5 border border-primary/20' : ''}
                    ${isCompleted ? 'opacity-60' : ''}
                  `}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-medium ${isCurrent ? 'text-primary' : ''}`}>
                          Day {day}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {minutes === 0 ? 'Full rehabilitation' : `${minutes} minutes allowed`}
                        </p>
                      </div>
                      {isCurrent && (
                        <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
                          Today
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
