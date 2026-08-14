import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { requireSupabaseEnv } from "./env";
import type { Database } from "./database.types";

/**
 * Supabase client for Server Components, Route Handlers and Server Actions.
 *
 * Cookie writes are a no-op inside a Server Component (Next.js forbids them
 * there); `src/proxy.ts` refreshes the session on every request instead, so
 * swallowing that error is safe and is the pattern Supabase recommends.
 */
export async function createSupabaseServerClient() {
  const { url, key } = requireSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component — the proxy already refreshed it.
        }
      },
    },
  });
}
