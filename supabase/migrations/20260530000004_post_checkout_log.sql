-- Tracks post-checkout thank-you messages sent to guests.
-- Sent within ~24 hours of checkout: thanks them, asks for a review,
-- and includes the property's direct booking link.
-- UNIQUE on reservation_id prevents double-sends.

CREATE TABLE IF NOT EXISTS public.post_checkout_log (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id          TEXT        NOT NULL UNIQUE,
  property_hospitable_id  TEXT        NOT NULL,
  sent                    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.post_checkout_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can manage post checkout log"
    ON public.post_checkout_log FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_post_checkout_log_property
  ON public.post_checkout_log (property_hospitable_id);

-- ============================================================
-- POST-MIGRATION: add daily cron (run in Supabase SQL editor)
--
--   SELECT cron.schedule(
--     'post-checkout-message',
--     '0 12 * * *',
--     $$
--       SELECT net.http_post(
--         url     := 'https://www.seaandcityrentals.com/api/public/post-checkout-message',
--         headers := '{"Content-Type":"application/json"}'::jsonb,
--         body    := '{}'::jsonb
--       );
--     $$
--   );
--
-- To unschedule: SELECT cron.unschedule('post-checkout-message');
-- ============================================================
