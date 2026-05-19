export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';

const FUB_KEY = process.env.FOLLOWUPBOSS_API_KEY?.trim() || '';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '8079079144';

interface ListingContext {
  id?: string;
  address?: string;
  city?: string;
  state?: string;
  assumable_rate?: number;
  price?: number;
}

function formatListingNote(listing: ListingContext | undefined): string {
  if (!listing) return '';
  const locParts = [listing.address, [listing.city, listing.state].filter(Boolean).join(' ')].filter(Boolean);
  const loc = locParts.join(', ');
  const ratePart = typeof listing.assumable_rate === 'number' ? `${listing.assumable_rate}% assumable` : '';
  const pricePart = typeof listing.price === 'number' ? `$${listing.price.toLocaleString()}` : '';
  const detail = [ratePart, pricePart].filter(Boolean).join(', ');
  if (!loc && !detail) return '';
  return `\nInterested in: ${loc}${detail ? ` — ${detail}` : ''}`;
}

export async function POST(req: NextRequest) {
  const { firstName, lastName, email, phone, userType, listing } = await req.json();
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

  try {
    const auth = Buffer.from(`${FUB_KEY}:`).toString('base64');

    const tags = ['Form: Website Registration'];
    if (userType) tags.push(`User Type: ${userType}`);

    const person: Record<string, unknown> = {
      firstName: firstName || '',
      lastName: lastName || '',
      emails: [{ value: email }],
      phones: phone ? [{ value: phone }] : [],
      source: 'Website - Registration',
      stage: 'AG: New Lead',
      tags,
    };

    // Use /events — triggers FUB action plans. Handles person upsert automatically.
    // Do NOT pre-create via /people; that skips action plan routing.
    const eventRes = await fetch('https://api.followupboss.com/v1/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        'X-System': 'assumableguy.com',
        'X-System-Key': FUB_KEY,
      },
      body: JSON.stringify({
        source: 'Website - Registration',
        system: 'assumableguy.com',
        type: 'Registration',
        person,
        note: `New account created on assumableguy.com\nUser type: ${userType || 'buyer'}\nPhone: ${phone || 'not provided'}${formatListingNote(listing)}`,
      }),
    });

    if (eventRes.ok) {
      // Telegram notification
      if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
        const name = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown';
        const msg = `🏠 *New Account Registration*\n👤 *Name:* ${name}\n📧 *Email:* ${email}\n📞 *Phone:* ${phone || '—'}\n🏷 *Type:* ${userType || 'buyer'}\n📍 *Source:* Website - Registration\n📋 *Stage:* AG: New Lead → FollowUpBoss`;
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: msg, parse_mode: 'Markdown' }),
        }).catch(() => {});
      }
    } else {
      console.error('[FUB auth/register] Event error:', eventRes.status, await eventRes.text().catch(() => ''));
    }
  } catch {
    // Non-blocking
  }

  return NextResponse.json({ success: true });
}
