export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "../../../lib/supabase/server";

const FUB_KEY = (process.env.FOLLOWUPBOSS_API_KEY || "").trim();
const FUB_BASE = "https://api.followupboss.com/v1";

interface PostBody {
  property_id?: string;
  name?: string;
  phone?: string;
  email?: string;
}

function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export async function POST(req: NextRequest) {
  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const property_id = (body.property_id || "").trim();
  const name = (body.name || "").trim();
  const phone = (body.phone || "").trim();
  const email = (body.email || "").trim();

  if (!property_id || !name || !phone || !email) {
    return NextResponse.json(
      { success: false, error: "Missing required field" },
      { status: 400 },
    );
  }

  const supabase = await createServiceClient();

  // 1. Look up property to get fub_person_id + address fields for the FUB record
  const { data: property, error: propertyError } = await supabase
    .from("properties_for_landing")
    .select(
      "property_id, address, city, state, zip, fub_person_id",
    )
    .eq("property_id", property_id)
    .maybeSingle();

  if (propertyError) {
    console.error("[landing-form] property lookup error:", propertyError.message);
  }
  if (!property) {
    return NextResponse.json(
      { success: false, error: "Property not found" },
      { status: 404 },
    );
  }

  // 2. Insert form submission row first so we never lose a lead even if FUB fails
  const { data: submission, error: insertError } = await supabase
    .from("form_submissions")
    .insert({
      property_id,
      name,
      phone,
      email,
      fub_synced: false,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("[landing-form] insert error:", insertError.message);
    return NextResponse.json(
      { success: false, error: "Could not save submission" },
      { status: 500 },
    );
  }

  // 3. Push to FUB. Soft-fail — even if FUB is down, the submission is saved.
  let fubSynced = false;
  if (FUB_KEY) {
    try {
      const { firstName, lastName } = splitName(name);
      const auth = Buffer.from(`${FUB_KEY}:`).toString("base64");
      const personPayload: Record<string, unknown> = {
        firstName,
        lastName,
        phones: [{ value: phone, type: "mobile" }],
        emails: [{ value: email, type: "personal" }],
        source: "Expired Mailer QR Response",
        stage: "AG: Seller - 2-Way Contact",
        addresses: [
          {
            type: "home",
            street: property.address,
            city: property.city,
            state: property.state,
            code: property.zip,
          },
        ],
        tags: ["mailer-qr-response", "high-intent"],
      };

      const res = await fetch(`${FUB_BASE}/people`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify(personPayload),
      });

      if (res.ok) {
        fubSynced = true;
      } else {
        const errText = await res.text().catch(() => "");
        console.error(
          `[landing-form] FUB people POST returned ${res.status}: ${errText.slice(0, 300)}`,
        );
      }
    } catch (e) {
      console.error("[landing-form] FUB push error:", e);
    }
  } else {
    console.warn("[landing-form] FOLLOWUPBOSS_API_KEY not set; skipping FUB push");
  }

  if (fubSynced && submission?.id) {
    await supabase
      .from("form_submissions")
      .update({ fub_synced: true })
      .eq("id", submission.id);
  }

  return NextResponse.json({ success: true });
}
