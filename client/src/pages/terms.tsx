import SiteMeta from '@/components/SiteMeta';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f7f2ea] pt-24">
      <SiteMeta title="Terms of Service" noindex={true} />
      <div className="max-w-2xl mx-auto px-6 py-12">
        <p className="text-xs tracking-[0.25em] uppercase text-stone-400 mb-2">Legal</p>
        <h1 className="text-3xl font-serif font-light text-stone-900 mb-10">Terms of Service</h1>

        <div className="space-y-8 text-sm text-stone-600 leading-relaxed">
          <section>
            <h2 className="text-xs tracking-[0.2em] uppercase text-stone-500 mb-3">About This Store</h2>
            <p>Aashish Jewellers is a Nepal-based retail store selling 925 sterling silver jewelry. By placing an order on this website you agree to these terms.</p>
          </section>

          <section>
            <h2 className="text-xs tracking-[0.2em] uppercase text-stone-500 mb-3">Orders & Payment</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>All prices are in Nepalese Rupees (NPR) and include applicable taxes</li>
              <li>Live-priced items may vary slightly based on current silver rates</li>
              <li>We reserve the right to cancel any order due to stock issues or payment failure</li>
              <li>COD orders must be paid in full upon delivery</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xs tracking-[0.2em] uppercase text-stone-500 mb-3">Shipping</h2>
            <p>We dispatch orders within 2–4 business days. Delivery across Nepal takes 3–7 business days depending on location. Free shipping on orders above NPR 5,000.</p>
          </section>

          <section>
            <h2 className="text-xs tracking-[0.2em] uppercase text-stone-500 mb-3">Product Accuracy</h2>
            <p>We make every effort to display product images accurately. Slight colour variations may occur due to screen settings. All weights and dimensions are approximate.</p>
          </section>

          <section>
            <h2 className="text-xs tracking-[0.2em] uppercase text-stone-500 mb-3">Intellectual Property</h2>
            <p>All product images, descriptions, and content on this website are the property of Aashish Jewellers and may not be reused without permission.</p>
          </section>

          <section>
            <h2 className="text-xs tracking-[0.2em] uppercase text-stone-500 mb-3">Limitation of Liability</h2>
            <p>Aashish Jewellers is not liable for delays caused by courier partners, payment gateways, or circumstances beyond our control.</p>
          </section>

          <section>
            <h2 className="text-xs tracking-[0.2em] uppercase text-stone-500 mb-3">Contact</h2>
            <p>
              WhatsApp: <a href="https://wa.me/9779811469486" className="text-stone-800 underline">+977 981 146 9486</a><br />
              Aashish Jewellers, Butwal, Rupandehi, Nepal
            </p>
          </section>

          <p className="text-xs text-stone-400 pt-4 border-t border-stone-200">Last updated: March 2026</p>
        </div>
      </div>
    </div>
  );
}
