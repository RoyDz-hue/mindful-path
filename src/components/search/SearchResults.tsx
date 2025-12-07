import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Bookmark, ExternalLink, Clock, AlertTriangle } from "lucide-react";

interface SearchResult {
  title: string;
  url: string;
  platform: string;
  thumbnail?: string;
  description: string;
  duration?: string;
  safe: boolean;
}

interface SearchResultsProps {
  results: SearchResult[];
  warning?: string | null;
  suggestions?: string[];
  onPlay: (result: SearchResult) => void;
  onSave: (result: SearchResult) => void;
  onSuggestionClick: (suggestion: string) => void;
}

export function SearchResults({ 
  results, 
  warning, 
  suggestions, 
  onPlay, 
  onSave,
  onSuggestionClick 
}: SearchResultsProps) {
  if (warning) {
    return (
      <Card variant="warm" className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-sanctuary-coral flex-shrink-0" />
            <div className="space-y-3">
              <p className="font-medium text-sanctuary-coral">{warning}</p>
              {suggestions && suggestions.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Try these instead:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion, i) => (
                      <Button 
                        key={i} 
                        variant="soft" 
                        size="sm"
                        onClick={() => onSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!results || results.length === 0) {
    return (
      <Card variant="glass" className="text-center py-12">
        <CardContent>
          <p className="text-muted-foreground">No results found. Try a different search query.</p>
          {suggestions && suggestions.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">Suggestions:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((suggestion, i) => (
                  <Button 
                    key={i} 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {results.map((result, index) => (
        <Card key={index} variant="elevated" className="overflow-hidden hover:shadow-glow transition-shadow">
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row">
              {/* Thumbnail */}
              <div className="relative w-full sm:w-48 h-32 bg-muted flex-shrink-0">
                {result.thumbnail ? (
                  <img 
                    src={result.thumbnail} 
                    alt={result.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-sanctuary">
                    <Play className="w-8 h-8 text-primary-foreground" />
                  </div>
                )}
                {result.duration && (
                  <span className="absolute bottom-2 right-2 bg-foreground/80 text-background text-xs px-1.5 py-0.5 rounded">
                    {result.duration}
                  </span>
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-lg line-clamp-1">{result.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{result.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {result.platform}
                      </span>
                      {!result.safe && (
                        <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Flagged
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="sanctuary" 
                      size="sm"
                      onClick={() => onPlay(result)}
                      disabled={!result.safe}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Play
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onSave(result)}
                    >
                      <Bookmark className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
