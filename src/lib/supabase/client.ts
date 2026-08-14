"use client";

import { createBrowserClient } from "@supabase/ssr";

import { requireSupabaseEnv } from "./env";
import type { Database } from "./database.types";

/**
 * Browser-side Supabase client. Used for auth (login/logout) and for direct
 * Storage uploads from the admin forms. Data reads/writes go through server
 * actions instead, so the browser client stays thin.
 */
export function createSupabaseBrowserClient() {
  const { url, key } = requireSupabaseEnv();
  return createBrowserClient<Database>(url, key);
}
