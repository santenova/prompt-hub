import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, GitBranch, Upload, Link2, Sparkles, Server, Settings, Plus, X, Loader2, Package, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/apis/client";
import { useQuery } from '@tanstack/react-query';
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

import ContentVariationsGenerator from "../components/ai/ContentVariationsGenerator";
import DocumentUploader from "../components/ai/DocumentUploader";
import APIIntegrationManager from "../components/ai/APIIntegrationManager";
import OllamaModelManager from "../components/ollama/OllamaModelManager";
import ContentHistoryViewer from "../components/ai/ContentHistoryViewer";

export default function AdvancedAI() {
  const [currentUser, setCurrentUser] = useState(null);
  const [baseContent, setBaseContent] = useState('');
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [externalData, setExternalData] = useState(null);
  const [enhancedContent, setEnhancedContent] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedPersonaId, setSelectedPersonaId] = useState('');
  const [useOllama, setUseOllama] = useState(true);
  const [showOllamaConfig, setShowOllamaConfig] = useState(false);
  const [showModelManager, setShowModelManager] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [ollamaEndpoints, setOllamaEndpoints] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);
  const [newEndpoint, setNewEndpoint] = useState('');
  const [isTestingEndpoint, setIsTestingEndpoint] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await apiClient.auth.me();
        setCurrentUser(user);
      } catch (error) {
        setCurrentUser(null);
      }
    };
    fetchUser();

    // Load Ollama configuration
    const loadOllamaConfig = () => {
      try {
        const stored = localStorage.getItem('ollama_endpoints');
        const endpoints = stored ? JSON.parse(stored) : [];
        setOllamaEndpoints(endpoints);
        
        if (endpoints.length > 0) {
          setSelectedEndpoint(endpoints[0]);
          loadOllamaModels(endpoints[0]);
        }
        
        const model = localStorage.getItem('voice_selected_model') || '';
        if (model) setSelectedModel(model);
      } catch (error) {
        console.error('Failed to load Ollama config:', error);
      }
    };
    
    loadOllamaConfig();
  }, []);

  const loadOllamaModels = async (endpointUrl) => {
    try {
      const { data } = await apiClient.functions.invoke('ollamaProxy', { endpoint: endpointUrl, action: 'list-models' });
      const models = (data.models || []).map(m => ({ name: m.id }));
      setAvailableModels(models);
      const savedModel = localStorage.getItem('voice_selected_model');
      if (savedModel && models.find(m => m.name === savedModel)) {
        setSelectedModel(savedModel);
      } else if (models.length > 0) {
        setSelectedModel(models[0].name);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const testEndpoint = async (url) => {
    setIsTestingEndpoint(true);
    try {
      const { data } = await apiClient.functions.invoke('ollamaProxy', { endpoint: url, action: 'test-connection' });
      if (data.success) {
        toast({ title: "Connection Successful", description: `Connected to Ollama` });
        return true;
      }
      throw new Error('Failed to connect');
    } catch (error) {
      toast({ title: "Connection Failed", description: "Could not connect to Ollama endpoint", variant: "destructive" });
      return false;
    } finally {
      setIsTestingEndpoint(false);
    }
  };

  const addEndpoint = async () => {
    if (!newEndpoint.trim()) return;
    
    const url = newEndpoint.trim();
    const isValid = await testEndpoint(url);
    
    if (isValid) {
      const updated = [...ollamaEndpoints, url];
      setOllamaEndpoints(updated);
      localStorage.setItem('ollama_endpoints', JSON.stringify(updated));
      
      if (!selectedEndpoint) {
        setSelectedEndpoint(url);
        loadOllamaModels(url);
      }
      
      setNewEndpoint('');
    }
  };

  const removeEndpoint = (urlToRemove) => {
    const updated = ollamaEndpoints.filter(e => e !== urlToRemove);
    setOllamaEndpoints(updated);
    localStorage.setItem('ollama_endpoints', JSON.stringify(updated));
    
    if (selectedEndpoint === urlToRemove && updated.length > 0) {
      setSelectedEndpoint(updated[0]);
      loadOllamaModels(updated[0]);
    } else if (updated.length === 0) {
      setSelectedEndpoint('');
      setAvailableModels([]);
    }
  };

  const switchEndpoint = (url) => {
    setSelectedEndpoint(url);
    loadOllamaModels(url);
  };

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => apiClient.entities.Template.list('-created_date', 100),
    initialData: [],
  });

  const { data: personas = [] } = useQuery({
    queryKey: ['personas'],
    queryFn: () => apiClient.entities.Persona.list('-created_date', 100),
    initialData: [],
  });

  const handleDocumentsUploaded = (docs) => {
    setUploadedDocuments(docs);
  };

  const handleDataFetched = (data) => {
    setExternalData(data);
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplateId(templateId);
    if (templateId) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setBaseContent(template.content);
      }
    } else {
      setBaseContent(''); // Clear base content if "None" is selected
    }
  };

  const handlePersonaSelect = (personaId) => {
    setSelectedPersonaId(personaId);
    if (personaId) {
      const persona = personas.find(p => p.id === personaId);
      if (persona) {
        const personaPrompt = `Acting as: ${persona.name}

Description: ${persona.description}

Instructions: ${persona.instructions || ''}

Tone: ${persona.tone}

Expertise Areas: ${persona.expertise_areas?.join(', ') || 'General'}`;
        setBaseContent(personaPrompt);
      }
    } else {
      setBaseContent(''); // Clear base content if "None" is selected
    }
  };

  const saveToHistory = async (enhanced) => {
    try {
      await apiClient.entities.ContentHistory.create({
        tool_type: 'advanced_ai',
        topic: baseContent.substring(0, 100),
        base_content: baseContent,
        enhanced_content: enhanced,
        persona_id: selectedPersonaId,
        persona_name: personas.find(p => p.id === selectedPersonaId)?.name,
        template_id: selectedTemplateId,
        template_name: templates.find(t => t.id === selectedTemplateId)?.title,
        use_ollama: useOllama,
        ollama_model: useOllama ? selectedModel : null,
        documents_used: uploadedDocuments.map(d => d.name),
        external_data_used: !!externalData
      });
    } catch (error) {
      console.error('Failed to save to history:', error);
    }
  };

  const handleGenerateEnhanced = async () => {
    if (!baseContent.trim()) return;

    setIsEnhancing(true);
    try {
      let contextParts = [];

      if (uploadedDocuments.length > 0) {
        const docsContext = uploadedDocuments
          .filter(d => d.extractedContent)
          .map(d => `Document: ${d.name}\nContent: ${d.extractedContent}`)
          .join('\n\n');
        if (docsContext) contextParts.push(`Reference Documents:\n${docsContext}`);
      }

      if (externalData) {
        contextParts.push(`External Data:\n${JSON.stringify(externalData.data, null, 2)}`);
      }

      const fullPrompt = `${contextParts.length > 0 ? contextParts.join('\n\n---\n\n') + '\n\n---\n\n' : ''}Base Content:\n${baseContent}\n\nEnhance this content using the provided context and data to make it more relevant, data-driven, and impactful.`;

      let result;
      if (useOllama && selectedEndpoint && selectedModel) {
        try {
          const { data: chatData } = await apiClient.functions.invoke('ollamaProxy', {
            endpoint: selectedEndpoint,
            action: 'chat',
            model: selectedModel,
            messages: [{ role: "user", content: fullPrompt }],
            options: { stream: false }
          });
          result = chatData?.message?.content || '';
          if (!result) throw new Error('Ollama request failed');
        } catch (ollamaError) {
          console.log('Ollama failed, using Second:', ollamaError);
          toast({
            title: "Ollama Unavailable",
            description: "Falling back to Second AI",
            variant: "destructive"
          });
          result = await apiClient.integrations.Core.InvokeLLMwithLogging({ prompt: fullPrompt });
        }
      } else {
        result = await apiClient.integrations.Core.InvokeLLMwithLogging({ prompt: fullPrompt });
      }

      setEnhancedContent(result);
      
      // Save to history
      await saveToHistory(result);
      
      toast({
        title: "Enhancement Complete",
        description: `Used ${useOllama ? 'Ollama' : 'Second AI'} for generation`
      });
    } catch (error) {
      console.error('Enhancement error:', error);
      toast({
        title: "Enhancement Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Brain className="w-16 h-16 mx-auto mb-4 text-purple-600" />
            <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
            <p className="text-gray-600 mb-6">
              Access advanced AI features by signing in to your account
            </p>
            <Button
              onClick={() => apiClient.auth.redirectToLogin()}
              className="bg-gradient-to-r from-purple-600 to-indigo-600"
            >
              Sign In to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full mb-4">
            <Brain className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Advanced AI Tools</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Advanced Content Generation
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Leverage external data, generate A/B test variations, and upload reference documents
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Tools */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="variations" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="variations">
                  <GitBranch className="w-4 h-4 mr-2" />
                  A/B Variations
                </TabsTrigger>
                <TabsTrigger value="documents">
                  <Upload className="w-4 h-4 mr-2" />
                  Documents
                </TabsTrigger>
                <TabsTrigger value="data">
                  <Link2 className="w-4 h-4 mr-2" />
                  External Data
                </TabsTrigger>
                <TabsTrigger value="history">
                  <History className="w-4 h-4 mr-2" />
                  History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="variations" className="mt-6">
                <ContentVariationsGenerator
                  baseContent={baseContent}
                  onSelect={(variation) => {
                    setBaseContent(variation.content);
                  }}
                />
              </TabsContent>

              <TabsContent value="documents" className="mt-6">
                <DocumentUploader
                  onDocumentsUploaded={handleDocumentsUploaded}
                  existingDocuments={uploadedDocuments}
                />
              </TabsContent>

              <TabsContent value="data" className="mt-6">
                <APIIntegrationManager
                  onDataFetched={handleDataFetched}
                />
              </TabsContent>

              <TabsContent value="history" className="mt-6">
                <ContentHistoryViewer 
                  toolType="advanced_ai"
                  onRegenerate={(item) => {
                    if (item.base_content) setBaseContent(item.base_content);
                    if (item.persona_id) setSelectedPersonaId(item.persona_id);
                    if (item.template_id) setSelectedTemplateId(item.template_id);
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Base Content */}
          <div className="space-y-6">
            {/* Ollama Configuration Card */}
            <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-blue-50 sticky top-24">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Server className="w-4 h-4 text-orange-600" />
                    AI Configuration
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="use-ollama-advanced" className="text-xs cursor-pointer">Ollama</Label>
                    <Switch
                      id="use-ollama-advanced"
                      checked={useOllama}
                      onCheckedChange={setUseOllama}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowModelManager(!showModelManager)}
                      className="h-6 w-6"
                      title="Model Manager"
                    >
                      <Package className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowOllamaConfig(!showOllamaConfig)}
                      className="h-6 w-6"
                      title="Settings"
                    >
                      <Settings className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {useOllama && (
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Endpoint</Label>
                      <Select value={selectedEndpoint} onValueChange={switchEndpoint}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {ollamaEndpoints.map((ep, idx) => (
                            <SelectItem key={idx} value={ep} className="text-xs">{ep}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Model</Label>
                      <Select 
                        value={selectedModel} 
                        onValueChange={(value) => {
                          setSelectedModel(value);
                          localStorage.setItem('voice_selected_model', value);
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableModels.map((model) => (
                            <SelectItem key={model.name} value={model.name} className="text-xs">
                              {model.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showOllamaConfig && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 space-y-2 border-t border-orange-200">
                          <Label className="text-xs font-semibold">Add Endpoint</Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="http://localhost:11434"
                              value={newEndpoint}
                              onChange={(e) => setNewEndpoint(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && addEndpoint()}
                              className="h-8 text-xs"
                            />
                            <Button
                              onClick={addEndpoint}
                              disabled={!newEndpoint.trim() || isTestingEndpoint}
                              size="sm"
                              className="h-8 bg-gradient-to-r from-orange-600 to-red-600"
                            >
                              {isTestingEndpoint ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Plus className="w-3 h-3" />
                              )}
                            </Button>
                          </div>

                          {ollamaEndpoints.length > 0 && (
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {ollamaEndpoints.map((ep) => (
                                <div key={ep} className="flex items-center justify-between p-2 bg-white rounded border text-xs">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <Server className={`w-3 h-3 flex-shrink-0 ${selectedEndpoint === ep ? 'text-green-600' : 'text-gray-400'}`} />
                                    <span className="truncate">{ep}</span>
                                    {selectedEndpoint === ep && (
                                      <Badge className="h-4 text-xs bg-green-100 text-green-700">Active</Badge>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeEndpoint(ep)}
                                    className="h-6 w-6 p-0 flex-shrink-0"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {showModelManager && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 border-t border-orange-200">
                          <div className="max-h-[300px] overflow-auto">
                            <OllamaModelManager 
                              endpoint={selectedEndpoint}
                              onModelUpdate={(models) => setAvailableModels(models)}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              )}
            </Card>

            <Card className="border-2 border-purple-200">
              <CardHeader>
                <CardTitle className="text-base">Base Content</CardTitle>
                <CardDescription className="text-xs">
                  Select a template/persona or enter custom content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Template Selection */}
                <div className="space-y-2">
                  <Label className="text-xs">Start with Template</Label>
                  <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value={null}>None</SelectItem>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Persona Selection */}
                <div className="space-y-2">
                  <Label className="text-xs">Start with Persona</Label>
                  <Select value={selectedPersonaId} onValueChange={handlePersonaSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a persona..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value={null}>None</SelectItem>
                      {personas.map((persona) => (
                        <SelectItem key={persona.id} value={persona.id}>
                          {persona.icon} {persona.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Textarea
                  placeholder="Enter your base content here..."
                  value={baseContent}
                  onChange={(e) => setBaseContent(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                />

                {(uploadedDocuments.length > 0 || externalData) && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-700">Active Context:</p>
                    {uploadedDocuments.filter(d => d.processed).length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <Sparkles className="w-3 h-3" />
                        <span>{uploadedDocuments.filter(d => d.processed).length} document(s) processed</span>
                      </div>
                    )}
                    {externalData && (
                      <div className="flex items-center gap-1 text-xs text-blue-600">
                        <Link2 className="w-3 h-3" />
                        <span>External data: {externalData.type}</span>
                      </div>
                    )}
                  </div>
                )}

                {(uploadedDocuments.filter(d => d.processed).length > 0 || externalData) && (
                  <Button
                    onClick={handleGenerateEnhanced}
                    disabled={!baseContent.trim() || isEnhancing || (useOllama && (!selectedEndpoint || !selectedModel))}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
                  >
                    {isEnhancing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enhancing with {useOllama ? `Ollama (${selectedModel})` : 'Second AI'}...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Enhance with {useOllama ? 'Ollama' : 'Second AI'}
                      </>
                    )}
                  </Button>
                )}

                {enhancedContent && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-700">Enhanced Content:</p>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg max-h-64 overflow-y-auto">
                      <pre className="text-xs whitespace-pre-wrap">{enhancedContent}</pre>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBaseContent(enhancedContent)}
                      className="w-full"
                    >
                      Use Enhanced Version
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {[
            {
              icon: GitBranch,
              title: "A/B Test Variations",
              description: "Generate multiple versions optimized for different tones and audiences to maximize conversion",
              color: "purple"
            },
            {
              icon: Upload,
              title: "Reference Documents",
              description: "Upload brand guides and past reports for AI to maintain consistent voice and style",
              color: "blue"
            },
            {
              icon: Link2,
              title: "Live Data Integration",
              description: "Pull real-time trends and market data to keep your content current and relevant",
              color: "green"
            }
          ].map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Card key={idx} className="border-2 border-gray-200">
                <CardContent className="pt-6">
                  <div className={`w-12 h-12 rounded-lg bg-${feature.color}-100 flex items-center justify-center mb-3`}>
                    <Icon className={`w-6 h-6 text-${feature.color}-600`} />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
