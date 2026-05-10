import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function PaymentCancel() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-md w-full text-center shadow-2xl rounded-2xl border-2 border-red-200">
          <CardHeader className="pt-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <XCircle className="w-12 h-12 text-red-600" />
            </motion.div>
            <CardTitle className="text-3xl font-bold">Payment Cancelled</CardTitle>
            <CardDescription className="text-lg">
              Your payment process was cancelled. You have not been charged.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pb-8">
            <p className="text-gray-600">
              It looks like you've cancelled the payment process. If this was a mistake, you can try again from the pricing page.
            </p>
            <div className="mt-8">
              <Link to={createPageUrl('Home')}>
                <Button size="lg" variant="outline" className="w-full">
                  Return to Pricing
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}