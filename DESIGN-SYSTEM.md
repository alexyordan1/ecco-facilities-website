# Design System — Technical Reference

> Companion to `DESIGN.md` (brand voice & visual theme). This document covers the **technical implementation**: tokens, component library, file structure, migration history, and how to extend.

**Last updated:** D156–D163 design-system reset (2026-05-19)

---

## File structure

```
css/
├── styles.css         # 158KB — page-level + legacy rules (being progressively reduced)
├── components.css     # 22KB — canonical component library (THE source of truth)
├── crm.css            # 39KB — CRM-specific, isolated namespace
└── quote-flow.css     # 206KB — quote-flow isolated namespace (--qf-* tokens)

.css-tools/
└── delete-orphans-ast.mjs   # css-tree based AST surgery script
```

**HTML loads CSS in this order:**

```html
<link rel="stylesheet" href="css/styles.css?v=18.13">
<link rel="stylesheet" href="css/components.css?v=1.3">
```

`components.css` loads AFTER `styles.css` so canonical components win in the cascade when there's overlap. Same-name rules (like `.btn` defined in both) currently have identical values — when `styles.css` is progressively trimmed, only the components.css definition remains.

---

## Token system

All design tokens live in `:root{}` at the top of `styles.css`. Wrapped in `@layer reset,tokens,base,components,variants,overrides,utilities;` for cascade safety.

### Colors

```css
/* Brand */
--color-navy: #0B1D38;
--color-navy-light: #15294D;
--color-navy-x-light: #1E3562;
--color-blue: #3068AD;
--color-blue-light: #4A82C7;
--color-green: #2D7A32;
--color-green-light: #3D9A43;

/* Surfaces */
--color-bg: #FAFBFC;
--color-white: #FFF;
--color-cream: #F3F5F8;
--color-green-bg: rgba(45,122,50,.07);
--color-green-border: rgba(45,122,50,.18);

/* Text */
--color-text-dark: #1A1E2C;
--color-text-body: #495568;
--color-text-muted: #6B7A8D;
--color-text-light: #7A8A9E;
--color-text-safe: #CBD6E1;
--color-text-white-muted: #C8D5E2;

/* Borders */
--color-border: #DFE4EC;
--color-border-subtle: #EDF0F5;
--color-border-dark: rgba(255,255,255,.08);
--color-border-dark-light: rgba(255,255,255,.12);

/* State */
--color-red: #C84444;

/* Topic colors (Five Pillars) */
--topic-health: #4CB866;
--topic-team: #E8A94C;
--topic-people: #5E91A8;
--topic-planet: #3BA081;
--topic-future: #5B7FC4;
--topic-budget: #C84444;
```

### Typography, spacing, motion

```css
--font-display: 'Fraunces','Cormorant Garamond',Georgia,serif;
--font-body: 'DM Sans',system-ui,sans-serif;
--radius: 12px;
--radius-lg: 18px;
--max-width: 1200px;
--shadow-sm: 0 2px 8px rgba(11,29,56,.06);
--shadow-md: 0 4px 20px rgba(11,29,56,.08);
--shadow-lg: 0 8px 32px rgba(11,29,56,.12);
--shadow-xl: 0 20px 60px rgba(11,29,56,.16);
--shadow-hover: 0 8px 30px rgba(11,29,56,.10), 0 2px 8px rgba(11,29,56,.06);
--ease: cubic-bezier(.4,0,.2,1);
--ease-out: cubic-bezier(0,.55,.45,1);
--ease-spring: cubic-bezier(.22,1.3,.36,1);
```

### Naming convention

- `--color-*` for all colors (replaces legacy `--td`, `--fb`, `--wh`, etc.)
- `--font-*` for typography stacks
- `--shadow-*` for elevation
- `--topic-*` for the 6 Pillar colors (Health, Team, People, Planet, Future, Budget)
- `--ease*`, `--focus-ring` for animation/interaction

**Avoid:** Adding new cryptic tokens (`--tb`, `--bd`). Always full words.

---

## Component library (`components.css`)

13 canonical components, 70+ classes. Wrapped in `@layer components`.

### 1. Button — `.btn` + 6 variants

```html
<a class="btn btn-primary" href="#">Primary</a>
<a class="btn btn-white">White (on dark)</a>
<a class="btn btn-outline">Outline</a>
<a class="btn btn-sage">Large pill CTA</a>
<a class="btn btn-ghost">Text link</a>
```

44px min-height (WCAG touch target). Spring transitions. `.btn-ol` is a legacy alias for `.btn-outline`.

### 2. Card — `.card` + 3 variants

```html
<div class="card">Default bordered</div>
<div class="card card-elevated">With hover lift</div>
<div class="card card-flat">Cream bg, no border</div>
```

### 3. Section — `.sec` + 5 parts

```html
<section class="sec">
  <div class="sec-head">
    <span class="sec-lbl">Eyebrow label</span>
    <h2 class="sec-ttl">Section title</h2>
    <p class="sec-sub">Subtitle</p>
  </div>
  <!-- content -->
</section>
```

### 4. Container — `.container` + 2 variants

```html
<div class="container">Default (1200px max)</div>
<div class="container-narrow">720px for long-form</div>
<div class="container-wide">1400px for grids</div>
```

### 5. Badge — `.badge` + 3 variants

```html
<span class="badge">Default</span>
<span class="badge badge-green">Green tint</span>
<span class="badge badge-dark">On dark bg</span>
```

### 6. Nav — `.nav` + dropdown system

```html
<nav class="nav">
  <a class="nav-logo"><img src="..."></a>
  <div class="nm">
    <a class="nl">Home</a>
    <a class="nl">Services</a>
  </div>
</nav>
```

`.nl` is the legacy short name; `.nav-link` is an alias. `.nav.scrolled` adds shadow on scroll.

### 7. Footer — `.footer` + grid

```html
<footer class="footer">
  <div class="footer-grid">
    <div class="footer-brand">...</div>
    <div class="footer-col">
      <h3 class="footer-heading">Services</h3>
      <a>Janitorial</a>
    </div>
    <!-- ... -->
  </div>
  <div class="footer-newsletter">...</div>
  <div class="footer-bottom">Copyright + legal</div>
</footer>
```

### 8. Form field — `.form-group` + label/input

```html
<div class="form-group">
  <label class="form-label">Email</label>
  <input class="form-input" type="email">
</div>
<div class="form-row"><!-- 2-column grid, collapses on mobile --></div>
```

`font-size: 1rem` to prevent iOS zoom-on-focus.

### 9. Photo card — `.card-image` (alias: `.photo-card`)

```html
<div class="card-image">
  <div class="card-image-bg" style="background-image:url(...)"></div>
  <div class="card-image-overlay"></div>
  <div class="card-image-content">
    <h3>Title</h3>
  </div>
</div>
```

### 10. Pillar — `.pillar` (segmented tab)

```html
<button class="pillar active">
  <div class="pillar-icon"><svg>...</svg></div>
  <span class="pillar-label">CATEGORY</span>
</button>
```

Used for the "Five Pillars" / industry-selector. `.active` for the selected state.

### 11. List item — `.list-item` (alias: `.ba-item`)

```html
<ul>
  <li class="list-item">
    <span class="list-item-icon"><svg>...</svg></span>
    <span>List item body text</span>
  </li>
</ul>
```

### 12. Cert badge — `.cert-badge`

```html
<div class="cert-badge">
  <span class="cert-badge-ico"><svg>...</svg></span>
  <span class="cert-badge-label">Green Seal certified</span>
</div>
```

Larger than `.badge` (40px border-radius). For certifications row.

### 13. Testimonial — `.testimonial` (alias: `.trust-quote`)

```html
<div class="testimonial">
  <div class="testimonial-stars">★★★★★</div>
  <p class="testimonial-text">"Customer quote in italic Cormorant."</p>
  <div class="testimonial-author">Jane Doe</div>
</div>
```

---

## Migration history

| Commit | Description | Net impact |
|--------|-------------|------------|
| D156 | Rename 32 cryptic tokens to legible names | 0 (rename only) |
| D157 | Delete 56 orphan classes (stage/ask/alina) | -20KB |
| D158 | Add components.css with 5 base components | +8KB new |
| D159 | Extend with nav/footer/form-field | +5KB |
| D160 | AST-based deletion of 151 more orphans | -21KB |
| D161 | Build fix: remove bun.lock | 0 |
| D162 | Add photo-card/pillar/list-item | +5KB |
| D163 | Add cert-badge/testimonial | +3KB |

**Cumulative:** `styles.css` 199KB → 158KB (-21%); `components.css` 0 → 22KB (canonical reference).

---

## Lessons learned (memory)

Stored in `~/.claude/projects/-Users-alexmercedes-Downloads-Ecco-Webside/memory/`:

1. **`feedback_grep_cross_page_before_css_purge.md`** — Always grep ALL HTMLs before deleting CSS. Shared stylesheet means dead-on-this-page ≠ dead-everywhere.
2. **`feedback_cleancss_strips_atlayer_root.md`** — `bunx clean-css-cli` silently drops `@layer ...; :root{...}` first line. After ANY minify, inspect `body` styles to confirm tokens still resolve.
3. **`feedback_perl_regex_unsafe_multi_selector.md`** — Word-boundary regex corrupts multi-comma rules. Use the AST script at `.css-tools/delete-orphans-ast.mjs` instead.
4. **`feedback_cloudflare_bun_lockfile_conflict.md`** — Committing `bun.lock` alongside `package-lock.json` causes Cloudflare Pages instant build failure. `bun.lock` is gitignored.

---

## How to extend

### Adding a new canonical component

1. Identify the pattern in `styles.css` (extract values via grep or python `re`)
2. Append to `components.css` inside the `@layer components{}` block
3. Use canonical tokens (`var(--color-*)`, `var(--font-*)`, etc.)
4. Include `.legacy-name, .new-canonical-name` selector if there's existing usage
5. Document in this file under "Component library"
6. Bump `components.css?v=X.Y` cache buster
7. Run `/ays` before commit

### Deleting orphan CSS classes (safe)

```bash
# 1. Build the verified-orphan list
grep -oP "(?<![a-zA-Z0-9_-])\.[a-z][a-zA-Z0-9_-]+" css/styles.css | sed 's/^\.//' | sort -u > /tmp/css-classes.txt
# 2. Build the "in-use" set from 10 sources (see Phase 2.A round 2 commits)
# 3. Compute diff: orphans-final.txt
# 4. Run AST deletion:
node .css-tools/delete-orphans-ast.mjs /tmp/orphans-final.txt < css/styles.css > /tmp/styles-new.css
# 5. Visual verify in preview before applying
# 6. Bump styles.css?v= cache buster
# 7. Run /ays before commit
```

**Never** use perl/sed regex to delete CSS rules from minified single-line CSS — multi-selector rules will corrupt silently.

### Adding new design tokens

1. Define in `:root{}` at top of `styles.css` (canonical location)
2. Use full-word naming (`--color-foo`, not `--cfo`)
3. Reference via `var(--name)` in component CSS
4. If renaming an existing token: use the perl script pattern from D156 (verified safe for token renames, NOT for rule deletion)

---

## Future work (post-D163)

1. **Migration pages → canonicals** — Most pages already use canonical names where applicable; remaining ad-hoc classes (e.g., `hero-*` editorial pieces) are intentionally specialized and should remain
2. **Minify components.css** — Currently 22KB unminified for readability; can shrink to ~12KB once stable. Watch the clean-css `@layer` bug.
3. **Component visual reference page** — Optional: build `docs/components-gallery.html` that renders every component variant for visual regression testing
4. **Storybook/style guide tool** — Not needed at this site's scale; reference this doc instead
