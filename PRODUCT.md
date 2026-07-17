# Product

> Reescrito 2026-07-17 tras el lanzamiento del rediseño **Noir** (2026-06-25, `6276a67`). La versión anterior describía el sistema pre-Noir (crema/sage, Cormorant, persona "Alina") que ya no existe en producción. Sistema visual: ver `DESIGN.md`.

## Register

El sitio tiene dos registros mezclados. El **marketing** (`/`, servicios, industrias, blog) es *brand*: el diseño ES el producto. El **quote wizard** (`/quote`) es *product*: el diseño sirve a la tarea. La voz (Editorial · Directa · Adulta) es común a ambos.

## Users

**Primary:** Facility Managers de propiedades comerciales mid-market (oficinas, clínicas, retail, escuelas, restaurantes, gimnasios) en NYC + los 5 boroughs. Comparan 3 cotizaciones en 20 minutos entre reuniones.

**Secondary:** Dueños-operadores de negocio pequeño (un restaurante, una boutique, una clínica) que no hablan jerga de facilities pero necesitan limpieza recurrente.

**Tertiary:** Property managers de edificios multi-tenant buscando un solo proveedor para el portafolio.

**Contexto de uso:** mayormente desktop en horario de oficina; a veces móvil en tránsito. Atención media. Ya googlearon "commercial cleaning NYC" y están comparando. Su vara no es "sorpréndeme": es "gánate mis 5 minutos sin desperdiciarlos".

## Product Purpose

1. **Quote wizard (`/quote`)** — convertir leads calificados. El usuario describe espacio + horario; el wizard captura contacto y produce un resumen cotizable para ventas. La calidad del lead importa más que la tasa de completado; datos malos queman llamadas de ventas.
2. **Superficie de marketing** — establecer confianza, responder "¿son la gente correcta?", y enrutar al wizard. CTA único en todo el sitio: **"Get your free proposal"**.

Éxito = un Facility Manager pensando "esto lo maneja gente adulta" en 30 segundos, y entregando datos honestos de su espacio sin rebotar.

## Servicios (nomenclatura canónica)

- **Commercial Cleaning** (ex-"Nightly Cleaning", renombrado en el rediseño Noir): el reset completo del facility en el horario que el cliente fija. Página: `janitorial.html`.
- **Day Porter**: presencia dedicada on-site durante horas de operación. Página: `day-porter.html`.
- **Both / Combined**: los dos con un solo proveedor; tercer card del wizard ("One team: a porter by day, a crew deep-cleans after you close.").

## Brand Personality

**Tres palabras: Editorial · Directa · Adulta.**

- **Editorial** — serif display (Fraunces) sobre negro cálido, fotografía real con tratamiento cinematográfico, composición de revista. Páginas interiores ricas en imagen (svc-hero + svc-figure + img-band + ind-grid), nunca texto sobre negro plano.
- **Directa** — copy corto, sin relleno. Nada de "seamless"/"elevate" en el sitio (permitidos solo en cartas de propuesta). Se dice qué se hace y cómo verificarlo.
- **Adulta** — sin urgency timers, sin scarcity falsa, sin absolutos imposibles. Claims verificables únicamente (ver Reglas de claims).

## Voice rules (vigentes, aplicadas al 100% del copy visible)

- **Cero em dashes (—) en copy visible.** Títulos/metas → separador "·"; enumeraciones → dos puntos; apartes → coma; cierres fuertes → punto. (Barrido completado 2026-07-17. Excepciones documentadas: comentarios de código, placeholders de valor-vacío en wizard/admin, y el correo de confirmación al cliente aprobado por Alex 2026-07-10.)
- Sentence case, no Title Case.
- CTA único: "Get your free proposal".
- Sin teléfono visible en el sitio (el JSON-LD sí lleva `telephone` +19296856757, el número del GBP). Dudas → info@eccofacilities.com. El canónico de propuestas/contratos es (929) 280-9374 — no confundirlos.
- Tiempos de respuesta siempre "within 24 hours **on business days**" / "same-day on business days".

## Reglas de claims (confirmadas por Alex, no negociables)

- "Every **cleaning** product we use is eco-certified" (Green Seal / EPA Safer Choice). Nunca "every product" a secas: los desinfectantes no son Safer Choice.
- "Where disinfection is required, we use **EPA-registered** disinfectants." (Confirmado: sí los tienen.)
- "Safe for **use around** staff/visitors/children/pets" — nunca "non-toxic", "no toxins", "fragrance-free", "genuinely safe".
- $5M umbrella = VERDADERO (más GL, workers' comp, commercial auto). COI disponible; additional insured on request.
- Garantía re-clean por escrito = VERDADERA (existe en los templates de contrato).
- 12+ años = experiencia de los fundadores, no de la empresa. Sin "200+ clients", sin ratings inventados, sin "Bonded/Licensed", sin reviews falsas ("No invented reviews" es un pilar de la página de Trust).
- Consumibles (papel/jabón/liners) SIEMPRE facturados aparte; química/productos/equipo sí incluidos (turnkey).
- Alt-text honesto: sin ubicaciones falsas (no "NYC" en fotos que no lo son), sin certificaciones invisibles, sin atribuir stock a Ecco.

## Anti-references

Lo que esto NO es:

- **No Servpro / ABM corporate** — azul-y-blanco genérico con stock de burbujas y empleados sonriendo. Nada de reflejo de categoría "limpieza = verde + spray + sonrisa".
- **No landing SaaS** — sin gradient text, sin "trusted by 1000+ teams", sin heroes de métricas, sin grid de pricing 3-tier.
- **No marketplace estilo TaskRabbit** — sin urgency pricing, sin "book in 30 seconds", sin animaciones de celebración.
- **No Lemonade** — compartimos el framing conversacional del wizard, pero tono adulto, no juguetón.

## Design Principles

1. **Lead capture before completion.** El paso Info (nombre, email, rol, teléfono opcional) va temprano en el flujo, no al final. Mejor un lead incompleto que ninguno. Todo cambio de flujo preserva esta regla.
2. **Editorial confidence, not whimsy.** Cada acento serif/itálico debe ganarse su lugar. No somos un RSVP de boda.
3. **Una decisión por pantalla.** Sin pantallas de 14 campos. Si un paso se ve amontonado, se refactoriza el paso, no se "pule".
4. **Un solo acento.** `--accent #9FCB7B` es el único color saturado del sitio (CTAs, links, focus, eyebrows). Única excepción: el rotador de 6 colores del hero del home (veto de Alex: no se toca).
5. **El form sirve al equipo de ventas, no a la vanidad del usuario.** Sin confetti, sin "great job!". El premio es la propuesta.

## Accessibility

- **Target WCAG 2.1 AA.** Touch targets mínimo 44px (`display:inline-flex` + `min-height:44px`).
- iOS zoom: inputs a `font-size:1rem`; nunca `maximum-scale=1.0` (viola 1.4.4 Reflow).
- ARIA viewport-aware vía `matchMedia`; nunca `aria-hidden` hardcodeado en elementos visibles en desktop.
- Wizard: pantallas inactivas con `inert` + `aria-hidden` (cubierto por e2e).
- Headings semánticos en orden (h1→h2→h3, sin saltos).
- `prefers-reduced-motion` respetado (bloque dedicado en noir.css); fallback `@media (scripting:none)` para contenido revelado por JS.
- **El sitio Noir es dark-only por diseño** (`color-scheme:dark` en `html`): no hay modo claro ni toggle. Los forms llevan hardening de chrome nativo (autofill overrides) para no romper en dark.

## Infraestructura de conversión (referencia rápida)

- Submit: `functions/api/submit-quote.js` (Cloudflare Pages Function) → D1 `ecco-leads` + Supabase + HubSpot + Postmark (correo de confirmación al cliente "Framed Stationery" + aviso interno). Turnstile en producción, fail-loud.
- CRM interno: `admin.html` + `/api/crm-*` (token). Fallback histórico: HubSpot propiedad `ecco_form_data`.
- Suite e2e: `tests/e2e/` (Playwright, 47 specs × 2 proyectos: desktop-chrome y mobile-safari, server hermético en 8080). Correr antes de cualquier commit que toque el wizard.
