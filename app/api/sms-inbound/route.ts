export const runtime = 'nodejs';

/**
 * POST /api/sms-inbound
 * Unified inbound SMS router for +17196525367.
 *
 * Routes:
 *   - Sender has "expired-listing" tag in FUB -> seller handler (/api/seller-sms-reply)
 *   - All other senders -> buyer handler (/api/sms-reply)
 *
 * Twilio should be configured to POST to this endpoint.
 */

const FUB_KEY  = (process.env.FOLLOWUPBOSS_API_KEY || '').trim();
const FUB_BASE = 'https://api.followupboss.com/v1';

// Base URL for internal routing - must match the deployed domain
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://assumableguy.com';

function fubAuth(): string {
  return 'Basic ' + Buffer.from(`${FUB_KEY}:`).toString('base64');
}

interface FubPerson {
  id: number;
  tags: string[];
}

async function isSellerPhone(phone: string): Promise<boolean> {
  const digits = phone.replace(/\D/g, '');
  const queries = [phone, digits, digits.replace(/^1/, '')];

  for (const q of queries) {
    try {
      const r = await fetch(`${FUB_BASE}/people?q=${encodeURIComponent(q)}&limit=5`, {
        headers: { Authorization: fubAuth() },
      });
      const d = await r.json();
      if (d.people?.length) {
        const hasSeller = d.people.some((p: FubPerson) =>
          (p.tags || []).includes('expired-listing')
        );
        if (hasSeller) return true;
      }
    } catch {
      // continue
    }
  }
  return false;
}

async function forwardToHandler(handlerPath: string, formData: FormData): Promise<Response> {
  const url = `${BASE_URL}/api/${handlerPath}`;
  const body = new URLSearchParams();

  // Copy all form fields
  for (const [key, value] of formData.entries()) {
    body.append(key, value as string);
  }

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const text = await resp.text();
  return new Response(text, {
    status: resp.status,
    headers: { 'Content-Type': resp.headers.get('Content-Type') || 'text/xml' },
  });
}

export async function POST(request: Request) {
  let formData: FormData;
  let from = '';

  try {
    formData = await request.formData();
    from = (formData.get('From') as string) || '';
  } catch {
    return new Response('<?xml version="1.0"?><Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  if (!from) {
    return new Response('<?xml version="1.0"?><Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  console.log('[SMS-Inbound] Routing SMS');

  // Check if sender is an expired-listing seller
  const isSeller = await isSellerPhone(from).catch(() => false);

  if (isSeller) {
    console.log('[SMS-Inbound] Routing -> seller handler');
    return forwardToHandler('seller-sms-reply', formData);
  } else {
    console.log('[SMS-Inbound] Routing -> buyer handler');
    return forwardToHandler('sms-reply', formData);
  }
}

export async function GET() {
  return new Response('SMS Inbound Router active', { status: 200 });
}
