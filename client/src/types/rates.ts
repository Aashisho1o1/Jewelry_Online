export interface StoreRate {
  rateKey: string;
  label: string;
  pricePerGram: number;
  unit: 'gram';
  currency: 'NPR';
  updatedAt: string | null;
  sourceLabel: string;
  isActive: boolean;
}

export interface StoreRatesResponse {
  storeName: string;
  baseCurrency: 'NPR';
  status: 'live' | 'pending';
  updatedAt: string | null;
  rates: StoreRate[];
}
