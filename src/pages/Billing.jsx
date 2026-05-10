import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/apis/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, CheckCircle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

export default function Billing() {
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(null);

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['stripe_products'],
    queryFn: async () => {
      try {
        const response = await apiClient.functions.invoke('getStripeProducts', {});
        return response.data;
      } catch (error) {
        console.error("Error fetching stripe products", error);
        toast({
          title: "Error",
          description: "Could not load pricing plans. Please try again later.",
          variant: "destructive",
        });
        return [];
      }
    },
  });

  const createCheckoutSession = useMutation({
    mutationFn: (priceId) => apiClient.functions.invoke('createCheckoutSession', { priceId }),
    onSuccess: (response) => {
      const { url } = response.data;
      if (url) {
        window.location.href = url;
      } else {
        toast({
          title: "Error",
          description: "Could not create checkout session. Please try again.",
          variant: "destructive",
        });
        setIsRedirecting(null);
      }
    },
    onError: (error) => {
      toast({
        title: "Checkout Error",
        description: error.response?.data?.error || error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      setIsRedirecting(null);
    },
  });

  const handleSubscribe = (priceId) => {
    setIsRedirecting(priceId);
    createCheckoutSession.mutate(priceId);
  };

  const formatPrice = (price) => {
    if (!price || typeof price.unit_amount !== 'number') return "Contact us";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: price.currency,
    }).format(price.unit_amount / 100);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
          Pricing Plans
        </h1>
        <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
          Choose the plan that's right for you.
        </p>
      </div>

      {isLoadingProducts ? (
        <div className="flex justify-center items-center mt-10">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
        </div>
      ) : (
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {products && products.map((product) => (
            <Card key={product.id} className="flex flex-col rounded-lg shadow-lg overflow-hidden">
              <CardHeader className="bg-gray-50 p-6">
                <CardTitle className="text-2xl">{product.name}</CardTitle>
                <CardDescription className="mt-2 h-12">{product.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-6 flex flex-col justify-between">
                <div>
                  <div className="text-5xl font-extrabold text-gray-900">
                    {formatPrice(product.default_price)}
                    {product.default_price?.type === 'recurring' && (
                      <span className="text-xl font-medium text-gray-500">/{product.default_price.recurring.interval}</span>
                    )}
                  </div>
                  <ul className="mt-6 space-y-4">
                    {[ 'Feature 1', 'Feature 2', 'Feature 3'].map(feature => (
                        <li key={feature} className="flex items-start">
                            <div className="flex-shrink-0">
                                <CheckCircle className="h-6 w-6 text-green-500" />
                            </div>
                            <p className="ml-3 text-base text-gray-700">{feature}</p>
                        </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="p-6 bg-gray-50">
                <Button
                  onClick={() => handleSubscribe(product.default_price.id)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  size="lg"
                  disabled={isRedirecting === product.default_price.id || !product.default_price}
                >
                  {isRedirecting === product.default_price.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirecting...
                    </>
                  ) : 'Subscribe'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
