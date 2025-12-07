// Day-based viewing limits in minutes
export const DAILY_LIMITS = {
  1: 60,
  2: 40,
  3: 20,
  4: 10,
  5: 5,
  6: 2,
  7: 0,
} as const;

export type DayNumber = keyof typeof DAILY_LIMITS;

export function getDailyLimit(day: number): number {
  if (day < 1) return DAILY_LIMITS[1];
  if (day > 7) return DAILY_LIMITS[7];
  return DAILY_LIMITS[day as DayNumber];
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatMinutes(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

export const EMOTIONS = [
  { value: 'calm', label: 'Calm', emoji: '😌', color: 'bg-sanctuary-sage-light' },
  { value: 'anxious', label: 'Anxious', emoji: '😰', color: 'bg-sanctuary-coral-soft' },
  { value: 'hopeful', label: 'Hopeful', emoji: '🌱', color: 'bg-sanctuary-sage-light' },
  { value: 'stressed', label: 'Stressed', emoji: '😓', color: 'bg-sanctuary-coral-soft' },
  { value: 'confident', label: 'Confident', emoji: '💪', color: 'bg-sanctuary-sage-light' },
  { value: 'struggling', label: 'Struggling', emoji: '😔', color: 'bg-sanctuary-coral-soft' },
  { value: 'neutral', label: 'Neutral', emoji: '😐', color: 'bg-secondary' },
] as const;

export type EmotionType = typeof EMOTIONS[number]['value'];

export const MOTIVATIONAL_MESSAGES = [
  "Every step forward is progress, no matter how small.",
  "You're stronger than you think. Keep going.",
  "Today is a new opportunity for growth.",
  "Your commitment to change is inspiring.",
  "Be patient with yourself. Healing takes time.",
  "You're not alone in this journey.",
  "Small victories lead to big transformations.",
  "Focus on progress, not perfection.",
];

export function getRandomMotivation(): string {
  return MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
}
