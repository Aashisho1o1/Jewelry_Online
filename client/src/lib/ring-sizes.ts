// Kept as the import path the shop already uses; the real lists live in lib/sizes.js (also used by order checks).
import { SIZE_CHOICES, SIZE_UNSURE, sizeLabel } from '../../../lib/sizes.js';

export { SIZE_CHOICES, sizeChoicesFor, sizeLabel } from '../../../lib/sizes.js';

export const RING_SIZE_UNSURE = SIZE_UNSURE;

// Older ring orders without a size are confirmed by phone, so those still show "to confirm".
export function ringSizeLabel(size?: string | null) {
  return size ? sizeLabel(size) : 'Size to confirm by phone';
}

export function needsRingSize(category?: string) {
  return category?.toLowerCase() === 'rings';
}

export const RING_SIZES = SIZE_CHOICES.rings.options;
