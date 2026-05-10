import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  Upload, 
  FileJson, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Users,
  Shield,
  Activity,
  FileText,
  X,
  AlertTriangle
} from "lucide-react";
import { apiClient } from "@/apis/client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

export default function UserImportExport({ currentUser }) {
  const [importFile, setImportFile] = useState(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.entities.User.list(),
    initialData: [],
  });

  // Export all users to JSON
  const handleExportUsers = async () => {
    setIsExporting(true);
    try {
      const exportData = users.map(user => {
        // Remove sensitive system fields but keep role and status info
        const { id, created_date, updated_date, ...cleanData } = user;
        return {
          ...cleanData,
          exported_by: currentUser?.email,
          export_date: new Date().toISOString(),
          version: '1.0'
        };
      });

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `users-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Export filtered users
  const handleExportFiltered = async (filter = {}) => {
    setIsExporting(true);
    try {
      let filteredUsers = [...users];
      
      if (filter.role) {
        filteredUsers = filteredUsers.filter(u => u.role === filter.role);
      }
      
      if (filter.onboarding_completed !== undefined) {
        filteredUsers = filteredUsers.filter(u => u.onboarding_completed === filter.onboarding_completed);
      }

      const exportData = filteredUsers.map(user => {
        const { id, created_date, updated_date, ...cleanData } = user;
        return {
          ...cleanData,
          exported_by: currentUser?.email,
          export_date: new Date().toISOString(),
          version: '1.0'
        };
      });

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      const filterName = filter.role || (filter.onboarding_completed ? 'active' : 'all');
      link.download = `users-${filterName}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      setImportFile(file);
      setImportResults(null);
    } else {
      alert('Please select a valid JSON file');
    }
  };

  const resetImport = () => {
    setImportFile(null);
    setImportProgress(0);
    setImportResults(null);
  };

  const adminCount = users.filter(u => u.role === 'admin').length;
  const activeCount = users.filter(u => u.onboarding_completed).length;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="export" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="export">
            <Download className="w-4 h-4 mr-2" />
            Export
          </TabsTrigger>
          <TabsTrigger value="info">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Important Info
          </TabsTrigger>
        </TabsList>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Export Users
              </CardTitle>
              <CardDescription>
                Download user data as JSON for backup or reporting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-900">{users.length}</p>
                      <p className="text-xs text-purple-700">Total Users</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-900">{adminCount}</p>
                      <p className="text-xs text-blue-700">Administrators</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Activity className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-900">{activeCount}</p>
                      <p className="text-xs text-green-700">Active Users</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Export Options */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold mb-3 block">Export Options</Label>
                  
                  <div className="space-y-3">
                    {/* Export All */}
                    <div className="border rounded-lg p-4 hover:border-purple-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">All Users</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Export all {users.length} user profiles (excludes passwords)
                          </p>
                        </div>
                        <Button
                          onClick={handleExportUsers}
                          disabled={isExporting || users.length === 0}
                          className="bg-gradient-to-r from-purple-600 to-indigo-600"
                        >
                          {isExporting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Exporting...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-2" />
                              Export All
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Export Admins */}
                    <div className="border rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">Admin Users Only</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Export only administrator accounts ({adminCount} users)
                          </p>
                        </div>
                        <Button
                          onClick={() => handleExportFiltered({ role: 'admin' })}
                          disabled={isExporting || adminCount === 0}
                          variant="outline"
                          className="border-blue-300 hover:bg-blue-50"
                        >
                          {isExporting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4 mr-2" />
                          )}
                          Export Admins
                        </Button>
                      </div>
                    </div>

                    {/* Export Active */}
                    <div className="border rounded-lg p-4 hover:border-green-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">Active Users</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Export users who completed onboarding ({activeCount} users)
                          </p>
                        </div>
                        <Button
                          onClick={() => handleExportFiltered({ onboarding_completed: true })}
                          disabled={isExporting || activeCount === 0}
                          variant="outline"
                          className="border-green-300 hover:bg-green-50"
                        >
                          {isExporting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4 mr-2" />
                          )}
                          Export Active
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <FileJson className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Export Format:</strong> Users will be exported as JSON. Sensitive fields like passwords 
                  are automatically excluded. System fields (ID, dates) are removed for clean data.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                User Import/Export Information
              </CardTitle>
              <CardDescription>
                Important information about user data management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 space-y-2">
                  <p><strong>User Import is NOT Available</strong></p>
                  <p className="text-sm">
                    For security reasons, user accounts cannot be imported directly. Users must be invited 
                    through the platform's invitation system to ensure proper authentication and security.
                  </p>
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Why Export-Only?</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <p><strong>Security:</strong> User authentication is handled by apiClient's secure system</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Activity className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <p><strong>Data Integrity:</strong> Prevents unauthorized account creation</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <p><strong>Audit Trail:</strong> All user registrations are properly tracked</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-2">What You Can Do:</h4>
                <ul className="space-y-1 text-sm text-gray-700 list-disc list-inside">
                  <li>Export user data for backup and reporting</li>
                  <li>Analyze user statistics and activity</li>
                  <li>Create data reports for business intelligence</li>
                  <li>Migrate user preferences and settings (coming soon)</li>
                </ul>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <FileJson className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Need to invite users?</strong> Use the user invitation feature in your dashboard 
                  settings to send secure invitation emails.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
