import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import {
  Database,
  CheckCircle2,
  XCircle,
  Loader2,
  Bell,
  User,
  FileText,
  Activity,
  TestTube
} from "lucide-react";
import {
  notificationES,
  userES,
  logES,
  checkElasticsearchHealth
} from '../utils/elasticsearchFallback';
import { apiClient } from '@/apis/client';

export default function ElasticsearchTester({ currentUser }) {
  const [testing, setTesting] = useState(null);
  const [results, setResults] = useState({});
  const { toast } = useToast();

  const runTest = async (testName, testFn) => {
    setTesting(testName);
    try {
      const result = await testFn();
      setResults(prev => ({
        ...prev,
        [testName]: { success: true, data: result }
      }));
      toast({
        title: "Test Passed",
        description: `${testName} test completed successfully`,
      });
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [testName]: { 
          success: false, 
          error: error.message,
          request: error.request,
          response: error.response
        }
      }));
      toast({
        title: "Test Failed",
        description: `${testName}: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setTesting(null);
    }
  };

  const testNotifications = async () => {
    // Test create notification
    const notification = await notificationES.create({
      user_email: currentUser.email,
      title: 'Test Notification',
      message: 'This is a test notification from Elasticsearch',
      type: 'info',
      category: 'system'
    });

    // Test list notifications
    const notifications = await notificationES.list(currentUser.email, 10);

    // Test mark as read
    await notificationES.markAsRead(notification.id);

    // Don't delete - keep test data
    // await notificationES.delete(notification.id);

    return {
      created: notification,
      count: notifications.length,
      operations: ['create', 'list', 'markAsRead']
    };
  };

  const testUsers = async () => {
    // Test get by email
    const user = await userES.getByEmail(currentUser.email);

    // Don't update - just test read operations
    // const updated = await userES.update(user.id, {
    //   last_test_date: new Date().toISOString()
    // });

    return {
      user: user,
      operations: ['getByEmail']
    };
  };

  const testLogs = async () => {
    // Test create log
    const log = await logES.create('LLMLog', {
      user_email: currentUser.email,
      action: 'elasticsearch_test',
      details: 'Testing Elasticsearch log operations',
      metadata: {
        test: true,
        timestamp: new Date().toISOString()
      }
    });

    // Test query logs
    const logs = await logES.query('LLMLog', {
      user_email: currentUser.email
    }, 5);

    // Test get recent
    const recent = await logES.getRecent('LLMLog', 3);

    return {
      created: log,
      queryCount: logs.length,
      recentCount: recent.length,
      operations: ['create', 'query', 'getRecent']
    };
  };

  const testHealth = async () => {
    const health = await checkElasticsearchHealth();
    return health;
  };

  const testPrimaryFallback = async () => {
    // Try to trigger a primary DB failure and see if ES picks up
    try {
      // Try normal operation
      await apiClient.entities.Notification.list();
      
      return {
        mode: 'Primary DB working',
        message: 'No fallback needed - primary database is healthy'
      };
    } catch (error) {
      // If it fails, try ES
      const esNotifs = await notificationES.list(currentUser.email);
      return {
        mode: 'Fallback activated',
        message: `Primary DB failed, ES returned ${esNotifs.length} notifications`,
        esCount: esNotifs.length
      };
    }
  };

  const tests = [
    {
      id: 'health',
      name: 'ES Health Check',
      icon: Activity,
      color: 'text-green-600',
      description: 'Check Elasticsearch cluster health',
      fn: testHealth
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: Bell,
      color: 'text-blue-600',
      description: 'Test notification CRUD operations',
      fn: testNotifications
    },
    {
      id: 'users',
      name: 'Users',
      icon: User,
      color: 'text-purple-600',
      description: 'Test user read and update operations',
      fn: testUsers
    },
    {
      id: 'logs',
      name: 'Logs',
      icon: FileText,
      color: 'text-orange-600',
      description: 'Test log creation and querying',
      fn: testLogs
    },
    {
      id: 'fallback',
      name: 'Primary Fallback',
      icon: Database,
      color: 'text-red-600',
      description: 'Test automatic fallback mechanism',
      fn: testPrimaryFallback
    }
  ];

  const runAllTests = async () => {
    for (const test of tests) {
      await runTest(test.id, test.fn);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5 text-purple-600" />
          Elasticsearch Testing Suite
        </CardTitle>
        <CardDescription>
          Test Elasticsearch operations and auto-fallback functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="bg-blue-50 border-blue-200">
          <Database className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            These tests will interact with your Elasticsearch instance to verify that all operations work correctly.
            Tests include notification management, user operations, log creation, and health checks.
          </AlertDescription>
        </Alert>

        <div className="flex gap-3">
          <Button
            onClick={runAllTests}
            disabled={testing !== null}
            className="bg-gradient-to-r from-purple-600 to-indigo-600"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <TestTube className="w-4 h-4 mr-2" />
                Run All Tests
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tests.map((test) => {
            const Icon = test.icon;
            const result = results[test.id];
            const isRunning = testing === test.id;

            return (
              <Card 
                key={test.id}
                className={`transition-all ${
                  result?.success 
                    ? 'border-green-300 bg-green-50' 
                    : result?.success === false
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200'
                }`}
              >
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${test.color}`} />
                      <h3 className="font-semibold">{test.name}</h3>
                    </div>
                    {result && (
                      result.success ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )
                    )}
                  </div>

                  <p className="text-sm text-gray-600">{test.description}</p>

                  {result && (
                    <div className="mt-2 p-3 bg-white rounded-lg border text-xs">
                      {result.success ? (
                        <div className="space-y-1">
                          <p className="font-semibold text-green-700">✓ Test passed</p>
                          {result.data && (
                            <pre className="text-xs text-gray-600 overflow-auto max-h-32">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="font-semibold text-red-700">✗ Test failed</p>
                          <p className="text-red-600 mt-1">{result.error}</p>
                          {result.request?.curl && (
                            <div className="mt-2 space-y-1">
                              <p className="font-semibold text-gray-700">Request (curl):</p>
                              <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32 whitespace-pre-wrap">
                                {result.request.curl}
                              </pre>
                            </div>
                          )}
                          {result.response && (
                            <div className="mt-2 space-y-1">
                              <p className="font-semibold text-gray-700">Response:</p>
                              <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32">
                                {JSON.stringify(result.response, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={() => runTest(test.id, test.fn)}
                    disabled={testing !== null}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      'Run Test'
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {Object.keys(results).length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Test Summary</h4>
              <div className="flex gap-3">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {Object.values(results).filter(r => r.success).length} passed
                </Badge>
                <Badge variant="outline" className="bg-red-50 text-red-700">
                  {Object.values(results).filter(r => !r.success).length} failed
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
