-- Create storage bucket for private video library
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('private-library', 'private-library', false, 524288000, ARRAY['video/mp4', 'video/webm', 'video/quicktime'])
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Users can only access files in their own folder (user_id prefix)
CREATE POLICY "User private library select" ON storage.objects
FOR SELECT USING (bucket_id = 'private-library' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "User private library insert" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'private-library' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "User private library update" ON storage.objects
FOR UPDATE USING (bucket_id = 'private-library' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "User private library delete" ON storage.objects
FOR DELETE USING (bucket_id = 'private-library' AND auth.uid()::text = (storage.foldername(name))[1]);