# Plan: CSS `@layer` Migration — Quote Flow

**Fecha:** 2026-04-22
**Archivo base:** `css/quote-flow.source.css` (~11880 líneas)
**Estado actual:** Stage 1 declared en la cabecera (`@layer reset, tokens, base, components, variants, overrides, utilities`); ~1414 declaraciones `!important` dispersas
**Objetivo:** Eliminar todos los `!important` marker por uno, sustituyéndolos con la jerarquía de capas
**Estimación:** 4–8 semanas a ~30 min/día (o 1 semana dedicada)

---

## Por qué

El stylesheet acumuló `!important` porque reglas genéricas (`main.q-flow > *`, `body:has(...) .nav`) ganan por especificidad sobre reglas de componente. Cada nuevo componente tiene que agregar `!important` para defenderse, propagando el problema.

`@layer` invierte la regla: cuando dos capas colisionan, **la capa declarada más tarde gana independientemente de la especificidad**. Un `.qf-button` en `components` gana sobre un `main.q-flow > *` en `base` sin necesidad de `!important`. Si agregas una variante en `variants` o un override puntual en `overrides`, escalan limpiamente.

No es deuda técnica "bonita" — son regresiones visuales esperando la próxima edición. Cada `!important` es una bomba que puede invertir el cascade cuando alguien agregue un selector más específico sin saberlo.

---

## Soporte de navegador

`@layer` tiene soporte 94%+ (Chrome/Edge/FF/Safari todos desde principios de 2022). Navegadores antiguos IGNORAN `@layer` — las reglas dentro siguen aplicando como si la capa no existiera. Por eso la migración es no-breaking: hasta que retires el último `!important`, los navegadores viejos siguen respetando los marcadores.

---

## Cómo (3 stages)

### Stage 2 — Sweep incremental (4–6 semanas)

Recorrer el archivo de arriba abajo en bloques de ~200 líneas por sesión. Para cada bloque:

1. Identificar el tipo de cada regla:
   - Token (CSS var, `@property`, reset) → capa `tokens` o `reset`
   - Base (selector simple, sin `!important` necesario hoy) → capa `base`
   - Componente (`.qf-button`, `.qf-card`, etc.) → capa `components`
   - Variante (`.qf-button.is-active`, `[data-service="..."]`) → capa `variants`
   - Override (rule con `!important`, cross-cutting) → capa `overrides`
   - Utility (`.sr-only`, `.no-scroll`) → capa `utilities`

2. Envolver bloques del mismo tipo:
   ```css
   @layer components {
     .qf-button { /* ... */ }
     .qf-card { /* ... */ }
   }
   ```
   (El navegador no crea duplicados si repites el nombre — las declaraciones se agregan a la capa existente.)

3. Si una regla tiene `!important` Y no hay otra regla que la esté sobrescribiendo, candidata a quitarle `!important` después de la envoltura. Pero **no lo quites aún en Stage 2** — lo hacemos en Stage 3 cuando el grafo está completo.

4. Tras cada bloque: `npx clean-css-cli` + hard refresh `.pages.dev` + compare visual diff con screenshots pre/post.

**Progreso medible:** % de reglas en capas (apunto 100% al final), y número de `!important` marcadores (apunto -100 por sesión).

### Stage 3 — Purga de `!important` (1–2 semanas)

Una vez todo envuelto:

1. Para cada `!important` restante, intentar removerlo + re-minificar + verificar visual.
2. Si no hay regresión → deja removido.
3. Si hay regresión → probablemente hay una regla en una capa anterior ganando; mover la regla al layer `overrides` o aumentar la especificidad en su propia capa.
4. Target: 0 `!important` restantes. Aceptable: <50 sin removerlos si son cross-cutting críticos.

### Stage 4 — Cache-bust estructural

Cuando la migración completa: bumpear la versión con un salto mayor (`v29.2 → v30.0`). Señaliza a Cloudflare edge + browser caches que pueden reemplazar el archivo completo sin intentar mergear chunks.

---

## Smoke tests por sesión

Después de cada 200 líneas migradas:

1. Load `.pages.dev/quote.html` en desktop + móvil real
2. Completar flujo janitorial completo → submit
3. Completar flujo `both` → edit desde summary → re-submit
4. Modo dark (`prefers-color-scheme: dark`) visible correcto
5. Modo reduce-motion activo → no animaciones
6. Lighthouse A11y + Performance no bajan

Si alguna falla, rollback al último commit verde + diagnosticar.

---

## Riesgos

- **Mismatches** entre `.source.css` y `.css` minificado si se edita uno pero no el otro. Regla: `clean-css-cli` después de cada sesión, siempre.
- **Especificidad silenciosa**: una regla en `components` puede ser sobrescrita por otra en `components` declarada después. Mismo layer → la tradicional cascade aplica. Vigilar el orden.
- **`@layer` dentro de `@media`**: válido pero frágil si se anida mal. Preferir `@media` dentro de la capa, no al revés.
- **Navegadores viejos**: si alguien reporta Safari 14 o Firefox 97, fallback es "ignorar @layer" y todo sigue funcionando por `!important` durante Stage 2. En Stage 3 pierden el cascade ordering. Documentar.

---

## Dueño

Este roadmap NO es parte de la remediación de 10 olas (Ola 10 sólo documenta). Cuando se arranque, crear rama `refactor/quote-css-layers` y proceder stage por stage.
