/**
 * Supabase queries + page-view tracking for the property landing page.
 * Server-side only. Uses the service-role client to bypass RLS for inserts.
 */
import "server-only";
import { createServiceClient } from "../../../../lib/supabase/server";

export interface PropertyForLanding {
  property_id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  loan_type: string;
  original_loan_amount: number;
  current_loan_balance: number | null;
  assumable_rate: number;
  origination_date: string | null;
  lender_name: string | null;
  property_value: number | null;
  fub_person_id: string | null;
}

const COMPARISON_RATE_DEFAULT = 6.5;

export async function getProperty(
  propertyId: string,
): Promise<PropertyForLanding | null> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("properties_for_landing")
    .select(
      "property_id, address, city, state, zip, loan_type, " +
        "original_loan_amount, current_loan_balance, assumable_rate, " +
        "origination_date, lender_name, property_value, fub_person_id",
    )
    .eq("property_id", propertyId)
    .maybeSingle();
  if (error) {
    console.error("[landing] getProperty error:", error.message);
    return null;
  }
  return data as PropertyForLanding | null;
}

export async function getComparisonRate(): Promise<number> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("landing_settings")
    .select("value")
    .eq("key", "comparison_rate")
    .maybeSingle();
  if (error || !data?.value) return COMPARISON_RATE_DEFAULT;
  const num = Number(data.value);
  return Number.isFinite(num) && num > 0 ? num : COMPARISON_RATE_DEFAULT;
}

/**
 * Server-side page-view logger. Inserts to Supabase + (optionally) fires
 * the n8n webhook. Never blocks page render — caller awaits in a try/catch.
 */
export async function logPageView(
  property: PropertyForLanding,
  meta: {
    userAgent: string | null;
    referrer: string | null;
    ipHash: string | null;
    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;
    utmContent?: string | null;
  },
): Promise<void> {
  try {
    const supabase = await createServiceClient();
    await supabase.from("page_views").insert({
      property_id: property.property_id,
      user_agent: meta.userAgent ?? "",
      referrer: meta.referrer ?? "",
      ip_hash: meta.ipHash ?? "",
      utm_source: meta.utmSource ?? null,
      utm_medium: meta.utmMedium ?? null,
      utm_campaign: meta.utmCampaign ?? null,
      utm_content: meta.utmContent ?? null,
    });
  } catch (e) {
    console.error("[landing] page_views insert failed:", e);
  }

  // Fire-and-forget n8n webhook. Optional — gated on env var.
  const webhookUrl = process.env.PAGE_VIEW_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn(
      "[landing] PAGE_VIEW_WEBHOOK_URL not set; skipping n8n notification",
    );
    return;
  }
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        property_id: property.property_id,
        address: `${property.address}, ${property.city}, ${property.state} ${property.zip}`,
        fub_person_id: property.fub_person_id,
        owner_name: null, // not stored on properties_for_landing; n8n can lookup if needed
        visited_at: new Date().toISOString(),
      }),
      // 5s timeout via AbortSignal so a slow n8n never delays the page
      signal: AbortSignal.timeout(5000),
    });
  } catch (e) {
    console.error("[landing] n8n webhook failed (non-fatal):", e);
  }
}

import { createHash } from "node:crypto";

/**
 * Hash an IP address for the page_views ip_hash column. Uses SHA-256 with a
 * salt to avoid storing raw IPs (lighter privacy posture for a marketing
 * landing page).
 */
export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  const salt = process.env.IP_HASH_SALT || "ag-landing-salt";
  return createHash("sha256").update(`${salt}::${ip}`).digest("hex").slice(0, 32);
}
