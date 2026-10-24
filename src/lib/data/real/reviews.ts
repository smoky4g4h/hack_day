// ─────────────────────────────────────────────────────────────────────────────
// ChargeMate — Real Supabase reviews implementations
// ─────────────────────────────────────────────────────────────────────────────

import type { Review } from "@/types/db";
import { createBrowserClient } from "@/lib/supabase/client";

function supabase() { return createBrowserClient(); }

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null) throw new Error("No data returned");
  return result.data;
}

export async function getReviewsForHost(hostId: string): Promise<Review[]> {
  const res = await supabase()
    .from("reviews")
    .select("*")
    .eq("host_id", hostId)
    .order("created_at", { ascending: false });
  return (unwrap(res) as any[]).map((r) => ({
    ...r,
    rating: Number(r.rating),
  })) as Review[];
}

export async function getMyReviews(): Promise<Review[]> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const res = await supabase()
    .from("reviews")
    .select("*")
    .eq("rater_id", user.id)
    .order("created_at", { ascending: false });
  return (unwrap(res) as any[]).map((r) => ({
    ...r,
    rating: Number(r.rating),
  })) as Review[];
}

export async function replyToReview(id: string, text: string): Promise<Review> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const res = await supabase()
    .from("reviews")
    .update({ reply: text, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("host_id", user.id)
    .select()
    .single();
  const r = unwrap(res);
  return {
    ...r,
    rating: Number(r.rating),
  } as Review;
}

export interface SubmitReviewParams {
  bookingId: string;
  rating:    number;
  comment:   string;
}

export async function submitReview(params: SubmitReviewParams): Promise<Review> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (params.rating < 1 || params.rating > 5)
    throw new Error("Rating must be between 1 and 5");

  // Get booking to know host_id
  const bookingRes = await supabase()
    .from("bookings")
    .select("spot_id, rider_id")
    .eq("id", params.bookingId)
    .single();
  const booking = unwrap(bookingRes);

  const spotRes = await supabase()
    .from("charging_spots")
    .select("host_id")
    .eq("id", booking.spot_id)
    .single();
  const spot = unwrap(spotRes);

  const res = await supabase()
    .from("reviews")
    .insert({
      booking_id: params.bookingId,
      rater_id: user.id,
      host_id: spot.host_id,
      rating: params.rating,
      comment: params.comment || null,
      reply: null,
    })
    .select()
    .single();
  const r = unwrap(res);
  return {
    ...r,
    rating: Number(r.rating),
  } as Review;
}
