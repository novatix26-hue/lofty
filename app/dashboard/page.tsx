import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isPlaceholderConfig } from '@/lib/supabase/config';
import { getDemoUser, getDemoEnrollments } from '@/lib/auth/demo';
import {
  StudentDashboardView,
  type ActiveCourseCardData,
  type PendingCourseCardData,
  type RejectedCourseCardData,
} from '@/components/student/StudentDashboardView';
import { StudentNavbar } from '@/components/common/StudentNavbar';
import { MobileBottomNav } from '@/components/common/MobileBottomNav';
import type { Profile } from '@/types';

export const dynamic = 'force-dynamic';

export default async function StudentDashboardPage() {
  // 1. Local Demo Preview Mode
  if (isPlaceholderConfig()) {
    const demoProfile = await getDemoUser();

    if (!demoProfile) {
      redirect('/login?redirectTo=/dashboard');
    }

    if (demoProfile.role === 'admin') {
      redirect('/admin');
    }

    const demoEnrollments = await getDemoEnrollments();

    const activeCourses: ActiveCourseCardData[] = demoEnrollments
      .filter((e) => e.status === 'active')
      .map((e) => ({
        enrollmentId: e.id,
        courseId: e.courses?.id || e.course_id,
        courseTitle: e.courses?.title || 'Interactive Course',
        courseCategory: e.courses?.category || 'kids',
        courseThumbnail: e.courses?.thumbnail_url || null,
        totalLessons: e.courses?.category === 'kids' ? 7 : 14,
        completedLessons: 1,
        progressPercentage: e.courses?.category === 'kids' ? 14 : 7,
        currentDay: 1,
      }));

    const pendingCourses: PendingCourseCardData[] = demoEnrollments
      .filter((e) => e.status === 'pending')
      .map((e) => ({
        enrollmentId: e.id,
        courseId: e.courses?.id || e.course_id,
        courseTitle: e.courses?.title || 'Course',
        courseCategory: e.courses?.category || 'kids',
        coursePrice: e.courses?.price || 0,
        courseThumbnail: e.courses?.thumbnail_url || null,
        transactionId: e.transaction_id,
        createdAt: e.created_at,
      }));

    const rejectedCourses: RejectedCourseCardData[] = demoEnrollments
      .filter((e) => e.status === 'rejected')
      .map((e) => ({
        enrollmentId: e.id,
        courseId: e.courses?.id || e.course_id,
        courseTitle: e.courses?.title || 'Course',
        courseCategory: e.courses?.category || 'kids',
        coursePrice: e.courses?.price || 0,
        adminNotes: e.admin_notes,
        createdAt: e.created_at,
      }));

    return (
      <div className="min-h-screen bg-slate-50/50 pb-20 md:pb-12">
        <StudentNavbar userProfile={demoProfile} />

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <StudentDashboardView
            userProfile={demoProfile}
            activeCourses={activeCourses}
            pendingCourses={pendingCourses}
            rejectedCourses={rejectedCourses}
          />
        </main>

        <MobileBottomNav userProfile={demoProfile} />
      </div>
    );
  }

  // 2. Live Supabase Mode
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/dashboard');
  }

  // Fetch student profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // If user is admin, redirect to admin dashboard
  if (profile.role === 'admin') {
    redirect('/admin');
  }

  const admin = createAdminClient();

  // Fetch all student enrollments with course details
  const { data: enrollments, error } = await admin
    .from('enrollments')
    .select(`
      id,
      user_id,
      course_id,
      status,
      receipt_url,
      transaction_id,
      admin_notes,
      created_at,
      courses (
        id,
        title,
        category,
        price,
        thumbnail_url
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="p-8 text-center text-sm text-red-600">
        Failed to load dashboard: {error.message}
      </div>
    );
  }

  const allEnrollments = enrollments || [];

  // 1. Process Active Courses with Progress Calculations
  const activeEnrollmentRecords = allEnrollments.filter((e) => e.status === 'active');
  const activeCourses: ActiveCourseCardData[] = [];

  for (const enr of activeEnrollmentRecords) {
    const course = enr.courses as any;
    if (!course) continue;

    // Fetch total lessons in course
    const { count: totalLessonsCount } = await admin
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', course.id);

    // Fetch completed lessons from lesson_progress
    const { count: completedLessonsCount } = await admin
      .from('lesson_progress')
      .select('*', { count: 'exact', head: true })
      .eq('enrollment_id', enr.id)
      .eq('is_completed', true);

    // Fetch highest unlocked day
    const { data: progressItems } = await admin
      .from('lesson_progress')
      .select(`
        lesson_id,
        unlock_at,
        lessons:lesson_id (day_number)
      `)
      .eq('enrollment_id', enr.id)
      .order('created_at', { ascending: false });

    let currentDay = 1;
    if (progressItems && progressItems.length > 0) {
      const days = progressItems
        .map((p: any) => p.lessons?.day_number)
        .filter((d) => typeof d === 'number');
      if (days.length > 0) {
        currentDay = Math.max(...days);
      }
    }

    const total = totalLessonsCount || 0;
    const completed = completedLessonsCount || 0;
    const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    activeCourses.push({
      enrollmentId: enr.id,
      courseId: course.id,
      courseTitle: course.title,
      courseCategory: course.category,
      courseThumbnail: course.thumbnail_url,
      totalLessons: total,
      completedLessons: completed,
      progressPercentage,
      currentDay,
    });
  }

  // 2. Pending Courses
  const pendingCourses: PendingCourseCardData[] = allEnrollments
    .filter((e) => e.status === 'pending')
    .map((e: any) => ({
      enrollmentId: e.id,
      courseId: e.courses?.id || e.course_id,
      courseTitle: e.courses?.title || 'Course',
      courseCategory: e.courses?.category || 'kids',
      coursePrice: e.courses?.price || 0,
      courseThumbnail: e.courses?.thumbnail_url || null,
      transactionId: e.transaction_id,
      createdAt: e.created_at,
    }));

  // 3. Rejected Courses
  const rejectedCourses: RejectedCourseCardData[] = allEnrollments
    .filter((e) => e.status === 'rejected')
    .map((e: any) => ({
      enrollmentId: e.id,
      courseId: e.courses?.id || e.course_id,
      courseTitle: e.courses?.title || 'Course',
      courseCategory: e.courses?.category || 'kids',
      coursePrice: e.courses?.price || 0,
      adminNotes: e.admin_notes,
      createdAt: e.created_at,
    }));

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 md:pb-12">
      <StudentNavbar userProfile={profile as Profile} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <StudentDashboardView
          userProfile={profile as Profile}
          activeCourses={activeCourses}
          pendingCourses={pendingCourses}
          rejectedCourses={rejectedCourses}
        />
      </main>

      <MobileBottomNav userProfile={profile as Profile} />
    </div>
  );
}
