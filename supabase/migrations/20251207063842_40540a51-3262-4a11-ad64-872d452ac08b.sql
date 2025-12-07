-- Create saved content table for bookmarking found content
CREATE TABLE public.saved_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  description TEXT,
  content_type TEXT DEFAULT 'video',
  source_site TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_content
CREATE POLICY "Users can view own saved content" ON public.saved_content FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved content" ON public.saved_content FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved content" ON public.saved_content FOR DELETE USING (auth.uid() = user_id);