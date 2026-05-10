import React, { useState } from "react";
import { apiClient } from "@/apis/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Zap,
  Plus,
  Play,
  Star,
  TrendingUp,
  Settings as SettingsIcon,
  Copy,
  Trash2,
  Edit,
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
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

export default function CustomAgentManager({ subscription, packageInfo, userEmail, customVersions }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingVersion, setEditingVersion] = useState(null);
  const [deletingVersionId, setDeletingVersionId] = useState(null);
  const [versionName, setVersionName] = useState("");
  const [description, setDescription] = useState("");
  const [config, setConfig] = useState({
    system_prompt: "",
    temperature: 0.7,
    max_tokens: 2048,
    top_p: 0.9,
    frequency_penalty: 0,
    presence_penalty: 0,
    custom_instructions: ""
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createVersionMutation = useMutation({
    mutationFn: (data) => apiClient.entities.CustomAgentVersion.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['custom-agent-versions']);
      resetForm();
      setShowCreateDialog(false);
      toast({
        title: "Custom Version Created!",
        description: "Your custom agent version is ready to use.",
      });
    },
  });

  const updateVersionMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.entities.CustomAgentVersion.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['custom-agent-versions']);
      resetForm();
      setShowCreateDialog(false);
      setEditingVersion(null);
      toast({
        title: "Version Updated!",
        description: "Your custom agent version has been updated.",
      });
    },
  });

  const deleteVersionMutation = useMutation({
    mutationFn: (id) => apiClient.entities.CustomAgentVersion.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['custom-agent-versions']);
      setDeletingVersionId(null);
      toast({
        title: "Version Deleted",
        description: "The custom agent version has been removed.",
      });
    },
  });

  const setAsDefaultMutation = useMutation({
    mutationFn: async (versionId) => {
      // First, unset all other defaults
      const currentDefaults = customVersions.filter(v => v.is_default);
      for (const version of currentDefaults) {
        await apiClient.entities.CustomAgentVersion.update(version.id, { is_default: false });
      }
      // Then set the new default
      await apiClient.entities.CustomAgentVersion.update(versionId, { is_default: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['custom-agent-versions']);
      toast({
        title: "Default Version Set",
        description: "This version is now your default agent.",
      });
    },
  });

  const handleEdit = (version) => {
    setEditingVersion(version);
    setVersionName(version.version_name);
    setDescription(version.description || "");
    setConfig(version.custom_config || config);
    setShowCreateDialog(true);
  };

  const handleSave = () => {
    if (!versionName) {
      toast({
        title: "Missing Information",
        description: "Please provide a name for this version.",
        variant: "destructive"
      });
      return;
    }

    const data = {
      user_email: userEmail,
      subscription_id: subscription.id,
      package_id: packageInfo.id,
      package_name: packageInfo.name,
      version_name: versionName,
      description: description,
      is_trained: false,
      custom_config: config,
      deployment_status: 'deployed',
      is_active: true,
      performance_metrics: {
        usage_count: 0
      }
    };

    if (editingVersion) {
      updateVersionMutation.mutate({ id: editingVersion.id, data });
    } else {
      createVersionMutation.mutate(data);
    }
  };

  const resetForm = () => {
    setVersionName("");
    setDescription("");
    setConfig({
      system_prompt: "",
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 0.9,
      frequency_penalty: 0,
      presence_penalty: 0,
      custom_instructions: ""
    });
  };

  const activeVersions = customVersions.filter(v => v.is_active);
  const defaultVersion = customVersions.find(v => v.is_default);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Custom Agent Versions</h3>
          <p className="text-sm text-gray-600">Create and manage custom configurations for {packageInfo.name}</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setEditingVersion(null);
            setShowCreateDialog(true);
          }}
          className="bg-gradient-to-r from-purple-600 to-indigo-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Version
        </Button>
      </div>

      {/* Custom Versions List */}
      {activeVersions.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            <Zap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm mb-2">No custom versions yet</p>
            <p className="text-xs text-gray-500 mb-4">
              Create custom configurations to tailor the agent to your needs
            </p>
            <Button onClick={() => setShowCreateDialog(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Version
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeVersions.map((version) => (
            <Card key={version.id} className="border-2 hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {version.version_name}
                      {version.is_default && (
                        <Badge className="bg-green-600">Default</Badge>
                      )}
                      {version.is_trained && (
                        <Badge className="bg-purple-600">Trained</Badge>
                      )}
                    </CardTitle>
                    {version.description && (
                      <CardDescription className="mt-1">{version.description}</CardDescription>
                    )}
                  </div>
                  <Badge className={
                    version.deployment_status === 'deployed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }>
                    {version.deployment_status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Performance Metrics */}
                {version.performance_metrics && (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Usage Count</p>
                      <p className="font-semibold text-lg">
                        {version.performance_metrics.usage_count || 0}
                      </p>
                    </div>
                    {version.performance_metrics.quality_score && (
                      <div>
                        <p className="text-gray-600">Quality Score</p>
                        <p className="font-semibold text-lg">
                          {version.performance_metrics.quality_score.toFixed(1)}/10
                        </p>
                      </div>
                    )}
                    {version.performance_metrics.user_rating && (
                      <div>
                        <p className="text-gray-600">User Rating</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <p className="font-semibold">
                            {version.performance_metrics.user_rating.toFixed(1)}
                          </p>
                        </div>
                      </div>
                    )}
                    {version.performance_metrics.response_time_ms && (
                      <div>
                        <p className="text-gray-600">Avg Response</p>
                        <p className="font-semibold">
                          {version.performance_metrics.response_time_ms}ms
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Configuration Preview */}
                {version.custom_config && (
                  <div className="pt-3 border-t space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Temperature:</span>
                      <Badge variant="outline">{version.custom_config.temperature}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Tokens:</span>
                      <Badge variant="outline">{version.custom_config.max_tokens}</Badge>
                    </div>
                  </div>
                )}

                {version.tags && version.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2">
                    {version.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex gap-2">
                <Button size="sm" className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600">
                  <Play className="w-4 h-4 mr-2" />
                  Use
                </Button>
                {!version.is_default && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAsDefaultMutation.mutate(version.id)}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Set Default
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(version)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600"
                  onClick={() => setDeletingVersionId(version.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingVersion ? 'Edit Custom Version' : 'Create Custom Version'}
            </DialogTitle>
            <DialogDescription>
              Configure custom parameters for {packageInfo.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="version-name">Version Name *</Label>
              <Input
                id="version-name"
                placeholder="e.g., Customer Support Optimized"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what makes this version unique..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold flex items-center gap-2">
                <SettingsIcon className="w-4 h-4" />
                Configuration Parameters
              </h4>

              <div className="space-y-2">
                <Label>System Prompt</Label>
                <Textarea
                  placeholder="Define the agent's behavior and personality..."
                  value={config.system_prompt}
                  onChange={(e) => setConfig(prev => ({ ...prev, system_prompt: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Temperature</Label>
                  <span className="text-sm font-mono text-gray-600">{config.temperature}</span>
                </div>
                <Slider
                  value={[config.temperature * 100]}
                  onValueChange={([value]) => setConfig(prev => ({ ...prev, temperature: value / 100 }))}
                  min={0}
                  max={200}
                  step={1}
                />
                <p className="text-xs text-gray-500">Controls randomness: 0 = deterministic, 2 = very creative</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Max Tokens</Label>
                  <span className="text-sm font-mono text-gray-600">{config.max_tokens}</span>
                </div>
                <Slider
                  value={[config.max_tokens]}
                  onValueChange={([value]) => setConfig(prev => ({ ...prev, max_tokens: value }))}
                  min={256}
                  max={4096}
                  step={256}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Top P</Label>
                  <span className="text-sm font-mono text-gray-600">{config.top_p}</span>
                </div>
                <Slider
                  value={[config.top_p * 100]}
                  onValueChange={([value]) => setConfig(prev => ({ ...prev, top_p: value / 100 }))}
                  min={0}
                  max={100}
                  step={1}
                />
                <p className="text-xs text-gray-500">Nucleus sampling threshold</p>
              </div>

              <div className="space-y-2">
                <Label>Custom Instructions</Label>
                <Textarea
                  placeholder="Additional instructions or constraints..."
                  value={config.custom_instructions}
                  onChange={(e) => setConfig(prev => ({ ...prev, custom_instructions: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                resetForm();
                setEditingVersion(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createVersionMutation.isPending || updateVersionMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-indigo-600"
            >
              {editingVersion ? 'Update Version' : 'Create Version'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingVersionId} onOpenChange={(open) => !open && setDeletingVersionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Custom Version?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this custom agent version.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingVersionId && deleteVersionMutation.mutate(deletingVersionId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Version
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
