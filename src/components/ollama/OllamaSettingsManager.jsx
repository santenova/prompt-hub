import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Check, X, Settings, Zap, RefreshCw, ClipboardCopy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getOllamaSettings, saveOllamaSettings } from "../../components/utils/ollamaSettings";
import { apiClient } from "@/apis/client";

export default function OllamaSettingsManager() {
  const { toast } = useToast();
  const [settings, setSettings] = useState(null);
  const [endpoints, setEndpoints] = useState([]);
  const [newEndpoint, setNewEndpoint] = useState('');
  const [testingEndpoint, setTestingEndpoint] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const savedSettings = getOllamaSettings();
    setSettings(savedSettings);
    setEndpoints(savedSettings.endpoints || []);
    if (savedSettings.selectedEndpoint) {
      loadModelsForEndpoint(savedSettings.selectedEndpoint);
    }
  };

  const loadModelsForEndpoint = async (endpoint) => {
    setLoadingModels(true);
    try {
      const { data } = await apiClient.functions.invoke('ollamaProxy', { endpoint, action: 'list-models' });
      setAvailableModels((data.models || []).map(m => ({ name: m.id })));
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleAddEndpoint = async () => {
    if (!newEndpoint.trim()) return;

    const formattedEndpoint = newEndpoint.startsWith('http') 
      ? newEndpoint.trim() 
      : `http://${newEndpoint.trim()}`;

    // Test endpoint
    setTestingEndpoint(formattedEndpoint);
    try {
      const { data: testData } = await apiClient.functions.invoke('ollamaProxy', { endpoint: formattedEndpoint, action: 'test-connection' });

      if (testData.success) {
        const updatedEndpoints = [...endpoints, formattedEndpoint];
        setEndpoints(updatedEndpoints);
        
        const updatedSettings = {
          ...settings,
          endpoints: updatedEndpoints,
          selectedEndpoint: settings.selectedEndpoint || formattedEndpoint
        };
        saveOllamaSettings(updatedSettings);
        setSettings(updatedSettings);
        
        setNewEndpoint('');
        toast({
          title: "Success",
          description: "Ollama endpoint added successfully"
        });

        if (!settings.selectedEndpoint) {
          loadModelsForEndpoint(formattedEndpoint);
        }
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Could not connect to Ollama endpoint",
        variant: "destructive"
      });
    } finally {
      setTestingEndpoint(null);
    }
  };

  const handleRemoveEndpoint = (endpoint) => {
    const updatedEndpoints = endpoints.filter(e => e !== endpoint);
    const updatedSettings = {
      ...settings,
      endpoints: updatedEndpoints,
      selectedEndpoint: updatedEndpoints[0] || ''
    };
    saveOllamaSettings(updatedSettings);
    setEndpoints(updatedEndpoints);
    setSettings(updatedSettings);
    
    if (updatedSettings.selectedEndpoint) {
      loadModelsForEndpoint(updatedSettings.selectedEndpoint);
    }
  };

  const updateSetting = (key, value) => {
    const updatedSettings = { ...settings, [key]: value };
    saveOllamaSettings(updatedSettings);
    setSettings(updatedSettings);

    if (key === 'selectedEndpoint') {
      loadModelsForEndpoint(value);
    }
  };

  if (!settings) return null;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="connection" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Ollama Endpoints
              </CardTitle>
              <CardDescription>
                Configure your Ollama server endpoints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Endpoint */}
              <div className="flex gap-2">
                <Input
                  placeholder="http://localhost:11434 or ngrok URL"
                  value={newEndpoint}
                  onChange={(e) => setNewEndpoint(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddEndpoint()}
                />
                <Button 
                  onClick={handleAddEndpoint}
                  disabled={!newEndpoint.trim() || testingEndpoint}
                >
                  {testingEndpoint ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                </Button>
              </div>

              {/* Endpoints List */}
              <div className="space-y-2">
                {endpoints.map((endpoint) => (
                  <div 
                    key={endpoint}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Badge variant={settings.selectedEndpoint === endpoint ? "default" : "outline"} className="truncate max-w-[200px]">
                        {endpoint}
                      </Badge>
                      {settings.selectedEndpoint === endpoint && (
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(endpoint);
                          toast({ title: "Copied!", description: "Endpoint copied to clipboard" });
                        }}
                        title="Copy URL"
                      >
                        <ClipboardCopy className="w-4 h-4" />
                      </Button>
                      {settings.selectedEndpoint !== endpoint && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateSetting('selectedEndpoint', endpoint)}
                        >
                          Set Active
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveEndpoint(endpoint)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {endpoints.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No endpoints configured. Add one above to get started.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Configuration</CardTitle>
              <CardDescription>
                Select the default model for Ollama operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default Model</Label>
                <Select
                  value={settings.selectedModel}
                  onValueChange={(value) => updateSetting('selectedModel', value)}
                  disabled={!settings.selectedEndpoint}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((model) => (
                      <SelectItem key={model.name} value={model.name}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {loadingModels && (
                  <p className="text-xs text-gray-500">Loading models...</p>
                )}
              </div>

              {!settings.selectedEndpoint && (
                <p className="text-sm text-amber-600">
                  Please configure an endpoint first to load available models.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Advanced Parameters
              </CardTitle>
              <CardDescription>
                Fine-tune Ollama generation parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable Ollama */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Ollama Integration</Label>
                  <p className="text-sm text-gray-500">
                    Use Ollama for AI operations across the app
                  </p>
                </div>
                <Switch
                  checked={settings.useOllama}
                  onCheckedChange={(checked) => updateSetting('useOllama', checked)}
                />
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Temperature</Label>
                  <span className="text-sm text-gray-600">{settings.temperature}</span>
                </div>
                <Slider
                  value={[settings.temperature]}
                  onValueChange={([value]) => updateSetting('temperature', value)}
                  min={0}
                  max={2}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Controls randomness. Lower = more focused, Higher = more creative
                </p>
              </div>

              {/* Top P */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Top P</Label>
                  <span className="text-sm text-gray-600">{settings.top_p}</span>
                </div>
                <Slider
                  value={[settings.top_p]}
                  onValueChange={([value]) => updateSetting('top_p', value)}
                  min={0}
                  max={1}
                  step={0.05}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Nucleus sampling threshold
                </p>
              </div>

              {/* Max Tokens */}
              <div className="space-y-2">
                <Label>Max Tokens</Label>
                <Input
                  type="number"
                  value={settings.max_tokens}
                  onChange={(e) => updateSetting('max_tokens', parseInt(e.target.value) || 2048)}
                  min={100}
                  max={32000}
                />
                <p className="text-xs text-gray-500">
                  Maximum tokens in the response
                </p>
              </div>

              {/* Top K */}
              <div className="space-y-2">
                <Label>Top K</Label>
                <Input
                  type="number"
                  value={settings.top_k}
                  onChange={(e) => updateSetting('top_k', parseInt(e.target.value) || 40)}
                  min={1}
                  max={100}
                />
                <p className="text-xs text-gray-500">
                  Limits vocabulary to top K tokens
                </p>
              </div>

              {/* Repeat Penalty */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Repeat Penalty</Label>
                  <span className="text-sm text-gray-600">{settings.repeat_penalty}</span>
                </div>
                <Slider
                  value={[settings.repeat_penalty]}
                  onValueChange={([value]) => updateSetting('repeat_penalty', value)}
                  min={0}
                  max={2}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Penalizes repetition in output
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
