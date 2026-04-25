# Quote-form photo assets

Eight photos referenced from `quote.html` (Welcome + Space cards). All rendered
through the CSS duotone-sage filter on `.qf2-card-photo` — source images can be
color, B&W, or any temperature; the filter normalises them.

## Spec

- **Resolution:** 320×320 px (displayed at 52×52, 6× density buffer for retina)
- **Format:** webp q=80 primary, jpg q=85 fallback
- **Crop:** Square, focal subject centered
- **Source:** Unsplash free, Pexels, or original. Capture attribution below.

## Files needed

| Slot | Subject | Source URL | License |
|---|---|---|---|
| `service-janitorial.jpg` | Cleaning supplies / mop / cleaner mid-task | _to source_ | _to fill_ |
| `service-dayporter.jpg` | Uniformed staff in lobby / hallway | _to source_ | _to fill_ |
| `service-combined.jpg` | Wider view of staff in business setting | _to source_ | _to fill_ |
| `space-office.jpg` | Modern open-plan office, daylight | _to source_ | _to fill_ |
| `space-medical.jpg` | Clinic interior — exam or waiting area | _to source_ | _to fill_ |
| `space-retail.jpg` | Storefront interior or retail floor | _to source_ | _to fill_ |
| `space-restaurant.jpg` | Café / restaurant dining area | _to source_ | _to fill_ |
| `space-fitness.jpg` | Gym, yoga studio, or fitness floor | _to source_ | _to fill_ |

`Something else` does not need a photo — it uses a CSS gradient
(`.qf2-card-photo--gradient`).

## Performance budget

Combined images per screen ≤ 80 KB after webp compression.

## Until assets land

Cards 404 gracefully — the `.qf2-card-photo` background-color fallback shows
a sage-tint disc inside the white-bordered well, with the duotone filter
still applied. The form is fully usable; the visual identity is the only
thing waiting on the curator.
