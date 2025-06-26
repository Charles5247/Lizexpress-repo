-- Create items bucket for item images
INSERT INTO storage.buckets (id, name, public) VALUES ('items', 'items', true);

-- Set up RLS policies for items bucket
CREATE POLICY "Item images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'items');

CREATE POLICY "Users can upload item images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'items' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their item images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'items' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their item images" ON storage.objects
  FOR DELETE USING (bucket_id = 'items' AND auth.uid()::text = (storage.foldername(name))[1]);