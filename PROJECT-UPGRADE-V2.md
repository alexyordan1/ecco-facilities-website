# 🚀 ECCO FACILITIES — UPGRADE V2: LEAD CAPTURE SYSTEM
**Nombre del proyecto:** Lead Intelligence System
**Fecha de planificación:** 2026-04-05
**Estado:** PENDIENTE — listo para implementar
**Sesión anterior:** Análisis completo hecho, implementación pendiente

---

## 📋 RESUMEN EJECUTIVO

Actualmente el sitio depende de 5 servicios externos frágiles llamados desde el browser del usuario (FormSubmit, EmailJS, HubSpot, Turnstile client-side). El nuevo sistema consolida todo en un backend propio, captura leads aunque no terminen el formulario, y dispara un follow-up automático a las 3 horas.

### El problema principal que resuelve:
Un visitante llega, escribe su email, se distrae y cierra la pestaña.
**Hoy:** ese lead se pierde para siempre.
**Con V2:** a las 3 horas recibe un email: *"Hola John, notamos que no terminaste tu cotización..."*

---

## 🏗️ STACK NUEVO

| Herramienta | Para qué | Costo/mes |
|-------------|----------|-----------|
| **Neon** | Base de datos PostgreSQL (tuya para siempre) | $0–15 |
| **Postmark** | Emails transaccionales (confirmación + notificación) | ~$15 |
| **ActiveCampaign** | CRM + pipeline visual + automatización 3h follow-up | $15–99 |
| **Twilio** | SMS al dueño cuando llega un lead | ~$1 |
| **Cloudflare Pages Functions** | API layer (ya existe, se amplía) | $0 |
| **TOTAL** | | **~$30–130/mes** |

---

## ✅ LO QUE SE QUEDA (sin tocar)

- Todo el HTML/CSS/JS de las 19 páginas estáticas
- Cloudflare Pages + GitHub (hosting)
- El wizard de 8 pasos (estructura visual)
- Cloudflare Turnstile widget HTML (solo la validación se mueve al servidor)
- GTM + GA4 + Microsoft Clarity (analytics)
- Mailchimp en el footer (newsletter)
- Decap CMS + `/api/auth.js` + `/api/callback.js` (CMS de blog)
- Todos los blogs, sitemap.xml, robots.txt
- La pantalla de éxito del formulario

---

## ❌ LO QUE SE ELIMINA

### Del HTML (quote-janitorial.html y quote-dayporter.html):
```
- <script src="cdn.jsdelivr.net/npm/@emailjs/..."></script>
- emailjs.init('M9BvegsZOSvCfKmqa')
- emailjs.send('service_glp7i9d', 'template_5vrhsep', {...})
- fetch('https://formsubmit.co/ajax/...')
- fetch('https://api.hsforms.com/submissions/v3/...')
- <script src="//js-na2.hs-scripts.com/245755967.js"></script>
- La validación de Turnstile en el browser (if(!tsToken)...)
- Todo el bloque de _hsq.push(...)
```

### Del _headers (CSP):
```
FUERA de script-src:   https://js-na2.hs-scripts.com
FUERA de connect-src:  https://formsubmit.co
                       https://api.emailjs.com
                       https://js-na2.hs-scripts.com
                       https://api.hsforms.com
FUERA de form-action:  https://formsubmit.co
```

### Functions eliminadas:
```
- /api/notify-lead.js  →  absorbida dentro de /api/submit-quote
```

### Servicios que se dan de baja:
```
- FormSubmit   (servicio gratuito de terceros, sin control)
- EmailJS      (reemplazado por Postmark)
- HubSpot CRM  (reemplazado por ActiveCampaign)
```

---

## ➕ LO QUE SE AÑADE

### 2 nuevos Cloudflare Pages Functions

#### `/api/capture-partial` — NUEVO
Se llama cuando el usuario completa el Paso 1 del wizard (escribe email y avanza).

```
RECIBE:  { email, firstName, phone }
HACE:
  1. Guarda en Neon DB  → { email, firstName, phone, status: 'partial', created_at: ahora }
  2. Crea contacto en ActiveCampaign con tag 'partial_lead'
  3. ActiveCampaign empieza el countdown de 3 horas internamente
RESPONDE: { ok: true }
```

#### `/api/submit-quote` — NUEVO (reemplaza todo)
Se llama al hacer submit del formulario completo. Reemplaza FormSubmit + EmailJS + HubSpot client-side + notify-lead.

```
RECIBE:  { ...todosDatosDelWizard, turnstileToken }
HACE:
  1. Valida Turnstile en el servidor (criptográficamente — no bypasseable)
  2. Actualiza Neon DB  → { status: 'completed', form_data: {...}, ref_number, completed_at }
  3. Agrega tag 'completed' en ActiveCampaign → cancela el follow-up automáticamente
  4. Postmark → email de confirmación al cliente (professional HTML template)
  5. Postmark → email de notificación al dueño con todos los datos
  6. Twilio   → SMS al dueño
RESPONDE: { ok: true, ref: 'ECO-XXXXX' }
```

### Cambios en los formularios (solo el JavaScript)

```javascript
// AÑADIR al wizard: cuando el usuario avanza del Paso 1
function onStepOneComplete() {
  fetch('/api/capture-partial', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: D.em,
      firstName: D.fn,
      phone: D.ph || ''
    })
  }).catch(() => {});  // fire-and-forget, no bloquea el wizard
}

// REEMPLAZAR el submit() completo por:
async function submit() {
  const token = document.querySelector('[name="cf-turnstile-response"]')?.value;
  const res = await fetch('/api/submit-quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...D, turnstileToken: token })
  });
  const { ok, ref } = await res.json();
  if (ok) mostrarPantallaExito(ref);
  else mostrarError();
}
```

### Base de datos Neon — Schema

```sql
CREATE TABLE leads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL,
  first_name    TEXT,
  last_name     TEXT,
  phone         TEXT,
  company       TEXT,
  service       TEXT,           -- 'janitorial' | 'dayporter' | 'both'
  status        TEXT DEFAULT 'partial',   -- 'partial' | 'completed'
  form_data     JSONB,          -- snapshot completo de todos los datos del wizard
  ref_number    TEXT UNIQUE,    -- ECO-XXXXXX
  ac_contact_id TEXT,           -- ID del contacto en ActiveCampaign
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  completed_at  TIMESTAMPTZ,
  followup_sent BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_leads_email  ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
```

### Configuración ActiveCampaign

**Lista:** "Ecco Leads"

**Campos custom:**
- `service` (texto) — janitorial / dayporter / both
- `ref_number` (texto) — ECO-XXXXXX
- `form_status` (texto) — partial / completed

**Automatización principal:**
```
TRIGGER: Tag "partial_lead" es añadido al contacto
  ↓
Esperar 3 horas
  ↓
Condición: ¿Tiene el tag "completed"?
  ├── SÍ → Fin (ya convirtió, no hacer nada)
  └── NO → Enviar email "Hey, ¿terminamos tu cotización?"
              Asunto: "John, tu cotización de Ecco Facilities te espera"
              CTA: enlace directo al formulario
```

**Pipeline de ventas:**
```
Nuevo Lead → Contactado → Propuesta Enviada → Negociando → Cerrado (Won/Lost)
```

### Configuración Postmark

**2 Message Streams:**
- `outbound` — para emails transaccionales

**2 Templates:**
1. `quote-confirmation` → al cliente
   - Asunto: "Tu cotización está en camino, {firstName}"
   - Incluye: número de referencia, próximos pasos, contact info

2. `owner-notification` → al dueño (tú)
   - Asunto: "🔔 Nuevo lead — {service} | Ref: {refNumber}"
   - Incluye: todos los datos del cliente y del servicio solicitado

### Variables de entorno nuevas (Cloudflare Pages)

```
NEON_DATABASE_URL          → postgresql://...@...neon.tech/ecco_leads
POSTMARK_API_KEY           → tu server API key de Postmark
CF_TURNSTILE_SECRET        → secret key de Cloudflare Turnstile
ACTIVECAMPAIGN_API_URL     → https://[account].api-us1.com
ACTIVECAMPAIGN_API_KEY     → tu API key de ActiveCampaign

(Ya pendientes de configurar:)
TWILIO_ACCOUNT_SID         → ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN          → tu auth token
TWILIO_FROM                → tu número Twilio (+1...)
NOTIFY_PHONE               → tu número personal (+1...)
```

---

## 📊 COMPARATIVA ANTES vs DESPUÉS

| Aspecto | Sistema Actual | Sistema V2 |
|---------|---------------|------------|
| Captura leads que abandonan | ❌ No | ✅ Sí |
| Follow-up automático a 3h | ❌ No | ✅ Sí |
| Follow-up se cancela si convierte | ❌ No | ✅ Sí |
| Base de datos propia | ❌ No | ✅ Neon |
| Pipeline visual de leads | ❌ No | ✅ ActiveCampaign |
| API keys expuestas en HTML | ❌ Sí | ✅ No (servidor) |
| Turnstile real (servidor) | ❌ No (bypasseable) | ✅ Sí |
| Deliverability de email | ⚠️ Media (EmailJS) | ✅ 99%+ (Postmark) |
| Puntos de falla | ❌ 5 servicios | ✅ 1 endpoint |
| Secuencias de nurturing | ❌ No | ✅ Sí (AC) |
| Emails/mes incluidos | ❌ 200 (EmailJS) | ✅ 3,000+ (Postmark) |

---

## 🗓️ PLAN DE IMPLEMENTACIÓN

### Paso 1 — Setup de cuentas (CLAUDE NAVEGA, DUEÑO INGRESA DATOS — ~30 min)

> ⚠️ IMPORTANTE PARA CLAUDE EN NUEVA SESIÓN:
> Claude no puede crear cuentas por el usuario. Lo que SÍ hace:
> Navega al sitio → el dueño escribe su email, contraseña y tarjeta →
> Claude configura todo lo demás (proyecto, API keys, settings).
> Seguir este orden exacto:

```
□ neon.tech
    → Claude navega al sitio
    → Dueño crea la cuenta (email + contraseña)
    → Claude: crea proyecto "ecco-facilities", copia DATABASE_URL

□ postmarkapp.com
    → Claude navega al sitio
    → Dueño crea la cuenta (email + contraseña)
    → Claude: crea servidor, inicia verificación de dominio eccofacilities.com
    → Claude: copia Server API Key

□ activecampaign.com (plan Lite — $15/mo)
    → Claude navega al sitio
    → Dueño crea la cuenta (email + contraseña + tarjeta)
    → Claude: copia API URL y API Key desde Settings → Developer

□ twilio.com
    → Claude navega al sitio
    → Dueño crea la cuenta (email + contraseña + verificación de teléfono)
    → Claude: compra número de teléfono NYC (+1 212/646/718/917)
    → Claude: copia Account SID y Auth Token
```

### Paso 2 — Claude configura las variables de entorno (5 min)
```
□ Agregar todas las env vars en Cloudflare Pages dashboard
```

### Paso 3 — Claude construye el código (1-2 horas)
```
□ Crear /api/capture-partial.js
□ Crear /api/submit-quote.js
□ Eliminar /api/notify-lead.js
□ Actualizar quote-janitorial.html
    → Añadir onStepOneComplete()
    → Reemplazar submit() completo
    → Eliminar EmailJS, FormSubmit, HubSpot scripts
□ Actualizar quote-dayporter.html (mismo proceso)
□ Actualizar _headers (limpiar CSP)
□ Crear schema en Neon DB
```

### Paso 4 — Claude configura ActiveCampaign (30 min)
```
□ Crear lista "Ecco Leads"
□ Crear campos custom (service, ref_number, form_status)
□ Crear automatización del follow-up 3h
□ Crear pipeline de ventas
```

### Paso 5 — Claude configura Postmark (20 min)
```
□ Verificar dominio
□ Crear template: quote-confirmation
□ Crear template: owner-notification
```

### Paso 6 — Testing completo
```
□ Test 1: Llenar solo el email y abandonar → esperar 3h → confirmar email de follow-up
□ Test 2: Completar el formulario → confirmar email al cliente + notificación al dueño + SMS
□ Test 3: Intentar bypass de Turnstile → confirmar que el servidor lo rechaza
□ Test 4: Verificar que el lead aparece en Neon DB y en ActiveCampaign
□ Test 5: Verificar que el follow-up NO se manda si el lead convirtió
```

---

## 🔑 CREDENCIALES PENDIENTES DE OBTENER

Una vez creadas las cuentas, el dueño debe proporcionar:

| Variable | Dónde encontrarla |
|----------|------------------|
| `NEON_DATABASE_URL` | neon.tech → tu proyecto → Connection String |
| `POSTMARK_API_KEY` | postmarkapp.com → Servers → API Tokens |
| `CF_TURNSTILE_SECRET` | dash.cloudflare.com → Turnstile → tu widget → Secret Key |
| `ACTIVECAMPAIGN_API_URL` | ActiveCampaign → Settings → Developer |
| `ACTIVECAMPAIGN_API_KEY` | ActiveCampaign → Settings → Developer |
| `TWILIO_ACCOUNT_SID` | console.twilio.com → Dashboard |
| `TWILIO_AUTH_TOKEN` | console.twilio.com → Dashboard |
| `TWILIO_FROM` | console.twilio.com → Phone Numbers |
| `NOTIFY_PHONE` | Tu número personal (para recibir el SMS) |

---

## 📁 ARCHIVOS AFECTADOS

```
NUEVOS:
  functions/api/capture-partial.js
  functions/api/submit-quote.js

MODIFICADOS:
  quote-janitorial.html      (JS del wizard — submit y capture)
  quote-dayporter.html       (JS del wizard — submit y capture)
  _headers                   (CSP — eliminar dominios innecesarios)

ELIMINADOS:
  functions/api/notify-lead.js   (absorbido en submit-quote)
```

---

## 💡 NOTAS IMPORTANTES

1. **El wizard NO se interrumpe** — `/api/capture-partial` es fire-and-forget. Si falla, el usuario sigue sin saberlo.
2. **El submit SÍ espera respuesta** — Si `/api/submit-quote` falla, el usuario ve un error real (para que no piense que su cotización fue enviada sin serlo).
3. **Deduplicación** — Si el mismo email envía el formulario dos veces, Neon hace UPSERT por email y ActiveCampaign no crea duplicados.
4. **El follow-up es cancelable** — Agregar tag 'completed' en ActiveCampaign en el momento del submit es suficiente para que la automatización detecte la condición y se detenga.
5. **Los datos son tuyos** — Todo lo que pasa por `/api/submit-quote` queda guardado en Neon indefinidamente. Aunque canceles ActiveCampaign o Postmark, no pierdes los leads.
