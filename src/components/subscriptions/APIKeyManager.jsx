import React, { useState } from "react";
import { apiClient } from "@/apis/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Key, 
  Plus, 
  Copy, 
  Eye, 
  EyeOff, 
  Trash2, 
  CheckCircle2,
  AlertCircle,
  Code,
  TrendingUp
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useToast } from "@/components/ui/use-toast";

export default function APIKeyManager({ subscription, packageInfo, userEmail }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [environment, setEnvironment] = useState("production");
  const [newKeyData, setNewKeyData] = useState(null);
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [deletingKeyId, setDeletingKeyId] = useState(null);
  const [visibleKeys, setVisibleKeys] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ['api-keys', subscription.id],
    queryFn: async () => {
      const allKeys = await apiClient.entities.APIKey.list();
      return allKeys.filter(k => k.subscription_id === subscription.id);
    },
    initialData: [],
  });

  const generateAPIKey = () => {
    const prefix = environment === 'production' ? 'pm_live' : environment === 'staging' ? 'pm_stg' : 'pm_dev';
    const randomPart = Array.from({ length: 32 }, () => 
      'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
    ).join('');
    return `${prefix}_${randomPart}`;
  };

  const generateSecretKey = () => {
    return Array.from({ length: 64 }, () => 
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]
    ).join('');
  };

  const getRateLimits = (tier) => {
    const limits = {
      free: { requests_per_minute: 10, requests_per_hour: 100, requests_per_day: 1000, requests_per_month: 10000 },
      basic: { requests_per_minute: 60, requests_per_hour: 1000, requests_per_day: 10000, requests_per_month: 100000 },
      professional: { requests_per_minute: 300, requests_per_hour: 10000, requests_per_day: 100000, requests_per_month: 1000000 },
      enterprise: { requests_per_minute: 1000, requests_per_hour: 50000, requests_per_day: 500000, requests_per_month: 5000000 }
    };
    return limits[tier] || limits.free;
  };

  const createKeyMutation = useMutation({
    mutationFn: async (data) => apiClient.entities.APIKey.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['api-keys']);
      setShowCreateDialog(false);
      setKeyName("");
      setNewKeyData(data.data);
      setShowNewKeyDialog(true);
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: (id) => apiClient.entities.APIKey.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['api-keys']);
      toast({
        title: "API Key Deleted",
        description: "The API key has been permanently deleted.",
      });
      setDeletingKeyId(null);
    },
  });

  const handleCreateKey = () => {
    const apiKey = generateAPIKey();
    const secretKey = generateSecretKey();
    const rateLimits = getRateLimits(packageInfo.pricing_tier);

    createKeyMutation.mutate({
      user_email: userEmail,
      subscription_id: subscription.id,
      package_id: packageInfo.id,
      package_name: packageInfo.name,
      api_key: apiKey,
      secret_key: secretKey,
      key_name: keyName || `${environment} Key`,
      environment: environment,
      rate_limits: rateLimits,
      permissions: ["read", "write"],
      usage_stats: {
        total_requests: 0,
        requests_today: 0,
        requests_this_month: 0,
        error_count: 0,
        success_count: 0
      }
    });
  };

  const toggleKeyVisibility = (keyId) => {
    setVisibleKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const copyToClipboard = (text, keyId) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
    toast({
      title: "Copied!",
      description: "API key copied to clipboard",
    });
  };

  const maskKey = (key) => {
    if (!key) return '';
    const parts = key.split('_');
    if (parts.length < 2) return key;
    return `${parts[0]}_${parts[1].substring(0, 4)}${'•'.repeat(parts[1].length - 4)}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-600" />
            API Keys
          </h4>
          <p className="text-sm text-gray-600">Manage API keys for this subscription</p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          size="sm"
          className="bg-gradient-to-r from-indigo-600 to-purple-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Key
        </Button>
      </div>

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed">
          <Key className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-600 mb-3">No API keys created yet</p>
          <Button onClick={() => setShowCreateDialog(true)} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Key
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {apiKeys.map((key) => (
            <Card key={key.id} className="border-2">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{key.key_name}</p>
                      <Badge variant="outline" className="text-xs">
                        {key.environment}
                      </Badge>
                      {key.is_active ? (
                        <Badge className="bg-green-600 text-xs">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {visibleKeys[key.id] ? key.api_key : maskKey(key.api_key)}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleKeyVisibility(key.id)}
                      >
                        {visibleKeys[key.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(key.api_key, key.id)}
                      >
                        {copiedKey === key.id ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => setDeletingKeyId(key.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Usage Stats */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t text-xs">
                  <div>
                    <p className="text-gray-600">Total Requests</p>
                    <p className="font-semibold">{key.usage_stats?.total_requests || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">This Month</p>
                    <p className="font-semibold">{key.usage_stats?.requests_this_month || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Success Rate</p>
                    <p className="font-semibold">
                      {key.usage_stats?.total_requests > 0
                        ? ((key.usage_stats?.success_count / key.usage_stats?.total_requests) * 100).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                </div>

                {/* Rate Limits */}
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-gray-600 mb-1">Rate Limits:</p>
                  <div className="flex gap-2 text-xs">
                    <Badge variant="outline">{key.rate_limits?.requests_per_minute}/min</Badge>
                    <Badge variant="outline">{key.rate_limits?.requests_per_hour}/hour</Badge>
                    <Badge variant="outline">{key.rate_limits?.requests_per_day}/day</Badge>
                  </div>
                </div>

                {key.last_used_date && (
                  <p className="text-xs text-gray-500 mt-2">
                    Last used: {new Date(key.last_used_date).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Key Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New API Key</DialogTitle>
            <DialogDescription>
              Generate a new API key for {packageInfo.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="keyName">Key Name</Label>
              <Input
                id="keyName"
                placeholder="e.g., Production API Key"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="environment">Environment</Label>
              <Select value={environment} onValueChange={setEnvironment}>
                <SelectTrigger id="environment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> Your secret key will only be shown once. Make sure to save it securely.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateKey}
              disabled={createKeyMutation.isPending}
              className="bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              Generate Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Key Created Dialog */}
      <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-6 h-6" />
              <DialogTitle>API Key Created!</DialogTitle>
            </div>
            <DialogDescription>
              Save these credentials securely. The secret key won't be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="flex gap-2">
                <Input value={newKeyData?.api_key || ''} readOnly className="font-mono text-sm" />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => copyToClipboard(newKeyData?.api_key, 'new-api')}
                >
                  {copiedKey === 'new-api' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Secret Key</Label>
              <div className="flex gap-2">
                <Input value={newKeyData?.secret_key || ''} readOnly className="font-mono text-sm" />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => copyToClipboard(newKeyData?.secret_key, 'new-secret')}
                >
                  {copiedKey === 'new-secret' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-900">
                  <strong>Important:</strong> This is the only time you'll see the secret key. Store it securely!
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowNewKeyDialog(false)} className="w-full">
              I've Saved My Keys
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingKeyId} onOpenChange={(open) => !open && setDeletingKeyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Applications using this key will immediately lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingKeyId && deleteKeyMutation.mutate(deletingKeyId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
