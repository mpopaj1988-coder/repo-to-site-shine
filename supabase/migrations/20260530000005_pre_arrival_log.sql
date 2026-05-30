-- Tracks pre-arrival reminder messages sent to guests 2 days before check-in.
-- UNIQUE on reservation_id prevents duplicate sends.

CREATE TABLE IF NOT EXISTS public.pre_arrival_log (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id          TEXT        NOT NULL UNIQUE,
  property_hospitable_id  TEXT        NOT NULL,
  sent                    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pre_arrival_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can manage pre arrival log"
    ON public.pre_arrival_log FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_pre_arrival_log_property
  ON public.pre_arrival_log (property_hospitable_id);

-- ============================================================
-- POST-MIGRATION: add daily cron (run in Supabase SQL editor)
--
--   SELECT cron.schedule(
--     'pre-arrival-message',
--     '0 10 * * *',
--     $$
--       SELECT net.http_post(
--         url     := 'https://www.seaandcityrentals.com/api/public/pre-arrival-message',
--         headers := '{"Content-Type":"application/json"}'::jsonb,
--         body    := '{}'::jsonb
--       );
--     $$
--   );
--
-- To unschedule: SELECT cron.unschedule('pre-arrival-message');
-- ============================================================
