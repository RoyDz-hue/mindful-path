import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { EMOTIONS, type EmotionType } from "@/lib/constants";
import { BookOpen, Plus, Calendar, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface JournalEntry {
  id: string;
  title: string | null;
  content: string;
  emotion: EmotionType | null;
  created_at: string;
}

export default function JournalPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [isWriting, setIsWriting] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType>("neutral");

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user]);

  const loadEntries = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("journals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading journals:", error);
    } else {
      setEntries(data || []);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user || !content.trim()) return;
    
    setSaving(true);
    
    const { error } = await supabase.from("journals").insert({
      user_id: user.id,
      title: title.trim() || null,
      content: content.trim(),
      emotion: selectedEmotion,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save journal entry",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Saved",
        description: "Your journal entry has been saved",
      });
      setTitle("");
      setContent("");
      setSelectedEmotion("neutral");
      setIsWriting(false);
      loadEntries();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("journals").delete().eq("id", id);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete entry",
        variant: "destructive",
      });
    } else {
      setEntries(prev => prev.filter(e => e.id !== id));
      toast({ title: "Deleted", description: "Entry removed" });
    }
  };

  const getEmotionData = (emotion: EmotionType | null) => {
    return EMOTIONS.find(e => e.value === emotion) || EMOTIONS.find(e => e.value === "neutral")!;
  };

  return (
    <AppLayout onSignOut={handleSignOut} displayName={user?.user_metadata?.display_name}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Journal</h1>
            <p className="text-muted-foreground mt-1">Reflect on your journey</p>
          </div>
          {!isWriting && (
            <Button variant="sanctuary" onClick={() => setIsWriting(true)}>
              <Plus className="w-5 h-5 mr-2" />
              New Entry
            </Button>
          )}
        </div>

        {/* New Entry Form */}
        {isWriting && (
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                New Journal Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              {/* Emotion Selector */}
              <div>
                <p className="text-sm font-medium mb-3">How are you feeling?</p>
                <div className="flex flex-wrap gap-2">
                  {EMOTIONS.map((emotion) => (
                    <button
                      key={emotion.value}
                      onClick={() => setSelectedEmotion(emotion.value)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all",
                        selectedEmotion === emotion.value
                          ? "bg-primary text-primary-foreground scale-105"
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      <span className="mr-2">{emotion.emoji}</span>
                      {emotion.label}
                    </button>
                  ))}
                </div>
              </div>

              <Textarea
                placeholder="Write your thoughts here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="resize-none"
              />

              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setIsWriting(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="sanctuary" 
                  onClick={handleSave} 
                  disabled={saving || !content.trim()}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Entry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Entries List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : entries.length === 0 ? (
          <Card variant="glass" className="p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-lg mb-2">No entries yet</h3>
            <p className="text-muted-foreground mb-4">
              Start journaling to track your emotional journey
            </p>
            {!isWriting && (
              <Button variant="sanctuary" onClick={() => setIsWriting(true)}>
                <Plus className="w-5 h-5 mr-2" />
                Write Your First Entry
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => {
              const emotionData = getEmotionData(entry.emotion);
              return (
                <Card key={entry.id} variant="glass" className="group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-sm",
                            emotionData.color
                          )}>
                            {emotionData.emoji} {emotionData.label}
                          </span>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(entry.created_at), "MMM d, yyyy")}
                          </span>
                        </div>
                        {entry.title && (
                          <h3 className="font-semibold text-lg mb-1">{entry.title}</h3>
                        )}
                        <p className="text-muted-foreground line-clamp-3">{entry.content}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(entry.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
