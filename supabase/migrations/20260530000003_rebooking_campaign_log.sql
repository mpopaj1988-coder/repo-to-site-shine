-- Tracks re-booking campaign messages sent to past guests.
-- When an open stretch appears that overlaps (±14 days) with a guest's stay
-- from the previous year, we send them a personalised "come back" offer.
-- UNIQUE on (property_hospitable_id, guest_reservation_id, available_start_date)
-- prevents duplicate messages for the same guest/window combination.

CREATE TABLE IF NOT EXISTS public.rebooking_campaign_log (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_hospitable_id  TEXT        NOT NULL,
  guest_reservation_id    TEXT        NOT NULL,  -- past reservation that triggered the match
  available_start_date    DATE        NOT NULL,  -- first night of the open stretch offered
  available_end_date      DATE        NOT NULL,  -- last night of the open stretch offered
  sent                    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (property_hospitable_id, guest_reservation_id, available_start_date)
);

ALTER TABLE public.rebooking_campaign_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can manage rebooking campaign log"
    ON public.rebooking_campaign_log FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_rebooking_campaign_property
  ON public.rebooking_campaign_log (property_hospitable_id);
CREATE INDEX IF NOT EXISTS idx_rebooking_campaign_reservation
  ON public.rebooking_campaign_log (guest_reservation_id);

-- ============================================================
-- POST-MIGRATION: add weekly cron (run in Supabase SQL editor)
--
--   SELECT cron.schedule(
--     'rebooking-campaign',
--     '0 10 * * 1',
--     $$
--       SELECT net.http_post(
--         url     := 'https://www.seaandcityrentals.com/api/public/rebooking-campaign',
--         headers := '{"Content-Type":"application/json"}'::jsonb,
--         body    := '{}'::jsonb
--       );
--     $$
--   );
--
-- To unschedule: SELECT cron.unschedule('rebooking-campaign');
-- ============================================================
