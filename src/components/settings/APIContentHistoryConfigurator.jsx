import React, { useState, useEffect } from 'react';
import { apiClient } from '@/apis/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Settings, Save, RotateCcw, Loader } from "lucide-react";

const defaultConfig = {
  pagination_limit: 100,
  tool_type_filter: "all",
  sort_by: "created_date",
  sort_order: "descending",
  status_filter: "all",
  include_archived: false
};

export default function APIContentHistoryConfigurator({ currentUser }) {
  const [config, setConfig] = useState(defaultConfig);
  const [isModified, setIsModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadSettings = async () => {
      if (!currentUser?.email) return;
      
      try {
        const settings = await apiClient.entities.APISettings.filter({
          user_email: currentUser.email
        });
        
        if (settings && settings.length > 0) {
          setConfig(settings[0]);
        }
      } catch (error) {
        console.error('Failed to load API settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [currentUser]);

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
    setIsModified(true);
  };

  const saveConfig = async () => {
    if (!currentUser?.email) return;
    
    setIsSaving(true);
    try {
      const settingsData = {
        user_email: currentUser.email,
        pagination_limit: config.pagination_limit,
        tool_type_filter: config.tool_type_filter,
        status_filter: config.status_filter,
        sort_by: config.sort_by,
        sort_order: config.sort_order,
        include_archived: config.include_archived
      };

      const existingSettings = await apiClient.entities.APISettings.filter({
        user_email: currentUser.email
      });

      if (existingSettings && existingSettings.length > 0) {
        const settingId = existingSettings[0].id;
        await apiClient.entities.APISettings.update(settingId, settingsData);
        console.log('Updated APISettings:', settingId);
      } else {
        const created = await apiClient.entities.APISettings.create(settingsData);
        console.log('Created APISettings:', created);
      }

      setIsModified(false);
      toast({
        title: "Configuration Saved",
        description: "Your API ContentHistory settings have been saved successfully.",
        duration: 3000,
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: "Failed to save settings: " + error.message,
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetConfig = async () => {
    if (!currentUser?.email) return;

    setIsSaving(true);
    try {
      const resetData = {
        user_email: currentUser.email,
        ...defaultConfig
      };

      const existingSettings = await apiClient.entities.APISettings.filter({
        user_email: currentUser.email
      });

      if (existingSettings && existingSettings.length > 0) {
        await apiClient.entities.APISettings.update(existingSettings[0].id, resetData);
        console.log('Reset APISettings:', existingSettings[0].id);
      } else {
        const created = await apiClient.entities.APISettings.create(resetData);
        console.log('Created APISettings on reset:', created);
      }

      setConfig(defaultConfig);
      setIsModified(false);
      toast({
        title: "Configuration Reset",
        description: "Settings have been reset to defaults.",
        duration: 3000,
      });
    } catch (error) {
      console.error('Reset error:', error);
      toast({
        title: "Error",
        description: "Failed to reset settings: " + error.message,
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader className="w-5 h-5 animate-spin text-purple-600 mr-2" />
          <p className="text-gray-600">Loading settings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-600" />
          ContentHistory API Filtering
        </CardTitle>
        <CardDescription>Configure default filtering options for the ContentHistory API endpoint</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pagination Limit */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-base font-semibold">
              Pagination Limit
            </Label>
            <Badge variant="outline">{config.pagination_limit} items</Badge>
          </div>
          <p className="text-sm text-gray-600">
            Maximum number of records returned per API request (affects query performance)
          </p>
          <Slider
            min={10}
            max={500}
            step={10}
            value={[config.pagination_limit]}
            onValueChange={([value]) => handleConfigChange('pagination_limit', value)}
            className="w-full"
          />
          <p className="text-xs text-gray-500">Recommended: 50-100 for optimal performance</p>
        </div>

        {/* Tool Type Filter */}
        <div className="space-y-2 border-t pt-4">
          <Label className="text-base font-semibold">Tool Type Filter</Label>
          <p className="text-sm text-gray-600">
            Filter API results by the tool that generated the content
          </p>
          <Select value={config.tool_type_filter} onValueChange={(value) => handleConfigChange('tool_type_filter', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tools</SelectItem>
              <SelectItem value="ai_content_generator">AI Content Generator</SelectItem>
              <SelectItem value="advanced_ai">Advanced AI</SelectItem>
              <SelectItem value="voice_template_variation">Voice Template Variation</SelectItem>
              <SelectItem value="beam_chat">Beam Chat</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-2 border-t pt-4">
          <Label className="text-base font-semibold">Status Filter</Label>
          <p className="text-sm text-gray-600">
            Include only content items with specific status
          </p>
          <Select value={config.status_filter} onValueChange={(value) => handleConfigChange('status_filter', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort Options */}
        <div className="space-y-2 border-t pt-4">
          <Label className="text-base font-semibold">Sort By</Label>
          <p className="text-sm text-gray-600">
            Field to sort API results
          </p>
          <Select value={config.sort_by} onValueChange={(value) => handleConfigChange('sort_by', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_date">Created Date</SelectItem>
              <SelectItem value="updated_date">Updated Date</SelectItem>
              <SelectItem value="use_count">Usage Count</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-base font-semibold">Sort Order</Label>
          <Select value={config.sort_order} onValueChange={(value) => handleConfigChange('sort_order', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ascending">Ascending (A-Z, Oldest First)</SelectItem>
              <SelectItem value="descending">Descending (Z-A, Newest First)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Include Archived */}
        <div className="space-y-2 border-t pt-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <Label className="font-semibold">Include Archived Content</Label>
              <p className="text-xs text-gray-500 mt-1">Include archived items in API results</p>
            </div>
            <div>
              <input
                type="checkbox"
                checked={config.include_archived}
                onChange={(e) => handleConfigChange('include_archived', e.target.checked)}
                className="w-4 h-4"
              />
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
          <p className="text-sm font-semibold text-blue-900">ℹ️ How These Settings Are Used</p>
          <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
            <li>Applied automatically to all requests to the ContentHistory API endpoint</li>
            <li>Can be overridden per request by passing query parameters</li>
            <li>Pagination limit affects database query performance</li>
            <li>Filters help reduce API response size and improve load times</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="border-t pt-4 flex gap-3">
          <Button
            onClick={saveConfig}
            disabled={!isModified || isSaving}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            {isSaving ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
          <Button
            onClick={resetConfig}
            disabled={isSaving}
            variant="outline"
          >
            {isSaving ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset to Defaults
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
