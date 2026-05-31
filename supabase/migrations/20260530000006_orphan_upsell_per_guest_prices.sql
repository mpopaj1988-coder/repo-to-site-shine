-- Adds per-guest discounted price columns to orphan_upsell_log.
-- Outgoing and incoming guests may be on different platforms (Airbnb vs direct),
-- so they can be offered different prices for the same orphan night.

ALTER TABLE public.orphan_upsell_log
  ADD COLUMN IF NOT EXISTS outgoing_discounted_price_usd INTEGER,
  ADD COLUMN IF NOT EXISTS incoming_discounted_price_usd INTEGER;
