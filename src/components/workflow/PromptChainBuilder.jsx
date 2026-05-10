import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  ArrowRight,
  Play,
  Loader2,
  ChevronDown,
  ChevronUp,
  Copy,
  Settings,
  Zap,
  Edit,
  GitBranch,
  CheckCircle2,
  Save,
  FolderOpen,
  GitMerge,
  AlertTriangle,
  RotateCcw,
  AlertCircle,
  X
} from 'lucide-react';
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/apis/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function PromptChainBuilder({
  templates = [],
  personas = [],
  selectedEndpoint,
  selectedModel,
  onExecuteChain,
  currentUserEmail
}) {
  const [chainSteps, setChainSteps] = useState([
    { 
      id: Date.now(),
      stepType: 'prompt', // 'prompt' or 'api'
      template: null, 
      persona: null, 
      customPrompt: '', 
      outputVariable: 'output_1',
      modelParams: { temperature: 0.7, top_p: 0.9, max_tokens: 1000 },
      conditionalLogic: { enabled: false },
      errorHandling: { retryCount: 1, skipOnError: false },
      apiConfig: null // For API steps
    }
  ]);
  const [executionResults, setExecutionResults] = useState({});
  const [executionErrors, setExecutionErrors] = useState({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const [expandedSteps, setExpandedSteps] = useState([0]);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  
  const queryClient = useQueryClient();

  const { data: workflows = [] } = useQuery({
    queryKey: ['workflows', currentUserEmail],
    queryFn: () => apiClient.entities.Workflow.list('-updated_date'),
    enabled: !!currentUserEmail,
  });

  const { data: apiConfigurations = [] } = useQuery({
    queryKey: ['apiConfigurations', currentUserEmail],
    queryFn: () => apiClient.entities.APIConfiguration.list('-updated_date'),
    enabled: !!currentUserEmail,
  });

  const saveWorkflowMutation = useMutation({
    mutationFn: (data) => apiClient.entities.Workflow.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setShowSaveDialog(false);
    },
  });

  const addStep = (stepType = 'prompt') => {
    const newStep = {
      id: Date.now(),
      stepType,
      template: null,
      persona: null,
      customPrompt: '',
      outputVariable: `output_${chainSteps.length + 1}`,
      modelParams: { temperature: 0.7, top_p: 0.9, max_tokens: 1000 },
      conditionalLogic: { enabled: false },
      errorHandling: { retryCount: 1, skipOnError: false },
      apiConfig: stepType === 'api' ? {
        configId: null,
        endpoint: '',
        method: 'GET',
        headers: {},
        body: '',
        queryParams: {}
      } : null
    };
    setChainSteps([...chainSteps, newStep]);
    setExpandedSteps([...expandedSteps, chainSteps.length]);
  };

  const removeStep = (index) => {
    if (chainSteps.length === 1) return;
    setChainSteps(chainSteps.filter((_, i) => i !== index));
    setExpandedSteps(expandedSteps.filter(i => i !== index).map(i => i > index ? i - 1 : i));
  };

  const updateStep = (index, updates) => {
    const updated = [...chainSteps];
    updated[index] = { ...updated[index], ...updates };
    setChainSteps(updated);
  };

  const toggleStepExpand = (index) => {
    setExpandedSteps(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const buildPromptWithVariables = (step, previousOutputs) => {
    let prompt = step.customPrompt || step.template?.content || '';
    
    // Replace previous output variables
    Object.entries(previousOutputs).forEach(([varName, value]) => {
      prompt = prompt.replaceAll(`{${varName}}`, value);
    });

    // Add persona context if selected
    if (step.persona) {
      const personaContext = `You are ${step.persona.name}. ${step.persona.description || ''} ${step.persona.instructions || ''}`;
      prompt = `${personaContext}\n\n---\n\n${prompt}`;
    }

    return prompt;
  };

  const evaluateCondition = (condition, previousOutputs) => {
    if (!condition.enabled) return true;
    
    const sourceValue = previousOutputs[condition.sourceVariable] || '';
    
    switch (condition.conditionType) {
      case 'contains':
        return sourceValue.toLowerCase().includes(condition.conditionValue.toLowerCase());
      case 'equals':
        return sourceValue.toLowerCase() === condition.conditionValue.toLowerCase();
      case 'length_gt':
        return sourceValue.length > parseInt(condition.conditionValue);
      case 'length_lt':
        return sourceValue.length < parseInt(condition.conditionValue);
      default:
        return true;
    }
  };

  const executeChain = async () => {
    if (!selectedEndpoint || !selectedModel) {
      alert('Please configure Ollama endpoint and model');
      return;
    }

    setIsExecuting(true);
    setExecutionResults({});
    setExecutionErrors({});
    const results = {};
    const errors = {};

    try {
      let i = 0;
      while (i < chainSteps.length) {
        const step = chainSteps[i];
        setCurrentStep(i);

        // Check conditional logic
        if (step.conditionalLogic?.enabled && i > 0) {
          const conditionMet = evaluateCondition(step.conditionalLogic, results);
          if (!conditionMet && step.conditionalLogic.onFailureGoto !== undefined) {
            i = step.conditionalLogic.onFailureGoto;
            continue;
          } else if (conditionMet && step.conditionalLogic.onSuccessGoto !== undefined) {
            i = step.conditionalLogic.onSuccessGoto;
            continue;
          }
        }

        let retries = step.errorHandling?.retryCount || 1;
        let success = false;

        while (retries > 0 && !success) {
          try {
            // Handle API steps
            if (step.stepType === 'api' && step.apiConfig) {
              const apiResult = await executeAPIStep(step, results);
              results[step.outputVariable] = apiResult;
              setExecutionResults(prev => ({
                ...prev,
                [step.outputVariable]: apiResult
              }));
              success = true;
              continue;
            }

            // Handle prompt steps
            const finalPrompt = buildPromptWithVariables(step, results);
            const { data: chatData } = await apiClient.functions.invoke('ollamaProxy', {
              endpoint: selectedEndpoint,
              action: 'chat',
              model: selectedModel,
              messages: [{ role: 'user', content: finalPrompt }],
              options: {
                stream: false,
                temperature: step.modelParams?.temperature || 0.7,
                top_p: step.modelParams?.top_p || 0.9,
                max_tokens: step.modelParams?.max_tokens || 1000
              }
            });

            const fullResponse = chatData?.message?.content || '';
            setExecutionResults(prev => ({ ...prev, [step.outputVariable]: fullResponse }));
            results[step.outputVariable] = fullResponse;
            success = true;

          } catch (error) {
            retries--;
            if (retries === 0) {
              // Use fallback if available
              if (step.errorHandling?.fallbackPrompt) {
                results[step.outputVariable] = step.errorHandling.fallbackPrompt;
                errors[i] = `Failed, used fallback: ${error.message}`;
              } else if (step.errorHandling?.skipOnError) {
                results[step.outputVariable] = '';
                errors[i] = `Skipped due to error: ${error.message}`;
              } else {
                throw error;
              }
              setExecutionErrors(errors);
            }
          }
        }

        i++;
      }

      if (onExecuteChain) {
        onExecuteChain(results);
      }
    } catch (error) {
      console.error('Chain execution error:', error);
      alert(`Workflow failed at step ${currentStep + 1}: ${error.message}`);
    } finally {
      setIsExecuting(false);
      setCurrentStep(null);
    }
  };

  const handleEditStep = (index) => {
    setEditingStep({ index, ...chainSteps[index] });
    setShowEditDialog(true);
  };

  const saveEditedStep = () => {
    if (editingStep) {
      updateStep(editingStep.index, {
        customPrompt: editingStep.customPrompt,
        template: editingStep.template,
        persona: editingStep.persona,
        outputVariable: editingStep.outputVariable,
        modelParams: editingStep.modelParams,
        conditionalLogic: editingStep.conditionalLogic,
        errorHandling: editingStep.errorHandling
      });
    }
    setShowEditDialog(false);
    setEditingStep(null);
  };

  const handleSaveWorkflow = async () => {
    if (!workflowName.trim()) {
      alert('Please enter a workflow name');
      return;
    }

    const workflowData = {
      name: workflowName,
      description: workflowDescription,
      category: 'Custom',
      steps: chainSteps.map(step => ({
        id: step.id,
        step_type: step.stepType,
        template_id: step.template?.id,
        persona_id: step.persona?.id,
        custom_prompt: step.customPrompt,
        output_variable: step.outputVariable,
        model_params: step.modelParams,
        conditional_logic: step.conditionalLogic,
        error_handling: step.errorHandling,
        api_config: step.apiConfig
      }))
    };

    saveWorkflowMutation.mutate(workflowData);
  };

  const executeAPIStep = async (step, previousOutputs) => {
    const apiConfig = apiConfigurations.find(c => c.id === step.apiConfig.configId);
    if (!apiConfig) {
      throw new Error('API configuration not found');
    }

    // Build URL with variable replacement
    let url = apiConfig.base_url + step.apiConfig.endpoint;
    Object.entries(previousOutputs).forEach(([varName, value]) => {
      url = url.replaceAll(`{${varName}}`, encodeURIComponent(value));
    });

    // Build headers
    const headers = {
      'Content-Type': 'application/json',
      ...apiConfig.default_headers,
      ...step.apiConfig.headers
    };

    // Add authentication
    if (apiConfig.auth_type === 'api_key' && apiConfig.auth_config?.api_key_header) {
      headers[apiConfig.auth_config.api_key_header] = apiConfig.auth_config.api_key_encrypted;
    } else if (apiConfig.auth_type === 'bearer_token') {
      headers['Authorization'] = `Bearer ${apiConfig.auth_config.api_key_encrypted}`;
    }

    // Build body with variable replacement
    let body = step.apiConfig.body;
    Object.entries(previousOutputs).forEach(([varName, value]) => {
      body = body.replaceAll(`{${varName}}`, value);
    });

    const requestOptions = {
      method: step.apiConfig.method,
      headers
    };

    if (step.apiConfig.method !== 'GET' && body) {
      requestOptions.body = body;
    }

    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return JSON.stringify(data, null, 2);
  };

  const handleLoadWorkflow = (workflow) => {
    const loadedSteps = workflow.steps.map(step => ({
      id: step.id,
      stepType: step.step_type || 'prompt',
      template: templates.find(t => t.id === step.template_id) || null,
      persona: personas.find(p => p.id === step.persona_id) || null,
      customPrompt: step.custom_prompt || '',
      outputVariable: step.output_variable,
      modelParams: step.model_params || { temperature: 0.7, top_p: 0.9, max_tokens: 1000 },
      conditionalLogic: step.conditional_logic || { enabled: false },
      errorHandling: step.error_handling || { retryCount: 1, skipOnError: false },
      apiConfig: step.api_config || null
    }));
    
    setChainSteps(loadedSteps);
    setExpandedSteps(loadedSteps.map((_, idx) => idx));
    setShowLoadDialog(false);
  };

  return (
    <div className="space-y-4">
      {/* Chain Flow Visualization */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-purple-600" />
              Prompt Chain Workflow
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLoadDialog(true)}
                disabled={isExecuting}
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Load
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSaveDialog(true)}
                disabled={isExecuting || chainSteps.length === 0}
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addStep('prompt')}
                  disabled={isExecuting}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  AI Step
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addStep('api')}
                  disabled={isExecuting}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  API Step
                </Button>
              </div>
              <Button
                onClick={executeChain}
                disabled={isExecuting || chainSteps.length === 0}
                className="bg-gradient-to-r from-purple-600 to-indigo-600"
                size="sm"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Execute Chain
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Flow Diagram */}
          <div className="relative">
            <AnimatePresence>
              {chainSteps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-4"
                >
                  <div className="relative">
                    {/* Step Card */}
                    <Card className={`border-2 transition-all ${
                      currentStep === index
                        ? 'border-purple-500 shadow-lg'
                        : executionResults[step.outputVariable]
                        ? 'border-green-500'
                        : 'border-gray-200'
                    }`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white ${
                              currentStep === index
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600'
                                : executionResults[step.outputVariable]
                                ? 'bg-green-600'
                                : 'bg-gray-400'
                            }`}>
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={step.stepType === 'api' ? 'bg-green-600' : 'bg-purple-600'}>
                                  {step.stepType === 'api' ? 'API' : 'AI'}
                                </Badge>
                                <h4 className="font-semibold text-gray-900">
                                  {step.stepType === 'api' 
                                    ? (step.apiConfig?.endpoint || 'API Call')
                                    : (step.template?.title || 'Custom Prompt')}
                                </h4>
                                {executionResults[step.outputVariable] && (
                                  <Badge className="bg-green-100 text-green-800 border-green-200">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Complete
                                  </Badge>
                                )}
                                {currentStep === index && (
                                  <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                                    <Zap className="w-3 h-3 mr-1" />
                                    Running
                                  </Badge>
                                )}
                                {executionErrors[index] && (
                                  <Badge className="bg-red-100 text-red-800 border-red-200">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Error
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                               {step.persona && (
                                 <Badge variant="outline" className="text-xs">
                                   👤 {step.persona.name}
                                 </Badge>
                               )}
                               <Badge variant="outline" className="text-xs">
                                 → {step.outputVariable}
                               </Badge>
                               {step.conditionalLogic?.enabled && (
                                 <Badge className="bg-blue-100 text-blue-700 text-xs">
                                   <GitMerge className="w-3 h-3 mr-1" />
                                   Conditional
                                 </Badge>
                               )}
                               {step.errorHandling?.retryCount > 1 && (
                                 <Badge className="bg-orange-100 text-orange-700 text-xs">
                                   <RotateCcw className="w-3 h-3 mr-1" />
                                   {step.errorHandling.retryCount}x retry
                                 </Badge>
                               )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditStep(index)}
                              disabled={isExecuting}
                              className="h-8 w-8"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleStepExpand(index)}
                              className="h-8 w-8"
                            >
                              {expandedSteps.includes(index) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                            {chainSteps.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeStep(index)}
                                disabled={isExecuting}
                                className="h-8 w-8 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      {/* Expanded Content */}
                      {expandedSteps.includes(index) && (
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            {step.stepType === 'prompt' ? (
                              <>
                                {/* Template Selection */}
                                <div>
                                  <Label className="text-xs text-gray-600">Template</Label>
                                  <Select
                                    value={step.template?.id || 'custom'}
                                    onValueChange={(value) => {
                                      const template = templates.find(t => t.id === value);
                                      updateStep(index, {
                                        template,
                                        customPrompt: template ? template.content : step.customPrompt
                                      });
                                    }}
                                    disabled={isExecuting}
                                  >
                                    <SelectTrigger className="h-9">
                                      <SelectValue placeholder="Select template" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="custom">Custom Prompt</SelectItem>
                                      {templates.map(t => (
                                        <SelectItem key={t.id} value={t.id}>
                                          {t.title}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Persona Selection */}
                                <div>
                                  <Label className="text-xs text-gray-600">Persona (Optional)</Label>
                                  <Select
                                    value={step.persona?.id || 'none'}
                                    onValueChange={(value) => {
                                      const persona = personas.find(p => p.id === value);
                                      updateStep(index, { persona: value === 'none' ? null : persona });
                                    }}
                                    disabled={isExecuting}
                                  >
                                    <SelectTrigger className="h-9">
                                      <SelectValue placeholder="No persona" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">No persona</SelectItem>
                                      {personas.map(p => (
                                        <SelectItem key={p.id} value={p.id}>
                                          {p.icon} {p.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </>
                            ) : (
                              <>
                                {/* API Configuration */}
                                <div>
                                  <Label className="text-xs text-gray-600">API Configuration</Label>
                                  <Select
                                    value={step.apiConfig?.configId || 'none'}
                                    onValueChange={(value) => {
                                      updateStep(index, {
                                        apiConfig: {
                                          ...step.apiConfig,
                                          configId: value === 'none' ? null : value
                                        }
                                      });
                                    }}
                                    disabled={isExecuting}
                                  >
                                    <SelectTrigger className="h-9">
                                      <SelectValue placeholder="Select API" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">None</SelectItem>
                                      {apiConfigurations.map(api => (
                                        <SelectItem key={api.id} value={api.id}>
                                          {api.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* API Endpoint */}
                                <div>
                                  <Label className="text-xs text-gray-600">Endpoint Path</Label>
                                  <Input
                                    value={step.apiConfig?.endpoint || ''}
                                    onChange={(e) => updateStep(index, {
                                      apiConfig: { ...step.apiConfig, endpoint: e.target.value }
                                    })}
                                    placeholder="/endpoint/path"
                                    disabled={isExecuting}
                                    className="h-9 font-mono text-xs"
                                  />
                                </div>

                                {/* HTTP Method */}
                                <div>
                                  <Label className="text-xs text-gray-600">HTTP Method</Label>
                                  <Select
                                    value={step.apiConfig?.method || 'GET'}
                                    onValueChange={(value) => updateStep(index, {
                                      apiConfig: { ...step.apiConfig, method: value }
                                    })}
                                    disabled={isExecuting}
                                  >
                                    <SelectTrigger className="h-9">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="GET">GET</SelectItem>
                                      <SelectItem value="POST">POST</SelectItem>
                                      <SelectItem value="PUT">PUT</SelectItem>
                                      <SelectItem value="PATCH">PATCH</SelectItem>
                                      <SelectItem value="DELETE">DELETE</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Request Body */}
                                {step.apiConfig?.method !== 'GET' && (
                                  <div>
                                    <Label className="text-xs text-gray-600">Request Body (JSON)</Label>
                                    <Textarea
                                      value={step.apiConfig?.body || ''}
                                      onChange={(e) => updateStep(index, {
                                        apiConfig: { ...step.apiConfig, body: e.target.value }
                                      })}
                                      placeholder='{"key": "{output_1}"}'
                                      disabled={isExecuting}
                                      className="h-20 font-mono text-xs"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                      Use <code className="bg-gray-100 px-1 rounded">{'{output_1}'}</code> to reference previous outputs
                                    </p>
                                  </div>
                                )}
                              </>
                            )}

                            {/* Output Variable */}
                            <div>
                              <Label className="text-xs text-gray-600">Output Variable Name</Label>
                              <Input
                                value={step.outputVariable}
                                onChange={(e) => updateStep(index, { outputVariable: e.target.value })}
                                placeholder="e.g., summary_1"
                                disabled={isExecuting}
                                className="h-9"
                              />
                            </div>

                            {/* Error Display */}
                            {executionErrors[index] && (
                              <Alert className="bg-red-50 border-red-200">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                <AlertDescription className="text-red-800 text-xs">
                                  {executionErrors[index]}
                                </AlertDescription>
                              </Alert>
                            )}

                            {/* Output Preview */}
                            {executionResults[step.outputVariable] && (
                              <div className="mt-3">
                                <div className="flex items-center justify-between mb-2">
                                  <Label className="text-xs text-green-700 font-semibold">Output:</Label>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigator.clipboard.writeText(executionResults[step.outputVariable])}
                                    className="h-6 text-xs"
                                  >
                                    <Copy className="w-3 h-3 mr-1" />
                                    Copy
                                  </Button>
                                </div>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                  <p className="text-xs text-gray-800 whitespace-pre-wrap line-clamp-4">
                                    {executionResults[step.outputVariable]}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>

                    {/* Arrow Connector */}
                    {index < chainSteps.length - 1 && (
                      <div className="flex justify-center my-2">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-0.5 bg-purple-300" />
                          <ArrowRight className="w-5 h-5 text-purple-600" />
                          <div className="h-8 w-0.5 bg-purple-300" />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Usage Instructions */}
          {chainSteps.length === 1 && !isExecuting && Object.keys(executionResults).length === 0 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 How to use Prompt Chains:</h4>
              <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
                <li>Add multiple steps to create a workflow</li>
                <li>Use output variables like <code className="bg-blue-100 px-1 rounded">{'{output_1}'}</code> in later steps</li>
                <li>Each step can use a different template and persona</li>
                <li>Execute the entire chain with one click</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Step Dialog - Enhanced */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Configure Step {editingStep ? editingStep.index + 1 : ''}</DialogTitle>
          </DialogHeader>
          {editingStep && (
            <Tabs defaultValue={editingStep.stepType === 'api' ? 'api' : 'prompt'} className="w-full">
              <TabsList className={`grid w-full ${editingStep.stepType === 'api' ? 'grid-cols-3' : 'grid-cols-4'}`}>
                {editingStep.stepType === 'prompt' && <TabsTrigger value="prompt">Prompt</TabsTrigger>}
                {editingStep.stepType === 'api' && <TabsTrigger value="api">API Config</TabsTrigger>}
                {editingStep.stepType === 'prompt' && <TabsTrigger value="params">Parameters</TabsTrigger>}
                <TabsTrigger value="conditional">Conditional</TabsTrigger>
                <TabsTrigger value="error">Error Handling</TabsTrigger>
              </TabsList>

              <ScrollArea className="max-h-[60vh] mt-4">
                {editingStep.stepType === 'prompt' && (
                  <TabsContent value="prompt" className="space-y-4">
                    <div>
                      <Label>Custom Prompt</Label>
                      <Textarea
                        value={editingStep.customPrompt}
                        onChange={(e) => setEditingStep({ ...editingStep, customPrompt: e.target.value })}
                        placeholder="Enter custom prompt or modify template..."
                        className="min-h-[250px] font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use variables from previous steps like <code className="bg-gray-100 px-1 rounded">{'{output_1}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{output_2}'}</code>, etc.
                      </p>
                    </div>
                  </TabsContent>
                )}

                {editingStep.stepType === 'api' && (
                  <TabsContent value="api" className="space-y-4">
                    <Alert className="bg-green-50 border-green-200">
                      <Zap className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800 text-sm">
                        Configure API calls to fetch external data and use responses in subsequent AI steps.
                      </AlertDescription>
                    </Alert>

                    <div>
                      <Label>API Configuration</Label>
                      <Select
                        value={editingStep.apiConfig?.configId || 'none'}
                        onValueChange={(value) => setEditingStep({
                          ...editingStep,
                          apiConfig: { ...editingStep.apiConfig, configId: value === 'none' ? null : value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select API" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None configured</SelectItem>
                          {apiConfigurations.map(api => (
                            <SelectItem key={api.id} value={api.id}>
                              {api.name} - {api.base_url}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        Go to Settings to configure API endpoints and authentication
                      </p>
                    </div>

                    <div>
                      <Label>Endpoint Path</Label>
                      <Input
                        value={editingStep.apiConfig?.endpoint || ''}
                        onChange={(e) => setEditingStep({
                          ...editingStep,
                          apiConfig: { ...editingStep.apiConfig, endpoint: e.target.value }
                        })}
                        placeholder="/api/v1/endpoint"
                        className="font-mono"
                      />
                    </div>

                    <div>
                      <Label>HTTP Method</Label>
                      <Select
                        value={editingStep.apiConfig?.method || 'GET'}
                        onValueChange={(value) => setEditingStep({
                          ...editingStep,
                          apiConfig: { ...editingStep.apiConfig, method: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="PATCH">PATCH</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {editingStep.apiConfig?.method !== 'GET' && (
                      <div>
                        <Label>Request Body (JSON)</Label>
                        <Textarea
                          value={editingStep.apiConfig?.body || ''}
                          onChange={(e) => setEditingStep({
                            ...editingStep,
                            apiConfig: { ...editingStep.apiConfig, body: e.target.value }
                          })}
                          placeholder='{\n  "query": "{output_1}",\n  "max_results": 10\n}'
                          className="min-h-[150px] font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Reference previous outputs: <code className="bg-gray-100 px-1 rounded">{'{output_1}'}</code>
                        </p>
                      </div>
                    )}
                  </TabsContent>
                )}

                <TabsContent value="params" className="space-y-4">
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="text-sm font-semibold text-purple-900 mb-3">Model Parameters</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <Label className="text-sm">Temperature: {editingStep.modelParams?.temperature || 0.7}</Label>
                        </div>
                        <Slider
                          value={[editingStep.modelParams?.temperature || 0.7]}
                          onValueChange={([value]) => setEditingStep({
                            ...editingStep,
                            modelParams: { ...editingStep.modelParams, temperature: value }
                          })}
                          min={0}
                          max={2}
                          step={0.1}
                        />
                        <p className="text-xs text-gray-600 mt-1">Controls randomness (0=focused, 2=creative)</p>
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <Label className="text-sm">Top P: {editingStep.modelParams?.top_p || 0.9}</Label>
                        </div>
                        <Slider
                          value={[editingStep.modelParams?.top_p || 0.9]}
                          onValueChange={([value]) => setEditingStep({
                            ...editingStep,
                            modelParams: { ...editingStep.modelParams, top_p: value }
                          })}
                          min={0}
                          max={1}
                          step={0.05}
                        />
                        <p className="text-xs text-gray-600 mt-1">Controls diversity via nucleus sampling</p>
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <Label className="text-sm">Max Tokens: {editingStep.modelParams?.max_tokens || 1000}</Label>
                        </div>
                        <Slider
                          value={[editingStep.modelParams?.max_tokens || 1000]}
                          onValueChange={([value]) => setEditingStep({
                            ...editingStep,
                            modelParams: { ...editingStep.modelParams, max_tokens: value }
                          })}
                          min={100}
                          max={4000}
                          step={100}
                        />
                        <p className="text-xs text-gray-600 mt-1">Maximum response length</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="conditional" className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-blue-900">Conditional Logic</h4>
                      <Switch
                        checked={editingStep.conditionalLogic?.enabled || false}
                        onCheckedChange={(checked) => setEditingStep({
                          ...editingStep,
                          conditionalLogic: { ...editingStep.conditionalLogic, enabled: checked }
                        })}
                      />
                    </div>
                    
                    {editingStep.conditionalLogic?.enabled && (
                      <div className="space-y-3 mt-4">
                        <div>
                          <Label className="text-xs">Check Variable</Label>
                          <Input
                            value={editingStep.conditionalLogic?.sourceVariable || ''}
                            onChange={(e) => setEditingStep({
                              ...editingStep,
                              conditionalLogic: { ...editingStep.conditionalLogic, sourceVariable: e.target.value }
                            })}
                            placeholder="e.g., output_1"
                            className="h-9"
                          />
                        </div>

                        <div>
                          <Label className="text-xs">Condition Type</Label>
                          <Select
                            value={editingStep.conditionalLogic?.conditionType || 'contains'}
                            onValueChange={(value) => setEditingStep({
                              ...editingStep,
                              conditionalLogic: { ...editingStep.conditionalLogic, conditionType: value }
                            })}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="contains">Contains Text</SelectItem>
                              <SelectItem value="equals">Equals</SelectItem>
                              <SelectItem value="length_gt">Length Greater Than</SelectItem>
                              <SelectItem value="length_lt">Length Less Than</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-xs">Condition Value</Label>
                          <Input
                            value={editingStep.conditionalLogic?.conditionValue || ''}
                            onChange={(e) => setEditingStep({
                              ...editingStep,
                              conditionalLogic: { ...editingStep.conditionalLogic, conditionValue: e.target.value }
                            })}
                            placeholder="Enter value to check"
                            className="h-9"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">If True, Go to Step</Label>
                            <Input
                              type="number"
                              value={editingStep.conditionalLogic?.onSuccessGoto ?? ''}
                              onChange={(e) => setEditingStep({
                                ...editingStep,
                                conditionalLogic: { ...editingStep.conditionalLogic, onSuccessGoto: e.target.value ? parseInt(e.target.value) : undefined }
                              })}
                              placeholder="Next step"
                              className="h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">If False, Go to Step</Label>
                            <Input
                              type="number"
                              value={editingStep.conditionalLogic?.onFailureGoto ?? ''}
                              onChange={(e) => setEditingStep({
                                ...editingStep,
                                conditionalLogic: { ...editingStep.conditionalLogic, onFailureGoto: e.target.value ? parseInt(e.target.value) : undefined }
                              })}
                              placeholder="Next step"
                              className="h-9"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="error" className="space-y-4">
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <h4 className="text-sm font-semibold text-orange-900 mb-3">Error Handling</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Retry Attempts</Label>
                        <Input
                          type="number"
                          min="1"
                          max="5"
                          value={editingStep.errorHandling?.retryCount || 1}
                          onChange={(e) => setEditingStep({
                            ...editingStep,
                            errorHandling: { ...editingStep.errorHandling, retryCount: parseInt(e.target.value) || 1 }
                          })}
                          className="h-9"
                        />
                        <p className="text-xs text-gray-600 mt-1">Number of times to retry on failure</p>
                      </div>

                      <div>
                        <Label className="text-xs">Fallback Response</Label>
                        <Textarea
                          value={editingStep.errorHandling?.fallbackPrompt || ''}
                          onChange={(e) => setEditingStep({
                            ...editingStep,
                            errorHandling: { ...editingStep.errorHandling, fallbackPrompt: e.target.value }
                          })}
                          placeholder="Default text to use if step fails..."
                          className="h-20 text-sm"
                        />
                        <p className="text-xs text-gray-600 mt-1">Used as output if all retries fail</p>
                      </div>

                      <div className="flex items-center justify-between bg-white p-3 rounded border">
                        <div>
                          <Label className="text-xs font-semibold">Skip on Error</Label>
                          <p className="text-xs text-gray-600">Continue to next step if this fails</p>
                        </div>
                        <Switch
                          checked={editingStep.errorHandling?.skipOnError || false}
                          onCheckedChange={(checked) => setEditingStep({
                            ...editingStep,
                            errorHandling: { ...editingStep.errorHandling, skipOnError: checked }
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </ScrollArea>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={saveEditedStep}>
                  Save Changes
                </Button>
              </div>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Save Workflow Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Workflow Name</Label>
              <Input
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="e.g., Content Creation Pipeline"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                placeholder="Describe what this workflow does..."
                className="h-20"
              />
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-800">
                This workflow has <strong>{chainSteps.length} step{chainSteps.length !== 1 ? 's' : ''}</strong> and can be reused anytime.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveWorkflow} disabled={saveWorkflowMutation.isPending}>
                {saveWorkflowMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Workflow
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Load Workflow Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Load Workflow</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-2">
              {workflows.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No saved workflows yet</p>
                </div>
              ) : (
                workflows.map((workflow) => (
                  <Card
                    key={workflow.id}
                    className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-purple-400"
                    onClick={() => handleLoadWorkflow(workflow)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{workflow.name}</h4>
                          <p className="text-xs text-gray-600 mb-2">{workflow.description}</p>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">
                              {workflow.steps.length} step{workflow.steps.length !== 1 ? 's' : ''}
                            </Badge>
                            {workflow.use_count > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                Used {workflow.use_count}×
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLoadWorkflow(workflow);
                          }}
                        >
                          <FolderOpen className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
