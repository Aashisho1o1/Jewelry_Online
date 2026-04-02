import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { JewelryProduct } from '@/types/jewelry';

const WISHLIST_STORAGE_KEY = 'aashish-wishlist';
const RECENTLY_VIEWED_STORAGE_KEY = 'aashish-recently-viewed';
const MAX_RECENTLY_VIEWED = 8;

interface EngagementContextType {
  wishlist: JewelryProduct[];
  recentlyViewed: JewelryProduct[];
  wishlistCount: number;
  toggleWishlist: (product: JewelryProduct) => void;
  removeFromWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  trackRecentlyViewed: (product: JewelryProduct) => void;
}

const EngagementContext = createContext<EngagementContextType | undefined>(undefined);

function loadStoredProducts(key: string) {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function dedupeProducts(products: JewelryProduct[]) {
  return products.filter((product, index, array) => array.findIndex(item => item.id === product.id) === index);
}

export function EngagementProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<JewelryProduct[]>(() => loadStoredProducts(WISHLIST_STORAGE_KEY));
  const [recentlyViewed, setRecentlyViewed] = useState<JewelryProduct[]>(() => loadStoredProducts(RECENTLY_VIEWED_STORAGE_KEY));

  useEffect(() => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  const value = useMemo<EngagementContextType>(() => ({
    wishlist,
    recentlyViewed,
    wishlistCount: wishlist.length,
    toggleWishlist: product => {
      setWishlist(current => {
        const exists = current.some(item => item.id === product.id);
        if (exists) {
          return current.filter(item => item.id !== product.id);
        }

        return dedupeProducts([product, ...current]);
      });
    },
    removeFromWishlist: productId => {
      setWishlist(current => current.filter(item => item.id !== productId));
    },
    isWishlisted: productId => wishlist.some(item => item.id === productId),
    trackRecentlyViewed: product => {
      setRecentlyViewed(current => {
        const next = [product, ...current.filter(item => item.id !== product.id)];
        return next.slice(0, MAX_RECENTLY_VIEWED);
      });
    },
  }), [wishlist, recentlyViewed]);

  return (
    <EngagementContext.Provider value={value}>
      {children}
    </EngagementContext.Provider>
  );
}

export function useEngagementContext() {
  const context = useContext(EngagementContext);
  if (!context) {
    throw new Error('useEngagementContext must be used within an EngagementProvider');
  }

  return context;
}
