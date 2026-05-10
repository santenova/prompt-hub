import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Server,
  Plus,
  X,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Star,
  Cpu,
  HardDrive,
  Clock,
  Copy,
  Download,
  Trash2,
  Activity,
  Zap
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { apiClient } from "@/apis/client";

// Helper functions for localStorage
const getOllamaEndpoints = () => {
  try {
    const stored = localStorage.getItem('ollama_endpoints');
    if (stored) {
      let endpoints = JSON.parse(stored);
      // Auto-correct old endpoints
      if (Array.isArray(endpoints)) {
        endpoints = endpoints.map(e => 
          e.includes('hq.ngrok.dev') ? '/proxy' : e
        );
      }
      return Array.isArray(endpoints) && endpoints.length > 0 ? endpoints : ['/proxy'];
    }
  } catch (error) {
    console.error('Error reading Ollama endpoints:', error);
  }
  return ['/proxy'];
};

const saveOllamaEndpoints = (endpoints) => {
  try {
    localStorage.setItem('ollama_endpoints', JSON.stringify(endpoints));
  } catch (error) {
    console.error('Error saving Ollama endpoints:', error);
  }
};

const getDefaultModel = () => {
  try {
    return localStorage.getItem('ollama_default_model') || '';
  } catch (error) {
    console.error('Error reading default model:', error);
    return '';
  }
};

const saveDefaultModel = (model) => {
  try {
    localStorage.setItem('ollama_default_model', model);
  } catch (error) {
    console.error('Error saving default model:', error);
  }
};

export default function OllamaSettingsCard({ compact = false }) {
  const [ollamaEndpoints, setOllamaEndpoints] = useState([]);
  const [newEndpoint, setNewEndpoint] = useState('');
  const [installedModels, setInstalledModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [defaultModel, setDefaultModel] = useState('');
  const [testingEndpoint, setTestingEndpoint] = useState(null);
  const [endpointStatus, setEndpointStatus] = useState({});
  const [copiedCommand, setCopiedCommand] = useState('');
  const [pullingModel, setPullingModel] = useState(null);
  const [pullProgress, setPullProgress] = useState({});
  const [deletingModel, setDeletingModel] = useState(null);
  const [modelToDelete, setModelToDelete] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [modelStats, setModelStats] = useState({});
  
  const { toast } = useToast();

  useEffect(() => {
    const endpoints = getOllamaEndpoints();
    setOllamaEndpoints(endpoints);
    const savedDefaultModel = getDefaultModel();
    setDefaultModel(savedDefaultModel);
    // Only test endpoints, don't fetch models automatically
    testAllEndpoints(endpoints);
  }, []);

  const testAllEndpoints = async (endpoints) => {
    const status = {};
    await Promise.all(endpoints.map(async (endpoint) => {
      try {
        const { data } = await apiClient.functions.invoke('ollamaProxy', { endpoint, action: 'test-connection' });
        status[endpoint] = data.success ? 'online' : 'offline';
      } catch {
        status[endpoint] = 'offline';
      }
    }));
    setEndpointStatus(status);
  };

  const fetchInstalledModels = async () => {
    if (ollamaEndpoints.length === 0) {
      toast({ title: "No Ollama Endpoint", description: "Please add at least one Ollama endpoint.", variant: "destructive", duration: 5000 });
      return;
    }
    setLoadingModels(true);
    try {
      const { data } = await apiClient.functions.invoke('ollamaProxy', { endpoint: ollamaEndpoints[0], action: 'list-models' });
      const models = (data.models || []).map(m => ({ name: m.id }));
      setInstalledModels(models);
      toast({ title: "Models Loaded", description: `Found ${models.length} installed model(s)`, duration: 5000 });
    } catch (error) {
      toast({ title: "Connection Error", description: `Could not connect to Ollama at ${ollamaEndpoints[0]}.`, variant: "destructive", duration: 5000 });
      setInstalledModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  const testEndpoint = async (endpoint) => {
    setTestingEndpoint(endpoint);
    try {
      const { data } = await apiClient.functions.invoke('ollamaProxy', { endpoint, action: 'test-connection' });
      if (data.success) {
        setEndpointStatus(prev => ({ ...prev, [endpoint]: 'online' }));
        toast({ title: "Connection Successful", description: `Connected to Ollama at ${endpoint}`, duration: 5000 });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setEndpointStatus(prev => ({ ...prev, [endpoint]: 'offline' }));
      toast({ title: "Connection Failed", description: `Could not connect to ${endpoint}`, variant: "destructive", duration: 5000 });
    } finally {
      setTestingEndpoint(null);
    }
  };

  const addOllamaEndpoint = () => {
    if (!newEndpoint.trim()) return;
    
    let validatedEndpoint = newEndpoint.trim();
    
    
    try {
      const url = new URL(validatedEndpoint);
      // Ensure the URL is properly formatted with protocol, host, and port
      validatedEndpoint = url.origin;
    } catch (error) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL (e.g., http://127.0.0.1:11434 or proxy.example.com:8080)",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    if (ollamaEndpoints.includes(validatedEndpoint)) {
      toast({
        title: "Duplicate Endpoint",
        description: "This endpoint already exists in your list.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    const updated = [...ollamaEndpoints, validatedEndpoint];
    setOllamaEndpoints(updated);
    saveOllamaEndpoints(updated);
    setNewEndpoint('');
    testEndpoint(validatedEndpoint);
    
    toast({
      title: "Endpoint Added",
      description: "New Ollama endpoint has been added.",
      duration: 5000,
    });
  };

  const removeOllamaEndpoint = (index) => {
    if (ollamaEndpoints.length === 1) {
      toast({
        title: "Cannot Remove",
        description: "You must have at least one endpoint configured.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    const updated = ollamaEndpoints.filter((_, i) => i !== index);
    setOllamaEndpoints(updated);
    saveOllamaEndpoints(updated);
    
    toast({
      title: "Endpoint Removed",
      description: "Endpoint has been removed.",
      duration: 5000,
    });
  };

  const handleSetDefaultModel = (modelName) => {
    setDefaultModel(modelName);
    saveDefaultModel(modelName);
    
    toast({
      title: "Default Model Set",
      description: `${modelName} is now your default model`,
      duration: 5000,
    });
  };

  const formatBytes = (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const copyCommand = (command) => {
    navigator.clipboard.writeText(command);
    setCopiedCommand(command);
    setTimeout(() => setCopiedCommand(''), 2000);
    
    toast({
      title: "Copied!",
      description: "Command copied to clipboard",
      duration: 5000,
    });
  };

  const pullModel = async (modelName) => {
    if (!ollamaEndpoints[0]) {
      toast({ title: "No Endpoint", description: "Please configure an Ollama endpoint first", variant: "destructive" });
      return;
    }
    setPullingModel(modelName);
    setPullProgress({ [modelName]: 0 });
    try {
      await apiClient.functions.invoke('ollamaProxy', { endpoint: ollamaEndpoints[0], action: 'pull-model', model: modelName });
      toast({ title: "Model Downloaded", description: `${modelName} is ready to use` });
      fetchInstalledModels();
    } catch (error) {
      toast({ title: "Download Failed", description: error.message, variant: "destructive" });
    } finally {
      setPullingModel(null);
      setPullProgress({});
    }
  };

  const deleteModel = async (modelName) => {
    if (!ollamaEndpoints[0]) return;
    setDeletingModel(modelName);
    try {
      const response = await fetch(`${ollamaEndpoints[0]}/api/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ollama', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ name: modelName })
      });
      if (!response.ok) throw new Error('Failed to delete model');
      toast({ title: "Model Deleted", description: `${modelName} has been removed` });
      if (defaultModel === modelName) { setDefaultModel(''); saveDefaultModel(''); }
      fetchInstalledModels();
    } catch (error) {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    } finally {
      setDeletingModel(null);
      setShowDeleteDialog(false);
      setModelToDelete(null);
    }
  };

  const getModelStats = async (modelName) => {
    if (!ollamaEndpoints[0]) return;
    try {
      const { data } = await apiClient.functions.invoke('ollamaProxy', { endpoint: ollamaEndpoints[0], action: 'model-info', model: modelName });
      setModelStats(prev => ({
        ...prev,
        [modelName]: {
          parameters: data.details?.parameter_size,
          quantization: data.details?.quantization_level,
          family: data.details?.family
        }
      }));
    } catch (error) {
      console.error('Failed to get model stats:', error);
    }
  };

  const popularModels = [
    { name: 'llama2', description: 'Meta\'s Llama 2 - General purpose', size: '~3.8GB' },
    { name: 'llama3.2', description: 'Latest Llama 3.2 - Most capable', size: '~2GB' },
    { name: 'mistral', description: 'Mistral 7B - Fast and efficient', size: '~4.1GB' },
    { name: 'codellama', description: 'Code generation specialist', size: '~3.8GB' },
    { name: 'phi', description: 'Microsoft Phi-2 - Compact but powerful', size: '~1.7GB' },
    { name: 'gemma', description: 'Google Gemma - Lightweight', size: '~1.7GB' },
  ];

  return (
    <div className="space-y-6">
      {/* Endpoints Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5 text-purple-600" />
            Ollama API Endpoints
          </CardTitle>
          <CardDescription>Configure connections to your Ollama instances</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Endpoints */}
          <div className="space-y-2">
            {ollamaEndpoints.map((endpoint, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 border rounded-lg">
                <div className="flex-1 flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">
                    {index === 0 ? 'Primary' : `#${index + 1}`}
                  </Badge>
                  <code className="flex-1 text-sm font-mono text-gray-800">
                    {endpoint}
                  </code>
                  {endpointStatus[endpoint] && (
                    <Badge className={endpointStatus[endpoint] === 'online' ? 'bg-green-600' : 'bg-red-600'}>
                      {endpointStatus[endpoint] === 'online' ? (
                        <><CheckCircle2 className="w-3 h-3 mr-1" /> Online</>
                      ) : (
                        <><AlertCircle className="w-3 h-3 mr-1" /> Offline</>
                      )}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => testEndpoint(endpoint)}
                  disabled={testingEndpoint === endpoint}
                >
                  {testingEndpoint === endpoint ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOllamaEndpoint(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add New Endpoint */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-600">
              Examples: localhost:11434, proxy.example.com:8080, https://my-ollama.ngrok.io
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="http://127.0.0.1:11434"
                value={newEndpoint}
                onChange={(e) => setNewEndpoint(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addOllamaEndpoint();
                  }
                }}
                className="flex-1 font-mono"
              />
              <Button onClick={addOllamaEndpoint} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Models Card */}
      {!compact && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-purple-600" />
                  Installed Models
                </CardTitle>
                <CardDescription>Manage your local Ollama models</CardDescription>
              </div>
              <Button 
                onClick={fetchInstalledModels}
                disabled={loadingModels || ollamaEndpoints.length === 0}
                variant="outline"
              >
                {loadingModels ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {installedModels.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Cpu className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No models found</p>
                <p className="text-sm mt-1">Click "Refresh" to load installed models</p>
              </div>
            ) : (
              <>
                {defaultModel && (
                  <Alert className="bg-green-50 border-green-200">
                    <Star className="h-4 w-4 text-green-600 fill-green-600" />
                    <AlertDescription>
                      <strong>{defaultModel}</strong> is your default model
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  {installedModels.map((model, index) => {
                    const stats = modelStats[model.name];
                    return (
                      <Card key={model.digest || index} className="border-2">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-lg">{model.name}</h4>
                                {defaultModel === model.name && (
                                  <Badge className="bg-green-600">
                                    <Star className="w-3 h-3 mr-1 fill-white" />
                                    Default
                                  </Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                                <div>
                                  <p className="text-gray-600 flex items-center gap-2">
                                    <HardDrive className="w-4 h-4" />
                                    Size: {formatBytes(model.size)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-600 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Modified: {formatDate(model.modified_at)}
                                  </p>
                                </div>
                              </div>
                              {stats && (
                                <div className="flex gap-2 flex-wrap">
                                  {stats.parameters && (
                                    <Badge variant="outline" className="text-xs">
                                      <Cpu className="w-3 h-3 mr-1" />
                                      {stats.parameters}
                                    </Badge>
                                  )}
                                  {stats.quantization && (
                                    <Badge variant="outline" className="text-xs">
                                      <Zap className="w-3 h-3 mr-1" />
                                      {stats.quantization}
                                    </Badge>
                                  )}
                                  {stats.family && (
                                    <Badge variant="outline" className="text-xs">
                                      {stats.family}
                                    </Badge>
                                  )}
                                </div>
                              )}
                              {!stats && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => getModelStats(model.name)}
                                  className="text-xs h-7"
                                >
                                  <Activity className="w-3 h-3 mr-1" />
                                  View Stats
                                </Button>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {defaultModel !== model.name && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSetDefaultModel(model.name)}
                                >
                                  <Star className="w-4 h-4 mr-2" />
                                  Set Default
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setModelToDelete(model.name);
                                  setShowDeleteDialog(true);
                                }}
                                disabled={deletingModel === model.name}
                                className="text-red-600 hover:text-red-700"
                              >
                                {deletingModel === model.name ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Download Models Card */}
      {!compact && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-purple-600" />
              Download Popular Models
            </CardTitle>
            <CardDescription>Quick commands to install commonly used models</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Run these commands in your terminal where Ollama is installed. Downloads can be large and may take several minutes.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {popularModels.map((model) => (
                <Card key={model.name} className="border">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-base">{model.name}</h4>
                        <p className="text-xs text-gray-600 mt-1">{model.description}</p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {model.size}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                       {pullingModel === model.name ? (
                         <div className="flex-1 space-y-2">
                           <Progress value={pullProgress[model.name] || 0} className="h-2" />
                           <p className="text-xs text-gray-600">
                             Downloading... {pullProgress[model.name] || 0}%
                           </p>
                         </div>
                       ) : (
                         <>
                           <code className="flex-1 px-3 py-2 bg-gray-900 text-gray-100 rounded text-xs font-mono overflow-auto whitespace-nowrap">
                             ollama pull {model.name}
                           </code>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => pullModel(model.name)}
                             className="flex-shrink-0"
                             disabled={pullingModel !== null}
                           >
                             <Download className="w-4 h-4" />
                           </Button>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => copyCommand(`ollama pull ${model.name}`)}
                             className="flex-shrink-0"
                           >
                             {copiedCommand === `ollama pull ${model.name}` ? (
                               <CheckCircle2 className="w-4 h-4 text-green-600" />
                             ) : (
                               <Copy className="w-4 h-4" />
                             )}
                           </Button>
                         </>
                       )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Model</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{modelToDelete}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteModel(modelToDelete)}
              disabled={deletingModel !== null}
            >
              {deletingModel ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
