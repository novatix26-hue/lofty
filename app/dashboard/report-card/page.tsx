import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { StudentNavbar } from '@/components/common/StudentNavbar';
import { MobileBottomNav } from '@/components/common/MobileBottomNav';
import {
  ReportCardView,
  type CourseProgressSummary,
  type QuizAttemptItem,
} from '@/components/student/ReportCardView';
import type { Profile, Course, Enrollment, Certificate } from '@/types';

export const metadata = {
  title: 'My Report Card & Certificates | Lofty LMS',
  description: 'View your course completion progress, past quiz attempts, and digital certificates.',
};

export default async function ReportCardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/dashboard/report-card');
  }

  const admin = createAdminClient();

  // 1. Fetch Profile
  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // 2. Fetch Enrollments with Courses
  const { data: enrollments } = await admin
    .from('enrollments')
    .select('*, courses(*)')
    .eq('user_id', user.id)
    .eq('status', 'active');

  const coursesWithProgress: CourseProgressSummary[] = [];

  if (enrollments && enrollments.length > 0) {
    for (const enroll of enrollments) {
      const course = enroll.courses as unknown as Course;
      if (!course) continue;

      // Fetch all lessons for this course
      const { data: lessons } = await admin
        .from('lessons')
        .select('id, day_number')
        .eq('course_id', course.id);

      const totalLessons = lessons ? lessons.length : 0;
      const lessonIds = lessons ? lessons.map((l) => l.id) : [];

      let completedLessons = 0;
      if (lessonIds.length > 0) {
        const { count } = await admin
          .from('lesson_progress')
          .select('*', { count: 'exact', head: true })
          .eq('enrollment_id', enroll.id)
          .in('lesson_id', lessonIds)
          .eq('is_completed', true);

        completedLessons = count || 0;
      }

      const completionPercentage =
        totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      const isCompleted = totalLessons > 0 && completedLessons >= totalLessons;

      // Fetch existing certificate if any
      const { data: cert } = await admin
        .from('certificates')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', course.id)
        .maybeSingle();

      coursesWithProgress.push({
        course,
        enrollment: enroll as unknown as Enrollment,
        totalLessons,
        completedLessons,
        completionPercentage,
        isCompleted,
        certificate: (cert as Certificate) || null,
      });
    }
  }

  // 3. Fetch Quiz Attempts history
  const { data: attempts } = await admin
    .from('quiz_attempts')
    .select(`
      id,
      score,
      score_percentage,
      passed,
      attempt_number,
      submitted_at,
      created_at,
      lessons (
        title,
        day_number,
        courses (
          title,
          category
        )
      )
    `)
    .or(`user_id.eq.${user.id},student_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  const formattedAttempts: QuizAttemptItem[] = (attempts || []).map((att: any) => {
    const lesson = att.lessons;
    const course = lesson?.courses;
    const rawScore = att.score ?? att.score_percentage ?? 0;

    return {
      id: att.id,
      score: Math.round(Number(rawScore)),
      passed: Boolean(att.passed),
      attempt_number: att.attempt_number || 1,
      submitted_at: att.submitted_at || att.created_at,
      created_at: att.created_at,
      lessonTitle: lesson?.title || 'Daily Lesson',
      dayNumber: lesson?.day_number || 1,
      courseTitle: course?.title || 'Enrolled Course',
      courseCategory: (course?.category as 'kids' | 'adults') || 'adults',
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20 md:pb-12">
      <StudentNavbar userProfile={profile as unknown as Profile} />
      <main className="flex-1">
        <ReportCardView
          profile={profile as unknown as Profile}
          coursesWithProgress={coursesWithProgress}
          quizAttempts={formattedAttempts}
        />
      </main>
      <MobileBottomNav userProfile={profile as unknown as Profile} />
    </div>
  );
}
