'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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

export async function signUpAction(input: SignUpInput) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      options: {
        data: {
          full_name: input.fullName.trim(),
          phone: input.phone.trim(),
          role: 'student',
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Registration failed. Please try again.' };
    }

    // Ensure profile row has the phone number and student role
    const admin = createAdminClient();
    await admin.from('profiles').upsert(
      {
        id: data.user.id,
        email: data.user.email || input.email.trim().toLowerCase(),
        full_name: input.fullName.trim(),
        phone: input.phone.trim(),
        role: 'student',
      },
      { onConflict: 'id' }
    );

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
    return { success: false, error: err.message || 'An unexpected error occurred' };
  }
}

export async function signInAction(input: SignInInput) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email.trim().toLowerCase(),
      password: input.password,
    });

    if (error || !data.user) {
      return {
        success: false,
        error: error?.message || 'Invalid email or password',
      };
    }

    // Fetch user profile to verify role
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('id, role')
      .eq('id', data.user.id)
      .single();

    const role = profile?.role || 'student';

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
  const supabase = await createClient();
  await supabase.auth.signOut();

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);

  redirect('/login');
}
