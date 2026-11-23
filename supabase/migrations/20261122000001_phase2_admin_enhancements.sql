-- ==============================================================================
-- PHASE 2 MIGRATION: ADMIN ENHANCEMENTS & STORAGE CONFIGURATION
-- ==============================================================================

-- 1. Add admin_notes column to enrollments for rejection reasons / review notes
ALTER TABLE public.enrollments
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 2. Create public storage bucket for course assets (thumbnails, quiz audio, option images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-assets', 'course-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies for course-assets:
-- Public can view course assets
CREATE POLICY "Public read access for course-assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-assets');

-- Admins have full access to upload, update, and delete in course-assets
CREATE POLICY "Admins full access to course-assets"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'course-assets' AND
    public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'course-assets' AND
    public.is_admin()
  );

-- 3. Ensure profiles RLS permits admin to update user roles or view all students
CREATE POLICY "Admins can view all profiles for student management"
  ON public.profiles FOR SELECT
  USING (public.is_admin());
