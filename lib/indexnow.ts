/**
 * IndexNow integration for assumableguy.com
 * 
 * Pushes updated URLs to Bing/Yandex/search engines instantly.
 * Call notifyIndexNow() after listings sync or blog publishes.
 * 
 * Docs: https://www.indexnow.org/documentation
 */

const INDEXNOW_KEY = '14a7b83fa7904452b8678c31c176dd6e'
const SITE_HOST = 'assumableguy.com'
const KEY_LOCATION = `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`

// IndexNow endpoints (any one notifies all participating engines)
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

/**
 * Notify IndexNow about one or more updated URLs.
 * Best called after listings sync or new blog post publish.
 * 
 * @param urls - Array of full URLs that were created/updated
 * @returns true if successful, false on error
 */
export async function notifyIndexNow(urls: string[]): Promise<boolean> {
  if (!urls.length) return true

  // IndexNow batch API supports up to 10,000 URLs per request
  const payload = {
    host: SITE_HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls.slice(0, 10000),
  }

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    })

    // 200 = OK, 202 = accepted (URL submitted, key previously verified)
    if (response.ok || response.status === 202) {
      console.log(`[IndexNow] Successfully submitted ${urls.length} URLs`)
      return true
    }

    console.error(`[IndexNow] Failed: ${response.status} ${response.statusText}`)
    return false
  } catch (error) {
    console.error('[IndexNow] Error:', error)
    return false
  }
}

/**
 * Convenience: notify about updated listing pages.
 * Pass listing IDs and this builds the full URLs.
 */
export async function notifyListingsUpdated(listingIds: string[]): Promise<boolean> {
  const urls = listingIds.map(id => `https://${SITE_HOST}/homes/${id}`)
  // Also notify the main listings page since counts/data changed
  urls.push(`https://${SITE_HOST}/homes`)
  return notifyIndexNow(urls)
}

/**
 * Convenience: notify about a new or updated blog post.
 */
export async function notifyBlogUpdated(slugs: string[]): Promise<boolean> {
  const urls = slugs.map(slug => `https://${SITE_HOST}/blog/${slug}`)
  urls.push(`https://${SITE_HOST}/blog`)
  return notifyIndexNow(urls)
}
