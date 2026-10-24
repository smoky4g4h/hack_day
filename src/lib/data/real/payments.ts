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
  const res = await supabase().rpc("create_payment_order", { p_booking_id: bookingId });
  return unwrap(res) as unknown as PaymentOrder;
}

export async function getPayment(bookingId: string): Promise<Payment> {
  const res = await supabase().from("payments").select("*").eq("booking_id", bookingId).single();
  return unwrap(res) as Payment;
}

export async function getWalletBalance(): Promise<WalletBalance> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const res = await supabase().from("wallets").select("balance_inr").eq("user_id", user.id).single();
  const data = unwrap(res);
  return { balanceInr: Number(data.balance_inr), lastTopUp: null };
}

export async function topUpWallet(amountInr: number): Promise<WalletBalance> {
  if (amountInr < 50) throw new Error("Minimum top-up is ₹50");

  const res = await supabase().rpc("top_up_wallet", { p_amount: amountInr });
  return unwrap(res) as unknown as WalletBalance;
}
