export const runtime = 'nodejs';

// POST /api/sms-lead
// Called when a new lead submits a form. Sends initial qualifying SMS via Twilio.
export async function POST(request: Request) {
  const { name, phone, email, source } = await request.json();
  if (!phone) return Response.json({ ok: false, error: 'no phone' });

  const digits = phone.replace(/\D/g, '');
  const e164 = digits.startsWith('1') ? `+${digits}` : `+1${digits}`;

  // Time gate: 8am-8pm MT only
  const mtHour = parseInt(
    new Date().toLocaleString('en-US', {
      timeZone: 'America/Denver',
      hour: 'numeric',
      hour12: false,
    })
  );
  if (mtHour < 8 || mtHour >= 20) {
    console.log('[SMS] Outside hours, skipping SMS to', e164);
    return Response.json({ ok: true, skipped: 'outside hours' });
  }

  const firstName = name?.split(' ')[0] || 'there';
  const message = `Hey ${firstName}, this is Ryan Thomson from The Assumable Guy. You just asked about assumable mortgages — smart move with rates at 6.8%+ right now. Quick question: are you looking for a primary home or an investment property? - Ryan's team`;

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = '+17196525367';

  const body = new URLSearchParams({ From: from, To: e164, Body: message });
  const resp = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    }
  );

  const result = await resp.json();
  console.log('[SMS] Initial text sent:', result.sid, 'to', e164, 'source:', source, 'email:', email);
  return Response.json({ ok: resp.ok, sid: result.sid });
}

export async function GET() {
  return Response.json({ message: 'SMS lead endpoint active' }, { status: 405 });
}
