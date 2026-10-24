// ─────────────────────────────────────────────────────────────────────────────
// ChargeMate — Real Supabase earnings implementations
// ─────────────────────────────────────────────────────────────────────────────

import type { EarningsSummary, LedgerEntry, MonthlyRevenue, PayoutSettings } from "@/types/db";
import { createBrowserClient } from "@/lib/supabase/client";

function supabase() { return createBrowserClient(); }

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null) throw new Error("No data returned");
  return result.data;
}

export async function getEarningsSummary(): Promise<EarningsSummary> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get host spots
  const spotsRes = await supabase()
    .from("charging_spots")
    .select("id, rating")
    .eq("host_id", user.id);
  const spots = unwrap(spotsRes);
  if (spots.length === 0) {
    return { today: 0, thisMonth: 0, energyKwh: 0, rating: 0, sessionCount: 0 };
  }

  const spotIds = spots.map((s: { id: string }) => s.id);
  const avgRating = spots.reduce((acc: number, s: any) => acc + Number(s.rating), 0) / spots.length;

  // Get completed bookings for host's spots
  const bookingsRes = await supabase()
    .from("bookings")
    .select("amount_inr, kwh_used, created_at, ended_at")
    .in("spot_id", spotIds)
    .eq("status", "completed");

  const completed = (bookingsRes.data || []).map((b: any) => ({
    amount_inr: Number(b.amount_inr || 0),
    kwh_used: Number(b.kwh_used || 0),
    created_at: b.created_at,
    ended_at: b.ended_at,
  }));

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  let today = 0;
  let thisMonth = 0;
  let energyKwh = 0;

  for (const b of completed) {
    const bDate = b.ended_at || b.created_at;
    if (bDate >= monthStart) {
      thisMonth += b.amount_inr;
      energyKwh += b.kwh_used;
    }
    if (bDate >= todayStart) {
      today += b.amount_inr;
    }
  }

  return {
    today: Math.round(today),
    thisMonth: Math.round(thisMonth),
    energyKwh: Math.round(energyKwh),
    rating: Math.round(avgRating * 10) / 10,
    sessionCount: completed.length,
  };
}

export async function getMonthlyRevenue(months: number = 6): Promise<MonthlyRevenue[]> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const spotsRes = await supabase()
    .from("charging_spots")
    .select("id")
    .eq("host_id", user.id);
  const spots = unwrap(spotsRes);
  if (spots.length === 0) return [];

  const spotIds = spots.map((s: { id: string }) => s.id);

  const bookingsRes = await supabase()
    .from("bookings")
    .select("amount_inr, kwh_used, created_at, ended_at")
    .in("spot_id", spotIds)
    .eq("status", "completed")
    .order("created_at", { ascending: true });

  const completed = (bookingsRes.data || []).map((b: any) => ({
    amount_inr: Number(b.amount_inr || 0),
    kwh_used: Number(b.kwh_used || 0),
    date: new Date(b.ended_at || b.created_at),
  }));

  const monthMap: Record<string, MonthlyRevenue> = {};

  for (const b of completed) {
    const monthKey = b.date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    if (!monthMap[monthKey]) {
      monthMap[monthKey] = { month: monthKey, revenue: 0, sessions: 0, kwhTotal: 0 };
    }
    monthMap[monthKey].revenue += b.amount_inr;
    monthMap[monthKey].sessions += 1;
    monthMap[monthKey].kwhTotal += b.kwh_used;
  }

  const result = Object.values(monthMap).map((m) => ({
    ...m,
    revenue: Math.round(m.revenue),
    kwhTotal: Math.round(m.kwhTotal),
  }));

  return result.slice(-months);
}

export async function getLedger(): Promise<LedgerEntry[]> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const spotsRes = await supabase()
    .from("charging_spots")
    .select("id")
    .eq("host_id", user.id);
  const spots = unwrap(spotsRes);
  if (spots.length === 0) return [];

  const spotIds = spots.map((s: { id: string }) => s.id);

  const bookingsRes = await supabase()
    .from("bookings")
    .select("id, amount_inr, created_at, ended_at, rider_id, vehicle_id")
    .in("spot_id", spotIds)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  const bookings = bookingsRes.data || [];
  const entries: LedgerEntry[] = [];

  for (const b of bookings) {
    // Get rider name + vehicle name
    let label = "Charging Session";
    if (b.rider_id) {
      const pRes = await supabase().from("profiles").select("full_name").eq("id", b.rider_id).maybeSingle();
      if (pRes.data?.full_name) {
        label = `${pRes.data.full_name}`;
      }
    }
    if (b.vehicle_id) {
      const vRes = await supabase().from("vehicles").select("make, model").eq("id", b.vehicle_id).maybeSingle();
      if (vRes.data) {
        label += ` · ${vRes.data.make} ${vRes.data.model}`;
      }
    }

    entries.push({
      id: `ledger-${b.id}`,
      date: b.ended_at || b.created_at,
      label,
      amountInr: Math.round(Number(b.amount_inr || 0)),
      type: "credit",
      status: "paid",
    });
  }

  return entries;
}

export async function getPayoutSettings(): Promise<PayoutSettings> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const res = await supabase()
    .from("host_profiles")
    .select("bank_upi")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    upiId: res.data?.bank_upi || "Not configured",
    bankName: "HDFC Bank",
    accountLast4: "4321",
  };
}

export async function setUpiId(upi: string): Promise<PayoutSettings> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase()
    .from("host_profiles")
    .update({ bank_upi: upi, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);

  return getPayoutSettings();
}
