import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Zap, 
  Trash2, 
  Plus, 
  Save, 
  Brain,
  Settings,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ModelSettings({ availableModels = [], ollamaEndpoint }) {
  const [beamModels, setBeamModels] = useState([]);
  const [primaryChatModel, setPrimaryChatModel] = useState('');
  const [newBeamModel, setNewBeamModel] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Load saved settings
    const savedBeamModels = JSON.parse(localStorage.getItem('voice_beam_models') || '[]');
    const savedPrimaryModel = localStorage.getItem('voice_primary_chat_model') || '';
    
    setBeamModels(savedBeamModels);
    setPrimaryChatModel(savedPrimaryModel);
  }, []);

  const handleAddBeamModel = () => {
    if (!newBeamModel) {
      toast({
        title: "Model Required",
        description: "Please select a model to add",
        variant: "destructive"
      });
      return;
    }

    if (beamModels.includes(newBeamModel)) {
      toast({
        title: "Already Added",
        description: "This model is already in your Beam configuration",
        variant: "destructive"
      });
      return;
    }

    const updated = [...beamModels, newBeamModel];
    setBeamModels(updated);
    localStorage.setItem('voice_beam_models', JSON.stringify(updated));
    setNewBeamModel('');
    
    toast({
      title: "Model Added",
      description: `${newBeamModel} added to Beam mode`
    });
  };

  const handleRemoveBeamModel = (model) => {
    const updated = beamModels.filter(m => m !== model);
    setBeamModels(updated);
    localStorage.setItem('voice_beam_models', JSON.stringify(updated));
    
    toast({
      title: "Model Removed",
      description: `${model} removed from Beam mode`
    });
  };

  const handleSetPrimaryModel = (model) => {
    setPrimaryChatModel(model);
    localStorage.setItem('voice_primary_chat_model', model);
    
    toast({
      title: "Primary Model Set",
      description: `${model} is now your default chat model`
    });
  };

  return (
    <div className="space-y-4">
      {/* Primary Chat Model */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-base">Primary Chat Model</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Choose which model to use for general conversation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={primaryChatModel} onValueChange={handleSetPrimaryModel}>
            <SelectTrigger>
              <SelectValue placeholder="Select primary model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apiClient">apiClient AI (Default)</SelectItem>
              {availableModels.map(model => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {primaryChatModel && (
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-800">
                Active: {primaryChatModel}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Beam Mode Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600" />
            <CardTitle className="text-base">Beam Mode Models</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Configure which models to use for parallel response comparison
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Current Beam Models */}
          {beamModels.length > 0 ? (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Active Beam Models:</Label>
              <div className="flex flex-wrap gap-2">
                {beamModels.map((model, idx) => (
                  <Badge key={idx} className="bg-indigo-100 text-indigo-800 pr-1">
                    {model}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-1 hover:bg-indigo-200"
                      onClick={() => handleRemoveBeamModel(model)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-xs text-gray-600">No models configured for Beam mode yet</p>
              <p className="text-xs text-gray-500 mt-1">Add at least 2 models to use Beam</p>
            </div>
          )}

          {/* Add New Model */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Add Model to Beam:</Label>
            <div className="flex gap-2">
              <Select value={newBeamModel} onValueChange={setNewBeamModel}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels
                    .filter(m => !beamModels.includes(m))
                    .map(model => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleAddBeamModel}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Status Message */}
          {beamModels.length >= 2 && (
            <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
              <p className="text-xs text-indigo-800">
                ✅ Beam mode ready with {beamModels.length} models
              </p>
            </div>
          )}

          {beamModels.length === 1 && (
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                ⚠️ Add at least one more model to enable Beam
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ollama Endpoint Info */}
      {ollamaEndpoint && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-4 h-4 text-gray-600" />
            <Label className="text-xs font-medium">Ollama Endpoint</Label>
          </div>
          <p className="text-xs text-gray-600">{ollamaEndpoint}</p>
        </div>
      )}
    </div>
  );
}
