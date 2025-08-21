import React, { useState } from 'react';
import { useCartContext } from '../contexts/CartContext';
import { CustomerInfo, Order } from '../types/order';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { MapPin, Phone, CreditCard, Truck, MessageCircle } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { Link } from 'wouter';

export default function Checkout() {
  const { items, total, clearCart } = useCartContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
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
  });
  const [paymentMethod, setPaymentMethod] = useState<'esewa' | 'khalti' | 'cod' | 'whatsapp'>('esewa');

  // Redirect if cart is empty
  if (items.length === 0) {
    return (
      <div className="container py-12">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">Add some items to your cart before checking out.</p>
          <Link href="/">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  const deliveryFee = total >= 5000 ? 0 : 150;
  const finalTotal = total + deliveryFee;

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setCustomerInfo(prev => ({
        ...prev,
        address: { ...prev.address, [addressField]: value }
      }));
    } else {
      setCustomerInfo(prev => ({ ...prev, [field]: value }));
    }
  };

  const validateForm = () => {
    const { name, phone, address } = customerInfo;
    if (!name.trim()) {
      toast({ title: "Please enter your name", variant: "destructive" });
      return false;
    }
    if (!phone.trim() || phone.length < 10) {
      toast({ title: "Please enter a valid phone number", variant: "destructive" });
      return false;
    }
    if (!address.street.trim() || !address.district.trim()) {
      toast({ title: "Please enter your complete address", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
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
      };

      if (paymentMethod === 'cod') {
        // Handle COD order
        const response = await fetch('/api/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...order, paymentMethod: 'cod' }),
        });

        if (response.ok) {
          const { orderId } = await response.json();
          clearCart();
          toast({ title: "Order placed successfully!", description: "We'll call you to confirm your order." });
          window.location.href = `/order-success?id=${orderId}`;
        } else {
          throw new Error('Failed to create order');
        }
      } else if (paymentMethod === 'esewa') {
        // Handle eSewa payment - create form and submit to our API
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/api/payments/esewa/create';
        form.target = '_self'; // Open in same window
        form.style.display = 'none';
        
        // Add order data as form fields
        Object.entries(order).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = typeof value === 'object' ? JSON.stringify(value) : value;
          form.appendChild(input);
        });
        
        document.body.appendChild(form);
        form.submit();
      } else if (paymentMethod === 'khalti') {
        // Handle Khalti payment with proper redirection
        const response = await fetch('/api/payments/khalti/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order),
        });

        if (response.ok) {
          const { paymentUrl, orderId } = await response.json();
          
          // Show toast notification
          toast({ 
            title: "Redirecting to Khalti", 
            description: "You will be redirected to Khalti payment page" 
          });
          
          // Store order ID in localStorage for reference
          localStorage.setItem('pendingOrderId', orderId);
          
          // Redirect to Khalti payment page
          window.location.href = paymentUrl;
        } else {
          const errorData = await response.json();
          console.error('Khalti payment error:', errorData);
          throw new Error(errorData.error || 'Failed to initiate Khalti payment');
        }
      } else if (paymentMethod === 'whatsapp') {
        // Handle WhatsApp ordering
        const orderSummary = items.map(item => 
          `• ${item.name} x${item.quantity} - NPR ${(item.price * item.quantity).toLocaleString()}`
        ).join('\n');
        
        const deliveryInfo = deliveryFee === 0 ? 'Free Delivery' : `Delivery: NPR ${deliveryFee}`;
        
        const whatsappMessage = `🛍️ *New Order from Aashish Jewellers*

👤 *Customer Details:*
Name: ${customerInfo.name}
Phone: ${customerInfo.phone}
${customerInfo.email ? `Email: ${customerInfo.email}` : ''}

📍 *Delivery Address:*
${customerInfo.address.street}
${customerInfo.address.district}${customerInfo.address.zone ? `, ${customerInfo.address.zone}` : ''}
${customerInfo.address.landmark ? `Near: ${customerInfo.address.landmark}` : ''}

🛒 *Order Items:*
${orderSummary}

💰 *Payment Summary:*
Subtotal: NPR ${total.toLocaleString()}
${deliveryInfo}
*Total: NPR ${finalTotal.toLocaleString()}*

Payment Method: Cash on Delivery / Bank Transfer

Please confirm this order and let me know the estimated delivery time. Thank you! 🙏`;

        // WhatsApp business number
        const whatsappNumber = '9779811469486'; // Nepal: +977 981-1469486
        
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
        
        // Clear cart and redirect to WhatsApp
        clearCart();
        toast({ 
          title: "Redirecting to WhatsApp", 
          description: "Your order details will be sent via WhatsApp" 
        });
        
        // Open WhatsApp in new tab
        window.open(whatsappUrl, '_blank');
        
        // Redirect to success page
        setTimeout(() => {
          window.location.href = `/order-success?method=whatsapp&total=${finalTotal}`;
        }, 1000);
      }
    } catch (error) {
      console.error('Order placement error:', error);
      toast({
        title: "Order failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Reverse geocode to get address
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=YOUR_MAPBOX_TOKEN`
            );
            const data = await response.json();
            if (data.features && data.features[0]) {
              const place = data.features[0];
              setCustomerInfo(prev => ({
                ...prev,
                address: {
                  ...prev.address,
                  street: place.place_name || '',
                }
              }));
            }
          } catch (error) {
            toast({
              title: "Location error",
              description: "Could not get your location. Please enter manually.",
              variant: "destructive",
            });
          }
        },
        (error) => {
          toast({
            title: "Location access denied",
            description: "Please enter your address manually.",
            variant: "destructive",
          });
        }
      );
    }
  };

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Customer Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={customerInfo.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={customerInfo.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="98XXXXXXXX"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="street">Street Address *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="street"
                      value={customerInfo.address.street}
                      onChange={(e) => handleInputChange('address.street', e.target.value)}
                      placeholder="House no, Street name"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={getCurrentLocation}
                      className="flex-shrink-0"
                    >
                      <MapPin className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="district">District *</Label>
                    <Input
                      id="district"
                      value={customerInfo.address.district}
                      onChange={(e) => handleInputChange('address.district', e.target.value)}
                      placeholder="e.g., Kathmandu"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zone">Zone</Label>
                    <Input
                      id="zone"
                      value={customerInfo.address.zone}
                      onChange={(e) => handleInputChange('address.zone', e.target.value)}
                      placeholder="e.g., Bagmati"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="landmark">Landmark (Optional)</Label>
                  <Input
                    id="landmark"
                    value={customerInfo.address.landmark}
                    onChange={(e) => handleInputChange('address.landmark', e.target.value)}
                    placeholder="Near school, temple, etc."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value="esewa"
                      checked={paymentMethod === 'esewa'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'esewa')}
                      className="w-4 h-4"
                    />
                    <img src="/images/esewa-logo.jpeg" alt="eSewa" className="h-8" />
                    <span>eSewa</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value="khalti"
                      checked={paymentMethod === 'khalti'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'khalti')}
                      className="w-4 h-4"
                    />
                    <img src="/images/khalti-logo.png" alt="Khalti" className="h-8" />
                    <span>Khalti</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value="whatsapp"
                      checked={paymentMethod === 'whatsapp'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'whatsapp')}
                      className="w-4 h-4"
                    />
                    <MessageCircle className="w-6 h-6 text-green-500" />
                    <span>Order via WhatsApp</span>
                    <span className="text-xs text-gray-500">(Most Popular)</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'cod')}
                      className="w-4 h-4"
                    />
                    <Truck className="w-6 h-6 text-green-600" />
                    <span>Cash on Delivery</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{item.name}</h3>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          NPR {(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>NPR {total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery:</span>
                      <span>
                        {deliveryFee === 0 ? (
                          <span className="text-green-600">Free</span>
                        ) : (
                          `NPR ${deliveryFee}`
                        )}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>NPR {finalTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  {total < 5000 && (
                    <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded">
                      Add NPR {(5000 - total).toLocaleString()} more for free delivery!
                    </div>
                  )}

                  <Button
                    className="w-full h-12 text-base font-medium"
                    onClick={handlePlaceOrder}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : `Place Order - NPR ${finalTotal.toLocaleString()}`}
                  </Button>

                  <div className="text-xs text-gray-500 text-center">
                    🔒 Your payment information is secure and encrypted
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
