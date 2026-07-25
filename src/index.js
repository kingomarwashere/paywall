import { Hono } from 'hono'
import { fetchAsCrawler, fetchBest, fetchFromWayback, stripPaywall, extractArticle } from './proxy.js'
import { homePage, readPage, readerPage, errorPage, howPage, aboutPage, bookmarklet } from './views.js'

const app = new Hono()

// Normalise a user-supplied URL: add https://, validate it's http(s).
function normalizeUrl(raw) {
  if (!raw) return null
  let u = raw.trim()
  if (!/^https?:\/\//i.test(u)) {
    // allow "example.com/x" and accidental "https:/x" typos
    u = 'https://' + u.replace(/^\/+/, '').replace(/^https?:\/?/i, '')
  }
  try {
    const parsed = new URL(u)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    if (!parsed.hostname.includes('.')) return null
    return parsed.href
  } catch { return null }
}

const HOST = (c) => c.req.header('host') || 'paywall.theradicalparty.com'

app.get('/', (c) => c.html(homePage(HOST(c))))
app.get('/how', (c) => c.html(howPage(HOST(c))))
app.get('/about', (c) => c.html(aboutPage()))

app.get('/bookmarklet.js', (c) =>
  c.text(bookmarklet(HOST(c)), 200, { 'Content-Type': 'text/plain; charset=utf-8' }))

// Methods hub for a given article URL.
app.get('/read', (c) => {
  const url = normalizeUrl(c.req.query('url'))
  if (!url) return c.redirect('/')
  return c.html(readPage(url, HOST(c)))
})

// Clean reader: fetch as several crawlers, keep the richest copy, extract article text.
app.get('/reader', async (c) => {
  const url = normalizeUrl(c.req.query('url'))
  if (!url) return c.redirect('/')
  try {
    const ref = c.req.query('ref') || 'google'
    const best = await fetchBest(url, { ref })
    if (!best) return c.html(errorPage(url, 'could not reach the page'), 200)
    if (!best.html || !best.contentType.includes('html')) {
      return c.redirect(`/proxy?url=${encodeURIComponent(url)}`)
    }
    const art = extractArticle(best.html, url)
    if (art.bodyHtml && art.wordCount >= 80) {
      return c.html(readerPage(art, url, HOST(c)))
    }
    // Live site blocked us — fall back to a Wayback snapshot and read from that.
    const wb = await fetchFromWayback(url)
    if (wb) {
      const art2 = extractArticle(wb.html, url)
      if (art2.bodyHtml && art2.wordCount >= 80) {
        art2.source = { name: 'Wayback Machine', timestamp: wb.timestamp, url: wb.snapshotUrl }
        return c.html(readerPage(art2, url, HOST(c)))
      }
    }
    return c.html(errorPage(url, 'not enough readable text'), 200)
  } catch (e) {
    return c.html(errorPage(url, e.message), 200)
  }
})

// Full-page proxy: fetch as several crawlers, keep the richest copy, strip the paywall.
app.get('/proxy', async (c) => {
  const url = normalizeUrl(c.req.query('url'))
  if (!url) return c.redirect('/')
  try {
    const ref = c.req.query('ref') || 'google'
    // ref=google means "arrive from Google" — honour it with a single Googlebot fetch.
    const best = c.req.query('ref') === 'google' && c.req.query('single')
      ? await fetchBest(url, { ref, bots: ['google'] })
      : await fetchBest(url, { ref })
    if (!best) return c.html(errorPage(url, 'could not reach the page'), 200)
    if (!best.html || !best.contentType.includes('html')) {
      const single = await fetchAsCrawler(url, { ref, bot: best.bot || 'google' })
      const h = new Headers(single.headers)
      h.delete('content-security-policy'); h.delete('x-frame-options')
      return new Response(single.body, { status: single.status, headers: h })
    }
    return stripPaywall(best.html, best.headers, url)
  } catch (e) {
    return c.html(errorPage(url, e.message), 200)
  }
})

app.get('/health', (c) => c.json({ ok: true, service: 'paywall', ts: Date.now() }))

app.get('/robots.txt', (c) =>
  c.text(`User-agent: *\nAllow: /$\nAllow: /how\nAllow: /about\nDisallow: /proxy\nDisallow: /reader\nDisallow: /read\nSitemap: https://${HOST(c)}/sitemap.xml\n`, 200, { 'Content-Type': 'text/plain' }))

app.get('/sitemap.xml', (c) => {
  const h = HOST(c)
  const urls = ['/', '/how', '/about'].map((p) => `<url><loc>https://${h}${p}</loc></url>`).join('')
  return c.text(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, 200, { 'Content-Type': 'application/xml' })
})

// Path-style: paywall.theradicalparty.com/https://example.com/article
app.get('/*', (c) => {
  const path = c.req.path.slice(1)
  const qs = new URL(c.req.url).search
  const candidate = normalizeUrl(decodeURIComponent(path) + (qs || ''))
  if (candidate) return c.redirect(`/read?url=${encodeURIComponent(candidate)}`)
  return c.redirect('/')
})

export default app
