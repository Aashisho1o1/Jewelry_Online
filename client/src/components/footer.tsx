import settingsContent from "@/content/settings.json";
import aboutContent from "@/content/about.json";
import { Mail, Phone, MapPin } from "lucide-react";
import { SiInstagram, SiFacebook, SiTiktok } from "react-icons/si";

export default function Footer() {
  const { social, footer } = settingsContent;
  const { contact } = aboutContent;

  return (
    <footer id="contact" className="bg-stone-900 text-stone-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="text-2xl font-serif font-light tracking-[0.2em] text-white mb-1">AASHISH</h3>
            <p className="text-[9px] tracking-[0.3em] text-stone-500 mb-5">JEWELLERS</p>
            <p className="text-sm text-stone-400 font-light leading-relaxed">
              {footer?.text || "Handcrafted silver jewelry designed for daily wear, gifting, and special occasions. Based in Butwal, delivering across Nepal."}
            </p>
          </div>

          <div>
            <h4 className="text-[10px] tracking-[0.25em] text-stone-500 uppercase mb-5">Explore</h4>
            <ul className="space-y-0">
              <li><a href="/" className="inline-block py-1.5 text-sm text-stone-400 hover:text-white font-light transition-colors">Shop</a></li>
              <li><a href="/rates" className="inline-block py-1.5 text-sm text-stone-400 hover:text-white font-light transition-colors">Gold & Silver Rate</a></li>
              <li><a href="/shop-by" className="inline-block py-1.5 text-sm text-stone-400 hover:text-white font-light transition-colors">Gift Guide</a></li>
              <li><a href="/wishlist" className="inline-block py-1.5 text-sm text-stone-400 hover:text-white font-light transition-colors">Wishlist</a></li>
              <li><a href="/about" className="inline-block py-1.5 text-sm text-stone-400 hover:text-white font-light transition-colors">Our Story</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] tracking-[0.25em] text-stone-500 uppercase mb-5">Customer Care</h4>
            <ul className="space-y-0">
              <li><a href="/care-guide" className="inline-block py-1.5 text-sm text-stone-400 hover:text-white font-light transition-colors">Jewelry Care</a></li>
              <li><a href="/size-guide" className="inline-block py-1.5 text-sm text-stone-400 hover:text-white font-light transition-colors">Ring Size Guide</a></li>
              <li><a href="/returns" className="inline-block py-1.5 text-sm text-stone-400 hover:text-white font-light transition-colors">Returns & Exchange</a></li>
              <li>
                <a
                  href="https://wa.me/9779811469486?text=Hi%2C%20I%20have%20a%20question%20about%20shipping."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block py-1.5 text-sm text-stone-400 hover:text-white font-light transition-colors"
                >
                  Shipping Info
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] tracking-[0.25em] text-stone-500 uppercase mb-5">Connect</h4>
            <div className="space-y-1 mb-6">
              {contact.phone && (
                <a
                  href={`tel:${contact.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-3 py-2 text-sm text-stone-400 hover:text-white font-light transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                  {contact.phone}
                </a>
              )}
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-3 py-2 text-sm text-stone-400 hover:text-white font-light transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                  {contact.email}
                </a>
              )}
              <div className="flex items-start gap-3 py-2 text-sm text-stone-400 font-light">
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
                  className="w-11 h-11 border border-stone-700 flex items-center justify-center text-stone-400 hover:border-white hover:text-white transition-colors"
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
                  className="w-11 h-11 border border-stone-700 flex items-center justify-center text-stone-400 hover:border-white hover:text-white transition-colors"
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
                  className="w-11 h-11 border border-stone-700 flex items-center justify-center text-stone-400 hover:border-white hover:text-white transition-colors"
                  aria-label="TikTok"
                >
                  <SiTiktok className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* pb-24 on phones keeps the floating chat button off the last line */}
        <div className="pt-5 pb-24 sm:pb-5 border-t border-stone-800">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs text-stone-600 font-light tracking-[0.1em]">
              {footer?.copyright || `Copyright ${new Date().getFullYear()} Aashish Jewellers. All rights reserved.`}
            </p>
            <div className="flex items-center gap-4 text-xs text-stone-600">
              <a href="/privacy-policy" className="py-2 hover:text-stone-400 transition-colors">Privacy Policy</a>
              <span className="w-px h-3 bg-stone-700" />
              <a href="/terms" className="py-2 hover:text-stone-400 transition-colors">Terms</a>
              <span className="w-px h-3 bg-stone-700" />
              <span>925 Sterling Silver Certified</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
