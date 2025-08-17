export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  material: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
  count: number;
}
