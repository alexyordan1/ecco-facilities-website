# Design System — eccofacilities.com (Noir)

> Reescrito 2026-07-17. Documenta el sistema **Noir** lanzado 2026-06-25 (`6276a67`), que reemplazó por completo al sistema anterior (styles.css/components.css, crema/sage, Cormorant). Si un doc o memoria menciona `#FAF7F2`, `#2D7A32`, "Cormorant" o "Alina", describe el sistema muerto: ignorarlo.

## Arquitectura de estilos

Dos hojas, sin `@layer`:

1. **`css/noir.css`** — el sistema completo del sitio. La cargan las ~22 páginas (raíz + blog). Un solo archivo: tokens `:root`, reset mínimo, componentes por sección (banners `════════════` en el fuente), responsive y reduced-motion al final de cada bloque.
2. **`css/quote-noir.css`** — SOLO `quote.html`, encima de noir.css. Skin Noir del wizard (`qf-*`/`qf2-*`). El motor del wizard es `js/quote-flow.js`.

**Cache busting (ley del repo):** todo cambio a un CSS/JS bumpea su `?v=` en el MISMO commit, en TODAS las páginas que lo cargan. Verificar versiones vigentes con `grep -o 'noir.css?v=[0-9]*' *.html | sort -u` (debe salir una sola).

**Minificación (desde 2026-07-17):** `css/noir.source.css` es el **master editable**; `css/noir.css` es el minificado que sirven las páginas. Flujo: editar el source → `bunx clean-css-cli -o css/noir.css css/noir.source.css` → validar (conteo de `{`/`@media` idéntico, tokens `:root` presentes, estilos de body en navegador) → bump `?v=` en las 22 páginas → mismo commit. Nunca minificar con regex; nunca editar noir.css directo (se pierde en la siguiente minificación).

## Tokens (`:root` de noir.css, verbatim)

| Token | Valor | Rol |
|---|---|---|
| `--accent` | `#9FCB7B` | ÚNICO color saturado: CTAs, links, focus, eyebrows, selection |
| `--accent-soft` | `#BBDD99` | hover/estados suaves del acento |
| `--accent-ink` | `#10210B` | texto sobre acento |
| `--black` | `#0C0E0D` | fondo base (negro cálido, no #000) |
| `--surface-1/2/3` | `#101312` / `#161A18` / `#1D2220` | elevaciones |
| `--ink` | `#F4F2EC` | texto principal (marfil, no blanco puro) |
| `--ink-dim` / `--ink-faint` | `#A8A89F` / `#8B8F88` | secundario / terciario |
| `--line` / `--line-strong` | blanco al 10% / 18% | bordes |
| `--maxw` | `1200px` | ancho de contenido (`.wrap`; `.wrap-wide` 1340px) |
| `--pad` | `clamp(1.25rem,5vw,4rem)` | padding lateral fluido |
| `--font-display` | `'Fraunces',Georgia,serif` | display serif |
| `--font-body` | `'Inter',system-ui,sans-serif` | cuerpo |
| `--nav-h` | `74px` | altura nav + scroll-padding |

El bloque del acento está marcado "SWAP-ONLY": recolorear el sitio = cambiar esas 4 líneas.

**Excepción documentada (veto de Alex):** el rotador del hero del home usa 6 colores por palabra (`--topic-*`). Es el único punto multicolor del sitio y **no se toca**.

## Dark-only

El sitio es **oscuro por diseño, sin modo claro ni toggle**: `html{color-scheme:dark}`. Implicaciones:
- Forms: hardening contra chrome nativo (overrides `:-webkit-autofill`; `color-scheme:dark` evita calendarios/scrollbars blancos). Auditar estados llenos/autofill, no solo reposo.
- `<meta name="theme-color">` acorde en cada página.
- Texto marfil (`--ink`), nunca `#FFF` puro sobre `--black`.

## Tipografía

- **Display:** Fraunces (serif, itálicas reales) para h1/h2/blockquotes; acentos en itálica dentro de titulares (`<em>`) como firma editorial.
- **Cuerpo:** Inter 400/500; `line-height:1.6`.
- **Eyebrow:** uppercase, tracking `.32em`, color acento, con regla-guion `::before` degradada.
- Sentence case en todo el copy (no Title Case).

## Componentes (secciones de noir.css)

NAV (fija, `--nav-h`, menú móvil `body.menu-open`) · HERO · SECTION SHELL (`.wrap`/`.wrap-wide` + `.eyebrow`) · SERVICES · WHY DIFFERENT · HOW IT WORKS · SIX COMMITMENTS (grid `.commit`) · INDUSTRIES (`.ind-grid`) · ECO/HEALTH · CERT MARQUEE (loop infinito: set duplicado N veces, translate exactamente −100%/N; medir ancho antes de elegir N) · BLOG/POSTS · CLOSING · FOOTER · COOKIE BAR · MOBILE STICKY CTA (`.mcta`) · SITEMAP DIRECTORY · 404 · QUOTE WIZARD (base) · MOBILE CRAFT · REDUCED MOTION.

Páginas interiores de servicio/industria: patrón **svc-hero (foto) + svc-figure + img-band + ind-grid** — ricas en imagen, nunca texto sobre negro plano. `images/stock/680bb….jpg` = foto real de marca Ecco (equipo verde).

## Reveal / motion

- Sistema `rv` (IntersectionObserver) para reveals de scroll. **Prohibido** en contenido crítico above-the-fold que deba verse sin JS.
- Fallbacks obligatorios: `@media (prefers-reduced-motion: reduce)` y `@media (scripting: none)` (fuerza visibilidad de `.rv`, comparadores, etc.).
- `position: sticky` no pinnea bajo un ancestro con `overflow != visible` (lección: `.qf-stage` del wizard) — verificar ancestros al añadir sticky.

## Responsive

Mobile-first por sección con buckets `max-width` (980/900/880/820/760/560/520 según componente; ~40 media queries). **Regla de verificación: todo cambio de UI se revisa en móvil Y desktop antes de "listo"**; iOS real no se reproduce en preview headless (pedir hard-refresh en iPhone para cambios de layout significativos).

## Accesibilidad (invariantes)

- Touch targets 44px (`inline-flex` + `min-height:44px`; el skip-link ya lo modela).
- `:focus-visible` con outline acento, offset 3px.
- `.sr-only` + `.skip-link` presentes en todas las páginas.
- ARIA viewport-aware vía `matchMedia`, nunca hardcodear `aria-hidden` en contenido visible en desktop.
- Headings en orden estricto.
- Contraste AA: marfil sobre negro/superficies cumple sobradamente; verificar computado (no estimado) al introducir combinaciones nuevas del acento.

## Quote wizard (resumen; detalle en el propio quote-flow.js)

- Flujos: `janitorial` / `dayporter` / `both` (FLOWS en quote-flow.js); rail de progreso por servicio; pantallas apiladas con `inert` en las inactivas; Esc = paso atrás.
- Cambio de servicio en sesión limpia los campos de pantallas que no existen en el flujo nuevo (fix F, 2026-07-17; test de regresión en welcome-and-resume.spec.js).
- Placeholders `'—'` para valores vacíos en el review = diseño intencional (no son prosa; no "corregirlos").
- Snapshot/PARITY tests asertan strings exactos del review: **cualquier cambio de copy del wizard exige grep previo en `tests/e2e/`**.

## JSON-LD / SEO

- URLs limpias en todo el stack de señales (canonical, og:url, sitemap.xml, JSON-LD); Cloudflare sirve `.html → 308 → clean`. Verificaciones live siempre con `curl -sL`.
- FAQPage JSON-LD ↔ FAQ visible en lockstep (mismo texto, siempre se cambian juntos).
- `telephone` +19296856757 en schema (número GBP); sin teléfono visible en páginas.

## Decisiones vigentes (histórico completo en la memoria del proyecto)

Rotador 6 colores intocable · dark-only sin toggle · CTA único "Get your free proposal" · sin teléfono visible · claims solo confirmados (lista en PRODUCT.md) · em dashes 0 en copy visible · páginas interiores ricas en imagen · wizard sin "service cues" (retirados por Alex 2026-06-26).
