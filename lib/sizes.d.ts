export interface SizeOption { value: string; label: string; note: string }
export interface SizeChoice { title: string; options: SizeOption[] }
export const SIZE_UNSURE: string;
export const SIZE_CHOICES: Record<string, SizeChoice>;
export function parseSizes(input: unknown): string[];
export function sizeChoicesFor(product?: { category?: string; adjustable?: boolean; sizes?: string[] } | null): SizeChoice | null;
export function sizeLabel(size?: string | null): string;
