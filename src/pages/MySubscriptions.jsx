import React, { useState } from "react";
import { apiClient } from "@/apis/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Pause,
  Play,
  TrendingUp,
  Loader2,
  AlertCircle,
  Settings as SettingsIcon,
  Key,
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import APIKeyManager from "../components/subscriptions/APIKeyManager";
import TrainingDashboard from "../components/training/TrainingDashboard";
import AgentMonitoringDashboard from "../components/monitoring/AgentMonitoringDashboard";

export default function MySubscriptions() {
  const [cancelingId, setCancelingId] = useState(null);
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

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['my-subscriptions', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      const allSubs = await apiClient.entities.AgentSubscription.list('-created_date');
      return allSubs.filter(s => s.subscriber_email === currentUser.email);
    },
    enabled: !!currentUser?.email,
    initialData: [],
  });

  const { data: packages = [] } = useQuery({
    queryKey: ['agent-packages'],
    queryFn: () => apiClient.entities.AgentPackage.list(),
    initialData: [],
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: (id) => apiClient.entities.AgentSubscription.update(id, {
      status: 'cancelled',
      cancellation_date: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-subscriptions']);
      setCancelingId(null);
    },
  });

  const pauseSubscriptionMutation = useMutation({
    mutationFn: (id) => apiClient.entities.AgentSubscription.update(id, {
      status: 'paused'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-subscriptions']);
    },
  });

  const getPackageInfo = (packageId) => {
    return packages.find(p => p.id === packageId);
  };

  const getStatusColor = (status) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      trial: "bg-blue-100 text-blue-800",
      cancelled: "bg-red-100 text-red-800",
      paused: "bg-yellow-100 text-yellow-800",
      expired: "bg-gray-100 text-gray-800"
    };
    return colors[status] || colors.active;
  };

  const getStatusIcon = (status) => {
    const icons = {
      active: <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />,
      trial: <Clock className="w-3 h-3 sm:w-4 sm:h-4" />,
      cancelled: <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />,
      paused: <Pause className="w-3 h-3 sm:w-4 sm:h-4" />,
      expired: <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
    };
    return icons[status] || icons.active;
  };

  const calculateUsagePercentage = (used, limit) => {
    // Safely handle undefined/null/0 values
    const usedValue = Number(used) || 0;
    const limitValue = Number(limit) || 0;
    
    if (limitValue === 0) return 0;
    
    const percentage = (usedValue / limitValue) * 100;
    // Ensure result is between 0 and 100
    return Math.max(0, Math.min(100, Math.round(percentage)));
  };

  const activeSubscriptions = subscriptions.filter(s => ['active', 'trial'].includes(s.status));
  const inactiveSubscriptions = subscriptions.filter(s => !['active', 'trial'].includes(s.status));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-3 sm:space-y-4"
          >
            <div className="flex items-center justify-center gap-2">
              <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
              <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold">My Subscriptions</h1>
            </div>
            <p className="text-sm sm:text-base lg:text-xl text-purple-100 max-w-2xl mx-auto px-4">
              Manage your AI agent subscriptions and API keys
            </p>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-6 pt-2">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold">{activeSubscriptions.length}</div>
                <div className="text-xs sm:text-sm text-purple-200">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold">{subscriptions.length}</div>
                <div className="text-xs sm:text-sm text-purple-200">Total</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active" className="text-xs sm:text-sm">
              Active ({activeSubscriptions.length})
            </TabsTrigger>
            <TabsTrigger value="inactive" className="text-xs sm:text-sm">
              Inactive ({inactiveSubscriptions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4 sm:space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-48 sm:h-64 w-full rounded-xl" />
                ))}
              </div>
            ) : activeSubscriptions.length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <CreditCard className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-base sm:text-lg font-semibold mb-2">No active subscriptions</p>
                  <p className="text-sm text-gray-600 mb-4">Explore the marketplace to find agent packages</p>
                  <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 min-h-[44px]">
                    Browse Marketplace
                  </Button>
                </CardContent>
              </Card>
            ) : (
              activeSubscriptions.map((subscription) => {
                const packageInfo = getPackageInfo(subscription.package_id);
                if (!packageInfo) return null;

                const requestsUsagePercent = calculateUsagePercentage(
                  subscription.usage_stats?.requests_used,
                  subscription.usage_stats?.requests_limit
                );
                const storageUsagePercent = calculateUsagePercentage(
                  subscription.usage_stats?.storage_used,
                  subscription.usage_stats?.storage_limit
                );

                return (
                  <Card key={subscription.id} className="border-2 hover:shadow-xl transition-all">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                          <div className="text-3xl sm:text-5xl">{packageInfo.icon}</div>
                          <div className="flex-1">
                            <CardTitle className="text-lg sm:text-xl lg:text-2xl">{packageInfo.name}</CardTitle>
                            <CardDescription className="text-sm">{packageInfo.category}</CardDescription>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(subscription.status)} whitespace-nowrap`}>
                          {getStatusIcon(subscription.status)}
                          <span className="ml-1">{subscription.status}</span>
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4 sm:space-y-6">
                      {/* Subscription Details Tabs */}
                      <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 gap-1">
                          <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
                          <TabsTrigger value="monitoring" className="text-xs sm:text-sm">
                            <Activity className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                            <span className="hidden sm:inline">Monitoring</span>
                            <span className="sm:hidden">Mon</span>
                          </TabsTrigger>
                          <TabsTrigger value="api" className="text-xs sm:text-sm">
                            <Key className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                            <span className="hidden sm:inline">API Keys</span>
                            <span className="sm:hidden">API</span>
                          </TabsTrigger>
                          <TabsTrigger value="training" className="text-xs sm:text-sm hidden sm:flex">Training</TabsTrigger>
                          <TabsTrigger value="usage" className="text-xs sm:text-sm">Usage</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4 pt-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                            <div className="space-y-1">
                              <p className="text-xs sm:text-sm text-gray-600">Price</p>
                              <p className="font-bold text-base sm:text-lg">
                                {packageInfo.monthly_price === 0 ? 'Free' : `$${packageInfo.monthly_price}/mo`}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs sm:text-sm text-gray-600">Started</p>
                              <p className="font-semibold text-sm">
                                {new Date(subscription.start_date).toLocaleDateString()}
                              </p>
                            </div>
                            {subscription.next_billing_date && (
                              <div className="space-y-1">
                                <p className="text-xs sm:text-sm text-gray-600">Next Bill</p>
                                <p className="font-semibold text-sm">
                                  {new Date(subscription.next_billing_date).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                            {subscription.status === 'trial' && subscription.trial_end_date && (
                              <div className="space-y-1">
                                <p className="text-xs sm:text-sm text-gray-600">Trial Ends</p>
                                <p className="font-semibold text-sm text-blue-600">
                                  {new Date(subscription.trial_end_date).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="monitoring" className="pt-4">
                          <AgentMonitoringDashboard
                            subscription={subscription}
                            packageInfo={packageInfo}
                          />
                        </TabsContent>

                        <TabsContent value="api" className="pt-4">
                          <APIKeyManager
                            subscription={subscription}
                            packageInfo={packageInfo}
                            userEmail={currentUser?.email}
                          />
                        </TabsContent>

                        <TabsContent value="training" className="pt-4">
                          <TrainingDashboard
                            subscription={subscription}
                            packageInfo={packageInfo}
                            userEmail={currentUser?.email}
                          />
                        </TabsContent>

                        <TabsContent value="usage" className="space-y-4 pt-4">
                          {subscription.usage_stats && (
                            <div className="space-y-4">
                              <h4 className="font-semibold text-sm sm:text-base text-gray-900">Usage This Month</h4>
                              
                              {subscription.usage_stats.requests_limit && (
                                <div className="space-y-2">
                                  <div className="flex justify-between text-xs sm:text-sm">
                                    <span className="text-gray-600">API Requests</span>
                                    <span className="font-semibold">
                                      {(subscription.usage_stats.requests_used || 0).toLocaleString()} / {subscription.usage_stats.requests_limit.toLocaleString()}
                                    </span>
                                  </div>
                                  <Progress value={requestsUsagePercent} className="h-2" />
                                </div>
                              )}

                              {subscription.usage_stats.storage_limit && (
                                <div className="space-y-2">
                                  <div className="flex justify-between text-xs sm:text-sm">
                                    <span className="text-gray-600">Storage</span>
                                    <span className="font-semibold">
                                      {subscription.usage_stats.storage_used || 0} GB / {subscription.usage_stats.storage_limit} GB
                                    </span>
                                  </div>
                                  <Progress value={storageUsagePercent} className="h-2" />
                                </div>
                              )}
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </CardContent>

                    <CardFooter className="flex flex-col sm:flex-row gap-2">
                      <Button className="w-full sm:flex-1 bg-gradient-to-r from-green-600 to-emerald-600 min-h-[44px]">
                        <Play className="w-4 h-4 mr-2" />
                        Launch Agent
                      </Button>
                      {subscription.status === 'active' && (
                        <Button
                          variant="outline"
                          onClick={() => pauseSubscriptionMutation.mutate(subscription.id)}
                          className="w-full sm:w-auto min-h-[44px]"
                        >
                          <Pause className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Pause</span>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto text-red-600 hover:bg-red-50 min-h-[44px]"
                        onClick={() => setCancelingId(subscription.id)}
                      >
                        Cancel
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="inactive" className="space-y-4 sm:space-y-6">
            {inactiveSubscriptions.length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-green-400" />
                  <p className="text-base sm:text-lg font-semibold mb-2">All subscriptions active</p>
                  <p className="text-sm text-gray-600">No inactive or cancelled subscriptions</p>
                </CardContent>
              </Card>
            ) : (
              inactiveSubscriptions.map((subscription) => {
                const packageInfo = getPackageInfo(subscription.package_id);
                if (!packageInfo) return null;

                return (
                  <Card key={subscription.id} className="border-2 opacity-75">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="text-3xl sm:text-5xl grayscale">{packageInfo.icon}</div>
                          <div>
                            <CardTitle className="text-lg sm:text-xl">{packageInfo.name}</CardTitle>
                            <CardDescription className="text-sm">{packageInfo.category}</CardDescription>
                          </div>
                        </div>
                        <Badge className={getStatusColor(subscription.status)}>
                          {getStatusIcon(subscription.status)}
                          <span className="ml-1">{subscription.status}</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm">
                      {subscription.cancellation_date && (
                        <p className="text-gray-600">
                          Cancelled on {new Date(subscription.cancellation_date).toLocaleDateString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancelingId} onOpenChange={(open) => !open && setCancelingId(null)}>
        <AlertDialogContent className="w-[95vw] max-w-[95vw] sm:w-full sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to cancel this subscription? You'll lose access to the agent and all associated features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelingId && cancelSubscriptionMutation.mutate(cancelingId)}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
            >
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
