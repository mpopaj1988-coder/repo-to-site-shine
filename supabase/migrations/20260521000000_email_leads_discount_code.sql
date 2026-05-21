ALTER TABLE public.email_leads
  ADD COLUMN IF NOT EXISTS discount_code TEXT;
