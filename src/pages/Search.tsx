import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Search as SearchIcon, Shield, AlertTriangle, ExternalLink, X, Clock, Loader2 } from "lucide-react";

export default function SearchPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !user) return;

    setIsSearching(true);

    try {
      // Log search query
      await supabase.from("search_queries").insert({
        user_id: user.id,
        query: query.trim(),
        results_count: 0,
      });

      // Add to recent searches
      setRecentSearches(prev => [query, ...prev.filter(s => s !== query)].slice(0, 5));

      toast({
        title: "Search Logged",
        description: "Your search has been recorded. Opening internal viewer...",
      });

      // Simulate opening in internal viewer
      setActiveUrl(`https://example.com/search?q=${encodeURIComponent(query)}`);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const closeViewer = () => {
    setActiveUrl(null);
  };

  return (
    <AppLayout onSignOut={handleSignOut} displayName={user?.user_metadata?.display_name}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Safe Search</h1>
          <p className="text-muted-foreground mt-1">
            All content opens in our controlled internal viewer
          </p>
        </div>

        {/* Warning Banner */}
        <Card variant="warm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-sanctuary-coral flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sanctuary-coral">Controlled Environment</p>
                <p className="text-sm text-muted-foreground mt-1">
                  All searches are logged for your progress tracking. Content opens in a sandboxed viewer 
                  with automatic time tracking. External navigation is blocked.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Form */}
        <Card variant="elevated">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search within controlled environment..."
                  className="pl-12 h-12"
                />
              </div>
              <Button type="submit" variant="sanctuary" size="lg" disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <SearchIcon className="w-5 h-5 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Internal Viewer */}
        {activeUrl && (
          <Card variant="glass" className="overflow-hidden">
            <CardHeader className="border-b border-border py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm text-muted-foreground ml-4 truncate max-w-md">
                    {activeUrl}
                  </span>
                </div>
                <Button variant="ghost" size="icon" onClick={closeViewer}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-96 bg-muted/50 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Shield className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Sandboxed Viewer</p>
                    <p className="text-sm text-muted-foreground">
                      Content would load here in a controlled iframe
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Session time is being tracked</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                Recent Searches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, i) => (
                  <button
                    key={i}
                    onClick={() => setQuery(search)}
                    className="px-3 py-1.5 bg-muted rounded-full text-sm hover:bg-muted/80 transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Safety Tips */}
        <Card variant="sanctuary">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-medium">Tips for Managing Urges</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Take 3 deep breaths before searching</li>
                  <li>• Consider talking to your AI guide first</li>
                  <li>• Try a wellness exercise instead</li>
                  <li>• Journal about what triggered the urge</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
