-- ==============================================================================
-- LOFTY LMS: LOCAL TESTING & SPEED-TEST HELPER SNIPPETS
-- Run these in your Supabase SQL Editor during local testing (http://localhost:3000)
-- ==============================================================================

-- ==============================================================================
-- 1. PROMOTE A TEST ACCOUNT TO ADMIN
-- Replace 'admin@example.com' with the email address you signed up with.
-- ==============================================================================
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@example.com';

-- Verify the change:
SELECT id, email, full_name, role, active_session_id
FROM public.profiles
WHERE email = 'admin@example.com';


-- ==============================================================================
-- 2. FAST-FORWARD: IMMEDIATELY UNLOCK DAY 2 (BYPASS 24-HOUR MIDNIGHT WAIT)
-- Sets unlock_at to NOW() for Day 2 lessons so you can test next-day flow right away.
-- ==============================================================================
UPDATE public.lesson_progress lp
SET 
  is_unlocked = true,
  unlock_at = timezone('utc'::text, now())
FROM public.lessons l
WHERE lp.lesson_id = l.id
  AND l.day_number = 2;

-- Alternatively: Unlock ALL scheduled lessons immediately across all courses:
-- UPDATE public.lesson_progress
-- SET is_unlocked = true, unlock_at = timezone('utc'::text, now())
-- WHERE unlock_at > timezone('utc'::text, now());


-- ==============================================================================
-- 3. INSTANTLY APPROVE ALL PENDING ENROLLMENTS
-- Simulates the admin clicking 'Approve' and unlocks Day 1 immediately.
-- ==============================================================================
UPDATE public.enrollments
SET 
  status = 'active',
  approved_at = timezone('utc'::text, now()),
  admin_notes = 'Fast-approved via local testing snippet'
WHERE status = 'pending';


-- ==============================================================================
-- 4. FAST-TRACK 100% VIDEO WATCH ON ALL ENROLLED LESSONS
-- Marks video as 100% watched to immediately unlock quizzes without watching full video.
-- ==============================================================================
UPDATE public.lesson_progress
SET 
  watch_percentage = 100.00,
  video_completed = true,
  video_watched = true,
  quiz_unlocked = true;


-- ==============================================================================
-- 5. RESET QUIZ ATTEMPTS & PROGRESS FOR RE-TESTING
-- Clear your attempts and reset lessons to start fresh on a course:
-- ==============================================================================
-- Replace 'student@example.com' with your test user's email:
/*
DELETE FROM public.quiz_attempts
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'student@example.com');

UPDATE public.lesson_progress
SET 
  watch_percentage = 0.00,
  video_completed = false,
  video_watched = false,
  quiz_unlocked = false,
  quiz_passed = false,
  is_completed = false,
  completed_at = null
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'student@example.com');
*/


-- ==============================================================================
-- 6. INSPECT ACTIVE SINGLE-DEVICE SESSION STATE
-- Shows current session ID stored in database for verifying anti-sharing protection:
-- ==============================================================================
SELECT id, email, role, active_session_id, active_session_token, updated_at
FROM public.profiles
ORDER BY updated_at DESC;


-- ==============================================================================
-- 7. VIEW ALL ISSUED DIGITAL CERTIFICATES
-- ==============================================================================
SELECT certificate_id, student_name, course_title, issued_at, metadata
FROM public.certificates
ORDER BY issued_at DESC;
