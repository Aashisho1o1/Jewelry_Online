import React from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Separator } from './ui/separator';
import { CheckCircle, Copy, QrCode, X } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface FonePayQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderTotal: number;
  orderId: string;
  customerName: string;
  onPaymentComplete: () => void;
}

export default function FonePayQRModal({ 
  isOpen, 
  onClose, 
  orderTotal, 
  orderId, 
  customerName,
  onPaymentComplete 
}: FonePayQRModalProps) {
  const { toast } = useToast();

  const copyOrderId = () => {
    navigator.clipboard.writeText(orderId);
    toast({
      title: "Order ID Copied!",
      description: "Use this in your FonePay payment remarks.",
    });
  };

  const handlePaymentComplete = () => {
    toast({
      title: "Payment Confirmation Received!",
      description: "We'll verify your payment and update your order status.",
    });
    onPaymentComplete();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto max-h-[95vh] overflow-y-auto p-0 gap-0 sm:max-w-md">
        {/* Mobile-First Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-2 mb-1">
              <QrCode className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">FonePay Payment</span>
            </div>
            <div className="text-xl font-bold text-blue-700">
              NPR {orderTotal.toLocaleString()}
            </div>
          </div>
          <Button
            variant="outline"
            onClick={onClose}
            className="h-8 w-8 p-0 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Crystal Clear QR Code - Mobile Optimized */}
          <div className="text-center">
            <div className="bg-white p-3 rounded-xl border-2 border-blue-200 shadow-lg inline-block">
              <img 
                src="/images/fonepay-qr-code.jpg" 
                alt="FonePay QR Code - Aashish Jewellers" 
                className="w-72 h-auto object-contain rounded-lg max-w-full sm:w-80"
                style={{ maxHeight: '300px' }}
                onError={(e) => {
                  // Graceful fallback
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              {/* Fallback placeholder */}
              <div className="w-64 h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hidden">
                <div className="text-center text-gray-500">
                  <QrCode className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm font-medium">FonePay QR Code</p>
                  <p className="text-xs">Loading...</p>
                </div>
              </div>
            </div>
            
            <div className="mt-3 space-y-1">
              <p className="text-base font-semibold text-gray-800">
                Scan with FonePay app
              </p>
              <p className="text-sm text-gray-600">
                Terminal: 22220200139903575 • Butawal
              </p>
            </div>
          </div>

          {/* Simplified 4-Step Instructions - Mobile Optimized */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-3">
              <div className="text-sm text-blue-800">
                <p className="font-semibold text-center mb-3">Quick Steps:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                    <span>Open FonePay app & scan QR</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                    <span>Amount: <strong>NPR {orderTotal.toLocaleString()}</strong></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                    <span>Add Order ID in remarks</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                    <span>Complete payment</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Details - Compact & Touch-Friendly */}
          <Card>
            <CardContent className="p-3 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Customer:</span>
                <span className="text-sm font-medium">{customerName}</span>
              </div>
              
              <Separator />
              
              {/* Order ID with large copy button */}
              <div className="space-y-2">
                <span className="text-sm text-gray-600">Order ID (for remarks):</span>
                <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                  <code className="text-sm font-mono flex-1 break-all">{orderId}</code>
                  <Button
                    variant="outline"
                    onClick={copyOrderId}
                    className="h-10 px-3 flex-shrink-0 min-w-[44px]"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center font-semibold">
                <span>Total Amount:</span>
                <span className="text-xl text-blue-700">NPR {orderTotal.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Touch-Friendly Action Buttons */}
          <div className="space-y-3 pt-2">
            <Button 
              onClick={handlePaymentComplete}
              className="w-full h-14 text-lg font-semibold bg-green-600 hover:bg-green-700 min-h-[56px]"
            >
              <CheckCircle className="w-6 h-6 mr-2" />
              I&apos;ve Completed Payment
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onClose}
              className="w-full h-12 min-h-[48px]"
            >
              Cancel
            </Button>
          </div>

          {/* Trust indicator */}
          <div className="text-center pt-2 border-t">
            <p className="text-xs text-gray-500">
              🔒 Secure payment • We&apos;ll verify and confirm your order
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}