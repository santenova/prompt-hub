import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Wand2,
  GitBranch,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Brain,
  Zap,
  Server,
  FileText,
  FileCode // Added FileCode import
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { client } from "@/apis/client";
import { getOllamaEndpoint } from '@/lib/ollamaEndpoint';

const ollamaRequest = async (params) => {
  const { endpoint, action, model, messages, system, options } = params;
  if (action === 'list-models') {
    const res = await fetch(`${endpoint}/api/tags`);
    const data = await res.json();
    return { data: { models: (data.models || []).map(m => ({ id: m.name })) } };
  }
  const body = { model, messages: system ? [{ role: 'system', content: system }, ...messages] : messages, stream: false, ...options };
  const res = await fetch(`${endpoint}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json();
  return { data };
};

const contentTypes = [
  { value: "standard", label: "Standard Prompt", icon: "📝" },
  { value: "structured_outline", label: "Structured Outline", icon: "📋" },
  { value: "report", label: "Report with Sections", icon: "📄" },
  { value: "bullet_points", label: "Bullet Points", icon: "•" },
  { value: "short_essay", label: "Short Essay", icon: "📖" },
  { value: "markdown_table", label: "Markdown Table", icon: "📊" },
  { value: "json", label: "JSON Format", icon: "{ }" },
  { value: "code", label: "Code with Comments", icon: "💻" },
];

const outputFormats = [
  { value: "plain", label: "Plain Text", description: "Standard unformatted text" },
  { value: "markdown", label: "Markdown", description: "Formatted with markdown syntax" },
  { value: "html", label: "HTML", description: "Structured HTML markup" },
  { value: "json", label: "JSON", description: "Structured JSON data" }
];

// Helper functions for Ollama
const getOllamaEndpoints = () => {
  return [getOllamaEndpoint()];
};

const getDefaultModel = () => {
  try {
    return localStorage.getItem('ollama_default_model') || 'llama2';
  } catch (error) {
    console.error('Error reading default model:', error);
    return 'llama2';
  }
};

const getUseOllamaPreference = () => {
  try {
    const pref = localStorage.getItem('prefer_ollama_for_generation');
    return pref === 'true';
  } catch (error) {
    return false;
  }
};

const setUseOllamaPreference = (value) => {
  try {
    localStorage.setItem('prefer_ollama_for_generation', value.toString());
  } catch (error) {
    console.error('Error saving Ollama preference:', error);
  }
};

const safeStringify = (value) => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  try {
    return JSON.stringify(value, null, 2);
  } catch (e) {
    return String(value);
  }
};

export default function AITemplateGenerator({
  onApplyTemplate,
  initialPrompt,
  mode = 'create',
  existingTemplates = [],
  onSaveAsVersion
}) {
  const [description, setDescription] = useState(initialPrompt || "");
  const [contentType, setContentType] = useState("standard");
  const [outputFormat, setOutputFormat] = useState("plain"); // New state for output format
  const [generatedTemplate, setGeneratedTemplate] = useState(null);
  const [variations, setVariations] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(mode);
  const [useOllama, setUseOllama] = useState(getUseOllamaPreference());
  const [selectedEndpoint, setSelectedEndpoint] = useState('');
  const [selectedModel, setSelectedModel] = useState(getDefaultModel());
  const [ollamaEndpoints, setOllamaEndpoints] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [saveAsVersion, setSaveAsVersion] = useState(false);
  const [selectedBaseTemplate, setSelectedBaseTemplate] = useState('');

  useEffect(() => {
    const endpoints = getOllamaEndpoints();
    setOllamaEndpoints(endpoints);
    if (endpoints.length > 0) {
      setSelectedEndpoint(endpoints[0]);
    }
  }, []);

  useEffect(() => {
    if (selectedEndpoint && useOllama) {
      fetchAvailableModels();
    }
  }, [selectedEndpoint, useOllama]);

  useEffect(() => {
    setUseOllamaPreference(useOllama);
  }, [useOllama]);

  const fetchAvailableModels = async () => {
    if (!selectedEndpoint) return;
    setLoadingModels(true);
    try {
      const { data } = await ollamaRequest({ endpoint: selectedEndpoint, action: 'list-models' });
      const models = (data.models || []).map(m => ({ name: m.id }));
      setAvailableModels(models);
      if (models.length > 0) {
        if (!selectedModel || !models.some(model => model.name === selectedModel)) {
          setSelectedModel(models[0].name);
        }
      } else {
        setSelectedModel('');
      }
    } catch (error) {
      console.error('Error fetching Ollama models:', error);
      setAvailableModels([]);
      setSelectedModel('');
    } finally {
      setLoadingModels(false);
    }
  };

  const generateWithOllama = async (systemPrompt, userPrompt) => {
    if (!selectedEndpoint) throw new Error('No Ollama endpoint selected');
    if (!selectedModel) throw new Error('No Ollama model selected');
    const { data } = await ollamaRequest({
      endpoint: selectedEndpoint,
      action: 'chat',
      model: selectedModel,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      options: { stream: false }
    });
    const content = data?.message?.content;
    if (!content) throw new Error('No content in Ollama response');
    return JSON.parse(content);
  };

  const generateWithclient = async (systemPrompt, userPrompt, schema) => {
    const result = await client.integrations.Core.InvokeLLM({
      prompt: `${systemPrompt}\n\n${userPrompt}`,
      response_json_schema: schema
    });
    return result;
  };

  const getContentTypeInstructions = (type) => {
    const instructions = {
      standard: "Create a standard prompt format with clear instructions and placeholders.",
      structured_outline: "Structure the content as a hierarchical outline with main points and sub-points using numbered or lettered sections.",
      report: "Format as a comprehensive report with distinct sections: Executive Summary, Introduction, Main Body (with subsections), and Conclusion.",
      bullet_points: "Present the information as concise bullet points, organized by categories or themes.",
      short_essay: "Write in a flowing essay format with an introduction, body paragraphs, and conclusion.",
      markdown_table: "Create a well-formatted markdown table with appropriate columns and rows to organize the information.",
      json: "Structure the output as valid JSON with clearly defined keys and nested objects/arrays as needed.",
      code: "Provide code examples with detailed inline comments explaining each section and best practices."
    };
    return instructions[type] || instructions.standard;
  };

  // New helper function for output format instructions
  const getOutputFormatInstructions = (format) => {
    const instructions = {
      plain: "Output as plain text without any special formatting.",
      markdown: "Output using Markdown formatting with headers (##), lists (-), bold (**), italic (*), and code blocks (```).",
      html: "Output as valid HTML with proper tags like <h1>, <p>, <ul>, <li>, <strong>, etc.",
      json: "Output as valid JSON with properly structured objects and arrays."
    };
    return instructions[format] || instructions.plain;
  };

  const formatContent = (content) => {
    if (typeof content === 'string') {
      return content;
    }
    if (typeof content === 'object' && content !== null) {
      return JSON.stringify(content, null, 2);
    }
    return String(content);
  };

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError("Please provide a description");
      return;
    }
    if (useOllama && !selectedEndpoint) {
      setError("Please select an Ollama endpoint.");
      return;
    }
    if (useOllama && !selectedModel) {
      setError("Please select an Ollama model.");
      return;
    }
    // New condition for saving as version
    if (saveAsVersion && !selectedBaseTemplate) {
      setError("Please select a base prompt to save as a new version.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedTemplate(null);
    setVariations([]);

    try {
      const systemPrompt = `You are an expert AI prompt engineer. You create highly effective, structured prompts that deliver exceptional results.
Your prompts are clear, detailed, and optimized for the best AI performance.
Always respond with valid JSON matching the requested schema.`;

      const contentTypeInstruction = getContentTypeInstructions(contentType);
      const formatInstruction = getOutputFormatInstructions(outputFormat); // Get output format instructions

      let result;

      if (activeTab === 'create') {
        const userPrompt = `Create a professional prompt template for: ${description}

Content Type Requirement: ${contentTypeInstruction}
Output Format: ${formatInstruction}

Requirements:
- Title: Clear, descriptive title
- Description: Brief explanation of the prompt's purpose
- Content: The actual prompt text formatted according to the "${contentType}" style and "${outputFormat}" format. Include placeholders in {curly braces} where applicable. IMPORTANT: Content must be a string, not an object.
- Category: Choose from: Writing, Coding, Business, Creative, Marketing, Research, Education. Pick the most relevant.
- Subcategory: More specific classification related to the category.
- Tags: 3-5 relevant lowercase tags as an array.
- Examples: Array of 2-3 usage examples showing how to use the prompt.
- Placeholders: Array of objects describing each placeholder found in 'Content'. Each object should have 'key' (the placeholder name without braces), 'label' (a human-readable label), 'description' (what the placeholder represents), and 'default' (an optional default value or example text if appropriate).`;

        const schema = {
          type: "object",
          properties: {
            title: { type: "string", description: "Clear, descriptive title for the prompt" },
            description: { type: "string", description: "Brief explanation of the prompt's purpose" },
            content: { type: "string", description: "The actual prompt text with placeholders in {curly braces} as a STRING" },
            category: { type: "string", enum: ["Writing", "Coding", "Business", "Creative", "Marketing", "Research", "Education"], description: "Main category of the prompt" },
            subcategory: { type: "string", description: "More specific classification within the category" },
            tags: { type: "array", items: { type: "string" }, description: "3-5 relevant lowercase tags" },
            examples: { type: "array", items: { type: "string" }, description: "2-3 usage examples" },
            placeholders: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  key: { type: "string", description: "The placeholder name without braces" },
                  label: { type: "string", description: "A human-readable label for the placeholder" },
                  description: { type: "string", description: "What the placeholder represents" },
                  default: { type: "string", description: "Optional default value or example text" }
                },
                required: ["key", "label", "description"]
              },
              description: "Array of objects describing each placeholder found in 'Content'"
            }
          },
          required: ["title", "description", "content", "category", "tags", "placeholders"]
        };

        if (useOllama) {
          result = await generateWithOllama(systemPrompt, userPrompt);
        } else {
          result = await generateWithclient(systemPrompt, userPrompt, schema);
        }

        setGeneratedTemplate(result);

      } else if (activeTab === 'refine') {
        const userPrompt = `Analyze and improve this prompt, ensuring it is clear, effective, and well-structured.

Content Type Requirement: ${contentTypeInstruction}
Output Format: ${formatInstruction}

Original Prompt:
---
${description}
---

Provide:
- Title: Improved title (clear and descriptive).
- Description: Enhanced description explaining the prompt's purpose and benefits.
- Content: The refined prompt text formatted according to the "${contentType}" style and "${outputFormat}" format with better structure, clarity, and suggested placeholders in {curly braces}. IMPORTANT: Content must be a string, not an object.
- Category: The most appropriate category (e.g., Writing, Coding, Business).
- Subcategory: A more specific classification.
- Tags: 3-5 relevant lowercase tags.
- Improvements: Array of specific improvements made (e.g., "Added clear instructions", "Improved flow", "Suggested new placeholders").
- Placeholders: Array of objects describing each placeholder found in the refined 'Content'. Each object should have 'key', 'label', 'description'.`;

        const schema = {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            content: { type: "string", description: "The refined prompt text as a STRING" },
            category: { type: "string" },
            subcategory: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            improvements: { type: "array", items: { type: "string" } },
            placeholders: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  key: { type: "string" },
                  label: { type: "string" },
                  description: { type: "string" }
                },
                required: ["key", "label", "description"]
              }
            }
          },
          required: ["title", "description", "content", "category", "tags", "improvements", "placeholders"]
        };

        if (useOllama) {
          result = await generateWithOllama(systemPrompt, userPrompt);
        } else {
          result = await generateWithclient(systemPrompt, userPrompt, schema);
        }

        setGeneratedTemplate(result);

      } else if (activeTab === 'variations') {
        const userPrompt = `Create 3 distinct variations of this prompt, optimizing for different use cases or styles. Ensure each variation is coherent and effective on its own.

Content Type Requirement: ${contentTypeInstruction}
Output Format: ${formatInstruction}

Original Prompt:
---
${description}
---

Provide three variations:
1. Concise version: A brief and direct version, cutting down on unnecessary words while retaining core functionality.
2. Detailed version: A comprehensive and thorough version, providing more context, examples, or specific instructions.
3. Alternative approach: A version that tackles the problem from a different angle or uses a distinct methodology.

For each variation, include:
- title: A clear and descriptive title for this specific variation.
- content: The complete prompt text for this variation formatted according to the "${contentType}" style and "${outputFormat}" format. IMPORTANT: Content must be a string, not an object.
- benefits: A short description of why someone would choose this version.
- best_for: A short description of the ideal use cases for this variation.`;

        const schema = {
          type: "object",
          properties: {
            variations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  content: { type: "string", description: "Prompt text as a STRING" },
                  benefits: { type: "string" },
                  best_for: { type: "string" }
                },
                required: ["title", "content", "benefits", "best_for"]
              },
              minItems: 3,
              maxItems: 3
            }
          },
          required: ["variations"]
        };

        if (useOllama) {
          result = await generateWithOllama(systemPrompt, userPrompt);
        } else {
          result = await generateWithclient(systemPrompt, userPrompt, schema);
        }

        setVariations(result.variations || []);
      }

    } catch (error) {
      console.error('Generation error:', error);
      const errorMessage = error?.message || error?.toString() || 'Failed to generate. Please try again.';
      setError(typeof errorMessage === 'string' ? errorMessage : safeStringify(errorMessage));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = (template, isVersion = false) => {
    if (isVersion && selectedBaseTemplate && onSaveAsVersion) {
      const baseTemplate = existingTemplates.find(t => t.id === selectedBaseTemplate);
      if (baseTemplate) {
        onSaveAsVersion(baseTemplate, template);
      } else {
        // Fallback: if base template not found, apply as a new one
        onApplyTemplate(template);
      }
    } else if (onApplyTemplate) {
      onApplyTemplate(template);
    }
  };

  const ollamaConfigured = ollamaEndpoints.length > 0;

  return (
    <Card className="border-2 border-purple-200 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Brain className="w-6 h-6 text-purple-600" />
              AI Prompt Generator
            </CardTitle>
            <CardDescription>
              Generate, refine, or create variations of prompts using AI
            </CardDescription>
          </div>
          {ollamaConfigured && (
            <div className="flex items-center gap-2">
              <Label htmlFor="use-ollama" className="text-sm cursor-pointer">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  Use Ollama
                </div>
              </Label>
              <Switch
                id="use-ollama"
                checked={useOllama}
                onCheckedChange={setUseOllama}
              />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="create">
              <Sparkles className="w-4 h-4 mr-2" />
              Create New
            </TabsTrigger>
            <TabsTrigger value="refine">
              <Wand2 className="w-4 h-4 mr-2" />
              Refine
            </TabsTrigger>
            <TabsTrigger value="variations">
              <GitBranch className="w-4 h-4 mr-2" />
              Variations
            </TabsTrigger>
          </TabsList>

          {/* Save as version toggle */}
          {(activeTab === 'refine' || activeTab === 'variations') && existingTemplates.length > 0 && (
            <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="save-as-version" className="text-sm font-medium cursor-pointer">
                  Save as new version of existing prompt
                </Label>
                <Switch
                  id="save-as-version"
                  checked={saveAsVersion}
                  onCheckedChange={setSaveAsVersion}
                />
              </div>
              {saveAsVersion && (
                <Select value={selectedBaseTemplate} onValueChange={setSelectedBaseTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select base prompt..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {existingTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.title} (v{template.version || 1})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                Content Type
              </Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {contentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-600" />
                Output Format
              </Label>
              <Select value={outputFormat} onValueChange={setOutputFormat}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {outputFormats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{format.label}</span>
                        <span className="text-xs text-gray-500">{format.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {useOllama && ollamaConfigured && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
                <Zap className="w-4 h-4" />
                Ollama Configuration
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Endpoint</Label>
                  <Select value={selectedEndpoint} onValueChange={setSelectedEndpoint}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select an Ollama endpoint" />
                    </SelectTrigger>
                    <SelectContent>
                      {ollamaEndpoints.length > 0 ? (
                        ollamaEndpoints.map((endpoint, idx) => (
                          <SelectItem key={idx} value={endpoint}>
                            {endpoint}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-endpoints" disabled>
                          No endpoints configured
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Model</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel} disabled={loadingModels || !selectedEndpoint}>
                    <SelectTrigger className="text-sm">
                      {loadingModels ? (
                        <span className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading models...</span>
                      ) : (
                        <SelectValue placeholder="Select a model" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.length > 0 ? (
                        availableModels.map((model) => (
                          <SelectItem key={model.name} value={model.name}>
                            {model.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-models" disabled>
                          {selectedEndpoint ? "No models found" : "Select an endpoint first"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {!ollamaConfigured && useOllama && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No Ollama endpoints configured. Please add endpoints in settings or disable "Use Ollama" to proceed with client AI.
              </AlertDescription>
            </Alert>
          )}

          <TabsContent value="create" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-description">What kind of prompt do you need?</Label>
              <Textarea
                id="create-description"
                placeholder="Describe what you want the prompt to do. For example: 'A prompt for writing product descriptions that highlight benefits and features' or 'A coding assistant that helps debug Python code'"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </TabsContent>

          <TabsContent value="refine" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="refine-description">Current Prompt</Label>
              <Textarea
                id="refine-description"
                placeholder="Paste your existing prompt here to refine and improve it..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </TabsContent>

          <TabsContent value="variations" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="variations-description">Original Prompt</Label>
              <Textarea
                id="variations-description"
                placeholder="Enter your prompt to generate different variations..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </TabsContent>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !description.trim() || (useOllama && (!selectedEndpoint || !selectedModel)) || (saveAsVersion && !selectedBaseTemplate)}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating with {useOllama ? `Ollama (${selectedModel})` : 'client AI'}...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate {activeTab === 'create' ? 'New Prompt' : activeTab === 'refine' ? 'Refined Version' : 'Variations'}
              </>
            )}
          </Button>

          {error && (
            <Alert className="bg-red-50 border-red-200 mt-4">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <AnimatePresence>
            {generatedTemplate && (activeTab === 'create' || activeTab === 'refine') && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-6 space-y-4"
              >
                <div className="flex items-center gap-2 text-lg font-semibold text-purple-900">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Generated Prompt
                </div>

                <Card className="border-2 border-green-200">
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <Label className="text-sm text-gray-600">Title</Label>
                      <p className="font-semibold text-lg">{safeStringify(generatedTemplate.title)}</p>
                    </div>

                    {generatedTemplate.description && (
                      <div>
                        <Label className="text-sm text-gray-600">Description</Label>
                        <p className="text-gray-700">{safeStringify(generatedTemplate.description)}</p>
                      </div>
                    )}

                    <div>
                      <Label className="text-sm text-gray-600">Prompt Content</Label>
                      <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
                        <pre className="whitespace-pre-wrap font-mono text-sm">
                          {formatContent(generatedTemplate.content)}
                        </pre>
                      </div>
                    </div>

                    {generatedTemplate.category && (
                      <div className="flex gap-2">
                        <Badge>{safeStringify(generatedTemplate.category)}</Badge>
                        {generatedTemplate.subcategory && (
                          <Badge variant="outline">{safeStringify(generatedTemplate.subcategory)}</Badge>
                        )}
                      </div>
                    )}

                    {generatedTemplate.tags && Array.isArray(generatedTemplate.tags) && generatedTemplate.tags.length > 0 && (
                      <div>
                        <Label className="text-sm text-gray-600 mb-2 block">Tags</Label>
                        <div className="flex flex-wrap gap-2">
                          {generatedTemplate.tags.map((tag, idx) => (
                            <Badge key={idx} variant="secondary">#{safeStringify(tag)}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {generatedTemplate.improvements && Array.isArray(generatedTemplate.improvements) && generatedTemplate.improvements.length > 0 && (
                      <div>
                        <Label className="text-sm text-gray-600 mb-2 block">Improvements Made</Label>
                        <ul className="space-y-1 list-disc list-inside text-sm text-gray-700">
                          {generatedTemplate.improvements.map((improvement, idx) => (
                            <li key={idx}>{safeStringify(improvement)}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {generatedTemplate.examples && Array.isArray(generatedTemplate.examples) && generatedTemplate.examples.length > 0 && (
                      <div>
                        <Label className="text-sm text-gray-600 mb-2 block">Usage Examples</Label>
                        <div className="space-y-2">
                          {generatedTemplate.examples.map((example, idx) => (
                            <div key={idx} className="p-3 bg-blue-50 rounded border border-blue-200 text-sm">
                              {safeStringify(example)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {generatedTemplate.placeholders && Array.isArray(generatedTemplate.placeholders) && generatedTemplate.placeholders.length > 0 && (
                      <div>
                        <Label className="text-sm text-gray-600 mb-2 block">Placeholders</Label>
                        <div className="space-y-2">
                          {generatedTemplate.placeholders.map((ph, idx) => (
                            <div key={idx} className="p-2 bg-purple-50 rounded border border-purple-200">
                              <span className="font-mono text-sm font-semibold">{`{${ph.key}}`}</span>
                              <span className="text-sm text-gray-600 ml-2">- {safeStringify(ph.description || ph.label)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApply(generatedTemplate, saveAsVersion)}
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
                        disabled={saveAsVersion && !selectedBaseTemplate}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {saveAsVersion && selectedBaseTemplate ? 'Save as New Version' : 'Use This Prompt'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {variations.length > 0 && activeTab === 'variations' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-6 space-y-4"
              >
                <div className="flex items-center gap-2 text-lg font-semibold text-purple-900">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Generated Variations
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {variations.map((variation, idx) => (
                    <Card key={idx} className="border-2 border-purple-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{safeStringify(variation.title)}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="p-3 bg-gray-50 rounded border text-sm">
                          <pre className="whitespace-pre-wrap font-mono text-xs">
                            {formatContent(variation.content)}
                          </pre>
                        </div>
                        <div className="text-sm">
                          <p className="font-semibold text-gray-700 mb-1">Benefits:</p>
                          <p className="text-gray-600">{safeStringify(variation.benefits)}</p>
                        </div>
                        <div className="text-sm">
                          <p className="font-semibold text-gray-700 mb-1">Best For:</p>
                          <p className="text-gray-600">{safeStringify(variation.best_for)}</p>
                        </div>
                        <Button
                          onClick={() => handleApply({
                            title: variation.title,
                            content: formatContent(variation.content),
                            description: variation.benefits,
                          }, saveAsVersion)}
                          variant="outline"
                          size="sm"
                          className="w-full"
                          disabled={saveAsVersion && !selectedBaseTemplate}
                        >
                          {saveAsVersion && selectedBaseTemplate ? 'Save as Version' : 'Use This Version'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Tabs>
      </CardContent>
    </Card>
  );
}
