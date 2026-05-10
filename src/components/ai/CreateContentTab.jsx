import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Server, FolderOpen, Users, Check, ChevronsUpDown, X, FileText, Sparkles, Save, Loader2, AlertCircle, Award, TrendingUp, Target, ChevronDown, ChevronUp, Wand2, Zap } from "lucide-react";
import PresetManager from './PresetManager';
import PlaceholderSubstitutionPanel from './PlaceholderSubstitutionPanel';
import { ENABLE_ELASTICSEARCH } from '@/apis/client';
import { aiContentES } from '../utils/elasticsearchFallback';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/apis/client";
import { useToast } from "@/components/ui/use-toast";
import { getOllamaSettings } from "../utils/ollamaSettings";
import { motion } from "framer-motion";

export default function CreateContentTab({ personas, templates, projects }) {
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [ollamaEndpoint, setOllamaEndpoint] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [availableModels, setAvailableModels] = useState([]);
  const [projectPopoverOpen, setProjectPopoverOpen] = useState(false);
  const [personaPopoverOpen, setPersonaPopoverOpen] = useState(false);
  const [templatePopoverOpen, setTemplatePopoverOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [generatedContent, setGeneratedContent] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [placeholderValues, setPlaceholderValues] = useState({});
  const [variationCount, setVariationCount] = useState(10);
  const [contentStyle, setContentStyle] = useState('');
  const [isScoringVariations, setIsScoringVariations] = useState(false);
  const [expandedScores, setExpandedScores] = useState({});
  const [enableScoring, setEnableScoring] = useState(true);
  const [enableStreaming, setEnableStreaming] = useState(false);
  const [suggestingPlaceholders, setSuggestingPlaceholders] = useState({});
  const [showPlaceholderPreview, setShowPlaceholderPreview] = useState(false);
  const [showSelectedTemplates, setShowSelectedTemplates] = useState(false);

  const handleLoadPreset = (preset) => {
    // Load project
    if (preset.project_id) {
      const project = projects.find(p => p.id === preset.project_id);
      if (project) setSelectedProject(project);
    } else {
      setSelectedProject(null);
    }

    // Load persona
    if (preset.persona_id) {
      const persona = personas.find(p => p.id === preset.persona_id);
      if (persona) setSelectedPersona(persona);
    } else {
      setSelectedPersona(null);
    }

    // Load templates
    if (preset.template_ids && preset.template_ids.length > 0) {
      const templateList = templates.filter(t => preset.template_ids.includes(t.id));
      setSelectedTemplates(templateList);
    } else {
      setSelectedTemplates([]);
    }

    // Load other settings
    if (preset.content_style) setContentStyle(preset.content_style);
    if (preset.variation_count) setVariationCount(preset.variation_count);
    if (preset.enable_scoring !== undefined) setEnableScoring(preset.enable_scoring);
    if (preset.placeholder_values) setPlaceholderValues(preset.placeholder_values);
  };

  useEffect(() => {
    const settings = getOllamaSettings();
    setOllamaEndpoint(settings.selectedEndpoint || '');
    setSelectedModel(settings.selectedModel || '');

    if (settings.selectedEndpoint) {
      loadOllamaModels(settings.selectedEndpoint);
    }

    // Load variation count and content style from user settings
    const loadSettings = async () => {
      const user = await apiClient.auth.me();
      if (user?.variation_count) {
        setVariationCount(user.variation_count);
      }
      if (user?.template_content_style) {
        setContentStyle(user.template_content_style);
      }
    };
    loadSettings();
  }, []);

  const loadOllamaModels = async (endpoint) => {
    try {
      const { data } = await apiClient.functions.invoke('ollamaProxy', { endpoint, action: 'list-models' });
      setAvailableModels((data.models || []).map(m => ({ name: m.id })));
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  // Auto-load linked templates when project/persona changes (append mode)
  useEffect(() => {
    const loadLinkedTemplates = () => {
      const linkedIds = [];
      
      if (selectedProject?.linked_template_ids) {
        linkedIds.push(...selectedProject.linked_template_ids);
      }
      
      if (selectedPersona?.linked_template_ids) {
        linkedIds.push(...selectedPersona.linked_template_ids);
      }
      
      if (linkedIds.length > 0) {
        const uniqueIds = [...new Set(linkedIds)];
        const linked = templates.filter(t => uniqueIds.includes(t.id));
        if (linked.length > 0) {
          // Append to existing templates, not replace
          setSelectedTemplates(prev => {
            const existingIds = new Set(prev.map(t => t.id));
            const newTemplates = linked.filter(t => !existingIds.has(t.id));
            if (newTemplates.length > 0) {
              toast({
                title: "Templates Appended",
                description: `Added ${newTemplates.length} new linked template${newTemplates.length > 1 ? 's' : ''}`
              });
              return [...prev, ...newTemplates];
            }
            return prev;
          });
        }
      }
    };
    
    loadLinkedTemplates();
  }, [selectedProject, selectedPersona, templates]);

  // Get all unique placeholders from selected templates
  const getAllPlaceholders = () => {
    const placeholderMap = new Map();
    selectedTemplates.forEach(template => {
      if (template.placeholders) {
        template.placeholders.forEach(ph => {
          if (!placeholderMap.has(ph.key)) {
            placeholderMap.set(ph.key, ph);
          }
        });
      }
    });
    return Array.from(placeholderMap.values());
  };

  const allPlaceholders = getAllPlaceholders();

  // Auto-fill common placeholders from project data
  const getAutoFilledPlaceholders = () => {
    if (!selectedProject) return {};
    
    const autoFilled = {};
    const commonMappings = {
      name: selectedProject.name,
      topic: selectedProject.name,
      company: selectedProject.name,
      company_name: selectedProject.name,
      project: selectedProject.name,
      project_name: selectedProject.name,
      brand: selectedProject.name,
      brand_name: selectedProject.name,
      organization: selectedProject.name,
      business: selectedProject.name,
      business_name: selectedProject.name,
      company_about: selectedProject.about,
      project_about: selectedProject.about,
      company_description: selectedProject.about,
      project_description: selectedProject.about,
      about: selectedProject.about,
      description: selectedProject.about,
      target_audience: selectedProject.target_audience,
      audience: selectedProject.target_audience,
      customers: selectedProject.target_audience,
      tone: selectedProject.tone,
      voice: selectedProject.tone,
      style: selectedProject.tone,
      usps: Array.isArray(selectedProject.usps) ? selectedProject.usps.join(', ') : selectedProject.usps,
      keywords: Array.isArray(selectedProject.keywords) ? selectedProject.keywords.join(', ') : selectedProject.keywords,
      key_features: Array.isArray(selectedProject.usps) ? selectedProject.usps.join(', ') : selectedProject.usps,
      features: Array.isArray(selectedProject.usps) ? selectedProject.usps.join(', ') : selectedProject.usps,
      vision: selectedProject.vision,
      mission: selectedProject.mission,
      category: selectedProject.category,
      industry: selectedProject.industry,
      website: selectedProject.website,
      url: selectedProject.website,
      link: selectedProject.website,
    };

    allPlaceholders.forEach(ph => {
      const key = ph.key.toLowerCase().replace(/[{}]/g, '');
      if (commonMappings[key] && !placeholderValues[ph.key]) {
        autoFilled[ph.key] = commonMappings[key];
      }
    });

    return autoFilled;
  };

  // Score a single variation using Ollama
  const scoreVariation = async (variation, context) => {
    try {
      const scoringPrompt = `You are a content quality analyst. Analyze the following content and provide HONEST, UNIQUE scores based on your actual assessment. DO NOT use placeholder or example values.

CONTENT TO ANALYZE:
Title: ${variation.title}
Content: ${variation.content}

CONTEXT PROVIDED:
${context}

Carefully evaluate and score each metric from 0-100:
- Quality: Writing quality, clarity, grammar, professionalism
- Relevance: How well does this match the topic and provided context?
- Engagement: Will this capture and hold reader attention?
- SEO: Search engine optimization potential (keywords, structure)
- Readability: How easy is this to understand?
- Tone: Does the tone match what was requested in context?
- Value: How useful is this to the target audience?

Calculate overall_score as the average of all metrics.

Identify SPECIFIC strengths and improvements for THIS content (not generic advice).

Return ONLY this JSON structure with YOUR ACTUAL ASSESSMENT:
{
  "overall_score": [calculated average of all metrics],
  "metrics": {
    "quality": [your score 0-100],
    "relevance": [your score 0-100],
    "engagement": [your score 0-100],
    "seo": [your score 0-100],
    "readability": [your score 0-100],
    "tone": [your score 0-100],
    "value": [your score 0-100]
  },
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "improvements": ["specific improvement 1", "specific improvement 2", "specific improvement 3"]
}`;

      const { data } = await apiClient.functions.invoke('ollamaProxy', {
        endpoint: ollamaEndpoint,
        action: 'chat',
        model: selectedModel,
        messages: [{ role: "user", content: scoringPrompt }],
        options: { stream: false }
      });

      const content = data.message?.content;
      
      if (!content) {
        console.error('No content in scoring response');
        return null;
      }

      const scores = JSON.parse(content);
      
      // Validate that we got actual scores
      if (!scores.metrics) {
        console.error('Invalid score structure:', scores);
        return null;
      }

      // Calculate accurate overall_score as average of all metrics
      const metricValues = Object.values(scores.metrics);
      const calculatedAverage = Math.round(
        metricValues.reduce((sum, val) => sum + val, 0) / metricValues.length
      );
      
      scores.overall_score = calculatedAverage;

      return scores;
    } catch (error) {
      console.error('Scoring error:', error);
      return null;
    }
  };

  // Score all variations automatically with delays
  const scoreAllVariations = async (variations, context) => {
    setIsScoringVariations(true);
    const scoredVariations = [];

    for (let i = 0; i < variations.length; i++) {
      const scores = await scoreVariation(variations[i], context);
      
      // Only add scores if we got valid data
      if (scores && scores.overall_score) {
        scoredVariations.push({
          ...variations[i],
          scores: scores
        });
      } else {
        // No scores available - don't show scoring UI
        scoredVariations.push({
          ...variations[i],
          scores: null
        });
      }
      
      // Add 1.5 second delay between scoring calls
      if (i < variations.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    setIsScoringVariations(false);
    return scoredVariations;
  };

  const generateContent = async () => {
    if (!selectedModel) {
      toast({
        title: "Model Required",
        description: "Please select an Ollama model",
        variant: "destructive"
      });
      return;
    }



    setIsGenerating(true);
    setGeneratedContent([]);

    try {
      const personaContext = selectedPersona ? `
PERSONA CONTEXT:
- Name: ${selectedPersona.name}
- Description: ${selectedPersona.description}
- Tone: ${selectedPersona.tone}
${selectedPersona.instructions ? `- Instructions: ${selectedPersona.instructions}` : ''}
` : '';

      const projectContext = selectedProject ? `
PROJECT CONTEXT:
- Name: ${selectedProject.name}
${selectedProject.about ? `- About: ${selectedProject.about}` : ''}
${selectedProject.tone ? `- Tone: ${selectedProject.tone}` : ''}
${selectedProject.target_audience ? `- Target Audience: ${selectedProject.target_audience}` : ''}
` : '';

      const templateContext = selectedTemplates.length > 0 ? `
TEMPLATE CONTEXT (${selectedTemplates.length} templates):
${selectedTemplates.map(t => `- ${t.title} (${t.category})\n  ${t.content.substring(0, 200)}...`).join('\n\n')}
` : '';

      const autoFilledValues = getAutoFilledPlaceholders();
      const finalPlaceholderValues = { ...autoFilledValues, ...placeholderValues };

      const placeholdersContext = allPlaceholders.length > 0 ? `
      PLACEHOLDER VALUES:
      ${allPlaceholders.map(ph => `- ${ph.label}: ${finalPlaceholderValues[ph.key] || '[NOT SET]'}`).join('\n')}
      ` : '';

      const styleContext = contentStyle ? `
      CONTENT STYLE: ${contentStyle}
      ` : '';

      const prompt = `Generate creative content based on these specifications:

      ${projectContext}
      ${personaContext}
      ${templateContext}
      ${placeholdersContext}
      ${styleContext}
      TOPIC: ${topic}

      Create ${variationCount} distinct variations of high-quality content. Each should be unique and valuable.

Return ONLY valid JSON:
{
  "variations": [
    {
      "title": "Variation title",
      "content": "Full content text"
    }
  ]
}`;

      setPromptText(prompt);

      const { data: genData } = await apiClient.functions.invoke('ollamaProxy', {
        endpoint: ollamaEndpoint,
        action: 'chat',
        model: selectedModel,
        messages: [{ role: "user", content: prompt }],
        options: { stream: false }
      });

      if (!genData?.message) throw new Error('Generation failed');

      let result;
      result = JSON.parse(genData.message?.content || '{"variations": []}');
      
      // Score variations automatically if enabled
      let finalVariations = result.variations || [];
      if (enableScoring) {
        const scoringContext = `${projectContext}\n${personaContext}\n${templateContext}`;
        finalVariations = await scoreAllVariations(finalVariations, scoringContext);
      }
      setGeneratedContent(finalVariations);

      // Prepare content history data
      const user = await apiClient.auth.me();
      const historyData = {
        tool_type: 'AI Content Generator',
        project_id: selectedProject?.id,
        persona_id: selectedPersona?.id,
        persona_name: selectedPersona?.name,
        template_ids: selectedTemplates.map(t => t.id),
        template_names: selectedTemplates.map(t => t.title).join(', '),
        topic: topic,
        request_prompt: prompt,
        tone: selectedProject?.tone || selectedPersona?.tone,
        custom_instructions: contentStyle,
        variations_count: finalVariations.length,
        use_ollama: true,
        ollama_model: selectedModel,
        generated_content: finalVariations.map(v => ({
          title: v.title,
          content: v.content,
          word_count: v.content.split(/\s+/).length
        })),
        settings: {
          enable_scoring: enableScoring,
          enable_streaming: enableStreaming,
          content_style: contentStyle
        },
        created_by: user?.email
      };

      // Save to ContentHistory (primary database)
      await apiClient.entities.ContentHistory.create(historyData);

      // Also save to Elasticsearch if enabled
      if (ENABLE_ELASTICSEARCH) {
        try {
          await aiContentES.create(historyData);
          console.log('✅ Saved AI content to Elasticsearch');
        } catch (esError) {
          console.error('⚠️ Failed to save to Elasticsearch:', esError);
          // Don't fail the whole operation if ES fails
        }
      }

      toast({
        title: enableScoring ? "Content Generated & Scored" : "Content Generated",
        description: enableScoring 
          ? `Created ${finalVariations.length} variations with AI quality scores`
          : `Created ${finalVariations.length} variations`
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const suggestPlaceholderValue = async (placeholder) => {
    if (!selectedModel || !ollamaEndpoint) {
      toast({
        title: "Model Required",
        description: "Please select an Ollama model first",
        variant: "destructive"
      });
      return;
    }

    setSuggestingPlaceholders(prev => ({ ...prev, [placeholder.key]: true }));

    try {
      const contextInfo = `
PROJECT: ${selectedProject?.name || 'Not selected'}
${selectedProject?.about ? `About: ${selectedProject.about}` : ''}
${selectedProject?.target_audience ? `Target Audience: ${selectedProject.target_audience}` : ''}

PERSONA: ${selectedPersona?.name || 'Not selected'}
${selectedPersona?.description ? `Description: ${selectedPersona.description}` : ''}

TOPIC: ${topic || 'Not specified'}
`;

      const prompt = `You are an AI assistant helping fill in a placeholder for content generation.

CONTEXT:
${contextInfo}

PLACEHOLDER TO FILL:
- Key: ${placeholder.key}
- Label: ${placeholder.label}
${placeholder.description ? `- Description: ${placeholder.description}` : ''}
${placeholder.type ? `- Type: ${placeholder.type}` : ''}

Based on the context above, suggest a smart, relevant value for this placeholder. Be specific and creative.
If the context is limited, provide a reasonable example that would work well.

Return ONLY a JSON object:
{
  "suggestion": "your suggested value here"
}`;

      const { data: suggData } = await apiClient.functions.invoke('ollamaProxy', {
        endpoint: ollamaEndpoint,
        action: 'chat',
        model: selectedModel,
        messages: [{ role: "user", content: prompt }],
        options: { stream: false }
      });

      if (!suggData?.message) throw new Error('Suggestion failed');

      const result = JSON.parse(suggData.message?.content || '{"suggestion": ""}');
      
      if (result.suggestion) {
        setPlaceholderValues(prev => ({
          ...prev,
          [placeholder.key]: result.suggestion
        }));
        toast({
          title: "Suggestion Applied",
          description: `AI suggested value for ${placeholder.label}`
        });
      }
    } catch (error) {
      toast({
        title: "Suggestion Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSuggestingPlaceholders(prev => ({ ...prev, [placeholder.key]: false }));
    }
  };

  const saveAsTemplate = async (content, title) => {
    try {
      const newTemplate = await apiClient.entities.Template.create({
        title: title || content.substring(0, 50) + "...",
        content: content,
        category: "Generated",
        folder: selectedProject?.name || "AI Generated",
        tags: ["ai-generated"]
      });

      // Update project/persona with new linked template
      if (selectedProject) {
        const updatedIds = [...(selectedProject.linked_template_ids || []), newTemplate.id];
        await apiClient.entities.Project.update(selectedProject.id, {
          linked_template_ids: updatedIds
        });
      }

      if (selectedPersona) {
        const updatedIds = [...(selectedPersona.linked_template_ids || []), newTemplate.id];
        await apiClient.entities.Persona.update(selectedPersona.id, {
          linked_template_ids: updatedIds
        });
      }

      toast({
        title: "Template Saved & Linked",
        description: "Content saved as new template and linked to selection"
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Row */}
      <Card className="border-2 border-purple-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            {/* Ollama Model */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-900 flex items-center gap-1">
                <Server className="w-3 h-3 text-orange-600" />
                Model
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-between h-8 text-xs">
                    {selectedModel || "Select..."}
                    <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search models..." />
                    <CommandEmpty>No models found.</CommandEmpty>
                    <CommandGroup className="max-h-[200px] overflow-auto">
                      {availableModels.map((model) => (
                        <CommandItem
                          key={model.name}
                          value={model.name}
                          onSelect={() => setSelectedModel(model.name)}
                        >
                          <Check className={`mr-2 h-4 w-4 ${selectedModel === model.name ? "opacity-100" : "opacity-0"}`} />
                          {model.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Projects */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-900 flex items-center gap-1">
                <FolderOpen className="w-3 h-3 text-blue-600" />
                Project
              </label>
              <Popover open={projectPopoverOpen} onOpenChange={setProjectPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-between h-8 text-xs overflow-hidden">
                    <span className="truncate">{selectedProject?.name || "Select..."}</span>
                    <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search projects..." />
                    <CommandEmpty>No projects found.</CommandEmpty>
                    <CommandGroup className="max-h-[200px] overflow-auto">
                      <CommandItem value="none" onSelect={() => { setSelectedProject(null); setProjectPopoverOpen(false); }}>
                        <Check className={`mr-2 h-4 w-4 ${!selectedProject ? "opacity-100" : "opacity-0"}`} />
                        No Project
                      </CommandItem>
                      {projects.map((project) => (
                        <CommandItem key={project.id} value={project.name} onSelect={() => { setSelectedProject(project); setProjectPopoverOpen(false); }}>
                          <Check className={`mr-2 h-4 w-4 ${selectedProject?.id === project.id ? "opacity-100" : "opacity-0"}`} />
                          {project.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Personas */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-900 flex items-center gap-1">
                <Users className="w-3 h-3 text-indigo-600" />
                Persona
              </label>
              <Popover open={personaPopoverOpen} onOpenChange={setPersonaPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-between h-8 text-xs overflow-hidden">
                    <span className="truncate">{selectedPersona ? `${selectedPersona.icon} ${selectedPersona.name}` : "Select..."}</span>
                    <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search personas..." />
                    <CommandEmpty>No personas found.</CommandEmpty>
                    <CommandGroup className="max-h-[200px] overflow-auto">
                      <CommandItem value="none" onSelect={() => { setSelectedPersona(null); setPersonaPopoverOpen(false); }}>
                        <Check className={`mr-2 h-4 w-4 ${!selectedPersona ? "opacity-100" : "opacity-0"}`} />
                        No Persona
                      </CommandItem>
                      {personas.map((persona) => (
                        <CommandItem key={persona.id} value={persona.name} onSelect={() => { setSelectedPersona(persona); setPersonaPopoverOpen(false); }}>
                          <Check className={`mr-2 h-4 w-4 ${selectedPersona?.id === persona.id ? "opacity-100" : "opacity-0"}`} />
                          {persona.icon} {persona.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

             {/* Variation Count */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-900 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                Variations
              </label>
              <Input
                type="number"
                min="1"
                max="20"
                value={variationCount}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(20, parseInt(e.target.value) || 1));
                  setVariationCount(val);
                  apiClient.auth.updateMe({ variation_count: val });
                }}
                className="text-center h-8 text-xs"
              />
            </div>

            {/* AI Scoring Toggle */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-900 flex items-center gap-1">
                <Award className="w-3 h-3 text-purple-600" />
                AI Scoring
              </label>
              <div className="flex items-center justify-center h-8 bg-gray-50 rounded-md px-3">
                <Switch
                  checked={enableScoring}
                  onCheckedChange={setEnableScoring}
                />
              </div>
            </div>

            {/* Streaming Toggle */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-900 flex items-center gap-1">
                <Zap className="w-3 h-3 text-blue-600" />
                Streaming
              </label>
              <div className="flex items-center justify-center h-8 bg-gray-50 rounded-md px-3">
                <Switch
                  checked={enableStreaming}
                  onCheckedChange={setEnableStreaming}
                />
              </div>
            </div>

            {/* Preset Manager */}
            <div className="space-y-1 md:col-span-4">
              <label className="text-xs font-semibold text-gray-900 flex items-center gap-1">
                <Save className="w-3 h-3 text-green-600" />
                Presets
              </label>
              <PresetManager
                currentSettings={{
                  selectedProject,
                  selectedPersona,
                  selectedTemplates,
                  contentStyle,
                  variationCount,
                  enableScoring,
                  placeholderValues,
                  project_id: selectedProject?.id,
                  persona_id: selectedPersona?.id,
                  template_ids: selectedTemplates.map(t => t.id)
                }}
                onLoadPreset={handleLoadPreset}
              />
            </div>

            {/* Content Style */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-900 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-pink-600" />
                Style
              </label>
              <Select value={contentStyle} onValueChange={setContentStyle}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value={null}>No style</SelectItem>
                  <SelectItem value="Curiosity Gap">Curiosity Gap</SelectItem>
                  <SelectItem value="Listicle/Numbered">Listicle/Numbered</SelectItem>
                  <SelectItem value="Outcome-Driven">Outcome-Driven</SelectItem>
                  <SelectItem value="How-To">How-To</SelectItem>
                  <SelectItem value="Contrarian/Hot Take">Contrarian/Hot Take</SelectItem>
                  <SelectItem value="Emotional/Empathy">Emotional/Empathy</SelectItem>
                  <SelectItem value="Urgency/Time-Bound">Urgency/Time-Bound</SelectItem>
                  <SelectItem value="Teaser/Mystery">Teaser/Mystery</SelectItem>
                  <SelectItem value="Before/After">Before/After</SelectItem>
                  <SelectItem value="Scarcity/Limited Time Offer">Scarcity/Limited Time Offer</SelectItem>
                  <SelectItem value="Social Proof/Testimonials">Social Proof/Testimonials</SelectItem>
                  <SelectItem value="Expert Endorsement">Expert Endorsement</SelectItem>
                  <SelectItem value="Problem/Solution">Problem/Solution</SelectItem>
                  <SelectItem value="Fear of Missing Out (FOMO)">Fear of Missing Out (FOMO)</SelectItem>
                  <SelectItem value="Influencer Collaboration">Influencer Collaboration</SelectItem>
                  <SelectItem value="Behind-the-Scenes Access">Behind-the-Scenes Access</SelectItem>
                  <SelectItem value="Exclusive Content">Exclusive Content</SelectItem>
                  <SelectItem value="Interactive Quiz">Interactive Quiz</SelectItem>
                  <SelectItem value="Success Stories">Success Stories</SelectItem>
                  <SelectItem value="Customer Reviews">Customer Reviews</SelectItem>
                  <SelectItem value="FAQs/Answers to Common Questions">FAQs/Answers to Common Questions</SelectItem>
                  <SelectItem value="Comparison Chart">Comparison Chart</SelectItem>
                  <SelectItem value="Free Trial/Offer">Free Trial/Offer</SelectItem>
                  <SelectItem value="Webinar Invitation">Webinar Invitation</SelectItem>
                  <SelectItem value="Video Series">Video Series</SelectItem>
                  <SelectItem value="Email Drip Campaign">Email Drip Campaign</SelectItem>
                  <SelectItem value="Pop-Up Offers">Pop-Up Offers</SelectItem>
                  <SelectItem value="Product Recommendations">Product Recommendations</SelectItem>
                  <SelectItem value="Personalized Experience">Personalized Experience</SelectItem>
                  <SelectItem value="Gamification/Badges">Gamification/Badges</SelectItem>
                  <SelectItem value="Referral Program">Referral Program</SelectItem>
                  <SelectItem value="Flash Sale">Flash Sale</SelectItem>
                  <SelectItem value="VIP Access">VIP Access</SelectItem>
                  <SelectItem value="Gift With Purchase">Gift With Purchase</SelectItem>
                  <SelectItem value="Limited Edition">Limited Edition</SelectItem>
                  <SelectItem value="Customer Appreciation Day">Customer Appreciation Day</SelectItem>
                  <SelectItem value="Seasonal Offerings">Seasonal Offerings</SelectItem>
                  <SelectItem value="User-Generated Content">User-Generated Content</SelectItem>
                  <SelectItem value="Live Chat Support">Live Chat Support</SelectItem>
                  <SelectItem value="Exclusive Discounts for Subscribers">Exclusive Discounts for Subscribers</SelectItem>
                  <SelectItem value="Subscription Services">Subscription Services</SelectItem>
                </SelectContent>
              </Select>
            </div>

           {/* Templates (Multi) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-900 flex items-center gap-1">
                <FileText className="w-3 h-3 text-purple-600" />
                Templates
              </label>
              <Popover open={templatePopoverOpen} onOpenChange={setTemplatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-between h-8 text-xs">
                    {selectedTemplates.length > 0 ? <span>📝 {selectedTemplates.length} selected</span> : "Select..."}
                    <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-3 space-y-2">
                  <Command>
                    <CommandInput placeholder="Search by template name..." />
                    <CommandEmpty>No templates found.</CommandEmpty>
                    <CommandGroup className="max-h-[200px] overflow-auto">
                      {selectedTemplates.length > 0 && (
                        <>
                          <CommandItem value="clear-all" onSelect={() => setSelectedTemplates([])} className="text-red-600">
                            <X className="mr-2 h-4 w-4" />
                            Clear All ({selectedTemplates.length})
                          </CommandItem>
                          <div className="h-px bg-gray-200 my-1" />
                        </>
                      )}
                      {templates.filter(t => !t.domain).map((template) => {
                        const isSelected = selectedTemplates.some(t => t.id === template.id);
                        return (
                          <CommandItem
                            key={template.id}
                            value={template.title}
                            onSelect={() => {
                              if (isSelected) {
                                setSelectedTemplates(prev => prev.filter(t => t.id !== template.id));
                              } else {
                                setSelectedTemplates(prev => [...prev, template]);
                              }
                            }}
                          >
                            <Check className={`mr-2 h-4 w-4 ${isSelected ? "opacity-100" : "opacity-0"}`} />
                            📝 {template.title}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder Substitution Panel */}
      {allPlaceholders.length > 0 && (
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPlaceholderPreview(!showPlaceholderPreview)}
            className="w-full justify-between h-8 text-xs"
          >
            <span className="flex items-center gap-2">
              <Target className="w-3 h-3" />
              Placeholder Substitution Preview ({allPlaceholders.length})
            </span>
            {showPlaceholderPreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
          {showPlaceholderPreview && (
            <PlaceholderSubstitutionPanel
              placeholders={allPlaceholders}
              projectData={selectedProject}
              placeholderValues={placeholderValues}
            />
          )}
        </div>
      )}

      {/* Selected Templates & Manual Placeholder Inputs */}
      {selectedTemplates.length > 0 && (
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSelectedTemplates(!showSelectedTemplates)}
            className="w-full justify-between h-8 text-xs"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-3 h-3" />
              Selected Templates & Placeholders ({selectedTemplates.length})
            </span>
            {showSelectedTemplates ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
          {showSelectedTemplates && (
            <Card className="border-2 border-indigo-200 bg-indigo-50/50">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Selected Templates
                  </h3>
                  <Badge variant="outline">{selectedTemplates.length} template{selectedTemplates.length > 1 ? 's' : ''}</Badge>
                </div>
            
            <div className="space-y-2">
              {selectedTemplates.map((template) => (
                <div key={template.id} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-gray-900">{template.title}</span>
                  <Badge className="bg-indigo-600">{template.category}</Badge>
                </div>
              ))}
            </div>

            {allPlaceholders.length > 0 && (
              <>
                <div className="h-px bg-gray-200 my-4"></div>
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    Manual Placeholder Inputs
                    <Badge variant="outline" className="text-gray-600">
                      Override auto-fill or set custom values
                    </Badge>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {allPlaceholders.map((placeholder) => (
                      <div key={placeholder.key} className="space-y-1">
                        <Label htmlFor={placeholder.key} className="text-xs">
                          {placeholder.label}
                          {placeholder.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            {placeholder.type === 'textarea' ? (
                              <Textarea
                                id={placeholder.key}
                                placeholder={placeholder.description || placeholder.label}
                                value={placeholderValues[placeholder.key] || ''}
                                onChange={(e) => setPlaceholderValues(prev => ({
                                  ...prev,
                                  [placeholder.key]: e.target.value
                                }))}
                                rows={2}
                                className="text-sm"
                              />
                            ) : (
                              <Input
                                id={placeholder.key}
                                type={placeholder.type || 'text'}
                                placeholder={placeholder.description || placeholder.label}
                                value={placeholderValues[placeholder.key] || ''}
                                onChange={(e) => setPlaceholderValues(prev => ({
                                  ...prev,
                                  [placeholder.key]: e.target.value
                                }))}
                                className="text-sm"
                              />
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => suggestPlaceholderValue(placeholder)}
                            disabled={!selectedModel || suggestingPlaceholders[placeholder.key]}
                            title="AI Suggest Value"
                            className="h-9 w-9 shrink-0"
                          >
                            {suggestingPlaceholders[placeholder.key] ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Wand2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Prompt Input */}
      <Card className="border-2 border-blue-200">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Topic / Content Request</Label>
            <Textarea
              id="topic"
              placeholder="Describe what you want to create..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={generateContent}
              disabled={isGenerating || isScoringVariations || !selectedModel || !(selectedProject || selectedPersona || selectedTemplates.length > 0)}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              size="lg"
            >
              {isGenerating || isScoringVariations ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {isGenerating ? `Generating with ${selectedModel}...` : 'Scoring variations...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate & Score Content
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const personaContext = selectedPersona ? `
PERSONA CONTEXT:
- Name: ${selectedPersona.name}
- Description: ${selectedPersona.description}
- Tone: ${selectedPersona.tone}
${selectedPersona.instructions ? `- Instructions: ${selectedPersona.instructions}` : ''}
` : '';

                const projectContext = selectedProject ? `
PROJECT CONTEXT:
- Name: ${selectedProject.name}
${selectedProject.about ? `- About: ${selectedProject.about}` : ''}
${selectedProject.tone ? `- Tone: ${selectedProject.tone}` : ''}
${selectedProject.target_audience ? `- Target Audience: ${selectedProject.target_audience}` : ''}
` : '';

                const templateContext = selectedTemplates.length > 0 ? `
TEMPLATE CONTEXT (${selectedTemplates.length} templates):
${selectedTemplates.map(t => `- ${t.title} (${t.category})\n  ${t.content.substring(0, 200)}...`).join('\n\n')}
` : '';

                const autoFilledValues = getAutoFilledPlaceholders();
                const finalPlaceholderValues = { ...autoFilledValues, ...placeholderValues };
                
                const placeholdersContext = allPlaceholders.length > 0 ? `
PLACEHOLDER VALUES:
${allPlaceholders.map(ph => `- ${ph.label}: ${finalPlaceholderValues[ph.key] || '[NOT SET]'}`).join('\n')}
` : '';

                const styleContext = contentStyle ? `
CONTENT STYLE: ${contentStyle}
` : '';

       const prompt = `Generate creative content based on these specifications:

${projectContext}
${personaContext}
${templateContext}
${placeholdersContext}
${styleContext}
TOPIC: ${topic}

Create ${variationCount} distinct variations of high-quality content. Each should be unique and valuable.

Return ONLY valid JSON:
{
  "variations": [
    {
      "title": "Variation title",
      "content": "Full content text"
    }
  ]
}`;
                setPromptText(prompt);
                setShowPromptDialog(true);
              }}
              disabled={!(selectedProject || selectedPersona || selectedTemplates.length > 0)}
              size="lg"
            >
              <FileText className="w-4 h-4 mr-2" />
              Show Prompt
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Prompt Display Dialog */}
      <Dialog open={showPromptDialog} onOpenChange={setShowPromptDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Generated Prompt
            </DialogTitle>
            <DialogDescription>
              This is the prompt that will be sent to the AI model. Review it for accuracy.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 rounded-lg border text-sm font-mono whitespace-pre-wrap">
            {promptText}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPromptDialog(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(promptText);
                toast({ title: "Copied!" });
              }}
            >
              <FileText className="w-4 h-4 mr-2" /> Copy Prompt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Content Generation Area */}
      {generatedContent.length > 0 ? (
        <div className="space-y-4">
          {generatedContent.map((variation, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="border-2 border-green-200 bg-green-50">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-green-600">Variation {idx + 1}</Badge>
                        {variation.scores?.overall_score && (
                          <Badge className={`${
                            variation.scores.overall_score >= 80 ? 'bg-emerald-600' :
                            variation.scores.overall_score >= 60 ? 'bg-blue-600' :
                            'bg-orange-600'
                          }`}>
                            <Award className="w-3 h-3 mr-1" />
                            Score: {variation.scores.overall_score}/100
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{variation.title}</h3>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(variation.content);
                          toast({ title: "Copied!" });
                        }}
                        title="Copy"
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => saveAsTemplate(variation.content, variation.title)}
                        title="Save as Template"
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* AI Scores - Minimal Bar */}
                  {variation.scores && (
                    <div className="mb-4">
                      <button
                        onClick={() => setExpandedScores(prev => ({ ...prev, [idx]: !prev[idx] }))}
                        className="w-full p-3 bg-white rounded-lg border hover:border-purple-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Award className={`w-5 h-5 ${
                              variation.scores.overall_score >= 80 ? 'text-emerald-600' :
                              variation.scores.overall_score >= 60 ? 'text-blue-600' :
                              'text-orange-600'
                            }`} />
                            <div className="text-left">
                              <div className="text-sm font-semibold text-gray-900">
                                Quality Score: {variation.scores.overall_score}/100
                              </div>
                              <div className="text-xs text-gray-500">
                                {variation.scores.strengths?.length || 0} strengths • {variation.scores.improvements?.length || 0} improvements
                              </div>
                            </div>
                          </div>
                          {expandedScores[idx] ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </button>

                      {/* Expanded Details */}
                      {expandedScores[idx] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 p-4 bg-white rounded-lg border space-y-3"
                        >
                          {/* Metrics Grid */}
                          {variation.scores.metrics && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {Object.entries(variation.scores.metrics).map(([key, value]) => (
                                <div key={key} className="bg-gray-50 p-2 rounded text-center">
                                  <div className="text-xs text-gray-600 capitalize">{key}</div>
                                  <div className={`text-lg font-bold ${
                                    value >= 80 ? 'text-green-600' :
                                    value >= 60 ? 'text-blue-600' :
                                    'text-orange-600'
                                  }`}>
                                    {value}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Strengths & Improvements */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            {variation.scores.strengths?.length > 0 && (
                              <div>
                                <div className="text-xs font-semibold text-green-700 mb-1 flex items-center gap-1">
                                  <Target className="w-3 h-3" />
                                  Strengths
                                </div>
                                <ul className="text-xs text-gray-700 space-y-0.5">
                                  {variation.scores.strengths.map((s, i) => (
                                    <li key={i}>✓ {s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {variation.scores.improvements?.length > 0 && (
                              <div>
                                <div className="text-xs font-semibold text-orange-700 mb-1 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Improvements
                                </div>
                                <ul className="text-xs text-gray-700 space-y-0.5">
                                  {variation.scores.improvements.map((i, idx) => (
                                    <li key={idx}>→ {i}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}

                  <div className="bg-white p-4 rounded-lg border max-h-96 overflow-y-auto">
                    <p className="whitespace-pre-wrap text-gray-800">{variation.content}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="border-2 border-gray-200 min-h-[400px]">
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">Generated content will appear here</p>
                <p className="text-xs mt-2">Select context and click Generate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
