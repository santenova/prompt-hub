import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/apis/client";
import TemplateSelector from "./TemplateSelector";

export default function StepConfigurator({ step, onUpdate, error, pipelineDescription }) {
  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      try {
        const results = await apiClient.entities.Template.list('-use_count', 50);
        return Array.isArray(results) ? results.filter(t => t.title && t.content) : [];
      } catch {
        return [];
      }
    },
  });

  const { data: personas = [] } = useQuery({
    queryKey: ['personas'],
    queryFn: async () => {
      try {
        const results = await apiClient.entities.Persona.list('-use_count', 50);
        return Array.isArray(results) ? results.filter(p => p.name && p.description) : [];
      } catch {
        return [];
      }
    },
  });

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="source" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="source">Source</TabsTrigger>
          <TabsTrigger value="config">Config</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="source" className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Template {step.template_id && '✓'}
            </label>
            <TemplateSelector
              value={step.template_id}
              onChange={(templateId) => onUpdate({ template_id: templateId, custom_prompt: '' })}
              pipelineDescription={pipelineDescription}
            />
          </div>

          {!step.template_id && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Custom Prompt</label>
              <Textarea
                value={step.custom_prompt}
                onChange={(e) => onUpdate({ custom_prompt: e.target.value })}
                placeholder="Enter your prompt here. Use {variable} for dynamic values."
                className="min-h-24"
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Persona {step.persona_id && '✓'}
            </label>
            <Select value={step.persona_id || ''} onValueChange={(value) => onUpdate({ persona_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a persona..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>None - Default</SelectItem>
                {personas.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.icon} {p.name}
                    {p.category && ` (${p.category})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {step.persona_id && personas.find(p => p.id === step.persona_id) && (
              <p className="text-xs text-gray-600 mt-2 p-2 bg-blue-50 rounded">
                {personas.find(p => p.id === step.persona_id)?.description}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Output Variable Name</label>
            <Input
              value={step.output_variable}
              onChange={(e) => onUpdate({ output_variable: e.target.value })}
              placeholder="e.g., headline_output"
            />
            <p className="text-xs text-gray-600 mt-1">Use {`{${step.output_variable}}`} in later steps</p>
          </div>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Temperature: {step.model_params?.temperature?.toFixed(1)}
            </label>
            <Slider
              min={0}
              max={2}
              step={0.1}
              value={[step.model_params?.temperature || 0.7]}
              onValueChange={(value) =>
                onUpdate({
                  model_params: { ...step.model_params, temperature: value[0] }
                })
              }
              className="w-full"
            />
            <p className="text-xs text-gray-600 mt-1">Lower = focused, Higher = creative</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Max Tokens: {step.model_params?.max_tokens}
            </label>
            <Input
              type="number"
              value={step.model_params?.max_tokens}
              onChange={(e) =>
                onUpdate({
                  model_params: { ...step.model_params, max_tokens: parseInt(e.target.value) }
                })
              }
              min={10}
              max={4000}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Top P: {step.model_params?.top_p?.toFixed(1)}
            </label>
            <Slider
              min={0}
              max={1}
              step={0.1}
              value={[step.model_params?.top_p || 1]}
              onValueChange={(value) =>
                onUpdate({
                  model_params: { ...step.model_params, top_p: value[0] }
                })
              }
            />
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          {step.type === 'api_call' && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">API URL</label>
                <Input
                  value={step.api_config?.url || ''}
                  onChange={(e) => onUpdate({ 
                    api_config: { ...step.api_config, url: e.target.value }
                  })}
                  placeholder="https://api.example.com/endpoint"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Method</label>
                <Select 
                  value={step.api_config?.method || 'GET'} 
                  onValueChange={(value) => onUpdate({ 
                    api_config: { ...step.api_config, method: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step.type === 'condition' && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Condition Type</label>
                <Select 
                  value={step.conditional_logic?.condition_type || 'contains'}
                  onValueChange={(value) => onUpdate({
                    conditional_logic: { ...step.conditional_logic, enabled: true, condition_type: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contains">Contains text</SelectItem>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="not_equals">Not equals</SelectItem>
                    <SelectItem value="length_gt">Length greater than</SelectItem>
                    <SelectItem value="length_lt">Length less than</SelectItem>
                    <SelectItem value="regex_match">Regex match</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Compare Value</label>
                <Input
                  value={step.conditional_logic?.condition_value || ''}
                  onChange={(e) => onUpdate({
                    conditional_logic: { ...step.conditional_logic, condition_value: e.target.value }
                  })}
                  placeholder="Value to compare against"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Source Variable</label>
                <Input
                  value={step.conditional_logic?.source_variable || ''}
                  onChange={(e) => onUpdate({
                    conditional_logic: { ...step.conditional_logic, source_variable: e.target.value }
                  })}
                  placeholder="e.g., output_1"
                />
              </div>
            </>
          )}

          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-xs text-blue-700">
              💡 <strong>Tip:</strong> Use conditional logic to create branching workflows. Connect steps visually in the canvas to set up success/failure paths.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
