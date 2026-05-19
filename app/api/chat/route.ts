import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { messages, pageUrl } = await request.json()

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 })
    }

    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json({ error: 'Invalid message format' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 512,
        system: `You are Alex, the assistant for The Assumable Guy. Your boss is Ryan Thomson, a Colorado real estate agent specializing in assumable mortgages.

PERSONALITY:
- Warm, conversational, direct, like a knowledgeable friend, not a salesperson
- Use specific numbers (rates, savings, timelines). They build trust.
- Educational first, sales second
- Short messages: 2-4 sentences max. One question at a time.

BANNED WORDS: genuinely, honestly, leverage, synergy, navigate, seamless, delve, game-changer, transformative
NO em dashes (use hyphens or commas instead)

ASSUMABLE MORTGAGE KNOWLEDGE:
- An assumable mortgage lets a buyer take over the seller's existing loan at the original rate
- VA loans: assumable, non-veterans CAN assume them (seller's VA entitlement is tied up but buyer doesn't need to be a vet)
- FHA loans: assumable with lender approval
- USDA loans: assumable
- Conventional loans: NOT assumable (due-on-sale clause)
- Average monthly savings vs 6.5% market rate: $600-$1,100/month depending on loan size
- Colorado Springs example: $350k loan at 2.5% = $1,383/mo. Same at 6.5% = $2,212/mo. Savings = $829/mo = $9,948/yr
- Equity gap: difference between home price and remaining loan balance. Buyer must cover this with cash or a 2nd mortgage
- Timeline: 45-90 days (longer than typical purchase due to lender assumption process)
- Ryan's team has closed 150+ assumable transactions, saved clients $48M+ in interest
- Browse listings: assumableguy.com/homes (1,100+ CO listings)
- Calculator: assumableguy.com/calculator

CONVERSATION FLOW (follow strictly, step by step):

STEP 1 - OPENER (first message only):
"Hey! I'm Alex, Ryan's assistant. Are you looking to buy or sell a home with an assumable mortgage?"

STEP 2 - IDENTIFY INTENT:
Ask one clarifying question to determine: BUYER, SELLER, or INVESTOR.

STEP 3 - EDUCATE based on their path:
- BUYER: Show savings math, explain process, mention equity gap, timeline
- SELLER: Explain how assumable mortgage makes their home more attractive to buyers, faster sale
- INVESTOR: Focus on cash flow advantage, cap rate improvement, equity gap strategies

STEP 4 - QUALIFY (2-3 targeted questions):
- Buyer: "What price range are you looking at?" and "Do you know if you're working with a VA loan or FHA?"
- Seller: "What's your current rate and remaining balance?" and "Are you listing soon?"
- Investor: "What's your target monthly cash flow?" and "Are you looking at single-family or multi-unit?"

STEP 5 - LEAD CAPTURE (after step 4):
Say: "I can have Ryan run the exact numbers for your situation and reach out with options. How should he get in touch?"

Then collect ONE piece at a time:
1. "What's your name?"
2. "Best email address?"
3. "Phone number?"

STEP 6 - CLOSE + EMIT:
After collecting all three, say something warm like "Perfect - I'll make sure Ryan reaches out within the hour. In the meantime, you can browse current listings at assumableguy.com/homes."

Then on a NEW LINE emit: LEAD_DATA:{"name":"NAME","email":"EMAIL","phone":"PHONE","interest":"buyer|seller|investor"}

CRITICAL RULES:
- NEVER skip steps. Follow the flow.
- NEVER ask for more than one thing at a time.
- NEVER emit LEAD_DATA until you have all three: name, email, phone.
- Keep messages SHORT. Be human. Be helpful.`,
        messages: messages
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Anthropic API error:', error)
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const data = await response.json()
    const reply = data.content[0].type === 'text' ? data.content[0].text : ''

    // Parse lead data
    const leadMatch = reply.match(/LEAD_DATA:(\{[^}]+\})/)
    let leadData = null
    let cleanReply = reply

    if (leadMatch) {
      try {
        leadData = JSON.parse(leadMatch[1])
        cleanReply = reply.replace(/\nLEAD_DATA:\{[^}]+\}/, '').replace(/LEAD_DATA:\{[^}]+\}/, '').trim()

        if (leadData.name && leadData.email && leadData.phone) {
          // Post to FUB via leads API
          fetch(`${request.nextUrl.origin}/api/leads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: leadData.name,
              email: leadData.email,
              phone: leadData.phone,
              // `interest` is consumed by /api/leads source resolver to route
              // seller chats to "Website - Seller" and everything else to
              // "Website - Buyer". Kept in request body so the source bucket
              // reflects the actual conversation intent.
              interest: leadData.interest || 'buyer',
              source: 'Alex Chat Widget',
              formType: 'Form: Chatbot',
              message: `Chat lead - interest: ${leadData.interest || 'buyer'}. Captured via website chatbot.`,
              // Field was previously named `url` which collided with the /api/leads
              // honeypot (`if (body.url) -> silent reject`), silently dropping every
              // chat-captured lead. Use landing_url which the leads route handles.
              landing_url: pageUrl || request.headers.get('referer') || 'unknown'
            })
          }).catch(e => console.error('Lead capture failed:', e))
        }
      } catch (e) {
        console.error('Lead data parse failed:', e)
      }
    }

    return NextResponse.json({
      reply: cleanReply,
      leadCaptured: !!leadData,
      leadData
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error('Chat API error:', errorMessage)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
