import { createAdminClient } from '@/lib/supabase/admin';
import { Users, GraduationCap, Clock, CheckCircle2, Search, Mail } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminStudentsPage() {
  const admin = createAdminClient();

  // Fetch all students with their enrollments
  const { data: students, error } = await admin
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      avatar_url,
      role,
      active_session_token,
      created_at,
      enrollments (
        id,
        course_id,
        status,
        courses (title, category)
      )
    `)
    .eq('role', 'student')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Failed to load students: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Student Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Directory of registered students, active course enrollments, and session security status.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 border border-blue-200/60">
          <Users className="h-4 w-4 text-blue-600" />
          <span>{students?.length || 0} Registered Students</span>
        </div>
      </div>

      {/* Students Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-500">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Student Name & Email</th>
                <th className="px-5 py-3.5 font-semibold">Registered</th>
                <th className="px-5 py-3.5 font-semibold">Active Courses</th>
                <th className="px-5 py-3.5 font-semibold">Pending Approvals</th>
                <th className="px-5 py-3.5 font-semibold">Single Session Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {students && students.length > 0 ? (
                students.map((st: any) => {
                  const enrollmentsList = st.enrollments || [];
                  const activeCount = enrollmentsList.filter((e: any) => e.status === 'active').length;
                  const pendingCount = enrollmentsList.filter((e: any) => e.status === 'pending').length;
                  const hasActiveSession = !!st.active_session_token;

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white shadow-xs">
                            {(st.full_name || st.email).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{st.full_name || 'Student'}</p>
                            <p className="flex items-center gap-1 text-[11px] text-slate-500">
                              <Mail className="h-3 w-3 text-slate-400" />
                              <span>{st.email}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-500 whitespace-nowrap" suppressHydrationWarning>
                        {new Date(st.created_at).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>{activeCount} Active</span>
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {pendingCount > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
                            <Clock className="h-3 w-3 text-amber-600" />
                            <span>{pendingCount} Pending</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {hasActiveSession ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span>Active Token Bound</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No active session</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400">
                    <Users className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-sm font-semibold text-slate-700">No students found</p>
                    <p className="text-xs text-slate-400">Registered students will appear here.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
