-- The Stripe webhook writes a price breakdown (accommodation / cleaning / tax)
-- that the original bookings migration never included. Without these columns
-- every booking insert fails at the DB level.
-- (Already applied to production 2026-07-31 via apply_migration.)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS accommodation_amount NUMERIC(10,2);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cleaning_fee_amount NUMERIC(10,2);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10,2);
