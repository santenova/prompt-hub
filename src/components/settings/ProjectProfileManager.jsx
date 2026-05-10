import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { apiClient } from '@/apis/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Briefcase, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from 'framer-motion';

export default function ProjectProfileManager({ currentUser }) {
  const [editingProject, setEditingProject] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [expandedProject, setExpandedProject] = useState(null);
  const [analyzingProject, setAnalyzingProject] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [showSuggestionsDialog, setShowSuggestionsDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    about: '',
    vision: '',
    mission: '',
    usps: [],
    topic: '',
    tone: '',
    style: '',
    target_audience: '',
    audience_segments: [],
    primary_goal: '',
    keywords: '',
    exclude_words: '',
    additional_context: '',
    features: [],
    benefits: [],
    use_cases: [],
    links: [],
    technology_stack: [],
    ai_models: [],
    market_position: '',
    competitive_advantages: [],
    revenue_model: '',
    pricing_tiers: [],
    roadmap: [],
    metrics: {},
    platforms: [],
    brand_colors: {}
  });

  const [uspInput, setUspInput] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await apiClient.entities.Project.list('-updated_date', 50);
    },
    enabled: !!currentUser?.email,
  });

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.entities.Project.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      resetForm();
      setShowDialog(false);
      toast({ title: "Project Created", description: "Your project profile has been created." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.entities.Project.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      resetForm();
      setShowDialog(false);
      setEditingProject(null);
      toast({ title: "Project Updated", description: "Your project profile has been updated." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.entities.Project.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      toast({ title: "Project Deleted", description: "Project profile has been removed." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      about: '',
      vision: '',
      mission: '',
      usps: [],
      topic: '',
      tone: '',
      style: '',
      target_audience: '',
      audience_segments: [],
      primary_goal: '',
      keywords: '',
      exclude_words: '',
      additional_context: '',
      features: [],
      benefits: [],
      use_cases: [],
      links: [],
      technology_stack: [],
      ai_models: [],
      market_position: '',
      competitive_advantages: [],
      revenue_model: '',
      pricing_tiers: [],
      roadmap: [],
      metrics: {},
      platforms: [],
      brand_colors: {}
    });
    setUspInput('');
    setFeatureInput('');
    setLinkTitle('');
    setLinkUrl('');
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name || '',
      description: project.description || '',
      about: project.about || '',
      vision: project.vision || '',
      mission: project.mission || '',
      usps: project.usps || [],
      topic: project.topic || '',
      tone: project.tone || '',
      style: project.style || '',
      target_audience: project.target_audience || '',
      audience_segments: project.audience_segments || [],
      primary_goal: project.primary_goal || '',
      keywords: project.keywords || '',
      exclude_words: project.exclude_words || '',
      additional_context: project.additional_context || '',
      features: project.features || [],
      benefits: project.benefits || [],
      use_cases: project.use_cases || [],
      links: project.links || [],
      technology_stack: project.technology_stack || [],
      ai_models: project.ai_models || [],
      market_position: project.market_position || '',
      competitive_advantages: project.competitive_advantages || [],
      revenue_model: project.revenue_model || '',
      pricing_tiers: project.pricing_tiers || [],
      roadmap: project.roadmap || [],
      metrics: project.metrics || {},
      platforms: project.platforms || [],
      brand_colors: project.brand_colors || {}
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Project name is required", variant: "destructive" });
      return;
    }

    if (editingProject) {
      updateMutation.mutate({ id: editingProject.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const addUsp = () => {
    if (uspInput.trim()) {
      setFormData(prev => ({ ...prev, usps: [...prev.usps, uspInput.trim()] }));
      setUspInput('');
    }
  };

  const removeUsp = (index) => {
    setFormData(prev => ({ ...prev, usps: prev.usps.filter((_, i) => i !== index) }));
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData(prev => ({ ...prev, features: [...prev.features, featureInput.trim()] }));
      setFeatureInput('');
    }
  };

  const removeFeature = (index) => {
    setFormData(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
  };

  const addLink = () => {
    if (linkTitle.trim() && linkUrl.trim()) {
      setFormData(prev => ({ 
        ...prev, 
        links: [...prev.links, { title: linkTitle.trim(), url: linkUrl.trim() }] 
      }));
      setLinkTitle('');
      setLinkUrl('');
    }
  };

  const removeLink = (index) => {
    setFormData(prev => ({ ...prev, links: prev.links.filter((_, i) => i !== index) }));
  };

  const analyzeProjectWithAI = async (project) => {
    setAnalyzingProject(project.id);
    try {
      const projectData = JSON.stringify({
        name: project.name,
        description: project.description,
        about: project.about,
        vision: project.vision,
        mission: project.mission,
        usps: project.usps,
        topic: project.topic,
        tone: project.tone,
        style: project.style,
        target_audience: project.target_audience,
        primary_goal: project.primary_goal,
        keywords: project.keywords,
        features: project.features,
        benefits: project.benefits,
        market_position: project.market_position,
        revenue_model: project.revenue_model,
        technology_stack: project.technology_stack,
        competitive_advantages: project.competitive_advantages
      }, null, 2);

      const { data: suggestions } = await apiClient.functions.invoke('invokeLLMWithLogging', {
        prompt: `You are a strategic business consultant and branding expert. Analyze the following project profile and provide field-specific improvement suggestions that can be directly applied.

PROJECT DATA:
${projectData}

Provide comprehensive analysis with:

1. **Overall Assessment**: Strengths, gaps, and strategic priorities
2. **Field-Specific Suggestions**: For each field that needs improvement, provide ready-to-use content

Generate specific, actionable suggestions for these fields:
- **USPs**: Based on features and benefits, generate 3-5 compelling unique selling points
- **Target Audience**: Refine and expand the audience description with specific demographics, psychographics, and pain points
- **Keywords**: Suggest 10-15 relevant keywords for SEO and content strategy
- **Competitive Advantages**: Based on market position and features, propose 3-5 competitive advantages
- **Vision**: If missing or weak, suggest an inspiring vision statement
- **Mission**: If missing or weak, suggest a clear mission statement
- **Market Position**: Suggest positioning statement if missing or needs improvement
- **Tone & Style**: Recommend appropriate communication tone and style
- **Additional Features**: Suggest 3-5 additional features to consider
- **Content Themes**: Suggest content themes aligned with project goals

Be specific, practical, and ready-to-apply. Each suggestion should be directly usable.`,
        source_tool: 'project_analyzer',
        request_metadata: { project_id: project.id },
        response_json_schema: {
          type: "object",
          properties: {
            overall: {
              type: "object",
              properties: {
                strengths: { type: "array", items: { type: "string" } },
                gaps: { type: "array", items: { type: "string" } },
                priorities: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      impact: { type: "string", enum: ["high", "medium", "low"] }
                    }
                  }
                }
              }
            },
            field_suggestions: {
              type: "object",
              properties: {
                usps: {
                  type: "object",
                  properties: {
                    current_analysis: { type: "string" },
                    suggested_usps: { type: "array", items: { type: "string" } }
                  }
                },
                target_audience: {
                  type: "object",
                  properties: {
                    current_analysis: { type: "string" },
                    refined_description: { type: "string" },
                    segments: {
                      type: "array",
                      items: { type: "string" }
                    }
                  }
                },
                keywords: {
                  type: "object",
                  properties: {
                    current_analysis: { type: "string" },
                    suggested_keywords: { type: "array", items: { type: "string" } }
                  }
                },
                competitive_advantages: {
                  type: "object",
                  properties: {
                    current_analysis: { type: "string" },
                    suggested_advantages: { type: "array", items: { type: "string" } }
                  }
                },
                vision: {
                  type: "object",
                  properties: {
                    current_analysis: { type: "string" },
                    suggested_vision: { type: "string" }
                  }
                },
                mission: {
                  type: "object",
                  properties: {
                    current_analysis: { type: "string" },
                    suggested_mission: { type: "string" }
                  }
                },
                market_position: {
                  type: "object",
                  properties: {
                    current_analysis: { type: "string" },
                    suggested_positioning: { type: "string" }
                  }
                },
                tone_and_style: {
                  type: "object",
                  properties: {
                    suggested_tone: { type: "string" },
                    suggested_style: { type: "string" },
                    rationale: { type: "string" }
                  }
                },
                additional_features: {
                  type: "object",
                  properties: {
                    current_analysis: { type: "string" },
                    suggested_features: { type: "array", items: { type: "string" } }
                  }
                },
                content_themes: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            }
          }
        }
      });

      setAiSuggestions({ project, suggestions });
      setShowSuggestionsDialog(true);
      toast({ title: "Analysis Complete", description: "Field-specific suggestions generated" });
    } catch (error) {
      console.error('AI analysis error:', error);
      toast({ 
        title: "Analysis Failed", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setAnalyzingProject(null);
    }
  };

  const applyFieldSuggestion = async (fieldName, value) => {
    if (!aiSuggestions?.project) return;

    const updateData = {};
    
    // Handle different field types
    if (fieldName === 'usps' || fieldName === 'keywords' || fieldName === 'features' || fieldName === 'competitive_advantages') {
      // Array fields - merge or replace
      const currentValues = aiSuggestions.project[fieldName] || [];
      if (Array.isArray(value)) {
        updateData[fieldName] = [...new Set([...currentValues, ...value])]; // Merge and dedupe
      } else {
        updateData[fieldName] = [...currentValues, value];
      }
    } else if (fieldName === 'target_audience' || fieldName === 'vision' || fieldName === 'mission' || fieldName === 'market_position') {
      // String fields - replace
      updateData[fieldName] = value;
    } else if (fieldName === 'tone' || fieldName === 'style') {
      updateData[fieldName] = value;
    }

    try {
      await updateMutation.mutateAsync({ 
        id: aiSuggestions.project.id, 
        data: updateData 
      });
      
      // Update local state
      setAiSuggestions(prev => ({
        ...prev,
        project: { ...prev.project, ...updateData }
      }));

      toast({ 
        title: "Suggestion Applied", 
        description: `${fieldName} updated successfully`,
        duration: 3000
      });
    } catch (error) {
      toast({ 
        title: "Update Failed", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  const applyAllFieldSuggestions = async () => {
    if (!aiSuggestions?.project || !aiSuggestions?.suggestions?.field_suggestions) return;

    const updateData = {};
    const fs = aiSuggestions.suggestions.field_suggestions;

    // Collect all suggested values
    if (fs.usps?.suggested_usps?.length > 0) {
      const currentUsps = aiSuggestions.project.usps || [];
      updateData.usps = [...new Set([...currentUsps, ...fs.usps.suggested_usps])];
    }

    if (fs.target_audience?.refined_description) {
      updateData.target_audience = fs.target_audience.refined_description;
    }

    if (fs.keywords?.suggested_keywords?.length > 0) {
      const currentKeywords = aiSuggestions.project.keywords || '';
      const existingKeywords = currentKeywords.split(',').map(k => k.trim()).filter(Boolean);
      const allKeywords = [...new Set([...existingKeywords, ...fs.keywords.suggested_keywords])];
      updateData.keywords = allKeywords.join(', ');
    }

    if (fs.competitive_advantages?.suggested_advantages?.length > 0) {
      const currentAdvantages = aiSuggestions.project.competitive_advantages || [];
      updateData.competitive_advantages = [...new Set([...currentAdvantages, ...fs.competitive_advantages.suggested_advantages])];
    }

    if (fs.vision?.suggested_vision) {
      updateData.vision = fs.vision.suggested_vision;
    }

    if (fs.mission?.suggested_mission) {
      updateData.mission = fs.mission.suggested_mission;
    }

    if (fs.market_position?.suggested_positioning) {
      updateData.market_position = fs.market_position.suggested_positioning;
    }

    if (fs.tone_and_style?.suggested_tone) {
      updateData.tone = fs.tone_and_style.suggested_tone;
    }

    if (fs.tone_and_style?.suggested_style) {
      updateData.style = fs.tone_and_style.suggested_style;
    }

    if (fs.additional_features?.suggested_features?.length > 0) {
      const currentFeatures = aiSuggestions.project.features || [];
      updateData.features = [...new Set([...currentFeatures, ...fs.additional_features.suggested_features])];
    }

    try {
      await updateMutation.mutateAsync({ 
        id: aiSuggestions.project.id, 
        data: updateData 
      });
      
      // Update local state
      setAiSuggestions(prev => ({
        ...prev,
        project: { ...prev.project, ...updateData }
      }));

      toast({ 
        title: "All Suggestions Applied", 
        description: "All field-specific suggestions have been applied to your project",
        duration: 3000
      });
      
      setShowSuggestionsDialog(false);
    } catch (error) {
      toast({ 
        title: "Update Failed", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-600" />
              Project Profiles
            </CardTitle>
            <CardDescription>Manage your project profiles with comprehensive details</CardDescription>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setEditingProject(null);
              setShowDialog(true);
            }}
            className="bg-gradient-to-r from-purple-600 to-indigo-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">No project profiles yet</p>
            <Button
              onClick={() => {
                resetForm();
                setEditingProject(null);
                setShowDialog(true);
              }}
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Project
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {projects.map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className="bg-gradient-to-br from-white to-purple-50 border-purple-200">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900">{project.name}</h3>
                          {project.description && (
                            <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => analyzeProjectWithAI(project)}
                            disabled={analyzingProject === project.id}
                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            title="Get AI Improvement Suggestions"
                          >
                            {analyzingProject === project.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(project)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(`Delete "${project.name}"?`)) {
                                deleteMutation.mutate(project.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Quick Overview */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {project.topic && (
                          <Badge variant="outline" className="bg-purple-100 text-purple-800">
                            {project.topic}
                          </Badge>
                        )}
                        {project.target_audience && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            {project.target_audience}
                          </Badge>
                        )}
                        {project.primary_goal && (
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            {project.primary_goal}
                          </Badge>
                        )}
                      </div>

                      {/* Expandable Details */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
                        className="w-full justify-between"
                      >
                        <span className="text-xs">View Details</span>
                        {expandedProject === project.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>

                      {expandedProject === project.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-4 space-y-3 text-sm"
                        >
                          {project.about && (
                            <div>
                              <Label className="text-xs font-semibold text-gray-600">About</Label>
                              <p className="text-gray-700 mt-1">{project.about}</p>
                            </div>
                          )}
                          {project.usps?.length > 0 && (
                            <div>
                              <Label className="text-xs font-semibold text-gray-600">USPs</Label>
                              <ul className="mt-1 space-y-1">
                                {project.usps.map((usp, idx) => (
                                  <li key={idx} className="text-gray-700">• {usp}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {project.features?.length > 0 && (
                            <div>
                              <Label className="text-xs font-semibold text-gray-600">Features</Label>
                              <ul className="mt-1 space-y-1">
                                {project.features.map((feature, idx) => (
                                  <li key={idx} className="text-gray-700">• {feature}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4">
                            {project.tone && (
                              <div>
                                <Label className="text-xs font-semibold text-gray-600">Tone</Label>
                                <p className="text-gray-700 mt-1">{project.tone}</p>
                              </div>
                            )}
                            {project.style && (
                              <div>
                                <Label className="text-xs font-semibold text-gray-600">Style</Label>
                                <p className="text-gray-700 mt-1">{project.style}</p>
                              </div>
                            )}
                          </div>
                          {project.keywords && (
                            <div>
                              <Label className="text-xs font-semibold text-gray-600">Keywords</Label>
                              <p className="text-gray-700 mt-1">{project.keywords}</p>
                            </div>
                          )}
                          {project.exclude_words && (
                            <div>
                              <Label className="text-xs font-semibold text-gray-600">Exclude Words</Label>
                              <p className="text-gray-700 mt-1">{project.exclude_words}</p>
                            </div>
                          )}
                          {project.additional_context && (
                            <div>
                              <Label className="text-xs font-semibold text-gray-600">Additional Context</Label>
                              <p className="text-gray-700 mt-1">{project.additional_context}</p>
                            </div>
                          )}
                          {project.vision && (
                            <div>
                              <Label className="text-xs font-semibold text-gray-600">Vision</Label>
                              <p className="text-gray-700 mt-1">{project.vision}</p>
                            </div>
                          )}
                          {project.mission && (
                            <div>
                              <Label className="text-xs font-semibold text-gray-600">Mission</Label>
                              <p className="text-gray-700 mt-1">{project.mission}</p>
                            </div>
                          )}
                          {project.market_position && (
                            <div>
                              <Label className="text-xs font-semibold text-gray-600">Market Position</Label>
                              <p className="text-gray-700 mt-1">{project.market_position}</p>
                            </div>
                          )}
                          {project.revenue_model && (
                            <div>
                              <Label className="text-xs font-semibold text-gray-600">Revenue Model</Label>
                              <p className="text-gray-700 mt-1">{project.revenue_model}</p>
                            </div>
                          )}
                          {project.benefits?.length > 0 && (
                            <div>
                              <Label className="text-xs font-semibold text-gray-600">Benefits</Label>
                              <ul className="mt-1 space-y-1">
                                {project.benefits.map((benefit, idx) => (
                                  <li key={idx} className="text-gray-700">
                                    <span className="font-medium">{benefit.title}:</span> {benefit.description}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {project.use_cases?.length > 0 && (
                            <div>
                              <Label className="text-xs font-semibold text-gray-600">Use Cases</Label>
                              <ul className="mt-1 space-y-1">
                                {project.use_cases.map((useCase, idx) => (
                                  <li key={idx} className="text-gray-700">
                                    <span className="font-medium">{useCase.title}:</span> {useCase.description}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {project.technology_stack?.length > 0 && (
                            <div>
                              <Label className="text-xs font-semibold text-gray-600">Technology Stack</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {project.technology_stack.map((tech, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">{tech}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {project.ai_models?.length > 0 && (
                            <div>
                              <Label className="text-xs font-semibold text-gray-600">AI Models</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {project.ai_models.map((model, idx) => (
                                  <Badge key={idx} variant="outline" className="bg-purple-100 text-purple-800 text-xs">{model}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {project.platforms?.length > 0 && (
                            <div>
                              <Label className="text-xs font-semibold text-gray-600">Platforms</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {project.platforms.map((platform, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">{platform}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {project.links?.length > 0 && (
                            <div>
                              <Label className="text-xs font-semibold text-gray-600">Links</Label>
                              <ul className="mt-1 space-y-1">
                                {project.links.map((link, idx) => (
                                  <li key={idx}>
                                    <a 
                                      href={link.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-purple-600 hover:underline flex items-center gap-1"
                                    >
                                      <LinkIcon className="w-3 h-3" />
                                      {link.title}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProject ? 'Edit' : 'Create'} Project Profile</DialogTitle>
            <DialogDescription>
              Add comprehensive details about your project
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., AI Marketing Platform"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief project description..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="about">About</Label>
                <Textarea
                  id="about"
                  value={formData.about}
                  onChange={(e) => setFormData(prev => ({ ...prev, about: e.target.value }))}
                  placeholder="Detailed information about the project..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vision">Vision</Label>
                  <Textarea
                    id="vision"
                    value={formData.vision}
                    onChange={(e) => setFormData(prev => ({ ...prev, vision: e.target.value }))}
                    placeholder="Long-term vision..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mission">Mission</Label>
                  <Textarea
                    id="mission"
                    value={formData.mission}
                    onChange={(e) => setFormData(prev => ({ ...prev, mission: e.target.value }))}
                    placeholder="Mission statement..."
                    rows={2}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="market_position">Market Position</Label>
                <Textarea
                  id="market_position"
                  value={formData.market_position}
                  onChange={(e) => setFormData(prev => ({ ...prev, market_position: e.target.value }))}
                  placeholder="How you position in the market..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="revenue_model">Revenue Model</Label>
                <Textarea
                  id="revenue_model"
                  value={formData.revenue_model}
                  onChange={(e) => setFormData(prev => ({ ...prev, revenue_model: e.target.value }))}
                  placeholder="How the project generates revenue..."
                  rows={2}
                />
              </div>
            </div>

            {/* Content Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  value={formData.topic}
                  onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                  placeholder="Main topic/niche"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_audience">Target Audience</Label>
                <Input
                  id="target_audience"
                  value={formData.target_audience}
                  onChange={(e) => setFormData(prev => ({ ...prev, target_audience: e.target.value }))}
                  placeholder="e.g., Marketers, Students..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Tone</Label>
                <Input
                  id="tone"
                  value={formData.tone}
                  onChange={(e) => setFormData(prev => ({ ...prev, tone: e.target.value }))}
                  placeholder="e.g., Professional, Friendly..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="style">Style</Label>
                <Input
                  id="style"
                  value={formData.style}
                  onChange={(e) => setFormData(prev => ({ ...prev, style: e.target.value }))}
                  placeholder="e.g., Storytelling, Educational..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary_goal">Primary Goal</Label>
                <Input
                  id="primary_goal"
                  value={formData.primary_goal}
                  onChange={(e) => setFormData(prev => ({ ...prev, primary_goal: e.target.value }))}
                  placeholder="e.g., Engagement, Conversion..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords</Label>
                <Input
                  id="keywords"
                  value={formData.keywords}
                  onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                  placeholder="AI, automation, marketing..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exclude_words">Exclude Words</Label>
              <Input
                id="exclude_words"
                value={formData.exclude_words}
                onChange={(e) => setFormData(prev => ({ ...prev, exclude_words: e.target.value }))}
                placeholder="Words to avoid..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional_context">Additional Context</Label>
              <Textarea
                id="additional_context"
                value={formData.additional_context}
                onChange={(e) => setFormData(prev => ({ ...prev, additional_context: e.target.value }))}
                placeholder="Any other important context..."
                rows={3}
              />
            </div>

            {/* USPs */}
            <div className="space-y-2">
              <Label>Unique Selling Points (USPs)</Label>
              <div className="flex gap-2">
                <Input
                  value={uspInput}
                  onChange={(e) => setUspInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUsp())}
                  placeholder="Add a USP..."
                />
                <Button onClick={addUsp} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.usps.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.usps.map((usp, idx) => (
                    <Badge key={idx} className="bg-purple-600 text-white flex items-center gap-1">
                      {usp}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-200"
                        onClick={() => removeUsp(idx)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Features */}
            <div className="space-y-2">
              <Label>Features</Label>
              <div className="flex gap-2">
                <Input
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  placeholder="Add a feature..."
                />
                <Button onClick={addFeature} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.features.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.features.map((feature, idx) => (
                    <Badge key={idx} className="bg-indigo-600 text-white flex items-center gap-1">
                      {feature}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-200"
                        onClick={() => removeFeature(idx)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Links */}
            <div className="space-y-2">
              <Label>Links</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="Link title..."
                />
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())}
                  placeholder="URL..."
                />
              </div>
              <Button onClick={addLink} size="sm" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Link
              </Button>
              {formData.links.length > 0 && (
                <div className="space-y-2 mt-2">
                  {formData.links.map((link, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <LinkIcon className="w-3 h-3 text-gray-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{link.title}</p>
                          <p className="text-xs text-gray-500 truncate">{link.url}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeLink(idx)}
                        className="h-6 w-6 p-0 text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                setEditingProject(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name.trim()}
              className="bg-gradient-to-r from-purple-600 to-indigo-600"
            >
              <Save className="w-4 h-4 mr-2" />
              {editingProject ? 'Update' : 'Create'} Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Suggestions Dialog */}
      <Dialog open={showSuggestionsDialog} onOpenChange={setShowSuggestionsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Project Improvement Suggestions
            </DialogTitle>
            <DialogDescription>
              {aiSuggestions?.project?.name && `Analysis for "${aiSuggestions.project.name}"`}
            </DialogDescription>
          </DialogHeader>

          {aiSuggestions && (
            <div className="space-y-6 py-4">
              {/* Overall Assessment */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg">📊 Overall Assessment</h3>
                
                {/* Strengths */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-800">✓ Strengths</h4>
                  <div className="space-y-2">
                    {aiSuggestions.suggestions.overall?.strengths?.map((strength, idx) => (
                      <div key={idx} className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-900">
                        {strength}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gaps */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-orange-800">⚠️ Gaps</h4>
                  <div className="space-y-2">
                    {aiSuggestions.suggestions.overall?.gaps?.map((gap, idx) => (
                      <div key={idx} className="p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-900">
                        {gap}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strategic Priorities */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-purple-800">🎯 Strategic Priorities</h4>
                  <div className="space-y-2">
                    {aiSuggestions.suggestions.overall?.priorities?.map((priority, idx) => (
                      <div key={idx} className="p-3 bg-purple-50 border-2 border-purple-300 rounded-lg">
                        <div className="flex items-start justify-between mb-1">
                          <span className="font-semibold text-purple-900">{idx + 1}. {priority.title}</span>
                          <Badge className={priority.impact === 'high' ? 'bg-red-100 text-red-800' : priority.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}>
                            {priority.impact}
                          </Badge>
                        </div>
                        <p className="text-sm text-purple-800">{priority.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Field-Specific Suggestions */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-bold text-lg">🎨 Field-Specific Improvements</h3>

                {/* USPs */}
                {aiSuggestions.suggestions.field_suggestions?.usps?.suggested_usps?.length > 0 && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-purple-900">💎 Unique Selling Points</h4>
                      <Button size="sm" onClick={() => applyFieldSuggestion('usps', aiSuggestions.suggestions.field_suggestions.usps.suggested_usps)} className="bg-purple-600">
                        Apply All
                      </Button>
                    </div>
                    <p className="text-xs text-purple-700">{aiSuggestions.suggestions.field_suggestions.usps.current_analysis}</p>
                    <div className="space-y-2">
                      {aiSuggestions.suggestions.field_suggestions.usps.suggested_usps.map((usp, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2 bg-white rounded border">
                          <span className="text-sm flex-1">{usp}</span>
                          <Button size="sm" variant="ghost" onClick={() => applyFieldSuggestion('usps', usp)} className="h-6 px-2 text-xs">Add</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Target Audience */}
                {aiSuggestions.suggestions.field_suggestions?.target_audience?.refined_description && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-blue-900">👥 Target Audience</h4>
                      <Button size="sm" onClick={() => applyFieldSuggestion('target_audience', aiSuggestions.suggestions.field_suggestions.target_audience.refined_description)} className="bg-blue-600">
                        Apply
                      </Button>
                    </div>
                    <p className="text-xs text-blue-700">{aiSuggestions.suggestions.field_suggestions.target_audience.current_analysis}</p>
                    <div className="p-3 bg-white rounded border text-sm">{aiSuggestions.suggestions.field_suggestions.target_audience.refined_description}</div>
                    {aiSuggestions.suggestions.field_suggestions.target_audience.segments?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {aiSuggestions.suggestions.field_suggestions.target_audience.segments.map((seg, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">{seg}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Keywords */}
                {aiSuggestions.suggestions.field_suggestions?.keywords?.suggested_keywords?.length > 0 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-green-900">🔑 Keywords</h4>
                      <Button size="sm" onClick={() => applyFieldSuggestion('keywords', aiSuggestions.suggestions.field_suggestions.keywords.suggested_keywords.join(', '))} className="bg-green-600">
                        Apply All
                      </Button>
                    </div>
                    <p className="text-xs text-green-700">{aiSuggestions.suggestions.field_suggestions.keywords.current_analysis}</p>
                    <div className="flex flex-wrap gap-2">
                      {aiSuggestions.suggestions.field_suggestions.keywords.suggested_keywords.map((kw, idx) => (
                        <Badge key={idx} className="bg-green-600 text-white cursor-pointer" onClick={() => applyFieldSuggestion('keywords', kw)}>
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Competitive Advantages */}
                {aiSuggestions.suggestions.field_suggestions?.competitive_advantages?.suggested_advantages?.length > 0 && (
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-indigo-900">⚡ Competitive Advantages</h4>
                      <Button size="sm" onClick={() => applyFieldSuggestion('competitive_advantages', aiSuggestions.suggestions.field_suggestions.competitive_advantages.suggested_advantages)} className="bg-indigo-600">
                        Apply All
                      </Button>
                    </div>
                    <p className="text-xs text-indigo-700">{aiSuggestions.suggestions.field_suggestions.competitive_advantages.current_analysis}</p>
                    <div className="space-y-2">
                      {aiSuggestions.suggestions.field_suggestions.competitive_advantages.suggested_advantages.map((adv, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2 bg-white rounded border">
                          <span className="text-sm flex-1">{adv}</span>
                          <Button size="sm" variant="ghost" onClick={() => applyFieldSuggestion('competitive_advantages', adv)} className="h-6 px-2 text-xs">Add</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vision */}
                {aiSuggestions.suggestions.field_suggestions?.vision?.suggested_vision && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-amber-900">🌟 Vision Statement</h4>
                      <Button size="sm" onClick={() => applyFieldSuggestion('vision', aiSuggestions.suggestions.field_suggestions.vision.suggested_vision)} className="bg-amber-600">
                        Apply
                      </Button>
                    </div>
                    <p className="text-xs text-amber-700">{aiSuggestions.suggestions.field_suggestions.vision.current_analysis}</p>
                    <div className="p-3 bg-white rounded border text-sm italic">{aiSuggestions.suggestions.field_suggestions.vision.suggested_vision}</div>
                  </div>
                )}

                {/* Mission */}
                {aiSuggestions.suggestions.field_suggestions?.mission?.suggested_mission && (
                  <div className="p-4 bg-pink-50 border border-pink-200 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-pink-900">🎯 Mission Statement</h4>
                      <Button size="sm" onClick={() => applyFieldSuggestion('mission', aiSuggestions.suggestions.field_suggestions.mission.suggested_mission)} className="bg-pink-600">
                        Apply
                      </Button>
                    </div>
                    <p className="text-xs text-pink-700">{aiSuggestions.suggestions.field_suggestions.mission.current_analysis}</p>
                    <div className="p-3 bg-white rounded border text-sm italic">{aiSuggestions.suggestions.field_suggestions.mission.suggested_mission}</div>
                  </div>
                )}

                {/* Market Position */}
                {aiSuggestions.suggestions.field_suggestions?.market_position?.suggested_positioning && (
                  <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-teal-900">📍 Market Positioning</h4>
                      <Button size="sm" onClick={() => applyFieldSuggestion('market_position', aiSuggestions.suggestions.field_suggestions.market_position.suggested_positioning)} className="bg-teal-600">
                        Apply
                      </Button>
                    </div>
                    <p className="text-xs text-teal-700">{aiSuggestions.suggestions.field_suggestions.market_position.current_analysis}</p>
                    <div className="p-3 bg-white rounded border text-sm">{aiSuggestions.suggestions.field_suggestions.market_position.suggested_positioning}</div>
                  </div>
                )}

                {/* Tone & Style */}
                {aiSuggestions.suggestions.field_suggestions?.tone_and_style && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                    <h4 className="font-semibold text-slate-900">🎨 Tone & Style</h4>
                    <p className="text-xs text-slate-700">{aiSuggestions.suggestions.field_suggestions.tone_and_style.rationale}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-white rounded border">
                        <Label className="text-xs text-slate-600">Tone</Label>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm font-medium">{aiSuggestions.suggestions.field_suggestions.tone_and_style.suggested_tone}</span>
                          <Button size="sm" variant="ghost" onClick={() => applyFieldSuggestion('tone', aiSuggestions.suggestions.field_suggestions.tone_and_style.suggested_tone)} className="h-6 px-2 text-xs">Apply</Button>
                        </div>
                      </div>
                      <div className="p-2 bg-white rounded border">
                        <Label className="text-xs text-slate-600">Style</Label>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm font-medium">{aiSuggestions.suggestions.field_suggestions.tone_and_style.suggested_style}</span>
                          <Button size="sm" variant="ghost" onClick={() => applyFieldSuggestion('style', aiSuggestions.suggestions.field_suggestions.tone_and_style.suggested_style)} className="h-6 px-2 text-xs">Apply</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Features */}
                {aiSuggestions.suggestions.field_suggestions?.additional_features?.suggested_features?.length > 0 && (
                  <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-cyan-900">✨ Additional Features to Consider</h4>
                      <Button size="sm" onClick={() => applyFieldSuggestion('features', aiSuggestions.suggestions.field_suggestions.additional_features.suggested_features)} className="bg-cyan-600">
                        Add All
                      </Button>
                    </div>
                    <p className="text-xs text-cyan-700">{aiSuggestions.suggestions.field_suggestions.additional_features.current_analysis}</p>
                    <div className="space-y-1">
                      {aiSuggestions.suggestions.field_suggestions.additional_features.suggested_features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm p-2 bg-white rounded border">
                          <span className="flex-1">{feat}</span>
                          <Button size="sm" variant="ghost" onClick={() => applyFieldSuggestion('features', feat)} className="h-6 px-2 text-xs">Add</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Content Themes */}
                {aiSuggestions.suggestions.field_suggestions?.content_themes?.length > 0 && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg space-y-2">
                    <h4 className="font-semibold text-rose-900">📝 Suggested Content Themes</h4>
                    <div className="flex flex-wrap gap-2">
                      {aiSuggestions.suggestions.field_suggestions.content_themes.map((theme, idx) => (
                        <Badge key={idx} variant="outline" className="bg-white">{theme}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuggestionsDialog(false)}>
              Close
            </Button>
            <Button
              onClick={applyAllFieldSuggestions}
              disabled={updateMutation.isPending}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Apply All Suggestions
            </Button>
            <Button
              onClick={() => {
                handleEdit(aiSuggestions.project);
                setShowSuggestionsDialog(false);
              }}
              className="bg-gradient-to-r from-purple-600 to-indigo-600"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
