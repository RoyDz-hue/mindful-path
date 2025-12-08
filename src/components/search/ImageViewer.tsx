import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, Bookmark, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Loader2, ImageOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ImageResult {
  title: string;
  url: string;
  platform: string;
  thumbnail?: string;
  description: string;
}

interface ImageViewerProps {
  images: ImageResult[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export function ImageViewer({ images, initialIndex, isOpen, onClose, userId }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const currentImage = images[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setZoom(1);
    setIsLoading(true);
    setHasError(false);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setZoom(1);
    setIsLoading(true);
    setHasError(false);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));

  const handleDownload = async () => {
    try {
      const response = await fetch(currentImage.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const extension = currentImage.url.split(".").pop()?.split("?")[0] || "jpg";
      a.download = `${currentImage.title.replace(/[^a-z0-9]/gi, "_")}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: "Downloaded", description: "Image saved to device." });
    } catch {
      window.open(currentImage.url, "_blank");
      toast({ title: "Opening Image", description: "Right-click to save." });
    }
  };

  const handleSaveToDatabase = async () => {
    if (!userId) {
      toast({ title: "Sign in required", description: "Please sign in to save content.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from("saved_content").insert({
        user_id: userId,
        title: currentImage.title,
        url: currentImage.url,
        thumbnail_url: currentImage.thumbnail || currentImage.url,
        description: currentImage.description,
        content_type: "image",
        source_site: currentImage.platform,
      });

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Already Saved", description: "This image is already in your collection." });
        } else {
          throw error;
        }
      } else {
        toast({ title: "Saved to Collection", description: "Image added to your saved content." });
      }
    } catch (error) {
      toast({ title: "Save Failed", description: "Unable to save image.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") handlePrevious();
    if (e.key === "ArrowRight") handleNext();
    if (e.key === "Escape") onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-background/95 backdrop-blur-sm border-0"
        onKeyDown={handleKeyDown}
      >
        {/* Header Controls */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-background/80 to-transparent">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {images.length}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={zoom <= 0.5}>
              <ZoomOut className="w-5 h-5" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={zoom >= 3}>
              <ZoomIn className="w-5 h-5" />
            </Button>
            
            <div className="w-px h-6 bg-border mx-2" />
            
            <Button variant="ghost" size="icon" onClick={handleDownload}>
              <Download className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSaveToDatabase} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bookmark className="w-5 h-5" />}
            </Button>
            
            <div className="w-px h-6 bg-border mx-2" />
            
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-background/50 hover:bg-background/80"
              onClick={handlePrevious}
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-background/50 hover:bg-background/80"
              onClick={handleNext}
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          </>
        )}

        {/* Image Container */}
        <div className="w-full h-full flex items-center justify-center overflow-auto p-16">
          {isLoading && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
          )}
          
          {hasError ? (
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
              <ImageOff className="w-16 h-16" />
              <p>Failed to load image</p>
              <Button variant="outline" onClick={() => window.open(currentImage.url, "_blank")}>
                Open in New Tab
              </Button>
            </div>
          ) : (
            <img
              src={currentImage.url}
              alt={currentImage.title}
              style={{ transform: `scale(${zoom})` }}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              onLoad={() => setIsLoading(false)}
              onError={() => { setIsLoading(false); setHasError(true); }}
            />
          )}
        </div>

        {/* Footer Info */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-background/80 to-transparent">
          <h3 className="font-medium text-lg truncate">{currentImage.title}</h3>
          <p className="text-sm text-muted-foreground truncate">{currentImage.platform}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
