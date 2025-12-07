import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, Pause, Play, Clock, AlertTriangle, Maximize2, Minimize2, Download, Loader2 } from "lucide-react";
import { formatTime } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ContentViewerProps {
  url: string;
  title: string;
  remainingSeconds: number;
  userId?: string;
  onClose: () => void;
  onTimeUpdate: (elapsed: number) => void;
  onSessionEnd: (wasAutoStopped: boolean) => void;
}

export function ContentViewer({ 
  url, 
  title, 
  remainingSeconds: initialRemaining,
  userId,
  onClose, 
  onTimeUpdate,
  onSessionEnd 
}: ContentViewerProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(initialRemaining);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [embedError, setEmbedError] = useState(false);
  const [isFallbackLoading, setIsFallbackLoading] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'embed' | 'video' | 'unavailable'>('embed');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const embedCheckRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  // Get embeddable URL for common platforms
  const getEmbedUrl = (originalUrl: string): string => {
    try {
      const urlObj = new URL(originalUrl);
      
      // YouTube
      if (urlObj.hostname.includes("youtube.com") || urlObj.hostname.includes("youtu.be")) {
        let videoId = "";
        if (urlObj.hostname.includes("youtu.be")) {
          videoId = urlObj.pathname.slice(1);
        } else {
          videoId = urlObj.searchParams.get("v") || "";
        }
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
        }
      }
      
      // Vimeo
      if (urlObj.hostname.includes("vimeo.com")) {
        const videoId = urlObj.pathname.split("/").pop();
        if (videoId) {
          return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
        }
      }
      
      // Dailymotion
      if (urlObj.hostname.includes("dailymotion.com")) {
        const videoId = urlObj.pathname.split("/").pop()?.replace("video/", "");
        if (videoId) {
          return `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1`;
        }
      }
      
      return originalUrl;
    } catch {
      return originalUrl;
    }
  };

  const embedUrl = getEmbedUrl(url);

  // Check if this is a known embeddable platform
  const isKnownEmbeddable = (urlString: string): boolean => {
    try {
      const urlObj = new URL(urlString);
      const embeddableDomains = ['youtube.com', 'youtu.be', 'vimeo.com', 'dailymotion.com'];
      return embeddableDomains.some(domain => urlObj.hostname.includes(domain));
    } catch {
      return false;
    }
  };

  // Handle fallback download when embed fails
  const handleFallbackDownload = useCallback(async () => {
    if (!userId || isFallbackLoading) return;
    
    setIsFallbackLoading(true);
    setFallbackMessage("Fetching content securely...");

    try {
      const { data, error } = await supabase.functions.invoke('fallback-downloader', {
        body: { 
          url, 
          user_id: userId,
          remaining_seconds: remainingSeconds 
        }
      });

      if (error) throw error;

      if (data.can_watch && data.play_url) {
        setFallbackUrl(data.play_url);
        setViewMode('video');
        setFallbackMessage(data.reply);
        toast({
          title: "Content Ready",
          description: data.reply,
        });
      } else {
        setViewMode('unavailable');
        setFallbackMessage(data.reply);
        toast({
          title: "Content Unavailable",
          description: data.reply,
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Fallback download error:', error);
      setViewMode('unavailable');
      setFallbackMessage("Couldn't fetch this content. Try another source.");
      toast({
        title: "Fetch Failed", 
        description: "This site has strong protections. Try another source.",
        variant: "default",
      });
    } finally {
      setIsFallbackLoading(false);
    }
  }, [url, userId, remainingSeconds, toast, isFallbackLoading]);

  // Detect embed failures
  useEffect(() => {
    // For non-known platforms, check embed status after a delay
    if (!isKnownEmbeddable(url)) {
      embedCheckRef.current = setTimeout(() => {
        // If iframe hasn't loaded properly, trigger fallback
        if (iframeRef.current) {
          try {
            // Try to access iframe - this will fail for blocked content
            const doc = iframeRef.current.contentDocument;
            if (!doc || doc.body?.innerHTML === '') {
              setEmbedError(true);
            }
          } catch {
            // Cross-origin error means content loaded (possibly blocked by CORS)
            // We'll rely on onerror for actual failures
          }
        }
      }, 5000);
    }

    return () => {
      if (embedCheckRef.current) {
        clearTimeout(embedCheckRef.current);
      }
    };
  }, [url]);

  // Auto-trigger fallback when embed error detected
  useEffect(() => {
    if (embedError && userId && !isFallbackLoading && viewMode === 'embed') {
      handleFallbackDownload();
    }
  }, [embedError, userId, isFallbackLoading, viewMode, handleFallbackDownload]);

  // Timer logic
  useEffect(() => {
    if (!isPaused && remainingSeconds > 0) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => {
          const newElapsed = prev + 1;
          onTimeUpdate(newElapsed);
          return newElapsed;
        });
        setRemainingSeconds(prev => {
          const newRemaining = prev - 1;
          // Show warning at 1 minute remaining
          if (newRemaining === 60 && !showWarning) {
            setShowWarning(true);
          }
          // Auto-stop when time runs out
          if (newRemaining <= 0) {
            onSessionEnd(true);
          }
          return Math.max(0, newRemaining);
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPaused, remainingSeconds, onTimeUpdate, onSessionEnd, showWarning]);

  // Pause video when timer pauses
  useEffect(() => {
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isPaused]);

  const handleClose = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    onSessionEnd(false);
    onClose();
  }, [onClose, onSessionEnd]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleIframeError = () => {
    console.log("Iframe load error detected");
    setEmbedError(true);
  };

  const progressPercent = initialRemaining > 0 
    ? ((initialRemaining - remainingSeconds) / initialRemaining) * 100 
    : 100;

  const isLowTime = remainingSeconds < 120; // Less than 2 minutes

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <Card variant="flat" className="rounded-none border-b border-border/50">
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Traffic light buttons */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleClose}
                  className="w-3 h-3 rounded-full bg-destructive hover:bg-destructive/80 transition-colors"
                />
                <button 
                  onClick={() => setIsPaused(!isPaused)}
                  className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-500/80 transition-colors"
                />
                <button 
                  onClick={toggleFullscreen}
                  className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-500/80 transition-colors"
                />
              </div>
              
              {/* URL bar */}
              <div className="flex-1 max-w-xl">
                <div className="px-4 py-1.5 bg-muted rounded-lg text-sm text-muted-foreground truncate flex items-center gap-2">
                  {viewMode === 'video' && <Download className="w-3 h-3 text-primary" />}
                  {url}
                </div>
              </div>
            </div>

            {/* Timer & Controls */}
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                isLowTime ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
              }`}>
                <Clock className="w-4 h-4" />
                <span className="font-mono font-medium">{formatTime(remainingSeconds)}</span>
              </div>

              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </Button>

              <Button 
                variant="ghost" 
                size="icon"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </Button>

              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-2">
            <Progress value={progressPercent} className="h-1" />
          </div>
        </CardHeader>
      </Card>

      {/* Fallback message banner */}
      {fallbackMessage && viewMode !== 'embed' && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2">
          <div className="flex items-center gap-2 text-primary text-sm">
            {viewMode === 'video' ? (
              <Download className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            <span>{fallbackMessage}</span>
          </div>
        </div>
      )}

      {/* Low time warning */}
      {showWarning && remainingSeconds > 0 && (
        <div className="bg-sanctuary-coral/10 border-b border-sanctuary-coral/20 px-4 py-2">
          <div className="flex items-center gap-2 text-sanctuary-coral text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Less than {Math.ceil(remainingSeconds / 60)} minute(s) remaining. Consider wrapping up.</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-auto text-sanctuary-coral"
              onClick={() => setShowWarning(false)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Paused overlay */}
      {isPaused && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card variant="glass" className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center">
              <Pause className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-display font-semibold mb-2">Session Paused</h3>
            <p className="text-muted-foreground mb-4">Timer paused at {formatTime(remainingSeconds)}</p>
            <Button variant="sanctuary" onClick={() => setIsPaused(false)}>
              <Play className="w-4 h-4 mr-2" />
              Resume
            </Button>
          </Card>
        </div>
      )}

      {/* Fallback loading overlay */}
      {isFallbackLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card variant="glass" className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h3 className="text-xl font-display font-semibold mb-2">Fetching Content</h3>
            <p className="text-muted-foreground">{fallbackMessage || "Site blocked direct viewing. Downloading securely..."}</p>
          </Card>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 bg-black relative">
        {viewMode === 'embed' && (
          <iframe
            ref={iframeRef}
            src={embedUrl}
            title={title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
            onError={handleIframeError}
          />
        )}

        {viewMode === 'video' && fallbackUrl && (
          <video
            ref={videoRef}
            src={fallbackUrl}
            className="w-full h-full"
            controls
            autoPlay
            playsInline
          />
        )}

        {viewMode === 'unavailable' && (
          <div className="w-full h-full flex items-center justify-center">
            <Card variant="glass" className="p-8 text-center max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2">Content Unavailable</h3>
              <p className="text-muted-foreground mb-4">
                {fallbackMessage || "This site has strong protections. Try another source."}
              </p>
              <p className="text-sm text-primary mb-4">
                You still have {Math.ceil(remainingSeconds / 60)} minutes today.
              </p>
              <Button variant="sanctuary" onClick={handleClose}>
                Try Another Source
              </Button>
            </Card>
          </div>
        )}
      </div>

      {/* Footer with session info */}
      <Card variant="flat" className="rounded-none border-t border-border/50">
        <CardContent className="py-2 px-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Session time: {formatTime(elapsedSeconds)}</span>
            <span className="truncate max-w-md">{title}</span>
            <span>
              {viewMode === 'video' ? 'Downloaded content mode' : 'Controlled viewing mode active'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
