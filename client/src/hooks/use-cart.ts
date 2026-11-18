import { useCallback, useEffect, useState } from 'react';
import { CartItem } from '../types/cart';
import { JewelryProduct } from '../types/jewelry';
import { getProducts } from '../data/product-loader';

const CART_STORAGE_KEY = 'aashish-cart';
const GIFT_STORAGE_KEY = 'aashish-gift';

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

  // Gift choice is shared by the product page, cart and checkout.
  const [gift, setGiftState] = useState<boolean>(() => {
    try { return localStorage.getItem(GIFT_STORAGE_KEY) === '1'; } catch { return false; }
  });
  const setGift = (value: boolean) => {
    setGiftState(value);
    try { localStorage.setItem(GIFT_STORAGE_KEY, value ? '1' : '0'); } catch { /* storage blocked */ }
  };

  // A cart line is a product in one size, so two sizes of a ring are separate lines.
  const sameLine = (item: CartItem, productId: string, size?: string) =>
    item.id === productId && (item.size || undefined) === (size || undefined);

  const addItem = (product: JewelryProduct, size?: string) => {
    setItems(current => {
      const existingItem = current.find(item => sameLine(item, product.id, size));

      if (existingItem) {
        return current.map(item =>
          item === existingItem
            ? { ...item, quantity: Math.min(item.quantity + 1, 10) } // Max 10 per line
            : item
        );
      }

      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        quantity: 1,
        material: product.material,
        category: product.category,
        ...(size ? { size } : {}),
      };

      return [...current, newItem];
    });
  };

  const removeItem = (productId: string, size?: string) => {
    setItems(current => current.filter(item => !sameLine(item, productId, size)));
  };

  const updateQuantity = (productId: string, quantity: number, size?: string) => {
    if (quantity <= 0) {
      removeItem(productId, size);
      return;
    }

    setItems(current =>
      current.map(item =>
        sameLine(item, productId, size)
          ? { ...item, quantity: Math.min(quantity, 10) }
          : item
      )
    );
  };

  const clearCart = () => {
    // Write now: checkout does a full-page redirect before the save effect runs.
    localStorage.setItem(CART_STORAGE_KEY, '[]');
    setItems([]);
    setGift(false);
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
    gift,
    setGift,
  };
}
