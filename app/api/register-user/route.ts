export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createHmac, randomBytes } from "crypto";

const FUB_KEY = process.env.FOLLOWUPBOSS_API_KEY?.trim() || "";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "8079079144";
const COOKIE_SECRET = process.env.COOKIE_SECRET || "tag3-cookie-secret-change-me";

interface ListingContext {
  id?: string;
  address?: string;
  city?: string;
  state?: string;
  assumable_rate?: number;
  price?: number;
}

function formatListingNote(listing: ListingContext | undefined): string {
  if (!listing) return "";
  const locParts = [listing.address, [listing.city, listing.state].filter(Boolean).join(" ")].filter(Boolean);
  const loc = locParts.join(", ");
  const ratePart = typeof listing.assumable_rate === "number" ? `${listing.assumable_rate}% assumable` : "";
  const pricePart = typeof listing.price === "number" ? `$${listing.price.toLocaleString()}` : "";
  const detail = [ratePart, pricePart].filter(Boolean).join(", ");
  if (!loc && !detail) return "";
  return `\nInterested in: ${loc}${detail ? ` — ${detail}` : ""}`;
}

export async function POST(req: NextRequest) {
  const { name, email, phone, returning, listing } = await req.json();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  // For returning users (email-only re-identification), skip FUB
  if (!returning) {
    try {
      const auth = Buffer.from(`${FUB_KEY}:`).toString("base64");
      const [firstName, ...rest] = (name || "").trim().split(" ");
      const lastName = rest.join(" ") || "";

      const person: Record<string, unknown> = {
        firstName,
        lastName,
        emails: [{ value: email }],
        phones: phone ? [{ value: phone }] : [],
        source: "Website - Registration",
        stage: "AG: New Lead",
        tags: ["Form: Website Registration"],
      };

      // Use /events — triggers FUB action plans. Handles person upsert automatically.
      // Do NOT pre-create via /people; that skips action plan routing.
      const eventRes = await fetch("https://api.followupboss.com/v1/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
          "X-System": "assumableguy.com",
          "X-System-Key": FUB_KEY,
        },
        body: JSON.stringify({
          source: "Website - Registration",
          system: "assumableguy.com",
          type: "Registration",
          person,
          note: `New registration on assumableguy.com\nPhone: ${phone || "not provided"}${formatListingNote(listing)}`,
        }),
      });

      if (eventRes.ok) {
        // Telegram notification
        if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
          const msg = `🏠 *New Property Registration*\n👤 *Name:* ${name || "Unknown"}\n📧 *Email:* ${email}\n📞 *Phone:* ${phone || "—"}\n📍 *Source:* Website - Registration\n📋 *Stage:* AG: New Lead → FollowUpBoss`;
          await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: msg, parse_mode: "Markdown" }),
          }).catch(() => {});
        }
      } else {
        console.error("[FUB register-user] Event error:", eventRes.status, await eventRes.text().catch(() => ""));
      }
    } catch {
      // Non-blocking — still set cookie even if FUB fails
    }
  }

  // Set cookie: tag3_user = HMAC-signed token (email:signature), 30 days
  const sig = createHmac("sha256", COOKIE_SECRET).update(email).digest("hex");
  const token = Buffer.from(`${email}:${sig}`).toString("base64");
  const res = NextResponse.json({ success: true });
  res.cookies.set("tag3_user", token, {
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: true,
  });
  return res;
}

export async function GET(req: NextRequest) {
  // Check Supabase session first
  try {
    const { createServerClient } = await import("@supabase/ssr");
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      {
        cookies: {
          getAll() { return req.cookies.getAll(); },
          setAll() {},
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) return NextResponse.json({ valid: true, email: user.email });
  } catch {}

  // Fallback: tag3_user cookie (HMAC-signed)
  const token = req.cookies.get("tag3_user")?.value;
  if (!token) return NextResponse.json({ valid: false });
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const colonIdx = decoded.lastIndexOf(":");
    if (colonIdx === -1) return NextResponse.json({ valid: false });

    const email = decoded.substring(0, colonIdx);
    const sig = decoded.substring(colonIdx + 1);

    // Verify HMAC signature
    const expectedSig = createHmac("sha256", COOKIE_SECRET).update(email).digest("hex");
    if (sig !== expectedSig) return NextResponse.json({ valid: false });

    if (email && email.includes("@")) return NextResponse.json({ valid: true, email });
    return NextResponse.json({ valid: false });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
