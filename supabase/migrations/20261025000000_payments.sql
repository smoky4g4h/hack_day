-- ── Payments & Wallet Updates ───────────────────────────────────────────────

-- Create wallet_transactions table
CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_inr numeric(12,2) NOT NULL,
  type text NOT NULL CHECK (type IN ('top_up', 'booking_payment')),
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transactions: owner read" ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions: service all" ON public.wallet_transactions FOR ALL USING (auth.role() = 'service_role');

-- Update payments table to support idempotency if needed (already has unique booking_id)
-- Ensure trigger to update wallet balance exists
CREATE OR REPLACE FUNCTION public.process_payment_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF (NEW.status = 'paid' AND OLD.status = 'pending') THEN
    -- Distribute to wallet/payout record
    UPDATE public.wallets SET balance_inr = balance_inr + NEW.host_payout_inr
    WHERE user_id = (SELECT host_id FROM public.reviews WHERE booking_id = NEW.booking_id);
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_payments_paid AFTER UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.process_payment_update();
