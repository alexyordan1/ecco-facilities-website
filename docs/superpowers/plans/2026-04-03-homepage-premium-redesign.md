# Homepage Premium Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the eccofacilities.com homepage into a 12-section Trust-First Funnel with 8 premium components, animated counters, certification badges, before/after comparison, and enhanced CTA.

**Architecture:** Static HTML/CSS/JS site. All changes in 3 files: `css/styles.original.css` (new components + mobile breakpoints), `js/main.js` (counter animation + accordion), `index.html` (full section restructure). Then minify CSS, bump cache busters on all 25 HTML pages, commit, push, verify live.

**Tech Stack:** HTML5, CSS3 (DM Sans + Cormorant Garamond), vanilla JS (IntersectionObserver), npx clean-css-cli for minification, Cloudflare Pages for deploy.

**Project rules (from memory — mandatory):**
- Zero inline styles — all styling via CSS classes
- CSS minification ONLY via `npx clean-css-cli` (never Python regex)
- Cache busters `?v=` bumped on ALL pages in the SAME commit as CSS/JS changes
- Every new CSS component needs base + mobile + desktop styles
- Container elements need `overflow: hidden`
- Touch targets 44px minimum with `display: inline-flex`
- IntersectionObserver must have `setTimeout(3000)` fallback
- Never use `rv-light` or `rv-child` on critical content
- No `console.log` in production code
- Verify on LIVE site after deploy, not just local preview

**Key finding from pre-plan research:**
- `.trust-bar` CSS is used by `why-ecco.html` — KEEP in CSS
- `.test-card`/`.test-grid` CSS is used by `testimonials.html` — KEEP in CSS
- `.ind-grid`/`.ind-item` CSS is used by `services.html` — KEEP in CSS
- NO dead CSS cleanup needed — only ADD new rules

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `css/styles.original.css` | Modify | Add ~30 new CSS classes + mobile breakpoints |
| `css/styles.css` | Regenerate | Minified output from clean-css-cli |
| `js/main.js` | Modify | Add counter animation + industries accordion |
| `index.html` | Modify | Full section restructure (12 sections) |
| `*.html` (25 files) | Modify | Cache buster bump `?v=3.5` / `?v=1.5` |
| `.gitignore` | Modify | Add `.superpowers/` |

---

## Task 1: Add new CSS utility classes

**Files:**
- Modify: `css/styles.original.css` (add after the existing utility section, before media queries)

- [ ] **Step 1.1: Add inline-style-extraction utilities**

Add these rules after the existing `.sec-head` rules (around line 200 area) in `css/styles.original.css`:

```css
/* ============================================================
   UTILITY — INLINE STYLE EXTRACTION
   ============================================================ */
.sec-white { background: var(--wh); }
.sec-cta-wrap { text-align: center; margin-top: 2rem; }
.hero-email { margin-top: .8rem; font-size: .85rem; color: rgba(255,255,255,.65); }
.hero-email a { color: rgba(255,255,255,.85); text-decoration: underline; }
```

- [ ] **Step 1.2: Add featured testimonial CSS**

```css
/* ============================================================
   FEATURED TESTIMONIAL
   ============================================================ */
.feat-test { text-align: center; max-width: 800px; margin: 0 auto; padding: 3rem 1.5rem; }
.feat-test-mark { font-size: 4rem; line-height: 1; color: var(--green); font-family: 'Cormorant Garamond', serif; margin-bottom: .5rem; }
.feat-test-quote { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 500; line-height: 1.6; color: var(--navy); font-style: italic; margin-bottom: 1.5rem; }
.feat-test-author { display: flex; align-items: center; justify-content: center; gap: .75rem; }
.feat-test-av { width: 48px; height: 48px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 1.1rem; flex-shrink: 0; }
.feat-test-name { font-size: .9rem; font-weight: 600; color: var(--navy); }
.feat-test-role { font-size: .78rem; color: var(--tm); }
```

- [ ] **Step 1.3: Add certification badges CSS**

```css
/* ============================================================
   CERTIFICATION BADGES
   ============================================================ */
.cert-strip { display: flex; flex-wrap: wrap; justify-content: center; gap: 2rem; max-width: var(--mw); margin: 0 auto; padding: 2.5rem 1.5rem; }
.cert-badge { display: flex; flex-direction: column; align-items: center; gap: .5rem; }
.cert-badge-ico { width: 40px; height: 40px; display: inline-flex; align-items: center; justify-content: center; color: var(--navy); }
.cert-badge-label { font-size: .75rem; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: var(--navy); text-align: center; }
```

- [ ] **Step 1.4: Add before/after comparison CSS**

```css
/* ============================================================
   BEFORE / AFTER COMPARISON
   ============================================================ */
.ba-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; max-width: var(--mw); margin: 0 auto; overflow: hidden; }
.ba-col { padding: 2rem; border-radius: var(--r); }
.ba-col-bad { background: #fff5f5; border-left: 3px solid #dc3545; }
.ba-col-good { background: #f0fdf4; border-left: 3px solid #16a34a; }
.ba-col h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 1.2rem; }
.ba-col-bad h3 { color: #dc3545; }
.ba-col-good h3 { color: #16a34a; }
.ba-item { display: flex; align-items: flex-start; gap: .6rem; margin-bottom: .8rem; font-size: .9rem; line-height: 1.5; color: var(--tb); }
.ba-ico { flex-shrink: 0; font-weight: 700; font-size: 1rem; }
.ba-col-bad .ba-ico { color: #dc3545; }
.ba-col-good .ba-ico { color: #16a34a; }
```

- [ ] **Step 1.5: Add industries showcase CSS**

```css
/* ============================================================
   INDUSTRIES SHOWCASE (ACCORDION)
   ============================================================ */
.ind-showcase { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; max-width: 900px; margin: 0 auto; overflow: hidden; }
.ind-card { background: var(--wh); border: 1px solid var(--bl); border-radius: var(--r); cursor: pointer; transition: all .35s var(--ease); overflow: hidden; }
.ind-card:hover { border-color: var(--navy); transform: translateY(-3px); box-shadow: var(--shlg); }
.ind-card-head { display: flex; align-items: center; gap: .75rem; padding: 1.2rem 1rem; min-height: 44px; }
.ind-card-head .ind-ico { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; color: var(--navy); flex-shrink: 0; transition: transform .3s var(--ease); }
.ind-card:hover .ind-card-head .ind-ico { transform: scale(1.15); }
.ind-card-head span { font-size: .82rem; font-weight: 600; color: var(--navy); }
.ind-card-body { max-height: 0; overflow: hidden; transition: max-height .4s var(--ease), padding .4s var(--ease); padding: 0 1rem; }
.ind-card-body p { font-size: .82rem; color: var(--tb); line-height: 1.6; margin: 0; }
.ind-card-open .ind-card-body { max-height: 200px; padding: 0 1rem 1.2rem; }
.ind-card-open { border-color: var(--navy); box-shadow: var(--sh); }
```

- [ ] **Step 1.6: Add photo gallery CSS**

Uses two `.story-row` wrappers inside `.story-grid` to create the asymmetric pattern (Row 1: 2fr+1fr, Row 2: 1fr+2fr):

```css
/* ============================================================
   PHOTO GALLERY — SEE ECCO IN ACTION
   ============================================================ */
.story-grid { max-width: var(--mw); margin: 0 auto; overflow: hidden; display: flex; flex-direction: column; gap: 1rem; }
.story-row { display: grid; gap: 1rem; }
.story-row:first-child { grid-template-columns: 2fr 1fr; }
.story-row:last-child { grid-template-columns: 1fr 2fr; }
.story-img { width: 100%; height: 250px; object-fit: cover; border-radius: 12px; display: block; }
```

- [ ] **Step 1.7: Add CTA redesign CSS**

```css
/* ============================================================
   PREMIUM CTA — DUAL BUTTONS
   ============================================================ */
.cta-btns { display: flex; justify-content: center; gap: .75rem; flex-wrap: wrap; position: relative; z-index: 2; margin-top: 1.5rem; }
.btn-ol-white { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: .7rem 1.5rem; border: 2px solid rgba(255,255,255,.5); border-radius: var(--r); color: #fff; font-weight: 600; font-size: .9rem; text-decoration: none; transition: all .3s var(--ease); background: transparent; }
.btn-ol-white:hover { background: rgba(255,255,255,.1); border-color: #fff; }
```

- [ ] **Step 1.8: Add trust-strip avatar gradient classes**

```css
/* Trust strip avatar gradients */
.trust-av-1 { background: linear-gradient(135deg, #2D7A32, #1a5e1f); }
.trust-av-2 { background: linear-gradient(135deg, #C87830, #9e5a1e); }
.trust-av-3 { background: linear-gradient(135deg, #8244a8, #5e2d80); }
```

- [ ] **Step 1.9: Add mobile breakpoints for all new components**

Add inside the existing `@media (max-width: 600px)` block:

```css
  .feat-test-quote { font-size: 1.2rem; }
  .feat-test { padding: 2rem 1rem; }
  .cert-strip { gap: 1.5rem; padding: 2rem 1rem; }
  .ba-grid { grid-template-columns: 1fr; }
  .ind-showcase { grid-template-columns: 1fr; }
  .story-row, .story-row:first-child, .story-row:last-child { grid-template-columns: 1fr; }
  .story-img { height: 200px; }
  .hero-stats { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; text-align: center; }
  .cta-btns { flex-direction: column; align-items: center; }
```

Add inside the existing `@media (max-width: 768px)` block (or nearest tablet breakpoint):

```css
  .ind-showcase { grid-template-columns: repeat(2, 1fr); }
```

- [ ] **Step 1.10: Update `.cta-trust` to include extracted inline styles**

Find the existing `.cta-trust` rule in styles.original.css and add `position: relative; z-index: 2;` to it. If it doesn't exist, create it:

```css
.cta-trust { position: relative; z-index: 2; }
```

- [ ] **Step 1.11: Commit CSS changes**

```bash
cd "/Users/yoelvismercedes/Downloads/Ecco Webside"
git add css/styles.original.css
git commit -m "feat(css): add 30+ new classes for homepage premium redesign

Featured testimonial, cert badges, before/after comparison,
industries accordion, photo gallery, premium CTA, mobile breakpoints.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Add JavaScript — counter animation + industries accordion

**Files:**
- Modify: `js/main.js`

- [ ] **Step 2.1: Add hero stats counter animation**

Add this at the end of `js/main.js`, before any closing IIFE bracket or at the end of file:

```javascript
/* ============================================================
   HERO STATS — COUNTER ANIMATION
   ============================================================ */
(function initCounters() {
  var counters = document.querySelectorAll('.hero-stat-num');
  if (!counters.length) return;
  var animated = false;

  function animateCounters() {
    if (animated) return;
    animated = true;
    counters.forEach(function(el) {
      var target = parseInt(el.getAttribute('data-target'), 10);
      var suffix = el.getAttribute('data-suffix') || '';
      var duration = 2000;
      var start = 0;
      var startTime = null;

      function step(ts) {
        if (!startTime) startTime = ts;
        var progress = Math.min((ts - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          animateCounters();
          observer.disconnect();
        }
      });
    }, { threshold: 0.3 });
    observer.observe(counters[0].closest('.hero-stats'));
  }

  /* Mandatory fallback — project rule */
  setTimeout(function() {
    if (!animated) {
      counters.forEach(function(el) {
        var target = el.getAttribute('data-target');
        var suffix = el.getAttribute('data-suffix') || '';
        el.textContent = target + suffix;
      });
      animated = true;
    }
  }, 3000);
})();
```

- [ ] **Step 2.2: Add industries accordion**

```javascript
/* ============================================================
   INDUSTRIES ACCORDION
   ============================================================ */
(function initIndustryAccordion() {
  var cards = document.querySelectorAll('.ind-card');
  if (!cards.length) return;

  cards.forEach(function(card) {
    card.addEventListener('click', function() {
      var wasOpen = card.classList.contains('ind-card-open');
      cards.forEach(function(c) { c.classList.remove('ind-card-open'); });
      if (!wasOpen) card.classList.add('ind-card-open');
    });
  });
})();
```

- [ ] **Step 2.3: Verify no `console.log` in new code**

```bash
grep -n "console.log" js/main.js
```

Expected: no matches in the new code we added.

- [ ] **Step 2.4: Commit JS changes**

```bash
cd "/Users/yoelvismercedes/Downloads/Ecco Webside"
git add js/main.js
git commit -m "feat(js): add counter animation + industries accordion

Counter uses IntersectionObserver with 3s setTimeout fallback.
Accordion: click to expand, only one open at a time.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Restructure index.html — Hero + Hero Stats

**Files:**
- Modify: `index.html`

- [ ] **Step 3.1: Add `maximum-scale=1.0` to viewport meta**

In `index.html` line 9, change:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```
to:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
```

- [ ] **Step 3.2: Replace trust-bar with hero-stats inside hero section**

Delete the entire `.trust-bar` div (lines 158-164):
```html
<div class="trust-bar">
  <div class="trust-i"><span class="trust-num">12+</span>Years Serving NYC</div>
  ...
</div>
```

Add hero-stats inside the hero section, right after `</div><!-- .hero-content -->` and before `</section>`:

```html
    <div class="hero-stats">
      <span><span class="hero-stat-num" data-target="12" data-suffix="+">0</span> Years Serving NYC</span>
      <span><span class="hero-stat-num" data-target="200" data-suffix="+">0</span> Businesses Trust Us</span>
      <span><span class="hero-stat-num" data-target="5" data-suffix="">0</span> Boroughs Covered</span>
      <span><span class="hero-stat-num" data-target="0" data-suffix="">0</span> Missed Services</span>
    </div>
```

- [ ] **Step 3.3: Extract hero email inline styles**

Change line 154 from:
```html
<p style="margin-top:.8rem;font-size:.85rem;color:rgba(255,255,255,.65)">Or email <a href="mailto:info@eccofacilities.com" style="color:rgba(255,255,255,.85);text-decoration:underline">info@eccofacilities.com</a> — we respond same day</p>
```
to:
```html
<p class="hero-email">Or email <a href="mailto:info@eccofacilities.com">info@eccofacilities.com</a> — we respond same day</p>
```

---

## Task 4: Add Featured Testimonial section

**Files:**
- Modify: `index.html`

- [ ] **Step 4.1: Add featured testimonial after hero section**

Insert immediately after the closing `</section>` of the hero:

```html
<section class="sec sec-cream">
  <div class="feat-test rv">
    <div class="feat-test-mark" aria-hidden="true">"</div>
    <p class="feat-test-quote">We went through 3 cleaning companies in 2 years. All the same story — great pitch, terrible follow-through. Ecco is the first company that actually does what they promise. Same team every time, same standard, zero missed visits in 8 months.</p>
    <div class="feat-test-author">
      <div class="feat-test-av feat-av-jw">J</div>
      <div>
        <div class="feat-test-name">James Whitfield</div>
        <div class="feat-test-role">Building Manager, The Avalon Residences</div>
      </div>
    </div>
  </div>
</section>
```

**CSS class needed** (add in Task 1.2 alongside the other `.feat-test` rules):
```css
.feat-av-jw { background: linear-gradient(135deg, #3068AD, #1E3562); }
```

---

## Task 5: Add Certification Badges section

**Files:**
- Modify: `index.html`

- [ ] **Step 5.1: Add cert badges after featured testimonial**

```html
<section class="sec sec-white">
  <div class="cert-strip rv">
    <div class="cert-badge">
      <div class="cert-badge-ico" aria-hidden="true"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg></div>
      <span class="cert-badge-label">Green Seal Certified</span>
    </div>
    <div class="cert-badge">
      <div class="cert-badge-ico" aria-hidden="true"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66L7 18"/><path d="M12.73 2.27A10 10 0 0 1 21 11c-2 0-7-1-9-5l-1.34 1.34"/><path d="M17 8c.24 2.51.76 4.93 1.76 7"/></svg></div>
      <span class="cert-badge-label">EPA Safer Choice</span>
    </div>
    <div class="cert-badge">
      <div class="cert-badge-ico" aria-hidden="true"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><polyline points="9 14 11 16 15 12"/></svg></div>
      <span class="cert-badge-label">Insured & Bonded</span>
    </div>
    <div class="cert-badge">
      <div class="cert-badge-ico" aria-hidden="true"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><polyline points="16 3 18 5 22 1"/></svg></div>
      <span class="cert-badge-label">Background Checked</span>
    </div>
    <div class="cert-badge">
      <div class="cert-badge-ico" aria-hidden="true"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><path d="M9 22v-4h6v4"/></svg></div>
      <span class="cert-badge-label">NYC Licensed</span>
    </div>
  </div>
</section>
```

---

## Task 6: Keep "What We Do" + Extract inline styles

**Files:**
- Modify: `index.html`

- [ ] **Step 6.1: Extract inline style from How It Works section**

Change the How It Works section tag from:
```html
<section class="sec" id="how-it-works" style="background:var(--wh)">
```
to:
```html
<section class="sec sec-white" id="how-it-works">
```

- [ ] **Step 6.2: Extract button wrapper inline styles**

Find all 4 occurrences of button wrappers with inline styles and replace:

Each instance of:
```html
<div style="text-align:center;margin-top:2rem">
```
or:
```html
<div style="text-align:center;margin-top:2.5rem"
```
Replace with:
```html
<div class="sec-cta-wrap">
```

(There are 4 instances: after How It Works steps, after Industries, after Safe for Everyone, after Testimonials. Some will be in sections that are being replaced, so only apply to sections that survive.)

---

## Task 7: Add Before/After Ecco section

**Files:**
- Modify: `index.html`

- [ ] **Step 7.1: Remove old "The Ecco Standard" section (`.problem-sec`)**

Delete the entire `<section class="problem-sec">...</section>` block (old lines 174-189).

- [ ] **Step 7.2: Remove old "The Ecco Difference" section (`.val-grid`)**

Delete the entire `<section class="sec sec-cream">` that contains `.val-grid` (old lines 243-251).

- [ ] **Step 7.3: Insert Before/After section after "What We Do"**

```html
<section class="sec sec-white">
  <div class="sec-head rv"><span class="sec-lbl">Why Ecco</span><h2 class="sec-ttl">Not all cleaning companies are created equal.</h2></div>
  <div class="ba-grid">
    <div class="ba-col ba-col-bad">
      <h3>What Most Companies Deliver</h3>
      <div class="ba-item"><span class="ba-ico" aria-hidden="true">✗</span><span>Random crews every visit — nobody knows your space</span></div>
      <div class="ba-item"><span class="ba-ico" aria-hidden="true">✗</span><span>Harsh chemical products that irritate and linger</span></div>
      <div class="ba-item"><span class="ba-ico" aria-hidden="true">✗</span><span>Hidden fees and surprise charges on every invoice</span></div>
      <div class="ba-item"><span class="ba-ico" aria-hidden="true">✗</span><span>Missed visits with no accountability or follow-up</span></div>
      <div class="ba-item"><span class="ba-ico" aria-hidden="true">✗</span><span>Cookie-cutter service plans that ignore your needs</span></div>
      <div class="ba-item"><span class="ba-ico" aria-hidden="true">✗</span><span>Slow or no response when issues arise</span></div>
    </div>
    <div class="ba-col ba-col-good">
      <h3>The Ecco Standard</h3>
      <div class="ba-item"><span class="ba-ico" aria-hidden="true">✓</span><span>Your dedicated team every visit — they know your space</span></div>
      <div class="ba-item"><span class="ba-ico" aria-hidden="true">✓</span><span>100% eco-certified products safe for everyone</span></div>
      <div class="ba-item"><span class="ba-ico" aria-hidden="true">✓</span><span>Transparent flat-rate pricing — no surprises</span></div>
      <div class="ba-item"><span class="ba-ico" aria-hidden="true">✓</span><span>Zero missed services — guaranteed</span></div>
      <div class="ba-item"><span class="ba-ico" aria-hidden="true">✓</span><span>Custom plans built for your specific space</span></div>
      <div class="ba-item"><span class="ba-ico" aria-hidden="true">✓</span><span>Same-day response from your account team</span></div>
    </div>
  </div>
</section>
```

---

## Task 8: Add Trust Strip section

**Files:**
- Modify: `index.html`

- [ ] **Step 8.1: Remove old testimonials grid section**

Delete the entire old `<section class="sec sec-navy">` that contains `.test-grid` with the 4 testimonial cards.

- [ ] **Step 8.2: Insert Trust Strip after Before/After**

```html
<section class="sec sec-cream">
  <div class="sec-head rv"><span class="sec-lbl">Client Stories</span><h2 class="sec-ttl">Trusted by businesses across every borough.</h2></div>
  <div class="trust-strip rv">
    <div class="trust-quote">
      <p class="trust-quote-text">"Several employees have asthma and allergies. Since switching to Ecco, we've had zero complaints about chemical odors. The space is spotless and the air actually feels cleaner."</p>
      <p class="trust-quote-author">David Chen</p>
      <p class="trust-quote-role">Operations Director, Meridian Capital Group</p>
    </div>
    <div class="trust-quote">
      <p class="trust-quote-text">"Our members expect a gym that's spotless at 6 AM and still clean at 9 PM. Ecco handles both — janitorial overnight and a day porter during peak hours. Complaint tickets dropped to zero."</p>
      <p class="trust-quote-author">Marcus Williams</p>
      <p class="trust-quote-role">Owner, Peak Performance Gym Brooklyn</p>
    </div>
    <div class="trust-quote">
      <p class="trust-quote-text">"Our patients include children and elderly individuals with respiratory conditions. Ecco's eco-friendly products give us clinical-grade cleanliness without exposing anyone to harsh chemicals."</p>
      <p class="trust-quote-author">Dr. Patricia Morales</p>
      <p class="trust-quote-role">Practice Owner, East Side Family Health</p>
    </div>
  </div>
</section>
```

---

## Task 9: Redesign Industries section

**Files:**
- Modify: `index.html`

- [ ] **Step 9.1: Replace the old `.ind-grid` with `.ind-showcase` accordion**

Replace the entire Industries section content (keep the `<section>` wrapper and `sec-head`):

```html
<section class="sec sec-cream">
  <div class="sec-head rv"><span class="sec-lbl">Industries We Serve</span><h2 class="sec-ttl">Trusted Across Every Industry</h2><p class="sec-sub">We understand that a medical office has different needs than a gym. That's why every Ecco contract is built from scratch for your specific environment.</p></div>
  <div class="ind-showcase rv">
    <div class="ind-card">
      <div class="ind-card-head"><div class="ind-ico" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg></div><span>Corporate Offices</span></div>
      <div class="ind-card-body"><p>Daily or nightly cleaning tailored to open-plan offices, private suites, conference rooms, and executive floors. Your team arrives to a spotless workspace every morning.</p></div>
    </div>
    <div class="ind-card">
      <div class="ind-card-head"><div class="ind-ico" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v18H3z"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg></div><span>Medical & Dental</span></div>
      <div class="ind-card-body"><p>Clinical-grade disinfection with non-toxic, eco-certified products. Safe for patients, staff, and sensitive medical equipment. HIPAA-conscious cleaning protocols.</p></div>
    </div>
    <div class="ind-card">
      <div class="ind-card-head"><div class="ind-ico" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg></div><span>Retail & Showrooms</span></div>
      <div class="ind-card-body"><p>Pristine floors, sparkling displays, and welcoming entrances. Day porter coverage during store hours keeps your retail space looking its best for every customer.</p></div>
    </div>
    <div class="ind-card">
      <div class="ind-card-head"><div class="ind-ico" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg></div><span>Gyms & Fitness</span></div>
      <div class="ind-card-body"><p>High-traffic equipment, locker rooms, and studio floors cleaned around the clock. Eco-friendly products that eliminate odors without harsh chemical residue.</p></div>
    </div>
    <div class="ind-card">
      <div class="ind-card-head"><div class="ind-ico" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></div><span>Schools & Daycares</span></div>
      <div class="ind-card-body"><p>Plant-based, non-toxic cleaning that's safe for children of all ages. Extra attention to bathrooms, cafeterias, and play areas where hygiene matters most.</p></div>
    </div>
    <div class="ind-card">
      <div class="ind-card-head"><div class="ind-ico" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg></div><span>Restaurants</span></div>
      <div class="ind-card-body"><p>Kitchen-grade cleanliness with food-safe products. Deep cleaning of dining areas, restrooms, and back-of-house spaces to meet health inspection standards.</p></div>
    </div>
    <div class="ind-card">
      <div class="ind-card-head"><div class="ind-ico" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div><span>Coworking Spaces</span></div>
      <div class="ind-card-body"><p>Shared spaces demand higher standards. Day porter services during business hours plus nightly deep cleaning keeps every desk, kitchen, and meeting room ready.</p></div>
    </div>
    <div class="ind-card">
      <div class="ind-card-head"><div class="ind-ico" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div><span>Residential Buildings</span></div>
      <div class="ind-card-body"><p>Lobby, hallway, and common area maintenance that residents notice. Day porters for high-rise buildings. Elevators, mailrooms, and laundry rooms included.</p></div>
    </div>
  </div>
  <div class="sec-cta-wrap rv"><a href="services.html" class="btn btn-outline">Explore Our Services →</a></div>
</section>
```

---

## Task 10: Add Photo Gallery section

**Files:**
- Modify: `index.html`

- [ ] **Step 10.1: Insert "See Ecco In Action" section after "Safe for Everyone"**

```html
<section class="sec sec-white">
  <div class="sec-head rv"><span class="sec-lbl">Our Work</span><h2 class="sec-ttl">See Ecco In Action</h2><p class="sec-sub">Real teams, real spaces, real results — across New York City.</p></div>
  <div class="story-grid rv">
    <div class="story-row">
      <img src="images/stock/1.webp" alt="Professional cleaner sanitizing an office workspace" class="story-img" loading="lazy">
      <img src="images/stock/2.webp" alt="Day porter maintaining a clean building corridor" class="story-img" loading="lazy">
    </div>
    <div class="story-row">
      <img src="images/stock/3.webp" alt="Ecco team member preparing eco-friendly cleaning supplies" class="story-img" loading="lazy">
      <img src="images/stock/careers-team.webp" alt="Ecco Facilities team ready for work" class="story-img" loading="lazy">
    </div>
  </div>
</section>
```

---

## Task 11: Redesign CTA Banner

**Files:**
- Modify: `index.html`

- [ ] **Step 11.1: Replace the old `.cta-banner` content**

Replace the entire `<div class="cta-banner">...</div>` with:

```html
<div class="cta-banner">
  <h2>Your custom proposal is one conversation away.</h2>
  <p>Tell us about your space. In 24 hours, you'll have a detailed, transparent proposal — built by our team, not a computer. No pressure. No obligation. No generic quotes.</p>
  <div class="cta-trust">
    <span>✓ 200+ NYC businesses trust us</span>
    <span>✓ Zero missed services</span>
    <span>✓ Satisfaction guaranteed</span>
  </div>
  <div class="cta-btns">
    <a href="quote.html" class="btn btn-white">Get Your Free Proposal →</a>
    <a href="mailto:info@eccofacilities.com" class="btn-ol-white">Email Us Directly</a>
  </div>
</div>
```

- [ ] **Step 11.2: Commit all HTML changes**

```bash
cd "/Users/yoelvismercedes/Downloads/Ecco Webside"
git add index.html
git commit -m "feat(html): restructure homepage to 12-section Trust-First Funnel

Replace 3 old sections with 5 new premium components:
- Hero stats with animated counters
- Featured testimonial (James Whitfield)
- Certification badges strip
- Before/After Ecco comparison
- Trust strip (3 client quotes)
- Industries accordion with descriptions
- Photo gallery
- Premium CTA with dual buttons

Extract all inline styles to CSS classes.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: Minify CSS + Bump all cache busters + Gitignore

**Files:**
- Regenerate: `css/styles.css`
- Modify: ALL 25 `.html` files
- Modify: `.gitignore`

- [ ] **Step 12.1: Minify CSS**

```bash
cd "/Users/yoelvismercedes/Downloads/Ecco Webside"
eval "$(/opt/homebrew/bin/brew shellenv)" && npx clean-css-cli -o css/styles.css css/styles.original.css
```

Verify the minified file exists and is smaller:
```bash
wc -c css/styles.original.css css/styles.css
```

- [ ] **Step 12.2: Bump CSS cache busters on ALL pages**

```bash
cd "/Users/yoelvismercedes/Downloads/Ecco Webside"
for f in *.html blog/*.html admin/*.html; do
  [ -f "$f" ] && sed -i '' 's|styles.css?v=3.4|styles.css?v=3.5|g' "$f"
done
```

Verify:
```bash
grep -r "styles.css?v=" *.html blog/*.html admin/*.html | grep -v "3.5" | head -5
```
Expected: no results (all bumped to 3.5).

- [ ] **Step 12.3: Bump JS cache busters on ALL pages**

```bash
cd "/Users/yoelvismercedes/Downloads/Ecco Webside"
for f in *.html blog/*.html admin/*.html; do
  [ -f "$f" ] && sed -i '' 's|main.js?v=1.4|main.js?v=1.5|g' "$f"
done
```

Verify:
```bash
grep -r "main.js?v=" *.html blog/*.html admin/*.html | grep -v "1.5" | head -5
```
Expected: no results (all bumped to 1.5).

- [ ] **Step 12.4: Add `.superpowers/` to `.gitignore`**

Append to `.gitignore`:
```
.superpowers/
```

- [ ] **Step 12.5: Final commit**

```bash
cd "/Users/yoelvismercedes/Downloads/Ecco Webside"
git add css/styles.css .gitignore
git add -A *.html blog/*.html admin/*.html
git commit -m "build: minify CSS v3.5, bump cache busters on all pages, gitignore .superpowers

CSS v3.4 → v3.5, JS v1.4 → v1.5 on all 25 HTML pages.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 13: Verify with local preview

- [ ] **Step 13.1: Start preview server**

```bash
cd "/Users/yoelvismercedes/Downloads/Ecco Webside"
eval "$(/opt/homebrew/bin/brew shellenv)" && npx http-server -p 8080 -c-1
```

Or use the configured launch.json preview.

- [ ] **Step 13.2: Visual verification**

Open `http://localhost:8080` and verify:
1. Hero stats counters animate on scroll
2. Featured testimonial shows with large serif quote
3. Certification badges display in row (wrap on mobile)
4. Before/After columns show red/green side by side
5. Trust strip shows 3 quotes in grid
6. Industries cards expand/collapse on click (only one open)
7. Photo gallery shows 4 images in asymmetric grid
8. CTA has 2 buttons (proposal + email)
9. No horizontal scroll on any section
10. FAQ still works (accordion open/close)

- [ ] **Step 13.3: Check console for errors**

Open DevTools → Console. Expected: zero errors.

- [ ] **Step 13.4: Test mobile responsive (375px)**

Resize to 375px width and verify:
1. Hero stats show 2x2 grid
2. Before/After stacks vertically
3. Industries show 1 column
4. Trust strip stacks to 1 column
5. Photo gallery stacks to 1 column
6. CTA buttons stack vertically
7. No content overflows viewport

---

## Task 14: Push and verify live

- [ ] **Step 14.1: Push to GitHub**

```bash
cd "/Users/yoelvismercedes/Downloads/Ecco Webside"
git push
```

- [ ] **Step 14.2: Wait for Cloudflare deploy**

Check deploy status. Wait for build to complete.

- [ ] **Step 14.3: Hard-refresh live site**

Navigate to `eccofacilities.com` with `Cmd+Shift+R` (hard refresh).

Verify all 12 sections render correctly.

- [ ] **Step 14.4: Ask user to verify on real device**

Ask the user to check on their phone — Chrome resize is not the same as a real device (project rule).
