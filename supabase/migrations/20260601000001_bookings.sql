-- Direct bookings table for Stripe-based reservations.
-- Stores booking details, cancel token, and refund state.

CREATE TABLE IF NOT EXISTS public.bookings (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id        TEXT UNIQUE NOT NULL,
  stripe_payment_intent_id TEXT,
  property_slug            TEXT NOT NULL,
  property_title           TEXT NOT NULL,
  guest_email              TEXT NOT NULL,
  guest_name               TEXT,
  check_in                 DATE NOT NULL,
  check_out                DATE NOT NULL,
  nights                   INTEGER NOT NULL,
  total_amount             NUMERIC(10,2) NOT NULL,
  currency                 TEXT NOT NULL DEFAULT 'usd',
  cancel_token             TEXT UNIQUE NOT NULL,
  status                   TEXT NOT NULL DEFAULT 'confirmed'
                             CHECK (status IN ('confirmed', 'cancelled')),
  refund_amount            NUMERIC(10,2),
  cancelled_at             TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
-- Only the service role (server-side) may read or write bookings.
-- No public access.

CREATE INDEX IF NOT EXISTS bookings_guest_email_idx ON public.bookings (guest_email);
CREATE INDEX IF NOT EXISTS bookings_property_slug_idx ON public.bookings (property_slug);
