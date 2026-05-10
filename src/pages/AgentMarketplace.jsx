import React, { useState, useMemo } from "react";
import { apiClient } from "@/apis/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Store,
  Search,
  Star,
  DollarSign,
  Users,
  TrendingUp,
  Zap,
  Filter,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Package
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const categories = [
  "All",
  "Business",
  "Creative",
  "Technical",
  "Marketing",
  "Sales",
  "Customer Support",
  "Development",
  "Design"
];

export default function AgentMarketplace() {
  const [searchQuery, setSearchQuery] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('search') || "";
  });
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceFilter, setPriceFilter] = useState("all");
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showSubscribeDialog, setShowSubscribeDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const queryClient = useQueryClient();

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await apiClient.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  // Listen for URL search param changes (e.g., from global search)
  React.useEffect(() => {
    const handleUrlChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const searchFromUrl = urlParams.get('search');
      if (searchFromUrl) {
        setSearchQuery(searchFromUrl);
      }
    };
    
    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ['agent-packages'],
    queryFn: async () => {
      const allPackages = await apiClient.entities.AgentPackage.list('-created_date');
      return allPackages.filter(p => p.is_published);
    },
    initialData: [],
  });

  const { data: mySubscriptions = [] } = useQuery({
    queryKey: ['my-subscriptions', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      const allSubs = await apiClient.entities.AgentSubscription.list();
      return allSubs.filter(s => s.subscriber_email === currentUser.email);
    },
    enabled: !!currentUser?.email,
    initialData: [],
  });

  const subscribeMutation = useMutation({
    mutationFn: (packageData) => apiClient.entities.AgentSubscription.create({
      package_id: packageData.id,
      subscriber_email: currentUser.email,
      status: packageData.monthly_price === 0 ? 'active' : 'trial',
      start_date: new Date().toISOString(),
      trial_end_date: packageData.monthly_price === 0 ? null : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      billing_cycle: 'monthly',
      payment_method: packageData.monthly_price === 0 ? 'free' : 'credit_card'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-subscriptions']);
      setShowSubscribeDialog(false);
      setSelectedPackage(null);
    },
  });

  const filteredPackages = useMemo(() => {
    return packages.filter(pkg => {
      const categoryMatch = selectedCategory === "All" || pkg.category === selectedCategory;
      const priceMatch = 
        priceFilter === "all" ||
        (priceFilter === "free" && pkg.monthly_price === 0) ||
        (priceFilter === "paid" && pkg.monthly_price > 0);
      const searchMatch = searchQuery === "" ||
        pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.description?.toLowerCase().includes(searchQuery.toLowerCase());

      return categoryMatch && priceMatch && searchMatch;
    });
  }, [packages, selectedCategory, priceFilter, searchQuery]);

  const isSubscribed = (packageId) => {
    return mySubscriptions.some(sub => 
      sub.package_id === packageId && 
      ['active', 'trial'].includes(sub.status)
    );
  };

  const handleSubscribe = (pkg) => {
    setSelectedPackage(pkg);
    setShowSubscribeDialog(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-3 sm:space-y-4"
          >
            <div className="flex items-center justify-center gap-2">
              <Store className="w-8 h-8 sm:w-10 sm:h-10" />
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">Agent Marketplace</h1>
            </div>
            <p className="text-base sm:text-lg lg:text-xl text-blue-100 max-w-2xl mx-auto px-4">
              Discover and subscribe to powerful AI agent packages
            </p>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-6 pt-2">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold">{packages.length}</div>
                <div className="text-xs sm:text-sm text-blue-100">Available Agents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold">{packages.filter(p => p.is_featured).length}</div>
                <div className="text-xs sm:text-sm text-blue-100">Featured</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold">{packages.filter(p => p.monthly_price === 0).length}</div>
                <div className="text-xs sm:text-sm text-blue-100">Free</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <Input
                placeholder="Search agent packages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 sm:pl-10 h-10 sm:h-12 text-sm sm:text-base"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-sm">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger className="w-full sm:w-[180px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-sm">All Prices</SelectItem>
                <SelectItem value="free" className="text-sm">Free Only</SelectItem>
                <SelectItem value="paid" className="text-sm">Paid Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(searchQuery || selectedCategory !== "All" || priceFilter !== "all") && (
            <div className="text-xs sm:text-sm text-gray-600">
              Showing <span className="font-semibold text-purple-600">{filteredPackages.length}</span> of {packages.length} packages
            </div>
          )}
        </div>

        {/* Packages Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-72 sm:h-80 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredPackages.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Package className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No packages found</p>
              <p className="text-sm text-gray-600">Try adjusting your filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <AnimatePresence>
              {filteredPackages.map((pkg) => {
                const subscribed = isSubscribed(pkg.id);
                
                return (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Card className="h-full flex flex-col border-2 hover:shadow-xl transition-all touch-manipulation">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="text-3xl sm:text-4xl">{pkg.icon}</div>
                          <div className="flex flex-col gap-1 items-end">
                            {pkg.is_featured && (
                              <Badge className="bg-yellow-500 text-xs">Featured</Badge>
                            )}
                            <Badge variant="outline" className="text-xs">{pkg.category}</Badge>
                          </div>
                        </div>
                        <CardTitle className="text-lg sm:text-xl">{pkg.name}</CardTitle>
                        <CardDescription className="text-sm line-clamp-2">{pkg.description}</CardDescription>
                      </CardHeader>

                      <CardContent className="flex-1 space-y-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl sm:text-3xl font-bold text-purple-600">
                            {pkg.monthly_price === 0 ? 'Free' : `$${pkg.monthly_price}`}
                          </span>
                          {pkg.monthly_price > 0 && (
                            <span className="text-xs sm:text-sm text-gray-600">/month</span>
                          )}
                        </div>

                        {pkg.rating > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 sm:w-4 sm:h-4 ${
                                    i < Math.floor(pkg.rating)
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs sm:text-sm text-gray-600">
                              {pkg.rating.toFixed(1)} ({pkg.rating_count || 0})
                            </span>
                          </div>
                        )}

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                            <Users className="w-4 h-4 flex-shrink-0" />
                            <span>{pkg.total_subscriptions || 0} subscribers</span>
                          </div>
                          {pkg.included_personas && pkg.included_personas.length > 0 && (
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                              <Zap className="w-4 h-4 flex-shrink-0" />
                              <span>{pkg.included_personas.length} personas included</span>
                            </div>
                          )}
                        </div>

                        {pkg.features && pkg.features.length > 0 && (
                          <div className="space-y-1">
                            {pkg.features.slice(0, 3).map((feature, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm">
                                <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700 line-clamp-1">{feature}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>

                      <CardFooter className="flex-col gap-2">
                        {subscribed ? (
                          <Button className="w-full bg-green-600 hover:bg-green-700" disabled>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Subscribed
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleSubscribe(pkg)}
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 min-h-[44px]"
                          >
                            {pkg.monthly_price === 0 ? 'Subscribe Free' : 'Start Free Trial'}
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Subscribe Dialog */}
      <Dialog open={showSubscribeDialog} onOpenChange={setShowSubscribeDialog}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:w-full sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Subscribe to {selectedPackage?.name}</DialogTitle>
            <DialogDescription className="text-sm">
              {selectedPackage?.monthly_price === 0 
                ? "This package is free. Click confirm to start using it."
                : "Start your 14-day free trial. No credit card required."}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPackage && (
            <div className="space-y-4 py-4">
              <div className="text-center">
                <div className="text-4xl sm:text-5xl mb-3">{selectedPackage.icon}</div>
                <div className="text-2xl sm:text-3xl font-bold text-purple-600">
                  {selectedPackage.monthly_price === 0 ? 'Free' : `$${selectedPackage.monthly_price}/mo`}
                </div>
                {selectedPackage.monthly_price > 0 && (
                  <p className="text-xs sm:text-sm text-gray-600 mt-2">After 14-day trial</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSubscribeDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={() => subscribeMutation.mutate(selectedPackage)}
              disabled={subscribeMutation.isPending}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 min-h-[44px]"
            >
              {subscribeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Subscribing...
                </>
              ) : (
                'Confirm Subscribe'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
