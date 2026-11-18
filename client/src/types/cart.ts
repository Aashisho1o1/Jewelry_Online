export interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  material: string;
  category?: string;
  size?: string; // Rings only; the same ring in two sizes is two cart lines.
}

export interface Cart {
  items: CartItem[];
  total: number;
  count: number;
}
