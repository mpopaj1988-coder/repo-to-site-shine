-- Adds YES-reply tracking to the rebooking campaign log.
-- Stores what price was quoted so we can detect and correct errors.

ALTER TABLE public.rebooking_campaign_log
  ADD COLUMN IF NOT EXISTS yes_detected          BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS yes_handled           BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS quoted_discounted_price_usd INTEGER;

-- ============================================================
-- POST-MIGRATION: add hourly cron for reply processing
-- Run this in the Supabase SQL editor after applying:
--
--   SELECT cron.schedule(
--     'process-rebooking-replies',
--     '30 * * * *',
--     $$
--       SELECT net.http_post(
--         url     := 'https://www.seaandcityrentals.com/api/public/process-rebooking-replies',
--         headers := '{"Content-Type":"application/json"}'::jsonb,
--         body    := '{}'::jsonb
--       );
--     $$
--   );
--
-- To unschedule: SELECT cron.unschedule('process-rebooking-replies');
-- ============================================================
