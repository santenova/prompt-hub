import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Plus, GripVertical, Settings2, Play, AlertCircle, Layout } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import StepConfigurator from "./StepConfigurator";
import VisualWorkflowBuilder from "./VisualWorkflowBuilder";

export default function PipelineBuilder({ workflow, onSave, onCancel }) {
  const [name, setName] = useState(workflow?.name || '');
  const [description, setDescription] = useState(workflow?.description || '');
  const [category, setCategory] = useState(workflow?.category || 'Custom');
  const [steps, setSteps] = useState(workflow?.steps || []);
  const [connections, setConnections] = useState(workflow?.connections || []);
  const [expandedStep, setExpandedStep] = useState(null);
  const [errors, setErrors] = useState({});
  const [viewMode, setViewMode] = useState('visual'); // 'visual' or 'list'

  const addStep = () => {
    const newStep = {
      id: Math.max(...steps.map(s => s.id), -1) + 1,
      template_id: '',
      persona_id: '',
      custom_prompt: '',
      output_variable: `output_${Date.now()}`,
      model_params: { temperature: 0.7, top_p: 1, max_tokens: 500 }
    };
    setSteps([...steps, newStep]);
    setExpandedStep(newStep.id);
  };

  const updateStep = (id, updates) => {
    setSteps(steps.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteStep = (id) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  const moveStep = (id, direction) => {
    const idx = steps.findIndex(s => s.id === id);
    if ((direction === 'up' && idx > 0) || (direction === 'down' && idx < steps.length - 1)) {
      const newSteps = [...steps];
      [newSteps[idx], newSteps[idx + (direction === 'up' ? -1 : 1)]] = [newSteps[idx + (direction === 'up' ? -1 : 1)], newSteps[idx]];
      setSteps(newSteps);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Pipeline name is required';
    if (steps.length === 0) newErrors.steps = 'At least one step is required';
    steps.forEach((step, idx) => {
      if (!step.template_id && !step.custom_prompt) {
        newErrors[`step_${step.id}`] = 'Template or custom prompt required';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave({ name, description, category, steps, connections });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <CardTitle>Create Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Pipeline Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Blog Post Generator"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this pipeline do?"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Content Creation">Content Creation</SelectItem>
                <SelectItem value="Research">Research</SelectItem>
                <SelectItem value="Analysis">Analysis</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Development">Development</SelectItem>
                <SelectItem value="Custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Steps Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Workflow Steps</CardTitle>
            <div className="flex items-center gap-2">
              <Tabs value={viewMode} onValueChange={setViewMode}>
                <TabsList>
                  <TabsTrigger value="visual">
                    <Layout className="w-3 h-3 mr-1" />
                    Visual
                  </TabsTrigger>
                  <TabsTrigger value="list">List</TabsTrigger>
                </TabsList>
              </Tabs>
              {viewMode === 'list' && (
                <Button onClick={addStep} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Step
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {viewMode === 'visual' ? (
            <VisualWorkflowBuilder 
              steps={steps}
              onStepsChange={setSteps}
              connections={connections}
              onConnectionsChange={setConnections}
            />
          ) : (
            <>
              {errors.steps && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-red-700">{errors.steps}</p>
                </div>
              )}

              <AnimatePresence>
                {steps.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No steps yet. Add one to get started.</p>
                ) : (
                  steps.map((step, idx) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Card className="bg-gray-50 border-l-4 border-l-indigo-600">
                        <div
                          className="p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Badge variant="outline" className="h-6 w-6 flex items-center justify-center p-0">
                                {idx + 1}
                              </Badge>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {step.template_id ? `Template: ${step.template_id}` : 'Custom Prompt'}
                                </p>
                                <p className="text-xs text-gray-600">{step.output_variable}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {errors[`step_${step.id}`] && (
                                <AlertCircle className="w-4 h-4 text-red-600" />
                              )}
                              {expandedStep !== step.id && <Settings2 className="w-4 h-4 text-gray-400" />}
                            </div>
                          </div>
                        </div>

                        <AnimatePresence>
                          {expandedStep === step.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t"
                            >
                              <div className="p-4 space-y-4">
                                <StepConfigurator
                                  step={step}
                                  onUpdate={(updates) => updateStep(step.id, updates)}
                                  error={errors[`step_${step.id}`]}
                                  pipelineDescription={description}
                                />

                                <div className="flex gap-2 justify-between pt-3 border-t">
                                  <div className="flex gap-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => moveStep(step.id, 'up')}
                                      disabled={idx === 0}
                                    >
                                      ↑
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => moveStep(step.id, 'down')}
                                      disabled={idx === steps.length - 1}
                                    >
                                      ↓
                                    </Button>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteStep(step.id)}
                                    className="text-red-600 hover:bg-red-50"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave} className="bg-gradient-to-r from-indigo-600 to-purple-600">
          <Play className="w-4 h-4 mr-2" />
          Save & Test
        </Button>
      </div>
    </div>
  );
}