-- Exit-intent popup backup table
-- Always populated on submit so no lead is lost if FUB push fails.

CREATE TABLE IF NOT EXISTS public.exit_intent_leads (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name      text,
  email           text        NOT NULL,
  fub_synced      boolean     NOT NULL DEFAULT false,
  fub_error       text,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  landing_url     text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS exit_intent_leads_email_idx
  ON public.exit_intent_leads (email);

CREATE INDEX IF NOT EXISTS exit_intent_leads_created_at_idx
  ON public.exit_intent_leads (created_at DESC);

-- RLS: writes happen from the API route using the service role (which bypasses
-- RLS). Keep RLS enabled + no policies so the anon/public role cannot read.
ALTER TABLE public.exit_intent_leads ENABLE ROW LEVEL SECURITY;
