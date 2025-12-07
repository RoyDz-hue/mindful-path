import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Smile, Wind, Moon } from "lucide-react";

export function WellnessCard() {
  const exercises = [
    { icon: Wind, label: "Breathing", time: "3 min" },
    { icon: Smile, label: "Gratitude", time: "5 min" },
    { icon: Moon, label: "Meditation", time: "10 min" },
  ];

  return (
    <Card variant="warm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Heart className="w-5 h-5 text-sanctuary-coral" />
          Wellness Exercises
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {exercises.map((exercise) => (
          <button
            key={exercise.label}
            className="w-full p-3 rounded-lg bg-background/60 hover:bg-background/80 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sanctuary-coral/20 flex items-center justify-center group-hover:bg-sanctuary-coral/30 transition-colors">
                <exercise.icon className="w-4 h-4 text-sanctuary-coral" />
              </div>
              <span className="font-medium">{exercise.label}</span>
            </div>
            <span className="text-sm text-muted-foreground">{exercise.time}</span>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
