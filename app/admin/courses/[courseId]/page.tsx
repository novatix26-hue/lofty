import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { isPlaceholderConfig } from '@/lib/supabase/config';
import { DEMO_PREVIEW_COURSES, getDemoLessonsForCourse } from '@/lib/demo/courses';
import { LessonQuizBuilder } from '@/components/admin/LessonQuizBuilder';
import type { Course, Lesson, Quiz, QuizQuestion } from '@/types';

export const dynamic = 'force-dynamic';

interface CourseDetailPageProps {
  params: Promise<{
    courseId: string;
  }>;
}

function getDemoCourseAndLessons(courseId: string) {
  const catalogCourse = DEMO_PREVIEW_COURSES.find((c) => c.id === courseId) || DEMO_PREVIEW_COURSES[0];
  if (!catalogCourse) return null;

  const course: Course = {
    id: catalogCourse.id,
    title: catalogCourse.title,
    slug: catalogCourse.slug,
    description: catalogCourse.description,
    category: catalogCourse.category,
    price: catalogCourse.price,
    is_published: catalogCourse.is_published,
    thumbnail_url: catalogCourse.thumbnail_url,
    intro_video_url: catalogCourse.intro_video_url || null,
    created_at: catalogCourse.created_at,
    updated_at: catalogCourse.updated_at,
  };

  const rawLessons = getDemoLessonsForCourse(courseId);
  const formattedLessons = rawLessons.map((l, idx) => ({
    id: l.id,
    course_id: course.id,
    title: l.title,
    description: l.description,
    day_number: l.dayNumber,
    video_url: l.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration_seconds: l.durationSeconds || 300,
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    quiz: l.questions && l.questions.length > 0
      ? {
          id: `demo-quiz-${idx + 1}`,
          lesson_id: l.id,
          title: `${l.title} Quiz`,
          passing_score_percentage: 80,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          quiz_questions: l.questions.map((q: any) => ({
            id: q.id,
            quiz_id: `demo-quiz-${idx + 1}`,
            order_index: q.order_index,
            question_text: q.question_text,
            audio_url: q.audio_url || null,
            image_url: q.image_url || null,
            options: q.options || [],
            correct_option_id: q.options?.[0]?.id || 'opt_a',
            explanation: 'Correct answer!',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })),
        }
      : null,
  }));

  return { course, lessons: formattedLessons };
}

export default async function AdminCourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseId } = await params;

  if (isPlaceholderConfig()) {
    const demoData = getDemoCourseAndLessons(courseId);
    if (!demoData) notFound();
    return <LessonQuizBuilder course={demoData.course} initialLessons={demoData.lessons as any} />;
  }

  try {
    const admin = createAdminClient();

    // 1. Fetch Course details
    const { data: course, error: courseError } = await admin
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      const demoData = getDemoCourseAndLessons(courseId);
      if (demoData) {
        return <LessonQuizBuilder course={demoData.course} initialLessons={demoData.lessons as any} />;
      }
      notFound();
    }

    // 2. Fetch Lessons with their Quizzes and Questions
    const { data: lessons, error: lessonsError } = await admin
      .from('lessons')
      .select(`
        *,
        quizzes (
          id,
          lesson_id,
          title,
          passing_score_percentage,
          created_at,
          updated_at,
          quiz_questions (
            id,
            quiz_id,
            order_index,
            question_text,
            audio_url,
            image_url,
            options,
            correct_option_id,
            explanation,
            created_at,
            updated_at
          )
        )
      `)
      .eq('course_id', courseId)
      .order('day_number', { ascending: true });

    if (lessonsError) {
      return (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Failed to load lessons: {lessonsError.message}
        </div>
      );
    }

    // Format lessons with unified single quiz object
    const formattedLessons = (lessons || []).map((lesson: any) => {
      const rawQuiz = Array.isArray(lesson.quizzes) ? lesson.quizzes[0] : lesson.quizzes;
      const sortedQuestions = rawQuiz?.quiz_questions
        ? [...rawQuiz.quiz_questions].sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        : [];

      return {
        ...lesson,
        quiz: rawQuiz
          ? {
              ...rawQuiz,
              quiz_questions: sortedQuestions,
            }
          : null,
      };
    });

    return (
      <LessonQuizBuilder
        course={course as Course}
        initialLessons={formattedLessons}
      />
    );
  } catch {
    const demoData = getDemoCourseAndLessons(courseId);
    if (!demoData) notFound();
    return <LessonQuizBuilder course={demoData.course} initialLessons={demoData.lessons as any} />;
  }
}
