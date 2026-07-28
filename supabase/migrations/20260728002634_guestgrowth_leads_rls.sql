-- guestgrowth_leads was created without RLS, relying on the incorrect
-- assumption that it's only ever reachable via the service-role key.
-- Without RLS enabled, Supabase's default anon/authenticated grants give
-- the public API key (shipped to every browser) full read/write access.
-- This matches the lock-down pattern used by every other table in this
-- schema (see post_checkout_log, pre_arrival_log, etc.).

ALTER TABLE public.guestgrowth_leads ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can manage guestgrowth leads"
    ON public.guestgrowth_leads FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
