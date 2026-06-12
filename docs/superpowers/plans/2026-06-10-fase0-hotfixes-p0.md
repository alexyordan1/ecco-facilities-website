# Fase 0 — Hotfixes P0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cerrar los 15 P0 (+8 P1 adyacentes) de la auditoría 2026-06-10 con cirugía mínima, sin tocar la dirección visual (eso es Fase 1+ del [roadmap maestro](2026-06-10-estandarizacion-master-roadmap.md)).

**Architecture:** Ediciones quirúrgicas por string exacto sobre el working tree actual (HTML por página, appends minificados al final de styles.css, fixes puntuales en source de quote-flow + re-minify con bunx). Cada tarea es deployable y verificable por separado.

**Tech Stack:** HTML estático · CSS minificado (Edit por string exacto, NUNCA perl/regex) · bunx clean-css-cli para quote-flow.source.css · python3 para reemplazos masivos de strings planos · serve.js + navegador para verificación visual.

**Reglas vinculantes (de CLAUDE.md y memoria del proyecto):**
- `/ays` antes de CADA commit (el hook lo fuerza). `leccionaprendida` ante cualquier error.
- Cache busters `?v=` bumpeados en el MISMO commit que el CSS/JS que cambia.
- Tras el deploy: verificar en el sitio LIVE (.pages.dev + dominio), no solo en preview.
- clean-css strips `@layer …;:root{…}` de la primera línea — inspeccionar el output tras CADA re-minify de quote-flow.source.css.
- Cero estilos inline nuevos; touch targets ≥44px.

**Orden recomendado:** las tareas de cada bloque son independientes entre bloques; dentro del bloque CSS, Task 1 → Task 3 comparten el bump de `?v=` (ver notas por tarea sobre el valor vigente).

---

## Bloque A — CSS / roturas visuales

### Task 1: Definir la sección navy faltante `.test-sec`/`.test-single` (testimonios ilegibles en janitorial + day-porter)
**Files:** Modify: `css/styles.css` (minificado, 1 sola línea — append al final), `janitorial.html` (consume en línea 199), `day-porter.html` (consume en línea 169), + bump `?v=` en los 25 HTML que enlazan styles.css
**Findings resueltos:** "[P0][pag-service-detail] Testimonial sections unreadable on both pages: wrapper classes never defined in CSS, child styles designed for dark background render white/light text on near-white page"

Contexto verificado: `.test-sec` y `.test-single` tienen 0 definiciones en css/styles.css. Los hijos están diseñados para fondo oscuro (`.test-name{color:var(--wh)}`, `.test-quote{color:var(--twm)}` = #C8D5E2) y hoy renderizan blanco-sobre-#FAFBFC. Fix verificado en navegador local (inyección): sección navy #0B1D38, texto legible en ambas páginas. `.test-sec .test-grid{grid-template-columns:1fr;max-width:720px}` centra el testimonio único de day-porter (hoy ocupa media columna); no afecta a testimonials.html/index (allí `.test-grid` no vive dentro de `.test-sec` — verificado por grep).

- [ ] **Step 1: Append del bloque minificado al final de css/styles.css** — con la herramienta Edit (NUNCA perl/sed sobre este archivo). El archivo termina exactamente en `animation:none!important;opacity:.6}}` (anchor único, verificado count=1 y endswith=True; no hay sourceMappingURL):
  - old_string: `animation:none!important;opacity:.6}}`
  - new_string: `animation:none!important;opacity:.6}}.test-sec{background:var(--navy);padding:6rem 3.5rem;overflow:hidden}.test-single{max-width:720px;margin:0 auto}.test-sec .test-grid{grid-template-columns:1fr;max-width:720px}@media (max-width:768px){.test-sec{padding:4rem 1.5rem}}`
  - (Cumple reglas: base desktop + override mobile, `overflow:hidden` en el contenedor, cero estilos inline. El mobile de `.test-grid` ya colapsa a 1 col por la regla existente `@media (max-width:900px)`.)
- [ ] **Step 2: Bump cache-buster v15.1 → v15.2 en los 25 HTML** — reemplazo de string plano vía python3 (NO perl/regex):
  ```bash
  cd "/Users/alexmercedes/Downloads/Ecco Webside"
  for f in $(grep -rl 'styles.css?v=15.1' *.html blog/*.html); do
    python3 -c "import sys; p=sys.argv[1]; s=open(p).read(); open(p,'w').write(s.replace('styles.css?v=15.1','styles.css?v=15.2'))" "$f"
  done
  ```
  Los 25 archivos (verificados con `grep -rl 'styles.css?v=15.1' *.html blog/*.html`): 404, about, accessibility, blog, careers, day-porter, index, janitorial, privacy, quote-dayporter, quote-janitorial, quote, services, sitemap, sustainability, terms, testimonials, why-ecco + los 7 posts de blog/. (`quote.backup.html` queda en v=13.7 — es artefacto dev, no tocar.)
- [ ] **Step 3: Verify** —
  ```bash
  grep -cF '.test-sec{background:var(--navy)' css/styles.css        # esperado: 1
  grep -rl 'styles.css?v=15.2' *.html blog/*.html | wc -l           # esperado: 25
  grep -rl 'styles.css?v=15.1' *.html blog/*.html                   # esperado: sin salida (exit 1)
  ```
  Opcional visual: `node serve.js` → http://localhost:8080/janitorial.html y /day-porter.html → sección testimonio ahora navy con texto blanco legible.
- [ ] **Step 4: Commit** — el hook pre-commit exige `/ays`; ejecutarlo antes. Luego:
  ```bash
  git add css/styles.css 404.html about.html accessibility.html blog.html careers.html day-porter.html index.html janitorial.html privacy.html quote-dayporter.html quote-janitorial.html quote.html services.html sitemap.html sustainability.html terms.html testimonials.html why-ecco.html blog/*.html
  git commit -m "fix(css): define seccion navy .test-sec/.test-single — testimonios ilegibles en janitorial y day-porter (v15.2)"
  ```

### Task 2: Añadir `btn-white` a los 2 CTAs invisibles del banner navy de why-ecco
**Files:** Modify: `why-ecco.html` (líneas 250-251)
**Findings resueltos:** "[P0][pag-about] why-ecco final CTA buttons invisible: bare .btn has no background/color on navy gradient banner" + "[P1][componentes] why-ecco CTA banner uses two bare class=\"btn\" buttons with no variant — render as unstyled transparent 'buttons'"

Contexto verificado: about.html usa exactamente `class="btn btn-white"` en sus 2 botones del cta-banner (líneas 175-176) — se replica esa composición. Verificado en navegador: antes color #1A1E2C sobre gradiente navy (~1.07:1, invisible); después de añadir `btn-white` → fondo blanco + texto navy #0B1D38. NO tocar los labels de los CTAs (la unificación de labels es de una fase posterior). El `<div style="margin-top:1.5rem...">` wrapper inline existente se deja como está (Fase 0 quirúrgica).

- [ ] **Step 1: Edit línea 250** —
  - old_string: `      <a href="quote.html" class="btn">Request a Free Quote →</a>`
  - new_string: `      <a href="quote.html" class="btn btn-white">Request a Free Quote →</a>`
- [ ] **Step 2: Edit línea 251** —
  - old_string: `      <a href="mailto:info@eccofacilities.com" class="btn">Email Us →</a>`
  - new_string: `      <a href="mailto:info@eccofacilities.com" class="btn btn-white">Email Us →</a>`
- [ ] **Step 3: Verify** —
  ```bash
  grep -n 'class="btn"' why-ecco.html            # esperado: sin salida (exit 1)
  grep -c 'btn btn-white' why-ecco.html          # esperado: 3 (los 2 del banner + 1 del hero existente)
  ```
  (Nota: el hero de why-ecco ya tiene 1 `btn btn-ol` + verificar que el conteo cuadre tras el edit.) Solo HTML — sin bump de `?v=`.
- [ ] **Step 4: Commit** — `/ays` antes (hook). Luego:
  ```bash
  git add why-ecco.html
  git commit -m "fix(why-ecco): btn-white en los 2 CTA del banner navy — texto invisible ~1.07:1"
  ```

### Task 3: Scope del `.svc-panels{display:block!important}` huérfano a `.svc-showcase` (revive la comparativa desktop de services.html)
**Files:** Modify: `css/styles.css` (minificado — 1 reemplazo exacto), + bump `?v=` en los 25 HTML
**Findings resueltos:** "[P1][pag-services] Desktop side-by-side service comparison layout is dead — unscoped !important rule from index's svc-showcase kills the grid"

Contexto verificado en navegador (1280px): en services.html `.svc-panels` computa `display:block` (la regla `!important` sin scope gana sobre `.svc-panels{display:grid;grid-template-columns:1fr 1fr;gap:3rem}`); forzando grid renderiza 2 columnas correctas (526px+526px). En services.html `.svc-panels` NO tiene ancestro `.svc-showcase` (verificado con `closest()` = null, vive en `.svc-compare`); en index.html SÍ (`<div class="svc-showcase rv-scale">` línea 194 envuelve `.svc-panels` línea 204, `matches('.svc-showcase .svc-panels')` = true) → el scope preserva index intacto.

- [ ] **Step 1: Edit en css/styles.css** (string único, verificado count=1; NUNCA perl/sed):
  - old_string: `.svc-panels{position:relative;min-height:240px;display:block!important}`
  - new_string: `.svc-showcase .svc-panels{position:relative;min-height:240px;display:block!important}`
  - (Existe también un `.svc-panels{min-height:auto}` sin scope en el media query mobile del showcase — es inofensivo para services [coincide con el default] y se deja tal cual en Fase 0.)
- [ ] **Step 2: Bump cache-buster v15.2 → v15.3 en los 25 HTML** (precondición: Task 1 ya ejecutada; si no, el valor vigente es 15.1 — comprobar con `grep -o 'styles.css?v=[0-9.]*' index.html` y subir 0.1 desde el vigente):
  ```bash
  cd "/Users/alexmercedes/Downloads/Ecco Webside"
  for f in $(grep -rl 'styles.css?v=15.2' *.html blog/*.html); do
    python3 -c "import sys; p=sys.argv[1]; s=open(p).read(); open(p,'w').write(s.replace('styles.css?v=15.2','styles.css?v=15.3'))" "$f"
  done
  ```
- [ ] **Step 3: Verify** —
  ```bash
  grep -cF '.svc-showcase .svc-panels{position:relative;min-height:240px;display:block!important}' css/styles.css   # esperado: 1
  grep -cF '}.svc-panels{position:relative;min-height:240px' css/styles.css                                          # esperado: 0
  grep -rl 'styles.css?v=15.3' *.html blog/*.html | wc -l                                                            # esperado: 25
  ```
  Opcional visual: `node serve.js` → /services.html a ≥1280px → paneles Janitorial y Day Porter lado a lado; /index.html → showcase con tabs intacto (un panel a la vez).
- [ ] **Step 4: Commit** — `/ays` antes (hook). Luego:
  ```bash
  git add css/styles.css *.html blog/*.html
  git commit -m "fix(css): scope .svc-panels display:block!important a .svc-showcase — restaura grid comparativo de services (v15.3)"
  ```

### Task 4: Dark mode /quote — tokens `--rv-*` varados en light + botón Send blanco-sobre-sage 2.5:1
**Files:** Modify: `css/quote-flow.source.css` (append al final, hoy termina en línea 13404), `css/quote-flow.css` (minificado — append al final), `quote.html` (bump `?v=50.3` → `?v=50.4`, línea ~60)
**Findings resueltos:** "[P1][colores] Review screen (.qf-rv) has zero dark-mode coverage in the active Editorial Midnight blocks — its dark overrides live only inside disabled dead code" (+ corrección de alcance del hallazgo "ghost cards en welcome": VERIFICADO en navegador con emulación `prefers-color-scheme:dark` que las cards del welcome y del space screen del working tree renderizan correctas — bg #243441, tinta marfil — vía el sweep PART B ya presente; lo realmente roto hoy es (a) el botón Send `#qfContactSubmit` con texto blanco sobre el sage elevado #6FB376 = 2.5:1 y (b) los tokens `--rv-*` que siguen en valores light: `--rv-paper:#FFFFFF`, `--rv-ink:#0E1311` computados en dark)

⚠️ NO ejecutar `bunx clean-css-cli -o css/quote-flow.css css/quote-flow.source.css`: verificado byte a byte que `git HEAD:css/quote-flow.css` == minificado fresco del source actual (213.543 bytes idénticos), mientras el `css/quote-flow.css` del working tree (210.488 bytes) contiene ~3KB de mejoras SIN commitear hechas solo en el minificado (purge de keyframes muertos, títulos `clamp(1.625rem,4.5vw,4.125rem)`, touch targets 44px, bloques `@layer overrides` de posicionamiento al final). Re-minificar las destruiría. Por eso este task edita source y minificado EN PARALELO (mismo patrón que styles.css).

- [ ] **Step 1: Append al final de css/quote-flow.source.css** (el archivo termina en `}\n\n` tras el bloque PART C):
  ```bash
  cd "/Users/alexmercedes/Downloads/Ecco Webside"
  cat >> css/quote-flow.source.css <<'CSSEOF'
  /* ==========================================================================
     P0 hotfix 2026-06-10 — dark mode (auditoría docs/audits/2026-06-10):
     (1) Tokens --rv-* del review screen (.qf-rv) varados en light: sus únicos
         overrides dark viven en @media(...dark-DISABLED-V1-LEGACY) ~9120-9135.
         Se mapean a equivalentes Editorial Midnight (NO a la paleta V1 muerta).
     (2) Send (#qfContactSubmit): texto blanco sobre sage elevado #6FB376 =
         2.5:1. Su regla light vive en @layer components con !important, así
         que el fix va con !important en @layer reset (para !important gana la
         PRIMERA capa declarada — mismo patrón que PART C). Tinta #0F1A20 =
         7.05:1, la misma de los chips seleccionados.
     ========================================================================== */
  @media (prefers-color-scheme: dark) {
    main.q-flow .qf-rv {
      --rv-ink: #EFE8D7; --rv-ink-soft: #C9C0AE;
      --rv-muted: #8A9AAB; --rv-muted-lt: #6E7C8C;
      --rv-sage: #6FB376; --rv-sage-br: #82C589; --rv-sage-dk: #82C589;
      --rv-cream: #1B2733; --rv-cream-lt: #243441; --rv-paper: #243441;
      --rv-gold: #D9B95E; --rv-gold-dk: #D9B95E;
    }
  }
  @layer reset {
    @media (prefers-color-scheme: dark) {
      main.q-flow #qfContactSubmit,
      main.q-flow .qf-rev-btn { color: #0F1A20 !important; }
    }
  }
  CSSEOF
  ```
  (Si el heredoc se indenta, usar `<<-'CSSEOF'` con tabs o pegarlo sin indentación — el contenido CSS es indiferente a la indentación.)
- [ ] **Step 2: Append del mismo bloque, minificado, al final de css/quote-flow.css** (cola actual verificada: `...is-selected::after{top:14px;right:14px;transform:none;}}}`):
  ```bash
  printf '%s' '@media (prefers-color-scheme:dark){main.q-flow .qf-rv{--rv-ink:#EFE8D7;--rv-ink-soft:#C9C0AE;--rv-muted:#8A9AAB;--rv-muted-lt:#6E7C8C;--rv-sage:#6FB376;--rv-sage-br:#82C589;--rv-sage-dk:#82C589;--rv-cream:#1B2733;--rv-cream-lt:#243441;--rv-paper:#243441;--rv-gold:#D9B95E;--rv-gold-dk:#D9B95E}}@layer reset{@media (prefers-color-scheme:dark){main.q-flow #qfContactSubmit,main.q-flow .qf-rev-btn{color:#0F1A20!important}}}' >> css/quote-flow.css
  ```
  Este string exacto fue inyectado en el navegador con emulación dark y verificado: Send pasa a rgb(15,26,32) sobre rgb(111,179,118) y los tokens `--rv-*` computan los valores midnight.
- [ ] **Step 3: Bump quote.html** — Edit:
  - old_string: `<link rel="stylesheet" href="css/quote-flow.css?v=50.3">`
  - new_string: `<link rel="stylesheet" href="css/quote-flow.css?v=50.4">`
  - (quote.html es el ÚNICO consumidor — verificado; quote.backup.html referencia v=9.0 y es artefacto dev, no tocar.)
- [ ] **Step 4: Verify** —
  ```bash
  grep -cF -- '--rv-paper: #243441' css/quote-flow.source.css      # esperado: 1
  grep -cF -- '--rv-paper:#243441' css/quote-flow.css              # esperado: 1
  grep -cF 'main.q-flow #qfContactSubmit' css/quote-flow.css       # esperado: 1
  grep -c 'quote-flow.css?v=50.4' quote.html                       # esperado: 1
  ```
  Visual (recomendado): `node serve.js` → /quote.html con DevTools "Emulate prefers-color-scheme: dark" → completar flujo hasta el snapshot → botón "Send my request" con tinta oscura sobre sage. OJO: los botones tienen `transition`, leer computed styles tras ~300ms.
- [ ] **Step 5: Commit** — `/ays` antes (hook). Luego:
  ```bash
  git add css/quote-flow.source.css css/quote-flow.css quote.html
  git commit -m "fix(quote-dark): tokens --rv-* a Editorial Midnight + tinta #0F1A20 en Send 2.5:1→7.05:1 (v50.4)"
  ```

### Task 5: Dark mode — botón Accept del cookie banner: tinta #0F1A20 sobre sage (2.5:1 → 7.05:1)
**Files:** Modify: `css/quote-flow.source.css` (líneas 13360-13368), `css/quote-flow.css` (minificado — 1 reemplazo exacto), `quote.html` (bump `?v=50.4` → `?v=50.5`)
**Findings resueltos:** "[P1][darkmode] Dark-mode cookie 'Accept' button fails WCAG AA: white text on sage #6FB376 = 2.5:1 (hover 2.0:1)"

Verificado en navegador (emulación dark, banner simulado — con Global Privacy Control activo cookie-consent.js auto-declina y no pinta banner): Accept actual = rgb(255,255,255) sobre rgb(111,179,118); con el fix = rgb(15,26,32) sobre sage. #0F1A20 es la misma tinta ya usada en dark para chips seleccionados y day-cards (PART C). Sobre hover #82C589 el contraste es aún mayor. El banner en LIGHT (navy de styles.css) no se toca.

- [ ] **Step 1: Edit en css/quote-flow.source.css** (bloque único, verificado count=1):
  - old_string:
    ```
      .cookie-btn-accept {
        background: var(--qf2-sage, #6FB376);
        border-color: var(--qf2-sage, #6FB376);
        color: #fff;
      }
      .cookie-btn-accept:hover {
        background: var(--qf2-sage-bright, #82C589);
        color: #fff;
      }
    ```
  - new_string:
    ```
      .cookie-btn-accept {
        background: var(--qf2-sage, #6FB376);
        border-color: var(--qf2-sage, #6FB376);
        color: #0F1A20;
      }
      .cookie-btn-accept:hover {
        background: var(--qf2-sage-bright, #82C589);
        color: #0F1A20;
      }
    ```
    (Actualizar también el comentario inmediatamente anterior si se desea: "sage bg + WHITE text" → "sage bg + tinta #0F1A20"; opcional.)
- [ ] **Step 2: Edit en css/quote-flow.css** (string único verificado count=1; la otra aparición de `.cookie-btn-accept` vive en un bloque `dark-DISABLED-V1-LEGACY` con cuerpo distinto):
  - old_string: `.cookie-btn-accept{background:var(--qf2-sage,#6fb376);border-color:var(--qf2-sage,#6fb376);color:#fff}.cookie-btn-accept:hover{background:var(--qf2-sage-bright,#82c589);color:#fff}`
  - new_string: `.cookie-btn-accept{background:var(--qf2-sage,#6fb376);border-color:var(--qf2-sage,#6fb376);color:#0F1A20}.cookie-btn-accept:hover{background:var(--qf2-sage-bright,#82c589);color:#0F1A20}`
- [ ] **Step 3: Bump quote.html** — Edit (precondición: Task 4 ya dejó v=50.4; si no, partir del valor vigente):
  - old_string: `<link rel="stylesheet" href="css/quote-flow.css?v=50.4">`
  - new_string: `<link rel="stylesheet" href="css/quote-flow.css?v=50.5">`
- [ ] **Step 4: Verify** —
  ```bash
  grep -A4 'cookie-btn-accept' css/quote-flow.source.css | grep -c '0F1A20'   # esperado: 2
  grep -cF 'color:#0F1A20}.cookie-btn-accept:hover' css/quote-flow.css        # esperado: 1
  grep -cF '.cookie-btn-accept{background:var(--qf2-sage,#6fb376);border-color:var(--qf2-sage,#6fb376);color:#fff}' css/quote-flow.css   # esperado: 0
  grep -c 'quote-flow.css?v=50.5' quote.html                                  # esperado: 1
  ```
  Visual: en dark, simular el banner en consola (GPC bloquea el real): `var b=document.createElement('div');b.className='cookie-banner visible';b.innerHTML='<p>x</p><div><button class="cookie-btn cookie-btn-accept">Accept</button></div>';document.body.appendChild(b)` → esperar 300ms (transition) → Accept con tinta oscura.
- [ ] **Step 5: Commit** — `/ays` antes (hook). Luego:
  ```bash
  git add css/quote-flow.source.css css/quote-flow.css quote.html
  git commit -m "fix(quote-dark): cookie Accept tinta #0F1A20 sobre sage — 2.5:1→7.05:1 (v50.5)"
  ```

---

## Bloque B — Assets / contenido / meta

### Task 6: og:image universal 404 — apuntar todas las refs de `logo-vertical.png` a assets existentes
**Files:** Modify: 24 archivos HTML (62 refs verificadas): `about.html:19,24`, `accessibility.html:19,24`, `blog.html:19,24`, `careers.html:19,24`, `day-porter.html:19,24`, `index.html:19,24,43`, `index-reference.html:12`, `janitorial.html:19,24`, `privacy.html:19,24`, `quote.html:22,27`, `quote.backup.html:19,24`, `services.html:19,24`, `sitemap.html:20,25`, `sustainability.html:19,24`, `terms.html:19,24`, `testimonials.html:19,24`, `why-ecco.html:19,24`, y los 7 `blog/*.html` (líneas 21, 26, 27, 32 cada uno)
**Findings resueltos:** og:image/twitter:image/schema image apuntan a `images/logo-vertical.png` inexistente (404 universal en social shares); favicons de blog rotos

- [ ] **Step 1: Verificar inventario (62 refs) y que los assets destino existen**
  ```bash
  cd "/Users/alexmercedes/Downloads/Ecco Webside" && \
  grep -rn 'logo-vertical' *.html blog/*.html | wc -l && \
  ls images/logo-horizontal.png images/favicon-32.png
  ```
  Salida esperada: `62` y ambos archivos listados sin error.
- [ ] **Step 2: Reemplazo masivo con python3 (heredoc — lee ANTES de escribir, nunca `open(f,'w')` inline que trunca antes de leer)**
  ```bash
  cd "/Users/alexmercedes/Downloads/Ecco Webside" && python3 - <<'PY'
  import glob
  for f in glob.glob('*.html') + glob.glob('blog/*.html'):
      s = open(f, encoding='utf-8').read()
      t = s.replace('https://eccofacilities.com/images/logo-vertical.png',
                    'https://eccofacilities.com/images/logo-horizontal.png')
      t = t.replace('../images/logo-vertical.png', '../images/favicon-32.png')
      if t != s:
          open(f, 'w', encoding='utf-8').write(t)
          print(f)
  PY
  ```
  Salida esperada: imprime exactamente 24 archivos (17 raíz incl. `quote.backup.html` e `index-reference.html` + 7 blog). Esto convierte og/twitter/schema image → `logo-horizontal.png` (interino; el 1200x630 real llega en fase posterior) y los `<link rel="icon" ... ../images/logo-vertical.png>` de blog → `../images/favicon-32.png`.
- [ ] **Step 3: Verificar 0 refs restantes**
  ```bash
  cd "/Users/alexmercedes/Downloads/Ecco Webside" && \
  grep -rn 'logo-vertical' *.html blog/*.html | wc -l && \
  grep -c 'href="../images/favicon-32.png"' blog/*.html
  ```
  Salida esperada: `0` y cada uno de los 7 blog/*.html con `:1`.
- [ ] **Step 4: Commit** (el hook pre-commit dispara /ays — no saltarlo)
  ```bash
  cd "/Users/alexmercedes/Downloads/Ecco Webside" && git add *.html blog/*.html && \
  git commit -m "fix(seo): reemplaza logo-vertical.png inexistente por assets reales en og/twitter/schema/favicons (62 refs, 24 archivos)"
  ```

### Task 7: Logo blanco invisible en nav de los 7 posts del blog
**Files:** Modify: `blog/5-signs-cleaning-company.html:41`, `blog/benefits-day-porter-high-traffic-buildings.html:41`, `blog/choose-commercial-cleaning-company-nyc.html:41`, `blog/commercial-cleaning-checklist-nyc.html:41`, `blog/dirty-office-costs-productivity.html:41`, `blog/eco-certified-cleaning-matters.html:41`, `blog/janitorial-vs-day-porter.html:41`
**Findings resueltos:** Nav de blog usa `logo-horizontal-white.png` sobre fondo claro (logo invisible)

- [ ] **Step 1: Reemplazo SOLO en el `.nav-logo` (el footer línea ~124-167 usa el blanco sobre fondo oscuro — correcto, NO tocar)**
  ```bash
  cd "/Users/alexmercedes/Downloads/Ecco Webside" && python3 - <<'PY'
  import glob
  old = 'class="nav-logo"><img src="../images/logo-horizontal-white.png"'
  new = 'class="nav-logo"><img src="../images/logo-horizontal.png"'
  for f in glob.glob('blog/*.html'):
      s = open(f, encoding='utf-8').read()
      if old in s:
          open(f, 'w', encoding='utf-8').write(s.replace(old, new))
          print(f)
  PY
  ```
  Antes (línea 41 de cada post): `<a href="../index.html" class="nav-logo"><img src="../images/logo-horizontal-white.png" alt="Ecco Facilities LLC" width="180" height="40" fetchpriority="high"></a>`
  Después: `<a href="../index.html" class="nav-logo"><img src="../images/logo-horizontal.png" alt="Ecco Facilities LLC" width="180" height="40" fetchpriority="high"></a>`
  Salida esperada: imprime los 7 archivos.
- [ ] **Step 2: Verificar — nav cambiado, footer intacto**
  ```bash
  cd "/Users/alexmercedes/Downloads/Ecco Webside" && \
  grep -c 'class="nav-logo"><img src="../images/logo-horizontal.png"' blog/*.html && \
  grep -c 'logo-horizontal-white' blog/*.html
  ```
  Salida esperada: 7 archivos con `:1` en el primer grep Y 7 archivos con `:1` en el segundo (solo footer).
- [ ] **Step 3: Commit**
  ```bash
  cd "/Users/alexmercedes/Downloads/Ecco Webside" && git add blog/*.html && \
  git commit -m "fix(blog): usa logo-horizontal.png en nav (el blanco era invisible sobre fondo claro)"
  ```

### Task 8: Hero roto en post de day porter (`gyms.webp` no existe)
**Files:** Modify: `blog/benefits-day-porter-high-traffic-buildings.html:68`
**Findings resueltos:** `src="../images/stock/gyms.webp"` 404 — imagen hero del artículo nunca carga

- [ ] **Step 1: Confirmar que el asset elegido existe** — inventario verificado de `images/stock/`: existen `hero-office.webp` (1920x1282, interior moderno de edificio comercial, ya usado como hero en services/sitemap/accessibility/quote-janitorial/quote-dayporter) y `Corporate Offices.webp` (2560x1707, nombre con espacios — evitar en URLs). Elegido: `hero-office.webp`.
  ```bash
  ls "/Users/alexmercedes/Downloads/Ecco Webside/images/stock/hero-office.webp"
  ```
- [ ] **Step 2: Edit en línea 68** (solo `src` y `alt` — los estilos inline preexistentes en esa línea NO se tocan en Phase 0; quedan para la fase de redesign)
  - old_string: `<img src="../images/stock/gyms.webp" alt="High-traffic commercial building lobby"`
  - new_string: `<img src="../images/stock/hero-office.webp" alt="Open common area of a modern commercial office building"`
  (el alt se ajusta porque la imagen verificada muestra un área común/corredor de oficinas, no un lobby)
- [ ] **Step 3: Verify**
  ```bash
  cd "/Users/alexmercedes/Downloads/Ecco Webside" && \
  grep -rn 'gyms.webp' blog/ ; grep -c 'stock/hero-office.webp' blog/benefits-day-porter-high-traffic-buildings.html
  ```
  Salida esperada: primer grep vacío, segundo `1`.
- [ ] **Step 4: Commit**
  ```bash
  cd "/Users/alexmercedes/Downloads/Ecco Webside" && git add blog/benefits-day-porter-high-traffic-buildings.html && \
  git commit -m "fix(blog): hero 404 en benefits-day-porter (gyms.webp no existe), usa hero-office.webp existente"
  ```

### Task 9: Fecha contradictoria en janitorial-vs-day-porter — unificar a 2026-02-28
**Files:** Modify: `blog/janitorial-vs-day-porter.html:32` (JSON-LD). Sin cambios: `blog/janitorial-vs-day-porter.html:67` (byline) y `blog.html:108` (card) — ya dicen February 28.
**Findings resueltos:** Byline visible "February 28, 2026" vs JSON-LD `datePublished: 2026-03-22` vs card de blog.html

- [ ] **Step 1: Decisión — gana la fecha visible 2026-02-28.** Justificación: (a) 2 de los 3 puntos ya dicen February 28 (byline línea 67 y card blog.html línea 108) → un solo edit en vez de dos; (b) preserva el orden cronológico descendente de las cards en blog.html (Apr 5 → Apr 5 → Apr 4 → Apr 4 → Mar 15 → Mar 8 → Feb 28); con Mar 22 la card quedaría fuera de orden o habría que mover el bloque entero; (c) `dateModified: 2026-03-29` sigue siendo coherente (modificado después de publicar).
- [ ] **Step 2: Edit en JSON-LD línea 32** (string única verificada — 1 ocurrencia)
  - old_string: `"datePublished":"2026-03-22"`
  - new_string: `"datePublished":"2026-02-28"`
  (`"dateModified":"2026-03-29"` se queda como está)
- [ ] **Step 3: Verify — los 3 puntos coinciden**
  ```bash
  cd "/Users/alexmercedes/Downloads/Ecco Webside" && \
  grep -o '"datePublished":"[^"]*"' blog/janitorial-vs-day-porter.html && \
  grep -n 'February 28, 2026' blog/janitorial-vs-day-porter.html blog.html && \
  grep -c '2026-03-22' blog/janitorial-vs-day-porter.html
  ```
  Salida esperada: `"datePublished":"2026-02-28"`, matches en `blog/janitorial-vs-day-porter.html:67` y `blog.html:108`, y `0`.
- [ ] **Step 4: Commit**
  ```bash
  cd "/Users/alexmercedes/Downloads/Ecco Webside" && git add blog/janitorial-vs-day-porter.html && \
  git commit -m "fix(blog): unifica datePublished de janitorial-vs-day-porter a 2026-02-28 (coincide con byline y card)"
  ```

### Task 10: quote.html — noscript honesto sin teléfono, remitente info@, metas sin el chat AI retirado
**Files:** Modify: `quote.html:17,19,26` (metas), `quote.html:163-191` (bloque noscript), `quote.html:1131` (success screen)
**Findings resueltos:** (a) teléfono (646) 303-0816 en noscript (decisión cerrada: NO phone); (b) success screen promete email desde alina@ pero el backend envía desde info@; (c) meta/og/twitter descriptions anuncian un AI chat advisor retirado en D125; (d) form noscript no puede enviar jamás (endpoint exige JSON+Turnstile)

- [ ] **Step 1: Reemplazar el bloque noscript completo (cubre a + d).** Edit con old_string = líneas 163-191 exactas (incluye el comentario, que contiene em dash original):
  ```html
  <!-- Fallback for users with JS disabled — plain HTML form that POSTs to same endpoint -->
  <noscript>
    <div class="qf-noscript">
      <h1 class="qf-noscript-title">Request your free quote</h1>
      <p>We'll reply within 24 hours with a custom cleaning proposal. No JavaScript required.</p>
      <form class="qf-noscript-form" action="/api/submit-quote" method="POST">
        <label>First name <input class="qf-noscript-input" name="fn" type="text" autocomplete="given-name" maxlength="60" required></label>
        <label>Last name <input class="qf-noscript-input" name="ln" type="text" autocomplete="family-name" maxlength="60"></label>
        <label>Email <input class="qf-noscript-input" name="em" type="email" autocomplete="email" maxlength="254" required></label>
        <label>Phone (optional) <input class="qf-noscript-input" name="ph" type="tel" autocomplete="tel" maxlength="25"></label>
        <label>Company <input class="qf-noscript-input" name="co" type="text" autocomplete="organization" maxlength="120"></label>
        <label>Address or ZIP <input class="qf-noscript-input" name="addr" type="text" autocomplete="street-address" maxlength="200" required></label>
        <label>Service
          <select class="qf-noscript-input" name="formType" required>
            <option value="janitorial">Night cleaning (recurring after-hours)</option>
            <option value="dayporter">Day Porter (on-site during business hours)</option>
            <option value="both">Combined (porter + night cleaning)</option>
          </select>
        </label>
        <label>Notes <textarea class="qf-noscript-input" name="notes" rows="3" maxlength="500"></textarea></label>
        <button class="qf-noscript-btn" type="submit">Send request</button>
      </form>
      <p class="qf-noscript-contact">Prefer to reach out directly?
        <a href="mailto:info@eccofacilities.com">info@eccofacilities.com</a>
        &middot;
        <a href="tel:+16463030816">(646) 303-0816</a>
      </p>
    </div>
  </noscript>
  ```
  new_string (solo clases `qf-noscript*` ya existentes en css/quote-flow.css: `qf-noscript`, `qf-noscript-title`, `qf-noscript-contact` — verificadas; sin form, sin teléfono, sin em dashes):
  ```html
  <!-- Fallback for users with JS disabled: the quote flow requires JS (JSON + Turnstile), so we show an honest contact block instead of a form that cannot submit. -->
  <noscript>
    <div class="qf-noscript">
      <h1 class="qf-noscript-title">Request your free quote</h1>
      <p>The quote form needs JavaScript to run. Please enable JavaScript and reload this page.</p>
      <p class="qf-noscript-contact">Or email us directly and we'll reply within 24 hours with a custom cleaning proposal:
        <a href="mailto:info@eccofacilities.com">info@eccofacilities.com</a>
      </p>
    </div>
  </noscript>
  ```
- [ ] **Step 2: Success screen — remitente real (línea 1131).** Edit:
  - old_string: `          <strong>alina@eccofacilities.com</strong>`
  - new_string: `          <strong>info@eccofacilities.com</strong>`
  (única ocurrencia de alina@ en quote.html, verificada; la copy "Check spam, it comes from" de las líneas 1129-1130 queda igual)
- [ ] **Step 3: Metas honestas (líneas 17, 19, 26).** Tres Edits:
  - Línea 17, old: `<meta name="description" content="Get a free custom cleaning quote in 2 minutes. Janitorial &amp; day porter services across NYC. Alina, our AI advisor, tailors a proposal delivered within 24 hours. No commitment.">`
    new: `<meta name="description" content="Get a free custom cleaning quote in 2 minutes. Janitorial and day porter services across NYC. Answer a few quick questions and receive a tailored proposal within 24 hours. No commitment.">`
  - Línea 19, old: `<meta property="og:description" content="Chat with Alina, our AI cleaning advisor. Get a free, customized proposal for janitorial or day porter services, delivered within 24 hours.">`
    new: `<meta property="og:description" content="A quick 2-minute form. Get a free, customized proposal for janitorial or day porter services, delivered within 24 hours.">`
  - Línea 26, old: `<meta name="twitter:description" content="Chat with Alina, our AI cleaning advisor. Customized proposals within 24 hours.">`
    new: `<meta name="twitter:description" content="A quick 2-minute form. Customized cleaning proposals within 24 hours.">`
- [ ] **Step 4: Verify**
  ```bash
  cd "/Users/alexmercedes/Downloads/Ecco Webside" && \
  grep -c 'tel:+16463030816\|qf-noscript-form\|alina@\|AI advisor\|AI cleaning advisor' quote.html ; \
  grep -c 'qf-noscript-title\|qf-noscript-contact' quote.html
  ```
  Salida esperada: `0` y `2` (título + contacto del nuevo bloque). Nota: NO se tocó css/quote-flow.css ni ningún .js → NO hay bump de cache buster en este task.
- [ ] **Step 5: Commit**
  ```bash
  cd "/Users/alexmercedes/Downloads/Ecco Webside" && git add quote.html && \
  git commit -m "fix(quote): noscript honesto sin telefono ni form muerto, remitente info@, metas sin chat AI retirado (D125)"
  ```

### Task 11: careers.html — id="positions" duplicado y plazo de respuesta contradictorio
**Files:** Modify: `careers.html:73` (id duplicado), `careers.html:172` y `careers.html:320` (plazos)
**Findings resueltos:** id="positions" duplicado en líneas 73 y 121 (el CTA del hero línea 67 aterriza en "Why Work With Us" en vez de "Current Openings"); copy promete "48 hours" (x2) pero el autoresponse del form (línea 210) dice "3-5 business days"

- [ ] **Step 1: Renombrar el id equivocado.** La sección de línea 73 es "Why Work With Us"; la de línea 121 es "Open Positions / Current Openings" (la correcta para el ancla). Como ambas líneas `<section class="sec bg-white" id="positions">` son idénticas, el Edit necesita contexto. old_string:
  ```html
  <section class="sec bg-white" id="positions">
    <div class="sec-head rv">
      <span class="sec-lbl">Why Work With Us</span>
  ```
  new_string:
  ```html
  <section class="sec bg-white" id="why-work">
    <div class="sec-head rv">
      <span class="sec-lbl">Why Work With Us</span>
  ```
  El ancla del hero (`<a href="#positions" ...>` línea 67) NO se toca: ahora resuelve al único id="positions" restante (línea 121, Current Openings). Verificado: ninguna otra página enlaza `careers.html#positions`.
- [ ] **Step 2: Unificar plazos a 3-5 business days (gana el autoresponse: es lo que el sistema realmente envía).** Dos Edits (ambas strings únicas, verificadas):
  - Línea 172, old: `<div class="step-desc">Within 48 hours of your application.</div>`
    new: `<div class="step-desc">Within 3-5 business days of your application.</div>`
  - Línea 320, old: `<p class="form-note">We'll review your application and reach out within 48 hours.</p>`
    new: `<p class="form-note">We'll review your application and reach out within 3-5 business days.</p>`
- [ ] **Step 3: Verify**
  ```bash
  cd "/Users/alexmercedes/Downloads/Ecco Webside" && \
  grep -c 'id="positions"' careers.html && grep -n 'id="why-work"' careers.html && \
  grep -c '48 hours' careers.html && grep -c '3-5 business days' careers.html
  ```
  Salida esperada: `1`, `73:...`, `0`, `3` (líneas 172, 210 autoresponse, 320).
- [ ] **Step 4: Commit**
  ```bash
  cd "/Users/alexmercedes/Downloads/Ecco Webside" && git add careers.html && \
  git commit -m "fix(careers): id positions duplicado (CTA aterrizaba mal) y unifica plazo a 3-5 dias habiles"
  ```

### Task 12: sitemap.html — agregar 4 posts faltantes y stats honestos
**Files:** Modify: `sitemap.html:64` (hero-stats), `sitemap.html:105-107` (nav de Resources)
**Findings resueltos:** Directorio lista solo 3 de 7 posts del blog; hero afirma "6 Sections" (hay 5 grupos: Services, Company, Resources, Get Started, Legal) y "Always Updated" (demostrado falso por este mismo finding)

- [ ] **Step 1: Agregar los 4 posts faltantes (títulos verificados en los JSON-LD de cada post, acortados al estilo de los 3 existentes).** Edit, old_string (líneas 105-107):
  ```html
          <a href="blog/5-signs-cleaning-company.html" class="nl">5 Signs You Need a New Cleaning Company</a>
          <a href="blog/eco-certified-cleaning-matters.html" class="nl">Why Eco-Certified Cleaning Matters</a>
          <a href="blog/janitorial-vs-day-porter.html" class="nl">Janitorial vs. Day Porter</a>
  ```
  new_string (orden cronológico inverso, igual que blog.html):
  ```html
          <a href="blog/choose-commercial-cleaning-company-nyc.html" class="nl">How to Choose a Cleaning Company in NYC</a>
          <a href="blog/benefits-day-porter-high-traffic-buildings.html" class="nl">Benefits of Day Porter Services</a>
          <a href="blog/commercial-cleaning-checklist-nyc.html" class="nl">Commercial Cleaning Checklist for NYC Offices</a>
          <a href="blog/dirty-office-costs-productivity.html" class="nl">The Hidden Cost of a Dirty Office</a>
          <a href="blog/5-signs-cleaning-company.html" class="nl">5 Signs You Need a New Cleaning Company</a>
          <a href="blog/eco-certified-cleaning-matters.html" class="nl">Why Eco-Certified Cleaning Matters</a>
          <a href="blog/janitorial-vs-day-porter.html" class="nl">Janitorial vs. Day Porter</a>
  ```
  (Ojo: el indentado real del archivo es de 8 espacios por línea de enlace — respetarlo tal cual está en las líneas 105-107.)
- [ ] **Step 2: Stats honestos (línea 64).** "20+ Pages" es cierto (22 páginas públicas: 15 raíz + 7 posts); "6 Sections" → 5 grupos reales; "Always Updated" se elimina (puffery indefendible). Edit:
  - old_string: `    <div class="hero-stats"><span>20+ Pages</span><span>6 Sections</span><span>Always Updated</span></div>`
  - new_string: `    <div class="hero-stats"><span>20+ Pages</span><span>5 Sections</span></div>`
- [ ] **Step 3: Verify**
  ```bash
  cd "/Users/alexmercedes/Downloads/Ecco Webside" && \
  grep -c 'href="blog/' sitemap.html && grep -c 'Always Updated\|6 Sections' sitemap.html && \
  for f in choose-commercial-cleaning-company-nyc benefits-day-porter-high-traffic-buildings commercial-cleaning-checklist-nyc dirty-office-costs-productivity; do ls "blog/$f.html" >/dev/null && echo "$f ok"; done
  ```
  Salida esperada: `7`, `0`, y 4 líneas "ok".
- [ ] **Step 4: Commit**
  ```bash
  cd "/Users/alexmercedes/Downloads/Ecco Webside" && git add sitemap.html && \
  git commit -m "fix(sitemap): agrega los 4 posts faltantes del blog y corrige stats del hero (5 secciones, sin Always Updated)"
  ```

### Task 13: sitemap.xml — eliminar las 2 URLs legacy de quote
**Files:** Modify: `sitemap.xml:93-104`
**Findings resueltos:** sitemap.xml indexa `quote-janitorial.html` y `quote-dayporter.html` (flujos legacy reemplazados por quote.html)

- [ ] **Step 1: Eliminar los 2 bloques `<url>` (líneas 93-104, verificadas: `<loc>` en líneas 94 y 100).** Edit con old_string = los 12 renglones exactos MÁS su newline final, new_string = vacío:
  ```xml
    <url>
      <loc>https://eccofacilities.com/quote-janitorial.html</loc>
      <lastmod>2026-04-18</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.8</priority>
    </url>
    <url>
      <loc>https://eccofacilities.com/quote-dayporter.html</loc>
      <lastmod>2026-04-18</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.8</priority>
    </url>
  ```
  (Indentado real del archivo: 2 espacios para `<url>`, 4 para sus hijos. Incluir el `\n` final del segundo `</url>` en old_string para no dejar línea en blanco entre el bloque de accessibility.html y el primer post del blog.)
- [ ] **Step 2: Verify — 22 URLs restantes y XML bien formado**
  ```bash
  cd "/Users/alexmercedes/Downloads/Ecco Webside" && \
  grep -c '<loc>' sitemap.xml && grep -n 'quote-janitorial\|quote-dayporter' sitemap.xml ; \
  python3 -c "import xml.dom.minidom; xml.dom.minidom.parse('sitemap.xml'); print('XML OK')"
  ```
  Salida esperada: `22`, segundo grep vacío, `XML OK`.
- [ ] **Step 3: Commit**
  ```bash
  cd "/Users/alexmercedes/Downloads/Ecco Webside" && git add sitemap.xml && \
  git commit -m "fix(seo): elimina URLs legacy quote-janitorial y quote-dayporter de sitemap.xml"
  ```

---

## Bloque C — JavaScript

### Task 14: chat-widget.js + cookie-consent.js — URLs relativas a raíz-absolutas
**Files:** Modify: `js/chat-widget.js` (líneas 78, 216, 403–412, 415, 424–425, 722, 750), `js/cookie-consent.js` (línea 12), + bump `?v=` en 24 páginas (chat-widget) y 26 páginas (cookie-consent)
**Findings resueltos:** chat-widget relative URLs broken on /blog/* (16 links .html + avatar 404), cookie banner privacy link relative

Inventario completo verificado de URLs relativas en `js/chat-widget.js` (las dos apariciones del avatar en el live vienen de UNA sola fuente: `CONFIG.avatar` se interpola 2 veces en `widget.innerHTML` L216):

| Línea | Actual | Nuevo |
|---|---|---|
| 78 | `'images/alina-avatar-192.jpg'` | `'/images/alina-avatar-192.jpg'` |
| 216 | `href="quote.html"` (CTA bar) | `href="/quote.html"` |
| 403,404,406,410,411,412,415,750 | `](quote.html)` ×8 | `](/quote.html)` |
| 405 | `](sustainability.html)` | `](/sustainability.html)` |
| 407 | `](day-porter.html)` | `](/day-porter.html)` |
| 408 | `](janitorial.html)` | `](/janitorial.html)` |
| 409 | `](careers.html)` | `](/careers.html)` |
| 424 | `href: 'janitorial.html'` | `href: '/janitorial.html'` |
| 425 | `href: 'day-porter.html'` | `href: '/day-porter.html'` |
| 722 | `return 'quote.html?' + ...` | `return '/quote.html?' + ...` |

Verificado: el regex markdown→anchor de L247 (`[a-zA-Z0-9._/-]+\.html`) incluye `/` en la clase de caracteres, así que los links raíz-absolutos siguen renderizando como `<a>`.

- [ ] **Step 1: Avatar, CTA bar y buildQuoteUrl** — 3 Edits en `js/chat-widget.js` (cada old_string es único, verificado):
  - L78: `avatar: 'images/alina-avatar-192.jpg',` → `avatar: '/images/alina-avatar-192.jpg',`
  - L216: `id="eccoChatCta" href="quote.html"` → `id="eccoChatCta" href="/quote.html"`
  - L722: `return 'quote.html?' + params.toString();` → `return '/quote.html?' + params.toString();`
- [ ] **Step 2: Links markdown de fallbacks y service cards** — Edits en `js/chat-widget.js`:
  - Edit con `replace_all: true`: `](quote.html)` → `](/quote.html)` (8 ocurrencias, verificado con `grep -o "](quote\.html)" | wc -l` = 8)
  - `](sustainability.html)` → `](/sustainability.html)`
  - `](day-porter.html)` → `](/day-porter.html)`
  - `](janitorial.html)` → `](/janitorial.html)`
  - `](careers.html)` → `](/careers.html)`
  - `href: 'janitorial.html'` → `href: '/janitorial.html'`
  - `href: 'day-porter.html'` → `href: '/day-porter.html'`
- [ ] **Step 3: Privacy link en cookie-consent.js (L12)** — Edit en `js/cookie-consent.js`:
  ```
  our <a href="privacy.html">Privacy Policy</a>
  ```
  →
  ```
  our <a href="/privacy.html">Privacy Policy</a>
  ```
- [ ] **Step 4: Bump cache busters (mismo commit)** — chat-widget.js?v=4.3→4.4 (24 páginas) y cookie-consent.js?v=1.1→1.2 (26 páginas, incluye `quote.backup.html`):
  ```bash
  python3 - <<'EOF'
  import pathlib
  root = pathlib.Path("/Users/alexmercedes/Downloads/Ecco Webside")
  pairs = [("chat-widget.js?v=4.3", "chat-widget.js?v=4.4"),
           ("cookie-consent.js?v=1.1", "cookie-consent.js?v=1.2")]
  for old, new in pairs:
      n = 0
      for p in sorted(root.glob("*.html")) + sorted(root.glob("blog/*.html")):
          s = p.read_text(encoding="utf-8")
          if old in s:
              p.write_text(s.replace(old, new), encoding="utf-8")
              n += 1
      print(old, "->", new, ":", n, "files")
  EOF
  ```
  Salida esperada: `chat-widget.js?v=4.3 -> chat-widget.js?v=4.4 : 24 files` y `cookie-consent.js?v=1.1 -> cookie-consent.js?v=1.2 : 26 files`
- [ ] **Step 5: Verify** —
  ```bash
  cd "/Users/alexmercedes/Downloads/Ecco Webside" && \
  grep -nE "\]\((quote|sustainability|day-porter|janitorial|careers)\.html|href=\"quote\.html|href: '(janitorial|day-porter)\.html'|'quote\.html\?|'images/alina" js/chat-widget.js; \
  grep -c "](/quote.html)" js/chat-widget.js; \
  grep -c 'href="/privacy.html"' js/cookie-consent.js; \
  node --check js/chat-widget.js && node --check js/cookie-consent.js && echo SYNTAX-OK
  ```
  Esperado: primer grep SIN output, luego `8`, `1`, `SYNTAX-OK`
- [ ] **Step 6: Commit** — (el hook pre-commit dispara /ays; no saltarlo)
  ```bash
  cd "/Users/alexmercedes/Downloads/Ecco Webside" && \
  git add js/chat-widget.js js/cookie-consent.js $(grep -l "chat-widget.js?v=4.4\|cookie-consent.js?v=1.2" *.html blog/*.html) && \
  git commit -m "fix(js): rutas relativas a raiz-absolutas en chat-widget y cookie-consent (16 links + avatar + privacy) — bump v4.4/v1.2" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
  ```

### Task 15: quote-flow.js — eliminar teléfono (646) 303-0816 de mensajes >1M sqft
**Files:** Modify: `js/quote-flow.js` (líneas 2162, 2265), `quote.html` (línea 1194, bump v)
**Findings resueltos:** Phone number policy violation — (646) 303-0816 embedded in JS error messages (decisión bloqueada: NO phone, fallback = info@eccofacilities.com)

OJO: L2162 usa el escape `’` pero L2265 usa el carácter literal `’` (U+2019) en el source. Los old_string deben respetar eso exactamente.

- [ ] **Step 1: Reescribir mensaje V1 (L2162)** — Edit en `js/quote-flow.js`:
  ```js
  showSizeErr('For facilities over 1M sq ft, let’s chat directly. Call (646) 303-0816 or email info@eccofacilities.com and we’ll tailor a custom quote.');
  ```
  →
  ```js
  showSizeErr('For facilities over 1M sq ft, let’s chat directly. Email info@eccofacilities.com and we’ll tailor a custom quote.');
  ```
- [ ] **Step 2: Reescribir mensaje V2 (L2265)** — Edit en `js/quote-flow.js` (apóstrofe literal `’`):
  ```js
  if (typeof showSizeErr === 'function') showSizeErr('For facilities over 1M sq ft, let’s chat directly. Call (646) 303-0816 or email info@eccofacilities.com.');
  ```
  →
  ```js
  if (typeof showSizeErr === 'function') showSizeErr('For facilities over 1M sq ft, let’s chat directly. Email info@eccofacilities.com and we’ll tailor a custom quote.');
  ```
- [ ] **Step 3: Bump quote-flow.js en quote.html (L1194, mismo commit)** — Edit en `quote.html`:
  ```html
  <script defer src="js/quote-flow.js?v=38.0"></script>
  ```
  →
  ```html
  <script defer src="js/quote-flow.js?v=39.0"></script>
  ```
  (`quote.backup.html` queda en v=9.0 a propósito: es backup congelado, se retira en fase posterior.)
- [ ] **Step 4: Verify** —
  ```bash
  cd "/Users/alexmercedes/Downloads/Ecco Webside" && grep -rn "646" js/ ; grep -c "quote-flow.js?v=39.0" quote.html; node --check js/quote-flow.js && echo SYNTAX-OK
  ```
  Esperado: grep de `646` SIN output en js/, luego `1`, `SYNTAX-OK`
- [ ] **Step 5: Commit** — (hook pre-commit dispara /ays)
  ```bash
  cd "/Users/alexmercedes/Downloads/Ecco Webside" && git add js/quote-flow.js quote.html && \
  git commit -m "fix(quote-flow): elimina telefono (646) 303-0816 de mensajes >1M sqft, CTA por email — bump v39.0" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
  ```

### Task 16: main.js — aislar los dos handlers .svc-tab por esquema de datos
**Files:** Modify: `js/main.js` (líneas 81–94 y 209–211), + bump `main.js?v=4.6→4.7` en 25 páginas
**Findings resueltos:** Duplicate .svc-tab handlers — both panels active on services.html, aria-selected/tabindex misapplied on index.html

Diagnóstico verificado leyendo ambos handlers y el markup real: NINGUNO de los dos es obsoleto — sirven a páginas distintas con esquemas distintos:
- `services.html` (L84–85): tabs con `data-panel` + `role=tab` + panels por `id` → lo sirve el handler 1 (main.js L81–94, con ARIA + tabindex + syncSvcAria).
- `index.html` (L195–211): tabs/panels/`.svc-bg` con `data-svc`, sin roles ARIA → lo sirve el handler 2 (`initSvcTabs`, main.js L203–230).

El bug es fuego cruzado: en services.html el handler 2 obtiene `target = null` y `null === null` activa TODOS los panels; en index.html el handler 1 obtiene `target = undefined`, desactiva todos los panels y aplica `aria-selected`/`tabindex` a botones que no son `role=tab`. Borrar cualquiera de los dos rompería una página. Fix quirúrgico: guard de esquema en cada handler.

- [ ] **Step 1: Guard en handler 1 (L81–84)** — Edit en `js/main.js`:
  ```js
  document.querySelectorAll('.svc-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      var target = tab.dataset.panel;
      document.querySelectorAll('.svc-tab').forEach(function(t) {
  ```
  →
  ```js
  document.querySelectorAll('.svc-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      var target = tab.dataset.panel;
      if (!target) return; /* index.html tabs use data-svc; handled by initSvcTabs */
      document.querySelectorAll('.svc-tab').forEach(function(t) {
  ```
- [ ] **Step 2: Guard en handler 2 (L210–212)** — Edit en `js/main.js`:
  ```js
      tab.addEventListener('click', function() {
        var target = tab.getAttribute('data-svc');
        tabs.forEach(function(t) { t.classList.remove('active'); });
  ```
  →
  ```js
      tab.addEventListener('click', function() {
        var target = tab.getAttribute('data-svc');
        if (!target) return; /* services.html tabs use data-panel; handled above */
        tabs.forEach(function(t) { t.classList.remove('active'); });
  ```
- [ ] **Step 3: Bump main.js?v=4.6→4.7 (25 páginas, mismo commit)** —
  ```bash
  python3 - <<'EOF'
  import pathlib
  root = pathlib.Path("/Users/alexmercedes/Downloads/Ecco Webside")
  old, new = "main.js?v=4.6", "main.js?v=4.7"
  n = 0
  for p in sorted(root.glob("*.html")) + sorted(root.glob("blog/*.html")):
      s = p.read_text(encoding="utf-8")
      if old in s:
          p.write_text(s.replace(old, new), encoding="utf-8")
          n += 1
  print(old, "->", new, ":", n, "files")
  EOF
  ```
  Salida esperada: `main.js?v=4.6 -> main.js?v=4.7 : 25 files` (`quote.backup.html` queda en v=4.4, intencional)
- [ ] **Step 4: Verify** —
  ```bash
  cd "/Users/alexmercedes/Downloads/Ecco Webside" && \
  grep -n "if (!target) return;" js/main.js; \
  grep -rl "main.js?v=4.6" *.html blog/*.html; \
  node --check js/main.js && echo SYNTAX-OK
  ```
  Esperado: 2 líneas con el guard (~L84 y ~L212), grep de v=4.6 SIN output, `SYNTAX-OK`. Check manual opcional: abrir `services.html` local, click en tab "Day Porter" → solo UN `.svc-panel.active`; en `index.html`, los `.svc-tab` no deben ganar `aria-selected` tras click.
- [ ] **Step 5: Commit** — (hook pre-commit dispara /ays)
  ```bash
  cd "/Users/alexmercedes/Downloads/Ecco Webside" && \
  git add js/main.js $(grep -l "main.js?v=4.7" *.html blog/*.html) && \
  git commit -m "fix(main): guardas por esquema en handlers .svc-tab (data-panel vs data-svc) — bump v4.7" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
  ```

### Task 17: careers.html — confirmación visible para ?submitted=1
**Files:** Modify: `careers.html` (script inline antes de `</body>`, ~L376), `css/styles.css` (append al final, minificado), + bump `styles.css?v=15.1→15.2` en 25 páginas
**Findings resueltos:** careers.html?submitted=1 redirect target has no handler — user returns from FormSubmit with zero confirmation

El form (careers.html L204–208) redirige a `https://eccofacilities.com/careers.html?submitted=1` vía `_next`, y `submitted` aparece solo 1 vez en la página (verificado): nada lo maneja. Decisión: script inline page-specific (mantiene main.js genérico) + clase CSS nueva (regla: cero inline styles). Copy en sentence case, sin em dashes, sin console.log.

- [ ] **Step 1: Clase .form-confirm en css/styles.css** — Edit (append al final del archivo minificado; el old_string es el cierre actual del archivo, único, verificado). NO usar perl/sed; si se quisiera re-minificar, SOLO `bunx clean-css-cli` (pero aquí no hace falta: se appendea ya minificado):
  ```
  @media (prefers-reduced-motion:reduce){.hero-scroll-stack svg{animation:none!important;opacity:.6}}
  ```
  →
  ```
  @media (prefers-reduced-motion:reduce){.hero-scroll-stack svg{animation:none!important;opacity:.6}}.form-confirm{display:block;overflow:hidden;max-width:680px;margin:0 auto 2rem;padding:1rem 1.4rem;background:var(--gbg);border:1px solid var(--gbd);border-radius:var(--r);color:var(--td);font-family:var(--fb);font-size:.98rem;font-weight:600;line-height:1.5;text-align:center}@media (max-width:768px){.form-confirm{margin:0 1.2rem 1.5rem;font-size:.92rem}}@media (min-width:769px){.form-confirm{margin:0 auto 2.5rem}}
  ```
  (Tokens existentes verificados en :root: `--gbg`, `--gbd`, `--r`, `--td`, `--fb`. Regla unlayered al final = gana sobre @layer. Base + mobile + desktop cubiertos.)
- [ ] **Step 2: Handler inline en careers.html** — Edit (anchor único verificado; estable aunque Task 14 ya haya bumpeado los `<script src>` de arriba):
  ```html
  <!-- End of HubSpot Embed Code -->
  </body>
  ```
  →
  ```html
  <!-- End of HubSpot Embed Code -->
  <script>
  (function () {
    if (window.location.search.indexOf('submitted=1') === -1) return;
    function showConfirm() {
      var formSec = document.querySelector('.form-sec');
      if (!formSec) return;
      var note = document.createElement('p');
      note.className = 'form-confirm';
      note.setAttribute('role', 'status');
      note.textContent = 'Application received. Thank you for applying. Our hiring team will review your application and reach out within 3 to 5 business days.';
      formSec.insertBefore(note, formSec.firstChild);
      var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      note.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showConfirm);
    } else {
      showConfirm();
    }
  })();
  </script>
  </body>
  ```
  (Se inserta encima de `.form-head` dentro de `.form-sec`; el nodo NO lleva `rv`/`rv-light`, así que es visible on load. El plazo "3 to 5 business days" coincide con el `_autoresponse` existente.)
- [ ] **Step 3: Bump styles.css?v=15.1→15.2 (25 páginas, mismo commit)** —
  ```bash
  python3 - <<'EOF'
  import pathlib
  root = pathlib.Path("/Users/alexmercedes/Downloads/Ecco Webside")
  old, new = "styles.css?v=15.1", "styles.css?v=15.2"
  n = 0
  for p in sorted(root.glob("*.html")) + sorted(root.glob("blog/*.html")):
      s = p.read_text(encoding="utf-8")
      if old in s:
          p.write_text(s.replace(old, new), encoding="utf-8")
          n += 1
  print(old, "->", new, ":", n, "files")
  EOF
  ```
  Salida esperada: `styles.css?v=15.1 -> styles.css?v=15.2 : 25 files` (`quote.backup.html` queda en v=13.7, intencional)
- [ ] **Step 4: Verify** —
  ```bash
  cd "/Users/alexmercedes/Downloads/Ecco Webside" && \
  grep -c "form-confirm" css/styles.css; grep -c "form-confirm" careers.html; \
  grep -c "console.log" careers.html; grep -rl "styles.css?v=15.1" *.html blog/*.html; \
  python3 -m http.server 8080 --directory "/Users/alexmercedes/Downloads/Ecco Webside" &
  sleep 1 && curl -s "http://localhost:8080/careers.html" | grep -c "submitted=1" ; kill %1
  ```
  Esperado: `3` (styles.css: base + 2 medias), `1` (careers), `0` console.log, grep v=15.1 SIN output, y `2` en el curl (el `_next` + el handler). Check manual recomendado: abrir `http://localhost:8080/careers.html?submitted=1` → banner verde visible encima del form, anunciado como status.
- [ ] **Step 5: Commit** — (hook pre-commit dispara /ays)
  ```bash
  cd "/Users/alexmercedes/Downloads/Ecco Webside" && \
  git add careers.html css/styles.css $(grep -l "styles.css?v=15.2" *.html blog/*.html) && \
  git commit -m "feat(careers): confirmacion visible al volver de FormSubmit con ?submitted=1 — bump styles v15.2" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
  ```

### Task 18: Eliminar maximum-scale=1.0 de los viewport metas (a11y zoom)
**Files:** Modify: `index.html` (L9), `quote-janitorial.html` (L9), `quote-dayporter.html` (L9)
**Findings resueltos:** maximum-scale=1.0 blocks pinch-zoom (WCAG 1.4.4) on index + legacy quote pages

Verificado: solo estas 3 páginas tienen `maximum-scale` (grep en todo *.html), las 3 en línea 9 con string idéntico. Las legacy quote pages se borran en fase posterior, pero el fix es de una línea — se incluyen igual para no dejar la violación viva mientras tanto.

- [ ] **Step 1: Mismo Edit en los 3 archivos** — en `index.html`, `quote-janitorial.html` y `quote-dayporter.html` (L9 en los tres):
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  ```
  →
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ```
- [ ] **Step 2: Verify** —
  ```bash
  cd "/Users/alexmercedes/Downloads/Ecco Webside" && grep -rn "maximum-scale" *.html blog/*.html; grep -c 'content="width=device-width, initial-scale=1.0"' index.html quote-janitorial.html quote-dayporter.html
  ```
  Esperado: primer grep SIN output; segundo: `index.html:1`, `quote-janitorial.html:1`, `quote-dayporter.html:1`
- [ ] **Step 3: Commit** — (hook pre-commit dispara /ays; sin bump: no se tocó CSS/JS)
  ```bash
  cd "/Users/alexmercedes/Downloads/Ecco Webside" && git add index.html quote-janitorial.html quote-dayporter.html && \
  git commit -m "fix(a11y): permite pinch-zoom, elimina maximum-scale=1.0 de los viewport metas (WCAG 1.4.4)" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
  ```

### Task 19: cookie-consent.js — rama GPC iguala al decline manual
**Files:** Modify: `js/cookie-consent.js` (líneas 4–8), + bump `cookie-consent.js?v=1.2→1.3` en 26 páginas
**Findings resueltos:** GPC decline asymmetry — GPC branch sets only ecco_cookies; manual decline also sets ecco_consent and dispatches ecco:consent-declined

DEPENDE DE Task 14: asume que cookie-consent.js ya quedó en v=1.2. Si Task 14 no se ejecutó antes, ajustar el par de versiones a 1.1→1.2 aquí. Solo paridad con el decline manual (L25–32); el consent-mode gating completo es de fase posterior.

- [ ] **Step 1: Completar rama GPC** — Edit en `js/cookie-consent.js` (el comentario lleva em dash en el código existente; reproducir exacto):
  ```js
    if(gpcEnabled){
      localStorage.setItem('ecco_cookies','declined');
      if(window._hsq)window._hsq.push(['doNotTrack']);
      return; // No banner needed — GPC auto-declines
    }
  ```
  →
  ```js
    if(gpcEnabled){
      localStorage.setItem('ecco_cookies','declined');
      localStorage.setItem('ecco_consent','declined');
      if(window._hsq)window._hsq.push(['doNotTrack']);
      window.dispatchEvent(new CustomEvent('ecco:consent-declined'));
      return; // No banner needed — GPC auto-declines
    }
  ```
- [ ] **Step 2: Bump cookie-consent.js?v=1.2→1.3 (mismo commit)** —
  ```bash
  python3 - <<'EOF'
  import pathlib
  root = pathlib.Path("/Users/alexmercedes/Downloads/Ecco Webside")
  old, new = "cookie-consent.js?v=1.2", "cookie-consent.js?v=1.3"
  n = 0
  for p in sorted(root.glob("*.html")) + sorted(root.glob("blog/*.html")):
      s = p.read_text(encoding="utf-8")
      if old in s:
          p.write_text(s.replace(old, new), encoding="utf-8")
          n += 1
  print(old, "->", new, ":", n, "files")
  EOF
  ```
  Salida esperada: `cookie-consent.js?v=1.2 -> cookie-consent.js?v=1.3 : 26 files`
- [ ] **Step 3: Verify** —
  ```bash
  cd "/Users/alexmercedes/Downloads/Ecco Webside" && \
  grep -c "ecco_consent','declined'" js/cookie-consent.js; \
  grep -c "ecco:consent-declined" js/cookie-consent.js; \
  grep -rl "cookie-consent.js?v=1.2" *.html blog/*.html; \
  node --check js/cookie-consent.js && echo SYNTAX-OK
  ```
  Esperado: `2` (rama GPC + decline manual), `2` (idem), grep de v=1.2 SIN output, `SYNTAX-OK`
- [ ] **Step 4: Commit** — (hook pre-commit dispara /ays)
  ```bash
  cd "/Users/alexmercedes/Downloads/Ecco Webside" && \
  git add js/cookie-consent.js $(grep -l "cookie-consent.js?v=1.3" *.html blog/*.html) && \
  git commit -m "fix(cookie-consent): GPC iguala el decline manual (ecco_consent + evento ecco:consent-declined) — bump v1.3" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
  ```

---

## Notas de los redactores (verificaciones hechas, trampas)

> **Numeración:** estas notas usan la numeración ORIGINAL de cada redactor. Mapeo a la global del plan: Bloque A (fase0-css) Task 1–5 = global 1–5 · Bloque B (fase0-contenido) Task 1–8 = global 6–13 · Bloque C (fase0-js) Task 1–6 = global 14–19.

### fase0-css
TODO VERIFICADO contra archivos reales Y en navegador local (Claude Preview, serve.js, emulación prefers-color-scheme). Riesgos y hechos que el ensamblador DEBE saber:

1) CORRECCIÓN DE ALCANCE EN TASK 4: la premisa "ghost cards en welcome" NO se reproduce en el working tree — verificado con computed styles y screenshot en dark: cards del welcome y space screen correctas (bg #243441, tinta marfil) gracias al sweep PART B ya presente en source Y minificado. Lo realmente roto hoy en /quote dark (verificado): (a) botón Send #qfContactSubmit blanco sobre #6FB376 = 2.5:1 (su regla light es !important en @layer components → el fix necesita @layer reset !important, patrón PART C ya documentado en el propio archivo) y (b) tokens --rv-* varados en light (hallazgo P1 de la auditoría; los consume poco DOM actual pero la sección lleva .qf-rv y JS puede reinyectar componentes rv). Las "ghost cards" vistas en vivo se explican con alta probabilidad por entrega stale: HEAD local de quote.html aún enlaza ?v=48.2 mientras los commits D126–D129 cambiaron el CSS sin bump → CDN/navegadores sirven CSS dark a medio camino. El bump 50.3→50.4 de este task es también el fix de entrega.

2) PROHIBIDO RE-MINIFICAR quote-flow: verificado byte a byte que git HEAD:css/quote-flow.css == `bunx clean-css-cli` del source actual (213.543 bytes), y que el minificado del working tree (210.488 bytes) lleva ~3KB de trabajo SIN commitear hecho SOLO en el minificado (purge de ~30 @keyframes muertos, títulos clamp(1.625rem,4.5vw,4.125rem), min-height 36→44px, tabular-nums, bloques @layer overrides al final). `bunx clean-css-cli -o css/quote-flow.css css/quote-flow.source.css` lo destruiría. Por eso Tasks 4-5 editan source+minificado en paralelo. Pendiente (fase posterior, NO Fase 0): backportar ese delta al source. La lección clean-css/@layer sigue vigente para esa futura resincronización (verificado que el minificado fresco SÍ conserva la línea `@layer reset,tokens,...;` en este caso). bunx imprime "Saved lockfile" pero NO crea bun.lock en el repo (verificado — sin riesgo Cloudflare).

3) REPO EN ESTADO DELICADO: main local está 12 commits DETRÁS de origin/main (origin = 3ab37e7 D169) con decenas de archivos modificados sin commitear. Los commits de estas tasks se montan sobre esa base vieja; antes de push habrá que decidir rebase/merge — fuera del alcance de estas tasks pero bloqueante para el deploy. Verificación en .pages.dev solo tiene sentido tras resolver eso.

4) Anclas Edit verificadas únicas: cola de styles.css (count=1), regla .svc-panels !important (count=1), bloque cookie source (count=1) y minificado (count=1; la otra aparición vive en bloque dark-DISABLED), quote-flow.css?v=50.3 en quote.html (count=1). 25 páginas exactas con styles.css?v=15.1 (quote.backup.html en 13.7 — dev, excluida).

5) Dependencias de orden: Task 3 asume v=15.2 (tras Task 1); Task 5 asume v=50.4 (tras Task 4). Cada task indica cómo partir del valor vigente si se reordena.

6) Trampas de verificación visual detectadas: los botones (.btn, .cookie-btn) llevan transition ~0.2-0.3s → leer computed styles tras ~300ms o se ve el valor viejo (me pasó dos veces). Con Global Privacy Control el cookie banner nunca se monta (auto-decline) → Task 5 incluye snippet de simulación. En el preview, /quote bloquea la navegación saliente (guard de borrador) → reiniciar el server o abrir la URL destino directo.

7) Vistos pero NO tocados (fuera de Fase 0 o ya cubiertos por otros hallazgos): banner cookie en light sigue navy System A sobre /quote; pill "Ask Alina" del chat-widget eclipsa el botón Accept en viewports estrechos (visible en mis screenshots de janitorial/day-porter — hallazgo de colisión de flotantes ya existe en la auditoría para index; en estas páginas lo causa el chat launcher); spinner del qf2-cta (border blanco) en dark queda blanco — cosmético, no accesibilidad; `.svc-panels{min-height:auto}` sin scope es inofensivo y se deja.

### fase0-contenido
VERIFICADO contra el working tree (no contra HEAD). Conteos y líneas confirmados con grep/sed/ls: 62 refs logo-vertical en 24 archivos (incluye quote.backup.html e index-reference.html — no enlazados pero el bulk replace los cubre, inofensivo); nav-logo blanco en los 7 blog/*.html línea 41 (el footer también usa el blanco pero sobre fondo oscuro: correcto, las tasks lo preservan); gyms.webp solo en benefits-day-porter:68; hero-office.webp existe (1920x1282) y lo inspeccioné visualmente — interior moderno de edificio comercial, por eso el alt se ajusta de "lobby" a "open common area"; alina@ única ocurrencia en quote.html:1131; teléfono en quote.html solo línea 188 (noscript); careers id="positions" duplicado en 73/121 con strings idénticas (por eso el Edit lleva 3 líneas de contexto); sitemap.xml <loc> en 94/100, total 24 <loc> antes / 22 después.

DECISIONES TOMADAS: (1) Fecha del post janitorial-vs-day-porter unificada a 2026-02-28 (NO al schema 2026-03-22): 2 de 3 puntos ya dicen Feb 28 y preserva el orden descendente de cards en blog.html — con Mar 22 habría que mover el bloque de card completo. Un solo Edit en vez de tres. (2) careers: gana "3-5 business days" porque es lo que el autoresponse del backend realmente envía. (3) sitemap.html: "20+ Pages" se conserva (22 páginas reales, es cierto); "6 Sections"→"5 Sections"; "Always Updated" eliminado. (4) noscript de quote.html: bloque honesto solo-email con clases existentes qf-noscript/-title/-contact.

RIESGOS / AVISOS AL ENSAMBLADOR: (a) NINGÚN task toca CSS ni JS → NO se requiere bump de cache busters en ninguno de los 8 commits (regla cumplida por vacuidad; si el ensamblador fusiona estos tasks con otros que toquen css/js, el bump va en ESE commit). (b) El teléfono (646) 303-0816 TAMBIÉN vive en js/quote-flow.js líneas 2162 y 2265 (mensaje de error >1M sqft) y en quote.backup.html — fuera de mi alcance asignado; debe cubrirlo el task de phone-removal del grupo JS (requiere bump de quote-flow.js?v=38.0). (c) Tras Task 5, quedan reglas CSS muertas (qf-noscript-form/-input/-btn) en quote-flow.css — NO purgar en Phase 0 (trampa conocida de purga cross-page; dejar para fase de redesign). (d) La imagen de blog hero (Task 3) mantiene sus estilos inline preexistentes — violación previa de "zero inline styles", no introducida por nosotros; corresponde a la fase de redesign. (e) og:image → logo-horizontal.png es interino y no es 1200x630; el asset social real llega en fase posterior (decisión cerrada). (f) El hook pre-commit dispara /ays en cada commit — los 8 commits son independientes y pueden ejecutarse en cualquier orden, salvo que Task 1 y Task 5 tocan ambos quote.html (líneas distintas: 22/27 vs 17/19/26/163-191/1131 — sin colisión de strings).

### fase0-js
VERIFICADO contra el working tree real (todo old_string confirmado único con grep antes de redactar).

RIESGO CRÍTICO PARA EL ASSEMBLER — working tree sucio: hay ~35 archivos .html/css/js ya modificados sin commitear (ver git status). Los `git add` de estas tasks listan archivos explícitos, pero las páginas bumpeadas (24-26 html) YA tienen hunks ajenos en el working tree: al stagearlas, esos cambios previos viajan en el commit. El plan debe ordenar commitear/stashear el WIP actual ANTES de ejecutar Phase 0, o aceptar explícitamente que los bumps arrastran el WIP de esas páginas.

Task 3 (main.js) — desviación deliberada del encargo: el audit pedía "borrar el handler obsoleto", pero NINGUNO es obsoleto. services.html usa el esquema data-panel/role=tab/id (handler L81-94, que además maneja ARIA y syncSvcAria) e index.html usa data-svc + .svc-bg (initSvcTabs L203-230). Borrar cualquiera rompe una página. El bug real es fuego cruzado (en services, target null === getAttribute null activa TODOS los panels; en index, el handler 1 des-activa todo y mete aria-selected/tabindex en botones sin role=tab). Fix: guard de esquema en cada handler (2 líneas). El keyboard-nav de L97-109 sigue funcionando con los guards.

Orden obligatorio: Task 1 ANTES que Task 6 (doble bump de cookie-consent.js: 1.1→1.2 en T1, 1.2→1.3 en T6; T6 incluye nota de ajuste si se reordena). El resto es independiente.

Detalles verificados que el ejecutor debe respetar:
- chat-widget.js: el avatar "duplicado" del live es 1 sola fuente (CONFIG.avatar L78 interpolado 2× en innerHTML L216). Total: 16 refs .html (8× `](quote.html)`, 4 markdown sueltos, CTA L216, 2 hrefs L424-425, buildQuoteUrl L722) + avatar. El regex L247 acepta `/` inicial, los links absolutos siguen linkificando.
- quote-flow.js: L2162 usa escape ’, L2265 usa ’ literal (U+2019) — old_strings distintos a propósito. No queda ningún "646" en js/ tras el fix.
- quote.backup.html queda intencionalmente sin bumps (main v4.4, quote-flow v9.0, styles v13.7 — backup congelado que se retira en fase posterior), pero SÍ recibe el bump de cookie-consent (carga v=1.1 como las páginas vivas; reemplazo por string exacto, inofensivo).
- Counts confirmados: chat-widget 24 consumidores, cookie-consent 26 (incluye backup), main.js?v=4.6 25, styles.css?v=15.1 25. quote.html NO carga chat-widget (retirado en D125).
- styles.css: minificado single-line con `@layer ...;:root{...}` al inicio — .form-confirm se APPENDEA ya minificado al final (unlayered = gana a las layers), sin re-minificar (trampa conocida de clean-css/perl). Usa tokens existentes (--gbg/--gbd/--r/--td/--fb) para no pelear con el redesign posterior. Base + mobile + desktop + overflow:hidden cubiertos.
- careers.html: anchor de inserción `<!-- End of HubSpot Embed Code -->\n</body>` es único y estable aunque T1 haya bumpeado los <script src> de arriba. El banner no lleva clases rv (visible on load), role=status, scroll respeta prefers-reduced-motion, copy sin em dashes ni console.log, plazo "3 to 5 business days" coherente con el _autoresponse existente.
- maximum-scale solo existe en las 3 páginas citadas (L9 idéntica en las tres); las legacy quote pages se incluyen igual aunque mueran en fase posterior.
- Hay html de desarrollo en raíz (mockups.html, mobile-test.html, font-*.html, emailjs-template.html, index-reference.html, color-swatches.html): los bumps por string exacto solo tocan los que realmente referencien la versión vieja — los counts esperados de los scripts python ya lo reflejan.
- /ays: el hook pre-commit lo dispara en cada commit (6 commits); las tasks lo anotan sin ejecutarlo.

