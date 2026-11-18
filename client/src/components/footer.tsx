import settingsContent from "@/content/settings.json";
import aboutContent from "@/content/about.json";
import { Mail, Phone, MapPin } from "lucide-react";
import { SiInstagram, SiFacebook, SiTiktok } from "react-icons/si";

export default function Footer() {
  const { social, footer } = settingsContent;
  const { contact } = aboutContent;

  return (
    <footer id="contact" className="bg-forest-900 text-forest-200">
      <div className="mx-auto max-w-[1280px] px-4 md:px-10">
        <div className="grid grid-cols-2 gap-9 py-10 md:py-14 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div className="col-span-2 lg:col-span-1">
            <h3 className="text-2xl font-serif font-light tracking-[0.2em] text-white mb-1">AASHISH</h3>
            <p className="text-[9px] tracking-[0.3em] text-forest-400 mb-4">JEWELLERS</p>
            <p className="text-sm font-light leading-[1.7] text-forest-200">
              {footer?.text || "Handcrafted silver jewelry designed for daily wear, gifting, and special occasions. Based in Butwal, delivering across Nepal."}
            </p>
          </div>

          <div>
            <h4 className="text-[10px] tracking-[0.25em] text-forest-400 uppercase mb-4">Explore</h4>
            <ul className="space-y-0">
              <li><a href="/" className="inline-block py-1.5 text-sm text-forest-200 hover:text-white font-light transition-colors">Shop</a></li>
              <li><a href="/rates" className="inline-block py-1.5 text-sm text-forest-200 hover:text-white font-light transition-colors">Gold & Silver Rate</a></li>
              <li><a href="/shop-by" className="inline-block py-1.5 text-sm text-forest-200 hover:text-white font-light transition-colors">Gift Guide</a></li>
              <li><a href="/wishlist" className="inline-block py-1.5 text-sm text-forest-200 hover:text-white font-light transition-colors">Wishlist</a></li>
              <li><a href="/about" className="inline-block py-1.5 text-sm text-forest-200 hover:text-white font-light transition-colors">Our Story</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] tracking-[0.25em] text-forest-400 uppercase mb-4">Customer Care</h4>
            <ul className="space-y-0">
              <li><a href="/care-guide" className="inline-block py-1.5 text-sm text-forest-200 hover:text-white font-light transition-colors">Jewelry Care</a></li>
              <li><a href="/size-guide" className="inline-block py-1.5 text-sm text-forest-200 hover:text-white font-light transition-colors">Ring Size Guide</a></li>
              <li><a href="/my-orders" className="inline-block py-1.5 text-sm text-forest-200 hover:text-white font-light transition-colors">My Orders</a></li>
              <li><a href="/returns" className="inline-block py-1.5 text-sm text-forest-200 hover:text-white font-light transition-colors">Returns & Exchange</a></li>
              <li>
                <a
                  href="https://wa.me/9779811469486?text=Hi%2C%20I%20have%20a%20question%20about%20shipping."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block py-1.5 text-sm text-forest-200 hover:text-white font-light transition-colors"
                >
                  Shipping Info
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] tracking-[0.25em] text-forest-400 uppercase mb-4">Connect</h4>
            <div className="space-y-1 mb-6">
              {contact.phone && (
                <a
                  href={`tel:${contact.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-3 py-2 text-sm text-forest-200 hover:text-white font-light transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                  {contact.phone}
                </a>
              )}
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-3 py-2 text-sm text-forest-200 hover:text-white font-light transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                  {contact.email}
                </a>
              )}
              <div className="flex items-start gap-3 py-2 text-sm text-forest-200 font-light">
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={1.5} />
                <span>Butwal, Rupandehi, Nepal</span>
              </div>
            </div>

            <div className="flex gap-3">
              {social?.instagram && (
                <a
                  href={social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 border border-forest-700 flex items-center justify-center text-forest-200 hover:border-white hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <SiInstagram className="w-3.5 h-3.5" />
                </a>
              )}
              {social?.facebook && (
                <a
                  href={social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 border border-forest-700 flex items-center justify-center text-forest-200 hover:border-white hover:text-white transition-colors"
                  aria-label="Facebook"
                >
                  <SiFacebook className="w-3.5 h-3.5" />
                </a>
              )}
              {social?.tiktok && (
                <a
                  href={social.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 border border-forest-700 flex items-center justify-center text-forest-200 hover:border-white hover:text-white transition-colors"
                  aria-label="TikTok"
                >
                  <SiTiktok className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* md:pb-20 keeps the desktop WhatsApp button (bottom 20px + 56px tall) off the last line */}
        <div className="border-t border-forest-700 py-5 md:pb-20">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs font-light tracking-[0.1em] text-forest-400">
              {footer?.copyright || `Copyright ${new Date().getFullYear()} Aashish Jewellers. All rights reserved.`}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 text-xs text-forest-400">
              <a href="/privacy-policy" className="py-2 hover:text-white transition-colors">Privacy Policy</a>
              <span className="h-3 w-px bg-forest-700" />
              <a href="/terms" className="py-2 hover:text-white transition-colors">Terms</a>
              <span className="h-3 w-px bg-forest-700" />
              <span>925 Sterling Silver Certified</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
