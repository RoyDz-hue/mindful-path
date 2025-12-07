import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Play, Bookmark, ExternalLink } from "lucide-react";

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

interface SavedContentProps {
  items: SavedItem[];
  onPlay: (item: SavedItem) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

export function SavedContent({ items, onPlay, onDelete, loading }: SavedContentProps) {
  if (loading) {
    return (
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-primary" />
            Saved Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-primary" />
            Saved Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No saved content yet. Save videos from your searches to access them later.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-primary" />
          Saved Content ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div 
            key={item.id} 
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            {/* Thumbnail */}
            <div className="w-16 h-10 bg-muted rounded overflow-hidden flex-shrink-0">
              {item.thumbnail_url ? (
                <img 
                  src={item.thumbnail_url} 
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <Play className="w-4 h-4 text-primary" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-1">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.source_site || "Video"}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => onPlay(item)}
              >
                <Play className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onDelete(item.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
