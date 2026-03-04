import React from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'wouter';
import ProductCard from '@/components/jewelry/ProductCard';
import { useEngagementContext } from '@/contexts/EngagementContext';
import { useCartContext } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { JewelryProduct } from '@/types/jewelry';
import SiteMeta from '@/components/SiteMeta';

export default function WishlistPage() {
  const { wishlist, recentlyViewed } = useEngagementContext();
  const { addItem, openCart } = useCartContext();
  const { toast } = useToast();

  const handleAddToCart = (product: JewelryProduct) => {
    if (!product.inStock) {
      toast({
        title: 'Out of Stock',
        description: 'This piece is currently unavailable.',
        variant: 'destructive',
      });
      return;
    }

    addItem(product);
    toast({
      title: 'Added to bag',
      description: product.name,
    });
    setTimeout(() => openCart(), 400);
  };

  return (
    <div className="min-h-screen bg-[#f7f2ea] pt-24">
      <SiteMeta title="Your Wishlist" noindex={true} />
      <div className="container py-12">
        <div className="max-w-3xl">
          <p className="text-xs tracking-[0.22em] uppercase text-stone-500 mb-4">Saved Pieces</p>
          <h1 className="text-4xl md:text-5xl font-serif font-light text-stone-900">Your wishlist</h1>
          <p className="text-stone-500 font-light mt-4">
            Save pieces you love and come back to them anytime.
          </p>
        </div>

        {wishlist.length === 0 ? (
          <div className="mt-12 bg-white border border-dashed border-stone-300 px-8 py-14 text-center">
            <Heart className="w-10 h-10 mx-auto text-stone-400 mb-5" strokeWidth={1.5} />
            <h2 className="text-2xl font-serif font-light text-stone-900">No saved pieces yet.</h2>
            <p className="text-stone-600 mt-3">Tap the heart on any product card or product page to build your shortlist.</p>
            <div className="flex justify-center gap-3 mt-8">
              <Link href="/shop-by" className="border border-stone-900 bg-stone-900 text-white px-6 py-3 text-sm tracking-[0.18em] uppercase hover:bg-stone-700 transition-colors">
                Explore shop by
              </Link>
              <Link href="/" className="border border-stone-300 px-6 py-3 text-sm tracking-[0.18em] uppercase text-stone-700 hover:border-stone-900 transition-colors">
                Browse collection
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {wishlist.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}

        {recentlyViewed.length > 0 && (
          <section className="mt-20 pt-12 border-t border-stone-200">
            <p className="text-xs tracking-[0.18em] uppercase text-stone-500 mb-3">Recently Viewed</p>
            <h2 className="text-3xl font-serif font-light text-stone-900">Keep browsing</h2>
            <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {recentlyViewed.slice(0, 4).map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
