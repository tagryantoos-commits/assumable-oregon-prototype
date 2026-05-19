# SMS AI Lead Agent, Setup Guide

## Status: ✅ LIVE at https://assumableguy.com/api/sms-reply

---

## How It Works

1. A lead replies to an SMS from +17196525367 (your Twilio number)
2. Twilio fires a POST to `https://assumableguy.com/api/sms-reply`
3. The agent ("Alex") looks up the lead in FUB by phone number
4. Claude Haiku generates a contextual, qualifying response
5. Reply is sent via Twilio SMS, and the exchange is logged as a FUB note
6. If the lead is hot (qualified + ready to book), FUB stage is set to "Hot" + rich note is added

---

## Features

| Feature | Status |
|---|---|
| Business hours gate (8am–8pm MT) | ✅ |
| Rate limiting (1 reply / 10 min per lead) | ✅ |
| Opt-out handling (STOP/unsubscribe/remove) | ✅ Sends removal confirmation + tags lead in FUB |
| FUB lead lookup by phone | ✅ Auto-finds lead by phone number |
| FUB note logging (every exchange) | ✅ Every inbound + reply logged |
| Hot lead detection + FUB stage update | ✅ Sets stage to "Hot" when qualified |
| Conversation history | ✅ Per-lead history in /tmp (resets on cold start, ~ok) |
| Calendly booking link | ✅ Sent when lead is qualified |

---

## Calendly URL, ⚠️ Action Required

The current Calendly link is: `https://calendly.com/your-real-estate-agent-ryan/15min`

**Update this in the code** if the URL is different:
- File: `app/api/sms-reply/route.ts`, line ~17
- `const CALENDLY_URL = 'https://calendly.com/your-real-estate-agent-ryan/15min';`

Then run: `git commit -am "fix: update Calendly URL" && git push && vercel --prod`

---

## Qualification Flow (Sample Conversation)

```
Ryan's initial SMS: "Hey Sarah, this is Ryan from The Assumable Guy..."

Sarah: "Hi yes I got your text"
Alex: "Hey Sarah! Glad you replied. Quick Q, are you looking for a primary home or investment property? – Alex @ The Assumable Guy"

Sarah: "Primary home"
Alex: "Got it! Which area of Colorado are you looking in? – Alex @ The Assumable Guy"

Sarah: "Denver area, maybe Lakewood"
Alex: "Nice! What's your rough price range? – Alex @ The Assumable Guy"

Sarah: "Somewhere around 450-500k"
Alex: "Perfect range for assumable deals! Are you looking to buy in the next 60-90 days? – Alex @ The Assumable Guy"

Sarah: "Yes definitely, trying to move before summer"
Alex: "Awesome! You can grab a free 15-min call with Ryan here: https://calendly.com/your-real-estate-agent-ryan/15min – Alex @ The Assumable Guy"
[FUB stage → Hot, hot lead note added]
```

---

## What Twilio Is Already Configured To Do

- Number +17196525367 → SMS webhook: `https://assumableguy.com/api/sms-reply` ✅
- No changes needed in Twilio dashboard

---

## Environment Variables (All Set in Vercel)

| Variable | Status |
|---|---|
| `TWILIO_ACCOUNT_SID` | ✅ |
| `TWILIO_AUTH_TOKEN` | ✅ |
| `ANTHROPIC_API_KEY` | ✅ |
| `FOLLOWUPBOSS_API_KEY` | ✅ |

---

## Monitoring

- **FUB notes**: Every SMS exchange appears as a note under the lead with subject "AI SMS Conversation"
- **Hot leads**: Check FUB for leads with stage "Hot", these need immediate follow-up
- **Opt-outs**: Tagged "SMS Opt-Out" in FUB, never contacted again
- **Vercel logs**: `vercel logs --follow` or check Vercel dashboard for runtime logs

---

## Things to Watch

1. **Conversation history resets** if the Vercel function cold-starts, history is in `/tmp` which isn't durable. The lead will just start a fresh conversation. This is acceptable for now.
2. **Rate limiting** is also in `/tmp`, same caveat, but worst case is sending 2 replies in 10 min.
3. If you want durable state, upgrade to **Upstash Redis** (free tier), 1-hour task to wire in.

---

## Future Improvements

- [ ] Update Calendly URL to real link
- [ ] Add Upstash Redis for durable conversation history
- [ ] Notify Ryan via SMS/Telegram when a hot lead is detected
- [ ] A/B test different opening qualifying questions
