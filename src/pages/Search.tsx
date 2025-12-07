import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { SearchResults } from "@/components/search/SearchResults";
import { ContentViewer } from "@/components/search/ContentViewer";
import { SavedContent } from "@/components/search/SavedContent";
import { getDailyLimit } from "@/lib/constants";
import { 
  Search as SearchIcon, 
  Shield, 
  AlertTriangle, 
  Clock, 
  Loader2,
  Sparkles,
  History
} from "lucide-react";

interface SearchResult {
  title: string;
  url: string;
  platform: string;
  thumbnail?: string;
  description: string;
  duration?: string;
  safe: boolean;
}

interface SavedItem {
  id: string;
  title: string;
  url: string;
  thumbnail_url?: string;
  description?: string;
  content_type: string;
  source_site?: string;
  created_at: string;
}

interface Profile {
  current_day: number;
  total_watch_time_today: number;
}

export default function SearchPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const [activeContent, setActiveContent] = useState<SearchResult | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const [savedContent, setSavedContent] = useState<SavedItem[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  
  const [profile, setProfile] = useState<Profile | null>(null);

  // Fetch profile and saved content on mount
  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSavedContent();
      fetchRecentSearches();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("current_day, total_watch_time_today")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) setProfile(data);
  };

  const fetchSavedContent = async () => {
    if (!user) return;
    setSavedLoading(true);
    const { data, error } = await supabase
      .from("saved_content")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    
    if (!error && data) {
      setSavedContent(data);
    }
    setSavedLoading(false);
  };

  const fetchRecentSearches = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("search_queries")
      .select("query")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    
    if (data) {
      setRecentSearches([...new Set(data.map(d => d.query))]);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim() || !user) return;

    setIsSearching(true);
    setResults([]);
    setWarning(null);
    setSuggestions([]);

    try {
      // Log search query
      await supabase.from("search_queries").insert({
        user_id: user.id,
        query: searchQuery.trim(),
        results_count: 0,
      });

      // Add to recent searches
      setRecentSearches(prev => [searchQuery, ...prev.filter(s => s !== searchQuery)].slice(0, 5));

      // Call AI-powered search
      const response = await supabase.functions.invoke("search-content", {
        body: { query: searchQuery, type: "video" }
      });

      if (response.error) throw new Error(response.error.message);

      const data = response.data;
      if (data.success) {
        setResults(data.results || []);
        setWarning(data.warning);
        setSuggestions(data.suggestions || []);

        // Update results count
        await supabase
          .from("search_queries")
          .update({ results_count: data.results?.length || 0 })
          .eq("user_id", user.id)
          .eq("query", searchQuery.trim());
      } else {
        throw new Error(data.error || "Search failed");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search Failed",
        description: error instanceof Error ? error.message : "Unable to complete search",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handlePlay = async (result: SearchResult) => {
    if (!user || !profile) return;

    const dailyLimit = getDailyLimit(profile.current_day);
    const remainingMinutes = Math.max(0, dailyLimit - (profile.total_watch_time_today || 0));
    
    if (remainingMinutes <= 0) {
      toast({
        title: "Daily Limit Reached",
        description: "You've used all your viewing time for today. Try wellness exercises instead.",
        variant: "destructive",
      });
      return;
    }

    // Create viewing session
    const { data: session, error } = await supabase
      .from("viewing_sessions")
      .insert({
        user_id: user.id,
        search_query: query,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create session:", error);
      return;
    }

    setSessionId(session.id);
    setActiveContent(result);

    toast({
      title: "Session Started",
      description: `You have ${remainingMinutes} minutes remaining today.`,
    });
  };

  const handleTimeUpdate = useCallback(async (elapsedSeconds: number) => {
    if (!user || !sessionId) return;
    
    // Update session duration every 30 seconds
    if (elapsedSeconds % 30 === 0) {
      await supabase
        .from("viewing_sessions")
        .update({ duration_seconds: elapsedSeconds })
        .eq("id", sessionId);
    }
  }, [user, sessionId]);

  const handleSessionEnd = useCallback(async (wasAutoStopped: boolean) => {
    if (!user || !sessionId) return;

    await supabase
      .from("viewing_sessions")
      .update({
        ended_at: new Date().toISOString(),
        was_auto_stopped: wasAutoStopped,
      })
      .eq("id", sessionId);

    // Refresh profile to get updated watch time
    fetchProfile();

    if (wasAutoStopped) {
      toast({
        title: "Time's Up",
        description: "Your daily viewing limit has been reached. Great job managing your time!",
      });
    }

    setActiveContent(null);
    setSessionId(null);
  }, [user, sessionId, toast]);

  const handleSave = async (result: SearchResult) => {
    if (!user) return;

    const { error } = await supabase.from("saved_content").insert({
      user_id: user.id,
      title: result.title,
      url: result.url,
      thumbnail_url: result.thumbnail,
      description: result.description,
      content_type: "video",
      source_site: result.platform,
    });

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "Already Saved",
          description: "This content is already in your saved list.",
        });
      } else {
        toast({
          title: "Save Failed",
          description: "Unable to save content. Please try again.",
          variant: "destructive",
        });
      }
      return;
    }

    toast({
      title: "Saved",
      description: "Content added to your saved list.",
    });
    fetchSavedContent();
  };

  const handleDeleteSaved = async (id: string) => {
    const { error } = await supabase.from("saved_content").delete().eq("id", id);
    
    if (!error) {
      setSavedContent(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Removed",
        description: "Content removed from saved list.",
      });
    }
  };

  const handlePlaySaved = (item: SavedItem) => {
    handlePlay({
      title: item.title,
      url: item.url,
      platform: item.source_site || "Video",
      thumbnail: item.thumbnail_url,
      description: item.description || "",
      safe: true,
    });
  };

  const currentDay = profile?.current_day || 1;
  const dailyLimit = getDailyLimit(currentDay);
  const remainingMinutes = Math.max(0, dailyLimit - (profile?.total_watch_time_today || 0));

  return (
    <AppLayout onSignOut={handleSignOut} displayName={user?.user_metadata?.display_name}>
      {/* Content Viewer Modal */}
      {activeContent && (
        <ContentViewer
          url={activeContent.url}
          title={activeContent.title}
          remainingSeconds={remainingMinutes * 60}
          onClose={() => setActiveContent(null)}
          onTimeUpdate={handleTimeUpdate}
          onSessionEnd={handleSessionEnd}
        />
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Safe Search</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered content discovery with controlled viewing
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Search Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Time Remaining Banner */}
            <Card variant={remainingMinutes > 10 ? "sanctuary" : "warm"}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className={`w-5 h-5 ${remainingMinutes > 10 ? 'text-primary' : 'text-sanctuary-coral'}`} />
                    <div>
                      <p className="font-medium">Day {currentDay} Viewing Time</p>
                      <p className="text-sm text-muted-foreground">
                        {remainingMinutes > 0 
                          ? `${remainingMinutes} minutes remaining` 
                          : "Daily limit reached"}
                      </p>
                    </div>
                  </div>
                  {remainingMinutes <= 0 && (
                    <Button variant="soft" size="sm" onClick={() => navigate("/chat")}>
                      Talk to AI Guide
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Search Form */}
            <Card variant="elevated">
              <CardContent className="p-6">
                <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="space-y-4">
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                      <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for content with AI assistance..."
                        className="pl-12 h-12"
                        disabled={remainingMinutes <= 0}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      variant="sanctuary" 
                      size="lg" 
                      disabled={isSearching || remainingMinutes <= 0}
                    >
                      {isSearching ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <SearchIcon className="w-5 h-5 mr-2" />
                          Search
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <History className="w-4 h-4 text-muted-foreground" />
                      {recentSearches.map((search, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => { setQuery(search); handleSearch(search); }}
                          className="px-3 py-1 bg-muted rounded-full text-sm hover:bg-muted/80 transition-colors"
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* Search Results */}
            {(results.length > 0 || warning || isSearching) && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Results</h2>
                {isSearching ? (
                  <Card variant="glass" className="p-12">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-muted-foreground">AI is finding safe content...</p>
                    </div>
                  </Card>
                ) : (
                  <SearchResults
                    results={results}
                    warning={warning}
                    suggestions={suggestions}
                    onPlay={handlePlay}
                    onSave={handleSave}
                    onSuggestionClick={(suggestion) => { setQuery(suggestion); handleSearch(suggestion); }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Safety Info */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Controlled Environment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>• All content opens in sandboxed viewer</p>
                <p>• Session time is tracked automatically</p>
                <p>• Auto-lockout when time expires</p>
                <p>• AI monitors for recovery-safe content</p>
              </CardContent>
            </Card>

            {/* Saved Content */}
            <SavedContent
              items={savedContent}
              onPlay={handlePlaySaved}
              onDelete={handleDeleteSaved}
              loading={savedLoading}
            />

            {/* Tips Card */}
            <Card variant="warm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-sanctuary-coral flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-medium text-sanctuary-coral">Managing Urges</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Take 3 deep breaths first</li>
                      <li>• Consider talking to your AI guide</li>
                      <li>• Try a wellness exercise instead</li>
                      <li>• Journal about what triggered you</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
