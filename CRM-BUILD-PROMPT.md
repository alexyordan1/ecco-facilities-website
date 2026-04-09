# Prompt para construir CRM de Ecco Facilities

Copia todo lo que esta debajo de la linea y pegalo en un nuevo chat de Claude Code.

---

## Contexto del proyecto

Tengo un sitio web para mi empresa de limpieza comercial: **eccofacilities.com** (Cloudflare Pages, auto-deploy desde GitHub).

**Directorio del proyecto:** `/Users/yoelvismercedes/Downloads/Ecco Webside/`

### Infraestructura actual

| Sistema | Uso | Detalles |
|---------|-----|----------|
| Cloudflare Pages | Hosting + Functions | Auto-deploy desde GitHub |
| Supabase | Base de datos (PostgreSQL) | Proyecto: `aijgpluromciwgrbvhjq`, URL en env var `SUPABASE_URL` |
| ActiveCampaign | Email automations | API v3, tags: partial_lead, completed |
| Postmark | Emails transaccionales | Templates: quote-confirmation, owner-notification |
| HubSpot | CRM (se va a reemplazar) | Private app con token, se puede eliminar |

### Variables de entorno en Cloudflare Pages

```
SUPABASE_URL
SUPABASE_SERVICE_KEY
ACTIVECAMPAIGN_API_URL
ACTIVECAMPAIGN_API_KEY
HUBSPOT_ACCESS_TOKEN     (se puede eliminar cuando el CRM esté listo)
POSTMARK_API_KEY
```

### Base de datos actual — Tabla `leads` en Supabase

```sql
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  company TEXT,
  service TEXT,                    -- 'janitorial' | 'dayporter'
  status TEXT DEFAULT 'partial',   -- 'partial' | 'completed'
  form_data JSONB,                 -- todos los campos del formulario con etiquetas legibles
  ref_number TEXT,                 -- ECJ-xxx o EDP-xxx
  ac_contact_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Constraints
UNIQUE(email, service)
UNIQUE INDEX ON leads(email) WHERE status = 'partial'
```

### Campos dentro de `form_data` (JSONB)

**Janitorial:**
```json
{
  "first_name": "Maria", "last_name": "Garcia", "email": "...", "phone": "...",
  "company": "...", "address": "...", "space_type": "office",
  "space_size": "large", "exact_sqft": "8000",
  "cleaning_days": "Mon / Wed / Fri", "urgency": "ASAP",
  "also_wants_dayporter": "yes", "contact_preference": "Phone",
  "how_heard": "google", "notes": "...", "form_type": "janitorial"
}
```

**Day Porter:**
```json
{
  "first_name": "...", "last_name": "...", "email": "...", "phone": "...",
  "company": "...", "address": "...", "space_type": "retail",
  "hours_per_day": "8", "start_time": "08:00",
  "coverage_days": "Mon / Tue / Wed / Thu / Fri",
  "num_porters": "2", "areas_covered": "lobby,restrooms,kitchens",
  "urgency": "1-2 weeks", "also_wants_janitorial": "no",
  "contact_preference": "Phone", "how_heard": "google",
  "notes": "...", "form_type": "dayporter"
}
```

### Archivos API existentes (NO modificar)

- `functions/api/submit-quote.js` — recibe formularios completados, guarda en Supabase, sincroniza con AC y HubSpot, envia emails via Postmark
- `functions/api/capture-partial.js` — captura leads parciales (solo email + nombre)

### CSP para /crm/*

Ya existe un override de CSP para `/admin/*` en `_headers`. Necesitaremos uno similar para `/crm/*`.

### Convenciones del proyecto

- Zero inline styles — todo mediante clases CSS
- CSS en archivos separados (no Tailwind, no frameworks CSS)
- JS vanilla — no React, no Vue, no frameworks
- Minificacion CSS via `npx clean-css-cli`
- Cache busters `?v=` en cada CSS/JS
- Mobile-first, touch targets minimo 44px
- No `console.log` en produccion
- ARIA attributes para accesibilidad

---

## Lo que quiero construir

Un CRM custom en `/crm/` dentro de mi mismo sitio, usando Supabase como backend y Cloudflare Pages Functions como API.

### Fase 1: Fundacion (construir primero)

**Login y autenticacion:**
- Login con email/contrasena usando Supabase Auth
- Session persistente con JWT
- Proteger todas las rutas /crm/ — redirigir a login si no autenticado
- Rol unico por ahora (admin)

**Lista de leads (tabla interactiva):**
- Tabla con columnas: nombre, empresa, servicio, status, urgencia, ref#, fecha, ultimo contacto
- Busqueda global (nombre, email, empresa)
- Filtros: por servicio (janitorial/dayporter/ambos), status, urgencia, rango de fecha
- Ordenar por cualquier columna
- Paginacion
- Click en fila abre el detalle
- Indicador visual de urgencia (colores)
- Badge para leads que solicitaron ambos servicios
- Exportar a CSV

**Detalle del lead:**
- Seccion de contacto con toda la info + botones de accion (llamar, email, WhatsApp)
- Todos los datos del formulario en tabla legible (extraidos de form_data)
- Numero de referencia destacado
- Timeline de actividad (cronologico):
  - "Lead creado desde formulario janitorial"
  - "Status cambiado: New → Contacted"
  - "Nota agregada: ..."
- Seccion de notas — agregar notas con timestamp
- Cambiar status del pipeline desde aqui
- Si el lead tiene ambos servicios, mostrar tabs o seccion para cada uno

### Fase 2: Pipeline visual

**Vista Kanban:**
- Columnas: New Lead → Contacted → Site Visit → Proposal Sent → Negotiation → Won → Lost
- Tarjetas mostrando: nombre, empresa, servicio, urgencia, dias en etapa
- Drag & drop para mover entre etapas
- Color por urgencia (ASAP=rojo, 1-2 weeks=naranja, Flexible=verde)
- Filtrar por servicio
- Contador de leads por etapa
- Al mover una tarjeta, registrar en timeline automaticamente

**Nuevas tablas en Supabase:**
```sql
CREATE TABLE pipeline_stages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  position INT NOT NULL,
  color TEXT,
  is_closed BOOLEAN DEFAULT FALSE
);

INSERT INTO pipeline_stages (name, slug, position, color, is_closed) VALUES
  ('New Lead', 'new', 0, '#3b82f6', false),
  ('Contacted', 'contacted', 1, '#8b5cf6', false),
  ('Site Visit', 'site-visit', 2, '#f59e0b', false),
  ('Proposal Sent', 'proposal', 3, '#06b6d4', false),
  ('Negotiation', 'negotiation', 4, '#f97316', false),
  ('Won', 'won', 5, '#22c55e', true),
  ('Lost', 'lost', 6, '#ef4444', true);

CREATE TABLE lead_notes (
  id SERIAL PRIMARY KEY,
  lead_id INT REFERENCES leads(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lead_activities (
  id SERIAL PRIMARY KEY,
  lead_id INT REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL,           -- 'status_change', 'note_added', 'created', 'email_sent'
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar columna pipeline_stage a leads
ALTER TABLE leads ADD COLUMN pipeline_stage TEXT DEFAULT 'new' REFERENCES pipeline_stages(slug);
ALTER TABLE leads ADD COLUMN last_contacted_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN lost_reason TEXT;
ALTER TABLE leads ADD COLUMN estimated_value DECIMAL(10,2);
```

### Fase 3: Dashboard y metricas

**KPIs en cards:**
- Leads nuevos (hoy / esta semana / este mes)
- Tasa de conversion (leads → won)
- Tiempo promedio de respuesta
- Valor del pipeline (suma de estimated_value de leads abiertos)

**Graficos (usar Chart.js via CDN):**
- Leads por dia/semana (line chart)
- Distribucion por servicio (donut chart)
- Embudo de conversion (funnel: cuantos en cada etapa)
- Leads por fuente/referral (bar chart)
- Comparacion mes actual vs anterior

### Fase 4: Reportes

- Conversion por fuente (que canal trae mejores leads)
- Conversion por servicio
- Tiempo promedio por etapa
- Leads perdidos — razones
- Revenue forecast
- Exportar reportes a CSV/PDF

### Fase 5: Automatizaciones y alertas

- Lead sin contactar 24h → alerta en dashboard
- Lead estancado 7+ dias → highlight en rojo
- Contador de dias en etapa actual
- Email automatico cuando se marca "Won" (bienvenida)

### Fase 6: Comunicacion

- Boton "Enviar email" que abre template prellenado
- Boton "Llamar" (click-to-call en movil)
- Boton "WhatsApp" con mensaje prellenado
- Log de comunicacion en timeline

---

## Estructura de archivos

```
/crm/
  ├── index.html          → Dashboard (KPIs + graficos)
  ├── login.html          → Login
  ├── pipeline.html       → Vista kanban
  ├── leads.html          → Tabla de leads con filtros
  ├── lead.html           → Detalle del lead (?id=XX)
  ├── reports.html        → Reportes
  ├── settings.html       → Config

/css/
  └── crm.css             → Estilos del CRM (archivo unico)

/js/
  └── crm.js              → Logica del CRM (archivo unico, o modular)

/functions/api/
  ├── crm-auth.js         → Login/logout/session
  ├── crm-leads.js        → CRUD leads + filtros + paginacion
  ├── crm-notes.js        → CRUD notas
  ├── crm-activities.js   → Listar actividades de un lead
  ├── crm-pipeline.js     → Mover leads entre etapas
  └── crm-stats.js        → Metricas para dashboard y reportes
```

---

## Diseno visual

- Dark sidebar (igual que el header del sitio principal: #1a1a2e)
- Fondo claro para el area de contenido
- Cards con bordes sutiles y sombras ligeras
- Colores de la marca: #d4380d (accent/CTA), #1a1a2e (oscuro), #fff (fondo)
- Tipografia: Inter o la misma del sitio
- Responsive: sidebar colapsa a bottom nav en movil
- Transiciones suaves al mover tarjetas y cambiar vistas

---

## Instrucciones de implementacion

1. **Empieza por Fase 1** — login + lista + detalle. Con eso ya es funcional.
2. **Crea las tablas de Supabase primero** (pipeline_stages, lead_notes, lead_activities, ALTER leads)
3. **Cada fase debe ser deployable** — no avances a la siguiente sin que la actual funcione en produccion
4. **Usa las convenciones del proyecto** — zero inline styles, vanilla JS, mobile-first
5. **Agrega CSP para /crm/* en _headers** — similar al existente para /admin/*
6. **Prueba en el sitio live** despues de cada push, no solo en preview local

---

## Importante

- La tabla `leads` YA TIENE DATOS REALES — no borrar ni modificar datos existentes
- Los archivos `submit-quote.js` y `capture-partial.js` NO se tocan — esos siguen funcionando como estan
- El CRM solo LEE de la tabla leads y ESCRIBE en las nuevas tablas (notes, activities) + actualiza pipeline_stage en leads
- Supabase Auth para login — crear el primer usuario admin desde el dashboard de Supabase
