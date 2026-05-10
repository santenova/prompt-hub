import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
"@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2, Sparkles, Copy, Download, RefreshCw, Zap, FileText, Server, Settings, X, Plus, Package, Globe, ExternalLink, Edit3, Check, Save, FolderOpen, Star, Bookmark, Lightbulb, Send } from "lucide-react";
import { apiClient } from "@/apis/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter } from
"@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import OllamaModelManager from "../ollama/OllamaModelManager";
import { getOllamaSettings, isOllamaEnabled, getOllamaParameters } from "../utils/ollamaSettings";
import ContentHistoryViewer from "./ContentHistoryViewer";
import ContentExporter from "./ContentExporter";

const contentTypes = [
{ value: 'blog-post', label: 'Blog Post', icon: FileText },
{ value: 'social-media', label: 'Social Media', icon: Sparkles },
{ value: 'marketing-copy', label: 'Marketing Copy', icon: Zap },
{ value: 'email', label: 'Email', icon: FileText },
{ value: 'landing-page', label: 'Landing Page', icon: FileText }];


const toneOptions = [
'Professional', 'Casual', 'Friendly', 'Enthusiastic',
'Formal', 'Conversational', 'Authoritative', 'Empathetic',
'Humorous', 'Inspirational'];


const lengthOptions = [
{ value: 'short', label: 'Short (100-300 words)' },
{ value: 'medium', label: 'Medium (300-600 words)' },
{ value: 'long', label: 'Long (600-1000+ words)' }];


export default function AIContentGenerator({ personas = [], templates = [] }) {
  const { toast } = useToast();

  // Load from localStorage on mount
  const loadFromStorage = (key, defaultValue) => {
    try {
      const saved = localStorage.getItem(`ai_content_${key}`);
      return saved !== null ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [selectedPersona, setSelectedPersona] = useState(() => loadFromStorage('persona', null));
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedTemplates, setSelectedTemplates] = useState(() => loadFromStorage('templates', []));
  const [contentType, setContentType] = useState(() => loadFromStorage('contentType', 'blog-post'));
  const [topic, setTopic] = useState(() => loadFromStorage('topic', ''));
  const [tone, setTone] = useState(() => loadFromStorage('tone', 'Professional'));
  const [length, setLength] = useState(() => loadFromStorage('length', 'medium'));
  const [variations, setVariations] = useState(() => loadFromStorage('variations', 3));
  const [customInstructions, setCustomInstructions] = useState(() => loadFromStorage('customInstructions', ''));
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState([]);
  const [useOllama, setUseOllama] = useState(true);
  const [selectedEndpoint, setSelectedEndpoint] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [showOllamaConfig, setShowOllamaConfig] = useState(false);
  const [showModelManager, setShowModelManager] = useState(false);
  const [availableModels, setAvailableModels] = useState([]);
  const [ollamaEndpoints, setOllamaEndpoints] = useState([]);
  const [newEndpoint, setNewEndpoint] = useState('');
  const [isTestingEndpoint, setIsTestingEndpoint] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(() => loadFromStorage('showAdvanced', false));
  const [temperature, setTemperature] = useState(() => loadFromStorage('temperature', 0.7));
  const [maxTokens, setMaxTokens] = useState(() => loadFromStorage('maxTokens', 2000));
  const [topP, setTopP] = useState(0.9);
  const [presencePenalty, setPresencePenalty] = useState(0);
  const [frequencyPenalty, setFrequencyPenalty] = useState(0);
  const [includeKeywords, setIncludeKeywords] = useState(() => loadFromStorage('includeKeywords', ''));
  const [excludeWords, setExcludeWords] = useState(() => loadFromStorage('excludeWords', ''));
  const [targetAudience, setTargetAudience] = useState(() => loadFromStorage('targetAudience', ''));
  const [seoOptimize, setSeoOptimize] = useState(() => loadFromStorage('seoOptimize', false));
  const [contentAnalysis, setContentAnalysis] = useState(null);
  const [enableWebSearch, setEnableWebSearch] = useState(() => loadFromStorage('enableWebSearch', false));
  const [searchSources, setSearchSources] = useState([]);
  const [showPlaceholderDialog, setShowPlaceholderDialog] = useState(false);
  const [placeholderValues, setPlaceholderValues] = useState(() => loadFromStorage('placeholderValues', {}));
  const [placeholderErrors, setPlaceholderErrors] = useState({});
  const [placeholderPresets, setPlaceholderPresets] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetType, setNewPresetType] = useState('custom');
  const [newPresetDescription, setNewPresetDescription] = useState('');
  const [enableSuggestions, setEnableSuggestions] = useState(false);
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [personaSearchQuery, setPersonaSearchQuery] = useState('');
  const [beamMode, setBeamMode] = useState(() => loadFromStorage('beamMode', false));
  const [selectedBeamModels, setSelectedBeamModels] = useState(() => loadFromStorage('selectedBeamModels', []));
  const [beamResults, setBeamResults] = useState([]);
  const [isBeaming, setIsBeaming] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(() => loadFromStorage('selectedProject', null));

  // Save to localStorage whenever key values change
  useEffect(() => {
    const saveToStorage = (key, value) => {
      try {
        localStorage.setItem(`ai_content_${key}`, JSON.stringify(value));
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
      }
    };

    saveToStorage('persona', selectedPersona);
    saveToStorage('templates', selectedTemplates);
    saveToStorage('contentType', contentType);
    saveToStorage('topic', topic);
    saveToStorage('tone', tone);
    saveToStorage('length', length);
    saveToStorage('variations', variations);
    saveToStorage('customInstructions', customInstructions);
    saveToStorage('showAdvanced', showAdvanced);
    saveToStorage('temperature', temperature);
    saveToStorage('maxTokens', maxTokens);
    saveToStorage('includeKeywords', includeKeywords);
    saveToStorage('excludeWords', excludeWords);
    saveToStorage('targetAudience', targetAudience);
    saveToStorage('seoOptimize', seoOptimize);
    saveToStorage('enableWebSearch', enableWebSearch);
    saveToStorage('beamMode', beamMode);
    saveToStorage('selectedBeamModels', selectedBeamModels);
    saveToStorage('selectedProject', selectedProject);
    saveToStorage('placeholderValues', placeholderValues);
  }, [selectedPersona, selectedTemplates, contentType, topic, tone, length, variations, customInstructions, showAdvanced, temperature, maxTokens, includeKeywords, excludeWords, targetAudience, seoOptimize, enableWebSearch, beamMode, selectedBeamModels, selectedProject, placeholderValues]);

  useEffect(() => {
    const settings = getOllamaSettings();
    setUseOllama(settings.useOllama);
    setOllamaEndpoints(settings.endpoints || []);
    setSelectedEndpoint(settings.selectedEndpoint);
    setSelectedModel(settings.selectedModel);

    // Load temperature from centralized settings
    const params = getOllamaParameters();
    setTemperature(params.temperature);
    setTopP(params.top_p);
    setMaxTokens(params.max_tokens);

    const loadModels = async (endpoint) => {
    if (!endpoint) return;
    try {
      const { data } = await apiClient.functions.invoke('ollamaProxy', { endpoint, action: 'list-models' });
      setAvailableModels((data.models || []).map(m => ({ name: m.id })));
    } catch (error) {
      console.error('Failed to load models:', error);
    }
    };

    if (settings.selectedEndpoint) {
      loadModels(settings.selectedEndpoint);
    }

    // Load placeholder presets
    loadPlaceholderPresets();

    // Load projects
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const projectsList = await apiClient.entities.Project.filter({ is_active: true });
      setProjects(projectsList || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadProjectInstructions = (projectId) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const instructions = `PROJECT CONTEXT: ${project.name}

${project.about ? `ABOUT:\n${project.about}\n\n` : ''}${project.vision ? `VISION:\n${project.vision}\n\n` : ''}${project.mission ? `MISSION:\n${project.mission}\n\n` : ''}${project.usps?.length > 0 ? `UNIQUE SELLING POINTS:\n${project.usps.map((usp) => `- ${usp}`).join('\n')}\n\n` : ''}${project.target_audience ? `TARGET AUDIENCE:\n${project.target_audience}\n\n` : ''}${project.tone ? `BRAND TONE: ${project.tone}\n\n` : ''}${project.style ? `BRAND STYLE: ${project.style}\n\n` : ''}${project.keywords ? `KEYWORDS: ${project.keywords}\n\n` : ''}${project.exclude_words ? `AVOID WORDS: ${project.exclude_words}\n\n` : ''}${project.features?.length > 0 ? `KEY FEATURES:\n${project.features.map((f) => `- ${f}`).join('\n')}\n\n` : ''}`;

    setCustomInstructions(instructions);
    setSelectedProject(projectId);

    // Auto-populate other fields from project
    if (project.tone) setTone(project.tone);
    if (project.target_audience) setTargetAudience(project.target_audience);
    if (project.keywords) setIncludeKeywords(project.keywords);
    if (project.exclude_words) setExcludeWords(project.exclude_words);

    // Auto-fill template placeholders from project context
    const autoFilledPlaceholders = {};

    // Get all placeholders from selected templates FIRST
    const allPlaceholders = getAllPlaceholders();

    // Then analyze project context to fill them intelligently
    allPlaceholders.forEach((placeholder) => {
      const key = placeholder.key.toLowerCase();

      // Map common placeholder keys to project fields
      if ((key.includes('project') || key.includes('product') || key.includes('company') || key.includes('brand')) && key.includes('name')) {
        autoFilledPlaceholders[placeholder.key] = project.name;
      } else if (key.includes('description') || key.includes('about')) {
        autoFilledPlaceholders[placeholder.key] = project.about || project.description;
      } else if (key.includes('vision')) {
        autoFilledPlaceholders[placeholder.key] = project.vision;
      } else if (key.includes('mission')) {
        autoFilledPlaceholders[placeholder.key] = project.mission;
      } else if (key.includes('audience') || key.includes('target')) {
        autoFilledPlaceholders[placeholder.key] = project.target_audience;
      } else if (key.includes('tone') || key.includes('voice')) {
        autoFilledPlaceholders[placeholder.key] = project.tone;
      } else if (key.includes('style')) {
        autoFilledPlaceholders[placeholder.key] = project.style;
      } else if (key.includes('keyword') || key.includes('tags')) {
        autoFilledPlaceholders[placeholder.key] = project.keywords;
      } else if (key.includes('feature') || key.includes('benefit')) {
        autoFilledPlaceholders[placeholder.key] = project.features?.join(', ') || project.benefits?.map((b) => b.title).join(', ');
      } else if (key.includes('usp') || key.includes('value')) {
        autoFilledPlaceholders[placeholder.key] = project.usps?.join(', ');
      } else if (key.includes('url') || key.includes('website') || key.includes('link')) {
        autoFilledPlaceholders[placeholder.key] = project.links?.[0]?.url;
      } else if (key.includes('slogan') || key.includes('tagline')) {
        autoFilledPlaceholders[placeholder.key] = project.primary_goal;
      }
    });

    // Merge with existing placeholder values (don't override user-filled values)
    const mergedPlaceholders = {
      ...autoFilledPlaceholders,
      ...placeholderValues // User values take precedence
    };
    setPlaceholderValues(mergedPlaceholders);

    const filledCount = Object.keys(autoFilledPlaceholders).length;
    const requiredUnfilled = allPlaceholders.filter((p) => p.required && !mergedPlaceholders[p.key]);

    // If all required placeholders are filled, auto-apply without showing dialog
    if (requiredUnfilled.length === 0 && allPlaceholders.length > 0) {
      // Auto-apply - show preview toast instead
      toast({
        title: "Project Loaded & Applied",
        description: `${project.name} context applied • ${filledCount} placeholder${filledCount > 1 ? 's' : ''} auto-filled and applied`
      });
    } else if (allPlaceholders.length > 0 && filledCount > 0) {
      // Show dialog if there are missing required fields
      setShowPlaceholderDialog(true);
      toast({
        title: "Project Loaded",
        description: `${project.name} context applied • ${filledCount} placeholder${filledCount > 1 ? 's' : ''} auto-filled`
      });
    } else {
      toast({
        title: "Project Loaded",
        description: `${project.name} context applied`
      });
    }
  };

  const loadPlaceholderPresets = async () => {
    try {
      const presets = await apiClient.entities.PlaceholderPreset.list('-last_used', 50);
      setPlaceholderPresets(presets);
    } catch (error) {
      console.error('Failed to load presets:', error);
    }
  };

  const savePreset = async () => {
    if (!newPresetName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for this preset",
        variant: "destructive"
      });
      return;
    }

    try {
      await apiClient.entities.PlaceholderPreset.create({
        preset_name: newPresetName,
        preset_type: newPresetType,
        description: newPresetDescription,
        placeholder_values: placeholderValues,
        template_ids: selectedTemplates.map((t) => t.id),
        last_used: new Date().toISOString()
      });

      toast({
        title: "Preset Saved",
        description: `"${newPresetName}" saved successfully`
      });

      setShowSavePreset(false);
      setNewPresetName('');
      setNewPresetType('custom');
      setNewPresetDescription('');
      loadPlaceholderPresets();
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const loadPreset = async (preset) => {
    setPlaceholderValues(preset.placeholder_values);
    setSelectedPreset(preset);

    // Update usage stats
    try {
      await apiClient.entities.PlaceholderPreset.update(preset.id, {
        last_used: new Date().toISOString(),
        use_count: (preset.use_count || 0) + 1
      });
      loadPlaceholderPresets();
    } catch (error) {
      console.error('Failed to update preset usage:', error);
    }

    toast({
      title: "Preset Loaded",
      description: `"${preset.preset_name}" applied`
    });
  };

  const toggleFavorite = async (preset) => {
    try {
      await apiClient.entities.PlaceholderPreset.update(preset.id, {
        is_favorite: !preset.is_favorite
      });
      loadPlaceholderPresets();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const loadOllamaModels = async (endpointUrl) => {
    try {
      const { data } = await apiClient.functions.invoke('ollamaProxy', { endpoint: endpointUrl, action: 'list-models' });
      const models = (data.models || []).map(m => ({ name: m.id }));
      setAvailableModels(models);
      const savedModel = localStorage.getItem('voice_selected_model');
      if (savedModel && models.find((m) => m.name === savedModel)) {
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
      throw new Error(data.message || 'Failed to connect');
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
      toast({
        title: "Endpoint Added",
        description: "Ollama endpoint configured successfully"
      });
    }
  };

  const removeEndpoint = (urlToRemove) => {
    const updated = ollamaEndpoints.filter((e) => e !== urlToRemove);
    setOllamaEndpoints(updated);
    localStorage.setItem('ollama_endpoints', JSON.stringify(updated));

    if (selectedEndpoint === urlToRemove && updated.length > 0) {
      setSelectedEndpoint(updated[0]);
      loadOllamaModels(updated[0]);
    } else if (updated.length === 0) {
      setSelectedEndpoint('');
      setAvailableModels([]);
    }

    toast({
      title: "Endpoint Removed",
      description: "Ollama endpoint removed"
    });
  };

  const switchEndpoint = (url) => {
    setSelectedEndpoint(url);
    loadOllamaModels(url);
  };

  const generateWithOllama = async (prompt) => {
    const settings = getOllamaSettings();
    if (!settings.selectedEndpoint) throw new Error('No Ollama endpoint configured');
    if (!settings.selectedModel) throw new Error('No Ollama model selected');

    const params = getOllamaParameters();
    const { data } = await apiClient.functions.invoke('ollamaProxy', {
      endpoint: settings.selectedEndpoint,
      action: 'chat',
      model: settings.selectedModel,
      messages: [{ role: "user", content: prompt }],
      options: { stream: false, temperature: params.temperature, max_tokens: params.max_tokens, top_p: params.top_p },
    });

    return JSON.parse(data.message?.content || '{}');
  };

  const analyzeContent = (content) => {
    const words = content.split(/\s+/).filter((w) => w.length > 0);
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 0);

    const wordCount = words.length;
    const sentenceCount = sentences.length;
    const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    const avgSentencesPerParagraph = paragraphs.length > 0 ? sentenceCount / paragraphs.length : 0;

    // Simple readability score (Flesch Reading Ease approximation)
    const avgSyllablesPerWord = 1.5; // rough estimate
    const readabilityScore = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

    // SEO Score factors
    let seoScore = 50;
    if (wordCount >= 300 && wordCount <= 2000) seoScore += 20;
    if (avgWordsPerSentence <= 20) seoScore += 15;
    if (paragraphs.length >= 3) seoScore += 15;

    return {
      wordCount,
      sentenceCount,
      paragraphCount: paragraphs.length,
      avgWordsPerSentence: avgWordsPerSentence.toFixed(1),
      avgSentencesPerParagraph: avgSentencesPerParagraph.toFixed(1),
      readabilityScore: Math.max(0, Math.min(100, readabilityScore)).toFixed(1),
      seoScore: Math.min(100, seoScore),
      estimatedReadTime: Math.ceil(wordCount / 200)
    };
  };

  const saveToHistory = async (generatedVariations, beamData = null) => {
    // Don't save if no valid content generated
    if (!generatedVariations || generatedVariations.length === 0) {
      // Check if we have beam results to save
      if (!beamData || beamData.length === 0) {
        return;
      }
    }

    // Filter out empty variations
    const validVariations = generatedVariations?.filter((v) =>
    v && (v.content?.trim() || v.title?.trim())
    ) || [];

    // Filter out empty beam results - check response length > 10 to ensure meaningful content
    const validBeamResults = beamData?.filter((r) =>
    r && r.response && r.response.trim().length > 10 && r.status === 'completed'
    ) || [];

    if (validVariations.length === 0 && validBeamResults.length === 0) {
      console.warn('No valid content to save - all variations/beam results were empty');
      return;
    }

    // Ensure at least one has content
    if (validVariations.length === 0 && validBeamResults.length === 0) {
      return;
    }

    try {
      const historyEntry = {
        project_id: selectedProject,
        tool_type: 'ai_content_generator',
        topic,
        content_type: contentType,
        tone,
        length,
        persona_id: selectedPersona?.id,
        persona_name: selectedPersona?.name,
        template_ids: selectedTemplates.map((t) => t.id),
        template_names: selectedTemplates.map((t) => t.title).join(', '),
        custom_instructions: customInstructions,
        variations_count: validVariations.length || validBeamResults.length,
        use_ollama: useOllama,
        ollama_model: useOllama ? selectedModel : null,
        settings: {
          temperature,
          maxTokens,
          topP,
          presencePenalty,
          frequencyPenalty,
          includeKeywords,
          excludeWords,
          targetAudience,
          seoOptimize,
          beamMode: beamMode
        }
      };

      // Only add content if it exists and is valid
      if (validVariations.length > 0) {
        historyEntry.generated_content = validVariations;
      }

      if (validBeamResults.length > 0) {
        historyEntry.beam_results = validBeamResults;
        historyEntry.beam_models_used = validBeamResults.map((r) => r.model);
      }

      await apiClient.entities.ContentHistory.create(historyEntry);
    } catch (error) {
      console.error('Failed to save to history:', error);
    }
  };

  const applyPlaceholders = (content, values) => {
    let result = content;
    Object.entries(values).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, value || '');
    });
    return result;
  };

  const getAllPlaceholders = () => {
    const allPlaceholders = [];
    selectedTemplates.forEach((template) => {
      if (template.placeholders && template.placeholders.length > 0) {
        template.placeholders.forEach((placeholder) => {
          if (!allPlaceholders.find((p) => p.key === placeholder.key)) {
            allPlaceholders.push({
              ...placeholder,
              templateTitle: template.title,
              templateId: template.id
            });
          }
        });
      }
    });
    return allPlaceholders;
  };

  const validatePlaceholder = (placeholder, value) => {
    if (!value && placeholder.required) {
      return placeholder.validation_message || `${placeholder.label || placeholder.key} is required`;
    }

    if (!value) return null;

    switch (placeholder.type) {
      case 'number':
        const num = parseFloat(value);
        if (isNaN(num)) return 'Must be a valid number';
        if (placeholder.min !== undefined && num < placeholder.min) {
          return `Must be at least ${placeholder.min}`;
        }
        if (placeholder.max !== undefined && num > placeholder.max) {
          return `Must be no more than ${placeholder.max}`;
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'Must be a valid email address';
        }
        break;

      case 'url':
        try {
          new URL(value);
        } catch {
          return 'Must be a valid URL';
        }
        break;

      case 'date':
        if (isNaN(Date.parse(value))) {
          return 'Must be a valid date';
        }
        break;

      default:
        if (placeholder.pattern) {
          const regex = new RegExp(placeholder.pattern);
          if (!regex.test(value)) {
            return placeholder.validation_message || 'Invalid format';
          }
        }
    }

    return null;
  };

  const validateAllPlaceholders = () => {
    const errors = {};
    const allPlaceholders = getAllPlaceholders();

    allPlaceholders.forEach((placeholder) => {
      const error = validatePlaceholder(placeholder, placeholderValues[placeholder.key]);
      if (error) {
        errors[placeholder.key] = error;
      }
    });

    return errors;
  };

  const generateWithBeam = async () => {
    if (!topic.trim()) return;
    if (selectedBeamModels.length === 0) {
      toast({
        title: "No Models Selected",
        description: "Please select at least one model for beam generation",
        variant: "destructive"
      });
      return;
    }

    setIsBeaming(true);
    setBeamResults([]);

    const personaContext = selectedPersona ? `
PERSONA CONTEXT:
- Name: ${selectedPersona.name}
- Description: ${selectedPersona.description}
- Tone: ${selectedPersona.tone}
- Expertise: ${selectedPersona.expertise_areas?.join(', ')}
` : '';

    const templateContext = selectedTemplates.length > 0 ? `
TEMPLATE CONTEXT (${selectedTemplates.length} templates selected):
${selectedTemplates.map((t) => {
      const templateContent = applyPlaceholders(t.content, placeholderValues);
      return `- Title: ${t.title}\n- Category: ${t.category}\n- Structure: ${templateContent.substring(0, 300)}...`;
    }).join('\n')}
` : '';

    const prompt = `You are an expert content creator. Generate ${contentType} content based on these specifications.

TOPIC: ${topic}

CONTENT TYPE: ${contentType}
TONE: ${tone}
LENGTH: ${length}

${personaContext}
${templateContext}

${customInstructions ? `CUSTOM INSTRUCTIONS:\n${customInstructions}\n` : ''}

REQUIREMENTS:
1. Match the specified tone throughout
2. Respect the ${length} length guideline
3. If a persona is selected, write AS that persona would write
4. If a template is selected, follow its structure and style
5. Make content actionable, engaging, and valuable
6. Include a compelling hook/opening
7. Add a clear call-to-action where appropriate
${includeKeywords ? `8. MUST include these keywords naturally: ${includeKeywords}` : ''}
${excludeWords ? `9. AVOID using these words: ${excludeWords}` : ''}
${targetAudience ? `10. Target audience: ${targetAudience}` : ''}

Provide a complete, well-structured ${contentType} on the topic.`;

    const results = [];
    const promises = selectedBeamModels.map(async (model) => {
      const startTime = Date.now();
      try {
        const { data: chatData } = await apiClient.functions.invoke('ollamaProxy', {
          endpoint: selectedEndpoint,
          action: 'chat',
          model,
          messages: [{ role: "user", content: prompt }],
          options: { stream: false }
        });
        const content = chatData?.message?.content || '';
        const endTime = Date.now();
        const responseTime = (endTime - startTime) / 1000;
        return {
          model,
          response: content,
          status: 'completed',
          timestamp: new Date().toISOString(),
          responseTime,
          tokens: { prompt: 0, response: 0 },
          score: Math.min(100, Math.round((content.split(' ').length / responseTime) / 5 * 100))
        };
      } catch (error) {
        return {
          model,
          response: error.message,
          status: 'error',
          timestamp: new Date().toISOString(),
          tokens: { prompt: 0, response: 0 },
          score: 0
        };
      }
    });

    const allResults = await Promise.all(promises);
    setBeamResults(allResults);
    setIsBeaming(false);

    // Save beam results to history
    await saveToHistory([], allResults);

    toast({
      title: "Beam Generation Complete",
      description: `Generated content with ${allResults.filter((r) => r.status === 'completed').length}/${allResults.length} models`
    });
  };

  const generateContent = async () => {
    if (!topic.trim()) return;

    if (beamMode) {
      return generateWithBeam();
    }

    // Check if templates have placeholders and prompt user to fill them
    const hasPlaceholders = selectedTemplates.some((t) => t.placeholders && t.placeholders.length > 0);
    if (hasPlaceholders) {
      const allPlaceholders = getAllPlaceholders();
      const unfilled = allPlaceholders.filter((p) => p.required && !placeholderValues[p.key]);

      if (unfilled.length > 0) {
        setShowPlaceholderDialog(true);
        toast({
          title: "Fill Required Fields",
          description: `Please fill ${unfilled.length} required placeholder${unfilled.length > 1 ? 's' : ''} before generating`,
          variant: "destructive"
        });
        return;
      }
    }

    setIsGenerating(true);
    setGeneratedContent([]);

    try {
      const personaContext = selectedPersona ? `
PERSONA CONTEXT:
- Name: ${selectedPersona.name}
- Description: ${selectedPersona.description}
- Tone: ${selectedPersona.tone}
- Expertise: ${selectedPersona.expertise_areas?.join(', ')}
${selectedPersona.demographics ? `- Demographics: ${JSON.stringify(selectedPersona.demographics)}` : ''}
${selectedPersona.psychographics ? `- Values: ${selectedPersona.psychographics.values?.join(', ')}` : ''}
${selectedPersona.goals ? `- Goals: ${selectedPersona.goals.primary_goals?.join(', ')}` : ''}
${selectedPersona.pain_points ? `- Pain Points: ${selectedPersona.pain_points.frustrations?.join(', ')}` : ''}
` : '';

      const templateContext = selectedTemplates.length > 0 ? `
TEMPLATE CONTEXT (${selectedTemplates.length} templates selected):
${selectedTemplates.map((t) => {
        const templateContent = applyPlaceholders(t.content, placeholderValues);
        return `
- Title: ${t.title}
- Category: ${t.category}
- Structure: ${templateContent.substring(0, 500)}...
`;
      }).join('\n')}
` : '';

      const contentPrompt = `You are an expert content creator. Generate ${variations} variations of ${contentType} content based on these specifications.

TOPIC: ${topic}

CONTENT TYPE: ${contentType}
TONE: ${tone}
LENGTH: ${length}

${personaContext}
${templateContext}

${customInstructions ? `CUSTOM INSTRUCTIONS:\n${customInstructions}\n` : ''}

REQUIREMENTS:
1. Create ${variations} distinct variations with different approaches
2. Match the specified tone throughout
3. Respect the ${length} length guideline
4. If a persona is selected, write AS that persona would write
5. If a template is selected, follow its structure and style
6. Make content actionable, engaging, and valuable
7. Include a compelling hook/opening
8. Add a clear call-to-action where appropriate
${includeKeywords ? `9. MUST include these keywords naturally: ${includeKeywords}` : ''}
${excludeWords ? `10. AVOID using these words: ${excludeWords}` : ''}
${targetAudience ? `11. Target audience: ${targetAudience}` : ''}
${seoOptimize ? `12. Optimize for SEO: use headers, natural keyword placement, meta-friendly` : ''}
${enableWebSearch ? `13. IMPORTANT: Use the latest, real-time information from web search. Include specific facts, statistics, and data from current sources. At the end, list all sources used.` : ''}

Respond with valid JSON only:
{
  "variations": [
    {
      "title": "Compelling title",
      "content": "Full content body",
      "hook": "Opening hook/first paragraph",
      "cta": "Call to action",
      "approach": "What makes this variation unique",
      "best_for": "When to use this version",
      "word_count": 450,
      "style_notes": "Key style choices made",
      "sources": ["List of sources if web search was used"]
    }
  ]
}`;

      const response = useOllama ?
      await generateWithOllama(contentPrompt) :
      await apiClient.integrations.Core.InvokeLLMwithLogging({
        prompt: contentPrompt,
        add_context_from_internet: enableWebSearch,
        response_json_schema: {
          type: "object",
          properties: {
            variations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  content: { type: "string" },
                  hook: { type: "string" },
                  cta: { type: "string" },
                  approach: { type: "string" },
                  best_for: { type: "string" },
                  word_count: { type: "number" },
                  style_notes: { type: "string" },
                  sources: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      const generatedVariations = response.variations || [];
      setGeneratedContent(generatedVariations);

      // Automatically score variations with Ollama if enabled
      if (useOllama && generatedVariations.length > 0) {
        await scoreVariationsWithOllama(generatedVariations);
      }

      // Extract and store sources if web search was used
      if (enableWebSearch) {
        const allSources = generatedVariations.
        flatMap((v) => v.sources || []).
        filter((s, i, arr) => arr.indexOf(s) === i); // unique sources
        setSearchSources(allSources);
      }

      // Save to history
      await saveToHistory(generatedVariations, null);

      // Analyze first variation for insights
      if (generatedVariations.length > 0 && generatedVariations[0].content) {
        setContentAnalysis(analyzeContent(generatedVariations[0].content));
      }
    } catch (error) {
      console.error('Failed to generate content:', error);
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const refineContent = async (variation) => {
    const refinementPrompt = `Refine and improve this ${contentType} content. Make it more ${tone.toLowerCase()}, engaging, and effective.

ORIGINAL CONTENT:
${variation.content}

IMPROVEMENTS NEEDED:
- Enhance clarity and flow
- Strengthen the hook and CTA
- Optimize sentence structure
- Add more compelling details
${seoOptimize ? '- Improve SEO optimization' : ''}

Respond with valid JSON:
{
  "refined_content": "Improved version",
  "changes_made": ["List of specific improvements"],
  "improvement_score": 85
}`;

    try {
      const response = useOllama ?
      await generateWithOllama(refinementPrompt) :
      await apiClient.integrations.Core.InvokeLLMwithLogging({
        prompt: refinementPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            refined_content: { type: "string" },
            changes_made: { type: "array", items: { type: "string" } },
            improvement_score: { type: "number" }
          }
        }
      });

      return response;
    } catch (error) {
      console.error('Refinement failed:', error);
      throw error;
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const downloadContent = (content, title) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Generate AI suggestions using Ollama (local, free)
  const generateSuggestionsWithOllama = async () => {
    const settings = getOllamaSettings();
    if (!settings.selectedEndpoint || !settings.selectedModel) {
      toast({
        title: "Ollama Not Configured",
        description: "Please configure Ollama in settings to use AI suggestions",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingSuggestions(true);
    setAiSuggestions([]);

    try {
      const contextInfo = `
Topic: ${topic || 'Not specified'}
Content Type: ${contentType}
Tone: ${tone}
Length: ${length}
${selectedPersona ? `Persona: ${selectedPersona.name} - ${selectedPersona.description}` : ''}
${selectedTemplates.length > 0 ? `Templates: ${selectedTemplates.map((t) => t.title).join(', ')}` : ''}
${customInstructions ? `Custom Instructions: ${customInstructions}` : ''}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}
${includeKeywords ? `Keywords to include: ${includeKeywords}` : ''}
`;

      const { data: suggData } = await apiClient.functions.invoke('ollamaProxy', {
        endpoint: settings.selectedEndpoint,
        action: 'chat',
        model: settings.selectedModel,
        messages: [{
          role: "user",
          content: `Based on these content generation settings, suggest 5 intelligent questions or improvements the user might consider before generating:\n\n${contextInfo}\n\nGenerate suggestions that help:\n- Clarify the topic or angle\n- Improve the target audience definition\n- Suggest better keywords or tone adjustments\n- Recommend template or persona combinations\n- Identify potential content gaps\n\nReturn ONLY valid JSON:\n{\n  "suggestions": [\n    {"type": "topic", "question": "...", "reason": "..."},\n    {"type": "audience", "question": "...", "reason": "..."},\n    {"type": "keywords", "question": "...", "reason": "..."},\n    {"type": "tone", "question": "...", "reason": "..."},\n    {"type": "template", "question": "...", "reason": "..."}\n  ]\n}`
        }],
        options: { stream: false },
      });

      const result = JSON.parse(suggData.message?.content || '{"suggestions": []}');
      setAiSuggestions(result.suggestions || []);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      toast({
        title: "Suggestion Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const postToSlack = async (content, title) => {
    try {
      const user = await apiClient.auth.me();
      if (!user?.slack_webhook_url) {
        toast({
          title: "Slack Not Connected",
          description: "Please connect your Slack workspace in Settings first.",
          variant: "destructive",
          duration: 3000
        });
        return;
      }

      const payload = {
        text: `📝 *${title}*`,
        blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${title}*\n\n${content.substring(0, 500)}${content.length > 500 ? '...' : ''}`
          }
        }]

      };

      const response = await fetch(user.slack_webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to post to Slack');

      toast({
        title: "Posted to Slack",
        description: "Content sent successfully",
        duration: 3000
      });
    } catch (error) {
      console.error('Slack post error:', error);
      toast({
        title: "Failed to Post",
        description: error.message || "Could not send to Slack",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - AI Content Generator */}
      <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 h-fit lg:sticky lg:top-24">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                AI Content Generator
              </CardTitle>
              <CardDescription>
                Generate blog posts, social media content, and marketing copy using personas and templates
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="use-ollama-content" className="text-sm cursor-pointer flex items-center gap-2">
                <Server className="w-4 h-4" />
                Ollama
              </Label>
              <Switch
                id="use-ollama-content"
                checked={useOllama}
                onCheckedChange={setUseOllama} />

            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ollama Status Badge */}
          {useOllama &&
          <div className="p-3 bg-gradient-to-r from-orange-50 to-blue-50 border-2 border-orange-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-orange-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Using Ollama</p>
                    <p className="text-xs text-gray-600">
                      {selectedModel || 'No model selected'} • {selectedEndpoint ? 'Connected' : 'Not configured'}
                    </p>
                  </div>
                </div>
                <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/OllamaSettings'}
                className="h-8">

                  <Settings className="w-3 h-3 mr-1" />
                  Configure
                </Button>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <Badge className="bg-green-100 text-green-700 border-green-300">🔒 Local</Badge>
                <Badge className="bg-blue-100 text-blue-700 border-blue-300">🛡️ Secure</Badge>
                <Badge className="bg-purple-100 text-purple-700 border-purple-300">💰 Free</Badge>
                <span className="text-gray-500">• No tokens used</span>
              </div>
            </div>
          }

          {/* Auto-save indicator */}
          <div className="flex items-center justify-between p-2 bg-white/50 rounded border border-purple-200">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Save className="w-3 h-3 text-green-600" />
              <span>Form auto-saves as you work</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm('Clear all saved form data?')) {
                  // Remove all AI content generator localStorage items
                  Object.keys(localStorage).forEach((key) => {
                    if (key.startsWith('ai_content_')) {
                      localStorage.removeItem(key);
                    }
                  });
                  window.location.reload();
                }
              }}
              className="h-6 text-xs">

              <RefreshCw className="w-3 h-3 mr-1" />
              Reset Form
            </Button>
          </div>

          {/* Content Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contentType">Content Type</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contentTypes.map((type) =>
                  <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="length">Length</Label>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {lengthOptions.map((option) =>
                  <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone">Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {toneOptions.map((t) =>
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="variations">Variations: {variations}</Label>
              <Slider
                id="variations"
                min={1}
                max={5}
                step={1}
                value={[variations]}
                onValueChange={([v]) => setVariations(v)} />

            </div>
          </div>

          {/* Persona & Template Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="persona">Persona (Optional)</Label>
              <div className="border rounded-lg p-3 bg-white space-y-2">
                <div className="flex flex-wrap gap-2 min-h-[32px] w-full">
                  {!selectedPersona ?
                  <span className="text-sm text-gray-400 w-full">Search and click a persona below to select</span> :

                  <Badge
                    className="bg-indigo-600 cursor-pointer hover:bg-indigo-700"
                    onClick={() => setSelectedPersona(null)}>

                      {selectedPersona.icon} {selectedPersona.name}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  }
                </div>
                <Input
                  placeholder="🔍 Search personas by name, category, or expertise..."
                  value={personaSearchQuery}
                  onChange={(e) => setPersonaSearchQuery(e.target.value)}
                  className="h-9" />

                <div className="border-t pt-2 max-h-40 overflow-y-auto">
                  {personas.
                  filter((persona) => {
                    if (!personaSearchQuery.trim()) return true;
                    const query = personaSearchQuery.toLowerCase();
                    return (
                      persona.name?.toLowerCase().includes(query) ||
                      persona.category?.toLowerCase().includes(query) ||
                      persona.description?.toLowerCase().includes(query) ||
                      persona.expertise_areas?.some((exp) => exp.toLowerCase().includes(query)));

                  }).
                  slice(0, 20).
                  map((persona) => {
                    const isSelected = selectedPersona?.id === persona.id;
                    return (
                      <div
                        key={persona.id}
                        onClick={() => setSelectedPersona(isSelected ? null : persona)}
                        className={`p-2 rounded cursor-pointer transition-colors ${
                        isSelected ?
                        'bg-indigo-100 hover:bg-indigo-200' :
                        'hover:bg-gray-100'}`
                        }>

                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{persona.icon} {persona.name}</p>
                              <p className="text-xs text-gray-600">{persona.category} • {persona.tone}</p>
                            </div>
                          </div>
                        </div>);

                  })}
                  {personas.filter((persona) => {
                    if (!personaSearchQuery.trim()) return true;
                    const query = personaSearchQuery.toLowerCase();
                    return (
                      persona.name?.toLowerCase().includes(query) ||
                      persona.category?.toLowerCase().includes(query) ||
                      persona.description?.toLowerCase().includes(query) ||
                      persona.expertise_areas?.some((exp) => exp.toLowerCase().includes(query)));

                  }).length === 0 && personaSearchQuery &&
                  <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">No personas found for "{personaSearchQuery}"</p>
                    </div>
                  }
                </div>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="template">Templates (Optional - Multi-Select)</Label>
              <div className="border rounded-lg p-3 bg-white space-y-2">
                <div className="flex flex-wrap gap-2 min-h-[32px] w-full">
                  {selectedTemplates.length === 0 ?
                  <span className="text-sm text-gray-400 w-full">Search and click templates below to select</span> :

                  selectedTemplates.map((template) => {
                    const hasPlaceholders = template.placeholders && template.placeholders.length > 0;
                    const filledCount = hasPlaceholders ? 
                      template.placeholders.filter((p) => placeholderValues[p.key]).length : 0;

                    return (
                      <div key={template.id} className="flex items-center gap-1">
                        <Badge
                          className="bg-purple-600 cursor-pointer hover:bg-purple-700"
                          onClick={() => setSelectedTemplates((prev) => prev.filter((t) => t.id !== template.id))}>
                          {template.title}
                          <X className="w-3 h-3 ml-1" />
                        </Badge>
                        {hasPlaceholders && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                            {filledCount}/{template.placeholders.length}
                          </span>
                        )}
                      </div>
                    );
                  })
                  }
                </div>
                <Input
                  placeholder="🔍 Search templates by title, category, or tags..."
                  value={templateSearchQuery}
                  onChange={(e) => setTemplateSearchQuery(e.target.value)}
                  className="h-9" />

                <div className="border-t pt-2 max-h-40 overflow-y-auto">
                  {templates.
                  filter((template) => {
                    if (!templateSearchQuery.trim()) return true;
                    const query = templateSearchQuery.toLowerCase();
                    return (
                      template.title?.toLowerCase().includes(query) ||
                      template.category?.toLowerCase().includes(query) ||
                      template.tags?.some((tag) => tag.toLowerCase().includes(query)) ||
                      template.description?.toLowerCase().includes(query));

                  }).
                  slice(0, 20).
                  map((template) => {
                    const isSelected = selectedTemplates.some((t) => t.id === template.id);
                    const hasPlaceholders = template.placeholders && template.placeholders.length > 0;
                    return (
                      <div
                        key={template.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedTemplates((prev) => prev.filter((t) => t.id !== template.id));
                          } else {
                            setSelectedTemplates((prev) => [...prev, template]);
                          }
                        }}
                        className={`p-2 rounded cursor-pointer transition-colors ${
                        isSelected ?
                        'bg-purple-100 hover:bg-purple-200' :
                        'hover:bg-gray-100'}`
                        }>

                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{template.title}</p>
                            <p className="text-xs text-gray-600">{template.category}</p>
                          </div>
                          {hasPlaceholders &&
                          <div className="flex gap-1">
                              <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                                {template.placeholders.length} field{template.placeholders.length > 1 ? 's' : ''}
                              </Badge>
                              {template.placeholders.some((p) => p.required) &&
                            <Badge variant="outline" className="text-xs bg-red-50 border-red-200 text-red-700">
                                  Required
                                </Badge>
                            }
                            </div>
                          }
                        </div>
                      </div>);

                  })}
                  {templates.filter((template) => {
                    if (!templateSearchQuery.trim()) return true;
                    const query = templateSearchQuery.toLowerCase();
                    return (
                      template.title?.toLowerCase().includes(query) ||
                      template.category?.toLowerCase().includes(query) ||
                      template.tags?.some((tag) => tag.toLowerCase().includes(query)) ||
                      template.description?.toLowerCase().includes(query));

                  }).length === 0 && templateSearchQuery &&
                  <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">No templates found for "{templateSearchQuery}"</p>
                    </div>
                  }
                </div>
                {selectedTemplates.length > 0 &&
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="sm"
                  onClick={() => {
                    const hasAnyPlaceholders = selectedTemplates.some((t) => t.placeholders && t.placeholders.length > 0);
                    if (hasAnyPlaceholders) {
                      // Initialize placeholder values with defaults
                      const defaults = {};
                      selectedTemplates.forEach((template) => {
                        if (template.placeholders) {
                          template.placeholders.forEach((p) => {
                            if (p.default && !placeholderValues[p.key]) {
                              defaults[p.key] = p.default;
                            }
                          });
                        }
                      });
                      if (Object.keys(defaults).length > 0) {
                        setPlaceholderValues((prev) => ({ ...defaults, ...prev }));
                      }
                      setShowPlaceholderDialog(true);
                    } else {
                      toast({
                        title: "Templates Applied",
                        description: `${selectedTemplates.length} template${selectedTemplates.length > 1 ? 's' : ''} selected`
                      });
                    }
                  }}>

                    {selectedTemplates.some((t) => t.placeholders && t.placeholders.length > 0) ?
                  <>Fill Placeholders & Apply</> :

                  <>Apply {selectedTemplates.length} Template{selectedTemplates.length > 1 ? 's' : ''}</>
                  }
                  </Button>
                }
              </div>
            </div>
          </div>

          {/* Topic Input */}
          <div className="space-y-2">
            <Label htmlFor="topic">Topic / Subject *</Label>
            <Input
              id="topic"
              placeholder="E.g., 'Benefits of AI in content creation' or 'Product launch announcement'"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="text-base" />

          </div>

          {/* Advanced Settings Toggle */}
          <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-900">Advanced Settings</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="h-7">

              {showAdvanced ? 'Hide' : 'Show'}
            </Button>
          </div>



          <Button
            onClick={generateContent}
            disabled={isGenerating || isBeaming || !topic.trim() || useOllama && !beamMode && (!selectedEndpoint || !selectedModel) || beamMode && selectedBeamModels.length === 0}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            size="lg">

            {isGenerating || isBeaming ?
            <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {beamMode ?
              `Beaming with ${selectedBeamModels.length} model${selectedBeamModels.length > 1 ? 's' : ''}...` :
              `Generating ${variations} Variations with ${useOllama ? `Ollama (${selectedModel})` : 'apiClient AI'}${enableWebSearch && !useOllama ? ' + Web Search' : ''}...`
              }
              </> :

            <>
                <Sparkles className="w-5 h-5 mr-2" />
                {beamMode ?
              `Beam Generate with ${selectedBeamModels.length || 0} Model${selectedBeamModels.length !== 1 ? 's' : ''}` :
              `Generate Content with ${useOllama ? 'Ollama' : 'apiClient AI'}${enableWebSearch && !useOllama ? ' + Web Search' : ''}`
              }
              </>
            }
          </Button>
        </CardContent>
      </Card>

      {/* Center Column - History */}
      <div>
        <ContentHistoryViewer
          toolType="ai_content_generator"
          onRegenerate={(item) => {


            // Could implement re-use of history items
          }} />
      </div>

      {/* Results Column */}
      <div className="space-y-6">
        {/* Search Sources Used */}
        {searchSources.length > 0 && <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}>

            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  Sources Used ({searchSources.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {searchSources.map((source, idx) =>
                <div key={idx} className="flex items-start gap-2 p-2 bg-white rounded border">
                      <ExternalLink className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-700 break-all">{source}</p>
                    </div>
                )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        }

        {/* Content Analysis Dashboard */}
        {contentAnalysis &&
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}>

            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  Content Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-lg border">
                    <p className="text-xs text-gray-600">Words</p>
                    <p className="text-xl font-bold text-blue-600">{contentAnalysis.wordCount}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <p className="text-xs text-gray-600">Sentences</p>
                    <p className="text-xl font-bold text-green-600">{contentAnalysis.sentenceCount}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <p className="text-xs text-gray-600">Paragraphs</p>
                    <p className="text-xl font-bold text-purple-600">{contentAnalysis.paragraphCount}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <p className="text-xs text-gray-600">Readability</p>
                    <p className="text-xl font-bold text-orange-600">{contentAnalysis.readabilityScore}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <p className="text-xs text-gray-600">SEO Score</p>
                    <p className="text-xl font-bold text-indigo-600">{contentAnalysis.seoScore}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <p className="text-xs text-gray-600">Read Time</p>
                    <p className="text-xl font-bold text-pink-600">{contentAnalysis.estimatedReadTime}m</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        }

        {/* Beam Results */}
        <AnimatePresence>
          {beamResults.length > 0 &&
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4">

              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  Beam Results ({beamResults.filter((r) => r.status === 'completed').length}/{beamResults.length} successful)
                </h3>
                <Button
                onClick={generateWithBeam}
                variant="outline"
                size="sm"
                disabled={isBeaming}>

                  <RefreshCw className="w-4 h-4 mr-2" />
                  Re-beam
                </Button>
              </div>

              <div className="space-y-4">
                {beamResults.map((result, idx) =>
              <Card key={idx} className={`border-2 ${result.status === 'completed' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={result.status === 'completed' ? 'bg-green-600' : 'bg-red-600'}>
                              {result.model}
                            </Badge>
                            {result.status === 'completed' &&
                        <>
                                <Badge variant="outline">
                                  Score: {result.score}/100
                                </Badge>
                                <Badge variant="outline">
                                  {result.responseTime?.toFixed(1)}s
                                </Badge>
                              </>
                        }
                          </div>
                          <CardTitle className="text-sm text-gray-700">
                            {result.status === 'completed' ?
                        <>
                                {result.tokens?.response || 0} tokens ({((result.tokens?.response || 0) / (result.responseTime || 1)).toFixed(0)} tok/s)
                              </> :

                        <span className="text-red-600">Error: {result.response}</span>
                        }
                          </CardTitle>
                        </div>
                        {result.status === 'completed' &&
                    <div className="flex gap-2">
                            <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(result.response)}
                        title="Copy">

                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => postToSlack(result.response, `${result.model} - ${topic}`)}
                        title="Post to Slack">

                              <Send className="w-4 h-4" />
                            </Button>
                            <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => downloadContent(result.response, `${result.model}-${topic}`)}
                        title="Download">

                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                    }
                      </div>
                    </CardHeader>
                    {result.status === 'completed' &&
                <CardContent>
                        <div className="bg-white p-4 rounded-lg border max-h-96 overflow-y-auto">
                          <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                            {result.response}
                          </pre>
                        </div>
                      </CardContent>
                }
                  </Card>
              )}
              </div>
            </motion.div>
          }
        </AnimatePresence>

        {/* Generated Content Results */}
        <AnimatePresence>
          {generatedContent.length > 0 &&
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4">

              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  Generated Variations ({generatedContent.length})
                </h3>
                <div className="flex gap-2 flex-wrap">
                  <ContentExporter 
                    variations={generatedContent}
                    topic={topic}
                    contentType={contentType}
                  />
                  {useOllama && !generatedContent.some(v => v.quality_score) && (
                    <Button
                      onClick={() => scoreVariationsWithOllama(generatedContent)}
                      variant="outline"
                      size="sm"
                      disabled={isScoringVariations}
                      className="bg-purple-100 hover:bg-purple-200 border-purple-300">
                      {isScoringVariations ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Scoring...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Score Variations
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                  onClick={generateContent}
                  variant="outline"
                  size="sm"
                  disabled={isGenerating}>

                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
              </div>

              {generatedContent.map((variation, idx) =>
            <Card key={idx} className="border-2 border-green-200 bg-green-50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-green-600">Variation {idx + 1}</Badge>
                          <Badge variant="outline">{variation.word_count} words</Badge>
                        </div>
                        <CardTitle className="text-xl text-gray-900">
                          {variation.title}
                        </CardTitle>
                      </div>
                      <div className="flex gap-2">
                        <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(variation.content)}
                      title="Copy">

                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => postToSlack(variation.content, variation.title)}
                      title="Post to Slack">

                          <Send className="w-4 h-4" />
                        </Button>
                        <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => downloadContent(variation.content, variation.title)}
                      title="Download">

                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Tabs defaultValue="content" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="content">Content</TabsTrigger>
                        <TabsTrigger value="hook">Hook</TabsTrigger>
                        <TabsTrigger value="cta">CTA</TabsTrigger>
                        <TabsTrigger value="details">Details</TabsTrigger>
                      </TabsList>

                      <TabsContent value="content" className="mt-4">
                        <div className="bg-white p-4 rounded-lg border border-green-300 max-h-96 overflow-y-auto">
                          <div className="prose prose-sm max-w-none">
                            {variation.content.split('\n\n').map((para, pidx) =>
                        <p key={pidx} className="mb-4 text-gray-800">
                                {para}
                              </p>
                        )}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="hook" className="mt-4">
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-300">
                          <h4 className="font-semibold text-gray-900 mb-2">Opening Hook</h4>
                          <p className="text-gray-800">{variation.hook}</p>
                        </div>
                      </TabsContent>

                      <TabsContent value="cta" className="mt-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-300">
                          <h4 className="font-semibold text-gray-900 mb-2">Call to Action</h4>
                          <p className="text-gray-800">{variation.cta}</p>
                        </div>
                      </TabsContent>

                      <TabsContent value="details" className="mt-4 space-y-4">
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-2">Unique Approach</h4>
                          <p className="text-sm text-gray-700">{variation.approach}</p>
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-2">Best For</h4>
                          <p className="text-sm text-gray-700">{variation.best_for}</p>
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-2">Style Notes</h4>
                          <p className="text-sm text-gray-700">{variation.style_notes}</p>
                        </div>

                        {variation.sources && variation.sources.length > 0 &&
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                              <Globe className="w-4 h-4 text-blue-600" />
                              Sources Referenced
                            </h4>
                            <div className="space-y-1">
                              {variation.sources.map((source, sidx) =>
                        <div key={sidx} className="flex items-start gap-2">
                                  <ExternalLink className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                                  <p className="text-xs text-gray-700 break-all">{source}</p>
                                </div>
                        )}
                            </div>
                          </div>
                    }
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
            )}
            </motion.div>
          }
        </AnimatePresence>
      </div>

      {/* Right Column - Custom Instructions, Generation Options & AI Suggestions */}
      <div className="space-y-6 lg:sticky lg:top-24 lg:self-start hidden lg:block">
        {/* Custom Instructions */}
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-purple-600" />
              Custom Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Project Loader */}
            {projects.length > 0 &&
            <div className="space-y-2">
                <Label className="text-xs font-semibold">Load from Project</Label>
                <div className="flex gap-2">
                  <Select
                  value={selectedProject || 'none'}
                  onValueChange={(id) => {
                    if (id === 'none') {
                      setSelectedProject(null);
                    } else {
                      loadProjectInstructions(id);
                    }
                  }}>

                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select a project..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Project</SelectItem>
                      {projects.map((project) =>
                    <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                    )}
                    </SelectContent>
                  </Select>
                  {selectedProject &&
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedProject(null);
                    setCustomInstructions('');
                  }}
                  title="Clear project">

                      <X className="w-4 h-4" />
                    </Button>
                }
                </div>
                {selectedProject &&
              <Badge className="bg-purple-100 text-purple-700">
                    Project context loaded
                  </Badge>
              }
              </div>
            }
            <Textarea
              placeholder="Additional instructions or requirements...

Examples:
- Include specific statistics or data points
- Mention competitor products
- Focus on environmental benefits
- Include customer testimonials"












              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              rows={6}
              className="resize-none bg-white" />

          </CardContent>
        </Card>

        {/* Generation Options */}
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              Generation Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold">Web Search</p>
                  <p className="text-xs text-gray-600">Real-time data & sources</p>
                </div>
              </div>
              <Switch
                checked={enableWebSearch}
                onCheckedChange={setEnableWebSearch}
                disabled={useOllama} />

            </div>

            {useOllama &&
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-600" />
                  <div>
                    <p className="text-sm font-semibold">Beam Mode</p>
                    <p className="text-xs text-gray-600">Compare multiple models</p>
                  </div>
                </div>
                <Switch
                checked={beamMode}
                onCheckedChange={setBeamMode} />

              </div>
            }

            {beamMode && useOllama && availableModels.length > 0 &&
            <div className="space-y-2 pt-2 border-t">
                <Label className="text-xs font-semibold">Select Models</Label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {availableModels.map((model) =>
                <div
                  key={model.name}
                  onClick={() => {
                    setSelectedBeamModels((prev) =>
                    prev.includes(model.name) ?
                    prev.filter((m) => m !== model.name) :
                    [...prev, model.name]
                    );
                  }}
                  className={`p-2 rounded border cursor-pointer transition-all ${
                  selectedBeamModels.includes(model.name) ?
                  'bg-cyan-100 border-cyan-500' :
                  'bg-gray-50 border-gray-200'}`
                  }>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-xs">{model.name}</p>
                          <p className="text-xs text-gray-600">
                            {(model.size / 1024 / 1024 / 1024).toFixed(1)} GB
                          </p>
                        </div>
                        {selectedBeamModels.includes(model.name) &&
                    <Check className="w-4 h-4 text-cyan-600" />
                    }
                      </div>
                    </div>
                )}
                </div>
              </div>
            }
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        {showAdvanced &&
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="w-4 h-4 text-purple-600" />
                Advanced Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs">Creativity: {temperature}</Label>
                  <Slider
                  min={0}
                  max={1}
                  step={0.1}
                  value={[temperature]}
                  onValueChange={([v]) => setTemperature(v)} />

                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Max Tokens: {maxTokens}</Label>
                  <Slider
                  min={500}
                  max={4000}
                  step={100}
                  value={[maxTokens]}
                  onValueChange={([v]) => setMaxTokens(v)} />

                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Target Audience</Label>
                  <Input
                  placeholder="e.g., Marketing professionals"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="h-9 bg-white" />

                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Keywords</Label>
                  <Input
                  placeholder="AI, automation"
                  value={includeKeywords}
                  onChange={(e) => setIncludeKeywords(e.target.value)}
                  className="h-9 bg-white" />

                </div>

                <div className="flex items-center justify-between p-2 bg-white rounded border">
                  <span className="text-xs font-medium">SEO Optimize</span>
                  <Switch
                  checked={seoOptimize}
                  onCheckedChange={setSeoOptimize} />

                </div>
              </div>
            </CardContent>
          </Card>
        }

        {/* AI Suggestions */}
        {!beamMode && useOllama && selectedEndpoint && selectedModel &&
        <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <Lightbulb className="w-4 h-4 text-yellow-600" />
                  <CardTitle className="text-sm font-semibold">AI Suggestions</CardTitle>
                  <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">🔒 Local</Badge>
                </div>
                <Button
                variant="outline"
                size="sm"
                onClick={generateSuggestionsWithOllama}
                disabled={isLoadingSuggestions || !topic.trim()}
                className="h-7 bg-yellow-100 hover:bg-yellow-200 border-yellow-300">

                  {isLoadingSuggestions ?
                <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Thinking...
                    </> :

                <>
                      <Sparkles className="w-3 h-3 mr-1" />
                      Get Tips
                    </>
                }
                </Button>
              </div>
            </CardHeader>
            
            {aiSuggestions.length > 0 &&
          <CardContent className="px-4 pb-3 pt-2">
                <div className="space-y-2">
                  {aiSuggestions.slice(0, 3).map((suggestion, idx) =>
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-2 bg-white rounded-lg border border-yellow-200 text-xs">

                      <p className="font-medium text-gray-900">{suggestion.question}</p>
                      <p className="text-gray-600 mt-0.5">{suggestion.reason}</p>
                    </motion.div>
              )}
                </div>
              </CardContent>
          }
          </Card>
        }
      </div>

      {/* Placeholder Dialog */}
      <Dialog open={showPlaceholderDialog} onOpenChange={setShowPlaceholderDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-purple-600" />
              Fill Template Placeholders
            </DialogTitle>
            <DialogDescription>
              Fill in the placeholder values for {selectedTemplates.length} selected template{selectedTemplates.length > 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>

          {/* Preset Manager */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-gray-900">Saved Presets</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSavePreset(!showSavePreset)}>

                <Save className="w-3 h-3 mr-1" />
                Save Current
              </Button>
            </div>

            {showSavePreset &&
            <div className="space-y-2 p-3 bg-white rounded-lg border">
                <Input
                placeholder="Preset name (e.g., 'Q1 Marketing Campaign')"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)} />

                <Select value={newPresetType} onValueChange={setNewPresetType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="campaign">Campaign</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                placeholder="Description (optional)"
                value={newPresetDescription}
                onChange={(e) => setNewPresetDescription(e.target.value)} />

                <div className="flex gap-2">
                  <Button onClick={savePreset} className="flex-1 bg-blue-600 hover:bg-blue-700" size="sm">
                    <Save className="w-3 h-3 mr-1" />
                    Save
                  </Button>
                  <Button onClick={() => setShowSavePreset(false)} variant="outline" size="sm">
                    Cancel
                  </Button>
                </div>
              </div>
            }

            {placeholderPresets.length > 0 &&
            <div className="space-y-2 max-h-40 overflow-y-auto">
                {placeholderPresets.map((preset) =>
              <div
                key={preset.id}
                className={`flex items-center justify-between p-2 rounded border bg-white hover:bg-blue-50 transition-colors ${
                selectedPreset?.id === preset.id ? 'border-blue-500 bg-blue-50' : ''}`
                }>

                    <div className="flex-1 cursor-pointer" onClick={() => loadPreset(preset)}>
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-3 h-3 text-blue-600" />
                        <span className="text-sm font-medium">{preset.preset_name}</span>
                        <Badge variant="outline" className="text-xs">{preset.preset_type}</Badge>
                      </div>
                      {preset.description &&
                  <p className="text-xs text-gray-600 ml-5">{preset.description}</p>
                  }
                      <p className="text-xs text-gray-500 ml-5">Used {preset.use_count || 0} times</p>
                    </div>
                    <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(preset);
                  }}>

                      <Star className={`w-3 h-3 ${preset.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                    </Button>
                  </div>
              )}
              </div>
            }
          </div>
          
          <div className="flex-1 overflow-y-auto py-4 space-y-6">
            {selectedTemplates.map((template) => {
              const templatePlaceholders = template.placeholders || [];
              if (templatePlaceholders.length === 0) return null;

              return (
                <div key={template.id} className="space-y-4 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    {template.title}
                  </h3>
                  
                  <div className="space-y-3">
                    {/* Ready for Substitution Summary */}
                    {templatePlaceholders.some((p) => placeholderValues[p.key]) && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs font-semibold text-green-900 mb-2">✓ Ready for Substitution:</p>
                        <div className="flex flex-wrap gap-2">
                          {templatePlaceholders
                            .filter((p) => placeholderValues[p.key])
                            .map((p) => (
                              <div key={p.key} className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-green-300">
                                <code className="text-xs text-gray-600">{`{${p.key}}`}</code>
                                <span className="text-xs text-gray-700">=</span>
                                <span className="text-xs text-green-700 font-medium truncate max-w-[150px]" title={placeholderValues[p.key]}>
                                  {String(placeholderValues[p.key]).substring(0, 20)}
                                  {String(placeholderValues[p.key]).length > 20 ? '...' : ''}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {templatePlaceholders.map((placeholder) => {
                      const error = placeholderErrors[placeholder.key];
                      const fieldType = placeholder.type || 'text';

                      return (
                        <div key={placeholder.key} className="space-y-2">
                          <Label htmlFor={`placeholder-${placeholder.key}`} className="flex items-start justify-between gap-2">
                            <span className="font-medium">
                              {placeholder.label || placeholder.key}
                              {placeholder.required && <span className="text-red-500 ml-1">*</span>}
                            </span>
                            <code className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded border">
                              {`{${placeholder.key}}`}
                            </code>
                          </Label>
                          {placeholder.description &&
                          <p className="text-xs text-gray-600 mb-1">{placeholder.description}</p>
                          }
                          
                          {fieldType === 'textarea' ?
                          <Textarea
                            id={`placeholder-${placeholder.key}`}
                            placeholder={placeholder.default || `Enter ${placeholder.label || placeholder.key}...`}
                            value={placeholderValues[placeholder.key] || ''}
                            onChange={(e) => {
                              setPlaceholderValues((prev) => ({
                                ...prev,
                                [placeholder.key]: e.target.value
                              }));
                              if (error) {
                                setPlaceholderErrors((prev) => {
                                  const newErrors = { ...prev };
                                  delete newErrors[placeholder.key];
                                  return newErrors;
                                });
                              }
                            }}
                            className={`bg-white ${error ? 'border-red-500' : ''}`}
                            rows={3} /> :

                          fieldType === 'dropdown' ?
                          <Select
                            value={placeholderValues[placeholder.key] || ''}
                            onValueChange={(value) => {
                              setPlaceholderValues((prev) => ({
                                ...prev,
                                [placeholder.key]: value
                              }));
                              if (error) {
                                setPlaceholderErrors((prev) => {
                                  const newErrors = { ...prev };
                                  delete newErrors[placeholder.key];
                                  return newErrors;
                                });
                              }
                            }}>

                              <SelectTrigger className={`bg-white ${error ? 'border-red-500' : ''}`}>
                                <SelectValue placeholder={placeholder.default || "Select an option..."} />
                              </SelectTrigger>
                              <SelectContent>
                                {(placeholder.options || []).map((option) => {
                                  const optionValue = typeof option === 'string' ? option : option.value || option.label || option.key;
                                  const optionLabel = typeof option === 'string' ? option : option.label || option.value || option.key;
                                  return (
                                    <SelectItem key={optionValue} value={optionValue}>
                                      {optionLabel}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select> :
                          fieldType === 'checkbox' ?
                          <div className="flex items-center space-x-2">
                              <Switch
                              id={`placeholder-${placeholder.key}`}
                              checked={placeholderValues[placeholder.key] === 'true' || placeholderValues[placeholder.key] === true}
                              onCheckedChange={(checked) => {
                                setPlaceholderValues((prev) => ({
                                  ...prev,
                                  [placeholder.key]: checked.toString()
                                }));
                              }} />

                              <Label htmlFor={`placeholder-${placeholder.key}`} className="text-sm text-gray-600">
                                {placeholder.default || 'Enable this option'}
                              </Label>
                            </div> :

                          <Input
                            id={`placeholder-${placeholder.key}`}
                            type={fieldType === 'number' ? 'number' : fieldType === 'email' ? 'email' : fieldType === 'url' ? 'url' : fieldType === 'date' ? 'date' : 'text'}
                            placeholder={placeholder.default || `Enter ${placeholder.label || placeholder.key}...`}
                            value={placeholderValues[placeholder.key] || ''}
                            onChange={(e) => {
                              setPlaceholderValues((prev) => ({
                                ...prev,
                                [placeholder.key]: e.target.value
                              }));
                              if (error) {
                                setPlaceholderErrors((prev) => {
                                  const newErrors = { ...prev };
                                  delete newErrors[placeholder.key];
                                  return newErrors;
                                });
                              }
                            }}
                            onBlur={() => {
                              const validationError = validatePlaceholder(placeholder, placeholderValues[placeholder.key]);
                              if (validationError) {
                                setPlaceholderErrors((prev) => ({
                                  ...prev,
                                  [placeholder.key]: validationError
                                }));
                              }
                            }}
                            min={placeholder.min}
                            max={placeholder.max}
                            className={`bg-white ${error ? 'border-red-500' : ''}`} />

                          }
                          
                          {error &&
                          <p className="text-xs text-red-600 flex items-center gap-1">
                              <X className="w-3 h-3" />
                              {error}
                            </p>
                          }
                          
                          {!error && fieldType === 'number' && (placeholder.min !== undefined || placeholder.max !== undefined) &&
                          <p className="text-xs text-gray-500">
                              {placeholder.min !== undefined && placeholder.max !== undefined ?
                            `Range: ${placeholder.min} - ${placeholder.max}` :
                            placeholder.min !== undefined ?
                            `Min: ${placeholder.min}` :
                            `Max: ${placeholder.max}`}
                            </p>
                          }
                        </div>);

                    })}
                  </div>
                </div>);

            })}
            
            {getAllPlaceholders().length === 0 &&
            <div className="text-center py-8 text-gray-500">
                <p>No placeholders to fill</p>
              </div>
            }
            
            {/* Preview Section */}
            {getAllPlaceholders().length > 0 &&
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Live Preview
                </h3>
                <div className="space-y-3">
                  {selectedTemplates.map((template) => {
                  if (!template.placeholders || template.placeholders.length === 0) return null;
                  const preview = applyPlaceholders(template.content, placeholderValues);
                  const hasUnfilled = template.placeholders.some((p) => !placeholderValues[p.key]);

                  return (
                    <div key={template.id} className="bg-white p-4 rounded-lg border-2 border-blue-300">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-gray-900">{template.title}</p>
                          {hasUnfilled &&
                        <Badge variant="outline" className="bg-amber-50 border-amber-300 text-amber-700 text-xs">
                              Incomplete
                            </Badge>
                        }
                        </div>
                        <div className="bg-gray-50 p-3 rounded border max-h-48 overflow-y-auto">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {preview.split(/(\{[^}]+\})/).map((part, idx) => {
                            if (part.match(/^\{[^}]+\}$/)) {
                              return (
                                <span key={idx} className="bg-yellow-100 text-yellow-800 px-1 rounded font-mono text-xs">
                                    {part}
                                  </span>);

                            }
                            return part;
                          })}
                          </p>
                        </div>
                      </div>);

                })}
                </div>
                </div>
            }
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowPlaceholderDialog(false);
                setPlaceholderValues({});
              }}>

              Cancel
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => {
                const errors = validateAllPlaceholders();
                if (Object.keys(errors).length > 0) {
                  setPlaceholderErrors(errors);
                  toast({
                    title: "Validation Failed",
                    description: `Please fix ${Object.keys(errors).length} error${Object.keys(errors).length > 1 ? 's' : ''} before applying`,
                    variant: "destructive"
                  });
                  return;
                }

                setShowPlaceholderDialog(false);
                setPlaceholderErrors({});
                toast({
                  title: "Placeholders Applied",
                  description: `${selectedTemplates.length} template${selectedTemplates.length > 1 ? 's' : ''} configured and ready`
                });
              }}>

              <Check className="w-4 h-4 mr-2" />
              Apply Templates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>);

}
