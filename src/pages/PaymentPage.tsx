import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { CreditCard, Lock, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { createMembership } from '../services/paymentService';

interface PaymentPageProps {
  onNavigate: (page: string, params?: any) => void;
  onPaid: () => Promise<void>;
  returnTo: string;
}

export function PaymentPage({ onNavigate, onPaid, returnTo }: PaymentPageProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [processing, setProcessing] = useState(false);

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    return cleaned;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 16) setCardNumber(formatCardNumber(value));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    if (formatted.length <= 5) setExpiryDate(formatted);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 3) setCvv(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!cardNumber || !expiryDate || !cvv || !cardName) {
    toast.error('Please fill in all fields');
    return;
  }

  if (cardNumber.replace(/\s/g, '').length !== 16) {
    toast.error('Please enter a valid card number');
    return;
  }

  if (cvv.length !== 3) {
    toast.error('Please enter a valid CVV');
    return;
  }

  setProcessing(true);

  try {
    const providerPaymentId = 'demo_001';
    await createMembership(providerPaymentId);

    await onPaid();
    toast.success('Payment successful! Welcome to NutriLife Premium');
  } catch (err: any) {
    console.error(err);
    toast.error(err.message || 'Payment failed');
  } finally {
    setProcessing(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="text-center mb-8">
            <h1 className="text-4xl text-gray-900 mb-3">Complete Your Payment</h1>
            <p className="text-xl text-gray-600">Unlock full access to NutriLife Premium</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl text-gray-900">Payment Details</h2>
                    <p className="text-sm text-gray-500">Secure checkout</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <Label htmlFor="cardName" className="text-gray-700">Cardholder Name</Label>
                    <Input
                      id="cardName"
                      type="text"
                      placeholder="John Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="mt-2 h-12"
                      disabled={processing}
                    />
                  </div>

                  <div>
                    <Label htmlFor="cardNumber" className="text-gray-700">Card Number</Label>
                    <Input
                      id="cardNumber"
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className="mt-2 h-12"
                      disabled={processing}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiry" className="text-gray-700">Expiry Date</Label>
                      <Input
                        id="expiry"
                        type="text"
                        placeholder="MM/YY"
                        value={expiryDate}
                        onChange={handleExpiryChange}
                        className="mt-2 h-12"
                        disabled={processing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv" className="text-gray-700">CVV</Label>
                      <Input
                        id="cvv"
                        type="text"
                        placeholder="123"
                        value={cvv}
                        onChange={handleCvvChange}
                        className="mt-2 h-12"
                        disabled={processing}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <Lock className="w-4 h-4" />
                    <span>Your payment information is encrypted and secure</span>
                  </div>

                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 h-12 text-base" disabled={processing}>
                    {processing ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      `Pay $5.00`
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => onNavigate(returnTo)}
                    disabled={processing}
                  >
                    Back
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="shadow-xl">
                <CardContent className="p-8">
                  <h2 className="text-xl text-gray-900 mb-4">Order Summary</h2>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600">NutriLife Premium</span>
                      <span className="text-gray-900">$5.00</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between">
                      <span className="text-gray-900">Total</span>
                      <span className="text-2xl text-green-600">$5.00</span>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-sm text-green-800 mb-3">What's Included:</h3>
                    <ul className="space-y-2 text-sm text-green-700">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Personalized meal planning</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Smart shopping lists</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Progress tracking</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Need help?</p>
                <Button variant="ghost" className="text-green-600 hover:text-green-700">
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}