import { Link, useLocation } from "wouter";
import { ShoppingBag, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartContext } from "../contexts/CartContext";
import { Button } from "./ui/button";
import homeContent from "@/content/home.json";

export default function Nav() {
  const [location] = useLocation();
  const { count, openCart } = useCartContext();

  const links = [
    { href: "/", label: "HOME" },
    { href: "/about", label: "SHOP" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-gray-200">
      <div className="container flex h-20 items-center justify-between">
        {/* Brand Name with Border */}
        <Link href="/">
          <a className="text-center border border-gray-300 px-6 py-3 rounded-sm hover:border-gray-400 transition-colors">
            <h1 className="text-lg font-serif font-bold text-gray-900 tracking-wide">
              {homeContent.brand.name}
            </h1>
          </a>
        </Link>
        
        {/* Center Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {links.map(({ href, label }) => (
            <Link key={href} href={href}>
              <a
                className={cn(
                  "text-sm font-medium tracking-wide transition-colors hover:text-gray-900",
                  location === href ? "text-gray-900 border-b-2 border-gray-900 pb-1" : "text-gray-600"
                )}
              >
                {label}
              </a>
            </Link>
          ))}
        </div>
        
        {/* Right Side Icons */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="hidden md:flex">
            <Search className="w-5 h-5 text-gray-600" />
          </Button>
          
          <Button variant="ghost" size="sm" className="hidden md:flex">
            <User className="w-5 h-5 text-gray-600" />
          </Button>
          
          {/* Cart Button */}
          <Button
            variant="ghost"
            size="sm"
            className="relative"
            onClick={openCart}
          >
            <ShoppingBag className="w-5 h-5 text-gray-600" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center min-w-[20px] h-5">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </Button>
        </div>
      </div>
    </nav>
  );
}