import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { ShoppingBag, Heart, Star, Truck, Shield, Diamond, Sparkles, ArrowRight, Play } from "lucide-react";
import homeContent from "@/content/home.json";
import ProductCard from "@/components/jewelry/ProductCard";
import { sampleJewelryProducts, getFeaturedProducts, getBestSellers, getNewArrivals } from "@/data/jewelry-products";
import { JewelryProduct } from "@/types/jewelry";

const featuredProducts = getFeaturedProducts();
const bestSellers = getBestSellers();
const newArrivals = getNewArrivals();

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('all');

  const handleAddToCart = (product: JewelryProduct) => {
    // TODO: Implement add to cart functionality
    console.log('Added to cart:', product.name);
  };

  const handleWishlist = (product: JewelryProduct) => {
    // TODO: Implement wishlist functionality
    console.log('Added to wishlist:', product.name);
  };

  const categories = [
    { id: 'all', name: 'All', count: sampleJewelryProducts.length },
    { id: 'rings', name: 'Rings', count: sampleJewelryProducts.filter(p => p.category === 'rings').length },
    { id: 'necklaces', name: 'Necklaces', count: sampleJewelryProducts.filter(p => p.category === 'necklaces').length },
    { id: 'earrings', name: 'Earrings', count: sampleJewelryProducts.filter(p => p.category === 'earrings').length },
    { id: 'bracelets', name: 'Bracelets', count: sampleJewelryProducts.filter(p => p.category === 'bracelets').length },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-br from-silver-50 via-background to-gold-50">
        <div className="absolute inset-0 bg-[url('/images/jewelry/pattern.svg')] opacity-5"></div>
        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <Badge className="mb-6 bg-secondary/10 text-secondary border-secondary/20 font-medium">
                ✨ New Collection Available
              </Badge>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-gold-600 to-foreground bg-clip-text text-transparent leading-tight">
                {homeContent.title}
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                {homeContent.subtitle}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/products">
                  <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 shadow-lg">
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    {homeContent.hero?.ctaText || "Shop Collection"}
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="border-2">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Our Story
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span>925 Silver Certified</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-blue-600" />
                  <span>Free Delivery Nepal</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span>1000+ Happy Customers</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10 bg-gradient-to-br from-white to-silver-50 rounded-3xl p-8 shadow-2xl border border-silver-200">
                <div className="grid grid-cols-2 gap-4">
                  {featuredProducts.slice(0, 4).map((product, index) => (
                    <div 
                      key={product.id} 
                      className={`${index === 0 ? 'col-span-2' : ''} aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-silver-100 to-gold-50 flex items-center justify-center`}
                    >
                      <div className="text-center p-4">
                        <Sparkles className="h-8 w-8 mx-auto mb-2 text-gold-500" />
                        <h4 className="font-semibold text-sm">{product.name}</h4>
                        <p className="text-xs text-muted-foreground">NPR {product.price.current.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-r from-gold-400 to-secondary rounded-full blur-3xl opacity-20"></div>
              <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-gradient-to-r from-accent to-primary rounded-full blur-3xl opacity-20"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Nepal Silver?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Quality, craftsmanship, and customer satisfaction at the heart of everything we do
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {homeContent.features.map((feature, index) => (
              <Card key={index} className="border-0 bg-background/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center">
                    {feature.icon === 'diamond' && <Diamond className="h-8 w-8 text-white" />}
                    {feature.icon === 'heart' && <Heart className="h-8 w-8 text-white" />}
                    {feature.icon === 'truck' && <Truck className="h-8 w-8 text-white" />}
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Shop by Category</h2>
            <p className="text-xl text-muted-foreground">
              Discover our curated collection of premium silver jewelry
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "default" : "outline"}
                onClick={() => setActiveCategory(category.id)}
                className="rounded-full"
              >
                {category.name} ({category.count})
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(activeCategory === 'all' 
              ? featuredProducts 
              : sampleJewelryProducts.filter(p => p.category === activeCategory)
            ).slice(0, 8).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onWishlist={handleWishlist}
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/products">
              <Button size="lg" variant="outline" className="border-2">
                View All Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-20 bg-gradient-to-r from-gold-50 to-silver-50">
        <div className="container">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-secondary text-secondary-foreground">
              🏆 Customer Favorites
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Best Selling Jewelry</h2>
            <p className="text-xl text-muted-foreground">
              Discover what our customers love most
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {bestSellers.slice(0, 3).map((product) => (
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

      {/* New Arrivals */}
      <section className="py-20">
        <div className="container">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">New Arrivals</h2>
              <p className="text-xl text-muted-foreground">
                Latest additions to our collection
              </p>
            </div>
            <Link href="/products?filter=new">
              <Button variant="outline">
                View All New
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.map((product) => (
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

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-foreground to-gray-800 text-background">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Find Your Perfect Piece?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust Nepal Silver for their jewelry needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products">
              <Button size="lg" variant="secondary">
                Start Shopping
                <ShoppingBag className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="border-background text-background hover:bg-background hover:text-foreground">
                Learn Our Story
              </Button>
            </Link>
          </div>

          {/* Social Proof */}
          <div className="mt-12 flex items-center justify-center gap-8 opacity-80">
            <div className="text-center">
              <div className="text-2xl font-bold">1000+</div>
              <div className="text-sm">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">4.8★</div>
              <div className="text-sm">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">500+</div>
              <div className="text-sm">Products</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
