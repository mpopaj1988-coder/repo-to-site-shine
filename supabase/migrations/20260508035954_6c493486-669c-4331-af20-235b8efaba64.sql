DROP POLICY "Anyone can submit email lead" ON public.email_leads;
CREATE POLICY "Anyone can submit valid email lead"
ON public.email_leads FOR INSERT
TO anon, authenticated
WITH CHECK (
  email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND char_length(email) BETWEEN 5 AND 254
  AND (source IS NULL OR char_length(source) <= 100)
);