import React, { useState } from 'react';
import { apiClient } from '@/apis/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, Edit, Globe, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function APIConfigurationManager({ currentUserEmail }) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_url: '',
    auth_type: 'none',
    auth_config: {
      api_key_header: 'X-API-Key',
      api_key_encrypted: ''
    }
  });

  const queryClient = useQueryClient();

  const { data: apiConfigs = [] } = useQuery({
    queryKey: ['apiConfigurations', currentUserEmail],
    queryFn: () => apiClient.entities.APIConfiguration.list('-updated_date'),
    enabled: !!currentUserEmail,
  });

  const createConfigMutation = useMutation({
    mutationFn: (data) => apiClient.entities.APIConfiguration.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['apiConfigurations']);
      setShowAddDialog(false);
      resetForm();
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.entities.APIConfiguration.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['apiConfigurations']);
      setShowAddDialog(false);
      setEditingConfig(null);
      resetForm();
    },
  });

  const deleteConfigMutation = useMutation({
    mutationFn: (id) => apiClient.entities.APIConfiguration.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['apiConfigurations']);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      base_url: '',
      auth_type: 'none',
      auth_config: {
        api_key_header: 'X-API-Key',
        api_key_encrypted: ''
      }
    });
  };

  const handleEdit = (config) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      description: config.description || '',
      base_url: config.base_url,
      auth_type: config.auth_type,
      auth_config: config.auth_config || {}
    });
    setShowAddDialog(true);
  };

  const handleSave = () => {
    if (editingConfig) {
      updateConfigMutation.mutate({ id: editingConfig.id, data: formData });
    } else {
      createConfigMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">API Configurations</h3>
          <p className="text-sm text-gray-600">Configure external APIs for use in workflows</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add API
        </Button>
      </div>

      <div className="grid gap-4">
        <AnimatePresence>
          {apiConfigs.map((config) => (
            <motion.div
              key={config.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-l-4 border-l-green-400">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="w-4 h-4 text-green-600" />
                        <h4 className="font-semibold text-gray-900">{config.name}</h4>
                        <Badge variant={config.is_active ? "default" : "secondary"}>
                          {config.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {config.auth_type !== 'none' && (
                          <Badge className="bg-blue-100 text-blue-700">
                            <Lock className="w-3 h-3 mr-1" />
                            {config.auth_type}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{config.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <code className="bg-gray-100 px-2 py-1 rounded">{config.base_url}</code>
                        {config.use_count > 0 && (
                          <span>• Used {config.use_count}×</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(config)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm('Delete this API configuration?')) {
                            deleteConfigMutation.mutate(config.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {apiConfigs.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Globe className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-600 mb-4">No API configurations yet</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First API
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open);
        if (!open) {
          setEditingConfig(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingConfig ? 'Edit' : 'Add'} API Configuration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                Configure external APIs to fetch data and use in your AI workflows.
              </AlertDescription>
            </Alert>

            <div>
              <Label>API Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Weather API"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What does this API do?"
              />
            </div>

            <div>
              <Label>Base URL</Label>
              <Input
                value={formData.base_url}
                onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                placeholder="https://api.example.com"
                className="font-mono"
              />
            </div>

            <div>
              <Label>Authentication Type</Label>
              <Select
                value={formData.auth_type}
                onValueChange={(value) => setFormData({ ...formData, auth_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="api_key">API Key</SelectItem>
                  <SelectItem value="bearer_token">Bearer Token</SelectItem>
                  <SelectItem value="basic_auth">Basic Auth</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.auth_type === 'api_key' && (
              <>
                <div>
                  <Label>API Key Header Name</Label>
                  <Input
                    value={formData.auth_config.api_key_header}
                    onChange={(e) => setFormData({
                      ...formData,
                      auth_config: { ...formData.auth_config, api_key_header: e.target.value }
                    })}
                    placeholder="X-API-Key"
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    value={formData.auth_config.api_key_encrypted}
                    onChange={(e) => setFormData({
                      ...formData,
                      auth_config: { ...formData.auth_config, api_key_encrypted: e.target.value }
                    })}
                    placeholder="Your API key"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    <Lock className="w-3 h-3 inline mr-1" />
                    Stored securely
                  </p>
                </div>
              </>
            )}

            {formData.auth_type === 'bearer_token' && (
              <div>
                <Label>Bearer Token</Label>
                <Input
                  type="password"
                  value={formData.auth_config.api_key_encrypted}
                  onChange={(e) => setFormData({
                    ...formData,
                    auth_config: { ...formData.auth_config, api_key_encrypted: e.target.value }
                  })}
                  placeholder="Your bearer token"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  setEditingConfig(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formData.name || !formData.base_url}
              >
                {editingConfig ? 'Update' : 'Create'} Configuration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
