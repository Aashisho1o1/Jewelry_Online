// Types for the parts of metal-pricing.js the admin form uses.
export interface FormulaInput {
  ratePerGram?: number;
  weightGrams?: number | null;
  wastagePercent?: number | string | null;
  makingCharge?: number | string | null;
  makingChargeType?: string | null;
  stoneCost?: number | string | null;
  roundingIncrement?: number;
}
export function calculateFormulaPrice(input: FormulaInput): { metal: number; wastage: number; making: number; stones: number; price: number } | null;
export function followRatePrice(input: { price?: number | string; baseRate?: number | string | null; ratePerGram?: number; weightGrams?: number; roundingIncrement?: number }): number | null;
export function inferMetalRateKey(material: string): string | null;
