// ─────────────────────────────────────────────────────────────────────────────
// ChargeMate — Real Supabase profile implementations
// ─────────────────────────────────────────────────────────────────────────────

import type { Profile, ActiveMode } from "@/types/db";
import { createBrowserClient } from "@/lib/supabase/client";

function supabase() { return createBrowserClient(); }

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null) throw new Error("No data returned");
  return result.data;
}

export async function getMyProfile(): Promise<Profile> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const res = await supabase().from("profiles").select("*").eq("id", user.id).single();
  return unwrap(res) as Profile;
}

export async function setActiveMode(mode: ActiveMode): Promise<Profile> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const res = await supabase()
    .from("profiles")
    .update({ active_mode: mode, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select()
    .single();
  return unwrap(res) as Profile;
}
