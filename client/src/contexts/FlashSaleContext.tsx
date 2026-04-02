import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export interface FlashSale {
  id: number;
  title: string;
  subtitle?: string | null;
  discount_percent: number;
  ends_at: string; // ISO string
  created_at: string;
}

interface FlashSaleContextValue {
  sale: FlashSale | null;
  loading: boolean;
  refetch: () => void;
}

const FlashSaleContext = createContext<FlashSaleContextValue>({
  sale: null,
  loading: false,
  refetch: () => {},
});

export function FlashSaleProvider({ children }: { children: React.ReactNode }) {
  const [sale, setSale] = useState<FlashSale | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSale = useCallback(async () => {
    try {
      const res = await fetch('/api/flash-sale');
      if (!res.ok) return;
      const data = await res.json();
      // Only set if not expired client-side
      const s: FlashSale | null = data.sale;
      if (s && new Date(s.ends_at).getTime() > Date.now()) {
        setSale(s);
      } else {
        setSale(null);
      }
    } catch {
      // Non-fatal — no flash sale shown
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSale();
    // Re-fetch every 5 minutes so admin changes propagate without a page reload
    intervalRef.current = setInterval(fetchSale, 5 * 60 * 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchSale]);

  return (
    <FlashSaleContext.Provider value={{ sale, loading, refetch: fetchSale }}>
      {children}
    </FlashSaleContext.Provider>
  );
}

export function useFlashSale() {
  return useContext(FlashSaleContext);
}
