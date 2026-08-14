/**
 * Supabase connection settings, read from the environment.
 *
 * The app is designed to boot without these: when they are missing the
 * curriculum falls back to `sample-data.ts` and /admin shows setup
 * instructions instead of crashing. That keeps `npm run dev` useful on a
 * fresh clone.
 *
 * Note the literal `process.env.X` reads — Next.js inlines NEXT_PUBLIC_*
 * variables at build time only when referenced this way.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

// Newer Supabase projects issue a "publishable" key (sb_publishable_...);
// older ones issue an "anon" key (a JWT). Either works here.
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

export const SUPABASE_URL = url;
export const SUPABASE_PUBLISHABLE_KEY = publishableKey;

export const isSupabaseConfigured = Boolean(url && publishableKey);

/**
 * Use inside code paths that only run when Supabase is configured. Throws a
 * readable error rather than letting the Supabase SDK fail obscurely.
 */
export function requireSupabaseEnv(): { url: string; key: string } {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local (see README).",
    );
  }
  return { url, key: publishableKey };
}
