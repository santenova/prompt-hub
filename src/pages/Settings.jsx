import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { apiClient } from "@/apis/client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import AlertConfigurator from "../components/notifications/AlertConfigurator";
import NotificationCenter from "../components/notifications/NotificationCenter";
import FineTuningManager from "../components/ollama/FineTuningManager";
import OllamaSettingsCard from "../components/ollama/OllamaSettingsCard";
import UserAPIKeysManager from "../components/settings/UserAPIKeysManager";
import APIConfigurationManager from "../components/settings/APIConfigurationManager";
import PublishingAPIManager from "../components/settings/PublishingAPIManager";
import APIContentHistoryConfigurator from "../components/settings/APIContentHistoryConfigurator";
import VoiceCloneManager from "../components/voice/VoiceCloneManager";
import SlackIntegrationManager from "../components/settings/SlackIntegrationManager";
import ProjectProfileManager from "../components/settings/ProjectProfileManager";
import {
  Settings as SettingsIcon,
  Sparkles,
  Save,
  RefreshCw,
  Shield,
  User,
  Lock,
  Loader2,
  Bell,
  Volume2,
  TestTube,
  Key,
  Zap,
  Play,
  X,
  Slack,
  Briefcase,
  Info,
  Lightbulb,
  FileText
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const STORAGE_KEY = "prompt_muse_pro_settings";
const DEFAULT_MODEL_KEY = "ollama_default_model";

const proTips = [
  { title: "Save presets", desc: "Create voice presets to quickly switch between different ElevenLabs configurations" },
  { title: "Template defaults", desc: "Set default persona, tone, and format for all template testing" },
  { title: "API keys security", desc: "User API keys are separate from publishing keys for better access control" },
  { title: "Ollama models", desc: "Download multiple models locally for different use cases and compare outputs" },
  { title: "Fine-tuning", desc: "Upload custom datasets to train specialized versions of models" },
  { title: "Alerts & notifications", desc: "Set up custom alerts for rate limits, usage thresholds, and training completion" },
  { title: "Project profiles", desc: "Configure project-specific settings for different brands or clients" },
  { title: "Slack integration", desc: "Connect Slack to receive notifications and share content with your team" },
  { title: "Auto-save enabled", desc: "Changes are saved locally - click Save to sync with your profile" },
  { title: "Browser vs ElevenLabs", desc: "Browser TTS is free but basic, ElevenLabs offers premium AI voices" }
];

const defaultSettings = {
  preferences: {
    defaultPersona: "None",
    autoSavePrompts: true,
    showAISuggestions: true,
  },
  templates: {
    outputFormat: "Bullet points",
    tone: "Neutral",
    contentStyle: "",
    targetAudience: "",
    language: "English (UK)",
    creativity: 0.7,
    length: 400,
    constraints: "If unsure, say 'unknown' — do not fabricate",
    selectedPersona: "None"
  },
  voice: {
    ttsProvider: 'browser',
    browserVoice: '',
    rate: 1.0,
    pitch: 1.0,
    elevenlabsApiKey: '',
    elevenlabsVoiceId: '',
    elevenlabsModel: 'eleven_multilingual_v2',
    elevenlabsStability: 0.5,
    elevenlabsSimilarity: 0.8,
    elevenlabsStyle: 0,
    elevenlabsSpeakerBoost: true,
    customPresets: []
  }
};

// Helper functions for Ollama endpoints
const getOllamaEndpoints = () => {
  try {
    const stored = localStorage.getItem('ollama_endpoints');
    if (stored) {
      const endpoints = JSON.parse(stored);
      return Array.isArray(endpoints) && endpoints.length > 0 ? endpoints : ['/proxy'];
    }
  } catch (error) {
    console.error('Error reading Ollama endpoints:', error);
  }
  return ['/proxy'];
};

const saveOllamaEndpoints = (endpoints) => {
  try {
    localStorage.setItem('ollama_endpoints', JSON.stringify(endpoints));
  } catch (error) {
    console.error('Error saving Ollama endpoints:', error);
  }
};

const getDefaultModel = () => {
  try {
    return localStorage.getItem(DEFAULT_MODEL_KEY) || '';
  } catch (error) {
    console.error('Error reading default model:', error);
    return '';
  }
};

const saveDefaultModel = (model) => {
  try {
    localStorage.setItem(DEFAULT_MODEL_KEY, model);
  } catch (error) {
    console.error('Error saving default model:', error);
  }
};

export default function Settings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ollamaEndpoints, setOllamaEndpoints] = useState([]);
  const [newEndpoint, setNewEndpoint] = useState('');
  const [installedModels, setInstalledModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [defaultModel, setDefaultModel] = useState('');
  const [copiedCommand, setCopiedCommand] = useState('');
  const [activeTab, setActiveTab] = useState('preferences');
  const [availableVoices, setAvailableVoices] = useState([]);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showInfoBanner, setShowInfoBanner] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const { data: personas = [] } = useQuery({
    queryKey: ['personas'],
    queryFn: () => apiClient.entities.Persona.list(),
    initialData: [],
    enabled: !!currentUser,
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['my-subscriptions', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      const allSubs = await apiClient.entities.AgentSubscription.list();
      return allSubs.filter(s => s.subscriber_email === currentUser.email);
    },
    enabled: !!currentUser?.email,
    initialData: [],
  });

  useEffect(() => {
    const checkAuthAndLoadSettings = async () => {
      setIsLoading(true);
      try {
        const isAuth = await apiClient.auth.isAuthenticated();
        if (!isAuth) {
          setIsLoading(false);
          return;
        }

        const user = await apiClient.auth.me();

        if (!user) {
          setIsLoading(false);
          return;
        }

        setCurrentUser(user);

        const saved = localStorage.getItem(STORAGE_KEY);
        let loadedSettings = { ...defaultSettings };
        
        if (saved) {
          try {
            loadedSettings = { ...defaultSettings, ...JSON.parse(saved) };
          } catch (error) {
            console.error("Failed to load settings from local storage", error);
          }
        }

        // Load user preferences
        if (user.default_persona) {
          loadedSettings.preferences.defaultPersona = user.default_persona;
        }
        if (user.auto_save_prompts !== undefined) {
          loadedSettings.preferences.autoSavePrompts = user.auto_save_prompts;
        }
        if (user.show_ai_suggestions !== undefined) {
          loadedSettings.preferences.showAISuggestions = user.show_ai_suggestions;
        }

        // Load template settings
        if (user.template_output_format) {
          loadedSettings.templates.outputFormat = user.template_output_format;
        }
        if (user.template_tone) {
          loadedSettings.templates.tone = user.template_tone;
        }
        if (user.template_content_style) {
          loadedSettings.templates.contentStyle = user.template_content_style;
        }
        if (user.template_target_audience) {
          loadedSettings.templates.targetAudience = user.template_target_audience;
        }
        if (user.template_language) {
          loadedSettings.templates.language = user.template_language;
        }
        if (user.template_creativity !== undefined) {
          loadedSettings.templates.creativity = user.template_creativity;
        }
        if (user.template_length !== undefined) {
          loadedSettings.templates.length = user.template_length;
        }
        if (user.template_constraints) {
          loadedSettings.templates.constraints = user.template_constraints;
        }
        if (user.template_selected_persona) {
          loadedSettings.templates.selectedPersona = user.template_selected_persona;
        }

        setSettings(loadedSettings);

        // Load Ollama endpoints
        const endpoints = getOllamaEndpoints();
        setOllamaEndpoints(endpoints);

        // Load default model
        const savedDefaultModel = getDefaultModel();
        setDefaultModel(savedDefaultModel);

        // Don't auto-fetch models - let user click refresh
      } catch (error) {
        console.error("Error loading user:", error);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
      };
    
    checkAuthAndLoadSettings();
  }, []);

  // Rotate pro tips every 5 seconds
  useEffect(() => {
    if (!showInfoBanner) return;
    const interval = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % proTips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [showInfoBanner]);

  // Load browser TTS voices when available
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    const load = () => setAvailableVoices(synth.getVoices() || []);
    load();
    synth.addEventListener('voiceschanged', load);
    return () => synth.removeEventListener('voiceschanged', load);
  }, []);

  const fetchInstalledModels = async () => {
    if (ollamaEndpoints.length === 0) {
      toast({ title: "No Ollama Endpoint", description: "Please add at least one Ollama endpoint to fetch models.", variant: "destructive", duration: 5000 });
      return;
    }
    setLoadingModels(true);
    try {
      const primaryEndpoint = ollamaEndpoints[0];
      const { data } = await apiClient.functions.invoke('ollamaProxy', { endpoint: primaryEndpoint, action: 'list-models' });
      const models = (data.models || []).map(m => ({ name: m.id }));
      setInstalledModels(models);
      toast({ title: "Models Loaded", description: `Found ${models.length} installed model(s)`, duration: 5000 });
    } catch (error) {
      console.error('Error fetching models:', error);
      toast({ title: "Connection Error", description: `Could not connect to Ollama at ${ollamaEndpoints[0]}.`, variant: "destructive", duration: 5000 });
      setInstalledModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const copyCommand = (command) => {
    navigator.clipboard.writeText(command);
    setCopiedCommand(command);
    setTimeout(() => setCopiedCommand(''), 2000);
    
    toast({
      title: "Copied!",
      description: "Command copied to clipboard",
      duration: 5000,
    });
  };

  const handleSetDefaultModel = (modelName) => {
    setDefaultModel(modelName);
    saveDefaultModel(modelName);
    
    toast({
      title: "Default Model Set",
      description: `${modelName} is now your default model for testing`,
      duration: 5000,
    });
  };

  const updateUserMutation = useMutation({
    mutationFn: (data) => apiClient.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['user']);
    },
    onError: (error) => {
      console.error("Failed to update user preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save user preferences.",
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  const saveSettings = async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    saveOllamaEndpoints(ollamaEndpoints);
    saveDefaultModel(defaultModel);

    if (currentUser) {
      try {
        await updateUserMutation.mutateAsync({
          default_persona: settings.preferences.defaultPersona,
          auto_save_prompts: settings.preferences.autoSavePrompts,
          show_ai_suggestions: settings.preferences.showAISuggestions,
          template_output_format: settings.templates.outputFormat,
          template_tone: settings.templates.tone,
          template_content_style: settings.templates.contentStyle,
          template_target_audience: settings.templates.targetAudience,
          template_language: settings.templates.language,
          template_creativity: settings.templates.creativity,
          template_length: settings.templates.length,
          template_constraints: settings.templates.constraints,
          template_selected_persona: settings.templates.selectedPersona
        });
      } catch (error) {
        return;
      }
    }

    toast({
      title: "Settings Saved",
      description: "Your preferences have been saved successfully.",
      duration: 5000,
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem(STORAGE_KEY);
    setOllamaEndpoints(['/proxy']);
    saveOllamaEndpoints(['/proxy']);
    setDefaultModel('');
    saveDefaultModel('');

    if (currentUser) {
      updateUserMutation.mutate({
        default_persona: "None",
        auto_save_prompts: true,
        show_ai_suggestions: true,
        template_output_format: "Bullet points",
        template_tone: "Neutral",
        template_content_style: "",
        template_target_audience: "",
        template_language: "English (UK)",
        template_creativity: 0.7,
        template_length: 400,
        template_constraints: "If unsure, say 'unknown' — do not fabricate",
        template_selected_persona: "None"
      });
    }

    toast({
      title: "Settings Reset",
      description: "All settings have been reset to defaults.",
      duration: 5000,
    });
  };

  const addOllamaEndpoint = () => {
    if (!newEndpoint.trim()) return;
    
    try {
      new URL(newEndpoint);
    } catch (error) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL (e.g., http://127.0.0.1:11434)",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    if (ollamaEndpoints.includes(newEndpoint.trim())) {
      toast({
        title: "Duplicate Endpoint",
        description: "This endpoint already exists in your list.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    const updated = [...ollamaEndpoints, newEndpoint.trim()];
    setOllamaEndpoints(updated);
    setNewEndpoint('');
    
    toast({
      title: "Endpoint Added",
      description: "New Ollama endpoint has been added. Don't forget to save!",
      duration: 5000,
    });
  };

  const removeOllamaEndpoint = (index) => {
    if (ollamaEndpoints.length === 1) {
      toast({
        title: "Cannot Remove",
        description: "You must have at least one endpoint configured.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    const updated = ollamaEndpoints.filter((_, i) => i !== index);
    setOllamaEndpoints(updated);
    
    toast({
      title: "Endpoint Removed",
      description: "Endpoint has been removed. Don't forget to save!",
      duration: 5000,
    });
  };

  const updateSetting = (path, value) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current = newSettings;

      for (let i = 0; i < keys.length - 1; i++) {
        if (current[keys[i]] === undefined || typeof current[keys[i]] !== 'object') {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  const availablePersonas = [
    "None",
    ...personas.map(p => p.name).sort()
  ];

  const popularModels = [
    { name: 'llama2', description: 'Meta\'s Llama 2 model - General purpose', size: '~3.8GB' },
    { name: 'mistral', description: 'Mistral 7B - Fast and efficient', size: '~4.1GB' },
    { name: 'codellama', description: 'Code generation specialist', size: '~3.8GB' },
    { name: 'phi', description: 'Microsoft Phi-2 - Compact but powerful', size: '~1.7GB' },
    { name: 'neural-chat', description: 'Fine-tuned for conversations', size: '~4.1GB' },
    { name: 'starling-lm', description: 'RLHF trained model', size: '~4.1GB' },
    { name: 'orca-mini', description: 'Small but capable', size: '~1.9GB' },
    { name: 'vicuna', description: 'Fine-tuned LLaMA model', size: '~3.8GB' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-purple-600 mx-auto" />
          <p className="text-sm sm:text-base text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="border-2 border-purple-200 bg-white shadow-xl">
            <CardHeader className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-purple-600" />
              </div>
              <CardTitle className="text-xl sm:text-2xl">Sign In Required</CardTitle>
              <CardDescription className="text-sm sm:text-base mt-2">
                Please sign in to access settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => apiClient.auth.redirectToLogin(window.location.pathname)}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                size="lg"
              >
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Sign In
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Header - Compact */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Settings</h1>
                <p className="text-purple-100 mt-0.5 text-xs sm:text-sm">Customize your experience</p>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInfoBanner(!showInfoBanner)}
                className="text-white/80 hover:text-white hover:bg-white/10"
                title="Show/Hide Info"
              >
                <Info className="w-4 h-4" />
              </Button>
              <Button onClick={resetSettings} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex-1 sm:flex-none" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
              <Button onClick={saveSettings} className="bg-white text-purple-600 hover:bg-purple-50 flex-1 sm:flex-none" size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Info Banner */}
        <AnimatePresence>
          {showInfoBanner && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 rounded-2xl p-1 shadow-xl">
                <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <SettingsIcon className="w-4 h-4 text-purple-600" />
                        Settings Overview
                      </h3>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li>• Customize preferences & defaults</li>
                        <li>• Configure AI models & APIs</li>
                        <li>• Manage profile & security</li>
                        <li>• Set up notifications & alerts</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-600" />
                        Pro Tip
                      </h3>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentTipIndex}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                            <h4 className="font-semibold text-sm text-gray-900 mb-1">{proTips[currentTipIndex].title}</h4>
                            <p className="text-xs text-gray-600">{proTips[currentTipIndex].desc}</p>
                            <div className="flex gap-1 mt-2">
                              {proTips.map((_, idx) => (
                                <div key={idx} className={`h-1 flex-1 rounded ${idx === currentTipIndex ? 'bg-yellow-400' : 'bg-yellow-200'}`} />
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <Key className="w-4 h-4 text-blue-600" />
                        Helpful Links
                      </h3>
                      <div className="space-y-2">
                        <Link to={createPageUrl('OllamaSettings')} className="block text-xs text-blue-600 hover:text-blue-700 hover:underline">
                          → Ollama Configuration
                        </Link>
                        <Link to={createPageUrl('Documentation')} className="block text-xs text-blue-600 hover:text-blue-700 hover:underline">
                          → Full Documentation
                        </Link>
                        <Link to={createPageUrl('Help')} className="block text-xs text-blue-600 hover:text-blue-700 hover:underline">
                          → Help & Support
                        </Link>
                        <a href="https://elevenlabs.io/voice-library" target="_blank" rel="noopener noreferrer" className="block text-xs text-blue-600 hover:text-blue-700 hover:underline">
                          → ElevenLabs Voices ↗
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 sm:grid-cols-12 gap-1">
            <TabsTrigger value="preferences" className="text-xs sm:text-sm">
              <User className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Preferences</span>
              <span className="sm:hidden">Prefs</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="text-xs sm:text-sm">
              <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Projects</span>
              <span className="sm:hidden">Proj</span>
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="text-xs sm:text-sm">
              <Key className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">User API Keys</span>
              <span className="sm:hidden">Keys</span>
            </TabsTrigger>
            <TabsTrigger value="publishing-api" className="text-xs sm:text-sm">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Publishing API</span>
              <span className="sm:hidden">Pub</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="text-xs sm:text-sm">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Templates</span>
              <span className="sm:hidden">Tmpl</span>
            </TabsTrigger>
            <TabsTrigger value="audio" className="text-xs sm:text-sm">
              <Volume2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Audio</span>
              <span className="sm:hidden">Audio</span>
            </TabsTrigger>
            <TabsTrigger value="ollama" className="text-xs sm:text-sm">
              <TestTube className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Ollama</span>
              <span className="sm:hidden">Ollama</span>
            </TabsTrigger>
            <TabsTrigger value="fine-tuning" className="text-xs sm:text-sm">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Fine-Tuning</span>
              <span className="sm:hidden">Train</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="text-xs sm:text-sm">
              <Shield className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Profile</span>
              <span className="sm:hidden">Prof</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs sm:text-sm">
              <Bell className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Alerts</span>
              <span className="sm:hidden">Alert</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs sm:text-sm">
              <Bell className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Notifications</span>
              <span className="sm:hidden">Notif</span>
            </TabsTrigger>
            <TabsTrigger value="api-config" className="text-xs sm:text-sm">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">API Config</span>
              <span className="sm:hidden">API</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs sm:text-sm">
              <Lock className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Security</span>
              <span className="sm:hidden">Sec</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-6">
            <ProjectProfileManager currentUser={currentUser} />
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-600" />
                  User Preferences
                </CardTitle>
                <CardDescription>Configure your default settings and behaviors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultPersona" className="text-base font-semibold">
                      Default AI Persona
                    </Label>
                    <p className="text-sm text-gray-600">
                      Choose a default persona that will be automatically suggested when creating new prompts
                    </p>
                    <Select
                      value={settings.preferences.defaultPersona}
                      onValueChange={(value) => updateSetting('preferences.defaultPersona', value)}
                    >
                      <SelectTrigger id="defaultPersona" className="w-full">
                        <SelectValue placeholder="Select default persona" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {availablePersonas.map((persona) => (
                          <SelectItem key={persona} value={persona}>
                            {persona}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {settings.preferences.defaultPersona !== "None" && (
                      <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="text-sm text-purple-900">
                          <strong>Selected:</strong> {settings.preferences.defaultPersona}
                        </p>
                        <p className="text-xs text-purple-700 mt-1">
                          This persona will be pre-selected when you create new prompts
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <Label className="font-medium">Auto-Save Prompts</Label>
                        <p className="text-xs text-gray-500 mt-1">Automatically save prompts as you type</p>
                      </div>
                      <Switch
                        checked={settings.preferences.autoSavePrompts}
                        onCheckedChange={(val) => updateSetting('preferences.autoSavePrompts', val)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="font-medium">Show AI Suggestions</Label>
                      <p className="text-xs text-gray-500 mt-1">Enable real-time AI suggestions while writing</p>
                    </div>
                    <Switch
                      checked={settings.preferences.showAISuggestions}
                      onCheckedChange={(val) => updateSetting('preferences.showAISuggestions', val)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api-keys" className="space-y-6">
            <UserAPIKeysManager currentUser={currentUser} />
          </TabsContent>

          <TabsContent value="publishing-api" className="space-y-6">
            <PublishingAPIManager currentUser={currentUser} />
            <APIContentHistoryConfigurator currentUser={currentUser} />
            <SlackIntegrationManager currentUser={currentUser} />
          </TabsContent>

          <TabsContent value="api-config" className="space-y-6">
            <APIConfigurationManager currentUserEmail={currentUser?.email} />
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Template Execution Settings
                </CardTitle>
                <CardDescription>Configure default settings that will be prepended to all template executions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="bg-blue-50 border-blue-200">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    These settings are automatically prepended to templates when you test them with Ollama. They are not stored in the template itself.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Selected Persona */}
                  <div className="space-y-2">
                    <Label htmlFor="template-persona" className="text-base font-semibold">
                      Selected Persona
                    </Label>
                    <p className="text-sm text-gray-600">
                      Persona to use when executing templates
                    </p>
                    <Select
                      value={settings.templates.selectedPersona}
                      onValueChange={(value) => updateSetting('templates.selectedPersona', value)}
                    >
                      <SelectTrigger id="template-persona" className="w-full">
                        <SelectValue placeholder="Select persona" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        <SelectItem value="None">None</SelectItem>
                        {availablePersonas.filter(p => p !== "None").map((persona) => (
                          <SelectItem key={persona} value={persona}>
                            {persona}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Output Format */}
                  <div className="space-y-2">
                    <Label htmlFor="output-format" className="text-base font-semibold">
                      Output Format
                    </Label>
                    <p className="text-sm text-gray-600">
                      How the AI should structure its response
                    </p>
                    <Select
                      value={settings.templates.outputFormat}
                      onValueChange={(value) => updateSetting('templates.outputFormat', value)}
                    >
                      <SelectTrigger id="output-format">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Plain Text">Plain Text</SelectItem>
                        <SelectItem value="Markdown">Markdown</SelectItem>
                        <SelectItem value="JSON">JSON</SelectItem>
                        <SelectItem value="HTML">HTML</SelectItem>
                        <SelectItem value="Email">Email</SelectItem>
                        <SelectItem value="CSV">CSV</SelectItem>
                        <SelectItem value="TypeScript with Comments">TypeScript with Comments</SelectItem>
                        <SelectItem value="Python with Comments">Python with Comments</SelectItem>
                        <SelectItem value="Bullet points">Bullet points</SelectItem>
                        <SelectItem value="Structured outline">Structured outline</SelectItem>
                        <SelectItem value="Short essay">Short essay</SelectItem>
                        <SelectItem value="Report with sections">Report with sections</SelectItem>
                        <SelectItem value="Markdown table">Markdown table</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tone */}
                  <div className="space-y-2">
                    <Label htmlFor="tone" className="text-base font-semibold">
                      Tone
                    </Label>
                    <p className="text-sm text-gray-600">
                      Writing style for the response
                    </p>
                    <Select
                      value={settings.templates.tone}
                      onValueChange={(value) => updateSetting('templates.tone', value)}
                    >
                      <SelectTrigger id="tone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Academic (UK)">Academic (UK)</SelectItem>
                        <SelectItem value="Technical">Technical</SelectItem>
                        <SelectItem value="Concise">Concise</SelectItem>
                        <SelectItem value="Persuasive">Persuasive</SelectItem>
                        <SelectItem value="Friendly">Friendly</SelectItem>
                        <SelectItem value="Neutral">Neutral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Content Style */}
                  <div className="space-y-2">
                    <Label htmlFor="content-style" className="text-base font-semibold">
                      Content Style
                    </Label>
                    <p className="text-sm text-gray-600">
                      Content approach or framework
                    </p>
                    <Select
                      value={settings.templates.contentStyle || ""}
                      onValueChange={(value) => updateSetting('templates.contentStyle', value)}
                    >
                      <SelectTrigger id="content-style">
                        <SelectValue placeholder="Select a style" />
                      </SelectTrigger>
                      <SelectContent>
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

                  {/* Target Audience */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="target-audience" className="text-base font-semibold">
                      Target Audience
                    </Label>
                    <p className="text-sm text-gray-600">
                      Primary audience for your content
                    </p>
                    <Select
                      value={settings.templates.targetAudience || ""}
                      onValueChange={(value) => updateSetting('templates.targetAudience', value)}
                    >
                      <SelectTrigger id="target-audience">
                        <SelectValue placeholder="Select target audience" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        <SelectItem value={null}>None</SelectItem>
                        <SelectItem value="Gen Z">Gen Z</SelectItem>
                        <SelectItem value="Professionals">Professionals</SelectItem>
                        <SelectItem value="Parents">Parents</SelectItem>
                        <SelectItem value="Students">Students</SelectItem>
                        <SelectItem value="Small Business Owners">Small Business Owners</SelectItem>
                        <SelectItem value="General Audience">General Audience</SelectItem>
                        <SelectItem value="Tech Enthusiasts">Tech Enthusiasts</SelectItem>
                        <SelectItem value="Entrepreneurs">Entrepreneurs</SelectItem>
                        <SelectItem value="Freelancers">Freelancers</SelectItem>
                        <SelectItem value="Remote Workers">Remote Workers</SelectItem>
                        <SelectItem value="Millennial Parents">Millennial Parents</SelectItem>
                        <SelectItem value="Digital Nomads">Digital Nomads</SelectItem>
                        <SelectItem value="Startup Founders">Startup Founders</SelectItem>
                        <SelectItem value="Corporate Executives">Corporate Executives</SelectItem>
                        <SelectItem value="Investors">Investors</SelectItem>
                        <SelectItem value="Healthcare Professionals">Healthcare Professionals</SelectItem>
                        <SelectItem value="Educators">Educators</SelectItem>
                        <SelectItem value="Retail Customers">Retail Customers</SelectItem>
                        <SelectItem value="B2B Buyers">B2B Buyers</SelectItem>
                        <SelectItem value="Event Planners">Event Planners</SelectItem>
                        <SelectItem value="Travel Enthusiasts">Travel Enthusiasts</SelectItem>
                        <SelectItem value="Foodies and Culinary Lovers">Foodies and Culinary Lovers</SelectItem>
                        <SelectItem value="Fitness Enthusiasts">Fitness Enthusiasts</SelectItem>
                        <SelectItem value="DIY Crafters">DIY Crafters</SelectItem>
                        <SelectItem value="E-commerce Shoppers">E-commerce Shoppers</SelectItem>
                        <SelectItem value="Social Media Influencers">Social Media Influencers</SelectItem>
                        <SelectItem value="Mobile App Users">Mobile App Users</SelectItem>
                        <SelectItem value="Online Gamers">Online Gamers</SelectItem>
                        <SelectItem value="Homeowners">Homeowners</SelectItem>
                        <SelectItem value="Renters">Renters</SelectItem>
                        <SelectItem value="Pet Owners">Pet Owners</SelectItem>
                        <SelectItem value="Environmentally Conscious Consumers">Environmentally Conscious Consumers</SelectItem>
                        <SelectItem value="Luxury Goods Buyers">Luxury Goods Buyers</SelectItem>
                        <SelectItem value="Subscription Box Customers">Subscription Box Customers</SelectItem>
                        <SelectItem value="Health and Wellness Seekers">Health and Wellness Seekers</SelectItem>
                        <SelectItem value="Automotive Enthusiasts">Automotive Enthusiasts</SelectItem>
                        <SelectItem value="Sports Fans">Sports Fans</SelectItem>
                        <SelectItem value="Music Lovers">Music Lovers</SelectItem>
                        <SelectItem value="Moviegoers">Moviegoers</SelectItem>
                        <SelectItem value="Bookworms">Bookworms</SelectItem>
                        <SelectItem value="Hobbyists">Hobbyists</SelectItem>
                        <SelectItem value="Alumni Associations">Alumni Associations</SelectItem>
                        <SelectItem value="Non-Profit Donors">Non-Profit Donors</SelectItem>
                        <SelectItem value="Corporate Clients">Corporate Clients</SelectItem>
                        <SelectItem value="B2B Marketers">B2B Marketers</SelectItem>
                        <SelectItem value="Business Analysts">Business Analysts</SelectItem>
                        <SelectItem value="Sales Representatives">Sales Representatives</SelectItem>
                        <SelectItem value="Customer Service Agents">Customer Service Agents</SelectItem>
                        <SelectItem value="Marketing Professionals">Marketing Professionals</SelectItem>
                        <SelectItem value="Technology Decision Makers">Technology Decision Makers</SelectItem>
                        <SelectItem value="Everybody">Everybody</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Language */}
                  <div className="space-y-2">
                    <Label htmlFor="language" className="text-base font-semibold">
                      Language
                    </Label>
                    <p className="text-sm text-gray-600">
                      Output language preference
                    </p>
                    <Select
                      value={settings.templates.language}
                      onValueChange={(value) => updateSetting('templates.language', value)}
                    >
                      <SelectTrigger id="language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English (UK)">English (UK)</SelectItem>
                        <SelectItem value="English (US)">English (US)</SelectItem>
                        <SelectItem value="Romanian">Romanian</SelectItem>
                        <SelectItem value="French">French</SelectItem>
                        <SelectItem value="Spanish">Spanish</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Creativity */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="creativity" className="text-base font-semibold">
                        Creativity (Temperature)
                      </Label>
                      <Badge variant="outline">{settings.templates.creativity}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      0 = focused, 2 = creative (default: 0.7)
                    </p>
                    <Slider
                      id="creativity"
                      value={[settings.templates.creativity]}
                      onValueChange={([value]) => updateSetting('templates.creativity', value)}
                      min={0}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  {/* Length */}
                  <div className="space-y-2">
                    <Label htmlFor="length" className="text-base font-semibold">
                      Length (words)
                    </Label>
                    <p className="text-sm text-gray-600">
                      Target output length in words
                    </p>
                    <Input
                      id="length"
                      type="number"
                      min={50}
                      step={50}
                      value={settings.templates.length}
                      onChange={(e) => updateSetting('templates.length', parseInt(e.target.value) || 400)}
                    />
                  </div>

                  {/* Constraints */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="constraints" className="text-base font-semibold">
                      Constraints
                    </Label>
                    <p className="text-sm text-gray-600">
                      Special instructions or limitations
                    </p>
                    <Select
                      value={settings.templates.constraints}
                      onValueChange={(value) => updateSetting('templates.constraints', value)}
                    >
                      <SelectTrigger id="constraints">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Use real sources (Harvard) from Google Scholar">Harvard cites - Use real sources from Google Scholar</SelectItem>
                        <SelectItem value="If unsure, say 'unknown' — do not fabricate">No hallucinations - Say unknown if unsure</SelectItem>
                        <SelectItem value="State assumptions explicitly">Assumptions - State all assumptions explicitly</SelectItem>
                        <SelectItem value="Be concise; remove filler">Concise - Remove all filler words</SelectItem>
                        <SelectItem value="Return only the final answer">Final-only - Return only the final answer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Alert className="bg-purple-50 border-purple-200">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <AlertDescription className="text-purple-800">
                      <strong>How it works:</strong> When you test a template with Ollama, these settings are automatically prepended to create a complete prompt:
                      <div className="mt-2 text-xs font-mono bg-white p-2 rounded border">
                        {settings.templates.selectedPersona !== "None" && `[Persona: ${settings.templates.selectedPersona}] `}
                        [Format: {settings.templates.outputFormat}]
                        [Tone: {settings.templates.tone}]
                        [Language: {settings.templates.language}]
                        [Length: ~{settings.templates.length} words]
                        [Constraint: {settings.templates.constraints}]
                        + [Your Template Content]
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audio" className="space-y-6">
            <VoiceCloneManager 
              apiKey={settings.voice.elevenlabsApiKey}
              onVoiceCreated={(voiceId) => {
                updateSetting('voice.elevenlabsVoiceId', voiceId);
                toast({ title: "Voice Applied", description: "New voice set as default" });
              }}
            />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-purple-600" />
                  Audio & Voice Settings
                </CardTitle>
                <CardDescription>Choose your text-to-speech provider and voice preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Provider */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">TTS Provider</Label>
                  <p className="text-sm text-gray-600">Use your browser's built-in voice or ElevenLabs</p>
                  <Select
                    value={settings.voice.ttsProvider}
                    onValueChange={(v) => updateSetting('voice.ttsProvider', v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="browser">Browser (Web Speech)</SelectItem>
                      <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Browser settings */}
                {settings.voice.ttsProvider === 'browser' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Voice</Label>
                      <Select
                        value={settings.voice.browserVoice}
                        onValueChange={(v) => updateSetting('voice.browserVoice', v)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a voice" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {availableVoices.length === 0 && (
                            <div className="px-3 py-2 text-sm text-gray-500">No voices found</div>
                          )}
                          {availableVoices.map((v) => (
                            <SelectItem key={`${v.name}-${v.lang}`} value={v.name}>
                              {v.name} ({v.lang})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-base font-semibold">Rate</Label>
                        <Badge variant="outline">{settings.voice.rate.toFixed(2)}</Badge>
                      </div>
                      <Slider
                        value={[settings.voice.rate]}
                        onValueChange={([val]) => updateSetting('voice.rate', val)}
                        min={0.5}
                        max={1.5}
                        step={0.05}
                      />
                      <div className="flex justify-between items-center pt-2">
                        <Label className="text-base font-semibold">Pitch</Label>
                        <Badge variant="outline">{settings.voice.pitch.toFixed(2)}</Badge>
                      </div>
                      <Slider
                        value={[settings.voice.pitch]}
                        onValueChange={([val]) => updateSetting('voice.pitch', val)}
                        min={0.5}
                        max={2}
                        step={0.05}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Button
                        onClick={() => {
                          if (!('speechSynthesis' in window)) return;
                          const utter = new SpeechSynthesisUtterance('Hello! This is your selected voice.');
                          utter.rate = settings.voice.rate;
                          utter.pitch = settings.voice.pitch;
                          const voice = availableVoices.find(v => v.name === settings.voice.browserVoice);
                          if (voice) utter.voice = voice;
                          try { window.speechSynthesis.cancel(); } catch {}
                          window.speechSynthesis.speak(utter);
                        }}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 w-full"
                      >
                        <Volume2 className="w-4 h-4 mr-2" />
                        Test Browser Voice
                      </Button>
                    </div>
                  </div>
                )}

                {/* ElevenLabs settings */}
                {settings.voice.ttsProvider === 'elevenlabs' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">API Key</Label>
                      <Input
                        type="password"
                        placeholder="sk-..."
                        value={settings.voice.elevenlabsApiKey}
                        onChange={(e) => updateSetting('voice.elevenlabsApiKey', e.target.value)}
                      />
                      <p className="text-xs text-gray-500">Stored on your user profile. Used for TTS where supported.</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Voice ID</Label>
                      <Input
                        placeholder="e.g., 21m00Tcm4TlvDq8ikWAM"
                        value={settings.voice.elevenlabsVoiceId}
                        onChange={(e) => updateSetting('voice.elevenlabsVoiceId', e.target.value)}
                      />
                      <p className="text-xs text-gray-500">Find voices at elevenlabs.io/voice-library</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Model</Label>
                      <Select
                        value={settings.voice.elevenlabsModel || 'eleven_multilingual_v2'}
                        onValueChange={(v) => updateSetting('voice.elevenlabsModel', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="eleven_monolingual_v1">Monolingual v1 (English only)</SelectItem>
                          <SelectItem value="eleven_multilingual_v1">Multilingual v1</SelectItem>
                          <SelectItem value="eleven_multilingual_v2">Multilingual v2 (Recommended)</SelectItem>
                          <SelectItem value="eleven_turbo_v2">Turbo v2 (Fast, lower latency)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-base font-semibold">Stability</Label>
                        <Badge variant="outline">{settings.voice.elevenlabsStability.toFixed(2)}</Badge>
                      </div>
                      <Slider
                        value={[settings.voice.elevenlabsStability]}
                        onValueChange={([val]) => updateSetting('voice.elevenlabsStability', val)}
                        min={0}
                        max={1}
                        step={0.05}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-base font-semibold">Similarity</Label>
                        <Badge variant="outline">{settings.voice.elevenlabsSimilarity.toFixed(2)}</Badge>
                      </div>
                      <Slider
                        value={[settings.voice.elevenlabsSimilarity]}
                        onValueChange={([val]) => updateSetting('voice.elevenlabsSimilarity', val)}
                        min={0}
                        max={1}
                        step={0.05}
                      />
                      <p className="text-xs text-gray-500">Higher = closer to original voice</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-base font-semibold">Style Exaggeration</Label>
                        <Badge variant="outline">{(settings.voice.elevenlabsStyle || 0).toFixed(2)}</Badge>
                      </div>
                      <Slider
                        value={[settings.voice.elevenlabsStyle || 0]}
                        onValueChange={([val]) => updateSetting('voice.elevenlabsStyle', val)}
                        min={0}
                        max={1}
                        step={0.05}
                      />
                      <p className="text-xs text-gray-500">0 = neutral, 1 = amplified emotion</p>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg md:col-span-2">
                      <div>
                        <Label className="font-medium">Speaker Boost</Label>
                        <p className="text-xs text-gray-500 mt-1">Enhance clarity for certain voices</p>
                      </div>
                      <Switch
                        checked={settings.voice.elevenlabsSpeakerBoost !== undefined ? settings.voice.elevenlabsSpeakerBoost : true}
                        onCheckedChange={(val) => updateSetting('voice.elevenlabsSpeakerBoost', val)}
                      />
                    </div>

                    <div className="md:col-span-2 space-y-3">
                      <Button
                        onClick={async () => {
                          const testText = 'Hello! This is a voice test using your ElevenLabs configuration.';
                          
                          if (!settings.voice.elevenlabsApiKey || !settings.voice.elevenlabsVoiceId) {
                            toast({
                              title: "Missing Configuration",
                              description: "Please provide both API Key and Voice ID to test ElevenLabs voice.",
                              variant: "destructive",
                              duration: 5000,
                            });
                            return;
                          }

                          setIsTestingVoice(true);

                          try {
                            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${settings.voice.elevenlabsVoiceId}`, {
                              method: 'POST',
                              headers: {
                                'Accept': 'audio/mpeg',
                                'Content-Type': 'application/json',
                                'xi-api-key': settings.voice.elevenlabsApiKey
                              },
                              body: JSON.stringify({
                                text: testText,
                                model_id: settings.voice.elevenlabsModel,
                                voice_settings: {
                                  stability: settings.voice.elevenlabsStability,
                                  similarity_boost: settings.voice.elevenlabsSimilarity,
                                  style: settings.voice.elevenlabsStyle,
                                  use_speaker_boost: settings.voice.elevenlabsSpeakerBoost
                                }
                              })
                            });

                            if (!response.ok) {
                              const errorData = await response.json();
                              throw new Error(`API error: ${response.status} - ${errorData.detail}`);
                            }

                            const audioBlob = await response.blob();
                            const audioUrl = URL.createObjectURL(audioBlob);
                            const audio = new Audio(audioUrl);
                            
                            audio.onended = () => {
                              URL.revokeObjectURL(audioUrl);
                              setIsTestingVoice(false);
                            };
                            audio.onerror = () => {
                              URL.revokeObjectURL(audioUrl);
                              setIsTestingVoice(false);
                              toast({
                                title: "Playback Error",
                                description: "Failed to play audio",
                                variant: "destructive",
                                duration: 5000,
                              });
                            };
                            
                            await audio.play();
                            
                            toast({
                              title: "Voice Test Started",
                              description: "Playing ElevenLabs voice sample",
                              duration: 3000,
                            });
                          } catch (error) {
                            console.error('ElevenLabs test error:', error);
                            setIsTestingVoice(false);
                            toast({
                              title: "Test Failed",
                              description: `Could not test ElevenLabs voice. Check your API key and voice ID. Error: ${error.message}`,
                              variant: "destructive",
                              duration: 5000,
                            });
                          }
                        }}
                        disabled={isTestingVoice}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 w-full"
                      >
                        {isTestingVoice ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Volume2 className="w-4 h-4 mr-2" />
                        )}
                        {isTestingVoice ? 'Playing...' : 'Test ElevenLabs Voice'}
                      </Button>

                      {/* Preset Management */}
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-base font-semibold">Voice Presets</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowPresetDialog(true)}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save Preset
                          </Button>
                        </div>
                        {settings.voice.customPresets && settings.voice.customPresets.length > 0 && (
                          <div className="grid grid-cols-2 gap-2">
                            {settings.voice.customPresets.map((preset, idx) => (
                              <div key={idx} className="p-3 bg-gray-50 rounded-lg border flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{preset.name}</p>
                                  <p className="text-xs text-gray-500">{preset.model}</p>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      updateSetting('voice.elevenlabsVoiceId', preset.voiceId);
                                      updateSetting('voice.elevenlabsModel', preset.model);
                                      updateSetting('voice.elevenlabsStability', preset.stability);
                                      updateSetting('voice.elevenlabsSimilarity', preset.similarity);
                                      updateSetting('voice.elevenlabsStyle', preset.style);
                                      updateSetting('voice.elevenlabsSpeakerBoost', preset.speakerBoost);
                                      toast({ title: "Preset Loaded", description: `Applied ${preset.name}` });
                                    }}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Play className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      const updated = settings.voice.customPresets.filter((_, i) => i !== idx);
                                      updateSetting('voice.customPresets', updated);
                                      toast({ title: "Preset Deleted" });
                                    }}
                                    className="h-7 w-7 p-0 text-red-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <Alert className="bg-purple-50 border-purple-200">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                        <AlertDescription className="text-purple-800">
                          Your ElevenLabs settings will be used in voice-enabled features throughout the app.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ollama" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ollama Integration</CardTitle>
                <CardDescription>
                  Configure your local Ollama for enhanced AI capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Manage your Ollama endpoints, models, and advanced parameters from a dedicated settings page.
                  </p>
                  <Link to={createPageUrl('OllamaSettings')}>
                    <Button className="bg-gradient-to-r from-purple-600 to-indigo-600">
                      <SettingsIcon className="w-4 h-4 mr-2" />
                      Open Ollama Settings
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            <OllamaSettingsCard
              ollamaEndpoints={ollamaEndpoints}
              setOllamaEndpoints={setOllamaEndpoints}
              newEndpoint={newEndpoint}
              setNewEndpoint={setNewEndpoint}
              installedModels={installedModels}
              loadingModels={loadingModels}
              defaultModel={defaultModel}
              setDefaultModel={setDefaultModel}
              copiedCommand={copiedCommand}
              setCopiedCommand={setCopiedCommand}
              fetchInstalledModels={fetchInstalledModels}
              formatBytes={formatBytes}
              formatDate={formatDate}
              copyCommand={copyCommand}
              handleSetDefaultModel={handleSetDefaultModel}
              addOllamaEndpoint={addOllamaEndpoint}
              removeOllamaEndpoint={removeOllamaEndpoint}
              popularModels={popularModels}
              toast={toast}
            />
          </TabsContent>

          <TabsContent value="fine-tuning" className="space-y-6">
            <FineTuningManager
              userEmail={currentUser?.email}
              availableModels={installedModels}
            />
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-600" />
                  Customer Profile
                </CardTitle>
                <CardDescription>Edit your profile information and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="profile-name">Full Name *</Label>
                    <Input
                      id="profile-name"
                      value={currentUser?.full_name || ''}
                      onChange={(e) => {
                        setCurrentUser(prev => ({ ...prev, full_name: e.target.value }));
                      }}
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="profile-company">Company</Label>
                    <Input
                      id="profile-company"
                      value={currentUser?.company || ''}
                      onChange={(e) => {
                        setCurrentUser(prev => ({ ...prev, company: e.target.value }));
                      }}
                      placeholder="Your company name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profile-job-title">Job Title</Label>
                    <Input
                      id="profile-job-title"
                      value={currentUser?.job_title || ''}
                      onChange={(e) => {
                        setCurrentUser(prev => ({ ...prev, job_title: e.target.value }));
                      }}
                      placeholder="Your role or position"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profile-location">Location</Label>
                    <Input
                      id="profile-location"
                      value={currentUser?.location || ''}
                      onChange={(e) => {
                        setCurrentUser(prev => ({ ...prev, location: e.target.value }));
                      }}
                      placeholder="City, Country"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="profile-bio">Bio</Label>
                    <Textarea
                      id="profile-bio"
                      value={currentUser?.bio || ''}
                      onChange={(e) => {
                        setCurrentUser(prev => ({ ...prev, bio: e.target.value }));
                      }}
                      placeholder="Tell us about yourself..."
                      rows={4}
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <Button
                    onClick={() => {
                      updateUserMutation.mutate({
                        full_name: currentUser?.full_name,
                        company: currentUser?.company,
                        job_title: currentUser?.job_title,
                        location: currentUser?.location,
                        bio: currentUser?.bio
                      });
                      toast({
                        title: "Profile Updated",
                        description: "Your profile has been saved successfully.",
                        duration: 3000,
                      });
                    }}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  Account Information
                </CardTitle>
                <CardDescription>Read-only account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">Email Address</Label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="font-medium">{currentUser?.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">Account Role</Label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <Badge variant={currentUser?.role === 'admin' ? 'default' : 'secondary'} className="text-sm">
                        {currentUser?.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">Member Since</Label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="font-medium">
                        {currentUser?.created_date 
                          ? new Date(currentUser.created_date).toLocaleDateString() 
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">Account ID</Label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="font-mono text-xs text-gray-600">{currentUser?.id}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-purple-600" />
                  Alert Configuration
                </CardTitle>
                <CardDescription>Set up custom alerts for your subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                <AlertConfigurator
                  userEmail={currentUser?.email}
                  subscriptions={subscriptions}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationCenter userEmail={currentUser?.email} />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-purple-600" />
                  Security & Privacy
                </CardTitle>
                <CardDescription>Manage your account security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Shield className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-green-900">Account Secured</p>
                        <p className="text-sm text-green-700">You are currently logged in and authenticated</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <Button
                      onClick={() => apiClient.auth.logout()}
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Log Out
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Save Preset Dialog */}
        <Dialog open={showPresetDialog} onOpenChange={setShowPresetDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Voice Preset</DialogTitle>
              <DialogDescription>
                Save your current ElevenLabs settings as a preset
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="presetName">Preset Name</Label>
                <Input
                  id="presetName"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="e.g., Professional Narrator"
                />
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Current Settings:</p>
                <ul className="space-y-1 text-xs">
                  <li>Voice ID: {settings.voice.elevenlabsVoiceId || 'Not set'}</li>
                  <li>Model: {settings.voice.elevenlabsModel}</li>
                  <li>Stability: {settings.voice.elevenlabsStability}</li>
                  <li>Similarity: {settings.voice.elevenlabsSimilarity}</li>
                  <li>Style: {settings.voice.elevenlabsStyle}</li>
                  <li>Speaker Boost: {settings.voice.elevenlabsSpeakerBoost ? 'On' : 'Off'}</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowPresetDialog(false);
                setPresetName('');
              }}>
                Cancel
              </Button>
              <Button onClick={() => {
                if (!presetName.trim()) {
                  toast({ title: "Error", description: "Please enter a preset name", variant: "destructive" });
                  return;
                }
                const newPreset = {
                  name: presetName.trim(),
                  voiceId: settings.voice.elevenlabsVoiceId,
                  model: settings.voice.elevenlabsModel,
                  stability: settings.voice.elevenlabsStability,
                  similarity: settings.voice.elevenlabsSimilarity,
                  style: settings.voice.elevenlabsStyle,
                  speakerBoost: settings.voice.elevenlabsSpeakerBoost
                };
                const updated = [...(settings.voice.customPresets || []), newPreset];
                updateSetting('voice.customPresets', updated);
                setShowPresetDialog(false);
                setPresetName('');
                toast({ title: "Preset Saved", description: `Created ${newPreset.name}` });
              }} disabled={!presetName.trim()}>
                Save Preset
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
