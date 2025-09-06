
-- Create storage bucket for uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']
);

-- Create policies for the uploads bucket with enhanced security

-- Allow public read access to uploaded files (for logos, favicons, etc.)
CREATE POLICY "Public read access for uploads" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'uploads');

-- Allow authenticated users to upload files (with size restrictions handled by bucket config)
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] IN ('logos', 'favicons', 'branding')
);

-- Users can only update their own uploads OR admins can update any upload
CREATE POLICY "Users can update own uploads or admins can update any" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'uploads' 
  AND (
    owner = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
);

-- Users can only delete their own uploads OR admins can delete any upload
CREATE POLICY "Users can delete own uploads or admins can delete any" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'uploads' 
  AND (
    owner = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
);

-- Create organized folder structure for different types of uploads
-- This is handled by the application logic, but we can document it here:
-- /uploads/logos/     - Company logos (admin only via application logic)
-- /uploads/favicons/  - Website favicons (admin only via application logic)
-- /uploads/branding/  - General branding assets (admin only via application logic)
