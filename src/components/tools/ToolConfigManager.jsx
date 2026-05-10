import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Wrench,
  Settings,
  Code,
  TestTube,
  Play,
  AlertCircle
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { AVAILABLE_FUNCTIONS } from '../ollama/FunctionRegistry';

export default function ToolConfigManager({ onToolsChange }) {
  const [customTools, setCustomTools] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('custom_tools') || '[]');
    } catch {
      return [];
    }
  });
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTool, setEditingTool] = useState(null);
  const [newTool, setNewTool] = useState({
    name: '',
    description: '',
    endpoint: '',
    method: 'POST',
    headers: {},
    parameters: {}
  });

  const { toast } = useToast();

  // Built-in tools from FunctionRegistry
  const builtInTools = Object.entries(AVAILABLE_FUNCTIONS).map(([key, func]) => ({
    id: key,
    name: func.name,
    description: func.description,
    isBuiltIn: true,
    enabled: true
  }));

  useEffect(() => {
    if (onToolsChange) {
      onToolsChange([...builtInTools, ...customTools]);
    }
  }, [customTools]);

  const handleAddTool = () => {
    if (!newTool.name || !newTool.description) {
      toast({
        title: "Validation Error",
        description: "Name and description are required",
        variant: "destructive"
      });
      return;
    }

    const tool = {
      id: `custom_${Date.now()}`,
      ...newTool,
      isBuiltIn: false,
      enabled: true,
      createdAt: new Date().toISOString()
    };

    const updated = [...customTools, tool];
    setCustomTools(updated);
    localStorage.setItem('custom_tools', JSON.stringify(updated));
    
    setShowAddDialog(false);
    setNewTool({
      name: '',
      description: '',
      endpoint: '',
      method: 'POST',
      headers: {},
      parameters: {}
    });

    toast({
      title: "Tool Added",
      description: `${tool.name} has been added to your toolbox`
    });
  };

  const handleEditTool = (tool) => {
    setEditingTool(tool);
    setNewTool(tool);
    setShowAddDialog(true);
  };

  const handleUpdateTool = () => {
    const updated = customTools.map(t => 
      t.id === editingTool.id ? { ...newTool, id: editingTool.id } : t
    );
    setCustomTools(updated);
    localStorage.setItem('custom_tools', JSON.stringify(updated));
    
    setShowAddDialog(false);
    setEditingTool(null);
    setNewTool({
      name: '',
      description: '',
      endpoint: '',
      method: 'POST',
      headers: {},
      parameters: {}
    });

    toast({
      title: "Tool Updated",
      description: "Changes have been saved"
    });
  };

  const handleDeleteTool = (toolId) => {
    const updated = customTools.filter(t => t.id !== toolId);
    setCustomTools(updated);
    localStorage.setItem('custom_tools', JSON.stringify(updated));
    
    toast({
      title: "Tool Deleted",
      description: "Tool has been removed"
    });
  };

  const toggleToolEnabled = (toolId) => {
    const updated = customTools.map(t =>
      t.id === toolId ? { ...t, enabled: !t.enabled } : t
    );
    setCustomTools(updated);
    localStorage.setItem('custom_tools', JSON.stringify(updated));
  };

  const testTool = async (tool) => {
    if (!tool.endpoint) {
      toast({
        title: "Cannot Test",
        description: "This tool has no endpoint configured",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Testing Tool",
      description: `Calling ${tool.name}...`
    });

    try {
      const response = await fetch(tool.endpoint, {
        method: tool.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...tool.headers
        },
        body: JSON.stringify({ test: true })
      });

      if (response.ok) {
        toast({
          title: "Test Successful",
          description: `${tool.name} responded with status ${response.status}`
        });
      } else {
        toast({
          title: "Test Failed",
          description: `Status: ${response.status}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Test Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const allTools = [...builtInTools, ...customTools];
  const enabledCount = customTools.filter(t => t.enabled).length + builtInTools.length;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm">Available Tools</h3>
          <p className="text-xs text-gray-600">
            {enabledCount} active • {allTools.length} total
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingTool(null);
            setNewTool({
              name: '',
              description: '',
              endpoint: '',
              method: 'POST',
              headers: {},
              parameters: {}
            });
            setShowAddDialog(true);
          }}
          size="sm"
          className="bg-gradient-to-r from-orange-600 to-red-600 h-8"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Tool
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2">
          {/* Built-in Tools */}
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Built-in Tools
            </p>
            {builtInTools.map(tool => {
              const Icon = AVAILABLE_FUNCTIONS[tool.id]?.icon || Wrench;
              return (
                <Card key={tool.id} className="border border-gray-200 bg-white mb-2">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded bg-gradient-to-r ${AVAILABLE_FUNCTIONS[tool.id]?.color || 'from-gray-500 to-gray-600'}`}>
                          <Icon className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-xs">{tool.name}</p>
                          <p className="text-xs text-gray-600">{tool.description}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs bg-green-50 border-green-300 text-green-700">
                        Built-in
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Custom Tools */}
          {customTools.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Custom Tools
              </p>
              {customTools.map(tool => (
                <Card 
                  key={tool.id} 
                  className={`border mb-2 ${tool.enabled ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-gray-50'}`}
                >
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-xs">{tool.name}</p>
                            <Badge className={`text-xs ${tool.method === 'GET' ? 'bg-blue-600' : 'bg-green-600'}`}>
                              {tool.method}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600">{tool.description}</p>
                          {tool.endpoint && (
                            <code className="text-xs text-gray-500 mt-1 block truncate">
                              {tool.endpoint}
                            </code>
                          )}
                        </div>
                        <Switch
                          checked={tool.enabled}
                          onCheckedChange={() => toggleToolEnabled(tool.id)}
                          className="ml-2"
                        />
                      </div>
                      
                      <div className="flex gap-1 pt-1 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => testTool(tool)}
                          className="h-6 text-xs"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Test
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTool(tool)}
                          className="h-6 text-xs"
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTool(tool.id)}
                          className="h-6 text-xs text-red-600"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Add/Edit Tool Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTool ? 'Edit Tool' : 'Add Custom Tool'}</DialogTitle>
            <DialogDescription>
              Configure a custom API endpoint as a tool for the AI to use
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tool-name">Tool Name *</Label>
                <Input
                  id="tool-name"
                  value={newTool.name}
                  onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
                  placeholder="e.g., searchWeb, getWeather"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tool-method">HTTP Method</Label>
                <select
                  id="tool-method"
                  value={newTool.method}
                  onChange={(e) => setNewTool({ ...newTool, method: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tool-description">Description *</Label>
              <Textarea
                id="tool-description"
                value={newTool.description}
                onChange={(e) => setNewTool({ ...newTool, description: e.target.value })}
                placeholder="Describe what this tool does and when the AI should use it"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tool-endpoint">API Endpoint URL</Label>
              <Input
                id="tool-endpoint"
                value={newTool.endpoint}
                onChange={(e) => setNewTool({ ...newTool, endpoint: e.target.value })}
                placeholder="https://api.example.com/endpoint"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tool-headers">Headers (JSON)</Label>
              <Textarea
                id="tool-headers"
                value={JSON.stringify(newTool.headers, null, 2)}
                onChange={(e) => {
                  try {
                    setNewTool({ ...newTool, headers: JSON.parse(e.target.value) });
                  } catch {}
                }}
                placeholder='{"Authorization": "Bearer YOUR_TOKEN"}'
                rows={3}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tool-parameters">Parameters Schema (JSON)</Label>
              <Textarea
                id="tool-parameters"
                value={JSON.stringify(newTool.parameters, null, 2)}
                onChange={(e) => {
                  try {
                    setNewTool({ ...newTool, parameters: JSON.parse(e.target.value) });
                  } catch {}
                }}
                placeholder={`{
  "type": "object",
  "properties": {
    "query": {"type": "string"}
  },
  "required": ["query"]
}`}
                rows={8}
                className="font-mono text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={editingTool ? handleUpdateTool : handleAddTool}
              className="bg-gradient-to-r from-orange-600 to-red-600"
            >
              {editingTool ? 'Update Tool' : 'Add Tool'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}