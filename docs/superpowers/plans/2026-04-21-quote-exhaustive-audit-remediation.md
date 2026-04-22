# Plan de Remediación Exhaustiva — Formulario Quote

**Fecha:** 2026-04-21
**Auditoría base:** 6 agentes paralelos, ~174 hallazgos reales (+ 3 falsos positivos descartados)
**Archivos intervenidos:** `quote.html`, `js/quote-flow.js`, `css/quote-flow.source.css`, `functions/api/{submit-quote,capture-partial,_middleware,crm-leads}.js`, `_headers`
**Estimación total:** ~28–35 horas repartidas en 10 olas secuenciales

---

## Principios operativos

1. **Una ola = un commit** (o grupo pequeño de commits coherentes). Nunca mezclar seguridad con UX o CSS.
2. **Cache busters:** bump en el mismo commit que la edición. CSS `v28.7 → v29.0` tras Ola 4. JS `v26.8 → v27.0` tras Ola 3. `main.js v4.6 → v4.7` si cambia.
3. **`/ays` antes de CADA commit** (hook pre-commit ya lo enforza). Ninguna excepción.
4. **Deploy a `.pages.dev` antes de producción**. Verificar live, no sólo preview local.
5. **Smoke test en móvil real** tras Olas que toquen CSS/responsive (Ola 5).
6. **Rollback strategy:** cada ola crea `.backup-ola-N/` con snapshot de los 3 archivos principales antes de cambios.
7. **No `--no-verify` ni skips de hooks.** Si `/ays` falla, arreglar, no saltar.
8. **Errores durante implementación disparan `leccionaprendida`** automáticamente.

---

---

## OLA 1 — Seguridad backend crítica (2–3h) 🔴

**Objetivo:** Tapar los 6 bugs de CORS/auth/XSS/race que permiten ataques reales.

**Archivos:**
- `functions/api/_middleware.js`
- `functions/api/capture-partial.js`
- `functions/api/submit-quote.js`
- `functions/api/crm-leads.js`

**Cambios:**

1. **`_middleware.js:13`** — Reemplazar `indexOf` con allowlist exacta.
   ```js
   const ALLOWED = new Set(['https://eccofacilities.com', 'https://www.eccofacilities.com']);
   const previewOrigin = context.env.ALLOWED_PREVIEW_ORIGIN;
   const corsOrigin = ALLOWED.has(url.origin) || (previewOrigin && url.origin === previewOrigin)
     ? url.origin : 'https://eccofacilities.com';
   ```
   Aplicar al handler OPTIONS y al resto.

2. **`capture-partial.js:8`** — Idéntica allowlist. Retirar regex `pages.dev` wildcard.

3. **`capture-partial.js:22`** — Agregar Turnstile token check + rate-limit KV idéntico a submit-quote.
   - Si `!env.KV` → pasar (dev) pero log `console.error`.
   - Límite: 3 partials por IP por hora.

4. **`capture-partial.js:27,31`** — Cambiar 200+`{ok:true}` a 400 en JSON inválido o email inválido.

5. **`capture-partial.js:33`** — Reemplazar regex laxo con el estricto de submit-quote:
   ```js
   const EMAIL_RE = /^(?!\.)(?!.*\.\.)[A-Za-z0-9._%+\-]+(?<!\.)@(?!-)[A-Za-z0-9](?:[A-Za-z0-9.\-]*[A-Za-z0-9])?\.[A-Za-z]{2,24}$/;
   ```

6. **`capture-partial.js`** — Anti-overwrite: si lead existe y `updated_at < 5min` ATRÁS, devolver 200 sin escribir (previene race entre tab duplicado y enumeración).

7. **`submit-quote.js:46-61`** — Rate-limit hardening. Bajar threshold a 8/hr + agregar check secundario tras write.

8. **`crm-leads.js:193,197`** — Escapar `<` y `>` en `activity.description` antes de insertar.
   ```js
   const safe = s => (s || '').toString().replace(/</g, '&lt;').replace(/>/g, '&gt;');
   description: `Stage changed to ${safe(update.pipeline_stage)}`
   ```

**Tests:**
- `curl -H "Origin: https://evil-eccofacilities.com.attacker.com"` → debe responder con origin canónico, no con el evil.
- `curl -X POST /api/capture-partial -d '{}'` sin Turnstile → 400.
- 4 requests a capture-partial en 1 seg desde misma IP → último 429.
- Lead con `<script>alert(1)</script>` en pipeline_stage → CRM UI muestra texto escapado.

**Cache buster:** ninguno (backend-only).
**Commit:** `fix(security): CORS exact-match, capture-partial auth+validation, activity XSS guard`
**AYS:** antes de commit.

---

## OLA 2 — A11y + Performance bloqueantes (2h) 🔴

**Objetivo:** Fixes que desbloquean usuarios de teclado/SR/3G.

**Archivos:**
- `quote.html`
- `css/quote-flow.source.css`
- `js/quote-flow.js`

**Cambios:**

1. **`quote.html:1021`** — Agregar `defer` a `quote-flow.js`.
   ```html
   <script defer src="js/quote-flow.js?v=27.0"></script>
   ```
   Envolver `init()` en `DOMContentLoaded` listener por si ya lo está.

2. **`quote.html:965-970`** (exit-intent overlay) — Agregar atributos dialog.
   ```html
   <div id="qfExitOverlay" role="dialog" aria-modal="true" aria-labelledby="qfExitTitle" ...>
   ```

3. **`quote-flow.js:2872-2927`** — Agregar handler ESC:
   ```js
   document.addEventListener('keydown', (e) => {
     if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeExit();
   });
   ```
   Focus trap dentro del modal (first/last tab wrap).

4. **`css/quote-flow.source.css`** — Restaurar focus rings en los 5 selectores:
   - `:1648` `.qf-exit-input:focus`
   - `:2849` `.qf-s5-time-select:focus`
   - `:10565` `.qf-rev-special-cell .qf-rev-special-input:focus`
   - `:11467` `.qf-rv .qf-rev-input:focus`
   - `:11561` `.qf-rv .qf-rv-notes-input:focus`

   Patrón uniforme:
   ```css
   outline: 2px solid var(--qf-sage-bright);
   outline-offset: 2px;
   ```

5. **Alt text de avatars Alina** — Para las 11 ocurrencias de `<img ... alt="">` del avatar:
   - En burbujas decorativas → agregar `role="presentation"`.
   - En hero/greeting → `alt="Alina, AI cleaning advisor"`.

6. **`quote.html:509,838`** — Agregar `aria-live="polite"` al day counter y special-instructions counter.

7. **`quote.html:166`** — Resolver nav doble-hidden. Remover attr `hidden` del `<nav>` y dejar solo el CSS `display:none` (o vice-versa). Documentar con comentario.

**Tests:**
- Chrome DevTools → Lighthouse A11y ≥ 95.
- Keyboard-only: Tab por form, ESC cierra exit modal, focus siempre visible.
- VoiceOver Safari: escuchar cambio de contador al seleccionar días.
- Network throttle 3G: `quote-flow.js` no bloquea paint.

**Cache buster:** `quote-flow.js v26.8 → v27.0`.
**Commit:** `fix(a11y,perf): defer quote-flow.js, focus rings, exit-modal ARIA, avatar alt`
**AYS:** antes de commit.
**Leccion aprendida:** si algún focus ring rompe diseño, documentar en memoria.

---

## OLA 3 — JS defensivo (state, races, cleanup) (3–4h) 🟠

**Objetivo:** Eliminar races, leaks y guards faltantes en quote-flow.js.

**Archivos:**
- `js/quote-flow.js`

**Cambios:**

1. **`loadDraft()` L403-414** — Type-guard parsed state:
   ```js
   if (typeof parsed.s !== 'object' || parsed.s === null) return;
   if (parsed.s.days && !Array.isArray(parsed.s.days)) parsed.s.days = [];
   if (parsed.s.dpDays && !Array.isArray(parsed.s.dpDays)) parsed.s.dpDays = [];
   ```

2. **`goNext()/goBack()` L1001-1048** — Re-entry guard:
   ```js
   var _transitioning = false;
   function goNext() {
     if (_transitioning) return;
     _transitioning = true;
     // ...existing logic...
     setTimeout(() => { _transitioning = false; }, 850);
   }
   ```
   Mismo en `goBack()`.

3. **Submit handler L2584-2625** — Disable button ANTES del async:
   ```js
   btn.disabled = true;
   btn.setAttribute('aria-busy', 'true');
   const cooldownTs = Date.now();
   localStorage.setItem('qf_cooldown', String(cooldownTs));
   // then fetch...
   ```

4. **`awaitTurnstile()` L2639-2660** — AbortController:
   ```js
   const controller = new AbortController();
   const signal = controller.signal;
   const timeout = setTimeout(() => controller.abort(), 10000);
   // ...await token with signal check...
   clearTimeout(timeout);
   ```

5. **Day toggle L1459-1460** — Debounce 150ms:
   ```js
   btn.disabled = true;
   setTimeout(() => { btn.disabled = false; }, 150);
   ```

6. **Listener cleanup L825** — Agregar `removeEventListener` para los listeners de scroll/resize registrados en L577-578, referenciados por nombre.

7. **`STATE.days` null-guard L2107** — `(STATE.days || []).indexOf(...)`.

8. **`validateForSubmit()` L2518** — Re-check disposable email + re-check dpDays si servicio='both'.

9. **Edit panel service change L2159** — Validar porter/size cuando cambia servicio.

10. **Phone extension L1114** — Rechazar input con 'x' o capturar en `STATE.userPhoneExt`.

11. **Errores 4xx vs 5xx L2685-2694** — Diferencia message:
    ```js
    if (status === 403) msg = 'Security check failed. Please refresh and try again.';
    else if (status >= 500) msg = 'Our server had a hiccup. Try again or email info@eccofacilities.com.';
    else msg = 'Something didn\'t go through. Please review and try again.';
    ```

12. **`scheduleLiveCounter()` L564-572** — Store interval ID, clear on success screen.

13. **`__qfRvListenerAttached` L2166** — Migrar a `WeakMap`.

14. **`console.warn` gate L172,380** — `if (host === 'localhost')` wrap.

15. **Typo-detection email** (nuevo, L~1080):
    ```js
    const TYPO_MAP = {'gmai.com':'gmail.com','gmial.com':'gmail.com','gnail.com':'gmail.com','hotmai.com':'hotmail.com','yaho.com':'yahoo.com','outlok.com':'outlook.com'};
    function suggestEmail(e){ const d=(e.split('@')[1]||'').toLowerCase(); return TYPO_MAP[d] ? e.replace(d,TYPO_MAP[d]) : null; }
    ```
    Mostrar toast: "Did you mean `user@gmail.com`?" con click-to-apply.

16. **Disposable list** — Convertir Array a Set. Quitar `mail.tm` e `inboxkitten.com`. Cambiar bloqueo a soft-warn + opt-in: "We noticed a temporary email. Prefer to use your work email for proposal delivery?"

**Tests:**
- Doble-click en Continue → una sola transición.
- Doble-click en Submit → un solo lead creado.
- Modificar `localStorage` `qf_draft` con `{s:"evil"}` → form se abre normal, ignora state corrupto.
- Network offline al submit → error 5xx-like con mensaje útil.
- Email `user@gmai.com` → toast sugiere gmail.com.

**Cache buster:** `quote-flow.js v27.0 → v27.1` (ya bumpeado en Ola 2, incrementar).
**Commit:** `fix(quote): state guards, race conditions, typo detection, disposable soft-warn`
**AYS:** antes de commit.

---

## OLA 4 — CSS responsive + mobile UX (3–4h) 🟠

**Objetivo:** Arreglar stacking contexts, scroll padding, keyboard overlap, breakpoints rotos.

**Archivos:**
- `css/quote-flow.source.css` (source)
- Regenerar `css/quote-flow.css` con `npx clean-css-cli` (NUNCA regex Python, per memoria).

**Cambios:**

1. **`.qf-ask-alina` + `.qf-stage` stacking** (L801-810, 832, 3075):
   - Mover `.qf-ask-alina` fuera de `.qf-stage` en el HTML (requiere edición de quote.html también).
   - O cambiar a `position: sticky` en contenedor positionado.

2. **Scroll padding reserve** (L3018-3090):
   ```css
   .qf-stage {
     scroll-padding-bottom: calc(200px + env(safe-area-inset-bottom, 0px));
     padding-bottom: calc(120px + env(safe-area-inset-bottom, 0px));
   }
   ```

3. **Dynamic viewport** — `100vh` → `100dvh` con fallback:
   ```css
   min-height: calc(100vh - 72px);
   min-height: calc(100dvh - 72px);
   ```

4. **Breakpoints 819/820** — Consolidar a uno solo: `max-width: 820px` + `min-width: 821px`.

5. **`@supports` fallback** (L9127 como único) — Agregar bloque para backdrop-filter:
   ```css
   @supports not (backdrop-filter: blur(10px)) {
     .qf-flow-bar, .qf-flow-back, .qf-trust-footer { background: rgba(255,255,255,.95); }
   }
   ```

6. **`prefers-reduced-motion`** — Extender a transitions (L1970-1980, 3037, 3188):
   ```css
   @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```

7. **`font-size: 14px !important` L5421** — Cambiar a `.875rem !important`.

8. **Confetti** — Envolver en `@media (prefers-reduced-motion: no-preference)`.

9. **`.qf-flow-estimate` L2011** — `font-size: .5rem` → `.65rem` (mínimo legibilidad).

10. **Double font fetch** (quote.html:30-31) — Quitar `<link rel="preload">` y mantener sólo stylesheet con `display=swap`. O mover a `onload` pattern.

11. **Avatar preload** (quote.html:32) — Quitar el preload (página renderiza 96px, no 192px).

12. **Z-index scale comment** — Top del archivo CSS:
    ```css
    /* Z-index scale:
     * 0-9:    base content
     * 10-29:  overlays (reveals, accents)
     * 30-49:  fixed UI (flow bar, trust strip)
     * 50-99:  floating CTAs (ask-alina)
     * 100+:   modals / overlays (exit intent)
     * 10000:  debug/devtools only */
    ```
    Auditar los 50+ z-index y mover a la escala.

13. **`display: inline-block` → `inline-flex`** en 16 selectores listados por CSS agent.

14. **`text-overflow: ellipsis`** — Agregar `white-space: nowrap; max-width: 80px;` a `.qf-rail-label`, `.qf-rail-value`, `.qf-rev-col-label`.

15. **End-of-file newline** — Agregar trailing newline.

16. **Re-minificar**:
    ```bash
    npx clean-css-cli -o css/quote-flow.css css/quote-flow.source.css
    ```

**Tests:**
- iPhone SE (375px) real → form no hace scroll horizontal.
- iPhone 14 Pro → CTA no queda bajo teclado al enfocar input.
- Firefox 102 → backdrop-filter fallback OK.
- Sistema con "Reduce motion" → ninguna animación/transición corre.
- Desktop → focus ring visible en los 5 inputs corregidos.

**Cache buster:** `quote-flow.css v28.7 → v29.0`.
**Commit:** `fix(css): stacking contexts, scroll padding, dvh, breakpoints, reduce-motion`
**AYS:** antes de commit.
**Deploy verify:** hard-refresh en `.pages.dev` en iOS Safari real.

---

## OLA 5 — UX/Conversión (2–3h) 🟠

**Objetivo:** Levantar conversion rate ~10-15% con fixes de copy + trust.

**Archivos:**
- `quote.html`
- `js/quote-flow.js`
- `css/quote-flow.source.css` (tweaks menores)

**Cambios:**

1. **Privacy reassurance sobre submit** (quote.html, antes de `#qfContactSubmit`):
   ```html
   <p class="qf-rv-privacy-note">
     <small>🔒 Your information is secure and encrypted. We email your proposal and may call to discuss. <a href="privacy.html">Privacy Policy</a></small>
   </p>
   ```
   CSS: `.qf-rv-privacy-note { font-size: .8rem; color: var(--qf-ink-soft); text-align: center; margin: 8px 0 12px; }`

2. **CTA final copy**:
   - L861: "Send to Alina" → "Request my quote".
   - Emoji conservado como decoración.

3. **Continue buttons direccionales** — Cambiar genéricos:
   - Step 1 (service) → "Next: Your details"
   - Step 2 (info) → "Next: About your space"
   - Step 3 (space) → "Next: Size"
   - etc.
   - Último antes de summary → "Review my request"

4. **"Both services" value prop** (quote.html:273-277):
   ```html
   <span class="qf-service-card-sub">Combined plan often saves 15–20%</span>
   ```

5. **Weekend label** (quote.html:497-502):
   ```html
   <span class="qf-s4-group-label">Weekends <small>(if needed)</small></span>
   ```

6. **Textarea placeholder + label** (quote.html:835):
   ```html
   <label for="qfSpecialInstructions">Anything else we should know? <small>(optional)</small></label>
   <textarea placeholder="e.g., High ceilings, 3 restrooms, open after 6 PM..." ...>
   ```

7. **Progress copy en último paso** (js):
   ```js
   if (currentStep === 'contact') stepEl.textContent = 'Last step';
   ```

8. **Alina voz consistente** — JS: todos los mensajes en primera persona ("I", "I'd recommend") en lugar de mezclar "we".

9. **Didactic errors** — Mensajes con explicación WHY (lista completa de errores en quote-flow.js, cross-check que cada uno tenga el patrón "why + action").

10. **Size > 1M sq ft error** (js L1376-1384):
    ```js
    showSizeErr('For facilities over 1M sq ft, call us at (646) 303-0816 for a custom quote. Or submit this form and we\'ll reach out first.');
    ```

11. **`beforeunload` warning** (js):
    ```js
    window.addEventListener('beforeunload', (e) => {
      if (!['welcome','success'].includes(STATE.currentStepName)) {
        e.preventDefault(); e.returnValue = 'Your quote is saved. You can finish later.';
      }
    });
    ```

**Tests:**
- Flujo completo desktop → comprobar que cada Continue tiene copy específico.
- Landing al summary → privacy note visible SOBRE el botón.
- Cerrar pestaña a medio form → prompt de `beforeunload`.
- Seleccionar "Both Services" → sub-line visible.

**Cache buster:** CSS v29.0 → v29.1, JS v27.1 → v27.2.
**Commit:** `feat(quote,ux): privacy line, directional CTAs, value prop both-service, beforeunload`
**AYS:** antes de commit.

---

## OLA 6 — XSS hardening client (innerHTML → createElement) (2–3h) 🟠

**Objetivo:** Migrar los 6 puntos de `innerHTML` con template-literals a patrón seguro. Prevenir futuros regresos.

**Archivos:**
- `js/quote-flow.js`

**Puntos a migrar** (líneas aprox):
- L548 (`greetingEl.innerHTML`)
- L1116 (generic injection)
- L1626 (`buildPorterRows`)
- L2011 (phone "Add phone" button)
- L2116 (porter data rows)
- L2145 (another row injection)

**Patrón estándar:**
```js
// antes
el.innerHTML = `<span class="x" data-k="${val}">${userInput}</span>`;

// después
const span = document.createElement('span');
span.className = 'x';
span.dataset.k = val;
span.textContent = userInput; // safe
el.replaceChildren(span);
```

**Para `buildPorterRows`**: construir en `DocumentFragment`, luego swap.

**Draft resume** — Explícito: verificar que al cargar de localStorage, cada campo use `textContent` antes del render. Lección memoria (feedback_xss_innerhtml.md).

**Tests:**
- Modificar manualmente `localStorage` con `{userFirstName:"<img src=x onerror=alert(1)>"}` → draft resume no ejecuta script.
- Burbuja de Alina con mensaje injection → texto escapado.
- Pass-through de `normalizePhone("<svg onload=alert(1)>")` → no ejecuta.

**Cache buster:** JS v27.2 → v27.3.
**Commit:** `fix(security): migrate innerHTML to createElement+textContent`
**AYS:** antes de commit.
**Leccion aprendida:** actualizar feedback_xss_innerhtml.md con que quote form está cubierto.

---

## OLA 7 — Backend hardening MEDIUM (2h) 🟡

**Objetivo:** Defense-in-depth, timeouts, error differentiation, logging hygiene.

**Archivos:**
- `functions/api/submit-quote.js`
- `functions/api/_middleware.js`
- `functions/api/crm-leads.js`
- `_headers`

**Cambios:**

1. **`submit-quote.js`** — Agregar al inicio:
   - Method check `if (method !== 'POST') return 405`.
   - Content-Type check `if (!ct.includes('application/json')) return 415`.
   - Body size cap ~50KB.

2. **`_middleware.js:38`** — `fetchWithTimeout(url, opts, 5000)`.

3. **`crm-leads.js:79`** — Cap `page` a `Math.min(page, 1000)`.

4. **`crm-leads.js:105-108` sanitizeSearch** — Extender regex a `[%_\\*;#--]`.

5. **`submit-quote.js:214-216` ref number** — `crypto.randomUUID().split('-').join('').slice(0,12).toUpperCase()`.

6. **`submit-quote.js:517-527` log buckets** — `ts: Math.floor(Date.now()/300000)*300000` (5-min buckets).

7. **`submit-quote.js:306-327` ActiveCampaign tag error handling** — Early return + `integrations.activecampaign = false`.

8. **`submit-quote.js:349-378` HubSpot id check** — Skip deal creation if no contactId.

9. **`_headers`** — Cache-Control HTML: `max-age=86400, stale-while-revalidate=604800` (era 3600).

**Tests:**
- GET a /api/submit-quote → 405.
- POST con text/plain → 415.
- POST con body 100KB → 413.
- `ref` generado tiene formato UUID-based, no colisiona en 1000 submits simulados.

**Cache buster:** ninguno.
**Commit:** `fix(api): defense-in-depth checks, UUID ref, log privacy, cache tuning`
**AYS:** antes de commit.

---

## OLA 8 — A11y MEDIUM + HTML semántica (2h) 🟡

**Objetivo:** Subir Lighthouse A11y a 100.

**Archivos:**
- `quote.html`
- `js/quote-flow.js` (updates de `aria-*` dinámicos)

**Cambios:**

1. **`<fieldset><legend>`** en bloques de info (L306-320), contact edit (L807-822).

2. **`aria-describedby`** en inputs al errar → JS debe agregar/quitar attr junto con mostrar error message.

3. **Progress bar JS** — Actualizar `aria-valuenow` en los 2 progressbars en cada `goNext`/`goBack`.

4. **Placeholder "First name *"** (L306) — Quitar asterisco redundante (aria-label ya dice required).

5. **`role="alert"` live regions** — Asegurar que todos los `.qf-*-err` tengan `role="alert" aria-live="polite"`.

6. **Timeline "what happens next"** (L922) — Envolver en `<ol>`, items en `<li>`.

7. **Confetti container** — Agregar `aria-hidden="true"`.

8. **Honeypot aria-label** (L1001) — Remover, ya está dentro de `aria-hidden`.

9. **Footer doble-hidden** (L975) — Elegir uno (CSS class o attr), documentar.

10. **Skip link** (L162) — Verificar que `:focus-visible` hace el link aparecer con z-index alto.

11. **Newsletter form target=_blank** (L999) — Agregar `rel="noopener noreferrer"`.

12. **Exit form action** (L967) — Verificar action/method o manejar siempre con JS preventDefault.

**Tests:**
- Lighthouse A11y = 100.
- axe DevTools = 0 violations.
- VoiceOver: errores se escuchan al aparecer.
- Progress %age anunciado en cambio de step.

**Cache buster:** si toca JS, bump v27.3 → v27.4.
**Commit:** `fix(a11y): fieldsets, aria-describedby on errors, progressbar updates, semantic lists`
**AYS:** antes de commit.

---

## OLA 9 — Performance MEDIUM (2h) 🟡

**Objetivo:** Reducir TTI ~300ms adicionales.

**Archivos:**
- `quote.html`
- `js/quote-flow.js`
- `_redirects`

**Cambios:**

1. **Lazy-load Google Places** — Mover inline script (L46-125) a `js/google-places-init.js`. Cargar sólo cuando `#qfAddress` recibe `focus`:
   ```js
   const addressInput = document.getElementById('qfAddress');
   if (addressInput) {
     addressInput.addEventListener('focus', () => {
       if (window.qfPlacesLoaded) return;
       window.qfPlacesLoaded = true;
       const s = document.createElement('script');
       s.src = 'https://maps.googleapis.com/maps/api/js?key=...&libraries=places&callback=qfInitPlaces';
       s.async = true; document.head.appendChild(s);
     }, { once: true });
   }
   ```

2. **Disposable email a Set** (ya en Ola 3, confirmar).

3. **Avatar preload** — Ya removido en Ola 4.

4. **Double font fetch** — Ya arreglado en Ola 4.

5. **Favicon consolidation** (quote.html:25-27) — 1 sola línea.

6. **Query-param redirects** (`_redirects:12-15`) — Mantener para SEO pero actualizar links internos directos a `/quote.html?service=X`.

7. **Mailchimp newsletter** (L999) — Agregar `rel="noopener noreferrer"` (también en Ola 8 como a11y).

8. **`.source.css` from public** — Agregar a `.gitignore` no sirve (ya está en git). Agregar a `_headers`:
   ```
   /css/*.source.css
     X-Robots-Tag: noindex
     Cache-Control: private, max-age=0
   ```
   O mejor: excluir del build output vía `_redirects` → 404.

9. **`<nav hidden>`** markup — Condicionar render desde lado server o quitar por completo de quote.html (si nav-mini suficiente).

**Tests:**
- Network tab en quote.html load: Google Places NO carga hasta focus.
- Lighthouse Performance ≥ 90 mobile.
- TTI medido con WebPageTest (o Lighthouse) < 3s en 3G.

**Cache buster:** si toca JS, bump v27.4 → v27.5.
**Commit:** `perf(quote): lazy Google Places, disposable Set, asset cleanup`
**AYS:** antes de commit.

---

## OLA 10 — Code hygiene + decisiones + docs (1–2h) 🟢

**Objetivo:** Cerrar LOW items, actualizar memorias, documentar roadmap de @layer.

**Archivos:**
- `quote.html`
- `js/quote-flow.js`
- `css/quote-flow.source.css`
- `docs/superpowers/plans/` (nuevo plan para @layer migration)
- `~/.claude/projects/-Users-yoelvismercedes/memory/` (actualizar memorias)

**Cambios:**

1. **Remover comentarios muertos** — "meta chips removed" (L284), "hidden per user feedback" (L166 si nav se quita).

2. **Consolidar doble declaración `hidden`** — `class + attr` → uno.

3. **EMAIL_RE shared source** — Crear `functions/api/utils/email-regex.js` y reutilizar en submit-quote, capture-partial. Frontend trae copy con comentario "Must match /api/utils/email-regex.js".

4. **Color tokens** — Migrar 12 colores hardcoded a `--qf-color-*` vars. Definir dark mode pairs.

5. **Unificar `--rv-*` a `--qf-*`** en CSS review section.

6. **`@layer` roadmap** — Crear `docs/superpowers/plans/2026-05-quote-css-layer-migration.md` detallando proceso de 4-8 semanas para eliminar ~1414 `!important`.

7. **Memoria updates:**
   - `feedback_deployment_lessons.md`: actualizar — `maximum-scale=1.0` NO aplica cuando inputs ya están en 1rem. Es trade-off WCAG.
   - `feedback_xss_innerhtml.md`: quote form covered post-Ola 6.
   - `feedback_css_specificity_traps.md`: quote-flow @layer migration en roadmap.
   - `project_quote_form_pending.md` (nuevo): estado post-remediación, pendientes futuros.

8. **Limpiar `.backup-*`** — Tras validar cada ola, mover backups a `.dead-archive/` y commitear.

9. **End-of-file newlines** en los 3 archivos principales.

10. **Re-ejecutar `/ays` full** sobre todo el form → score objetivo ≥ 95.

**Cache buster:** CSS v29.1 → v29.2 si hay cambios CSS.
**Commit:** `chore(quote): docs, memory updates, hygiene, @layer roadmap`
**AYS:** antes de commit.

---

## Verificación post-Ola 10 (smoke test end-to-end)

Lista de verificación manual (no automatizable 100%):

1. **Flujo completo "Janitorial"** — desktop + móvil real → lead creado en CRM.
2. **Flujo completo "Day Porter"** — desktop → lead creado.
3. **Flujo completo "Both"** — desktop → lead creado con ambos sets de días.
4. **Edit desde summary** — cambiar servicio → form se adapta → submit OK.
5. **Draft resume** — cerrar tab a mitad → reabrir → continuar desde paso.
6. **Teclado-only** — todo el flow sin mouse, incluye exit-modal ESC.
7. **VoiceOver/NVDA** — errores anunciados, cambios de paso anunciados.
8. **Lighthouse** — A11y=100, Perf≥90 mobile, SEO=100, BP≥95.
9. **Cross-origin attempt** — `curl -H "Origin: https://evil-foo.pages.dev"` → canonical.
10. **Rate-limit stress** — 11 submits/hr desde misma IP → 11ava rechazada.
11. **Spam email `asdf@mail.tm`** — soft warn, no hard block.
12. **Typo `user@gmai.com`** → toast sugiere gmail.com.
13. **Privacy link** visible sobre el submit CTA en summary.
14. **Back button del browser** — state preservado.
15. **Refresh mid-flow** — state preservado si draft no expirado.

---

## Riesgos y contingencias

- **Riesgo:** CSS Ola 4 introduce regresión visual no detectada en desktop. **Mitigación:** visual diff con screenshots pre/post (tool: `preview_screenshot`).
- **Riesgo:** `defer` en JS causa race con inline scripts. **Mitigación:** probar con script tags reordenados.
- **Riesgo:** Turnstile retry logic crea double-submit. **Mitigación:** cooldown logic de Ola 3 + idempotency server.
- **Riesgo:** Allowlist CORS rompe preview deploys. **Mitigación:** `ALLOWED_PREVIEW_ORIGIN` env var debe estar seteada antes del deploy de Ola 1.
- **Riesgo:** `/ays` score baja tras cambios. **Mitigación:** ejecutar `/ays` tras cada ola, no sólo antes del commit.

---

## Timeline sugerido

| Día | Olas | Horas |
|-----|------|-------|
| 1 | D1-D3 decisiones + Ola 1 | 3h |
| 2 | Ola 2 + Ola 3 (parte 1) | 4h |
| 3 | Ola 3 (parte 2) + Ola 4 | 5h |
| 4 | Ola 5 + Ola 6 | 5h |
| 5 | Ola 7 + Ola 8 | 4h |
| 6 | Ola 9 + Ola 10 | 4h |
| 7 | Smoke test + deploy prod + monitor | 3h |

**Total: ~28h distribuidas en 7 días laborales.**

---

## Decisiones arquitectónicas (al cierre del plan)

Tras completar las 10 olas, revisar estas 3 decisiones antes de cerrar la remediación:

### D1. `maximum-scale=1.0` en viewport meta
- **Memoria (feedback_deployment_lessons.md)** dice: agregar para evitar zoom en iOS al enfocar inputs.
- **WCAG 1.4.4 (Reflow)** dice: NO lo agregues, bloquea pinch-zoom para baja visión.
- **Recomendación:** NO agregar. Los inputs ya están en `font-size:1rem` (16px), así que iOS no hace auto-zoom. La memoria es de antes de ese fix.
- **Acción:** Actualizar memoria para reflejar que es redundante.

### D2. Migración completa a `@layer` (retirar ~1414 `!important`)
- **Costo:** 3–5 días dedicados de refactor (o ~2 meses a 40/semana).
- **Beneficio:** Código mantenible, bundle potencialmente más pequeño tras purgar.
- **Recomendación:** Plan separado post-remediación. Durante la remediación: prohibir agregar nuevos `!important`.
- **Acción:** Ola 10 deja el roadmap escrito.

### D3. Critical-CSS inline + defer del resto
- **Costo:** ~4h setup + pipeline de extracción (`critical` npm package).
- **Beneficio:** LCP −800ms en mobile 3G.
- **Riesgo:** FOUC si la extracción marra; complejidad en build.
- **Recomendación:** Sprint separado. En esta remediación sólo agregamos `defer` al JS (Ola 2).

---

## Items DEFERIDOS (fuera de este plan)

Para sprint post-Ola 10:
- Critical-CSS extraction (D3 anterior)
- `@layer` migration completa (D2 anterior → plan separado de 4–8 semanas)
- Source-map security hardening
- Idempotency keys backend (UUID submission ID)
- Service Worker para offline support
- A/B test framework para CTA copy
- Migración Google Places a `PlaceAutocompleteElement`
