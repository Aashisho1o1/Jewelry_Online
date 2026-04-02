# Jewelry Content Authoring Guide

All products are stored as markdown files in this folder with frontmatter fields.

## 1) Single-image product template

```md
---
id: TL001
name: Classic Tilahari
description: Traditional Nepali tilahari with modern finishing.
price: 120000
originalPrice: 135000
priceMode: manual
image: /images/jewelry/tilahari-classic-main.jpg
category: tilahari
material: gold_22k
inStock: true
featured: true
isNew: true
weight: 12.5g
dimensions: 18 in chain
stoneType: NA
occasion: Wedding
designStory: The piece is shaped around a timeless silhouette with easy gift appeal.
styleNote: Best worn as a polished everyday accent or a simple occasion piece.
highlights:
  - Hand-finished silhouette
  - Gift-ready presentation
  - Everyday comfort
---
```

## 2) Multi-image product template

```md
---
id: MG001
name: Nepali Mangalsutra Set
description: Handcrafted mangalsutra inspired by Nepali heritage.
price: 98000
priceMode: live_metal
pricingWeightGrams: 9.8
metalRateKey: gold_18k
priceRoundingIncrement: 10
image: /images/jewelry/mangalsutra-main.jpg
images:
  - /images/jewelry/mangalsutra-main.jpg
  - /images/jewelry/mangalsutra-closeup.jpg
  - /images/jewelry/mangalsutra-worn.jpg
category: mangalsutra
material: gold_18k
inStock: true
featured: false
isNew: false
weight: 9.8g
dimensions: 16 in chain
stoneType: CZ
occasion: Daily Wear
designStory: A classic design with enough detail to feel elevated in person.
styleNote: Works well on its own or styled with lighter silver pieces.
highlights:
  - Visible stone detail
  - Everyday-friendly wear
  - Giftable finish
---
```

## Naming conventions

1. Use lowercase file/image names.
2. Use dashes (`-`) between words.
3. Keep image names descriptive, for example: `sikri-antique-closeup.jpg`.

## Recommended image specs

1. Product cards look best near a `3:4` aspect ratio.
2. Keep file size under `500 KB` when possible.
3. Use clear, front-facing main images and optional close-up/worn shots in `images`.

## Live metal-rate pricing

Use these fields when a product should move with the latest silver or gold rate:

- `priceMode`: `manual` or `live_metal`
- `pricingWeightGrams`: optional numeric weight used for pricing if `weight` is not exact enough
- `metalRateKey`: optional override, otherwise it is inferred from the material slug
- `priceRoundingIncrement`: optional rounding step, for example `10` or `50`

How pricing works:

1. `price` stays the baseline selling price stored in the markdown file.
2. Admin updates the current and baseline market rate in the Metal Rates dashboard.
3. For `live_metal` products, the site calculates:
   `live price = baseline product price + (current metal rate - baseline metal rate) x pricing weight`
4. If a metal rate is missing, the product safely falls back to the manual `price`.

## Category/material slugs

Use these category slugs:
`rings`, `necklaces`, `earrings`, `bracelets`, `sets`, `tilahari`, `mangalsutra`, `sikri`, `baala`, `bulaki`, `pote`, `pauju`, `maang-tika`, `haar`, `dhungri`

Use these material slugs:
`925_silver`, `gold_plated`, `rose_gold_plated`, `gold_18k`, `gold_22k`, `gold_24k`, `stone_studded`, `mixed_metals`, `beaded`
