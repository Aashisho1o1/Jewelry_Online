// Ring sizes offered at checkout. Keep RING_SIZE_VALUES in lib/order-pricing.js in sync.
export const RING_SIZES = [
  { size: '6', diameter: '16.5 mm', note: 'Slim fingers / snug fit' },
  { size: '7', diameter: '17.3 mm', note: 'Common regular fit' },
  { size: '8', diameter: '18.1 mm', note: 'Comfortable medium-large fit' },
  { size: '9', diameter: '19.0 mm', note: 'Statement or larger fit' },
];

// Orders are confirmed by phone, so an unsure customer can settle the size then.
export const RING_SIZE_UNSURE = 'not-sure';

export function ringSizeLabel(size?: string | null) {
  if (!size || size === RING_SIZE_UNSURE) return 'Size to confirm by phone';
  return `Ring size ${size}`;
}

export function needsRingSize(category?: string) {
  return category?.toLowerCase() === 'rings';
}
