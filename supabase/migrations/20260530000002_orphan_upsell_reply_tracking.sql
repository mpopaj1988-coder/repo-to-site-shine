-- Add YES-detection and alteration-handling columns to orphan_upsell_log.
-- These track whether each adjacent guest replied YES and whether the
-- host action (alteration request / direct reservation update) has been handled.

ALTER TABLE public.orphan_upsell_log
  ADD COLUMN IF NOT EXISTS outgoing_yes_detected       BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS incoming_yes_detected       BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS outgoing_alteration_handled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS incoming_alteration_handled BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================
-- POST-MIGRATION: add hourly cron for reply processing
-- Run this in the Supabase SQL editor after applying migration:
--
--   SELECT cron.schedule(
--     'process-upsell-replies',
--     '15 * * * *',
--     $$
--       SELECT net.http_post(
--         url     := 'https://www.seaandcityrentals.com/api/public/process-upsell-replies',
--         headers := '{"Content-Type":"application/json"}'::jsonb,
--         body    := '{}'::jsonb
--       );
--     $$
--   );
--
-- To unschedule: SELECT cron.unschedule('process-upsell-replies');
-- ============================================================
