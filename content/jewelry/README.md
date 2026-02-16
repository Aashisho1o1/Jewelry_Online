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
---
```

## 2) Multi-image product template

```md
---
id: MG001
name: Nepali Mangalsutra Set
description: Handcrafted mangalsutra inspired by Nepali heritage.
price: 98000
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

## Category/material slugs

Use these category slugs:
`rings`, `necklaces`, `earrings`, `bracelets`, `sets`, `tilahari`, `mangalsutra`, `sikri`, `baala`, `bulaki`, `pote`, `pauju`, `maang-tika`, `haar`, `dhungri`

Use these material slugs:
`925_silver`, `gold_plated`, `rose_gold_plated`, `gold_18k`, `gold_22k`, `gold_24k`, `stone_studded`, `mixed_metals`, `beaded`
