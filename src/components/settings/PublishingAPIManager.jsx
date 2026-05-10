import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/apis/client";
import { useToast } from "@/components/ui/use-toast";
import { Copy, Eye, EyeOff, Trash2, Plus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function PublishingAPIManager({ currentUser }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);
  const [visibleKeys, setVisibleKeys] = useState({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ['publishing-api-keys', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      const allKeys = await apiClient.entities.PublishingAPIKey.list();
      return allKeys.filter(k => k.user_email === currentUser.email);
    },
    enabled: !!currentUser?.email,
  });

  const createKeyMutation = useMutation({
    mutationFn: async (keyData) => {
      const newKey = await apiClient.entities.PublishingAPIKey.create(keyData);
      return newKey;
    },
    onSuccess: (newKey) => {
      queryClient.invalidateQueries(['publishing-api-keys']);
      setShowCreateDialog(false);
      setKeyName('');
      
      toast({
        title: "API Key Created",
        description: "Your new API key has been created. Copy it now—you won't see it again!",
        duration: 5000,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create API key: ${error.message}`,
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (keyId) => {
      await apiClient.entities.PublishingAPIKey.delete(keyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['publishing-api-keys']);
      toast({
        title: "API Key Deleted",
        description: "The API key has been removed.",
        duration: 3000,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete API key: ${error.message}`,
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  const generateApiKey = () => {
    if (!keyName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your API key",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Generate a random API key
    const randomKey = `pk_${Math.random().toString(36).substr(2, 32)}`;
    
    createKeyMutation.mutate({
      user_email: currentUser.email,
      label: keyName.trim(),
      api_key_masked: randomKey.substring(0, 10) + '...' + randomKey.substring(randomKey.length - 4),
      api_key: randomKey,
    });
  };

  const copyToClipboard = (text, keyId) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
    toast({
      title: "Copied!",
      description: "API key copied to clipboard",
      duration: 2000,
    });
  };

  const toggleKeyVisibility = (keyId) => {
    setVisibleKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-600" />
                Publishing API Keys
              </CardTitle>
              <CardDescription>Create and manage API keys for publishing integrations</CardDescription>
            </div>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Key
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-gray-600 font-medium mb-2">No API keys yet</p>
              <p className="text-sm text-gray-500 mb-6">Create your first API key to get started</p>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                variant="outline"
              >
                Create API Key
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div key={key.id} className="p-4 border rounded-lg hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold truncate">{key.label}</p>
                        {key.is_active !== false && (
                          <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 bg-gray-100 rounded px-3 py-2">
                        <span className="font-mono text-sm text-gray-600 flex-1 truncate">
                          {visibleKeys[key.id] ? key.api_key : key.api_key_masked}
                        </span>
                        <button
                          onClick={() => toggleKeyVisibility(key.id)}
                          className="text-gray-500 hover:text-gray-700 transition p-1"
                        >
                          {visibleKeys[key.id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <p className="text-xs text-gray-500 mt-2">
                        Created: {key.created_date ? new Date(key.created_date).toLocaleDateString() : 'N/A'}
                      </p>
                      {key.last_used && (
                        <p className="text-xs text-gray-500">
                          Last used: {new Date(key.last_used).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(key.api_key, key.id)}
                        className={copiedKey === key.id ? 'bg-green-50' : ''}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (window.confirm('Are you sure? This cannot be undone.')) {
                            deleteKeyMutation.mutate(key.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">API Endpoints & Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-semibold mb-2">Base URL:</p>
            <div className="bg-white rounded p-3 font-mono text-xs border">
              https://prompt.only-agent.ai/api/apps/YOUR_APP_ID/functions/apiContentHistory
            </div>
          </div>

          <div>
            <p className="font-semibold mb-2">Authentication:</p>
            <div className="bg-white rounded p-3 font-mono text-xs border">
              x-api-key: your_api_key_here
            </div>
          </div>

          <div>
            <p className="font-semibold mb-2">Example - API Request:</p>
            <div className="bg-slate-900 text-green-400 rounded p-3 font-mono text-xs overflow-x-auto">
              {`curl -X GET https://prompt.only-agent.ai/api/apps/YOUR_APP_ID/functions/apiContentHistory \\
  -H "x-api-key: pk_your_key" \\
  -H "Content-Type: application/json"`}
            </div>
          </div>

          <div>
            <p className="font-semibold mb-2">Example - Create Content:</p>
            <div className="bg-slate-900 text-green-400 rounded p-3 font-mono text-xs overflow-x-auto">
              {`curl -X POST https://prompt.only-agent.ai/api/apps/YOUR_APP_ID/functions/apiContentHistory \\
  -H "x-api-key: pk_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "My Content", "content": "..."}'`}
            </div>
          </div>

          <p className="text-gray-700 pt-2">
            <strong>Security:</strong> Keep your API key secure. Never share it or commit it to version control. If compromised, delete it and create a new one.
          </p>

          <p className="text-gray-700">
            View full documentation at <a href="/APIDocumentation" className="text-blue-600 underline">API Documentation</a>
          </p>
        </CardContent>
      </Card>

      {/* Create API Key Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New API Key</DialogTitle>
            <DialogDescription>
              Generate a new API key for publishing integrations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="keyName">Key Name</Label>
              <Input
                id="keyName"
                placeholder="e.g., Production API, Development, Mobile App"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-gray-500">
                Give your key a descriptive name to identify it later
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setKeyName('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={generateApiKey}
              disabled={createKeyMutation.isPending || !keyName.trim()}
              className="bg-gradient-to-r from-purple-600 to-indigo-600"
            >
              {createKeyMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Key'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
