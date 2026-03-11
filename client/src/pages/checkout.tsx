import React, { useEffect, useRef, useState } from 'react';
import { useCartContext } from '../contexts/CartContext';
import { CustomerInfo, GiftOptions, Order } from '../types/order';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  CreditCard,
  Gift,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  QrCode,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
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

const SECTION_CLASS = 'border border-stone-200 bg-white p-6';
const TEXTAREA_CLASS = 'min-h-24 w-full border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10';

export default function Checkout() {
  const { items, total, clearCart, refreshPrices } = useCartContext();
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
  const cartSaved = useRef(false);
  const initialPriceSyncDone = useRef(false);
  const giftOptions = customerInfo.giftOptions || DEFAULT_GIFT_OPTIONS;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#faf8f5] pt-24">
        <div className="container py-20">
          <div className="mx-auto max-w-md border border-stone-200 bg-white px-8 py-10 text-center">
            <h1 className="text-3xl font-serif font-light text-stone-900">Your bag is empty</h1>
            <p className="mt-4 text-stone-500">Add a few pieces before moving to checkout.</p>
            <Link
              href="/"
              className="mt-8 inline-flex bg-stone-900 px-6 py-3 text-sm uppercase tracking-[0.16em] text-white transition-colors hover:bg-stone-800"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

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

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

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
        })),
        customer: customerInfo,
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
        });

        if (response.ok) {
          const { orderId } = await response.json();
          clearCart();
          toast({ title: 'Order placed successfully!', description: "We'll call you to confirm your order." });
          window.location.href = `/order-success?id=${orderId}&payment=cod&amount=${finalTotal}&phone=${encodeURIComponent(customerInfo.phone)}`;
        } else {
          throw new Error('Failed to create order');
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
        const orderSummary = items
          .map(item => `- ${item.name} x${item.quantity} - NPR ${(item.price * item.quantity).toLocaleString()}`)
          .join('\n');

        const deliveryInfo = deliveryFee === 0 ? 'Free Delivery' : `Delivery: NPR ${deliveryFee}`;
        const giftSummary = giftOptions.isGift
          ? `\n\nGift Details:\nGift Wrap: ${giftOptions.giftWrap ? 'Yes' : 'No'}\nRecipient: ${giftOptions.recipient || 'Not specified'}\nOccasion: ${giftOptions.occasion || 'Not specified'}${giftOptions.giftCard ? '\nGift Card: Requested' : ''}${giftOptions.giftNote ? `\nGift Note: ${giftOptions.giftNote}` : ''}${giftOptions.specialInstructions ? `\nSpecial Instructions: ${giftOptions.specialInstructions}` : ''}`
          : '';

        const whatsappMessage = `New Order from Aashish Jewellers

Customer Details:
Name: ${customerInfo.name}
Phone: ${customerInfo.phone}
${customerInfo.email ? `Email: ${customerInfo.email}` : ''}

Delivery Address:
${customerInfo.address.street}
${customerInfo.address.district}${customerInfo.address.zone ? `, ${customerInfo.address.zone}` : ''}
${customerInfo.address.landmark ? `Near: ${customerInfo.address.landmark}` : ''}

Order Items:
${orderSummary}

Payment Summary:
Subtotal: NPR ${total.toLocaleString()}
${deliveryInfo}
Total: NPR ${finalTotal.toLocaleString()}

Payment Method: Cash on Delivery / Bank Transfer${giftSummary}

Please confirm this order and estimated delivery time.`;

        const whatsappNumber = '9779811469486';
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

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

  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

  const getCurrentLocation = () => {
    if (!mapboxToken) {
      toast({
        title: 'Location unavailable',
        description: 'Please enter your address manually.',
        variant: 'destructive',
      });
      return;
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async position => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}`
            );
            const data = await response.json();
            if (data.features && data.features[0]) {
              const place = data.features[0];
              setCustomerInfo(prev => ({
                ...prev,
                address: {
                  ...prev.address,
                  street: place.place_name || '',
                },
              }));
            }
          } catch {
            toast({
              title: 'Location error',
              description: 'Could not get your location. Please enter manually.',
              variant: 'destructive',
            });
          }
        },
        () => {
          toast({
            title: 'Location access denied',
            description: 'Please enter your address manually.',
            variant: 'destructive',
          });
        }
      );
    }
  };

  return (
    <div className="bg-[#faf8f5] pt-24">
      <div className="container py-8">
        <div className="mx-auto max-w-6xl">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Checkout</p>
            <h1 className="mt-2 font-serif text-3xl font-light text-stone-900 md:text-4xl">Complete your order</h1>
          </div>

          <div className="mt-5 flex flex-wrap gap-5 text-sm text-stone-500">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-stone-400" strokeWidth={1.5} />
              Secure order
            </span>
            <span className="flex items-center gap-2">
              <PackageCheck className="h-4 w-4 text-stone-400" strokeWidth={1.5} />
              Gift wrap available
            </span>
            <span className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-stone-400" strokeWidth={1.5} />
              Delivery across Nepal
            </span>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <section className={SECTION_CLASS}>
                <div className="mb-5 flex items-center gap-2">
                  <Phone className="h-5 w-5 text-stone-800" strokeWidth={1.5} />
                  <h2 className="text-2xl font-serif font-light text-stone-900">Contact</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={customerInfo.name}
                      onChange={e => handleInputChange('name', e.target.value)}
                      placeholder="Enter your full name"
                      className="mt-2 border-stone-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={customerInfo.phone}
                      onChange={e => handleInputChange('phone', e.target.value)}
                      onBlur={handlePhoneBlur}
                      placeholder="98XXXXXXXX"
                      className="mt-2 border-stone-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerInfo.email}
                      onChange={e => handleInputChange('email', e.target.value)}
                      placeholder="your@email.com"
                      className="mt-2 border-stone-300"
                    />
                  </div>
                </div>
              </section>

              <section className={SECTION_CLASS}>
                <div className="mb-5 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-stone-800" strokeWidth={1.5} />
                  <h2 className="text-2xl font-serif font-light text-stone-900">Delivery</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="street">Street Address *</Label>
                    <div className="mt-2 flex gap-2">
                      <Input
                        id="street"
                        value={customerInfo.address.street}
                        onChange={e => handleInputChange('address.street', e.target.value)}
                        placeholder="House no, street name"
                        className="border-stone-300"
                      />
                      <button
                        type="button"
                        onClick={getCurrentLocation}
                        title="Use my current location"
                        className="inline-flex shrink-0 items-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700 transition-colors hover:border-stone-900"
                      >
                        <MapPin className="h-4 w-4" strokeWidth={1.5} />
                        <span className="hidden sm:inline">Locate</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="district">District *</Label>
                      <Input
                        id="district"
                        value={customerInfo.address.district}
                        onChange={e => handleInputChange('address.district', e.target.value)}
                        placeholder="e.g. Kathmandu"
                        className="mt-2 border-stone-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zone">Zone</Label>
                      <Input
                        id="zone"
                        value={customerInfo.address.zone}
                        onChange={e => handleInputChange('address.zone', e.target.value)}
                        placeholder="e.g. Bagmati"
                        className="mt-2 border-stone-300"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="landmark">Landmark</Label>
                    <Input
                      id="landmark"
                      value={customerInfo.address.landmark}
                      onChange={e => handleInputChange('address.landmark', e.target.value)}
                      placeholder="Near school, temple, chowk, etc."
                      className="mt-2 border-stone-300"
                    />
                  </div>
                </div>
              </section>

              <section className={SECTION_CLASS}>
                <div className="mb-5 flex items-center gap-2">
                  <Gift className="h-5 w-5 text-stone-800" strokeWidth={1.5} />
                  <h2 className="text-2xl font-serif font-light text-stone-900">Gift options</h2>
                </div>

                <label className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-[#faf8f5] px-4 py-4">
                  <input
                    type="checkbox"
                    checked={giftOptions.isGift}
                    onChange={e => handleGiftOptionChange('isGift', e.target.checked)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-stone-900">This order is a gift</p>
                    <p className="mt-1 text-sm text-stone-600">Add wrap, a note, and recipient details only when needed.</p>
                  </div>
                </label>

                {giftOptions.isGift && (
                  <div className="mt-4 grid gap-4 rounded-2xl border border-stone-200 bg-[#faf8f5] p-4">
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={giftOptions.giftWrap}
                        onChange={e => handleGiftOptionChange('giftWrap', e.target.checked)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-stone-900">Add gift wrap</p>
                        <p className="mt-1 text-sm text-stone-600">No extra charge for the current setup.</p>
                      </div>
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="gift-recipient">Recipient</Label>
                        <Input
                          id="gift-recipient"
                          value={giftOptions.recipient}
                          onChange={e => handleGiftOptionChange('recipient', e.target.value)}
                          placeholder="For her, mother, sister..."
                          className="mt-2 border-stone-300"
                        />
                      </div>
                      <div>
                        <Label htmlFor="gift-occasion">Occasion</Label>
                        <Input
                          id="gift-occasion"
                          value={giftOptions.occasion}
                          onChange={e => handleGiftOptionChange('occasion', e.target.value)}
                          placeholder="Birthday, anniversary..."
                          className="mt-2 border-stone-300"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="gift-note">Gift note</Label>
                      <textarea
                        id="gift-note"
                        value={giftOptions.giftNote}
                        onChange={e => handleGiftOptionChange('giftNote', e.target.value)}
                        placeholder="Write the note that should go inside the package"
                        className={`${TEXTAREA_CLASS} mt-2`}
                      />
                    </div>

                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={giftOptions.giftCard}
                        onChange={e => handleGiftOptionChange('giftCard', e.target.checked)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-stone-900">Need gift card assistance</p>
                        <p className="mt-1 text-sm text-stone-600">We will treat this as a request when confirming the order.</p>
                      </div>
                    </label>

                    <div>
                      <Label htmlFor="gift-instructions">Special instructions</Label>
                      <textarea
                        id="gift-instructions"
                        value={giftOptions.specialInstructions}
                        onChange={e => handleGiftOptionChange('specialInstructions', e.target.value)}
                        placeholder="Packaging, call-before-delivery, preferred timing..."
                        className={`${TEXTAREA_CLASS} mt-2`}
                      />
                    </div>
                  </div>
                )}
              </section>
            </div>

            <div className="space-y-6">
              <section className={`${SECTION_CLASS} lg:sticky lg:top-24`}>
                <div className="mb-5 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-stone-800" strokeWidth={1.5} />
                  <h2 className="text-2xl font-serif font-light text-stone-900">Payment and summary</h2>
                </div>

                <div className="space-y-3">
                  <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition-colors ${paymentMethod === 'whatsapp' ? 'border-stone-900 bg-stone-50' : 'border-stone-200'}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="whatsapp"
                      checked={paymentMethod === 'whatsapp'}
                      onChange={e => setPaymentMethod(e.target.value as 'whatsapp')}
                      className="mt-1"
                    />
                    <MessageCircle className="mt-0.5 h-5 w-5 text-green-600" strokeWidth={1.5} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-stone-900">Order via WhatsApp</span>
                        <span className="text-xs text-stone-500">(Recommended)</span>
                      </div>
                      <p className="mt-1 text-sm text-stone-600">Best when the customer wants fast confirmation, gifting help, or custom delivery coordination.</p>
                    </div>
                  </label>

                  <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition-colors ${paymentMethod === 'cod' ? 'border-stone-900 bg-stone-50' : 'border-stone-200'}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={e => setPaymentMethod(e.target.value as 'cod')}
                      className="mt-1"
                    />
                    <Truck className="mt-0.5 h-5 w-5 text-stone-800" strokeWidth={1.5} />
                    <div>
                      <span className="font-medium text-stone-900">Cash on Delivery</span>
                      <p className="mt-1 text-sm text-stone-600">Useful for customers who prefer to pay after confirmation and delivery scheduling.</p>
                    </div>
                  </label>

                  <div className="rounded-2xl border border-dashed border-stone-300 px-4 py-4 text-sm text-stone-600">
                    <div className="mb-2 flex items-center gap-2 text-stone-800">
                      <QrCode className="h-4 w-4" strokeWidth={1.5} />
                      <span className="text-xs uppercase tracking-[0.14em]">Digital payments</span>
                    </div>
                    eSewa, Khalti, and FonePay are available in the codebase and can be surfaced once live credentials are confirmed.
                  </div>
                </div>

                <div className="my-6 border-t border-stone-200" />

                <div className="space-y-4">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-16 w-16 rounded-2xl border border-stone-200 object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-stone-900">{item.name}</h3>
                        <p className="mt-1 text-sm text-stone-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium text-stone-900">NPR {(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                <div className="my-6 border-t border-stone-200" />

                {priceSyncing && (
                  <div className="rounded-2xl border border-stone-200 bg-[#faf8f5] px-4 py-4 text-sm text-stone-600">
                    Refreshing the latest catalog pricing before order confirmation.
                  </div>
                )}

                <div>
                  {promoApplied ? (
                    <div className="flex items-center justify-between rounded-2xl border border-green-200 bg-green-50 px-3 py-3 text-sm">
                      <div>
                        <span className="font-medium text-green-800">{promoApplied.code}</span>
                        {promoApplied.description && <span className="ml-1 text-green-600">- {promoApplied.description}</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPromoApplied(null);
                          setPromoInput('');
                          setPromoError('');
                        }}
                        className="text-xs text-green-700 underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={e => {
                          setPromoInput(e.target.value.toUpperCase());
                          setPromoError('');
                        }}
                        onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
                        placeholder="Promo code"
                        className="flex-1 rounded-full border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        disabled={promoLoading || !promoInput.trim()}
                        className="rounded-full border border-stone-900 bg-stone-900 px-4 py-2.5 text-xs uppercase tracking-[0.14em] text-white transition-colors hover:bg-stone-800 disabled:opacity-50"
                      >
                        {promoLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                  )}
                  {promoError && <p className="mt-2 text-xs text-red-600">{promoError}</p>}
                </div>

                <div className="mt-6 space-y-3 text-sm text-stone-700">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>NPR {total.toLocaleString()}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>Discount ({promoApplied!.code})</span>
                      <span>- NPR {discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span>{deliveryFee === 0 ? 'Free' : `NPR ${deliveryFee}`}</span>
                  </div>
                  <div className="border-t border-stone-200 pt-3 text-base font-medium text-stone-900">
                    <div className="flex justify-between">
                      <span>Total</span>
                      <span>NPR {finalTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {giftOptions.isGift && (
                  <div className="mt-6 rounded-2xl border border-stone-200 bg-[#faf8f5] px-4 py-4 text-sm text-stone-700">
                    <div className="mb-2 flex items-center gap-2 text-stone-900">
                      <Gift className="h-4 w-4" strokeWidth={1.5} />
                      <span className="text-xs uppercase tracking-[0.14em]">Gift summary</span>
                    </div>
                    <p>Gift wrap: {giftOptions.giftWrap ? 'Included' : 'No'}</p>
                    {giftOptions.recipient && <p className="mt-1">Recipient: {giftOptions.recipient}</p>}
                    {giftOptions.occasion && <p className="mt-1">Occasion: {giftOptions.occasion}</p>}
                    {giftOptions.giftNote && <p className="mt-1">Gift note added</p>}
                    {giftOptions.giftCard && <p className="mt-1">Gift card assistance requested</p>}
                  </div>
                )}

                <div className="mt-6 rounded-2xl border border-stone-200 bg-[#faf8f5] px-4 py-4 text-sm text-stone-700">
                  {total < 5000 ? (
                    <p>Add NPR {(5000 - total).toLocaleString()} more for free delivery.</p>
                  ) : (
                    <p>Free delivery is applied to this order.</p>
                  )}
                </div>

                <Button
                  className="mt-6 h-12 w-full rounded-full bg-stone-900 text-sm uppercase tracking-[0.16em] text-white hover:bg-stone-800"
                  onClick={handlePlaceOrder}
                  disabled={loading || priceSyncing}
                >
                  {loading ? 'Processing...' : `Place order - NPR ${finalTotal.toLocaleString()}`}
                </Button>

                <p className="mt-4 text-center text-xs text-stone-500">
                  Customers who need help with gifting or delivery can complete the order through WhatsApp.
                </p>
              </section>
            </div>
          </div>
        </div>
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
