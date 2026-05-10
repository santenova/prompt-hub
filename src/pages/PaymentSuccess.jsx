import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PaymentSuccess() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const sessionId = searchParams.get('session_id');

  const isSuccess = !!sessionId;

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-gray-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            {isSuccess ? (
              <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            ) : (
              <XCircle className="mx-auto h-16 w-16 text-red-500" />
            )}
            <CardTitle className="mt-4 text-2xl font-bold">
              {isSuccess ? 'Payment Successful!' : 'Payment Issue'}
            </CardTitle>
            <CardDescription className="mt-2">
              {isSuccess
                ? 'Thank you for your subscription. Your payment was processed successfully.'
                : 'There was an issue processing your payment. Please try again.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link to={createPageUrl('Dashboard')}>
              <Button size="lg" className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                Go to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}