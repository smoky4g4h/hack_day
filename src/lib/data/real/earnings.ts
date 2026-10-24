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

  const res = await supabase().rpc("get_host_earnings_summary", { p_host_id: user.id });
  return unwrap(res) as unknown as EarningsSummary;
}

export async function getMonthlyRevenue(months: number = 6): Promise<MonthlyRevenue[]> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const res = await supabase().rpc("get_host_monthly_revenue", { p_host_id: user.id, p_months: months });
  return unwrap(res) as unknown as MonthlyRevenue[];
}

export async function getLedger(): Promise<LedgerEntry[]> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const res = await supabase().rpc("get_host_ledger", { p_host_id: user.id });
  return unwrap(res) as unknown as LedgerEntry[];
}

export async function getPayoutSettings(): Promise<PayoutSettings> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const res = await supabase().from("host_profiles").select("bank_upi").eq("user_id", user.id).single();
  const data = unwrap(res);
  return { upiId: data.bank_upi, bankName: null, accountLast4: null };
}

export async function setUpiId(upi: string): Promise<PayoutSettings> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const res = await supabase().from("host_profiles").update({ bank_upi: upi }).eq("user_id", user.id).select("bank_upi").single();
  const data = unwrap(res);
  return { upiId: data.bank_upi, bankName: null, accountLast4: null };
}
