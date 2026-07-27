-- Atomically claims a discount code for an email: creates the lead row if
-- none exists, or fills in discount_code on an existing lead row that
-- doesn't have one yet (e.g. from a WiFi QR signup). Returns the row only
-- if THIS call won the claim — if the email already had a code (from this
-- call or a concurrent one), no row is returned and no code should be sent.
-- Doing this as one atomic statement (rather than SELECT-then-INSERT/UPDATE
-- in application code) closes the race window between two near-simultaneous
-- signup requests for the same email.
CREATE OR REPLACE FUNCTION public.claim_discount_code(
  p_email TEXT,
  p_code TEXT,
  p_source TEXT,
  p_utm_source TEXT,
  p_utm_medium TEXT,
  p_utm_campaign TEXT,
  p_user_agent TEXT
)
RETURNS TABLE(id UUID)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE claimed_id UUID;
BEGIN
  INSERT INTO public.email_leads (email, source, utm_source, utm_medium, utm_campaign, user_agent, discount_code)
  VALUES (p_email, p_source, p_utm_source, p_utm_medium, p_utm_campaign, p_user_agent, p_code)
  ON CONFLICT (lower(email)) DO NOTHING
  RETURNING email_leads.id INTO claimed_id;

  IF claimed_id IS NOT NULL THEN
    RETURN QUERY SELECT claimed_id;
    RETURN;
  END IF;

  UPDATE public.email_leads
  SET discount_code = p_code
  WHERE lower(email) = lower(p_email) AND discount_code IS NULL
  RETURNING email_leads.id INTO claimed_id;

  IF claimed_id IS NOT NULL THEN
    RETURN QUERY SELECT claimed_id;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_discount_code(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_discount_code(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_discount_code(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;
