# Quote-form photo assets

Eight photos referenced from `quote.html` (Welcome + Space cards). All rendered
through the CSS duotone-sage filter on `.qf2-card-photo` — source images can be
color, B&W, or any temperature; the filter normalises them.

## Spec

- **Resolution:** 320×320 px (displayed at 52×52, 6× density buffer for retina)
- **Format:** jpg q=80 from Unsplash CDN (`?w=320&h=320&fit=crop&q=80`)
- **Crop:** Square, focal subject centered (Unsplash auto-crop)
- **License:** Unsplash License (free for commercial + editorial, no attribution required, attribution provided as courtesy)

## Files in production

| Slot | File | Subject | Unsplash URL | Photographer |
|---|---|---|---|---|
| 1 | `service-janitorial.jpg` | Cleaner mid-task with supplies | [unsplash.com/photos/zfSrsX7yUIA](https://unsplash.com/photos/zfSrsX7yUIA) | Unsplash contributor |
| 2 | `service-dayporter.jpg` | Uniformed staff in lobby | [unsplash.com/photos/lJI-OnHxxfo](https://unsplash.com/photos/lJI-OnHxxfo) | Unsplash contributor |
| 3 | `service-combined.jpg` | Wider business interior with staff | [unsplash.com/photos/ZiQkhI7417A](https://unsplash.com/photos/ZiQkhI7417A) | Unsplash contributor |
| 4 | `space-office.jpg` | Modern open-plan office, daylight | [unsplash.com/photos/g1Kr4Ozfoac](https://unsplash.com/photos/g1Kr4Ozfoac) | Unsplash contributor |
| 5 | `space-medical.jpg` | Clinic interior — exam area | [unsplash.com/photos/9aOswReDKPo](https://unsplash.com/photos/9aOswReDKPo) | Unsplash contributor |
| 6 | `space-retail.jpg` | Storefront interior | [unsplash.com/photos/HgUDpaGPTEA](https://unsplash.com/photos/HgUDpaGPTEA) | Unsplash contributor |
| 7 | `space-restaurant.jpg` | Café dining area, warm light | [unsplash.com/photos/5LgBMW_flN8](https://unsplash.com/photos/5LgBMW_flN8) | Unsplash contributor |
| 8 | `space-fitness.jpg` | Gym / yoga floor | [unsplash.com/photos/lrQPTQs7nQQ](https://unsplash.com/photos/lrQPTQs7nQQ) | Unsplash contributor |

`Something else` does not need a photo — it uses a CSS gradient
(`.qf2-card-photo--gradient`).

## Performance

| Slot | Filename | Size |
|---|---|---|
| 1 | service-janitorial.jpg | 21 KB |
| 2 | service-dayporter.jpg | 38 KB |
| 3 | service-combined.jpg | 30 KB |
| 4 | space-office.jpg | 19 KB |
| 5 | space-medical.jpg | 29 KB |
| 6 | space-retail.jpg | 41 KB |
| 7 | space-restaurant.jpg | 36 KB |
| 8 | space-fitness.jpg | 27 KB |
| **Total** | | **~241 KB** |

Welcome screen serves 3 photos (~89 KB), Space screen serves 5 photos
(~152 KB). Cached after first paint; cards render with sage-tint disc fallback
during load.

## Replacing a photo

To swap any slot:

1. Pick a square subject (or use `?w=320&h=320&fit=crop` to auto-crop).
2. Save as `<slot>.jpg` at q=80.
3. Update the URL row in this file.
4. Bump cache buster in `quote.html` for both CSS and the photo URLs if needed.
