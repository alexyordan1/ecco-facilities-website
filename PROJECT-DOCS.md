# ECCO FACILITIES LLC - Project Documentation

**Domain:** eccofacilities.com
**Hosting:** Cloudflare Pages (auto-deploy from GitHub)
**Repository:** github.com/alexyordan1/ecco-facilities-website (branch: main)
**Stack:** Static HTML/CSS/JS (vanilla, no framework)
**Last Updated:** April 4, 2026

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [File Inventory](#2-file-inventory)
3. [External Services & IDs](#3-external-services--ids)
4. [How Everything Connects](#4-how-everything-connects)
5. [Form Submission Flow](#5-form-submission-flow)
6. [Chat Widget Architecture](#6-chat-widget-architecture)
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
   23 HTML    CSS/JS      Images    Config     Server       Admin
    pages    (vanilla)    (WebP)   files      (chat)       (CMS)
```

**Data Flow:**
```
User visits site
  ├─→ GTM loads → fires GA4 + Clarity tags
  ├─→ HubSpot tracking script loads → identifies returning visitors
  ├─→ Cookie consent banner → respects GPC signal
  │
User fills quote form
  ├─→ FormSubmit.co → email to info@eccofacilities.com (primary delivery)
  ├─→ EmailJS → confirmation email to the user
  ├─→ HubSpot _hsq → identifies contact in CRM
  └─→ GA4 dataLayer → tracks quote_submitted event
  │
User opens chat
  └─→ chat-widget.js → POST to ecco-chat-backend.vercel.app → Claude API → response
```

---

## 2. File Inventory

### Pages (23 total)

| File | Purpose | Priority |
|------|---------|----------|
| `index.html` | Homepage: hero, services, stats, testimonials, FAQ | 1.0 |
| `services.html` | Services overview with tabbed comparison | 0.9 |
| `janitorial.html` | Janitorial service detail page | 0.9 |
| `day-porter.html` | Day Porter service detail page | 0.9 |
| `quote.html` | Quote landing — links to specific forms | 0.9 |
| `quote-janitorial.html` | Multi-step janitorial quote wizard (8 steps) | 0.8 |
| `quote-dayporter.html` | Multi-step day porter quote wizard (10 steps) | 0.8 |
| `about.html` | Company story, team values | 0.8 |
| `why-ecco.html` | Value proposition, differentiators | 0.7 |
| `sustainability.html` | Eco-certified products, green initiatives | 0.7 |
| `testimonials.html` | Customer testimonials, case studies | 0.7 |
| `careers.html` | Job listings + application form | 0.6 |
| `blog.html` | Blog index/listing page | 0.7 |
| `blog/5-signs-cleaning-company.html` | Blog post | 0.5 |
| `blog/eco-certified-cleaning-matters.html` | Blog post | 0.5 |
| `blog/janitorial-vs-day-porter.html` | Blog post | 0.5 |
| `blog/commercial-cleaning-checklist-nyc.html` | Blog post (Apr 2026) | 0.5 |
| `blog/dirty-office-costs-productivity.html` | Blog post (Apr 2026) | 0.5 |
| `privacy.html` | Privacy policy (CCPA 2026 compliant) | 0.3 |
| `terms.html` | Terms of service | 0.3 |
| `accessibility.html` | WCAG 2.1 AA accessibility statement | 0.3 |
| `sitemap.html` | HTML sitemap for users | 0.4 |
| `404.html` | Custom error page | — |

### CSS

| File | Size | Notes |
|------|------|-------|
| `css/styles.css` | 104 KB | Minified production (v5.1) |
| `css/styles.original.css` | 130 KB | Unminified source |

### JavaScript

| File | Size | Notes |
|------|------|-------|
| `js/main.js` | 16 KB | Core site functionality (v2.2) |
| `js/main.original.js` | 4.8 KB | Original source |
| `js/chat-widget.js` | 19 KB | AI chat widget (self-contained) |
| `js/chat-widget.original.js` | 22 KB | Original source |
| `js/cookie-consent.js` | 1.3 KB | Cookie banner + GPC |

### Configuration

| File | Purpose |
|------|---------|
| `sitemap.xml` | XML sitemap (23 URLs) |
| `robots.txt` | Crawl rules, blocks /admin/ |
| `_headers` | Cloudflare security headers + cache |
| `_redirects` | /contact → /quote redirect |
| `admin/config.yml` | Decap CMS configuration |
| `.claude/launch.json` | Local dev server config |

### Server / Backend

| File | Purpose |
|------|---------|
| `chat-backend/api/chat.js` | Vercel serverless — Claude API proxy |
| `chat-backend/vercel.json` | Vercel deployment config |
| `server/server.js` | Express.js chat server (alternative) |
| `serve.js` | Local Node.js dev server |
| `serve.py` | Local Python dev server |

### Other

| File | Purpose |
|------|---------|
| `HANDOFF.md` | Original project brief |
| `emailjs-template.html` | EmailJS template reference |
| `mobile-test.html` | Mobile responsiveness test |
| `index-reference.html` | Backup/reference homepage |

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
       ├──→ Google Fonts → DM Sans + Cormorant Garamond
       │
       └──→ EmailJS CDN → Client-side email library

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

## 6. Chat Widget Architecture

**File:** `js/chat-widget.js` (self-contained: JS + injected CSS)

**API Endpoint:** `https://ecco-chat-backend.vercel.app/api/chat`

**Backend:** Vercel serverless function (`chat-backend/api/chat.js`)
- Proxies requests to Claude API (Anthropic)
- Environment variable: `ANTHROPIC_API_KEY`

**Features:**
- Conversation history (array of `{role, content}`)
- Rate limiting: 20 messages per session
- Keyboard shortcuts: `Ctrl+K` toggle, `Escape` close
- Auto-resize textarea
- Typing indicator animation
- 50+ fallback Q&A pairs if API is down
- Mobile-responsive (full width on small screens)

**UI Position:**
- Toggle button: bottom-right corner (z-index 999)
- Chat panel: 400px x 580px max (z-index 998)
- Floating CTA "Free Quote" button: bottom-left corner

**Analytics:** Fires `chat_open` GA4 event when toggled.

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

### Design System

| Token | Value | Usage |
|-------|-------|-------|
| `--navy` | `#0B1D38` | Primary dark color |
| `--blue` | `#3068AD` | Primary brand blue |
| `--green` | `#2D7A32` | Eco/sustainability accent |
| `--wh` | `#FFFFFF` | White |
| Font heading | Cormorant Garamond | Serif for headings |
| Font body | DM Sans | Sans-serif for body text |

### Versions
- CSS: `styles.css?v=5.1`
- JS: `main.js?v=2.2`
- **Rule:** Bump `?v=` in the same commit as CSS/JS changes

### Minification
- **Always use:** `npx clean-css-cli` for CSS
- **Never use:** Python regex for minification
- Original files kept as `*.original.css` / `*.original.js`

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
