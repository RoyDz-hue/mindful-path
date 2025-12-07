import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DAILY_LIMITS, getDailyLimit } from "@/lib/constants";
import { BarChart3, TrendingDown, Clock, Target, Calendar, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface AnalyticsData {
  date: string;
  totalMinutes: number;
  allowedMinutes: number;
  sessionsCount: number;
  dayNumber: number;
}

export default function AnalyticsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [currentDay, setCurrentDay] = useState(1);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  useEffect(() => {
    if (user) {
      loadAnalytics();
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("current_day")
      .eq("user_id", user.id)
      .single();
    if (data) {
      setCurrentDay(data.current_day || 1);
    }
  };

  const loadAnalytics = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("watch_analytics")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: true });

    if (data && !error) {
      setAnalytics(data.map(d => ({
        date: d.date,
        totalMinutes: d.total_minutes || 0,
        allowedMinutes: d.allowed_minutes,
        sessionsCount: d.sessions_count || 0,
        dayNumber: d.day_number,
      })));
    }
    setLoading(false);
  };

  // Generate sample data if no real data exists
  const chartData = analytics.length > 0 ? analytics : Array.from({ length: 7 }, (_, i) => ({
    date: `Day ${i + 1}`,
    totalMinutes: Math.max(0, getDailyLimit(i + 1) - Math.floor(Math.random() * 10)),
    allowedMinutes: getDailyLimit(i + 1),
    sessionsCount: Math.floor(Math.random() * 3) + 1,
    dayNumber: i + 1,
  }));

  const totalTimeUsed = chartData.reduce((sum, d) => sum + d.totalMinutes, 0);
  const totalAllowed = chartData.reduce((sum, d) => sum + d.allowedMinutes, 0);
  const avgSessionTime = chartData.length > 0 
    ? Math.round(totalTimeUsed / chartData.reduce((sum, d) => sum + d.sessionsCount, 0)) 
    : 0;
  const reductionPercentage = totalAllowed > 0 
    ? Math.round(((totalAllowed - totalTimeUsed) / totalAllowed) * 100) 
    : 0;

  const stats = [
    { 
      label: "Total Time Used", 
      value: `${totalTimeUsed}m`, 
      icon: Clock, 
      color: "text-primary" 
    },
    { 
      label: "Time Saved", 
      value: `${totalAllowed - totalTimeUsed}m`, 
      icon: TrendingDown, 
      color: "text-green-500" 
    },
    { 
      label: "Current Day", 
      value: `${currentDay}/7`, 
      icon: Calendar, 
      color: "text-sanctuary-coral" 
    },
    { 
      label: "Reduction Rate", 
      value: `${reductionPercentage}%`, 
      icon: Target, 
      color: "text-sanctuary-teal" 
    },
  ];

  return (
    <AppLayout onSignOut={handleSignOut} displayName={user?.user_metadata?.display_name}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">Track your progress over time</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <Card key={stat.label} variant="glass">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center ${stat.color}`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-display font-bold">{stat.value}</p>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Usage Chart */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Daily Usage vs Allowed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorUsed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(162, 35%, 42%)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(162, 35%, 42%)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorAllowed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(15, 65%, 65%)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(15, 65%, 65%)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(150, 15%, 88%)" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(200, 15%, 45%)" 
                        fontSize={12}
                        tickFormatter={(value) => typeof value === 'string' && value.startsWith('Day') ? value : `Day ${value}`}
                      />
                      <YAxis stroke="hsl(200, 15%, 45%)" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(150, 15%, 99%)", 
                          border: "1px solid hsl(150, 15%, 88%)",
                          borderRadius: "8px"
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="allowedMinutes" 
                        stroke="hsl(15, 65%, 65%)" 
                        fillOpacity={1} 
                        fill="url(#colorAllowed)"
                        name="Allowed"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="totalMinutes" 
                        stroke="hsl(162, 35%, 42%)" 
                        fillOpacity={1} 
                        fill="url(#colorUsed)"
                        name="Used"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Sessions Chart */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Sessions per Day</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(150, 15%, 88%)" />
                      <XAxis 
                        dataKey="dayNumber" 
                        stroke="hsl(200, 15%, 45%)" 
                        fontSize={12}
                        tickFormatter={(value) => `Day ${value}`}
                      />
                      <YAxis stroke="hsl(200, 15%, 45%)" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(150, 15%, 99%)", 
                          border: "1px solid hsl(150, 15%, 88%)",
                          borderRadius: "8px"
                        }}
                      />
                      <Bar 
                        dataKey="sessionsCount" 
                        fill="hsl(162, 35%, 42%)" 
                        radius={[4, 4, 0, 0]}
                        name="Sessions"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Program Overview */}
            <Card variant="sanctuary">
              <CardHeader>
                <CardTitle>7-Day Reduction Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {Object.entries(DAILY_LIMITS).map(([day, mins]) => {
                    const dayNum = parseInt(day);
                    const isComplete = dayNum < currentDay;
                    const isCurrent = dayNum === currentDay;
                    
                    return (
                      <div 
                        key={day}
                        className={`p-4 rounded-xl text-center transition-all ${
                          isComplete ? 'bg-primary/20' : 
                          isCurrent ? 'bg-primary text-primary-foreground' : 
                          'bg-muted'
                        }`}
                      >
                        <p className="text-xs font-medium mb-1">Day {day}</p>
                        <p className="text-lg font-bold">{mins === 0 ? '🎉' : `${mins}m`}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
