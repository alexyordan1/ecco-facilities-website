# Auditoría exhaustiva — eccofacilities.com
**Fecha:** 2026-06-10 · **Método:** 19 agentes de auditoría en paralelo (5 sistemas transversales, 10 página-por-página, 4 técnicos) + verificación visual en navegador (desktop/móvil, claro/oscuro)
**Datos completos:** [2026-06-10-hallazgos-completos.json](2026-06-10-hallazgos-completos.json) (401 hallazgos con evidencia, ubicación y recomendación)

## Veredicto

**401 hallazgos: 15 P0 · 112 P1 · 183 P2 · 91 P3.**

El sitio no tiene "inconsistencias entre dos estilos" — tiene **CINCO sistemas de tokens conviviendo** (A `--navy/--green`, A-embebido `--stage-*` cuyo root no existe en ninguna página, B-V1 `--qf-*`, B-V2 `--qf2-*`, review `--rv-*`) más una **tercera hoja de estilos sin tokens inyectada por el chat widget en 24 páginas**. Resultado medible: **153 hex distintos + 43 bases rgba en ~220 variantes** contra ~25 tokens documentados. 5+ "creams" en 3 familias de matiz, 16+ verdes, 8 rojos de error, 11 dorados, 6 grises de texto.

## Decisiones ya tomadas (Alex, 2026-06-10)

1. **Serif del sitio: Cormorant Garamond** (la del hero del homepage). El quote form migra de Fraunces → Cormorant. Nota técnica: las páginas de marketing NO cargan ejes itálicos — toda itálica actual es sintética (faux); hay que cargar los ejes reales.
2. **Dirección visual: Híbrido editorial** — heroes y banners CTA en navy oscuro con titulares Cormorant en **crema cálido** (token nuevo, marfil ~#F5F1E6 en vez de blanco puro); el resto de secciones en mundo crema cálido (como /quote) con tinta navy; **sage como único acento; se elimina el azul `#3068AD` y los degradados**.

## P0 — Roto o con exposición legal (deduplicado)

1. **Teléfono incorrecto.** El ÚNICO teléfono del sitio es (646) 303-0816 (quote.html noscript + mensajes de error de quote-flow.js). El canónico (929) 280-9374 aparece CERO veces. Ningún schema.org tiene `telephone`. ⚠️ PENDIENTE pregunta a Alex: cuál publicar.
2. **og:image universal roto.** 62 referencias en 24 archivos apuntan a `images/logo-vertical.png` que NO EXISTE (404 verificado en vivo). Todo share social del sitio sale sin imagen; favicons del blog 404; BlogPosting pierde rich results.
3. **Privacy Policy miente.** §4 afirma "no third-party tracking" mientras GTM + Microsoft Clarity (session recording) + HubSpot + GA4 cargan SIN consentimiento en TODAS las páginas, incluida la propia privacy.html. El banner de cookies es decorativo: Decline/GPC solo afectan a HubSpot (y con race condition). Badge "CCPA Compliant" insostenible. Exposición legal real.
4. **Blog = agujero negro de leads.** chat-widget.js usa 16 URLs relativas: en los 7 posts, TODOS los CTAs del chat, el avatar de Alina, el link de la Privacy Policy del banner y el handoff del mini-wizard (con los datos del lead ya recogidos) → 404. Pérdida total del lead.
5. **CTAs invisibles en why-ecco.** El banner final usa `class="btn"` pelado (sin fondo/color definidos): texto casi negro sobre gradiente navy ≈ 1.07:1. Los dos botones de cierre de la página son invisibles.
6. **Testimonios ilegibles en janitorial y day-porter.** Las clases wrapper `.test-sec`/`.test-single` JAMÁS existieron en styles.css (verificado en git); los hijos asumen fondo oscuro → texto blanco/gris claro sobre fondo casi blanco, incluido un h2 invisible en day-porter.
7. **Logo invisible en el blog.** Los 7 posts cargan el logo BLANCO sobre el nav glassmorphism casi blanco.
8. **Imagen hero rota** en el post de day-porter (`gyms.webp` no existe; el asset real es "Gyms & Fitness.webp").
9. **El formulario noscript de /quote no puede enviar NUNCA** (el endpoint exige JSON + Turnstile; el form postea urlencoded sin token) mientras promete "No JavaScript required".
10. **La página de accesibilidad afirma WCAG 2.1 AA** con fallos AA medidos en los propios tokens del sitio (--tm 4.23:1, --tl 3.40:1, footer 2.92:1, etc.). Reclamo público de conformidad falso = exposición legal.

## Diagnóstico por sistema (P1 destacados)

### Color
- 5 sistemas de tokens + chat widget sin tokens (~190 declaraciones hard-coded).
- 205 referencias `var(--stage-*)` SIN RESOLVER en las páginas legacy de quote (el root `.q-conv` no existe en ninguna página servida).
- System A todavía usa el gris muted #6B7A8D que System B ya rechazó por fallar AA (D62).
- 8 rojos de error; `.v-hint.bad` declarado DOS veces con rojos distintos en el mismo stylesheet.
- Rotador del hero con texto degradado animado (#8FD48C→#5BA8E6) — prohibido por la marca; cada palabra rota en un color distinto (--c-future azul, --c-health verde, --c-team dorado, --c-people teal).

### Tipografía
- 24 páginas sin ejes itálicos → toda itálica es faux (incluida la del hero que define la dirección elegida).
- ≈30 de 43 h2 en Title Case + 53 CTAs Title Case vs mandato sentence-case; solo quote.html cumple.
- **~240 em dashes** en copy vs regla de marca "cero" (solo quote.html limpio).
- Escala h2 fragmentada en 9 especificaciones ad-hoc; 27 letter-spacings distintos para eyebrows; `.sec-lbl` vs `.sec-label` duplicados.
- quote-janitorial/dayporter SIN h1; 8 páginas saltan niveles de heading; index y quote con DOS h1.

### Componentes
- 10+ etiquetas distintas para el MISMO CTA a quote.html ("Request a Quote" 27, "Get a Free Quote" 27, "Get Your Free Proposal→" 32, "Request a Free Quote→" 12…).
- Duplicación sistémica: 2 sistemas de value-cards, 5 implementaciones de testimonios, 2 patrones de blog-card, 3 sistemas de quote form desplegados a la vez, 4 wrappers de CTA-banner (uno, `.cta-banner-actions`, sin CSS — usado en about/privacy/terms).
- Footer sin teléfono ni dirección en las 25 páginas.
- Colisiones de flotantes: en index el cta-float (z89) tapa los botones del cookie banner (z60); chat + HubSpot = dos chats simultáneos en testimonials/careers.
- services.html: la comparación side-by-side desktop está MUERTA por un `.svc-panels{display:block!important}` sin scope que pertenece al tab-component de index.
- `?service=janitorial|dayporter` que pasan services/janitorial/day-porter y los 301 → quote-flow.js NUNCA lo lee: la preselección se pierde en silencio.

### Espaciado/Layout
- 167 estilos inline en 25 páginas (regla del proyecto: CERO). quote.html: 0 ✓.
- 179 recetas de sombra hard-coded vs 8 tokens definidos; radius 12px escrito a mano 13 veces junto a var(--r):12px.
- 19 anchos de breakpoint en quote-flow vs "un solo 700px" documentado; ~27 anchos de contenedor en styles.css.
- Cascada de padding móvil invertida: teléfonos pequeños reciben MÁS padding que tablets (16 páginas).
- 1,294 `!important` en quote-flow.css peleando contra sus propias 1,728 reglas legacy.

### Dark mode
- Existe SOLO en /quote, cambió de arquitectura 3 veces en 4 commits, y DESIGN.md documenta el mecanismo RETIRADO (toggle opt-in) — los 4 claims son falsos hoy.
- Auto vía OS sin override de usuario — viola la propia regla de marca "no surprise theme swaps".
- **Whiplash**: usuario OS-dark ve /quote midnight y 24+ páginas claras al navegar.
- Bug visual verificado en navegador: en dark, las tarjetas de bienvenida quedan claras con títulos marfil → casi invisibles.
- Cookie banner en dark: botón Accept blanco sobre sage #6FB376 = 2.5:1 (falla AA).
- 37 bloques muertos "dark-DISABLED-V1-LEGACY" (~17-21KB, 8.2% del CSS) enviados a todos los visitantes.

### SEO/Meta/Schema
- Schema LocalBusiness duplicado y conflictivo en 16 páginas; en index: street="Albany, NY", locality="New York", geo de Manhattan, ZIP 12207, @type "Borough" inexistente; CERO `telephone` en todo el sitio.
- aggregateRating auto-servido (5.0/6) sin Review markup en testimonials (riesgo de penalización rich results); FAQPage en index sin FAQ visible (la sección se borró, el schema quedó).
- sitemap.xml lista las 2 URLs legacy que redirigen; sitemap.html lista 3 de 7 posts mientras presume "Always Updated".
- 3 artefactos dev VIVOS en producción sin noindex: /index-reference, /mobile-test, /emailjs-template (mockups/quote.backup sí están gitignored y 404 — verificado en vivo).
- Link "Google Business" muerto (g.co/kgs/eccofacilities → 404) repetido 53 veces en 26 archivos.
- Títulos con 3 patrones de sufijo distintos; 8 títulos >60 chars, 10 descripciones >160.

### Performance
- ~18MB desplegados, ~60% muerto: 39 imágenes huérfanas (10.55MB) + ~31% de styles.css sin consumidores.
- Homepage carga ~4.0MB de imágenes (2.62MB JPEG sin optimizar con hermanos WebP/AVIF al lado) vía background-image inline → sin lazy loading ni srcset.
- /quote: doble sistema de diseño = ~760KB raw (~163KB gzip), styles.css render-blocking usado al ~5%.
- TODO el JS first-party sin minificar (quote-flow.js 265KB con 5,435 líneas comentadas); defer solo en blog.
- Los 7 posts sin preconnect a fonts.gstatic.

### Accesibilidad
- Tokens muted fallan AA en TODAS las superficies claras (System A --tm 4.23:1, --tl 3.40:1; System B --qf2-muted 3.87:1 en su propio cream).
- **La tabla de contraste de DESIGN.md es falsa** (afirma 6.8/4.6/4.1 donde lo real es 4.71/3.87-FAIL/2.05).
- 21 de 25 páginas sin `<main>`; dropdown del nav con aria-expanded permanentemente falso + role=menu sin teclado; menú móvil sin Escape ni gestión de foco; toggle móvil 32px (regla: 44px).
- maximum-scale=1.0 (patrón prohibido) en index + 2 legacy; inputs <16px disparan zoom iOS en 26 páginas (newsletter 13.4px).
- Contadores JS ignoran prefers-reduced-motion (la flag se declara y nunca se lee).

### Contenido/Integridad
- **Testimonios con evidencia de fabricación**: David Chen con 2 quotes y 2 empleadores distintos según la página ("Meridian Financial Group" vs "Meridian Capital Group" — firma real prominente de NYC); "Dr. Ana Morales, Midtown Wellness" vs "Dr. Patricia Morales, East Side Family Health"; Marcus Williams con gyms distintos.
- careers.html: id="positions" duplicado (el CTA del hero aterriza mal); form redirige a ?submitted=1 que nadie maneja (cero feedback al aplicante); promete respuesta en "48 hours" vs autoresponse "3-5 business days"; ofertas NYC sin rango salarial (exposición NYC Local Law 32); JobPosting sin baseSalary/validThrough.
- quote.html: success screen promete email de alina@ pero el backend envía de info@; meta descriptions anuncian un chat AI retirado en D125.
- Fecha contradictoria en janitorial-vs-day-porter (visible Feb 28 vs schema Mar 22).
- Claims absolutos sobre-prometedores: "0 Missed Services", "True 24/7 protection", "Zero VOCs", "non-toxic — no exceptions", "Hospital-level disinfection".

## Hallazgos visuales (verificación en navegador)

- Palabra rotativa del hero renderiza con fringing degradado multicolor (cada palabra un color distinto) — anti-patrón prohibido en el elemento más visible del sitio.
- Fila hero-metrics (12+/200+/5/0) = anti-patrón "hero metric" prohibido por DESIGN.md, repetida en 9 páginas con 2 markups.
- Píldora "Ask Alina" tapa el chip "Insured" del cert-marquee en el homepage (375px y 1440px).
- En /quote dark (auto por OS): títulos de tarjetas casi invisibles (verificado).
- Rojo Bootstrap #DC3545 hard-coded en sección "Not all cleaning companies" (ni System A ni B).
- El whiplash A→B al navegar home→/quote es total: temperatura, serif, acento y voz cambian de golpe.

---
*(Sigue: detalle completo de los 401 hallazgos, generado automáticamente del JSON)*



# Detalle P0 — Bloqueante/Legal

## [colores]

### Wrong phone number (646) 303-0816 shown to users; canonical (929) 280-9374 appears nowhere on the site
- **Categoría:** content
- **Evidencia:** quote.html:188 `<a href="tel:+16463030816">(646) 303-0816</a>` (noscript fallback contact), quote.backup.html:103 same, js/quote-flow.js:2162 and :2265 embed "Call (646) 303-0816" in the >1M sqft error message shown to users. grep for 280-9374/9292809374 across all *.html, blog/*.html, js/*.js returns 0 results. Schema.org blocks on 19 pages have NO telephone property at all.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/quote.html:188, quote.backup.html:103, js/quote-flow.js:2162,2265; all 19 schema blocks (index, about, services, janitorial, day-porter, why-ecco, testimonials, careers, sustainability, blog +7 posts, quote, quote.backup)
- **Recomendación:** Replace every (646) 303-0816 with (929) 280-9374 (tel:+19292809374), add "telephone": "+1-929-280-9374" to all schema.org LocalBusiness blocks, and add the phone to the footer contact block.

### Public accessibility statement claims WCAG 2.1 AA and 'sufficient color contrast throughout' — contradicted by measured failures
- **Categoría:** a11y
- **Evidencia:** accessibility.html states "WCAG 2.1 AA" and "Sufficient color contrast ratios between text and background colors throughout the site." Measured: --tm #6B7A8D body-muted text = 4.38:1 on white / 4.01:1 on --cream (18 var(--tm) consumers, all pages); --tl #7A8A9E = 3.53:1 (2 consumers); error text #E84C3D = 3.80:1 on white; #FF6B6B = 2.78:1; .qf-rev-special-optional.is-warn #D98014 = 2.98:1; footer .footer-copy (#C8D5E2 at opacity .4 over --navy) = effective #57677C, 2.92:1.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/accessibility.html (claims); css/styles.css :root --tm/--tl, .v-hint.bad, .footer-copy; css/quote-flow.source.css:5112
- **Recomendación:** Either fix the failing pairs (darken --tm to ~#5C6B7E+, --tl, error reds, footer copy opacity) or qualify the statement. A public conformance claim with measurable failures is legal exposure.

## [componentes]

### Non-canonical phone number (646) 303-0816 is the ONLY phone on the public site
- **Categoría:** content
- **Evidencia:** quote.html:188 noscript fallback: '<a href="tel:+16463030816">(646) 303-0816</a>' (same in quote.backup.html:103). Canonical phone is (929) 280-9374. grep for '929|tel:' across all *.html and blog/*.html returns ONLY these 2 hits — no page, footer, nav, or schema block anywhere shows the canonical phone. Footer Contact column shows only email + 'New York City &mdash; All 5 Boroughs'.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/quote.html:188 (noscript .qf-noscript-contact); absence affects all 25 public pages' footers (.footer-col Contact)
- **Recomendación:** Replace (646) 303-0816 with (929) 280-9374 in quote.html noscript, and add the canonical phone to the shared footer Contact column on all pages.

## [pag-service-detail]

### Testimonial sections unreadable on both pages: wrapper classes never defined in CSS, child styles designed for dark background render white/light text on near-white page
- **Categoría:** color
- **Evidencia:** Classes .test-sec (both pages) and .test-single (janitorial) have ZERO occurrences in css/styles.css — git log -S confirms .test-sec{ and .test-single were NEVER defined in any commit (pages have referenced them since initial commit 629e66f). The styled children assume a dark section: .test-name{color:var(--wh)} (white), .test-quote{color:var(--twm)} where --twm:#C8D5E2, .test-role{color:var(--twm)}, .test-av{color:var(--wh);background:rgba(48,104,173,.25);border:2px solid rgba(255,255,255,.15)}. The only light-bg overrides are scoped to .test-card-light, which neither page uses. With .test-sec unstyled, the section background is body #FAFBFC: quote text #C8D5E2 on #FAFBFC ≈ 1.36:1 contrast; names white-on-near-white ≈ 1.04:1. day-porter.html additionally renders heading 'What Day Porter Service Means to Our Clients' with .sec-ttl-l{color:var(--wh)} — a WHITE h2 on the white page. Also .test-sec provides no padding (section collapses against neighbors), janitorial's .test-single provides no max-width/centering, and day-porter puts its single testimonial in .test-grid{grid-template-columns:repeat(2,1fr)} leaving an empty second column.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/janitorial.html lines 199-211 (section class="test-sec rv" > .test-single); /Users/alexmercedes/Downloads/Ecco Webside/day-porter.html lines 169-180 (section class="test-sec" > .sec-head with sec-lbl-l/sec-ttl-l + .test-grid); css/styles.css (.test-name/.test-quote/.test-av base rules)
- **Recomendación:** Either define .test-sec as the dark navy section these child styles expect (background:var(--navy), padding, centered max-width) plus .test-single, or rebuild both sections on an existing light-bg testimonial pattern (.test-card-light scope). Verify rendered contrast on both pages afterward.

## [pag-about]

### why-ecco final CTA buttons invisible: bare .btn has no background/color on navy gradient banner
- **Categoría:** color
- **Evidencia:** Lines 250-251: <a href="quote.html" class="btn">Request a Free Quote →</a> and <a href="mailto:info@eccofacilities.com" class="btn">Email Us →</a> inside .cta-banner. Verified exhaustively in minified css/styles.css: only two rules target bare .btn (layout/sizing only — display:inline-flex…min-height:44px and min-height:44px); no .cta-banner a or .cta-banner .btn rule exists; base a{color:inherit}; body{color:var(--td)} (#1A1E2C). .cta-banner background is animated linear-gradient(-45deg,#0b1d38,#1e3562,#0f2847,#162d52). Result: transparent buttons, #1A1E2C text on ~#0B1D38 ≈ 1.07:1 contrast. about.html's same banner correctly uses btn btn-white (background:var(--wh);color:var(--navy)).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/why-ecco.html lines 246-254 (section 'Still comparing options? Let us make the decision easy.'); css/styles.css selectors .btn, .cta-banner
- **Recomendación:** Add btn-white (or a styled variant) to both anchors, matching about.html's cta-banner buttons; add a defensive .cta-banner .btn fallback style in styles.css.

## [pag-blog-index]

### All blog og:image/twitter:image/favicon/BlogPosting image point to nonexistent images/logo-vertical.png
- **Categoría:** content
- **Evidencia:** `ls images/logo-vertical.png` → "No such file or directory". Referenced 4x in each of the 7 posts (link rel="icon" href="../images/logo-vertical.png"; og:image, twitter:image, and JSON-LD BlogPosting "image" all = https://eccofacilities.com/images/logo-vertical.png) and 2x in blog.html (og:image, twitter:image) = 30 refs in this area; 23 HTML files reference it site-wide. Every social share of every article renders no image (with twitter:card summary_large_image, which expects a wide image, not a vertical logo even if it existed), and every post tab 404s its favicon. blog.html itself uses the correct favicon-32/16.png pair — posts diverge.
- **Ubicación:** blog.html lines 19,24; blog/5-signs-cleaning-company.html lines 21,26,27,32; blog/janitorial-vs-day-porter.html lines 21,26,27,32; blog/eco-certified-cleaning-matters.html lines 21,26,27,32; identical pattern in the other 4 posts
- **Recomendación:** Replace with an existing asset: favicon → ../images/favicon-32.png/16.png (match blog.html); og:image/twitter:image/BlogPosting image → each post's actual hero image (e.g. images/stock/22-handshake.webp) or images/logo-horizontal.png as fallback. Sweep all 23 referencing files.

### White logo on near-white glassmorphism nav — header logo invisible on all 7 blog posts
- **Categoría:** color
- **Evidencia:** All 7 posts: `<a href="../index.html" class="nav-logo"><img src="../images/logo-horizontal-white.png" ...>` while ALL 15 root pages use images/logo-horizontal.png (dark). css/styles.css: `.nav{...background:rgba(250,251,252,.92);backdrop-filter:blur(20px) saturate(1.2)...}` — the nav background is always near-white (#FAFBFC at 92%); `.nav.scrolled` only adds box-shadow, and styles.css has 0 occurrences of prefers-color-scheme, so there is no dark-nav state. logo-horizontal-white.png is the variant used on the navy footer.
- **Ubicación:** blog/5-signs-cleaning-company.html line 41; blog/janitorial-vs-day-porter.html line 41; blog/eco-certified-cleaning-matters.html line 41; same in the other 4 posts (nav-logo img src)
- **Recomendación:** Change nav-logo src to ../images/logo-horizontal.png in all 7 posts to match the root pages.

## [pag-blog-posts]

### Broken hero image: gyms.webp does not exist (day-porter post)
- **Categoría:** content
- **Evidencia:** src="../images/stock/gyms.webp" — no such file. images/stock/ contains "Gyms & Fitness.webp" (capitalized, with spaces) but no gyms.webp. grep across all *.html: this is the only reference site-wide. Cloudflare Pages is case/name-sensitive, so the article hero renders as a broken 300px-tall image with alt text "High-traffic commercial building lobby". Even the nearest existing asset is a gym/fitness photo, off-topic for a commercial-lobby day porter article, and would contradict the alt text.
- **Ubicación:** blog/benefits-day-porter-high-traffic-buildings.html line 68 (img inside article hero div, directly under the byline)
- **Recomendación:** Point src at an existing, topically correct asset (e.g. a lobby/common-area photo such as images/stock/hero-office.webp or Corporate Offices.webp), keep alt accurate to the chosen image, and rename assets to lowercase-hyphenated names.

## [pag-legal-util]

### Privacy Policy §4 falsely states no third-party tracking while GTM, Clarity, HubSpot and GA4 run on every page including the policy page itself
- **Categoría:** content
- **Evidencia:** privacy.html line 128: "Ecco Facilities does not use cookies for advertising or behavioral tracking purposes... We do not deploy third-party tracking cookies, analytics pixels, or retargeting technologies." Same file loads: GTM 'GTM-W2ZWXZ3T' (lines 4-5 + noscript iframe line 35), Microsoft Clarity 'w546w8zoh2' session-recording (lines 6-7), HubSpot tracker '//js-na2.hs-scripts.com/245755967.js' (line 231). js/main.js lines 5-7 push GA4 events: "/* GA4 dataLayer event tracking — fires when GTM is active */". The site's own cookie banner (js/cookie-consent.js line 12) admits: "We use cookies to improve your experience and analyze site traffic." _headers CSP whitelists googletagmanager.com, google-analytics.com, clarity.ms, js-na2.hs-scripts.com. Policy also fails to disclose HubSpot, GTM/GA4, Clarity, and the Mailchimp newsletter processor (form posts to eccofacilities.us22.list-manage.com on all pages); §3 discloses only the chat backend (which is accurate: js/chat-widget.js posts to https://ecco-chat-backend.vercel.app/api/chat).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/privacy.html lines 4-7, 128, 230-232; /Users/alexmercedes/Downloads/Ecco Webside/js/cookie-consent.js line 12; /Users/alexmercedes/Downloads/Ecco Webside/js/main.js lines 5-7; /Users/alexmercedes/Downloads/Ecco Webside/_headers line 8 (tracking stack loads on ALL ~26 public pages)
- **Recomendación:** Rewrite §4 to truthfully disclose GTM/GA4, Microsoft Clarity (session recording/heatmaps), HubSpot, and Mailchimp with purposes and opt-out; or actually remove those trackers. Add a third-party-processors list to §3.

### Cookie consent banner is decorative: Decline/GPC do not stop GTM or Clarity, which execute in <head> before any consent
- **Categoría:** js
- **Evidencia:** GTM and Clarity run synchronously in <head> on page load (privacy.html/terms.html/sitemap.html/404.html lines 4-8) regardless of stored consent. js/cookie-consent.js declineCookies() (lines 25-32) only sets localStorage 'ecco_cookies/ecco_consent' and pushes HubSpot _hsq 'doNotTrack'; the GPC branch (lines 2-8) likewise only gates HubSpot. grep of js/*.js shows the ONLY consumer of the consent keys is js/quote-flow.js lines 525-540 (PII persistence) — no consent-mode dataLayer push, no Clarity/GTM gating anywhere. So a user who clicks Decline keeps being tracked by GTM/GA4 and Clarity session recording.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/js/cookie-consent.js lines 2-8, 25-32; head of all 4 audited pages (privacy.html, terms.html, sitemap.html, 404.html); /Users/alexmercedes/Downloads/Ecco Webside/js/quote-flow.js lines 525-540
- **Recomendación:** Implement real gating: load GTM/Clarity only after accept (or use Google Consent Mode defaults=denied), and honor GPC/decline for all trackers, not just HubSpot.

## [pag-quote]

### No-JS fallback quote form can never submit successfully
- **Categoría:** js
- **Evidencia:** quote.html lines 164-191: noscript <form action="/api/submit-quote" method="POST"> submits application/x-www-form-urlencoded with no Turnstile token. functions/api/submit-quote.js line 122-124 hard-rejects any request whose Content-Type is not application/json ('Content-Type must be application/json'), line 150 parses await request.json() only, and lines 248-256 reject missing turnstileToken when the secret is configured (production). The noscript copy promises 'No JavaScript required.' Every no-JS submission returns a 4xx the user never sees (plain form POST renders raw JSON error).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/quote.html (noscript form, lines 164-191); /Users/alexmercedes/Downloads/Ecco Webside/functions/api/submit-quote.js (lines 122-124, 150, 248-266)
- **Recomendación:** Either make the endpoint accept form-encoded posts with a no-JS-tolerant spam check and a real HTML success page, or remove the fake fallback and show only the mailto/phone contact path in noscript.

## [seo-meta]

### og:image / twitter:image / schema image points to a file that does not exist (logo-vertical.png)
- **Categoría:** seo
- **Evidencia:** 62 occurrences across 24 HTML files reference https://eccofacilities.com/images/logo-vertical.png. images/ contains only logo-horizontal.png, logo-horizontal-white.png, logo-footer.png, favicons, alina-avatar-*. Live check: GET https://eccofacilities.com/images/logo-vertical.png returns HTTP 404. Used as og:image + twitter:image on every page with OG tags, as LocalBusiness "image" on index.html, and as BlogPosting "image" (a required Article rich-result property) on all 7 blog posts. Every social share (LinkedIn/Slack/iMessage/X) renders with no image; Article rich results fail image validation.
- **Ubicación:** index.html, about.html, services.html, janitorial.html, day-porter.html, why-ecco.html, testimonials.html, careers.html, sustainability.html, blog.html, accessibility.html, privacy.html, terms.html, sitemap.html, quote.html, quote.backup.html, index-reference.html, blog/*.html (all 7). Per-file counts: blog posts 4 each, index.html 3, others 2 each.
- **Recomendación:** Create a real 1200x630 OG image (a vertical logo is the wrong aspect ratio for summary_large_image anyway) and point all og:image/twitter:image/BlogPosting.image references at it; or short-term, swap references to the existing logo-horizontal.png.

### Wrong phone number is the ONLY phone on the site; canonical (929) 280-9374 appears nowhere
- **Categoría:** content
- **Evidencia:** quote.html line 188 (noscript fallback contact line): <a href="tel:+16463030816">(646) 303-0816</a>. Same in quote.backup.html line 103. grep for '929' across all *.html and blog/*.html returns 0 hits — the canonical company phone (929) 280-9374 does not exist anywhere in the public site. The schema.org 'telephone' property is also absent from every JSON-LD block (grep 'telephone' = 0 hits).
- **Ubicación:** quote.html:188, quote.backup.html:103; absence affects all pages' JSON-LD
- **Recomendación:** Replace tel:+16463030816 / (646) 303-0816 with tel:+19292809374 / (929) 280-9374 in quote.html (quote.backup.html is gitignored, fix anyway), and add "telephone": "+1-929-280-9374" to the LocalBusiness blocks.

## [js-conducta]

### Privacy policy denies tracking while GTM + Clarity + HubSpot load unconditionally; cookie-consent.js gates nothing
- **Categoría:** js
- **Evidencia:** privacy.html:128 states 'We do not deploy third-party tracking cookies, analytics pixels, or retargeting technologies... only essential, strictly necessary cookies' — yet privacy.html itself loads GTM 'GTM-W2ZWXZ3T' (line 5) and Microsoft Clarity 'w546w8zoh2' (line 7, session-recording = behavioral tracking) synchronously in <head> before any consent, plus HubSpot embed (lines 230-232). GTM+Clarity load ungated on 26 HTML pages (grep googletagmanager|clarity.ms matched all public pages incl. blog/*). cookie-consent.js (33 lines) only sets localStorage keys, dispatches events, and pushes _hsq doNotTrack on decline — it never blocks or unloads GTM/Clarity. Banner copy 'By continuing, you agree' appears AFTER trackers already fired. GPC branch (cookie-consent.js:3-8) auto-declines but trackers are already injected in <head>.
- **Ubicación:** js/cookie-consent.js (whole file); privacy.html:5,7,128,230-232; index.html:5,7; all 25 tracker-loading pages
- **Recomendación:** Either rewrite privacy.html section 4 to disclose GA4/GTM, Clarity, and HubSpot truthfully, or implement real consent gating (Google Consent Mode default-denied + Clarity/HubSpot loaded only on accept, like quote.html's HubSpot gate). Current state is a legal-factual contradiction on the policy page itself.

### Chat widget uses relative URLs — all CTAs, links, avatar, and quote handoff 404 on the 7 blog posts
- **Categoría:** js
- **Evidencia:** chat-widget.js loads on all 7 blog/*.html (via ../js/chat-widget.js); no <base> tag (grep -c '<base' blog/*.html = 0 on all 7). The widget hardcodes 16 relative .html links: quote.html x10 (CTA bar href='quote.html' at line 216, fallback responses lines 403-415, buildQuoteUrl line 722), janitorial.html x2, day-porter.html x2, sustainability.html x1, careers.html x1. From /blog/ these resolve to /blog/quote.html etc. — none exist (ls blog/ shows only 7 post files). Worst case: the mini quote wizard (QUOTE_STEPS lines 590-723) collects spaceType/sqft/frequency/urgency/name/email/phone then redirects to 'quote.html?...' → 404, losing the entire lead. Avatar CONFIG.avatar='images/alina-avatar-192.jpg' (line 78) → /blog/images/... 404 (blog/images does not exist) → broken avatar in toggle, header, tooltip on every blog post.
- **Ubicación:** js/chat-widget.js:78,216,403-416,424-425,722; affects blog/5-signs-cleaning-company.html, blog/benefits-day-porter-high-traffic-buildings.html, blog/choose-commercial-cleaning-company-nyc.html, blog/commercial-cleaning-checklist-nyc.html, blog/dirty-office-costs-productivity.html, blog/eco-certified-cleaning-matters.html, blog/janitorial-vs-day-porter.html
- **Recomendación:** Root-relative all URLs in chat-widget.js ('/quote.html', '/images/alina-avatar-192.jpg') — one sweep over CONFIG, getFallbackResponse, buildServiceCard, buildQuoteUrl, and the CTA bar template.


# Detalle P1 — Mayor

## [colores]

### Schema.org PostalAddress malformed on index and wrong/incomplete on 18 other pages
- **Categoría:** content
- **Evidencia:** index.html schema: "streetAddress": "Albany, NY" (not a street — canonical is 54 State St #804), "addressLocality": "New York" with "postalCode": "12207" (12207 is Albany; locality should be Albany). 18 other files (about, blog, careers, day-porter, janitorial, quote, quote.backup, services, sustainability, testimonials, why-ecco + 7 blog posts) carry only {"addressLocality":"New York","addressRegion":"NY","addressCountry":"US"} — no street, no ZIP, no phone.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/index.html (LocalBusiness schema) + 18 pages listed
- **Recomendación:** Standardize all schema blocks to: streetAddress "54 State St #804", addressLocality "Albany", postalCode "12207", telephone "+1-929-280-9374". Keep NYC as areaServed only.

### Five+ competing 'cream' surface values across three hue families — the visual core of the two-system split
- **Categoría:** color
- **Evidencia:** Cool blue-gray: --cream #F3F5F8 (System A token). Warm beige: --stage-cream #F5F1EA AND --rv-cream #F5F1EA (review screen inside quote-flow), #FAF8F4 ×3 (.ask-pill-input/.plan-verify/.success-signature), #F0ECE5, #EDE7DC. Sage-tinted: --qf2-cream #EEF2ED, --qf2-cream-2 #F6F9F5, --qf-cream-dark #E1E8DF. Legacy warm remnants still active: .qf-resume-inner background rgba(253,248,237,.92) + @supports fallback rgb(253,248,237) (quote-flow.source.css:4932,4947) directly contradicting the comment at :12921 claiming '#FDF8ED 72-82% α' was replaced with #EEF2ED; stale fallbacks var(--qf2-cream,#FDF8F3) at :9777-9778.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/css/styles.css (:root --cream, .q-conv --stage-cream, .ask-pill-input, .plan-verify, .success-signature, .plan-head, .transcript-user); css/quote-flow.source.css:93-95,4932,4947,8712,9706-9708,9777-9778
- **Recomendación:** Pick one cream per system (A: #F3F5F8, B: #EEF2ED), alias --stage-cream/--rv-cream to the chosen value, and purge #FDF8ED/#FDF8F3/#FAF8F4 remnants.

### System A muted text tokens fail AA sitewide; System A still ships the exact value System B already rejected for AA failure
- **Categoría:** a11y
- **Evidencia:** --tm:#6B7A8D = 4.38:1 on #FFF, 4.23:1 on --bg, 4.01:1 on --cream — 18 var(--tm) consumers in styles.css across all 18 public pages (captions, roles, metas). --tl:#7A8A9E = 3.53:1 on white. quote-flow.source.css:9714 comment: "--qf2-muted: #4F5C6E; /* D62 — was #6B7A8D (3.6:1 on cream, fail AA). Darkened to 5.7:1 */" — the fix was applied only to System B. Six muted grays now coexist for one role: #6B7A8D, #7A8A9E, #5A6B7F, #4F5C6E, #3C4D61, #8A9AAB(dark).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/css/styles.css :root{--tm,--tl} + 20 consumer rules; css/quote-flow.source.css:104-106,9714,8710
- **Recomendación:** Apply the D62 lesson to System A: darken --tm to ≥#5F6E81 (4.5:1 on --cream) and --tl to ≥#6A7A8E, or merge to the B muted scale.

### Eight error reds across the site; duplicate .v-hint.bad selector declared twice with different reds in the same stylesheet
- **Categoría:** color
- **Evidencia:** styles.css contains `.v-hint.ok{color:#3d9a43}.v-hint.bad{color:#ff6b6b}` (wizard block, ~offset 102.5K) AND `.v-hint.ok{color:var(--stage-sage)}.v-hint.bad{color:#e84c3d}` (~offset 129.9K) — later wins, so legacy wizard pages render #e84c3d (4.44:1 on the navy wiz overlay) instead of the intended #ff6b6b (6.07:1). Full red census: --red #C84444 (token, exactly 1 consumer: .pain-card), #E84C3D ×3, #FF6B6B ×4, #DC3545+#E8606D (.ba-col-bad, Bootstrap danger), B: #B23B3B ×6 (documented), #C44747 (.qf-input-invalid !important), #8B2626, plus var(--qf-red,#C84444) referenced 4× while --qf-red is NEVER defined (grep -c '--qf-red:' = 0 in both CSS files).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/css/styles.css (.v-hint.bad ×2, .form-field .v-err, .fg .v-err, .ba-col-bad, .plan-error); css/quote-flow.source.css:3479-3540,5048,5117,6180,9554-9594,10521,12138-12741
- **Recomendación:** Define one error red per system (A: --red, B: #B23B3B), delete the duplicate .v-hint.bad, define --qf-red or inline #B23B3B, and replace the Bootstrap #DC3545.

### --stage-* tokens are defined only on .q-conv, which exists in NO shipped page — 205 var(--stage-*) references resolve to nothing on live pages
- **Categoría:** color
- **Evidencia:** styles.css defines the warm-beige stage palette on `.q-conv{--stage-cream:#F5F1EA;--stage-edge:#E8E4DE;--stage-muted:#5A6B7F;...}`. grep -rl 'q-conv' over all *.html and js/*.js (excluding node_modules) returns zero files. Yet live components reference the tokens: .day-btn{border:1.5px solid var(--stage-edge)} (renders on quote-janitorial.html/quote-dayporter.html which contain 6 day-btn instances), .v-hint.ok{color:var(--stage-sage)}, .continue-btn.is-saved{background:linear-gradient(135deg,#1e6524,var(--stage-sage))}. Undefined custom properties make border-color fall to currentColor, gradients invalid-at-computed-value (background → initial), and .v-hint.ok inherit its parent color instead of green.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/css/styles.css (.q-conv token block + 205 var(--stage-*) refs); consumers live on quote-janitorial.html, quote-dayporter.html
- **Recomendación:** Move --stage-* definitions to :root (or delete the dead stage component family and re-point the few live consumers to System A tokens).

### Two .day-btn palettes collide in styles.css: legacy wizard (white-on-navy, BLUE selection) overridden by stage version with broken vars
- **Categoría:** component
- **Evidencia:** styles.css declares .day-btn twice as different components (26 rules total): wizard version `border:2px solid rgba(255,255,255,.12)` with `.day-btn.sel{border-color:var(--blue-l);background:var(--blue)}` (selection = BLUE, only blue-selected control on the site; green is the brand action color everywhere else) — then a later stage version `background:rgba(255,255,255,.94);border:1.5px solid var(--stage-edge)` whose base overrides the wizard base on quote-janitorial/quote-dayporter while var(--stage-edge/sage) is undefined there (see stage-token finding). Wizard JS uses classList.add('sel') (3×), stage states use .is-selected — both rule sets ship everywhere.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/css/styles.css (.day-btn, .day-btn.sel, .day-btn.is-selected); quote-janitorial.html, quote-dayporter.html
- **Recomendación:** Namespace the two components (.wiz-day-btn vs .stage-day-btn) and change the wizard selected state from blue to the green action color.

### Review screen (.qf-rv) has zero dark-mode coverage in the active Editorial Midnight blocks — its dark overrides live only inside disabled dead code
- **Categoría:** dark-mode
- **Evidencia:** quote.html:914 `<section class="qf-screen step-contact qf-rv qf2-stage">` is the live review/contact step. Active dark blocks (quote-flow.source.css:13138-13404) contain 0 matches for 'qf-rv' or '--rv-'; the only --rv-* dark overrides (--rv-paper:#161D1A, #08183A!important inputs, sage #9EE8A2) sit inside `@media (prefers-color-scheme: dark-DISABLED-V1-LEGACY)` at :9120-9135, which never matches. In OS dark mode the section keeps --rv-cream:#F5F1EA, --rv-paper:#FFFFFF, --rv-ink:#0E1311, --rv-gold:#B8942F light values while surrounding qf2 chrome switches to #1B2733.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/css/quote-flow.source.css:8709-8716 (light tokens), 9120-9135 (dead dark), 13138-13404 (active dark, no rv); quote.html:914
- **Recomendación:** Add --rv-* token overrides to the active @media (prefers-color-scheme: dark) PART A block, mirroring the values stranded in the disabled block.

### js/chat-widget.js injects a third, completely token-free stylesheet on 24 public pages (~190 hard-coded color declarations)
- **Categoría:** js
- **Evidencia:** chat-widget.js:84 `var styles = document.createElement('style')` injects rules using its own palette: greens #236128/#1A4A20 (CTA gradients `linear-gradient(135deg,#2D7A32 0%,#236128 100%)`), gold set #D68A0B/#8A6A1C/#F5E3B3/#FFF7E6 (#D68A0B on #FFF7E6 = 2.63:1, #8A6A1C on #F5E3B3 = 3.97:1), Tailwind slate #94A3B5 (2.57:1 on white), #5B6A84, #E5EBF2, #F5F3EE. Census: 49×#fff, 15×#0b1d38, 14×#2d7a32, 7×#236128 + 20 more distinct values. Loaded by 17 root pages + 7 blog posts (all public pages except quote.html).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/js/chat-widget.js:84-300 (injected CSS); loaded by 24 pages
- **Recomendación:** Point the injected CSS at System A custom properties (var(--green) etc.), replace #236128/#1A4A20 with --green/--green-l derivatives, and fix the three failing text pairs.

### System A vs System B same-role collisions live simultaneously on quote.html (loads both stylesheets)
- **Categoría:** color
- **Evidencia:** quote.html loads css/styles.css?v=15.1 AND css/quote-flow.css?v=50.3. Role forks: page bg --bg #FAFBFC vs --qf2-cream #EEF2ED; body text --td #1A1E2C vs --qf2-ink #0B1D38 (B uses A's navy as ink); muted #6B7A8D vs #4F5C6E; focus ring --focus-ring:var(--blue) (2 consumers, blue) vs `outline:2px solid var(--qf2-sage)`/var(--qf-sage) (8 consumers, green) — keyboard users see blue focus on skip-link/nav remnants and sage focus inside the form; error red #E84C3D/#FF6B6B vs #B23B3B; accent model green+blue dual (3× linear-gradient(90deg,var(--green),var(--blue)) nav progress bar) vs sage-only; one conic-gradient inside quote-flow re-imports System A blue rgba(48,104,173,.45)!important.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/quote.html (both <link> tags); css/styles.css :root; css/quote-flow.source.css:93-111,9706-9719
- **Recomendación:** Decide the canonical role values, bridge them via one shared token layer, and scope styles.css away from the form (or stop loading it on /quote).

### 37 dead dark-mode media blocks (~20.8KB source) ship in production quote-flow.css and pollute the palette with an entire abandoned theme
- **Categoría:** performance
- **Evidencia:** `@media(prefers-color-scheme:dark-DISABLED-V1-LEGACY)` — an intentionally invalid keyword — appears 37× in minified css/quote-flow.css (40× in source). The blocks carry the full retired V1 sage-dark palette: #E8ECF2 ×38, #232B22 ×33, #1F2824 ×22, #161D1A ×16, #8899A8 ×14, #0E1311, #2A3329, #08183A, #FFC9C9, #C7F0C9 etc. — ~19 hex values that can never render. quote-flow.source.css:13136 comment says they are 'kept (preserves git blame) but neutralized'.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/css/quote-flow.css (37 blocks); css/quote-flow.source.css:1471-9135 (40 blocks)
- **Recomendación:** Delete the disabled blocks from the shipped file (git history already preserves them); the active Editorial Midnight supersedes them.

## [tipografia]

### Title Case vs sentence case chaos across marketing headings and CTAs (PRODUCT.md mandates sentence case)
- **Categoría:** typography
- **Evidencia:** Of 43 .sec-ttl h2s sampled across 10 marketing pages, ~30 are Title Case: about.html 3/3 ("These Aren't Slogans. They're How We Operate."), services.html 4/4 ("Two Services. One Uncompromising Standard."), janitorial.html 6/6, day-porter.html 8/8, testimonials.html 1/1 — while index.html is 6/7 sentence case ("Not all cleaning companies are created equal.") with 1 Title Case outlier ("Trusted Across Every Industry"). Case is mixed WITHIN single pages on index, why-ecco ("See the Difference" vs "Hear from our clients"), careers ("This industry doesn't always treat its people well. We do." vs "What We Offer"), sustainability. All 7 blog post h1s + blog.html h1 "Insights for Better Facilities" are Title Case. Quote CTAs: 53 Title-Case instances in FOUR wording variants across 12 pages — ">Get Your Free Proposal" ×18, ">Get a Free Quote" ×14, ">Request a Quote" ×13, ">Request a Free Quote" ×8 — while quote.html's own send button is sentence case "Request my quote" (quote.html:1054). quote.html h2s are fully sentence-case compliant ("What brings you to Ecco?", "Which days should we clean?").
- **Ubicación:** about.html, services.html, janitorial.html, day-porter.html, why-ecco.html, careers.html, sustainability.html, testimonials.html, index.html, blog.html, blog/*.html (7 posts), privacy.html, terms.html, 404.html vs quote.html
- **Recomendación:** Pick one case convention (PRODUCT.md says sentence case) and normalize all .sec-ttl headings, blog h1s, and CTA labels; consolidate the 4 CTA wordings into one canonical label.

### Legacy quote pages have NO h1 and heading order starts at h3
- **Categoría:** a11y
- **Evidencia:** quote-janitorial.html and quote-dayporter.html: h1 count = 0. First headings in DOM are three h3.footer-heading ("Services","Company","Contact") inside a footer placed at the TOP of body with inline style="display:none" (quote-janitorial.html:65-82), followed by h2.step-q form questions injected by inline JS template literals (quote-janitorial.html:200-302, e.g. `<h2 class="step-q">What type of space do you need cleaned?</h2>`). DOM heading sequence: 3 3 3 3 2 2 2 …
- **Ubicación:** quote-janitorial.html, quote-dayporter.html
- **Recomendación:** Add a page h1 (visible or sr-only) and move the hidden footer below main content, or retire these legacy pages entirely in favor of quote.html.

### All italics on 24 marketing pages are browser-synthesized — no italic font axes loaded
- **Categoría:** typography
- **Evidencia:** Marketing Google Fonts URL loads Cormorant+Garamond:wght@400;500;600;700 and DM+Sans:opsz,wght@9..40,400..700 — zero ital axes — yet css/styles.css contains 22 `font-style:italic` declarations, including .hero h1 em (index hero h1 rotating word: italic + gradient text `linear-gradient(90deg,#8fd48c,#5ba8e6,#6bd568,#8fd48c)` + background-clip:text — gradient text also violates PRODUCT.md), .feat-test-quote (Cormorant 1.5rem italic testimonial pulls), .stage-q em, .preparing-title em, .success-title em, .transcript-bot-body em. Only quote.html loads true italics (DM Sans ital 400-600, Fraunces ital 400-500, quote.html:56). Dev file index-reference.html:16 loads `DM+Sans:ital,...;1,9..40,400&Cormorant+Garamond:ital,...;1,400;1,500` proving the intended spec included real italics and production drifted.
- **Ubicación:** All 24 pages loading the marketing fonts URL (index, about, services, janitorial, day-porter, why-ecco, testimonials, careers, sustainability, blog, blog/*7, accessibility, privacy, terms, sitemap, 404, quote-janitorial, quote-dayporter); css/styles.css
- **Recomendación:** Add ital axes to the shared Google Fonts URL (match index-reference.html), or remove font-style:italic usage; separately remove the gradient-text treatment on .hero h1 em per brand direction.

### ~240 em dashes in copy across all 25 public pages vs brand rule of none — quote.html is the only compliant page
- **Categoría:** content
- **Evidencia:** Raw — counts per page: day-porter 19 (one INSIDE the h1: "Real-time cleanliness that lasts all day — not just after hours."), index 18 (incl. h2.sec-ttl "From first call to spotless facility — in 3 simple steps."), services 16, quote-janitorial 16, blog/janitorial-vs-day-porter 15, quote-dayporter 13, about 12, janitorial 12, why-ecco 10, careers 10, blog/eco-certified 9, testimonials 8, sustainability 8, blog/5-signs 8, accessibility 7, blog/choose 7, blog.html 5, sitemap 5, privacy 3, terms 3, blog/benefits 3, blog/checklist 3, blog/dirty-office 3, blog/commercial 3, 404 2. Comment-stripped verification: index still 18, day-porter 19 (real copy). quote.html: 42 raw but only 4 after stripping HTML comments, ALL inside <script> JS comments (lines 41,58,62,116) — visible copy is clean. Every page additionally has 1 `&mdash;` entity in the footer ("New York City &mdash; All 5 Boroughs"); quote.html has 7 entities incl. the dead checkpoint placeholder `<p class="qf-checkpoint-list">&mdash;</p>` (quote.html:906).
- **Ubicación:** All public *.html and blog/*.html; counts above
- **Recomendación:** If the no-em-dash rule is site-wide brand direction, rewrite marketing/blog copy (commas, periods, colons); at minimum fix the day-porter h1 and index sec-ttl which put em dashes in top-level headings.

## [componentes]

### All 7 blog posts load the WHITE nav logo onto the light nav background (logo effectively invisible)
- **Categoría:** component
- **Evidencia:** blog/*.html nav: '<img src="../images/logo-horizontal-white.png"' in .nav-logo, while all 18 root pages use 'images/logo-horizontal.png'. .nav background in styles.css is 'background:rgba(250,251,252,.92)' (near-white, fixed, all pages — no transparent/dark variant for blog). The mobile menu header inside the same blog navs correctly uses the dark 'logo-horizontal.png', proving the white one is a copy-paste error, not a theme.
- **Ubicación:** all 7 files in /Users/alexmercedes/Downloads/Ecco Webside/blog/ (e.g. janitorial-vs-day-porter.html:41), selector .nav-logo img
- **Recomendación:** Swap to ../images/logo-horizontal.png in the 7 blog post navs.

### Schema.org PostalAddress malformed on index.html: street='Albany, NY', locality='New York', zip 12207
- **Categoría:** content
- **Evidencia:** index.html LocalBusiness schema: "streetAddress": "Albany, NY", "addressLocality": "New York", "postalCode": "12207" — an Albany string used as a street inside a New York City locality with Albany's ZIP. Canonical: 54 State St #804, Albany NY 12207. All 17 other pages with LocalBusiness schema (about, services, janitorial, day-porter, why-ecco, testimonials, careers, sustainability, blog + 7 posts, quote) omit street entirely: addressLocality:'New York' only. No schema block anywhere has a 'telephone' field.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/index.html (~line 42 JSON-LD); 17 more pages with addressLocality:'New York'
- **Recomendación:** Set street '54 State St #804', locality 'Albany', region NY, zip 12207 and add telephone '(929) 280-9374' to every LocalBusiness block (or centralize the block).

### why-ecco CTA banner uses two bare class="btn" buttons with no variant — render as unstyled transparent 'buttons'
- **Categoría:** component
- **Evidencia:** why-ecco.html:249-251: '<div style="margin-top:1.5rem;display:flex;gap:1rem;justify-content:center;flex-wrap:wrap"><a href="quote.html" class="btn">Request a Free Quote →</a><a href="mailto:..." class="btn">Email Us →</a>'. .btn base rule sets layout/padding only — no background or color; inside .cta-banner (animated navy gradient) these become text-colored pills with no fill or border, unlike every other page's .btn.btn-white. Also the only cta-banner whose actions wrapper is an inline-styled div.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/why-ecco.html:248-252
- **Recomendación:** Use class="btn btn-white" (+ btn-ol-white for secondary) and the shared .cta-banner-actions wrapper class.

### Floating quote CTA (index only) and cookie banner occupy the same bottom-right corner; CTA (z89) overlays banner (z60)
- **Categoría:** component
- **Evidencia:** styles.css: .cta-float{position:fixed;bottom:28px;right:28px;z-index:89} vs .cookie-banner{position:fixed;bottom:20px;right:20px;left:auto;max-width:520px;z-index:60}. cookie-consent.js shows banner 1s after load on every page without stored consent; main.js initFloatingQuoteReveal() shows .cta-float when .hero-actions leaves viewport, with no coordination between the two. On a first visit to index.html, scrolling past the hero puts the white quote pill on top of the banner's right side — where its Accept/Decline buttons sit (banner is justify-content:space-between with the button group on the right).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/index.html (.cta-float markup at end of body); css/styles.css .cta-float/.cookie-banner; js/main.js:394; js/cookie-consent.js:10-14
- **Recomendación:** Offset .cta-float upward while .cookie-banner.visible exists (body class hook), or delay the float until consent is answered.

### HubSpot tracking loads unconditionally on 24 pages but is consent-gated only on quote.html
- **Categoría:** component
- **Evidencia:** 24 pages (15 root + 7 blog + 404; not legacy quote pages) embed '<script id="hs-script-loader" async defer src="//js-na2.hs-scripts.com/245755967.js">' directly before </body>, executing before any consent. quote.html:1196-1205 instead gates injection on localStorage 'ecco_consent'==='accepted' ('HubSpot — gated by cookie consent'). cookie-consent.js only pushes ['doNotTrack'] AFTER a Decline click. quote-janitorial/quote-dayporter have no HubSpot at all (0 hits).
- **Ubicación:** all root + blog pages (e.g. about.html final script block) vs /Users/alexmercedes/Downloads/Ecco Webside/quote.html:1196; js/cookie-consent.js
- **Recomendación:** Adopt quote.html's consent-gated loader site-wide; one shared snippet.

### Primary-action label chaos: 10+ distinct labels for the same quote.html link
- **Categoría:** component
- **Evidencia:** Census of <a href*="quote"> labels across public pages: 'Request a Quote' ×27 (footer Contact col), 'Get a Free Quote' ×27 (nav .nl.nc), 'Get Your Free Proposal →' ×32 (footer-cta-btn &rarr; 26 + hero/banner → 6), 'Request a Free Quote →' ×12, 'Request a Quote →' ×7, 'Get a Quote →' ×2, 'Get a Free Quote →' ×2, plus one-offs: 'Free Quote' (cta-float), 'Request a Janitorial Quote →', 'Request a Day Porter Quote →', 'Request a Free Quote' (404, no arrow), 'Build Your Custom Package →', 'Request a Free Walkthrough →', 'Start your free quote · 24-hour turnaround' (chat widget CTA bar in js/chat-widget.js:216). A single page (any root page) simultaneously shows 3 different labels: nav 'Get a Free Quote', footer banner 'Get Your Free Proposal →', footer column 'Request a Quote'.
- **Ubicación:** all 25 public pages; js/chat-widget.js:216
- **Recomendación:** Pick one canonical label (+ at most one short variant for tight spaces) and apply everywhere.

### Three quote-form systems are publicly deployed simultaneously with divergent chrome
- **Categoría:** component
- **Evidencia:** (1) quote.html — System B qf2: nav+footer present but `hidden` (nav via 'body:has(main.q-flow) .nav…display:none' comment at :1199ff), qf2-flowbar headers, 0 inline styles, chat widget removed (D125), consent-gated HubSpot. (2) quote-janitorial.html / quote-dayporter.html — legacy wizard (step-q/fg/opt/sr classes in styles.css), FULL standard nav shown, footer hidden via inline style="display:none" (:65), chat-widget.js still loaded (:102), no HubSpot, no .btt, and a page-level token override '<style>:root{--r:10px;--rl:16px}</style>' (:22) that changes corner radii of every shared component on those pages (System A tokens are --r:12px/--rl:18px). (3) quote.backup.html (old qf- checkpoint system) also deployed. sitemap.html 'Quote pages' nav section links to the legacy pages.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/quote.html, quote-janitorial.html:22,65,102, quote-dayporter.html:22,65,102, quote.backup.html, sitemap.html:113
- **Recomendación:** Retire/redirect legacy quote pages and quote.backup.html, or align their chrome (footer hiding mechanism, radius tokens, chat policy) with quote.html.

## [espaciado]

### Dead + inverted mobile section padding cascade on .sec family (16 pages)
- **Categoría:** spacing
- **Evidencia:** Cascade order in css/styles.css (minified; line refs from }-split expansion): base `.sec{padding:6rem 3.5rem}`; `@media(max-width:1024px){.problem-sec,.sec,.service-detail-section{padding-left:2rem;padding-right:2rem}}` (line 454); `@media(max-width:900px){...{padding:3.5rem 1.5rem}}` (line 511, block opens line 466); `@media(max-width:480px){...{padding:2.5rem 1rem}}` (line 553); `@media(max-width:600px){...{padding:4rem 1.5rem}}` (line 1045). All rules are unlayered and equal specificity, so the later 600px rule overrides the 480px rule at every viewport <=480px: the intended `2.5rem 1rem` NEVER applies (dead rule), and vertical padding INCREASES from 3.5rem (601-900px) to 4rem (<=600px) as the screen shrinks.
- **Ubicación:** css/styles.css selectors `.sec`,`.problem-sec`,`.service-detail-section`; used on 16 pages: index, about, services, janitorial, day-porter, why-ecco, testimonials, careers, sustainability, blog, accessibility, privacy, terms, sitemap (+ dev artifacts font-specimen.html, index-reference.html)
- **Recomendación:** Reorder/merge the 600px and 480px blocks (or scope with min-width) so the ladder is monotonic: 6rem -> 3.5rem -> ~2.5rem; ideally replace with 2-3 spacing tokens (--sec-pad-y desktop/tablet/mobile).

### No vertical rhythm scale: 6 distinct desktop section paddings + an inline 7th
- **Categoría:** spacing
- **Evidencia:** Desktop section padding census in styles.css: 7rem(.sec-navy), 6rem(.sec,.service-detail-section,.story-sec,.text-sec,.eco-sec,.what-sec,.form-sec), 5rem(.cta-banner,.featured-story,.testimonials-grid-sec,.message-sec), 4.5rem(.problem-sec), 4rem(.client-cta,.article-content,.svc-inner), 3rem(.stats-bar). No spacing tokens exist (only --r/--rl/--mw in :root). sustainability.html line 208 adds an inline 7th rhythm: `<section class="sec sec-cream" style="padding:4rem 3.5rem">` overriding .sec's 6rem. quote.html's System B uses a fixed-stage app layout instead: `.qf-screen{padding:1rem clamp(20px,4vw,40px)}` inside `.qf-stage{position:fixed;inset:calc(72px + env(safe-area-inset-top,0px)) 0 ...}`.
- **Ubicación:** css/styles.css section classes (all marketing pages); sustainability.html:208; css/quote-flow.source.css:142-172 (.qf-stage/.qf-screen)
- **Recomendación:** Define a 3-step section-padding scale as tokens and map the 6 ad-hoc values onto it; delete the sustainability.html inline override.

### Container width sprawl: ~27 distinct content widths in styles.css, ~20 in quote-flow vs DESIGN.md's documented 760/920
- **Categoría:** structure
- **Evidencia:** styles.css max-width census (>=420px content containers): var(--mw)=1200px x14 selectors (.footer-grid,.blog-grid,.trust-strip,...), 1100 x6, 1080 x3, 1000 x4, 960 x6 (.val-grid,.testimonials-grid,.promise-grid,.pain-grid,.feature-grid,.feat-grid), 900 x9 (.wiz-card,.test-grid,.leadership-grid,...), 880(.stage-question), 860(.legal-content), 800 x5, 780 x2, 760 x3 (.what-inner,.eco-inner,.service-detail-head), 720 x5 (.article-content,.guarantee,...), 700 x4, 680 x6, plus 660/650/640/620/600/580/560/520 — 82 distinct max-width strings file-wide. quote-flow.source.css adds: .qf-screen-inner base 1180px (line 260, undocumented), 880px x8 step screens (lines 1632-2827), 920px x5 (qf2 grids/summary, documented), 940/960/1000/1040/1060/1080!important/1200!important/1280!important/1320!important/860!/840!/820/760/720/640. DESIGN.md lines 117-120 document ONLY `.qf2-prompt:760px`, `.qf2-grid-3/-6:920px`, `.qf2-summary:920px`. The review step jumps 920 -> 1280/1320: `main.q-flow .qf-screen.step-contact .qf-plan-wrap,...{max-width:1280px!important}` + `@media(min-width:1200px){...{max-width:1320px!important}}` (source lines 7711-7721).
- **Ubicación:** css/styles.css (all pages); css/quote-flow.source.css:260,1632-2827,7711-7721,8072,9792 (quote.html only); DESIGN.md:117-120
- **Recomendación:** Collapse to 3-4 width tokens per system (e.g. 1200/960/720 for marketing; 760/920 + one wide-review width for quote) and update DESIGN.md to match reality or vice versa.

### Breakpoint chaos: 19 distinct widths in quote-flow vs DESIGN.md's documented single 700px; conflicting off-by-one conventions across systems
- **Categoría:** structure
- **Evidencia:** styles.css @media widths (8): max-width 1100,1024,900,768,600,560,480,390 + min-width 901,769. Shipped quote-flow.css widths (19 distinct numbers): max-width 1080,900,820,767,720,700(x14),640(x14),560(x33),540,520(x5),480,440(x4),420,380 + min-width 1200,1024(x20),820(x5),768(x11),701,640,600. DESIGN.md line 115 states: 'Breakpoints: single transition at max-width:700px. No tablet tier.' Convention clash: styles.css pairs 768max/769min while quote-flow pairs 767max/768min, and quote-flow uses both 700max and 701min alongside 720max — three near-identical cut points (700/701/720) in one file. Both systems cascade on quote.html.
- **Ubicación:** css/styles.css (13 media blocks); css/quote-flow.css / quote-flow.source.css (~150 media blocks); DESIGN.md:115
- **Recomendación:** Pick one breakpoint set (e.g. 480/700/900/1024) and one convention (max-width:N / min-width:N+1); update DESIGN.md which is currently false.

### Elevation has no working system: 179 distinct hard-coded shadow recipes site-wide bypass the 8 defined tokens
- **Categoría:** component
- **Evidencia:** styles.css defines --shsm:0 2px 8px rgba(11,29,56,.06), --shmd:0 4px 20px rgba(11,29,56,.08), --shlg:0 8px 32px rgba(11,29,56,.12), --shxl:0 20px 60px rgba(11,29,56,.16), --sh-hover. Of 119 box-shadow declarations only 30 use tokens (shmd x14, shlg x9, shsm x3, shxl x2, sh-hover x2); 86 are hard-coded with 77 DISTINCT recipes, including exact duplicates of tokens: `box-shadow:0 2px 8px rgba(11,29,56,.06)` x2 (== --shsm) and `0 4px 20px rgba(11,29,56,.08)` x1 (== --shmd). quote-flow.source.css defines --qf-shadow-sm/-md/-sage (lines near :root) but uses tokens in only 2 of 121 declarations (--qf-shadow-sm is defined and NEVER used); 102 distinct hard-coded recipes, e.g. five different sage glows within one file: `0 8px 20px -4px rgba(45,122,50,.4)`, `0 8px 28px rgba(45,122,50,.25)`, `0 8px 24px rgba(45,122,50,.25)`, `0 6px 14px -4px rgba(45,122,50,.35)`, `0 4px 10px rgba(45,122,50,.28)`.
- **Ubicación:** css/styles.css :root tokens + ~86 hard-coded decls (all pages); css/quote-flow.source.css ~119 hard-coded decls (quote.html)
- **Recomendación:** Normalize to the 4 existing System A tokens + 1-2 sage variants; delete unused --qf-shadow-sm or adopt it; treat any new literal box-shadow as lint failure.

### 167 inline style attributes across 25 public pages despite hard project rule 'zero inline styles'
- **Categoría:** anti-pattern
- **Evidencia:** Counts of `style="` per page: quote-dayporter.html 33 (24 static + JS-injected templates), quote-janitorial.html 31 (22 static), index.html 16 (15 background-image URLs on hero/industry cards + 1 display:none), janitorial.html 14, day-porter.html 13 (incl. 5x duplicate `style="margin-top:1.2rem"`), testimonials.html 8 (6 hard-coded avatar gradients), why-ecco.html 5, sustainability.html 5 (incl. full section override `style="padding:4rem 3.5rem"` line 208), about.html 4, careers/blog/each-of-7-blog-posts 3 (all 7 posts repeat identical `style="margin-bottom:2.5rem;border-radius:var(--rl);overflow:hidden"` figure wrapper = missing utility class), services/accessibility/privacy/terms/sitemap 2, 404 1, quote.html 0. Worst single case: quote-dayporter.html line 717 JS error template renders fully inline-styled buttons: `style="display:inline-block;margin-top:1rem;padding:.8rem 2rem;background:var(--green);color:#fff;border-radius:8px;..."` — note off-system 8px radius vs --r:12px. Dev artifacts also deployed: emailjs-template.html 32, color-swatches.html 22, quote.backup.html 14, index-reference.html 12, font-specimen.html 9.
- **Ubicación:** All public HTML; worst: quote-dayporter.html:678,717, quote-janitorial.html, sustainability.html:208, day-porter.html, blog/*.html (7 files)
- **Recomendación:** Extract repeated patterns to classes (blog figure wrapper, day-porter margin-top, legacy-quote buttons); move bg-image URLs to data attributes + CSS or keep as the single sanctioned exception, documented.

## [darkmode]

### DESIGN.md dark-mode spec contradicts shipped implementation on every mechanism (doc frozen at D126, code is at D128/D129)
- **Categoría:** dark-mode
- **Evidencia:** DESIGN.md line 9: "Light by default + opt-in dark variant"; line 14: "The dark variant is NOT auto-applied via prefers-color-scheme — the user toggles it explicitly via .qf2-theme-toggle (sun/moon button bottom-right). Choice persists in localStorage as ecco_theme... lives under [data-theme=\"dark\"] selector"; line 50: "Activated via [data-theme=\"dark\"] on <html>". Actual worktree: 0 occurrences of .qf2-theme-toggle in any HTML/CSS/JS; 0 [data-theme] selectors in css (only a comment at quote-flow.source.css:13111); dark IS auto-applied via 3 live @media (prefers-color-scheme: dark) blocks (quote-flow.source.css:13138, 13178, 13377); quote.html:10-12 comment: "D128 — Theme auto via OS prefers-color-scheme. Bootstrap script removed"; js/quote-flow.js:4766-4770 comment: "Theme toggle handler removed." Commits: f055f95 (D126 opt-in) superseded by 0f573ea (D128 auto) + ee3ff48 (D129). DESIGN.md is unmodified in git status. Also stale within DESIGN.md: line 67 claims dark active-state is "Marfil on sage 4.1:1" but code uses #0F1A20 ink on sage (source:13192-13197) for 6.8:1.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/DESIGN.md lines 9, 14, 48-50, 67; /Users/alexmercedes/Downloads/Ecco Webside/css/quote-flow.source.css:13108-13141; /Users/alexmercedes/Downloads/Ecco Webside/quote.html:10-12; /Users/alexmercedes/Downloads/Ecco Webside/js/quote-flow.js:4766-4770
- **Recomendación:** Rewrite DESIGN.md 'Visual theme' + 'Dark variant' sections to describe the D128 auto-via-OS architecture (3-part @layer cascade strategy, prefers-color-scheme trigger, no toggle), or restore the toggle if the documented 'no surprise theme swaps' brand rule is still policy. Doc and code cannot both be right.

### Auto dark mode has no user override — directly violates the project's own documented 'Adult brand voice: no surprise theme swaps' rule
- **Categoría:** dark-mode
- **Evidencia:** D128 removed (not augmented) the manual toggle: dark now applies solely from @media (prefers-color-scheme: dark) (quote-flow.source.css:13138). There is no toggle element, no JS theme code (grep ecco_theme|data-theme in js/quote-flow.js = 1 hit, a comment at line 4769), no query-param or storage override. An OS-dark user who wants the light editorial form (DESIGN.md's primary art-directed scene) cannot get it, and D126-era users who explicitly chose light have their stored ecco_theme choice silently ignored. DESIGN.md line 14 explains the opt-in design existed precisely to 'honor the Adult brand voice (no surprise theme swaps)'.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/css/quote-flow.source.css:13138; /Users/alexmercedes/Downloads/Ecco Webside/js/quote-flow.js:4766-4770; /Users/alexmercedes/Downloads/Ecco Webside/quote.html:216-217
- **Recomendación:** Reinstate a toggle as an override layered on the prefers-color-scheme default (auto / light / dark tri-state persisted in ecco_theme via [data-theme] attribute), or formally retire the 'no surprise swaps' rule in DESIGN.md/PRODUCT.md.

### Dark-mode cookie 'Accept' button fails WCAG AA: white text on sage #6FB376 = 2.5:1 (hover 2.0:1)
- **Categoría:** a11y
- **Evidencia:** Live dark block rule (quote-flow.source.css:13360-13368, present in minified as .cookie-btn-accept{background:var(--qf2-sage,#6fb376);border-color:var(--qf2-sage,#6fb376);color:#fff}): banner is body-appended outside .qf2-stage so var() resolves to fallback #6FB376; #FFFFFF on #6FB376 = 2.50:1, hover #82C589 = 2.04:1 — both fail AA 4.5:1 for .8rem/600 button text (styles.css .cookie-btn{font-size:.8rem;font-weight:600}). The form's own dark convention uses #0F1A20 ink on the same sage for 6.8:1 (source:13192-13197, 13398-13399). Light mode is unaffected (styles.css .cookie-btn-accept #1F5B26 + #fff = 8.1:1), so this is a D128-introduced dark-only regression.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/css/quote-flow.source.css:13354-13368 (selector .cookie-btn-accept inside @media (prefers-color-scheme: dark)); applies on quote.html only
- **Recomendación:** Change dark cookie accept to color:#0F1A20 on sage (matches form chips, ~6.8:1), or keep white text on a darker green (e.g. #2D7A32 = light-mode sage, 5.3:1).

### Theme whiplash: /quote auto-darkens to Editorial Midnight while all 24+ marketing pages have zero dark support
- **Categoría:** dark-mode
- **Evidencia:** css/styles.css: 0 occurrences of prefers-color-scheme, 0 data-theme, 0 color-scheme property (verified by grep). Repo-wide grep of *.html/*.js finds prefers-color-scheme only in quote.html (comments) and js/quote-flow.js (comments) besides quote-flow CSS. An OS-dark visitor sees: index.html #FAFBFC light → quote.html #1B2733 midnight (body painted by source:13142) → any nav/footer/privacy link back to a bright light page. quote.html additionally flips :root{color-scheme:dark} (source:13140) so scrollbars/form controls/UA chrome go dark on /quote only. Legacy funnel pages quote-janitorial.html/quote-dayporter.html are also light-only (load styles.css only; 301→/quote via _redirects).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/css/styles.css (whole file); /Users/alexmercedes/Downloads/Ecco Webside/css/quote-flow.source.css:13138-13172; all public pages
- **Recomendación:** Decide site-level theming policy: either give System A a coordinated dark token set (large effort), or scope quote's dark to an explicit user opt-in so the cross-page experience stays coherent. Document the decision in DESIGN.md.

### quote.html LocalBusiness schema omits street address and telephone, uses addressLocality 'New York' instead of canonical Albany legal address
- **Categoría:** content
- **Evidencia:** quote.html:60 JSON-LD: "address":{"@type":"PostalAddress","addressLocality":"New York","addressRegion":"NY","addressCountry":"US"} — no streetAddress, no postalCode, no telephone property at all. Canonical identity: Ecco Facilities LLC, 54 State St #804, Albany NY 12207, (929) 280-9374. (Cross-cutting catch while auditing this page's head; other pages' schema blocks are outside my area.)
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/quote.html:60
- **Recomendación:** Set streetAddress '54 State St #804', addressLocality 'Albany', postalCode '12207', telephone '+19292809374' (keep areaServed NYC boroughs for service area).

## [pag-index]

### og:image / twitter:image / schema image point to a file that does not exist (images/logo-vertical.png)
- **Categoría:** seo
- **Evidencia:** 3 references: <meta property="og:image" content="https://eccofacilities.com/images/logo-vertical.png"> (line 19), twitter:image (line 24), LocalBusiness "image" (line 43). images/ contains only logo-horizontal.png, logo-horizontal-white.png, logo-footer.png, favicon-16/32.png — no logo-vertical.png. Every social share of the homepage renders with a broken/blank image.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/index.html lines 19, 24, 43; /Users/alexmercedes/Downloads/Ecco Webside/images/
- **Recomendación:** Point all three to an existing asset (ideally a 1200x630 og card, not a logo) or add logo-vertical.png.

### LocalBusiness schema address malformed and telephone missing entirely
- **Categoría:** seo
- **Evidencia:** "streetAddress": "Albany, NY" (a city/state string, not a street), "addressLocality": "New York" (should be Albany), "postalCode": "12207" (Albany ZIP paired with NYC locality), geo 40.7128/-74.0060 (NYC coords contradicting the 12207 ZIP). No "telephone" property anywhere. Canonical: 54 State St #804, Albany NY 12207, (929) 280-9374.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/index.html lines 52-64 (LocalBusiness JSON-LD)
- **Recomendación:** Set streetAddress "54 State St #804", addressLocality "Albany", add "telephone": "(929) 280-9374", and align geo with the registered address or remove geo.

### Phone number absent from the entire homepage; main.js phone tracker is dead code here
- **Categoría:** content
- **Evidencia:** grep for 'tel:' and 'telephone' in index.html returns 0 matches. Nav contact block (line 143) and footer Contact column (line 526) offer only info@eccofacilities.com. js/main.js lines 22-24 registers a tel: click tracker that can never fire. Canonical identity includes phone (929) 280-9374.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/index.html lines 143, 526; /Users/alexmercedes/Downloads/Ecco Webside/js/main.js lines 22-24
- **Recomendación:** Add a tel: link in the footer Contact column and nav contact block, or confirm phone-less contact is intentional and remove the dead tracker.

### Orphaned FAQPage JSON-LD — visible FAQ section was deleted, schema left behind plus 24 blank lines
- **Categoría:** seo
- **Evidencia:** FAQPage schema with 6 Q&As (lines 90-103) but zero FAQ markup in the body (grep -i faq matches only the schema line). Commit 882e037 "feat: replace FAQ with interactive Promise Pillars" removed the accordion; lines 470-493 are 24 consecutive empty lines where it sat. main.js still carries the .faq-q handler. Google requires FAQ content to be visible on the page — rich-result spam risk.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/index.html lines 90-103 and 470-493; /Users/alexmercedes/Downloads/Ecco Webside/js/main.js (.faq-q handler in line 3)
- **Recomendación:** Delete the FAQPage block (or re-add visible FAQ content matching it); remove the blank-line gap.

### Cookie banner and floating quote CTA occupy the same bottom-right corner; CTA (z89) paints over the banner's Accept/Decline buttons (z60)
- **Categoría:** component
- **Evidencia:** .cookie-banner{position:fixed;bottom:20px;right:20px;max-width:520px;z-index:60} vs .cta-float{position:fixed;bottom:28px;right:28px;z-index:89}. Banner buttons sit at its right edge, exactly under the pill once .cta-float.visible fires (hero-actions out of viewport). Mobile: banner spans left:12px/right:12px/bottom:12px with flex-wrap full-width buttons; .cta-float{bottom:16px;right:16px} overlaps them; Alina chat toggle (bottom:28px;left:28px;z-index:999) covers the banner's left edge too.
- **Ubicación:** css/styles.css (.cookie-banner, .cta-float, .cta-float.visible); js/cookie-consent.js lines 10-14; js/chat-widget.js line 86; index.html lines 551-556
- **Recomendación:** Raise the banner z-index above floating CTAs or offset .cta-float while the banner is open (body class).

### GPC and quick-decline users are still tracked by HubSpot — doNotTrack push is racy and lost
- **Categoría:** js
- **Evidencia:** cookie-consent.js: GPC branch runs at parse time and does `if(window._hsq)window._hsq.push(['doNotTrack'])` — but the HubSpot loader (index.html line 559, async) has not executed yet, so _hsq is undefined and the opt-out is silently skipped while HubSpot still loads and tracks. Same race in declineCookies() if user declines before HubSpot initializes. Comment claims "CCPA 2026: Respect Global Privacy Control". Also injects inline style (style="display:flex;gap:.5rem") and inline onclick handlers, violating the zero-inline-style convention.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/js/cookie-consent.js lines 2-8, 12, 25-32; index.html line 559
- **Recomendación:** Queue the opt-out (window._hsq = window._hsq || [] before pushing) or gate the HubSpot loader on consent state instead of loading it unconditionally.

### Service tabs: conflicting double click-handler applies aria-selected/tabindex=-1 to plain buttons, removing the inactive tab from keyboard reach
- **Categoría:** a11y
- **Evidencia:** main.js has two .svc-tab handlers: lines 81-94 (legacy: reads tab.dataset.panel — undefined on this page since buttons only carry data-svc — and sets aria-selected + tabindex on buttons lacking role="tab"/tablist/tabpanel) and lines 203-230 (current data-svc version). After first activation the other tab gets tabindex="-1", so Tab-key users cannot reach it; arrow-key nav exists (lines 97-109) but is undiscoverable without tab roles. aria-selected is invalid on role-less <button>.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/js/main.js lines 81-109 and 203-230; index.html lines 200-203 (.svc-tabs)
- **Recomendación:** Delete the legacy dataset.panel handler; either add full role=tablist/tab/tabpanel semantics or drop aria-selected/tabindex manipulation.

### Viewport meta blocks pinch-zoom (maximum-scale=1.0) — WCAG 1.4.4 failure
- **Categoría:** a11y
- **Evidencia:** <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"> (line 9). Prevents user scaling on mobile browsers that honor it.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/index.html line 9
- **Recomendación:** Remove maximum-scale=1.0.

### Google-review claims likely unverifiable; sameAs g.co/kgs/eccofacilities looks fabricated
- **Categoría:** content
- **Evidencia:** Trust bar (lines 249-256): "5.0 Rated" + "200+ businesses" + "Google Reviews" reads as 200+ five-star Google reviews. sameAs includes "https://g.co/kgs/eccofacilities" (lines 86, also nav line 142 and footer line 521) — g.co/kgs short links are auto-generated random tokens; a custom readable slug cannot be created, so this URL is almost certainly a placeholder that 404s. Three named testimonials with companies (David Chen / Meridian Capital Group; Marcus Williams / Peak Performance Gym Brooklyn; Dr. Patricia Morales / East Side Family Health) presented under a "Google Reviews" rating bar.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/index.html lines 86, 142, 249-281, 521
- **Recomendación:** Replace with the real Google Business Profile URL; soften the rating bar to provable claims; verify testimonial permissions.

## [pag-services]

### Desktop side-by-side service comparison layout is dead — unscoped !important rule from index's svc-showcase kills the grid
- **Categoría:** component
- **Evidencia:** css/styles.css contains an unscoped rule `.svc-panels{position:relative;min-height:240px;display:block!important}` (char ~18455) physically sitting INSIDE the `.svc-showcase` rule cluster (immediately after `.svc-showcase .svc-panel.active{...}` and before another `.svc-showcase` rule — it lost its `.svc-showcase` scope prefix). Because of !important it permanently defeats the later services-page rule `.svc-panels{display:grid;grid-template-columns:1fr 1fr;gap:3rem}` (char ~29835). Meanwhile `.svc-tabs{display:none}` at top level with `display:flex` only inside `@media (max-width:900px)`. Net result on >900px: tabs hidden AND grid dead, so both panels render as stacked full-width blocks with no gap. Section sub-copy explicitly promises "compare them side by side, or combine both for 24/7 coverage". index.html uses the same bare classnames (`class="svc-panels"`, `class="svc-tabs"`) inside `.svc-showcase`, confirming two components share one classname namespace. Mobile (≤900px) behavior is correct: tabs show, `.svc-panel{display:none}`/`.svc-panel.active{display:block}`, js/main.js handles click + ArrowLeft/ArrowRight.
- **Ubicación:** services.html lines 82-177 (section #services, heading "Two Services. One Uncompromising Standard."); css/styles.css selectors .svc-panels (2 conflicting rules), .svc-tabs, .svc-showcase cluster; index.html .svc-showcase
- **Recomendación:** Re-scope the block!important rule to `.svc-showcase .svc-panels` (it belongs to index's tab-switcher) and remove the !important; verify services.html then gets the 2-column grid on desktop and index.html's showcase still stacks. This is the textbook two-design-systems collision: same classnames, two components, !important used to patch one page broke the other.

### ?service= deep-link param is consumed by nothing — service preselection silently dropped on quote handoff
- **Categoría:** js
- **Evidencia:** services.html line 129: `<a href="quote.html?service=janitorial" class="btn btn-primary service-cta">Request a Janitorial Quote →</a>`; line 173: `quote.html?service=dayporter`. _redirects also 301s /quote-janitorial(.html) and /quote-dayporter(.html) to `quote.html?service=...`. quote.html loads js/quote-flow.js?v=38.0 (defer) whose `prefillFromUrl()` reads exactly these params via `params.get()`: firstName, lastName, email, phone, company, address, space, size, freq, urgency — there is NO `params.get('service')` anywhere in quote-flow.js, quote.html, or main.js (verified by exhaustive grep; `STATE.service` is only assigned from in-flow user picks: `STATE.service = pickedService`).
- **Ubicación:** services.html lines 129, 173; js/quote-flow.js prefillFromUrl(); _redirects lines for /quote-janitorial and /quote-dayporter
- **Recomendación:** Either add `service` handling to prefillFromUrl/STATE (mapping 'janitorial'/'dayporter' to the flow's service step and skipping or pre-answering it), or strip the params from CTAs and redirects. Currently users who explicitly clicked "Request a Janitorial Quote" are re-asked which service they want — the CTA intent and the legacy-URL redirect intent are both lost.

### Testimonial attributions contradict other pages — same people, different names/companies/roles
- **Categoría:** content
- **Evidencia:** Section "Why Clients Choose Ecco": (1) services.html line 226 "David Chen — Operations Director, Meridian Financial Group" vs "Meridian Capital Group" on index.html, janitorial.html, why-ecco.html, testimonials.html (4 pages agree, services alone differs). (2) services.html lines 230-231 "Dr. Ana Morales — Clinic Director, Midtown Wellness Center" vs "Dr. Patricia Morales — Practice Owner, East Side Family Health" on index.html, testimonials.html, sustainability.html (different first name, role AND company for the healthcare testimonial). (3) services.html lines 235-236 "Marcus Williams — Owner, Iron District Fitness" matches testimonials.html, but index.html says "Marcus Williams — Owner, Peak Performance Gym Brooklyn" (same person, two gyms). The gym quote text on services is also a truncated/extended variant of testimonials.html's version (adds "Our members have noticed the difference.").
- **Ubicación:** services.html lines 222-238 (trust-strip); cross-refs: index.html, testimonials.html, janitorial.html, why-ecco.html, sustainability.html
- **Recomendación:** Establish one canonical attribution per testimonial (name, role, company, quote text) and sync all pages. If these are invented personas, the cross-page contradictions make that obvious to any prospect reading two pages — and fabricated client testimonials carry FTC endorsement-rule exposure (potential P0 legal if unverifiable).

### og:image / twitter:image point to a file that does not exist (logo-vertical.png)
- **Categoría:** seo
- **Evidencia:** services.html line 19 `og:image` and line 24 `twitter:image` = `https://eccofacilities.com/images/logo-vertical.png`. `ls images/logo-vertical.png` → No such file or directory. The images/ dir has logo-horizontal.png, logo-horizontal-white.png, logo-footer.png only. Site-wide: 24 HTML files reference logo-vertical.png (2× on most pages, 3× index.html, 4× each of the 7 blog posts). Every social share/link-unfurl of these pages renders a broken or missing image.
- **Ubicación:** services.html lines 19, 24; same defect in 23 other HTML files incl. index.html, janitorial.html, day-porter.html, quote.html, all blog/*.html
- **Recomendación:** Point og:image/twitter:image at an existing asset (ideally a 1200×630 social card, not a logo) or restore images/logo-vertical.png. summary_large_image twitter card with a logo would look poor even when fixed — generate a real OG card.

### Schema.org LocalBusiness block is incomplete/stale vs canonical identity: no telephone, no street address, no sameAs
- **Categoría:** seo
- **Evidencia:** services.html line 31 full block: `{"@type":"LocalBusiness","name":"Ecco Facilities LLC","image":"https://eccofacilities.com/images/logo-horizontal.png","email":"info@eccofacilities.com","address":{"@type":"PostalAddress","addressLocality":"New York","addressRegion":"NY","addressCountry":"US"},...}`. Missing: `telephone` (canonical (929) 280-9374 — zero occurrences of any phone on the page), `streetAddress`/`postalCode` (canonical 54 State St #804, Albany NY 12207), `sameAs` (LinkedIn/Instagram/Google links exist in footer but not schema). `addressLocality:"New York"` conflicts with the canonical Albany legal address. Verified identical pattern (addressLocality "New York", no telephone, no streetAddress) on janitorial, day-porter, about, why-ecco, testimonials, sustainability, quote, and careers (4 schema blocks); index.html's schema has no PostalAddress fields at all. Note schema image uses logo-horizontal.png while og:image uses (missing) logo-vertical.png — two different logo refs in one head.
- **Ubicación:** services.html line 31 (application/ld+json); cross-page: all main pages
- **Recomendación:** Define one canonical LocalBusiness JSON-LD (decide: Albany legal address vs NYC service-area model using areaServed + telephone (929) 280-9374 + sameAs array) and stamp it into every page from a single source. Google requires a complete address for LocalBusiness rich results; the current block earns nothing.

## [pag-service-detail]

### og:image and twitter:image point to images/logo-vertical.png which does not exist
- **Categoría:** seo
- **Evidencia:** ls confirms 'images/logo-vertical.png: No such file or directory'. Both pages declare it twice: <meta property="og:image" content="https://eccofacilities.com/images/logo-vertical.png"> and <meta name="twitter:image" ...> with twitter:card summary_large_image. Every social/chat share of these service pages renders with a broken image. Sitewide: 23 HTML files reference logo-vertical.png (all main pages + all 7 blog posts + quote.html).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/janitorial.html lines 19, 24; /Users/alexmercedes/Downloads/Ecco Webside/day-porter.html lines 19, 24; 23 files total per grep -l
- **Recomendación:** Add a real 1200x630 og image (logo-vertical.png or a dedicated social card) and reference it sitewide; a vertical logo is the wrong aspect for summary_large_image anyway.

### Primary conversion CTAs pass ?service= parameter that quote-flow.js never reads — deep link silently does nothing
- **Categoría:** js
- **Evidencia:** janitorial.html links quote.html?service=janitorial at lines 64 (hero 'Request a Janitorial Quote →') and 233 (bottom CTA); day-porter.html links quote.html?service=dayporter at lines 64 and 204. js/quote-flow.js prefillFromUrl (lines 4935-4965) reads only firstName, lastName, email, phone, company, address, space, size, freq, urgency — there is no params.get('service') anywhere in the file, and quote.html contains no URLSearchParams handling. Users clicking 'Request a Day Porter Quote' land on the generic service-selection step with nothing preselected.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/janitorial.html:64,233; /Users/alexmercedes/Downloads/Ecco Webside/day-porter.html:64,204; /Users/alexmercedes/Downloads/Ecco Webside/js/quote-flow.js:4935-4965
- **Recomendación:** Have prefillFromUrl read params.get('service'), validate against {janitorial,dayporter,both}, and preselect/advance the service step (mirroring STATE.service handling at quote-flow.js:1389).

### Sibling service pages are two forked templates: 10 parallel component families and 2 different section-background mechanisms for identical slots
- **Categoría:** structure
- **Evidencia:** Structural diff, slot by slot — (1) intro: janitorial .text-sec>.text-inner vs day-porter .what-sec>.what-inner (both families exist in CSS); (2) feature trio: .feature-grid/.feature-card/.feature-ico with EMOJI icons (📅👥✅) vs .feat-grid/.feat-card/.feat-ico with inline SVG; (3) checklist: .included-grid/.included-item/.included-check (✓ in green circle) vs .what-handles/.handle-item/.handle-ico (SVG); (4) industries: .space-card + emoji .space-card-ico + .space-card-desc 2-line cards vs .space-item + SVG .space-ico label-only (same .spaces-grid wrapper, heading 'Industries We Serve' vs 'Spaces We Serve'); (5) comparison: .diff-callout single h3 callout vs full .comp-grid/.comp-list two-column section with h2; (6) eco: .eco-content + h2 + .eco-link vs .eco-inner + h3 + .eco-badge; (7) testimonial: .test-single + .test-stars + no heading vs .test-grid + sec-lbl-l/sec-ttl-l heading + no stars; (8) cross-sell: .consider-grid/.consider-card/.consider-link vs .also-grid/.also-card/.also-ico; (9) section backgrounds: janitorial inline style="background:var(--cream)" x4 + style="background:var(--wh)" x2 while day-porter uses existing .sec-cream x4/.sec-white x2 classes; (10) section headers: janitorial uses .sec-lbl eyebrow on 5 sections, day-porter uses .sec-sub paragraphs (only 2 sec-lbl). Also: janitorial cta-banner has .rv, day-porter's doesn't; janitorial h1 uses <em>, day-porter doesn't; janitorial title has '| NYC Cleaning Services' suffix, day-porter doesn't; janitorial test section animates whole <section class="test-sec rv">, day-porter animates inner div.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/janitorial.html lines 70-234 vs /Users/alexmercedes/Downloads/Ecco Webside/day-porter.html lines 70-205
- **Recomendación:** Pick one component family per slot (day-porter's SVG + utility-class variant is the cleaner baseline), migrate the sibling page to it, then purge the losing family from styles.css with a cross-page grep first (per the CSS purge-trap lesson).

### 27 inline style attributes across the two pages — project rule is ZERO; janitorial's 6 inline section backgrounds duplicate utility classes that already exist
- **Categoría:** component
- **Evidencia:** janitorial.html: 14 style=" occurrences (L35 GTM noscript, L56 hero-img background-image, L72 h2 'text-align:center;margin-bottom:1.5rem', L74 'max-width:800px;margin:2rem auto;border-radius:var(--rl);overflow:hidden', L75 img 'height:300px;width:100%;object-fit:cover', L80/120/184/213 'background:var(--cream)', L104/166 'background:var(--wh)', L82 'margin-bottom:3rem;text-align:center', L205 'text-align:left', L233 'position:relative;z-index:2;margin-top:1.5rem'). day-porter.html: 13 (L35 noscript, L56 hero-img, L73 'margin-top:1.5rem', L74/75 image wrapper+img, L81/90/104/136/183 sec-sub 'margin-top:1.2rem' x5, L137 'margin-top:3rem', L170 'margin-bottom:3rem', L204 cta z-index patch). .sec-cream/.sec-white exist in styles.css yet janitorial inlines the same backgrounds. Both pages patch cta-banner stacking inline ('position:relative;z-index:2').
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/janitorial.html (14 occurrences, lines listed); /Users/alexmercedes/Downloads/Ecco Webside/day-porter.html (13 occurrences, lines listed)
- **Recomendación:** Replace janitorial's section backgrounds with .sec-cream/.sec-white; create utility classes for the repeated sec-sub margin, image-frame wrapper, and cta z-index patch; keep only the hero-img background-image inline if the .hero-img pattern requires it (or move to CSS custom property).

### Schema.org LocalBusiness on both pages omits telephone and street address entirely; locality contradicts canonical company identity
- **Categoría:** seo
- **Evidencia:** Identical JSON-LD on both pages (line 31): {"@type":"LocalBusiness","name":"Ecco Facilities LLC","image":"https://eccofacilities.com/images/logo-horizontal.png","email":"info@eccofacilities.com","address":{"@type":"PostalAddress","addressLocality":"New York","addressRegion":"NY","addressCountry":"US"},...}. Missing fields vs canonical identity: NO telephone (canonical (929) 280-9374), NO streetAddress/postalCode (canonical 54 State St #804, Albany NY 12207), no sameAs (LinkedIn/Instagram/Google profiles linked in footer), addressLocality 'New York' while the registered address is Albany. Additionally neither page shows a phone number anywhere in visible content (footer Contact column is email-only).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/janitorial.html:31; /Users/alexmercedes/Downloads/Ecco Webside/day-porter.html:31
- **Recomendación:** Decide canonical public address strategy (Albany registered vs NYC service area), then populate telephone, streetAddress, postalCode, sameAs consistently sitewide; consider @type Service + BreadcrumbList for these service pages.

## [pag-about]

### og:image and twitter:image point to nonexistent images/logo-vertical.png on both pages
- **Categoría:** seo
- **Evidencia:** about.html L19+L24 and why-ecco.html L19+L24: content="https://eccofacilities.com/images/logo-vertical.png". ls confirms images/logo-vertical.png does not exist (logo-horizontal.png and logo-horizontal-white.png do). 24 HTML files sitewide reference logo-vertical → every social share renders no image. twitter:card is summary_large_image, which expects a large photo, not a logo, even if the file existed.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/about.html lines 19,24; /Users/alexmercedes/Downloads/Ecco Webside/why-ecco.html lines 19,24 (sitewide: 24 files)
- **Recomendación:** Point og:image/twitter:image at an existing 1200x630 image (e.g. the page hero webp converted to jpg/png); fix sitewide in one pass.

### Schema.org and page content omit canonical phone and street address; canonical phone exists nowhere on site
- **Categoría:** content
- **Evidencia:** Identical JSON-LD on both pages (L31): LocalBusiness with "address":{"addressLocality":"New York","addressRegion":"NY","addressCountry":"US"} — no streetAddress, no postalCode, no telephone, no sameAs (despite footer LinkedIn/Instagram/Google links). Canonical identity: 54 State St #804, Albany NY 12207, (929) 280-9374. Grep across all HTML: canonical phone appears 0 times anywhere; only tel: link sitewide is tel:+16463030816 in quote.html/quote.backup.html — a different number. Footer contact column on both pages offers only email + 'New York City — All 5 Boroughs'; no phone, no address. Same locality-only schema block repeats on services/janitorial/day-porter/sustainability/testimonials/careers.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/about.html line 31, lines 197 (footer contact); /Users/alexmercedes/Downloads/Ecco Webside/why-ecco.html line 31, line 273; cross-ref /Users/alexmercedes/Downloads/Ecco Webside/quote.html (tel:+16463030816)
- **Recomendación:** Decide the single public phone (canonical (929) 280-9374 vs the 646 number in quote.html), add telephone + full PostalAddress + sameAs to all schema blocks, and surface phone/address in the footer contact column.

### Testimonial integrity conflict: David Chen has two different quotes and two different employers across pages
- **Categoría:** content
- **Evidencia:** why-ecco.html L209-211 ('Hear from our clients'): quote 'Several employees on our floor have asthma and allergies…' — David Chen, Operations Director, Meridian Capital Group (verbatim match with testimonials.html L128-131 and janitorial.html L202-207). services.html L225-227 attributes a completely different quote ('Ecco transformed our office. The consistency is remarkable — every morning feels like a fresh start for the entire team.') to David Chen, Operations Director, Meridian Financial Group — different company name. index.html L260 additionally trims/paraphrases the asthma quote ('Several employees have asthma and allergies. Since switching to Ecco, we've had zero complaints about chemical odors. The space is spotless and the air actually feels cleaner.' — drops 'on our floor', 'or irritation', and the final sentence) while presenting it in quotation marks as verbatim speech.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/why-ecco.html lines 207-218; conflicts at /Users/alexmercedes/Downloads/Ecco Webside/services.html lines 224-228 and /Users/alexmercedes/Downloads/Ecco Webside/index.html lines 260-263
- **Recomendación:** Pick one canonical quote + employer per testimonial and use it verbatim everywhere; if quotes are illustrative rather than real, that is a legal exposure to resolve at the source.

## [pag-social-proof]

### og:image / twitter:image point to a file that does not exist (logo-vertical.png)
- **Categoría:** seo
- **Evidencia:** Both pages declare <meta property="og:image" content="https://eccofacilities.com/images/logo-vertical.png"> and twitter:image with the same URL. images/logo-vertical.png is absent from disk and was never tracked in git (git ls-files images/ | grep -i vertical = no match), so the URL 404s in production. Site-wide: 62 references across 24 HTML files (all marketing pages + 7 blog posts + dev artifacts). Additionally twitter:card is summary_large_image, for which a vertical logo would be the wrong aspect even if it existed.
- **Ubicación:** testimonials.html:19,24; careers.html:19,24; plus 22 other files (about, accessibility, blog.html, blog/* x7, day-porter, index, index-reference, janitorial, privacy, quote, quote.backup, services, sitemap, sustainability, terms, why-ecco)
- **Recomendación:** Create a real 1200x630 social share image, update all og:image/twitter:image references site-wide, or fall back to images/logo-horizontal.png which exists.

### Schema.org LocalBusiness on both pages: no telephone, no streetAddress/postalCode, locality conflicts with canonical identity
- **Categoría:** seo
- **Evidencia:** Parsed JSON-LD: address={'addressLocality':'New York','addressRegion':'NY','addressCountry':'US'} — no streetAddress, no postalCode, telephone property absent. Canonical identity: 54 State St #804, Albany NY 12207, (929) 280-9374. The phone number appears NOWHERE on the entire site: grep '929' across *.html and blog/*.html returns zero hits. index.html separately says 'Albany, NY', so locality data is internally inconsistent across pages.
- **Ubicación:** testimonials.html:46 (LocalBusiness block 1); careers.html:31 (LocalBusiness) and :32 (jobLocation address inside all 3 JobPostings)
- **Recomendación:** Decide the public address policy once (Albany registered address vs NYC service area), then populate streetAddress, postalCode and telephone consistently in every JSON-LD block; add the (929) 280-9374 phone to footer Contact columns.

### Testimonials page: duplicate LocalBusiness entity carrying self-serving aggregateRating; reviewCount contradicts visible content; zero Review markup
- **Categoría:** seo
- **Evidencia:** Two separate LocalBusiness JSON-LD blocks with no @id linking: block 1 = business info, block 2 = {"name":"Ecco Facilities LLC","aggregateRating":{"ratingValue":"5.0","reviewCount":"6","bestRating":"5"}}. Google treats LocalBusiness aggregateRating sourced from the business's own site as self-serving (ineligible, manual-action risk). reviewCount "6" contradicts the 7 testimonials rendered on the page (1 featured + 6 grid). Despite being THE testimonials page, there is no schema.org Review markup for any individual testimonial. Hero also claims "★ 5.0 Average Rating" with no verifiable source.
- **Ubicación:** testimonials.html:46-47 (JSON-LD), :79 (hero-stats claim), :87-185 (7 testimonials)
- **Recomendación:** Merge into one LocalBusiness with @id; remove the self-serving aggregateRating or back it with the Google Business Profile; if testimonials are real, add itemReviewed Review markup; align any count claims with reality.

### Testimonials show fabrication evidence: same attributed quote mutates between pages, and one cites a real prominent NYC firm
- **Categoría:** content
- **Evidencia:** Dr. Patricia Morales' quote exists in TWO versions: index.html = "Our patients include children and elderly individuals with respiratory conditions..." vs testimonials.html:138 = "Our patients include children, elderly individuals, and people with sensitive skin and respiratory conditions... We've had patients specifically comment on how clean and fresh our office feels." (sustainability.html carries the long version). David Chen's quote is verbatim identical on index.html and testimonials.html (with quotation marks on index, without on testimonials). David Chen/'Meridian Capital Group' appears on 5 pages (index, janitorial, services, why-ecco, testimonials) — Meridian Capital Group is the name of a real, prominent NYC commercial real estate finance firm; attributing an endorsement to that name is legal exposure. All 6 grid testimonials are recycled from other pages; every industry filter category has exactly one testimonial (suspiciously schematic). Plus '★ ★ ★ ★ ★' perfect ratings on all.
- **Ubicación:** testimonials.html:125-183; index.html (David Chen, Patricia Morales); sustainability.html (Patricia Morales); janitorial.html, services.html, why-ecco.html (David Chen/Meridian)
- **Recomendación:** Confirm with Alex which testimonials are real and have written permission; remove or rename anything not verifiable, especially 'Meridian Capital Group'; lock one canonical quote text per person site-wide.

### careers.html: duplicate id="positions" — hero 'View Open Positions' anchor lands on the wrong section
- **Categoría:** structure
- **Evidencia:** <section class="sec bg-white" id="positions"> appears twice: line 73 (section labeled 'Why Work With Us', heading 'This industry doesn't always treat its people well. We do.') and line 121 (heading 'Current Openings'). The hero CTA <a href="#positions">View Open Positions ↓</a> (line 67) therefore scrolls to the Why-Work-With-Us section, not the job listings. Duplicate IDs are also invalid HTML.
- **Ubicación:** careers.html:67,73,121
- **Recomendación:** Remove id="positions" from the line-73 section (rename to id="why-work" if an anchor is needed); keep it only on the Current Openings section.

### careers.html: application form redirects to ?submitted=1 but nothing handles it — applicant gets zero success feedback
- **Categoría:** component
- **Evidencia:** Hidden field <input type="hidden" name="_next" value="https://eccofacilities.com/careers.html?submitted=1"> (line 208). grep for 'submitted' across js/main.js and careers.html finds only this input — no JS reads the query param, no success banner exists. After FormSubmit processes the application the user lands back at the top of the careers page looking exactly as before, with no confirmation their application was received.
- **Ubicación:** careers.html:208; js/main.js (no handler)
- **Recomendación:** Add a small script that detects ?submitted=1 and shows a confirmation banner (and scrolls to it), or point _next at a dedicated thank-you page.

### careers.html: contradictory applicant promises — page says '48 hours', autoresponse email says '3-5 business days'
- **Categoría:** content
- **Evidencia:** Timeline step 2 (line 172): 'Within 48 hours of your application.' Form note (line 320): 'We'll review your application and reach out within 48 hours.' But the _autoresponse hidden field (line 210) the applicant receives by email says: '(1) Our hiring team will review your application within 3-5 business days.' Same applicant, two conflicting SLAs minutes apart.
- **Ubicación:** careers.html:172,210,320
- **Recomendación:** Pick one response window (confirm with Alex) and use it in the timeline, the form note, and the autoresponse text.

### careers.html: no salary ranges in job ads — NYC pay-transparency law exposure; JobPosting schema lacks baseSalary
- **Categoría:** content
- **Evidencia:** Page advertises 3 NYC positions ('Cleaning Technician / Janitor', 'Day Porter', 'Team Lead / Supervisor') with only 'Competitive Pay' (hero-stats line 65, benefit card line 90). NYC Local Law 32 of 2022 requires a good-faith salary range in any advertisement for a job performed in NYC (employers with 4+ employees). All 3 JobPosting JSON-LD blocks also omit baseSalary (parsed: baseSalary=False x3), which additionally weakens Google Jobs eligibility.
- **Ubicación:** careers.html:32 (3 JobPostings), :65, :90, :126-156 (pos-cards)
- **Recomendación:** Add hourly pay ranges to each position card and baseSalary (MonetaryAmount with minValue/maxValue, unitText HOUR) to each JobPosting; have Alex confirm the ranges.

### careers.html: application form collects PII with zero autocomplete attributes (WCAG 1.3.5 AA failure)
- **Categoría:** a11y
- **Evidencia:** Inputs #fname, #lname, #phone (type=tel), #email (type=email) collect personal data but none carry autocomplete attributes (expected: given-name, family-name, tel, email). WCAG 2.1 SC 1.3.5 Identify Input Purpose (Level AA) requires programmatic input purpose on user-data fields. The redundant aria-required="true" alongside required is present on all of them instead.
- **Ubicación:** careers.html:214,218,225,229
- **Recomendación:** Add autocomplete="given-name", "family-name", "tel", "email" respectively; drop the redundant aria-required attributes.

### Two competing chat systems load on both pages: custom 'Ask Alina' widget plus HubSpot embed
- **Categoría:** component
- **Evidencia:** Both pages load js/chat-widget.js?v=4.3 (renders a floating 'Ask Alina' launcher with pulse badge, tooltip, and canned PAGE_CONTENT — it has dedicated 'testimonials' and 'careers' entries) AND the HubSpot loader <script id="hs-script-loader" src="//js-na2.hs-scripts.com/245755967.js"> which can render its own chat. Together with .btt back-to-top (position:fixed; bottom:6rem; right:2rem) that is up to 3 stacked floating bottom-right elements. The Alina header also displays 'Online · Replies in ~2 min' — a fabricated availability/SLA for a scripted bot, violating the no-fake-urgency brand rule (it does disclose '· AI').
- **Ubicación:** testimonials.html:244,248; careers.html:370,374; js/chat-widget.js (PAGE_CONTENT, header template); css/styles.css (.btt)
- **Recomendación:** Choose one chat system per page (HubSpot for CRM capture or Alina for guidance), remove the other, and replace 'Replies in ~2 min' with honest copy.

## [pag-green]

### og:image and twitter:image reference non-existent images/logo-vertical.png
- **Categoría:** seo
- **Evidencia:** <meta property="og:image" content="https://eccofacilities.com/images/logo-vertical.png"> + twitter:image same value; `ls images/logo-vertical.png` → No such file or directory. 24 HTML files sitewide reference logo-vertical.png (every public page incl. both audited pages). twitter:card is summary_large_image, so shares render with a broken/blank image.
- **Ubicación:** sustainability.html:19,24; accessibility.html:19,24; 22 more files (grep -l logo-vertical.png → 24 files)
- **Recomendación:** Create the asset or repoint og:image/twitter:image to an existing 1200x630 social image; do it sitewide in one pass.

### Dead 'Google Business' social link — g.co/kgs/eccofacilities returns HTTP 404
- **Categoría:** content
- **Evidencia:** curl -sI https://g.co/kgs/eccofacilities → 404. Link appears in nav .nm-social and footer .footer-social with aria-label="Google Business" — 53 occurrences across 26 files. kgs share links are opaque hashes; a vanity slug like /kgs/eccofacilities was never valid.
- **Ubicación:** sustainability.html:50,234; accessibility.html:48,161; sitewide (26 files)
- **Recomendación:** Replace with the real Google Business Profile share URL (or a Google Maps place link); remove the icon until the URL exists.

### LocalBusiness JSON-LD: no telephone, city-only address contradicting canonical identity, boroughs mistyped
- **Categoría:** seo
- **Evidencia:** Exact block: "address":{"@type":"PostalAddress","addressLocality":"New York","addressRegion":"NY","addressCountry":"US"} — no streetAddress, no postalCode, no telephone property at all. Canonical: 54 State St #804, Albany NY 12207, (929) 280-9374. areaServed lists [{"@type":"City","name":"New York"},Brooklyn,Queens,Bronx,Staten Island] — boroughs typed as City and Manhattan absent while the site claims 'All 5 Boroughs'. "addressLocality":"New York" appears on 21 pages; "telephone" appears on 0 pages; "streetAddress" on 0 pages.
- **Ubicación:** sustainability.html:31 (accessibility.html uses a WebPage block with no address — line 30, not affected)
- **Recomendación:** Standardize one LocalBusiness block with canonical legal name, street address, postalCode 12207, telephone +1-929-280-9374, and correct areaServed (Manhattan/Brooklyn/Queens/Bronx/Staten Island as Borough or administrative areas).

### Canonical phone (929) 280-9374 absent from both pages and the entire site
- **Categoría:** content
- **Evidencia:** grep '929' across *.html and blog/*.html → 0 matches. Footer Contact column offers only info@eccofacilities.com + 'Request a Quote'; nav nm-contact likewise email-only. The accessibility statement's feedback channel is email-only.
- **Ubicación:** sustainability.html:51,239; accessibility.html:49,124-126,166; sitewide
- **Recomendación:** Add the canonical phone to footer contact column, nm-contact, the accessibility feedback section, and schema; phone NAP consistency also matters for local SEO.

### Accessibility statement page violates its own stated claims (heading hierarchy, landmarks, ARIA)
- **Categoría:** a11y
- **Evidencia:** (1) Heading skip: h2 'Measures We Take' (line 88) jumps to eight h4 cards (lines 93-100: 'Semantic HTML', 'Keyboard Navigation', ... 'Form Accessibility') — no h3 level. (2) Card copy claims 'Proper heading hierarchy, landmarks, and ARIA attributes throughout the site' yet the page has no <main> element (grep '<main' → 0; id="main" sits on <section class="page-hero">). (3) Shared nav uses role="menu"/"menuitem" on plain links and aria-expanded="false" that main.js never updates (grep 'ndd' js/main.js → 0; dropdown is CSS :hover/:focus-within only).
- **Ubicación:** accessibility.html:54,88,93-100,41; same nav defect on sustainability.html:43,56
- **Recomendación:** Demote cards to h3, wrap page content in <main id="main">, drop role=menu/menuitem and the static aria-expanded (or wire it to focus/hover state) — then the statement's claims become true.

## [pag-blog-index]

### Related-articles component on all 7 posts uses CSS classes that no longer exist; stylesheet defines a replacement component no HTML uses
- **Categoría:** component
- **Evidencia:** All 7 posts contain `<div class="article-links">` with `<a class="article-link">` → `<div class="article-link-date">` + h3 + `<div class="article-link-arrow">Read More →</div>` (2 links/post, 14 total). grep counts in css/styles.css: .article-links=0, .article-link=0, .article-link-date=0, .article-link-arrow=0. Instead CSS defines .more-articles-grid{display:grid;grid-template-columns:1fr 1fr}, .more-articles-card{padding:1.5rem;border:1px solid var(--bl);border-radius:var(--r)}, .more-articles-card h4, .more-articles-card span — used by 0 HTML files. Rendered result: no grid/cards/hover; article titles are forced into `.more-articles h3{font-size:1rem;text-transform:uppercase;letter-spacing:.1em}` (identical to the "More Articles" label), dates and "Read More →" fall back to the global anchor rules (a{text-decoration:none;color:inherit} at byte 1193, overridden by a{color:var(--blue-l)} at byte 11028). Git -S finds no commit where these classes existed in styles.css. This matches the project's known cross-page CSS purge trap (MEMORY.md).
- **Ubicación:** blog/5-signs-cleaning-company.html lines 99-113; blog/janitorial-vs-day-porter.html lines 98-112; blog/eco-certified-cleaning-matters.html lines 94-108; + same block in the other 4 posts; css/styles.css .more-articles* rules
- **Recomendación:** Either migrate all 7 posts' markup to .more-articles-grid/.more-articles-card (h4 + span per the CSS contract) or restore the .article-link* rules. One source of truth; verify hover/touch targets after.

### janitorial-vs-day-porter publish date contradicts itself: visible Feb 28 vs structured data Mar 22
- **Categoría:** content
- **Evidencia:** Visible: article-meta `<strong>February 28, 2026</strong>` (line 67), blog.html card date "February 28, 2026" (line 108), related-links on 5-signs (line 108) and eco-certified (line 103) both say "February 28, 2026". Structured: `article:published_time content="2026-03-22"` (line 18) and JSON-LD `"datePublished":"2026-03-22"` (line 32). The other 6 posts' meta dates all match their visible dates exactly. Google can display the 2026-03-22 date in SERPs while the page shows Feb 28.
- **Ubicación:** blog/janitorial-vs-day-porter.html lines 18,32 vs line 67; blog.html line 108
- **Recomendación:** Pick one date (visible Feb 28 is the one echoed in 3 other places) and align article:published_time + datePublished to 2026-02-28.

### LocalBusiness JSON-LD on all blog pages is incomplete vs canonical identity: no telephone, no street address, no sameAs; phone absent from page content entirely
- **Categoría:** seo
- **Evidencia:** Identical block on blog.html line 31 and all 7 posts line 31: `"address":{"@type":"PostalAddress","addressLocality":"New York","addressRegion":"NY","addressCountry":"US"}` — no streetAddress/postalCode (canonical: 54 State St #804, Albany NY 12207), no telephone (canonical: (929) 280-9374), no sameAs despite LinkedIn/Instagram/Google links in nav+footer. grep 'tel:\|(929)\|929-280\|Albany\|54 State' across blog.html + blog/*.html → 0 hits; footer Contact column offers only info@eccofacilities.com and "New York City — All 5 Boroughs". Name "Ecco Facilities LLC" and email are correct.
- **Ubicación:** blog.html line 31; blog/5-signs-cleaning-company.html line 31; blog/janitorial-vs-day-porter.html line 31; blog/eco-certified-cleaning-matters.html line 31 (+ other 4 posts)
- **Recomendación:** Add telephone "+19292809374", full PostalAddress, and sameAs array to the shared LocalBusiness block (site-wide template change); consider exposing the phone in the footer Contact column.

## [pag-blog-posts]

### images/logo-vertical.png missing from repo but used as favicon, og:image, twitter:image and BlogPosting.image on all 4 posts (24 pages site-wide)
- **Categoría:** seo
- **Evidencia:** find . -iname '*logo-vertical*' returns nothing; git ls-files has no record (never tracked, not an uncommitted deletion). Each of the 4 posts references it exactly 4 times: <link rel="icon" type="image/png" href="../images/logo-vertical.png">, og:image, twitter:image (with twitter:card summary_large_image), and BlogPosting "image". 24 HTML files site-wide reference it, including index.html og:image. Meanwhile root pages (index.html, blog.html) already migrated favicons to images/favicon-32.png / favicon-16.png (both exist) — blog posts still carry the stale single icon link. Result: 404 favicon on every post, blank social-share cards, invalid BlogPosting image for rich results.
- **Ubicación:** blog/choose-commercial-cleaning-company-nyc.html lines 21,26,27,32; blog/commercial-cleaning-checklist-nyc.html lines 21,26,27,32; blog/dirty-office-costs-productivity.html lines 21,26,27,32; blog/benefits-day-porter-high-traffic-buildings.html lines 21,26,27,32; plus 20 more pages incl. index.html
- **Recomendación:** Replace favicon links with the favicon-32/16 pair used by index.html and blog.html; set og:image/twitter:image/BlogPosting.image to each post's actual hero photo (1200x630-ish), not a logo.

### Schema.org LocalBusiness: no telephone, no streetAddress/postalCode, locality conflicts with canonical Albany address
- **Categoría:** content
- **Evidencia:** Identical block on all 4 posts: "address":{"@type":"PostalAddress","addressLocality":"New York","addressRegion":"NY","addressCountry":"US"} — missing streetAddress and postalCode entirely; no "telephone" field anywhere in the JSON-LD. Canonical identity: 54 State St #804, Albany NY 12207, phone (929) 280-9374. The visible page also shows no phone anywhere (0 matches for tel:/929 in all 4 posts; footer contact column has email only).
- **Ubicación:** blog/choose-commercial-cleaning-company-nyc.html line 31; blog/commercial-cleaning-checklist-nyc.html line 31; blog/dirty-office-costs-productivity.html line 31; blog/benefits-day-porter-high-traffic-buildings.html line 31
- **Recomendación:** Insert canonical streetAddress "54 State St #804", addressLocality "Albany", postalCode "12207" and telephone "(929) 280-9374" into the LocalBusiness block (single shared snippet), and decide whether the footer should expose the phone.

## [pag-legal-util]

### "CCPA Compliant" hero badge on Privacy page is an unsubstantiated compliance claim
- **Categoría:** content
- **Evidencia:** privacy.html line 64 hero-stats: <span>Your Data Protected</span><span>CCPA Compliant</span><span>No Data Selling</span>. The policy body never mentions CCPA, California, categories of personal information collected/disclosed, or a "Do Not Sell or Share" mechanism; §7 only says "Depending on your jurisdiction, you may have the right to...". Combined with non-functional consent (see P0), the public claim is false. js/cookie-consent.js line 2 comments "CCPA 2026: Respect Global Privacy Control" but only gates HubSpot.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/privacy.html lines 64, 141-151
- **Recomendación:** Remove the "CCPA Compliant" badge or add a genuine CCPA section (categories, rights, Do Not Sell/Share link, GPC honoring) backed by working consent gating.

### og:image/twitter:image reference non-existent images/logo-vertical.png (62 refs across 24 files site-wide; 6 on audited pages)
- **Categoría:** seo
- **Evidencia:** find images -iname "*vertical*" returns nothing (images/ contains logo-horizontal.png, logo-horizontal-white.png, logo-footer.png only). privacy.html lines 19,24; terms.html lines 19,24; sitemap.html lines 20,25 all set https://eccofacilities.com/images/logo-vertical.png. Site-wide grep: 62 occurrences across 24 HTML files (every core page ×2, every blog post ×4, index.html ×3). Social shares of every page render with a broken/missing preview image.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/privacy.html:19,24; /Users/alexmercedes/Downloads/Ecco Webside/terms.html:19,24; /Users/alexmercedes/Downloads/Ecco Webside/sitemap.html:20,25; plus 21 more HTML files
- **Recomendación:** Add images/logo-vertical.png (1200x630 recommended) or repoint all og:image/twitter:image to an existing asset; prefer a real social card over a logo.

### sitemap.html directory is stale and its hero stats are false: lists 3 of 7 blog posts while claiming "20+ Pages / 6 Sections / Always Updated"
- **Categoría:** content
- **Evidencia:** Resources card (lines 101-108) links only blog/5-signs-cleaning-company.html, blog/eco-certified-cleaning-matters.html, blog/janitorial-vs-day-porter.html. Missing 4 published posts that exist on disk and in sitemap.xml since 2026-04-04/05: choose-commercial-cleaning-company-nyc.html, benefits-day-porter-high-traffic-buildings.html, commercial-cleaning-checklist-nyc.html, dirty-office-costs-productivity.html. Hero (line 64) claims "20+ Pages" but the directory lists 19 links = 17 unique pages; "6 Sections" matches nothing on the page (4 directory cards + 1 legal group = 5); "Always Updated" is contradicted by the 4 missing posts (~2 months stale). It does list only real pages (no dev artifacts) — that half passes.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/sitemap.html lines 64 (hero-stats), 101-108 (Resources card, heading "Resources")
- **Recomendación:** Add the 4 missing blog posts; correct or remove the "20+ Pages / 6 Sections / Always Updated" hero stats; consider generating this page from sitemap.xml to prevent future drift.

### Legal contact blocks omit street address and phone; "New York City, NY" conflicts with canonical Albany registered address
- **Categoría:** content
- **Evidencia:** privacy.html lines 171-175 and terms.html lines 199-203 (both under heading "Contact Us"): "Ecco Facilities LLC / Email: info@eccofacilities.com / New York City, NY" — no street address, no phone. Canonical identity: 54 State St #804, Albany NY 12207, (929) 280-9374. grep '929' across all 4 pages: 0 occurrences. A privacy policy offering rights requests (§7) and a ToS specifying NY County venue (§11) should carry a mailing address; legal name "Ecco Facilities LLC" itself is used correctly throughout (privacy.html:95,172; terms.html:97,102,200; footers © 2026 Ecco Facilities LLC).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/privacy.html lines 171-175 (§11 Contact Us); /Users/alexmercedes/Downloads/Ecco Webside/terms.html lines 199-203 (§13 Contact Us)
- **Recomendación:** Add the registered mailing address (54 State St #804, Albany NY 12207) and phone (929) 280-9374 to both contact sections; keep NYC as service area, not as the legal address.

## [pag-quote]

### Wrong phone number (646) 303-0816 in noscript contact block
- **Categoría:** content
- **Evidencia:** quote.html line 188: <a href="tel:+16463030816">(646) 303-0816</a>. Canonical company phone is (929) 280-9374. This is the ONLY phone number on the entire /quote experience and it is wrong. grep confirms '646' appears nowhere else in production HTML and '929' appears nowhere in any of the three quote pages.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/quote.html line 188 (.qf-noscript-contact)
- **Recomendación:** Replace with tel:+19292809374 / (929) 280-9374.

### Success screen promises email from alina@eccofacilities.com but backend sends from info@
- **Categoría:** content
- **Evidencia:** quote.html line 1128-1131: 'Check spam, it comes from <strong>alina@eccofacilities.com</strong>'. functions/api/submit-quote.js lines 509 and 541: From: 'info@eccofacilities.com'. Users searching spam for alina@ will not find their quote; canonical mailboxes are info@ and alex@ only — alina@ is not in the canonical identity.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/quote.html lines 1128-1132 (.qf2-spam-hint); /Users/alexmercedes/Downloads/Ecco Webside/functions/api/submit-quote.js lines 509, 541
- **Recomendación:** Change copy to info@eccofacilities.com, or actually configure alina@ as sender if the persona email is desired.

### og:image / twitter:image point to a file that does not exist (404 on every social share)
- **Categoría:** seo
- **Evidencia:** quote.html lines 22 and 27 reference https://eccofacilities.com/images/logo-vertical.png. `ls images/ | grep -i vert` returns nothing — the file is absent from the repo. Same broken reference exists on at least 10 other pages (index, about, services, janitorial, day-porter, careers, blog, accessibility, sitemap, index-reference). Also twitter:card is summary_large_image with a (missing) logo, and the JSON-LD image uses a different file (logo-horizontal.png) — inconsistent even if it existed.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/quote.html lines 22, 27, 60; cross-page: index.html, about.html, services.html, janitorial.html, day-porter.html, careers.html, blog.html, accessibility.html, sitemap.html, index-reference.html
- **Recomendación:** Create/restore images/logo-vertical.png or point og:image site-wide at an existing 1200x630 social card; align JSON-LD image with og:image.

### Meta description and og/twitter descriptions advertise a chat with an AI advisor that no longer exists
- **Categoría:** seo
- **Evidencia:** quote.html line 17: 'Alina, our AI advisor, tailors a proposal'; line 19 og:description: 'Chat with Alina, our AI cleaning advisor.'; line 26 twitter:description: 'Chat with Alina, our AI cleaning advisor.' Commit 88b38de (D125) 'retire Ask Alina chat stub from /quote' removed all chat; js/quote-flow.js line 151 confirms 'askAlinaBtn / Ask-Alina floating pills retired'. The page is a static multi-step form — no chat, no AI.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/quote.html lines 17, 19, 26
- **Recomendación:** Rewrite meta/og/twitter descriptions around the actual 2-minute guided form; drop 'Chat with' and 'AI advisor' claims (also an Adult-voice over-promise per PRODUCT.md).

### Schema.org LocalBusiness on quote.html is incomplete/divergent from canonical identity
- **Categoría:** seo
- **Evidencia:** quote.html line 60 JSON-LD: address is {"addressLocality":"New York","addressRegion":"NY","addressCountry":"US"} — no streetAddress, no postalCode, and NO telephone property at all. Canonical legal address is 54 State St #804, Albany NY 12207, phone (929) 280-9374. No sameAs (LinkedIn/Instagram/Google profiles linked in footer are omitted).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/quote.html line 60 (script type=application/ld+json)
- **Recomendación:** Add telephone '(929) 280-9374', the canonical PostalAddress, and sameAs array; decide site-wide whether registered (Albany) or service (NYC) address is the schema address and apply uniformly.

### Desktop flowbar station states are hardcoded for the janitorial flow — wrong for dayporter and both flows
- **Categoría:** component
- **Evidencia:** Every screen ships a static 7-station rail (Service/Space/You/Size/Schedule/Location/Review) with hardcoded is-done/is-active classes (e.g. quote.html lines 551-559 location screen marks size and days is-done). FLOWS.dayporter (js/quote-flow.js line 72) has NO size or days step, yet shared screens show 'Size' as a station and location screen shows it done; the schedule screen's own rail (lines 839-846) has only 6 stations — the rail gains/loses a station between consecutive screens. FLOWS.both has 8 interactive steps but rails show max 7 dots while JS-driven text says 'Step N of 8' (qfRenderRailProgress, line 351+). grep confirms no JS or CSS ever touches .qf2-flowbar-station / data-station to adapt them. The RAIL_CONFIGS 'Cleaning'/'Porter' labels (lines 96-103) are never rendered (dead code, see separate finding).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/quote.html lines 348-356, 438-446, 551-559, 631-639, 731-739, 839-846, 919-927; /Users/alexmercedes/Downloads/Ecco Webside/js/quote-flow.js lines 70-122, 351-388
- **Recomendación:** Render the desktop rail from RAIL_CONFIGS per active service (one rail component, not 7 hardcoded copies), or at minimum hide stations not in the active flow and compute is-done from flow index.

### ~380KB CSS double payload on /quote, most of it dead
- **Categoría:** performance
- **Evidencia:** quote.html lines 58-59 load css/styles.css?v=15.1 (169,918 B) AND css/quote-flow.css?v=50.3 (210,488 B, single line — wc -l returns 0). styles.css's main consumers (nav, footer) are permanently hidden on this page (body:has(main.q-flow) .nav / .q-flow-footer-hidden). quote-flow.css ships 37 dead '@media(prefers-color-scheme:dark-DISABLED-V1-LEGACY)' blocks (grep count 37), 29 dead .qf-ask-alina* selector occurrences (component retired in D125), and the dead .qf-checkpoint block (~180 source lines).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/quote.html lines 58-59; /Users/alexmercedes/Downloads/Ecco Webside/css/quote-flow.css; /Users/alexmercedes/Downloads/Ecco Webside/css/quote-flow.source.css lines 638-720, 1471-2810, 4293-4470
- **Recomendación:** Purge the 37 disabled dark blocks and retired-component CSS from the source, re-minify (grep all *.html before deleting shared rules per project memory), and consider a slim critical stylesheet for /quote instead of full styles.css.

### DESIGN.md documents the opposite dark-mode mechanism from what is implemented
- **Categoría:** dark-mode
- **Evidencia:** DESIGN.md line 14: 'The dark variant is NOT auto-applied via prefers-color-scheme — the user toggles it explicitly via .qf2-theme-toggle... persists in localStorage as ecco_theme... lives under [data-theme="dark"] selector.' Reality (D128, commit 0f573ea): quote.html lines 10-12 and 216-217 say toggle removed, dark auto via @media (prefers-color-scheme: dark); css/quote-flow.source.css line 13139+ implements @media (prefers-color-scheme: dark) with no [data-theme] selector; grep 'qf2-theme-toggle' in CSS returns nothing; js/quote-flow.js line 4769 notes ecco_theme is now a stale localStorage key. DESIGN.md even argues the auto behavior violates the Adult brand voice ('no surprise theme swaps') — the spec and the shipped behavior directly contradict.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/DESIGN.md lines 9-16, 48-69; /Users/alexmercedes/Downloads/Ecco Webside/quote.html lines 10-12, 216-217; /Users/alexmercedes/Downloads/Ecco Webside/css/quote-flow.source.css lines 13139-13180
- **Recomendación:** Rewrite DESIGN.md theme section to match D128 (auto via media query), or restore the opt-in toggle if the Adult-voice rationale still stands — pick one source of truth.

### Legacy quote-janitorial.html / quote-dayporter.html: stale System A wizards still shipped and still in sitemap.xml
- **Categoría:** structure
- **Evidencia:** Both are full System A dark-navy wizards: Cormorant Garamond + DM Sans fonts (line 20), styles.css only, white-on-navy copy (rgba(255,255,255,.65)), confetti on success (line 124-126), eager GTM+Clarity (lines 4-7), Turnstile theme:'dark' hardcoded (2x each). Worst staleness markers: viewport 'maximum-scale=1.0' blocks pinch zoom (line 9, WCAG 1.4.4 failure); ZERO h1 elements (grep '<h1' returns nothing); 22/24 inline style= attributes and 20/26 inline onclick= handlers; inline <style> block in head (line 23); em dashes incl. <title> 'Janitorial Services Quote — Ecco Facilities LLC' (15/12 occurrences); unverified claim badges '✓ Green Seal Certified' and '✓ Same-Day Response' (lines 602-603 / 707-708); footer 'New York City — All 5 Boroughs' with &mdash; vs quote.html's &middot;; console.error in submit path; no schema. _redirects 301s both to quote.html?service=..., but sitemap.xml lines 94-100 still list both URLs at priority 0.8/monthly, and the _redirects header comment ('Do NOT add redirects for pages that already exist as .html files') contradicts the entries themselves.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/quote-janitorial.html (lines 9, 20-23, 50, 124-126, 583, 602-603); /Users/alexmercedes/Downloads/Ecco Webside/quote-dayporter.html (lines 9, 50, 688, 707-708); /Users/alexmercedes/Downloads/Ecco Webside/sitemap.xml lines 93-101; /Users/alexmercedes/Downloads/Ecco Webside/_redirects
- **Recomendación:** Delete both legacy files (redirects already exist), remove them from sitemap.xml, and verify on the live .pages.dev whether the redirect or the static file wins on Cloudflare Pages.

## [seo-meta]

### index.html LocalBusiness address is malformed and contradicts itself (Albany street / New York locality / Manhattan geo)
- **Categoría:** seo
- **Evidencia:** index.html JSON-LD block 1 (@id https://eccofacilities.com/#business): "streetAddress": "Albany, NY" (a city name in the street field, not '54 State St #804'), "addressLocality": "New York", "postalCode": "12207" (an Albany ZIP attached to a New York locality), plus "geo": {latitude 40.7128, longitude -74.006} which is lower Manhattan, ~135 miles from ZIP 12207. Canonical address is 54 State St #804, Albany NY 12207. No telephone property.
- **Ubicación:** index.html, first <script type="application/ld+json"> block
- **Recomendación:** Set streetAddress '54 State St #804', addressLocality 'Albany', addressRegion 'NY', postalCode '12207', add telephone '+1-929-280-9374', and either fix geo to Albany coordinates (~42.6498, -73.7530) or drop geo; keep areaServed for the NYC service area.

### 16 pages carry a duplicate, conflicting LocalBusiness entity (no @id, no street/ZIP/phone)
- **Categoría:** seo
- **Evidencia:** An identical generic LocalBusiness block ({"addressLocality":"New York","addressRegion":"NY","addressCountry":"US"} only — no streetAddress, no postalCode, no telephone, no @id) is duplicated on 16 pages. It conflicts with index.html's richer #business entity: different address shape and areaServed typed as @type "City" for Brooklyn/Queens/Bronx/Staten Island (index uses "Borough"). Search engines see two competing LocalBusiness definitions with inconsistent NAP.
- **Ubicación:** about.html, services.html, janitorial.html, day-porter.html, why-ecco.html, testimonials.html, careers.html, sustainability.html, blog.html, quote.html, quote.backup.html, blog/5-signs-cleaning-company.html, blog/benefits-day-porter-high-traffic-buildings.html, blog/choose-commercial-cleaning-company-nyc.html, blog/commercial-cleaning-checklist-nyc.html, blog/dirty-office-costs-productivity.html, blog/eco-certified-cleaning-matters.html, blog/janitorial-vs-day-porter.html
- **Recomendación:** Keep one canonical LocalBusiness definition (on index.html, with correct Albany address + phone) and reference it from other pages via "@id": "https://eccofacilities.com/#business" instead of redeclaring the entity, or replace per-page blocks with WebPage/publisher markup as the legal pages already do.

### Self-serving aggregateRating without Review markup on testimonials.html (rich-result penalty risk)
- **Categoría:** seo
- **Evidencia:** testimonials.html contains a SECOND LocalBusiness block consisting solely of: {"@type":"LocalBusiness","name":"Ecco Facilities LLC","aggregateRating":{"ratingValue":"5.0","reviewCount":"6","bestRating":"5"}}. Google review-snippet guidelines prohibit LocalBusiness review markup for the entity itself on its own site ('self-serving reviews'). No individual Review items are marked up; the page visibly shows 7 testimonials (1 .featured-card + 6 .test-card), contradicting reviewCount 6. Page also has the generic LocalBusiness block — two LocalBusiness entities on one page.
- **Ubicación:** testimonials.html, second <script type="application/ld+json"> block
- **Recomendación:** Remove the aggregateRating LocalBusiness block entirely (self-serving markup is ignored at best, manual-action risk at worst). If review markup is wanted, it must come from a third-party profile, not the company's own site.

### FAQPage schema on index.html has zero visible FAQ content (content-parity violation)
- **Categoría:** seo
- **Evidencia:** index.html lines ~93-101 declare an FAQPage with 6 Question/Answer pairs ("How much does it cost?", "How quickly can you start?", etc.). Each answer string appears exactly once in the file — inside the JSON-LD only. No FAQ section, accordion, or matching text exists in the rendered page (the only 'faq' string in the document is 'FAQPage' itself). Google requires marked-up FAQ content to be visible to users; invisible structured data is a spam-policy violation.
- **Ubicación:** index.html, second <script type="application/ld+json"> block (FAQPage)
- **Recomendación:** Either add a visible FAQ section to index.html containing these exact Q/As, or delete the FAQPage block. Note Google now shows FAQ rich results only for authoritative gov/health sites, so deletion costs nothing.

### Three tracked dev artifacts are live on production with no noindex: /index-reference, /mobile-test, /emailjs-template
- **Categoría:** seo
- **Evidencia:** git ls-files confirms index-reference.html, mobile-test.html, emailjs-template.html are tracked (deployed). Live: https://eccofacilities.com/index-reference, /mobile-test, /emailjs-template all return 200 (Cloudflare 308s the .html form to the extensionless URL). None has <meta name="robots" content="noindex"> (grep = 0). robots.txt only disallows /admin/. mobile-test.html: no lang attr, no description, no canonical, title 'Mobile Test'. emailjs-template.html: a body-only fragment with NO <html>/<head>/<title>/lang at all, 100% inline styles. index-reference.html is an old homepage copy (mitigated by canonical → https://eccofacilities.com/, but its og:url says https://eccofacilities.com/index.html, the non-canonical URL form). Verified NOT live (gitignored, all 404): mockups.html, mockups/* (46 files), quote.backup.html, font-specimen.html, font-compare.html, color-swatches.html.
- **Ubicación:** index-reference.html, mobile-test.html, emailjs-template.html (root); .gitignore covers mockups/, mockups.html, *.backup.html
- **Recomendación:** Delete the three files from the repo (emailjs-template belongs in the EmailJS dashboard or docs/, not the webroot), or add meta robots noindex + X-Robots-Tag via _headers and exclude them from deploy.

### 404.html uses relative asset paths, so it renders unstyled for any nested missing URL; OG set incomplete; self-canonical on an error page
- **Categoría:** structure
- **Evidencia:** 404.html head: href="css/styles.css?v=15.1", href="images/favicon-32.png", src="js/main.js?v=4.6" — all relative. Cloudflare Pages serves 404.html content at the failing path, so /blog/anything-missing resolves CSS to /blog/css/styles.css (404) → fully unstyled error page. Also: only OG tag present is og:title (no og:type/og:url/og:image/og:description, no twitter:card, unlike every other page), and it carries <link rel="canonical" href="https://eccofacilities.com/404.html"> — a canonical on an error page invites indexing of /404.html.
- **Ubicación:** 404.html head (lines 1-20) and all asset references
- **Recomendación:** Convert every asset href/src in 404.html to root-relative (/css/styles.css...), drop the canonical (or add meta robots noindex), and either complete or remove the lone og:title.

## [performance]

### Homepage ships ~4.0MB of images, 2.62MB of it unoptimized JPEG, all via inline background-image with zero lazy loading
- **Categoría:** performance
- **Evidencia:** index.html total referenced image bytes = 3,999,234. Six legacy JPEGs load eagerly in the verticals/safety card grids: 'Safe for sensitivities.jpg' 853,220B, 'Residential Buildings.jpg' 564,909B, 'Safe for children.jpg' 523,481B, 'Restaurants.jpg' 255,966B, 'Safe for your team.jpg' 218,863B, 'Safe for the environment.jpg' 202,067B (sum 2,618,506B). They sit beside WebP/AVIF siblings in the SAME grids ('Safe for patients.webp' 26,398B, 'Safe for every pet.avif' 17,045B, 'Schools & Daycares.webp' 33,810B) — format drift inside one component. All 16 card images use inline style="background-image: url('images/stock/…')" (e.g. index.html:329 photo-card-bg → Restaurants.jpg), so no native loading=lazy, no srcset, no <picture> fallback is possible
- **Ubicación:** index.html lines ~150 (hero), ~329 (photo-card-bg), verticals + safety card sections; files in images/stock/
- **Recomendación:** Re-encode the 6 JPEGs to AVIF/WebP at display size (expect ~85% reduction), move below-fold card backgrounds to <img loading="lazy"> inside the cards or a data-bg IntersectionObserver loader, and standardize one format per component

### 39 orphan images (10.55MB, 67% of the 15.8MB images payload) are git-tracked and deployed but referenced by nothing
- **Categoría:** performance
- **Evidencia:** Cross-referenced every file in images/** (URL-decoded) against all deployable HTML + css/styles.css + css/quote-flow.css + css/crm.css + all live js/*.js: 39 files / 10,549,125 bytes have zero references. Largest: 681792a66d3b3-1746375334.png 3,156,732B; 681792a45dd84-1746375332.png 2,018,051B; Cleaningdisinfectingandsanitizingshare.jpg 772,107B; Allergy_share.jpg 718,951B; alina-avatar.jpg 584,849B (the 9 optimized alina-avatar-{96,192,480} variants replaced it); 8-nyc-skyline-night.jpg 392,770B (only .webp used); two byte-identical copies of 61392d63add9bc08084ffa07_what-is-janitorial-services(.jpeg / ' (1).jpeg') 319,684B each; all 8 files in images/spaces/ (241KB, incl. CREDITS.md'd set never wired up); 3 duplicate logo exports ('Ecco Facilities LLC Logo (Logotipos)…' png/webp/svg, 135KB); plus 12 .jpg originals whose .webp twins are the only used variant. git ls-files images/ = 81 files, so 39/81 deployed files are dead
- **Ubicación:** images/, images/stock/, images/spaces/ — all tracked in git (Cloudflare Pages deploys repo)
- **Recomendación:** Delete the 39 orphans (after re-running the cross-page grep per the project's CSS-purge lesson); keep only the used variant per asset

### styles.css: ~31% dead weight — 199 of 661 classes match zero deployable pages and zero live JS
- **Categoría:** performance
- **Evidencia:** Extracted 661 unique class selectors from minified css/styles.css (169,918B, 1,787 rules); 199 classes (30.1%) appear in no deployable HTML (25 pages + blog) nor in main.js/chat-widget.js/cookie-consent.js/quote-flow.js (dynamic-concat check found only qf-dp-*/qf-screen-* prefixes; the lone 'anim-' JS hit is requestAnimationFrame, not class concat). Rule-level estimate: 51,761 of 166,674 rule bytes (31.1%) are in rules selecting only dead classes. Dead clusters: legacy quote-V1 wizard ~110 classes (stage-*, plan-*, transcript-*, success-*, preparing-*, sidebar-step*, resume-toast*, saved-toast*, continue-*, day-grid/day-btn-*, choices-*) whose only consumer is the untracked quote.backup.html; retired Ask-Alina stub 14 classes (ask-pill* ×10, ask-msg* ×3, alina-corner* ×4 — retired in commit D125); unused utility set (mt-0..mt-4, mb-0..mb-3, mx-auto, text-center); hero-morph*, typewriter-*, inline-followup*, feat-test*
- **Ubicación:** css/styles.css (loaded by all 25 public pages at ?v=15.1)
- **Recomendación:** Purge the legacy quote-V1 and ask-pill blocks with an AST-based tool (per the perl-regex lesson in project memory), re-verify with cross-page grep; expect ~52KB minified / ~10KB gzip savings on every page load

### quote.html double design-system payload: 760KB raw (~163KB gzip) of local CSS/JS, with render-blocking styles.css ~95% unused on that page
- **Categoría:** performance
- **Evidencia:** quote.html loads: HTML 91,933B + styles.css 169,918B (gzip 30,807) + quote-flow.css 210,488B (gzip 35,532) + quote-flow.js 264,947B (gzip 73,552) + main.js 21,083B + cookie-consent.js 1,776B = 760,145B raw. Both stylesheets are render-blocking (<link rel=stylesheet>, quote.html:58-59). quote.html markup uses only ~30 System-A classes (nav, nav-logo, nm-*, nl, ndd/ddp/ddi, footer-* family, btt, mt) out of styles.css's 661 — everything else on the page is qf-*/qf2-* from quote-flow.css. Plus 3 font families (13 styles) and GTM+Clarity+HubSpot. Note: the suspected 'duplicate font <link>' is NOT a defect — the second identical Google Fonts link (quote.html:57) is the <noscript> fallback for the media="print" onload async trick
- **Ubicación:** quote.html:56-59 (head), :1186 (main.js), :1188 (quote-flow.js defer)
- **Recomendación:** Extract the ~30 shared nav/footer rules into a small shared chrome stylesheet (or inline them) so quote.html drops the 170KB styles.css; alternatively split styles.css per-page after the dead-weight purge

### All first-party JS ships unminified; quote-flow.js alone is 264,947B / 5,435 lines with full comments
- **Categoría:** performance
- **Evidencia:** js/quote-flow.js starts with banner comment '/* … Quote Flow v2.0 — Flow-based navigation architecture …' and is fully readable source (gzip 73,552B; minification would cut roughly 35-45%). js/chat-widget.js 56,016B unminified (gzip 15,086) loaded on 24 pages; js/main.js 21,083B unminified (gzip 6,066) on 25 pages. Meanwhile CSS is minified per project rule — the JS half of the pipeline has no minify step. Only third-party libs (chart.min.js, sortable.min.js) are minified
- **Ubicación:** js/quote-flow.js, js/chat-widget.js, js/main.js
- **Recomendación:** Add a JS minify step (esbuild/terser) mirroring the clean-css-cli CSS step, with the same cache-buster-bump-in-same-commit rule

### Script loading matrix is inconsistent: defer on blog posts only, parser-blocking everywhere else
- **Categoría:** performance
- **Evidencia:** 18 root pages (index, about, services, janitorial, day-porter, why-ecco, testimonials, careers, sustainability, blog, accessibility, privacy, terms, sitemap, 404, quote, quote-janitorial, quote-dayporter) load <script src="js/main.js?v=4.6"></script> and <script src="js/chat-widget.js?v=4.3"></script> with NO defer/async (e.g. index.html:547); all 7 blog posts load the same files WITH defer (<script src="../js/main.js?v=4.6" defer>). cookie-consent.js?v=1.1 is sync on all 25 pages. Only quote-flow.js uses defer on quote.html. HubSpot loader is correctly async defer; GTM and Clarity are correctly deferred to requestIdleCallback after window load (quote.html:5,7 and equivalents on all pages)
- **Ubicación:** all 18 root *.html (bottom of body) vs blog/*.html ×7
- **Recomendación:** Add defer to main.js/chat-widget.js/cookie-consent.js on the 18 root pages to match the blog pattern (77KB of parser-blocking JS today)

### og:image and twitter:image on every page point to images/logo-vertical.png — file does not exist (404)
- **Categoría:** seo
- **Evidencia:** grep: 23 HTML files reference https://eccofacilities.com/images/logo-vertical.png as og:image, 22 as twitter:image. `ls images/logo-vertical.png` → No such file or directory; images/ contains only logo-horizontal.png, logo-horizontal-white.png, logo-footer.png. Every social/Slack/iMessage share of every page renders with a broken or missing preview image
- **Ubicación:** index.html, about.html, services.html + 20 more (all public pages), <meta property="og:image"> and <meta name="twitter:image">
- **Recomendación:** Export a real 1200×630 og-image asset and update all 23 pages, or point at logo-horizontal.png as a stopgap

## [js-conducta]

### Cookie banner's Privacy Policy link 404s on blog posts (same relative-URL trap)
- **Categoría:** js
- **Evidencia:** cookie-consent.js:12 banner innerHTML contains <a href="privacy.html"> — on blog/*.html resolves to /blog/privacy.html (does not exist). The consent banner's only legal reference link is broken on 7 public pages.
- **Ubicación:** js/cookie-consent.js:12; all 7 blog/*.html
- **Recomendación:** Change to href="/privacy.html".

### Duplicate .svc-tab click handlers in main.js make BOTH service panels active on services.html
- **Categoría:** js
- **Evidencia:** main.js attaches two independent click handlers to every .svc-tab: handler A (lines 81-94) matches panels by p.id === tab.dataset.panel; handler B initSvcTabs (lines 203-230) matches by p.getAttribute('data-svc') === tab.getAttribute('data-svc'). services.html tabs use data-panel only and panels have NO data-svc attribute (verified markup: <div class="svc-panel" id="panel-dayporter" ...> with no data-svc). On services.html a tab click runs A (correct single panel) then B, where target=null and p.getAttribute('data-svc')=null, so null===null is true for BOTH panels → classList.add('active') on both → both panels rendered active. index.html (data-svc markup) survives only because B runs after A undoes A's wrong-attribute pass. Handler A also sprays aria-selected/tabindex onto index.html tabs that have no role=tab.
- **Ubicación:** js/main.js:81-94 and 203-230; services.html svc-panel markup; index.html svc markup
- **Recomendación:** Merge into one handler keyed on a single attribute (data-panel everywhere or data-svc everywhere); add a null-target guard (if (!target) return) in initSvcTabs.

### chat_open analytics event can never fire — selector targets IDs/classes that exist nowhere
- **Categoría:** js
- **Evidencia:** main.js:27 var chatBtn = document.getElementById('ecco-chat-toggle') || document.querySelector('.chat-toggle'). The real toggle is id="eccoChatToggle" class="ecco-chat-toggle" (chat-widget.js:216); grep for 'ecco-chat-toggle' or 'chat-toggle' across all *.html and blog/*.html = 0 matches. Additionally main.js executes before chat-widget.js creates the button (script order in every page), so even a correct selector would find nothing. Result: 'chat_open' GA4 event is dead on all 24 pages loading both files; chat engagement is invisible in analytics.
- **Ubicación:** js/main.js:27-28; js/chat-widget.js:216; script order in index.html:545-547 et al.
- **Recomendación:** Delete the tracker from main.js and push trackEvent('chat_open') inside chat-widget.js's own toggle handler (chat-widget.js:881).

### HubSpot consent gating exists ONLY on quote.html; 24 other pages load the same tracker statically and ungated
- **Categoría:** js
- **Evidencia:** quote.html:1196-1216 dynamically injects js-na2.hs-scripts.com/245755967.js only when localStorage ecco_consent === 'accepted'/'true' (or on ecco:consent-accepted event). The other 24 public pages (incl. privacy.html:230-232) carry the static <script id="hs-script-loader" async defer src="//js-na2.hs-scripts.com/245755967.js"> with no gating. Legacy quote-janitorial.html/quote-dayporter.html load no HubSpot at all. Three different consent postures for the same vendor across the site.
- **Ubicación:** quote.html:1196-1216 vs index.html, about.html, services.html, privacy.html (+20 more) static loader; quote-janitorial.html/quote-dayporter.html (absent)
- **Recomendación:** Move the consent-gated loader from quote.html into cookie-consent.js (or a shared snippet) and remove the 24 static tags.

## [a11y-sistemica]

### System A muted text tokens fail WCAG AA contrast on light backgrounds
- **Categoría:** a11y
- **Evidencia:** Computed ratios: --tm #6B7A8D on --bg #FAFBFC = 4.23:1 (needs 4.5:1); --tm on --cream #F3F5F8 = 4.01:1; --tm on white = 4.38:1; --tl #7A8A9E on --bg = 3.40:1; --tl on white = 3.53:1; --tl on --cream = 3.23:1. styles.css contains 18 `color:var(--tm)` and 2 `color:var(--tl)` declarations, plus `.form-input::placeholder{color:var(--tl)}` (placeholder text at 3.40:1). All other System A pairs pass: --tb 7.28, --safe-text on navy 11.42, white on --blue 5.66, white on --green 5.33, --green on --bg 5.14.
- **Ubicación:** css/styles.css (minified) — selectors using var(--tm)/var(--tl) incl. .nm-header span, .footer-col a/.footer-col span (--twm variant), .form-input::placeholder; affects every page loading styles.css (all 27+ public pages)
- **Recomendación:** Darken --tm to >=#65758A-range value reaching 4.5:1 on #FAFBFC and #F3F5F8; replace --tl as a text/placeholder color (reserve it for decorative use) or darken to >=4.5:1.

### System B --qf2-muted fails AA on its own cream surfaces; DESIGN.md contrast table is false
- **Categoría:** a11y
- **Evidencia:** Computed: --qf2-muted #6B7A8D on --qf2-cream #EEF2ED = 3.87:1 (fails AA 4.5:1); on --qf2-cream-2 #F6F9F5 = 4.13:1 (fails). DESIGN.md line 45 claims 'Muted on cream: 4.6:1 (AA)' — false. Other claims also wrong: line 43 'Sage on cream: 6.8:1 (AAA)' actual #2D7A32 on #EEF2ED = 4.71:1 (AA only); line 46 'White on sage: 6.4:1 (AAA)' actual = 5.33:1 (AA only); line 69 'Marfil on sage: 4.1:1' actual #EFE8D7 on #6FB376 = 2.05:1 — though the shipped dark-mode chips actually use color:#0F1A20 on sage = 7.05:1 (quote-flow.source.css dark block '.qf2-chip.is-selected...{background:var(--qf2-sage);color:#0F1A20}'), so the doc describes a pair that would fail. Dark-mode actuals pass: ink #EFE8D7 on #1B2733 = 12.42, sage #6FB376 = 6.06, muted #8A9AAB = 5.27.
- **Ubicación:** DESIGN.md lines 42-46 and 65-69; css/quote-flow.source.css :root tokens and [data-theme=dark] block; quote.html only
- **Recomendación:** Darken --qf2-muted to reach 4.5:1 on #EEF2ED (e.g. ~#5E6F80); recompute and correct the entire DESIGN.md contrast table — current numbers will mislead future audits.

### maximum-scale=1.0 in viewport meta on 3 pages (banned pattern, WCAG 1.4.4)
- **Categoría:** a11y
- **Evidencia:** index.html: <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">; identical maximum-scale=1.0 on quote-janitorial.html and quote-dayporter.html. All other pages use plain initial-scale=1.0 (quote.html adds viewport-fit=cover, correctly without max-scale). Project rules explicitly ban maximum-scale=1; it blocks pinch-zoom on Android Chrome.
- **Ubicación:** index.html, quote-janitorial.html, quote-dayporter.html — <head> viewport meta
- **Recomendación:** Remove maximum-scale=1.0 from all three pages; fix the underlying iOS zoom trigger by raising input font-size to 16px instead (see separate finding).

### 21 pages have no <main> landmark
- **Categoría:** a11y
- **Evidencia:** grep '<main' returns 0 on: about, services, janitorial, day-porter, why-ecco, testimonials, careers, sustainability, blog, accessibility, privacy, terms, sitemap, 404 (14 root pages) + all 7 blog/*.html posts. These pages put id="main" on <section class="page-hero" id="main"> so the skip link resolves, but there is no main landmark for AT navigation. Only index.html, quote.html, quote-janitorial.html, quote-dayporter.html (and quote.backup.html) have <main>. No page uses <header> for the site banner (nav is bare <nav id="nav">); <footer> present on all.
- **Ubicación:** about.html, services.html, janitorial.html, day-porter.html, why-ecco.html, testimonials.html, careers.html, sustainability.html, blog.html, accessibility.html, privacy.html, terms.html, sitemap.html, 404.html, blog/*.html (7 files)
- **Recomendación:** Wrap page content in <main id="main"> (move the id off the hero section) on all 21 pages; consistent with index.html/quote.html which already do this.

### Nav Services dropdown: static lying aria-expanded, role=menu misuse, no JS state management
- **Categoría:** a11y
- **Evidencia:** All pages render <a href="services.html" class="nl" aria-haspopup="true" aria-expanded="false"> with <div class="ddp" role="menu"> and role="menuitem" children. main.js contains zero references to ndd/ddp/aria-haspopup — aria-expanded is never updated. Dropdown opens purely via CSS '.ndd:focus-within .ddp,.ndd:hover .ddp{opacity:1;visibility:visible}'. So aria-expanded stays "false" while visually open (desktop), and on mobile the .ddp is permanently expanded ('.nm.active .ddp{position:static;opacity:1;visibility:visible}') while the attribute still says false. role=menu/menuitem implies arrow-key navigation that is not implemented (only a tablist keydown handler exists in main.js line 98). This also violates the project rule 'ARIA attributes must be viewport-aware (matchMedia)' — neither main.js nor any script adjusts these per viewport.
- **Ubicación:** Nav markup duplicated in all 27 pages with <nav id="nav"> (e.g. index.html lines 133-145); css/styles.css .ndd/.ddp rules; js/main.js (absent logic)
- **Recomendación:** Drop role=menu/menuitem (plain nav links), remove aria-haspopup/aria-expanded from the hover-only desktop pattern or add JS that toggles aria-expanded on focus/hover open and per-viewport via matchMedia.

### Mobile menu: no Escape close, no focus management
- **Categoría:** a11y
- **Evidencia:** js/main.js lines 1-3: mobTog click toggles .active/aria-expanded and locks body scroll; closeNav() fires only on link click or overlay mouse click. No keydown listener for Escape anywhere in nav code (the only Escape handler in the codebase is the chat widget, chat-widget.js:898). Focus is never moved into the menu on open nor returned on close; no focus containment — Tab continues into page content behind the rgba(11,29,56,.5) overlay while body scroll is locked.
- **Ubicación:** js/main.js lines 1-3 (closeNav/mobTog handlers); affects all 27 pages with id="mobTog"
- **Recomendación:** Add Escape-to-close (returning focus to #mobTog), move focus to the menu on open, and either trap focus or inert the page behind the overlay while open.

### iOS focus-zoom triggers: inputs below 16px on pages without (banned) max-scale cap
- **Categoría:** a11y
- **Evidencia:** .footer-nl-form input[type=email]{font-size:.84rem} = 13.44px — newsletter input present on 26 pages; .form-input,.form-select,.form-textarea{font-size:.88rem} = 14.08px — used by careers.html (4 fields) and legacy quote pages. iOS Safari zooms the layout when focusing any input <16px. By contrast System B does it right: quote-flow.source.css line 11933 '.qf2-field input, .qf2-field textarea { font-size: 16px ... }' and line 12519 '.qf-dp-time-input { font-size: 16px }'; chat widget input is 16px (chat-widget.js CSS '.ecco-chat-input{font-size:16px}'). The 3 pages carrying maximum-scale=1.0 mask this bug by breaking zoom instead.
- **Ubicación:** css/styles.css .footer-nl-form input[type=email] (26 pages incl. all blog posts), .form-input/.form-select/.form-textarea (careers.html line 204 form; quote-janitorial.html, quote-dayporter.html)
- **Recomendación:** Set 16px font-size on all inputs at mobile breakpoints (mirror the qf2 pattern), then remove maximum-scale=1.0.

### Mobile menu toggle is 32x32px — below 44px project minimum
- **Categoría:** a11y
- **Evidencia:** .mt{display:none;background:0 0;border:none;cursor:pointer;width:32px;height:32px;position:relative} — the only mobile nav control, shown <901px on all 27 pages with id="mobTog". Project rule: 'Touch targets minimum 44px with display:inline-flex'. (Passes WCAG 2.5.8 AA 24px, fails the project's own 44px standard and Apple HIG.)
- **Ubicación:** css/styles.css .mt rule; all 27 pages with <button class="mt" id="mobTog">
- **Recomendación:** Increase .mt to 44x44px (inline-flex, centered spans); visual bar size can stay 24px via inner spans.


# Detalle P2 — Menor

## [colores]

### Homepage hero uses animated shimmer GRADIENT TEXT on mobile only — explicitly banned by PRODUCT.md — with off-palette colors
- **Categoría:** anti-pattern
- **Evidencia:** .hero h1 em and .hero-word-mobile: `background:linear-gradient(90deg,#8fd48c,#5ba8e6,#6bd568,#8fd48c);-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 4s linear infinite` (+ one `animation:shimmer 4s linear infinite!important`). PRODUCT.md:45: "Not a SaaS landing page — no hero with gradient text". Desktop was already reverted: `.hero-ttl-desktop em{background:0 0;-webkit-text-fill-color:var(--green-l);animation:none}` — so the same headline word renders solid green on desktop but green-blue shimmer on mobile. #8FD48C/#5BA8E6/#6BD568 exist in no token system (only re-used by font-specimen.html).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/css/styles.css (.hero h1 em, .hero-word-mobile ×3, .hero-ttl-desktop em); index.html:154-155
- **Recomendación:** Apply the desktop revert to mobile: solid var(--green-l) text, delete the shimmer keyframe colors.

### Homepage hero rotating-word palette introduces 6 ad-hoc accents plus a neon chromatic-aberration effect
- **Categoría:** color
- **Evidencia:** :root{--c-health:#4CB866;--c-team:#E8A94C;--c-people:#5E91A8;--c-planet:#3BA081;--c-future:#5B7FC4;--c-budget:#C84444} colors the rotating hero word per theme (word-layer[data-word=...]). @keyframes heroFutureChroma adds text-shadow rgba(255,40,120,.7) (neon pink) and rgba(40,230,255,.7) (neon cyan) — the most off-brand values in the codebase. Contradicts the documented 'sage as the single accent' direction; none of the 6 values appear anywhere else except --c-budget=--red.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/css/styles.css (:root --c-* block, .hero-rotate .word-layer rules, @keyframes heroFutureChroma); index.html hero
- **Recomendación:** If the rotating-word concept stays, derive the 6 colors from the token ramps and replace the neon chroma shadows with navy/sage equivalents.

### Two competing star-rating golds for the same role; both off-token (one is Tailwind amber-500)
- **Categoría:** color
- **Evidencia:** .trust-rating-stars svg and .trust-quote-stars svg use fill:#e8b229 (index.html trust section); .test-stars and .testimonial-banner .stars use color:#f59e0b (testimonials), duplicated again in testimonials.html embedded <style> `.testimonials-grid-sec .test-stars{color:#F59E0B}`; #F59E0B also appears in the confetti arrays of quote-janitorial.html:125 and quote-dayporter.html:125. #F59E0B on white = 2.15:1 (decorative, but borderline as UI signal). Neither gold is a token.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/css/styles.css (.trust-rating-stars, .trust-quote-stars, .test-stars, .testimonial-banner .stars); testimonials.html embedded style; quote-janitorial.html:125; quote-dayporter.html:125
- **Recomendación:** Tokenize one star gold (e.g. --gold:#E8A94C from the existing --c-team) and use it for every star instance.

### Gold/amber cluster: 11 distinct golds across systems, several failing contrast where used as text
- **Categoría:** color
- **Evidencia:** #F59E0B (stars A), #E8B229 (stars A), #E8A94C (--c-team), #C9A33A (--qf-gold; 2.11:1 on cream — used as .qf-tip border-left + marker bg at quote-flow.source.css:3705,3709 and a progress gradient stop :4522), #B8942F/#8E6F1E (--rv-gold/-dk), #D9B95E (dark --qf-gold), #D98014 (.qf-rev-special-optional.is-warn TEXT = 2.98:1 on white FAIL), chat widget #D68A0B/#8A6A1C/#F5E3B3/#FFF7E6 (2.63:1 and 3.97:1 text pairs).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/css/styles.css; css/quote-flow.source.css:107,3705,3709,4522,5112,8713,13170; js/chat-widget.js
- **Recomendación:** Collapse to one gold ramp (2-3 steps) shared by both systems; darken #D98014 warn text to ≥#A35F00.

### Green family has 16+ distinct values; CTA-green forked into 5 unrelated darks
- **Categoría:** color
- **Evidencia:** Same functional role (green action/brand fill) rendered as: #2D7A32 (token), #236128+#1A4A20 (chat-widget CTA gradients), #1F5B26+#154019 (.cookie-btn-accept bg/border), #1E6524 (.continue-btn.is-saved), #1A5E1F (.trust-av-1 / testimonials inline), #4A7F42 (.qf-plan-card .qf-rev-btn gradient end), rgba(56,103,47,*)=#38672F ×11 (plan-card shadows/washes, 13 distinct alphas), #1F5522 (--rv-sage-dk). Plus light greens #9EE8A2, #6FB376, #82C589, #8FD48C, #6BD568, #4CB866, #3D9A43.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/css/styles.css (.cookie-btn-accept, .continue-btn.is-saved, .trust-av-1); css/quote-flow.source.css:5268-5551,8711; js/chat-widget.js
- **Recomendación:** Define a single green ramp (--green-900..--green-100) in shared tokens; map all 5 dark CTA greens to one value.

### Testimonials avatar gradients duplicated between styles.css and inline styles, with 3 extra off-palette pairs existing only inline
- **Categoría:** anti-pattern
- **Evidencia:** styles.css: .trust-av-1{linear-gradient(135deg,#2d7a32,#1a5e1f)}, .trust-av-2{#c87830,#9e5a1e}, .trust-av-3{#8244a8,#5e2d80}. testimonials.html repeats #C87830/#9e5a1e, #8244a8/#5e2d80, #2D7A32/#1a5e1f INLINE and adds inline-only crimson #c43a5c/#8e2240, teal #2a8a8a/#1a6060, navy-blue #3068AD/#1E3562 (6 inline style= gradients total). Violates the project rule 'Zero inline styles'; purple/teal/crimson/orange exist in neither token system.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/testimonials.html (6 inline gradient avatars); css/styles.css .trust-av-1/2/3; index.html (uses .trust-av-*)
- **Recomendación:** Create .test-av-1..6 classes in styles.css from a defined avatar palette and remove all inline styles.

### Sage alpha proliferation: rgba(45,122,50) used 216 times across 28 distinct alpha steps; navy 28 steps; white 27 steps
- **Categoría:** color
- **Evidencia:** Combined styles.css + quote-flow.css: rgba(45,122,50,*) 216 occurrences with 28 unique alphas (.03,.035,.04,.05,.06,.065,.07,.08,.1,.12,.14,.15,.16,.18,.2,.22,.24,.25,.28,.3,.32,.35,.36,.4,.45,.48,.5 + 0); rgba(11,29,56,*) 140×/28 alphas; rgba(255,255,255,*) 145×/27 alphas. No tint tokens exist beyond --gbg(.07)/--gbd(.18)/--qf2-sage-soft(.08)/--qf2-edge(.14)/--qf2-edge-warm(.16) — five tokens covering 5 of 28 steps.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/css/styles.css, css/quote-flow.css (global)
- **Recomendación:** Define a 5-step opacity scale per base color (e.g. --sage-a05/-a10/-a20/-a30/-a40) and round all occurrences to it.

### Near-duplicate light-on-navy tokens: --safe-text #CBD6E1 (zero consumers, dead) vs --twm #C8D5E2; --twm doubles as a disabled-button background
- **Categoría:** color
- **Evidencia:** :root defines both --safe-text:#CBD6E1 and --twm:#C8D5E2 (ΔE≈1; 11.42 vs 11.28 contrast on navy). grep 'var(--safe-text)' in styles.css = 0 occurrences. --twm is used for footer text on navy AND as .continue-btn:disabled{background:#c8d5e2} — same value, two unrelated roles (text-on-dark + disabled surface).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/css/styles.css :root, .footer-brand p, .footer-heading, .footer-col span, .footer-legal a, .footer-copy, .continue-btn:disabled
- **Recomendación:** Delete --safe-text or merge into --twm; give the disabled background its own token.

### Footer copyright text effectively 2.92:1 via opacity stacking on every page
- **Categoría:** a11y
- **Evidencia:** .footer-copy{color:var(--twm);opacity:.4} on .footer{background:var(--navy)} → effective #57677C on #0B1D38 = 2.92:1 (FAIL, normal-size text). .footer-legal a and .footer-heading at opacity .6 → 4.85:1 (pass, but no margin). Footer renders on all 18 public pages + 7 blog posts.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/css/styles.css (.footer-copy, .footer-legal a, .footer-heading); all pages
- **Recomendación:** Raise .footer-copy opacity to ≥.62 or use a solid color ≥#7F8EA1.

### .sec-lbl label color breaks on navy sections; the one occurrence is patched inline with a blue that still fails AA
- **Categoría:** color
- **Evidencia:** .sec-lbl{color:var(--green)} = #2D7A32 on --navy = 3.16:1 if used in .sec-navy. The only navy instance, why-ecco.html:204, is patched `<span class="sec-lbl" style="color:var(--blue-l)">Testimonials</span>` — #4A82C7 on #0B1D38 = 4.26:1, still <4.5:1 for its .72rem bold text, and swaps the accent from green to blue for one label. No .sec-navy .sec-lbl rule exists in styles.css (grep = 0); .sec-lbl-l{color:var(--green-l)} (4.73:1 on navy) exists but was not used here.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/why-ecco.html:204; css/styles.css (.sec-lbl, .sec-lbl-l)
- **Recomendación:** Remove the inline style and apply the existing .sec-lbl-l class (green-l, 4.73:1) for consistency with other navy sections.

### DESIGN.md and PRODUCT.md color documentation is stale and states wrong contrast ratios
- **Categoría:** content
- **Evidencia:** DESIGN.md:31 documents --qf2-muted:#6B7A8D but CSS ships #4F5C6E (D62). DESIGN.md:43-46 claims "Sage on cream: 6.8:1 (AAA)" (actual #2D7A32 on #EEF2ED = 4.71:1), "Muted on cream: 4.6:1" (documented value actually 3.87:1), "White on sage: 6.4:1" (actual 5.33:1); PRODUCT.md:70 repeats "passes 6.8:1". DESIGN.md:14 says dark mode is "not auto-applied via prefers-color-scheme" with a .qf2-theme-toggle + localStorage ecco_theme under [data-theme=dark] — but the CSS has 0 [data-theme=dark] selectors, dark is auto via @media (prefers-color-scheme: dark) (source:13138), the toggle is gone, and js/quote-flow.js:4769 notes ecco_theme is a stale key. DESIGN.md:29 also documents --qf2-edge-warm only; --qf2-edge is undocumented.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/DESIGN.md:14,25-46; PRODUCT.md:70; css/quote-flow.source.css:9706-9719,13138; js/quote-flow.js:4769
- **Recomendación:** Re-sync DESIGN.md token table and contrast figures to the shipped values; document the prefers-color-scheme switch (D126-D129).

### Foreign design-system stowaways: Tailwind and Bootstrap palette values embedded in brand CSS
- **Categoría:** anti-pattern
- **Evidencia:** #94A3B5 = Tailwind slate-400 (.form-field placeholder in styles.css — a selector used by zero pages — plus 6× chat-widget, sitemap.xsl); #F59E0B = Tailwind amber-500 (stars, confetti); #F0FDF4 = Tailwind green-50 (.ba-col-good); #DC3545 = Bootstrap $danger (.ba-col-bad h3/ico + gradient). 4 foreign-system values, 12+ occurrences.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/css/styles.css (.form-field placeholder, .ba-col-good, .ba-col-bad, .test-stars); js/chat-widget.js; sitemap.xsl
- **Recomendación:** Replace with token equivalents (--tl for placeholder, --red for danger, --gbg for green tint) to stop palette imports from snippet pastes.

### Dark mode: muted text on elevated card surface is 4.44:1, and white-on-sage pairs drop to 2.50:1 where light-mode colors persist
- **Categoría:** dark-mode
- **Evidencia:** --qf2-muted dark #8A9AAB on card surface #243441 = 4.44:1 (FAIL by .06; passes on the page bg #1B2733 at 5.27:1) — cards use --qf2-cream-2:#243441. Buttons keeping `color:#fff` over var(--qf-sage) (e.g. .qf-plan-card .qf-rev-btn gradient `var(--qf-sage) 0,#4a7f42 100%` with hard-coded #4a7f42 end) yield white on #6FB376 = 2.50:1 in dark mode since --qf-sage flips to #6FB376 but the text stays white and #4a7f42 stays fixed. The qf2 chips correctly switch to dark text #0F1A20 (source:13196) — the V1-styled buttons do not.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/css/quote-flow.source.css:5536-5551 (.qf-rev-btn), 13148-13176 (PART A tokens), 13194-13256
- **Recomendación:** In the dark block, override V1 sage-filled buttons to ink-on-sage (like .qf2-quiz-chip.is-active) and bump dark muted to ≥#93A3B4 for card surfaces.

### Inline color styling violates the project's zero-inline-styles rule in 5 pages (beyond background-images)
- **Categoría:** anti-pattern
- **Evidencia:** testimonials.html: 6 inline avatar gradients; janitorial.html: 6× style="background:var(--cream)"/var(--wh) section stripes (other pages use .sec classes); blog.html: 1× style="background:var(--wh)"; why-ecco.html: style="color:var(--blue-l)"; quote-janitorial.html + quote-dayporter.html: inline 'Prefer email?' strip with color:rgba(255,255,255,.5) and link rgba(255,255,255,.7) (effective #858E9C = 5.09:1 over flat navy — passes, but over the photo-backed overlay it is unverified). CLAUDE.md: 'Zero inline styles — all styling through CSS classes'.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/testimonials.html, janitorial.html (6 sections), blog.html:69, why-ecco.html:204, quote-janitorial.html, quote-dayporter.html (email strip)
- **Recomendación:** Move all of these to classes; janitorial's section stripes should use the same alternating .sec pattern as sibling pages.

## [tipografia]

### Marketing h2 scale fragmented into 9 ad-hoc specs with weight split 500 vs 600
- **Categoría:** typography
- **Evidencia:** css/styles.css h2 rules: .sec-ttl clamp(2.2rem,4vw,3.2rem)/600 (canonical, 44 uses across 10 pages); .story-sec h2 clamp(2rem,3.5vw,2.8rem)/600; .form-head h2 clamp(1.9rem,3.2vw,2.6rem)/600; .service-detail-head h2 clamp(1.9rem,3.2vw,2.4rem)/600; .eco-content h2 clamp(1.8rem,3vw,2.4rem)/600; .cta-banner h2 clamp(1.7rem,2.8vw,2.3rem)/500; .message-sec h2 clamp(1.7rem,2.8vw,2.3rem)/500; .article-content h2 1.6rem FIXED/600 (blog posts don't scale fluidly); .legal-section h2 1.4rem/600. Letter-spacing only on .sec-ttl (-.02em). System B by contrast has one prompt spec: .qf2-prompt-title Fraunces 500 clamp(1.375rem,4vw,2.5rem) ls -.015em lh 1.1 (quote-flow.source.css:10147-10159).
- **Ubicación:** css/styles.css (minified, selectors quoted); compare css/quote-flow.source.css:10147
- **Recomendación:** Define a 3-4 step heading scale with one weight per level; make .article-content/.legal-section h2 fluid clamp() like the rest.

### Heading level skips on 8 public pages
- **Categoría:** a11y
- **Evidencia:** DOM heading sequences: services.html h2→h4 ×2 (sequence …2 4 4 4 4 4 2 4…, card grids use h4 directly under h2); sitemap.html h2→h4 ×2 (1 2 4 4 4 4 2 4 4 4…); accessibility.html h2→h4 ×1 then 8 consecutive h4s before returning to h3 (1 2 2 2 4×8 3×5 2…); testimonials.html h1→h3 (1 3 2…); blog.html h1→h3 with 8 card h3s before the first h2 (1 3×7 2…); privacy.html h1→h3 (1 3 2…); terms.html h1→h3 (1 3 2…); 404.html h1→h3 with NO h2 at all (1 3 3 3 3).
- **Ubicación:** services.html, sitemap.html, accessibility.html, testimonials.html, blog.html, privacy.html, terms.html, 404.html
- **Recomendación:** Promote skipped levels (h4→h3 in card grids; first h3 after h1 → h2) so each page descends without gaps.

### Duplicate h1 elements on index.html and quote.html, with case mismatch on quote
- **Categoría:** typography
- **Evidencia:** index.html:154-155 ships TWO h1s with identical text: <h1 class="hero-ttl-mobile"> and <h1 class="hero-ttl-desktop">, toggled via display:none (.hero-ttl-mobile{display:none} / display:block under media query) — one in a11y tree at a time but 2 h1 tags in source. quote.html has h1 ×2: line 166 <h1 class="qf-noscript-title">Request your free quote</h1> (sentence case, JS-off only) and line 214 <h1 class="sr-only">Request a Free Quote · Ecco Facilities</h1> (Title Case) — the same page states its own title in two different cases.
- **Ubicación:** index.html:154-155; quote.html:166,214
- **Recomendación:** index: use one h1 with responsive spans (pattern already used in quote prompt titles). quote: align both h1 texts to one sentence-case string.

### 12 dead Cormorant Garamond references in quote-flow CSS — Georgia-fallback trap since D80 dropped the font from quote.html
- **Categoría:** typography
- **Evidencia:** quote.html no longer loads Cormorant Garamond (D80 comment in quote.html head: "Cormorant Garamond dropped from the loaded fonts… zero rendered consumers"), but css/quote-flow.source.css still declares it 3 times as token values (--qf-fd line 108, --rv-fd line 8714, both 'Cormorant Garamond', Georgia, serif) consumed by 11 rules: var(--qf-fd) ×6 (.qf-rail-value:996, .qf-s4-title:1899, .qf-checkpoint-title:4370, .qf-checkpoint-list:4385, .qf-rev-cell-label:~7188, .qf-plan-hero-title:~7519) and var(--rv-fd) ×5 (.qf-rv-hero-title:8789 with !important, .qf-rv-hero-sub:8805, .qf-rv-sum-primary:8851, .qf-rv-sum-primary-meta:8863, .qf-rv-send-btn-label em:9102), plus intentional .qf-noscript h1:3737. Currently dead paths: the checkpoint section still ships hidden in quote.html:898-906 but JS removed the step (js/quote-flow.js:63,128 "'checkpoint' removed (absorbed into review)"); buildRail() (js/quote-flow.js:856, called at 1391) creates .qf-rail-value elements but quote.html has no .qf-rail-stations container. Any re-activation of these screens renders Georgia, not the brand serif.
- **Ubicación:** css/quote-flow.source.css:108,8714,996,1899,4370,4385,8789-9102,3737; quote.html:898-906; js/quote-flow.js:856,1391
- **Recomendación:** Purge the orphaned V1/rv rules + hidden checkpoint markup + rail JS, or repoint --qf-fd/--rv-fd to var(--qf2-fd) (Fraunces) so dormant paths can't render off-brand.

### font-family:var(--fs) references an undefined token in styles.css
- **Categoría:** typography
- **Evidencia:** Three rules in css/styles.css use font-family:var(--fs) (.saved-toast, .resume-toast, .resume-toast-close/.resume-toast-reset) but `--fs:` is defined NOWHERE — grep across css/*.css and all *.html returns 0 definitions. var() with no fallback + undefined property = invalid at computed-value time → font-family falls back to inherited. The classes also have no consumers in any *.html or js/*.js (dead component), but the token gap will bite if the toasts are ever wired up.
- **Ubicación:** css/styles.css selectors .saved-toast, .resume-toast, .resume-toast-close, .resume-toast-reset
- **Recomendación:** Define --fs (or replace with var(--fb)) — or delete the dead toast rules.

### 27 distinct uppercase letter-spacing values site-wide; near-duplicate eyebrow classes .sec-lbl vs .sec-label; three competing eyebrow languages
- **Categoría:** typography
- **Evidencia:** css/styles.css: 28 uppercase selectors spread over 12 tracking values (.02em .pillar-label, .04em ×3, .05em ×2, .06em ×2, .08em ×5 (.hero-badge, .nm-label, .ind-tag, .fg label…), .1em ×6, .12em (.stat-lbl, .sec-label), .14em ×5 (.sec-lbl, .footer-heading, .stage-eyebrow, .preparing-eyebrow, .success-eyebrow), .15em .featured-label, .24em .hero-kicker-text). css/quote-flow.source.css adds 15 more distinct values .005–.22em incl. 5 !important overrides (.qf-rv-sum-k .22em, .qf-rv-hero-kicker .2em, .qf-rv-notes-k-label .18em, .qf-rv-field-label .16em, .qf-checkpoint-eyebrow .15em). Near-dupe class names: .sec-lbl (.14em, used on 10+ marketing pages) vs .sec-label (.12em, used ONLY on quote-janitorial.html + quote-dayporter.html). Three eyebrow systems coexist: System A uppercase green pill .sec-lbl (.72rem/700/.14em/uppercase/pill bg), System B lowercase Fraunces italic 20px sage .qf2-section-label (quote-flow.source.css:10991-10999, no uppercase), V1/rv uppercase kickers at .15-.22em.
- **Ubicación:** css/styles.css (28 selectors), css/quote-flow.source.css (22 selectors), quote-janitorial.html, quote-dayporter.html
- **Recomendación:** Tokenize tracking to 2-3 steps (e.g. --ls-tight, --ls-caps); merge .sec-label into .sec-lbl; document one eyebrow recipe per design system.

### Dev artifacts deployed publicly load rogue font families: Inter and JetBrains Mono
- **Categoría:** typography
- **Evidencia:** mockups.html:7 loads `family=Inter:wght@400;500;600;700` alongside DM Sans + Cormorant; color-swatches.html:9 loads `family=JetBrains+Mono:wght@400;500`. Neither family belongs to System A or B. Also quote.backup.html:30-31 still uses the preload+stylesheet double-fetch pattern that quote.html explicitly removed (Ola 4 comment: "preload was racing the stylesheet… -200ms FCP"); font-compare.html has 2 h1s; mobile-test.html uses system-ui only; emailjs-template.html uses inline 'Helvetica Neue' (acceptable for email, but it is publicly served).
- **Ubicación:** mockups.html:7, color-swatches.html:9, quote.backup.html:30-31, font-compare.html, font-specimen.html, index-reference.html, emailjs-template.html, mobile-test.html
- **Recomendación:** Remove dev artifacts from the deployed site (or exclude via build); that alone removes 2 stray families from the production domain.

## [componentes]

### Duplicate card components: .val-card vs .value-card implement the same 'value grid' pattern with different markup
- **Categoría:** component
- **Evidencia:** .val-card (icon div .val-ico + h3 + p) on about.html(4), accessibility.html(8 lines), sitemap.html(7), services.html(10); .value-card (h3 + p, no icon) on janitorial.html(3) and day-porter.html(3). Both styled in styles.css (.val-card → 6 selector occurrences, .value-card → 2). Same role, two diverged components.
- **Ubicación:** about/accessibility/sitemap/services vs janitorial/day-porter, css/styles.css
- **Recomendación:** Merge into one card component with an optional icon slot.

### Five different testimonial implementations across the site, none using <blockquote>
- **Categoría:** component
- **Evidencia:** (1) testimonials.html: .test-card grid (test-quote/test-auth/test-av/test-name/test-role/test-stars) + page-local filter UI; (2) why-ecco.html: .testimonial + .testimonial-quote/.testimonial-author/.testimonial-title; (3) sustainability.html: .testimonial-banner; (4) janitorial.html: .test-single wrapper reusing test-quote children; day-porter.html: .test-grid wrapper with bare .rv children + test-quote; (5) index.html: .trust-quote cards with .trust-quote-stars. grep '<blockquote' across *.html blog/*.html = 0 hits.
- **Ubicación:** testimonials.html, why-ecco.html, sustainability.html, janitorial.html:?, day-porter.html:171-173, index.html:259-275
- **Recomendación:** Consolidate to one testimonial component (semantic blockquote + cite), with grid/single/banner layout modifiers.

### Hero CTA button order flips between pages: 3 pages lead with primary, 11 lead with ghost
- **Categoría:** component
- **Evidencia:** hero-actions order — primary (.btn-white) FIRST on index ('Get Your Free Proposal →' + 'See How It Works'), janitorial, day-porter; ghost (.btn-ol) FIRST on about, services, why-ecco, testimonials, careers, sustainability, blog, accessibility, privacy, terms, sitemap. Hero quote-CTA label also varies: 'Get Your Free Proposal →' (4 pages), 'Get a Free Quote →' (2), 'Get a Quote →' (2), 'Request a Janitorial/Day Porter Quote →' (2).
- **Ubicación:** hero-actions blocks in the 14 listed root pages
- **Recomendación:** Fix one order (primary first) and one label set.

### blog.html hero has a ghost-only CTA which is hidden on mobile, leaving zero hero buttons
- **Categoría:** component
- **Evidencia:** blog.html hero-actions contains a single '<a class="btn btn-ol">Read Latest Articles ↓</a>' (no .btn-white). styles.css '@media (max-width:900px){… .hero-actions .btn-ol{display:none}…}' hides all ghost hero buttons under 900px → blog hero renders with no button at all on mobile.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/blog.html hero-actions; css/styles.css max-width:900px block
- **Recomendación:** Give blog.html a .btn-white primary (or exempt single-button heroes from the mobile hide).

### cta-banner pre-footer component has 7 structural variants across 10 pages (plus 1 page missing it)
- **Categoría:** component
- **Evidencia:** index: .cta-trust + .cta-btns > btn-white + btn-ol-white; about: .cta-banner-actions > 2× btn-white (two identical primaries); blog: .cta-banner-actions > 1 btn-white; services & sitemap: .cta-email ABOVE .cta-banner-btn wrapper; janitorial & day-porter: .cta-email + unwrapped btn-white; testimonials: .cta-inner > btn-white with .cta-email BELOW; sustainability: inline-styled div (style="position:relative;z-index:2") with 2 btn-white joined by loose text ' or '; why-ecco: inline-styled flex div + 2 bare .btn (see separate finding). careers.html has no cta-banner at all. 4 different action-wrapper classes for one component: .cta-btns, .cta-banner-actions, .cta-banner-btn, .cta-inner.
- **Ubicación:** index.html, about.html:?, services.html, janitorial.html, day-porter.html, why-ecco.html:248, testimonials.html, sustainability.html, blog.html, sitemap.html
- **Recomendación:** One canonical banner: h2 + p + .cta-banner-actions (primary + ghost) + optional .cta-email, identical order everywhere.

### Nav active state has no aria-current; Services dropdown aria-expanded is hard-coded 'false' forever
- **Categoría:** a11y
- **Evidencia:** grep 'aria-current' across *.html blog/*.html = 0 hits — active link styled only via .nl-active class (visual-only). Services trigger: '<a href="services.html" class="nl" aria-haspopup="true" aria-expanded="false">' on all 24 nav-bearing pages; js/main.js only toggles aria-expanded on #mobTog, .pillar buttons, and one collapse button — never on the .ndd trigger, while the .ddp panel opens via CSS :hover/:focus-within. Screen readers are told the menu is permanently collapsed.
- **Ubicación:** all 24 pages with .nav; js/main.js:2-3; css/styles.css .ndd:focus-within rule
- **Recomendación:** Add aria-current="page" alongside .nl-active; either drop aria-expanded from the CSS-only dropdown or update it in JS.

### Careers application form is a third form system with no error pattern and an inline-style honeypot
- **Categoría:** component
- **Evidencia:** careers.html:204-282 uses .form-wrapper/.form-label/.form-input/.form-select/.form-required posting to formsubmit.co with _captcha=false; no error message elements, no aria-live, native validation only — vs quote.html System B .qf2-fields with role="alert" (×5) and aria-invalid handling in js/quote-flow.js. Honeypot at careers.html:209 is '<input type="text" name="_honey" style="display:none">' while the footer newsletter honeypot (same site, 22 pages) uses '<div aria-hidden="true" class="sr-only">…tabindex="-1"'. Three different form backends: formsubmit.co (careers), Mailchimp us22.list-manage.com (newsletter), /api/submit-quote Cloudflare function (quote).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/careers.html:204-282; footer .footer-nl-form on 22 pages; quote.html:391
- **Recomendación:** Normalize honeypot technique, add a shared inline-error pattern to careers, document the 3 backends.

### testimonials.html ships a 1,191-char page-local <style> block defining reusable components (.filter-bar/.filter-btn/.testimonials-grid-sec) plus inline filter JS
- **Categoría:** component
- **Evidencia:** testimonials.html:33-44 defines .filter-btn states inside the page <style>; an inline <script> at the bottom wires .filter-btn clicks. These classes exist nowhere in css/styles.css. This is the only marketing page with its own component CSS, breaking the single-stylesheet system (System A).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/testimonials.html:33-44,116-119 and inline script before chat-widget.js
- **Recomendación:** Move filter styles into styles.css (with cache-buster bump) and the handler into main.js.

### hero-stats component: same class, two different markups, present on legal/utility pages but absent from both service pages
- **Categoría:** component
- **Evidencia:** index.html:161-165: spans with inline SVG icons + animated '<span class="hero-stat-num" data-target="12" data-suffix="+">0</span>' counters. All other pages: plain '<span>12+ Years</span>' text spans. Present on privacy ('Your Data Protected · CCPA Compliant · No Data Selling'), terms, accessibility, sitemap ('20+ Pages · 6 Sections · Always Updated'), blog — but absent from janitorial.html and day-porter.html (0 hits each), the two conversion pages. Filler stats like 'Always Updated' and '6 Sections' dilute the pattern.
- **Ubicación:** index.html:161-166 vs about.html:64, privacy/terms/accessibility/sitemap/blog page-hero; janitorial.html, day-porter.html (missing)
- **Recomendación:** One markup; move stats to pages where they sell (service pages), drop filler from legal pages.

### Section-header eyebrow (.sec-lbl) is inconsistently applied: 0 of 10 headers on index+about, ~70% elsewhere; heading case mixes Title Case and sentence case
- **Categoría:** component
- **Evidencia:** Counts: index.html sec-ttl=7/sec-lbl=0; about.html 3/0; careers 4/2; why-ecco 4/3; sustainability 6/4; services/janitorial/day-porter use sec-lbl consistently. Light-variant set (.sec-lbl-l/.sec-ttl-l/.sec-sub-l) used 3/6/2 times. Case style within the same component: 'What Sets Ecco Apart for Janitorial', 'Trusted Across Every Industry' (Title Case) vs 'Two core services. Tailored to any commercial space.', 'When we say safe, we mean everyone.' (sentence case) — both styles even co-occur on the same pages (index, sustainability, why-ecco). System B (PRODUCT.md) mandates sentence case.
- **Ubicación:** sec-head/sec-lbl/sec-ttl across index, about, services, janitorial, day-porter, why-ecco, sustainability, careers, testimonials
- **Recomendación:** Decide eyebrow policy per section type and one case convention; sweep all sec-ttl texts.

### Blog article cards: two different components for the same content (blog index vs post 'more articles')
- **Categoría:** component
- **Evidencia:** blog.html uses .blog-card (div: .blog-card-date + bare h3 + p + 'Read Article &rarr;' .blog-card-link — only the small link is clickable). Blog posts use .more-articles > .article-link (whole-card anchor with .article-link-date/.article-link-arrow). 7 posts × article-link vs 7 cards × blog-card.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/blog.html vs blog/*.html (.more-articles)
- **Recomendación:** Unify on the fully-clickable card and share the class.

### Dual-identical-primary-button groups (no visual hierarchy) in 3 CTA locations
- **Categoría:** anti-pattern
- **Evidencia:** about.html cta-banner: 2× 'btn btn-white' ('Request a Free Quote →' + 'Email Us →'); sustainability.html cta-banner: 2× 'btn btn-white' joined by raw text ' or '; 404.html:52-53 hero-actions: 2× 'btn btn-white' ('Back to Homepage' + 'Request a Free Quote'). Everywhere else the pair is primary+ghost (btn-white + btn-ol / btn-ol-white).
- **Ubicación:** about.html, sustainability.html, 404.html:51-54
- **Recomendación:** Demote the secondary action to btn-ol-white in all three.

### 167 inline style attributes across public pages despite the project's zero-inline-style rule; quote.html alone is clean (0)
- **Categoría:** component
- **Evidencia:** Per-page counts: quote-dayporter 33, quote-janitorial 31, index 16, janitorial 14, day-porter 13, testimonials 8, why-ecco 5, sustainability 5, about 4, blog posts 3 each (21), careers 3, blog 3, services 2, accessibility 2, privacy 2, terms 2, sitemap 2, 404 1, quote.html 0. Notables: footer hidden via style="display:none" on both legacy quote pages (:65) while quote.html uses class+hidden; why-ecco.html:148 table wrapper style="max-width:960px;margin:0 auto;overflow-x:auto"; day-porter.html:170 sec-head style="margin-bottom:3rem"; cookie-consent.js:12 injects '<div style="display:flex;gap:.5rem">' inside the banner; hero-img/photo-card-bg background-image styles on index/janitorial/day-porter/about.
- **Ubicación:** all System A pages (counts above); js/cookie-consent.js:12
- **Recomendación:** Sweep into utility classes; prioritize the two legacy quote pages (64 of 167) and component-level offenders.

## [espaciado]

### Border-radius sprawl: tokens duplicated by literals, 3 competing pill conventions, zero radius tokens in System B, sibling cards at 14/18/20px
- **Categoría:** component
- **Evidencia:** styles.css (210 radius decls): var(--rl)=18px x41, var(--r)=12px x25, BUT literal 12px x13 (.form-field input/select/textarea,.sum-section,.story-img,.val-ico,...) duplicates --r, and literal 18px x1 duplicates --rl. Pills written 3 ways: 50px x16 (.hero-badge,.sec-lbl,.eco-badge,.time-chip,...), 100px x3 (.cta-float,.hero-actions .btn,.photo-card-pill), 999px x2 (.saved-toast,.resume-toast-close). Same component, two shapes: `.btn{border-radius:var(--r)}` (12px) but `.hero-actions .btn{border-radius:100px}`. Sibling cards: most cards var(--rl)=18px (.why-card,.ind-card,.blog-card,.test-card,.val-card,...) but .pillar=14px and .photo-card=20px. quote-flow.source.css (171 decls): NO radius custom property defined or used (var(--r) count: 0); spread 2,3,4,6,8,9,10,12,13,14,16,18,20,24px + 50% x42 + 999px x27, including one-off `border-radius:13px` on `.qf-plan-card .qf-rev-btn` (line 5535) adjacent to 999px-pill and 14px buttons; qf2 cards are 20px vs marketing's 18px.
- **Ubicación:** css/styles.css throughout (all pages); css/quote-flow.source.css:5535 and throughout (quote.html)
- **Recomendación:** Adopt 3 radius tokens per system (small/large/pill=999px); replace the 13 literal 12px and the 50px/100px pills; decide 18 vs 20px for cards site-wide.

### Global overflow-x:hidden on BOTH html and body masks a real .svc-showcase breakout desync in the 769-1024px window
- **Categoría:** anti-pattern
- **Evidencia:** styles.css: `html{scroll-behavior:smooth;overflow-x:hidden}` and `body{...;overflow-x:hidden}`. Masked bug: `.svc-showcase{margin-left:-3.5rem;margin-right:-3.5rem;width:calc(100% + 7rem)}` is a full-bleed breakout synced to .sec's 3.5rem side padding, re-synced only at <=768px (`margin:-1.5rem;width:calc(100% + 3rem)`), but parent .sec side padding changes at <=1024px (2rem) and <=900px (1.5rem). Result: viewport 901-1024px the showcase extends 1.5rem beyond viewport per side; 769-900px it extends 2rem per side — silently clipped by the global overflow-x:hidden instead of scrolling. Parent: `<section class="sec sec-cream svc-sec">` in index.html. Secondary: why-ecco.html line 148 fixes table overflow with an inline `<div style="max-width:960px;margin:0 auto;overflow-x:auto">` instead of a class. Positive: .hero,.page-hero,.cta-banner,.message-sec,.cert-marquee,.trust-strip,.qf-stage all correctly carry overflow:hidden.
- **Ubicación:** css/styles.css html/body rules and .svc-showcase (+768px override); index.html svc-sec section; why-ecco.html:148
- **Recomendación:** Add 1024px and 900px overrides to .svc-showcase matching parent padding (or use margin-inline:calc(-1*var(--sec-pad-x))); then the global overflow-x:hidden can be scoped or removed.

### 36 dead 'dark-DISABLED-V1-LEGACY' media blocks ship in production quote-flow.css = 8.2% of the file
- **Categoría:** performance
- **Evidencia:** Shipped css/quote-flow.css contains 36 blocks of `@media (prefers-color-scheme:dark-DISABLED-V1-LEGACY)` (an intentionally-invalid query that can never match) plus 1 combined `...and (max-width:640px)` variant — measured 17,192 bytes of 210,488 (8.2%) parsed and discarded by every quote.html visitor. The live dark mode uses the separate `@media (prefers-color-scheme:dark)` x3 and [data-theme=dark] rules.
- **Ubicación:** css/quote-flow.css (37 occurrences incl. combined variant); css/quote-flow.source.css same blocks
- **Recomendación:** Strip the disabled V1 dark blocks from the shipped build (keep in source history if desired); 17KB free win on the quote funnel's critical CSS.

### Specificity war: 1,294 !important in quote-flow.css vs 77 in styles.css; @layer architecture declared but only 'reset' is populated
- **Categoría:** anti-pattern
- **Evidencia:** `grep -c '!important'`: quote-flow.css = 1,294, styles.css = 77. Both files open with `@layer reset,tokens,base,components,variants,overrides,utilities;` yet styles.css contains exactly one layer block (`@layer reset{...}`) — tokens/base/components/variants/overrides/utilities are declared and empty, all other rules unlayered. quote-flow layout examples: `max-width:none!important` x9, `padding:0!important` x15, `main.q-flow .qf-screen.step-contact .qf-screen-inner{max-width:1280px!important}`, `.qf2-stage{display:none!important;padding:0!important}`, `border-radius:999px!important` x7, `box-shadow:none!important` x8. This is the V2 qf2 layer fighting 1,728 legacy `.qf-` rules in the same file (513 .qf2 references vs 1,728 .qf-).
- **Ubicación:** css/quote-flow.css / quote-flow.source.css (quote.html); css/styles.css @layer header
- **Recomendación:** Finish the staged @layer migration the source comments describe: move legacy .qf- rules into a lower layer so qf2 wins by layer precedence and the !importants can be deleted.

### Opposed unit philosophies cascade on the same page: styles.css is 93% rem, quote-flow is 97% px
- **Categoría:** spacing
- **Evidencia:** Spacing declarations (padding/margin/gap): styles.css = 742 rem-valued vs 55 px-valued; quote-flow.source.css = 21 rem-valued vs 717 px-valued. quote.html loads both (`styles.css?v=15.1` + `quote-flow.css?v=50.3`), so browser-font-size scaling (text zoom) grows marketing chrome but not the quote form. quote-flow comments acknowledge this (D86 switched type to rem-based clamp) but spacing remains px.
- **Ubicación:** css/styles.css; css/quote-flow.source.css; quote.html head (both links)
- **Recomendación:** Pick rem for spacing in both systems (or document px as System B policy in DESIGN.md); at minimum convert touch-target paddings.

## [darkmode]

### .qf-toast stays hardcoded white (#fff) in dark mode — body-appended element escapes the dark token scope
- **Categoría:** dark-mode
- **Evidencia:** .qf-toast{background:#fff;color:var(--qf-ink);border:1px solid var(--qf-edge)} (quote-flow.source.css:3611-3637); toast is created and appended to document.body (js/quote-flow.js:20-26), outside .qf2-stage/main.q-flow where dark PART A swaps tokens (source:13146-13147). Light token re-declaration on .qf-toast itself (source:80-82, @layer tokens) keeps --qf-ink at light values. None of the 3 live dark blocks (13138/13178/13377) contain any .qf-toast rule (grep 'toast' in 13138-13403 = 0 rule hits). Result: light cream/white toast pops over the #1B2733 midnight page. This is the exact bug class D129 fixed for .qf-resume-inner and the D128 comment itself warns about for the cookie banner (source:13354-13359 'same trap as D109 toast fallback').
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/css/quote-flow.source.css:3611-3700, 13138-13403; /Users/alexmercedes/Downloads/Ecco Webside/js/quote-flow.js:20-26
- **Recomendación:** Add a dark-mode .qf-toast rule (surface #243441, ink #EFE8D7, sage icon #6FB376) in PART B, and re-declare dark tokens on .qf-toast in PART A alongside .qf2-stage/main.q-flow.

### Cookie banner surface stays System A cool navy #0B1D38 in both quote themes; its intended warm-dark override is trapped inside a disabled legacy block
- **Categoría:** dark-mode
- **Evidencia:** styles.css: .cookie-banner{background:var(--navy)...} (#0B1D38). quote-flow.source.css:6576-6589 contains the warm variant .cookie-banner{background:#1F2824!important;border:1px solid #232B22!important;color:#e8ecf2!important} but it sits INSIDE the disabled block @media(prefers-color-scheme:dark-DISABLED-V1-LEGACY) spanning lines 6206-6630 (verified by brace-depth scan: block closes at 6630), so it never applies. On /quote dark, the banner is cool clinical navy on warm teal-navy #1B2733; on /quote light it is the only navy surface on the warm sage/cream editorial page (System A bleeding into System B). Only .cookie-btn-accept got a live dark override (13360).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/css/styles.css (.cookie-banner); /Users/alexmercedes/Downloads/Ecco Webside/css/quote-flow.source.css:6206-6630 (disabled), 13354-13368 (live)
- **Recomendación:** Move the .cookie-banner warm-dark surface rules out of the disabled block into the live D128 dark block; add an editorial light-banner variant for /quote light mode.

### 37 permanently-dead 'dark-DISABLED-V1-LEGACY' media blocks ship in the production minified CSS — 17,192 bytes (8.2% of the file) that can never apply
- **Categoría:** performance
- **Evidencia:** grep -o 'dark-DISABLED-V1-LEGACY' css/quote-flow.css = 37 (minified, comments stripped); brace-matching scan totals 17,192 bytes across 37 blocks in the 210,488-byte file. The invalid media value evaluates to not-all, so the rules are unreachable by design (D95 neutralization). Keeping them in quote-flow.source.css for git blame is documented intent (source:35-37), but they survive minification into the shipped artifact loaded by every /quote visitor (quote.html:59 css/quote-flow.css?v=50.3).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/css/quote-flow.css (37 blocks); /Users/alexmercedes/Downloads/Ecco Webside/css/quote-flow.source.css lines 1471-9120 (block openers at 1471, 1718, 1783, 1846, 1872, 2007, 2050, 2170, 2210, 2280, 2358, 2371, 2379, 2479, 2515, 2545, 2601, 2613, 2703, 2806, 2814, 6206, 6699, 6889, 6915, 6952, 7059, 7093, 7363, 7625, 7703, 7777, 7835, 7968, 8059, 8334, 9120)
- **Recomendación:** Strip @media blocks whose query contains dark-DISABLED-V1-LEGACY during the minify step (they are unreachable), keeping the source untouched. ~17KB saved on the heaviest page of the funnel.

### Orphaned localStorage key ecco_theme — D126 wrote it to real users' browsers, D128 removed every reader/writer
- **Categoría:** dark-mode
- **Evidencia:** Repo-wide grep for ecco_theme = exactly 1 hit: a comment at js/quote-flow.js:4769 ('localStorage ecco_theme key is left as a stale entry on existing users' devices'). No JS reads or writes it; no CSS consumes a theme attribute. Users who explicitly chose a theme during the D126 window now get the OS preference regardless; DESIGN.md line 14 still documents the key as the live persistence mechanism.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/js/quote-flow.js:4769; /Users/alexmercedes/Downloads/Ecco Webside/DESIGN.md:14
- **Recomendación:** If the toggle returns, honor existing ecco_theme values as the override. If auto-only is final, add a one-time localStorage.removeItem('ecco_theme') cleanup and delete the key from DESIGN.md.

### meta theme-color missing on all 33 public pages (present only on 6 internal CRM pages); no dark-variant theme-color on the one page that has dark mode
- **Categoría:** dark-mode
- **Evidencia:** grep '<meta name="theme-color"' across index/about/services/janitorial/day-porter/why-ecco/testimonials/careers/sustainability/blog(+7)/accessibility/privacy/terms/sitemap/404/quote/quote-janitorial/quote-dayporter/quote.backup + 7 dev artifacts = 0 hits. Repo-wide 'theme-color' = 6 hits, all crm/*.html (index, leads, pipeline, lead, reports, settings) with content="#0B1D38". quote.html, whose body flips between #EEF2ED and #1B2733, declares none — mobile browser UI stays default-white around the midnight form; marketing pages' navy nav likewise unmatched.
- **Ubicación:** all /Users/alexmercedes/Downloads/Ecco Webside/*.html and blog/*.html (absent); /Users/alexmercedes/Downloads/Ecco Webside/crm/index.html:8 et al (present)
- **Recomendación:** Add paired tags site-wide: marketing pages <meta name="theme-color" content="#0B1D38"> (or #FAFBFC per design intent); quote.html needs both variants: content="#EEF2ED" + content="#1B2733" media="(prefers-color-scheme: dark)".

### quote.backup.html (publicly reachable, not redirected) inherits the live D128 dark blocks over V1 markup that was never themed for them
- **Categoría:** dark-mode
- **Evidencia:** quote.backup.html:34 loads css/quote-flow.css?v=9.0 — the server serves the current file, so the live @media(prefers-color-scheme:dark) rules apply: body{background:#1B2733} (source:13142) plus --qf-* token swap on main.q-flow (source:13159-13170; page has <main class="q-flow">). Its V1 components keep hardcoded light surfaces (.qf-service-card{background:#fff}, 92 occurrences of qf-service-card in the page) while V1 text tokens like --qf-ink swap to #EFE8D7 — light-ink-inside-white-card combinations are likely; the V1 dark rules that coordinated this are all in disabled dark-DISABLED-V1-LEGACY blocks. _redirects covers quote-janitorial/quote-dayporter but NOT quote.backup.html; robots.txt allows everything except /admin/.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/quote.backup.html:33-34; /Users/alexmercedes/Downloads/Ecco Webside/css/quote-flow.source.css:13138-13172; /Users/alexmercedes/Downloads/Ecco Webside/_redirects
- **Recomendación:** Add a 301 from /quote.backup.html to /quote.html (or delete the file from the deploy). Never ship a backup page wired to a live evolving stylesheet.

## [pag-index]

### Two <h1> elements in the DOM (mobile + desktop variants of the hero title)
- **Categoría:** a11y
- **Evidencia:** <h1 class="hero-ttl-mobile"> (line 154) and <h1 class="hero-ttl-desktop"> (line 155) with near-identical text; CSS toggles display per breakpoint (.hero-ttl-mobile{display:none} default). Only one is exposed to AT at a time, but crawlers/SEO tools see 2 h1s; the only difference is a <br>.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/index.html lines 154-155
- **Recomendación:** Use one h1 and handle the line break responsively (e.g. <br class="desktop-only"> or max-width).

### Hero h1 ends in an aria-hidden word; no-JS and pre-JS users get a truncated sentence
- **Categoría:** a11y
- **Evidencia:** The rotating object of the sentence is <em class="hero-rotate"><i class="sizer" aria-hidden="true">budget.</i></em>; JS injects a visible .word-layer (main.js lines 332-355). Without JS, AT reads "A clean space should never come at the expense of your" — sentence cut off. With JS, the h1's text mutates every 3.4s (CYCLE_MS=3400) with no pause control (does respect prefers-reduced-motion). Also <em>/<i> used as styling hooks, not emphasis.
- **Ubicación:** index.html lines 154-155; js/main.js lines 317-384
- **Recomendación:** Keep a non-hidden default word in markup; add a visually-hidden static completion or sr-only text.

### 16 inline style attributes — project rule is zero
- **Categoría:** component
- **Evidencia:** grep -c 'style="' = 16: hero background (line 150: style="background-image:url('images/stock/4.webp')"), 8 industry cards (lines 289-345), 6 eco cards (lines 360-400), GTM noscript iframe (line 128, vendor boilerplate). All 15 non-GTM are .photo-card-bg/.hero-img background-image declarations.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/index.html lines 128, 150, 289, 297, 305, 313, 321, 329, 337, 345, 360, 368, 376, 384, 392, 400
- **Recomendación:** Move backgrounds to CSS classes (the .svc-bg sections already do this correctly via styles.css) or use real <img> for LCP/SEO benefit.

### 19 em dashes in HTML plus more injected by JS — brand direction bans em dashes
- **Categoría:** content
- **Evidencia:** 18 literal "—" + 1 &mdash; in index.html (title line 13 "Home — Ecco Facilities LLC", hero-sub line 156, lines 207, 213, 228, 240 "Zero missed services — guaranteed", 412, 434, footer line 526 "New York City &mdash; All 5 Boroughs", etc.). main.js pillar data injects 4 more (— in lines 41-46); chat-widget.js greetings contain several ("frequency, what's included, pricing —").
- **Ubicación:** index.html (19 occurrences); js/main.js lines 41-46; js/chat-widget.js PAGE_CONTENT
- **Recomendación:** Replace with periods, commas, or colons per PRODUCT.md voice rules.

### Title Case throughout, against sentence-case brand rule — and one h2 breaks the page's own pattern
- **Categoría:** typography
- **Evidencia:** 7 of 8 h2s are sentence case with trailing period ("Not all cleaning companies are created equal.", "Six commitments we make to every client."), but "Trusted Across Every Industry" (line 286) is Title Case with no period. CTAs/labels are Title Case: "Get Your Free Proposal", "See How It Works", "Explore Janitorial", "Email Us Directly", "What Most Companies Deliver", "The Ecco Standard", pillar labels "Fair Pricing"/"Fast Start"/"No Lock-In"/"Your Team", kicker "NYC's Eco-Certified Facility Partner", 8 cert badges.
- **Ubicación:** index.html lines 153, 158-159, 227, 236, 286, 438-458, 498-504, et al.
- **Recomendación:** Normalize "Trusted across every industry." immediately; decide sitewide on sentence case per PRODUCT.md.

### Gradient text (animated) and hero metrics row — both explicitly banned anti-patterns
- **Categoría:** anti-pattern
- **Evidencia:** .hero h1 em{background:linear-gradient(90deg,#8fd48c,#5ba8e6,#6bd568,#8fd48c);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 4s linear infinite} — the rotating hero word is animated rainbow gradient text. .step-big-num (How It Works 1/2/3) also background-clip:text gradient. Hero stats row (lines 161-166) = 4 animated count-up metrics (12+, 200+, 5, 0). Glassmorphism beyond nav: backdrop-filter on .svc-tab.active, .svc-link, .svc-img-label, .photo-card-pill (18 occurrences in styles.css).
- **Ubicación:** css/styles.css (.hero h1 em, .step-big-num); index.html lines 154-166, 411-431
- **Recomendación:** Flatten gradient text to --green/--blue solids; reconsider the metrics row per brand direction.

### Absolute/over-promising claims a lawyer would flag
- **Categoría:** content
- **Evidencia:** "Zero missed services — guaranteed" (line 240), "0 Missed Services" hero stat (line 165), "✓ Zero missed services" (line 499), "Zero VOCs, zero fragrances, zero irritants." (line 404), "100% eco-certified" (lines 156, 238, 357), JS-injected "No harsh chemicals ever enter your space" and "completely safe for children, pets, and people with allergies" (main.js lines 44). Cert badges "Green Seal Certified"/"NYC Licensed" (lines 173, 177) imply company-level certification while FAQ schema says products are certified ("Every product is Green Seal certified").
- **Ubicación:** index.html lines 156, 165, 173-180, 238-240, 357, 404, 499; js/main.js lines 41-46
- **Recomendación:** Scope claims to products ("Green Seal certified products"), and qualify absolutes or back them with a written guarantee page.

### Cert marquee: aria-label on role-less div, and infinite auto-scroll with no pause mechanism for touch users
- **Categoría:** a11y
- **Evidencia:** <div class="cert-marquee-track" aria-label="Our certifications and credentials"> — aria-label is ignored on a generic div without role. Animation: marqueeScroll 25s linear infinite; pause only via hover (animation-play-state:paused) which touch users lack — WCAG 2.2.2. prefers-reduced-motion correctly disables it.
- **Ubicación:** index.html lines 171-191; css/styles.css (.cert-marquee-track)
- **Recomendación:** Add role="list"/role="img" or drop the aria-label; add a visible pause control or pause on any pointer interaction.

### Promise Pillars: aria-expanded without aria-controls, swapped content not announced
- **Categoría:** a11y
- **Evidencia:** 6 <button class="pillar" aria-expanded> (lines 436-459) toggle a single shared #pillar-detail whose h3/p/badge are replaced via JS (main.js lines 48-61). Nothing references the panel (no aria-controls), no aria-live on #pillar-detail, and the interaction is selection (tabs), not expansion — aria-expanded is the wrong state. Detail content for pillars 1-5 exists only in JS (no-JS users see only "Fair Pricing").
- **Ubicación:** index.html lines 436-467; js/main.js lines 36-62
- **Recomendación:** Use tab semantics or aria-controls + aria-live="polite" on the detail panel.

### Nav Services dropdown: role=menu/menuitem misuse and aria-expanded never updated
- **Categoría:** a11y
- **Evidencia:** Trigger is <a href="services.html" aria-haspopup="true" aria-expanded="false"> with dropdown <div class="ddp" role="menu"> and role="menuitem" links (line 135). grep shows 0 references to ndd/haspopup in main.js — aria-expanded stays "false" forever while CSS :hover reveals the panel. ARIA menu roles imply application-menu keyboard behavior that is not implemented.
- **Ubicación:** index.html line 135; js/main.js (no handler)
- **Recomendación:** Drop menu/menuitem roles (plain nav links) and either wire aria-expanded to the open state or remove it.

### With JS disabled, major sections are permanently invisible — noscript fallback only covers .rv
- **Categoría:** structure
- **Evidencia:** <noscript><style>.rv{opacity:1;...}</style></noscript> (line 32), but .rv-left/.rv-right/.rv-scale/.rv-light all start opacity:0 in styles.css and are revealed only by JS (3s fallback in main.js). Affected: entire services showcase (.svc-showcase.rv-scale line 194), both comparison columns (.rv-left/.rv-right lines 226, 235), all 14 photo cards (.rv-scale). Hero stats also render "0" without JS (counters start at textContent 0 with data-target, lines 162-165).
- **Ubicación:** index.html lines 32, 162-165, 194, 226, 235, 288-400; css/styles.css (.rv-left/.rv-right/.rv-scale)
- **Recomendación:** Extend the noscript rule to all reveal classes; render final stat values in HTML and animate from 0 via JS instead.

### CTA nomenclature split: "Proposal" vs "Quote" for the same destination
- **Categoría:** content
- **Evidencia:** quote.html is labeled "Get Your Free Proposal →" (hero line 158, navy section line 430, cta-banner line 503, footer-cta line 512) but "Get a Free Quote" (nav line 141), "Free Quote" (floating CTA line 555), "Request a Quote" (footer line 526), "Get a free quote" (aria-label line 551, chat widget CTA). 4 distinct labels for one action.
- **Ubicación:** index.html lines 141, 158, 430, 503, 512, 526, 551-555
- **Recomendación:** Pick one term (quote.html's own System B copy says "quote") and use it everywhere.

### Design-system membership: homepage is 100% System A; every CTA hands off into System B quote.html with no bridge
- **Categoría:** dark-mode
- **Evidencia:** Page uses only System A tokens/fonts (Cormorant Garamond + DM Sans, navy #0B1D38 sections, cool cream #F3F5F8 .sec-cream, green-to-blue nav progress bar, blue/green gradients). Zero qf2/sage-warm elements. All 7 quote-bound CTAs land on quote.html's Fraunces/warm-sage #EEF2ED world with optional dark Editorial Midnight — an abrupt visual identity switch at the single most important conversion handoff. Homepage itself has no dark-mode support while quote.html auto-darkens via prefers-color-scheme.
- **Ubicación:** index.html (whole page) vs css/quote-flow.css [data-theme=dark]; DESIGN.md
- **Recomendación:** For synthesis: decide the canonical system; at minimum align CTA button styling/wording as a transition bridge.

### Footer social icons below 44px touch-target rule
- **Categoría:** a11y
- **Evidencia:** .footer-social a{width:36px;height:36px;...display:inline-flex} — 36px < the project's documented 44px minimum (nav equivalent .nm-social a is correctly 44x44).
- **Ubicación:** css/styles.css (.footer-social a); index.html lines 518-522
- **Recomendación:** Bump to 44x44 (visual icon can stay 20px).

### Schema internal contradictions: opening hours and borough naming
- **Categoría:** seo
- **Evidencia:** "openingHours": "Mo-Fr 08:00-18:00" omits Saturday, but openingHoursSpecification adds Saturday 09:00-14:00 (lines 47-51). LocalBusiness areaServed uses "The Bronx" (line 70) while both Service blocks use "Bronx" (lines 111, 120). "Borough" is also not a valid schema.org type.
- **Ubicación:** index.html lines 47-51, 65-72, 104-124
- **Recomendación:** Single source the hours; use consistent borough names with @type City or AdministrativeArea.

## [pag-services]

### Heading hierarchy skips h2→h4 in two sections (10 h4s with no h3 ancestor)
- **Categoría:** a11y
- **Evidencia:** Section "Better Together: Janitorial + Day Porter" (h2, line 183) is followed directly by five h4 card titles: "A Single Point of Contact", "The Same Dedicated Team", "Seamless Coordination", "Simplified Billing", "Complete Coverage 24/7" (lines 188-192). Section "Every Service. Every Visit. 100% Eco-Certified." (h2, line 203) → five h4s: "Safe for Employees" through "Safe for the Environment" (lines 208-212). The #services section is correct (h2→h3 panel titles→h4 subheads). Exactly one h1 (line 65) — good.
- **Ubicación:** services.html lines 183-192, 203-212 (sections #better-together and the sec-navy eco section)
- **Recomendación:** Demote the val-card h4s to h3 in both sections (or wrap with an intermediate h3). Identical val-card markup exists on other pages — fix the shared pattern.

### No <main> landmark; skip link targets a hero section
- **Categoría:** a11y
- **Evidencia:** `<a href="#main" class="skip-link">` (line 37) targets `<section class="page-hero" id="main">` (line 55). There is no `<main>` element or role="main" anywhere; all content sections are direct children of <body>. Screen-reader landmark navigation gets nav + footer only.
- **Ubicación:** services.html lines 37, 55-282
- **Recomendación:** Wrap sections from .page-hero through .cta-banner in `<main id="main">`. Likely site-wide — same shell on all marketing pages.

### "Spaces We Serve" grid duplicated verbatim in both panels — and the layout bug makes both visible stacked on desktop
- **Categoría:** content
- **Evidencia:** Identical 8-item `ind-grid` (same SVGs, same labels: Corporate Offices, Medical & Healthcare, Retail & Showrooms, Gyms & Fitness, Schools & Daycares, Restaurants & Food, Creative Studios, Residential Buildings) appears twice — lines 113-122 (janitorial panel) and 157-166 (day porter panel), 16 ind-items total, plus two identical "Spaces We Serve" h4s. Because the desktop tab/grid CSS is broken (see P1 svc-panels finding), desktop users literally scroll past the same 8 tiles twice within one screen-height.
- **Ubicación:** services.html lines 112-122 and 156-166
- **Recomendación:** Hoist a single "Spaces we serve" grid out of the panels into its own shared block, or differentiate the lists per service if there is a real difference (day porter skews lobby/Class-A; the current page claims zero differentiation).

### Voice drift vs brand direction: 12 body em dashes, Title Case headings/CTAs, and the hero says the same thing three ways in two different cases
- **Categoría:** content
- **Evidencia:** 15 lines contain "—" (12 in body copy; e.g. line 66 "in NYC — tailored to your facility", line 95 "schedule — we assign", line 204 "eco-friendly — and we don't", line 243 "your space — the size"); PRODUCT.md brand direction: no em dashes, sentence case. Title Case everywhere: h2 "Two Services. One Uncompromising Standard." (line 78), "Better Together: Janitorial + Day Porter", CTAs "Build Your Custom Package →", "Get Your Free Proposal →", badge "Two Services · Every Space · One Standard" (line 64). Internal inconsistency: hero h1 IS sentence case ("Two services. Every type of space. One uncompromising standard.", line 65) while the badge above it and the h2 directly below restate the identical message in Title Case — triple redundancy with case drift inside one viewport.
- **Ubicación:** services.html lines 64-66, 78, 183, 196, 203, 243, 251 + 12 em-dash body lines
- **Recomendación:** Pick one phrasing of the two-services message for the hero stack (badge/h1/h2 currently all say it); normalize to sentence case per PRODUCT.md; replace em dashes with periods or commas. Synthesis note: System A pages are uniformly Title Case, so this is a system-level decision, not per-page.

### Over-promising absolute claims: 100% triple-certification, "True 24/7 protection", "never looks neglected", and strip/wax bundled as standard
- **Categoría:** content
- **Evidencia:** h2 "Every Service. Every Visit. 100% Eco-Certified." (line 203); eco-note "Every product is Green Seal certified, EPA Safer Choice approved, and biodegradable" (line 125 — a compound absolute stronger than why-ecco.html's "100% Green Seal certified"); "Complete Coverage 24/7" + "True 24/7 protection" (line 192) while the page itself defines janitorial=after-hours and porter=business-hours (≠ 24/7 staffing); "ensuring your space never looks neglected" (line 169). Checklist lists "Floor stripping and waxing" (line 108) as a standard included janitorial item — in the actual business model strip/wax is separately-priced project work (turnkey), not part of recurring scope.
- **Ubicación:** services.html lines 108, 125, 169, 192, 203-204
- **Recomendación:** Soften absolutes per brand rule (no over-promising): "24/7 coverage between the two services" not "True 24/7 protection"; qualify strip/wax as an add-on/project service to match how it's actually quoted; align the certification claim wording with sustainability.html and why-ecco.html (currently three different strengths of the same claim).

### System A flourish inventory on this page: animated gradient CTA banner, 4 blurred orbs, hero metric strip, 2 side-stripe callouts (one mislabeled), unguarded pulse-dot animation
- **Categoría:** anti-pattern
- **Evidencia:** .cta-banner: `background:linear-gradient(-45deg,#0b1d38,#1e3562,#0f2847,#162d52);background-size:300% 300%;animation:gradientShift 8s ease infinite` + two radial-gradient pseudo-element orbs. Hero `.hero-bg` renders 4 `.orb` divs with `filter:blur(80px)` and 18-30s float animations (lines 57). `.hero-stats` strip (line 67: "Janitorial + Day Porter · Eco-Certified · Dedicated Teams") = hero-metrics pattern. `.eco-note{border-left:3px solid var(--green)}` side-stripe accent ×2 — and the second instance (line 168-170) contains "Why It's Different" day-porter copy, not eco content (component semantic mismatch). `.pd` pulse dot in hero badge animates infinitely and is NOT covered by the prefers-reduced-motion overrides (verified: reduced-motion block resets .orb and hero animations but not .pd). Gradient text is NOT used on this page (styles.css has 12 background-clip:text rules but only for .hero h1 em/.step-big-num, absent here); backdrop-filter on this page only via shared .nav.
- **Ubicación:** services.html lines 56-57, 64, 67, 124-126, 168-170, 241-246; css/styles.css .cta-banner, .orb, .eco-note, .pd
- **Recomendación:** For the System A→B convergence: the animated gradient banner and orbs are the loudest System A signatures on the page; the .pd reduced-motion gap is a one-line CSS fix; rename/restyle the second eco-note since it isn't eco content.

### .service-cta overrides .btn's inline-flex with inline-block on both panel CTAs, breaking the project's stated button convention
- **Categoría:** component
- **Evidencia:** `.service-cta{display:inline-block;margin-top:2rem}` (styles.css idx ~28426) comes after `.btn{display:inline-flex;align-items:center;gap:.5rem;...min-height:44px}` (idx ~11883); equal specificity, later wins, so "Request a Janitorial Quote →" (line 129) and "Request a Day Porter Quote →" (line 173) render display:inline-block — losing vertical centering and gap behavior every other .btn on the site has. Project convention: "Touch targets minimum 44px with display: inline-flex".
- **Ubicación:** services.html lines 129, 173; css/styles.css .service-cta, .btn
- **Recomendación:** Change .service-cta to only set margin-top (drop the display declaration), or make it `display:inline-flex`.

### sitemap.xml still lists the legacy quote pages that _redirects 301s away (to a param nothing reads)
- **Categoría:** seo
- **Evidencia:** sitemap.xml contains `<loc>https://eccofacilities.com/quote-janitorial.html</loc>` and `<loc>https://eccofacilities.com/quote-dayporter.html</loc>`; _redirects 301s both to `quote.html?service=...` (whose param is dead per the quote-flow finding). Search engines are told to index URLs that immediately redirect.
- **Ubicación:** sitemap.xml; _redirects; relates to services.html quote entry-point mapping
- **Recomendación:** Remove the two legacy URLs from sitemap.xml (keep the 301s for inbound links). Decide the fate of the still-deployed quote-janitorial.html/quote-dayporter.html files.

### GTM + Clarity fire pre-consent; HubSpot loads unconditionally alongside the custom chat widget (two chat systems); consent banner injects inline styles
- **Categoría:** performance
- **Evidencia:** GTM (GTM-W2ZWXZ3T, line 5) and Microsoft Clarity (w546w8zoh2, line 7) execute in <head> before js/cookie-consent.js?v=1.1 runs; cookie-consent.js shows an implied-consent banner ("By continuing, you agree...") and never gates these trackers — it only pushes `['doNotTrack']` to HubSpot's _hsq under Global Privacy Control. HubSpot (`//js-na2.hs-scripts.com/245755967.js`, protocol-relative URL, line 291) loads on all 24 pages; js/chat-widget.js (custom page-aware widget with a 'services' greeting: "Hey! 👋 Still weighing options? I can help you decide — janitorial, day porter, or both...") also loads (line 287) — if HubSpot chat is enabled in the portal, two chat launchers compete bottom-right with the .btt button. The widget greeting itself uses an emoji + em dashes (brand voice violations). cookie-consent.js builds its banner with `<div style="display:flex;gap:.5rem">` and inline onclick attributes, violating the zero-inline-style rule from shared JS.
- **Ubicación:** services.html lines 4-7, 286-292; js/cookie-consent.js; js/chat-widget.js 'services' PAGE_CONTENT
- **Recomendación:** Gate GTM/Clarity behind consent (GTM consent mode) or document the implied-consent stance in privacy.html; confirm HubSpot chat is disabled in-portal or drop one of the two chat systems; move banner styles into styles.css.

### Shared chrome a11y drift visible on this page: 36px footer social targets, ARIA menu-role misuse in nav, no aria-current
- **Categoría:** a11y
- **Evidencia:** `.footer-social a{width:36px;height:36px}` — below the project's 44px touch-target minimum (nav's .nm-social a is correctly 44px; inconsistent implementations of the same icon row). Nav "Services" link (line 42) is simultaneously a link to services.html and a dropdown trigger with `aria-haspopup="true" aria-expanded="false"` (never updated for hover-open on desktop), and the dropdown uses `role="menu"/"menuitem"` on plain navigation links (ARIA menu pattern misuse). Current page is marked only with class `nl-active`; `aria-current` appears 0 times site-wide.
- **Ubicación:** services.html lines 42, 257-261; css/styles.css .footer-social a, .nm-social a
- **Recomendación:** Bump .footer-social a to 44px; replace menu roles with plain list semantics; add aria-current="page" to the active nav link. All shared-shell fixes that propagate to every page.

### 2 inline style attributes (project rule: zero) — hero background image and GTM noscript
- **Categoría:** structure
- **Evidencia:** Line 56: `<div class="hero-img" style="background-image:url('images/stock/hero-office.webp')" role="img" aria-label="Modern office space with people working">` — own code, easily classed. Line 35: GTM noscript iframe `style="display:none;visibility:hidden"` (vendor-standard snippet). Count: 2.
- **Ubicación:** services.html lines 35, 56
- **Recomendación:** Move the hero background into a page-scoped CSS class (it's already preloaded at line 29, so CSS-ifying won't hurt LCP). The GTM one can be whitelisted as vendor code or replaced with a hidden attribute.

## [pag-service-detail]

### .svc-card-img class purged from CSS in commit 9ff3a31 but still used on both pages — images survive only via load-bearing inline styles
- **Categoría:** anti-pattern
- **Evidencia:** grep: 'svc-card-img' has 0 occurrences in css/styles.css; git show 9ff3a31^:css/styles.css has 2 occurrences — removed by 9ff3a31 'feat: immersive service tabs — full redesign from cards to Apple-style'. Both pages still ship <img class="svc-card-img" ... style="height:300px;width:100%;object-fit:cover">; rendering currently depends entirely on the inline style. Exact instance of the memorialized cross-page CSS purge trap.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/janitorial.html:75; /Users/alexmercedes/Downloads/Ecco Webside/day-porter.html:75
- **Recomendación:** Reintroduce a proper image-frame component class (or reuse an existing one) and drop the dead class name and inline styles.

### janitorial's emoji icons and literal symbol characters are exposed to screen readers; sibling page hides equivalent icons
- **Categoría:** a11y
- **Evidencia:** janitorial.html: .feature-ico emojis 📅 👥 ✅ (L87,92,97), .space-card-ico emojis 💼🏥🛍️💪📚🍽️🏠🎨 (L124-159), .included-check '✓' x10 (L107-116), .test-stars '★ ★ ★ ★ ★' (L201) — none have aria-hidden, so AT announces 'calendar', 'check mark' x10, 'black star' x5, etc. day-porter.html marks every equivalent icon aria-hidden="true" (feat-ico L83-85, handle-ico L92-99, space-ico L106-113, also-ico L186,192) but hardcodes '✓ ' inside comp-list <li> text x10 (L141-155), announced ten times.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/janitorial.html:87-201; /Users/alexmercedes/Downloads/Ecco Webside/day-porter.html:141-155
- **Recomendación:** Wrap janitorial emojis/symbols in aria-hidden spans (or migrate to the SVG icon set); move day-porter's ✓ into CSS ::before or aria-hidden span.

### In-page anchor targets land hidden under the fixed 72px nav — no scroll-margin/scroll-padding anywhere in the stylesheet
- **Categoría:** a11y
- **Evidencia:** grep for 'scroll-margin' and 'scroll-padding' in css/styles.css: 0 occurrences. .nav{position:fixed;top:0;height:72px;z-index:100}. Hero secondary CTAs 'See What's Included' → #what-included (id on the h2, janitorial.html:105) and 'See How It Works' → #how-it-works (day-porter.html:80) scroll the target to y=0 where the fixed nav covers it. Also affects skip-link #main and services.html#better-together arrivals sitewide.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/janitorial.html:65,105; /Users/alexmercedes/Downloads/Ecco Webside/day-porter.html:65,80; css/styles.css (.nav rule)
- **Recomendación:** Add html{scroll-padding-top:88px} (or scroll-margin-top on [id] targets) in styles.css.

### Touch targets below the project's 44px rule: footer social icons 36px; text links without min-height
- **Categoría:** a11y
- **Evidencia:** .footer-social a{width:36px;height:36px;...display:inline-flex} (both pages, 3 icons each) — below the documented 44px minimum (.nm-social a is correctly 44px). .consider-link and .eco-link are display:inline-flex but font-size .85-.88rem with no min-height/padding; .also-card a{color:var(--blue);font-size:.85rem} is not even inline-flex; .breadcrumb a has no sizing. Project rule: 'Touch targets minimum 44px with display: inline-flex'.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/janitorial.html:195,219,224,246-248; /Users/alexmercedes/Downloads/Ecco Webside/day-porter.html:189,195,217-219; css/styles.css (.footer-social a, .consider-link, .eco-link, .also-card a)
- **Recomendación:** Bump .footer-social a to 44px; give the arrow text links min-height:44px with inline-flex alignment.

### GTM and Microsoft Clarity load unconditionally before cookie consent; Decline does not stop already-loaded trackers
- **Categoría:** performance
- **Evidencia:** Both pages inline GTM (GTM-W2ZWXZ3T) and Clarity (w546w8zoh2) at head lines 4-7 with no consent check; js/cookie-consent.js only sets localStorage('ecco_cookies') and pushes HubSpot doNotTrack — it never gates or unloads GTM/Clarity. Banner copy says 'By continuing, you agree...' while tracking already fired. HubSpot embed (//js-na2.hs-scripts.com/245755967.js) also loads unconditionally at the page bottom. Three analytics suites total per page load.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/janitorial.html:4-7,277-280; /Users/alexmercedes/Downloads/Ecco Webside/day-porter.html:4-7,248-251; /Users/alexmercedes/Downloads/Ecco Webside/js/cookie-consent.js
- **Recomendación:** Gate GTM/Clarity/HubSpot behind the consent flag (load after accept, or use GTM consent mode); align banner copy with actual behavior.

### All content sections invisible without JavaScript: .rv sets opacity:0 with no no-JS fallback
- **Categoría:** js
- **Evidencia:** .rv{opacity:0;transform:translateY(30px);filter:blur(4px);...} applies to every content section on both pages (janitorial: 9 sections/wrappers incl. cta-banner; day-porter: 12). Reveal depends on js/main.js IntersectionObserver adding .vis. The rule is not gated behind an html.js class and neither page ships a <noscript> style fallback — if main.js fails or JS is disabled, everything below the hero renders blank.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/janitorial.html:70-229; /Users/alexmercedes/Downloads/Ecco Webside/day-porter.html:70-183; css/styles.css (.rv rule); js/main.js
- **Recomendación:** Gate .rv behind a JS-added class on <html> (e.g. .js .rv{opacity:0}) or add <noscript>.rv{opacity:1;transform:none;filter:none}</noscript>.

### Heading-level inconsistencies between sibling pages for the same template slots
- **Categoría:** a11y
- **Evidencia:** Eco section: janitorial h2 'Every Product. Every Visit. 100% Eco-Certified.' (L193) vs day-porter h3 'Eco-Friendly Every Step of the Way' (L163). Comparison: janitorial h3-only 'How Ecco Janitorial Compares to Typical Providers' inside a section with no h2 (L186) vs day-porter full h2 section 'Day Porter vs Janitorial: Understand the Difference' (L136). Testimonial: day-porter has h2 'What Day Porter Service Means to Our Clients' (L170), janitorial testimonial section has NO heading at all (L199-211). One h1 per page confirmed; no skips, but document outlines diverge for identical content.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/janitorial.html:186,193,199; /Users/alexmercedes/Downloads/Ecco Webside/day-porter.html:136,163,170
- **Recomendación:** Normalize: every major section gets an h2 (give janitorial's comparison and testimonial sections h2s; promote day-porter's eco h3).

### Copy/voice violations: Title Case headings, em dashes throughout, hyperbolic absolutes vs Editorial/Warm/Adult sentence-case brand direction
- **Categoría:** content
- **Evidencia:** Title Case h2s on both pages ('A Customized System Built for Your Space', 'Your Complete Cleaning Solution', 'Janitorial Services for Every Business Type', 'Spaces We Serve', 'Day Porter vs Janitorial: Understand the Difference') while both h1s and cta-banner h2s are sentence case — mixed convention within each page. Em dashes: 12 raw '—' + 1 &mdash; in janitorial, 19 + 1 in day-porter (titles, h1 'all day — not just after hours', body, comp-list items). Over-promising/absolutes: 'Without exception.' (janitorial h1), 'No detail is too small. No space is forgotten.' (L73), 'your facility stays flawless 24/7' (janitorial L223 AND day-porter L183), 'Day Porter + Janitorial = Perfect' (day-porter h2 L183 — equation gimmick), 'Acts like they own the place.' (day-porter L85). No urgency copy found (good).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/janitorial.html:61,73,81-230; /Users/alexmercedes/Downloads/Ecco Webside/day-porter.html:61,83-201
- **Recomendación:** If the System B voice (sentence case, no em dashes, no absolutes) is the target, rewrite headings to sentence case, replace em dashes with periods/commas, and soften 'flawless 24/7'/'= Perfect'/'Without exception'.

### Title-tag pattern divergence between siblings
- **Categoría:** seo
- **Evidencia:** janitorial.html: <title>Janitorial Services — Ecco Facilities LLC | NYC Cleaning Services</title>; day-porter.html: <title>Day Porter Services — Ecco Facilities LLC</title> — missing the '| NYC Cleaning Services' locality keyword suffix. og:title/twitter:title mirror the same inconsistency.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/janitorial.html:13,15,22; /Users/alexmercedes/Downloads/Ecco Webside/day-porter.html:13,15,22
- **Recomendación:** Standardize one title pattern across service pages (keep the NYC keyword suffix on both).

## [pag-about]

### about.html: all 4 value-card headings are malformed <h3>…</h4>
- **Categoría:** structure
- **Evidencia:** grep -n '</h4>' about.html → lines 90,91,92,93; grep '<h4' → 0 matches. Each card in 'These Aren't Slogans. They're How We Operate.' opens <h3> and closes </h4> (e.g. <h3>People Over Chemicals</h4>). HTML parser auto-recovers (the stray </h4> closes the open h3) so rendering survives, but the markup is invalid in 4 places.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/about.html lines 90-93 (section 'These Aren't Slogans. They're How We Operate.')
- **Recomendación:** Change the four closing tags to </h3>.

### CTA banner component has three competing implementations; about.html's wrapper class is defined nowhere
- **Categoría:** component
- **Evidencia:** about.html L174 uses <div class="cta-banner-actions"> — grep count in css/styles.css: 0, css/quote-flow.css: 0 (also used unstyled on blog.html, privacy.html, terms.html). The styled equivalent .cta-banner-btn{position:relative;z-index:2;margin-top:1.5rem} is used by services/accessibility/sitemap. why-ecco.html L249 reimplements the layout inline: style="margin-top:1.5rem;display:flex;gap:1rem;justify-content:center;flex-wrap:wrap". Net effect on about.html: buttons have no 1.5rem top margin and no flex gap (h2 margin-bottom is only .6rem) — visibly cramped vs the same banner on why-ecco/services. Structural drift too: about's banner is a bare top-level <div class="cta-banner"> between sections (L172) while why-ecco's is wrapped in <section class="sec sec-white"> with class rv (L246-247).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/about.html lines 172-178; /Users/alexmercedes/Downloads/Ecco Webside/why-ecco.html lines 246-254; css/styles.css (.cta-banner-btn exists, .cta-banner-actions does not)
- **Recomendación:** Define one canonical .cta-banner-actions rule (or rename to .cta-banner-btn) and use the same markup wrapper on all 8+ pages with this banner.

### Heavy copy duplication between about.html and why-ecco.html (5 distinct overlaps)
- **Categoría:** content
- **Evidencia:** (a) Green Seal sentence near-verbatim: about L90 'Every product we use is Green Seal certified, non-toxic, and biodegradable.' vs why-ecco L119 'Every product is Green Seal certified, non-toxic, and biodegradable.'; (b) team-continuity claim: about timeline #3 'We assign a consistent team to your facility. No random crew rotations. Your team is your team.' vs why-ecco promise #1 titled 'Your Team Is Your Team' — 'We assign a dedicated crew to your facility — and they stay. No random rotations.'; (c) re-clean guarantee appears 3 times across the pair: about L93 'we fix it at no charge', about L139 'we re-clean at no charge', why-ecco L198 'we'll re-clean at no charge'; (d) trust badge set duplicated in different components: about stats-bar (L163-170: Fully Insured & Bonded / Background-Checked / Satisfaction Guaranteed / 100% Green Seal Certified) = 4 of 5 items in why-ecco trust-bar (L221-243); (e) same-day response: about L92 'We solve problems the same day.' vs why-ecco promise #3 'Same-Day Response, Every Time'.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/about.html lines 90-93,118,139,163-170; /Users/alexmercedes/Downloads/Ecco Webside/why-ecco.html lines 113-139,196-198,221-243
- **Recomendación:** Differentiate the pages: about = story/people/process, why-ecco = proof/differentiation; each claim should live on exactly one page (max one appearance per claim, per the cross-section redundancy rule).

### why-ecco repeats its own absolute guarantees three times and includes an unverifiable 'Licensed in NY' badge unique to this page
- **Categoría:** content
- **Evidencia:** 'Zero/No missed services' appears in hero-stats L64 ('Zero Missed Services'), promise #4 L128 ('No Missed Services. Period.'), and comparison table L171 ('No missed services — ever'). '100% Satisfaction Guarantee' (L64) + 'Satisfaction Guaranteed' (L241); 'Same-Day Response' (L64, L123, L167). Trust item 'Licensed in NY' (L229) appears on no other public page (grep: only why-ecco + dev artifact index-reference.html) — NY has no general janitorial business license, so the claim is unverifiable and inconsistent with the rest of the site's trust set.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/why-ecco.html lines 64, 123-129, 163-171, 229, 241
- **Recomendación:** State each guarantee once; remove or substantiate 'Licensed in NY' (e.g. replace with the insured/bonded credential used elsewhere).

### Inline styles: 9 occurrences across the two pages (project rule is zero)
- **Categoría:** anti-pattern
- **Evidencia:** about.html (4): L35 GTM noscript iframe style="display:none;visibility:hidden"; L57 hero <div class="hero-img" style="background-image:url('images/stock/22-handshake.webp')">; L152 and L158 <p style="margin-top:.8rem"> in both leader cards. why-ecco.html (5): L35 GTM iframe; L57 hero style="background-image:url('images/stock/8-nyc-skyline-night.webp')"; L148 table wrapper style="max-width:960px;margin:0 auto;overflow-x:auto"; L204 <span class="sec-lbl" style="color:var(--blue-l)">; L249 CTA actions style="margin-top:1.5rem;display:flex;gap:1rem;justify-content:center;flex-wrap:wrap". cookie-consent.js also injects style="display:flex;gap:.5rem" into the banner it creates.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/about.html lines 35,57,152,158; /Users/alexmercedes/Downloads/Ecco Webside/why-ecco.html lines 35,57,148,204,249; /Users/alexmercedes/Downloads/Ecco Webside/js/cookie-consent.js line 12
- **Recomendación:** Move each into CSS classes (hero images can use per-page utility classes or <img> with object-fit; leader-card paragraph spacing belongs in .leader-card p rules).

### Brand voice violations: Title Case headings, 22 em dashes, fear/urgency meta copy, absolute over-promises
- **Categoría:** content
- **Evidencia:** Em dashes: about.html 12, why-ecco.html 10 (file-wide grep counts; brand rule: none). Title Case headings on about: 'Born from Experience, Built on Principle', 'These Aren't Slogans. They're How We Operate.', 'Great Service Doesn't Happen by Accident', 'The People Behind the Standard', card titles 'People Over Chemicals' etc.; why-ecco mixes cases within one page: Title Case 'See the Difference', 'Your Team Is Your Team', 'Transparent Pricing. Zero Surprises.' beside sentence case 'If any of this sounds familiar, you're not alone.', 'Hear from our clients'. Fear/urgency: why-ecco meta description ends 'No more cleaning nightmares.' (L14); h1 'You've been burned by cleaning companies before.' Over-promise absolutes: about L90 'We will never use a product that puts anyone's health at risk, period.'; about L91 'the 200th clean being identical to the first'.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/about.html lines 14,62,75,88,90-93,98,146; /Users/alexmercedes/Downloads/Ecco Webside/why-ecco.html lines 14,62,75,108,113-139,146,205
- **Recomendación:** Normalize all headings to sentence case, replace em dashes per brand rule, rewrite meta description and absolutes into verifiable commitments.

### about.html hotlinks Unsplash for the story image — only non-local image on the page, no dimensions
- **Categoría:** performance
- **Evidencia:** L82: <img src="https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80&fit=crop" alt="New York City skyline — Ecco Facilities serves all 5 boroughs" loading="lazy"> inside section 'Born from Experience, Built on Principle'. Sitewide grep: only about.html and index.html hotlink images.unsplash.com (1 each); every other image is local /images/stock/*.webp. No width/height attributes → CLS; third-party availability/licensing dependency; also duplicates the NYC-skyline motif already used as why-ecco's hero. Alt text contains an em dash and marketing copy rather than image description.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/about.html line 82
- **Recomendación:** Self-host a local webp (images/stock/ already has NYC skyline assets), add width/height, write a descriptive alt.

### No <main> landmark on either page; skip link targets a <section>
- **Categoría:** a11y
- **Evidencia:** grep '<main' returns 0 for both files. Skip link (L37) points to #main, which is id on <section class="page-hero"> (L56). Content lives in sibling <section> elements with no main landmark, so screen-reader 'jump to main' navigation has no target region.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/about.html lines 37,56; /Users/alexmercedes/Downloads/Ecco Webside/why-ecco.html lines 37,56 (pattern likely sitewide)
- **Recomendación:** Wrap page content (everything between nav and footer) in <main id="main">.

### Comparison table missing th scope and caption; wrapped in inline-styled scroll div
- **Categoría:** a11y
- **Evidencia:** why-ecco L149-190 ('See the Difference'): <table class="comparison-table"> with <th>Typical Provider</th><th>Ecco Facilities</th> — no scope="col", no <caption>, no aria-label; horizontal-scroll wrapper is the inline-styled div (L148) with no tabindex/role for keyboard scroll access. CSS styles td:last-child green (#2D7A32 at font-weight 600) vs td:first-child gray — meaning conveyed partly by color position.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/why-ecco.html lines 148-191
- **Recomendación:** Add scope="col" to both th, a caption ('Ecco vs typical provider'), and a focusable labeled scroll container class.

### Two competing chat systems load on both pages (custom widget + HubSpot)
- **Categoría:** js
- **Evidencia:** Both pages load js/chat-widget.js?v=4.3 (56KB custom 'guide' widget; its PAGE_CONTENT has dedicated 'about' and 'why-ecco' entries with greetings like "Hey! 👋") AND the HubSpot embed <script id="hs-script-loader" src="//js-na2.hs-scripts.com/245755967.js"> — two floating chat launchers competing for the bottom-right corner alongside the fixed .btt back-to-top button (bottom:6rem;right:2rem, positioned to dodge only one bubble). Pattern repeats on all 17 root pages. HubSpot URL is protocol-relative ('//'), a legacy anti-pattern.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/about.html lines 219-223; /Users/alexmercedes/Downloads/Ecco Webside/why-ecco.html lines 295-299; /Users/alexmercedes/Downloads/Ecco Webside/js/chat-widget.js
- **Recomendación:** Pick one chat system per page (or gate HubSpot's widget UI off where the custom widget runs) and use https:// explicitly.

### GTM and Clarity execute before/despite cookie consent; Decline only opts out of HubSpot
- **Categoría:** js
- **Evidencia:** GTM (L5) and Microsoft Clarity (L7) run synchronously in <head> on first paint. js/cookie-consent.js shows declineCookies() only calls window._hsq.push(['doNotTrack']) — no GTM consent mode, no Clarity stop. Banner text claims 'By continuing, you agree…' while tracking has already fired. GPC branch likewise only suppresses HubSpot.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/about.html lines 4-7; /Users/alexmercedes/Downloads/Ecco Webside/why-ecco.html lines 4-7; /Users/alexmercedes/Downloads/Ecco Webside/js/cookie-consent.js lines 3-8,25-32
- **Recomendación:** Load GTM/Clarity after consent or implement Google Consent Mode defaults=denied; have decline/GPC paths disable all three trackers.

### why-ecco Testimonials eyebrow: inline blue text inside the component's green-tinted pill
- **Categoría:** color
- **Evidencia:** L204: <span class="sec-lbl" style="color:var(--blue-l)">Testimonials</span>. Base .sec-lbl is the green accent component: color:var(--green); background:rgba(45,122,50,.07); border-radius:50px. The inline override recolors text to blue #4A82C7 but keeps the sage-tinted pill background — a one-off blue-vs-green accent clash inside System A, sitting on the navy section. The green-tint pill at 7% alpha over navy #0B1D38 is also nearly invisible.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/why-ecco.html line 204 (section 'Hear from our clients'); css/styles.css .sec-lbl
- **Recomendación:** Create a .sec-lbl-dark variant in CSS with coordinated text+pill colors for navy sections; remove the inline style.

### '12+ years' claim shifts meaning between company age and founder experience
- **Categoría:** content
- **Evidencia:** about.html hero badge L61 'Founded in NYC · 12+ Years of Excellence' and meta L14 '12+ years of eco-friendly facility services in NYC' read as company age; story L79 'Over 12 years later, that belief hasn't changed' (since founding); but stats-bar L164 says '12+ Years in Industry' and Alex's bio L152 'over 12 years in the facility services industry' frame the same number as personal pre-founding experience — the story explicitly says the founders 'spent years working inside the industry' BEFORE founding Ecco, so both readings can't be true simultaneously. Cross-page: index.html '12+ years of excellence', sustainability.html 'founded… over 12 years ago' (company-age reading).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/about.html lines 14,61,64,76,79,152,164; cross-ref index.html line 14, sustainability.html line 87
- **Recomendación:** Decide what 12+ counts (company founding year vs founder experience) and make badge, stats bar, bios and meta description say the same thing.

### CTA microcopy: 4 different labels for the same quote.html destination on each page
- **Categoría:** component
- **Evidencia:** On both pages, quote.html is linked 5 times with 4 labels: nav 'Get a Free Quote' (L49), hero 'Get Your Free Proposal →' (L67), CTA banner 'Request a Free Quote →' (about L175 / why-ecco L250), footer-cta 'Get Your Free Proposal &rarr;' (entity, not literal arrow — L183/259), footer contact 'Request a Quote' (L197/273). Quote vs proposal terminology also alternates within single viewports (hero button 'Proposal' above banner 'Quote').
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/about.html lines 49,67,175,183,197; /Users/alexmercedes/Downloads/Ecco Webside/why-ecco.html lines 49,67,250,259,273
- **Recomendación:** Standardize on one verb+noun pair (e.g. 'Get a free quote') sitewide; unify arrow encoding (literal vs &rarr;).

### why-ecco: 12 consecutive side-stripe cards (red then green border-left), two visually identical 6-card grids back-to-back
- **Categoría:** anti-pattern
- **Evidencia:** .pain-card{background:var(--cream);border-left:4px solid var(--red)} ×6 ('The Reality' section) directly followed by .promise-card{background:var(--wh);border-left:4px solid var(--green)} ×6 ('Our Promise' section) — same grid layout, same card anatomy (icon/check + title + text), differing only in stripe color. Side-stripe border-left accent is a flagged anti-pattern; here it is the dominant visual device of the page.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/why-ecco.html lines 77-141; css/styles.css .pain-card, .promise-card
- **Recomendación:** Differentiate the two sections structurally (e.g. compact list for pains, cards only for promises) and drop the border-left stripes.

## [pag-social-proof]

### testimonials.html: 8 inline style attributes, incl. 6 avatar gradients in 4 off-palette hues belonging to neither design system
- **Categoría:** anti-pattern
- **Evidencia:** style= census: 6x .test-av avatar gradients — linear-gradient(135deg, #2D7A32,#1a5e1f), (#8244a8,#5e2d80) purple, (#c43a5c,#8e2240) crimson, (#C87830,#9e5a1e) orange, (#3068AD,#1E3562), (#2a8a8a,#1a6060) teal — plus hero background-image (line 72) and the GTM noscript iframe. Purple/crimson/orange/teal exist in neither System A nor System B token sets. Triple-definition conflict: styles.css .test-av base (rgba(48,104,173,.25)) + page <style> .testimonials-grid-sec .test-av (navy→blue gradient) + inline style= (wins). Project rule is ZERO inline styles. careers.html has 3 (hero bg line 58, honeypot display:none line 209, GTM line 36).
- **Ubicación:** testimonials.html:51,72,130,140,150,160,170,180; careers.html:36,58,209
- **Recomendación:** Move avatar colors to CSS classes using existing tokens (or the .test-card:nth-child overrides already in styles.css); move hero background-image to a per-page class or inline <img>.

### testimonials.html: page-private <style> block — only marketing page besides index with one; duplicates and contradicts styles.css
- **Categoría:** structure
- **Evidencia:** Lines 31-44 define .filter-bar/.filter-btn (existing nowhere in css/styles.css; grep count 0) plus 6 .testimonials-grid-sec overrides. Of 10 core marketing pages, only index.html and testimonials.html contain <style> blocks (about/services/janitorial/day-porter/why-ecco/careers/sustainability/blog = 0). .testimonials-grid-sec .test-stars{color:#F59E0B} duplicates styles.css .test-stars{color:#f59e0b}; #F59E0B amber is token-less in both systems. .test-card.visible{opacity:1;transform:none} neutralizes the site-wide .rv reveal animation, making the rv/rv-d1..d3 classes on all 6 cards dead weight.
- **Ubicación:** testimonials.html:31-44,125-183
- **Recomendación:** Promote filter styles into styles.css with tokens, delete the redundant star-color rule, and either drop the rv classes from cards or let the reveal system work.

### testimonials.html: industry filter is over-engineered — exactly one testimonial per category — and lacks ARIA state
- **Categoría:** component
- **Evidencia:** 6 filter buttons (office/medical/retail/gym/school/coworking) map to exactly 6 cards, one data-industry value each; choosing any filter collapses the grid to a single card. Buttons toggle only a CSS class: no aria-pressed on .filter-btn, no aria-live region on the grid, so state and result changes are invisible to screen readers. Touch size: padding .65rem 1.5rem at font-size .82rem ≈ 37px tall (mobile media query shrinks to .5rem/1rem/.75rem ≈ 30px) — below the project's 44px minimum.
- **Ubicación:** testimonials.html:115-123 (filter-bar), :242 (inline script), :32-35 (sizes)
- **Recomendación:** Either drop the filter until there are 2+ testimonials per industry, or keep it and add aria-pressed, an aria-live=polite wrapper, and 44px min-height.

### testimonials.html: heading order skips h1→h3; person's name marked up as a heading
- **Categoría:** a11y
- **Evidencia:** h1 (line 77) is followed by <h3>James Whitfield</h3> (line 101) inside .featured-auth before the first h2 'Trusted Across Every Industry' (line 113). The featured-story section has no h2 at all (its 'Featured Story' label is a span). A client name is not a section heading.
- **Ubicación:** testimonials.html:77,101,113
- **Recomendación:** Make the featured section's label or an added title the h2, and demote 'James Whitfield' to a <p> or <cite>.

### Both pages lack a <main> landmark; id="main" sits on the hero <section>
- **Categoría:** a11y
- **Evidencia:** grep '<main' returns 0 for both files. The skip link (<a href="#main" class="skip-link">) targets <section class="page-hero" id="main"> — skip works, but there is no main landmark for AT navigation, and the 'main' region as targeted contains only the hero, not the page content.
- **Ubicación:** testimonials.html:53,71; careers.html:38,57
- **Recomendación:** Wrap page content (hero through last content section, excluding nav/footer) in <main id="main">.

### careers.html: 'Languages You Speak' checkbox group label not programmatically associated
- **Categoría:** a11y
- **Evidencia:** <label class="form-label">Languages You Speak</label> (line 294) has no for attribute and the group is a plain <div class="form-checkbox-group">, not a fieldset/legend. The 3 individual checkboxes (english/spanish/other_lang) do have proper labels, but screen-reader users tabbing to 'English' never hear the group question.
- **Ubicación:** careers.html:294-308
- **Recomendación:** Replace the wrapper with <fieldset><legend>Languages you speak</legend>...</fieldset> (the form CSS already exists; style the legend like .form-label).

### careers.html: FormSubmit endpoint exposes raw email and disables captcha
- **Categoría:** component
- **Evidencia:** action="https://formsubmit.co/info@eccofacilities.com" puts the plaintext address in markup for harvesters and lets anyone POST to the endpoint; <input type="hidden" name="_captcha" value="false"> disables FormSubmit's captcha, leaving only the _honey honeypot (line 209) as spam defense.
- **Ubicación:** careers.html:204,207,209
- **Recomendación:** Switch to FormSubmit's random-hash endpoint (they email it after first activation) and consider re-enabling _captcha or adding a server-side function, since the site already runs on Cloudflare Pages with a functions/ directory.

### Touch targets below the 44px project rule: form checkboxes 18px, .pos-link links ~20px
- **Categoría:** spacing
- **Evidencia:** css/styles.css: .form-checkbox input{width:18px;height:18px} with .88rem labels (combined row well under 44px); .pos-link{display:inline-flex;font-size:.82rem} has no min-height (~20px tall). Project rule: 'Touch targets minimum 44px with display:inline-flex'. (.btt is exactly 44px — compliant.)
- **Ubicación:** careers.html:296-307 (checkboxes), :134,144,154 (pos-link 'Apply Below ↓'); css/styles.css .form-checkbox/.pos-link
- **Recomendación:** Add min-height:44px and padding to .form-checkbox and .pos-link; enlarge the checkbox hit area via the label.

### Cross-page response-time claim conflict: '24hr' vs '24-48hr'
- **Categoría:** content
- **Evidencia:** testimonials.html:192 stats-bar tile: '24hr Response Time'. why-ecco.html:166 comparison table: '24-48hr response time'. Meanwhile index/janitorial/services say 'proposal within 24 hours' and the Alina chat CTA bar hardcodes 'Start your free quote · 24-hour turnaround'. A prospect comparing pages sees different SLAs.
- **Ubicación:** testimonials.html:192; why-ecco.html:166; janitorial.html:231; services.html:243; index.html:95,422; js/chat-widget.js (cta-bar string)
- **Recomendación:** Standardize one SLA (e.g. '24-hour proposal') everywhere; confirm the number with Alex first per memory rule on times.

### testimonials.html: three different CTA labels for the same quote.html destination on one page
- **Categoría:** content
- **Evidencia:** nav: 'Get a Free Quote'; hero + footer-cta: 'Get Your Free Proposal →'; cta-banner: 'Request a Free Quote →'; footer column: 'Request a Quote'. Four phrasings, one target. careers.html adds 'Request a Free Quote →' (client-cta line 327).
- **Ubicación:** testimonials.html:64,82,198,205,219; careers.html:327,334
- **Recomendación:** Pick one verb+noun pair ('Get a free quote' fits the brand's sentence-case direction) and reuse it for every quote.html CTA.

### careers.html: mid-page section pivots audience from applicant to client with no transition
- **Categoría:** content
- **Evidencia:** Section 'This is why your Ecco team is different.' (line 194) speaks to clients: 'Every person who enters your facility...', 'gives you consistent, reliable service' — sandwiched between the applicant timeline ('How It Works') and the application form ('Apply Now'). The page already has a dedicated client exit at the end ('Looking for service, not a job?', line 325).
- **Ubicación:** careers.html:192-197
- **Recomendación:** Rewrite the message-sec copy for applicants (e.g. why low turnover benefits THEM) or fold its client-facing claim into the existing client-cta section.

## [pag-green]

### Stray unstyled <h2>Conformance Status</h2> inside .subsection — no CSS rule exists for it
- **Categoría:** structure
- **Evidencia:** accessibility.html:79 uses <h2>Conformance Status</h2> inside .legal-content .subsection. styles.css contains `.subsection h3{font-family:var(--fd);font-size:1.35rem;font-weight:600;color:var(--navy)}` but NO `.subsection h2` rule and no bare h2 element rule (verified by rule extraction) → renders browser-default ~1.5em bold DM Sans, visually mismatching the five sibling subsections that correctly use h3 ('Technologies Used', 'Known Limitations', 'Feedback', 'Enforcement Procedure', 'Assessment and Review' at lines 107,112,121,131,136).
- **Ubicación:** accessibility.html:79 vs 107,112,121,131,136; css/styles.css .subsection h3
- **Recomendación:** Change line 79 to <h3> to match its siblings (it is the same .subsection pattern).

### Hero asserts achieved 'WCAG 2.1 AA' while body copy only commits to 'aim to conform'
- **Categoría:** content
- **Evidencia:** hero-badge: 'WCAG 2.1 AA · Inclusive by Design' (line 59); hero-stats: 'WCAG 2.1 AA / Keyboard Accessible / Screen Reader Ready' (line 62) — stated as fact. Body: 'We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA' (line 80). Given the verified failures on this very page (heading skip, missing main landmark, menu-role misuse), the hero claim is an overstatement with ADA-statement legal exposure.
- **Ubicación:** accessibility.html:59,62 vs 80
- **Recomendación:** Soften hero badge/stats to aspiration ('Working toward WCAG 2.1 AA') or fix the failures before claiming the level.

### Boilerplate 'payment processors' listed as a known limitation — site has no payments
- **Categoría:** content
- **Evidencia:** Known Limitations: 'Some widgets (chat, payment processors) may not be fully accessible.' (line 115). The site is quote-based (EmailJS/HubSpot/Mailchimp); no payment processor exists anywhere in the repo's public pages.
- **Ubicación:** accessibility.html:115
- **Recomendación:** Replace with the site's real third-party surfaces: HubSpot chat/tracking, Mailchimp newsletter form, GTM/Clarity, embedded quote tooling.

### Inline styles: 5 on sustainability, 2 on accessibility (project rule is ZERO)
- **Categoría:** component
- **Evidencia:** sustainability.html — 35: style="display:none;visibility:hidden" (GTM noscript), 57: style="background-image:url('images/stock/12-green-products.webp')", 76: style="margin-top:1.2rem", 208: style="padding:4rem 3.5rem" (on a section), 219: style="position:relative;z-index:2" (hack also copy-pasted in janitorial.html, day-porter.html, index-reference.html, font-compare.html). accessibility.html — 34: GTM noscript, 55: style="background-image:url('images/stock/hero-office.webp')".
- **Ubicación:** sustainability.html:35,57,76,208,219; accessibility.html:34,55
- **Recomendación:** Move hero backgrounds to per-page CSS classes or CSS custom property, create utility classes for the spacing/z-index hacks; GTM noscript can keep its vendor snippet or be classed.

### Over-promising absolutes and fear copy on sustainability (FTC Green Guides risk; brand says no over-promising/urgency)
- **Categoría:** content
- **Evidencia:** 'Zero VOCs' (hero-stats, line 64) vs body 'No VOCs' (124); 'Every product is non-toxic to animals — no exceptions.' (139); 'Hospital-level disinfection through safer formulations' (134) — EPA Safer Choice products are generally not hospital-grade disinfectants; 'Ecco was founded to eliminate this problem entirely.' (78); fear-lead h2 'The products cleaning your facility right now might be making people sick.' (75).
- **Ubicación:** sustainability.html:64,75,78,134,139
- **Recomendación:** Qualify claims (low-VOC, certified-safer formulations, 'healthcare-appropriate protocols'), and keep the problem framing factual rather than alarmist.

### Certification claim ambiguity: company-level 'Green Seal Certified' badge vs product-level body copy
- **Categoría:** content
- **Evidencia:** Hero badge 'Green Seal Certified · EPA Safer Choice' (line 61) and meta description '...Green Seal and EPA Safer Choice certified.' (14,16,23) read as company certifications; body correctly scopes to products ('every product must be independently certified as safe', line 87). Sitewide variants for cross-compare: 'Green Seal Certified' x8, 'Green Seal Eco-Certified' x2 (why-ecco.html, index-reference.html), blog cites 'ISSA CIMS (Cleaning Industry Management Standard) certification' as a buying criterion Ecco itself never claims.
- **Ubicación:** sustainability.html:14,16,23,61 vs 87; why-ecco.html; blog/choose-commercial-cleaning-company-nyc.html
- **Recomendación:** Standardize phrasing sitewide to 'Green Seal certified products / EPA Safer Choice products' unless Ecco holds a company-level certification.

### Star rating is bare text '★ ★ ★ ★ ★' with no accessible name — inconsistent with index.html's accessible pattern
- **Categoría:** a11y
- **Evidencia:** sustainability.html:210 <div class="stars">★ ★ ★ ★ ★</div> — screen readers announce five 'star' glyphs with no rating semantics. index.html uses <div class="trust-quote-stars" role="img" aria-label="5 out of 5 stars"> for the same content. Color is hardcoded #f59e0b (`.testimonial-banner .stars{color:#f59e0b}`), not a System A token.
- **Ubicación:** sustainability.html:210; css/styles.css .testimonial-banner .stars
- **Recomendación:** Adopt the index pattern: role="img" aria-label="5 out of 5 stars" with aria-hidden glyphs; tokenize the amber or reuse an existing accent.

### CTA banner markup forked: sustainability uses two identical buttons joined by loose ' or ' text inside an inline-styled div
- **Categoría:** structure
- **Evidencia:** sustainability.html:219 <div style="position:relative;z-index:2"><a href="quote.html" class="btn btn-white">Request a Free Quote →</a> or <a href="mailto:info@eccofacilities.com" class="btn btn-white">Email us →</a></div> — only page sitewide with '</a> or <a' (grep → 1 file). Canonical pattern (.cta-email span + .cta-banner-btn div, both styled in styles.css) is used by accessibility.html:145-146, services.html, sitemap.html. Two same-styled btn-white CTAs also flatten hierarchy.
- **Ubicación:** sustainability.html:216-220 vs accessibility.html:142-147
- **Recomendación:** Convert sustainability's banner to the .cta-email/.cta-banner-btn pattern and demote the email link to text style.

### val-card component typography forks by page: h3/DM Sans-700 vs h4/Cormorant-600
- **Categoría:** component
- **Evidencia:** CSS contains both `.val-card h3{font-family:var(--fb);font-size:1.15rem;font-weight:700;color:var(--navy);letter-spacing:-.01em}` and `.val-card h4{font-family:var(--fd);font-size:1.1rem;font-weight:600;color:var(--navy)}`. about.html renders val-cards with h3 (h4 count 0); accessibility.html (8x h4), services.html (16 h4), sitemap.html (7 h4), index-reference.html (7 h4) use h4 — the same card reads sans-bold on About and serif-regular on Accessibility/Services.
- **Ubicación:** accessibility.html:93-100; about.html; services.html; sitemap.html; css/styles.css
- **Recomendación:** Pick one heading level (h3 fits both pages' outlines) and delete the orphan rule so the component renders identically everywhere.

### GTM, Clarity and HubSpot load pre-consent; consent banner only gates after the fact
- **Categoría:** performance
- **Evidencia:** GTM (GTM-W2ZWXZ3T) and Clarity (w546w8zoh2) execute synchronously in <head> (lines 4-7 both pages); HubSpot loader //js-na2.hs-scripts.com/245755967.js is unconditional (sustainability:265, accessibility:191). cookie-consent.js only honors GPC and writes localStorage post-choice; banner text says 'By continuing, you agree...' after trackers already fired. cookie-consent.js also injects an inline style (<div style="display:flex;gap:.5rem">) violating the zero-inline-style rule.
- **Ubicación:** sustainability.html:4-7,263-265; accessibility.html:4-7,189-191; js/cookie-consent.js
- **Recomendación:** Defer Clarity/HubSpot behind consent (GTM Consent Mode default-denied), and move the banner's inline flex style into the .cookie-banner CSS.

### Heading case drifts between Title Case and sentence case within and across both pages (brand = sentence case)
- **Categoría:** typography
- **Evidencia:** sustainability.html mixes sentence-case h1/h2 ('The cleanest spaces in New York are also the safest.', 'When we say safe, we mean everyone.') with Title Case h2 '100% Eco-Certified. Every Product. Every Visit. Since Day One.' (86) and 'Third-Party Certified. Independently Verified.' (94). accessibility.html headings are mostly Title Case: 'Digital Accessibility for Everyone', 'Measures We Take', 'Conformance Status', 'Technologies Used', 'Known Limitations', 'Enforcement Procedure', 'Assessment and Review' — while its h1 is sentence case. Spaced em dashes: 8 occurrences on sustainability (4 in body copy, e.g. 'respiratory conditions — and', 'animals — no exceptions'), 7 on accessibility (e.g. 'everyone — regardless of ability', 'Third-party content — Some widgets') vs brand 'no em dashes'.
- **Ubicación:** sustainability.html:62,75,86,94,118,156,174; accessibility.html:60,73,79,88,107,112,131,136
- **Recomendación:** Normalize all headings to sentence case and replace spaced em dashes with periods/commas per PRODUCT.md voice.

### No <main> landmark on either page; skip-link targets a <section>
- **Categoría:** a11y
- **Evidencia:** grep '<main' → 0 in both files. <a href="#main" class="skip-link"> points to <section class="page-hero" id="main"> (sustainability:56, accessibility:54); all page content lives in sibling <section>/<div> elements with no main/contentinfo-complementary structure beyond nav and footer.
- **Ubicación:** sustainability.html:37,56; accessibility.html:36,54
- **Recomendación:** Wrap hero-through-CTA content in <main id="main"> on every page.

## [pag-blog-index]

### blog.html card internals unstyled: .blog-card-date and .blog-card-link have zero CSS rules
- **Categoría:** component
- **Evidencia:** 7 cards each use `<div class="blog-card-date">` and `<a class="blog-card-link">Read Article →</a>`. css/styles.css occurrence counts: .blog-card-date=0, .blog-card-link=0 (while .blog-card, .blog-card h3, .blog-card p are styled). Dates render at full body size/color instead of the small muted treatment used by every styled date elsewhere (.more-articles-card span{font-size:.75rem;color:var(--tm)}); the CTA link relies on the global a{color:var(--blue-l)} with no underline, no margin separation, and no 44px touch target (project rule: min 44px with display:inline-flex).
- **Ubicación:** blog.html lines 71-112 (7 cards)
- **Recomendación:** Add .blog-card-date and .blog-card-link rules (or rename to existing styled classes); give the link a ≥44px inline-flex touch target.

### blog.html heading order skips h1→h3; the page's only h2 is the CTA banner after the article list
- **Categoría:** a11y
- **Evidencia:** Heading inventory: 1 h1 ("Insights for Better Facilities"), 11 h3, 1 h2. DOM order: h1 → 7× card h3 ("How to Choose the Right Commercial Cleaning Company in NYC" etc.) → h2 "Have a question about your facility? We're here to help." → 4× footer h3. The #articles section has no h2 landmark naming the list. Posts are fine (h1 → h2 sections → h3).
- **Ubicación:** blog.html lines 62, 73-109, 117
- **Recomendación:** Add a (visually hidden if desired) h2 like "Latest articles" on the #articles section, or demote card headings consistently.

### 7 identical 'Read Article →' link texts on blog.html; card titles are not part of the link
- **Categoría:** a11y
- **Evidencia:** Each card: `<h3>title</h3>...<a href="blog/..." class="blog-card-link">Read Article &rarr;</a>` — the anchor text is identical 7 times (WCAG 2.4.4 link purpose; screen-reader link list is 7× "Read Article"). Contrast: post related-links wrap the whole card incl. the h3 in the anchor (good). Bonus inconsistency: cards 1-2 use the entity `&rarr;`, cards 3-7 use literal `→` — evidence of two authoring passes.
- **Ubicación:** blog.html lines 75, 81, 87, 93, 99, 105, 111
- **Recomendación:** Wrap the whole card in the anchor (matching the post pattern) or add aria-label/visually-hidden title text to each link; normalize arrow encoding.

### Blog copy violates brand direction: Title Case everywhere and 37 em dashes across the 4 audited pages
- **Categoría:** content
- **Evidencia:** Em-dash counts (— char incl. '— Ecco Facilities' title separators): blog.html=5, 5-signs=8, janitorial-vs-day-porter=15, eco-certified=9. Body examples: "that's not a sign of quality — it's a sign of volume" (5-signs line 78); "Your facility needs to be clean — that's not the question" (janitorial line 69); "This isn't a minor side effect — it's a health problem you're creating" (eco line 77); card copy "taking shortcuts with your facility — and what it means for your business" (blog.html line 98). All headings/cards/CTAs are Title Case ("Insights for Better Facilities", "The Key Difference: Scheduled vs. Real-Time") vs PRODUCT.md sentence-case direction. Per-direction this is System A legacy voice; flagged for cross-system reconciliation.
- **Ubicación:** blog.html, blog/5-signs-cleaning-company.html, blog/janitorial-vs-day-porter.html, blog/eco-certified-cleaning-matters.html (site copy throughout)
- **Recomendación:** Decide whether brand direction (sentence case, no em dashes) applies to the marketing site; if yes, batch-edit blog titles/copy — note title-tag em dashes also affect SERP display.

### System A anti-pattern stack on blog pages: animated gradient CTA banner, pulse-dot hero badge, blurred orbs, 100vh hero on a listing page, keyword 'hero-stats'
- **Categoría:** anti-pattern
- **Evidencia:** .cta-banner{background:linear-gradient(-45deg,#0b1d38,#1e3562,#0f2847,#162d52);background-size:300% 300%;animation:gradientShift 8s ease infinite} on all 4 pages; .pd{...animation:pulse 2.5s infinite} in blog.html hero-badge "Ecco Blog · Insights & Tips"; 4 .orb divs (filter:blur(80px), orbFloat 20s) per hero; blog.html uses full .page-hero{min-height:100vh} pushing all 7 articles below the fold; .hero-stats component filled with keywords, not stats: `<span>Expert Advice</span><span>Facility Management</span><span>Healthier Workspaces</span>` (line 64). Nav glassmorphism backdrop-filter:blur(20px) saturate(1.2) on all pages. All conflict with the Editorial/Warm/Adult, no-gradient direction; zero System B (sage/cream/Fraunces) presence in this area.
- **Ubicación:** blog.html lines 56-66, 116-121; cta-banner + page-hero-short on all 3 posts; css/styles.css .cta-banner/.orb/.pd/.page-hero
- **Recomendación:** For synthesis: blog area is wholly System A; if redesign proceeds, the CTA banner gradient animation and orb/pulse decorations are the highest-visibility tokens to retire; replace blog hero-stats keywords with real stats or remove.

### Inline style attributes: 12 across the 4 pages (project rule is zero)
- **Categoría:** structure
- **Evidencia:** blog.html (3): hero `style="background-image:url('images/stock/23-coworking-space.webp')"`, section `style="background:var(--wh)"` (load-bearing — .sec has no background rule), GTM noscript iframe `style="display:none;visibility:hidden"`. Each post (3 ea.): image wrapper `style="margin-bottom:2.5rem;border-radius:var(--rl);overflow:hidden"`, `<img ... style="width:100%;height:300px;object-fit:cover">`, + GTM iframe. Same pattern in the other 4 posts (total 24 in blog area).
- **Ubicación:** blog.html lines 35, 57, 69; blog/5-signs-cleaning-company.html lines 36, 68; blog/janitorial-vs-day-porter.html lines 36, 68; blog/eco-certified-cleaning-matters.html lines 36, 68
- **Recomendación:** Create .article-hero-img component classes (base+mobile+desktop per project rules); keep GTM iframe as documented boilerplate exception or class it.

### Nav dropdown ARIA misuse (site-wide, present on all 4 pages)
- **Categoría:** a11y
- **Evidencia:** `<a href="services.html" class="nl" aria-haspopup="true" aria-expanded="false">` — a link that both navigates and claims popup semantics; aria-expanded is static in markup; dropdown uses role="menu"/role="menuitem" (application-menu pattern) for plain navigation links. Project rule requires viewport-aware ARIA via matchMedia; the desktop hover dropdown vs mobile drawer share the same static attributes.
- **Ubicación:** blog.html line 43; blog/*.html line 44 (identical nav partial on every page)
- **Recomendación:** Drop role=menu/menuitem (use plain list semantics), toggle aria-expanded in JS per viewport, or split trigger from link. Fix once in the shared nav partial.

### Analytics fire before consent; script loading inconsistent between index and posts
- **Categoría:** performance
- **Evidencia:** GTM (GTM-W2ZWXZ3T) and MS Clarity (w546w8zoh2) execute synchronously in <head> on all 4 pages while cookie-consent.js?v=1.1 loads at the end of <body> — consent cannot gate them; HubSpot (245755967.js) also loads unconditionally. Loading drift: posts use `<script src="../js/main.js?v=4.6" defer>` and chat-widget defer, blog.html (and index/about/services) load the same scripts without defer.
- **Ubicación:** blog.html lines 5-7, 161-165; all 3 posts lines 5-7, 155-160
- **Recomendación:** Gate GTM/Clarity/HubSpot behind the consent state (or document why not); normalize defer usage across all pages.

## [pag-blog-posts]

### Template drift: end-block order swapped in choose- post (cta-banner before more-articles)
- **Categoría:** structure
- **Evidencia:** choose-commercial-cleaning-company-nyc.html: <div class="cta-banner"> at line 137, <div class="more-articles"> at line 144 (CTA first). The other 3 posts: more-articles first, then cta-banner (checklist 111/127, dirty-office 103/119, benefits 132/148). CTA copy also drifts: choose uses "Ready to find the right cleaning partner for your facility?" + "Request a Free Walkthrough →" while the other 3 share identical "Ready for a cleaning company that does it right?" + "Request a Quote →".
- **Ubicación:** blog/choose-commercial-cleaning-company-nyc.html lines 137-158 vs blog/commercial-cleaning-checklist-nyc.html lines 111-132, blog/dirty-office-costs-productivity.html lines 103-124, blog/benefits-day-porter-high-traffic-buildings.html lines 132-153
- **Recomendación:** Standardize post template order (article → more-articles → cta-banner) and pick one CTA heading/button pattern, allowing only the button label to vary contextually.

### In-article closing CTA pattern varies 4 ways; contextual internal links range 1 to 5 per post
- **Categoría:** content
- **Evidencia:** choose: NO closing promo, zero "Ecco" mentions in body, 4 contextual links (sustainability, janitorial, day-porter, why-ecco). checklist: promo paragraph "At Ecco Facilities, we build customized cleaning programs…" + 1 contextual link total (quote.html). dirty-office: promo paragraph + 1 link total (quote.html). benefits: 5 links (day-porter, janitorial, testimonials, services, quote) + bold standalone CTA line "<strong>Ready to see what a day porter can do for your building?</strong>". Four different end-of-article conventions across four posts.
- **Ubicación:** blog/choose-commercial-cleaning-company-nyc.html lines 130-133; blog/commercial-cleaning-checklist-nyc.html line 107; blog/dirty-office-costs-productivity.html line 99; blog/benefits-day-porter-high-traffic-buildings.html lines 126-128
- **Recomendación:** Define one closing convention (e.g. 2-3 contextual links per post + a single plain promo paragraph) and retrofit; checklist and dirty-office especially need contextual links to service pages.

### Stale "More Articles" network: the 3 newest posts receive zero inbound links from sibling posts
- **Categoría:** seo
- **Evidencia:** Inbound sibling-post link counts: choose-commercial-cleaning-company-nyc.html ← 0, dirty-office-costs-productivity.html ← 0, benefits-day-porter-high-traffic-buildings.html ← 0; vs 5-signs ← 4, janitorial-vs-day-porter ← 4, checklist ← 3, eco-certified ← 3. All recommendation slots in all 7 posts point at the older March/February posts; nothing was updated when the April 4-5 posts shipped. The 3 newest posts are reachable only from blog.html.
- **Ubicación:** more-articles blocks: blog/choose-commercial-cleaning-company-nyc.html lines 144-158; blog/commercial-cleaning-checklist-nyc.html lines 111-125; blog/dirty-office-costs-productivity.html lines 103-117; blog/benefits-day-porter-high-traffic-buildings.html lines 132-146 (and the 3 older posts' blocks)
- **Recomendación:** Rebalance More Articles so each post gets at least 1-2 inbound recommendations; obvious pairs: benefits-day-porter ↔ janitorial-vs-day-porter, choose ↔ 5-signs, dirty-office ↔ checklist.

### Inline styles: 3 per post, 12 total (project rule is zero)
- **Categoría:** anti-pattern
- **Evidencia:** Each post contains exactly 3 style= attributes: style="margin-bottom:2.5rem;border-radius:var(--rl);overflow:hidden" (hero figure div) and style="width:100%;height:300px;object-fit:cover" (hero img), both on line 68 of every post, plus GTM noscript boilerplate style="display:none;visibility:hidden" (line 36). The two hero-figure styles are author-added and identical across all 4 posts — clearly a missing .article-hero-img component class.
- **Ubicación:** blog/choose-commercial-cleaning-company-nyc.html lines 36,68; blog/commercial-cleaning-checklist-nyc.html lines 36,68; blog/dirty-office-costs-productivity.html lines 36,68; blog/benefits-day-porter-high-traffic-buildings.html lines 36,68
- **Recomendación:** Create an .article-hero-img class in styles.css (base+mobile+desktop) and replace the 8 author-added inline styles; GTM noscript style is vendor boilerplate and can be exempted explicitly.

### Cited sibling post has conflicting dates: "February 28, 2026" citations vs schema 2026-03-22
- **Categoría:** content
- **Evidencia:** checklist and benefits posts both render <div class="article-link-date">February 28, 2026</div> for janitorial-vs-day-porter.html. That target post's own byline says "February 28, 2026" but its BlogPosting schema says "datePublished":"2026-03-22" — a 22-day internal conflict. My pages propagate the byline side; whichever is corrected, these two citation blocks (and blog.html, which also shows February 28) must follow. No future dates anywhere; all 7 posts' dates precede today (2026-06-10).
- **Ubicación:** blog/commercial-cleaning-checklist-nyc.html line 120; blog/benefits-day-porter-high-traffic-buildings.html line 141; root defect in blog/janitorial-vs-day-porter.html (byline vs line with datePublished)
- **Recomendación:** Fix the source post's schema/byline mismatch first, then sweep all article-link-date citations (2 in my pages + blog.html) to match.

### Voice drift vs PRODUCT.md: Title Case headings throughout and em dashes in all titles/descriptions
- **Categoría:** content
- **Evidencia:** Every h2 in all 4 posts is Title Case, e.g. "Verify Insurance and Bonding", "Look for Transparent, Flat-Rate Pricing", "Daily Cleaning Tasks", "Sick Days Add Up Fast", "Clutter and Dirt Kill Focus", "Real-Time Response to Spills and Messes", "Get a Day Porter for Your Building" (33 h2s total) — brand direction is sentence case. Em dashes: choose post has 7 in head metadata ("…in NYC — Ecco Facilities" in title/og/twitter; "…signing a contract — from certifications to pricing transparency." in description/og/twitter/schema); the other 3 posts have 3 each (title pattern); plus "New York City &mdash; All 5 Boroughs" in every footer (4 occurrences). Body paragraphs are clean — zero em dashes in article copy across all 4 posts.
- **Ubicación:** All h2 elements and head metadata lines 13-32 in the 4 post files; footer contact column (line 177/151/143/172 respectively)
- **Recomendación:** Decide whether the editorial sentence-case/no-em-dash direction applies to System A marketing pages; if yes, retitle h2s to sentence case and swap em dashes for periods/commas in titles and meta descriptions (keep "— Ecco Facilities" only if adopted as the official title-separator convention site-wide).

### CTA promise/destination mismatch: "day porter quote form" links to generic quote.html; over-promise close
- **Categoría:** content
- **Evidencia:** benefits post: "<a href=\"../quote.html\">Fill out our day porter quote form</a>" — quote.html is the generic V2 wizard, not a day-porter form. A dedicated quote-dayporter.html exists but is orphaned (linked only from quote-janitorial.html and itself). Same paragraph closes with "have your porter on-site faster than you expect" — unverifiable speed promise, urgency-adjacent copy the brand direction prohibits.
- **Ubicación:** blog/benefits-day-porter-high-traffic-buildings.html line 128
- **Recomendación:** Either relabel to "request a quote" or deep-link the wizard with day-porter preselected; rewrite the closing promise to something verifiable (e.g. "we typically respond within one business day" if true and Alex-confirmed).

### Five different quote-CTA phrasings on each single post page
- **Categoría:** content
- **Evidencia:** On every post, the same quote.html destination is labeled: "Get a Free Quote" (nav), "Request a Quote →" or "Request a Free Walkthrough →" (cta-banner), "Get Your Free Proposal →" (footer-cta), "Request a Quote" (footer contact column), and in-article "reach out for a free quote"/"request a free quote"/"Fill out our day porter quote form". 5 distinct labels per page for one action.
- **Ubicación:** All 4 posts: nav line 50, cta-banner block, footer-cta (footer top), footer contact column, in-article closing links
- **Recomendación:** Pick one primary verb pair (e.g. "Get a free quote" / "Request a walkthrough") and apply across nav, banners, and footers site-wide.

## [pag-legal-util]

### 404.html lacks noindex and carries a self-referential canonical; social meta block is partial
- **Categoría:** seo
- **Evidencia:** 404.html has NO <meta name="robots"> (grep confirms zero robots meta on all 4 pages) and line 16 sets <link rel="canonical" href="https://eccofacilities.com/404.html">. A direct request to /404.html returns HTTP 200 on Cloudflare Pages, so the error page is crawlable and canonical-confirmed. Meta block has og:title only (line 15) — missing og:description, og:url, og:image, twitter:* present on every other page; no JSON-LD (acceptable). Nav and both CTAs work (index.html, quote.html exist); footer link set is complete.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/404.html lines 13-16
- **Recomendación:** Add <meta name="robots" content="noindex"> and drop the canonical; optionally complete the og/twitter block for consistency.

### Orphan class .cta-banner-actions has zero CSS rules — privacy/terms CTA banner uses different, unstyled markup vs sitemap's styled .cta-banner-btn
- **Categoría:** component
- **Evidencia:** grep '\.cta-banner-actions' css/styles.css = 0 matches; the full .cta-banner rule set contains only .cta-banner, ::before/::after, h2, p, and .cta-banner-btn{position:relative;z-index:2;margin-top:1.5rem}. Yet <div class="cta-banner-actions"> wraps the banner buttons on 11 pages: privacy.html:183, terms.html:211, about.html, blog.html, and all 7 blog posts. sitemap.html:155 instead uses <div class="cta-banner-btn">. Result: two competing markups for the same System A banner; on the 11 pages the button row has no flex/gap/top-margin styling and buttons sit at z-index auto under the ::before/::after orbs.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/privacy.html:183; /Users/alexmercedes/Downloads/Ecco Webside/terms.html:211; /Users/alexmercedes/Downloads/Ecco Webside/sitemap.html:155; css/styles.css (.cta-banner rules); +8 more pages
- **Recomendación:** Pick one wrapper class, add a real rule (flex, gap, margin-top, z-index:2), and normalize all 12 usages.

### No <main> landmark on any of the 4 pages; skip-link targets the decorative hero section
- **Categoría:** a11y
- **Evidencia:** grep '<main' privacy.html terms.html sitemap.html 404.html = 0 on all. Each page's skip link (<a href="#main" class="skip-link">Skip to main content</a>) points to <section class="page-hero" id="main"> — the hero with background photo, orbs and badges — not the content. Content sections are bare <section>/<div> children of <body>.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/privacy.html:37,56; /Users/alexmercedes/Downloads/Ecco Webside/terms.html:37,56; /Users/alexmercedes/Downloads/Ecco Webside/sitemap.html:38,56; /Users/alexmercedes/Downloads/Ecco Webside/404.html:27,46
- **Recomendación:** Wrap page content in <main id="main"> (hero can stay inside or above it) so the skip link and screen-reader landmark navigation land on real content.

### Heading-level skips on all 4 pages (h1→h3 on legal pages, h2→h4 ×7 on sitemap, h1→h3 on 404)
- **Categoría:** a11y
- **Evidencia:** privacy.html and terms.html: h1 (line 62) → h3 "Table of Contents" (line 78) before the first h2 "1. Information We Collect"/"1. Services Overview". sitemap.html: h2 "Everything in One Place" (line 75) → h4 cards "Services","Company","Resources","Get Started" (lines 82,91,101,112) and h2 "Policies & Legal" (line 126) → h4 "Privacy Policy","Terms of Service","Accessibility" (lines 132,138,144) — no h3 anywhere in main content. 404.html: h1 "Page Not Found" (line 49) → footer h3s with no h2 on the page.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/privacy.html:78; /Users/alexmercedes/Downloads/Ecco Webside/terms.html:78; /Users/alexmercedes/Downloads/Ecco Webside/sitemap.html:82,91,101,112,132,138,144; /Users/alexmercedes/Downloads/Ecco Webside/404.html:49
- **Recomendación:** Demote the TOC heading to h2 (or aria-labelled nav), promote sitemap card headings to h3, and keep one logical level per step.

### Hero pseudo-metrics (trust-badge spans) on legal/utility pages, two of nine values false
- **Categoría:** anti-pattern
- **Evidencia:** hero-stats spans: privacy.html:64 "Your Data Protected · CCPA Compliant · No Data Selling"; terms.html:64 "Transparent Terms · Satisfaction Guarantee · Fully Insured"; sitemap.html:64 "20+ Pages · 6 Sections · Always Updated". "CCPA Compliant" and "Always Updated" are demonstrably false (see P1 findings); the rest are marketing assertions styled as metrics (.hero-stats, rgba(255,255,255,.6), 0.8rem/600) inside the System A hero-metrics pattern. Also full marketing hero treatment (background photo via inline style, 4 animated .orb divs, uppercase .hero-badge pill) on Privacy/Terms — pages where users come to read a document.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/privacy.html:56-69; /Users/alexmercedes/Downloads/Ecco Webside/terms.html:56-69; /Users/alexmercedes/Downloads/Ecco Webside/sitemap.html:56-69; /Users/alexmercedes/Downloads/Ecco Webside/404.html:46-56 (orbs only)
- **Recomendación:** Strip hero-stats from legal pages (or replace with verifiable facts: effective date, jurisdiction); tone legal heroes down to a simple title block.

### 7 inline style attributes across the 4 pages plus a JS-injected inline style on every page — project rule is zero
- **Categoría:** anti-pattern
- **Evidencia:** privacy.html:35,57; terms.html:35,57; sitemap.html:36,57; 404.html:25. Two patterns: GTM noscript iframe style="display:none;visibility:hidden" (4×) and hero-img style="background-image:url('images/stock/…webp')" (3×). Additionally js/cookie-consent.js line 12 injects <div style="display:flex;gap:.5rem"> into the cookie banner on all ~26 pages.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/privacy.html:35,57; terms.html:35,57; sitemap.html:36,57; 404.html:25; /Users/alexmercedes/Downloads/Ecco Webside/js/cookie-consent.js:12
- **Recomendación:** Move hero images to per-page CSS classes or a CSS custom property; add a .cookie-actions class; GTM iframe style is vendor boilerplate — acceptable exception or replicate via class.

### sitemap.xml lists two URLs that 301-redirect (legacy quote pages) and all lastmod stamps predate the latest content changes
- **Categoría:** seo
- **Evidencia:** sitemap.xml lines 93-104 include https://eccofacilities.com/quote-janitorial.html and /quote-dayporter.html at priority 0.8, but _redirects lines 12-15 send both (with and without .html) 301 → /quote.html?service=… (on Cloudflare Pages _redirects takes precedence over existing static files; the _redirects comment at lines 8-9 even says "Do NOT add redirects for pages that already exist as .html files" and then does exactly that). Newest lastmod anywhere is 2026-04-18 while every core page was modified 2026-05-02 and quote.html 2026-05-02+. The ?service= targets are functional (js/quote-flow.js handles 'janitorial'/'dayporter', 53 'dayporter' refs).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/sitemap.xml lines 93-104, all lastmod fields; /Users/alexmercedes/Downloads/Ecco Webside/_redirects lines 4-15
- **Recomendación:** Remove the two redirecting URLs from sitemap.xml, refresh lastmod values, and resolve the _redirects self-contradiction (delete the legacy .html files or drop the redirects).

### 8 dev artifacts are deployed, crawlable and indexable (robots.txt disallows only /admin/)
- **Categoría:** seo
- **Evidencia:** Publicly served with no noindex and no robots.txt disallow: mockups.html, font-compare.html, font-specimen.html, color-swatches.html, index-reference.html, quote.backup.html, mobile-test.html, emailjs-template.html. robots.txt (3 lines) disallows only /admin/; _headers adds X-Robots-Tag noindex only for /crm/*. quote.backup.html still references styles.css?v=13.7 and main.js?v=4.4 (the only version drift found site-wide — all 25 real pages use v=15.1/v=4.6). sitemap.html and sitemap.xml correctly omit the artifacts.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/robots.txt; /Users/alexmercedes/Downloads/Ecco Webside/_headers; artifact files at repo root
- **Recomendación:** Delete the artifacts from the deploy or exclude them via robots.txt Disallow + X-Robots-Tag noindex in _headers.

### Four different CTA labels for the same quote.html destination on a single page
- **Categoría:** copy
- **Evidencia:** On sitemap.html alone: nav "Get a Free Quote" (line 49), hero "Get a Quote →" (line 67), cta-banner "Request a Free Quote →" (line 155), footer-cta "Get Your Free Proposal →" (line 161). privacy.html and terms.html each carry 3 of these variants. Quote vs Proposal terminology also alternates (footer "Get Your Free Proposal" vs footer-col "Request a Quote").
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/sitemap.html:49,67,155,161; same nav/footer block on privacy.html, terms.html, 404.html (site-wide shared component)
- **Recomendación:** Standardize on one primary CTA label (e.g. "Get a free quote") across nav, banner and footer.

### Hero badge pill text contrast computes to ~4.17:1 at 11.2px/600 — below AA, and varies over the hero photo
- **Categoría:** a11y
- **Evidencia:** .hero-badge: font-size .7rem (11.2px), weight 600, uppercase, color var(--green-l) #3D9A43 on background rgba(45,122,50,.15) over navy #0B1D38 → effective bg ≈ rgb(16,43,55); contrast(#3D9A43 vs rgb(16,43,55)) ≈ 4.17:1 < 4.5:1 required for non-large text. Because the pill is semi-transparent over a photo (privacy/terms: 22-handshake.webp; sitemap: hero-office.webp), real contrast is content-dependent and can be worse. Affected badge texts: "Your Privacy Matters", "Service Agreement", "Complete Site Directory" (component is site-wide System A).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/privacy.html:61; terms.html:61; sitemap.html:61; css/styles.css .hero-badge rule
- **Recomendación:** Raise badge text to a lighter green or white, or solidify the pill background; verify with a contrast tool against the photo backgrounds.

## [pag-quote]

### Dead checkpoint screen: markup, ~180 lines CSS, and JS branches for a step no flow contains
- **Categoría:** structure
- **Evidencia:** quote.html lines 896-910 ship #qfScreen_checkpoint ('Let me make sure I got this right…' + avatar + skip button). js/quote-flow.js line 63/128: "'checkpoint' step removed (absorbed into review)"; SCREEN_NAMES (line 131) and all FLOWS omit it, so it can never display. It is also the only screen without the qf2-stage class and its title/list use var(--qf-fd) = 'Cormorant Garamond' (css line 108, 4369-4385) — a font no longer loaded since D80, whose comment claims 'zero rendered consumers' (true only because the screen is dead). Dead JS guards remain at lines 360-361, 588-592, 974-999, 1134.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/quote.html lines 896-910; /Users/alexmercedes/Downloads/Ecco Webside/css/quote-flow.source.css lines 4293-4470; /Users/alexmercedes/Downloads/Ecco Webside/js/quote-flow.js lines 63, 128-131, 1134
- **Recomendación:** Delete the checkpoint section, its .qf-checkpoint* CSS block, and the 'checkpoint' string branches in quote-flow.js.

### Dead exit-intent feature: ~90 lines of JS permanently disabled by hardcoded nulls
- **Categoría:** js
- **Evidencia:** js/quote-flow.js lines 162-164: var exitOverlay = null; var exitClose = null; var exitForm = null; — every guard (if (exitOverlay && ...)) at lines 4799-4870 is unreachable, including the mouseleave/visibilitychange listeners, focus trap, and /api/capture-partial fetch. quote.html lines 1138-1141 retain the orphaned comment 'Exit intent modal (feature #13)' with no markup. css source line 9697-9699 confirms 'D76 retired the exit-intent modal'.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/js/quote-flow.js lines 162-164, 4780-4875; /Users/alexmercedes/Downloads/Ecco Webside/quote.html lines 1138-1141
- **Recomendación:** Remove the exit-intent block and the dangling HTML comment (capture-partial endpoint is still used elsewhere — verify before deleting the endpoint itself).

### Dead V1 rail system: RAIL_CONFIGS, buildRail, setRailValue all no-op since D147
- **Categoría:** js
- **Evidencia:** buildRail (js/quote-flow.js line 856) and updateRail's station logic (lines 961-1014) and setRailValue (line 1016) all early-return on `if (!railStations)`; the .qf-rail-stations element was removed from the DOM in D147 (quote.html lines 222-226 comment). RAIL_CONFIGS' four configs (~40 lines, including the never-rendered 'Cleaning'/'Porter' labels for the both flow and the entire 'unsure' config — a flow unreachable from the 3-card welcome UI) survive only as dead data.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/js/quote-flow.js lines 70-122, 845-1025
- **Recomendación:** Either repurpose RAIL_CONFIGS to drive the V2 .qf2-flowbar (fixes the P1 rail-state bug) or delete the dead V1 rail code.

### DESIGN.md token values stale vs shipped CSS (4 tokens + contrast table)
- **Categoría:** color
- **Evidencia:** DESIGN.md says --qf2-muted:#6B7A8D; shipped: #4F5C6E (source line 9716, comment: 'D62 — was #6B7A8D (3.6:1 on cream, fail AA)') — the doc's contrast table still claims 'Muted on cream: 4.6:1 (AA)' for a value the code itself calls a 3.6:1 failure. DESIGN.md --qf2-sage-soft: rgba(45,122,50,.08); shipped: solid #E3EDE4. DESIGN.md --qf2-fd fallback 'Cormorant Garamond'; shipped: Georgia. DESIGN.md omits --qf2-edge: rgba(45,122,50,.14) entirely. Dark-set values DO match (verified #1B2733/#243441/#3A322A/#EFE8D7/#8A9AAB/#6FB376/#82C589).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/DESIGN.md lines 24-46, 75-79; /Users/alexmercedes/Downloads/Ecco Webside/css/quote-flow.source.css lines 9702-9721
- **Recomendación:** Regenerate the DESIGN.md token table and contrast figures from the live token block.

### DESIGN.md internally contradicts its own Caveat single-use hard rule
- **Categoría:** typography
- **Evidencia:** DESIGN.md line 96-102 (D59 tier system): Caveat 'hard-locked' to .qf2-alina-hero-text .qf2-alina-name, 'Never reintroduce Caveat outside the Alina-name selector.' Yet the same file's Components section still specs 'Field helper (.qf2-field-helper) Caveat 17px sage (Sprint 1)' (line 150), 'Preset chip... Caveat italic muted by default' (line 138), Typography scale row 'Caveat helpers 17-20px' (line 91), and 'Alina pill... label in sage Caveat'. Shipped CSS complies with the single-use rule: var(--qf2-fh) has exactly one consumer (source line 10066, .qf2-alina-hero-text .qf2-alina-name) — the doc, not the code, is wrong.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/DESIGN.md lines 88-102, 134-156; /Users/alexmercedes/Downloads/Ecco Webside/css/quote-flow.source.css lines 10061-10070
- **Recomendación:** Purge the pre-D59 Caveat references from DESIGN.md's scale table and component specs.

### DESIGN.md claims a single 700px breakpoint; the CSS has 10+ distinct breakpoints
- **Categoría:** structure
- **Evidencia:** DESIGN.md line 115: 'Breakpoints: single transition at max-width: 700px. No tablet tier.' grep census of quote-flow.source.css: max-width:560px x33, 640px x15, 700px x14, 900px x5, 520px x5, 720px x5, 440px x4, 820px x1.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/DESIGN.md line 115; /Users/alexmercedes/Downloads/Ecco Webside/css/quote-flow.source.css (media queries throughout)
- **Recomendación:** Either consolidate the CSS toward the documented 700px system or update DESIGN.md to the real tier list — current doc misleads anyone styling new components.

### Sibling card labels mix casing systems: 'Night cleaning' (sentence case) vs 'Day Porter' (Title Case)
- **Categoría:** content
- **Evidencia:** Welcome cards (quote.html lines 277/284/291): 'Night cleaning' / 'Day Porter' / 'Combined'. Same mismatch in data-service-label attributes, aria-labels, and noscript select options ('Night cleaning (recurring after-hours)' vs 'Day Porter (on-site during business hours)', lines 177-179). PRODUCT.md brand rule is sentence case; 'Day porter' would comply. 17+ occurrences across the page.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/quote.html lines 177-179, 274-292, plus aria-labels and JS SERVICE_LABELS
- **Recomendación:** Normalize to sentence case ('Day porter') everywhere on /quote, or declare Day Porter a proper-noun service name and apply consistently site-wide (services pages use 'Day Porter Services').

### '24h' promise appears 4-5 times per completed flow, contradicting the page's own D120 de-duplication rationale
- **Categoría:** content
- **Evidencia:** Welcome trust strip 'Quote in 24h' (line 320, added D127); review CTA hint 'Quote in your inbox within 24h.' (line 1057); success subtitle 'I'll reach out within 24 hours.' (line 1079); success timeline 'Within 24h / I'll email you with your custom quote.' (lines 1101-1106); Alina help on success 'within 24 hours' (line 1064). The in-file D120 comment (lines 1036-1042) removed one instance because 'Three 24h claims in 30 seconds reads as over-promising (PRODUCT.md Adult voice rule)' — D127 then re-added one upstream.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/quote.html lines 318-321, 1036-1057, 1064, 1078-1107
- **Recomendación:** Keep one promise at point of commitment (review CTA hint) and one on success; drop it from the welcome trust strip per the D120 logic.

### Hidden nav logo fetched with fetchpriority=high; nav hidden attribute is ineffective and its comment is wrong
- **Categoría:** performance
- **Evidencia:** quote.html line 197: nav logo <img ... fetchpriority="high"> inside <nav hidden> — styles.css .nav{display:flex...} overrides the UA [hidden]{display:none}, and the nav is actually hidden by quote-flow.css body:has(main.q-flow) rules + JS siteNav.style.display='none' (js line 1032). The image downloads at high priority on every visit competing with the real LCP (Alina avatar, also fetchpriority=high line 260). The comment (lines 193-195) claims markup is 'kept for noscript fallback + a11y parity' — but CSS hides it for noscript users too, so neither claim holds.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/quote.html lines 193-211; /Users/alexmercedes/Downloads/Ecco Webside/js/quote-flow.js lines 1031-1032
- **Recomendación:** Drop fetchpriority and add loading=lazy on the nav logo (or remove the nav markup entirely), and fix the comment.

### quote.backup.html deployed publicly with stale cache busters and no noindex
- **Categoría:** structure
- **Evidencia:** quote.backup.html loads styles.css?v=13.7 (live pages: v=15.1), main.js?v=4.4 (live: 4.6), quote-flow.css?v=9.0 and quote-flow.js?v=9.0 (live: 50.3 / 38.0); title 'Request a Free Quote — Ecco Facilities LLC' (em dash); grep finds no robots/noindex meta. It is a full obsolete copy of the quote funnel reachable at /quote.backup.html.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/quote.backup.html
- **Recomendación:** Delete from the deployed tree (move to .dead-archive/ or gitignore'd folder); same treatment for the other dev artifacts (mockups.html, font-compare.html, font-specimen.html, color-swatches.html, index-reference.html, mobile-test.html, emailjs-template.html).

### Alina hero pill: aria-expanded without aria-controls; expanded help only swaps innerHTML
- **Categoría:** a11y
- **Evidencia:** All 8 .qf2-alina-hero pills use role="button" tabindex="0" aria-expanded="false" (e.g. quote.html line 255) but control no referenced element — the 'expansion' replaces the pill's own text via innerHTML (js/quote-flow.js lines 5322-5348) with no aria-live, so screen readers get an expanded state with nothing announced. Keyboard activation IS handled (lines 5358-5365).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/quote.html lines 255, 371, 462, 574, 654, 754, 861, 942, 1064; /Users/alexmercedes/Downloads/Ecco Webside/js/quote-flow.js lines 5322-5365
- **Recomendación:** Use a real disclosure: render help into an aria-live region or a referenced panel (aria-controls), or drop aria-expanded and treat it as a toggle button with accessible text update.

## [seo-meta]

### Invalid schema.org type "Borough" used in areaServed
- **Categoría:** seo
- **Evidencia:** index.html JSON-LD blocks 1 and 3 declare areaServed entries as {"@type": "Borough", "name": "Manhattan"} (and Brooklyn/Queens/The Bronx/Staten Island) — 10 occurrences across the two blocks. schema.org defines no 'Borough' type; validators flag unknown type, and the entries contribute nothing. The 15 duplicate-LocalBusiness pages use @type "City" for the same boroughs — a third inconsistency.
- **Ubicación:** index.html JSON-LD blocks 1 (LocalBusiness) and 3 (Service array)
- **Recomendación:** Use @type "Place" or "AdministrativeArea" for boroughs, consistently across all blocks.

### sitemap.xml lists two URLs that permanently redirect (ghost entries)
- **Categoría:** seo
- **Evidencia:** sitemap.xml includes https://eccofacilities.com/quote-janitorial.html and /quote-dayporter.html at priority 0.8. Live check: both return 301 to /quote.html?service=janitorial|dayporter (the _redirects rules win over the static files, verified by curl). Sitemaps must list canonical 200 URLs; redirecting entries waste crawl budget and trigger 'sitemap contains redirects' warnings. The local files quote-janitorial.html/quote-dayporter.html are unreachable dead weight (also the only pages with zero OG/twitter tags and zero JSON-LD — grep 'og:' = 0 in both).
- **Ubicación:** sitemap.xml lines ~96-104; quote-janitorial.html, quote-dayporter.html; _redirects lines 9-13
- **Recomendación:** Remove both URLs from sitemap.xml; delete the two legacy HTML files from the repo since the redirects fully shadow them.

### JobPosting markup missing validThrough and baseSalary; postings 101 days stale
- **Categoría:** seo
- **Evidencia:** careers.html block 2 contains 3 JobPosting items (Cleaning Technician / Janitor, Day Porter, Team Lead / Supervisor), all with datePosted 2026-03-01 and NO validThrough, NO baseSalary (grep 'validThrough\|baseSalary' careers.html = 0). Google requires validThrough for jobs that close and flags missing baseSalary; postings dated 101 days ago (today 2026-06-10) with no expiry look stale to the jobs index.
- **Ubicación:** careers.html, second <script type="application/ld+json"> block
- **Recomendación:** Add validThrough and baseSalary (or jobLocationType) to each JobPosting and refresh datePosted when listings are re-confirmed.

### Titles exceed 60 chars on 8 pages (SERP truncation); meta descriptions exceed 160 chars on 10 pages
- **Categoría:** seo
- **Evidencia:** Titles: blog/dirty-office-costs-productivity.html (96), blog/janitorial-vs-day-porter.html (87), blog/benefits-day-porter-high-traffic-buildings.html (80), blog/eco-certified-cleaning-matters.html (78), blog/choose-commercial-cleaning-company-nyc.html (76), blog/commercial-cleaning-checklist-nyc.html (76), blog/5-signs-cleaning-company.html (66), janitorial.html (65). Descriptions >160: quote.html (179), blog/commercial-cleaning-checklist-nyc.html (180), blog/dirty-office-costs-productivity.html (175), janitorial.html (172), careers.html (168), blog/benefits... (168), blog/choose... (168), blog/5-signs... (167), day-porter.html (167), sustainability.html (165).
- **Ubicación:** All listed pages, <title> and meta[name=description]
- **Recomendación:** Trim titles to ~55-60 chars (blog posts can drop the brand suffix or shorten headlines) and descriptions to 150-160 chars.

### Three competing title-suffix patterns: '— Ecco Facilities LLC' vs '— Ecco Facilities' (blog) vs '· Ecco Facilities LLC' (quote)
- **Categoría:** seo
- **Evidencia:** 13 marketing/legal pages use 'X — Ecco Facilities LLC'. All 7 blog posts use 'X — Ecco Facilities' (LLC dropped). quote.html alone uses a middle dot: 'Request a Free Quote · Ecco Facilities LLC' — System B (qf2) styling leaking into the title; it is also Title Case while PRODUCT.md mandates sentence case for the quote experience, and uses an em-dash-free separator while every other page uses the em dash PRODUCT.md bans.
- **Ubicación:** All public pages' <title>; quote.html:~10; blog/*.html titles
- **Recomendación:** Pick one suffix (suggest '— Ecco Facilities' or '| Ecco Facilities' sitewide; LLC adds 4 chars of no SEO value) and apply it to all 21 indexable pages.

### sitemap.html (human sitemap page) is missing 4 of 7 blog posts
- **Categoría:** content
- **Evidencia:** sitemap.html links only blog/5-signs-cleaning-company.html, blog/eco-certified-cleaning-matters.html, blog/janitorial-vs-day-porter.html. Missing: blog/benefits-day-porter-high-traffic-buildings.html, blog/choose-commercial-cleaning-company-nyc.html, blog/commercial-cleaning-checklist-nyc.html, blog/dirty-office-costs-productivity.html (all four ARE in sitemap.xml and on blog.html).
- **Ubicación:** sitemap.html, resources/blog section
- **Recomendación:** Add the 4 missing post links, or generate the section from the same source as blog.html.

### sameAs contains a dead Google Knowledge link; index og:image also dead
- **Categoría:** seo
- **Evidencia:** index.html LocalBusiness sameAs: https://g.co/kgs/eccofacilities returns HTTP 404 (likely a fabricated/placeholder short link — real g.co/kgs slugs are random tokens). https://linkedin.com/company/eccofacilities returns 999 (bot-blocked, unverifiable) and https://instagram.com/eccofacilities 301s to login (unverifiable). 404.html footer and other pages repeat these same social hrefs.
- **Ubicación:** index.html JSON-LD block 1 sameAs[]; .nm-social footer links on all pages
- **Recomendación:** Replace g.co/kgs/eccofacilities with the real Google Business Profile share link (or remove it); manually confirm the LinkedIn and Instagram handles exist.

## [performance]

### All 7 blog posts missing fonts.gstatic.com preconnect (root pages have it)
- **Categoría:** performance
- **Evidencia:** blog/*.html ×7 contain only <link rel="preconnect" href="https://fonts.googleapis.com">; root pages additionally have <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>. The woff2 files come from fonts.gstatic.com, so blog posts pay an extra DNS+TLS round trip on the critical font path
- **Ubicación:** blog/5-signs-cleaning-company.html, blog/benefits-day-porter-high-traffic-buildings.html, blog/choose-commercial-cleaning-company-nyc.html, blog/commercial-cleaning-checklist-nyc.html, blog/dirty-office-costs-productivity.html, blog/eco-certified-cleaning-matters.html, blog/janitorial-vs-day-porter.html (head)
- **Recomendación:** Add the fonts.gstatic.com crossorigin preconnect to the 7 blog posts

### Hero preload coverage inconsistent: 3 pages render a hero background without preloading it; index dns-prefetches Unsplash it never uses while about.html hotlinks Unsplash without any hint
- **Categoría:** performance
- **Evidencia:** 13 pages pair <link rel="preload" as="image"> with their hero (index→4.webp, about/privacy/terms→22-handshake.webp, services/sitemap→hero-office.webp, why-ecco→8-nyc-skyline-night.webp, blog/testimonials→23-coworking-space.webp, janitorial→3.webp, day-porter→5.webp, careers→careers-team.webp, sustainability→12-green-products.webp). Missing: accessibility.html:55 renders hero-img hero-office.webp with NO preload; quote-janitorial.html:54 and quote-dayporter.html:54 render wiz-bg hero-office.webp with NO preload. Inverted hint: index.html:29 has <link rel="dns-prefetch" href="https://images.unsplash.com"> but index loads zero Unsplash assets; about.html hotlinks <img src="https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80&fit=crop"> at runtime (external prod dependency, and the img has no width/height → CLS) yet has no Unsplash hint
- **Ubicación:** accessibility.html:55, quote-janitorial.html:54, quote-dayporter.html:54, index.html:29, about.html (NYC skyline img)
- **Recomendación:** Add hero preloads to the 3 pages, move the dns-prefetch from index to about (or better: self-host the Unsplash photo and add width/height)

### Hero/LCP images >200KB with no AVIF and no responsive sizing (CSS backgrounds force full-size download on mobile)
- **Categoría:** performance
- **Evidencia:** why-ecco.html hero = 8-nyc-skyline-night.webp 232,344B; index.html hero = 4.webp 216,088B; Corporate Offices.webp 392,356B and Gyms & Fitness.webp 211,188B load in index card grids. Zero .avif variants exist for any hero/card image (only the alina-avatar set and 'Safe for every pet.avif' have AVIF). Because heroes are div+inline background-image (index.html:150 <div class="hero-img" style="background-image:url('images/stock/4.webp')">), there is no srcset — a 360px phone downloads the same 216-392KB desktop file
- **Ubicación:** why-ecco.html:57, index.html:150, index card grids; images/stock/
- **Recomendación:** Generate AVIF + mobile-width variants and switch heroes to <picture> with fetchpriority="high", or use image-set() in CSS

### Tracked-and-deployed dev artifacts: ~235KB of dead public surface, none noindexed
- **Categoría:** performance
- **Evidencia:** git ls-files confirms these deploy to production: index-reference.html 29,925B (full copy of an old homepage — duplicate content, stale brand data), mobile-test.html 2,068B, emailjs-template.html 3,545B, js/main.original.js 4,950B, js/chat-widget.original.js 22,116B, plus HEAD still contains .dead-archive/css/quote-flow.source.backup-avatar-fix.css 172,811B (working-tree deletion exists but is uncommitted). None of the three HTML artifacts carry meta robots noindex. CORRECTION to brief: quote.backup.html (78,265B), js/quote-flow.backup.js (101,318B), css/quote-flow.source.css (339,733B), mockups.html, mockups/ (1.7MB), font-compare.html, font-specimen.html, color-swatches.html are all gitignored/untracked → NOT deployed; they are local-only clutter
- **Ubicación:** index-reference.html, mobile-test.html, emailjs-template.html, js/main.original.js, js/chat-widget.original.js, .dead-archive/css/quote-flow.source.backup-avatar-fix.css (HEAD)
- **Recomendación:** Delete the 5 tracked artifacts and commit the pending .dead-archive deletion; if index-reference.html must stay, add noindex + disallow in robots.txt

### quote.html loads 13 font styles across 3 families; Caveat is an entire extra family for one signature element
- **Categoría:** performance
- **Evidencia:** quote.html Google Fonts URL requests DM Sans 7 styles (400/500/600/700 upright + 400/500/600 italic), Fraunces 5 styles (400/500/600 upright + 400/500 italic), Caveat 500 (1 style) = 13 styles / 3 families (marketing pages request 8 styles / 2 families: DM Sans 4 + Cormorant Garamond 4). DESIGN.md locks Caveat to the Alina signature only — a whole family ships for one element. Also: quote.html does NOT load Cormorant Garamond although render-blocking styles.css declares --fd:'Cormorant Garamond' for the shared nav/footer it renders — any .fd/serif element on quote.html silently falls back to system serif (cross-system typography drift, no perf cost). Mitigation already present: quote.html fonts load async via media="print" onload + noscript fallback; marketing pages still load fonts synchronously (render-blocking)
- **Ubicación:** quote.html:56-57 vs index.html (head font link); DESIGN.md
- **Recomendación:** Audit which DM Sans/Fraunces italics actually appear and trim axes; consider replacing Caveat with an inline SVG signature; apply the async font pattern to marketing pages too

## [js-conducta]

### Chat-to-quote handoff drops 4 of 7 collected answers: prefill params stored but never consumed
- **Categoría:** js
- **Evidencia:** chat-widget.js buildQuoteUrl (713-723) passes space, size, freq, urgency. quote-flow.js prefillFromUrl (4935-4965) assigns STATE.prefillSpace/prefillSize/prefillFreq/prefillUrgency (lines 4959-4962) — grep shows these 4 identifiers appear ONLY on those assignment lines in all 5,435 lines; nothing ever reads them. A user who answered the chat's 7-step mini wizard gets name/email/phone prefilled (qfUserFirstName etc. verified present in quote.html) but must re-answer space type, square footage, frequency, and timing.
- **Ubicación:** js/quote-flow.js:4954-4963 (write-only); js/chat-widget.js:713-723
- **Recomendación:** Wire prefill* into the space/size/days screens' init (pre-select matching cards), or stop sending the params and shorten the chat wizard to contact-only.

### quote-flow.js (265KB) ships acknowledged dead V1 code: 57 of 104 getElementById targets don't exist in quote.html
- **Categoría:** js
- **Evidencia:** Automated check: 104 unique getElementById() targets in quote-flow.js; 57 are absent from quote.html AND never created dynamically (no id=\" or .id= assignment in JS). Families: qfSum* (9), qfEdit* (12), qf2Edit* (7), qfRv* (9), qfSuccess* (4: qfSuccessTitle/Sub/Ref/RefNum), qfFlowBar, qfFlowBackBtn, qfGreeting, qfRailFill, qfShareColleagueBtn, qfTypingDots, qfLiveNum etc. In-code admission at lines 176-178: 'V1→V2 redesign retired the qfSum*/qfRv*/qfEdit* IDs; setVal() calls on those are dead-code no-ops'. Dead behavior blocks still shipped: success-title/timeline/ref-count-up/share-CTA (4574-4684, all null-guarded no-ops), '.qf-success-timeline-when' and '.qf-wash' both 0 occurrences in quote.html — yet the mouse-parallax block (4904-4920) still attaches a document-wide mousemove listener + rAF loop iterating an empty NodeList on every desktop mouse move.
- **Ubicación:** js/quote-flow.js:172-186 (admission), 4574-4684, 4901-4920; quote.html (IDs absent)
- **Recomendación:** Excise the 57 orphan-ID code paths and the .qf-wash parallax block; expect meaningful bundle reduction from 265KB. The localhost-only qfAssertIds gate already documents which IDs are live.

### main.js dead modules: FAQ accordion, industries accordion, and parallax engine target selectors that exist on zero pages
- **Categoría:** js
- **Evidencia:** Cross-page census (all public *.html + blog/*.html, dev artifacts excluded): '.faq-q' → 0 pages (main.js FAQ accordion, ~line 3 of IIFE); '.ind-card' → 0 pages (initIndustryAccordion, lines 187-198); '[data-parallax]' → 0 pages (initParallax, lines 235-273, which also reads window.innerWidth<769 once at load, never on resize). Also single-page-only modules run everywhere: .pillar[data-pillar]/#pillar-detail (index only), .hero-rotate (index only), .checklist-toggle (services only).
- **Ubicación:** js/main.js:187-198, 235-273, faq-q block in main IIFE; census across 25 public pages
- **Recomendación:** Delete the three zero-consumer modules; consider splitting index-only modules behind an element-existence early return (already present) or a page-scoped bundle.

### Two parallel counter-animation systems in main.js with different durations and easings
- **Categoría:** js
- **Evidencia:** animateCounter (parses .stat-num text, 1400ms, quartic ease, threshold 0.3 on .stats-bar) serves about.html + testimonials.html; initCounters (reads data-target/data-suffix on .hero-stat-num, 2000ms, cubic ease, observes .hero-stats, separate 3s fallback) serves index.html only. Same visual feature, two implementations, different timing/feel across pages. ('hero-stats' class also appears on 12 pages but only index has .hero-stat-num, so initCounters no-ops elsewhere.)
- **Ubicación:** js/main.js (animateCounter + statObs in main IIFE) and js/main.js:134-182 (initCounters)
- **Recomendación:** Consolidate on the data-target implementation and migrate about/testimonials markup.

### chat-widget.js injects a 125-rule third design system with off-token colors and 8 gradients
- **Categoría:** js
- **Evidencia:** Lines 85-212 inject a <style> block with hardcoded hex everywhere (no CSS variables): messages background #F5F3EE (matches neither System A --cream #F3F5F8 nor System B --qf2-cream #EEF2ED — a third 'cream'), badge red #E54848 (vs --red #C84444), grays #94A3B5/#5B6A84/#DFE4EC/#EDF0F5/#E5EBF2 in neither token set, and 8 linear-gradient() usages (CTA bar, send buttons, user bubble #0B1D38→#1E3562, service-card icons) against the 'sage as single accent / no gradients' brand direction. Also duplicates dark-navy/sage values as literals so any token change desyncs the widget.
- **Ubicación:** js/chat-widget.js:85-212 (styles.textContent)
- **Recomendación:** Move widget CSS into styles.css consuming :root tokens; replace #F5F3EE and #E54848 with token equivalents; drop gradients per brand direction.

### Chat widget copy violates brand rules: Title Case persona names, 24 em dashes, urgency copy
- **Categoría:** content
- **Evidencia:** 'Cleaning Experience Advisor' (Title Case) appears 3x (lines 42, 47, 52) while sibling titles are sentence case ('Your janitorial guide', 'Your eco guide') — internal inconsistency AND violates the sentence-case rule. Em dashes: 21 — escapes + 3 literal '—' = 24 occurrences in user-facing strings (brand rule: no em dashes). Urgency copy: CTA bar 'Start your free quote · 24-hour turnaround' (line 216), header 'Online · Replies in ~2 min' (line 216 — shown even when the backend is unreachable and the widget silently falls back to canned responses).
- **Ubicación:** js/chat-widget.js:42,47,52,216 and copy strings throughout PAGE_CONTENT/getFallbackResponse
- **Recomendación:** Normalize all titles to sentence case, strip em dashes, soften/remove urgency claims, and make the 'Online' status reflect actual backend reachability (flip after first fromFallback response).

### Alina persona transparency inconsistent: chat widget discloses 'Not a real person', quote form's 9 Alina blocks disclose nothing
- **Categoría:** content
- **Evidencia:** chat-widget.js:81 footer = '🤖 AI-powered assistant · Not a real person' and header appends '· AI'. quote.html contains 9 qf2-alina-hero persona blocks + 9 alina-help tooltips with the same avatar photo and zero AI/persona disclosure (grep 'not a real person|ai-powered|ai assistant' in quote.html = 0). Same character, opposite transparency posture, on the highest-stakes page (lead capture).
- **Ubicación:** js/chat-widget.js:81; quote.html (9x qf2-alina-hero)
- **Recomendación:** Add a single consistent disclosure treatment for Alina on quote.html, or align both to whatever legal/brand call is made.

### Four parallel quote-capture implementations; legacy pages carry dead UA beacon, duplicated hardcoded Turnstile sitekey, and conflicting widget themes
- **Categoría:** js
- **Evidencia:** Implementations: (1) quote-flow.js V2 wizard, (2) quote-janitorial.html ~600-line inline wizard, (3) quote-dayporter.html inline wizard, (4) chat-widget.js QUOTE_STEPS mini wizard. Both legacy pages duplicate abandonment tracking already in quote-flow.js (window.dataLayer.push quote_abandon, quote-janitorial.html:621-628) and call navigator.sendBeacon('https://www.google-analytics.com/collect','') — empty payload to the retired Universal Analytics endpoint: dead code that does nothing. Turnstile sitekey '0x4AAAAAAC0yqxn8GnsosDXq' is hardcoded 3+ times (quote-janitorial.html:360,571; quote.html:1058) with theme:'dark' forced in legacy inline JS vs data-theme="auto" on quote.html — visibly different captcha on sibling forms. quote.backup.html still references js/quote-flow.js?v=9.0 (current is v=38.0).
- **Ubicación:** quote-janitorial.html:360,571,580,621-628; quote-dayporter.html:467,682,688; quote.html:1058; js/chat-widget.js:590-723
- **Recomendación:** Retire or redirect the two legacy pages to /quote.html; if kept, remove the UA beacon and unify Turnstile config; deduplicate abandonment tracking.

### localStorage key naming is inconsistent across files (snake_case ecco_* vs camelCase ecco*)
- **Categoría:** js
- **Evidencia:** Full census — cookie-consent.js: ecco_cookies, ecco_consent (two keys deliberately mirroring the same choice, line 17 'legacy ecco_consent key'). quote-flow.js: ecco_quote_draft_v1 (528), ecco_quote_last_submit_ts (4405), ecco_quote_save_explained_v1 (5054), ecco_quote_seen_v1 (5080), plus sessionStorage qf_exit_shown (4791) and orphaned legacy ecco_theme (no longer written, acknowledged stale at 4769). chat-widget.js breaks convention with camelCase: eccoChatState_v1 (780), eccoNudgeDismissed_<pageKey> (559,584 — 4 possible keys). main.js: none. Mixed schemes complicate any future consent-driven purge.
- **Ubicación:** js/cookie-consent.js:5,19-20,26-27; js/quote-flow.js:528,4405,4791,5054,5080; js/chat-widget.js:559,584,780
- **Recomendación:** Standardize on ecco_<area>_<name>_v<N>; migrate chat keys on next write; document the canonical list.

### cookie-consent.js banner violates the zero-inline-styles rule and uses inline onclick globals
- **Categoría:** anti-pattern
- **Evidencia:** Line 12 innerHTML contains style="display:flex;gap:.5rem" (project rule: 'Zero inline styles — all styling through CSS classes') and onclick="acceptCookies()" / onclick="declineCookies()" requiring window-global functions (lines 18,25). GTM noscript iframes also carry style="display:none;visibility:hidden" (index.html:128, privacy.html:35) while quote.html:162 uses a class (qf-gtm-ns) for the same thing — the fixed version exists but wasn't propagated.
- **Ubicación:** js/cookie-consent.js:12,18,25; index.html:128 vs quote.html:162
- **Recomendación:** Move the flex wrapper to a .cookie-actions class and bind listeners with addEventListener; propagate the qf-gtm-ns class pattern to all GTM noscript tags.

### quote.html LocalBusiness schema omits street address and phone; locality conflicts with canonical identity
- **Categoría:** content
- **Evidencia:** quote.html:60 JSON-LD: name 'Ecco Facilities LLC' (correct) but address = {addressLocality:'New York', addressRegion:'NY', addressCountry:'US'} — no streetAddress, no postalCode, no telephone. Canonical: 54 State St #804, Albany NY 12207, (929) 280-9374. Noting here because it was read during the JS audit; full schema sweep belongs to the SEO/content auditor.
- **Ubicación:** quote.html:60
- **Recomendación:** Align schema with canonical identity (or intentionally omit address if Albany HQ shouldn't appear on an NYC service page — but then drop the malformed partial address).

## [a11y-sistemica]

### Footer social icons 36x36px on 26 pages
- **Categoría:** a11y
- **Evidencia:** .footer-social a{width:36px;height:36px;border-radius:50%;...display:inline-flex} — below the 44px project minimum. Note inconsistency with the mobile nav drawer where the same social links get 44px: .nm-social a{width:44px;height:44px}. footer-social appears on 26 pages.
- **Ubicación:** css/styles.css .footer-social a; 26 pages (all root marketing pages + blog posts)
- **Recomendación:** Bump .footer-social a to 44x44 to match .nm-social a.

### JS counter animations not gated by prefers-reduced-motion; flag declared but never used
- **Categoría:** a11y
- **Evidencia:** main.js declares `const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;` (end of line 3) — exactly 1 occurrence in the file, never read. Both counter systems animate regardless: animateCounter() driven by statObs on .stats-bar .stat-num (line 3) and initCounters() on .hero-stat-num (lines 134-163) run requestAnimationFrame number-scramble loops; the CSS reduced-motion kill-switch (animation-duration:0s) cannot stop JS rAF text mutation. Parallax (line 236), hero parallax (noMotion flag), hero-rotate (line 330) and quote-flow.js (lines 394, 906, 4904) ARE correctly gated.
- **Ubicación:** js/main.js line 3 (statObs/animateCounter, unused prefersReducedMotion const) and lines 134-163 (initCounters); affects index.html and every page with .stats-bar
- **Recomendación:** Early-return both counter functions (set final value immediately) when prefersReducedMotion is true — the flag already exists.

### Chat widget: toggle lacks aria-expanded; input has no accessible name; incomplete focus trap; aria-modal on non-inert background
- **Categoría:** a11y
- **Evidencia:** grep 'aria-expanded' js/chat-widget.js = 0 occurrences — #eccoChatToggle never communicates open state. Chat textarea: '<textarea class="ecco-chat-input" id="eccoChatInput" placeholder="..." rows="1">' — no label or aria-label (placeholder-only name). Focus trap (line 899) hardcodes f=[closeBtn, resetBtn, input, sendBtn], omitting the CTA link #eccoChatCta, quick-reply buttons, copy buttons and retry button from the wrap cycle, and globally hijacks Tab whenever open ('!panel.contains(document.activeElement)' branch) while the panel claims aria-modal="true" but background stays mouse-interactive (no inert). Positives: Escape closes and restores focus to toggle (line 898); role="dialog", role="log" aria-live="polite" on messages; close/reset buttons are 44px.
- **Ubicación:** js/chat-widget.js lines 216 (markup), 889-899 (open/close/trap); loaded on 24 pages
- **Recomendación:** Add aria-expanded to the toggle, aria-label to the textarea, compute trap candidates dynamically from panel.querySelectorAll of focusable selectors, and inert the page or drop aria-modal.

### Newsletter and careers forms have no error/status announcement pattern
- **Categoría:** a11y
- **Evidencia:** Newsletter (26 pages): <form ... method="post" target="_blank" class="footer-nl-form"> posts to Mailchimp in a new tab; zero aria-live/role=status/role=alert in main.js or footer markup (grep = 0 matches); only native 'required' validation. Careers application form (careers.html line 204, posts to formsubmit.co): zero aria-live/role=alert, native validation only. Contrast with System B which implements the full pattern: per-field role="alert" errors (quote.html lines 399-621), aria-invalid + aria-describedby token append/cleanup (quote-flow.js lines 1620-1658), polite live regions (qf2QuizResult, qfDaysCount, qfDpStatus), inert on inactive screens (quote-flow.js 1107).
- **Ubicación:** index.html line 533 + 25 other pages (.footer-nl-form); careers.html line 204; js/main.js lines 29-32 (submit handler only tracks analytics)
- **Recomendación:** Add an aria-live="polite" status element to the newsletter form (and ideally AJAX the Mailchimp post); add role=alert error containers to the careers form, mirroring the quote-flow pattern.

### prefers-reduced-motion coverage asymmetry is fine, but minified quote-flow.css retains a disabled-by-rename legacy dark block
- **Categoría:** dark-mode
- **Evidencia:** quote-flow.source.css contains '@media(prefers-color-scheme:dark-DISABLED-V1-LEGACY)' at lines ~2601, 2703, 2806, 2814 — invalid media queries used as a disabling hack; shipped in the minified css/quote-flow.css. Harmless to rendering (never matches) but dead weight and a trap for future regex edits (project memory already records perl-regex corruption on this file).
- **Ubicación:** css/quote-flow.source.css lines 2601, 2703, 2806, 2814; css/quote-flow.css (minified)
- **Recomendación:** Delete the four dead legacy dark-mode blocks from source and re-minify.


# Detalle P3 — Pulido

## [colores]

### --qf2-edge border token not redefined in dark mode (stays dark-green-on-dark)
- **Categoría:** dark-mode
- **Evidencia:** PART A dark block redefines --qf2-edge-warm (rgba(111,179,118,.22)) but NOT --qf2-edge, which keeps rgba(45,122,50,.14) — a 14% dark-green border invisible on #1B2733. Only 2 var(--qf2-edge) consumers, limiting blast radius.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/css/quote-flow.source.css:9715 (definition), 13148-13176 (dark block, missing override)
- **Recomendación:** Add --qf2-edge: rgba(111,179,118,.18) to the dark token block.

### Contradictory color-scheme declarations: ':root{color-scheme:only light}' (layered) vs ':root{color-scheme:dark}' (unlayered) in the same file
- **Categoría:** color
- **Evidencia:** quote-flow.source.css:40 `@layer tokens{:root{color-scheme: only light;}}` with a comment block (lines 26-38) explaining the form is 'locked to light rendering regardless of OS preference' — while line 13138-13141 sets `@media (prefers-color-scheme: dark){:root{color-scheme:dark}}` unlayered, which wins. Functionality resolves correctly but the stale lock + comment misleads maintainers (it was the rationale for the 40 disabled blocks).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/css/quote-flow.source.css:26-43,13138-13141
- **Recomendación:** Remove the 'only light' declaration and rewrite the comment to describe the current auto-dark behavior.

### Mint/soft-green surface cluster: 12 near-identical light greens for one 'soft green wash' role
- **Categoría:** color
- **Evidencia:** #F0F7F1 (×11, avatar gradients/chat bubbles), #E1ECE3 (×5), #D8E8DA (×5), #D9ECDB/#E8F3E9/#F5FAF5 (.day-btn.is-selected 3-stop gradient), #F0FDF4/#F5FFF8 (.ba-col-good), #FAFDFA, #F5FBF6, #E3EDE4 (--qf2-sage-soft), #E1E8DF (--qf-cream-dark). Most belong to the dead stage component family; .ba-col-good and qf2 tokens are live.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/css/styles.css (.alina-corner-face, .stage-hero-avatar, .ask-msg-bot, .day-btn.is-selected, .ba-col-good); css/quote-flow.source.css:95,9712
- **Recomendación:** Standardize on 2 values (e.g. #F0F7F1 + #E3EDE4) and delete the dead consumers.

### One-off navy gradient stops and misc washes outside the navy ramp
- **Categoría:** color
- **Evidencia:** .cta-banner{background:linear-gradient(-45deg,#0b1d38,#1e3562,#0f2847,#162d52)} — #0F2847 and #162D52 are near-dupes of --navy-l #15294D/--navy-xl #1E3562 used nowhere else. Also one-off hover wash #EBF0FA (.included-item:hover, .value-card:hover), rgba(44,62,80,*)=#2C3E50 'flat-UI navy' ×5 in quote-flow shadows, rgba(32,32,32,.08), rgba(94,145,168,.3).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/css/styles.css (.cta-banner, .included-item:hover, .value-card:hover); css/quote-flow.source.css:9930 (rgba(44,62,80))
- **Recomendación:** Snap gradient stops to --navy-l/--navy-xl; replace #2C3E50 shadows with the standard rgba(11,29,56,*) family.

### Alina avatar fallback uses a hard-coded skin-tone gradient while the token named 'peach' is actually gray-green
- **Categoría:** color
- **Evidencia:** linear-gradient(135deg,#e8c4a0,#d4a374) hard-coded 5× (qf2-alina-hero-avatar and 4 other avatar shells). Meanwhile --qf2-peach:#DFE7E0 / --qf2-peach-deep:#C4D4C5 are sage-grays (DESIGN.md:27 admits 'legacy name'). The only real peach in the system is untokenized; the token called peach isn't peach.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/css/quote-flow.source.css:9941,10441,11278,11609 + 1 more; :9708-9709
- **Recomendación:** Add --qf2-avatar-skin tokens for the gradient and rename --qf2-peach to --qf2-mist (or similar) when convenient.

### Dev artifacts deployed publicly expose three additional exploration palettes
- **Categoría:** structure
- **Evidencia:** color-swatches.html (15 hex incl. parchment #F0E9D7 not used on the site), font-specimen.html/font-compare.html (14 hex incl. shimmer #8fd48c/#5ba8e6/#6bd568, #E5E9EF), mockups.html (18 hex incl. #F8F5EF,#FDFCFA), index-reference.html (19 hex), emailjs-template.html (11), mobile-test.html (7), quote.backup.html (3 + old (646) phone). All sit in the deploy root alongside production pages.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/color-swatches.html, font-specimen.html, font-compare.html, mockups.html, index-reference.html, quote.backup.html, mobile-test.html, emailjs-template.html
- **Recomendación:** Exclude dev artifacts from the Cloudflare Pages deploy (move to /docs or add to a build ignore).

### No theme-color meta on any of the 25 public pages
- **Categoría:** seo
- **Evidencia:** grep '<meta name="theme-color"' across all *.html and blog/*.html returns 0 matches — mobile browser chrome never matches the navy header (System A) or cream form (System B). styles.css also declares no color-scheme, so marketing pages have no declared scheme while quote.html auto-darkens.
- **Ubicación:** all HTML pages in /Users/alexmercedes/Downloads/Ecco Webside/
- **Recomendación:** Add <meta name="theme-color" content="#0B1D38"> to marketing pages and a media-paired pair (#EEF2ED / #1B2733) to quote.html.

## [tipografia]

### Font loading strategy inconsistent: quote.html async, all 24 other pages render-blocking
- **Categoría:** performance
- **Evidencia:** quote.html:56-57 uses the non-blocking pattern (rel=stylesheet media="print" onload="this.media='all'" + <noscript> mirror, documented in the D87 comment). VERIFIED: the apparent "duplicated fonts link" is this intentional async+noscript pair, not a defect. Every other page (24 files) loads the same-origin-pattern Google Fonts URL as a plain render-blocking <link rel="stylesheet"> (e.g. index.html:28, blog/5-signs-cleaning-company.html:29). Marketing pages also load Cormorant wght 400 which has no obvious consumer (styles.css serif rules use 500/600/700).
- **Ubicación:** quote.html:56-57 vs index.html:28 and 23 sibling pages
- **Recomendación:** Apply the D87 async pattern (or font preloading) to the marketing template; audit whether Cormorant 400 can be dropped from the URL.

### qf2-prompt-title h2 contains misapplied 'sub' variant spans with duplicated identical text
- **Categoría:** typography
- **Evidencia:** quote.html:668-671: `<h2 class="qf2-prompt-title"><span class="qf2-prompt-sub-desktop">How <em>big</em> is the space?</span><span class="qf2-prompt-sub-mobile">How <em>big</em> is the space?</span></h2>` — the responsive-variant classes named *-sub-* (designed for the `<p class="qf2-prompt-sub">` below, per quote-flow.source.css:10172-10175) are used inside the TITLE, and both variants carry identical text, so the split does nothing except ship the heading twice.
- **Ubicación:** quote.html:668-671; css/quote-flow.source.css:10172-10175
- **Recomendación:** Collapse to plain h2 text; reserve -sub-desktop/-sub-mobile spans for the subtitle where the copy actually differs.

### Three competing .page-hero h1 size specs in styles.css
- **Categoría:** typography
- **Evidencia:** css/styles.css contains .page-hero h1 declared 4 times: base clamp(2rem,4vw,3.2rem)/500/lh1.15/ls-.02em, then clamp(1.8rem,6vw,2.4rem), then clamp(1.5rem,5.5vw,2rem) (presumably stacked media queries — clamp() already handles fluidity, so the extra breakpoint overrides defeat the purpose and create 3 sources of truth), plus a color:#000 override (likely print).
- **Ubicación:** css/styles.css selectors `.page-hero h1` (minified, 4 occurrences)
- **Recomendación:** Collapse to a single clamp() spec; if mobile needs a different curve, adjust the one clamp rather than layering overrides.

### h2 "Trusted Across Every Industry" duplicated verbatim on two pages
- **Categoría:** content
- **Evidencia:** Identical h2.sec-ttl text "Trusted Across Every Industry" appears on index.html and testimonials.html (and it is one of the Title Case outliers on the otherwise sentence-case homepage).
- **Ubicación:** index.html, testimonials.html
- **Recomendación:** Differentiate one of the two headings while normalizing case.

## [componentes]

### Dead/orphan button variants and dead FAQ JS shipped to production
- **Categoría:** component
- **Evidencia:** .btn-outline and .btn-ghost are defined in styles.css (with hover states) but used only in index-reference.html (dev artifact); zero uses in real pages. .btn-ol-white used exactly once (index.html:504) and duplicates .btn's layout properties instead of composing 'btn btn-ol-white'. js/main.js contains a full .faq-q/.faq-item accordion handler but no page contains those classes (grep = 0). font-specimen.html invents .s-btn/.s-btn-ghost.
- **Ubicación:** css/styles.css (.btn-outline/.btn-ghost/.btn-ol-white); js/main.js FAQ block; index.html:504
- **Recomendación:** Delete dead variants + FAQ JS, or restore the FAQ component; make btn-ol-white compose .btn.

### Footer copy drift between the 22 identical footers and quote.html's copy: &mdash; vs &middot; separators
- **Categoría:** component
- **Evidencia:** 22 pages: '<span>New York City &mdash; All 5 Boroughs</span>' and footer-legal separators '<span>·</span>' (literal char); quote.html footer: 'New York City &middot; All 5 Boroughs' and '<span>&middot;</span>' entities. Footer CTA uses '&rarr;' entity while body CTAs use literal '→'. Also System B brand rules ban em dashes; the System A footer carries one on every page.
- **Ubicación:** footer .footer-col Contact + .footer-legal on all pages vs /Users/alexmercedes/Downloads/Ecco Webside/quote.html:1144-1183
- **Recomendación:** Pick one separator and one arrow form; sync quote.html's footer copy with the canonical footer.

### Breadcrumb micro-variants: extra whitespace nodes and multiline form on 3 pages
- **Categoría:** component
- **Evidencia:** janitorial.html:59 and day-porter.html:59 use spaced markup '<a>Home</a> <span>/</span> <a>Services</a>' while the other 12 breadcrumb pages use the tight '<a>Home</a><span>/</span><span>…</span>' (no spaces); services.html splits its breadcrumb across multiple source lines. .breadcrumb is display:inline-flex with gap:.5rem so whitespace-only nodes are ignored — markup-only drift today, but any display change makes them render differently. index.html, 404.html and all 3 quote pages have no breadcrumb (expected for index/404; legacy quote pages predate the pattern).
- **Ubicación:** janitorial.html:59, day-porter.html:59, services.html:59-?, vs about/why-ecco/testimonials/careers/sustainability/blog/accessibility/privacy/terms/sitemap + 7 blog posts
- **Recomendación:** Normalize to the tight single-line form during the next template sweep.

### Chat widget hard-codes its own palette including an off-system red badge (#E54848)
- **Categoría:** component
- **Evidencia:** js/chat-widget.js injects a <style> tag (line 84-…) with literal colors: badge background '#E54848' (System A --red is #C84444), plus hard-coded #0B1D38/#2D7A32 instead of var(--navy)/var(--green); positions launcher bottom-left 28px z-index:999 (above everything incl. mobile nav at z1000 boundary). Widget is absent from quote.html (intentional, D125) but still loads on both legacy quote pages.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/js/chat-widget.js:84-104,216
- **Recomendación:** Source colors from :root tokens; align badge red with --red; decide chat policy for legacy quote pages.

### Back-to-top button missing from the 2 legacy quote pages; floating quote CTA exists only on index
- **Categoría:** component
- **Evidencia:** '<button class="btt">' present on 23 of 25 public pages; absent from quote-janitorial.html and quote-dayporter.html (both long scrolling forms, 632/737 lines). .cta-float markup exists only in index.html (1 instance site-wide) although main.js has a generic scroll-threshold fallback for pages without .hero-actions — the component was evidently planned to be reusable (plan doc 2026-04-21-floating-quote-cta-right-side).
- **Ubicación:** quote-janitorial.html, quote-dayporter.html (missing .btt); index.html (sole .cta-float)
- **Recomendación:** Either roll .cta-float out to high-intent pages (services, janitorial, day-porter, blog posts) or document it as homepage-only; add .btt to legacy quote pages or retire them.

## [espaciado]

### Gap sprawl: 37 distinct gap values in EACH file, with px/rem mixed inside System A
- **Categoría:** spacing
- **Evidencia:** styles.css gap census: 37 distinct values — top: 2rem x26, 1.5rem x21, .5rem x20, 1rem x18, .6rem x15, .8rem x11, .4rem x10, .75rem x9 — plus px intruders 10px x7, 14px x5, 8px x3(+2 !important), 6px x4 in the same rem-based file. quote-flow.source.css: also exactly 37 distinct gap values (px-based).
- **Ubicación:** css/styles.css, css/quote-flow.source.css (all pages / quote.html)
- **Recomendación:** Snap gaps to a 4/8-based scale (e.g. .5/.75/1/1.5/2/3rem) and drop px gap literals in System A.

### Hero min-height ladder is non-monotonic: 100svh -> 85svh (<=900px) -> 100svh (<=480px)
- **Categoría:** spacing
- **Evidencia:** styles.css: base `.hero{min-height:100vh;min-height:100svh;padding:2.5rem 3.5rem 3rem}`; `@media(max-width:900px){.hero{padding:2rem 1.5rem 3rem;min-height:85vh;min-height:85svh}}` (expanded line ~512); `@media(max-width:480px){.hero{padding:2.5rem 1rem 2rem;min-height:100vh;min-height:100svh}}` (line 554). Tablets get a shorter hero than both desktop and phone; bottom padding flips 3rem -> 3rem -> 2rem while top flips 2.5 -> 2 -> 2.5rem.
- **Ubicación:** css/styles.css .hero/.page-hero rules; affects index.html + all 21 .page-hero pages
- **Recomendación:** If full-screen phone hero is intentional, comment it; otherwise make the ladder monotonic (100 -> 92 -> 85svh or constant).

## [darkmode]

### Marketing pages declare no color-scheme at all (CSS property or meta) — exposed to Android Chrome forced-dark mangling; quote is the only surface that declares it
- **Categoría:** dark-mode
- **Evidencia:** grep color-scheme in css/styles.css = 0; <meta name="color-scheme"> = 0 hits repo-wide. quote-flow.source.css properly declares :root{color-scheme:only light} (line 38-42, @layer tokens) and :root{color-scheme:dark} inside the dark media (line 13139-13141). Without any declaration, marketing pages opt into UA auto-darkening heuristics (Chrome Android 'darken websites' setting), which would invert the carefully tuned navy/cream System A palette unpredictably.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/css/styles.css; all marketing HTML heads; /Users/alexmercedes/Downloads/Ecco Webside/css/quote-flow.source.css:26-42, 13139-13141
- **Recomendación:** Add :root{color-scheme:light} to styles.css (or <meta name="color-scheme" content="light">) to lock marketing rendering until a real dark theme exists.

### Three conflicting documented counts of the neutralized V1 dark blocks (38 vs 40 vs 40) — actual count is 37
- **Categoría:** dark-mode
- **Evidencia:** quote-flow.source.css:35 header comment: "The 38 dark V1 media queries... are kept"; quote-flow.source.css:13132 D128 comment: "The 40 disabled @media(prefers-color-scheme:dark-DISABLED-V1-LEGACY) blocks (D95)"; DESIGN.md:14: "40 V1 @media(prefers-color-scheme:dark) blocks were leaking". Verified actual: 37 @media block openers in source (line-enumerated) and 37 blocks in minified (brace-matching scan).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/css/quote-flow.source.css:35, 13132; /Users/alexmercedes/Downloads/Ecco Webside/DESIGN.md:14
- **Recomendación:** Correct all three references to 37 (or recount after any cleanup) so future audits don't chase phantom blocks.

### Third-party/injected UI islands have divergent theme strategies: Turnstile follows OS, chat widget is hardcoded light, cookie banner is hardcoded navy
- **Categoría:** dark-mode
- **Evidencia:** quote.html:1058 Turnstile uses data-theme="auto" (follows OS — happens to match D128 auto dark today, but would desync if a manual toggle returns). js/chat-widget.js injects its own <style> with hardcoded light values (.ecco-chat-panel{background:#fff}, line 104) and contains 0 prefers-color-scheme/data-theme references; loaded on 23 marketing pages + both legacy quote pages, not on quote.html, so no clash today — it becomes a third unthemed island the day marketing gets dark support. cookie-consent.js banner relies on styles.css navy (see separate finding).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/quote.html:1058; /Users/alexmercedes/Downloads/Ecco Webside/js/chat-widget.js:84-216; /Users/alexmercedes/Downloads/Ecco Webside/js/cookie-consent.js:11-12
- **Recomendación:** Record a single theming contract (who decides theme: OS, attribute, or page) and route all injected widgets through it; pin Turnstile to the same source of truth as the page.

## [pag-index]

### Dead dns-prefetch to images.unsplash.com
- **Categoría:** performance
- **Evidencia:** <link rel="dns-prefetch" href="https://images.unsplash.com"> (line 29) but 0 unsplash references in index.html body or css/styles.css — all imagery is local images/stock/*.
- **Ubicación:** index.html line 29
- **Recomendación:** Remove the hint.

### Three tracking stacks on one page; HubSpot via protocol-relative URL
- **Categoría:** performance
- **Evidencia:** GTM (GTM-W2ZWXZ3T, line 5), Microsoft Clarity (w546w8zoh2, line 7), HubSpot (//js-na2.hs-scripts.com/245755967.js, line 559 — protocol-relative URL is an obsolete pattern). HubSpot may also inject its own bottom-right chat launcher (z-index ~2147483647) on top of .cta-float and .btt, adding a 5th floating element alongside the Alina chat toggle.
- **Ubicación:** index.html lines 4-7, 558-560
- **Recomendación:** Use https:// explicitly; verify the HubSpot portal has no chat launcher enabled, or it will collide with the custom Alina widget.

### Arrow glyph and image-format inconsistencies
- **Categoría:** content
- **Evidencia:** Literal "→" in CTAs (lines 158, 209, 215, 353, 408, 430, 503) vs &rarr; entity in footer-cta (line 512) vs SVG arrow in cta-float. Card grids mix .webp (10), .jpg (5), .avif (1: Safe for every pet.avif); filenames contain spaces and ampersands requiring %20/%26 encoding (e.g. Medical%20%26%20Dental.webp) — fragile and cache-unfriendly.
- **Ubicación:** index.html lines 158-512 (arrows), 289-400 (images); images/stock/
- **Recomendación:** Standardize on one arrow treatment; rename assets to kebab-case and converge on webp/avif with fallbacks.

### Inconsistent background-image accessibility treatment and contradictory honeypot ARIA
- **Categoría:** a11y
- **Evidencia:** Services showcase bgs get role="img" + aria-label (lines 195-196) but all 14 .photo-card-bg divs (lines 289-400) have no role/label — two patterns on one page. Newsletter honeypot (line 535): <div aria-hidden="true" class="sr-only"> wrapping an input with aria-label="Leave empty" — aria-hidden nullifies the label and contradicts sr-only's purpose.
- **Ubicación:** index.html lines 195-196, 289-400, 535
- **Recomendación:** Treat card bgs as decorative consistently; simplify honeypot to aria-hidden + tabindex=-1 + autocomplete=off without sr-only/aria-label.

### Weak title pattern and meta/og description drift
- **Categoría:** seo
- **Evidencia:** <title>Home — Ecco Facilities LLC</title> — "Home" wastes the primary keyword slot and uses an em dash. meta description says "all 5 boroughs of NYC" while og:description/twitter say "of New York City" — same sentence, two variants.
- **Ubicación:** index.html lines 13-23
- **Recomendación:** Title like "Commercial Cleaning NYC | Ecco Facilities"; unify the description string.

### main.js ships page-dead handlers to the homepage
- **Categoría:** js
- **Evidencia:** Handlers for .faq-q (FAQ removed from this page), .stats-bar/.stat-num (homepage uses .hero-stats/.hero-stat-num instead), .checklist-toggle, .ind-card — none exist in index.html. Plus the legacy .svc-tab dataset.panel handler (covered separately). Comments at lines 386-388 note already-removed features.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/js/main.js lines 3, 112-124, 187-198, 386-388
- **Recomendación:** Acceptable for a shared bundle, but prune the confirmed-dead FAQ handler and stale comments.

## [pag-services]

### CTA label taxonomy: 8 links to quote.html with 7 different labels and 2 arrow encodings
- **Categoría:** content
- **Evidencia:** "Get a Free Quote" (nav, line 48), "Get a Free Quote →" (hero, line 70), "Request a Janitorial Quote →" (129), "Request a Day Porter Quote →" (173), "Build Your Custom Package →" (196), "Request a Free Quote →" (245), "Get Your Free Proposal &rarr;" (251, HTML entity while all others use the literal → character), "Request a Quote" (footer contact, 265). The promised deliverable oscillates between quote, package, and proposal on one page.
- **Ubicación:** services.html lines 48, 70, 129, 173, 196, 245, 251, 265
- **Recomendación:** Standardize on one primary CTA verb-object (e.g. "Get a free quote") with at most one contextual variant, and one arrow convention.

### Minor a11y bundle: breadcrumb separators announced, decorative hero bg has role=img, 11.5px testimonial role text, desktop tabpanel remnants
- **Categoría:** a11y
- **Evidencia:** Breadcrumb separator `<span>/</span>` (line 61) lacks aria-hidden. `.hero-img` decorative 25%-opacity background div carries role="img" aria-label="Modern office space with people working" (line 56) — announced to SR users though purely atmospheric. `.trust-quote-role{font-size:.72rem}` ≈11.5px (lines 226/231/236). On desktop the tablist is display:none while both panels keep role="tabpanel" aria-labelledby pointing at hidden tabs (tabpanels without visible tabs — consequence of the responsive tab/stack split; project rule says ARIA must be viewport-aware via matchMedia). Honeypot input has aria-label="Leave empty" inside an aria-hidden div (line 274).
- **Ubicación:** services.html lines 56, 61, 90/134, 226-236, 274
- **Recomendación:** aria-hidden the separators; drop role/aria-label from the decorative hero div; bump .trust-quote-role to ≥0.75rem; strip tab/tabpanel roles at desktop via main.js matchMedia per project convention.

### All revealed content starts invisible (.rv opacity:0 + blur) with no noscript fallback
- **Categoría:** js
- **Evidencia:** `.rv{opacity:0;transform:translateY(30px);filter:blur(4px);...}` only made visible when js/main.js IntersectionObserver adds .vis. On services.html the .rv class is on every section header, all 10 val-cards, the trust-strip, and the better-together CTA. The page's only <noscript> is the GTM iframe — JS failure leaves section headings and cards invisible. (Project rule bans rv-light/rv-child on load-critical content; plain .rv has the same failure mode here.)
- **Ubicación:** services.html lines 76, 181, 188-192, 195, 201, 208-212, 217, 222; css/styles.css .rv/.rv.vis; js/main.js observer
- **Recomendación:** Add a `<noscript>.rv{opacity:1;transform:none;filter:none}</noscript>` style or set .vis server-side for above-the-fold .rv elements.

## [pag-service-detail]

### Testimonial quotes duplicated verbatim across pages with attribution drift
- **Categoría:** content
- **Evidencia:** David Chen (Operations Director, Meridian Capital Group) asthma quote appears VERBATIM on janitorial.html:202 and testimonials.html, plus a silently TRIMMED variant on index.html ('Several employees have asthma and allergies... about chemical odors. The space is spotless...' — drops 'on our floor', 'or irritation', and the closing sentence). Nicole Reyes quote is verbatim-identical on day-porter.html:173 and testimonials.html, but day-porter attributes 'HubWork Collective, Midtown' while testimonials.html says only 'HubWork Collective'. Same two clients carry 3 pages.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/janitorial.html:202-207; /Users/alexmercedes/Downloads/Ecco Webside/day-porter.html:173-176; cross-refs: index.html, testimonials.html
- **Recomendación:** Use different testimonials per page (or clearly excerpt with consistent attribution); never alter a client quote between pages.

### Cross-sibling claim gaps: 24-hour proposal promise and eco-certification scope differ
- **Categoría:** content
- **Evidencia:** janitorial.html:231 promises 'detailed proposal within 24 hours' (claim also on index.html x3, services.html x1, quote.html x8) — day-porter.html makes no turnaround promise. Janitorial claims 'Green Seal certified, EPA Safer Choice approved' (L171, L194); day-porter claims only 'Green Seal certified' (L122, L164, eco-badge L165) — EPA Safer Choice absent.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/janitorial.html:171,194,231; /Users/alexmercedes/Downloads/Ecco Webside/day-porter.html:122,164-165,202
- **Recomendación:** Align the certification list and the proposal-turnaround promise across both service pages (and verify both certs are actually held before claiming).

### Stock-photo filenames leak third-party/SEO-hostile names; one filename contains a space and '(1)' suffix
- **Categoría:** content
- **Evidencia:** janitorial.html:75 src="images/stock/facility-site-contractors-commercial-janitorial-services-baltimore-md.webp" — 'baltimore-md' on an NYC site (filename indexes for the wrong city). day-porter.html:75 src="images/stock/61392d63add9bc08084ffa07_what-is-janitorial-services (1).webp" — raw space + '(1)' download artifact in a public URL, and a 'janitorial' filename used on the day-porter page. Both files exist and render, but names are unencoded download leftovers.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/janitorial.html:75; /Users/alexmercedes/Downloads/Ecco Webside/day-porter.html:75
- **Recomendación:** Rename to descriptive NYC-relevant slugs (e.g. nyc-commercial-floor-care.webp, day-porter-cart-corridor.webp) and update srcs.

### Minor ARIA/semantics issues: decorative hero bg given role=img, skip-link target not focusable, honeypot ARIA contradiction, grammar in section heading
- **Categoría:** a11y
- **Evidencia:** (1) Both pages L56: <div class="hero-img" style="background-image:..." role="img" aria-label="..."> — the image renders at opacity:.25 behind a navy overlay (purely decorative) yet is announced with a verbose label. (2) Skip link targets <section id="main"> without tabindex="-1" (focus may not move in all AT combos). (3) Newsletter honeypot (both pages): <div aria-hidden="true" class="sr-only"><input ... aria-label="Leave empty"> — aria-label inside aria-hidden is contradictory. (4) janitorial.html:72 heading 'What Janitorial Services Means' — subject/verb disagreement reads awkwardly vs day-porter's clean 'What Is a Day Porter?'. (5) cta-banner is a <div> with an h2, not a <section>, on both pages.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/janitorial.html:37,55-56,72,229,262; /Users/alexmercedes/Downloads/Ecco Webside/day-porter.html:37,55-56,200,233
- **Recomendación:** Mark hero-img aria-hidden (drop role/label), add tabindex="-1" to #main, remove aria-label from honeypot input, retitle to 'What janitorial service means', use <section> for cta-banner.

### Full-viewport hero (100vh/100svh) on interior service pages pushes all content below the fold
- **Categoría:** structure
- **Evidencia:** .page-hero{min-height:100vh;min-height:100svh;...background:var(--navy)} applies to both service pages — a detail page costs a full screen before any service information, with the hero photo at opacity:.25 under 4 decorative .orb elements. Consistent between the two pages (not a divergence), but a deliberate-looking System A pattern worth a design decision.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/janitorial.html:55-68; /Users/alexmercedes/Downloads/Ecco Webside/day-porter.html:55-68; css/styles.css (.page-hero)
- **Recomendación:** Consider a shorter interior-page hero (e.g. 60-70vh) so the intro section peeks above the fold.

## [pag-about]

### System A anti-pattern inventory on these pages: hero metrics, animated blur orbs, animated gradient banner, gradient avatar/stripe
- **Categoría:** anti-pattern
- **Evidencia:** Hero metrics rows on both pages (about L64: '12+ Years / 5 Boroughs / 200+ Businesses'; why-ecco L64: '100% Satisfaction Guarantee / Zero Missed Services / Same-Day Response'). Four .orb divs per hero: filter:blur(80px), opacity .45, animated 18-30s infinite, over a photo dimmed to opacity .25 (why-ecco's preloaded 8-nyc-skyline-night.webp is 232KB for that 25%-opacity backdrop). .cta-banner runs gradientShift 8s ease infinite on a 300% background (reduced-motion override exists). .val-card::after hover stripe linear-gradient(90deg,var(--navy),var(--blue)); .leader-avatar is a navy→blue gradient circle with letter initials instead of founder photos. Nav backdrop-filter plus 7 more backdrop-filter selectors exist in styles.css (.svc-tab.active, .svc-link, .svc-img-label, .photo-card-pill, .wiz-progress, .stage-back).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/about.html lines 58,64,90-93,149,155; /Users/alexmercedes/Downloads/Ecco Webside/why-ecco.html lines 29,57-58,64; css/styles.css .orb, .cta-banner, .val-card::after, .leader-avatar
- **Recomendación:** Treat as input for the design-system consolidation: drop hero metric rows and orbs, replace gradient devices with the single chosen accent.

### Decorative glyph inconsistencies: unhidden checkmarks, ARIA menu misuse, honeypot in aria-hidden container
- **Categoría:** a11y
- **Evidencia:** why-ecco: 4 of 5 .trust-icon divs have aria-hidden="true" but the 5th (✓, L240) does not; all 6 .promise-check ✓ (L112-137) lack aria-hidden; about stats-bar uses ✓ as .stat-num ×3 (L167-169) unhidden — screen readers announce 'check mark' before each label. Nav (both pages, L43): role="menu"/role="menuitem" + aria-haspopup on an <a href="services.html"> — ARIA menu pattern misapplied to site navigation links; aria-expanded on a link styled as dropdown trigger. Footer newsletter honeypot (L206/282): <div aria-hidden="true" class="sr-only"> contains an <input aria-label="Leave empty"> — focusable-element-in-aria-hidden contradiction (mitigated by tabindex="-1").
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/why-ecco.html lines 43,112-140,240,282; /Users/alexmercedes/Downloads/Ecco Webside/about.html lines 43,167-169,206
- **Recomendación:** aria-hidden all decorative ✓ glyphs, replace role=menu/menuitem with plain nav list semantics, remove aria-label from the honeypot input.

### Reveal-animation (rv) and section-structure drift between the two pages
- **Categoría:** component
- **Evidencia:** about.html applies rv to sec-head blocks (L88,98,146) and stats-bar (L163) but not its cta-banner (L172); why-ecco's sec-heads have no rv (L73,106,145) while its guarantee (L195) and cta-banner (L247) do. about's story section uses bespoke 'story-sec sec-white' wrapper; about's cta-banner and stats-bar sit as bare top-level divs outside any <section>, while why-ecco wraps every block in section.sec. Same shared components, two different composition conventions.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/about.html lines 72,88,98,146,163,172; /Users/alexmercedes/Downloads/Ecco Webside/why-ecco.html lines 73,106,145,195,247
- **Recomendación:** Adopt one rule (e.g. all sec-heads get rv; all banners live inside section.sec) and apply to both pages.

### Conflicting .story-img CSS definitions affect about.html story image
- **Categoría:** component
- **Evidencia:** css/styles.css contains two clusters for .story-img: (pos ~66473) .story-img{width:100%;height:250px;object-fit:cover;border-radius:12px;…} — written as if for an <img> (object-fit is a no-op on about's <div class="story-img">) — plus (pos ~72678) .story-img{border-radius:var(--rl);overflow:hidden;box-shadow:var(--shlg)} and .story-img img{width:100%;height:100%;object-fit:cover;min-height:400px}. Cascade result: 250px-tall wrapper (200px at one breakpoint, rule at pos ~93987) clipping an img forced to min-height:400px; radius 12px overridden to 18px. Two design iterations share one class name.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/about.html lines 81-83; /Users/alexmercedes/Downloads/Ecco Webside/css/styles.css .story-img rules (byte offsets ~66473, ~72678, ~89449, ~93987)
- **Recomendación:** Consolidate to a single .story-img definition (wrapper + img) and delete the orphaned img-style rule.

### Founder presentation: first names only, letter avatars, asymmetric titles
- **Categoría:** content
- **Evidencia:** about.html 'The People Behind the Standard' (L147-160): leaders are 'Alex' (Founder & CEO) and 'Bianca' (Co-Founder & COO) — no surnames (canonical: Alex Mercedes), letter-initial gradient avatars instead of photos. Title logic asymmetric: if Bianca is 'Co-Founder', Alex is also a co-founder. Roles are <p><strong> rather than structured markup; bios start with inline-styled <p>. Cross-page: sustainability.html L87 'When Alex and Bianca founded Ecco' is consistent; no founder content on why-ecco (good — no conflict).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/about.html lines 147-160
- **Recomendación:** Use full names (at least for the CEO), real photos or a deliberate no-photo treatment, and symmetric titles ('Co-Founder & CEO' / 'Co-Founder & COO').

## [pag-social-proof]

### Hero metrics row present on both pages (flagged anti-pattern), one with an unverifiable rating claim
- **Categoría:** anti-pattern
- **Evidencia:** testimonials.html:79 .hero-stats: '★ 5.0 Average Rating | 200+ Businesses Trust Us | All 5 Boroughs'. careers.html:65: 'Competitive Pay | Flexible Schedules | Growth Opportunities' — careers hero also drifts vs its own benefit card 'Flexible Scheduling' (line 95). Both use the System A heroEnter-animated white-on-navy treatment.
- **Ubicación:** testimonials.html:79; careers.html:65,95
- **Recomendación:** If the redesign removes hero metrics, these two pages are in scope; at minimum align 'Flexible Schedules' vs 'Flexible Scheduling' and source the 5.0 rating.

### Star ratings rendered as raw text glyphs with no accessible alternative
- **Categoría:** a11y
- **Evidencia:** 6x <div class="test-stars">★ ★ ★ ★ ★</div> — screen readers announce 'black star' five times per card; no aria-label='Rated 5 out of 5' / aria-hidden pairing. Also styles.css gives .test-stars{display:flex;gap:.25rem} but the markup is a single text node, so the flex gap does nothing (spacing comes from literal spaces). Hero '★ 5.0 Average Rating' same issue.
- **Ubicación:** testimonials.html:127,137,147,157,167,177,79
- **Recomendación:** Use <div class="test-stars" role="img" aria-label="Rated 5 out of 5 stars"><span aria-hidden="true">★★★★★</span></div>.

### Brand-voice drift vs PRODUCT.md direction: em dashes (8 + 10 occurrences) and Title Case headings/labels throughout
- **Categoría:** typography
- **Evidencia:** Em dashes: testimonials.html 8 (incl. title 'Testimonials — Ecco Facilities LLC', 'unreliable — missed visits', 'The Avalon Residences — Upper West Side', 'Property Management — Residential Building'); careers.html 10 (incl. 'fully paid', 'not required — we train you', autoresponse '— The Ecco Facilities Team'). Title Case copy: 'Trusted Across Every Industry', 'All Industries', 'What We Offer', 'Current Openings', 'How It Works', 'Apply Below ↓', 'Submit Application →' — while the same pages' h1s are sentence case ('Don't take our word for it. Take theirs.' / 'We don't just clean buildings. We build careers.'). System A pages predate the System B rule, but the mix is visible within single pages.
- **Ubicación:** testimonials.html:13,93,103,104,113,116-122,219; careers.html:13,64,85,101,124,133,161,195,210,319
- **Recomendación:** When the brand direction is unified, run a site-wide pass: sentence case for headings/buttons, replace em dashes with periods or commas.

### careers.html: timeline steps animate by two different mechanisms; steps 4-5 carry dead classes
- **Categoría:** js
- **Evidencia:** Steps 1-3: class="timeline-step rv rv-d1..d3" (IntersectionObserver scroll reveal). Steps 4-5: class="timeline-step rv-d1 timeline-step-anim-1" / "rv-d2 timeline-step-anim-2" — no base .rv, so rv-d1/rv-d2 (transition-delay helpers) are dead; instead styles.css animates them on page load (.timeline-step-anim-1{animation:fadeUp .7s var(--ease) .1s both}), finishing long before the below-fold timeline is scrolled into view. Result: steps 1-3 fade in on scroll, 4-5 are already static.
- **Ubicación:** careers.html:164-188; css/styles.css (.timeline-step-anim-1/2)
- **Recomendación:** Use one mechanism for all five steps (rv rv-d1..d5 or all load-time animations); delete the dead rv-dX classes.

### careers.html: autoresponse email carries orphaned tagline 'Cleaning The Future, Today'
- **Categoría:** content
- **Evidencia:** _autoresponse value ends '— The Ecco Facilities Team | Cleaning The Future, Today | eccofacilities.com'. That tagline appears nowhere on any visible page — its only other occurrence is emailjs-template.html (an internal email template that is itself deployed publicly). Footer brand line everywhere else is 'Premium eco-friendly janitorial and facility services across all 5 boroughs of New York City.'
- **Ubicación:** careers.html:210; emailjs-template.html:1
- **Recomendación:** Align the autoresponse sign-off with current brand voice or drop the tagline.

### Neither page participates in dark mode; both are pure System A with foreign accent colors layered on
- **Categoría:** dark-mode
- **Evidencia:** Both pages load only css/styles.css?v=15.1 (System A: Cormorant Garamond + DM Sans, navy/blue/cool-cream). No [data-theme] hooks, no prefers-color-scheme handling (dark mode exists only in quote.html's System B). Foreign colors on these pages: #F59E0B amber stars, plus the 4 off-palette avatar gradient hues (#8244a8, #c43a5c, #C87830, #2a8a8a). Zero System B (sage/warm-cream/Fraunces) presence — no internal A/B clash on these pages, but a user moving testimonials→quote.html experiences a full design-language switch.
- **Ubicación:** testimonials.html:28,30,41,130-180; careers.html:28,30
- **Recomendación:** Note for synthesis: these two pages are coherent System A surfaces; unification work is about A↔B divergence at page boundaries, plus removing the off-token hexes.

## [pag-green]

### Hero image preload inconsistent: sustainability preloads its LCP image, accessibility does not
- **Categoría:** performance
- **Evidencia:** sustainability.html:29 <link rel="preload" href="images/stock/12-green-products.webp" as="image">; accessibility.html has no preload and its hero (images/stock/hero-office.webp, 87KB) is only discoverable via the inline background-image style at line 55 — late LCP discovery.
- **Ubicación:** accessibility.html:28-29 (absent) vs sustainability.html:29
- **Recomendación:** Add the same preload line for hero-office.webp.

### Minor ARIA/touch-target issues shared by both pages
- **Categoría:** a11y
- **Evidencia:** (1) Breadcrumb separators <span>/</span> and footer-legal <span>·</span> are not aria-hidden — announced by screen readers. (2) cert-ico card 1 uses literal '✓' WITHOUT aria-hidden (sustainability:98) while cards 2-3 wrap SVGs in aria-hidden spans. (3) `.footer-social a` is 36x36px vs project 44px touch rule (`.nm-social a` is correctly 44px). (4) Newsletter honeypot: <div aria-hidden="true" class="sr-only"> wraps an <input ... aria-label="Leave empty"> — contradictory ARIA (hidden ancestor + labeled control).
- **Ubicación:** sustainability.html:60,98,248,253; accessibility.html:58,175,180; css/styles.css .footer-social a
- **Recomendación:** aria-hidden the separators and the ✓ glyph, bump footer social targets to 44px, drop the honeypot aria-label.

### Anti-pattern inventory on these pages: side-stripes, hero metrics, animated gradient banner, glassmorphism nav
- **Categoría:** anti-pattern
- **Evidencia:** `.problem-sec::before` = 4px vertical green gradient stripe (sustainability 'The Hidden Problem' section); `.eco-note{border-left:3px solid var(--green)}` (accessibility 'Feedback' box); `.hero-stats` metric rows on both heroes ('100% Eco-Certified / Zero VOCs / Plant-Based Products'; 'WCAG 2.1 AA / Keyboard Accessible / Screen Reader Ready'); `.cta-banner{background:linear-gradient(-45deg,#0b1d38,#1e3562,#0f2847,#162d52);background-size:300% 300%;animation:gradientShift 8s ease infinite}` on both (correctly disabled under prefers-reduced-motion); nav backdrop-filter glassmorphism. Gradient TEXT (.hero h1 em shimmer) exists in System A but does NOT apply here — sustainability's h1 <em>safest.</em> has no matching rule (.page-hero h1 em absent) and renders plain italic, a drift vs index's gradient em.
- **Ubicación:** sustainability.html:62,64,72,216; accessibility.html:62,123,142; css/styles.css
- **Recomendación:** Decide per redesign direction: remove side-stripes and animated gradient, keep hero rows as plain text if retained, and either style or drop the h1 em device consistently.

### Misnamed/drifted components: .green-box renders navy, .benefit-num holds icons not numbers
- **Categoría:** component
- **Evidencia:** `.green-box{background:linear-gradient(135deg,var(--navy) 0,var(--navy-l) 100%)}` — the LEED callout on the sustainability page is navy despite the class name and the page's green theme. `.benefit-num{font-size:2rem}` was built for numeral glyphs but all five benefit cards now contain 22px SVGs (lines 178-194), leaving the rule inert. Sections at lines 154 and 172 also omit the .sec-lbl kicker used by the page's other four sections.
- **Ubicación:** sustainability.html:154,156,172,174,178-196,201; css/styles.css .green-box,.benefit-num
- **Recomendación:** Rename or restyle green-box, rename benefit-num to benefit-ico (with cross-page grep first per CSS-purge lesson), and add kickers or accept the rhythm break deliberately.

### Accessibility statement freshness/completeness gaps
- **Categoría:** content
- **Evidencia:** 'This statement was last reviewed on April 1, 2026' (line 137) predates the June 2026 quote-form dark-mode overhaul (commits D125-D129). Feedback channel is email-only with no phone or postal address; enforcement section names DOJ but the statement omits the formal standards/technologies citation for the quote flow's separate stylesheet/dark theme.
- **Ubicación:** accessibility.html:124-126,131-132,136-137
- **Recomendación:** Re-review after the quote-form changes land, add phone + address to the feedback block once canonical contact data is published.

### Visible breadcrumbs lack BreadcrumbList structured data sitewide
- **Categoría:** seo
- **Evidencia:** Both pages render <nav aria-label="Breadcrumb"> trails; grep 'BreadcrumbList' across *.html and blog/*.html → 0 matches.
- **Ubicación:** sustainability.html:60; accessibility.html:58; sitewide
- **Recomendación:** Emit BreadcrumbList JSON-LD matching the visible trail.

## [pag-blog-index]

### blog.html card for dirty-office post truncates the title ('…Impacts Productivity' vs h1 '…Impacts Productivity in NYC')
- **Categoría:** content
- **Evidencia:** Card h3 (blog.html line 91): "The Hidden Cost of a Dirty Office: How Cleanliness Impacts Productivity"; post h1/title: "The Hidden Cost of a Dirty Office: How Cleanliness Impacts Productivity in NYC". The other 6 cards match their posts' h1 verbatim; all 7 card links resolve to existing files; all 7 card dates match the posts' visible article-meta dates; cards are text-only (no thumbnails), so no image mismatches possible.
- **Ubicación:** blog.html line 91 vs blog/dirty-office-costs-productivity.html h1
- **Recomendación:** Align the card title with the post h1 (or vice versa).

### Title suffix and date semantics inconsistent: 'Ecco Facilities LLC' vs 'Ecco Facilities'; no <time> elements; sitemap lastmod drift
- **Categoría:** seo
- **Evidencia:** blog.html title: "Blog — Ecco Facilities LLC"; all 7 post titles end "— Ecco Facilities" (no LLC). 0 <time> elements across all 8 blog files — dates live in plain divs (`<div class="article-meta">By the Ecco Facilities Team · <strong>March 15, 2026</strong></div>`). sitemap.xml lastmod for the 3 older posts = 2026-04-03 while their dateModified meta = 2026-03-29. No BreadcrumbList schema despite visible breadcrumbs; blog.html has no Blog/ItemList schema.
- **Ubicación:** blog.html line 13; blog/*.html line 13; sitemap.xml blog entries
- **Recomendación:** Standardize one brand suffix; wrap dates in <time datetime>; regenerate sitemap lastmod from page dateModified.

### Posts lack fonts.gstatic.com preconnect and lazy-load their near-fold hero image
- **Categoría:** performance
- **Evidencia:** blog.html has `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`; all 7 posts have only the fonts.googleapis.com preconnect (grep fonts.gstatic.com: blog.html=1, every post=0). Post hero `<img src="../images/stock/22-handshake.webp" ... loading="lazy">` sits directly under the short hero — an LCP candidate lazy-loaded; no width/height attrs (height fixed at 300px via inline style, so CLS contained).
- **Ubicación:** blog/5-signs-cleaning-company.html lines 28, 68; blog/janitorial-vs-day-porter.html lines 28, 68; blog/eco-certified-cleaning-matters.html lines 28, 68
- **Recomendación:** Add the gstatic preconnect to posts; drop loading=lazy on the post hero image (or preload it as blog.html does).

### Stock imagery weakly matched to topics; unsourced and over-promising claims in eco post
- **Categoría:** content
- **Evidencia:** 5-signs hero: 22-handshake.webp alt "Professional business handshake" for an article about cleaning corner-cutting; janitorial-vs-day-porter hero: generically named 4.webp alt "Modern office workspace". eco-certified line 76: "Studies show that workers in facilities cleaned with harsh chemicals take more sick days" — no source; line 78: "Your turnover decreases. Your sick days drop." — flat guarantees; line 89: "every single product we use is Green Seal certified" — consistent with why-ecco.html ("100% Green Seal certified, non-toxic") but stronger than index/sustainability phrasing ("100% eco-certified"); keep claims aligned site-wide.
- **Ubicación:** blog/5-signs-cleaning-company.html line 68; blog/janitorial-vs-day-porter.html line 68; blog/eco-certified-cleaning-matters.html lines 76, 78, 89
- **Recomendación:** Swap heroes for topic-relevant images; cite or soften the studies/outcome claims; standardize the certification claim wording across pages.

## [pag-blog-posts]

### Duplicate hero image across two cross-linked posts, with divergent alt text for the same file
- **Categoría:** content
- **Evidencia:** choose post and checklist post (published one day apart, each recommending the other or appearing together in More Articles) both use ../images/stock/Corporate Offices.webp as hero; alts differ for the identical image: "NYC office building lobby" (choose) vs "Modern corporate office space" (checklist). Also unencoded spaces in src URLs ("Corporate Offices.webp", "Coworking Spaces.webp") — technically invalid attribute URLs browsers must auto-encode — and asset naming is inconsistent (lowercase "gyms.webp" referenced vs Title-Case-with-spaces real files).
- **Ubicación:** blog/choose-commercial-cleaning-company-nyc.html line 68; blog/commercial-cleaning-checklist-nyc.html line 68
- **Recomendación:** Give each post a distinct hero; normalize stock filenames to lowercase-hyphenated and update references.

### Publication date not machine-readable; heading-level wart in More Articles block
- **Categoría:** a11y
- **Evidencia:** Byline is <div class="article-meta">By the Ecco Facilities Team · <strong>April 5, 2026</strong></div> — no <time datetime> element (all 4 posts). og article:published_time uses date-only "2026-04-05" rather than full ISO 8601 datetime. In more-articles, the block label <h3>More Articles</h3> and each card title <h3> inside the <a class="article-link"> sit at the same heading level (3 sibling h3s), flattening the outline. Otherwise heading structure is clean: exactly one h1 per page, all sections h2, no skips.
- **Ubicación:** All 4 posts: line 67 (byline), line 18 (og meta), more-articles blocks (choose 144-158, checklist 111-125, dirty 103-117, benefits 132-146)
- **Recomendación:** Wrap dates in <time datetime="2026-04-05">, use full ISO datetimes in OG meta, demote card titles to h4 or styled non-headings.

### Unattributed or loosely attributed statistics in dirty-office and checklist posts
- **Categoría:** content
- **Evidencia:** dirty-office: "average office desk harbors roughly 400 times more bacteria than a toilet seat" (no source; the underlying U. of Arizona study is uncredited); "Studies from the Harvard Business Review suggest … up to 5% more productive" (HBR is a magazine, not a research body); "delivers a return of three to five times the investment"; "$2,000 to $5,000 per month" typical NYC cleaning cost (public pricing anchor synthesis should cross-check against the quote wizard). checklist: "Dirty light fixtures can reduce lighting output by up to 30 percent" (no source); "Hard floors … need to be stripped … and re-waxed every quarter" (aggressive vs industry norm of 1-2x/year, and strip/wax is positioned elsewhere as Ecco project work). Properly attributed: CDC $10.4B flu cost, Princeton Neuroscience Institute clutter research, EPA 2-5x indoor air pollution, WGBC 8-11% productivity.
- **Ubicación:** blog/dirty-office-costs-productivity.html lines 74,80,95-96; blog/commercial-cleaning-checklist-nyc.html lines 93,99
- **Recomendación:** Attribute or soften the unsourced figures; have Alex confirm the $2,000-$5,000/month public price anchor and the quarterly strip/wax cadence claim.

### Title and meta-description length overruns
- **Categoría:** seo
- **Evidencia:** dirty-office <title> is 97 chars ("The Hidden Cost of a Dirty Office: How Cleanliness Impacts Productivity in NYC — Ecco Facilities") — will truncate in SERPs (~60 char display). Meta descriptions: checklist 181 chars, choose 169 chars (both over the ~160 display budget); dirty-office 172 chars; benefits 173 chars. All four descriptions exceed 160.
- **Ubicación:** blog/dirty-office-costs-productivity.html line 13; meta description line 14 in all 4 post files
- **Recomendación:** Trim titles to <60 chars before the brand suffix and descriptions to 150-160 chars.

### Breadcrumb truncation inconsistent across the 4 posts
- **Categoría:** structure
- **Evidencia:** dirty-office breadcrumb final crumb is shortened to "The Hidden Cost of a Dirty Office" while its h1 is the full "…: How Cleanliness Impacts Productivity in NYC"; the other 3 posts repeat the full h1 text verbatim in the breadcrumb. No documented truncation rule.
- **Ubicación:** blog/dirty-office-costs-productivity.html line 60 vs line 61; compare line 60 in the other 3 posts
- **Recomendación:** Pick one rule (always shorten long titles, or always mirror h1) and apply to all posts.

### meta charset declared after two inline tracking scripts; legacy script patterns
- **Categoría:** performance
- **Evidencia:** <meta charset="UTF-8"> sits at line 8 after the GTM (~480 bytes) and Clarity (~330 bytes) inline scripts — close to the 1024-byte limit within which charset must appear; best practice is first element in head. Also: HubSpot loader uses protocol-relative src "//js-na2.hs-scripts.com/245755967.js" (legacy pattern) and cookie-consent.js?v=1.1 is the only local script loaded without defer. Identical on all 4 posts (and site-wide).
- **Ubicación:** All 4 posts: lines 4-8 (charset position), lines 200-202/174-176/166-168/195-197 (scripts)
- **Recomendación:** Move charset to the first head element, use https:// for HubSpot, add defer to cookie-consent.js if its execution order allows.

### Design-system membership: all 4 posts are clean System A; decorative orb hero is the only flagged pattern
- **Categoría:** design-system
- **Evidencia:** All 4 load only css/styles.css?v=15.1 + Google Fonts (DM Sans + Cormorant Garamond); zero qf2/System B classes, no Fraunces/Caveat, no gradient text, no border-left side-stripes, no hero metrics in the posts themselves. Each hero contains <div class="hero-bg"><div class="orb"></div> x4 — the System A decorative-orb signature (glassmorphism-adjacent), aria-hidden not set on the decorative container. Script/CSS versions match the site standard (main.js?v=4.6, chat-widget.js?v=4.3, cookie-consent.js?v=1.1); no cache-buster drift in these 4 files.
- **Ubicación:** All 4 posts: line 30 (stylesheet), line 58 (hero-bg orbs), lines 198-200 area (scripts)
- **Recomendación:** No migration needed for these pages; when System A/B reconciliation happens, posts inherit whatever the marketing shell decides; consider aria-hidden="true" on .hero-bg.

## [pag-legal-util]

### Meta http-equiv X-Frame-Options / X-Content-Type-Options are invalid as <meta> and ignored by browsers
- **Categoría:** structure
- **Evidencia:** All 4 pages lines 10-11: <meta http-equiv="X-Content-Type-Options" content="nosniff"> and <meta http-equiv="X-Frame-Options" content="SAMEORIGIN">. Per spec these directives only work as HTTP response headers; _headers lines 2-3 already sets both correctly, so the meta tags are dead weight implying false security.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/privacy.html:10-11; terms.html:10-11; sitemap.html:11-12; 404.html:10-11
- **Recomendación:** Delete the two meta tags on all pages; rely on _headers.

### Brand-voice drift: em dashes and Title Case in visible copy; h1 style split reveals System A/B drift
- **Categoría:** content
- **Evidencia:** Em dashes (PRODUCT.md: none): sitemap.html:63 hero sub "…quotes, and more — all in one organized directory"; footer "New York City &mdash; All 5 Boroughs" on all 4 pages; <title>/og:title use "—" separator on all 4 (raw counts: privacy 3, terms 3, sitemap 5, 404 2, + 1 &mdash; each). Title Case (rule: sentence case): hero badges "Your Privacy Matters"/"Service Agreement"/"Complete Site Directory", sec-ttl "Everything in One Place", h1s "Page Not Found"/"Privacy Policy"/"Terms of Service" — while sitemap.html's h1 "Find exactly what you're looking for." already uses the newer sentence-case editorial style, so the four pages mix both conventions.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/sitemap.html:62-64,75; privacy.html:61-62; terms.html:61-62; 404.html:49; footers of all 4
- **Recomendación:** Convert badges/headings to sentence case and replace visible em dashes per brand direction (title-tag separator is a defensible exception — decide once and document).

### Decorative hero photos exposed to screen readers via role=img; privacy and terms share the identical handshake image
- **Categoría:** a11y
- **Evidencia:** <div class="hero-img" style="background-image:url('images/stock/22-handshake.webp')" role="img" aria-label="Professional handshake"> appears on BOTH privacy.html:57 and terms.html:57 (same image, same label, both also <link rel=preload> it at line 29); sitemap.html:57 same pattern with hero-office.webp "Modern office building". These are decorative backdrops behind text and should be aria-hidden, not announced. Also footer-legal links are 0.75rem (12px) with no padding (touch-target suspects <44px), and .footer-legal span{display:none} hides the "·" separator markup that all 4 pages still ship.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/privacy.html:29,57; terms.html:29,57; sitemap.html:30,57; css/styles.css .footer-legal rules
- **Recomendación:** Mark hero-img divs aria-hidden="true" (drop role/aria-label); give privacy or terms a distinct image; add padding to footer legal links.

### No BreadcrumbList JSON-LD despite visible breadcrumbs; page schema is minimal but clean (no stale address here)
- **Categoría:** seo
- **Evidencia:** privacy.html, terms.html, sitemap.html each render a breadcrumb nav (line 60) but grep BreadcrumbList = 0 on all 4 pages. The single WebPage JSON-LD per page (line 31/32) is valid JSON with publisher {"@type":"Organization","name":"Ecco Facilities LLC","url":"https://eccofacilities.com"} — notably it does NOT carry the stale/malformed address+phone reported on other pages, because it omits address/phone entirely. 404.html has no JSON-LD (acceptable).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/privacy.html:31,60; terms.html:31,60; sitemap.html:32,60
- **Recomendación:** Add BreadcrumbList schema to the three breadcrumbed pages; when the canonical Organization schema is fixed site-wide, reference it via @id rather than duplicating.

### sitemap.html categorization oddities: "Home" filed under "Get Started", query-param quote variants listed as separate pages
- **Categoría:** content
- **Evidencia:** Get Started card (lines 112-118, heading "Get Started") lists "Free Quote" (quote.html), "Janitorial Quote" (quote.html?service=janitorial), "Day Porter Quote" (quote.html?service=dayporter) — three entries for one page — plus "Home" (index.html) as the fourth get-started action. Resources card mixes Testimonials with blog posts. All links resolve (params handled by js/quote-flow.js), so functional but structurally misleading for a directory claiming to map the site.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/sitemap.html:110-119 ("Get Started" card), 101-108 ("Resources" card)
- **Recomendación:** Move Home out of Get Started (or drop it — logo/nav already covers it) and label the quote variants as one entry, or keep variants but mark them as pre-filled flows.

### All 4 pages are pure System A with heavy decorative treatment on utility pages; no dark-mode support while quote.html has Editorial Midnight
- **Categoría:** dark-mode
- **Evidencia:** Pages use only System A tokens/components: navy page-hero + 4 .orb divs (404 included), cool-cream .sec-cream (#F3F5F8) on sitemap, Cormorant Garamond/DM Sans, and the animated-gradient .cta-banner (background:linear-gradient(-45deg,#0b1d38,#1e3562,#0f2847,#162d52); background-size:300% 300%; animation:gradientShift 8s ease infinite) on privacy/terms/sitemap. No System B (sage/Fraunces) leakage — internally consistent — but none of the 4 pages respond to prefers-color-scheme while quote.html ships a full dark variant, so navigating quote → privacy (linked from the quote form's consent copy) jolts from Editorial Midnight to bright navy/white.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/privacy.html, terms.html, sitemap.html, 404.html (whole pages); css/styles.css .cta-banner/.orb rules
- **Recomendación:** For synthesis: decide whether utility/legal pages adopt System B's quieter editorial style (they are the most likely pages reached FROM the quote flow); at minimum tame the animated gradient banner and orbs on legal pages.

## [pag-quote]

### Typographic entity inconsistencies in V2 copy
- **Categoría:** content
- **Evidencia:** Line 950: 'One scan and we're done' uses a straight apostrophe; every other contraction on the page uses &rsquo; (17+ instances). Line 1026 textarea placeholder ends in three periods '...' while the space-other placeholder uses &hellip; (line 535). Size-screen h2 (lines 668-671) wraps identical text in both .qf2-prompt-sub-desktop and -mobile spans — pointless duplication.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/quote.html lines 535, 668-671, 950, 1026
- **Recomendación:** Normalize to &rsquo;/&hellip; and collapse the duplicate size h2 spans.

### Contradictory/stale step-number comments in quote.html
- **Categoría:** structure
- **Evidencia:** Comments label both the info screen (line 342) and space screen (line 431) 'STEP 3'; lines 543-545 stack three comments on one section ('STEP 3 · SPACE SIZE', 'STEP · LOCATION', 'STEP 6 · LOCATION'); lines 724-725 stack 'STEP 4 · SCHEDULE (Days)' and 'STEP 5 · SCHEDULE'. DOM order (location before size) also no longer matches any flow order; harmless at runtime (overlay model) but the comments actively mislead.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/quote.html lines 342, 431, 543-545, 724-725, 1060-1061
- **Recomendación:** Delete the numeric step labels from comments (flow order lives in FLOWS in JS) or renumber once.

### Global console.warn monkey-patch and console.warn fallback in production inline script
- **Categoría:** js
- **Evidencia:** quote.html lines 75-82 permanently overrides window console.warn to filter the Google Maps deprecation message; line 148 emits console.warn('[quote] Places init failed...') on error. Project rule bans console.log; a global console patch is riskier than the noise it suppresses (any other consumer of console.warn is affected).
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/quote.html lines 71-151
- **Recomendación:** Scope the filter to the Maps loader window only, or accept the deprecation noise; route the failure path through the existing toast/telemetry instead of console.

### Security headers duplicated as ignored meta http-equiv tags on all three quote pages
- **Categoría:** seo
- **Evidencia:** X-Content-Type-Options and X-Frame-Options delivered via <meta http-equiv> (quote.html lines 13-14; quote-janitorial.html lines 10-11; quote-dayporter.html lines 10-11) are ignored by browsers — these headers only work over HTTP, and _headers already sets both correctly for /*.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/quote.html lines 13-14; quote-janitorial.html lines 10-11; quote-dayporter.html lines 10-11; /Users/alexmercedes/Downloads/Ecco Webside/_headers
- **Recomendación:** Delete the meta duplicates.

### Minor DESIGN.md component-spec drift: avatar size, Fitness emoji, retired Other card, avif coverage
- **Categoría:** component
- **Evidencia:** DESIGN.md says Alina pill avatar 28px; shipped .qf2-alina-hero-avatar is 36px (30px mobile, source lines 9935-9936, 11869). DESIGN.md iconography lists 🏋️ for Fitness; page uses 💪 (line 512); the documented ❓ 'Other' card was replaced by the D9 catch-all input (lines 526-539); the doc says '8 service/space cards' but lists 10 emojis and the page renders 9 cards (3 service + 6 space). Only the welcome avatar <picture> includes an AVIF source (line 258); the other 7 instances are webp+jpg only.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/DESIGN.md lines 155-156, 173-177; /Users/alexmercedes/Downloads/Ecco Webside/quote.html lines 256-261, 512, 526-539
- **Recomendación:** Sync DESIGN.md iconography/components to shipped reality; add the avif source to the remaining avatar instances or remove it from the first for consistency.

### No phone number exists anywhere in the JS-enabled /quote experience
- **Categoría:** content
- **Evidencia:** The site footer (which carries no phone either, only email) is hidden on /quote; nav is hidden; the only tel: link on the page is inside <noscript> (and is the wrong number). A prospect mid-form who wants to call has zero path. Canonical phone (929) 280-9374 appears nowhere on the page.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/quote.html (whole document; footer lines 1144-1178 hidden)
- **Recomendación:** Add a quiet 'Prefer to talk? (929) 280-9374' line to the welcome or review screen, consistent with the editorial register.

### Keyboard-help popover uses role=dialog inside <details>; noscript users get two h1s
- **Categoría:** a11y
- **Evidencia:** quote.html lines 234-245: .qf-kbd-help-panel has role="dialog" but is a <details> disclosure — no focus trap, no aria-modal; dialog semantics over-promise. With JS off, both the noscript h1 'Request your free quote' (line 166) and the main sr-only h1 (line 214) are in the document.
- **Ubicación:** /Users/alexmercedes/Downloads/Ecco Webside/quote.html lines 164-191, 214, 234-245
- **Recomendación:** Change role=dialog to a plain region/tooltip pattern; suppress the sr-only h1 in the noscript context or demote the noscript title.

## [seo-meta]

### sitemap.xml lastmod stale across the board
- **Categoría:** seo
- **Evidencia:** Every lastmod is 2026-04-18 or earlier (blog posts 2026-04-03..05, legal 2026-04-03), while all page files were modified 2026-05-02+ and quote.html shipped 5 releases since (commits D125-D129 incl. dark mode, latest ~June). Today is 2026-06-10, so lastmod understates freshness by 7+ weeks sitewide.
- **Ubicación:** sitemap.xml (all 24 <lastmod> values)
- **Recomendación:** Update lastmod when pages change (ideally scripted from git log per file in the deploy step).

### No og:site_name or og:locale anywhere; og:description drifts from meta description on 4 pages
- **Categoría:** seo
- **Evidencia:** grep og:site_name = 0 files, og:locale = 0 files across all *.html and blog/*.html. og:description differs from meta description on index.html ('NYC' vs 'New York City' variants), accessibility.html (og 97 chars vs meta 160), sitemap.html (og 51 vs meta 143), quote.html (entirely different copy). hreflang absent sitewide (acceptable, monolingual en site; html lang="en" present on all public pages incl. blog — only the dev artifacts mobile-test.html and emailjs-template.html lack it).
- **Ubicación:** All public pages' <head>
- **Recomendación:** Add og:site_name 'Ecco Facilities' and og:locale 'en_US' to the shared head pattern; sync og:description with meta description unless intentionally different.

## [performance]

### Analytics coverage gap: legacy quote-janitorial/quote-dayporter pages have GTM+Clarity but no HubSpot loader
- **Categoría:** js
- **Evidencia:** hs-scripts.com loader present on 23 pages (16 root + 7 blog; quote.html injects it dynamically at quote.html:1204). quote-janitorial.html and quote-dayporter.html are the only public pages without it, while they do carry GTM-W2ZWXZ3T and Clarity w546w8zoh2 (2 matches each). If these legacy wizards still receive traffic, HubSpot misses those conversions; no page duplicates any analytics tag (verified counts)
- **Ubicación:** quote-janitorial.html, quote-dayporter.html
- **Recomendación:** Either add the HubSpot loader to both legacy quote pages or 301 them to /quote.html and retire them

### Cache-buster census: consistent in working tree (no stale-cache bug), but the consistency depends on a 30+ file uncommitted batch landing atomically
- **Categoría:** performance
- **Evidencia:** Deployable-tree census: styles.css?v=15.1 ×25 pages, main.js?v=4.6 ×25, chat-widget.js?v=4.3 ×24, cookie-consent.js?v=1.1 ×25, quote-flow.css?v=50.3 ×1, quote-flow.js?v=38.0 ×1 — uniform per asset (the brief's 'v=15.1 vs v=50.3' are different assets, not drift; the divergent v=16.3/18.8/18.13 hits live only under gitignored .claude/worktrees/). Only straggler: untracked quote.backup.html pins styles.css?v=13.7, main.js?v=4.4, quote-flow.* v=9.0. Risk: HEAD still serves chat-widget.js?v=4.2 while the working tree bumped to 4.3 alongside modified js/chat-widget.js + 24 modified pages — per project rule these must ship in one commit or live pages will mix new HTML with cached old JS. _headers gives /css/* and /js/* max-age=2592000 (busting relies entirely on ?v=)
- **Ubicación:** all *.html + blog/*.html; _headers; git status (M on 30+ files)
- **Recomendación:** Commit the pending bump as a single atomic commit; nothing else to fix

### chart.min.js / sortable.min.js correctly scoped to CRM — verified no public page loads them
- **Categoría:** performance
- **Evidencia:** grep across all deployable HTML: chart.min.js (205,889B) loaded only by crm/index.html; sortable.min.js (45,092B) only by crm/pipeline.html. /crm/* has noindex header + no-cache. The 250KB sits publicly fetchable under /js/ but costs public visitors nothing
- **Ubicación:** js/chart.min.js, js/sortable.min.js, crm/index.html, crm/pipeline.html, _headers
- **Recomendación:** No action needed; optionally move CRM-only libs under /crm/ for cleanliness

## [js-conducta]

### Console statement census: zero console.log, but 7 warn/error sites plus a global console.warn monkey-patch on quote.html
- **Categoría:** js
- **Evidencia:** js/main.js: 0. js/chat-widget.js: 0. js/cookie-consent.js: 0. js/quote-flow.js: 2 console.warn (line 182 — localhost-gated; line 1778 Places-load failure). Inline HTML: quote.html:76-83 permanently overrides window console.warn to filter Google Places deprecation spam (global monkey-patch — can mask unrelated warnings containing similar text); quote.html:148 console.warn; quote-janitorial.html:583 and quote-dayporter.html:688 console.error('Submit error:', …) which logs prospective-client payload status to console.
- **Ubicación:** js/quote-flow.js:182,1778; quote.html:76-83,148; quote-janitorial.html:583; quote-dayporter.html:688
- **Recomendación:** Acceptable per the letter of the no-console.log rule, but replace the global console.warn patch with a scoped filter or accept the noise; route legacy-page submit errors to qfTrack-style telemetry instead.

### Chat widget dismiss/copy buttons are far below the 44px touch-target rule
- **Categoría:** a11y
- **Evidencia:** Injected CSS: .tip-close { font-size:.9rem; padding:.2rem } (line 103), .pn-close { font-size:.88rem; padding:.25rem } (line 157) ≈ 20-24px effective targets; .ecco-copy-btn { min-height: auto } (line 134) explicitly opts out of the project's 44px minimum. Contrast with .ecco-quick-btn / .ecco-chat-close which correctly use min-height/width 44px — rule applied inconsistently within the same file.
- **Ubicación:** js/chat-widget.js:103,134,157
- **Recomendación:** Give the three small controls min-width/min-height 44px with inline-flex centering per project rule.

### Hygiene niggles: hero-rotate interval never pauses; global Cmd/Ctrl+K hijack; GPC decline asymmetry; divergent GTM load strategies
- **Categoría:** js
- **Evidencia:** (a) main.js:380-383 setInterval rebuilds hero word DOM every 3400ms forever — keeps running when tab is hidden or hero is scrolled away (no visibilitychange/IO gate); char spans rebuilt via dynamic 'anim-'+def.anim class concat (line 339). (b) chat-widget.js:896-897 binds document-level Cmd/Ctrl+K to toggle chat on all 24 pages, shadowing the browser/extension search shortcut. (c) cookie-consent.js GPC branch (lines 3-8) sets only ecco_cookies='declined' while the manual decline path (25-32) sets both ecco_cookies AND ecco_consent and dispatches ecco:consent-declined — GPC users never trigger quote-flow's onConsentDeclined draft purge (quote-flow.js:605). (d) GTM/Clarity load synchronously in <head> on 24 pages (index.html:5,7) but via load+requestIdleCallback on quote.html:5,7 — same trackers, two strategies, inconsistent timing data.
- **Ubicación:** js/main.js:339,380-383; js/chat-widget.js:896-897; js/cookie-consent.js:3-8 vs 25-32; index.html:5,7 vs quote.html:5,7
- **Recomendación:** Gate the interval on document.visibilityState + an IntersectionObserver; drop or namespace the Ctrl+K binding; make GPC set both keys and dispatch the declined event; pick one tracker-loading strategy.

### chat-widget 'quote' page persona copy now only ever renders on the legacy quote pages it doesn't describe
- **Categoría:** content
- **Evidencia:** getPageContextKey() matches /\/quote(-|\.)/ (line 62), but quote.html stopped loading chat-widget.js (D125; verified script list). So PAGE_CONTENT['quote'] ('quote concierge', 'Most people finish in ~2 minutes', reply 'I'm stuck on a step', 28s nudge 'stuck on a step? Just ask.' lines 16-19,576) renders only on quote-janitorial.html/quote-dayporter.html — pages with a different, older wizard whose steps the copy wasn't written for.
- **Ubicación:** js/chat-widget.js:16-19,62,574-586; quote.html (widget absent), quote-janitorial.html/quote-dayporter.html (widget present)
- **Recomendación:** Either retire the legacy quote pages or rewrite the 'quote' context copy for them; delete it if the pages get redirected.

## [a11y-sistemica]

### Nav scroll-progress gradient fails 3:1 non-text contrast over the navy hero
- **Categoría:** a11y
- **Evidencia:** Progress bar rule: 'height:2px;background:linear-gradient(90deg,var(--green),var(--blue));width:var(--scroll-progress,0%)'. Over white scrolled nav: green 5.33:1, blue 5.66:1 (pass). While nav is transparent over the navy hero: --blue #3068AD on #0B1D38 = 2.97:1 (fails 1.4.11 3:1), --green = 3.16:1 (marginal). It is an informational progress indicator, not pure decoration.
- **Ubicación:** css/styles.css nav ::after progress rule; all pages with hero/page-hero (27)
- **Recomendación:** Use --blue-l #4A82C7 (4.26:1 on navy) for the blue stop while over dark heroes, or treat as decorative and accept.

### Visible nav group label hidden from assistive tech
- **Categoría:** a11y
- **Evidencia:** <span class="nm-label" aria-hidden="true">Company</span> in the mobile nav drawer on all 27 nav pages — sighted users get a group heading, screen reader users don't. Other aria-hidden usage audited clean: cert-marquee duplicate set correctly hidden (index.html line 173 vs duplicate aria-hidden set), Mailchimp honeypot aria-hidden + tabindex=-1, zero aria-hidden on anchors across all pages.
- **Ubicación:** All 27 pages with <div class="nm" id="navMenu"> (e.g. index.html line 137)
- **Recomendación:** Remove aria-hidden and expose it as a group label (e.g. role=group aria-labelledby), or accept as decorative consistently.

### Marketing form focus indicators rely on subtle replacements after outline:0
- **Categoría:** a11y
- **Evidencia:** 8 outline:0/none occurrences in styles.css. '.form-input:focus{outline:0;border-color:var(--green);box-shadow:0 0 0 3px var(--gbg)}' where --gbg = rgba(45,122,50,.07) — a 7%-alpha ring is imperceptible; the border-color change to --green (5.14:1) carries the indicator alone at 1.5px width. '.footer-nl-form input:focus{outline:0;border-color:var(--green-l)}' = 1px border shift on navy. These :focus rules (specificity 0-2-x) override the global 'input:focus-visible{outline:2px solid var(--focus-ring)}' (0-1-1). Quote flow is stronger: 27 :focus-visible rules incl. 'main.q-flow [role=button]:focus-visible'.
- **Ubicación:** css/styles.css .form-input/.form-select/.form-textarea:focus, .footer-nl-form input:focus, .fg input/textarea/select (base outline:0)
- **Recomendación:** Raise --gbg ring alpha (e.g. .35) or restore a 2px outline on :focus-visible for these inputs.

### White-on-green-l hover states drop below AA
- **Categoría:** a11y
- **Evidencia:** '.nm.active .nc:hover{background:var(--green-l)}' puts white .9rem/600 text on #3D9A43 = 3.56:1; same pattern wherever --green buttons hover to --green-l ('.footer-nl-form button' transitions background, hover state not extracted but token pair computed). Resting state (white on --green #2D7A32 = 5.33:1) passes.
- **Ubicación:** css/styles.css .nm.active .nc:hover and any btn hover using --green-l; all pages
- **Recomendación:** Hover to a darker green (e.g. #236128, already used in chat CTA gradient) instead of lighter.

### Publicly deployed dev artifacts lack skip links, landmarks, and (two) viewport metas
- **Categoría:** a11y
- **Evidencia:** skip-link count = 0 and <main> count = 0 on: mockups.html, font-compare.html, font-specimen.html, color-swatches.html, index-reference.html, mobile-test.html, emailjs-template.html. mobile-test.html and emailjs-template.html have no viewport meta at all.
- **Ubicación:** 7 dev HTML files at repo root (deployed by Cloudflare Pages)
- **Recomendación:** Exclude dev artifacts from deploy (_redirects/robots or delete) rather than retrofitting a11y onto them.

### Global Cmd/Ctrl+K hijacked to toggle chat on 24 pages
- **Categoría:** js
- **Evidencia:** chat-widget.js line 897: document-level keydown intercepts metaKey/ctrlKey + 'k' with preventDefault, overriding the browser's address-bar/search shortcut sitewide. No remapping mechanism (WCAG 2.1.4 concerns character-key shortcuts only, so not a strict failure, but it steals a common browser shortcut).
- **Ubicación:** js/chat-widget.js line 897; 24 pages loading chat-widget.js
- **Recomendación:** Drop the shortcut or scope it to when the widget already has focus.
