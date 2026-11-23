import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { LessonQuizBuilder } from '@/components/admin/LessonQuizBuilder';
import type { Course, Lesson, Quiz, QuizQuestion } from '@/types';

export const dynamic = 'force-dynamic';

interface CourseDetailPageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export default async function AdminCourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseId } = await params;
  const admin = createAdminClient();

  // 1. Fetch Course details
  const { data: course, error: courseError } = await admin
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (courseError || !course) {
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
}
