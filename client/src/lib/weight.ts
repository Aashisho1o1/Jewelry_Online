// Nepali jewellery weights: 1 tola = 100 laal = 11.664 g. Weights are saved in grams; the shop types and reads laal.
export const GRAMS_PER_TOLA = 11.664;
export const GRAMS_PER_LAAL = GRAMS_PER_TOLA / 100;

const trim = (value: number, places: number) => String(Number(value.toFixed(places)));

export const laalToGrams = (laal: number) => Number((laal * GRAMS_PER_LAAL).toFixed(4));
export const gramsToLaal = (grams: number) => Number((grams / GRAMS_PER_LAAL).toFixed(2));

/** "11.664g" -> "100 laal (11.664 g)"; anything unreadable is shown as saved. */
export function weightLabel(saved?: string | null) {
  const grams = Number.parseFloat(String(saved ?? ''));
  if (!Number.isFinite(grams) || grams <= 0) return saved || '';
  return `${trim(gramsToLaal(grams), 2)} laal (${trim(grams, 3)} g)`;
}

/** Rate per gram shown the way a jeweller quotes it. */
export const perTola = (perGram: number) => Math.round(perGram * GRAMS_PER_TOLA);
export const perLaal = (perGram: number) => Number((perGram * GRAMS_PER_LAAL).toFixed(2));
