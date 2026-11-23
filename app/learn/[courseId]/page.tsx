import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isLessonUnlocked } from '@/lib/learning/drip';
import {
  LearningPortalView,
  type LessonWithClientData,
} from '@/components/learning/LearningPortalView';
import type { Course, StudentQuizQuestion } from '@/types';

export const dynamic = 'force-dynamic';

interface LearnCoursePageProps {
  params: Promise<{
    courseId: string;
  }>;
  searchParams: Promise<{
    lesson?: string;
    day?: string;
  }>;
}

export default async function LearnCoursePage({
  params,
  searchParams,
}: LearnCoursePageProps) {
  const { courseId } = await params;
  const { lesson: requestedLessonId, day: requestedDay } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/learn/${courseId}`);
  }

  const admin = createAdminClient();

  // 1. Strict Server-Side Access Control: Check Active Enrollment
  const { data: enrollment, error: enrollmentError } = await admin
    .from('enrollments')
    .select('id, user_id, course_id, status')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle();

  if (enrollmentError || !enrollment || enrollment.status !== 'active') {
    redirect(`/courses/${courseId}?notice=enrollment_required`);
  }

  // 2. Fetch Course Details
  const { data: course, error: courseError } = await admin
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (courseError || !course) {
    notFound();
  }

  // 3. Fetch Lessons ordered by day_number
  const { data: lessons, error: lessonsError } = await admin
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('day_number', { ascending: true });

  if (lessonsError || !lessons || lessons.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center text-slate-500">
        No lessons available in this course yet.
      </div>
    );
  }

  // 4. Fetch Student's Lesson Progress records
  const { data: progressRows } = await admin
    .from('lesson_progress')
    .select('*')
    .eq('enrollment_id', enrollment.id);

  const progressMap = new Map<string, any>();
  (progressRows || []).forEach((row) => {
    progressMap.set(row.lesson_id, row);
  });

  // 5. Fetch Quizzes and Student Questions (EXCLUDING correct_option_id for strict security)
  const { data: quizzes } = await admin
    .from('quizzes')
    .select(`
      id,
      lesson_id,
      title,
      passing_score_percentage,
      quiz_questions (
        id,
        quiz_id,
        order_index,
        question_text,
        audio_url,
        image_url,
        options,
        created_at
      )
    `);

  const quizMap = new Map<string, any>();
  (quizzes || []).forEach((q) => {
    quizMap.set(q.lesson_id, q);
  });

  // 6. Assemble secure client lesson payload
  const formattedLessons: LessonWithClientData[] = lessons.map((lesson) => {
    const progress = progressMap.get(lesson.id);
    const quiz = quizMap.get(lesson.id);

    // Day 1 is always unlocked by default if approved
    const isDay1 = lesson.day_number === 1;
    const isUnlocked = progress ? progress.is_unlocked : isDay1;
    const unlockAt = progress?.unlock_at || (isDay1 ? progress?.created_at || new Date().toISOString() : null);

    // Is it locked by drip schedule (scheduled in the future)?
    const isLockedByTime = !isLessonUnlocked(unlockAt, isUnlocked);

    const isCompleted = progress?.is_completed || false;
    const videoWatched = progress?.video_watched || progress?.video_completed || false;
    const quizPassed = progress?.quiz_passed || isCompleted;

    // SECURITY: If locked by time, never deliver the video_url or question items to the client!
    const videoUrl = isLockedByTime ? null : lesson.video_url;

    const rawQuestions = quiz?.quiz_questions || [];
    const questions: StudentQuizQuestion[] = isLockedByTime
      ? []
      : [...rawQuestions].sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));

    return {
      id: lesson.id,
      dayNumber: lesson.day_number,
      title: lesson.title,
      description: isLockedByTime ? null : lesson.description,
      videoUrl,
      durationSeconds: lesson.duration_seconds,
      isUnlocked,
      unlockAt,
      isLockedByTime,
      isCompleted,
      videoWatched,
      quizPassed,
      quizId: quiz?.id,
      questions,
    };
  });

  // 7. Pick initial active lesson
  let initialLessonId = formattedLessons[0].id;

  if (requestedLessonId) {
    const found = formattedLessons.find((l) => l.id === requestedLessonId);
    if (found) initialLessonId = found.id;
  } else if (requestedDay) {
    const found = formattedLessons.find((l) => l.dayNumber === Number(requestedDay));
    if (found) initialLessonId = found.id;
  } else {
    // Default to the first uncompleted lesson that is unlocked, or the highest unlocked lesson
    const currentActiveLesson = formattedLessons.find((l) => !l.isCompleted && !l.isLockedByTime);
    if (currentActiveLesson) {
      initialLessonId = currentActiveLesson.id;
    } else {
      // If all completed or waiting on tomorrow, pick the first locked by time or the last one
      const scheduledTomorrow = formattedLessons.find((l) => l.isLockedByTime);
      if (scheduledTomorrow) {
        initialLessonId = scheduledTomorrow.id;
      } else {
        initialLessonId = formattedLessons[formattedLessons.length - 1].id;
      }
    }
  }

  return (
    <LearningPortalView
      course={course as Course}
      lessons={formattedLessons}
      initialLessonId={initialLessonId}
    />
  );
}
