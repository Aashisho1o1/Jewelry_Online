import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Separator } from './ui/separator';
import { CheckCircle, Copy, Clock, AlertCircle } from 'lucide-react';
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
      description: "You can use this for payment reference.",
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
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center">
            <img 
              src="/images/fonepay-logo.png" 
              alt="FonePay" 
              className="h-8 w-auto"
              onError={(e) => {
                // Fallback if logo not available yet
                e.currentTarget.style.display = 'none';
              }}
            />
            <span>FonePay Payment</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Instructions */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Payment Instructions:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Scan the QR code with your FonePay app</li>
                    <li>Enter amount: NPR {orderTotal.toLocaleString()}</li>
                    <li>Use Order ID as reference: {orderId}</li>
                    <li>Complete payment in your FonePay app</li>
                    <li>Click "I've Paid" button below</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Section */}
          <div className="text-center space-y-4">
            <div className="bg-white p-6 rounded-lg border-2 border-gray-200 inline-block">
              {/* Placeholder for QR Code - you'll replace this with actual QR image */}
              <div className="w-48 h-48 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">📱</div>
                  <p className="text-sm font-medium">FonePay QR Code</p>
                  <p className="text-xs">Will be added here</p>
                </div>
              </div>
              {/* When you have the QR image, replace above div with: */}
              {/* <img 
                src="/images/fonepay-qr.png" 
                alt="FonePay QR Code" 
                className="w-48 h-48 object-contain"
              /> */}
            </div>
            
            <p className="text-sm text-gray-600">
              Scan with FonePay app to pay NPR {orderTotal.toLocaleString()}
            </p>
          </div>

          {/* Order Details */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Customer:</span>
                <span className="font-medium">{customerName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Order ID:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{orderId}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyOrderId}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between items-center font-bold">
                <span>Total Amount:</span>
                <span className="text-lg">NPR {orderTotal.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Status Notice */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Payment Verification:</p>
                  <p className="text-xs">
                    After payment, we'll manually verify your transaction and update your order status. 
                    You'll receive confirmation via WhatsApp/SMS.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePaymentComplete}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              I've Paid
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500">
            🔒 Secure payment powered by FonePay
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
