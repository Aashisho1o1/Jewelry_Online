import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import settingsContent from "@/content/settings.json";

export default function Nav() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/">
          <a className="mr-8 font-bold text-xl">
            {settingsContent.companyName || "Aadarsh Jewellers"}
          </a>
        </Link>
        <div className="flex gap-6">
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
        </div>
      </div>
    </nav>
  );
}