import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMinutes } from "@/lib/constants";
import { Clock, Play, AlertTriangle, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface DailyTimerProps {
  currentDay: number;
  dailyLimit: number;
  remainingMinutes: number;
  timeUsedToday: number;
}

export function DailyTimer({ currentDay, dailyLimit, remainingMinutes, timeUsedToday }: DailyTimerProps) {
  const progressPercentage = dailyLimit > 0 ? ((dailyLimit - remainingMinutes) / dailyLimit) * 100 : 100;
  const isLocked = remainingMinutes <= 0;
  const isFinalDay = currentDay >= 7;

  if (isFinalDay) {
    return (
      <Card variant="sanctuary" className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-primary" />
            </div>
            Rehabilitation Complete
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-8">
            <div className="w-24 h-24 mx-auto bg-gradient-sanctuary rounded-full flex items-center justify-center shadow-glow mb-6">
              <CheckCircle className="w-12 h-12 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-display font-semibold mb-2">Congratulations!</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              You've completed the 7-day program. Continue to use the wellness tools 
              and chat with your AI guide to maintain your progress.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className="overflow-hidden">
      <CardHeader className="border-b border-border/50">
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          Today's Viewing Allowance
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Day {currentDay} Limit</p>
            <p className="text-3xl font-display font-bold">{formatMinutes(dailyLimit)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className={`text-3xl font-display font-bold ${isLocked ? 'text-destructive' : 'text-primary'}`}>
              {formatMinutes(remainingMinutes)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-muted-foreground">{Math.round(progressPercentage)}% used</span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </div>

        {isLocked ? (
          <div className="p-4 bg-destructive/10 rounded-xl border border-destructive/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Daily limit reached</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your viewing for today is complete. Use this time for wellness activities.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <Button variant="sanctuary" size="lg" className="w-full">
            <Play className="w-5 h-5 mr-2" />
            Start Controlled Session
          </Button>
        )}

        <p className="text-xs text-center text-muted-foreground">
          Sessions are tracked and timed. Auto-lockout activates when time expires.
        </p>
      </CardContent>
    </Card>
  );
}
