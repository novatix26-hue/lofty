import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getNextDayMidnight, isQuizPassing } from '@/lib/learning/drip';
import type { QuizSubmissionRequest, QuizGradingResult } from '@/types';

/**
 * STRICT SERVER-SIDE QUIZ GRADING ROUTE
 * 
 * Rules enforced:
 * 1. User must be authenticated & enrolled in the course with 'active' status.
 * 2. User must have watched >= 85% of the video (quiz_unlocked = true).
 * 3. Correct answers are retrieved strictly via Admin Client (never sent to client).
 * 4. Passing threshold is >= 70%.
 * 5. If passed, current lesson is marked complete and next lesson is unlocked at next-day midnight.
 * 6. If failed (< 70%), attempt is saved and retake is allowed.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: QuizSubmissionRequest = await request.json();
    const { enrollmentId, lessonId, quizId, answers } = body;

    if (!enrollmentId || !lessonId || !quizId || !answers) {
      return NextResponse.json(
        { success: false, message: 'Missing required quiz submission fields' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Verify Enrollment & Status
    const { data: enrollment, error: enrollmentError } = await admin
      .from('enrollments')
      .select('id, user_id, course_id, status')
      .eq('id', enrollmentId)
      .eq('user_id', user.id)
      .single();

    if (enrollmentError || !enrollment || enrollment.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'No active enrollment found for this course' },
        { status: 403 }
      );
    }

    // 2. Verify Lesson Progress (Must have watched >= 85% video)
    const { data: progress, error: progressError } = await admin
      .from('lesson_progress')
      .select('id, watch_percentage, video_completed, quiz_unlocked, unlock_at')
      .eq('enrollment_id', enrollmentId)
      .eq('lesson_id', lessonId)
      .single();

    if (progressError || !progress) {
      return NextResponse.json(
        { success: false, message: 'Lesson progress not initialized' },
        { status: 400 }
      );
    }

    // Check lesson unlock timestamp
    if (new Date(progress.unlock_at).getTime() > Date.now()) {
      return NextResponse.json(
        { success: false, message: 'This lesson is still locked by the drip schedule' },
        { status: 403 }
      );
    }

    // Check 85% video completion requirement
    if (!progress.video_completed || !progress.quiz_unlocked || Number(progress.watch_percentage) < 85) {
      return NextResponse.json(
        {
          success: false,
          message: 'You must watch at least 85% of the video lesson before attempting the quiz',
        },
        { status: 403 }
      );
    }

    // 3. Fetch Quiz and Server-Side Questions (including secret correct_option_id)
    const { data: quiz, error: quizError } = await admin
      .from('quizzes')
      .select('id, lesson_id, passing_score_percentage')
      .eq('id', quizId)
      .eq('lesson_id', lessonId)
      .single();

    if (quizError || !quiz) {
      return NextResponse.json(
        { success: false, message: 'Quiz not found' },
        { status: 404 }
      );
    }

    const { data: questions, error: questionsError } = await admin
      .from('quiz_questions')
      .select('id, correct_option_id')
      .eq('quiz_id', quizId);

    if (questionsError || !questions || questions.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No quiz questions configured' },
        { status: 500 }
      );
    }

    // 4. Server-Side Grading Calculation
    const totalQuestions = questions.length;
    let correctCount = 0;

    for (const q of questions) {
      const studentAnswer = answers[q.id];
      if (studentAnswer && studentAnswer === q.correct_option_id) {
        correctCount++;
      }
    }

    const scorePercentage = Math.round((correctCount / totalQuestions) * 100 * 100) / 100;
    const passingThreshold = Number(quiz.passing_score_percentage) || 70.0;
    const passed = isQuizPassing(scorePercentage) && scorePercentage >= passingThreshold;

    // 5. Fetch previous attempt count for auditing
    const { count: previousAttemptsCount } = await admin
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', quizId)
      .eq('user_id', user.id);

    const attemptNumber = (previousAttemptsCount || 0) + 1;

    // 6. Record Quiz Attempt
    await admin.from('quiz_attempts').insert({
      quiz_id: quizId,
      lesson_id: lessonId,
      enrollment_id: enrollmentId,
      user_id: user.id,
      score_percentage: scorePercentage,
      passed,
      answers,
      attempt_number: attemptNumber,
    });

    let nextLessonUnlockAt: string | null = null;
    let nextLessonId: string | null = null;

    // 7. If passed, execute drip logic for next lesson
    if (passed) {
      // Fetch current lesson order
      const { data: currentLesson } = await admin
        .from('lessons')
        .select('course_id, day_number')
        .eq('id', lessonId)
        .single();

      if (currentLesson) {
        // Mark current lesson progress complete
        await admin
          .from('lesson_progress')
          .update({
            quiz_passed: true,
            is_completed: true,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('enrollment_id', enrollmentId)
          .eq('lesson_id', lessonId);

        // Find next day lesson (day_number + 1)
        const nextDayNumber = currentLesson.day_number + 1;
        const { data: nextLesson } = await admin
          .from('lessons')
          .select('id, day_number')
          .eq('course_id', currentLesson.course_id)
          .eq('day_number', nextDayNumber)
          .single();

        if (nextLesson) {
          nextLessonId = nextLesson.id;
          const nextMidnight = getNextDayMidnight();
          nextLessonUnlockAt = nextMidnight.toISOString();

          // Upsert next lesson progress with next-day midnight unlock timestamp
          await admin.from('lesson_progress').upsert(
            {
              enrollment_id: enrollmentId,
              lesson_id: nextLesson.id,
              user_id: user.id,
              watch_percentage: 0.0,
              video_completed: false,
              quiz_unlocked: false,
              quiz_passed: false,
              is_completed: false,
              unlock_at: nextLessonUnlockAt,
            },
            { onConflict: 'enrollment_id,lesson_id' }
          );
        }
      }
    }

    const response: QuizGradingResult = {
      success: true,
      scorePercentage,
      totalQuestions,
      correctAnswersCount: correctCount,
      passingScore: passingThreshold,
      passed,
      message: passed
        ? 'Congratulations! You passed the quiz. The next lesson will unlock tomorrow at midnight.'
        : `Score: ${scorePercentage}%. You need at least ${passingThreshold}% to pass. You can retake the quiz anytime!`,
      nextLessonUnlockAt,
      nextLessonId,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Quiz grading error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server grading error' },
      { status: 500 }
    );
  }
}
