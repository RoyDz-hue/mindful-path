import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, Pause, Play, Clock, AlertTriangle, Maximize2, Minimize2 } from "lucide-react";
import { formatTime } from "@/lib/constants";

interface ContentViewerProps {
  url: string;
  title: string;
  remainingSeconds: number;
  onClose: () => void;
  onTimeUpdate: (elapsed: number) => void;
  onSessionEnd: (wasAutoStopped: boolean) => void;
}

export function ContentViewer({ 
  url, 
  title, 
  remainingSeconds: initialRemaining,
  onClose, 
  onTimeUpdate,
  onSessionEnd 
}: ContentViewerProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(initialRemaining);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
                <div className="px-4 py-1.5 bg-muted rounded-lg text-sm text-muted-foreground truncate">
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

      {/* Content iframe */}
      <div className="flex-1 bg-black">
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
        />
      </div>

      {/* Footer with session info */}
      <Card variant="flat" className="rounded-none border-t border-border/50">
        <CardContent className="py-2 px-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Session time: {formatTime(elapsedSeconds)}</span>
            <span className="truncate max-w-md">{title}</span>
            <span>Controlled viewing mode active</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
