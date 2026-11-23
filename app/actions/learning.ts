'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isPlaceholderConfig } from '@/lib/supabase/config';
import { getNextKarachiMidnight, isLessonUnlocked } from '@/lib/learning/drip';
import { revalidatePath } from 'next/cache';

/**
 * Marks video watched once student watches >= 85% of duration.
 * Unlocks the quiz for the current lesson.
 */
export async function markVideoWatched(lessonId: string) {
  try {
    if (isPlaceholderConfig() || lessonId.includes('demo')) {
      return {
        success: true,
        quizUnlocked: true,
        videoWatched: true,
      };
    }
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    const admin = createAdminClient();

    // 1. Fetch lesson & course
    const { data: lesson, error: lessonError } = await admin
      .from('lessons')
      .select('id, course_id, day_number')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return { success: false, error: 'Lesson not found' };
    }

    // 2. Verify active enrollment
    const { data: enrollment, error: enrollmentError } = await admin
      .from('enrollments')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('course_id', lesson.course_id)
      .single();

    if (enrollmentError || !enrollment || enrollment.status !== 'active') {
      return { success: false, error: 'No active enrollment found for this course' };
    }

    // 3. Update or create lesson progress with video_watched = true, quiz_unlocked = true
    const { data: updatedProgress, error: progressError } = await admin
      .from('lesson_progress')
      .upsert(
        {
          enrollment_id: enrollment.id,
          lesson_id: lesson.id,
          user_id: user.id,
          video_watched: true,
          video_completed: true,
          quiz_unlocked: true,
          watch_percentage: 100.0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'enrollment_id,lesson_id' }
      )
      .select()
      .single();

    if (progressError) {
      return { success: false, error: progressError.message };
    }

    revalidatePath(`/learn/${lesson.course_id}`);
    return {
      success: true,
      quizUnlocked: true,
      videoWatched: true,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update video watch status' };
  }
}

export interface QuizSubmissionResponse {
  success: boolean;
  passed: boolean;
  score: number;
  correctCount: number;
  totalQuestions: number;
  nextLessonUnlockAt?: string | null;
  nextLessonDay?: number | null;
  error?: string;
}

/**
 * Server-Side 70% Quiz Grading & Asia/Karachi Next-Day Drip Unlocker
 * Never leaks correct answers to the browser.
 */
export async function submitQuiz(
  lessonId: string,
  answers: Record<string, string>
): Promise<QuizSubmissionResponse> {
  try {
    if (isPlaceholderConfig() || lessonId.includes('demo')) {
      const tomorrowMidnight = getNextKarachiMidnight();
      return {
        success: true,
        passed: true,
        score: 100,
        correctCount: 2,
        totalQuestions: 2,
        nextLessonDay: 2,
        nextLessonUnlockAt: tomorrowMidnight.toISOString(),
      };
    }
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, passed: false, score: 0, correctCount: 0, totalQuestions: 0, error: 'Unauthorized' };
    }

    const admin = createAdminClient();

    // 1. Fetch lesson details
    const { data: lesson, error: lessonError } = await admin
      .from('lessons')
      .select('id, course_id, day_number, title')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return { success: false, passed: false, score: 0, correctCount: 0, totalQuestions: 0, error: 'Lesson not found' };
    }

    // 2. Verify active enrollment
    const { data: enrollment, error: enrollmentError } = await admin
      .from('enrollments')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('course_id', lesson.course_id)
      .single();

    if (enrollmentError || !enrollment || enrollment.status !== 'active') {
      return { success: false, passed: false, score: 0, correctCount: 0, totalQuestions: 0, error: 'Active enrollment required' };
    }

    // 3. Verify lesson progress & unlock status
    const { data: progress } = await admin
      .from('lesson_progress')
      .select('id, is_unlocked, unlock_at, video_watched, video_completed, quiz_unlocked')
      .eq('enrollment_id', enrollment.id)
      .eq('lesson_id', lesson.id)
      .single();

    if (!progress || !isLessonUnlocked(progress.unlock_at, progress.is_unlocked)) {
      return { success: false, passed: false, score: 0, correctCount: 0, totalQuestions: 0, error: 'This lesson is currently locked' };
    }

    // Check that video was watched (>= 85%)
    if (!progress.video_watched && !progress.video_completed && !progress.quiz_unlocked) {
      return {
        success: false,
        passed: false,
        score: 0,
        correctCount: 0,
        totalQuestions: 0,
        error: 'Please watch at least 85% of the video lesson before submitting the quiz',
      };
    }

    // 4. Fetch quiz and secret correct answers strictly on server
    const { data: quiz, error: quizError } = await admin
      .from('quizzes')
      .select('id')
      .eq('lesson_id', lesson.id)
      .single();

    if (quizError || !quiz) {
      return { success: false, passed: false, score: 0, correctCount: 0, totalQuestions: 0, error: 'Quiz not found for this lesson' };
    }

    const { data: questions, error: qError } = await admin
      .from('quiz_questions')
      .select('id, correct_option_id')
      .eq('quiz_id', quiz.id);

    if (qError || !questions || questions.length === 0) {
      return { success: false, passed: false, score: 0, correctCount: 0, totalQuestions: 0, error: 'No questions in this quiz' };
    }

    // 5. Evaluate Score strictly on server
    const totalQuestions = questions.length;
    let correctCount = 0;

    for (const q of questions) {
      const selected = answers[q.id];
      if (selected && selected === q.correct_option_id) {
        correctCount++;
      }
    }

    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= 70;

    // 6. Record quiz attempt for auditing
    const { count: prevAttempts } = await admin
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', quiz.id)
      .eq('user_id', user.id);

    const attemptNumber = (prevAttempts || 0) + 1;
    const nowIso = new Date().toISOString();

    await admin.from('quiz_attempts').insert({
      quiz_id: quiz.id,
      lesson_id: lesson.id,
      enrollment_id: enrollment.id,
      user_id: user.id,
      student_id: user.id,
      score: score,
      score_percentage: score,
      passed: passed,
      answers: answers,
      attempt_number: attemptNumber,
      submitted_at: nowIso,
      created_at: nowIso,
    });

    let nextLessonUnlockAt: string | null = null;
    let nextLessonDay: number | null = null;

    // 7. If PASSED (>= 70%):
    if (passed) {
      // Mark current lesson complete
      await admin
        .from('lesson_progress')
        .update({
          is_completed: true,
          quiz_passed: true,
          completed_at: nowIso,
          updated_at: nowIso,
        })
        .eq('enrollment_id', enrollment.id)
        .eq('lesson_id', lesson.id);

      // Find next lesson (day_number + 1)
      const nextDay = lesson.day_number + 1;
      const { data: nextLesson } = await admin
        .from('lessons')
        .select('id, day_number')
        .eq('course_id', lesson.course_id)
        .eq('day_number', nextDay)
        .maybeSingle();

      if (nextLesson) {
        // Calculate 12:00 AM (midnight) of next calendar day in Pakistan Standard Time (Asia/Karachi, UTC+5)
        const nextMidnightPkt = getNextKarachiMidnight();
        nextLessonUnlockAt = nextMidnightPkt.toISOString();
        nextLessonDay = nextLesson.day_number;

        // Upsert next lesson progress with is_unlocked = true and unlock_at = nextMidnightPkt
        await admin.from('lesson_progress').upsert(
          {
            enrollment_id: enrollment.id,
            lesson_id: nextLesson.id,
            user_id: user.id,
            is_unlocked: true,
            unlock_at: nextLessonUnlockAt,
            watch_percentage: 0.0,
            video_watched: false,
            video_completed: false,
            quiz_unlocked: false,
            quiz_passed: false,
            is_completed: false,
          },
          { onConflict: 'enrollment_id,lesson_id' }
        );
      }
    }

    revalidatePath(`/learn/${lesson.course_id}`);
    revalidatePath('/dashboard');

    return {
      success: true,
      passed,
      score,
      correctCount,
      totalQuestions,
      nextLessonUnlockAt,
      nextLessonDay,
    };
  } catch (err: any) {
    return {
      success: false,
      passed: false,
      score: 0,
      correctCount: 0,
      totalQuestions: 0,
      error: err.message || 'Server quiz grading failed',
    };
  }
}
