import { NextRequest, NextResponse } from 'next/server'
import { notifyIndexNow, notifyListingsUpdated, notifyBlogUpdated } from '@/lib/indexnow'

/**
 * POST /api/indexnow
 * 
 * Trigger IndexNow notifications for updated pages.
 * Called by the listings sync pipeline or after blog publishes.
 * 
 * Body: { type: "listings" | "blog" | "urls", ids?: string[], slugs?: string[], urls?: string[] }
 * 
 * Protected by a simple shared secret in INDEXNOW_SECRET env var.
 */
export async function POST(request: NextRequest) {
  // Simple auth check
  const secret = process.env.INDEXNOW_SECRET
  if (secret) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const body = await request.json()
    const { type, ids, slugs, urls } = body

    let success = false

    switch (type) {
      case 'listings':
        if (!ids?.length) {
          return NextResponse.json({ error: 'ids[] required for type=listings' }, { status: 400 })
        }
        success = await notifyListingsUpdated(ids)
        break

      case 'blog':
        if (!slugs?.length) {
          return NextResponse.json({ error: 'slugs[] required for type=blog' }, { status: 400 })
        }
        success = await notifyBlogUpdated(slugs)
        break

      case 'urls':
        if (!urls?.length) {
          return NextResponse.json({ error: 'urls[] required for type=urls' }, { status: 400 })
        }
        success = await notifyIndexNow(urls)
        break

      default:
        return NextResponse.json({ error: 'type must be listings, blog, or urls' }, { status: 400 })
    }

    return NextResponse.json({ success })
  } catch (error) {
    console.error('[API /indexnow] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    usage: 'POST with { type: "listings"|"blog"|"urls", ids/slugs/urls: [...] }',
  })
}
