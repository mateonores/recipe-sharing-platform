-- Storage Setup for Recipe Images
-- Run these commands in your Supabase SQL Editor after creating the 'recipe-images' bucket

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view images (public read access)
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT 
USING (bucket_id = 'recipe-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images" ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'recipe-images' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own images
-- This policy checks if the user ID matches the folder name in the path
CREATE POLICY "Users can update own images" ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'recipe-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own images
-- This policy checks if the user ID matches the folder name in the path
CREATE POLICY "Users can delete own images" ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'recipe-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Note: Make sure to create the 'recipe-images' bucket in the Supabase Storage dashboard
-- and set it to Public before running these policies. 