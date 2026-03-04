import SiteMeta from '@/components/SiteMeta';

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-[#f7f2ea] pt-24">
      <SiteMeta title="Returns & Refund Policy" />
      <div className="max-w-2xl mx-auto px-6 py-12">
        <p className="text-xs tracking-[0.25em] uppercase text-stone-400 mb-2">Customer Care</p>
        <h1 className="text-3xl font-serif font-light text-stone-900 mb-10">Returns & Refund Policy</h1>

        <div className="space-y-8 text-sm text-stone-600 leading-relaxed">
          <section>
            <h2 className="text-xs tracking-[0.2em] uppercase text-stone-500 mb-3">30-Day Return Window</h2>
            <p>We accept returns within <strong>30 days</strong> of delivery. Items must be unworn, unaltered, and in original condition with any packaging.</p>
          </section>

          <section>
            <h2 className="text-xs tracking-[0.2em] uppercase text-stone-500 mb-3">How to Return</h2>
            <ol className="space-y-2 list-decimal list-inside">
              <li>Message us on WhatsApp with your order ID and reason for return</li>
              <li>We will confirm eligibility within 1 business day</li>
              <li>Send the item to our Butwal address (shipping cost is yours unless the item was defective)</li>
              <li>Refund is processed within 3–5 business days after we receive and inspect the item</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xs tracking-[0.2em] uppercase text-stone-500 mb-3">Refund Method</h2>
            <p>Refunds are returned to the original payment method (eSewa, Khalti, FonePay, or bank transfer for COD orders).</p>
          </section>

          <section>
            <h2 className="text-xs tracking-[0.2em] uppercase text-stone-500 mb-3">Non-Returnable Items</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Custom or engraved pieces</li>
              <li>Items damaged due to misuse or improper care</li>
              <li>Items returned after 30 days</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xs tracking-[0.2em] uppercase text-stone-500 mb-3">Defective Items</h2>
            <p>If you receive a damaged or defective item, contact us within 7 days of delivery. We will replace it or issue a full refund including return shipping.</p>
          </section>

          <section>
            <h2 className="text-xs tracking-[0.2em] uppercase text-stone-500 mb-3">Contact Us</h2>
            <p>
              WhatsApp: <a href="https://wa.me/9779811469486" className="text-stone-800 underline">+977 981 146 9486</a><br />
              Aashish Jewellers, Butwal, Rupandehi, Nepal
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
