# Floating Quote CTA — Right-Side, Hero-Aware Reveal

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hacer que el botón flotante "Free Quote" aparezca en el lado derecho (mobile + desktop) solo cuando las CTAs del hero (`.hero-actions`) salen del viewport, evitando colisión con el botón back-to-top y el chat widget.

**Architecture:** Cambiar el trigger de `scrollY > 100` a un `IntersectionObserver` que observa `.hero-actions`. Cuando el contenedor de CTAs del hero deja de intersectar con el viewport → mostrar `.cta-float`. Ajustar posicionamiento en CSS para apilar verticalmente con `.btt` en el lado derecho (evitar overlap).

**Tech Stack:** HTML + CSS (archivo minificado `css/styles.css`, editado in-place + re-minificado con `npx clean-css-cli`) + Vanilla JS (`js/main.js`). Preview server en puerto 8080.

---

## Contexto del estado actual

**HTML — [index.html:551](../../../index.html):**
```html
<a href="quote.html" class="cta-float" aria-label="Get a free quote">
  <svg ...></svg> Free Quote
</a>
```
El botón solo existe en `index.html` (las otras páginas no lo tienen).

**CSS — [css/styles.css](../../../css/styles.css) (minificado, 1 línea):**
```css
.cta-float{position:fixed;bottom:2rem;right:2rem;z-index:89;display:none;...}
.cta-float.visible{display:inline-flex;animation:ctaFadeIn .5s ...}
@media (max-width:480px){.cta-float{bottom:1.5rem;right:1rem;...}}
```
El botón ya está del lado derecho. Problema: colisiona con `.btt` en desktop.

**`.btt` (back-to-top):**
- Desktop: `bottom: 2rem; right: 2rem` — **mismo lugar que `.cta-float`**
- Mobile: `bottom: 5.5rem; right: 1rem` — ya está arriba del CTA

**JS — [js/main.js:393-416](../../../js/main.js):**
```js
function onScroll() {
  if (window.scrollY > 100) { show(); ... }
}
```
Aparece muy pronto (100px de scroll), no espera al hero.

**Hero CTAs — [index.html:157-160](../../../index.html):**
```html
<div class="hero-actions">
  <a href="quote.html" class="btn btn-white">Get Your Free Proposal →</a>
  <a href="#how-it-works" class="btn btn-ol">See How It Works</a>
</div>
```
Este es el contenedor que hay que observar.

**Convenciones del proyecto (de CLAUDE.md):**
- CSS se edita in-place; re-minificar con `npx clean-css-cli`
- Cache busters (`?v=X.Y`) deben bumpear en el mismo commit que CSS/JS
- Zero inline styles
- Verificar en preview server antes de push

---

## File Structure

**Modificar:**
- `js/main.js` — reemplazar `initFloatingQuoteReveal()` (líneas 393-416) con versión basada en `IntersectionObserver`
- `css/styles.css` — ajustar posición vertical de `.cta-float` en desktop para no colisionar con `.btt`
- `index.html:31` — bumpear cache buster de styles.css
- `index.html:547` — bumpear cache buster de main.js

**No crear archivos nuevos.** Todo el trabajo vive en archivos existentes.

---

## Task 1: Reemplazar el trigger del CTA (scroll → IntersectionObserver)

**Files:**
- Modify: `js/main.js:390-416`

- [ ] **Step 1: Leer el bloque actual para confirmar las líneas exactas**

Run: abrir `js/main.js` en el rango 390-420 y confirmar que el bloque es el `initFloatingQuoteReveal` IIFE.

- [ ] **Step 2: Reemplazar el IIFE completo con la versión basada en IntersectionObserver**

Reemplazar `js/main.js:390-416` con:

```js
/* ============================================================
   FLOATING QUOTE — visible solo cuando .hero-actions sale del viewport
   ============================================================ */
(function initFloatingQuoteReveal() {
  var fq = document.querySelector('.cta-float');
  if (!fq) return;

  var hero = document.querySelector('.hero-actions');

  function show() { fq.classList.add('visible'); }
  function hide() { fq.classList.remove('visible'); }

  // Fallback: si la página no tiene .hero-actions (otras pages), usar scroll > 400
  if (!hero) {
    function onScrollFallback() {
      if (window.scrollY > 400) {
        show();
      } else {
        hide();
      }
    }
    window.addEventListener('scroll', onScrollFallback, { passive: true });
    onScrollFallback();
    return;
  }

  // IntersectionObserver: cuando .hero-actions NO intersecta (sale del viewport) → show
  if (!('IntersectionObserver' in window)) {
    // Fallback navegadores antiguos: mostrar siempre después de 2s
    setTimeout(show, 2000);
    return;
  }

  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        hide();
      } else {
        show();
      }
    });
  }, {
    // rootMargin negativo arriba = el hero se considera "fuera" antes de salir totalmente
    rootMargin: '0px 0px -20% 0px',
    threshold: 0
  });

  io.observe(hero);
})();
```

**Por qué este approach:**
- `IntersectionObserver` es más performante que escuchar scroll (browser optimiza off-main-thread)
- `rootMargin: '0px 0px -20% 0px'` hace que el CTA aparezca cuando `.hero-actions` está 20% fuera del viewport (UX más suave — no espera al último pixel)
- Si el usuario vuelve al top → oculta el botón (comportamiento coherente)
- Fallback para otras páginas (sin `.hero-actions`) usa scroll > 400px
- Fallback para navegadores sin IntersectionObserver: mostrar tras 2s

- [ ] **Step 3: Verificar sintaxis JS sin errores**

Run:
```bash
cd "/Users/yoelvismercedes/Downloads/Ecco Webside" && node -c js/main.js
```
Expected: sin output (OK). Si hay error de sintaxis, corregir.

---

## Task 2: Apilar `.cta-float` arriba de `.btt` en desktop (fix colisión)

**Files:**
- Modify: `css/styles.css` (archivo minificado, 1 línea)

**Problema:** En desktop ambos están en `bottom: 2rem; right: 2rem`. En mobile `.btt` ya está en `bottom: 5.5rem` así que no choca.

**Solución:** Subir `.cta-float` en desktop a `bottom: 5.5rem` para que el back-to-top (`bottom: 2rem`) quede debajo. En mobile mantener `bottom: 1.5rem` (el btt ya está arriba).

- [ ] **Step 1: Localizar la regla minificada `.cta-float{position:fixed;bottom:2rem;right:2rem;...}`**

Run:
```bash
cd "/Users/yoelvismercedes/Downloads/Ecco Webside" && grep -o '\.cta-float{position:fixed[^}]*}' css/styles.css
```
Expected output: `.cta-float{position:fixed;bottom:2rem;right:2rem;z-index:89;display:none;align-items:center;...}`

- [ ] **Step 2: Reemplazar `bottom:2rem` por `bottom:5.5rem` en la regla base (NO la del media query móvil)**

Use Edit tool con:
- `old_string`: `.cta-float{position:fixed;bottom:2rem;right:2rem;z-index:89;display:none`
- `new_string`: `.cta-float{position:fixed;bottom:5.5rem;right:2rem;z-index:89;display:none`

**Crítico:** La búsqueda debe matchear solo la regla desktop, no el override mobile (`.cta-float{bottom:1.5rem;right:1rem;...}` dentro del `@media (max-width:480px)`).

- [ ] **Step 3: Verificar que el media query móvil sigue intacto**

Run:
```bash
grep -o '@media (max-width:480px){[^}]*\.cta-float[^}]*}' css/styles.css | head -1
```
Expected: debe contener `.cta-float{bottom:1.5rem;right:1rem;...}` SIN cambios.

- [ ] **Step 4: Verificar tamaño del archivo (no crecer mucho)**

Run: `ls -la css/styles.css`
Expected: ~169KB, cambio de unos pocos bytes (5.5rem vs 2rem).

---

## Task 3: Bumpear cache busters en index.html

**Files:**
- Modify: `index.html:31` (CSS)
- Modify: `index.html:547` (JS)

- [ ] **Step 1: Bumpear CSS cache buster**

Edit `index.html:31`:
- `old_string`: `<link rel="stylesheet" href="css/styles.css?v=14.4">`
- `new_string`: `<link rel="stylesheet" href="css/styles.css?v=14.5">`

- [ ] **Step 2: Bumpear JS cache buster**

Edit `index.html:547`:
- `old_string`: `<script src="js/main.js?v=4.4"></script>`
- `new_string`: `<script src="js/main.js?v=4.5"></script>`

- [ ] **Step 3: Verificar que ambos cambios están presentes**

Run:
```bash
grep -n "styles.css?v=\|main.js?v=" index.html
```
Expected:
```
31:<link rel="stylesheet" href="css/styles.css?v=14.5">
547:<script src="js/main.js?v=4.5"></script>
```

---

## Task 4: Verificar en preview server (mobile + desktop)

**Files:** ninguno — verificación visual.

- [ ] **Step 1: Iniciar preview server**

Usar `preview_start` apuntando a `/Users/yoelvismercedes/Downloads/Ecco Webside` en puerto 8080 (ya configurado en `.claude/launch.json`).

- [ ] **Step 2: Desktop — cargar index.html y verificar que el CTA NO está visible al cargar**

- `preview_snapshot` del viewport en el top de la página
- Expected: NO debe aparecer `.cta-float` con clase `.visible`. Las CTAs del hero (`Get Your Free Proposal` y `See How It Works`) están visibles.

- [ ] **Step 3: Desktop — scroll pasado el hero**

- `preview_eval`: `window.scrollTo(0, window.innerHeight)` (scroll 1 viewport)
- Esperar 300ms
- `preview_snapshot`
- Expected: el botón flotante "Free Quote" aparece abajo-derecha, por encima del botón back-to-top.

- [ ] **Step 4: Desktop — verificar que no colisiona con `.btt`**

- `preview_inspect` del `.cta-float`: leer `bottom` computed style
- Expected: `88px` (= 5.5rem)
- `preview_inspect` del `.btt`: leer `bottom`
- Expected: `32px` (= 2rem)
- Diferencia ~56px: no overlap.

- [ ] **Step 5: Desktop — scroll al top, verificar que el CTA se oculta**

- `preview_eval`: `window.scrollTo(0, 0)`
- Esperar 300ms
- `preview_snapshot`
- Expected: el CTA flotante ya no es visible.

- [ ] **Step 6: Mobile — resize a 390x844 (iPhone 12)**

- `preview_resize`: 390x844
- `preview_eval`: `window.scrollTo(0, 0)`
- `preview_snapshot`
- Expected: CTA no visible.

- [ ] **Step 7: Mobile — scroll pasado el hero**

- `preview_eval`: `window.scrollTo(0, window.innerHeight)`
- Esperar 300ms
- `preview_snapshot`
- Expected: CTA aparece abajo-derecha en mobile, debajo del `.btt` (que está en `bottom: 5.5rem`).

- [ ] **Step 8: Verificar sin errores en consola**

- `preview_console_logs`
- Expected: sin errores de JS relacionados con el CTA.

- [ ] **Step 9: Screenshot de proof**

- `preview_screenshot` desktop después del scroll (mostrar que el CTA aparece donde debe)
- `preview_screenshot` mobile después del scroll

---

## Task 5: Ejecutar /ays antes del commit

**Files:** ninguno — verificación.

- [ ] **Step 1: Correr /ays**

Invocar skill `/ays` — ejecuta el audit de 12 fases y reporta score 0-100.
Expected: score ≥ 85, sin issues críticos. Si hay issues, entrar en plan mode para arreglarlos.

- [ ] **Step 2: Si /ays encuentra problemas**

Arreglarlos antes de seguir. NO hacer commit con score < 85.

---

## Task 6: Commit

**Files:** ninguno — operación git.

- [ ] **Step 1: Revisar cambios**

Run:
```bash
cd "/Users/yoelvismercedes/Downloads/Ecco Webside" && git status && git diff --stat
```
Expected: 3 archivos modificados — `js/main.js`, `css/styles.css`, `index.html`.

- [ ] **Step 2: Stage y commit**

Run:
```bash
git add js/main.js css/styles.css index.html
git commit -m "$(cat <<'EOF'
feat(cta): floating quote button appears only when hero CTAs leave viewport

Replace scrollY > 100 trigger with IntersectionObserver on .hero-actions
so the floating "Free Quote" button stays hidden while the hero's primary
CTAs are still visible — cleaner UX, no duplicated CTAs on screen.

Fix desktop collision with .btt (back-to-top): raise .cta-float to
bottom: 5.5rem so they stack cleanly instead of overlapping at 2rem.

Bump cache busters: styles.css v14.4 → v14.5, main.js v4.4 → v4.5.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: Verificar commit**

Run: `git log -1 --oneline`
Expected: un commit con el mensaje arriba.

- [ ] **Step 4: Push (pedir confirmación al user primero)**

⚠️ No hacer push sin confirmación explícita del usuario — eccofacilities.com se auto-deploya desde GitHub.

Después del push:
- Esperar ~2min el deploy de Cloudflare Pages
- Hard-refresh `https://eccofacilities.com`
- Verificar en dispositivo real (user) que el CTA aparece solo al scrollear pasado el hero

---

## Self-Review (ya ejecutado)

**1. Spec coverage:**
- ✅ Lado derecho mobile + desktop → ya está en CSS, plan confirma
- ✅ Aparece al salir del hero → Task 1 (IntersectionObserver)
- ✅ Evita duplicar CTAs visibles → trigger basado en `.hero-actions`
- ✅ No colisiona con otros elementos → Task 2 (stacking vertical)

**2. Placeholder scan:** ninguno — todos los pasos tienen código o comandos exactos.

**3. Type consistency:** nombres consistentes (`.cta-float`, `.hero-actions`, `.btt`, `.visible`) a lo largo de todas las tareas.

---

## Notas adicionales

**¿Por qué IntersectionObserver y no scroll listener?**
- Mejor performance (browser corre callbacks off-main-thread)
- Maneja correctamente resize, orientation change y scroll hacia arriba
- API más declarativa

**¿Por qué `bottom: 5.5rem` en desktop y no usar `flex-direction: column`?**
- Los elementos son independientes (`.btt` en HTML header, `.cta-float` al final). No comparten contenedor.
- El proyecto usa posicionamiento fijo individual — mantener el patrón.

**¿Por qué NO animar con `opacity` en vez de `display`?**
- La regla existente usa `display: none → inline-flex`. Cambiar a opacity requeriría que el elemento siempre ocupe espacio (capturando clics fantasma). Mantener el patrón existente.

**Riesgo: el resto de páginas.**
- `.cta-float` solo existe en `index.html`. Otras páginas (about, services, etc.) no tienen el botón flotante. El fallback en el JS (`if (!hero)`) maneja ese caso por si se agrega el CTA a otras páginas en el futuro.
