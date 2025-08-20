import { Link, useLocation } from "wouter";
import { ShoppingBag, Search, User, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartContext } from "../contexts/CartContext";
import { useState } from "react";

export default function Nav() {
  const [location] = useLocation();
  const { count, openCart } = useCartContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { href: "/", label: "HOME" },
    { href: "/about", label: "COLLECTIONS" },
    { href: "#", label: "ABOUT" },
    { href: "#", label: "CONTACT" },
  ];

  return (
    <nav className="fixed top-0 z-50 w-full bg-white/95 backdrop-blur-sm">
      <div className="container mx-auto px-6">
        <div className="flex h-20 items-center justify-between">
          {/* Left - Mobile Menu */}
          <button 
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="w-6 h-6" strokeWidth={1} />
          </button>
          
          {/* Center - Brand Name - Luxury Typography */}
          <Link href="/">
            <a className="absolute left-1/2 transform -translate-x-1/2">
              <h1 className="text-2xl font-serif font-light tracking-[0.2em] text-gray-900">
                AASHISH
              </h1>
              <p className="text-[10px] tracking-[0.3em] text-gray-500 text-center">JEWELLERS</p>
            </a>
          </Link>
          
          {/* Left Navigation - Desktop */}
          <div className="hidden md:flex items-center space-x-12">
            {links.slice(0, 2).map(({ href, label }) => (
              <Link key={href} href={href}>
                <a
                  className={cn(
                    "text-xs tracking-[0.2em] font-light transition-all duration-300 hover:opacity-100",
                    location === href 
                      ? "text-gray-900 opacity-100" 
                      : "text-gray-600 opacity-70"
                  )}
                >
                  {label}
                </a>
              </Link>
            ))}
          </div>
          
          {/* Right Navigation - Desktop */}
          <div className="hidden md:flex items-center space-x-12">
            {links.slice(2).map(({ href, label }) => (
              <Link key={href} href={href}>
                <a
                  className={cn(
                    "text-xs tracking-[0.2em] font-light transition-all duration-300 hover:opacity-100",
                    location === href 
                      ? "text-gray-900 opacity-100" 
                      : "text-gray-600 opacity-70"
                  )}
                >
                  {label}
                </a>
              </Link>
            ))}
          </div>
          
          {/* Right Side Icons */}
          <div className="flex items-center gap-6">
            <button className="hidden md:block group">
              <Search className="w-5 h-5 text-gray-700" strokeWidth={1} />
            </button>
            
            <button className="hidden md:block group">
              <User className="w-5 h-5 text-gray-700" strokeWidth={1} />
            </button>
            
            {/* Cart Button */}
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
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-white border-t border-gray-100">
          <div className="py-8 px-6">
            {links.map(({ href, label }) => (
              <Link key={href} href={href}>
                <a
                  className="block py-3 text-sm tracking-[0.2em] font-light text-gray-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {label}
                </a>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}