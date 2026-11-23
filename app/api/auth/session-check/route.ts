import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyActiveSession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { cookies } from 'next/headers';

/**
 * Validates the caller's active session against database profiles.active_session_token.
 * Enforces single active session per student.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ valid: false, reason: 'unauthenticated' }, { status: 401 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    const result = await verifyActiveSession(user.id, token);

    return NextResponse.json(result);
  } catch (err) {
    console.error('Session check error:', err);
    return NextResponse.json({ valid: false, reason: 'unauthenticated' }, { status: 500 });
  }
}
