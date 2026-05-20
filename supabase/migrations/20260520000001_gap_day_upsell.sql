-- Gap-day upsell tracking
-- Records which 1-night gaps have had upsell messages sent,
-- preventing duplicate sends across cron runs and manual triggers.

CREATE TABLE IF NOT EXISTS public.gap_day_upsell_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_hospitable_id TEXT NOT NULL,
  gap_date DATE NOT NULL,
  checkout_reservation_uuid TEXT NOT NULL,
  checkin_reservation_uuid TEXT NOT NULL,
  original_price_cents INTEGER,
  discounted_price_cents INTEGER,
  currency TEXT NOT NULL DEFAULT 'USD',
  checkout_message_sent_at TIMESTAMPTZ,
  checkin_message_sent_at TIMESTAMPTZ,
  fulfill_checkout_sent_at TIMESTAMPTZ,
  fulfill_checkin_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (property_hospitable_id, gap_date)
);

CREATE INDEX IF NOT EXISTS idx_gap_day_upsell_gap_date
  ON public.gap_day_upsell_log (gap_date);

CREATE INDEX IF NOT EXISTS idx_gap_day_upsell_checkout_uuid
  ON public.gap_day_upsell_log (checkout_reservation_uuid);

CREATE INDEX IF NOT EXISTS idx_gap_day_upsell_checkin_uuid
  ON public.gap_day_upsell_log (checkin_reservation_uuid);

ALTER TABLE public.gap_day_upsell_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role full access gap_day_upsell_log"
    ON public.gap_day_upsell_log FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
