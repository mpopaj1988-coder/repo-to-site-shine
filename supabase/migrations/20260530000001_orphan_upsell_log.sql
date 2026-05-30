-- Tracks orphan-day upsell messages sent to guests.
-- An "orphan day" is a single vacant day between two consecutive bookings.
-- We offer both the departing guest (extend checkout) and arriving guest
-- (early check-in) a 20% discount to fill that night.
-- The UNIQUE constraint on (property_hospitable_id, orphan_date) prevents
-- duplicate messages if the cron fires multiple times before a booking fills
-- the gap.

CREATE TABLE IF NOT EXISTS public.orphan_upsell_log (
  id                      UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  property_hospitable_id  TEXT      NOT NULL,
  orphan_date             DATE      NOT NULL,
  outgoing_reservation_id TEXT      NOT NULL,  -- reservation checking out before orphan day
  incoming_reservation_id TEXT      NOT NULL,  -- reservation checking in after orphan day
  outgoing_sent           BOOLEAN   NOT NULL DEFAULT FALSE,
  incoming_sent           BOOLEAN   NOT NULL DEFAULT FALSE,
  orphan_day_price_usd    NUMERIC(10, 2),
  discounted_price_usd    NUMERIC(10, 2),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (property_hospitable_id, orphan_date)
);

ALTER TABLE public.orphan_upsell_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can manage orphan upsell log"
    ON public.orphan_upsell_log FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_orphan_upsell_log_property
  ON public.orphan_upsell_log (property_hospitable_id);
CREATE INDEX IF NOT EXISTS idx_orphan_upsell_log_date
  ON public.orphan_upsell_log (orphan_date);

-- ============================================================
-- POST-MIGRATION: pg_cron setup (apply via Supabase SQL editor)
-- ============================================================
-- Schedule orphan-day upsell scan every 4 hours so new bookings
-- receive their upsell offer within 4 hours (usually within minutes
-- if you also configure a Hospitable webhook pointing to this endpoint).
--
-- Run this in the Supabase SQL editor after applying the migration:
--
--   SELECT cron.schedule(
--     'orphan-day-upsell',
--     '0 */4 * * *',
--     $$
--       SELECT net.http_post(
--         url     := 'https://www.seaandcityrentals.com/api/public/orphan-day-upsell',
--         headers := '{"Content-Type":"application/json"}'::jsonb,
--         body    := '{}'::jsonb
--       );
--     $$
--   );
--
-- To unschedule:  SELECT cron.unschedule('orphan-day-upsell');
-- To view jobs:   SELECT * FROM cron.job;
-- ============================================================
