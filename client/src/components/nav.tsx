import { Link, useLocation } from "wouter";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartContext } from "../contexts/CartContext";
import { Button } from "./ui/button";
import settingsContent from "@/content/settings.json";

export default function Nav() {
  const [location] = useLocation();
  const { count, openCart } = useCartContext();

  const links = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/">
          <a className="font-bold text-xl">
            {settingsContent.companyName || "Aashish Jewellers"}
          </a>
        </Link>
        
        <div className="flex items-center gap-6">
          {links.map(({ href, label }) => (
            <Link key={href} href={href}>
              <a
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  location === href ? "text-primary" : "text-muted-foreground"
                )}
              >
                {label}
              </a>
            </Link>
          ))}
          
          {/* Cart Button */}
          <Button
            variant="ghost"
            size="sm"
            className="relative"
            onClick={openCart}
          >
            <ShoppingBag className="w-5 h-5" />
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