-- ==============================================================================
-- PHASE 4 MIGRATION: LEARNING ENGINE, WATCH TRACKER & KARACHI DRIP SCHEDULER
-- ==============================================================================

-- 1. Add is_unlocked and video_watched to lesson_progress
ALTER TABLE public.lesson_progress
ADD COLUMN IF NOT EXISTS is_unlocked BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS video_watched BOOLEAN NOT NULL DEFAULT false;

-- Keep video_watched and video_completed in sync
UPDATE public.lesson_progress
SET video_watched = video_completed
WHERE video_watched IS FALSE AND video_completed IS TRUE;

-- 2. Add aliases in quiz_attempts for student_id, score, created_at
ALTER TABLE public.quiz_attempts
ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS score NUMERIC(5, 2),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- Sync existing rows
UPDATE public.quiz_attempts
SET 
  student_id = user_id,
  score = score_percentage,
  created_at = submitted_at
WHERE student_id IS NULL;

-- 3. Trigger to keep video_watched and quiz_unlocked updated when watch_percentage >= 85
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
