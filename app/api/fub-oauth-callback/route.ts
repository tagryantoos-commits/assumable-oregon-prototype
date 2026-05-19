import { NextRequest, NextResponse } from "next/server";

const FUB_TOKEN_URL = "https://app.followupboss.com/oauth/token";
const CLIENT_ID = process.env.FUB_OAUTH_CLIENT_ID || "";
const CLIENT_SECRET = process.env.FUB_OAUTH_CLIENT_SECRET || "";
const REDIRECT_URI = "https://assumableguy.com/api/fub-oauth-callback";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.json(
      { error, description: searchParams.get("error_description") },
      { status: 400 }
    );
  }

  if (!code) {
    return NextResponse.json(
      { error: "No authorization code provided" },
      { status: 400 }
    );
  }

  try {
    // Exchange authorization code for access token
    // FUB uses HTTP Basic Auth with client_id:client_secret
    const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
      "base64"
    );

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      state: searchParams.get("state") || "",
    });

    const tokenResponse = await fetch(FUB_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: body.toString(),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return NextResponse.json(
        { error: "Token exchange failed", details: tokenData },
        { status: tokenResponse.status }
      );
    }

    // Save token — in production, store securely
    // For now, return it so we can save it manually
    return NextResponse.json({
      success: true,
      message:
        "OAuth token obtained. Copy the access_token and save it securely.",
      token_data: tokenData,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Token exchange error", details: String(err) },
      { status: 500 }
    );
  }
}
