// ─────────────────────────────────────────────────────────────────────────────
// ChargeMate — Data Layer Index
//
// This is the ONLY import point for data functions in the entire app.
//
//   import { getNearbySpots, getBooking } from "@/lib/data"
//
// When NEXT_PUBLIC_USE_MOCK === "true"  → mock implementations (no Supabase)
// When NEXT_PUBLIC_USE_MOCK !== "true"  → real Supabase implementations
//
// Never import from individual lib/data/*.ts files in components.
// ─────────────────────────────────────────────────────────────────────────────

// ── Shared persona IDs ────────────────────────────────────────────────────────
// In mock files, import from "./constants" (not here) to avoid circular deps.
export { MOCK_HOST_ID, MOCK_RIDER_ID } from "./constants";

// ── Switch ────────────────────────────────────────────────────────────────────
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

// ── Bookings ──────────────────────────────────────────────────────────────────
import * as mockBookings from "./bookings";
import * as realBookings from "./real/bookings";

export const requestBooking    = USE_MOCK ? mockBookings.requestBooking    : realBookings.requestBooking;
export const getBooking        = USE_MOCK ? mockBookings.getBooking        : realBookings.getBooking;
export const getMyBookings     = USE_MOCK ? mockBookings.getMyBookings     : realBookings.getMyBookings;
export const getIncomingRequests = USE_MOCK ? mockBookings.getIncomingRequests : realBookings.getIncomingRequests;
export const acceptBooking     = USE_MOCK ? mockBookings.acceptBooking     : realBookings.acceptBooking;
export const declineBooking    = USE_MOCK ? mockBookings.declineBooking    : realBookings.declineBooking;
export const cancelBooking     = USE_MOCK ? mockBookings.cancelBooking     : realBookings.cancelBooking;
export const startSession      = USE_MOCK ? mockBookings.startSession      : realBookings.startSession;
export const getSessionProgress = USE_MOCK ? mockBookings.getSessionProgress : realBookings.getSessionProgress;
export const endSession        = USE_MOCK ? mockBookings.endSession        : realBookings.endSession;

// Real-only helpers (no-op stubs in mock mode)
export const onBookingChange = USE_MOCK
  ? (_id: string, _handler: (b: import("@/types/db").Booking) => void) => () => {}
  : realBookings.onBookingChange;

export const onIncomingBookingChanges = USE_MOCK
  ? (_handler: (b: import("@/types/db").Booking) => void) => () => {}
  : realBookings.onIncomingBookingChanges;

export const setMeterProvider = USE_MOCK
  ? (_m: import("./meter-provider").MeterProvider) => {}
  : realBookings.setMeterProvider;

// ── Spots ─────────────────────────────────────────────────────────────────────
import * as mockSpots from "./spots";
import * as realSpots from "./real/spots";

export const getNearbySpots = USE_MOCK ? mockSpots.getNearbySpots : realSpots.getNearbySpots;
export const getSpot        = USE_MOCK ? mockSpots.getSpot        : realSpots.getSpot;
export const getMySpot      = USE_MOCK ? mockSpots.getMySpot      : realSpots.getMySpot;
export const updateMySpot   = USE_MOCK ? mockSpots.updateMySpot   : realSpots.updateMySpot;
export const setSpotOnline  = USE_MOCK ? mockSpots.setSpotOnline  : realSpots.setSpotOnline;

// ── Vehicles ──────────────────────────────────────────────────────────────────
import * as mockVehicles from "./vehicles";
import * as realVehicles from "./real/vehicles";

export const getMyVehicles = USE_MOCK ? mockVehicles.getMyVehicles : realVehicles.getMyVehicles;
export const getVehicle    = USE_MOCK ? mockVehicles.getVehicle    : realVehicles.getVehicle;
export const addVehicle    = USE_MOCK ? mockVehicles.addVehicle    : realVehicles.addVehicle;
export const updateVehicle = USE_MOCK ? mockVehicles.updateVehicle : realVehicles.updateVehicle;
export const deleteVehicle = USE_MOCK ? mockVehicles.deleteVehicle : realVehicles.deleteVehicle;

// ── Earnings ──────────────────────────────────────────────────────────────────
import * as mockEarnings from "./earnings";
import * as realEarnings from "./real/earnings";

export const getEarningsSummary = USE_MOCK ? mockEarnings.getEarningsSummary : realEarnings.getEarningsSummary;
export const getMonthlyRevenue  = USE_MOCK ? mockEarnings.getMonthlyRevenue  : realEarnings.getMonthlyRevenue;
export const getLedger          = USE_MOCK ? mockEarnings.getLedger          : realEarnings.getLedger;
export const getPayoutSettings  = USE_MOCK ? mockEarnings.getPayoutSettings  : realEarnings.getPayoutSettings;
export const setUpiId           = USE_MOCK ? mockEarnings.setUpiId           : realEarnings.setUpiId;

// ── Reviews ───────────────────────────────────────────────────────────────────
import * as mockReviews from "./reviews";
import * as realReviews from "./real/reviews";

export const getReviewsForHost = USE_MOCK ? mockReviews.getReviewsForHost : realReviews.getReviewsForHost;
export const getMyReviews      = USE_MOCK ? mockReviews.getMyReviews      : realReviews.getMyReviews;
export const replyToReview     = USE_MOCK ? mockReviews.replyToReview     : realReviews.replyToReview;
export const submitReview      = USE_MOCK ? mockReviews.submitReview      : realReviews.submitReview;

// ── Profile ───────────────────────────────────────────────────────────────────
import * as mockProfile from "./profile";
import * as realProfile from "./real/profile";

export const getMyProfile = USE_MOCK ? mockProfile.getMyProfile : realProfile.getMyProfile;
export const setActiveMode = USE_MOCK ? mockProfile.setActiveMode : realProfile.setActiveMode;

// ── Payments ──────────────────────────────────────────────────────────────────
import * as mockPayments from "./payments";
import * as realPayments from "./real/payments";

export const createPayment    = USE_MOCK ? mockPayments.createPayment    : realPayments.createPayment;
export const getPayment       = USE_MOCK ? mockPayments.getPayment       : realPayments.getPayment;
export const getWalletBalance = USE_MOCK ? mockPayments.getWalletBalance : realPayments.getWalletBalance;
export const topUpWallet      = USE_MOCK ? mockPayments.topUpWallet      : realPayments.topUpWallet;

// ── MeterProvider re-exports ──────────────────────────────────────────────────
export type { MeterProvider, MeterReading } from "./meter-provider";
export { SimulatedMeterProvider, simulatedMeter } from "./meter-provider";

// ── Re-export all types so callers only need one import ───────────────────────
export type {
  // Tables
  Profile,
  Vehicle,
  HostProfile,
  ChargingSpot,
  Booking,
  Payment,
  Review,
  // Primitives / enums
  ConnectorType,
  VehicleType,
  ActiveMode,
  BookingStatus,
  PaymentStatus,
  VerificationStatus,
  // Composites
  SessionProgress,
  EarningsSummary,
  LedgerEntry,
  MonthlyRevenue,
  PayoutSettings,
  PaymentOrder,
  WalletBalance,
  SpotUpdatePayload,
  VehiclePayload,
} from "@/types/db";

export type { GetNearbySpotsParams } from "./spots";
export type { RequestBookingParams } from "./bookings";
export type { SubmitReviewParams } from "./reviews";
