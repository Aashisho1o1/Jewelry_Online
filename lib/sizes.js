// Sizes customers choose, per type of jewellery. Shared by the shop pages and order checks, so they always agree.
// Adjustable pieces (product "adjustable: true") never ask for a size.
export const SIZE_UNSURE = 'not-sure';

export const SIZE_CHOICES = {
  rings: {
    title: 'Ring size',
    options: [
      { value: '6', label: '6', note: '16.5 mm inside · slim fingers / snug fit' },
      { value: '7', label: '7', note: '17.3 mm inside · common regular fit' },
      { value: '8', label: '8', note: '18.1 mm inside · comfortable medium-large fit' },
      { value: '9', label: '9', note: '19.0 mm inside · statement or larger fit' },
    ],
  },
  necklaces: {
    title: 'Chain length',
    options: [
      { value: '16in', label: '16"', note: '41 cm · sits at the base of the neck' },
      { value: '18in', label: '18"', note: '46 cm · on the collarbone, most popular' },
      { value: '20in', label: '20"', note: '51 cm · just below the collarbone' },
      { value: '22in', label: '22"', note: '56 cm · above the neckline of most tops' },
    ],
  },
  bracelets: {
    title: 'Bracelet size',
    options: [
      { value: '6.5in', label: '6.5"', note: '16.5 cm · small wrist' },
      { value: '7in', label: '7"', note: '17.8 cm · regular wrist' },
      { value: '7.5in', label: '7.5"', note: '19 cm · medium-large wrist' },
      { value: '8in', label: '8"', note: '20.3 cm · large wrist' },
    ],
  },
};

/** The choices a product asks for, or null when it needs none. */
export function sizeChoicesFor(product) {
  if (!product || product.adjustable === true) return null;
  return SIZE_CHOICES[String(product.category || '').toLowerCase()] || null;
}

/** "7" -> "Ring size 7", "18in" -> '18" length', "not-sure" -> "Size to confirm". */
export function sizeLabel(size) {
  if (!size) return '';
  if (size === SIZE_UNSURE) return 'Size to confirm';
  const inches = String(size).match(/^([\d.]+)in$/);
  return inches ? `${inches[1]}" length` : `Ring size ${size}`;
}
