// ─────────────────────────────────────────────────────────────────────────────
// ChargeMate — Real Supabase spots implementations
// ─────────────────────────────────────────────────────────────────────────────

import type { ChargingSpot, ConnectorType, SpotUpdatePayload } from "@/types/db";
import { createBrowserClient } from "@/lib/supabase/client";

function supabase() { return createBrowserClient(); }

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null) throw new Error("No data returned");
  return result.data;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface GetNearbySpotsParams {
  lat:         number;
  lng:         number;
  radiusKm:    number;
  connector?:  ConnectorType;
  onlineOnly?: boolean;
}

export async function getNearbySpots(params: GetNearbySpotsParams): Promise<ChargingSpot[]> {
  const { lat, lng, radiusKm, connector, onlineOnly = true } = params;

  let query = supabase().from("charging_spots").select("*");
  if (onlineOnly) {
    query = query.eq("is_online", true);
  }
  if (connector) {
    query = query.eq("connector", connector);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  if (!data) return [];

  return data
    .map((s: any) => {
      const dist = haversineKm(lat, lng, Number(s.lat), Number(s.lng));
      return {
        ...s,
        lat: Number(s.lat),
        lng: Number(s.lng),
        power_kw: Number(s.power_kw),
        price_per_kwh: Number(s.price_per_kwh),
        rating: Number(s.rating),
        review_count: Number(s.review_count),
        photos: s.photos || [],
        distance_km: Math.round(dist * 10) / 10,
      };
    })
    .filter((s) => s.distance_km <= radiusKm)
    .sort((a, b) => (a.distance_km ?? 99) - (b.distance_km ?? 99));
}

export async function getSpot(id: string): Promise<ChargingSpot> {
  const res = await supabase().from("charging_spots").select("*").eq("id", id).single();
  const s = unwrap(res);
  return {
    ...s,
    lat: Number(s.lat),
    lng: Number(s.lng),
    power_kw: Number(s.power_kw),
    price_per_kwh: Number(s.price_per_kwh),
    rating: Number(s.rating),
    review_count: Number(s.review_count),
    photos: s.photos || [],
  };
}

export async function getMySpot(): Promise<ChargingSpot> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const res = await supabase().from("charging_spots").select("*").eq("host_id", user.id).single();
  const s = unwrap(res);
  return {
    ...s,
    lat: Number(s.lat),
    lng: Number(s.lng),
    power_kw: Number(s.power_kw),
    price_per_kwh: Number(s.price_per_kwh),
    rating: Number(s.rating),
    review_count: Number(s.review_count),
    photos: s.photos || [],
  };
}

export async function updateMySpot(data: SpotUpdatePayload): Promise<ChargingSpot> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const res = await supabase()
    .from("charging_spots")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("host_id", user.id)
    .select()
    .single();
  const s = unwrap(res);
  return {
    ...s,
    lat: Number(s.lat),
    lng: Number(s.lng),
    power_kw: Number(s.power_kw),
    price_per_kwh: Number(s.price_per_kwh),
    rating: Number(s.rating),
    review_count: Number(s.review_count),
    photos: s.photos || [],
  };
}

export async function setSpotOnline(isOnline: boolean): Promise<ChargingSpot> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const res = await supabase()
    .from("charging_spots")
    .update({ is_online: isOnline, updated_at: new Date().toISOString() })
    .eq("host_id", user.id)
    .select()
    .single();
  const s = unwrap(res);
  return {
    ...s,
    lat: Number(s.lat),
    lng: Number(s.lng),
    power_kw: Number(s.power_kw),
    price_per_kwh: Number(s.price_per_kwh),
    rating: Number(s.rating),
    review_count: Number(s.review_count),
    photos: s.photos || [],
  };
}
