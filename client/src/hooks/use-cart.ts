import { useCallback, useEffect, useState } from 'react';
import { CartItem } from '../types/cart';
import { JewelryProduct } from '../types/jewelry';
import { getProducts } from '../data/product-loader';

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
        originalPrice: product.originalPrice,
        image: product.image,
        quantity: 1,
        material: product.material,
        category: product.category,
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

  const refreshPrices = useCallback(async () => {
    try {
      const products = await getProducts(true);
      const productMap = new Map(products.map(product => [product.id, product]));

      const nextItems = items.map(item => {
        const product = productMap.get(item.id);
        if (!product) {
          return item;
        }

        return {
          ...item,
          name: product.name,
          price: product.price,
          originalPrice: product.originalPrice,
          image: product.image,
          material: product.material,
          category: product.category,
        };
      });

      const didChange = nextItems.some((item, index) => {
        const currentItem = items[index];
        return (
          item.name !== currentItem?.name ||
          item.price !== currentItem?.price ||
          item.originalPrice !== currentItem?.originalPrice ||
          item.image !== currentItem?.image ||
          item.material !== currentItem?.material ||
          item.category !== currentItem?.category
        );
      });

      if (didChange) {
        setItems(nextItems);
      }

      return didChange;
    } catch (error) {
      console.error('Failed to refresh cart prices:', error);
      return false;
    }
  }, [items]);

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
    refreshPrices,
  };
}
