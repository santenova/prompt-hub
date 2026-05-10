import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Database, 
  Users, 
  Loader2, 
  Lock,
  Settings,
  FileJson,
  Activity,
  TrendingUp,
  Package,
  FlaskConical
} from "lucide-react";
import { apiClient } from "@/apis/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import PersonaImportExport from "../components/admin/PersonaImportExport";
import TemplateImportExport from "../components/admin/TemplateImportExport";
import UserImportExport from "../components/admin/UserImportExport";
import ContentExampleImportExport from "../components/admin/ContentExampleImportExport";
import ElasticsearchDataSource from "../components/admin/ElasticsearchDataSource";
import ElasticsearchTester from "../components/settings/ElasticsearchTester";
import AdminSlackWebhookManager from "../components/admin/AdminSlackWebhookManager";
import AdminSlackMessagesPanel from "../components/admin/AdminSlackMessagesPanel";
import CompanySettingsPanel from "../components/admin/CompanySettingsPanel";
import ActivityLogViewer from "../components/admin/ActivityLogViewer";

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch all entities for stats
  const { data: personas = [] } = useQuery({
    queryKey: ['all-personas'],
    queryFn: () => apiClient.entities.Persona.list('-created_date'),
    enabled: isAdmin,
    initialData: [],
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['all-templates'],
    queryFn: () => apiClient.entities.Template.list('-created_date'),
    enabled: isAdmin,
    initialData: [],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => apiClient.entities.User.list(),
    enabled: isAdmin,
    initialData: [],
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['all-notifications'],
    queryFn: () => apiClient.entities.Notification.list('-created_date'),
    enabled: isAdmin,
    initialData: [],
  });

  useEffect(() => {
    const checkAuthAndAdmin = async () => {
      setIsLoading(true);
      try {
        // Try to get user directly - if it fails, they're not authenticated
        const user = await apiClient.auth.me();
        setCurrentUser(user);

        // Check if user is admin
        if (user.role !== 'admin') {
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error("Admin auth check failed:", error);
        // User is not authenticated, redirect to login
        setCurrentUser(null);
        setIsAdmin(false);
        setTimeout(() => {
          apiClient.auth.redirectToLogin(window.location.pathname);
        }, 2000);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthAndAdmin();
  }, []);

  // Calculate statistics
  const stats = {
    totalUsers: users.length,
    totalPersonas: personas.length,
    customPersonas: personas.filter(p => p.is_custom).length,
    totalTemplates: templates.length,
    publicTemplates: templates.filter(t => t.is_public || t.visibility === 'public').length,
    unreadNotifications: notifications.filter(n => !n.is_read && !n.is_archived).length,
    activeUsers: users.filter(u => u.onboarding_completed).length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-purple-600 mx-auto" />
          <p className="text-sm sm:text-base text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="border-2 border-red-200 bg-white shadow-xl">
            <CardHeader className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-red-600" />
              </div>
              <CardTitle className="text-xl sm:text-2xl">Authentication Required</CardTitle>
              <CardDescription className="text-sm sm:text-base mt-2">
                You must be logged in to access the admin dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Redirecting to login...</span>
              </div>
              <Button
                onClick={() => apiClient.auth.redirectToLogin(window.location.pathname)}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                size="lg"
              >
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="border-2 border-yellow-200 bg-white shadow-xl">
            <CardHeader className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-600" />
              </div>
              <CardTitle className="text-xl sm:text-2xl">Admin Access Required</CardTitle>
              <CardDescription className="text-sm sm:text-base mt-2">
                This page is only accessible to administrators.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-yellow-50 border-yellow-200">
                <Shield className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  Your current role: <Badge variant="secondary">{currentUser?.role}</Badge>
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Button
                  onClick={() => window.history.back()}
                  variant="outline"
                  className="flex-1"
                >
                  Go Back
                </Button>
                <Button
                  onClick={() => window.location.href = '/'}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600"
                >
                  Go to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-purple-100 mt-1 text-sm sm:text-base">
                  Manage personas, templates, and system data
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4" />
                  <p className="text-xs font-medium opacity-90">Users</p>
                </div>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                <p className="text-xs opacity-75 mt-1">{stats.activeUsers} active</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <Database className="w-4 h-4" />
                  <p className="text-xs font-medium opacity-90">Personas</p>
                </div>
                <p className="text-2xl font-bold">{stats.totalPersonas}</p>
                <p className="text-xs opacity-75 mt-1">{stats.customPersonas} custom</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <FileJson className="w-4 h-4" />
                  <p className="text-xs font-medium opacity-90">Templates</p>
                </div>
                <p className="text-2xl font-bold">{stats.totalTemplates}</p>
                <p className="text-xs opacity-75 mt-1">{stats.publicTemplates} public</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4" />
                  <p className="text-xs font-medium opacity-90">Notifications</p>
                </div>
                <p className="text-2xl font-bold">{notifications.length}</p>
                <p className="text-xs opacity-75 mt-1">{stats.unreadNotifications} unread</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Tabs defaultValue="personas" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-8 gap-1">
            <TabsTrigger value="personas">
              <Database className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Personas</span>
              <span className="sm:hidden">Personas</span>
            </TabsTrigger>
            <TabsTrigger value="templates">
              <FileJson className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Templates</span>
              <span className="sm:hidden">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="examples">
              <Package className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Examples</span>
              <span className="sm:hidden">Examples</span>
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Users</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Activity className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Activity</span>
              <span className="sm:hidden">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="experimental">
              <FlaskConical className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Experimental</span>
              <span className="sm:hidden">Lab</span>
            </TabsTrigger>
            <TabsTrigger value="company">
              <Settings className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Company</span>
              <span className="sm:hidden">Company</span>
            </TabsTrigger>
            <TabsTrigger value="system">
              <TrendingUp className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">System</span>
              <span className="sm:hidden">System</span>
            </TabsTrigger>
          </TabsList>

          {/* Persona Management Tab */}
          <TabsContent value="personas" className="space-y-6">
            <PersonaImportExport currentUser={currentUser} />
          </TabsContent>

          {/* Template Management Tab */}
          <TabsContent value="templates" className="space-y-6">
            <TemplateImportExport currentUser={currentUser} />
          </TabsContent>

          {/* Content Examples Management Tab */}
          <TabsContent value="examples" className="space-y-6">
            <ContentExampleImportExport />
          </TabsContent>

          {/* Experimental Tab */}
          <TabsContent value="experimental" className="space-y-6">
            <ElasticsearchDataSource />
            <ElasticsearchTester currentUser={currentUser} />
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <UserImportExport currentUser={currentUser} />
          </TabsContent>

          {/* Activity Logs Tab */}
          <TabsContent value="activity" className="space-y-6">
            <ActivityLogViewer />
          </TabsContent>

          {/* Company Settings Tab */}
          <TabsContent value="company" className="space-y-6">
            <CompanySettingsPanel />
          </TabsContent>

          {/* System Info Tab */}
          <TabsContent value="system" className="space-y-6">
            <AdminSlackWebhookManager currentUser={currentUser} />

            <AdminSlackMessagesPanel 
              webhookUrl={currentUser?.admin_slack_webhook_url}
              currentUser={currentUser}
            />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-600" />
                  System Information
                </CardTitle>
                <CardDescription>
                  Platform statistics and system health
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">Admin User</Label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="font-medium">{currentUser?.email}</p>
                      <Badge className="mt-2 bg-purple-600">Administrator</Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">Last Login</Label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="font-medium">
                        {new Date().toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Database Statistics</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-gray-50 p-3 rounded border text-center">
                      <p className="text-2xl font-bold text-purple-600">{stats.totalPersonas}</p>
                      <p className="text-xs text-gray-600 mt-1">Personas</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded border text-center">
                      <p className="text-2xl font-bold text-blue-600">{stats.totalTemplates}</p>
                      <p className="text-xs text-gray-600 mt-1">Templates</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded border text-center">
                      <p className="text-2xl font-bold text-green-600">{stats.totalUsers}</p>
                      <p className="text-xs text-gray-600 mt-1">Users</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded border text-center">
                      <p className="text-2xl font-bold text-orange-600">{notifications.length}</p>
                      <p className="text-xs text-gray-600 mt-1">Notifications</p>
                    </div>
                  </div>
                </div>

                <Alert className="bg-green-50 border-green-200">
                  <Activity className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>System Status:</strong> All systems operational
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Label({ children, className }) {
  return <label className={className}>{children}</label>;
}
