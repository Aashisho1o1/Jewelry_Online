export interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  material: string;
  category?: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
  count: number;
}
