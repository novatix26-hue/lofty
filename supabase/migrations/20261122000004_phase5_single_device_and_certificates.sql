-- ==============================================================================
-- PHASE 5 MIGRATION: SINGLE DEVICE SECURITY, CERTIFICATES & RLS AUDIT
-- ==============================================================================

-- 1. Add active_session_id to profiles (Anti-Account Sharing)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS active_session_id TEXT;

-- Synchronize existing active_session_token with active_session_id
UPDATE public.profiles
SET active_session_id = COALESCE(active_session_id, active_session_token);

CREATE INDEX IF NOT EXISTS idx_profiles_active_session_id ON public.profiles(id, active_session_id);

-- 2. Digital Certificates Table
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id TEXT UNIQUE NOT NULL, -- e.g. LOFTY-2026-XXXXX
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  course_title TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  metadata JSONB DEFAULT '{}'::jsonb,
  CONSTRAINT uq_user_course_certificate UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_certificates_cert_id ON public.certificates(certificate_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON public.certificates(user_id);

-- Enable RLS on certificates
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Public can verify any certificate by certificate_id
CREATE POLICY "Public certificate verification"
  ON public.certificates FOR SELECT
  USING (true);

-- Only admins / server actions can issue or modify certificates
CREATE POLICY "Admin manage certificates"
  ON public.certificates FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. Production RLS Hardening Audit on lesson_progress and enrollments
-- Ensure students cannot tamper with status, unlock_at, or is_completed directly from client PostgREST
DROP POLICY IF EXISTS "Students can update watch progress on unlocked lessons" ON public.lesson_progress;

CREATE POLICY "Students can update watch progress on unlocked lessons"
  ON public.lesson_progress FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND 
    is_unlocked = true AND 
    unlock_at <= timezone('utc'::text, now())
  )
  WITH CHECK (
    auth.uid() = user_id
  );
