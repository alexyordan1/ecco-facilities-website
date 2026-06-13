# Design System — eccofacilities.com

> Documenta el sistema de diseño **del sitio completo** (no solo del quote form). Reescrito 2026-06-12 al cerrar la Fase 1 de estandarización. Las cifras de contraste son **computadas y verificadas**, no estimadas. Para el porqué de cada decisión ver la sección "Decisiones" al final y `PRODUCT.md`.

## Arquitectura de estilos

Tres hojas de estilo cargan en cascada (en este orden):

1. **`css/styles.css`** — sistema principal. Empieza con `@layer reset,tokens,base,components,variants,overrides,utilities;` y el `:root` de tokens. La mayoría de reglas viven **sin capa** (unlayered), por lo que **ganan** sobre cualquier regla en `@layer`. El bloque `@media (prefers-color-scheme:dark)` está al final, sin capa.
2. **`css/components.css`** — primitivas compartidas (`.btn`, `.card`, `.nav`, `.footer`, `.cert-badge`, `.testimonial`…) dentro de `@layer components`. Lo cargan 21 páginas DESPUÉS de styles.css. Como está en `@layer`, **pierde** ante las reglas unlayered de styles.css cuando ambas definen el mismo selector. Tiene su propio `@media dark` al final para los selectores que styles.css no cubre (`.card`, `.badge-green`).
3. **`css/quote-flow.css`** — SOLO `quote.html`. Sistema legacy `qf2-*` del formulario, con su propio dark. Pendiente de migrar al sistema del sitio en la Fase 5 (ver Deuda conocida).

> **Regla de oro de la cascada (lección 2026-06-12):** styles.css unlayered gana sobre components.css @layer. Verificar SIEMPRE en navegador qué regla gana antes de "arreglar" un selector — razonar sobre un archivo en aislamiento lleva a falsos positivos.

## Dirección visual

**Híbrido editorial: navy + crema cálido, sage como única voz.** Las secciones de contenido viven sobre crema cálido (`#FAF7F2` fondo, `#F5F1EA` secciones) con tinta navy. Los heroes y banners CTA son navy oscuro (`#0B1D38`) con titulares Cormorant en **marfil** (`#F5F1E6`, no blanco puro). Sage (`#2D7A32`) es el único color saturado: acciones, acentos, links, focus. El azul fue eliminado (Fase 1 C3).

**Estrategia de color:** Restrained-to-Committed. Sage ocupa ~10-20% de cualquier pantalla (CTAs + estados activos + links + barra de progreso). Crema domina la superficie; el blanco es la tarjeta.

**Excepción documentada:** el rotador del hero del homepage usa 6 colores por palabra (`--topic-health/team/people/planet/future/budget`) — decisión explícita de Alex (2026-06-12), scoped SOLO al rotador, no contradice el sage-único.

## Tema claro/oscuro

**Dark mode AUTOMÁTICO vía `prefers-color-scheme`, en TODO el sitio, sin botón.** (Decisión de Alex 2026-06-12: "quiero dark en todo el sitio y que funcione automatico no quiero nada de boton".) Anula la nota vieja de este doc sobre un toggle opt-in con `[data-theme=dark]` / `localStorage ecco_theme` — ese mecanismo fue retirado.

Editorial Midnight mantiene el registro editorial: superficie `#1B2733` (teal-navy cálido, NO azul clínico), tinta `#EFE8D7` (marfil tostado, NO blanco puro), sage sube a `#6FB376`. Los heroes/footer/cookie navy son **continuidad** (ya son oscuros, no cambian). Cada página incluye `<meta name="theme-color">` dual y `color-scheme:light dark`.

### Tokens de rol dual (clave del dark)

Tres tokens existen para dividir roles que un solo token no puede voltear:

| Token | Rol | Claro | Dark |
|---|---|---|---|
| `--color-surface-card` | fondo de tarjetas/secciones blancas | `#FFF` | `#243441` |
| `--color-white` | texto blanco sobre navy | `#FFF` | `#FFF` (no cambia) |
| `--color-heading` | color de titulares | `#0B1D38` | `#EFE8D7` |
| `--color-navy` | fondo de superficies navy | `#0B1D38` | `#0B1D38` (no cambia) |
| `--color-accent-text` | sage como texto/acento | `#2D7A32` | `#6FB376` |

`background:var(--color-white)` se migró a `var(--color-surface-card)` y `color:var(--color-navy)` a `var(--color-heading)` (~139 reescrituras, valor idéntico en claro). Inline styles con estos valores también se migraron (no se pueden voltear con media query).

## Paleta de color — tokens reales (`css/styles.css :root`)

```css
/* Navy / ink */
--color-navy:#0B1D38; --color-navy-light:#15294D; --color-navy-x-light:#1E3562;
/* Sage (único acento; --color-blue/-light son ALIAS de sage tras la muerte del azul) */
--color-green:#2D7A32; --color-green-light:#3D9A43;
--color-green-bg:rgba(45,122,50,.07); --color-green-border:rgba(45,122,50,.18);
--color-blue:#2D7A32; --color-blue-light:#2D7A32; /* alias legacy → sage */
--color-accent-text:#2D7A32;
/* Superficies */
--color-bg:#FAF7F2; --color-cream:#F5F1EA; --color-white:#FFF; --color-surface-card:#FFF; --color-marfil:#F5F1E6;
/* Texto */
--color-heading:#0B1D38; --color-text-dark:#1A1E2C; --color-text-body:#495568;
--color-text-muted:#4F5C6E; --color-text-light:#4F5C6E; /* muted y light unificados */
--color-text-safe:#CBD6E1; --color-text-white-muted:#C8D5E2; /* sobre navy */
/* Estado */
--color-red:#B23B3B;
/* Bordes */
--color-border:#DFE4EC; --color-border-subtle:#EDF0F5;
--color-border-dark:rgba(255,255,255,.08); --color-border-dark-light:rgba(255,255,255,.12);
```

### Override dark (`@media (prefers-color-scheme:dark) :root`)

```css
--color-bg:#1B2733; --color-cream:#243441; --color-surface-card:#243441;
--color-heading:#EFE8D7; --color-text-dark:#EFE8D7; --color-text-body:#C9C0AE;
--color-text-muted:#9BA8B8; --color-text-light:#9BA8B8;
--color-accent-text:#6FB376; --color-blue:#6FB376; --color-blue-light:#6FB376;
--color-border:rgba(111,179,118,.22); --color-border-subtle:rgba(255,255,255,.08);
/* texto sobre sage en dark: #0F1A20 (hardcoded en parches de componente) */
```

### Contraste — VERIFICADO (computado 2026-06-12)

**Claro** (umbral AA 4.5:1 texto, 3:1 grande/no-texto):
| Par | Ratio | |
|---|---|---|
| texto principal #1A1E2C / bg #FAF7F2 | 15.52 | AAA |
| texto body #495568 / bg | 7.06 | AAA |
| muted #4F5C6E / cream #F5F1EA | 6.04 | AA |
| sage #2D7A32 / bg | 4.99 | AA |
| sage / cream | 4.73 | AA |
| error #B23B3B / cream | 5.21 | AA |
| marfil #F5F1E6 / navy #0B1D38 | 14.92 | AAA |
| blanco / sage #2D7A32 | 5.33 | AA |

**Dark** (sobre bg #1B2733 / card #243441):
| Par | Ratio | |
|---|---|---|
| ink #EFE8D7 / bg | 12.42 | AAA |
| ink / card | 10.47 | AAA |
| body #C9C0AE / bg | 8.40 | AAA |
| body / card | 7.08 | AAA |
| muted #9BA8B8 / bg | 6.27 | AA |
| muted / card | 5.29 | AA |
| sage #6FB376 / bg | 6.06 | AA |
| sage / card | 5.11 | AA |
| texto #0F1A20 / sage #6FB376 | 7.05 | AAA |

## Tipografía

```css
--font-display:'Fraunces','Cormorant Garamond',Georgia,serif; /* ver Deuda: Fraunces aún primero */
--font-body:'DM Sans',system-ui,sans-serif;
```

En las páginas de marketing solo se carga **Cormorant Garamond** (Fraunces no se carga → cae a Cormorant). El quote form sí carga Fraunces. Las itálicas son **sintéticas** en marketing (decisión de Alex: no cargar ejes itálicos reales, C7a descartado). DM Sans para cuerpo, UI, botones, eyebrows.

### Escala de titulares — 3 niveles (Fase 1 C7b)

| Nivel | Uso | Tamaño | Peso |
|---|---|---|---|
| Sección | `.sec-ttl`, `.svc-ttl`, `.story-sec h2`, `.form-head h2`, `.eco-content h2`, `.service-detail-head h2` | `clamp(2.2rem,4vw,3.2rem)` | 600 |
| Bloque | `.cta-banner h2`, `.message-sec h2`, `.guarantee-ttl`, `.article-content h2` | `clamp(1.7rem,2.8vw,2.3rem)` | 600 |
| Tarjeta | `.legal-section h2`, `.promise-ttl` | `1.4rem` | 600 |

Los heroes (`.hero h1`, `.hero-v2 .hero-ttl-*`, D155) tienen su propia escala, intactos. Familia display Cormorant en todos. Eyebrows: DM Sans uppercase 700, tracking 0.14em.

## Elevación (Fase 1 C8)

**4 sombras + par sage + 3 radios.** 43 recetas hard-coded se mapearon a estos tokens; 41 radios a 3 valores.

```css
--shadow-sm:0 2px 8px rgba(11,29,56,.06);   /* chips, inputs */
--shadow-md:0 4px 20px rgba(11,29,56,.08);  /* cards */
--shadow-lg:0 8px 32px rgba(11,29,56,.12);  /* hover, popovers */
--shadow-xl:0 20px 60px rgba(11,29,56,.16); /* modales, heroes */
--shadow-sage:0 10px 28px rgba(45,122,50,.3);        /* CTA reposo */
--shadow-sage-hover:0 14px 32px -8px rgba(45,122,50,.55); /* CTA hover */
--radius:12px; --radius-lg:18px; --radius-pill:999px;
```

Exentos del sistema: focus rings (accesibilidad), el pulso del rotador, el cajón direccional del nav, los insets a medida del hero D155, hairlines 2-3px, círculos 50%.

## Motion

- Transiciones con `--ease` / `--ease-out`; spring (`--ease-spring`) SOLO en hover lifts (overshoot leve), nunca en propiedades de layout.
- Sin bounce, sin elastic, sin parallax pesado. Reveals con IntersectionObserver (`.rv`), nunca sobre contenido que deba verse on-load.
- `prefers-reduced-motion`: kill-switch global + el rotador se pausa (también con pestaña oculta / hero fuera de viewport).

## Iconografía

- Marketing: SVG single-stroke 1.5-2px, sage `currentColor`, viewBox 24.
- Quote form: aún usa emojis de sistema en las tarjetas (migración a SVG pendiente, Fase 5).
- Outline only, sin dual-tone.

## Anti-patrones (no usar)

- **Franjas laterales** (`border-left:4px solid` como acento). Usar bordes completos o tintes de fondo. (DEUDA: `.pain-card` de why-ecco aún lo usa — F4.)
- **Texto con gradiente.** Color sólido siempre.
- **Glassmorphism decorativo.** El nav usa backdrop-filter intencionalmente; nada más.
- **Hero-metric template** (números grandes 200+/12+/0). La fila hero-metrics se elimina en F4.
- **Grids de tarjetas idénticas** como lista de features.
- **Em dashes** en copy. Comas, puntos, dos puntos.
- **Title Case.** Sentence case siempre.

## Deuda conocida (no unificado aún)

- **Rojos de error.** `.v-hint.bad` está declarado DOS veces con rojos distintos (`#ff6b6b` y `#e84c3d`), `.v-err`/`.v-msg`/`.day-count.need` usan `#ff6b6b` — todos fallan AA en claro. PERO **solo se renderizan en las páginas legacy** `quote-janitorial`/`quote-dayporter` (se borran en F7), así que NO se unifican ahora (sería pulir código muerto). El único rojo de error VIVO es `.footer-nl-status.is-err` `#ffb4b4` sobre el footer navy = 9.97:1 (AAA, ambos modos) — correcto. El token `--color-red:#B23B3B` no se voltea en dark (2.18:1 sobre card) pero su único consumidor es el borde de `.pain-card` (anti-patrón border-left, se rehace en F4). Cuando los formularios reales (careers, quote V2) se rehagan, usar `--color-red` + variante dark `#EB8C8C` (5.27:1).
- **Fuente display.** `--font-display` aún lista `'Fraunces'` primero; debe quedar `'Cormorant Garamond'` primera cuando el quote form migre (F5).
- **Quote form.** `quote.html` sigue en el sistema `qf2-*` (`quote-flow.css`) con Fraunces, emojis y su propio dark. Migración al sistema del sitio = Fase 5.
- **Píldora Alina** tapa el botón Accept del cookie banner en móvil (375px). = Fase 2 (chrome).
- **Páginas legacy** `quote-janitorial.html`/`quote-dayporter.html` (301-redirected pero desplegadas) — se borran en Fase 7.

## Deploy / caché

- Cache-busting por `?v=` en el MISMO commit que el asset. Minificar CSS SOLO con `bunx clean-css-cli` (verificar que no pierda la 1ª línea `@layer…;:root{}`); NUNCA perl/regex sobre CSS minificado.
- `_headers`: `/css/*` y `/js/*` a `max-age=300, stale-while-revalidate=86400` (Fase 1 — cierra la ventana de envenenamiento de caché del busting por query string; ver `feedback_cdn_prefetch_poisoning`).
- Verificación post-deploy: poll SOLO del HTML hasta ver el `?v=` nuevo, +90s de margen, luego comprobar el asset SOLO vía variante desechable `&check=`. Verificar en vivo, no solo preview.

## Decisiones (Fase 1, todas consultadas y aprobadas por Alex 2026-06-12)

C1 superficies beige editorial · C2 grises AA #4F5C6E · C3 muerte del azul → sage · C4 titulares marfil #F5F1E6 · C5 rotador multicolor conservado (solo fixes técnicos) · C6 rojo único #B23B3B · C7b escalera tipográfica 3 niveles (C7a itálicas reales descartado) · C8 elevación 4+2 sombras / 3 radios · C9 dark Editorial Midnight sitewide automático (G1 chrome+tokens, G2 páginas interiores) · C10 esta documentación.
