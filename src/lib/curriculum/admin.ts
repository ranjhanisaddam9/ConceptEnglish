import "server-only";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Who is allowed into /admin.
 *
 * Authentication is Supabase Auth; authorisation is a row in `admin_users`.
 * Keeping the two separate means enabling public sign-up later (for parents,
 * say) does not accidentally hand out curriculum editing rights.
 */

export type AdminSession =
  | { state: "unconfigured" }
  | { state: "signed-out" }
  | { state: "not-authorised"; email: string | null }
  | { state: "admin"; userId: string; email: string | null };

export async function getAdminSession(): Promise<AdminSession> {
  if (!isSupabaseConfigured) return { state: "unconfigured" };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { state: "signed-out" };

  const { data } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return { state: "not-authorised", email: user.email ?? null };

  return { state: "admin", userId: user.id, email: user.email ?? null };
}
