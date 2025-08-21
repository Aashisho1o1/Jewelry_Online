import React, { useState, useEffect } from 'react';
import { ShoppingBag, Heart, Truck, Diamond } from "lucide-react";
import { JewelryProduct } from "../types/jewelry";
import { getProducts } from "../data/product-loader";
import ProductCard from "../components/jewelry/ProductCard";
import { useCartContext } from "../contexts/CartContext";
import { useToast } from "../hooks/use-toast";
import homeContent from "../content/home.json";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [products, setProducts] = useState<JewelryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addItem, openCart } = useCartContext();
  const { toast } = useToast();

  // Load products from CMS on component mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setError(null);
        const cmsProducts = await getProducts();
        setProducts(cmsProducts);
        console.log(`✅ Loaded ${cmsProducts.length} products from CMS`);
        
        if (cmsProducts.length === 0) {
          console.log('ℹ️ No products found in CMS - this is normal for a new store');
        }
      } catch (error) {
        console.error('❌ Failed to load CMS products:', error);
        setError('Unable to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Helper functions for product filtering
  const getFeaturedProducts = () => products.filter(product => product.featured);
  const getProductsByCategory = (category: string) => products.filter(product => product.category === category);

  const handleAddToCart = (product: JewelryProduct) => {
    if (!product.inStock) {
      toast({
        title: "Out of Stock",
        description: "This item is currently out of stock.",
        variant: "destructive",
      });
      return;
    }
    
    addItem(product);
    toast({
      title: "Added to cart!",
      description: `${product.name} has been added to your cart.`,
    });
    
    // Auto-open cart after adding item
    setTimeout(() => openCart(), 500);
  };

  const handleWishlist = (product: JewelryProduct) => {
    toast({
      title: "Added to wishlist!",
      description: `${product.name} has been added to your wishlist.`,
    });
    // TODO: Implement actual wishlist functionality
  };

  const categories = [
    { id: 'all', name: 'All', count: products.length },
    { id: 'rings', name: 'Rings', count: getProductsByCategory('rings').length },
    { id: 'necklaces', name: 'Necklaces', count: getProductsByCategory('necklaces').length },
    { id: 'earrings', name: 'Earrings', count: getProductsByCategory('earrings').length },
    { id: 'bracelets', name: 'Bracelets', count: getProductsByCategory('bracelets').length },
    { id: 'sets', name: 'Sets', count: getProductsByCategory('sets').length },
  ];

  const displayProducts = activeCategory === 'all' 
    ? products 
    : getProductsByCategory(activeCategory);

  const featuredProducts = getFeaturedProducts();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Luxury Full Screen */}
      <section className="relative h-screen w-full overflow-hidden -mt-20">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img 
            src={homeContent.hero.heroImage || homeContent.imageUrl}
            alt="Luxury Jewelry Collection"
            className="w-full h-full object-cover"
            loading="eager"
          />
          {/* Enhanced gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20" />
        </div>
        
        {/* Content Overlay */}
        <div className="relative h-full flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-6 text-center">
            {/* Logo/Brand Mark */}
            <div className="mb-8">
              <div className="inline-block">
                <div className="text-white/80 text-xs tracking-[0.3em] font-light mb-2">
                  {homeContent.hero.welcomeText}
                </div>
                <div className="w-24 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto" />
              </div>
            </div>
            
            {/* Main Title with Luxury Typography */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-light text-white mb-6 tracking-wide">
              <span className="block font-thin italic">{homeContent.hero.mainTitle || homeContent.title}</span>
            </h1>
            
            {/* Tagline */}
            <p className="text-white/90 text-lg md:text-xl font-light tracking-wide mb-12 max-w-2xl mx-auto">
              {homeContent.hero.description}
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="group relative px-10 py-4 overflow-hidden border border-white/80 text-white hover:text-black transition-all duration-500"
              >
                <span className="relative z-10 text-sm tracking-[0.2em] font-light">EXPLORE COLLECTION</span>
                <div className="absolute inset-0 bg-white transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
              </button>
              <button 
                onClick={() => window.location.href = '/about'}
                className="px-10 py-4 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-300 text-sm tracking-[0.2em] font-light"
              >
                OUR STORY
              </button>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator - Perfectly Centered */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center text-white/60 animate-bounce">
          <div className="flex flex-col items-center">
            <span className="text-xs tracking-[0.2em] mb-2">SCROLL</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Product Categories - Luxury Gallery */}
      <section id="collections" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-xs tracking-[0.3em] text-gray-500 mb-4">EXPLORE</h2>
            <h3 className="text-4xl md:text-5xl font-serif font-light text-gray-900 mb-6">Our Collections</h3>
            <p className="text-lg text-gray-600 font-light max-w-2xl mx-auto">Each piece tells a story of craftsmanship and elegance</p>
          </div>

          {/* Category Filters - Minimal Design */}
          <div className="flex flex-wrap justify-center gap-3 mb-16">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-8 py-3 text-sm tracking-[0.15em] font-light transition-all duration-300 ${
                  activeCategory === category.id
                    ? 'text-white bg-black'
                    : 'text-gray-700 bg-transparent border border-gray-300 hover:border-black'
                }`}
              >
                {category.name.toUpperCase()}
                <span className="ml-2 text-xs opacity-60">({category.count})</span>
              </button>
            ))}
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading products...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">⚠️ {error}</div>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : displayProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                {products.length === 0 
                  ? "🏪 We're preparing our collection. Check back soon!" 
                  : `No products found in ${activeCategory === 'all' ? 'any category' : activeCategory}.`
                }
              </div>
              {activeCategory !== 'all' && (
                <button 
                  onClick={() => setActiveCategory('all')} 
                  className="text-gray-900 hover:underline"
                >
                  View all products
                </button>
              )}
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onWishlist={handleWishlist}
              />
            ))}
          </div>
          )}
        </div>
      </section>

      {/* Featured Products - Only show if we have featured products */}
      {!loading && featuredProducts.length > 0 && (
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
            <p className="text-xl text-gray-600">Our handpicked collection of bestsellers</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onWishlist={handleWishlist}
              />
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Features Section - What Sets Us Apart */}
      <section id="about" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-serif font-light text-gray-900 mb-4">What Sets Us Apart</h2>
            <div className="w-16 h-px bg-gray-300 mx-auto" />
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="mb-8 transform group-hover:scale-110 transition-transform duration-300">
                <Diamond className="w-12 h-12 mx-auto text-gray-700" strokeWidth={1} />
              </div>
              <h3 className="text-lg font-light tracking-[0.1em] mb-4">HIGH QUALITY SILVER</h3>
              <p className="text-gray-600 font-light leading-relaxed">Certified pure silver with lasting brilliance and timeless appeal</p>
            </div>
            
            <div className="text-center group">
              <div className="mb-8 transform group-hover:scale-110 transition-transform duration-300">
                <Truck className="w-12 h-12 mx-auto text-gray-700" strokeWidth={1} />
              </div>
              <h3 className="text-lg font-light tracking-[0.1em] mb-4">COMPLIMENTARY DELIVERY</h3>
              <p className="text-gray-600 font-light leading-relaxed">Secure shipping inside Butwal and Bhairahawa with elegant packaging</p>
            </div>
            
            <div className="text-center group">
              <div className="mb-8 transform group-hover:scale-110 transition-transform duration-300">
                <Heart className="w-12 h-12 mx-auto text-gray-700" strokeWidth={1} />
              </div>
              <h3 className="text-lg font-light tracking-[0.1em] mb-4">SKIN SAFE</h3>
              <p className="text-gray-600 font-light leading-relaxed">Hypoallergenic materials crafted for sensitive skin comfort</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action - Elegant Finish */}
      <section className="py-32 bg-black text-white relative overflow-hidden">
        {/* Subtle Pattern Background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-serif font-light mb-8 tracking-wide">
            Begin Your Journey
          </h2>
          <p className="text-lg font-light opacity-80 mb-12 max-w-2xl mx-auto leading-relaxed">
            Discover timeless elegance in every piece, crafted with passion for those who appreciate beauty
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <button className="group relative px-10 py-4 overflow-hidden border border-white/80 text-white hover:text-black transition-all duration-500">
              <span className="relative z-10 text-sm tracking-[0.2em] font-light flex items-center gap-3">
                <ShoppingBag className="w-4 h-4" strokeWidth={1} />
                SHOP NOW
              </span>
              <div className="absolute inset-0 bg-white transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
            </button>
            <button className="px-10 py-4 text-white/80 hover:text-white transition-colors text-sm tracking-[0.2em] font-light">
              OUR HERITAGE
            </button>
          </div>

          {/* Social Proof - Elegant Display */}
          <div className="flex justify-center gap-12 text-center">
            <div className="group">
              <div className="text-3xl font-light mb-1 group-hover:scale-110 transition-transform">1000+</div>
              <div className="text-xs tracking-[0.2em] opacity-60">HAPPY CLIENTS</div>
            </div>
            <div className="group">
              <div className="text-3xl font-light mb-1 group-hover:scale-110 transition-transform">4.8★</div>
              <div className="text-xs tracking-[0.2em] opacity-60">RATING</div>
            </div>
            <div className="group">
              <div className="text-3xl font-light mb-1 group-hover:scale-110 transition-transform">50+</div>
              <div className="text-xs tracking-[0.2em] opacity-60">DESIGNS</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}