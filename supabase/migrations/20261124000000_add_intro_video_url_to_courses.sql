-- ==============================================================================
-- MIGRATION: Add intro_video_url to courses table
-- Description: Adds a nullable text column for public/free intro preview video.
-- Accessible to all visitors, guests, and unapproved students.
-- ==============================================================================

ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS intro_video_url TEXT;

COMMENT ON COLUMN public.courses.intro_video_url IS 'Public preview / introductory video URL accessible to guests and unapproved students.';
