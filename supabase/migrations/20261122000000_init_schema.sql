-- ==============================================================================
-- LOFTY ONLINE EDUCATIONAL LMS: COMPLETE SCHEMA DEFINITION
-- Fast, mobile-first LMS for Kids (5-12) & Adults
-- Features: Strict Server-Side Quiz Grading, Next-Day Drip Logic, Single Active Session
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
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

-- 3. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'student',
  avatar_url TEXT,
  -- Single active session token: rotated upon login, validated in Next.js middleware
  active_session_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for session verification performance
CREATE INDEX IF NOT EXISTS idx_profiles_session_token ON public.profiles(id, active_session_token);

-- Helper function: check if caller is an admin
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

-- 4. COURSES TABLE
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

-- 5. LESSONS TABLE (Ordered Day 1, Day 2, etc.)
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

-- 6. QUIZZES TABLE (1-to-1 with Lesson)
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID UNIQUE NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  passing_score_percentage NUMERIC(5, 2) NOT NULL DEFAULT 70.00 CHECK (passing_score_percentage >= 0 AND passing_score_percentage <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. QUIZ QUESTIONS TABLE
-- Supports audio URLs (for kids narration) and image options
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 1,
  question_text TEXT NOT NULL,
  audio_url TEXT, -- Optional audio narration (for Kids 5-12)
  image_url TEXT, -- Optional image illustration
  options JSONB NOT NULL, -- Array of objects: [{"id": "opt_1", "text": "...", "image_url": "..."}]
  correct_option_id TEXT NOT NULL, -- Kept strictly hidden from client-side direct SELECT
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_order ON public.quiz_questions(quiz_id, order_index);

-- 8. ENROLLMENTS TABLE (Payment Receipt Verification Flow)
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status enrollment_status NOT NULL DEFAULT 'pending',
  receipt_url TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_user_course UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(status);

-- 9. LESSON PROGRESS TABLE (Drip Logic + Video 85% requirement)
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  watch_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (watch_percentage >= 0 AND watch_percentage <= 100),
  video_completed BOOLEAN NOT NULL DEFAULT false, -- True when watch_percentage >= 85
  quiz_unlocked BOOLEAN NOT NULL DEFAULT false,   -- Unlocked when video_completed = true
  quiz_passed BOOLEAN NOT NULL DEFAULT false,     -- True when score >= 70%
  is_completed BOOLEAN NOT NULL DEFAULT false,    -- Lesson fully finished
  unlock_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()), -- Next-day midnight drip timestamp
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_enrollment_lesson UNIQUE (enrollment_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_lookup ON public.lesson_progress(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_enrollment ON public.lesson_progress(enrollment_id);

-- 10. QUIZ ATTEMPTS TABLE (Retake History & Server Grading Auditing)
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score_percentage NUMERIC(5, 2) NOT NULL CHECK (score_percentage >= 0 AND score_percentage <= 100),
  passed BOOLEAN NOT NULL,
  answers JSONB NOT NULL, -- Submitted answers: {"question_id": "selected_option_id"}
  attempt_number INTEGER NOT NULL DEFAULT 1,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_lesson ON public.quiz_attempts(user_id, lesson_id);

-- ==============================================================================
-- DATABASE VIEWS FOR SECURITY
-- Sanitized Quiz Questions for Students (Omits correct_option_id so client can't cheat)
-- ==============================================================================
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

-- ==============================================================================
-- AUTOMATIC TRIGGERS & PROCEDURES
-- ==============================================================================

-- Trigger: Automatically create public.profiles row on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'::user_role)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Watch percentage >= 85% unlocks quiz
CREATE OR REPLACE FUNCTION public.handle_watch_progress_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.watch_percentage >= 85.00 THEN
    NEW.video_completed := true;
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

-- Trigger: When Admin approves an enrollment, unlock Day 1 Lesson immediately
CREATE OR REPLACE FUNCTION public.handle_enrollment_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_day1_lesson_id UUID;
BEGIN
  -- Check if status transitioned to 'active'
  IF (OLD.status IS DISTINCT FROM 'active') AND (NEW.status = 'active') THEN
    NEW.approved_at := timezone('utc'::text, now());
    
    -- Find Day 1 lesson for this course
    SELECT id INTO v_day1_lesson_id
    FROM public.lessons
    WHERE course_id = NEW.course_id AND day_number = 1
    LIMIT 1;

    -- If Day 1 lesson exists, initialize progress with immediate unlock
    IF v_day1_lesson_id IS NOT NULL THEN
      INSERT INTO public.lesson_progress (
        enrollment_id,
        lesson_id,
        user_id,
        watch_percentage,
        video_completed,
        quiz_unlocked,
        quiz_passed,
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
        timezone('utc'::text, now()) -- Immediate unlock for Day 1
      )
      ON CONFLICT (enrollment_id, lesson_id) 
      DO UPDATE SET unlock_at = timezone('utc'::text, now());
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enrollment_approval ON public.enrollments;
CREATE TRIGGER trg_enrollment_approval
  BEFORE UPDATE OF status ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.handle_enrollment_approval();

-- Drip Scheduling Function: Called when a student passes a quiz (>= 70%)
-- Marks current lesson complete and schedules next lesson for midnight of next calendar day
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

  -- 3. Calculate next calendar day midnight (00:00:00 UTC)
  v_next_unlock_at := date_trunc('day', timezone('utc'::text, now()) + interval '1 day');

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
      quiz_unlocked,
      quiz_passed,
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
      v_next_unlock_at
    )
    ON CONFLICT (enrollment_id, lesson_id)
    DO UPDATE SET unlock_at = v_next_unlock_at;
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

-- Function: Single Active Session updater
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
    updated_at = timezone('utc'::text, now())
  WHERE id = auth.uid();
END;
$$;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- PROFILES POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Profiles are viewable by owner or admin"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update their own profile (cannot change role)"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (
    public.is_admin() OR 
    (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
  );

-- ------------------------------------------------------------------------------
-- COURSES POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Public courses are viewable by everyone"
  ON public.courses FOR SELECT
  USING (is_published = true OR public.is_admin());

CREATE POLICY "Only admins can insert courses"
  ON public.courses FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update courses"
  ON public.courses FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can delete courses"
  ON public.courses FOR DELETE
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- LESSONS POLICIES
-- ------------------------------------------------------------------------------
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

CREATE POLICY "Only admins can manage lessons"
  ON public.lessons FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- QUIZZES POLICIES
-- ------------------------------------------------------------------------------
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

CREATE POLICY "Only admins can manage quizzes"
  ON public.quizzes FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- QUIZ QUESTIONS POLICIES (Strict Security: correct_option_id is admin-only)
-- Students query questions through student_quiz_questions view or Server Action
-- ------------------------------------------------------------------------------
CREATE POLICY "Admin full access to quiz questions"
  ON public.quiz_questions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

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

-- ------------------------------------------------------------------------------
-- ENROLLMENTS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view own enrollments; admins view all"
  ON public.enrollments FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Students can submit pending enrollment with receipt"
  ON public.enrollments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND 
    status = 'pending' AND 
    receipt_url IS NOT NULL AND 
    transaction_id IS NOT NULL
  );

CREATE POLICY "Only admins can update enrollment status"
  ON public.enrollments FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- LESSON PROGRESS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view own lesson progress; admins view all"
  ON public.lesson_progress FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Students can update watch progress on unlocked lessons"
  ON public.lesson_progress FOR UPDATE
  USING (auth.uid() = user_id AND unlock_at <= timezone('utc'::text, now()))
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins full access to lesson progress"
  ON public.lesson_progress FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- QUIZ ATTEMPTS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view own quiz attempts; admins view all"
  ON public.quiz_attempts FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Quiz attempts inserted by authenticated owner or server"
  ON public.quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- ==============================================================================
-- STORAGE BUCKET CONFIGURATION (payment-receipts)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Students can upload payment receipt to their own folder: payment-receipts/<auth.uid()>/...
CREATE POLICY "Students can upload their own payment receipts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'payment-receipts' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage Policy: Students can view their own receipt
CREATE POLICY "Students can view their own uploaded receipts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'payment-receipts' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      public.is_admin()
    )
  );

-- Storage Policy: Admins can view/manage all receipts
CREATE POLICY "Admins have full access to payment receipts"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'payment-receipts' AND
    public.is_admin()
  );
