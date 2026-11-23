-- ==============================================================================
-- LOFTY ONLINE EDUCATIONAL LMS: CONSOLIDATED DATABASE SETUP SCRIPT
-- Combines Phases 1–5: Database Schema, Security (RLS), Triggers, & Storage
-- Idempotent: Can be safely run once in Supabase SQL Editor on a new or existing project
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. ENUMS
-- ------------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'student');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE course_category AS ENUM ('kids', 'adults');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE enrollment_status AS ENUM ('pending', 'active', 'rejected', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 3. PROFILES TABLE (Linked to auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'student',
  avatar_url TEXT,
  active_session_token TEXT,
  active_session_id TEXT, -- Anti-Account Sharing Single Device Session
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure columns exist if table was previously created
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_session_token TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_session_id TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_session_token ON public.profiles(id, active_session_token);
CREATE INDEX IF NOT EXISTS idx_profiles_active_session_id ON public.profiles(id, active_session_id);

-- Helper function: Check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ------------------------------------------------------------------------------
-- 4. COURSES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category course_category NOT NULL,
  thumbnail_url TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_published ON public.courses(is_published);

-- ------------------------------------------------------------------------------
-- 5. LESSONS TABLE (Day-by-Day sequential curriculum)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  day_number INTEGER NOT NULL CHECK (day_number > 0),
  video_url TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_course_day UNIQUE (course_id, day_number)
);

CREATE INDEX IF NOT EXISTS idx_lessons_course_day ON public.lessons(course_id, day_number);

-- ------------------------------------------------------------------------------
-- 6. QUIZZES TABLE (1-to-1 with Lesson)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID UNIQUE NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  passing_score_percentage NUMERIC(5, 2) NOT NULL DEFAULT 70.00 CHECK (passing_score_percentage >= 0 AND passing_score_percentage <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 7. QUIZ QUESTIONS TABLE (Supports Kids Audio & Image Options)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 1,
  question_text TEXT NOT NULL,
  audio_url TEXT, -- Optional audio narration (for Kids 5-12)
  image_url TEXT, -- Optional illustration
  options JSONB NOT NULL, -- Array of objects: [{"id": "opt_1", "text": "...", "image_url": "..."}]
  correct_option_id TEXT NOT NULL, -- Server-only: hidden from student direct client SELECT
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_order ON public.quiz_questions(quiz_id, order_index);

-- ------------------------------------------------------------------------------
-- 8. ENROLLMENTS TABLE (Fee Submission & Approval Queue)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status enrollment_status NOT NULL DEFAULT 'pending',
  receipt_url TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_user_course UNIQUE (user_id, course_id)
);

ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS admin_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_enrollments_user ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(status);

-- ------------------------------------------------------------------------------
-- 9. LESSON PROGRESS TABLE (Drip Logic + Video 85% requirement)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  watch_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (watch_percentage >= 0 AND watch_percentage <= 100),
  video_completed BOOLEAN NOT NULL DEFAULT false, -- True when watch_percentage >= 85
  video_watched BOOLEAN NOT NULL DEFAULT false,   -- Alias kept synchronized
  quiz_unlocked BOOLEAN NOT NULL DEFAULT false,   -- Unlocked when video_completed = true
  quiz_passed BOOLEAN NOT NULL DEFAULT false,     -- True when quiz score >= 70%
  is_unlocked BOOLEAN NOT NULL DEFAULT true,      -- Controls access along with unlock_at
  is_completed BOOLEAN NOT NULL DEFAULT false,    -- Lesson finished
  unlock_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()), -- Next-day midnight drip timestamp
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_enrollment_lesson UNIQUE (enrollment_id, lesson_id)
);

ALTER TABLE public.lesson_progress ADD COLUMN IF NOT EXISTS is_unlocked BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.lesson_progress ADD COLUMN IF NOT EXISTS video_watched BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_lesson_progress_lookup ON public.lesson_progress(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_enrollment ON public.lesson_progress(enrollment_id);

-- ------------------------------------------------------------------------------
-- 10. QUIZ ATTEMPTS TABLE (Assessment History & Retake Log)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  score NUMERIC(5, 2),
  score_percentage NUMERIC(5, 2) NOT NULL CHECK (score_percentage >= 0 AND score_percentage <= 100),
  passed BOOLEAN NOT NULL,
  answers JSONB NOT NULL,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS score NUMERIC(5, 2);
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_lesson ON public.quiz_attempts(user_id, lesson_id);

-- ------------------------------------------------------------------------------
-- 11. CERTIFICATES TABLE (Official Verifiable Credentials)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id TEXT UNIQUE NOT NULL, -- e.g. LOFTY-CERT-2026-XXXXX
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

-- ------------------------------------------------------------------------------
-- 12. DATABASE VIEWS
-- Sanitized student quiz question view (Hides correct_option_id from client)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.student_quiz_questions AS
SELECT
  qq.id,
  qq.quiz_id,
  qq.order_index,
  qq.question_text,
  qq.audio_url,
  qq.image_url,
  qq.options,
  qq.created_at
FROM public.quiz_questions qq;

-- ------------------------------------------------------------------------------
-- 13. AUTOMATED TRIGGERS & BUSINESS LOGIC PROCEDURES
-- ------------------------------------------------------------------------------

-- Trigger A: Automatically insert/update profile on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'::user_role)
  )
  ON CONFLICT (id) DO UPDATE SET
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger B: 85% Video Watch Progress unlocks Quiz
CREATE OR REPLACE FUNCTION public.handle_watch_progress_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.watch_percentage >= 85.00 THEN
    NEW.video_completed := true;
    NEW.video_watched := true;
    NEW.quiz_unlocked := true;
  END IF;
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_watch_progress_update ON public.lesson_progress;
CREATE TRIGGER trg_watch_progress_update
  BEFORE INSERT OR UPDATE OF watch_percentage ON public.lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_watch_progress_update();

-- Trigger C: Admin Approval unlocks Day 1 Lesson Immediately
CREATE OR REPLACE FUNCTION public.handle_enrollment_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_day1_lesson_id UUID;
BEGIN
  -- When enrollment transitions to 'active'
  IF (OLD.status IS DISTINCT FROM 'active') AND (NEW.status = 'active') THEN
    NEW.approved_at := timezone('utc'::text, now());
    
    -- Find Day 1 lesson for this course
    SELECT id INTO v_day1_lesson_id
    FROM public.lessons
    WHERE course_id = NEW.course_id AND day_number = 1
    LIMIT 1;

    -- If Day 1 exists, initialize progress with immediate unlock
    IF v_day1_lesson_id IS NOT NULL THEN
      INSERT INTO public.lesson_progress (
        enrollment_id,
        lesson_id,
        user_id,
        watch_percentage,
        video_completed,
        video_watched,
        quiz_unlocked,
        quiz_passed,
        is_unlocked,
        is_completed,
        unlock_at
      ) VALUES (
        NEW.id,
        v_day1_lesson_id,
        NEW.user_id,
        0.00,
        false,
        false,
        false,
        false,
        true,
        false,
        timezone('utc'::text, now()) -- Immediate unlock for Day 1
      )
      ON CONFLICT (enrollment_id, lesson_id) 
      DO UPDATE SET 
        is_unlocked = true,
        unlock_at = timezone('utc'::text, now());
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enrollment_approval ON public.enrollments;
CREATE TRIGGER trg_enrollment_approval
  BEFORE UPDATE OF status ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.handle_enrollment_approval();

-- Procedure: Complete Lesson and Schedule Next-Day Drip (12:00 AM Midnight PKT)
CREATE OR REPLACE FUNCTION public.complete_lesson_and_schedule_next(
  p_enrollment_id UUID,
  p_lesson_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course_id UUID;
  v_current_day INT;
  v_next_lesson_id UUID;
  v_next_unlock_at TIMESTAMPTZ;
  v_result JSONB;
BEGIN
  -- 1. Fetch current lesson info
  SELECT course_id, day_number INTO v_course_id, v_current_day
  FROM public.lessons
  WHERE id = p_lesson_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lesson not found';
  END IF;

  -- 2. Mark current lesson progress complete
  UPDATE public.lesson_progress
  SET 
    quiz_passed = true,
    is_completed = true,
    completed_at = timezone('utc'::text, now()),
    updated_at = timezone('utc'::text, now())
  WHERE enrollment_id = p_enrollment_id AND lesson_id = p_lesson_id;

  -- 3. Calculate next day midnight in Asia/Karachi (UTC+5)
  -- Next midnight PKT converted back to UTC
  v_next_unlock_at := date_trunc('day', (timezone('utc'::text, now()) + interval '5 hours' + interval '1 day')) - interval '5 hours';

  -- 4. Find next day lesson (day_number + 1)
  SELECT id INTO v_next_lesson_id
  FROM public.lessons
  WHERE course_id = v_course_id AND day_number = (v_current_day + 1)
  LIMIT 1;

  -- 5. If next lesson exists, schedule its unlock timestamp
  IF v_next_lesson_id IS NOT NULL THEN
    INSERT INTO public.lesson_progress (
      enrollment_id,
      lesson_id,
      user_id,
      watch_percentage,
      video_completed,
      video_watched,
      quiz_unlocked,
      quiz_passed,
      is_unlocked,
      is_completed,
      unlock_at
    ) VALUES (
      p_enrollment_id,
      v_next_lesson_id,
      p_user_id,
      0.00,
      false,
      false,
      false,
      false,
      true,
      false,
      v_next_unlock_at
    )
    ON CONFLICT (enrollment_id, lesson_id)
    DO UPDATE SET 
      is_unlocked = true,
      unlock_at = v_next_unlock_at;
  END IF;

  v_result := jsonb_build_object(
    'success', true,
    'current_completed', true,
    'next_lesson_id', v_next_lesson_id,
    'next_unlock_at', v_next_unlock_at
  );

  RETURN v_result;
END;
$$;

-- Procedure: Update Single Active Session Token
CREATE OR REPLACE FUNCTION public.update_active_session(
  p_session_token TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    active_session_token = p_session_token,
    active_session_id = p_session_token,
    updated_at = timezone('utc'::text, now())
  WHERE id = auth.uid();
END;
$$;

-- ------------------------------------------------------------------------------
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Profiles are viewable by owner or admin" ON public.profiles;
CREATE POLICY "Profiles are viewable by owner or admin"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (
    public.is_admin() OR 
    (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
  );

DROP POLICY IF EXISTS "Admins can view all profiles for student management" ON public.profiles;
CREATE POLICY "Admins can view all profiles for student management"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- Courses Policies
DROP POLICY IF EXISTS "Public courses are viewable by everyone" ON public.courses;
CREATE POLICY "Public courses are viewable by everyone"
  ON public.courses FOR SELECT
  USING (is_published = true OR public.is_admin());

DROP POLICY IF EXISTS "Only admins can insert courses" ON public.courses;
CREATE POLICY "Only admins can insert courses"
  ON public.courses FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Only admins can update courses" ON public.courses;
CREATE POLICY "Only admins can update courses"
  ON public.courses FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Only admins can delete courses" ON public.courses;
CREATE POLICY "Only admins can delete courses"
  ON public.courses FOR DELETE
  USING (public.is_admin());

-- Lessons Policies
DROP POLICY IF EXISTS "Lessons viewable by enrolled active students or admins" ON public.lessons;
CREATE POLICY "Lessons viewable by enrolled active students or admins"
  ON public.lessons FOR SELECT
  USING (
    public.is_admin() OR 
    (
      is_published = true AND EXISTS (
        SELECT 1 FROM public.enrollments e
        WHERE e.course_id = lessons.course_id
          AND e.user_id = auth.uid()
          AND e.status = 'active'
      )
    )
  );

DROP POLICY IF EXISTS "Only admins can manage lessons" ON public.lessons;
CREATE POLICY "Only admins can manage lessons"
  ON public.lessons FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Quizzes Policies
DROP POLICY IF EXISTS "Quizzes viewable by active enrolled students or admins" ON public.quizzes;
CREATE POLICY "Quizzes viewable by active enrolled students or admins"
  ON public.quizzes FOR SELECT
  USING (
    public.is_admin() OR 
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.enrollments e ON e.course_id = l.course_id
      WHERE l.id = quizzes.lesson_id
        AND e.user_id = auth.uid()
        AND e.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Only admins can manage quizzes" ON public.quizzes;
CREATE POLICY "Only admins can manage quizzes"
  ON public.quizzes FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Quiz Questions Policies (correct_option_id hidden from students)
DROP POLICY IF EXISTS "Admin full access to quiz questions" ON public.quiz_questions;
CREATE POLICY "Admin full access to quiz questions"
  ON public.quiz_questions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Enrolled students can read questions for unlocked lessons" ON public.quiz_questions;
CREATE POLICY "Enrolled students can read questions for unlocked lessons"
  ON public.quiz_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.lesson_progress lp ON lp.lesson_id = q.lesson_id
      WHERE q.id = quiz_questions.quiz_id
        AND lp.user_id = auth.uid()
        AND lp.quiz_unlocked = true
        AND lp.unlock_at <= timezone('utc'::text, now())
    )
  );

-- Enrollments Policies
DROP POLICY IF EXISTS "Users can view own enrollments; admins view all" ON public.enrollments;
CREATE POLICY "Users can view own enrollments; admins view all"
  ON public.enrollments FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Students can submit pending enrollment with receipt" ON public.enrollments;
CREATE POLICY "Students can submit pending enrollment with receipt"
  ON public.enrollments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND 
    status = 'pending' AND 
    receipt_url IS NOT NULL AND 
    transaction_id IS NOT NULL
  );

DROP POLICY IF EXISTS "Only admins can update enrollment status" ON public.enrollments;
CREATE POLICY "Only admins can update enrollment status"
  ON public.enrollments FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Lesson Progress Policies
DROP POLICY IF EXISTS "Users can view own lesson progress; admins view all" ON public.lesson_progress;
CREATE POLICY "Users can view own lesson progress; admins view all"
  ON public.lesson_progress FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Students can update watch progress on unlocked lessons" ON public.lesson_progress;
CREATE POLICY "Students can update watch progress on unlocked lessons"
  ON public.lesson_progress FOR UPDATE
  USING (
    auth.uid() = user_id AND 
    is_unlocked = true AND 
    unlock_at <= timezone('utc'::text, now())
  )
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins full access to lesson progress" ON public.lesson_progress;
CREATE POLICY "Admins full access to lesson progress"
  ON public.lesson_progress FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Quiz Attempts Policies
DROP POLICY IF EXISTS "Users can view own quiz attempts; admins view all" ON public.quiz_attempts;
CREATE POLICY "Users can view own quiz attempts; admins view all"
  ON public.quiz_attempts FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = student_id OR public.is_admin());

DROP POLICY IF EXISTS "Quiz attempts inserted by authenticated owner or server" ON public.quiz_attempts;
CREATE POLICY "Quiz attempts inserted by authenticated owner or server"
  ON public.quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- Certificates Policies
DROP POLICY IF EXISTS "Public certificate verification" ON public.certificates;
CREATE POLICY "Public certificate verification"
  ON public.certificates FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin manage certificates" ON public.certificates;
CREATE POLICY "Admin manage certificates"
  ON public.certificates FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 15. STORAGE BUCKET CONFIGURATION & POLICIES
-- Configures: course-assets, thumbnails, quiz-media, receipts, payment-receipts
-- ------------------------------------------------------------------------------

-- Public Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('course-assets', 'course-assets', true),
  ('thumbnails', 'thumbnails', true),
  ('quiz-media', 'quiz-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Private Buckets (Payment Receipts)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('receipts', 'receipts', false),
  ('payment-receipts', 'payment-receipts', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Storage Policies for Public Buckets ('course-assets', 'thumbnails', 'quiz-media')
DROP POLICY IF EXISTS "Public read access for public asset buckets" ON storage.objects;
CREATE POLICY "Public read access for public asset buckets"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('course-assets', 'thumbnails', 'quiz-media'));

DROP POLICY IF EXISTS "Admins full access to public asset buckets" ON storage.objects;
CREATE POLICY "Admins full access to public asset buckets"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id IN ('course-assets', 'thumbnails', 'quiz-media') AND
    public.is_admin()
  )
  WITH CHECK (
    bucket_id IN ('course-assets', 'thumbnails', 'quiz-media') AND
    public.is_admin()
  );

-- Storage Policies for Private Buckets ('receipts', 'payment-receipts')
DROP POLICY IF EXISTS "Students can upload receipts to private buckets" ON storage.objects;
CREATE POLICY "Students can upload receipts to private buckets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id IN ('receipts', 'payment-receipts') AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Students can view own receipts in private buckets" ON storage.objects;
CREATE POLICY "Students can view own receipts in private buckets"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id IN ('receipts', 'payment-receipts') AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      public.is_admin()
    )
  );

DROP POLICY IF EXISTS "Admins have full access to private receipt buckets" ON storage.objects;
CREATE POLICY "Admins have full access to private receipt buckets"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id IN ('receipts', 'payment-receipts') AND
    public.is_admin()
  );
