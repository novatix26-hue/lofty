/**
 * Detects whether the current Supabase environment is using placeholder credentials.
 * Used to gracefully switch to local demo preview mode during development.
 */
export function isPlaceholderConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return true;
  if (url.includes('your-project-id') || url.includes('placeholder')) return true;
  if (anonKey.includes('placeholder')) return true;

  return false;
}
