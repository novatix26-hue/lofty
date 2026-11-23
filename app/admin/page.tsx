import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  Users,
  Receipt,
  BookOpen,
  ArrowRight,
  Sparkles,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const admin = createAdminClient();

  // 1. Fetch Key Metrics in parallel
  const [
    { count: totalStudentsCount },
    { count: pendingApprovalsCount },
    { count: activeEnrollmentsCount },
    { count: kidsCoursesCount },
    { count: adultsCoursesCount },
    { data: recentPendingEnrollments },
    { data: recentCourses },
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    admin.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('courses').select('*', { count: 'exact', head: true }).eq('category', 'kids'),
    admin.from('courses').select('*', { count: 'exact', head: true }).eq('category', 'adults'),
    admin
      .from('enrollments')
      .select(`
        id,
        transaction_id,
        receipt_url,
        created_at,
        profiles:user_id (full_name, email),
        courses:course_id (title, category, price)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5),
    admin
      .from('courses')
      .select('id, title, category, price, is_published, lessons(count)')
      .order('created_at', { ascending: false })
      .limit(4),
  ]);

  const totalCourses = (kidsCoursesCount || 0) + (adultsCoursesCount || 0);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Admin Overview
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Real-time monitoring for student fee verifications, course catalogs, and drip progression.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/enrollments"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors"
            >
              <Receipt className="h-4 w-4" />
              <span>Review Fees ({pendingApprovalsCount || 0})</span>
            </Link>
            <Link
              href="/admin/courses"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              <span>Manage Courses</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Active Students */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Students
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {totalStudentsCount || 0}
            </span>
            <span className="text-xs text-slate-500">Registered</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{activeEnrollmentsCount || 0} Active Course Enrollments</span>
          </div>
        </div>

        {/* Pending Fee Approvals */}
        <Link
          href="/admin/enrollments"
          className="group rounded-2xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm hover:border-amber-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              Pending Fee Approvals
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-900">
              {pendingApprovalsCount || 0}
            </span>
            <span className="text-xs text-amber-700">Awaiting review</span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs font-medium text-amber-800 group-hover:translate-x-0.5 transition-transform">
            <span>Open verification queue</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </Link>

        {/* Kids Courses */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Kids Courses (5-12)
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {kidsCoursesCount || 0}
            </span>
            <span className="text-xs text-slate-500">Courses</span>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Audio hints & picture option quizzes enabled
          </div>
        </div>

        {/* Adults Courses */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Adults Courses
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
              <Briefcase className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {adultsCoursesCount || 0}
            </span>
            <span className="text-xs text-slate-500">Courses</span>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            {totalCourses} total published/draft courses
          </div>
        </div>
      </div>

      {/* Grid: Pending Approvals & Courses Glance */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Pending Queue Card */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <h2 className="font-semibold text-slate-900">Recent Fee Submissions</h2>
            </div>
            <Link
              href="/admin/enrollments"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View All
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentPendingEnrollments && recentPendingEnrollments.length > 0 ? (
              recentPendingEnrollments.map((enr: any) => (
                <div
                  key={enr.id}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {enr.profiles?.full_name || 'Student'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {enr.courses?.title} • TxID: <code className="font-mono">{enr.transaction_id}</code>
                    </p>
                    <p className="text-[11px] text-slate-400" suppressHydrationWarning>
                      Submitted {new Date(enr.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    href={`/admin/enrollments?highlight=${enr.id}`}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    Inspect
                  </Link>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
                <p className="mt-2 text-sm font-medium text-slate-600">All caught up!</p>
                <p className="text-xs text-slate-400">No pending fee approvals at this time.</p>
              </div>
            )}
          </div>
        </div>

        {/* Course Catalog Glance */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <h2 className="font-semibold text-slate-900">Course Catalog Glance</h2>
            </div>
            <Link
              href="/admin/courses"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Manage All
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentCourses && recentCourses.length > 0 ? (
              recentCourses.map((c: any) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{c.title}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          c.category === 'kids'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {c.category === 'kids' ? 'Kids' : 'Adults'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      PKR {Number(c.price).toLocaleString()} • {c.lessons?.[0]?.count || 0} Lessons
                    </p>
                  </div>

                  <Link
                    href={`/admin/courses/${c.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <span>Curriculum</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400">
                <AlertCircle className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-2 text-sm font-medium text-slate-600">No courses yet</p>
                <Link
                  href="/admin/courses"
                  className="mt-2 inline-block text-xs font-semibold text-blue-600 hover:underline"
                >
                  Create your first course &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
