# ECCO FACILITIES LLC — WEBSITE PROJECT HANDOFF
## For Claude Code Implementation

---

## PROJECT OVERVIEW

Build a multi-page website for Ecco Facilities LLC, a janitorial and facility services company based in Albany, NY operating across all 5 boroughs of NYC. The site serves as a visual reference for the designer AND a functional prototype.

**Services (ONLY TWO):**
- Janitorial Services — recurring cleaning for all commercial space types
- Day Porter Services — on-site daytime maintenance professional

**Key Differentiators:** 100% eco-certified products (Green Seal, EPA Safer Choice, biodegradable/plant-based), satisfaction guarantee, same-day response, dedicated teams (no crew rotation), background-checked employees, fully insured/bonded/licensed in NY, flexible contracts.

---

## TECH STACK & STRUCTURE

```
ecco-site/
├── index.html          (Home)
├── services.html       (Services overview)
├── janitorial.html     (Janitorial detail page)
├── day-porter.html     (Day Porter detail page)
├── about.html          (About Us)
├── why-ecco.html       (Why Choose Us)
├── sustainability.html (Sustainability)
├── testimonials.html   (Testimonials)
├── careers.html        (Join Our Team)
├── quote.html          (Contact / Smart Forms)
├── css/
│   └── styles.css      (Shared design system)
├── js/
│   └── main.js         (Shared: nav, scroll reveal, mobile menu)
│   └── quote-engine.js (Form wizard logic)
└── images/
    ├── logo-horizontal.png       (with transparent background)
    ├── logo-horizontal-white.png (white version for dark backgrounds)
    ├── logo-vertical.png         (with transparent background)
    └── (any other assets)
```

**Design System:**
- Fonts: Cormorant Garamond (display) + DM Sans (body) from Google Fonts
- Palette: Navy #0B1D38, Blue #3068AD, Green #2D7A32, Background #FAFBFC, Cream #F3F5F8
- Border radius: 10px standard, 16px large
- Shadows: sm/md/lg/xl scale
- Animations: CSS scroll reveal with staggered delays, cubic-bezier(.4,0,.2,1) easing

---

## PAGE 1: HOME (index.html) — APPROVED

### Hero Section
- **Dark navy background** with animated orb placeholders (video-ready — comments in code show how to swap for real video with `filter:blur(4px) brightness(.3)`)
- **Full-width centered layout** (no two-column with logo)
- Badge: "Eco-Certified · Serving All 5 Boroughs" with pulse dot animation
- Headline: "Your facility deserves better than 'clean enough.'" (enough in italic blue)
- Subheadline: full paragraph about Ecco's services
- CTAs: "Request a Free Quote →" (white solid) + "See Our Services" (outline transparent)

### Trust Bar
5 items with green checkmarks: Fully Insured & Bonded | Licensed in NY | Background-Checked | Green Seal Eco-Certified | Satisfaction Guaranteed

### The Problem Section
- Green left border accent
- Headline: "You've dealt with cleaning companies that cut corners. We built Ecco to be different."
- Two paragraphs about industry problems
- CTA: "Learn Our Story →" ghost button to about.html

### Services Preview
- Two equal cards: Janitorial + Day Porter
- Each has: icon, title, description, "For:" italic text, "Learn More →" link
- Hover: translateY(-6px), shadow, top border gradient appears

### Industries We Serve
- 8-item grid: Corporate Offices, Medical & Dental, Retail & Showrooms, Gyms & Fitness, Schools & Daycares, Restaurants, Coworking Spaces, Residential Buildings
- CTA: "Explore Our Services →"

### The Ecco Difference
- 4 value cards in 2x2 grid:
  - 100% Eco-Certified Products
  - Satisfaction Guaranteed
  - Your Team Knows Your Space
  - Insured, Bonded & Vetted

### Testimonials (on navy background)
- 3 cards: David Chen (office/asthma), Dr. Patricia Morales (medical), Rachel Kim (retail/pets)
- Each: stars, italic quote, avatar initial, name, role
- CTA: "Read More Client Stories →"

### Stats Bar (navy)
- 12+ Years | 5 Boroughs | 100% Eco-Certified | 0 Harsh Chemicals | 24hr Response

### Final CTA Banner
- Gradient navy background with decorative orbs
- "Your free, customized proposal is 24 hours away."
- "Request a Free Quote →"

### Footer
- 4 columns: Brand + description, Services links, Company links, Contact
- Logo in white (filter: brightness(0) invert(1))

### Back to Top Button
- Fixed circle, appears after 600px scroll

---

## PAGE 8: QUOTE (quote.html) — APPROVED & MOST COMPLEX

### Page Structure
- Context header (centered): "Tell us about your space. We'll take it from here." + trust points
- Centered wizard form card (max-width 620px)
- Below: Email alternative + Service area + Trust badges

### SMART FORM ENGINE — TWO SEPARATE FLOWS

**Key behaviors:**
- Zero dropdowns — everything is clickable cards/selections
- Auto-advance: Steps that only need one selection advance automatically after ~650ms delay
- Steps with multiple inputs (cascades, multi-select, text fields) need "Continue →" button
- Validation: Can't advance without required selections (shake animation + red message)
- Step counter: "Step 3 of 10" with green progress bar
- First step button says "Let's Begin →", last says "Submit Request →"
- Educational helpers on every step explaining WHY we're asking
- Micro-confirmations on selection (green ✓ messages)
- All data persists when going Back

**Auto-advance steps:** Service selection, Space type (except "Other"), Size, Urgency, Cross-sell
**Manual steps:** Frequency (cascade), DP Hours (cascade), DP Days+Porters, DP Areas (multi), Provider (conditional), Info, Summary

### FLOW BUILDER (dynamic):
```javascript
function buildFlow() {
  if (!D.svc) return ['svc'];
  const isJ = D.svc === 'jan';
  let f = ['svc', 'space'];
  if (isJ) f.push('size', 'janFreq');
  else f.push('dpHours', 'dpDays', 'dpAreas');
  f.push('provider', 'urgency', 'cross');
  if (D.cross === 'yes') {
    if (isJ) f.push('dpHours', 'dpDays', 'dpAreas');
    else f.push('size', 'janFreq');
  }
  f.push('info', 'summary');
  return f;
}
```

### JANITORIAL FLOW (no cross-sell): 9 steps

**Step: svc** — Select service (auto-advance 700ms)
- Janitorial Services | Day Porter Services
- Micro: "✓ Janitorial — We'll ask about your space, frequency, and schedule."

**Step: space** — Space type (auto-advance unless "Other")
- Office, Medical, Retail, Fitness, School, Restaurant, Residential, Coworking, Other
- "Other" opens text field
- Helper explains why different spaces need different approaches

**Step: size** — Space size (auto-advance, 1200ms for "Not sure")
- Under 1,500 / 1,500–3,000 / 3,000–5,000 / 5,000–8,000 / 8,000–12,000 / Over 12,000 / Not sure
- "Not sure" → "No problem — after submitting, you'll have the option to send us a video walkthrough, share floor plans, or schedule an on-site visit."
- Also: "Or enter exact size" text field

**Step: janFreq** — SMART FREQUENCY (manual — cascading)
- Frequency cards: Daily (7x/week), 5 days/week, 3x/week, 2x/week, Weekly, Every other week, Monthly, Not sure
- On select → cascading reveal:
  - Daily → "✓ Service every day"
  - 5 days/week → 7 day buttons, select exactly 5 with validation ("3/5 selected — 2 more needed" → "✓ 5/5 days selected")
  - 3x/week → same with 3
  - 2x/week → same with 2
  - Weekly → select 1 day
  - Monthly → options: "First Mon", "First Tue", ..., "Last Mon", "Last Fri", "Flexible"
  - Every other week → "Every other Mon", "Every other Tue", ..., "Flexible"
  - Not sure → "We'll recommend based on your space type and size."
  - Day validation: max reached → others disabled. Count shows live.
  - Saved in D._janDayArr for restore on Back
- Then: Preferred time section with text input + suggestion chips: "After 6 PM", "Before 8 AM", "Evenings", "Early morning", "Overnight", "Weekends only", "Flexible"

**Step: provider** — Current provider (manual — has conditional)
- Yes, we currently have one | Had one recently but stopped | No, first time
- If yes/had → "What would you most like to see?" (POSITIVE tone, not complaints):
  Consistent team, Reliable schedule, Better communication, Eco-friendly products, Attention to detail, Clear pricing, Higher quality
- If no → "No worries — we'll walk you through everything."

**Step: urgency** — Start timeline (auto-advance, 1100ms for ASAP/flex)
- ASAP → coordination note
- Within 1-2 weeks | Within a month | Flexible → "proposal valid 30 days" | Not sure yet

**Step: cross** — Cross-sell as recommendation (auto-advance)
- "A quick recommendation." + contextual description of Day Porter
- Yes, include Day Porter | No thanks
- If yes → mini-banner appears on first DP step: "👤 Now let's cover your Day Porter needs — just a few quick questions."
- If yes → flow expands with DP-specific steps (dpHours, dpDays, dpAreas)
- If user switches to No after saying Yes → clean DP data from D

**Step: info** — Personal + address (manual)
- Two visual sections: "About You" + "Facility Location"
- About You: First Name*, Last Name*, Business Email*, Phone, Company Name
- Facility Location: Full Address*
- Validation: name + email + address required

**Step: summary** — Review + submit
- Visual summary tables with sections: 🏢 Janitorial Services / 📋 General
- Shows all selections organized
- Additional notes textarea
- "Submit Request →" button

### DAY PORTER FLOW (no cross-sell): 10 steps
Same as Janitorial except:
- After space → dpHours, dpDays, dpAreas (instead of size, janFreq)
- Cross-sell recommends Janitorial instead
- Porter-specific pain points: "Takes initiative", "Consistent attendance", "Great communication", etc.

**Step: dpHours** — Coverage hours + start time (manual — cascade)
- Hours: 4, 6, 8 (Recommended badge), 10, Custom
- "👆 Tap your preferred option to continue" hint (disappears on click)
- On select → Start time grid appears (5 AM to 6 PM in cards)
- On start time select → auto-calculates end: "🕐 8:00 AM → 4:00 PM · 8 hours of continuous coverage"
- Custom → number input + same start time grid

**Step: dpDays** — Days + porters (manual)
- Day toggle buttons (Mon-Sun)
- Porter count: 1, 2, 3+, Not sure

**Step: dpAreas** — Focus areas (manual — multi-select)
- Lobby/reception, Restrooms, Kitchen, Conference rooms, Elevators/hallways, Trash/recycling, Spill response, Common areas, Gym/amenities, Other
- data-area attribute for clean summary display

### CROSS-SELL EXPANDED FLOWS:

**Janitorial + Day Porter (12 steps):** svc → space → size → janFreq → provider → urgency → cross(yes) → dpHours → dpDays → dpAreas → info → summary

**Day Porter + Janitorial (11 steps):** svc → space → dpHours → dpDays → dpAreas → provider → urgency → cross(yes) → size → janFreq → info → summary

Shared steps (space, provider, urgency, info) NEVER repeat.

### SUMMARY shows both services:
```
🏢 Janitorial Services
  Frequency: 3x/week
  Days: Mon / Wed / Fri
  Time: After 6 PM
  Size: 5,000–8,000 sq ft

👤 Day Porter Services
  Coverage: 8 hours · 8:00 AM → 4:00 PM
  Days: Mon / Tue / Wed / Thu / Fri
  Porters: 1
  Areas: Lobby / reception, Restrooms, Kitchen

📋 General
  Location: 123 Broadway, NYC
  Space: Office
  Start: Within 1–2 weeks
  Contact: John Smith
  Email: john@company.com
```

### SUCCESS SCREEN
- Animated checkmark (scale pop)
- "Thank you — your request for [Service(s)] has been received."
- Timeline: 1. Now reviewing → 2. Proposal within 24h → 3. Direct contact included
- No cross-form link needed (everything answered before submit)

### BUG FIXES IMPLEMENTED:
1. restoreFreq uses textContent matching instead of CSS selector (parentheses issue)
2. endC div uses proper HTML attribute syntax
3. janFreq validation checks days are selected when required
4. Switching service cleans previous service data
5. Pain points saved in D.painPoints and restored on Back
6. dpAreas save uses data-area attribute, not step-dependent
7. Cross-sell "No" cleans 2nd service data
8. "Not sure" frequency → D.janDays = "To be recommended"
9. Custom hours validated (min 1)
10. Emojis stripped from areas in summary via stripEmoji()
11. Cross-section banner appears when entering 2nd service questions

---

## PAGES 2-7, 9-10: CONTENT APPROVED

All content is in the Word document: Ecco_Facilities_Website_Brief_FINAL.docx

Quick reference:

### PAGE 2: SERVICES (services.html)
- Overview of both services with full detail
- Janitorial: What It Is, How It Works, What's Included (10 items), Spaces We Serve, Eco note
- Day Porter: same structure with porter-specific content
- Better Together section (5 benefits of combining)
- Eco Commitment section
- Marcus Williams testimonial
- CTA

### PAGE 3: JANITORIAL (janitorial.html)
- Dedicated page for Janitorial with full detail from services page

### PAGE 4: DAY PORTER (day-porter.html)
- Dedicated page for Day Porter with full detail from services page

### PAGE 5: ABOUT US (about.html)
- Story (4 paragraphs about Alex and Bianca)
- 4 Values: People Over Chemicals, Consistency Over Promises, Relationships Over Transactions, Transparency Over Fine Print
- 6-Step Quality Process
- Leadership bios (Alex CEO, Bianca COO) — placeholder for photos
- Stats bar

### PAGE 6: WHY CHOOSE US (why-ecco.html)
- 6 Pain points → 6 Promises (direct counterpoints)
- Comparison table (8 rows)
- Risk-free guarantee
- David Chen + Linda Hoffman testimonials
- Trust badges

### PAGE 7: SUSTAINABILITY (sustainability.html)
- Hidden Problem (education about chemicals)
- Ecco Approach (founding principle)
- 3 Certifications detailed
- 6 Protected Groups
- Applied across both services
- Beyond Products (5 practices)
- LEED Ready
- Dr. Morales testimonial

### PAGE 9: TESTIMONIALS (testimonials.html)
- Featured case study: James Whitfield (property management) — full context + quote + result
- 6 more testimonials: David Chen, Dr. Morales, Rachel Kim, Marcus Williams, Linda Hoffman, Nicole Reyes
- Numbers That Matter section

### PAGE 10: CAREERS (careers.html)
- Why Different (industry honesty)
- 6 Benefits
- 3 Positions: Cleaning Technician, Day Porter, Team Lead
- 5-Step Hiring Process
- Message to Clients section
- Application form fields defined

---

## 7 TESTIMONIALS (for reference across pages)

1. **David Chen** — Operations Director, Meridian Capital Group — Office/asthma
2. **Dr. Patricia Morales** — Practice Owner, East Side Family Health — Medical
3. **Rachel Kim** — Store Manager, Luxe Boutique SoHo — Retail/pets
4. **Marcus Williams** — Owner, Iron District Fitness — Gym/non-toxic
5. **Linda Hoffman** — Principal, Brooklyn Heights Academy — School/children
6. **James Whitfield** — Building Manager, The Avalon Residences — Property mgmt (FEATURED)
7. **Nicole Reyes** — Operations Manager, HubWork Collective — Coworking/communication

---

## LOGOS

- logo-horizontal.png — Black text + green leaves on TRANSPARENT background (for light backgrounds)
- logo-vertical.png — Same but vertical layout
- For dark backgrounds: use CSS `filter: brightness(0) invert(1)` to make white
- Green leaves in logo represent eco commitment (confirmed by owner)

---

## IMPORTANT NOTES

- The site emphasizes breadth of SPACES served, not number of service types
- NO carpet cleaning, deep cleaning, or restroom sanitation as separate services
- All removed — only Janitorial and Day Porter exist
- Blog page structure approved but no articles to build yet
- Policies page content needs attorney review before publishing
- Testimonial names are placeholders — will be replaced with real ones
- Professional headshots of Alex and Bianca needed for About page
