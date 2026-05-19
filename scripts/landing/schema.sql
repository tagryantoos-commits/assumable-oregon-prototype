-- Property Landing Page schema
-- Tables backing app/property/[id]/* and app/api/landing-form-submit.
-- Writes are performed by the service-role client (bypasses RLS); anon/public
-- role gets no policies and therefore cannot read or write.

-- ---------------------------------------------------------------------------
-- 1. properties_for_landing — one row per direct-mail recipient / QR code
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.properties_for_landing (
  property_id            text        PRIMARY KEY,
  address                text        NOT NULL,
  city                   text        NOT NULL,
  state                  text        NOT NULL,
  zip                    text        NOT NULL,
  loan_type              text        NOT NULL,           -- 'VA' | 'FHA' | 'USDA'
  original_loan_amount   numeric     NOT NULL,
  current_loan_balance   numeric,
  assumable_rate         numeric     NOT NULL,           -- percent, e.g. 2.67
  origination_date       date,
  lender_name            text,
  property_value         numeric,
  fub_person_id          text,
  created_at             timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.properties_for_landing ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 2. page_views — every visit to /property/{id}
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.page_views (
  id           bigserial   PRIMARY KEY,
  property_id  text        NOT NULL REFERENCES public.properties_for_landing(property_id) ON DELETE CASCADE,
  user_agent   text        NOT NULL DEFAULT '',
  referrer     text        NOT NULL DEFAULT '',
  ip_hash      text        NOT NULL DEFAULT '',
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  utm_content  text,
  viewed_at    timestamptz NOT NULL DEFAULT now()
);

-- Backfill columns on existing deployments (idempotent).
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS utm_source   text;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS utm_medium   text;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS utm_campaign text;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS utm_content  text;

CREATE INDEX IF NOT EXISTS page_views_property_id_idx
  ON public.page_views (property_id, viewed_at DESC);

CREATE INDEX IF NOT EXISTS page_views_utm_campaign_idx
  ON public.page_views (utm_campaign, viewed_at DESC)
  WHERE utm_campaign IS NOT NULL;

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 3. form_submissions — captured leads from the CTA form
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.form_submissions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  text        NOT NULL REFERENCES public.properties_for_landing(property_id) ON DELETE CASCADE,
  name         text        NOT NULL,
  phone        text        NOT NULL,
  email        text        NOT NULL,
  fub_synced   boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS form_submissions_property_id_idx
  ON public.form_submissions (property_id, created_at DESC);

ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 4. landing_settings — single-row key/value config (e.g. comparison_rate)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.landing_settings (
  key         text        PRIMARY KEY,
  value       text        NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.landing_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO public.landing_settings (key, value)
VALUES ('comparison_rate', '6.5')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Seed: Berwyn Loop test row (for local QA)
-- ---------------------------------------------------------------------------
INSERT INTO public.properties_for_landing (
  property_id, address, city, state, zip, loan_type,
  original_loan_amount, assumable_rate, fub_person_id
) VALUES (
  '1865165344',
  'Berwyn Loop',
  'Colorado Springs',
  'CO',
  '80920',
  'VA',
  383320,
  2.67,
  '18567'
) ON CONFLICT (property_id) DO NOTHING;
