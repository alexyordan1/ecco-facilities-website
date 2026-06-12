# Auditoría exhaustiva del sitio eccofacilities.com — Informe maestro

**Fecha:** 2026-06-10 · **Método:** 21 agentes de auditoría (19 workflow + 2 re-runs) + verificación visual en navegador (desktop 1440px, móvil 375px, claro/oscuro) + verificación en producción (curl/live)
**Volumen analizado:** 26 páginas públicas + 2 CSS (380KB) + 4 JS públicos (350KB) + schema/meta/redirects/headers · ~3.4M tokens de análisis · 897 tool calls
**Hallazgos:** ~390 brutos → ~370 únicos · **12 P0 · ~100 P1 · ~180 P2 · ~90 P3**
**Artefactos:** `2026-06-10-raw-findings.json` (datos completos) · `2026-06-10-hallazgos-por-severidad.md` (390 fichas) · `2026-06-10-resumenes-inventarios.md` (censos por área)

---

## 0. Bloqueador de proceso (antes de tocar nada)

**El working tree está ~5 semanas detrás de producción.** Local HEAD `ee3ff48` (2026-05-02) vs `origin/main` `03f9d0b`. Producción tiene: robots.txt reescrito (2026-05-19, bloqueo de AI-bots + `/docs/`), sitemap.xml regenerado, y **3 landing pages que no existen localmente** (`manhattan-office-cleaning.html`, `day-porter-nyc.html`, `eco-friendly-commercial-cleaning-nyc.html`, las 3 responden 200 live). **Cualquier deploy desde este árbol borraría esas páginas y regresaría robots.txt.** Primer paso obligatorio del plan: `git pull` + re-verificar qué hallazgos ya corrigió origin/main (schema y teléfono confirmados NO corregidos upstream).

---

## 1. Veredicto global

El sitio no tiene "inconsistencias": tiene **dos sitios distintos conviviendo bajo un dominio**, más tres generaciones de sistemas muertos enterrados en los CSS.

- **Sistema A** (styles.css, 25 páginas): navy `#0B1D38` + azul `#3068AD` + verde `#2D7A32`, grises fríos, Cormorant Garamond, Title Case, em dashes, hero-metrics, gradiente verde→azul en el nav. Corporativo clásico.
- **Sistema B** (quote-flow.css, solo quote.html): cream sage `#EEF2ED`, sage como única voz, Fraunces, Caveat (firma de Alina), sentence case, sin em dashes, dark mode "Editorial Midnight". Editorial cálido — el documentado en DESIGN.md/PRODUCT.md como LA marca.
- **Sistemas fantasma:** tokens `--stage-*` definidos en un selector que no existe en ninguna página (205 referencias sin resolver), tokens `--qf-*` y `--rv-*` V1, y un tercer stylesheet sin tokens inyectado por chat-widget.js en 24 páginas (~190 colores hard-coded).

Navegar de la home (navy corporativo) a /quote (editorial cálido) parece cambiar de empresa. El censo: **153 hex distintos + 43 familias rgba (~220 variantes alpha)** contra ~25 tokens documentados. 5+ "creams" en 3 familias de matiz, 6 grises de texto, **8 rojos de error, 11 dorados, 16+ verdes**.

### Scores (framework impeccable, 0-4 por dimensión)

| Dimensión | Score | Hallazgo clave |
|---|---|---|
| Accesibilidad | 1.5/4 | Declaración pública AA falsa; --tm 4.23:1 en 26 págs; sin `<main>` en 23; dropdown ARIA congelado |
| Performance | 1.5/4 | 2.62MB JPEG inline-style en home (nunca lazy); 380KB CSS en /quote; 26% de styles.css muerto |
| Theming | 1/4 | 5 sistemas de tokens; 167 inline styles; dark mode solo en 1 página y con bugs |
| Responsive | 2.5/4 | Base sólida, pero cascade de padding invertido (móvil chico > tablet), overflow svc-showcase 769-1024px |
| Anti-patrones | 1.5/4 | Gradient text en el hero, hero-metrics en todas las páginas, glassmorphism nav, stock photos genéricas |
| **Total** | **8/20** | **Poor — overhaul mayor** (la página /quote sola puntuaría ~15/20; el delta ES el problema) |

---

## 2. Los 12 P0 (rotos / legales / factuales)

1. **Teléfono equivocado, y es el único del sitio.** quote.html:188 muestra `(646) 303-0816` (también en quote-flow.js:2162,2265 en mensajes de error). El canónico `(929) 280-9374` aparece en **cero** archivos. Ningún schema de 19 páginas declara `telephone`. Footer sin teléfono ni dirección. Confirmado vivo en producción.
2. **og:image / twitter:image / schema image / favicon de blog → `images/logo-vertical.png` que NUNCA existió** (ni en git). 62 referencias en 24 páginas; 404 en producción. Ninguna página del sitio tiene imagen al compartirse en redes; los 7 posts del blog tienen favicon roto.
3. **privacy.html §4 miente:** "We do not deploy third-party tracking cookies, analytics pixels..." mientras carga GTM (`GTM-W2ZWXZ3T`), Microsoft Clarity (grabación de sesión `w546w8zoh2`), HubSpot y GA4 en TODAS las páginas — incluida la propia política. Exposición legal CCPA directa.
4. **El banner de cookies es decorativo:** GTM y Clarity ejecutan en `<head>` antes de cualquier consentimiento; Decline/GPC solo frena HubSpot (y mal: el push es racy). Decline ≠ dejar de rastrear.
5. **Testimonios ilegibles en janitorial.html y day-porter.html:** `.test-sec`/`.test-single` jamás se definieron en CSS (verificado en todo el historial git); los hijos asumen fondo navy → texto blanco/`#C8D5E2` sobre página blanca = 1.04-1.36:1. En day-porter el h2 "What Day Porter Service Means..." es BLANCO sobre blanco.
6. **Botones invisibles en why-ecco.html:** el banner final usa `class="btn"` a secas (sin variante) sobre gradiente navy → botones transparentes con texto #1A1E2C ≈ 1.07:1. about.html usa correctamente `btn btn-white` en el mismo banner.
7. **Logo blanco sobre nav claro en los 7 posts del blog** (`../images/logo-horizontal-white.png` sobre nav `rgba(250,251,252,.92)`) — marca invisible en todo el blog. Verificado visualmente.
8. **Imagen hero rota en el post de day porter:** `../images/stock/gyms.webp` no existe (el archivo se llama "Gyms & Fitness.webp").
9. **Declaración de accesibilidad falsa:** accessibility.html afirma WCAG 2.1 AA y "sufficient color contrast throughout" con fallos medidos en tokens base (--tm 4.23-4.38:1, --tl 3.40:1, error #FF6B6B 2.78:1, footer-copy efectivo 2.92:1). Y la propia página viola jerarquía de headings/landmarks.
10. **Working tree detrás de producción** (sección 0) — bloqueador de cualquier fix.
11. **(agregado de 5+6)** patrón sistémico: clases referenciadas sin CSS / CSS sin consumidores — `.test-sec`, `.test-single`, related-articles del blog (7 posts con clases que ya no existen), `.qf2-grid-3--rich`, `.step-schedule`.
12. **Sitemaps (repo Y live) anuncian URLs que hacen 301** (quote-janitorial/dayporter, con canonical a sí mismas y sin noindex).

## 3. Hallazgos visuales confirmados en navegador (esta sesión)

- **Dark mode del quote form roto en la primera pantalla:** con OS en oscuro (auto desde D128), las 3 tarjetas quedan claras pero sus títulos cambian a tinta marfil → "Night cleaning / Day Porter / Combined" casi invisibles. Lo ve todo visitante con OS oscuro.
- **Rotador del hero con "frame muerto":** 3 de 4 capturas agarraron la frase colgada ("...at the expense of your ___"). Además cada palabra tiene color propio (future=azul-violeta con fringing, health=verde) = texto degradado/multicolor — prohibido por PRODUCT.md. El `<h1>` queda para lectores de pantalla como "budget.people." concatenado, y los spans por carácter se leen letra a letra.
- **La píldora "Ask Alina" tapa el chip "Insured"** de la franja de confianza (desktop) y **flota POR ENCIMA del menú móvil abierto** (z-index).
- **Drawer móvil verde vs nav desktop navy:** mismo componente, acento distinto por viewport.
- **CTA primario inconsistente a la vista:** nav "Get a Free Quote" (navy) vs hero "Get Your Free Proposal" (blanco) vs services "Get a Free Quote" (blanco) + 10+ etiquetas distintas para el mismo enlace según el censo de componentes.
- **Popup proactivo de Alina (services)** con tercer estilo de botón verde y em dash en el copy.
- Breadcrumb AZUL junto a eyebrow pill VERDE en la misma vista (services/about) — los dos acentos chocando.
- Rojo `#DC3545` (Bootstrap) en "What Most Companies Deliver" del home — tercer rojo, fuera de ambos sistemas.

## 4. Sistemas transversales (resumen; fichas completas en hallazgos-por-severidad.md)

### Color (33 hallazgos)
153 hex + ~220 rgba vs ~25 tokens. 5+ creams (#F3F5F8 frío / #F5F1EA beige / #EEF2ED sage / #FDF8ED-#FAF8F4 legacy), 6 muted-grays (System A aún usa #6B7A8D, el valor exacto que System B rechazó por fallar AA), 8 rojos de error (.v-hint.bad declarado DOS veces con rojos distintos en el mismo archivo), 11 dorados (2 oros de estrellas compitiendo: #F59E0B Tailwind vs #E8B229), 16+ verdes (gradientes de chat #236128/#1A4A20, shimmer #8FD48C/#6BD568, cookie #1F5B26...). Tokens --stage-* huérfanos (205 refs sin resolver en las páginas legacy). chat-widget.js inyecta ~190 colores hard-coded en 24 páginas. Exóticos: violetas, crimson, teal en avatares inline de testimonials; text-shadow neón rosa/cian en heroFutureChroma.

### Tipografía (15)
Marketing carga CERO ejes itálicos → **todas las itálicas de 24 páginas son sintéticas** (incluido el hero con gradient text). ~240 em dashes (regla: ninguno); quote.html es la única página limpia. ≈30 de 43 h2 en Title Case + 53 CTAs Title Case en 4 redacciones distintas. Escala h2 fragmentada en 9 specs; 27 letter-spacings distintos en eyebrows (.sec-lbl vs .sec-label duplicados). Sin h1: quote-janitorial/dayporter; con DOS h1: index y quote (noscript); 8 páginas saltan niveles. Inter y JetBrains Mono se sirven en el dominio vía dev artifacts. 12 referencias muertas a Cormorant en quote-flow.source.css.

### Componentes (26)
Nav y footer byte-idénticos en 22-25 páginas (la disciplina copy-paste aguantó) PERO: 2 sistemas de value-cards, **5 implementaciones de testimonios**, 2 patrones de blog-card, 4 wrappers de acciones de cta-banner, 3 sistemas de quote-form desplegados a la vez, 10+ etiquetas para el mismo CTA. Footer sin teléfono/dirección. cta-float (z89) tapa los botones del cookie banner (z60) en la home. HubSpot con consent-gate solo en quote.html, incondicional en 24. Dropdown Services: aria-expanded congelado + role=menu sin semántica de menú, en 26 páginas.

### Espaciado/Layout (13)
86 de 119 sombras hard-coded (77 recetas distintas) junto a 4 tokens definidos; radius 12px escrito a mano 13 veces junto a var(--r):12px; pills 50/100/999px mezclados. 27 anchos de contenedor en styles.css + ~20 en quote-flow vs los 760/920 documentados. **19 breakpoints** en quote-flow vs el único 700px documentado. Cascade móvil invertido en .sec (480px pisado por 600px → phones chicos con MÁS padding, 16 páginas). svc-showcase desborda viewport 769-1024px (enmascarado por overflow-x:hidden global). **167 inline styles** (regla: cero): 27 en janitorial/day-porter, 22-24 en cada wizard legacy. quote-flow: 1,294 !important.

### Dark mode (14)
Existe SOLO en quote.html; cambió de arquitectura 3 veces en 4 commits; DESIGN.md documenta el sistema retirado (data-theme, toggle, ecco_theme — las 4 afirmaciones falsas hoy). Auto-OS sin override de usuario (viola la propia regla "Adult: no surprise theme swaps"). Whiplash total /quote↔resto. Cookie banner en dark: botón Accept blanco-sobre-sage 2.5:1 (falla AA). Review screen (.qf-rv) sin cobertura dark activa (sus overrides viven en bloques muertos). 37 bloques `dark-DISABLED-V1-LEGACY` (17.2KB, 8.2% del CSS minificado) enviados a todos los visitantes. Toasts blancos hard-coded sobre midnight.

## 5. Por página (top issues; fichas completas en los artefactos)

- **index:** FAQPage JSON-LD huérfano (la sección visible se borró); maximum-scale=1.0 (WCAG 1.4.4); doble handler de .svc-tab que desincroniza ARIA; 2.62MB de JPEGs como background inline (nunca lazy); fetchpriority=high desperdiciado en el logo del nav; hero-metrics + "0 Missed Services" (sobre-promesa); claims de Google reviews probablemente no verificables; sameAs `g.co/kgs/eccofacilities` 404 (link fabricado).
- **services:** la comparación side-by-side desktop está MUERTA (un !important sin scope del svc-showcase de index mata el grid); `?service=` en los CTAs que quote-flow.js nunca lee (preselección silenciosamente descartada — también desde janitorial/day-porter y los 301); testimonios con atribuciones que contradicen otras páginas.
- **janitorial + day-porter:** son DOS templates bifurcados (10 familias de componentes paralelas para slots idénticos); testimonios ilegibles (P0); 27 inline styles.
- **about + why-ecco:** botones invisibles (P0); "David Chen" tiene 2 quotes y 2 empleadores distintos según la página; solapamiento temático sin deduplicar.
- **testimonials + careers:** aggregateRating auto-servida con reviewCount=6 vs 7 tarjetas visibles (riesgo de penalización de rich results); testimonios con evidencia de fabricación (cita a una firma NYC real prominente); careers: id="positions" duplicado (el anchor del hero cae mal), form redirige a ?submitted=1 que nadie maneja (cero feedback al aplicante), "48 hours" vs "3-5 business days" contradictorios, sin rangos salariales (exposición a ley de transparencia salarial NYC), PII sin autocomplete (WCAG 1.3.5).
- **sustainability + accessibility:** g.co 404; sin teléfono; la página de accesibilidad viola sus propios claims.
- **blog (índice + 7 posts):** logo blanco (P0), favicon roto (P0), related-articles con clases inexistentes en los 7 posts, fecha visible Feb 28 vs schema Mar 22 (janitorial-vs-day-porter), chat widget roto en todo /blog/ (avatar 404 + sus links de quote apuntan a /blog/* muertos), títulos SERP de hasta 96 chars.
- **privacy/terms/sitemap/404:** privacy P0 (arriba) + badge "CCPA Compliant" sin sustento; contactos legales sin dirección/teléfono y con "New York City, NY" vs Albany canónico; sitemap.html lista 3 de 7 posts y presume "20+ Pages / Always Updated"; 404.html con canonical inútil.
- **quote.html (System B, la referencia):** limpia en lo grande (0 inline styles, regla Caveat-única PASS, h1 único, staging inert correcto, 0 console.log) PERO: teléfono (646) P0; meta/OG prometen "Chat with Alina" retirado en D125; carga styles.css (166KB render-blocking) para usar solo .skip-link/.sr-only + nav/footer permanentemente hidden («noscript fallback» que noscript tampoco ve — comentario falso); casing "Night cleaning"/"Day Porter"/"Combined" vs "Both services" en el review; labels solo-placeholder (WCAG 3.3.2); promete mail desde alina@eccofacilities.com (buzón no canónico, sin referencia en backend); 4+ repeticiones del claim "24h"; fallbacks de var() con el cream pre-V2.
- **quote-janitorial/dayporter (legacy):** stale System A wizards, 301 en live pero git-tracked, self-canonical, en ambos sitemaps, cargan chat-widget, overlay con contraste sub-AA. Candidatas a borrado.

## 6. Técnico

- **SEO/Schema:** index con street="Albany, NY"+locality="New York"+geo de Manhattan City Hall; 16 páginas con stub sin dirección; 0 telephone; JobPosting sin validThrough/baseSalary (101 días); canonicals .html que hacen 308 a extensionless en live (27+ saltos); brand suffix en 3 variantes (— LLC / — sin LLC / · LLC); título de home "Home — Ecco Facilities LLC" (desperdicio total de keywords); index-reference/mobile-test/emailjs-template **200 en producción** sin noindex (el robots live no cubre las formas extensionless); `/docs/` interno servido público (planes de diseño a un URL-guess).
- **Performance:** ver scores; además ~10.4MB de imágenes desplegadas sin referenciar; *.original.js y quote-flow.backup.js (101KB) desplegados; nota: mockups/font-*/color-swatches/quote.backup están gitignored → NO desplegados (verificado 404 live).
- **JS:** 3 funnels de quote con 3 validadores de email; 2 sistemas de tabs en conflicto (rompe services y desincroniza index); chat-to-quote descarta 4 de 7 respuestas (STATE.prefill* nunca leído); exit-intent muestra éxito aunque el POST falle (pérdida silenciosa de leads); ⌘K secuestrado globalmente en 24 páginas; EMAIL_RE con lookbehind (mata el form entero en Safari <16.4 en parse-time); rv-light/rv-child = subsistema muerto (0 consumidores); contador de stats ignora prefers-reduced-motion (constante declarada y nunca usada); localStorage con 3 convenciones de nombres + ecco_theme huérfana.
- **A11y sistémica:** además de lo anterior — menú móvil sin Escape ni focus trap; focus trap del chat con orden equivocado y elementos fuera; touch targets <44px (social 36px, cookie ~31px, nav ~32px, tip-close ~21px = falla WCAG 2.5.8 dura); inputs de 13.4-14.1px que disparan zoom iOS (la causa real del maximum-scale=1 que a su vez está prohibido); placeholders 2.68:1 en wizards legacy.

## 7. Lo que SÍ está bien (preservar)

- quote.html/System B: disciplina real — 0 inline styles, Caveat-única, staging inert/aria-hidden, role=alert, aria-pressed, 39 bloques reduced-motion, inputs 16px, draft con TTL y consent-gate de PII, manejo de errores de submit diferenciado sin pérdida de datos.
- Skip-link presente y funcional en las 26 páginas; :focus-visible global con variante para secciones oscuras; aria-hidden limpio (268 usos, todos decorativos); syncSvcAria con matchMedia (la regla del proyecto, bien aplicada).
- Nav/footer estructuralmente idénticos en todas las páginas (la base para estandarizar existe).
- _headers con CSP, HSTS y cache razonables; _redirects correcto y verificado en live (el 301 SÍ le gana al asset en Cloudflare Pages).
- Heroes de marketing internamente consistentes entre sí (mismo patrón overlay+breadcrumb+eyebrow+serif+dual-CTA).

## 8. Decisiones que necesita tomar Alex (fase de preguntas)

1. **Dirección del sistema visual:** ¿A (navy corporativo), B (sage editorial), o híbrido? — define TODO lo demás.
2. Serif: ¿Fraunces o Cormorant Garamond? (B usa Fraunces; A Cormorant; cargar ambas es peso muerto.)
3. ¿El azul #3068AD sobrevive como acento secundario o muere (sage como única voz)?
4. Dark mode: ¿extenderlo a todo el sitio, dejarlo solo en /quote (con fix + override), o retirarlo?
5. CTA primario: una sola etiqueta canónica ("Get a free quote" vs "Get your free proposal" — y casing).
6. Teléfono (929) 280-9374 y dirección Albany: ¿publicarlos en footer/schema? ¿O mantener encuadre NYC sin street address visible? (Schema necesita ALGO correcto.)
7. Testimonios: ¿cuáles son reales/aprobados? (conflictos David Chen/Patricia Morales; aggregateRating).
8. Tracking: ¿gating real de consentimiento (Consent Mode default-denied) o reescribir privacy para divulgar? (alguna de las dos, legalmente.)
9. ¿Borrar quote-janitorial/dayporter/backup y artefactos dev del repo/deploy?
10. Hero rotator: ¿arreglar (sin gap, un solo color) o reemplazar por titular estático?
11. alina@eccofacilities.com: ¿existe el buzón? ¿Sender real del backend?
12. Claims a verificar: "12+ years", "200+ businesses", "0 missed services", "Quote in 24h", certificaciones eco exactas (Green Seal aparece solo en una página legacy).
