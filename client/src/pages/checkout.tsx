import { useEffect, useRef, useState } from 'react';
import { useCartContext } from '../contexts/CartContext';
import { CustomerInfo, GiftOptions, Order } from '../types/order';
import { Check, ChevronDown, Gift, MessageCircle } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { needsRingSize, ringSizeLabel } from '@/lib/ring-sizes';
import { formatProductLabel } from '@/lib/product-taxonomy';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';
import FonePayQRModal from '../components/FonePayQRModal';

const DEFAULT_GIFT_OPTIONS: GiftOptions = {
  isGift: false,
  giftWrap: true,
  giftNote: '',
  giftCard: false,
  recipient: '',
  occasion: '',
  specialInstructions: '',
};

const CARD_CLASS = 'flex flex-col gap-3.5 rounded-2xl border border-stone-200 bg-white p-6';
const LABEL_CLASS = 'flex flex-col gap-1.5 text-xs text-stone-600';
// 16px on phones so iOS Safari doesn't zoom into the field.
const INPUT_CLASS = 'h-12 w-full rounded-[10px] border border-stone-300 bg-white px-3.5 text-base text-stone-900 placeholder:text-stone-400 focus:border-forest-900 focus:outline-none md:text-sm';
const CITIES = ['Butwal', 'Bhairahawa', 'Kathmandu', 'Pokhara'];
// Only methods that are set up end to end. eSewa, Khalti and FonePay need keys and live testing first.
const PAYMENT_OPTIONS = [
  { id: 'whatsapp' as const, label: 'Confirm on WhatsApp', sub: 'We confirm your order and delivery time in chat.' },
  { id: 'cod' as const, label: 'Cash on Delivery', sub: 'Pay when your order arrives.' },
];
const TEXTAREA_CLASS = 'min-h-24 w-full rounded-[10px] border border-stone-300 bg-white px-3.5 py-2.5 text-base text-stone-900 placeholder:text-stone-400 focus:border-forest-900 focus:outline-none md:text-sm';

export default function Checkout() {
  const { items, total, clearCart, refreshPrices, gift, setGift, openCart } = useCartContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [priceSyncing, setPriceSyncing] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    email: '',
    address: {
      street: '',
      district: '',
      zone: '',
      landmark: '',
    },
    giftOptions: DEFAULT_GIFT_OPTIONS,
  });
  const [paymentMethod, setPaymentMethod] = useState<'esewa' | 'khalti' | 'cod' | 'whatsapp' | 'fonepay'>('whatsapp');
  const [showFonePayModal, setShowFonePayModal] = useState(false);
  const [fonePayOrderId, setFonePayOrderId] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [promoApplied, setPromoApplied] = useState<{ code: string; discountAmount: number; description: string | null } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [codSaveFailed, setCodSaveFailed] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [otherCity, setOtherCity] = useState(false);
  const cartSaved = useRef(false);
  const initialPriceSyncDone = useRef(false);
  // "Is this a gift" lives in the cart so the product page, bag and checkout always agree.
  const giftOptions = { ...(customerInfo.giftOptions || DEFAULT_GIFT_OPTIONS), isGift: gift };

  const discountAmount = promoApplied?.discountAmount ?? 0;
  const deliveryFee = total >= 5000 ? 0 : 150;
  const finalTotal = total - discountAmount + deliveryFee;

  useEffect(() => {
    if (initialPriceSyncDone.current) {
      return;
    }

    initialPriceSyncDone.current = true;

    let cancelled = false;

    const syncPrices = async () => {
      setPriceSyncing(true);
      const didChange = await refreshPrices();

      if (!cancelled && didChange) {
        setPromoApplied(null);
        setPromoError('Prices were refreshed using the latest catalog pricing. Apply your promo again if needed.');
        toast({
          title: 'Bag pricing updated',
          description: 'We refreshed your items before checkout so the total matches the latest catalog price.',
        });
      }

      if (!cancelled) {
        setPriceSyncing(false);
      }
    };

    void syncPrices();

    return () => {
      cancelled = true;
    };
  }, [refreshPrices, toast]);

  // Must stay below all hooks: the cart empties after a successful order.
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="px-4 py-20">
          <div className="mx-auto max-w-md rounded-2xl border border-stone-200 bg-white px-8 py-10 text-center">
            <h1 className="font-serif text-3xl font-normal text-stone-900">Your bag is empty</h1>
            <p className="mt-4 text-stone-500">Add a few pieces before moving to checkout.</p>
            <Link
              href="/collections"
              className="mt-8 inline-flex h-12 items-center rounded-full bg-forest-900 px-7 text-xs uppercase tracking-[0.16em] text-white hover:bg-forest-700"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setCustomerInfo(prev => ({
        ...prev,
        address: { ...prev.address, [addressField]: value },
      }));
    } else {
      setCustomerInfo(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleGiftOptionChange = (field: keyof GiftOptions, value: string | boolean) => {
    if (field === 'isGift') { setGift(Boolean(value)); return; }
    setCustomerInfo(prev => ({
      ...prev,
      giftOptions: {
        ...(prev.giftOptions || DEFAULT_GIFT_OPTIONS),
        [field]: value,
      },
    }));
  };

  const handleApplyPromo = async () => {
    const code = promoInput.trim();
    if (!code) return;

    setPromoLoading(true);
    setPromoError('');
    setPromoApplied(null);

    try {
      const res = await fetch('/api/promos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal: total }),
      });
      const data = await res.json();
      if (data.valid) {
        setPromoApplied({ code: data.code, discountAmount: data.discountAmount, description: data.description });
      } else {
        setPromoError(data.error || 'Invalid promo code.');
      }
    } catch {
      setPromoError('Could not validate code. Try again.');
    } finally {
      setPromoLoading(false);
    }
  };

  const handlePhoneBlur = () => {
    if (cartSaved.current) return;
    const name = customerInfo.name.trim();
    const phone = customerInfo.phone.trim();
    if (!name || phone.length < 7 || items.length === 0) return;
    cartSaved.current = true;
    fetch('/api/carts/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, items, subtotal: total }),
    }).catch(() => {});
  };

  const validateForm = () => {
    const { name, phone, address } = customerInfo;
    if (!name.trim()) {
      toast({ title: 'Please enter your name', variant: 'destructive' });
      return false;
    }
    if (!phone.trim() || phone.length < 10) {
      toast({ title: 'Please enter a valid phone number', variant: 'destructive' });
      return false;
    }
    if (!address.street.trim() || !address.district.trim()) {
      toast({ title: 'Please enter your complete address', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const buildWhatsAppOrderUrl = (paymentLabel: string) => {
    const orderSummary = items
      .map(item => `- ${item.name}${needsRingSize(item.category) ? ` (${ringSizeLabel(item.size)})` : ''} x${item.quantity} - NPR ${(item.price * item.quantity).toLocaleString()}`)
      .join('\n');

    const deliveryInfo = deliveryFee === 0 ? 'Free Delivery' : `Delivery: NPR ${deliveryFee}`;
    const discountInfo = discountAmount > 0 ? `\nPromo (${promoApplied?.code}): -NPR ${discountAmount.toLocaleString()}` : '';
    const giftSummary = giftOptions.isGift
      ? `\n\nGift Details:\nGift Wrap: ${giftOptions.giftWrap ? 'Yes' : 'No'}\nRecipient: ${giftOptions.recipient || 'Not specified'}\nOccasion: ${giftOptions.occasion || 'Not specified'}${giftOptions.giftCard ? '\nGift Card: Requested' : ''}${giftOptions.giftNote ? `\nGift Note: ${giftOptions.giftNote}` : ''}${giftOptions.specialInstructions ? `\nSpecial Instructions: ${giftOptions.specialInstructions}` : ''}`
      : '';

    const whatsappMessage = `New Order from Aashish Jewellers

Customer Details:
Name: ${customerInfo.name}
Phone: ${customerInfo.phone}

Delivery Address:
${customerInfo.address.street}
${customerInfo.address.district}${customerInfo.address.zone ? `, ${customerInfo.address.zone}` : ''}
${customerInfo.address.landmark ? `Near: ${customerInfo.address.landmark}` : ''}

Order Items:
${orderSummary}

Payment Summary:
Subtotal: NPR ${total.toLocaleString()}${discountInfo}
${deliveryInfo}
Total: NPR ${finalTotal.toLocaleString()}

Payment Method: ${paymentLabel}${giftSummary}

Please confirm this order and estimated delivery time.`;

    return `https://wa.me/9779811469486?text=${encodeURIComponent(whatsappMessage)}`;
  };

  // Opened from a tap (not after the failed request) so mobile pop-up blockers allow it.
  const sendCodOrderOnWhatsApp = () => {
    window.open(buildWhatsAppOrderUrl('Cash on Delivery'), '_blank');
    clearCart();
    setTimeout(() => {
      window.location.href = `/order-success?id=&payment=whatsapp&amount=${finalTotal}&phone=${encodeURIComponent(customerInfo.phone)}`;
    }, 1000);
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    setCodSaveFailed(false);
    setLoading(true);
    try {
      const pricesChanged = await refreshPrices();
      if (pricesChanged) {
        setPromoApplied(null);
        setPromoError('Prices changed just now. Please review the updated total and apply your promo again if needed.');
        toast({
          title: 'Prices updated',
          description: 'Your bag was refreshed with the latest pricing. Review the total once before placing the order.',
        });
        return;
      }

      const order: Omit<Order, 'id' | 'createdAt'> = {
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          ...(item.size ? { size: item.size } : {}),
        })),
        customer: { ...customerInfo, giftOptions },
        total: finalTotal,
        paymentMethod,
        status: 'pending',
        ...(promoApplied ? { promoCode: promoApplied.code } : {}),
      };

      if (paymentMethod === 'cod') {
        const response = await fetch('/api/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...order, paymentMethod: 'cod' }),
        }).catch(() => null);

        if (response?.ok) {
          const { orderId } = await response.json();
          clearCart();
          toast({ title: 'Order placed successfully!', description: "We'll call you to confirm your order." });
          window.location.href = `/order-success?id=${orderId}&payment=cod&amount=${finalTotal}&phone=${encodeURIComponent(customerInfo.phone)}`;
        } else if (response && response.status < 500) {
          // Validation problems (stock, price, details) must be fixed, not routed around.
          const data = await response.json().catch(() => ({}));
          toast({ title: 'Order not placed', description: data.error || 'Please check your details and try again.', variant: 'destructive' });
        } else {
          // Server or network down: don't lose the sale, let the customer send it on WhatsApp.
          setCodSaveFailed(true);
        }
      } else if (paymentMethod === 'esewa') {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/api/payments/esewa/create';
        form.target = '_self';
        form.style.display = 'none';

        Object.entries(order).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = typeof value === 'object' ? JSON.stringify(value) : String(value);
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      } else if (paymentMethod === 'khalti') {
        const response = await fetch('/api/payments/khalti/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order),
        });

        if (response.ok) {
          const { paymentUrl, orderId } = await response.json();
          toast({
            title: 'Redirecting to Khalti',
            description: 'You will be redirected to Khalti payment page',
          });
          localStorage.setItem('pendingOrderId', orderId);
          window.location.href = paymentUrl;
        } else {
          const errorData = await response.json();
          console.error('Khalti payment error:', errorData);
          throw new Error(errorData.error || 'Failed to initiate Khalti payment');
        }
      } else if (paymentMethod === 'whatsapp') {
        const whatsappUrl = buildWhatsAppOrderUrl('Cash on Delivery / Bank Transfer');

        const response = await fetch('/api/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...order, paymentMethod: 'whatsapp' }),
        });

        const orderData = response.ok ? await response.json() : null;

        clearCart();
        toast({
          title: 'Redirecting to WhatsApp',
          description: 'Your order details will be sent via WhatsApp',
        });

        window.open(whatsappUrl, '_blank');

        const orderId = orderData?.orderId || '';
        setTimeout(() => {
          window.location.href = `/order-success?id=${orderId}&payment=whatsapp&amount=${finalTotal}&phone=${encodeURIComponent(customerInfo.phone)}`;
        }, 1000);
      } else if (paymentMethod === 'fonepay') {
        const response = await fetch('/api/payments/fonepay/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order),
        });

        if (response.ok) {
          const { orderId } = await response.json();
          setFonePayOrderId(orderId);
          toast({
            title: 'FonePay QR Generated',
            description: 'Scan the QR code to complete payment',
          });
          setShowFonePayModal(true);
        } else {
          const errorData = await response.json();
          console.error('FonePay payment error:', errorData);
          throw new Error(errorData.error || 'Failed to generate FonePay QR code');
        }
      }
    } catch (error) {
      console.error('Order placement error:', error);
      toast({
        title: 'Order failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };


  // City list covers most orders; "Other" opens a free-text district field.
  const cityChoice = CITIES.includes(customerInfo.address.district) ? customerInfo.address.district : customerInfo.address.district || otherCity ? 'Other' : '';
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const summaryBody = (
    <div className="flex flex-col gap-4">
      {items.map(item => (
        <div key={`${item.id}-${item.size || ''}`} className="flex items-center gap-3">
          <div className="relative flex-none">
            <img src={item.image} alt={item.name} className="h-[70px] w-14 rounded-lg bg-cream-card object-cover" />
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-forest-900 text-[11px] text-white">{item.quantity}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-stone-900">{item.name}</p>
            <p className="text-xs text-stone-500">{needsRingSize(item.category) ? ringSizeLabel(item.size) : formatProductLabel(item.category || item.material)}</p>
          </div>
          <p className="text-sm text-stone-900">NPR {(item.price * item.quantity).toLocaleString()}</p>
        </div>
      ))}

      {promoApplied ? (
        <div className="flex items-center justify-between rounded-[10px] border border-forest-200 bg-forest-50 px-3.5 py-3 text-sm">
          <div>
            <p className="font-medium text-forest-900">{promoApplied.code} applied</p>
            {promoApplied.description && <p className="text-xs text-forest-600">{promoApplied.description}</p>}
          </div>
          <button
            type="button"
            onClick={() => { setPromoApplied(null); setPromoInput(''); setPromoError(''); }}
            className="py-2 text-xs text-forest-900 underline underline-offset-4"
          >
            Remove
          </button>
        </div>
      ) : (
        <div>
          <div className="flex gap-2">
            <input
              value={promoInput}
              onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
              placeholder="Promo code"
              aria-label="Promo code"
              autoComplete="off"
              className={`${INPUT_CLASS} h-11 min-w-0 flex-1`}
            />
            <button
              type="button"
              onClick={handleApplyPromo}
              disabled={promoLoading || !promoInput.trim()}
              className="h-11 rounded-[10px] border border-forest-900 bg-white px-[18px] text-[13px] text-forest-900 disabled:opacity-40"
            >
              {promoLoading ? '...' : 'Apply'}
            </button>
          </div>
          {promoError && <p className="mt-1.5 text-xs text-red-700">{promoError}</p>}
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-stone-200 pt-3.5 text-sm text-stone-700">
        <div className="flex justify-between"><span>Subtotal</span><span>NPR {total.toLocaleString()}</span></div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-forest-700"><span>Promo ({promoApplied?.code})</span><span>-NPR {discountAmount.toLocaleString()}</span></div>
        )}
        <div className="flex justify-between">
          <span>Delivery</span>
          <span>{deliveryFee === 0 ? 'Free' : `NPR ${deliveryFee}`}</span>
        </div>
        {deliveryFee > 0 && <p className="text-xs text-stone-500">Add NPR {(5000 - total).toLocaleString()} more for free delivery.</p>}
        <div className="mt-1 flex justify-between border-t border-stone-200 pt-2 text-[17px] font-medium text-stone-900">
          <span>Total</span><span>NPR {finalTotal.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream">
      <section className="mx-auto grid max-w-[1120px] items-start gap-6 px-4 pb-6 pt-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-14 lg:px-10 lg:pb-20 lg:pt-7">
        <div className="flex flex-col gap-5">
          <h1 className="sr-only">Checkout</h1>

          <div className={CARD_CLASS}>
            <h2 className="font-serif text-xl font-normal text-stone-900">1. Contact</h2>
            <div className="grid gap-3 lg:grid-cols-2">
              <label className={LABEL_CLASS}>
                Full name
                <input id="name" autoComplete="name" value={customerInfo.name} onChange={e => handleInputChange('name', e.target.value)} placeholder="Your name" className={INPUT_CLASS} />
              </label>
              <label className={LABEL_CLASS}>
                Mobile number
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={customerInfo.phone}
                  onChange={e => handleInputChange('phone', e.target.value)}
                  onBlur={handlePhoneBlur}
                  placeholder="98XXXXXXXX"
                  className={INPUT_CLASS}
                />
              </label>
            </div>
          </div>

          <div className={CARD_CLASS}>
            <h2 className="font-serif text-xl font-normal text-stone-900">2. Delivery address</h2>
            <div className="grid gap-3 lg:grid-cols-2">
              <label className={LABEL_CLASS}>
                City
                <select
                  id="city"
                  autoComplete="address-level2"
                  value={cityChoice}
                  onChange={e => {
                    const value = e.target.value;
                    setOtherCity(value === 'Other');
                    handleInputChange('address.district', value === 'Other' ? '' : value);
                  }}
                  className={`${INPUT_CLASS} px-3`}
                >
                  <option value="" disabled>Choose your city</option>
                  {[...CITIES, 'Other'].map(city => <option key={city} value={city}>{city === 'Other' ? 'Other city' : city}</option>)}
                </select>
              </label>
              {cityChoice === 'Other' && (
                <label className={LABEL_CLASS}>
                  City / district
                  <input id="district" autoComplete="address-level2" value={customerInfo.address.district} onChange={e => handleInputChange('address.district', e.target.value)} placeholder="e.g. Chitwan" className={INPUT_CLASS} />
                </label>
              )}
              <label className={LABEL_CLASS}>
                Area / street
                <input id="street" autoComplete="street-address" value={customerInfo.address.street} onChange={e => handleInputChange('address.street', e.target.value)} placeholder="e.g. Traffic Chowk" className={INPUT_CLASS} />
              </label>
            </div>
            <label className={LABEL_CLASS}>
              Landmark (optional)
              <input id="landmark" value={customerInfo.address.landmark} onChange={e => handleInputChange('address.landmark', e.target.value)} placeholder="Near school, temple, chowk..." className={INPUT_CLASS} />
            </label>
          </div>

          <div className={CARD_CLASS}>
            <h2 className="font-serif text-xl font-normal text-stone-900">3. Payment</h2>
            <div role="radiogroup" aria-label="Payment method" className="flex flex-col gap-3">
              {PAYMENT_OPTIONS.map(option => {
                const on = paymentMethod === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => { setPaymentMethod(option.id); setCodSaveFailed(false); }}
                    className={cn('flex min-h-[60px] items-center gap-3.5 rounded-xl border px-4 py-3 text-left', on ? 'border-forest-900 bg-forest-50' : 'border-stone-200 bg-white')}
                  >
                    <span className={cn('flex h-5 w-5 flex-none items-center justify-center rounded-full border', on ? 'border-forest-900' : 'border-stone-300')}>
                      {on && <span className="h-2.5 w-2.5 rounded-full bg-forest-900" />}
                    </span>
                    <span className="flex flex-1 flex-col gap-0.5">
                      <span className="text-sm font-medium text-stone-900">{option.label}</span>
                      <span className="text-xs text-stone-600">{option.sub}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {codSaveFailed && paymentMethod === 'cod' && (
              <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                <p className="font-medium">We couldn&apos;t save your order just now.</p>
                <p className="mt-1 text-amber-800">
                  Send it to us on WhatsApp instead. Your details are filled in, and we&apos;ll confirm by phone.
                </p>
                <button
                  type="button"
                  onClick={sendCodOrderOnWhatsApp}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1ebe5b]"
                >
                  <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
                  Send order on WhatsApp
                </button>
              </div>
            )}
          </div>

          {/* Gift details stay available: customers write notes that go in the package. */}
          <div className={CARD_CLASS}>
            <button
              type="button"
              role="checkbox"
              aria-checked={giftOptions.isGift}
              onClick={() => handleGiftOptionChange('isGift', !giftOptions.isGift)}
              className="flex items-center gap-3 text-left"
            >
              <Gift className="h-5 w-5 flex-none text-[#8b6b1f]" strokeWidth={1.5} />
              <span className="flex flex-1 flex-col">
                <span className="text-sm font-medium text-stone-900">This order is a gift</span>
                <span className="text-xs text-stone-600">Gift-ready packaging, a note, and recipient details</span>
              </span>
              <span className={cn('flex h-5 w-5 flex-none items-center justify-center rounded border', giftOptions.isGift ? 'border-forest-900 bg-forest-900 text-white' : 'border-stone-400 bg-white')}>
                {giftOptions.isGift && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
            </button>
            {giftOptions.isGift && (
              <div className="grid gap-3 border-t border-stone-200 pt-4">
                <label className="flex items-center gap-2.5 text-sm text-stone-900">
                  <input type="checkbox" checked={giftOptions.giftWrap} onChange={e => handleGiftOptionChange('giftWrap', e.target.checked)} className="h-4 w-4 accent-forest-900" />
                  Add gift wrap (no extra charge)
                </label>
                <div className="grid gap-3 lg:grid-cols-2">
                  <label className={LABEL_CLASS}>
                    Recipient
                    <input id="gift-recipient" value={giftOptions.recipient} onChange={e => handleGiftOptionChange('recipient', e.target.value)} placeholder="For her, mother, sister..." className={INPUT_CLASS} />
                  </label>
                  <label className={LABEL_CLASS}>
                    Occasion
                    <input id="gift-occasion" value={giftOptions.occasion} onChange={e => handleGiftOptionChange('occasion', e.target.value)} placeholder="Birthday, anniversary..." className={INPUT_CLASS} />
                  </label>
                </div>
                <label className={LABEL_CLASS}>
                  Gift note
                  <textarea id="gift-note" value={giftOptions.giftNote} onChange={e => handleGiftOptionChange('giftNote', e.target.value)} placeholder="The note that goes inside the package" className={TEXTAREA_CLASS} />
                </label>
                <label className="flex items-center gap-2.5 text-sm text-stone-900">
                  <input type="checkbox" checked={giftOptions.giftCard} onChange={e => handleGiftOptionChange('giftCard', e.target.checked)} className="h-4 w-4 accent-forest-900" />
                  I&apos;d like help with a gift card
                </label>
                <label className={LABEL_CLASS}>
                  Special instructions
                  <textarea id="gift-instructions" value={giftOptions.specialInstructions} onChange={e => handleGiftOptionChange('specialInstructions', e.target.value)} placeholder="Packaging, call before delivery, preferred timing..." className={TEXTAREA_CLASS} />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Summary: first and collapsible on phones, sticky beside the form on desktop */}
        <aside className="order-first rounded-2xl border border-stone-200 bg-white p-[18px] lg:sticky lg:top-6 lg:order-none lg:p-6">
          <button
            type="button"
            onClick={() => setSummaryOpen(o => !o)}
            aria-expanded={summaryOpen}
            className="flex w-full items-center justify-between gap-3 text-left text-stone-900 lg:pointer-events-none"
          >
            <span className="font-serif text-xl">Order summary <span className="text-sm text-stone-500">({itemCount})</span></span>
            <span className="flex items-center gap-1.5 text-[15px] font-semibold lg:hidden">
              NPR {finalTotal.toLocaleString()}
              <ChevronDown className={cn('h-4 w-4 transition-transform', summaryOpen && 'rotate-180')} strokeWidth={1.5} />
            </span>
          </button>
          <div className={cn('mt-4', !summaryOpen && 'hidden lg:block')}>{summaryBody}</div>
          <div className="mt-4 hidden flex-col gap-4 lg:flex">
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={loading || priceSyncing}
              className="h-[54px] rounded-full bg-forest-900 text-xs font-medium uppercase tracking-[0.14em] text-white hover:bg-forest-700 disabled:opacity-60"
            >
              {loading ? 'Processing...' : `Place order · NPR ${finalTotal.toLocaleString()}`}
            </button>
            <button type="button" onClick={openCart} className="py-1 text-[13px] text-forest-900">← Back to bag</button>
          </div>
        </aside>
      </section>

      {/* Phone action bar */}
      <div className="sticky bottom-0 z-[15] flex items-center gap-3.5 border-t border-stone-200 bg-white px-4 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-6px_20px_rgba(0,0,0,0.05)] lg:hidden">
        <div className="flex flex-col">
          <span className="text-[11px] text-stone-600">Total</span>
          <span className="whitespace-nowrap text-[17px] font-semibold text-stone-900">NPR {finalTotal.toLocaleString()}</span>
        </div>
        <button
          type="button"
          onClick={handlePlaceOrder}
          disabled={loading || priceSyncing}
          className="h-[50px] flex-1 rounded-[10px] bg-forest-900 text-xs font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-60"
        >
          {loading ? 'Processing...' : 'Place order'}
        </button>
      </div>

      <FonePayQRModal
        isOpen={showFonePayModal}
        onClose={() => setShowFonePayModal(false)}
        orderTotal={finalTotal}
        orderId={fonePayOrderId}
        customerName={customerInfo.name}
        onPaymentComplete={() => {
          clearCart();
          window.location.href = `/order-success?id=${fonePayOrderId}&payment=fonepay&phone=${encodeURIComponent(customerInfo.phone)}`;
        }}
      />
    </div>
  );
}
