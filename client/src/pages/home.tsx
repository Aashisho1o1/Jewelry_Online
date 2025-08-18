import React, { useState, useEffect } from 'react';
import { ShoppingBag, Heart, Star, Truck, Shield, Diamond } from "lucide-react";
import { JewelryProduct } from "../types/jewelry";
import { 
  sampleJewelryProducts, 
  getProducts,
  getFeaturedProductsSync, 
  getNewProductsSync, 
  getProductsByCategorySync 
} from "../data/product-loader";
import ProductCard from "../components/jewelry/ProductCard";
import { useCartContext } from "../contexts/CartContext";
import { useToast } from "../hooks/use-toast";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [products, setProducts] = useState<JewelryProduct[]>(sampleJewelryProducts);
  const [featuredProducts, setFeaturedProducts] = useState<JewelryProduct[]>(getFeaturedProductsSync());
  const [loading, setLoading] = useState(false);
  const { addItem, openCart } = useCartContext();
  const { toast } = useToast();

  // Load products dynamically on component mount
  useEffect(() => {
    const loadDynamicProducts = async () => {
      try {
        setLoading(true);
        const dynamicProducts = await getProducts();
        setProducts(dynamicProducts);
        setFeaturedProducts(dynamicProducts.filter(p => p.featured));
      } catch (error) {
        console.warn('Failed to load dynamic products, using sample data:', error);
        // Keep using sample data as fallback
      } finally {
        setLoading(false);
      }
    };

    loadDynamicProducts();
  }, []);

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

  // Calculate categories dynamically based on current products
  const categories = [
    { id: 'all', name: 'All', count: products.length },
    { id: 'rings', name: 'Rings', count: products.filter(p => p.category === 'rings').length },
    { id: 'necklaces', name: 'Necklaces', count: products.filter(p => p.category === 'necklaces').length },
    { id: 'earrings', name: 'Earrings', count: products.filter(p => p.category === 'earrings').length },
    { id: 'bracelets', name: 'Bracelets', count: products.filter(p => p.category === 'bracelets').length },
    { id: 'sets', name: 'Sets', count: products.filter(p => p.category === 'sets').length },
  ].filter(category => category.count > 0); // Only show categories with products

  const displayProducts = activeCategory === 'all' 
    ? products 
    : products.filter(product => product.category === activeCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Aashish Jewellers
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Timeless Elegance, Modern Soul. Discover handcrafted 925 silver jewellery that blends Nepali tradition with contemporary style.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button className="bg-gray-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Shop Collection
              </button>
              <button className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                Learn Our Story
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-600" />
                <span>925 Silver Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Free Delivery Nepal</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                <span>1000+ Happy Customers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Aashish Jewellers?</h2>
            <p className="text-xl text-gray-600">Quality, craftsmanship, and customer satisfaction at the heart of everything we do</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-gray-900 rounded-full flex items-center justify-center">
                <Diamond className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">925 Silver Quality</h3>
              <p className="text-gray-600">Premium sterling silver jewellery with guaranteed purity and lasting shine.</p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-gray-900 rounded-full flex items-center justify-center">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Hypoallergenic</h3>
              <p className="text-gray-600">Skin-friendly jewellery crafted for sensitive skin with nickel-free materials.</p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-gray-900 rounded-full flex items-center justify-center">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Free Home Delivery</h3>
              <p className="text-gray-600">Convenient delivery across Nepal with secure packaging and tracking.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Shop by Category</h2>
            <p className="text-xl text-gray-600">Discover our curated collection of premium silver jewellery</p>
            {loading && (
              <p className="text-sm text-blue-600 mt-2">Loading latest products...</p>
            )}
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-6 py-3 rounded-full font-medium transition-colors ${
                  activeCategory === category.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>

          {/* Product Grid */}
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

          {displayProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No products found in this category.</p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
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

      {/* Call to Action */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Find Your Perfect Piece?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join thousands of satisfied customers who trust Aashish Jewellers for their jewellery needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-gray-900 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Start Shopping
            </button>
            <button className="border border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-white hover:text-gray-900 transition-colors">
              Learn Our Story
            </button>
          </div>

          {/* Social Proof */}
          <div className="mt-12 flex justify-center gap-8 opacity-80">
            <div className="text-center">
              <div className="text-2xl font-bold">1000+</div>
              <div className="text-sm">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">4.8★</div>
              <div className="text-sm">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{products.length}+</div>
              <div className="text-sm">Products</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}