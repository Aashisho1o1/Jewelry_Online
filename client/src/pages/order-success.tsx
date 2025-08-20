import React from 'react';
import { CheckCircle, Package, Phone, Home } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Link } from 'wouter';

export default function OrderSuccess() {
  // Get order details from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('id');
  const paymentMethod = urlParams.get('payment');
  const amount = urlParams.get('amount');
  const transactionId = urlParams.get('txn');
  
  // Clear any pending order from localStorage
  React.useEffect(() => {
    localStorage.removeItem('pendingOrderId');
  }, []);

  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Order Placed Successfully!
          </h1>
          <p className="text-lg text-gray-600">
            Thank you for your purchase. Your order has been confirmed.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Package className="w-5 h-5" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Order ID</p>
              <p className="font-mono text-lg font-semibold">{orderId}</p>
            </div>
            
            {paymentMethod && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="font-semibold capitalize">
                  {paymentMethod === 'esewa' ? 'eSewa' : 
                   paymentMethod === 'khalti' ? 'Khalti' : 
                   paymentMethod === 'whatsapp' ? 'WhatsApp Order' :
                   'Cash on Delivery'}
                </p>
                
                {/* Show payment details if available */}
                {amount && (
                  <div className="mt-2 text-sm">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-semibold ml-2">NPR {parseFloat(amount).toLocaleString()}</span>
                  </div>
                )}
                
                {transactionId && (
                  <div className="mt-1 text-sm">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-mono ml-2">{transactionId}</span>
                  </div>
                )}
                
                {paymentMethod === 'esewa' && (
                  <div className="mt-2 text-xs text-green-600">
                    Payment verified by eSewa
                  </div>
                )}
                
                {paymentMethod === 'khalti' && (
                  <div className="mt-2 text-xs text-purple-600">
                    Payment verified by Khalti
                  </div>
                )}
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">What happens next?</h3>
              <div className="space-y-3 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Order Confirmation</p>
                    <p className="text-sm text-gray-600">
                      We'll call you within 2 hours to confirm your order details.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Processing</p>
                    <p className="text-sm text-gray-600">
                      Your jewelry will be carefully prepared and packaged.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Delivery</p>
                    <p className="text-sm text-gray-600">
                      Your order will be delivered within 3-5 business days.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-blue-50 p-6 rounded-lg mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Phone className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Need Help?</h3>
          </div>
          <p className="text-blue-800 mb-3">
            If you have any questions about your order, feel free to contact us:
          </p>
          <div className="space-y-1 text-blue-800">
            <p>📞 Phone: +977-XXX-XXXXXXX</p>
            <p>📧 Email: support@aashishjewellers.com</p>
            <p>💬 WhatsApp: +977-XXX-XXXXXXX</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Continue Shopping
            </Button>
          </Link>
          <Button variant="outline" onClick={() => window.print()}>
            Print Order Details
          </Button>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>
            You will receive an SMS confirmation shortly with your order details.
          </p>
        </div>
      </div>
    </div>
  );
}
