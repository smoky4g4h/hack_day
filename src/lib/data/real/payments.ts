// ─────────────────────────────────────────────────────────────────────────────
// ChargeMate — Real Supabase payments implementations
// ─────────────────────────────────────────────────────────────────────────────

import type { Payment, PaymentOrder, WalletBalance } from "@/types/db";
import { createBrowserClient } from "@/lib/supabase/client";

function supabase() { return createBrowserClient(); }

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null) throw new Error("No data returned");
  return result.data;
}

export async function createPayment(bookingId: string): Promise<PaymentOrder> {
  return {
    orderId: `order_real_${Date.now()}`,
    amountInr: 150,
    key: "rzp_test_placeholder",
  };
}

export async function getPayment(bookingId: string): Promise<Payment> {
  const res = await supabase()
    .from("payments")
    .select("*")
    .eq("booking_id", bookingId)
    .single();
  const p = unwrap(res);
  return {
    ...p,
    amount_inr: Number(p.amount_inr),
    platform_fee_inr: Number(p.platform_fee_inr),
    host_payout_inr: Number(p.host_payout_inr),
  };
}

export async function getWalletBalance(): Promise<WalletBalance> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const res = await supabase()
    .from("wallets")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (res.error) throw new Error(res.error.message);
  if (!res.data) {
    return {
      balanceInr: 0,
      lastTopUp: null,
    };
  }

  return {
    balanceInr: Number(res.data.balance_inr),
    lastTopUp: res.data.updated_at,
  };
}

export async function topUpWallet(amountInr: number): Promise<WalletBalance> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (amountInr < 50) throw new Error("Minimum top-up is ₹50");

  const current = await getWalletBalance();
  const newBalance = current.balanceInr + amountInr;

  const res = await supabase()
    .from("wallets")
    .upsert({
      user_id: user.id,
      balance_inr: newBalance,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  const w = unwrap(res);
  return {
    balanceInr: Number(w.balance_inr),
    lastTopUp: w.updated_at,
  };
}
