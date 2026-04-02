export interface GiftOptions {
  isGift: boolean;
  giftWrap: boolean;
  giftNote: string;
  giftCard: boolean;
  recipient: string;
  occasion: string;
  specialInstructions: string;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
  address: {
    street: string;
    district: string;
    zone: string;
    landmark?: string;
  };
  giftOptions?: GiftOptions;
}

export interface Order {
  id: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  customer: CustomerInfo;
  total: number;
  paymentMethod: 'esewa' | 'khalti' | 'cod' | 'whatsapp' | 'fonepay';
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  promoCode?: string;
  discountAmount?: number;
}

export interface PaymentResponse {
  success: boolean;
  orderId?: string;
  paymentId?: string;
  error?: string;
}
