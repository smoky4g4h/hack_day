// ─────────────────────────────────────────────────────────────────────────────
// ChargeMate — Real Supabase vehicles implementations
// ─────────────────────────────────────────────────────────────────────────────

import type { Vehicle, VehiclePayload } from "@/types/db";
import { createBrowserClient } from "@/lib/supabase/client";

function supabase() { return createBrowserClient(); }

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null) throw new Error("No data returned");
  return result.data;
}

export async function getMyVehicles(): Promise<Vehicle[]> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const res = await supabase()
    .from("vehicles")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });
  return unwrap(res) as Vehicle[];
}

export async function getVehicle(id: string): Promise<Vehicle> {
  const res = await supabase().from("vehicles").select("*").eq("id", id).single();
  return unwrap(res) as Vehicle;
}

export async function addVehicle(data: VehiclePayload): Promise<Vehicle> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const res = await supabase()
    .from("vehicles")
    .insert({
      ...data,
      owner_id: user.id,
    })
    .select()
    .single();
  return unwrap(res) as Vehicle;
}

export async function updateVehicle(id: string, data: Partial<VehiclePayload>): Promise<Vehicle> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const res = await supabase()
    .from("vehicles")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", user.id)
    .select()
    .single();
  return unwrap(res) as Vehicle;
}

export async function deleteVehicle(id: string): Promise<void> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const res = await supabase()
    .from("vehicles")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);
  if (res.error) throw new Error(res.error.message);
}
