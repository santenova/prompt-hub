
import React, { useState, useEffect } from "react";
import { apiClient } from "@/apis/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
  TrendingUp,
  TrendingDown,
  Zap,
  Server,
  Database,
  Cpu,
  RefreshCw,
  BarChart3,
  Terminal,
  Eye
} from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import LiveLogViewer from "./LiveLogViewer";
import RealTimeChart from "./RealTimeChart";

export default function AgentMonitoringDashboard({ subscription, packageInfo }) {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const queryClient = useQueryClient();

  // Fetch latest metrics
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['agent-metrics', subscription.id],
    queryFn: async () => {
      const allMetrics = await apiClient.entities.AgentMetrics.list('-timestamp');
      const subscriptionMetrics = allMetrics.filter(m => m.subscription_id === subscription.id);
      return subscriptionMetrics.length > 0 ? subscriptionMetrics[0] : null;
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
    initialData: null,
  });

  // Fetch historical metrics for charts
  const { data: historicalMetrics = [] } = useQuery({
    queryKey: ['agent-metrics-history', subscription.id],
    queryFn: async () => {
      const allMetrics = await apiClient.entities.AgentMetrics.list('-timestamp');
      return allMetrics
        .filter(m => m.subscription_id === subscription.id)
        .slice(0, 50)
        .reverse();
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
    initialData: [],
  });

  // Fetch recent logs
  const { data: recentLogs = [] } = useQuery({
    queryKey: ['agent-logs', subscription.id],
    queryFn: async () => {
      const allLogs = await apiClient.entities.AgentMonitoringLog.list('-timestamp');
      return allLogs
        .filter(l => l.subscription_id === subscription.id)
        .slice(0, 100);
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
    initialData: [],
  });

  const getStatusColor = (status) => {
    const colors = {
      online: "bg-green-100 text-green-800 border-green-300",
      offline: "bg-gray-100 text-gray-800 border-gray-300",
      degraded: "bg-yellow-100 text-yellow-800 border-yellow-300",
      error: "bg-red-100 text-red-800 border-red-300"
    };
    return colors[status] || colors.online;
  };

  const getStatusIcon = (status) => {
    const icons = {
      online: <CheckCircle2 className="w-4 h-4 text-green-600" />,
      offline: <AlertCircle className="w-4 h-4 text-gray-600" />,
      degraded: <AlertCircle className="w-4 h-4 text-yellow-600" />,
      error: <AlertCircle className="w-4 h-4 text-red-600" />
    };
    return icons[status] || icons.online;
  };

  const formatUptime = (seconds) => {
    const uptimeValue = Number(seconds) || 0;
    if (uptimeValue === 0) return "N/A";
    
    const days = Math.floor(uptimeValue / 86400);
    const hours = Math.floor((uptimeValue % 86400) / 3600);
    const minutes = Math.floor((uptimeValue % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const safeNumber = (value, defaultValue = 0) => {
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  };

  const calculateHealthComponent = (value, maxDegradationValue) => {
    const safeValue = safeNumber(value, 0);
    const safeMaxDegradationValue = safeNumber(maxDegradationValue, 1);
    
    if (safeValue <= 0) return 100; // Perfect score if value is non-positive or 0
    if (safeMaxDegradationValue <= 0) return 100; // If maxDegradationValue is 0 or less, assume perfect health

    const health = 100 - (safeValue / safeMaxDegradationValue) * 100;
    return Math.max(0, Math.min(100, health));
  };

  if (!metrics && !isLoading) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12 text-center">
          <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-semibold mb-2">No Monitoring Data</p>
          <p className="text-sm text-gray-600 mb-4">
            Deploy your agent to start collecting metrics
          </p>
          <Button className="bg-gradient-to-r from-purple-600 to-indigo-600">
            Deploy Agent
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            Agent Monitoring
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Real-time performance metrics and logs
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              queryClient.invalidateQueries(['agent-metrics']);
              queryClient.invalidateQueries(['agent-logs']);
            }}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex-1 sm:flex-none"
          >
            {autoRefresh ? "Auto: ON" : "Auto: OFF"}
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      {metrics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className={`border-2 ${getStatusColor(metrics.status)}`}>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(metrics.status)}
                  <div>
                    <h4 className="font-semibold text-lg capitalize">{metrics.status}</h4>
                    <p className="text-sm text-gray-600">
                      Last updated: {new Date(metrics.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-purple-600 text-white">
                    Health: {safeNumber(metrics.health_score, 0).toFixed(0)}%
                  </Badge>
                  <Badge variant="outline">
                    Uptime: {formatUptime(metrics.uptime_seconds)}
                  </Badge>
                </div>
              </div>

              {/* Alerts */}
              {metrics.status === 'degraded' && (
                <Alert className="mt-4 bg-yellow-50 border-yellow-300">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-900">
                    Agent is experiencing degraded performance. Response times are higher than normal.
                  </AlertDescription>
                </Alert>
              )}
              {metrics.status === 'error' && (
                <Alert className="mt-4 bg-red-50 border-red-300">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-900">
                    Agent has encountered errors. Error rate: {safeNumber(metrics.error_rate, 0).toFixed(1)}%
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Metrics Grid */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-8 h-8 text-blue-600" />
                {safeNumber(metrics.requests_per_second, 0) > (safeNumber(metrics.peak_rps, 0) * 0.8) && (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                )}
              </div>
              <div className="text-2xl sm:text-3xl font-bold">
                {safeNumber(metrics.requests_per_second, 0).toFixed(1)}
              </div>
              <p className="text-xs sm:text-sm text-gray-600">Requests/sec</p>
              <p className="text-xs text-gray-500 mt-1">
                Peak: {safeNumber(metrics.peak_rps, 0).toFixed(1)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold">
                {safeNumber(metrics.active_users, 0)}
              </div>
              <p className="text-xs sm:text-sm text-gray-600">Active Users</p>
              <p className="text-xs text-gray-500 mt-1">
                Total: {safeNumber(metrics.total_requests_today, 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold">
                {safeNumber(metrics.avg_response_time_ms, 0)}ms
              </div>
              <p className="text-xs sm:text-sm text-gray-600">Avg Response</p>
              <p className="text-xs text-gray-500 mt-1">
                {safeNumber(metrics.avg_response_time_ms, 0) < 200 ? 'Excellent' : 
                 safeNumber(metrics.avg_response_time_ms, 0) < 500 ? 'Good' : 'Slow'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold">
                {safeNumber(metrics.success_rate, 100).toFixed(1)}%
              </div>
              <p className="text-xs sm:text-sm text-gray-600">Success Rate</p>
              <p className="text-xs text-gray-500 mt-1">
                Errors: {safeNumber(metrics.total_errors_today, 0)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Resources */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Server className="w-5 h-5" />
              System Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  CPU Usage
                </span>
                <span className="font-semibold">{safeNumber(metrics.cpu_usage, 0).toFixed(1)}%</span>
              </div>
              <Progress value={Math.min(100, safeNumber(metrics.cpu_usage, 0))} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Memory Usage
                </span>
                <span className="font-semibold">{safeNumber(metrics.memory_usage, 0).toFixed(1)}%</span>
              </div>
              <Progress value={Math.min(100, safeNumber(metrics.memory_usage, 0))} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Tabs */}
      <Tabs defaultValue="charts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3">
          <TabsTrigger value="charts" className="text-xs sm:text-sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Charts</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="text-xs sm:text-sm">
            <Terminal className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Live Logs</span>
          </TabsTrigger>
          <TabsTrigger value="details" className="text-xs sm:text-sm">
            <Eye className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Details</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="charts">
          <RealTimeChart 
            data={historicalMetrics}
            subscription={subscription}
          />
        </TabsContent>

        <TabsContent value="logs">
          <LiveLogViewer 
            logs={recentLogs}
            subscriptionId={subscription.id}
            autoRefresh={autoRefresh}
          />
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Performance Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Total Requests Today</p>
                  <p className="text-2xl font-bold">{safeNumber(metrics?.total_requests_today, 0)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Total Errors Today</p>
                  <p className="text-2xl font-bold text-red-600">{safeNumber(metrics?.total_errors_today, 0)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Peak RPS</p>
                  <p className="text-2xl font-bold">{safeNumber(metrics?.peak_rps, 0).toFixed(1)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Error Rate</p>
                  <p className="text-2xl font-bold text-orange-600">{safeNumber(metrics?.error_rate, 0).toFixed(2)}%</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Health Score Breakdown</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Response Time</span>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={calculateHealthComponent(metrics?.avg_response_time_ms, 1000)} // 1000ms response time means 0% health
                        className="w-24 h-2" 
                      />
                      <span className="text-sm font-semibold">
                        {calculateHealthComponent(metrics?.avg_response_time_ms, 1000).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Success Rate</span>
                    <div className="flex items-center gap-2">
                      <Progress value={safeNumber(metrics?.success_rate, 100)} className="w-24 h-2" />
                      <span className="text-sm font-semibold">{safeNumber(metrics?.success_rate, 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Resource Usage</span>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={100 - ((safeNumber(metrics?.cpu_usage, 0) + safeNumber(metrics?.memory_usage, 0)) / 2)} 
                        className="w-24 h-2" 
                      />
                      <span className="text-sm font-semibold">
                        {Math.max(0, 100 - Math.floor(((safeNumber(metrics?.cpu_usage, 0) + safeNumber(metrics?.memory_usage, 0)) / 2)))}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
