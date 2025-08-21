import { Link, useLocation } from "wouter";
import { ShoppingBag, Search, User, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartContext } from "../contexts/CartContext";
import { useState } from "react";

export default function Nav() {
  const [location] = useLocation();
  const { count, openCart } = useCartContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const navHeight = 80; // Height of fixed nav
      const elementPosition = element.offsetTop - navHeight;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  const links = [
    { href: "/", label: "HOME", action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    { href: "#collections", label: "COLLECTIONS", action: () => scrollToSection('collections') },
    { href: "#about", label: "ABOUT", action: () => scrollToSection('about') },
    { href: "#contact", label: "CONTACT", action: () => scrollToSection('contact') },
  ];

  return (
    <nav className="fixed top-0 z-50 w-full bg-white/95 backdrop-blur-sm">
      <div className="container mx-auto px-6">
        {/* Mobile Layout */}
        <div className="flex h-20 items-center justify-between md:hidden">
          {/* Left - Mobile Menu */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="w-6 h-6" strokeWidth={1} />
          </button>
          
          {/* Center - Brand Name */}
          <Link href="/">
            <a className="flex flex-col items-center">
              <h1 className="text-xl font-serif font-light tracking-[0.2em] text-gray-900">
                AASHISH
              </h1>
              <p className="text-[9px] tracking-[0.3em] text-gray-500">JEWELLERS</p>
            </a>
          </Link>
          
          {/* Right - Cart */}
          <button
            className="relative group"
            onClick={openCart}
          >
            <ShoppingBag className="w-5 h-5 text-gray-700" strokeWidth={1} />
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-light">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </button>
        </div>

        {/* Desktop Layout - Perfect 3-Column Grid */}
        <div className="hidden md:grid grid-cols-3 h-20 items-center">
          {/* Left Column - Navigation */}
          <div className="flex items-center space-x-8 justify-start">
            {links.slice(0, 2).map(({ href, label, action }) => (
              <button
                key={href}
                onClick={action}
                className={cn(
                  "text-xs tracking-[0.2em] font-light transition-all duration-300 hover:opacity-100",
                  (href === "/" && location === "/") || (href !== "/" && location === "/")
                    ? "text-gray-900 opacity-100" 
                    : "text-gray-600 opacity-70"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          
          {/* Center Column - Brand Name (Perfectly Centered) */}
          <div className="flex justify-center">
            <Link href="/">
              <a className="flex flex-col items-center">
                <h1 className="text-xl font-serif font-light tracking-[0.2em] text-gray-900">
                  AASHISH
                </h1>
                <p className="text-[9px] tracking-[0.3em] text-gray-500">JEWELLERS</p>
              </a>
            </Link>
          </div>
          
          {/* Right Column - Navigation + Icons */}
          <div className="flex items-center justify-end space-x-6">
            {/* Right Navigation */}
            <div className="flex items-center space-x-8">
              {links.slice(2).map(({ href, label, action }) => (
                <button
                  key={href}
                  onClick={action}
                  className={cn(
                    "text-xs tracking-[0.2em] font-light transition-all duration-300 hover:opacity-100",
                    location === "/" 
                      ? "text-gray-900 opacity-100" 
                      : "text-gray-600 opacity-70"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            
            {/* Icons */}
            <div className="flex items-center gap-6">
              <button className="group">
                <Search className="w-5 h-5 text-gray-700" strokeWidth={1} />
              </button>
              
              <button className="group">
                <User className="w-5 h-5 text-gray-700" strokeWidth={1} />
              </button>
              
              <button
                className="relative group"
                onClick={openCart}
              >
                <ShoppingBag className="w-5 h-5 text-gray-700" strokeWidth={1} />
                {count > 0 && (
                  <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-light">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-white border-t border-gray-100">
          <div className="py-8 px-6">
            {links.map(({ href, label, action }) => (
              <button
                key={href}
                onClick={() => {
                  action();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-3 text-sm tracking-[0.2em] font-light text-gray-700 hover:text-gray-900 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}