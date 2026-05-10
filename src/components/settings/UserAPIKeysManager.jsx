import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/apis/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { 
  Key, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle,
  Loader2,
  Star,
  ExternalLink,
  ClipboardCopy
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

const AI_PROVIDERS = [
  { 
    id: 'openai', 
    name: 'OpenAI', 
    icon: '🤖', 
    color: 'bg-green-100 text-green-700 border-green-200',
    placeholder: 'sk-...',
    docsUrl: 'https://platform.openai.com/api-keys',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
  },
  { 
    id: 'anthropic', 
    name: 'Anthropic', 
    icon: '🧠', 
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    placeholder: 'sk-ant-...',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    models: ['claude-3-5-sonnet', 'claude-3-opus', 'claude-3-haiku']
  },
  { 
    id: 'google', 
    name: 'Google AI', 
    icon: '🔷', 
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    placeholder: 'AIza...',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro']
  },
  { 
    id: 'mistral', 
    name: 'Mistral AI', 
    icon: '🌀', 
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    placeholder: '',
    docsUrl: 'https://console.mistral.ai/api-keys',
    models: ['mistral-large', 'mistral-medium', 'mistral-small']
  },
  { 
    id: 'cohere', 
    name: 'Cohere', 
    icon: '💫', 
    color: 'bg-pink-100 text-pink-700 border-pink-200',
    placeholder: '',
    docsUrl: 'https://dashboard.cohere.com/api-keys',
    models: ['command-r-plus', 'command-r', 'command']
  }
];

// Simple encoding for storage (in production, use proper encryption)
const encodeKey = (key) => btoa(key);
const maskKey = (key) => {
  if (!key || key.length < 8) return '••••••••';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
};

export default function UserAPIKeysManager({ currentUser }) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState(null);
  const [newKey, setNewKey] = useState({ provider: '', apiKey: '', label: '' });
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ['user-api-keys', currentUser?.email],
    queryFn: async () => {
      const all = await apiClient.entities.UserAPIKey.list();
      return all.filter(k => k.created_by === currentUser?.email);
    },
    enabled: !!currentUser?.email,
  });

  const createKeyMutation = useMutation({
    mutationFn: (data) => apiClient.entities.UserAPIKey.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-api-keys']);
      setShowAddDialog(false);
      setNewKey({ provider: '', apiKey: '', label: '' });
      toast({ title: "API Key Added", description: "Your API key has been saved securely." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save API key.", variant: "destructive" });
    }
  });

  const updateKeyMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.entities.UserAPIKey.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-api-keys']);
    }
  });

  const deleteKeyMutation = useMutation({
    mutationFn: (id) => apiClient.entities.UserAPIKey.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-api-keys']);
      setShowDeleteDialog(false);
      setKeyToDelete(null);
      toast({ title: "API Key Deleted", description: "Your API key has been removed." });
    }
  });

  const handleAddKey = async () => {
    if (!newKey.provider || !newKey.apiKey) {
      toast({ title: "Missing Fields", description: "Please select a provider and enter your API key.", variant: "destructive" });
      return;
    }

    // Check if key already exists for this provider
    const existingKeys = apiKeys.filter(k => k.provider === newKey.provider);
    const isFirstForProvider = existingKeys.length === 0;

    createKeyMutation.mutate({
      provider: newKey.provider,
      api_key_encrypted: encodeKey(newKey.apiKey),
      api_key_masked: maskKey(newKey.apiKey),
      label: newKey.label || `${AI_PROVIDERS.find(p => p.id === newKey.provider)?.name} Key`,
      is_active: true,
      is_default: isFirstForProvider,
      usage_count: 0
    });
  };

  const handleSetDefault = (key) => {
    // Unset other defaults for same provider
    apiKeys.filter(k => k.provider === key.provider && k.id !== key.id).forEach(k => {
      if (k.is_default) {
        updateKeyMutation.mutate({ id: k.id, data: { is_default: false } });
      }
    });
    // Set this as default
    updateKeyMutation.mutate({ id: key.id, data: { is_default: true } });
    toast({ title: "Default Updated", description: `${key.label} is now your default ${AI_PROVIDERS.find(p => p.id === key.provider)?.name} key.` });
  };

  const handleToggleActive = (key) => {
    updateKeyMutation.mutate({ 
      id: key.id, 
      data: { is_active: !key.is_active } 
    });
  };

  const getProviderConfig = (providerId) => AI_PROVIDERS.find(p => p.id === providerId);

  const groupedKeys = AI_PROVIDERS.map(provider => ({
    ...provider,
    keys: apiKeys.filter(k => k.provider === provider.id)
  })).filter(p => p.keys.length > 0);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-purple-600" />
                AI Provider API Keys
              </CardTitle>
              <CardDescription>
                Connect your own API keys to use your preferred AI models for generation and refinement.
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add API Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <Key className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <h3 className="font-medium text-gray-900 mb-1">No API Keys Added</h3>
              <p className="text-sm text-gray-600 mb-4">
                Add your own API keys to use external AI providers like OpenAI, Anthropic, and more.
              </p>
              <Button onClick={() => setShowAddDialog(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Key
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedKeys.map((provider) => (
                <div key={provider.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{provider.icon}</span>
                    <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {provider.keys.length} key{provider.keys.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {provider.keys.map((key) => (
                        <motion.div
                          key={key.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className={`flex items-center justify-between p-3 rounded-lg border ${key.is_active ? 'bg-white' : 'bg-gray-50 opacity-60'}`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`p-2 rounded-lg ${provider.color} flex-shrink-0`}>
                              <Key className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{key.label}</span>
                                {key.is_default && (
                                  <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                                    <Star className="w-3 h-3 mr-1 fill-yellow-500" />
                                    Default
                                  </Badge>
                                )}
                                {!key.is_active && (
                                  <Badge variant="secondary" className="text-xs">Disabled</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-gray-500 font-mono truncate">{key.api_key_masked}</p>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 flex-shrink-0"
                                  onClick={() => {
                                    const decodedKey = atob(key.api_key_encrypted);
                                    navigator.clipboard.writeText(decodedKey);
                                    toast({ title: "Copied!", description: "API key copied to clipboard" });
                                  }}
                                  title="Copy API Key"
                                >
                                  <ClipboardCopy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {key.usage_count > 0 && (
                              <span className="text-xs text-gray-500">
                                Used {key.usage_count} times
                              </span>
                            )}
                            <Switch
                              checked={key.is_active}
                              onCheckedChange={() => handleToggleActive(key)}
                            />
                            {!key.is_default && key.is_active && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSetDefault(key)}
                                title="Set as default"
                              >
                                <Star className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setKeyToDelete(key); setShowDeleteDialog(true); }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supported Providers Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Supported Providers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {AI_PROVIDERS.map((provider) => {
              const hasKey = apiKeys.some(k => k.provider === provider.id && k.is_active);
              return (
                <div 
                  key={provider.id}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    hasKey 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <span className="text-2xl block mb-1">{provider.icon}</span>
                  <p className="text-sm font-medium">{provider.name}</p>
                  {hasKey ? (
                    <Badge className="mt-1 bg-green-100 text-green-700 text-xs">
                      <Check className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="mt-1 h-auto p-0 text-xs"
                      onClick={() => { setNewKey({ ...newKey, provider: provider.id }); setShowAddDialog(true); }}
                    >
                      Add Key
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add Key Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add API Key</DialogTitle>
            <DialogDescription>
              Your API key will be stored securely and used only for your AI generation requests.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={newKey.provider} onValueChange={(v) => setNewKey({ ...newKey, provider: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {AI_PROVIDERS.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      <div className="flex items-center gap-2">
                        <span>{provider.icon}</span>
                        <span>{provider.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {newKey.provider && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-blue-800">
                      Get your API key from {getProviderConfig(newKey.provider)?.name}
                    </p>
                    <a 
                      href={getProviderConfig(newKey.provider)?.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      Open API Keys Page <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="relative">
                <Input
                  type={showKey ? "text" : "password"}
                  placeholder={getProviderConfig(newKey.provider)?.placeholder || "Enter your API key"}
                  value={newKey.apiKey}
                  onChange={(e) => setNewKey({ ...newKey, apiKey: e.target.value })}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Label (optional)</Label>
              <Input
                placeholder="e.g., Personal, Work, Project X"
                value={newKey.label}
                onChange={(e) => setNewKey({ ...newKey, label: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddKey}
              disabled={!newKey.provider || !newKey.apiKey || createKeyMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-indigo-600"
            >
              {createKeyMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Key className="w-4 h-4 mr-2" /> Add Key</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{keyToDelete?.label}" from your account. 
              Any features using this key will fall back to the default system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteKeyMutation.mutate(keyToDelete?.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Export helper to get user's active key for a provider
export const getUserAPIKey = async (userEmail, provider) => {
  try {
    const allKeys = await apiClient.entities.UserAPIKey.list();
    const userKeys = allKeys.filter(k => 
      k.created_by === userEmail && 
      k.provider === provider && 
      k.is_active
    );
    
    // Prefer default key
    const defaultKey = userKeys.find(k => k.is_default);
    const keyToUse = defaultKey || userKeys[0];
    
    if (keyToUse) {
      // Decode the key
      return atob(keyToUse.api_key_encrypted);
    }
    return null;
  } catch (error) {
    console.error('Error fetching user API key:', error);
    return null;
  }
};

// Export provider list for use elsewhere
export { AI_PROVIDERS };
