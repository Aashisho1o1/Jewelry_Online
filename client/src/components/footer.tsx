import settingsContent from "@/content/settings.json";
import aboutContent from "@/content/about.json";
import { Instagram, Facebook, Linkedin, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  const { social, footer } = settingsContent;
  const { contact } = aboutContent;

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        {/* Main Footer Content */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <h3 className="text-2xl font-serif font-light tracking-[0.2em] mb-4">AASHISH</h3>
            <p className="text-xs tracking-[0.2em] text-gray-500 mb-6">JEWELLERS</p>
            <p className="text-sm text-gray-600 font-light leading-relaxed">
              Crafting timeless elegance in sterling silver since 2023
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="text-xs tracking-[0.2em] text-gray-900 mb-6">EXPLORE</h4>
            <ul className="space-y-3">
              <li><a href="/" className="text-sm text-gray-600 hover:text-gray-900 font-light transition-colors">Collections</a></li>
              <li><a href="/about" className="text-sm text-gray-600 hover:text-gray-900 font-light transition-colors">About Us</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 font-light transition-colors">Care Guide</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 font-light transition-colors">Size Guide</a></li>
            </ul>
          </div>
          
          {/* Customer Service */}
          <div>
            <h4 className="text-xs tracking-[0.2em] text-gray-900 mb-6">CUSTOMER CARE</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 font-light transition-colors">Shipping Info</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 font-light transition-colors">Returns</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 font-light transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 font-light transition-colors">Terms of Service</a></li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h4 className="text-xs tracking-[0.2em] text-gray-900 mb-6">CONNECT</h4>
            <div className="space-y-3">
              {contact.email && (
                <a 
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-3 text-sm text-gray-600 hover:text-gray-900 font-light transition-colors"
                >
                  <Mail className="w-4 h-4" strokeWidth={1} />
                  {contact.email}
                </a>
              )}
              {contact.phone && (
                <a 
                  href={`tel:${contact.phone.replace(/\s/g, '')}`}
                  className="flex items-center gap-3 text-sm text-gray-600 hover:text-gray-900 font-light transition-colors"
                >
                  <Phone className="w-4 h-4" strokeWidth={1} />
                  {contact.phone}
                </a>
              )}
              <div className="flex items-start gap-3 text-sm text-gray-600 font-light">
                <MapPin className="w-4 h-4 mt-0.5" strokeWidth={1} />
                <span>Kathmandu, Nepal</span>
              </div>
            </div>
            
            {/* Social Links */}
            <div className="flex gap-4 mt-6">
              {social?.instagram && (
                <a
                  href={social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 border border-gray-300 rounded-full flex items-center justify-center hover:border-gray-900 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" strokeWidth={1} />
                </a>
              )}
              {social?.facebook && (
                <a
                  href={social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 border border-gray-300 rounded-full flex items-center justify-center hover:border-gray-900 transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" strokeWidth={1} />
                </a>
              )}
              {social?.linkedin && (
                <a
                  href={social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 border border-gray-300 rounded-full flex items-center justify-center hover:border-gray-900 transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" strokeWidth={1} />
                </a>
              )}
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="py-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-500 font-light tracking-[0.1em]">
              {footer?.copyright || `© ${new Date().getFullYear()} AASHISH JEWELLERS. ALL RIGHTS RESERVED.`}
            </p>
            <div className="flex gap-6">
              <span className="text-xs text-gray-500 font-light">Secure Payments</span>
              <span className="text-xs text-gray-500 font-light">Free Shipping</span>
              <span className="text-xs text-gray-500 font-light">925 Silver Certified</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}