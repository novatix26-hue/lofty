import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isPlaceholderConfig } from '@/lib/supabase/config';
import { getDemoUser, getDemoEnrollments } from '@/lib/auth/demo';
import { DEMO_PREVIEW_COURSES, getDemoLessonsForCourse } from '@/lib/demo/courses';
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

  // 1. Local Demo Preview Mode
  if (isPlaceholderConfig() || courseId.startsWith('demo-')) {
    const demoUser = await getDemoUser();
    if (!demoUser && isPlaceholderConfig()) {
      redirect(`/login?redirectTo=/learn/${courseId}`);
    }

    const isAdmin = demoUser?.role === 'admin';

    // Strict access: Only active enrollments or admins
    if (!isAdmin) {
      const demoEnrollments = await getDemoEnrollments();
      const match = demoEnrollments.find((e) => e.course_id === courseId);

      if (!match) {
        redirect(`/courses/${courseId}?notice=not_enrolled`);
      }
      if (match.status === 'pending') {
        redirect(`/courses/${courseId}?notice=pending_approval`);
      }
      if (match.status === 'rejected') {
        redirect(`/courses/${courseId}?notice=rejected`);
      }
      if (match.status !== 'active') {
        redirect(`/courses/${courseId}?notice=pending_approval`);
      }
    }

    const demoCourse =
      DEMO_PREVIEW_COURSES.find((c) => c.id === courseId) || DEMO_PREVIEW_COURSES[0];
    const formattedLessons = getDemoLessonsForCourse(demoCourse.id);

    let initialLessonId = formattedLessons[0].id;
    if (requestedLessonId) {
      const found = formattedLessons.find((l) => l.id === requestedLessonId);
      if (found) initialLessonId = found.id;
    }

    return (
      <LearningPortalView
        course={demoCourse as unknown as Course}
        lessons={formattedLessons}
        initialLessonId={initialLessonId}
      />
    );
  }

  // 2. Live Supabase Mode
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/learn/${courseId}`);
  }

  // Check user profile role for admin bypass
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin';
  const admin = createAdminClient();

  let enrollment: { id: string; user_id: string; course_id: string; status: string } | null = null;

  // Strict Server-Side Access Control: Check Active Enrollment
  if (!isAdmin) {
    const { data: userEnrollment } = await admin
      .from('enrollments')
      .select('id, user_id, course_id, status')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (!userEnrollment) {
      redirect(`/courses/${courseId}?notice=not_enrolled`);
    }

    if (userEnrollment.status === 'pending') {
      redirect(`/courses/${courseId}?notice=pending_approval`);
    }

    if (userEnrollment.status === 'rejected') {
      redirect(`/courses/${courseId}?notice=rejected`);
    }

    if (userEnrollment.status !== 'active') {
      redirect(`/courses/${courseId}?notice=pending_approval`);
    }

    enrollment = userEnrollment;
  } else {
    // Admin user: check if there's an enrollment record, else null
    const { data: adminEnrollment } = await admin
      .from('enrollments')
      .select('id, user_id, course_id, status')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle();
    enrollment = adminEnrollment;
  }

  // Fetch Course Details
  const { data: course, error: courseError } = await admin
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (courseError || !course) {
    notFound();
  }

  // Fetch Lessons ordered by day_number
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

  // Fetch Student's Lesson Progress records (if enrollment exists)
  const { data: progressRows } = enrollment?.id
    ? await admin
        .from('lesson_progress')
        .select('*')
        .eq('enrollment_id', enrollment.id)
    : { data: [] };

  const progressMap = new Map<string, any>();
  (progressRows || []).forEach((row) => {
    progressMap.set(row.lesson_id, row);
  });

  // Fetch Quizzes and Student Questions
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

  // Assemble secure client lesson payload
  const formattedLessons: LessonWithClientData[] = lessons.map((lesson) => {
    const progress = progressMap.get(lesson.id);
    const quiz = quizMap.get(lesson.id);

    const isDay1 = lesson.day_number === 1;
    const isUnlocked = isAdmin ? true : (progress ? progress.is_unlocked : isDay1);
    const unlockAt = isAdmin
      ? new Date().toISOString()
      : (progress?.unlock_at || (isDay1 ? progress?.created_at || new Date().toISOString() : null));

    const isLockedByTime = isAdmin ? false : !isLessonUnlocked(unlockAt, isUnlocked);
    const isCompleted = progress?.is_completed || false;
    const videoWatched = isAdmin ? true : (progress?.video_watched || progress?.video_completed || false);
    const quizPassed = progress?.quiz_passed || isCompleted;

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

  // Pick initial active lesson
  let initialLessonId = formattedLessons[0].id;

  if (requestedLessonId) {
    const found = formattedLessons.find((l) => l.id === requestedLessonId);
    if (found) initialLessonId = found.id;
  } else if (requestedDay) {
    const found = formattedLessons.find((l) => l.dayNumber === Number(requestedDay));
    if (found) initialLessonId = found.id;
  } else {
    const currentActiveLesson = formattedLessons.find((l) => !l.isCompleted && !l.isLockedByTime);
    if (currentActiveLesson) {
      initialLessonId = currentActiveLesson.id;
    } else {
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
