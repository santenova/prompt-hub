import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Terminal, Code, Activity, Info, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ConsoleLogger() {
  const [loggingEnabled, setLoggingEnabled] = useState(false);

  useEffect(() => {
    const isEnabled = localStorage.getItem('advancedLoggingEnabled') === 'true';
    setLoggingEnabled(isEnabled);
  }, []);

  const handleToggle = (enabled) => {
    setLoggingEnabled(enabled);
    localStorage.setItem('advancedLoggingEnabled', enabled.toString());
    
    if (enabled) {
      // Import and enable logging
      import('../components/utils/apiClientWithLogging').then(() => {
        console.log('%c🎯 Advanced Logging Enabled', 'background: #22c55e; color: white; padding: 8px; border-radius: 4px; font-weight: bold');
        window.location.reload();
      });
    } else {
      console.log('%c🛑 Advanced Logging Disabled', 'background: #ef4444; color: white; padding: 8px; border-radius: 4px; font-weight: bold');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-slate-600 to-gray-700 rounded-xl flex items-center justify-center">
              <Terminal className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-700 to-gray-800 bg-clip-text text-transparent">
              Console Logger
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Advanced activity and API call tracking for developers
          </p>
        </motion.div>

        {/* Main Control Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-600" />
                    Advanced Logging
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Enable detailed console logging for all API interactions, backend functions, and user activities
                  </CardDescription>
                </div>
                <Switch
                  checked={loggingEnabled}
                  onCheckedChange={handleToggle}
                  className="data-[state=checked]:bg-green-600"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className={loggingEnabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}>
                <Activity className={`h-4 w-4 ${loggingEnabled ? 'text-green-600' : 'text-gray-600'}`} />
                <AlertDescription className={loggingEnabled ? 'text-green-800' : 'text-gray-600'}>
                  {loggingEnabled ? (
                    <div className="space-y-2">
                      <p className="font-semibold">✓ Advanced logging is currently ENABLED</p>
                      <p className="text-sm">Open your browser's developer console (F12) to see detailed logs of all activities</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-semibold">Advanced logging is currently DISABLED</p>
                      <p className="text-sm">Enable it to track API calls, backend functions, and user activities</p>
                    </div>
                  )}
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <Code className="w-5 h-5 text-blue-600 mb-2" />
                  <h3 className="font-semibold mb-1">What Gets Logged</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Backend function calls</li>
                    <li>• Entity operations (CRUD)</li>
                    <li>• Authentication activities</li>
                    <li>• Integration API calls</li>
                    <li>• Notification operations</li>
                    <li>• Analytics events</li>
                  </ul>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border">
                  <Info className="w-5 h-5 text-purple-600 mb-2" />
                  <h3 className="font-semibold mb-1">Log Details Include</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Timestamps & durations</li>
                    <li>• Request/response data</li>
                    <li>• Error messages</li>
                    <li>• Call stack traces</li>
                    <li>• Session statistics</li>
                    <li>• Success/failure status</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  ⚡
                </div>
                Functions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Track all backend function invocations with parameters, results, and execution time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  📊
                </div>
                Entities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Monitor all database operations including list, create, update, and delete actions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  🔐
                </div>
                Auth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Log authentication events including login, logout, and user data updates
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                  🔌
                </div>
                Integrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Monitor external API calls to integrations like Core, AI services, and more
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  🔔
                </div>
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Track notification creation, updates, and user interactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  📈
                </div>
                Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Log custom analytics events with properties and timestamps
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                How to Use
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start gap-3">
                <Badge className="mt-0.5 bg-blue-600">1</Badge>
                <p>Enable advanced logging using the toggle switch above</p>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="mt-0.5 bg-blue-600">2</Badge>
                <p>Open your browser's Developer Console (F12 or Right-click → Inspect → Console)</p>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="mt-0.5 bg-blue-600">3</Badge>
                <p>Navigate through the app and perform actions to see detailed logs</p>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="mt-0.5 bg-blue-600">4</Badge>
                <p>Click on collapsed log groups to expand and see full details</p>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="mt-0.5 bg-blue-600">5</Badge>
                <p>Review session summary before closing the page for overall statistics</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {loggingEnabled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200"
          >
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Advanced Logging Active
            </h3>
            <p className="text-sm text-green-700">
              Check your browser console to see the magic! All API calls and activities are being tracked.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
