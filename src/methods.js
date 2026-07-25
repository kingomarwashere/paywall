// Bypass methods. Each returns a target URL for a given article URL.
// `kind`: 'internal' = handled by our own Worker, 'external' = redirect to a 3rd-party service.

export const METHODS = [
  {
    id: 'reader',
    kind: 'internal',
    name: 'Radical Reader',
    tagline: 'Clean, distraction-free text',
    desc: 'We fetch the page as a search engine crawler, extract the article, and rebuild it as plain readable text. Best first try for most soft paywalls.',
    icon: '📖',
    build: (u) => `/reader?url=${encodeURIComponent(u)}`,
  },
  {
    id: 'proxy',
    kind: 'internal',
    name: 'Radical Proxy',
    tagline: 'Full page, paywall stripped',
    desc: 'Loads the original page (styles and images intact) through our server, spoofing a Googlebot fetch and stripping paywall overlays. Use when Reader misses the layout.',
    icon: '🛰️',
    build: (u) => `/proxy?url=${encodeURIComponent(u)}`,
  },
  {
    id: 'archive-ph',
    kind: 'external',
    name: 'Archive.today',
    tagline: 'Community snapshots',
    desc: 'Crowd-sourced permanent snapshots. Excellent for NYT, WSJ, FT, Bloomberg, The Atlantic and most hard paywalls.',
    icon: '🗄️',
    build: (u) => `https://archive.ph/newest/${u}`,
  },
  {
    id: 'wayback',
    kind: 'external',
    name: 'Wayback Machine',
    tagline: 'Internet Archive',
    desc: "archive.org's public archive. Great fallback when a snapshot exists but Archive.today doesn't have one.",
    icon: '🕰️',
    build: (u) => `https://web.archive.org/web/2/${u}`,
  },
  {
    id: 'google-cache',
    kind: 'external',
    name: 'Google Referer',
    tagline: 'Arrive "from Google"',
    desc: 'Opens the article as though you clicked it from Google search results — many metered sites unlock the first click.',
    icon: '🔎',
    build: (u) => `/proxy?url=${encodeURIComponent(u)}&ref=google`,
  },
  {
    id: 'freedium',
    kind: 'external',
    name: 'Freedium',
    tagline: 'Medium articles',
    desc: 'Purpose-built reader for Medium and Medium-hosted publications.',
    icon: '✍️',
    domains: ['medium.com', 'towardsdatascience.com', 'levelup.gitconnected.com', 'betterprogramming.pub', 'uxdesign.cc'],
    build: (u) => `https://freedium.cfd/${u}`,
  },
  {
    id: 'twelveft',
    kind: 'external',
    name: '12ft.io',
    tagline: 'Classic prepender',
    desc: 'Loads the Google-cached version of the page. Hit or miss lately, but free and worth a shot.',
    icon: '🪜',
    build: (u) => `https://12ft.io/proxy?q=${encodeURIComponent(u)}`,
  },
  {
    id: 'smry',
    kind: 'external',
    name: 'smry.ai',
    tagline: 'AI summary + text',
    desc: 'Pulls the article text and adds an AI summary. Handy when you just want the gist.',
    icon: '🤖',
    build: (u) => `https://smry.ai/${u}`,
  },
  {
    id: 'printfriendly',
    kind: 'external',
    name: 'PrintFriendly',
    tagline: 'Print layout',
    desc: 'Renders the print-optimised version of the page, which frequently omits the paywall script.',
    icon: '🖨️',
    build: (u) => `https://www.printfriendly.com/print/?url=${encodeURIComponent(u)}`,
  },
  {
    id: 'gtranslate',
    kind: 'external',
    name: 'Translate Trick',
    tagline: 'Google Translate proxy',
    desc: 'Routes the page through Google Translate (EN→EN-ish), which acts as a lightweight proxy that dodges some scripts.',
    icon: '🌐',
    build: (u) => {
      try {
        const host = new URL(u).host
        return `https://${host.replace(/\./g, '-')}.translate.goog/${new URL(u).pathname}${new URL(u).search}?_x_tr_sl=en&_x_tr_tl=fr&_x_tr_hl=en`
      } catch { return `https://translate.google.com/translate?sl=en&tl=fr&u=${encodeURIComponent(u)}` }
    },
  },
]

// Order methods so domain-specific + likely-to-work ones bubble to the top.
export function rankMethods(url) {
  let host = ''
  try { host = new URL(url).host.replace(/^www\./, '') } catch {}
  const scored = METHODS.map((m) => {
    let score = 0
    if (m.domains && m.domains.some((d) => host === d || host.endsWith('.' + d))) score += 100
    if (m.kind === 'internal') score += 10
    return { m, score }
  })
  // stable sort by score desc, preserving original order for ties
  return scored
    .map((s, i) => ({ ...s, i }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map((s) => s.m)
}
