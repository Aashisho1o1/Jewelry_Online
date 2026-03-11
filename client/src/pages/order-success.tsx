import React from 'react';
import { CheckCircle2, Package, MessageCircle, Home, Printer } from 'lucide-react';
import { Link } from 'wouter';
import SiteMeta from '@/components/SiteMeta';

const PAYMENT_LABELS: Record<string, string> = {
  esewa: 'eSewa',
  khalti: 'Khalti',
  fonepay: 'FonePay',
  whatsapp: 'WhatsApp Order',
  cod: 'Cash on Delivery',
};

export default function OrderSuccess() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('id') || 'N/A';
  const paymentMethod = urlParams.get('payment') || '';
  const amountParam = urlParams.get('amount');
  const amount = amountParam && !isNaN(parseFloat(amountParam)) ? amountParam : null;
  const transactionId = urlParams.get('txn');
  const customerPhone = urlParams.get('phone') || '';

  React.useEffect(() => {
    localStorage.removeItem('pendingOrderId');
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f2ea]">
      <SiteMeta title="Order Placed" noindex={true} />

      <div className="container py-12 md:py-20">
        <div className="max-w-xl mx-auto">

          {/* Success header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-stone-900 rounded-full mb-6">
              <CheckCircle2 className="w-8 h-8 text-white" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-light text-stone-900 mb-3">
              Order Placed
            </h1>
            <p className="text-stone-500 font-light">
              Thank you - we&apos;ll call to confirm your order shortly.
            </p>
          </div>

          {/* Order details card */}
          <div className="bg-white border border-stone-200 mb-6">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-stone-600" strokeWidth={1.5} />
              <span className="text-xs tracking-[0.18em] uppercase text-stone-600">Order Details</span>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-sm text-stone-500">Order ID</span>
                <span className="font-mono text-sm font-medium text-stone-900">{orderId}</span>
              </div>

              {paymentMethod && (
                <div className="flex justify-between items-start">
                  <span className="text-sm text-stone-500">Payment</span>
                  <div className="text-right">
                    <span className="text-sm font-medium text-stone-900">
                      {PAYMENT_LABELS[paymentMethod] || paymentMethod}
                    </span>
                    {(paymentMethod === 'esewa' || paymentMethod === 'khalti' || paymentMethod === 'fonepay') && (
                      <p className="text-xs text-green-600 mt-0.5">Payment verified</p>
                    )}
                  </div>
                </div>
              )}

              {amount && (
                <div className="flex justify-between items-start">
                  <span className="text-sm text-stone-500">Amount</span>
                  <span className="text-sm font-medium text-stone-900">
                    NPR {parseFloat(amount).toLocaleString()}
                  </span>
                </div>
              )}

              {transactionId && (
                <div className="flex justify-between items-start">
                  <span className="text-sm text-stone-500">Transaction</span>
                  <span className="font-mono text-xs text-stone-600">{transactionId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Next steps */}
          <div className="bg-white border border-stone-200 mb-6">
            <div className="px-6 py-4 border-b border-stone-100">
              <span className="text-xs tracking-[0.18em] uppercase text-stone-600">What happens next</span>
            </div>
            <div className="px-6 py-5 space-y-5">
              {[
                {
                  step: 1,
                  title: 'Order Confirmation',
                  desc: "We'll call you within a few hours to confirm your order and delivery details.",
                },
                {
                  step: 2,
                  title: 'Preparation',
                  desc: 'Your jewellery is carefully cleaned, polished and packaged for dispatch.',
                },
                {
                  step: 3,
                  title: 'Delivery',
                  desc: 'Delivered within 2-4 business days anywhere in Nepal.',
                },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-4 items-start">
                  <div className="w-7 h-7 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-medium shrink-0">
                    {step}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-800">{title}</p>
                    <p className="text-sm text-stone-500 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact / help */}
          <div className="bg-white border border-stone-200 mb-8">
            <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-stone-800">Need help with your order?</p>
                <p className="text-sm text-stone-500 mt-0.5">Our team replies on WhatsApp within minutes.</p>
              </div>
              <a
                href={`https://wa.me/9779811469486?text=${encodeURIComponent(`Hi, I need help with my order ${orderId}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] text-white px-5 py-2.5 text-sm font-medium hover:bg-[#1ebe5d] transition-colors shrink-0"
              >
                <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
                WhatsApp Us
              </a>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-stone-900 text-white px-6 py-3.5 text-sm tracking-[0.15em] uppercase hover:bg-stone-700 transition-colors"
            >
              <Home className="w-4 h-4" strokeWidth={1.5} />
              Continue Shopping
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 inline-flex items-center justify-center gap-2 border border-stone-300 text-stone-700 px-6 py-3.5 text-sm tracking-[0.15em] uppercase hover:border-stone-900 hover:text-stone-900 transition-colors"
            >
              <Printer className="w-4 h-4" strokeWidth={1.5} />
              Print Receipt
            </button>
          </div>

          {customerPhone && (
            <div className="mt-4 text-center">
              <Link
                href={`/my-orders?phone=${encodeURIComponent(customerPhone)}&orderId=${encodeURIComponent(orderId)}`}
                className="text-xs text-stone-400 hover:text-stone-900 transition-colors"
              >
                View this order {'->'}
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
