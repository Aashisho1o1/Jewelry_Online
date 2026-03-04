import SiteMeta from '@/components/SiteMeta';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#f7f2ea] pt-24">
      <SiteMeta title="Privacy Policy" noindex={true} />
      <div className="max-w-2xl mx-auto px-6 py-12">
        <p className="text-xs tracking-[0.25em] uppercase text-stone-400 mb-2">Legal</p>
        <h1 className="text-3xl font-serif font-light text-stone-900 mb-10">Privacy Policy</h1>

        <div className="space-y-8 text-sm text-stone-600 leading-relaxed">
          <section>
            <h2 className="text-xs tracking-[0.2em] uppercase text-stone-500 mb-3">Information We Collect</h2>
            <p>When you place an order we collect your name, phone number, delivery address, and email (optional). We do not store payment card numbers — all payments are processed by eSewa, Khalti, or FonePay directly.</p>
          </section>

          <section>
            <h2 className="text-xs tracking-[0.2em] uppercase text-stone-500 mb-3">How We Use Your Information</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>To process and deliver your order</li>
              <li>To send order status updates via WhatsApp or SMS</li>
              <li>To respond to your customer service queries</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xs tracking-[0.2em] uppercase text-stone-500 mb-3">Data Sharing</h2>
            <p>We do not sell or share your personal information with third parties, except with our delivery partners to fulfil your order.</p>
          </section>

          <section>
            <h2 className="text-xs tracking-[0.2em] uppercase text-stone-500 mb-3">Cookies</h2>
            <p>We use cookies to keep your cart items saved between visits. No tracking or advertising cookies are used.</p>
          </section>

          <section>
            <h2 className="text-xs tracking-[0.2em] uppercase text-stone-500 mb-3">Your Rights</h2>
            <p>You may request deletion of your personal data at any time by contacting us on WhatsApp or by email.</p>
          </section>

          <section>
            <h2 className="text-xs tracking-[0.2em] uppercase text-stone-500 mb-3">Contact</h2>
            <p>Aashish Jewellers, Butwal, Rupandehi, Nepal.<br />
            WhatsApp: +977 981 146 9486</p>
          </section>

          <p className="text-xs text-stone-400 pt-4 border-t border-stone-200">Last updated: March 2026</p>
        </div>
      </div>
    </div>
  );
}
