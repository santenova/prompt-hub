import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { apiClient } from "@/apis/client";
import { 
  Lightbulb, 
  Scissors, 
  Video, 
  Anchor, 
  Sparkles, 
  Star, 
  Palette, 
  Users, 
  MessageSquare,
  ArrowRight,
  X,
  ArrowLeft,
  Play,
  Settings,
  Save,
  Trash2,
  FolderOpen,
  Target,
  TrendingUp,
  Zap,
  Layers,
  Plus,
  Mail,
  RefreshCw,
  Search
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";

const marketingTools = [
  {
    id: 'content_splitter',
    name: 'Content Splitter',
    icon: Scissors,
    color: 'from-blue-500 to-cyan-500',
    description: 'Split content for multiple platforms',
    requiredInputs: [
      { key: 'content', label: 'Content to split', type: 'textarea' },
      { key: 'goal', label: 'Primary Goal', type: 'select', options: ['Engagement', 'Conversion', 'Education', 'Brand Awareness', 'Lead Generation', 'Traffic', 'Community Building', 'Sales', 'Retention'] }
    ],
    platforms: ['YouTube Shorts', 'TikTok', 'Instagram Reels', 'X (Twitter)']
  },
  {
    id: 'title_generator',
    name: 'Title Generator',
    icon: Video,
    color: 'from-purple-500 to-pink-500',
    description: 'Generate viral video titles',
    requiredInputs: [
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'platform', label: 'Platform', type: 'select', options: ['YouTube', 'TikTok', 'Instagram', 'X', 'Facebook', 'LinkedIn'] },
      { key: 'style', label: 'Style', type: 'select', options: ['Curiosity Gap', 'How-To', 'Listicle', 'Problem/Solution', 'Bold Statement', 'Question', 'Story Hook', 'Emotional', 'Trending', 'Educational'] }
    ]
  },
  {
    id: 'hook_generator',
    name: 'Hook Generator',
    icon: Anchor,
    color: 'from-orange-500 to-red-500',
    description: 'Create attention-grabbing hooks',
    requiredInputs: [
      { key: 'content', label: 'Content topic', type: 'text' },
      { key: 'audience', label: 'Target audience', type: 'text' },
      { key: 'platform', label: 'Platform', type: 'select', options: ['YouTube', 'TikTok', 'Instagram', 'X', 'Blog', 'Email'] },
      { key: 'tone', label: 'Tone', type: 'select', options: ['Professional', 'Friendly', 'Enthusiastic', 'Casual', 'Urgent', 'Mysterious'] }
    ]
  },
  {
    id: 'newsletter_generator',
    name: 'Newsletter Generator',
    icon: Mail,
    color: 'from-emerald-500 to-green-500',
    description: 'Generate newsletter content ideas',
    requiredInputs: [
      { key: 'topic', label: 'Newsletter Topic', type: 'textarea' },
      { key: 'audience', label: 'Target Audience', type: 'select', options: ['Gen Z', 'Professionals', 'Parents', 'Students', 'Small Business Owners', 'General Audience'] },
      { key: 'tone', label: 'Tone / Style', type: 'select', options: ['Professional', 'Friendly', 'Funny', 'Bold/Edgy', 'Inspirational'] }
    ]
  },
  {
    id: 'collab_matchmaker',
    name: 'Collab Matchmaker',
    icon: Users,
    color: 'from-indigo-500 to-blue-500',
    description: 'Find collaboration partners',
    requiredInputs: [
      { key: 'platform', label: 'Platform', type: 'select', options: ['YouTube', 'TikTok', 'Instagram', 'Twitter/X', 'LinkedIn', 'Twitch'] },
      { key: 'niche', label: 'Niche/Topic', type: 'text' }
    ]
  },
  {
    id: 'tiny_prompt',
    name: 'Tiny Prompt',
    icon: MessageSquare,
    color: 'from-cyan-500 to-teal-500',
    description: 'Generate engaging chat prompts',
    requiredInputs: [
      { key: 'niche', label: 'Niche', type: 'text' },
      { key: 'audience', label: 'Target audience', type: 'text' },
      { key: 'promptType', label: 'Prompt type', type: 'select', options: ['Community Engagement', 'Story Prompts', 'Educational Q&A', 'Interactive Polls'] },
      { key: 'platform', label: 'Platform', type: 'select', options: ['Instagram Stories', 'TikTok Comments', 'YouTube Community', 'Twitter/X', 'LinkedIn'] }
    ]
  },
  {
    id: 'repurpose_wizard',
    name: 'Repurpose Wizard',
    icon: RefreshCw,
    color: 'from-amber-500 to-orange-500',
    description: 'Transform content across formats',
    requiredInputs: [
      { key: 'content', label: 'Original Content', type: 'textarea' },
      { key: 'sourceFormat', label: 'Source Format', type: 'select', options: ['Blog Post', 'Video Script', 'Podcast Transcript', 'Article', 'Social Post', 'Whitepaper', 'Email', 'Documentation'] },
      { key: 'targetFormats', label: 'Target Formats', type: 'select', options: ['Blog Post', 'Video Script', 'Social Posts', 'Email Newsletter', 'Infographic Brief', 'Podcast Script', 'Short Form Video', 'LinkedIn Article'] }
    ]
  },
  {
    id: 'opportunity_explorer',
    name: 'Opportunity Explorer',
    icon: Search,
    color: 'from-rose-500 to-pink-500',
    description: 'Identify untapped content angles',
    requiredInputs: [
      { key: 'topic', label: 'Content Topic', type: 'textarea' },
      { key: 'niche', label: 'Niche/Industry', type: 'text' },
      { key: 'audience', label: 'Target Audience', type: 'text' },
      { key: 'goal', label: 'Primary Goal', type: 'select', options: ['Reach', 'Engagement', 'Authority', 'Conversions', 'Community', 'Thought Leadership'] }
    ]
  }
];

const businessTools = [
  {
    id: 'idea_brainstorm',
    name: 'Idea Brainstorm',
    icon: Lightbulb,
    color: 'from-yellow-500 to-orange-500',
    description: 'Brainstorm creative business ideas',
    requiredInputs: [
      { key: 'niche', label: 'Niche/Topic', type: 'text' },
      { key: 'audience', label: 'Target audience', type: 'text' },
      { key: 'platform', label: 'Platform', type: 'select', options: ['YouTube', 'TikTok', 'Instagram', 'Blog', 'Podcast', 'Twitter/X'] },
      { key: 'goal', label: 'Primary goal', type: 'select', options: ['Educate', 'Entertain', 'Inspire', 'Sell', 'Build Community', 'Establish Authority'] }
    ]
  },
  {
    id: 'idea_rating',
    name: 'Idea Rating',
    icon: Star,
    color: 'from-green-500 to-emerald-500',
    description: 'Rate and validate business ideas',
    requiredInputs: [
      { key: 'ideas', label: 'Ideas to rate', type: 'textarea' },
      { key: 'niche', label: 'Niche', type: 'text' },
      { key: 'goal', label: 'Priority goal', type: 'select', options: ['Views/Reach', 'Engagement', 'Authority', 'Monetization', 'Community', 'Education'] }
    ]
  },
  {
    id: 'creative_playground',
    name: 'Creative Playground',
    icon: Palette,
    color: 'from-pink-500 to-rose-500',
    description: 'Creative brainstorming techniques',
    requiredInputs: [
      { key: 'topic', label: 'Topic/Project', type: 'text' },
      { key: 'technique', label: 'Technique', type: 'select', options: ['SCAMPER', 'Reverse Brainstorming', 'Mind Mapping', 'Six Thinking Hats', 'Random Word', 'Analogies', 'Worst Idea First'] }
    ]
  }
];

const toolCards = [...marketingTools, ...businessTools];

const PLATFORMS = [
  'Instagram', 'TikTok', 'LinkedIn', 'Twitter/X', 'Facebook', 
  'YouTube', 'Pinterest', 'Snapchat', 'Blog', 'Website', 'Email'
];

const TONES = [
  'Professional', 'Casual', 'Friendly', 'Enthusiastic', 'Formal',
  'Conversational', 'Authoritative', 'Empathetic', 'Humorous', 'Inspirational'
];

const STYLES = [
  'Storytelling', 'Educational', 'Persuasive', 'Informative', 
  'Entertaining', 'Emotional', 'Direct', 'Creative', 'Technical', 'Minimalist'
];

const GOALS = [
  'Engagement', 'Conversion', 'Education', 'Brand Awareness', 
  'Lead Generation', 'Traffic', 'Community Building', 'Sales', 'Retention'
];

// Helper function to invoke LLM
async function invokeLLM(prompt, useOllama, ollamaModel, ollamaEndpoint, responseSchema) {
  if (useOllama && ollamaModel) {
    const endpoint = ollamaEndpoint || (() => {
      const endpoints = JSON.parse(localStorage.getItem('ollama_endpoints') || '[]');
      let activeEndpoint = endpoints.length > 0
        ? (typeof endpoints[0] === 'string' ? endpoints[0] : endpoints[0].url)
        : '/proxy';
      if (activeEndpoint.includes('hq.ngrok.dev')) activeEndpoint = '/proxy';
      return activeEndpoint;
    })();

    const { data } = await apiClient.functions.invoke('ollamaProxy', {
      endpoint,
      action: 'chat',
      model: ollamaModel,
      messages: [{
        role: 'user',
        content: `${prompt}\n\nReturn a valid JSON response matching this structure: ${JSON.stringify(responseSchema)}`
      }],
      options: { stream: false }
    });

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(data.message?.content || '{}');
      if (jsonResponse.properties) {
        const extractedData = {};
        for (const [key, value] of Object.entries(jsonResponse.properties)) {
          if (value.items && Array.isArray(value.items)) extractedData[key] = value.items;
          else if (value.type === 'array' && value.items) extractedData[key] = value.items;
        }
        if (Object.keys(extractedData).length > 0) jsonResponse = extractedData;
      }
    } catch (parseError) {
      throw new Error('Invalid JSON response from Ollama - make sure the model supports JSON format');
    }

    return jsonResponse;
  } else {
    return await apiClient.integrations.Core.InvokeLLMwithLogging({
      prompt,
      response_json_schema: responseSchema
    });
  }
}

export default function ToolSuggestions({ messages, onUseToolWithData, sessionId, globalInputs = {}, onQueueTools }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [inputValues, setInputValues] = useState({});
  const [targetMode, setTargetMode] = useState('apiClient'); // 'apiClient' or 'ollama'
  const [showGlobalInputs, setShowGlobalInputs] = useState(false);
  const [queueForAllPlatforms, setQueueForAllPlatforms] = useState(false);
  const [globalSettings, setGlobalSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(`voice_global_tool_inputs_${sessionId || 'default'}`);
      return saved ? JSON.parse(saved) : {
        platforms: [],
        tone: 'Professional',
        style: 'Informative',
        topic: '',
        targetAudience: '',
        primaryGoal: 'Engagement',
        keywords: '',
        excludeWords: '',
        additionalContext: '',
        llmProvider: 'apiClient',
        queueMode: 'platform',
        maxConcurrentProcess: 1
      };
    } catch {
      return {
        platforms: [],
        tone: 'Professional',
        style: 'Informative',
        topic: '',
        targetAudience: '',
        primaryGoal: 'Engagement',
        keywords: '',
        excludeWords: '',
        additionalContext: '',
        llmProvider: 'apiClient',
        queueMode: 'platform',
        maxConcurrentProcess: 1
      };
    }
  });
  const [savedPresets, setSavedPresets] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const { toast } = useToast();
  const [aiSuggestedTools, setAiSuggestedTools] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [useBeamMode, setUseBeamMode] = useState(false);
  const [autoExecuteTools, setAutoExecuteTools] = useState(false);

  // Show all tools all the time
  const suggestedTools = toolCards;
  
  const toolGroups = [
    { name: 'Marketing Tools', tools: marketingTools, color: 'from-purple-500 to-pink-500' },
    { name: 'Business Tools', tools: businessTools, color: 'from-blue-500 to-indigo-500' }
  ];

  useEffect(() => {
    loadPresetsAndAutoLoad();
    // Load auto-execute preference
    const autoExec = localStorage.getItem('voice_auto_execute_tools') === 'true';
    setAutoExecuteTools(autoExec);
  }, []);

  const loadPresetsAndAutoLoad = async () => {
    try {
      const presets = await apiClient.entities.PlaceholderPreset.filter(
        { preset_type: 'global_tool_inputs' },
        '-last_used',
        20
      );
      setSavedPresets(presets);
      
      // Don't auto-load presets - let localStorage values persist
    } catch (error) {
      console.error('Failed to load presets:', error);
    }
  };

  useEffect(() => {
    const key = `voice_global_tool_inputs_${sessionId || 'default'}`;
    localStorage.setItem(key, JSON.stringify(globalSettings));
  }, [globalSettings, sessionId]);

  // Auto-refresh tool inputs when messages change
  useEffect(() => {
    if (selectedTool && messages.length > 0) {
      const extractedData = extractDataForTool(selectedTool.id, messages, globalSettings);
      setInputValues(extractedData);
    }
  }, [messages, selectedTool, globalSettings]);

  // AI-powered proactive tool suggestions with auto-execute
  useEffect(() => {
    const analyzeAndSuggestTools = async () => {
      if (messages.length < 2 || messages.length % 3 !== 0) return; // Analyze every 3 messages
      
      const autoExecute = localStorage.getItem('voice_auto_execute_tools') === 'true';
      
      setIsAnalyzing(true);
      try {
        const recentMessages = messages.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n');
        
        const { data: analysis } = await apiClient.functions.invoke('invokeLLMWithLogging', {
          prompt: `Analyze this conversation and determine which creative tools would be most useful.

Available tools:
1. content_splitter - Split long content for multiple platforms
2. title_generator - Generate viral titles for videos/posts
3. hook_generator - Create attention-grabbing hooks
4. idea_brainstorm - Brainstorm content ideas
5. idea_rating - Rate and validate ideas
6. creative_playground - Creative brainstorming techniques
7. collab_matchmaker - Find collaboration partners
8. tiny_prompt - Generate chat prompts

Conversation:
${recentMessages}

Return a JSON array of recommended tool IDs (max 3) with brief reasoning. Format:
{
  "recommended_tools": [
    {"tool_id": "title_generator", "reason": "User discussing video content", "priority": "high", "should_auto_execute": true}
  ]
}`,
          source_tool: 'tool_suggestions',
          response_json_schema: {
            type: "object",
            properties: {
              recommended_tools: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    tool_id: { type: "string" },
                    reason: { type: "string" },
                    priority: { type: "string" },
                    should_auto_execute: { type: "boolean" }
                  }
                }
              }
            }
          }
        });

        if (analysis.recommended_tools?.length > 0) {
          setAiSuggestedTools(analysis.recommended_tools);
          
          // Auto-execute if enabled and high priority
          if (autoExecute && analysis.recommended_tools[0]?.should_auto_execute && analysis.recommended_tools[0]?.priority === 'high') {
            const tool = toolCards.find(t => t.id === analysis.recommended_tools[0].tool_id);
            if (tool) {
              toast({
                title: "🤖 AI Auto-Executing Tool",
                description: `Running ${tool.name}: ${analysis.recommended_tools[0].reason}`,
              });
              
              const extractedData = extractDataForTool(tool.id, messages, globalSettings);
              onUseToolWithData(tool.id, extractedData, targetMode);
            }
          }
        }
      } catch (error) {
        console.error('Tool analysis failed:', error);
      } finally {
        setIsAnalyzing(false);
      }
    };

    analyzeAndSuggestTools();
  }, [messages.length, globalSettings, targetMode]);



  const savePreset = async () => {
    if (!presetName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for this preset",
        variant: "destructive"
      });
      return;
    }

    try {
      await apiClient.entities.PlaceholderPreset.create({
        preset_name: presetName,
        preset_type: 'global_tool_inputs',
        description: `Global inputs: ${globalSettings.platforms.join(', ')} | ${globalSettings.topic || 'No topic'}`,
        placeholder_values: globalSettings,
        last_used: new Date().toISOString()
      });

      toast({
        title: "Preset Saved",
        description: `"${presetName}" saved successfully`
      });

      setShowSaveDialog(false);
      setPresetName('');
      loadPresetsAndAutoLoad();
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const loadPreset = async (preset) => {
    setGlobalSettings(preset.placeholder_values);
    
    try {
      await apiClient.entities.PlaceholderPreset.update(preset.id, {
        last_used: new Date().toISOString(),
        use_count: (preset.use_count || 0) + 1
      });
      loadPresetsAndAutoLoad();
    } catch (error) {
      console.error('Failed to update preset:', error);
    }

    toast({
      title: "Preset Loaded",
      description: `"${preset.preset_name}" applied`
    });
  };

  const deletePreset = async (preset) => {
    try {
      await apiClient.entities.PlaceholderPreset.delete(preset.id);
      loadPresetsAndAutoLoad();
      toast({
        title: "Preset Deleted",
        description: `"${preset.preset_name}" removed`
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const togglePlatform = (platform) => {
    setGlobalSettings(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const clearAllInputs = () => {
    setGlobalSettings({
      platforms: [],
      tone: 'Professional',
      style: 'Informative',
      topic: '',
      targetAudience: '',
      primaryGoal: 'Engagement',
      keywords: '',
      excludeWords: '',
      additionalContext: '',
      llmProvider: 'apiClient',
      queueMode: 'platform',
      maxConcurrentProcess: 1
    });
    toast({
      title: "Inputs Cleared",
      description: "All global inputs have been reset"
    });
  };

  const handleInputChange = (key, value) => {
    setInputValues(prev => ({ ...prev, [key]: value }));
  };

  const handleToolClick = (tool) => {
    setSelectedTool(tool);
    // Pre-fill with extracted data from conversation + global settings
    const extractedData = extractDataForTool(tool.id, messages, globalSettings);
    setInputValues(extractedData);
    // Set target mode from global settings
    setTargetMode(globalSettings.llmProvider || 'apiClient');
  };

  const handleBackToList = () => {
    setSelectedTool(null);
    setInputValues({});
    setTargetMode('apiClient');
  };

  const handleUseTool = () => {
    if (selectedTool) {
      onUseToolWithData(selectedTool.id, inputValues, targetMode);
      handleBackToList();
    }
  };

  if (isCollapsed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCollapsed(false)}
          className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300 hover:bg-purple-100"
        >
          <Sparkles className="w-3 h-3 mr-2 text-purple-600" />
          {toolCards.length} Creative Tools
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg">
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <CardTitle className="text-sm font-semibold">Tools</CardTitle>
              <Badge variant="outline" className="bg-purple-100 text-purple-800 text-xs">
                {toolCards.length}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!onQueueTools) return;
                  
                  const allJobs = [];
                  const mode = globalSettings.queueMode || 'platform';
                  
                  suggestedTools.forEach(tool => {
                    const extractedData = extractDataForTool(tool.id, messages, globalSettings);
                    let variations = [];
                    
                    if (mode === 'single') {
                      // Single mode: 1 job per tool with current settings
                      variations = [{ key: null, value: null, label: 'Default' }];
                    } else if (mode === 'style') {
                      variations = STYLES.map(s => ({ key: 'style', value: s, label: s }));
                    } else if (mode === 'tone') {
                      variations = TONES.map(t => ({ key: 'tone', value: t, label: t }));
                    } else if (mode === 'goal') {
                      variations = GOALS.map(g => ({ key: 'goal', value: g, label: g }));
                    } else if (mode === 'total') {
                      // Total mode: Union of all dimensions (Additive)
                      const platformVars = (globalSettings.platforms && globalSettings.platforms.length > 0)
                        ? globalSettings.platforms.map(p => ({ key: 'platform', value: p, label: `Platform: ${p}` }))
                        : PLATFORMS.map(p => ({ key: 'platform', value: p, label: `Platform: ${p}` }));
                        
                      const styleVars = STYLES.map(s => ({ key: 'style', value: s, label: `Style: ${s}` }));
                      const toneVars = TONES.map(t => ({ key: 'tone', value: t, label: `Tone: ${t}` }));
                      const goalVars = GOALS.map(g => ({ key: 'goal', value: g, label: `Goal: ${g}` }));
                      
                      variations = [...platformVars, ...styleVars, ...toneVars, ...goalVars];
                    } else {
                      // Platform mode (Default)
                      if (globalSettings.platforms && globalSettings.platforms.length > 0) {
                        variations = globalSettings.platforms.map(p => ({ key: 'platform', value: p, label: p }));
                      } else {
                        variations = [{ key: 'platform', value: extractedData.platform, label: 'Default' }];
                      }
                    }

                    variations.forEach(v => {
                      const inputData = { ...extractedData };
                      if (v.key) inputData[v.key] = v.value;
                      
                      allJobs.push({
                        toolId: tool.id,
                        toolName: `${tool.name} ${v.label !== 'Default' ? `(${v.label})` : ''}`,
                        inputData: inputData,
                        targetMode: useBeamMode ? 'beam' : (globalSettings.llmProvider || 'apiClient'),
                        platforms: v.key === 'platform' ? [v.value] : [],
                        globalSettings: globalSettings
                      });
                    });
                  });
                  
                  onQueueTools(allJobs);
                }}
                className="h-6 px-2 text-xs hover:bg-purple-100 text-purple-700"
                title="Queue all tools"
              >
                <Layers className="w-3 h-3 mr-1" />
                Queue All
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(true)}
                className="h-6 w-6"
                title="Minimize"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {/* Global Inputs Section */}
          <Collapsible open={showGlobalInputs} onOpenChange={setShowGlobalInputs}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-between bg-white border-indigo-300 hover:bg-indigo-50"
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-3 h-3 text-indigo-600" />
                  <span className="text-xs font-medium">Global Tool Inputs</span>
                  {(globalSettings.platforms.length > 0 || globalSettings.topic.trim()) && (
                    <Badge className="bg-indigo-600 text-xs h-4">
                      {globalSettings.platforms.length + (globalSettings.topic ? 1 : 0)} set
                    </Badge>
                  )}
                </div>
                <X className={`w-3 h-3 transition-transform ${showGlobalInputs ? 'rotate-0' : 'rotate-45'}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-3">
              {/* Saved Presets */}
              {savedPresets.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <FolderOpen className="w-3 h-3 text-blue-600" />
                    Saved Presets
                  </Label>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {savedPresets.map((preset) => (
                      <div
                        key={preset.id}
                        className="flex items-center justify-between p-2 rounded border bg-white hover:bg-blue-50 transition-colors cursor-pointer"
                        onClick={() => loadPreset(preset)}
                      >
                        <div className="flex-1">
                          <p className="text-xs font-medium">{preset.preset_name}</p>
                          <p className="text-xs text-gray-500">Used {preset.use_count || 0} times</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePreset(preset);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Platform Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold flex items-center gap-1">
                  <Target className="w-3 h-3 text-indigo-600" />
                  Platforms
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {PLATFORMS.map((platform) => (
                    <Badge
                      key={platform}
                      onClick={() => togglePlatform(platform)}
                      className={`cursor-pointer transition-all text-xs ${
                        globalSettings.platforms.includes(platform)
                          ? 'bg-indigo-600 hover:bg-indigo-700'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {platform}
                      {globalSettings.platforms.includes(platform) && (
                        <X className="w-2 h-2 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Topic */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  Topic
                </Label>
                <Input
                  placeholder="e.g., AI in Marketing, Product Launch..."
                  value={globalSettings.topic}
                  onChange={(e) => setGlobalSettings(prev => ({ ...prev, topic: e.target.value }))}
                  className="bg-white h-8 text-xs"
                />
              </div>

              {/* Tone & Style */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <Palette className="w-3 h-3 text-pink-600" />
                    Tone
                  </Label>
                  <Select value={globalSettings.tone} onValueChange={(value) => setGlobalSettings(prev => ({ ...prev, tone: value }))}>
                    <SelectTrigger className="bg-white h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONES.map((tone) => (
                        <SelectItem key={tone} value={tone} className="text-xs">{tone}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <Palette className="w-3 h-3 text-purple-600" />
                    Style
                  </Label>
                  <Select value={globalSettings.style} onValueChange={(value) => setGlobalSettings(prev => ({ ...prev, style: value }))}>
                    <SelectTrigger className="bg-white h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STYLES.map((style) => (
                        <SelectItem key={style} value={style} className="text-xs">{style}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Target Audience & Primary Goal */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <Users className="w-3 h-3 text-blue-600" />
                    Target Audience
                  </Label>
                  <Input
                    placeholder="e.g., Marketers, Students..."
                    value={globalSettings.targetAudience}
                    onChange={(e) => setGlobalSettings(prev => ({ ...prev, targetAudience: e.target.value }))}
                    className="bg-white h-8 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    Primary Goal
                  </Label>
                  <Select value={globalSettings.primaryGoal} onValueChange={(value) => setGlobalSettings(prev => ({ ...prev, primaryGoal: value }))}>
                    <SelectTrigger className="bg-white h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOALS.map((goal) => (
                        <SelectItem key={goal} value={goal} className="text-xs">{goal}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Keywords & Exclude */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Keywords</Label>
                  <Input
                    placeholder="AI, automation..."
                    value={globalSettings.keywords}
                    onChange={(e) => setGlobalSettings(prev => ({ ...prev, keywords: e.target.value }))}
                    className="bg-white h-8 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Exclude Words</Label>
                  <Input
                    placeholder="jargon, technical..."
                    value={globalSettings.excludeWords}
                    onChange={(e) => setGlobalSettings(prev => ({ ...prev, excludeWords: e.target.value }))}
                    className="bg-white h-8 text-xs"
                  />
                </div>
              </div>

              {/* Additional Context */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Additional Context</Label>
                <Textarea
                  placeholder="Any specific requirements..."
                  value={globalSettings.additionalContext}
                  onChange={(e) => setGlobalSettings(prev => ({ ...prev, additionalContext: e.target.value }))}
                  className="bg-white resize-none text-xs"
                  rows={2}
                />
              </div>

              {/* LLM Provider */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  Default LLM Provider
                </Label>
                <Select value={globalSettings.llmProvider} onValueChange={(value) => setGlobalSettings(prev => ({ ...prev, llmProvider: value }))}>
                  <SelectTrigger className="bg-white h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apiClient" className="text-xs">apiClient AI</SelectItem>
                    <SelectItem value="ollama" className="text-xs">Ollama</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Queue Mode Strategy */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1">
                  <Layers className="w-3 h-3 text-indigo-600" />
                  Batch Generation Strategy
                </Label>
                <Select value={globalSettings.queueMode || 'platform'} onValueChange={(value) => setGlobalSettings(prev => ({ ...prev, queueMode: value }))}>
                  <SelectTrigger className="bg-white h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single" className="text-xs">1 per Tool (Default Settings)</SelectItem>
                    <SelectItem value="platform" className="text-xs">By Platform (Selected)</SelectItem>
                    <SelectItem value="style" className="text-xs">By Style (All)</SelectItem>
                    <SelectItem value="goal" className="text-xs">By Goal (All)</SelectItem>
                    <SelectItem value="tone" className="text-xs">By Tone (All)</SelectItem>
                    <SelectItem value="total" className="text-xs">Total (All Variants)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-gray-500">
                  Determines how "Queue All" creates variations
                </p>
              </div>

              {/* Max Concurrent Process */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1">
                  <Layers className="w-3 h-3 text-orange-600" />
                  Max Concurrent Process: {globalSettings.maxConcurrentProcess || 1}
                </Label>
                <Slider
                  value={[globalSettings.maxConcurrentProcess || 1]}
                  onValueChange={(value) => setGlobalSettings(prev => ({ ...prev, maxConcurrentProcess: value[0] }))}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <p className="text-[10px] text-gray-500">
                  Keep this at 1 if you run a CPU
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSaveDialog(true)}
                  className="flex-1 h-7 text-xs"
                >
                  <Save className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllInputs}
                  className="flex-1 h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              </div>

              {/* Save Dialog */}
              {showSaveDialog && (
                <div className="p-2 bg-white rounded-lg border-2 border-blue-200 space-y-2">
                  <Label className="text-xs font-semibold">Preset Name</Label>
                  <Input
                    placeholder="e.g., 'Q1 Social Campaign'"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && savePreset()}
                    className="h-8 text-xs"
                  />
                  <div className="flex gap-2">
                    <Button onClick={savePreset} className="flex-1 bg-blue-600 hover:bg-blue-700 h-7 text-xs">
                      Save
                    </Button>
                    <Button onClick={() => setShowSaveDialog(false)} variant="outline" className="h-7 text-xs">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Tool List/Form */}
          <div className="space-y-2">
            <AnimatePresence mode="wait">
            {!selectedTool ? (
              <motion.div
                key="tool-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="space-y-3">
                  {toolGroups.map((group, groupIdx) => (
                    <div key={group.name} className="space-y-1.5">
                      <div className={`flex items-center gap-2 px-2 py-1 rounded-lg bg-gradient-to-r ${group.color} bg-opacity-10`}>
                        <div className={`w-1 h-4 rounded-full bg-gradient-to-b ${group.color}`}></div>
                        <h3 className="text-xs font-bold text-gray-800">{group.name}</h3>
                        <Badge variant="outline" className="text-[10px] h-4 bg-white">
                          {group.tools.length}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        {group.tools.map((tool, idx) => {
                          const Icon = tool.icon;
                          const isAiSuggested = false;
                          return (
                            <motion.button
                              key={tool.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: (groupIdx * 0.3) + (idx * 0.05) }}
                              onClick={() => handleToolClick(tool)}
                              className={`w-full text-left p-2 rounded-lg border-2 ${
                                isAiSuggested 
                                  ? 'border-yellow-400 bg-yellow-50' 
                                  : 'border-purple-200 bg-white'
                              } hover:bg-gradient-to-r hover:border-purple-400 hover:shadow-md transition-all group`}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-lg bg-gradient-to-r ${tool.color} flex items-center justify-center flex-shrink-0`}>
                                  <Icon className="w-3 h-3 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs font-semibold text-gray-900">{tool.name}</p>
                                    {isAiSuggested && (
                                      <Lightbulb className="w-3 h-3 text-yellow-600" />
                                    )}
                                  </div>
                                  <p className="text-[10px] text-gray-600 leading-tight">{tool.description}</p>
                                </div>
                                <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-purple-600 flex-shrink-0 transition-colors" />
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="tool-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToList}
                    className="mb-2"
                  >
                    <ArrowLeft className="w-3 h-3 mr-1" />
                    Back to Tools
                  </Button>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = selectedTool.icon;
                      return (
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${selectedTool.color} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                      );
                    })()}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">{selectedTool.name}</h4>
                      <p className="text-xs text-gray-600">{selectedTool.description}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedTool.requiredInputs.map((input) => (
                    <div key={input.key} className="space-y-1.5">
                      <Label htmlFor={input.key} className="text-xs font-medium">
                        {input.label}
                      </Label>
                      {input.type === 'textarea' ? (
                        <Textarea
                          id={input.key}
                          value={inputValues[input.key] || ''}
                          onChange={(e) => handleInputChange(input.key, e.target.value)}
                          placeholder={input.label}
                          className="text-sm min-h-[80px]"
                        />
                      ) : input.type === 'select' ? (
                        <Select
                          value={inputValues[input.key] || ''}
                          onValueChange={(value) => handleInputChange(input.key, value)}
                        >
                          <SelectTrigger id={input.key} className="text-sm">
                            <SelectValue placeholder={`Select ${input.label.toLowerCase()}...`} />
                          </SelectTrigger>
                          <SelectContent>
                            {input.options.map((option) => (
                              <SelectItem key={option} value={option} className="text-sm">
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={input.key}
                          type="text"
                          value={inputValues[input.key] || ''}
                          onChange={(e) => handleInputChange(input.key, e.target.value)}
                          placeholder={input.label}
                          className="text-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-purple-200 space-y-2">
                  {/* Beam Mode Toggle */}
                  <div className="flex items-center justify-between p-2 bg-indigo-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      <Label className="text-xs font-medium cursor-pointer">Beam Mode (Multi-Model)</Label>
                    </div>
                    <Switch
                      checked={useBeamMode}
                      onCheckedChange={setUseBeamMode}
                    />
                  </div>

                  {/* apiClient/Ollama selection hidden as it's now handled by Global Tool Inputs */}

                  {useBeamMode && (
                    <div className="p-2 bg-indigo-50 rounded border border-indigo-200">
                      <p className="text-xs text-indigo-800">
                        ⚡ Multiple models will generate and compare results
                      </p>
                    </div>
                  )}

                  {/* Queue for all platforms */}
                  {globalSettings.platforms?.length > 1 && (
                    <div className="flex items-center justify-between p-2 bg-cyan-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Layers className="w-3 h-3 text-cyan-600" />
                        <Label className="text-xs font-medium cursor-pointer">
                          Queue for All Platforms ({globalSettings.platforms.length})
                        </Label>
                      </div>
                      <Switch
                        checked={queueForAllPlatforms}
                        onCheckedChange={setQueueForAllPlatforms}
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        if (queueForAllPlatforms && globalSettings.platforms?.length > 1 && onQueueTools) {
                          // Queue tool for each platform
                          const jobs = globalSettings.platforms.map(platform => ({
                            toolId: selectedTool.id,
                            toolName: selectedTool.name,
                            inputData: {
                              ...inputValues,
                              platform
                            },
                            targetMode: useBeamMode ? 'beam' : targetMode,
                            platforms: [platform],
                            globalSettings: globalSettings
                          }));
                          onQueueTools(jobs);
                          handleBackToList();
                        } else if (useBeamMode) {
                          onUseToolWithData(selectedTool.id, inputValues, 'beam', globalSettings);
                          handleBackToList();
                        } else {
                          onUseToolWithData(selectedTool.id, inputValues, targetMode, globalSettings);
                          handleBackToList();
                        }
                      }}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      {queueForAllPlatforms ? (
                        <>
                          <Plus className="w-3 h-3 mr-2" />
                          Queue {globalSettings.platforms.length} Jobs
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 mr-2" />
                          Generate with {useBeamMode ? 'Beam' : targetMode === 'ollama' ? 'Ollama' : 'apiClient'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Extract relevant data from conversation for each tool
function extractDataForTool(toolId, messages, globalSettings = {}) {
  // Get all content from the conversation
  const allContent = messages.map(m => m.content).join('\n\n');
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content).join('\n\n');
  const assistantMessages = messages.filter(m => m.role === 'assistant').map(m => m.content).join('\n\n');
  const lastUserMessage = messages.filter(m => m.role === 'user').slice(-1)[0]?.content || '';
  const lastAssistantMessage = messages.filter(m => m.role === 'assistant').slice(-1)[0]?.content || '';
  const recentExchange = messages.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n');
  
  // Start with global settings as base - include ALL settings for contextual prompts
  const baseData = {
    platform: globalSettings.platforms?.[0] || '',
    tone: globalSettings.tone || '',
    style: globalSettings.style || '',
    audience: globalSettings.targetAudience || '',
    niche: globalSettings.topic || '',
    goal: globalSettings.primaryGoal || '',
    keywords: globalSettings.keywords || '',
    excludeWords: globalSettings.excludeWords || '',
    additionalContext: globalSettings.additionalContext || ''
  };
  
  // Extract data based on tool type - use full conversation context
  switch (toolId) {
    case 'content_splitter':
      return { 
        ...baseData,
        platforms: globalSettings.platforms || [],
        // Use the most substantial recent content (could be assistant or user)
        content: lastAssistantMessage.length > lastUserMessage.length 
          ? lastAssistantMessage 
          : lastUserMessage || allContent.substring(0, 2000)
      };
    
    case 'title_generator':
      const topicAndContext = [globalSettings.topic, globalSettings.additionalContext].filter(Boolean).join('\n\n');
      return { 
        ...baseData,
        // Use Topic + Additional Context from global settings
        description: topicAndContext || recentExchange || allContent.substring(0, 1000),
        platform: globalSettings.platforms?.[0] || baseData.platform,
        style: globalSettings.style || 'Curiosity Gap'
      };
    
    case 'hook_generator':
      return { 
        ...baseData,
        // Use topic or the main conversation content
        content: globalSettings.topic || userMessages.substring(0, 500) || allContent.substring(0, 500),
        audience: globalSettings.targetAudience || baseData.audience,
        platform: globalSettings.platforms?.[0] || baseData.platform,
        tone: globalSettings.tone || 'Professional'
      };
    
    case 'idea_brainstorm':
      return {
        ...baseData,
        niche: globalSettings.topic || lastUserMessage.substring(0, 100) || '',
        audience: globalSettings.targetAudience || baseData.audience,
        platform: globalSettings.platforms?.[0] || baseData.platform,
        goal: globalSettings.primaryGoal || 'Educate'
      };
    
    case 'idea_rating':
      return { 
        ...baseData,
        // Get all user ideas from the conversation
        ideas: userMessages || messages.filter(m => m.role === 'user').map(m => m.content).join('\n\n'),
        niche: globalSettings.topic || '',
        goal: globalSettings.primaryGoal || 'Views/Reach'
      };
    
    case 'creative_playground':
      return { 
        ...baseData,
        topic: globalSettings.topic || lastUserMessage.substring(0, 200) || allContent.substring(0, 200),
        technique: 'SCAMPER'
      };
    
    case 'collab_matchmaker':
      return {
        ...baseData,
        platform: globalSettings.platforms?.[0] || baseData.platform,
        niche: globalSettings.topic || lastUserMessage.substring(0, 100) || ''
      };
    
    case 'tiny_prompt':
      return {
        ...baseData,
        niche: globalSettings.topic || lastUserMessage.substring(0, 100) || '',
        audience: globalSettings.targetAudience || baseData.audience,
        platform: globalSettings.platforms?.[0] || baseData.platform,
        promptType: 'Community Engagement'
      };
    
    case 'newsletter_generator':
      return {
        ...baseData,
        topic: globalSettings.topic || allContent.substring(0, 500) || '',
        audience: globalSettings.targetAudience || 'Professionals',
        tone: globalSettings.tone || 'Professional'
      };
    
    case 'repurpose_wizard':
      return {
        ...baseData,
        content: lastAssistantMessage.length > lastUserMessage.length 
          ? lastAssistantMessage 
          : lastUserMessage || allContent.substring(0, 2000),
        sourceFormat: 'Blog Post',
        targetFormats: 'Social Posts'
      };
    
    case 'opportunity_explorer':
      return {
        ...baseData,
        topic: globalSettings.topic || userMessages.substring(0, 500) || allContent.substring(0, 500),
        niche: globalSettings.topic || lastUserMessage.substring(0, 100) || '',
        audience: globalSettings.targetAudience || baseData.audience,
        goal: globalSettings.primaryGoal || 'Reach'
      };
    
    default:
      return baseData;
  }
}
