-- Email leads (10% off signup)
CREATE TABLE public.email_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  source TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX email_leads_email_unique ON public.email_leads (lower(email));
ALTER TABLE public.email_leads ENABLE ROW LEVEL SECURITY;

-- Anyone can submit (insert) a lead
CREATE POLICY "Anyone can submit email lead"
ON public.email_leads FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- No one can read via client (admin only via service role)
-- (no SELECT policy = denied)

-- Hospitable reviews cache
CREATE TABLE public.hospitable_reviews_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospitable_review_id TEXT UNIQUE,
  property_hospitable_id TEXT,
  property_slug TEXT,
  guest_name TEXT,
  rating NUMERIC,
  text TEXT,
  review_date DATE,
  raw JSONB,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX hospitable_reviews_property_idx ON public.hospitable_reviews_cache (property_slug);
CREATE INDEX hospitable_reviews_date_idx ON public.hospitable_reviews_cache (review_date DESC);
ALTER TABLE public.hospitable_reviews_cache ENABLE ROW LEVEL SECURITY;

-- Public can read cached reviews
CREATE POLICY "Public can read reviews cache"
ON public.hospitable_reviews_cache FOR SELECT
TO anon, authenticated
USING (true);