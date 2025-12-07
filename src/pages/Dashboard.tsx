import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getDailyLimit, formatMinutes, getRandomMotivation } from "@/lib/constants";
import { DailyTimer } from "@/components/dashboard/DailyTimer";
import { ProgressTracker } from "@/components/dashboard/ProgressTracker";
import { WellnessCard } from "@/components/dashboard/WellnessCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MotivationBanner } from "@/components/dashboard/MotivationBanner";
import { Loader2 } from "lucide-react";

interface Profile {
  current_day: number;
  total_watch_time_today: number;
  display_name: string | null;
  age_verified: boolean;
}

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [motivation, setMotivation] = useState(getRandomMotivation());

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading your sanctuary...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const currentDay = profile?.current_day || 1;
  const dailyLimit = getDailyLimit(currentDay);
  const timeUsedToday = profile?.total_watch_time_today || 0;
  const remainingMinutes = Math.max(0, dailyLimit - timeUsedToday);

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sanctuary-sage/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-sanctuary-teal/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <DashboardHeader 
          displayName={profile?.display_name} 
          onSignOut={handleSignOut}
        />

        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <MotivationBanner message={motivation} day={currentDay} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <div className="lg:col-span-2 space-y-6">
              <DailyTimer 
                currentDay={currentDay}
                dailyLimit={dailyLimit}
                remainingMinutes={remainingMinutes}
                timeUsedToday={timeUsedToday}
              />
              
              <ProgressTracker currentDay={currentDay} />
            </div>

            <div className="space-y-6">
              <QuickActions />
              <WellnessCard />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
