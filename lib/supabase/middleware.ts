import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

  // If using placeholder or unconfigured Supabase in local preview, pass through smoothly
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id') ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
  ) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  ) as unknown as SupabaseClient<Database>;

  // IMPORTANT: Do NOT run code between createServerClient and supabase.auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup');
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/learn') ||
    pathname.startsWith('/courses') ||
    pathname.startsWith('/admin');

  // If visiting protected route while unauthenticated, redirect to login
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // Single Active Session & Role check for authenticated users accessing protected routes
  if (user && isProtectedRoute) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, active_session_token, active_session_id')
      .eq('id', user.id)
      .single();

    // Admin Route Protection: Only users with role = 'admin' may access /admin/*
    if (pathname.startsWith('/admin')) {
      if (!profile || profile.role !== 'admin') {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        url.searchParams.set('error', 'admin_access_required');
        return NextResponse.redirect(url);
      }
    }

    // Single Active Session check for students (Anti-Account Sharing)
    const activeDbToken = (profile as any)?.active_session_id || (profile as any)?.active_session_token;
    if (
      profile &&
      profile.role === 'student' &&
      activeDbToken &&
      activeDbToken !== sessionCookie
    ) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('reason', 'session_expired');
      url.searchParams.set('error', 'session_expired');

      const redirectResponse = NextResponse.redirect(url);
      // Delete stale session cookies
      redirectResponse.cookies.delete(SESSION_COOKIE_NAME);
      return redirectResponse;
    }
  }

  // If logged in and visiting auth pages, redirect to dashboard
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
