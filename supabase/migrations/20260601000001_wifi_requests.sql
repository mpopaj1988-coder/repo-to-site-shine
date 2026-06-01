-- WiFi info requests are tracked via the existing email_leads table
-- (source column = 'wifi-signup:<property-slug>')
-- This migration adds an index to make property-level queries fast.

CREATE INDEX IF NOT EXISTS email_leads_source_idx
  ON email_leads (source)
  WHERE source IS NOT NULL;
