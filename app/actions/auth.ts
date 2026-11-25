'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isPlaceholderConfig } from '@/lib/supabase/config';
import {
  createDemoStudent,
  createDemoAdmin,
  clearDemoUser,
} from '@/lib/auth/demo';
import { cookies } from 'next/headers';
import {
  SESSION_COOKIE_NAME,
  generateSessionToken,
  registerActiveSession,
} from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export interface SignUpInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export async function loginAsDemoAdmin() {
  await createDemoAdmin();
  return { success: true, redirectTo: '/admin' };
}

export async function loginAsDemoStudent() {
  await createDemoStudent({
    fullName: 'Demo Student',
    email: 'student@example.com',
  });
  return { success: true, redirectTo: '/dashboard' };
}

export async function signUpAction(input: SignUpInput) {
  try {
    const trimmedEmail = input.email.trim().toLowerCase();
    const trimmedName = input.fullName.trim();
    const trimmedPhone = input.phone.trim();

    if (!trimmedEmail || !trimmedName) {
      return { success: false, error: 'Full name and email are required.' };
    }

    if (!input.password || input.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    // 1. Local Demo Preview Mode (when Supabase credentials are placeholder)
    if (isPlaceholderConfig()) {
      await createDemoStudent({
        fullName: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
      });

      return {
        success: true,
        redirectTo: '/dashboard',
        message: 'Student account created successfully (Local Preview Mode)!',
      };
    }

    // 2. Real Live Supabase Connection
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password: input.password,
      options: {
        data: {
          full_name: trimmedName,
          phone: trimmedPhone,
          role: 'student',
        },
      },
    });

    if (error) {
      // Provide clear friendly guidance
      if (error.message.includes('fetch failed')) {
        return {
          success: false,
          error:
            'Could not reach database. Please check your Supabase project status or internet connection.',
        };
      }
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Registration failed. Please try again.' };
    }

    // Attempt profile upsert with Admin client (fail-safe)
    try {
      const admin = createAdminClient();
      await admin.from('profiles').upsert(
        {
          id: data.user.id,
          email: data.user.email || trimmedEmail,
          full_name: trimmedName,
          phone: trimmedPhone,
          role: 'student',
        },
        { onConflict: 'id' }
      );
    } catch {
      // Trigger in postgres handles profile creation as well
    }

    // If session is returned immediately (email confirmation disabled in Supabase)
    if (data.session) {
      const sessionToken = generateSessionToken();
      await registerActiveSession(data.user.id, sessionToken);

      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });

      return { success: true, redirectTo: '/dashboard' };
    }

    return {
      success: true,
      redirectTo: '/login?notice=check_email',
      message: 'Account created! Please check your email inbox to confirm your account.',
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred during signup' };
  }
}

export async function signInAction(input: SignInInput) {
  try {
    const trimmedEmail = input.email.trim().toLowerCase();

    // 1. Local Demo Preview Mode
    if (isPlaceholderConfig()) {
      if (trimmedEmail.includes('admin')) {
        await createDemoAdmin();
        return { success: true, redirectTo: '/admin' };
      } else {
        await createDemoStudent({
          fullName: trimmedEmail.split('@')[0] || 'Student',
          email: trimmedEmail,
        });
        return { success: true, redirectTo: '/dashboard' };
      }
    }

    // 2. Real Live Supabase Connection
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password: input.password,
    });

    if (error || !data.user) {
      if (error?.message?.toLowerCase().includes('email not confirmed')) {
        return {
          success: false,
          error:
            'Your email is not confirmed yet. Please verify your email inbox or ask admin to approve.',
        };
      }
      return {
        success: false,
        error: error?.message || 'Invalid email or password',
      };
    }

    // Fetch user profile to verify role
    let role = 'student';
    try {
      const admin = createAdminClient();
      const { data: profile } = await admin
        .from('profiles')
        .select('id, role')
        .eq('id', data.user.id)
        .single();
      if (profile?.role) {
        role = profile.role;
      }
    } catch {
      // Default to student if fetch fails
    }

    // If Admin, redirect to /admin
    if (role === 'admin') {
      return { success: true, redirectTo: '/admin' };
    }

    // If Student, establish Single Active Session
    const sessionToken = generateSessionToken();
    await registerActiveSession(data.user.id, sessionToken);

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return { success: true, redirectTo: '/dashboard' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Login failed' };
  }
}

export async function signOutAction() {
  if (isPlaceholderConfig()) {
    await clearDemoUser();
    redirect('/login');
  }

  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Ignore signout network errors
  }

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);

  redirect('/login');
}
