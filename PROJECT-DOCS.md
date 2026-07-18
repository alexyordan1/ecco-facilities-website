# ECCO FACILITIES LLC - Project Documentation

**Domain:** eccofacilities.com
**Hosting:** Cloudflare Pages (auto-deploy from GitHub)
**Repository:** github.com/alexyordan1/ecco-facilities-website (branch: main)
**Stack:** Static HTML/CSS/JS (vanilla, no framework) + Cloudflare Pages Functions (`functions/api/`)
**Last Updated:** July 18, 2026 — structure/version sections rewritten to the live **Noir** architecture (launched 2026-06-25)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [File Inventory](#2-file-inventory)
3. [External Services & IDs](#3-external-services--ids)
4. [How Everything Connects](#4-how-everything-connects)
5. [Form Submission Flow](#5-form-submission-flow)
6. [Chat Widget Architecture (removed)](#6-chat-widget-architecture-removed)
7. [SEO Setup](#7-seo-setup)
8. [Security & Privacy](#8-security--privacy)
9. [CMS (Decap)](#9-cms-decap)
10. [CSS/JS Conventions](#10-cssjs-conventions)
11. [Cloudflare Configuration](#11-cloudflare-configuration)
12. [Deployment Workflow](#12-deployment-workflow)
13. [Change Log](#13-change-log)

---

## 1. Architecture Overview

```
                       ┌─────────────────────────────┐
                       │     eccofacilities.com       │
                       │     (Cloudflare Pages)       │
                       └──────────┬──────────────────┘
                                  │ auto-deploy
                       ┌──────────┴──────────────────┐
                       │  GitHub Repository (main)    │
                       │  alexyordan1/ecco-facilities │
                       └──────────┬──────────────────┘
                                  │
        ┌─────────┬───────────┬───┴────┬──────────┬────────────┐
        ▼         ▼           ▼        ▼          ▼            ▼
   HTML pages  CSS/JS      Images    Config    Functions     CRM
  (Noir + CRM) (vanilla)   (WebP)    files    (Pages API)   (app)
```

**Data Flow:**
```
User visits site
  ├─→ GTM loads → fires GA4 + Clarity tags
  ├─→ Cookie consent banner (js/cookie-consent.js) → respects GPC signal,
  │    gates the HubSpot tracking script
  │
User fills quote form (quote.html + js/quote-flow.js)
  ├─→ /api/capture-partial → partial progress saved server-side
  └─→ POST /api/submit-quote (Cloudflare Pages Function)
        ├─ Turnstile verification (fail-loud in production)
        ├─ Lead stored in Cloudflare D1 (env.DB)
        ├─ HubSpot CRM v3 → contact search/create + deal + association
        └─ Postmark → client confirmation + internal notification
             (HTML built in code: buildClientEmail / buildOwnerEmail)
```

---

## 2. File Inventory

### Pages — public site (Noir)

| File | Purpose |
|------|---------|
| `index.html` | Homepage: hero, services (Commercial Cleaning + Day Porter), proof, FAQ |
| `janitorial.html` | Commercial Cleaning detail page |
| `day-porter.html` | Day Porter detail page |
| `quote.html` | Quote wizard — single page, both flows (`js/quote-flow.js`) |
| `about.html` | Company story, team values |
| `why-ecco.html` | Value proposition, differentiators |
| `sustainability.html` | Eco-certified products, green initiatives |
| `testimonials.html` | Customer testimonials |
| `careers.html` | Job listings + application form |
| `blog.html` + 7 posts in `blog/` | Blog index + articles |
| `privacy.html` / `terms.html` / `accessibility.html` | Legal & compliance |
| `sitemap.html` / `404.html` | Utility pages |
| `partials/header.html` / `partials/footer.html` | Shared chrome partials |

The old `services.html`, the split quote pages (`quote-janitorial.html` / `quote-dayporter.html`) and the 4 pre-Noir SEO pages no longer exist; removed with 301s in `_redirects`.

### Pages — CRM (`crm/`)

`login.html`, `index.html` (dashboard), `leads.html`, `lead.html` (detail), `pipeline.html`, `reports.html`, `settings.html`, `reset-password.html`, plus `sw.js` (service worker).

### CSS

| File | Size | Notes |
|------|------|-------|
| `css/noir.source.css` | ~80 KB | **Editable master** — edit here, then minify (tracked; exception in `.gitignore`) |
| `css/noir.css` | ~69 KB | Minified from source (`?v=26`) — loaded by every public page |
| `css/quote-noir.css` | — | Quote wizard skin (`?v=63`) |
| `css/crm.css` | — | CRM styles (`?v=4.3`) |

### JavaScript

| File | Notes |
|------|-------|
| `js/site.js` | Shared nav/menu/reveal (`?v=4`) |
| `js/quote-flow.js` | Quote wizard engine (`?v=39.22`) |
| `js/cookie-consent.js` | Cookie banner + GPC + HubSpot loader (`?v=1.5`) |
| `js/crm-core.js`, `crm-auth.js`, `crm-dashboard.js`, `crm-leads.js`, `crm-detail.js`, `crm-pipeline.js`, `crm-reports.js`, `crm-settings.js`, `crm-ai.js` | CRM modules (`?v=4.1`–`4.2`) |
| `js/chart.min.js`, `js/sortable.min.js` | Vendored libraries (CRM only) |

Deleted 2026-07-18 (pre-Noir, zero consumers): `css/styles.css`, `css/components.css`, `css/quote-flow.css`, `js/chat-widget.js` — plus `js/main.js` earlier the same day.

### Configuration

| File | Purpose |
|------|---------|
| `sitemap.xml` | XML sitemap |
| `robots.txt` | Crawl rules — blocks /admin/, /crm/, /functions/ and other internal areas |
| `_headers` | Cloudflare security headers + cache |
| `_redirects` | 301s: /contact → /quote, retired pre-Noir pages |
| `admin/config.yml` | Decap CMS configuration |

### Server / Backend

| File | Purpose |
|------|---------|
| `functions/api/submit-quote.js` | Quote submission: Turnstile → D1 → HubSpot → Postmark |
| `functions/api/capture-partial.js` | Partial-progress capture |
| `functions/api/crm-*.js`, `leads.js`, `auth.js`, `callback.js`, `_middleware.js` | CRM + leads API (Cloudflare Pages Functions, D1 `ecco-leads`) |
| `serve.js` / `serve.py` | Local dev servers |
| `chat-backend/`, `server/` | **Legacy** — backends for the removed chat widget (future purge candidates) |

### Docs

| File | Purpose |
|------|---------|
| `HANDOFF.md` | Original pre-Noir build brief (historical; structure section updated) |
| `DESIGN.md` / `PRODUCT.md` | Current Noir design & product docs (rewritten 2026-07-17) |
| `DESIGN-SYSTEM.md` | Pre-Noir technical reference (**obsolete**, banner added) |
| `docs/` | Audits, plans, specs, proposal design references |

---

## 3. External Services & IDs

### Analytics & Tracking

| Service | ID | Script Location | Purpose |
|---------|----|-----------------|---------|
| Google Tag Manager | `GTM-W2ZWXZ3T` | `<head>` of all pages | Event management hub |
| Google Analytics 4 | `G-N7P035N7BY` | Via GTM | Traffic analytics |
| GA4 Property | `531034463` | — | Property ID |
| GA4 Account | `389744315` | — | Account ID |
| Microsoft Clarity | `w546w8zoh2` | `<head>` of all pages | Heatmaps & recordings |
| HubSpot | `245755967` | `<body>` end of all pages | CRM + contact tracking |

### Form & Email Services

| Service | ID/Key | Purpose |
|---------|--------|---------|
| FormSubmit.co | `info@eccofacilities.com` | Form-to-email proxy |
| EmailJS Service | `service_glp7i9d` | Email delivery service |
| EmailJS Template | `template_5vrhsep` | Confirmation email template |
| EmailJS Public Key | `M9BvegsZOSvCfKmqa` | Client-side auth |
| HubSpot Form (Janitorial) | `20c9de1e-4067-4961-9cda-3af11efe7fc3` | Forms API GUID |
| HubSpot Form (Day Porter) | `6aa21f22-e7f5-4f9f-9286-63381a497590` | Forms API GUID |
| MailChimp | `eccofacilities.us22.list-manage.com` | Newsletter signups |

### Infrastructure

| Service | Details | Purpose |
|---------|---------|---------|
| Cloudflare Pages | `ecco-facilities-website.pages.dev` | Static hosting + CDN |
| Cloudflare NS | `howard.ns.cloudflare.com`, `paloma.ns.cloudflare.com` | DNS |
| GitHub | `alexyordan1/ecco-facilities-website` | Source code + CMS backend |
| Vercel | `ecco-chat-backend.vercel.app` | Chat API proxy |
| Google Search Console | Domain property: eccofacilities.com | SEO monitoring |
| Google Business Profile | Ecco Facilities LLC | Local SEO |

### Domain

| Detail | Value |
|--------|-------|
| Registrar | GoDaddy |
| Renewal | April 29, 2026 ($22.99/yr) |
| DNS | Cloudflare (nameservers) |
| SSL | Cloudflare (automatic) |

---

## 4. How Everything Connects

> **⚠️ Diagram partially legacy (2026-07-18).** Still accurate: Cloudflare Pages serving, GTM/GA4/Clarity/HubSpot scripts, deployment pipeline, Decap CMS. Outdated: the FORM SUBMISSIONS box (see the current flow in the §5 note — `/api/submit-quote`) and the CHAT WIDGET box (widget removed).

### Connection Map

```
┌──────────────┐
│  VISITOR      │
│  (Browser)    │
└──────┬───────┘
       │ HTTPS
       ▼
┌──────────────────────────────────────────────────────────┐
│  CLOUDFLARE PAGES                                        │
│  eccofacilities.com                                      │
│  ├─ Serves static HTML/CSS/JS/images                     │
│  ├─ Applies _headers (CSP, HSTS, cache rules)            │
│  ├─ Applies _redirects (/contact → /quote)               │
│  ├─ Auto SSL                                             │
│  └─ CDN (300+ edge locations)                            │
└──────────────────────────────────────────────────────────┘
       │
       │ Loads external scripts:
       │
       ├──→ GTM (GTM-W2ZWXZ3T)
       │      └──→ GA4 (G-N7P035N7BY) → Google Analytics dashboard
       │
       ├──→ Clarity (w546w8zoh2) → Microsoft Clarity dashboard
       │
       ├──→ HubSpot (245755967) → HubSpot CRM
       │      ├─ _hsq.identify → Creates/updates contacts
       │      ├─ _hsq.trackPageView → Page visit history
       │      └─ _hsq.trackCustomBehavioralEvent → Form events
       │
       └──→ Google Fonts → Fraunces + Inter

┌──────────────────────────────────────────────────────────┐
│  FORM SUBMISSIONS (3 destinations per quote)             │
│                                                          │
│  1. FormSubmit.co ──→ info@eccofacilities.com            │
│     (delivers the actual quote request via email)        │
│                                                          │
│  2. EmailJS ──→ User's email                             │
│     (sends confirmation with reference number)           │
│                                                          │
│  3. HubSpot _hsq ──→ HubSpot CRM                        │
│     (identifies contact + tracks behavioral event)       │
│                                                          │
│  4. HubSpot Forms API ──→ HubSpot CRM                   │
│     (creates form submission record + auto-creates       │
│      contact via api.hsforms.com)                        │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  CHAT WIDGET                                             │
│                                                          │
│  Browser ──POST──→ ecco-chat-backend.vercel.app/api/chat │
│                         │                                │
│                         ▼                                │
│                    Claude API (Anthropic)                 │
│                         │                                │
│                         ▼                                │
│                    Response ──→ Browser                   │
│                                                          │
│  Fallback: 50+ hardcoded Q&A if API fails                │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  DEPLOYMENT PIPELINE                                     │
│                                                          │
│  Local edit → git push → GitHub (main branch)            │
│                              │                           │
│                              ▼                           │
│                     Cloudflare Pages (auto-build)         │
│                              │                           │
│                              ▼                           │
│                     Live at eccofacilities.com            │
│                     (~30 seconds)                        │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  CMS (Decap)                                             │
│                                                          │
│  /admin/ → GitHub OAuth → Edit blog posts                │
│                              │                           │
│                              ▼                           │
│                     Commits to GitHub (main)              │
│                              │                           │
│                              ▼                           │
│                     Auto-deploy via Cloudflare            │
└──────────────────────────────────────────────────────────┘
```

---

## 5. Form Submission Flow

> **⚠️ Legacy section (pre-Noir).** The FormSubmit/EmailJS flow below no longer exists. Today `quote.html` + `js/quote-flow.js` POST to `/api/submit-quote`: Turnstile verification (fail-loud in production) → lead stored in Cloudflare D1 → HubSpot CRM v3 (contact search/create + deal + association) → Postmark client confirmation + internal notification, both built in code (`buildClientEmail` / `buildOwnerEmail` in `functions/api/submit-quote.js`). Partial progress goes to `/api/capture-partial`. The description below is kept for history only.

### Quote Forms (Janitorial & Day Porter)

Both forms use an inline JavaScript wizard engine (`W` object) with data stored in the `D` object.

**Janitorial Form Fields:**
| Field ID | Label | Type |
|----------|-------|------|
| `fFn` | First Name | text input |
| `fLn` | Last Name | text input |
| `fEm` | Email | email input |
| `fPh` | Phone | tel input |
| Space Type | Space type | button group |
| Facility Size | Size range | button group |
| Cleaning Days | Days/week | multi-select buttons |
| Start Timeline | Urgency | buttons |
| Day Porter Extras | Add-ons | buttons |
| `fCo` | Company | text input |
| `fAddr` | Address | text input |
| `fRef` | How did you hear? | text input |
| `fNotes` | Notes | textarea |
| `fWebsite` | Honeypot | hidden |

**Day Porter Form — Additional Fields:**
| Field ID | Label | Type |
|----------|-------|------|
| Coverage Hours | Hours needed | buttons + custom |
| Start Time | Preferred start | buttons |
| Areas | Areas to cover | multi-select |
| Number of Porters | How many | buttons |

**localStorage Keys:**
- `ecco_quote_jan` — janitorial form progress
- `ecco_quote_dp` — day porter form progress
- `ecco_partial_jan` / `ecco_partial_dp` — session partial saves

**Reference Numbers:**
- Janitorial: `ECJ-{timestamp}`
- Day Porter: `ECD-{timestamp}`

**Submit Sequence (`W.submit()`):**

```
Step 1: Validate required fields
  └─ If invalid → show inline error, stop

Step 2: Build FormData payload
  └─ All form fields + reference number + service type

Step 3: POST to FormSubmit.co
  └─ fetch('https://formsubmit.co/ajax/info@eccofacilities.com', {
       method: 'POST', body: formData
     })
  └─ This sends the quote details to business email

Step 4: EmailJS confirmation
  └─ emailjs.send('service_glp7i9d', 'template_5vrhsep', {
       to_email: user_email,
       from_name: 'Ecco Facilities',
       reference: 'ECJ-XXXXX',
       ...field_values
     })
  └─ This sends a confirmation email to the user

Step 5: HubSpot tracking (_hsq)
  └─ _hsq.push(['identify', {
       email, firstname, lastname, phone, company
     }])
  └─ _hsq.push(['trackPageView'])
  └─ _hsq.push(['trackCustomBehavioralEvent', {
       name: 'pe245755967_quote_submitted',
       properties: { service_type, facility_type, facility_size }
     }])

Step 6: HubSpot Forms API (CRM record)
  └─ fetch POST to api.hsforms.com/submissions/v3/integration/submit/{portalId}/{formGuid}
  └─ Janitorial GUID: 20c9de1e-4067-4961-9cda-3af11efe7fc3
  └─ Day Porter GUID: 6aa21f22-e7f5-4f9f-9286-63381a497590
  └─ Fields: firstname, lastname, email, phone, company, message (service details)
  └─ Context: hutk cookie, pageUri, pageName
  └─ Auto-creates contact + form submission record in HubSpot

Step 7: GA4 event
  └─ gtag('event', 'quote_submitted', { form_type: 'janitorial' })

Step 8: Show success panel
  └─ Display reference number + next steps
  └─ Clear localStorage
```

### Careers Form

Simple HTML form → `https://formsubmit.co/info@eccofacilities.com` (POST).
No EmailJS confirmation. No HubSpot tracking beyond page visit.

### Newsletter (Footer)

Hidden form → MailChimp endpoint (`eccofacilities.us22.list-manage.com`).
Present on all pages in the footer.

---

## 6. Chat Widget Architecture (removed)

**Removed 2026-07-18.** The AI chat widget (`js/chat-widget.js`, 58 KB self-contained JS + injected CSS, Claude API proxy on Vercel) was pre-Noir: no live page has loaded it since the Noir launch (2026-06-25), and the file was deleted in the legacy purge. Its backends — `chat-backend/` (Vercel serverless) and `server/` (Express alternative) — are still in the repo as **legacy code with zero consumers** and are candidates for a future cleanup. The original architecture is preserved in git history.

---

## 7. SEO Setup

### Schema.org (JSON-LD on index.html)

**LocalBusiness:**
- Name: Ecco Facilities LLC
- Email: info@eccofacilities.com
- Address: Albany, NY 12207
- Geo: 40.7128, -74.0060
- Opening Hours: Mon-Fri 8am-6pm, Sat 9am-2pm
- Service Area: Manhattan, Brooklyn, Queens, Bronx, Staten Island
- Services: Janitorial Services, Day Porter Services
- Payment: Cash, Check, Credit Card, Invoice

**FAQPage:** 6 Q&A pairs on homepage

**Open Graph + Twitter Cards:** On all main pages

### sitemap.xml
- 23 URLs with priorities and change frequencies
- Submitted to Google Search Console
- Referenced in robots.txt

### robots.txt
```
User-agent: *
Allow: /
Disallow: /admin/
Sitemap: https://eccofacilities.com/sitemap.xml
```

### Google Search Console
- Domain property verified via Cloudflare DNS (TXT record)
- Sitemap submitted (April 2026)

### Google Business Profile
- Set up with 5 NYC boroughs
- 24/7 operating hours
- No phone number listed (by choice)

---

## 8. Security & Privacy

### Cloudflare Headers (`_headers` file)
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy` — whitelists only required domains
- `Permissions-Policy` — blocks camera, microphone, geolocation, payment

### Cookie Consent (`js/cookie-consent.js`)
- **GPC (Global Privacy Control):** Auto-declines cookies if `navigator.globalPrivacyControl === true`
- **Banner:** Accept / Decline buttons, appears after 1 second
- **Storage:** `ecco_cookies` in localStorage (`accepted` or `declined`)
- **HubSpot:** Pushes `['doNotTrack']` if declined
- **CCPA 2026 compliant**

### Form Security
- Honeypot field (`fWebsite`) on quote forms
- CORS headers via Cloudflare
- Rate limiting on chat widget (20 messages/session)
- CSP restricts form actions to FormSubmit + MailChimp

---

## 9. CMS (Decap)

**Admin URL:** `eccofacilities.com/admin/`

**Backend:** GitHub (requires OAuth app)

**Configuration (`admin/config.yml`):**
```yaml
backend:
  name: github
  repo: alexyordan1/ecco-facilities-website
  branch: main
media_folder: images/stock
collections:
  - name: blog
    folder: blog
    create: true
    extension: html
    format: frontmatter
```

**Status:** OAuth not yet configured (pending GitHub OAuth App creation for Cloudflare Pages).

**Workflow:** Edit in admin → commits to GitHub → auto-deploys to Cloudflare.

---

## 10. CSS/JS Conventions

### Design System (Noir — full spec in `DESIGN.md`)

| Token | Value | Usage |
|-------|-------|-------|
| `--accent` | `#9FCB7B` | Brand green (swap-only accent block at top of source) |
| `--black` | `#0C0E0D` | Page background |
| `--surface-1/2/3` | `#101312` / `#161A18` / `#1D2220` | Raised surfaces |
| `--ink` | `#F4F2EC` | Primary text |
| `--ink-dim` | `#A8A89F` | Secondary text |
| Font display | Fraunces | Serif for headings |
| Font body | Inter | Sans-serif for body text |

Token source of truth: `:root{}` at the top of `css/noir.source.css`. The site is dark-only (`color-scheme: dark`).

### Versions (live)
- CSS: `noir.css?v=26` · `quote-noir.css?v=63` · `crm.css?v=4.3`
- JS: `site.js?v=4` · `quote-flow.js?v=39.22` · `cookie-consent.js?v=1.5` · `crm-*.js?v=4.1–4.2`
- **Rule:** Bump `?v=` in the same commit as CSS/JS changes (busters don't apply to deleted files)
- Known drift: the 7 `blog/` posts still load `site.js?v=3` (pending fix)

### Minification
- Workflow: edit `css/noir.source.css` (tracked master) → minify to `css/noir.css` → bump `?v=` in the same commit
- **Always use:** `bunx clean-css-cli` (fallback: `npx clean-css-cli`)
- **Never use:** Python or Perl regex for minification
- **Inspect the output:** clean-css has silently dropped a leading `@layer …; :root{}` line before — verify tokens survived after every minify

### Code Rules
- Zero inline styles — all styling through CSS classes
- ARIA attributes must be viewport-aware (`matchMedia`)
- Touch targets minimum 44px with `display: inline-flex`
- No `console.log` in production code
- Container elements need `overflow: hidden`
- All new CSS components need base + mobile + desktop styles

---

## 11. Cloudflare Configuration

### _headers
- Security headers on all routes (`/*`)
- Image cache: 1 year, immutable
- CSS/JS cache: 30 days
- HTML cache: 1 hour, must-revalidate

### _redirects
```
/contact.html    /quote.html    301
/contact         /quote.html    301
```

### DNS
- Nameservers: `howard.ns.cloudflare.com`, `paloma.ns.cloudflare.com`
- DNSSEC: DS records deleted from GoDaddy (was blocking propagation)
- TXT record for Google Search Console verification

### Pages Settings
- Production branch: `main`
- Build: static (no build command needed)
- Root directory: `/` (all files served as-is)

---

## 12. Deployment Workflow

```
1. Edit files locally (or via Decap CMS admin)
2. git add <files>
3. git commit -m "description"
4. git push origin main
5. Cloudflare auto-detects push (~30 seconds)
6. Site live at eccofacilities.com
7. Verify on .pages.dev URL (hard refresh)
8. Check real device for layout changes
```

**Preview:** Cloudflare creates preview deploys for non-main branches.

**Rollback:** Cloudflare dashboard → Deployments → revert to any previous deploy.

---

## 13. Change Log

### July 18, 2026
- Legacy pre-Noir purge: deleted `css/styles.css`, `css/components.css`, `css/quote-flow.css`, `js/chat-widget.js` — all verified zero consumers across every tracked HTML/JS (`js/main.js` removed earlier the same day)
- Rewrote structure/version sections of this doc and `HANDOFF.md` to the live Noir architecture; obsolescence banner added to `DESIGN-SYSTEM.md`
- (Noir launch 2026-06-25 and the quote/CRM backend work of June–July are documented in `DESIGN.md`, `PRODUCT.md`, and git history; this changelog was dormant April→July)

### April 4, 2026
- HubSpot Forms API integrated: quote-janitorial.html + quote-dayporter.html
- Created 2 HubSpot forms (Janitorial: 20c9de1e, Day Porter: 6aa21f22) with auto-contact creation
- Each quote submission now sends to: FormSubmit (email) + EmailJS (confirmation) + HubSpot _hsq (tracking) + HubSpot Forms API (CRM record) + GA4 (analytics)
- Created 2 SEO blog posts: `commercial-cleaning-checklist-nyc.html`, `dirty-office-costs-productivity.html`
- Updated blog.html with new post cards
- Updated sitemap.xml (added 2 blog URLs, total 23)
- Fixed sitemap.xml: removed XSL stylesheet reference (broke Google Search Console parsing)
- Google Search Console: verified domain, submitted sitemap
- GA4: changed timezone from Los Angeles to Eastern (NYC)
- Google Business Profile: confirmed 24/7 hours, removed phone number, verified 5 boroughs

### April 1, 2026
- Git repo created + pushed to GitHub
- Cloudflare Pages deploy (live at .pages.dev)
- DNS nameservers changed to Cloudflare
- DNSSEC DS records deleted (was blocking propagation)
- GTM, GA4, Clarity activated on all 20+ pages
- GA4 tag published in GTM
- Accessibility page created
- WCAG audit + fixes (heading hierarchy, aria-labels)
- Schema LocalBusiness completed
- Cloudflare `_headers` + `_redirects` configured
- GPC cookie consent (CCPA 2026 compliant)
- Decap CMS admin panel setup
- HubSpot pipeline verified
- Looker Studio account created + GA4 connected

### Pre-April 2026 (Build Phase)
- 21 HTML pages built from scratch (vanilla HTML/CSS/JS)
- Multi-step quote wizards with FormSubmit + EmailJS
- AI chat widget with Claude API backend on Vercel
- Footer modernized: layered design, 4-col grid, social icons, newsletter
- Premium UI/UX upgrade: 3 phases (a11y, visual polish, form UX)
- Services page v3.3: tabbed comparison, trust strip
- Quote wizard bug fixes, UX improvements, CSS rewrite
- iOS Safari zoom fix: font-size 1rem, maximum-scale=1.0
- 8 anchor links fixed across pages

---

## Pending Items

### Priority 1 — Infrastructure
1. Add `www.eccofacilities.com` as custom domain in Cloudflare Pages
2. ~~Connect forms to HubSpot Forms API~~ DONE (Apr 4, 2026)
3. Looker Studio dashboard (needs accumulated GA4 data)

### Priority 2 — Content
4. Write 2 blog posts per month (SEO strategy)
5. Google Business Profile: add services, attributes, images, first post

### Priority 3 — Configuration
6. Decap CMS: create GitHub OAuth App for admin login
7. Cloudflare Turnstile: bot protection on forms (needs active domain)
8. HubSpot email sequences (requires Sales Hub Professional)

### Priority 4 — Future
9. Citations: register on Yelp, BBB, Angi, Thumbtack
10. A/B testing on CTAs and form steps
11. Email marketing via Mailchimp (newsletter content)
