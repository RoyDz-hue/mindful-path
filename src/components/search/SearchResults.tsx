import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Bookmark, Heart, Download, Image as ImageIcon, Maximize2, ImageOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImageViewer } from "./ImageViewer";

interface SearchResult {
  title: string;
  url: string;
  platform: string;
  thumbnail?: string;
  description: string;
  duration?: string;
  contentType?: "video" | "image";
  safe: boolean;
}

interface SearchResultsProps {
  results: SearchResult[];
  motivation?: string | null;
  suggestions?: string[];
  onPlay: (result: SearchResult) => void;
  onSave: (result: SearchResult) => void;
  onSuggestionClick: (suggestion: string) => void;
  userId?: string;
}

export function SearchResults({ 
  results, 
  motivation, 
  suggestions, 
  onPlay, 
  onSave,
  onSuggestionClick,
  userId
}: SearchResultsProps) {
  const { toast } = useToast();
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [brokenImages, setBrokenImages] = useState<Set<number>>(new Set());

  const handleImageError = (index: number) => {
    setBrokenImages(prev => new Set(prev).add(index));
  };

  const handleViewFullImage = (index: number) => {
    setSelectedImageIndex(index);
    setImageViewerOpen(true);
  };

  const handleDownload = async (result: SearchResult) => {
    try {
      const response = await fetch(result.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = result.url.split('.').pop()?.split('?')[0] || 'jpg';
      a.download = `${result.title.replace(/[^a-z0-9]/gi, '_')}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({
        title: "Downloaded",
        description: "Image saved successfully.",
      });
    } catch (error) {
      window.open(result.url, '_blank');
      toast({
        title: "Opening Image",
        description: "Right-click to save the image.",
      });
    }
  };
  // Show supportive motivation message (not warning)
  const MotivationBanner = () => (
    motivation ? (
      <Card variant="sanctuary" className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Heart className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-foreground">{motivation}</p>
              {suggestions && suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {suggestions.map((suggestion, i) => (
                    <Button 
                      key={i} 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onSuggestionClick(suggestion)}
                      className="text-xs"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    ) : null
  );

  if (!results || results.length === 0) {
    return (
      <>
        <MotivationBanner />
        <Card variant="glass" className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground">No results found. Try a different search or paste a direct URL.</p>
            {suggestions && suggestions.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Try these:</p>
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
      </>
    );
  }

  const isImageSearch = results.length > 0 && results[0]?.contentType === "image";
  const imageResults = isImageSearch ? results : [];

  return (
    <div className="space-y-4">
      <MotivationBanner />
      
      {/* Image Viewer Modal */}
      {isImageSearch && (
        <ImageViewer
          images={imageResults}
          initialIndex={selectedImageIndex}
          isOpen={imageViewerOpen}
          onClose={() => setImageViewerOpen(false)}
          userId={userId}
        />
      )}
      
      {isImageSearch ? (
        // Image Grid Layout
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {results.map((result, index) => (
            <Card key={index} variant="elevated" className="overflow-hidden hover:shadow-glow transition-shadow group">
              <CardContent className="p-0">
                <div className="relative aspect-square bg-muted">
                  {brokenImages.has(index) ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                      <ImageOff className="w-8 h-8" />
                      <span className="text-xs">Image unavailable</span>
                    </div>
                  ) : (
                    <img 
                      src={result.thumbnail || result.url} 
                      alt={result.title}
                      className="w-full h-full object-cover cursor-pointer"
                      loading="lazy"
                      onClick={() => handleViewFullImage(index)}
                      onError={() => handleImageError(index)}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                    />
                  )}
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => handleViewFullImage(index)}
                      title="View Full"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => handleDownload(result)}
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => onSave(result)}
                      title="Save to Collection"
                    >
                      <Bookmark className="w-4 h-4" />
                    </Button>
                  </div>
                  {result.duration && (
                    <span className="absolute bottom-2 right-2 bg-foreground/80 text-background text-xs px-1.5 py-0.5 rounded">
                      {result.duration}
                    </span>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-sm font-medium line-clamp-1">{result.title}</p>
                  <p className="text-xs text-muted-foreground">{result.platform}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // Video List Layout
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
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <Button 
                          variant="sanctuary" 
                          size="sm"
                          onClick={() => onPlay(result)}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Watch
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
      )}
    </div>
  );
}
