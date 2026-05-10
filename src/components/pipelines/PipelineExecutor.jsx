import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Play, Loader, CheckCircle, AlertCircle, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/apis/client";

export default function PipelineExecutor({ workflow, onClose }) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [inputs, setInputs] = useState({});
  const [error, setError] = useState(null);

  const executePipeline = async () => {
    setIsRunning(true);
    setError(null);
    try {
      let context = { ...inputs };

      for (const step of workflow.steps) {
        try {
          // Get template content if using template
          let prompt = step.custom_prompt || '';
          if (step.template_id) {
            const template = await apiClient.entities.Template.list();
            const found = Array.isArray(template) ? template.find(t => t.id === step.template_id) : null;
            if (found) prompt = found.content;
          }

          // Replace variables in prompt
          Object.entries(context).forEach(([key, value]) => {
            prompt = prompt.replace(new RegExp(`{${key}}`, 'g'), value);
          });

          // Get persona instructions if selected
          let personaInstructions = '';
          if (step.persona_id) {
            const personas = await apiClient.entities.Persona.list();
            const persona = Array.isArray(personas) ? personas.find(p => p.id === step.persona_id) : null;
            if (persona) {
              personaInstructions = `You are ${persona.name}. ${persona.description}\n\nInstructions: ${persona.instructions || ''}\n\n`;
            }
          }

          // Call LLM with persona context
          const response = await apiClient.integrations.Core.InvokeLLMwithLogging({
            prompt: personaInstructions + prompt,
            response_json_schema: {
              type: 'object',
              properties: {
                result: { type: 'string' }
              }
            }
          });

          context[step.output_variable] = response.result || response;
        } catch (stepError) {
          setError(`Step failed: ${stepError.message}`);
          break;
        }
      }

      setResults(context);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const copyResult = (key, value) => {
    navigator.clipboard.writeText(typeof value === 'string' ? value : JSON.stringify(value, null, 2));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{workflow.name}</CardTitle>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input Variables */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">Input Variables</p>
            {workflow.steps.slice(0, 1).map((step, idx) => (
              <div key={idx}>
                <label className="text-sm text-gray-600 block mb-1">Initial Prompt Input</label>
                <Textarea
                  value={inputs.input || ''}
                  onChange={(e) => setInputs({ ...inputs, input: e.target.value })}
                  placeholder="Enter your initial input..."
                  className="min-h-20"
                  disabled={isRunning}
                />
              </div>
            ))}
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <Button
            onClick={executePipeline}
            disabled={isRunning || !workflow.steps.length}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
          >
            {isRunning ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Running Pipeline...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Execute Pipeline
              </>
            )}
          </Button>

          {/* Results */}
          <AnimatePresence>
            {results && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 pt-4 border-t"
              >
                <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Pipeline Results
                </p>
                {Object.entries(results).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 p-3 rounded border">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{key}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyResult(key, value)}
                        className="h-6 w-6"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap max-h-24 overflow-y-auto">
                      {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                    </p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
