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

const SIZE_NUMBER = /^\d{1,2}(\.\d{1,2})?$/;

/** The sizes a product is made in: "17, 19, 20" or [17, "19", '20"'] -> ["17", "19", "20"]. Throws on anything else. */
export function parseSizes(input) {
  const list = Array.isArray(input) ? input : String(input ?? '').split(',');
  const sizes = [...new Set(list.map(s => String(s ?? '').trim().replace(/\s*(inches|inch|in|")$/i, '')).filter(Boolean))];
  if (sizes.length > 12 || sizes.some(s => !SIZE_NUMBER.test(s))) throw new Error('Sizes must be numbers separated by commas, like 6, 7, 8.');
  return sizes.sort((a, b) => Number(a) - Number(b));
}

/** The choices a product asks for, or null when it needs none. A product's own sizes replace the usual list. */
export function sizeChoicesFor(product) {
  if (!product || product.adjustable === true) return null;
  const base = SIZE_CHOICES[String(product.category || '').toLowerCase()];
  if (!base || !Array.isArray(product.sizes) || !product.sizes.length) return base || null;
  const unit = base === SIZE_CHOICES.rings ? '' : 'in';
  return {
    title: base.title,
    options: product.sizes.map(n => base.options.find(o => o.value === n + unit) || { value: n + unit, label: unit ? `${n}"` : n, note: '' }),
  };
}

/** "7" -> "Ring size 7", "18in" -> '18" length', "not-sure" -> "Size to confirm". */
export function sizeLabel(size) {
  if (!size) return '';
  if (size === SIZE_UNSURE) return 'Size to confirm';
  const inches = String(size).match(/^([\d.]+)in$/);
  return inches ? `${inches[1]}" length` : `Ring size ${size}`;
}
