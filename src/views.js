import { METHODS, rankMethods } from './methods.js'

const esc = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const FONTS = 'https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=IBM+Plex+Mono:wght@400;500;700&display=swap'

const CSS = `
:root{
  --red:#FF2D55;--pink:#FF6B82;--bg:#0B0B09;--raised:#12100d;--card:#17140f;
  --cream:#F0EDE6;--muted:#9c948a;--gold:#c9a84c;--line:#26221b;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{background:var(--bg);color:var(--cream);font-family:system-ui,-apple-system,Inter,sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:var(--pink);text-decoration:none}
a:hover{text-decoration:underline}
.wrap{max-width:960px;margin:0 auto;padding:0 20px}
.mono{font-family:'IBM Plex Mono',monospace}
header.top{border-bottom:1px solid var(--line);background:rgba(11,11,9,.85);backdrop-filter:blur(10px);position:sticky;top:0;z-index:50}
header.top .wrap{display:flex;align-items:center;justify-content:space-between;height:62px}
.brand{font-family:'Syne',sans-serif;font-weight:800;font-size:20px;letter-spacing:-.5px}
.brand b{color:var(--red)}
.brand small{color:var(--muted);font-weight:700;font-size:11px;letter-spacing:1px;margin-left:8px;font-family:'IBM Plex Mono',monospace}
.hero{text-align:center;padding:70px 0 30px}
.hero h1{font-family:'Syne',sans-serif;font-weight:800;font-size:clamp(34px,6vw,58px);line-height:1.02;margin:0 0 16px;letter-spacing:-1.5px}
.hero h1 span{color:var(--red)}
.hero p.sub{font-size:clamp(16px,2.4vw,20px);color:var(--muted);max-width:620px;margin:0 auto 34px}
form.search{display:flex;gap:10px;max-width:680px;margin:0 auto;flex-wrap:wrap}
form.search input{flex:1;min-width:240px;background:var(--raised);border:1px solid var(--line);color:var(--cream);font-size:16px;padding:16px 18px;border-radius:12px;font-family:'IBM Plex Mono',monospace}
form.search input:focus{outline:none;border-color:var(--red);box-shadow:0 0 0 3px rgba(255,45,85,.15)}
.btn{background:var(--red);color:#fff;border:none;font-weight:700;font-size:16px;padding:16px 26px;border-radius:12px;cursor:pointer;font-family:'Syne',sans-serif;transition:transform .1s,background .15s}
.btn:hover{background:#ff1744;transform:translateY(-1px);text-decoration:none}
.btn.ghost{background:transparent;border:1px solid var(--line);color:var(--cream)}
.btn.ghost:hover{border-color:var(--red);background:var(--raised)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;margin:30px 0}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:20px;display:flex;flex-direction:column;transition:border-color .15s,transform .1s}
.card:hover{border-color:var(--red);transform:translateY(-2px)}
.card .ic{font-size:26px;margin-bottom:10px}
.card h3{font-family:'Syne',sans-serif;margin:0 0 2px;font-size:19px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.card .tag{font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px}
.card p{color:var(--muted);font-size:14px;flex:1;margin:8px 0 16px}
.card a.go{align-self:flex-start;font-weight:700;font-family:'IBM Plex Mono',monospace;font-size:14px;background:var(--raised);border:1px solid var(--line);padding:9px 16px;border-radius:9px;color:var(--cream)}
.card a.go:hover{border-color:var(--red);text-decoration:none;color:var(--pink)}
.badge{display:inline-block;background:rgba(201,168,76,.15);color:var(--gold);font-size:10px;font-weight:700;letter-spacing:.5px;padding:3px 8px;border-radius:20px;text-transform:uppercase}
.badge.rec{background:rgba(255,45,85,.15);color:var(--pink)}
.section{padding:20px 0 10px}
.section h2{font-family:'Syne',sans-serif;font-size:24px;margin:0 0 4px}
.section p.lead{color:var(--muted);margin:0 0 6px}
.target{background:var(--raised);border:1px solid var(--line);border-radius:12px;padding:14px 18px;margin:18px 0;font-family:'IBM Plex Mono',monospace;font-size:14px;word-break:break-all}
.target b{color:var(--gold)}
.steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px;margin:24px 0}
.step{background:var(--raised);border:1px solid var(--line);border-radius:14px;padding:22px}
.step .n{font-family:'Syne',sans-serif;font-weight:800;font-size:28px;color:var(--red)}
.step h4{margin:6px 0 6px;font-family:'Syne',sans-serif;font-size:17px}
.step p{color:var(--muted);font-size:14px;margin:0}
.bm{display:inline-block;background:var(--gold);color:#1a1408;font-weight:800;padding:10px 18px;border-radius:10px;font-family:'Syne',sans-serif;cursor:grab}
footer{border-top:1px solid var(--line);margin-top:60px;padding:30px 0;color:var(--muted);font-size:13px;text-align:center}
.legal{background:var(--raised);border:1px solid var(--line);border-left:3px solid var(--gold);border-radius:10px;padding:16px 20px;color:var(--muted);font-size:13px;margin:30px 0}
.reader{max-width:720px}
.reader h1.title{font-family:'Syne',sans-serif;font-size:clamp(28px,4vw,40px);line-height:1.1;letter-spacing:-1px;margin:26px 0 10px}
.reader .meta{color:var(--muted);font-size:14px;font-family:'IBM Plex Mono',monospace;border-bottom:1px solid var(--line);padding-bottom:16px;margin-bottom:8px}
.reader .lead{font-size:19px;color:#d8d2c8;margin:18px 0}
.reader .content{font-size:18px;line-height:1.75}
.reader .content p{margin:0 0 22px}
.reader .content h2,.reader .content h3{font-family:'Syne',sans-serif;margin:34px 0 12px}
.reader .content blockquote{border-left:3px solid var(--red);margin:24px 0;padding:4px 0 4px 20px;color:#d8d2c8;font-style:italic}
.reader .content a{color:var(--pink);border-bottom:1px solid rgba(255,107,130,.4)}
.reader .content img{max-width:100%;height:auto;border-radius:10px;margin:16px 0}
.reader .heroimg{width:100%;max-height:380px;object-fit:cover;border-radius:14px;margin:8px 0 4px}
.toolbar{display:flex;gap:10px;flex-wrap:wrap;margin:20px 0;padding:14px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.toolbar a{font-family:'IBM Plex Mono',monospace;font-size:13px;background:var(--raised);border:1px solid var(--line);padding:8px 14px;border-radius:9px;color:var(--cream)}
.toolbar a:hover{border-color:var(--red);text-decoration:none;color:var(--pink)}
.notice{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:22px;margin:20px 0}
@media(max-width:640px){.hero{padding:40px 0 20px}}
`

export function layout(title, body, { desc = '', wide = false } = {}) {
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc || 'Read paywalled articles free. Paste any link and pick a bypass method — reader mode, archive snapshots and more.')}">
<meta name="robots" content="index,follow">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${FONTS}" rel="stylesheet">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔓</text></svg>">
<style>${CSS}</style></head>
<body>
<header class="top"><div class="wrap">
  <a href="/" class="brand" style="color:var(--cream)">🔓 Paywall<b>Free</b><small>RADICAL</small></a>
  <a href="/how" class="mono" style="font-size:13px;color:var(--muted)">how it works</a>
</div></header>
<main class="wrap"${wide ? ' style="max-width:1100px"' : ''}>${body}</main>
<footer><div class="wrap">
  A <a href="https://theradicalparty.com">Radical Party</a> project · <a href="/how">how it works</a> · <a href="/about">about</a><br>
  <span class="mono" style="font-size:12px">Vibe · Vote · Veto — free the news.</span>
</div></footer>
</body></html>`
}

function methodCard(m, url) {
  const href = m.build(url)
  const rec = m._recommended
  return `<div class="card">
    <div class="ic">${m.icon}</div>
    <h3>${esc(m.name)} ${rec ? '<span class="badge rec">Recommended</span>' : m.kind === 'internal' ? '<span class="badge">Built-in</span>' : ''}</h3>
    <span class="tag">${esc(m.tagline)}</span>
    <p>${esc(m.desc)}</p>
    <a class="go" href="${href}"${m.kind === 'external' ? ' target="_blank" rel="noopener noreferrer"' : ''}>${m.kind === 'internal' ? 'Open →' : 'Try it ↗'}</a>
  </div>`
}

export function homePage(host) {
  const bm = bookmarklet(host)
  const cards = METHODS.slice(0, 6).map((m) => methodCard(m, 'https://example.com/article')).join('')
  return layout('PaywallFree — read paywalled articles free', `
  <section class="hero">
    <h1>Read any <span>paywalled</span><br>article. Free.</h1>
    <p class="sub">Paste a link. We fetch it the way Google's crawler does and give you a clean, readable copy — plus every archive and bypass trick in one place.</p>
    <form class="search" action="/read" method="get">
      <input name="url" type="url" inputmode="url" placeholder="https://www.nytimes.com/2026/..." required autofocus>
      <button class="btn" type="submit">Unlock</button>
    </form>
    <p class="mono" style="color:var(--muted);font-size:13px;margin-top:14px">or drag this to your bookmarks bar → <a class="bm" href="${bm}" onclick="return false">🔓 PaywallFree</a></p>
  </section>

  <section class="section">
    <h2>Every method, one page</h2>
    <p class="lead">When you paste a link we rank the tricks most likely to work for that site. A preview of what's on offer:</p>
    <div class="grid">${cards}</div>
  </section>

  <div class="legal">
    <b style="color:var(--gold)">Use it responsibly.</b> PaywallFree points you at publicly reachable copies (search-engine snapshots, archives, crawler-visible HTML). It's for readers who hit a wall on a single article — not a substitute for subscribing to journalism you rely on. If a publisher's work is worth your time, back it.
  </div>

  <section class="section" style="text-align:center;padding:20px 0 50px">
    <a class="btn ghost" href="/how">See how it works →</a>
  </section>
  `, { desc: 'Paste any paywalled article link and read it free — reader mode, archive snapshots, and every bypass trick in one place.' })
}

export function readPage(url, host) {
  const ranked = rankMethods(url)
  // mark the top-ranked non-generic method as recommended
  if (ranked[0]) ranked[0]._recommended = true
  let display = url
  try { const u = new URL(url); display = `<b>${esc(u.host)}</b>${esc(u.pathname)}` } catch {}
  const cards = ranked.map((m) => methodCard(m, url)).join('')
  return layout(`Unlock: ${safeHost(url)} — PaywallFree`, `
  <section class="section" style="padding-top:40px">
    <h2>Pick your bypass</h2>
    <p class="lead">Methods ranked for this article. Start at the top — if one falls short, try the next.</p>
    <div class="target">🔗 ${display}</div>
  </section>
  <div class="grid">${cards}</div>
  <div class="legal">Different sites yield to different tricks. Hard paywalls (WSJ, FT, Bloomberg) usually need <b style="color:var(--gold)">Archive.today</b>; soft/metered walls (most news sites) fall to <b style="color:var(--gold)">Radical Reader</b>. Medium → <b style="color:var(--gold)">Freedium</b>.</div>
  <section class="section" style="text-align:center;padding:10px 0 50px"><a class="btn ghost" href="/">← Try another link</a></section>
  `, { desc: `Bypass the paywall on ${safeHost(url)} — reader mode, archives and more.` })
}

export function readerPage(art, url, host) {
  const body = `
  <article class="reader">
    <div class="toolbar">
      <a href="/proxy?url=${encodeURIComponent(url)}">🛰️ Full page view</a>
      <a href="/read?url=${encodeURIComponent(url)}">🔀 Other methods</a>
      <a href="${esc(url)}" target="_blank" rel="noopener noreferrer">↗ Original</a>
      <a href="/">🏠 Home</a>
    </div>
    ${art.image ? `<img class="heroimg" src="${esc(art.image)}" alt="" loading="lazy">` : ''}
    <h1 class="title">${esc(art.title || 'Untitled')}</h1>
    <div class="meta">${art.site ? esc(art.site) : safeHost(url)}${art.author ? ' · ' + esc(art.author) : ''}${art.published ? ' · ' + esc(art.published.slice(0, 10)) : ''}${art.wordCount ? ' · ' + art.wordCount + ' words' : ''}</div>
    ${art.description ? `<p class="lead">${esc(art.description)}</p>` : ''}
    <div class="content">${art.bodyHtml || ''}</div>
    <div class="toolbar" style="margin-top:36px">
      <a href="/read?url=${encodeURIComponent(url)}">🔀 Didn't work? Try another method</a>
      <a href="${esc(url)}" target="_blank" rel="noopener noreferrer">↗ Original article</a>
    </div>
  </article>`
  return layout(`${art.title || 'Reader'} — PaywallFree`, body, { desc: art.description || `Read ${safeHost(url)} free.` })
}

export function errorPage(url, message) {
  const ranked = rankMethods(url).filter((m) => m.kind === 'external')
  const hero = ranked[0] // most reliable external route (Archive.today for hard paywalls)
  return layout('Reader unavailable — PaywallFree', `
  <section class="section" style="padding-top:40px">
    <h2>This one needs a snapshot</h2>
    <div class="notice">
      <p style="margin-top:0">Our reader couldn't pull clean text from this page${message ? ` <span class="mono" style="color:var(--muted)">(${esc(message)})</span>` : ''}. Some publishers (FT, WSJ, Bloomberg) block every server fetch and render entirely in JavaScript — no proxy can reach the text. A community <b style="color:var(--gold)">archive snapshot</b> is the reliable way in.</p>
      <div class="target" style="margin:16px 0">🔗 ${esc(url)}</div>
      ${hero ? `<a class="btn" style="font-size:17px" href="${hero.build(url)}" target="_blank" rel="noopener noreferrer">${hero.icon} Open ${esc(hero.name)} snapshot ↗</a>` : ''}
    </div>
  </section>
  <p class="lead" style="color:var(--muted);margin:24px 0 4px">Or try another route:</p>
  <div class="grid">${ranked.slice(1, 6).concat(METHODS.filter((m) => m.id === 'proxy')).map((m) => methodCard(m, url)).join('')}</div>
  <section class="section" style="text-align:center;padding:10px 0 50px"><a class="btn ghost" href="/">← Try another link</a></section>
  `)
}

export function howPage(host) {
  const bm = bookmarklet(host)
  return layout('How it works — PaywallFree', `
  <section class="hero" style="padding:50px 0 10px">
    <h1 style="font-size:clamp(30px,5vw,46px)">How it <span>works</span></h1>
    <p class="sub">Three ways in. No account, no extension required.</p>
  </section>
  <div class="steps">
    <div class="step"><div class="n">1</div><h4>Paste the link</h4><p>Drop any article URL into the box on the home page and hit Unlock.</p></div>
    <div class="step"><div class="n">2</div><h4>We rank the tricks</h4><p>Based on the site, we sort the methods most likely to work — reader mode, archives, Freedium and more.</p></div>
    <div class="step"><div class="n">3</div><h4>Read it</h4><p>Open the top method. If a wall's still up, the next one down almost always clears it.</p></div>
  </div>

  <section class="section">
    <h2>The bookmarklet</h2>
    <p class="lead">On any paywalled page, click this to jump straight to PaywallFree for that URL. Drag it to your bookmarks bar:</p>
    <p style="margin:18px 0"><a class="bm" href="${bm}" onclick="return false">🔓 PaywallFree</a></p>
    <p class="mono" style="color:var(--muted);font-size:13px">Can't drag? Make a new bookmark and paste the code as the URL: <br><code style="color:var(--gold);word-break:break-all">${esc(bm)}</code></p>
  </section>

  <section class="section">
    <h2>Or just edit the address bar</h2>
    <p class="lead">Put <b class="mono" style="color:var(--gold)">${esc(host)}/</b> in front of any link:</p>
    <div class="target">${esc(host)}/<b>https://www.nytimes.com/2026/...</b></div>
  </section>

  <section class="section">
    <h2>What each method does</h2>
    <div class="grid">${METHODS.map((m) => `<div class="card"><div class="ic">${m.icon}</div><h3>${esc(m.name)}</h3><span class="tag">${esc(m.tagline)}</span><p>${esc(m.desc)}</p></div>`).join('')}</div>
  </section>

  <div class="legal"><b style="color:var(--gold)">The honest version:</b> paywalls are how a lot of journalism gets paid for. PaywallFree exists for the one-off article, the dead link, the thing behind a wall you'll read once. If a publication is part of your week, subscribe — that's the point of a free press worth reading.</div>
  <section class="section" style="text-align:center;padding:10px 0 50px"><a class="btn" href="/">Try it →</a></section>
  `, { desc: 'How PaywallFree unlocks paywalled articles: paste a link, pick a ranked bypass method, read free.' })
}

export function aboutPage() {
  return layout('About — PaywallFree', `
  <section class="section" style="padding-top:50px">
    <h2>About PaywallFree</h2>
    <p class="lead" style="max-width:640px">A single page that collects every reliable way to read a paywalled article — a built-in reader that fetches pages the way search crawlers see them, plus a ranked menu of archives and bypass services.</p>
    <div class="notice" style="max-width:680px">
      <h3 style="font-family:'Syne',sans-serif;margin-top:0">Why it exists</h3>
      <p>Information wants to be reachable. Metered walls, "you've read your 3 free articles" gates and reg-walls block a lot of the public web — including public-interest journalism people are trying to cite, share and read once. This puts the open copies in one place.</p>
      <h3 style="font-family:'Syne',sans-serif">The ask</h3>
      <p style="margin-bottom:0">Back journalism you value. This is for the occasional wall, not for freeloading a paper you read daily. Support a free press worth having.</p>
    </div>
    <p class="mono" style="color:var(--muted);font-size:13px">Open source · a Radical Party project · <a href="https://git.theradicalparty.com/maverick/paywall">source</a></p>
    <a class="btn ghost" href="/">← Home</a>
  </section>
  `, { desc: 'About PaywallFree — a Radical Party project collecting every way to read paywalled articles free.' })
}

// ---- helpers ----

export function safeHost(url) { try { return new URL(url).host.replace(/^www\./, '') } catch { return 'this page' } }

export function bookmarklet(host) {
  const code = `(function(){var u=encodeURIComponent(location.href);location.href='https://${host}/read?url='+u;})();`
  return 'javascript:' + code
}

export { esc }
