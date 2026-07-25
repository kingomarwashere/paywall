// Server-side fetching + paywall stripping.
// Soft/metered paywalls serve full article HTML to search-engine + social crawlers
// for SEO, then hide it client-side with JS overlays. We fetch AS a crawler and
// either (a) drop the scripts + unlock the layout (proxy mode) or (b) extract the
// article text into a clean reader (reader mode).

const CRAWLER_UAS = {
  google: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  bing: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  // Many hard paywalls (AFR, some News Corp titles) block Googlebot by IP but still
  // serve the FULL article to social link-preview crawlers. Try these too.
  facebook: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  twitter: 'Twitterbot/1.0',
}

const REFERERS = {
  google: 'https://www.google.com/',
  facebook: 'https://www.facebook.com/',
  twitter: 'https://t.co/',
  reddit: 'https://www.reddit.com/',
}

export async function fetchAsCrawler(url, { ref = 'google', bot = 'google' } = {}) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': CRAWLER_UAS[bot] || CRAWLER_UAS.google,
      'Referer': REFERERS[ref] || REFERERS.google,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'X-Forwarded-For': '66.249.66.1',
      'Cache-Control': 'no-cache',
    },
    redirect: 'follow',
    cf: { cacheTtl: 300, cacheEverything: false },
  })
  return res
}

// Fetch the URL as several crawler identities at once and keep the richest HTML.
// Returns { html, headers, contentType, bot } or null on total failure.
// `bots` defaults to a search-crawler + two social crawlers — the combination that
// covers both SEO soft-paywalls (Googlebot) and social-only gates (AFR etc.).
export async function fetchBest(url, { ref = 'google', bots = ['google', 'facebook', 'bing'] } = {}) {
  const settled = await Promise.allSettled(bots.map((bot) => fetchAsCrawler(url, { ref, bot })))
  let best = null
  let bestScore = -1
  let fallback = null // first usable response even if low-score (e.g. non-html)
  for (let i = 0; i < settled.length; i++) {
    if (settled[i].status !== 'fulfilled') continue
    const res = settled[i].value
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('html')) {
      if (!fallback) fallback = { html: null, headers: res.headers, contentType: ct, bot: bots[i], response: res }
      continue
    }
    let html
    try { html = await res.text() } catch { continue }
    // Score: paragraph density dominates; length is a mild tie-breaker.
    const paras = (html.match(/<p[ >]/gi) || []).length
    const score = paras * 100 + Math.min(html.length / 1000, 400)
    if (!fallback) fallback = { html, headers: res.headers, contentType: ct, bot: bots[i] }
    if (score > bestScore) { bestScore = score; best = { html, headers: res.headers, contentType: ct, bot: bots[i] } }
  }
  return best || fallback
}

// Fall back to the Internet Archive when the live site blocks every crawler
// (FT, WSJ, etc.). Wayback is Worker-friendly, unlike archive.today which
// challenges datacenter IPs. Returns { html, timestamp, snapshotUrl } or null.
export async function fetchFromWayback(url) {
  try {
    const api = `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`
    const r = await fetch(api, { headers: { 'User-Agent': 'PaywallFree/1.0 (+https://paywall.theradicalparty.com)' }, cf: { cacheTtl: 600 } })
    if (!r.ok) return null
    const data = await r.json()
    const snap = data && data.archived_snapshots && data.archived_snapshots.closest
    if (!snap || !snap.available || !snap.url) return null
    // `id_` gives the raw archived page without Wayback's toolbar/URL-rewriting — cleaner to extract.
    const raw = snap.url.replace(/^http:/, 'https:').replace(/\/web\/(\d+)\//, '/web/$1id_/')
    const res = await fetch(raw, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17 Safari/605.1.15' },
      redirect: 'follow',
    })
    if (!res.ok) return null
    if (!(res.headers.get('content-type') || '').includes('html')) return null
    const html = await res.text()
    return { html, timestamp: snap.timestamp, snapshotUrl: snap.url.replace(/^http:/, 'https:') }
  } catch { return null }
}

// ---- Full-page proxy: keep the layout, drop the paywall ----

const UNLOCK_CSS = `
  html, body { overflow: auto !important; position: static !important; height: auto !important; max-height: none !important; }
  body { filter: none !important; -webkit-filter: none !important; }
  * { -webkit-user-select: auto !important; user-select: auto !important; }
  /* Common paywall / regwall vendors + generic markers */
  .tp-modal, .tp-backdrop, .tp-iframe-wrapper, #piano-id, [id^="piano"],
  [class*="paywall"], [class*="Paywall"], [id*="paywall"], [id*="Paywall"],
  [class*="regwall"], [class*="reg-wall"], [class*="regGate"], [class*="reg-gate"],
  [class*="subscribe-wall"], [class*="subscription-wall"], [class*="meteredContent"],
  [class*="poool"], .poool-widget, [class*="piano-"], [class*="pelcro"],
  [data-testid*="paywall"], [data-testid*="gate"], [aria-label*="paywall" i],
  [class*="article-gate"], [class*="content-gate"], [class*="barrier"] {
    display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important;
  }
`

const UNLOCK_JS = `(function(){
  try {
    var kill = /paywall|reg-?wall|reg-?gate|subscribe-?wall|meter|barrier|piano|poool|pelcro|content-gate|article-gate/i;
    document.querySelectorAll('body *').forEach(function(el){
      try {
        var id = (el.id||'') + ' ' + (el.className && el.className.toString ? el.className.toString() : '');
        if (kill.test(id)) { el.remove(); return; }
        var s = getComputedStyle(el);
        // strip full-viewport fixed/sticky overlays
        if ((s.position === 'fixed' || s.position === 'sticky') && el.offsetHeight > innerHeight*0.6 && el.offsetWidth > innerWidth*0.6) {
          el.remove();
        }
      } catch(e){}
    });
    // restore scrolling that JS-locked the body
    document.documentElement.style.overflow='auto'; document.body.style.overflow='auto';
    document.documentElement.style.position='static'; document.body.style.position='static';
  } catch(e){}
})();`

export function stripPaywall(html, headers, url) {
  const res = new Response(html, { headers })
  const banner = `<div style="position:sticky;top:0;z-index:2147483647;background:#0B0B09;color:#F0EDE6;font:600 13px/1.4 system-ui,sans-serif;padding:8px 14px;border-bottom:2px solid #FF2D55;display:flex;gap:12px;align-items:center;justify-content:center">
    <span style="color:#FF2D55">RADICAL</span> paywall bypass · <a href="/read?url=${encodeURIComponent(url)}" style="color:#FF6B82">try another method</a> · <a href="/reader?url=${encodeURIComponent(url)}" style="color:#FF6B82">reader view</a>
  </div>`

  const rewriter = new HTMLRewriter()
    .on('head', {
      element(el) {
        el.prepend(`<base href="${url}">`, { html: true })
        el.append(`<style>${UNLOCK_CSS}</style>`, { html: true })
      },
    })
    // Drop scripts — the paywall overlay is injected by JS; static crawler HTML already has the text.
    .on('script', { element(el) { el.remove() } })
    .on('link[as="script"]', { element(el) { el.remove() } })
    .on('link[rel="preload"][as="script"]', { element(el) { el.remove() } })
    .on('body', {
      element(el) {
        el.prepend(banner, { html: true })
        el.append(`<script>${UNLOCK_JS}</script>`, { html: true })
      },
    })

  const out = rewriter.transform(res)
  const outHeaders = new Headers(out.headers)
  outHeaders.delete('content-security-policy')
  outHeaders.delete('content-security-policy-report-only')
  outHeaders.delete('x-frame-options')
  outHeaders.set('content-type', 'text/html; charset=utf-8')
  outHeaders.set('cache-control', 'public, max-age=300')
  return new Response(out.body, { status: 200, headers: outHeaders })
}

// ---- Reader mode: extract the article into clean text ----

function meta(html, ...names) {
  for (const n of names) {
    const re = new RegExp(`<meta[^>]+(?:property|name)=["']${n}["'][^>]+content=["']([^"']+)["']`, 'i')
    const m = html.match(re) || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${n}["']`, 'i'))
    if (m) return decodeEntities(m[1])
  }
  return ''
}

function decodeEntities(s) {
  return (s || '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘')
    .replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”').replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–').replace(/&hellip;/g, '…').replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
}

// Pick the densest content region, then keep only meaningful tags.
export function extractArticle(html, url) {
  const title = meta(html, 'og:title', 'twitter:title') || (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '').trim()
  const description = meta(html, 'og:description', 'description', 'twitter:description')
  const image = meta(html, 'og:image', 'twitter:image')
  const author = meta(html, 'author', 'article:author') || (html.match(/<[^>]+rel=["']author["'][^>]*>([^<]+)</i)?.[1] || '')
  const published = meta(html, 'article:published_time', 'datePublished')
  const site = meta(html, 'og:site_name') || (() => { try { return new URL(url).host.replace(/^www\./, '') } catch { return '' } })()

  // Isolate a candidate container: prefer <article>, then JSON-LD articleBody, then <main>, then body.
  let region = ''
  const artMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
  if (artMatch && countParagraphs(artMatch[1]) >= 2) region = artMatch[1]
  if (!region) {
    const ld = extractJsonLdBody(html)
    if (ld) region = ld
  }
  if (!region) {
    const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
    if (mainMatch) region = mainMatch[1]
  }
  if (!region) region = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || html

  const bodyHtml = cleanRegion(region, url)
  const text = bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return { title: decodeEntities(title), description, image, author: decodeEntities(author), published, site, bodyHtml, wordCount: text ? text.split(' ').length : 0 }
}

function countParagraphs(s) { return (s.match(/<p[ >]/gi) || []).length }

function extractJsonLdBody(html) {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
  for (const b of blocks) {
    try {
      const data = JSON.parse(b[1].trim())
      const arr = Array.isArray(data) ? data : (data['@graph'] || [data])
      for (const node of arr) {
        if (node && node.articleBody && node.articleBody.length > 200) {
          return node.articleBody.split(/\n{1,}/).map((p) => `<p>${p.trim()}</p>`).join('')
        }
      }
    } catch {}
  }
  return ''
}

function cleanRegion(region, url) {
  let h = region
  // Remove non-content blocks entirely
  h = h.replace(/<(script|style|noscript|svg|form|iframe|nav|header|footer|aside|button|figure[^>]*aria-hidden)[\s\S]*?<\/\1>/gi, ' ')
  h = h.replace(/<!--[\s\S]*?-->/g, ' ')
  // Drop obvious junk containers by class/id
  h = h.replace(/<(div|section|ul|span)[^>]*(?:class|id)=["'][^"']*(share|social|newsletter|promo|related|recommend|comment|advert|ad-|subscribe|paywall|nav|menu|breadcrumb|tags?|caption|byline-social)[^"']*["'][\s\S]*?<\/\1>/gi, ' ')

  // Collect meaningful blocks in document order
  const keep = []
  const re = /<(h1|h2|h3|h4|p|blockquote|li|pre)[^>]*>([\s\S]*?)<\/\1>/gi
  let m
  while ((m = re.exec(h))) {
    const tag = m[1].toLowerCase()
    let inner = m[2].replace(/<(?!\/?(a|b|i|em|strong|code|br)\b)[^>]+>/gi, '') // keep light inline tags
    inner = inner.replace(/\s+/g, ' ').trim()
    const plain = inner.replace(/<[^>]+>/g, '').trim()
    if (!plain) continue
    if (tag === 'p' && plain.length < 2) continue
    keep.push(tag === 'li' ? `<li>${inner}</li>` : `<${tag}>${inner}</${tag}>`)
  }
  let out = keep.join('\n')
  // wrap consecutive <li> in a <ul>
  out = out.replace(/(?:<li>[\s\S]*?<\/li>\n?)+/g, (block) => `<ul>${block}</ul>`)
  // absolutise anchor hrefs
  out = out.replace(/href=["'](\/[^"']*)["']/gi, (_, p) => { try { return `href="${new URL(p, url).href}"` } catch { return `href="${p}"` } })
  return decodeEntities(out)
}
