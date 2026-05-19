import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createHmac } from "crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const COOKIE_SECRET = process.env.COOKIE_SECRET || "tag3-cookie-secret-change-me";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || "";

/**
 * Check if the request is authenticated via any supported method:
 * 1. Supabase session cookie
 * 2. HMAC-signed tag3_user cookie
 * 3. X-API-Key header (for internal services like Slack bot)
 *
 * Returns the user's email if authenticated, null otherwise.
 */
export async function getAuthenticatedEmail(req: NextRequest): Promise<string | null> {
  // 1. Internal API key (Slack bot, cron jobs)
  const apiKey = req.headers.get("x-api-key");
  if (apiKey && INTERNAL_API_KEY && apiKey === INTERNAL_API_KEY) {
    return "internal-service";
  }

  // 2. Supabase session
  try {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll() {},
      },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) return user.email;
  } catch {
    // Silent fallback
  }

  // 3. HMAC-signed tag3_user cookie
  const cookie = req.cookies.get("tag3_user")?.value;
  if (cookie) {
    try {
      const decoded = Buffer.from(cookie, "base64").toString("utf-8");
      const colonIdx = decoded.lastIndexOf(":");
      if (colonIdx !== -1) {
        const email = decoded.substring(0, colonIdx);
        const sig = decoded.substring(colonIdx + 1);
        const expectedSig = createHmac("sha256", COOKIE_SECRET).update(email).digest("hex");
        if (sig === expectedSig && email.includes("@")) return email;
      }
    } catch {
      // Invalid cookie
    }
  }

  return null;
}
