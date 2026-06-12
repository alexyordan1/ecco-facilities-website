# Estandarización Integral del Sitio — Roadmap Maestro

> **For agentic workers:** Este es el roadmap estratégico. Cada fase se ejecuta con su PROPIO plan detallado (creado con superpowers:writing-plans al iniciar la fase, sobre el estado real del código en ese momento). La Fase 0 ya tiene plan ejecutable: [2026-06-10-fase0-hotfixes-p0.md](2026-06-10-fase0-hotfixes-p0.md). REQUIRED SUB-SKILL al ejecutar cada plan de fase: superpowers:subagent-driven-development o superpowers:executing-plans.

**Goal:** Unificar los 5 sistemas de diseño de eccofacilities.com en uno solo (Híbrido Editorial: Cormorant Garamond, crema cálido, sage único acento, dark automático sitewide) y cerrar los 401 hallazgos de la auditoría 2026-06-10.

**Architecture:** Un único sistema de tokens en `css/styles.css` (`:root` light + `@media (prefers-color-scheme: dark)`) consumido por las 25 páginas incluido el quote form; chrome compartido (nav/footer/flotantes) corregido una sola vez; rediseño de páginas por lotes; consentimiento real; purga final de todo lo muerto.

**Tech Stack:** HTML estático + CSS (@layer, custom properties) + JS vanilla · Cloudflare Pages · bunx clean-css-cli · Playwright + axe-core (tests/) · GTM con Consent Mode.

**Fuentes de verdad:**
- Auditoría: [docs/audits/2026-06-10-auditoria-exhaustiva.md](../../audits/2026-06-10-auditoria-exhaustiva.md) (401 hallazgos: 15 P0 · 112 P1 · 183 P2 · 91 P3) + [JSON](../../audits/2026-06-10-hallazgos-completos.json)
- Hoja de datos de claims (GATE de Fase 4): [docs/audits/2026-06-10-hoja-de-datos-claims.md](../../audits/2026-06-10-hoja-de-datos-claims.md) — requiere confirmación fila a fila de Alex

---

## Las 14 decisiones (confirmadas por Alex, 2026-06-10)

1. **Serif única: Cormorant Garamond** en todo el sitio (quote form migra de Fraunces). Cargar ejes itálicos REALES (hoy toda itálica de marketing es sintética).
2. **Dirección visual: Híbrido Editorial** — heroes/banners CTA en navy con titulares Cormorant en crema cálido; secciones de contenido en mundo crema cálido (como /quote) con tinta navy; **sage único acento; se eliminan el azul `#3068AD` y TODOS los degradados**.
3. **Teléfono: ninguno** en el sitio. Fuera (646) 303-0816; contacto de respaldo = info@eccofacilities.com; sin `telephone` en schema.
4. **CTA único: "Get your free proposal"** (sentence case) — reemplaza las 10+ variantes.
5. **Dark mode: TODO el sitio, automático por OS, sin botón.** Editorial Midnight extendido a las 25 páginas, AA verificado por componente.
6. **Testimonios: anónimos coherentes** — sin nombres/empresas reales, una versión canónica por testimonio; fuera el aggregateRating.
7. **Privacidad: consentimiento real** — Consent Mode default-denied; GTM/Clarity/HubSpot solo tras Accept; GPC respetado; policy reescrita honesta.
8. **Claims: solo hechos confirmados** — fuera absolutos imposibles y fila hero-metrics; supervivientes requieren hoja de datos confirmada.
9. **Dirección: solo área de servicio** — footer "New York City · All 5 Boroughs"; schema `areaServed` sin PostalAddress ni geo; Albany solo en Privacy/Terms.
10. **Iconos: SVG trazo fino (1.5–2px) sage** en todo; el quote form migra sus emojis.
11. **Hero rotador: rotación en UN color** (itálica Cormorant real, sage claro AA sobre navy); fix screen readers; pausa fuera de viewport.
12. **Chat Alina: mantener y reconstruir** sobre el sistema unificado; URLs absolutas; disclosure única; fuera el chat de HubSpot.
13. **Fotos: stock curado coherente** — espacios comerciales NYC, sin handshakes; AVIF/WebP + srcset + lazy; fuera huérfanas y hotlink Unsplash.
14. **Limpieza: borrar todo lo muerto** (tarball de respaldo previo).

## Sistema de tokens objetivo (propuesta — se valida con contraste computado en Fase 1)

```css
/* LIGHT (:root) */
--ink:        #0B1D38;  /* navy — texto principal y fondo de heroes */
--ink-soft:   #1E3562;  /* navy claro — hovers, profundidad */
--surface:    #EEF2ED;  /* crema cálido base (heredado de qf2) */
--surface-2:  #F6F9F5;  /* crema elevado / cards */
--paper:      #FFFFFF;  /* tarjetas sobre crema */
--marfil:     #F5F1E6;  /* NUEVO — titulares Cormorant sobre navy (lo que Alex señaló; afinar hasta AA AAA sobre navy) */
--sage:       #2D7A32;  /* único acento */
--sage-deep:  #236128;  /* hover (NUNCA aclarar el verde en hover: #3D9A43 falla AA) */
--sage-soft:  rgba(45,122,50,.08);
--muted:      #4F5C6E;  /* gris texto secundario — el valor D62 que SÍ pasa AA (6.01:1); mata #6B7A8D y #7A8A9E */
--error:      #B23B3B;  /* único rojo (mata los otros 7) */
--edge:       rgba(45,122,50,.16);
/* sombras: SOLO 4 tokens (--sh-sm/md/lg/xl); radios: SOLO --r-card:18px, --r-ctl:12px, --r-pill:999px */

/* DARK (@media prefers-color-scheme: dark) — Editorial Midnight extendido */
--ink:        #EFE8D7;  /* marfil tostado */
--surface:    #1B2733;  --surface-2: #243441;  --paper: #243441;
--marfil:     #F5F1E6;  /* heroes navy quedan navy en dark: continuidad */
--sage:       #6FB376;  --sage-deep: #82C589;  --muted: #93A3B3; /* subir de #8A9AAB hasta AA real sobre surface-2 */
--on-sage:    #0F1A20;  /* texto sobre sage en dark (7.05:1) — NUNCA blanco (2.5:1) */
```

**Tipografía:** `--fd:'Cormorant Garamond'` (400/500/600/700 + italic 400/500/600 REAL) · `--fb:'DM Sans'` (400/500/600/700 + italic) · `--fh:'Caveat'` 500 (USO ÚNICO: firma de Alina). Una sola URL de Google Fonts para todo el sitio. Escala de headings única (clamp), 2 clases de eyebrow → 1, tracking unificado.

**Breakpoints:** SOLO `700px` (móvil) y `1024px` (condensado) — se documenta y se cumple.

## Fases

| # | Fase | Cierra (hallazgos) | Depende de | Esfuerzo |
|---|------|--------------------|------------|----------|
| 0 | Hotfixes P0 | 15 P0 + 8 P1 adyacentes | — | 1 sesión |
| 1 | Sistema de tokens unificado | ~60 (color 20, typography 14, spacing 6, tokens a11y) | 0 | 2 sesiones |
| 2 | Chrome compartido | ~45 (component nav/footer/flotantes, a11y estructural) | 1 | 2 sesiones |
| 3 | Consentimiento y legal | ~25 (P0 legal, js consent, policy/terms/accessibility) | 0 (paralelo a 1–2) | 1–2 sesiones |
| 4 | Páginas de marketing | ~150 (content 76, anti-pattern, copy, por-página) | 1, 2 + hoja de datos | 4–5 sesiones |
| 5 | Quote form alineación | ~40 (pag-quote, darkmode, purga V1) | 1 | 2 sesiones |
| 6 | SEO/Schema | ~48 (seo) | 4, 5 | 1 sesión |
| 7 | Performance + purga | ~29 (performance) + decisión 14 | 4, 5 | 1–2 sesiones |
| 8 | QA integral + deploy | verificación total | todas | 1 sesión |

### Fase 0 — Hotfixes P0 (plan ejecutable: [2026-06-10-fase0-hotfixes-p0.md](2026-06-10-fase0-hotfixes-p0.md))
Repara lo roto HOY sin rediseñar: og:image 404 universal → asset existente; logo blanco del blog; gyms.webp; URLs relativas del chat (pérdida de leads del blog); CTAs invisibles de why-ecco; testimonios ilegibles janitorial/day-porter; comparación desktop muerta de services; teléfono fuera; tarjetas fantasma del dark de /quote; botón cookies dark AA; careers (id duplicado, ?submitted=1, 48h vs 3-5 días); fechas del blog; noscript honesto; maximum-scale fuera; GPC simétrico; sitemaps. **Criterio de aceptación:** los 15 P0 cerrados, deploy verificado en vivo, sin tocar dirección visual.

### Fase 1 — Sistema de tokens unificado
`css/styles.css` reescrito alrededor del `:root` único (light+dark de arriba) manteniendo selectores actuales mapeados a los tokens nuevos (tabla de mapping 153→~20 en el plan de fase); fonts URL única con itálicas reales; escala tipográfica única; 4 sombras, 3 radios, 2 breakpoints; `color-scheme: light dark` + `<meta name="theme-color">` dual en todas las páginas. DESIGN.md y PRODUCT.md REESCRITOS (la tabla de contraste actual es falsa — regenerar computada; registrar decisiones 1–14). **Gate de salida:** script de contraste automatizado (todas las parejas token×superficie AA) + visual check claro/oscuro en index, services, quote.

### Fase 2 — Chrome compartido
Nav: fuera `role=menu`/aria-expanded mentiroso → nav links planos con dropdown accesible real (aria-expanded por JS + matchMedia), `aria-current="page"`, toggle 44px, Escape + focus management en menú móvil, CTA "Get your free proposal", logo correcto por contexto, scroll-progress en sage sólido (sin gradiente). Footer único: social 44px, newsletter con aria-live + 16px input, "New York City · All 5 Boroughs", © año dinámico-correcto, sin teléfono. Flotantes: política de esquinas sin colisiones (chat izq, cookies derecha-abajo, btt derecha; cta-float de index eliminado o coordinado), `<main id="main">` + skip-link en las 21 páginas que faltan.

### Fase 3 — Consentimiento y legal (paralelizable con 1–2)
Consent Mode v2 default-denied; GTM/Clarity cargan SOLO tras Accept; HubSpot tracking gateado en TODAS las páginas (patrón de quote.html); GPC = decline completo; banner con copy honesto. Privacy reescrita (divulga GTM/GA4, Clarity, HubSpot, Mailchimp, Turnstile + opt-outs; dirección Albany; fuera "CCPA Compliant" como badge → sección de derechos CCPA real). Terms con dirección legal. Accessibility statement honesto ("en proceso hacia WCAG 2.1 AA" hasta que Fase 8 valide; la página misma corregida). Fuera el chat de HubSpot (decisión 12).

### Fase 4 — Páginas de marketing (lotes, cada lote deployable)
Con tokens + chrome listos. **GATE: hoja de datos de claims confirmada por Alex.**
- **Lote A — index:** hero navy + marfil + rotador un-color accesible; fuera hero-metrics y "0 Missed Services"; secciones a crema cálido; fuera marquee-bajo-Alina (colisión); fotos curadas; FAQPage huérfano fuera; copy sentence case sin em dashes (~19), CTA único.
- **Lote B — services + janitorial + day-porter:** UN template de página de servicio (mata los dos forks: feature-/feat-, included-/handle-, space-card/space-item); comparación side-by-side restaurada; `?service=` consumido por quote-flow (preselección); inline styles → clases (27+2).
- **Lote C — about + why-ecco:** dedupe de claims repetidos (Green Seal, re-clean, "your team is your team" — UNA aparición); headings malformados `<h3>…</h4>` corregidos; foto Unsplash fuera; banners CTA con clases reales.
- **Lote D — testimonials + careers:** testimonios anónimos canónicos (un set, cero duplicados/variantes); careers con rangos salariales (de la hoja de datos — NYC Local Law 32), autocomplete en el form, JobPosting completo.
- **Lote E — sustainability + accessibility + blog (8) + legales + 404:** claims eco ajustados; template de post único (related-articles con clases existentes, fecha única, sin Title Case, 0 em dashes de ~240); 404 con paths absolutos + noindex.

### Fase 5 — Quote form alineación (paralelizable con 4 tras Fase 1)
Fraunces→Cormorant (ajuste óptico de tamaños: Cormorant rinde más pequeña a igual px); emoji→SVG en las 10 tarjetas; tokens qf2 → tokens únicos; dark completo sin fantasmas (tarjetas bienvenida, toasts, review screen `--rv-*` sin cobertura); flowbar dinámico por flujo; success "from info@"; purga V1: 57 getElementById huérfanos, 37 bloques dark muertos (~8% del CSS), guerra de 1,294 !important reducida; metas honestas. quote.html deja de cargar styles.css completo (o styles.css ya es liviano post-Fase 7 — decidir en plan de fase).

### Fase 6 — SEO/Schema
Entidad única: LocalBusiness completo SOLO en index con `@id`, páginas restantes referencian; `areaServed` (NYC + 5 boroughs) SIN PostalAddress/geo; sin aggregateRating; JobPosting con baseSalary/validThrough; og:image 1200×630 real (diseñada con el sistema nuevo) por tipo de página; títulos ≤60 + descripciones ≤160 con patrón único "… · Ecco Facilities"; sitemap.xml/html regenerados y completos; fuera g.co/kgs muerto (53 refs) → perfil real de Google Business si existe.

### Fase 7 — Performance + purga final
Tarball de respaldo → borrar: quote-janitorial/dayporter.html, index-reference, mobile-test, emailjs-template, quote.backup.html, *.original.js, quote-flow.backup.js, 39 imágenes huérfanas (10.55MB), CSS muerto (~31% de styles.css con protocolo grep cross-page de las lecciones), chart.min/sortable fuera de superficie pública. Imágenes: AVIF/WebP + `<img srcset>` (fuera background-image inline) + lazy + width/height + fetchpriority del hero. JS minificado (build step documentado) + defer universal + preconnect en blog. Objetivo: homepage <1MB transfer, LCP <2.5s.

### Fase 8 — QA integral + deploy
Suite Playwright+axe sobre las 25 páginas × claro/oscuro × 375/1440 (ya existe la infra en tests/); checklist AYS completo (/ays); verificación de los 401 hallazgos contra el JSON (cerrado/aceptado-con-razón); deploy y verificación EN VIVO (.pages.dev + dominio, hard refresh) por regla del proyecto; actualizar accessibility.html al estado real alcanzado.

## Protocolo de ejecución (todas las fases)

1. Al iniciar fase: plan detallado con `superpowers:writing-plans` sobre el código real del momento → `docs/superpowers/plans/2026-06-DD-faseN-*.md`.
2. Ejecutar con subagent-driven o executing-plans; commits frecuentes (conventional commits); `/ays` antes de CADA commit (hook lo fuerza); `leccionaprendida` ante cualquier error.
3. Trampas conocidas (memoria del proyecto): `bunx clean-css-cli` único minificador y **verifica que no haya perdido la línea `@layer …;:root{…}`**; JAMÁS perl/regex sobre CSS minificado multi-selector; grep TODOS los *.html antes de purgar CSS "muerto"; cache busters en el MISMO commit; serve.js sirve la raíz del proyecto (no worktrees).
4. Tras cada deploy de fase: verificar en vivo, no solo preview.

## Cobertura

Los 401 hallazgos del JSON quedan asignados así: F0=23 · F1=~60 · F2=~45 · F3=~25 · F4=~150 · F5=~40 · F6=~48 · F7=~29 · F8=verificación. Los P2/P3 de "pulido fino" no listados explícitamente se cierran dentro del lote de su página en Fase 4 (el plan de cada lote se redacta leyendo los hallazgos de su página en el JSON: `python3 -c "...[filtra por location]..."`).
