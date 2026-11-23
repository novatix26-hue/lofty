import { createAdminClient } from '@/lib/supabase/admin';
import type { SessionCheckResult } from '@/types';

export const SESSION_COOKIE_NAME = 'lofty_session_token';

/**
 * Generates a cryptographically strong unique session identifier
 */
export function generateSessionToken(): string {
  return crypto.randomUUID();
}

/**
 * Updates the user's active session ID in the database.
 * Used during login or session rotation.
 */
export async function registerActiveSession(
  userId: string,
  sessionToken: string
): Promise<boolean> {
  const admin = createAdminClient();

  const { error } = await admin
    .from('profiles')
    .update({
      active_session_id: sessionToken,
      active_session_token: sessionToken,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  return !error;
}

/**
 * Verifies if the request's session token matches active_session_id recorded in profiles.
 * Enforces single active session per student.
 */
export async function verifyActiveSession(
  userId: string,
  providedToken: string | undefined
): Promise<SessionCheckResult> {
  if (!providedToken) {
    return { valid: false, reason: 'unauthenticated' };
  }

  const admin = createAdminClient();

  const { data: profile, error } = await admin
    .from('profiles')
    .select('id, role, active_session_id, active_session_token')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    return { valid: false, reason: 'user_not_found' };
  }

  // Admins are exempt from single-session restriction for multi-device dashboard management
  if (profile.role === 'admin') {
    return { valid: true, userId: profile.id, role: profile.role };
  }

  // Students must match the active session token exactly
  const activeSessionId = profile.active_session_id || profile.active_session_token;
  if (activeSessionId !== providedToken) {
    return { valid: false, reason: 'session_superseded' };
  }

  return { valid: true, userId: profile.id, role: profile.role };
}
