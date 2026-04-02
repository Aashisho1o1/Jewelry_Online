# Photo Upload Checklist

Use this after the shoot to move photos into the storefront cleanly.

Related docs:
- [PHOTO_SHOTLIST.md](./PHOTO_SHOTLIST.md)
- [PHOTO_CAPTURE_CHECKLIST.md](./PHOTO_CAPTURE_CHECKLIST.md)

## 1. Select Final Images

- Pick the sharpest image for each required shot
- Remove duplicates
- Remove blurry or reflective frames
- Prefer clean backgrounds and consistent lighting

## 2. Rename Files

Use product ids and shot type in the filename.

Examples:
- `br004-main.jpg`
- `br004-detail-clasp.jpg`
- `ns001-worn.jpg`
- `a2-angle.jpg`

## 3. Export for Web

- Keep main storefront images near `4:5`
- Export close-ups as square or `4:5`
- Keep file size under `500 KB` when possible
- Use JPG for normal photos
- Use PNG only if transparency or compression quality requires it

## 4. Place Files in the Correct Folder

Store product photos here:

`client/public/images/jewelry/`

If you create derived crops or alternates:

`client/public/images/jewelry/derived/`

## 5. Update Product Markdown

Product files live here:

`content/jewelry/`

For each product:

1. Set the best hero image in `image:`
2. Add extra gallery images under `images:`
3. Update `customerPhotos:` only if the image works as a believable shopper/detail photo
4. Remove old weak or unrelated image paths

Example:

```md
image: /images/jewelry/br004-main.jpg
images:
  - /images/jewelry/br004-detail-clasp.jpg
  - /images/jewelry/br004-worn.jpg
```

## 6. Check the Storefront

Review:

- Homepage cards
- Shop-by cards
- Product detail gallery
- Recommended product cards

Make sure:

- Main image looks clean in cards
- Secondary image improves hover/gallery experience
- PDP gallery order feels logical
- Crops do not cut off the main detail

## 7. Replace Old Temporary Assets

When real photos are available:

- Remove temporary derived crops if they are no longer needed
- Replace synthetic or weak gallery images first
- Keep only assets that help the buying decision

## 8. Final Sign-Off

- [ ] Files renamed correctly
- [ ] Files exported for web
- [ ] Images added to the correct folder
- [ ] Markdown updated
- [ ] Old weak images removed
- [ ] Homepage reviewed
- [ ] Shop-by reviewed
- [ ] Product pages reviewed
