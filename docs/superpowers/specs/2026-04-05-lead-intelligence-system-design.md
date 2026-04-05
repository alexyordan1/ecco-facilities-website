# Lead Intelligence System — Design Spec

**Date:** 2026-04-05
**Status:** Approved
**Scope:** Full system (Neon + Postmark + ActiveCampaign + Twilio)

---

## 1. Problem

The site currently depends on 5 fragile client-side services (FormSubmit, EmailJS, HubSpot, client-side Turnstile, notify-lead). API keys are exposed in HTML. Leads who start the wizard but abandon it are lost forever.

## 2. Solution

Consolidate all form processing into 2 server-side Cloudflare Pages Functions backed by a PostgreSQL database. Capture partial leads (email entered but form not completed) and trigger automated 3-hour follow-up via ActiveCampaign.

## 3. Architecture

```
Browser (quote-janitorial.html / quote-dayporter.html)
  │
  ├── Step 1 complete ──► POST /api/capture-partial
  │                          ├── Neon DB (INSERT partial)
  │                          └── ActiveCampaign (tag: partial_lead → 3h automation)
  │
  └── Form submit ─────► POST /api/submit-quote
                            ├── Turnstile server-side validation
                            ├── Neon DB (UPSERT completed)
                            ├── ActiveCampaign (tag: completed → cancels follow-up)
                            ├── Postmark (confirmation email to client)
                            ├── Postmark (notification email to owner)
                            └── Twilio (SMS to owner)
```

## 4. Database Schema (Neon PostgreSQL)

```sql
CREATE TABLE leads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  first_name    TEXT,
  last_name     TEXT,
  phone         TEXT,
  company       TEXT,
  service       TEXT,           -- 'janitorial' | 'dayporter'
  status        TEXT DEFAULT 'partial',   -- 'partial' | 'completed'
  form_data     JSONB,          -- full wizard data snapshot
  ref_number    TEXT UNIQUE,    -- ECJ-XXXXX / EDP-XXXXX
  ac_contact_id TEXT,           -- ActiveCampaign contact ID
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  completed_at  TIMESTAMPTZ,
  followup_sent BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_leads_email  ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
```

**Deduplication:** `INSERT ... ON CONFLICT (email) DO UPDATE` for both endpoints. Same email = same row, updated in place. **Important:** capture-partial must NOT overwrite a `completed` status back to `partial` — the ON CONFLICT UPDATE should include a WHERE clause: `WHERE leads.status != 'completed'`.

**Connection:** `@neondatabase/serverless` HTTP driver (optimized for Cloudflare Workers edge functions, no persistent connections).

## 5. API Endpoints

### 5.1 POST /api/capture-partial

**File:** `functions/api/capture-partial.js`

**Input:**
```json
{ "email": "john@example.com", "firstName": "John", "phone": "+1..." }
```

**Logic:**
1. Validate email format
2. INSERT into Neon with ON CONFLICT(email) DO UPDATE — but only if current status is NOT 'completed' (prevents overwriting a completed lead back to partial)
3. Create contact in ActiveCampaign → add to "Ecco Leads" list → add tag "partial_lead"
4. Store ac_contact_id in Neon

**Output:** Always `200 { ok: true }` — fire-and-forget, errors logged server-side.

### 5.2 POST /api/submit-quote

**File:** `functions/api/submit-quote.js`

**Input:**
```json
{ "...allWizardData", "turnstileToken": "...", "formType": "janitorial" | "dayporter" }
```

**Logic:**
1. Validate required fields (email, firstName, turnstileToken)
2. Validate Turnstile server-side → POST `https://challenges.cloudflare.com/turnstile/v0/siteverify` → fail = 403
3. Generate ref_number (ECJ- or EDP- + timestamp base36)
4. UPSERT in Neon → status: 'completed', form_data, ref_number, completed_at
5. ActiveCampaign → create/update contact → add tag "completed" → update custom fields
6. Postmark → send quote-confirmation template to client
7. Postmark → send owner-notification template to owner
8. Twilio → SMS to owner

**Output:**
- Success: `200 { ok: true, ref: "ECJ-XXXXX" }`
- Turnstile fail: `403 { ok: false, error: "Bot verification failed" }`
- DB fail: `500 { ok: false, error: "Server error" }`

**Error isolation:** Steps 5-8 (AC, Postmark, Twilio) are wrapped in try/catch individually. If any fails, the error is logged but the response is still success (lead is saved in Neon).

## 6. HTML Changes

### Both quote-janitorial.html and quote-dayporter.html:

**Remove:**
- `<script src="cdn.jsdelivr.net/npm/@emailjs/..."></script>`
- `emailjs.init(...)` and `emailjs.send(...)`
- `fetch('https://formsubmit.co/ajax/...')`
- `fetch('https://api.hsforms.com/...')`
- `<script src="//js-na2.hs-scripts.com/245755967.js">`
- `_hsq.push(...)` blocks
- Client-side Turnstile validation (`if(!tsToken)...`)

**Add:**
- `onStepOneComplete()` — called when user advances from step 1 to step 2, fire-and-forget POST to `/api/capture-partial`
- New `submit()` function — single POST to `/api/submit-quote`, handles success/error UI

**Keep unchanged:**
- All HTML/CSS wizard structure
- Turnstile widget HTML (only validation moves server-side)
- GA4 event tracking
- Success screen with confetti
- localStorage wizard state persistence

## 7. External Services Configuration

### 7.1 ActiveCampaign

- **List:** "Ecco Leads"
- **Custom fields:** service (text), ref_number (text), form_status (text)
- **Tags:** partial_lead, completed
- **Automation:** Trigger = tag "partial_lead" added → wait 3h → if NOT tag "completed" → send follow-up email
- **Pipeline:** Nuevo Lead → Contactado → Propuesta → Negociando → Cerrado

### 7.2 Postmark

- **Templates:**
  1. `quote-confirmation` → to client: "Tu cotizacion esta en camino, {firstName}" + ref + next steps
  2. `owner-notification` → to owner: "Nuevo lead — {service} | Ref: {ref}" + all data
- **Domain verification:** DNS records in Cloudflare for eccofacilities.com

### 7.3 Twilio

- Reuses existing env vars from notify-lead.js integration
- SMS format: "Nuevo lead — {service} | Ref: {ref} | {name} | {phone}"

### 7.4 Cloudflare Turnstile

- Server-side validation via siteverify endpoint
- Requires CF_TURNSTILE_SECRET env var

## 8. CSP Cleanup (_headers)

Remove from Content-Security-Policy:
- `script-src`: `https://js-na2.hs-scripts.com`
- `connect-src`: `https://formsubmit.co`, `https://api.emailjs.com`, `https://js-na2.hs-scripts.com`, `https://api.hsforms.com`
- `form-action`: `https://formsubmit.co`

## 9. Environment Variables (Cloudflare Pages)

```
NEON_DATABASE_URL          — postgresql://...@...neon.tech/ecco_leads
POSTMARK_API_KEY           — Postmark server API key
CF_TURNSTILE_SECRET        — Cloudflare Turnstile secret key
ACTIVECAMPAIGN_API_URL     — https://[account].api-us1.com
ACTIVECAMPAIGN_API_KEY     — ActiveCampaign API key
TWILIO_ACCOUNT_SID         — (already configured)
TWILIO_AUTH_TOKEN           — (already configured)
TWILIO_FROM                — (already configured)
NOTIFY_PHONE               — (already configured)
```

## 10. Dependencies

- `@neondatabase/serverless` — Neon HTTP driver for edge
- `postmark` — Postmark email SDK

ActiveCampaign and Twilio use direct fetch calls (no SDK) to keep bundle size small for edge deployment.

## 11. Files Affected

**New:**
- `functions/api/capture-partial.js`
- `functions/api/submit-quote.js`

**Modified:**
- `quote-janitorial.html` (JS: remove old integrations, add new submit + capture)
- `quote-dayporter.html` (same changes)
- `_headers` (CSP cleanup)

**Deleted:**
- `functions/api/notify-lead.js` (absorbed into submit-quote)

## 12. Error Handling Matrix

| Service | Failure on capture-partial | Failure on submit-quote |
|---------|---------------------------|------------------------|
| Neon | Silent (fire-and-forget) | 500 → user sees error |
| Turnstile | N/A | 403 → hard stop |
| ActiveCampaign | Logged, no user impact | Logged, no user impact |
| Postmark | N/A | Logged, no user impact |
| Twilio | N/A | Logged, no user impact |

**Principle:** Neon is the source of truth. If the lead is in the DB, everything else can be recovered manually.

## 13. Testing Plan

1. Partial capture: fill email only → verify Neon row (partial) + AC contact with partial_lead tag
2. Full submit: complete wizard → verify Neon (completed), client email, owner email, owner SMS
3. Turnstile reject: submit without token → verify 403
4. Deduplication: same email does partial then complete → verify single Neon row
5. Follow-up cancellation: verify "completed" tag in AC stops 3h automation
6. Graceful degradation: simulate Postmark/Twilio/AC failure → verify lead still in Neon, user sees success

## 14. Account Setup Order

1. Neon (create project "ecco-facilities", get DATABASE_URL)
2. Postmark (create server, verify domain, get API key)
3. ActiveCampaign (get API URL + key from Settings → Developer)
4. Cloudflare Turnstile (get secret key from dashboard)
5. Add all env vars to Cloudflare Pages dashboard
