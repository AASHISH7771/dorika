# Dorika — image generation prompts (for Gemini / any image model)

Every prompt is built from two parts so the twelve product photos look like one
photoshoot instead of twelve unrelated images:

1. **BASE** — paste this first. It locks the camera, light, background and palette.
2. **SUBJECT** — one line per product. Append it to BASE.

> In Gemini you can paste BASE once, generate, then for the next product just say
> *"Same style, same lighting, now show: …"* — it keeps the look consistent.

---

## BASE (paste with every product)

```
Photorealistic product photograph of a handmade Nepali string-art piece, shot straight-on
and centred, the artwork filling about 70% of the frame. Square 1:1 composition.
Background: a plain warm off-white plaster wall (#FBF8F4), soft natural window light from
the upper left, gentle soft shadow falling to the lower right. Colour palette strictly
limited to charcoal black (#24272B), terracotta orange (#C55A29) and cream (#FBF8F4).
Visible craft detail: hundreds of thin cotton threads stretched between small brass pins
around the edge; crisp thread texture with a slight sheen; sanded pale wood board edge.
50mm lens, f/4, natural daylight, sharp focus on the threads.
No text, no watermark, no logo, no hands, no props, no picture frame, no border.
```

---

## Products

### 1. Custom String Face Art — 45cm  ·  Rs. 3,500
```
SUBJECT: a circular 45 cm diameter sanded plywood plank on the wall, showing one human
portrait woven entirely from charcoal-grey thread — the face emerging from thread density,
darker threads in the shadows and cream threads in the highlights, a fine web of thread
radiating out to brass pins evenly spaced around the rim. Monochrome, dignified, no smile
artifice. This is the signature piece — it should feel like the best image on the site.
```

### 2. Himalaya Peaks Wall Art  ·  Rs. 2,800
```
SUBJECT: a vertical 40 x 60 cm charcoal-black painted board carrying the Himalayan mountain
silhouette woven in fine terracotta thread; sharp ridgelines, a low rising sun arc, thread
lines echoing the contours of the peaks, brass pins along the perimeter.
```

### 3. Mandala Thread Circle  ·  Rs. 2,200
```
SUBJECT: a 40 cm circular board with a perfectly symmetrical mandala of concentric rings and
petal motifs in charcoal, terracotta and cream thread radiating from a central brass pin.
Ultra-precise radial symmetry, shot straight from the front so the symmetry reads clearly.
```

### 4. Lotus Bloom String Art  ·  Rs. 1,900
```
SUBJECT: a 35 x 35 cm square board with a lotus flower in full bloom woven in warm cream and
terracotta threads on a cream background; soft layered petals, gentle radiating thread lines,
calm and airy.
```

### 5. Heart Knot Keepsake  ·  Rs. 1,500
```
SUBJECT: a 25 x 25 cm square board with a tightly woven terracotta heart on a cream board,
and beside it on the same wall a small kraft gift box with cream tissue paper — suggesting
"comes gift-boxed" without any text.
```

### 6. Name String Art (custom word)  ·  Rs. 1,800
```
SUBJECT: a rectangular pale board with the word "DORIKA" hand-woven in terracotta thread,
clean rounded letterforms, brass pins outlining every letter, generous letter spacing.
```
*Swap `DORIKA` for whatever sample name you want — it's a custom-order product.*

### 7. Boho Moon Phases  ·  Rs. 2,100
```
SUBJECT: a slim horizontal 20 x 70 cm pale wood board with eight moon phases in a row,
cream and charcoal threads forming the crescents, minimal boho styling, wide negative space.
```

### 8. Elephant Blessing  ·  Rs. 2,400
```
SUBJECT: a 40 x 40 cm board with a detailed decorative elephant motif woven in charcoal
thread — ornate patternwork on the ears and howdah blanket, raised trunk, perfectly
symmetrical, regal.
```

### 9. Minimal Compass  ·  Rs. 1,700
```
SUBJECT: a 30 cm circular raw birch ply board (visible pale grain) with a clean compass rose
built from charcoal thread lines and a single terracotta needle, quiet and minimal.
```

### 10. Guitar String Silhouette  ·  Rs. 2,000
```
SUBJECT: a 30 x 45 cm board with an acoustic guitar outline woven in terracotta and charcoal
thread, the six strings suggested by tight parallel threads running to the bridge.
```

### 11. Sunburst Wall Piece  ·  Rs. 2,600
```
SUBJECT: a 50 cm circular board with radiant terracotta thread lines bursting from a central
brass hub out to the rim — dense and hot near the centre, opening up at the edge. Energetic
but ordered.
```

### 12. Couple Portrait Face Art — 45cm  ·  Rs. 5,500
```
SUBJECT: a circular 45 cm diameter sanded plank with two faces — a couple — woven side by
side in charcoal-grey thread, both rendered by thread density alone, warm and intimate,
faces close together.
```

---

## Category tiles (home page, 4 squares)

Same BASE, but framed as room context rather than a flat product shot.

```
Wall Art:      the Himalaya piece hanging on a warm off-white wall above a low wooden
               console, soft daylight raking across the threads.

Custom Face Art: the 45 cm round portrait plank leaning on a pale wooden shelf, a cream
               ceramic vase with dried pampas beside it, shallow depth of field.

Home Decor:    the sunburst piece centred on a plain wall between two soft shadows, warm
               late-afternoon light.

Gifts:         the heart keepsake board on cream linen with its kraft gift box and a
               folded cream ribbon, top-down flat lay.
```

---

## Settings that matter

| | |
|---|---|
| Aspect ratio | **1:1** for products and category tiles (the grid is square and crops with `object-cover`) |
| Resolution | 1024 × 1024 minimum, 1600 × 1600 is better |
| Format on export | JPG or WebP, quality ~85, under 300 KB each |
| Consistency | Generate all twelve in **one Gemini chat**, reusing "same style" so light and palette stay identical |

## How to put them live

`/admin` → **Products** → pick a product → upload the new image(s) → Save. Images go to the
Supabase `product-images` bucket and the storefront revalidates automatically. Category tiles:
Supabase → **Table Editor** → `categories` → replace `image_url`.

---

## One honest caveat

AI images are fine for **category tiles, banners and social posts**, and acceptable as a
temporary stand-in while the shop is being finished. They are *not* a good permanent
solution for product photos — a customer who pays Rs. 3,500 for a "45 cm round string
portrait" and receives something visibly different has a legitimate complaint, and Nepal's
consumer-protection rules treat the listing image as the offer.

The strongest middle path, since you already have one real photo (`IMGREPLACE.webp` — the
portrait on the easel):

- **Photograph your real pieces.** One afternoon, one window, a plain wall — that beats any
  generated image for trust, and it's what customers actually want to see.
- Use these prompts for **backgrounds and lifestyle mock-ups**, then drop your real piece
  onto the generated wall.
- Keep AI images for category tiles and promo banners, where nothing is being misrepresented.
