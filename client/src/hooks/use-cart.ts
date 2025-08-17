import { useState, useEffect } from 'react';
import { CartItem } from '../types/cart';
import { JewelryProduct } from '../types/jewelry';

const CART_STORAGE_KEY = 'aashish-cart';

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product: JewelryProduct) => {
    setItems(current => {
      const existingItem = current.find(item => item.id === product.id);
      
      if (existingItem) {
        // Increase quantity if item already exists
        return current.map(item =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, 10) } // Max 10 per item
            : item
        );
      }
      
      // Add new item
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
        material: product.material,
      };
      
      return [...current, newItem];
    });
  };

  const removeItem = (productId: string) => {
    setItems(current => current.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    
    setItems(current =>
      current.map(item =>
        item.id === productId
          ? { ...item, quantity: Math.min(quantity, 10) }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  // Computed values
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    total,
    count,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  };
}
