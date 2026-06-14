import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Edit,
  Trash2,
  Heart,
  Copy,
  Folder,
  FolderOpen,
  Wand2,
  Share2,
  Globe,
  Users,
  Lock,
  TrendingUp,
  Plus,
  MessageSquare,
  GitBranch,
  Sparkles,
  MoreVertical,
  Play,
  CheckCircle2,
  Loader2,
  Terminal,
  Save,
  History,
  Settings,
  Trash,
  X,
  Info,
  MoreHorizontal,
  UserPlus
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogDesc,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle as AlertDialogTitleComp,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/apis/client"; // used for Template entity mutations

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";

const categoryColors = {
  Writing: "bg-blue-100 text-blue-800 border-blue-200",
  Marketing: "bg-purple-100 text-purple-800 border-purple-200",
  Development: "bg-green-100 text-green-800 border-green-200",
  Coding: "bg-green-100 text-green-800 border-green-200",
  Design: "bg-pink-100 text-pink-800 border-pink-200",
  Business: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Education: "bg-indigo-100 text-indigo-800 border-indigo-200",
  Personal: "bg-gray-100 text-gray-800 border-gray-200",
};

const getOllamaEndpoints = () => {
  try {
    const stored = localStorage.getItem('ollama_endpoints');
    if (stored) {
      const endpoints = JSON.parse(stored);
      return Array.isArray(endpoints) && endpoints.length > 0 ? endpoints : ['https://christy-ramentaceous-verbatim.ngrok-free.dev'];
    }
  } catch (error) {
    console.error('Error reading Ollama endpoints from localStorage:', error);
  }
  return ['https://christy-ramentaceous-verbatim.ngrok-free.dev'];
};

const getDefaultModel = () => {
  try {
    return localStorage.getItem('ollama_default_model') || 'llama2';
  } catch (error) {
    console.error('Error reading default model:', error);
    return 'llama2';
  }
};

const saveTestResult = async (templateId, result, template, currentUser) => {
  try {
    const key = `ollama_test_results_${templateId}`;
    const stored = localStorage.getItem(key);
    const results = stored ? JSON.parse(stored) : [];
    results.unshift(result);
    const trimmed = results.slice(0, 10);
    localStorage.setItem(key, JSON.stringify(trimmed));

    // Also save to database
    if (currentUser) {
      await client.entities.TestHistory.create({
        item_type: 'template',
        item_id: templateId,
        item_name: template?.title || 'Untitled',
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email,
        user_message: result.prompt,
        response: result.response,
        model: result.modelParams?.model || 'unknown',
        endpoint: result.endpoint,
        model_params: {
          temperature: result.modelParams?.temperature,
          top_p: result.modelParams?.top_p,
          max_tokens: result.modelParams?.max_tokens
        },
        placeholder_values: result.placeholderValues
      });
    }

    return trimmed;
  } catch (error) {
    console.error('Error saving test result:', error);
    return [];
  }
};

const loadTestResults = (templateId) => {
  try {
    const key = `ollama_test_results_${templateId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading test results:', error);
    return [];
  }
};

const deleteTestResult = (templateId, resultId) => {
  try {
    const key = `ollama_test_results_${templateId}`;
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    const results = JSON.parse(stored);
    const filtered = results.filter(r => r.id !== resultId);
    localStorage.setItem(key, JSON.stringify(filtered));
    return filtered;
  } catch (error) {
    console.error('Error deleting test result:', error);
    return [];
  }
};

// Smart placeholder suggestions based on common patterns
const SMART_PLACEHOLDERS = {
  // Names
  name: ['John Smith', 'Sarah Johnson', 'Alex Chen', 'Maria Garcia', 'James Wilson'],
  user_name: ['TechEnthusiast42', 'DigitalNomad', 'CreativeMind', 'InnovateTech', 'FutureThinker'],
  company: ['Acme Corp', 'TechVentures Inc', 'GlobalSoft', 'InnovatePro', 'NextGen Solutions'],
  company_name: ['Acme Corp', 'TechVentures Inc', 'GlobalSoft', 'InnovatePro', 'NextGen Solutions'],
  brand: ['Apple', 'Nike', 'Tesla', 'Amazon', 'Google'],
  
  // Content
  topic: ['artificial intelligence', 'sustainable energy', 'remote work productivity', 'digital marketing trends', 'blockchain technology'],
  subject: ['climate change solutions', 'modern leadership', 'innovation strategies', 'customer experience', 'data privacy'],
  title: ['The Future of Work', '10 Tips for Success', 'A Complete Guide', 'Breaking News Update', 'Expert Analysis'],
  headline: ['Revolutionary Discovery Changes Everything', 'New Study Reveals Surprising Results', 'Industry Leaders Share Insights'],
  
  // Products/Services
  product: ['Smart Watch Pro', 'AI Assistant', 'Cloud Storage Plus', 'Eco-Friendly Water Bottle', 'Wireless Earbuds'],
  product_name: ['ProductX 3000', 'SmartHub Pro', 'EcoSaver Elite', 'TechGlove Advanced', 'PowerBoost Max'],
  service: ['cloud computing', 'web development', 'digital marketing', 'consulting services', 'data analytics'],
  
  // Industries
  industry: ['technology', 'healthcare', 'finance', 'education', 'e-commerce'],
  niche: ['SaaS startups', 'fitness enthusiasts', 'remote workers', 'small business owners', 'creative professionals'],
  
  // Audience
  audience: ['tech-savvy millennials', 'small business owners', 'health-conscious consumers', 'busy professionals', 'creative entrepreneurs'],
  target_audience: ['Gen Z consumers', 'enterprise decision makers', 'first-time homebuyers', 'fitness enthusiasts', 'eco-conscious shoppers'],
  customer: ['enterprise clients', 'retail customers', 'B2B partners', 'end users', 'premium subscribers'],
  
  // Tone/Style
  tone: ['professional', 'casual and friendly', 'authoritative', 'empathetic', 'inspirational'],
  style: ['formal business', 'conversational', 'technical', 'storytelling', 'persuasive'],
  voice: ['confident expert', 'helpful friend', 'trusted advisor', 'innovative leader', 'passionate advocate'],
  
  // Actions/Goals
  goal: ['increase brand awareness', 'drive conversions', 'build customer loyalty', 'generate leads', 'improve engagement'],
  action: ['sign up for newsletter', 'schedule a demo', 'download the guide', 'start free trial', 'contact sales'],
  objective: ['boost sales by 20%', 'reduce churn rate', 'improve customer satisfaction', 'expand market reach', 'enhance brand perception'],
  
  // Content Types
  format: ['blog post', 'social media post', 'email newsletter', 'landing page copy', 'video script'],
  content_type: ['how-to guide', 'case study', 'listicle', 'interview', 'product review'],
  
  // Technical
  technology: ['React', 'Python', 'AWS', 'Kubernetes', 'Machine Learning'],
  language: ['JavaScript', 'TypeScript', 'Go', 'Rust', 'Swift'],
  framework: ['Next.js', 'Django', 'Spring Boot', 'FastAPI', 'Flutter'],
  platform: ['iOS', 'Android', 'Web', 'Cross-platform', 'Desktop'],
  
  // Business
  feature: ['real-time collaboration', 'advanced analytics', 'automated workflows', 'seamless integration', 'AI-powered insights'],
  benefit: ['saves 10 hours per week', 'increases productivity by 40%', 'reduces costs significantly', 'improves team communication', 'enhances decision making'],
  pain_point: ['manual data entry', 'scattered information', 'poor team coordination', 'slow approval processes', 'lack of visibility'],
  
  // Numbers/Metrics
  number: ['5', '10', '25', '100', '500'],
  percentage: ['15%', '30%', '50%', '75%', '100%'],
  price: ['$29/month', '$99/year', '$199 one-time', '$49/user', 'Free tier available'],
  
  // Time
  timeframe: ['30 days', '3 months', '1 year', 'immediately', 'within a week'],
  deadline: ['end of Q4', 'next Monday', 'by year end', 'in 2 weeks', 'ASAP'],
  
  // Location
  location: ['New York', 'San Francisco', 'London', 'Tokyo', 'Berlin'],
  region: ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Global'],
  
  // Misc
  keyword: ['innovation', 'sustainability', 'efficiency', 'growth', 'transformation'],
  example: ['Spotify', 'Airbnb', 'Slack', 'Zoom', 'Notion'],
  competitor: ['Competitor A', 'Industry Leader', 'Market Alternative', 'Legacy Solution', 'New Entrant'],
  
  // Default fallbacks
  default: ['example value', 'sample text', 'placeholder content', 'test input', 'demo data']
};

const getSmartPlaceholderValue = (placeholderKey) => {
  const key = placeholderKey.toLowerCase().replace(/[^a-z_]/g, '');
  
  // Direct match
  if (SMART_PLACEHOLDERS[key]) {
    const options = SMART_PLACEHOLDERS[key];
    return options[Math.floor(Math.random() * options.length)];
  }
  
  // Partial match - check if key contains any known pattern
  for (const [pattern, options] of Object.entries(SMART_PLACEHOLDERS)) {
    if (key.includes(pattern) || pattern.includes(key)) {
      return options[Math.floor(Math.random() * options.length)];
    }
  }
  
  // Fallback to default
  const defaults = SMART_PLACEHOLDERS.default;
  return defaults[Math.floor(Math.random() * defaults.length)];
};

export default function TemplateCard({ template, onEdit, onDelete, onToggleFavorite, onUse, onShowInsights, onAddToMyTemplates, onUpdate, onMove, folders, currentUserEmail, onQuickRefine, onQuickVariations, onShowVersionHistory, onInviteCollaborators, onShowCollaborators, onShowChangeLog, onSelect, isSelected, currentUser }) {
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSocialShareModal, setShowSocialShareModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showOllamaDialog, setShowOllamaDialog] = useState(false);
  const [ollamaResponse, setOllamaResponse] = useState('');
  const [isTestingPrompt, setIsTestingPrompt] = useState(false);
  const [ollamaError, setOllamaError] = useState(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState('');
  const [ollamaEndpoints, setOllamaEndpoints] = useState([]);
  const [placeholderValues, setPlaceholderValues] = useState({});
  const [modelParams, setModelParams] = useState({
    model: '',
    temperature: 0.7,
    top_p: 0.9,
    max_tokens: 1000,
  });
  const [testResults, setTestResults] = useState([]);
  const [selectedComparison, setSelectedComparison] = useState([]);
  const [activeTab, setActiveTab] = useState('test');
  const [availableModels, setAvailableModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [endpointStatus, setEndpointStatus] = useState({});

  const isMyTemplate = template.created_by === currentUserEmail;
  const isOwner = template.created_by === currentUserEmail;
  const queryClient = useQueryClient();

  const isCollaborator = template.collaborators?.some(c => c.email === currentUserEmail);
  const hasActiveCollaboration = (template.collaborators || []).length > 0;

  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [selectedMoveFolder, setSelectedMoveFolder] = useState(template.folder || 'Uncategorized');

  const [showVersionCompare, setShowVersionCompare] = useState(false);

  useEffect(() => {
    const endpoints = getOllamaEndpoints();
    setOllamaEndpoints(endpoints);
    if (endpoints.length > 0) {
      setSelectedEndpoint(endpoints[0]);
    }

    const defaultModel = getDefaultModel();
    setModelParams(prev => ({ ...prev, model: defaultModel }));

    const results = loadTestResults(template.id);
    setTestResults(results);
  }, [template.id]);

  const fetchAvailableModels = async (endpoint) => {
    const ep = endpoint || selectedEndpoint || ollamaEndpoints[0];
    if (!ep) return;
    setLoadingModels(true);
    try {
      const res = await fetch(`${ep}/v1/models`, { headers: { 'Authorization': 'Bearer ollama' } });
      const data = await res.json();
      setAvailableModels((data.data || []).map(m => ({ name: m.id })));
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const checkEndpointStatus = async (endpoints) => {
    const status = {};
    for (const endpoint of endpoints) {
      try {
        const res = await fetch(`${endpoint}/api/version`, { signal: AbortSignal.timeout(5000) });
        status[endpoint] = res.ok ? 'online' : 'offline';
      } catch {
        status[endpoint] = 'offline';
      }
    }
    setEndpointStatus(status);
  };

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }) => client.entities.Template.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['public-templates'] });
      setShowShareModal(false);
      setShowDetails(false);
    },
  });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(template, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const detectedPlaceholders = useMemo(() => {
    const matches = template.content.match(/{([^}]+)}/g) || [];
    return [...new Set(matches)];
  }, [template.content]);

  useEffect(() => {
    const initialValues = {};
    detectedPlaceholders.forEach(placeholder => {
      const key = placeholder.replace(/[{}]/g, '');
      if (!placeholderValues[key]) {
        initialValues[key] = '';
      }
    });
    if (Object.keys(initialValues).length > 0) {
      setPlaceholderValues(prev => ({ ...prev, ...initialValues }));
    }
  }, [detectedPlaceholders]);

  const buildFinalPrompt = () => {
    let finalPrompt = template.content;
    
    Object.entries(placeholderValues).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      finalPrompt = finalPrompt.replaceAll(placeholder, value || placeholder);
    });

    if (currentUser) {
      const settingsPrefix = [];
      
      if (currentUser.template_selected_persona && currentUser.template_selected_persona !== 'None') {
        settingsPrefix.push(`Act as: ${currentUser.template_selected_persona}`);
      }
      
      if (currentUser.template_output_format) {
        settingsPrefix.push(`Output format: ${currentUser.template_output_format}`);
      }
      
      if (currentUser.template_tone) {
        settingsPrefix.push(`Tone: ${currentUser.template_tone}`);
      }
      
      if (currentUser.template_language) {
        settingsPrefix.push(`Language: ${currentUser.template_language}`);
      }
      
      if (currentUser.template_length) {
        settingsPrefix.push(`Target length: approximately ${currentUser.template_length} words`);
      }
      
      if (currentUser.template_constraints) {
        settingsPrefix.push(`Constraint: ${currentUser.template_constraints}`);
      }
      
      if (settingsPrefix.length > 0) {
        finalPrompt = settingsPrefix.join('\n') + '\n\n---\n\n' + finalPrompt;
      }
    }

    return finalPrompt;
  };

  const handleUseTemplate = async () => {
    if (onUse) {
      onUse(template);
    }

    const endpoints = getOllamaEndpoints();
    setOllamaEndpoints(endpoints);
    const initialEndpoint = endpoints[0];
    setSelectedEndpoint(initialEndpoint);

    const defaultModel = getDefaultModel();
    setModelParams(prev => ({ ...prev, model: defaultModel }));

    setActiveTab('test');
    setOllamaResponse('');
    setOllamaError(null);
    setShowOllamaDialog(true);
    fetchAvailableModels();
    checkEndpointStatus(endpoints);
  };

  const handleTestWithEndpoint = async (endpoint) => {
    setSelectedEndpoint(endpoint);
    setIsTestingPrompt(true);
    setOllamaError(null);
    setOllamaResponse('');

    if (!endpoint) {
      setOllamaError("No Ollama endpoint selected. Please choose one.");
      setIsTestingPrompt(false);
      return;
    }

    const finalPrompt = buildFinalPrompt();

    try {
      const chatRes = await fetch(`${endpoint}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ollama' },
        body: JSON.stringify({
          model: modelParams.model,
          messages: [{ role: "user", content: finalPrompt }],
          temperature: modelParams.temperature,
          top_p: modelParams.top_p,
          max_tokens: modelParams.max_tokens,
          stream: false,
        }),
      });
      const chatData = await chatRes.json();

      const responseText = chatData?.choices?.[0]?.message?.content || 'No response received';
      setOllamaResponse(responseText);

      const result = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        endpoint,
        prompt: finalPrompt,
        response: responseText,
        modelParams: { ...modelParams },
        placeholderValues: { ...placeholderValues }
      };

      const updatedResults = await saveTestResult(template.id, result, template, currentUser);
      setTestResults(updatedResults);

    } catch (error) {
      console.error('Ollama request failed:', error);
      setOllamaError(error.message || `Failed to connect to Ollama at ${endpoint}. Make sure Ollama is running.`);
    } finally {
      setIsTestingPrompt(false);
    }
  };

  const handleSaveShareSettings = (shareData) => {
    updateTemplateMutation.mutate({
      id: template.id,
      data: shareData
    });
  };

  const handleRestoreVersion = (versionToRestore) => {
    if (onUpdate && currentUser) {
      const currentVersionNumber = template.version || 1;
      const newVersionNumber = currentVersionNumber + 1;

      onUpdate(template.id, {
        title: versionToRestore.title,
        content: versionToRestore.content,
        category: versionToRestore.category,
        subcategory: versionToRestore.subcategory,
        tags: versionToRestore.tags,
        version: newVersionNumber,
        version_history: [
          ...(template.version_history || []),
          {
            version: currentVersionNumber,
            title: template.title,
            content: template.content,
            category: template.category,
            subcategory: template.subcategory,
            tags: template.tags,
            edited_by: currentUser.email,
            edited_by_name: currentUser.full_name || currentUser.email,
            saved_date: new Date().toISOString(),
            change_notes: `Restored from v${versionToRestore.version}`
          }
        ]
      });
    }
  };

  const handleMoveTemplate = () => {
    if (onMove && selectedMoveFolder !== template.folder) {
      onMove(template.id, selectedMoveFolder);
      setShowMoveDialog(false);
    }
  };

  const handleDeleteTestResult = (resultId) => {
    const updated = deleteTestResult(template.id, resultId);
    setTestResults(updated);
    setSelectedComparison(prev => prev.filter(id => id !== resultId));
  };

  const handleToggleComparison = (resultId) => {
    setSelectedComparison(prev => {
      if (prev.includes(resultId)) {
        return prev.filter(id => id !== resultId);
      } else if (prev.length < 3) {
        return [...prev, resultId];
      }
      return prev;
    });
  };

  const validFolders = useMemo(() => {
    if (!folders) return ['Uncategorized'];
    const filtered = folders.filter(f => f && typeof f === 'string' && f.trim() !== '');
    const uniqueFolders = new Set(['Uncategorized', ...filtered]);
    return Array.from(uniqueFolders).sort();
  }, [folders]);

  const placeholders = template.content.match(/{([^}]+)}/g) || [];
  const uniquePlaceholders = [...new Set(placeholders)];

  const getVisibilityIcon = () => {
    if (template.is_public || template.visibility === 'public') {
      return <Globe className="w-3 h-3" />;
    } else if (template.visibility === 'shared' || (template.shared_with && template.shared_with.length > 0)) {
      return <Users className="w-3 h-3" />;
    }
    return <Lock className="w-3 h-3" />;
  };

  const getVisibilityLabel = () => {
    if (template.is_public || template.visibility === 'public') {
      return 'Public';
    } else if (template.visibility === 'shared' || (template.shared_with && template.shared_with.length > 0)) {
      return `Shared with ${template.shared_with?.length || 0}`;
    }
    return 'Private';
  };

  const safeToFixed = (value, decimals = 1) => {
    const num = Number(value) || 0;
    return Math.max(0, num).toFixed(Math.max(0, decimals));
  };

  const versionCount = (template.version_history || []).length;

  return (
    <>
      <Card className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-indigo-400 bg-white">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              {onSelect && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => onSelect(template.id, checked)}
                  className="mt-1"
                />
              )}
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {template.title}
                </CardTitle>
                {template.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {template.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge className={categoryColors[template.category] || categoryColors.Personal}>
                    {template.category}
                  </Badge>
                  {template.folder && (
                    <Badge
                      variant="outline"
                      className="text-xs flex items-center gap-1 cursor-pointer hover:bg-gray-100"
                      onClick={() => isMyTemplate && setShowMoveDialog(true)}
                      title={isMyTemplate ? "Click to move" : ""}
                    >
                      <Folder className="w-3 h-3" />
                      {template.folder}
                    </Badge>
                  )}

                  {isMyTemplate && (
                    <Badge
                      variant="outline"
                      className="text-xs flex items-center gap-1"
                    >
                      {getVisibilityIcon()}
                      {getVisibilityLabel()}
                    </Badge>
                  )}
                  {template.tags?.slice(0, 3).map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {template.tags?.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{template.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleFavorite(template)}
              className={template.is_favorite ? "text-red-500" : "text-gray-400"}
            >
              <Heart className={`w-5 h-5 ${template.is_favorite ? "fill-current" : ""}`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
              {template.content}
            </p>

            {uniquePlaceholders.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                <span className="text-xs text-gray-500 font-medium">Placeholders:</span>
                {uniquePlaceholders.slice(0, 5).map((placeholder, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs bg-purple-50">
                    {placeholder}
                  </Badge>
                ))}
                {uniquePlaceholders.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{uniquePlaceholders.length - 5} more
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 text-xs text-gray-600 pt-1">
              {template.use_count > 0 && (
                <span>Used {template.use_count} time{template.use_count !== 1 ? 's' : ''}</span>
              )}
              {(template.is_public || template.visibility === 'public') && template.downloads > 0 && (
                <span>• {template.downloads} downloads</span>
              )}
              {(template.is_public || template.visibility === 'public') && template.rating > 0 && (
                <span>• ⭐ {safeToFixed(template.rating, 1)}</span>
              )}
              {testResults.length > 0 && (
                <span>• {testResults.length} test{testResults.length !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            {versionCount > 0 && (
              <button
                onClick={() => onShowVersionHistory && onShowVersionHistory(template)}
                className="flex items-center gap-1 hover:text-purple-600 cursor-pointer transition-colors"
                title="View version history"
              >
                <GitBranch className="w-3 h-3" />
                v{template.version || 1} ({versionCount} versions)
              </button>
            )}
            {(template.visibility === 'public' || template.visibility === 'shared') && (
              <div className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                Comments
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            <Button
              variant="default"
              size="sm"
              onClick={handleUseTemplate}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md flex-1"
              title="Test prompt with Ollama"
            >
              <Terminal className="w-4 h-4 mr-2" />
              Test
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <MoreHorizontal className="w-4 h-4 mr-2" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setShowSocialShareModal(true)}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share on Social
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowDetails(true)}>
                  <Info className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {versionCount > 0 && onShowVersionHistory && (
                  <DropdownMenuItem onClick={() => onShowVersionHistory(template)}>
                    <History className="w-4 h-4 mr-2 text-purple-600" />
                    Version History ({template.version || 1})
                  </DropdownMenuItem>
                )}
                {isMyTemplate && (
                  <>
                    <DropdownMenuItem onClick={() => onInviteCollaborators && onInviteCollaborators(template)}>
                      <Users className="w-4 h-4 mr-2 text-blue-600" />
                      Invite Collaborators
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onShowCollaborators && onShowCollaborators(template)}>
                      <Users className="w-4 h-4 mr-2 text-indigo-600" />
                      Manage Access ({template.collaborators?.length || 0})
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem onClick={handleCopy}>
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy JSON
                    </>
                  )}
                </DropdownMenuItem>
                
                {isMyTemplate && (onQuickRefine || onQuickVariations) && (
                  <>
                    <DropdownMenuSeparator />
                    {onQuickRefine && (
                      <DropdownMenuItem onClick={() => onQuickRefine(template)}>
                        <Wand2 className="w-4 h-4 mr-2 text-green-600" />
                        AI Refine
                      </DropdownMenuItem>
                    )}
                    {onQuickVariations && (
                      <DropdownMenuItem onClick={() => onQuickVariations(template)}>
                        <Sparkles className="w-4 h-4 mr-2 text-blue-600" />
                        Variations
                      </DropdownMenuItem>
                    )}
                  </>
                )}

                {!isMyTemplate && onAddToMyTemplates && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onAddToMyTemplates(template)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add to My Prompts
                    </DropdownMenuItem>
                  </>
                )}

                {((isMyTemplate || isCollaborator) && hasActiveCollaboration && onShowInsights) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onShowInsights(template)}>
                      <TrendingUp className="w-4 h-4 mr-2 text-purple-600" />
                      Team Insights
                    </DropdownMenuItem>
                  </>
                )}

                {isMyTemplate && onEdit && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit(template)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowShareModal(true)}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowMoveDialog(true)}>
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Move to Folder
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitleComp>Delete Prompt</AlertDialogTitleComp>
                          <AlertDialogDesc>
                            Are you sure you want to delete "{template.title}"? This action cannot be undone.
                          </AlertDialogDesc>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(template.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}

                {isCollaborator && !isMyTemplate && onEdit && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit(template)}>
                      <Users className="w-4 h-4 mr-2 text-blue-600" />
                      Collaborate
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showOllamaDialog} onOpenChange={setShowOllamaDialog}>
        <DialogContent className="sm:max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-purple-600" />
              Test Prompt with Ollama
            </DialogTitle>
            <DialogDescription>
              Configure variables, tune parameters, and test with your Ollama endpoints
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="test">
                <Play className="w-4 h-4 mr-2" />
                Test
              </TabsTrigger>
              <TabsTrigger value="config">
                <Settings className="w-4 h-4 mr-2" />
                Parameters
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="w-4 h-4 mr-2" />
                History ({testResults.length})
              </TabsTrigger>
              <TabsTrigger value="compare">
                <GitBranch className="w-4 h-4 mr-2" />
                Compare ({selectedComparison.length})
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="test" className="h-full mt-4">
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {detectedPlaceholders.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm font-semibold text-blue-900">
                            Fill in Placeholders
                          </Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const smartValues = {};
                              detectedPlaceholders.forEach(placeholder => {
                                const key = placeholder.replace(/[{}]/g, '');
                                smartValues[key] = getSmartPlaceholderValue(key);
                              });
                              setPlaceholderValues(smartValues);
                            }}
                            className="text-xs h-7 bg-white"
                          >
                            <Sparkles className="w-3 h-3 mr-1" />
                            Auto-fill Smart Values
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {detectedPlaceholders.map((placeholder, idx) => {
                            const key = placeholder.replace(/[{}]/g, '');
                            return (
                              <div key={idx} className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs text-blue-700">{placeholder}</Label>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setPlaceholderValues(prev => ({
                                      ...prev,
                                      [key]: getSmartPlaceholderValue(key)
                                    }))}
                                    className="h-5 px-1.5 text-xs text-blue-600 hover:text-blue-800"
                                  >
                                    🎲
                                  </Button>
                                </div>
                                <Input
                                  placeholder={`e.g., ${getSmartPlaceholderValue(key)}`}
                                  value={placeholderValues[key] || ''}
                                  onChange={(e) => setPlaceholderValues(prev => ({
                                    ...prev,
                                    [key]: e.target.value
                                  }))}
                                  className="bg-white"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Final Prompt:</Label>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                          {buildFinalPrompt()}
                        </pre>
                      </div>
                    </div>

                    {/* Endpoint Selection with Status */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Endpoint:</Label>
                      <Select 
                        value={selectedEndpoint} 
                        onValueChange={(ep) => {
                          setSelectedEndpoint(ep);
                          fetchAvailableModels(ep);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ollamaEndpoints.map((endpoint, idx) => (
                            <SelectItem key={idx} value={endpoint}>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  endpointStatus[endpoint] === 'online' ? 'bg-green-500' : 
                                  endpointStatus[endpoint] === 'offline' ? 'bg-red-500' : 'bg-gray-300'
                                }`} />
                                <span className="truncate max-w-[300px]">{endpoint}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Model Selection */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Model:</Label>
                      <Select value={modelParams.model} onValueChange={(value) => setModelParams(prev => ({ ...prev, model: value }))}>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableModels.length > 0 ? (
                            availableModels.map((model) => (
                              <SelectItem key={model.name} value={model.name}>
                                {model.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value={modelParams.model || getDefaultModel()}>
                              {modelParams.model || getDefaultModel()}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {loadingModels && (
                        <p className="text-xs text-gray-500 mt-1">Loading models...</p>
                      )}
                    </div>

                    <div className="flex items-end">
                      <Button
                        onClick={() => handleTestWithEndpoint(selectedEndpoint)}
                        disabled={isTestingPrompt}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 w-full"
                      >
                        {isTestingPrompt ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Run Test
                          </>
                        )}
                      </Button>
                    </div>

                    {isTestingPrompt && (
                      <Alert className="bg-blue-50 border-blue-200">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          Testing prompt with {modelParams.model} at {selectedEndpoint}...
                        </AlertDescription>
                      </Alert>
                    )}

                    {ollamaError && (
                      <Alert className="bg-red-50 border-red-200">
                        <AlertDescription className="text-red-800">
                          <strong>Error:</strong> {ollamaError}
                        </AlertDescription>
                      </Alert>
                    )}

                    {ollamaResponse && !isTestingPrompt && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            Response:
                          </Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              await navigator.clipboard.writeText(ollamaResponse);
                            }}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </Button>
                        </div>
                        <Textarea
                          value={ollamaResponse}
                          readOnly
                          className="min-h-[300px] font-mono text-sm bg-white"
                        />
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="config" className="h-full mt-4">
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-6">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <Label className="text-sm font-semibold text-purple-900 mb-2 block">
                        Model Parameters
                      </Label>
                      <p className="text-xs text-purple-700 mb-4">
                        Tune these parameters to control the model's behavior
                      </p>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm">Model</Label>
                          <Select 
                            value={modelParams.model} 
                            onValueChange={(value) => setModelParams(prev => ({ ...prev, model: value }))}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select a model" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableModels.length > 0 ? (
                                availableModels.map((model) => (
                                  <SelectItem key={model.name} value={model.name}>
                                    {model.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value={modelParams.model || 'llama3.2'}>
                                  {modelParams.model || 'llama3.2'}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-gray-500">Model installed in your Ollama</p>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={fetchAvailableModels}
                              disabled={loadingModels}
                              className="h-6 text-xs"
                            >
                              {loadingModels ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Refresh'}
                            </Button>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-2">
                            <Label className="text-sm">Temperature: {modelParams.temperature}</Label>
                          </div>
                          <Slider
                            value={[modelParams.temperature]}
                            onValueChange={([value]) => setModelParams(prev => ({ ...prev, temperature: value }))}
                            min={0}
                            max={2}
                            step={0.1}
                            className="w-full"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Lower = more focused, Higher = more creative
                          </p>
                        </div>

                        <div>
                          <div className="flex justify-between mb-2">
                            <Label className="text-sm">Top P: {modelParams.top_p}</Label>
                          </div>
                          <Slider
                            value={[modelParams.top_p]}
                            onValueChange={([value]) => setModelParams(prev => ({ ...prev, top_p: value }))}
                            min={0}
                            max={1}
                            step={0.05}
                            className="w-full"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Controls diversity via nucleus sampling
                          </p>
                        </div>

                        <div>
                          <div className="flex justify-between mb-2">
                            <Label className="text-sm">Max Tokens: {modelParams.max_tokens}</Label>
                          </div>
                          <Slider
                            value={[modelParams.max_tokens]}
                            onValueChange={([value]) => setModelParams(prev => ({ ...prev, max_tokens: value }))}
                            min={100}
                            max={4000}
                            step={100}
                            className="w-full"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Maximum length of generated response
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="history" className="h-full mt-4">
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-3">
                    {testResults.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No test results yet</p>
                        <p className="text-sm">Run a test to see results here</p>
                      </div>
                    ) : (
                      testResults.map((result) => (
                        <Card key={result.id} className="border-l-4 border-l-purple-400">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    {new Date(result.timestamp).toLocaleString()}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {result.modelParams.model}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-600">{result.endpoint}</p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleComparison(result.id)}
                                  className={selectedComparison.includes(result.id) ? 'bg-purple-50 border-purple-300' : ''}
                                  title={selectedComparison.includes(result.id) ? 'Remove from comparison' : 'Add to comparison'}
                                >
                                  <GitBranch className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteTestResult(result.id)}
                                  className="text-red-600 hover:text-red-700"
                                  title="Delete test result"
                                >
                                  <Trash className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-2 text-xs">
                              <div>
                                <Label className="text-xs text-gray-500">Response Preview:</Label>
                                <p className="text-gray-700 line-clamp-3 mt-1">{result.response}</p>
                              </div>
                              <div className="flex gap-2 text-xs text-gray-500">
                                <span>temp: {result.modelParams.temperature}</span>
                                <span>top_p: {result.modelParams.top_p}</span>
                                <span>tokens: {result.modelParams.max_tokens}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="compare" className="h-full mt-4">
                <ScrollArea className="h-[600px] pr-4">
                  {selectedComparison.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <GitBranch className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No results selected for comparison</p>
                      <p className="text-sm">Select up to 3 results from History to compare</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedComparison.map((resultId) => {
                        const result = testResults.find(r => r.id === resultId);
                        if (!result) return null;
                        return (
                          <Card key={result.id} className="border-2 border-purple-200">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm flex items-center justify-between">
                                <span>{result.modelParams.model}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleComparison(result.id)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </CardTitle>
                              <p className="text-xs text-gray-500">
                                {new Date(result.timestamp).toLocaleString()}
                              </p>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="text-xs space-y-1 bg-gray-50 p-2 rounded">
                                <div>Temp: {result.modelParams.temperature}</div>
                                <div>Top P: {result.modelParams.top_p}</div>
                                <div>Tokens: {result.modelParams.max_tokens}</div>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500">Response:</Label>
                                <div className="mt-1 p-2 bg-white border rounded text-xs max-h-64 overflow-y-auto">
                                  <pre className="whitespace-pre-wrap">{result.response}</pre>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setShowOllamaDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 p-6 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`${categoryColors[template.category] || categoryColors.Personal} text-xs`}>
                    {template.category}
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-white/20 text-white border-white/30">
                    {getVisibilityIcon()}
                    <span className="ml-1">{getVisibilityLabel()}</span>
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-white/20 text-white border-white/30">
                    v{template.version || 1}
                  </Badge>
                </div>
                <h2 className="text-2xl font-bold">{template.title}</h2>
                {template.description && (
                  <p className="text-white/80 mt-2 text-sm">{template.description}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="text-white hover:bg-white/20"
              >
                {copied ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2 px-6 pt-4 bg-transparent">
              <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700">
                <Wand2 className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="comments" className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700">
                <MessageSquare className="w-4 h-4 mr-2" />
                Comments
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="px-6 pb-6 space-y-6">
              {/* Prompt Content Card */}
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gradient-to-r from-gray-100 to-slate-100 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-indigo-600" />
                      Prompt Content
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        await navigator.clipboard.writeText(template.content);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="h-7 text-xs"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed">
                    {template.content}
                  </pre>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 text-center">
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{template.use_count || 0}</p>
                  <p className="text-xs text-blue-700 mt-1 font-medium">Uses</p>
                </div>
                {(template.is_public || template.visibility === 'public') && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 text-center">
                    <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{template.downloads || 0}</p>
                    <p className="text-xs text-green-700 mt-1 font-medium">Downloads</p>
                  </div>
                )}
                {(template.is_public || template.visibility === 'public') && template.rating > 0 && (
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-100 text-center">
                    <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">⭐ {safeToFixed(template.rating, 1)}</p>
                    <p className="text-xs text-amber-700 mt-1 font-medium">Rating</p>
                  </div>
                )}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100 text-center">
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{(template.version_history || []).length}</p>
                  <p className="text-xs text-purple-700 mt-1 font-medium">Versions</p>
                </div>
              </div>

              {/* Tags & Placeholders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {template.tags && template.tags.length > 0 && (
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {template.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {uniquePlaceholders.length > 0 && (
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      Placeholders
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {uniquePlaceholders.map((placeholder, idx) => (
                        <Badge key={idx} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          {placeholder}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Meta Info */}
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                  Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Created by</span>
                    <span className="font-medium text-gray-900">{template.created_by}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Folder</span>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Folder className="w-3 h-3" />
                      {template.folder || 'Uncategorized'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Created</span>
                    <span className="text-gray-700">
                      {new Date(template.created_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  {template.updated_date !== template.created_date && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Last updated</span>
                      <span className="text-gray-700">
                        {new Date(template.updated_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="comments" className="px-6 pb-6">
              <div className="text-sm text-gray-500 py-4">Comments unavailable.</div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move to Folder</DialogTitle>
            <DialogDescription>
              Select a folder for "{template.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-select">Folder</Label>
              <Select value={selectedMoveFolder} onValueChange={setSelectedMoveFolder}>
                <SelectTrigger id="folder-select">
                  <SelectValue placeholder="Select a folder" />
                </SelectTrigger>
                <SelectContent>
                  {validFolders.map((folder) => (
                    <SelectItem key={folder} value={folder}>{folder}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMoveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleMoveTemplate}>
              <FolderOpen className="w-4 h-4 mr-2" />
              Move
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </>
  );
}
