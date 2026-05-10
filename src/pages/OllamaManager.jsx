import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useToast } from "@/components/ui/use-toast";
import ModelManagerDashboard from "../components/ollama/ModelManagerDashboard";
import FunctionRegistry, { AVAILABLE_FUNCTIONS } from "../components/ollama/FunctionRegistry";
import { apiClient } from "@/apis/client";

export default function OllamaManager() {
  const [endpoint, setEndpoint] = useState('');
  const [models, setModels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [enabledFunctions, setEnabledFunctions] = useState(() => {
    const saved = localStorage.getItem('ollama_enabled_functions');
    return saved ? JSON.parse(saved) : Object.keys(AVAILABLE_FUNCTIONS).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {});
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const savedEndpoints = JSON.parse(localStorage.getItem('ollama_endpoints') || '[]');
    if (savedEndpoints.length > 0) {
      let firstEndpoint = typeof savedEndpoints[0] === 'string' ? savedEndpoints[0] : savedEndpoints[0].url;
      
      // Auto-correct old endpoint
      if (firstEndpoint.includes('hq.ngrok.dev')) {
        firstEndpoint = '/proxy';
      }
      
      setEndpoint(firstEndpoint);
      loadModels(firstEndpoint);
    }
  }, []);

  const loadModels = async (endpointUrl) => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.functions.invoke('ollamaProxy', { endpoint: endpointUrl, action: 'list-models' });
      setModels((data.models || []).map(m => ({ name: m.id })));
    } catch (error) {
      console.error('Failed to load models:', error);
      toast({ title: "Failed to load models", description: "Check Ollama endpoint connection", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePullModel = async (modelName) => {
    try {
      await apiClient.functions.invoke('ollamaProxy', { endpoint, action: 'pull-model', model: modelName });
      setTimeout(() => loadModels(endpoint), 2000);
      return true;
    } catch (error) {
      throw new Error(`Failed to pull model: ${error.message}`);
    }
  };

  const handleDeleteModel = async (modelName) => {
    if (!confirm(`Are you sure you want to delete ${modelName}?`)) return;
    try {
      await apiClient.functions.invoke('ollamaProxy', { endpoint, action: 'delete-model', model: modelName });
      toast({ title: "Model Deleted", description: `${modelName} has been removed` });
      loadModels(endpoint);
    } catch (error) {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    }
  };

  const handleToggleFunction = (functionKey, enabled) => {
    const updated = { ...enabledFunctions, [functionKey]: enabled };
    setEnabledFunctions(updated);
    localStorage.setItem('ollama_enabled_functions', JSON.stringify(updated));
    
    toast({
      title: enabled ? "Function Enabled" : "Function Disabled",
      description: `${AVAILABLE_FUNCTIONS[functionKey].name} ${enabled ? 'activated' : 'deactivated'}`
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl('VoiceToPrompt'))}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Voice Chat
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="models" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="models">Model Management</TabsTrigger>
            <TabsTrigger value="functions">Function Calling</TabsTrigger>
          </TabsList>

          <TabsContent value="models">
            {endpoint ? (
              <ModelManagerDashboard
                endpoint={endpoint}
                models={models}
                onRefresh={() => loadModels(endpoint)}
                onPullModel={handlePullModel}
                onDeleteModel={handleDeleteModel}
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg font-medium mb-2">No Ollama endpoint configured</p>
                <p className="text-sm">Configure an endpoint in Voice to Prompt settings</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="functions">
            <FunctionRegistry
              enabledFunctions={enabledFunctions}
              onToggleFunction={handleToggleFunction}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
