import React, { useEffect, useMemo, useState } from 'react';
import { Link, useRoute } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import SiteMeta from '@/components/SiteMeta';
import { JewelryProduct } from '@/types/jewelry';
import { getProducts } from '@/data/product-loader';
import ProductCard from '@/components/jewelry/ProductCard';
import { useCartContext } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import {
  SHOP_FACETS,
  ShopFacetKey,
  formatProductLabel,
  getFacetOptions,
  getProductHref,
  getProductsByFacet,
} from '@/lib/product-taxonomy';

const QUICK_LINKS = [
  { label: 'For Her', href: '/shop-by/recipient/her' },
  { label: 'Birthday', href: '/shop-by/occasion/birthday' },
  { label: 'Anniversary', href: '/shop-by/occasion/anniversary' },
  { label: 'Under NPR 3,000', href: '/shop-by/price/under-3000' },
  { label: 'Minimalist', href: '/shop-by/style/minimalist' },
];

export default function ShopByPage() {
  const [, params] = useRoute('/shop-by/:facet/:value');
  const [products, setProducts] = useState<JewelryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem, openCart } = useCartContext();
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    getProducts(true)
      .then(result => { if (!cancelled) setProducts(result); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const activeFacet = params?.facet as ShopFacetKey | undefined;
  const activeValue = params?.value;
  const facetDefinition = SHOP_FACETS.find(item => item.key === activeFacet);

  const filteredProducts = useMemo(() => {
    if (!facetDefinition || !activeValue) return [];
    return getProductsByFacet(products, facetDefinition.key, activeValue);
  }, [products, facetDefinition, activeValue]);

  const activeOption = facetDefinition && activeValue
    ? getFacetOptions(products, facetDefinition.key).find(o => o.slug === activeValue)
    : undefined;

  const handleAddToCart = (product: JewelryProduct) => {
    if (!product.inStock) {
      toast({ title: 'Out of Stock', description: 'This piece is currently unavailable.', variant: 'destructive' });
      return;
    }
    addItem(product);
    toast({ title: 'Added to bag', description: product.name });
    setTimeout(() => openCart(), 400);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f2ea] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900" />
      </div>
    );
  }

  const metaTitle = facetDefinition && activeValue
    ? `${formatProductLabel(activeValue)} ${facetDefinition.label} Jewelry`
    : 'Gift Guide - Shop by Occasion, Style & Recipient';
  const metaDesc = facetDefinition && activeValue
    ? `Browse our ${formatProductLabel(activeValue)} silver jewelry collection. Handcrafted 925 silver pieces from Nepal.`
    : 'Find the perfect silver jewelry gift by occasion, recipient, style, or budget. Handcrafted 925 silver from Nepal.';

  /* Filtered view */
  if (facetDefinition && activeValue) {
    return (
      <div className="min-h-screen bg-[#f7f2ea]">
        <SiteMeta title={metaTitle} description={metaDesc} />

        {/* Header */}
        <div className="border-b border-stone-200 bg-white">
          <div className="container py-10">
            <Link
              href="/shop-by"
              className="inline-flex items-center gap-1.5 text-xs tracking-[0.16em] uppercase text-stone-500 hover:text-stone-900 transition-colors mb-6"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
              Gift Guide
            </Link>
            <p className="text-xs tracking-[0.2em] uppercase text-stone-400 mb-2">{facetDefinition.label}</p>
            <h1 className="text-3xl md:text-4xl font-serif font-light text-stone-900">
              {activeOption?.label || formatProductLabel(activeValue)}
            </h1>
            <p className="text-sm text-stone-500 mt-2">{filteredProducts.length} {filteredProducts.length === 1 ? 'piece' : 'pieces'}</p>
          </div>
        </div>

        {/* Sibling filters */}
        <div className="border-b border-stone-200 bg-white/60">
          <div className="container py-4 flex flex-wrap gap-2">
            {getFacetOptions(products, facetDefinition.key).map(option => (
              <Link
                key={option.slug}
                href={`/shop-by/${facetDefinition.key}/${option.slug}`}
                className={`px-4 py-1.5 text-[11px] tracking-[0.14em] uppercase border transition-colors ${
                  option.slug === activeValue
                    ? 'border-stone-900 bg-stone-900 text-white'
                    : 'border-stone-300 text-stone-600 hover:border-stone-900 hover:text-stone-900'
                }`}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Product grid */}
        <div className="container py-12">
          {filteredProducts.length === 0 ? (
            <div className="py-24 text-center text-stone-400 text-sm tracking-[0.12em] uppercase">
              No pieces match this filter yet
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* Main Gift Guide view */
  return (
    <div className="min-h-screen bg-[#f7f2ea]">
      <SiteMeta title={metaTitle} description={metaDesc} />

      {/* Hero */}
      <div className="bg-white border-b border-stone-200">
        <div className="container py-14">
          <p className="text-xs tracking-[0.24em] uppercase text-stone-400 mb-3">Gift Guide</p>
          <h1 className="text-4xl md:text-5xl font-serif font-light text-stone-900 leading-tight">
            Find the perfect gift
          </h1>
          <p className="text-stone-500 mt-3 text-base font-light">Handcrafted 925 silver - delivered across Nepal.</p>

          {/* Quick links */}
          <div className="mt-7 flex flex-wrap gap-2">
            {QUICK_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="border border-stone-300 px-4 py-2 text-[11px] tracking-[0.14em] uppercase text-stone-700 hover:border-stone-900 hover:text-stone-900 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Facet grid */}
      <div className="container py-12">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {SHOP_FACETS.map(facet => {
            const options = getFacetOptions(products, facet.key, 4);
            if (options.length === 0) return null;

            const previewProduct = getProductsByFacet(products, facet.key, options[0]?.slug)[0];
            const previewImage = previewProduct
              ? ([previewProduct.image, ...(previewProduct.images || [])].filter(Boolean)[1] || previewProduct.image)
              : undefined;

            return (
              <div key={facet.key} className="bg-white border border-stone-200 overflow-hidden">
                {previewImage && (
                  <img
                    src={previewImage}
                    alt={facet.label}
                    className="aspect-[16/9] w-full object-cover"
                    loading="lazy"
                  />
                )}
                <div className="px-5 py-5">
                  <p className="text-[10px] tracking-[0.22em] uppercase text-stone-400 mb-3">{facet.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {options.map(option => (
                      <Link
                        key={option.slug}
                        href={`/shop-by/${facet.key}/${option.slug}`}
                        className="border border-stone-200 px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-stone-700 hover:border-stone-900 hover:text-stone-900 transition-colors"
                      >
                        {option.label}
                        <span className="ml-1 text-stone-400">({option.count})</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
