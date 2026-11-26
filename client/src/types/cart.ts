export interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  material: string;
  category?: string;
  size?: string; // Ring size, chain length or bracelet size; two sizes of one piece are two cart lines.
}

export interface Cart {
  items: CartItem[];
  total: number;
  count: number;
}
