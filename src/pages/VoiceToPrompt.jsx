import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Mic, 
  MicOff, 
  Copy, 
  Sparkles, 
  Trash2, 
  Save,
  Settings,
  Pause,
  Play,
  RefreshCw,
  Wand2,
  FileText,
  History,
  Globe,
  Wifi,
  WifiOff,
  Clock,
  MessageSquare,
  Send,
  Bot,
  User,
  Loader2,
  Server,
  Plus,
  X,
  Edit2,
  Menu,
  Volume2,
  Star,
  Folder,
  Zap,
  Package,
  Database,
  Wrench,
  Edit3,
  FolderOpen,
  Bookmark,
  Share2,
  Check,
  ChevronsUpDown,
  ClipboardCopy,
  Users,
  MoreVertical,
  Info,
  Lightbulb
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/apis/client";
import { useToast } from "@/components/ui/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { jsPDF } from "jspdf";
import { Switch } from "@/components/ui/switch";
import TranscriptHistory from "../components/voice/TranscriptHistory";
import ChatSummarizer from "../components/voice/ChatSummarizer";
import TranslationPanel from "../components/voice/TranslationPanel";
import VoiceActionGroup from "../components/voice/VoiceActionGroup";
import VoiceSettings from "../components/voice/VoiceSettings";
import CustomCommandManager from "../components/voice/CustomCommandManager";
import AddPersonaModal from "../components/personas/AddPersonaModal";
import AudioLevelMeter from "../components/voice/AudioLevelMeter";
import OllamaModelManager from "../components/ollama/OllamaModelManager";
import EnhancedVectorRAG from "../components/ollama/EnhancedVectorRAG";
import ToolCallingPanel from "../components/voice/ToolCallingPanel";
import ShareChatModal from "../components/voice/ShareChatModal";

import ToolSuggestions from "../components/voice/ToolSuggestions";

import FolderManagement from "../components/voice/FolderManagement";
import BeamChat from "../components/voice/BeamChat";
import CreativeToolsExecutor from "../components/voice/CreativeToolsExecutor";
import { executeCreativeTool } from "../components/voice/ToolExecutor";
import ToolResultDisplay from "../components/voice/ToolResultDisplay";
import ToolQueueManager from "../components/voice/ToolQueueManager";
import SessionManager from "../components/voice/SessionManager";
import ToolManagement from "../components/voice/ToolManagement";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { getOllamaSettings, saveOllamaSettings } from "../components/utils/ollamaSettings";

const proTips = [
  { title: "Auto-send on pause", desc: "Voice stops auto-send to Ollama after a brief pause" },
  { title: "Edit and resend", desc: "Click edit on any message to modify and regenerate response" },
  { title: "Use beam mode", desc: "Compare responses from multiple models simultaneously" },
  { title: "Leverage personas", desc: "Apply personas to get specialized, role-specific responses" },
  { title: "Template integration", desc: "Load templates with placeholders directly into chat" },
  { title: "Voice commands", desc: "Say commands like 'summarize' or 'new chat' while speaking" },
  { title: "Custom commands", desc: "Create your own voice shortcuts for common workflows" },
  { title: "Vector RAG", desc: "Upload documents for AI to reference during conversations" },
  { title: "Tool calling", desc: "Enable function calling for dynamic web searches and data retrieval" },
  { title: "Multi-language", desc: "Speak in any language - auto-detection switches recognition" }
];

export default function VoiceToPrompt() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [enhancedPrompt, setEnhancedPrompt] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [speechRate, setSpeechRate] = useState(() => {
    try {
      return localStorage.getItem('voice_speech_rate') || 'medium';
    } catch { return 'medium'; }
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    try {
      return localStorage.getItem('voice_selected_language') || 'en-US';
    } catch { return 'en-US'; }
  });
  const [transcriptHistory, setTranscriptHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('voice_transcript_history') || '[]');
    } catch { return []; }
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingEnhancements, setPendingEnhancements] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('voice_pending_enhancements') || '[]');
    } catch { return []; }
  });

  const SUPPORTED_LANGUAGES = [
    { code: "en-US", label: "English (US)", flag: "🇺🇸" },
    { code: "en-GB", label: "English (UK)", flag: "🇬🇧" },
    { code: "en-AU", label: "English (Australia)", flag: "🇦🇺" },
    { code: "en-IN", label: "English (India)", flag: "🇮🇳" },
    { code: "es-ES", label: "Spanish (Spain)", flag: "🇪🇸" },
    { code: "es-MX", label: "Spanish (Mexico)", flag: "🇲🇽" },
    { code: "fr-FR", label: "French (France)", flag: "🇫🇷" },
    { code: "fr-CA", label: "French (Canada)", flag: "🇨🇦" },
    { code: "de-DE", label: "German", flag: "🇩🇪" },
    { code: "it-IT", label: "Italian", flag: "🇮🇹" },
    { code: "pt-BR", label: "Portuguese (Brazil)", flag: "🇧🇷" },
    { code: "pt-PT", label: "Portuguese (Portugal)", flag: "🇵🇹" },
    { code: "zh-CN", label: "Chinese (Mandarin)", flag: "🇨🇳" },
    { code: "ja-JP", label: "Japanese", flag: "🇯🇵" },
    { code: "ko-KR", label: "Korean", flag: "🇰🇷" },
    { code: "hi-IN", label: "Hindi", flag: "🇮🇳" },
    { code: "ar-SA", label: "Arabic", flag: "🇸🇦" },
    { code: "ru-RU", label: "Russian", flag: "🇷🇺" },
    { code: "nl-NL", label: "Dutch", flag: "🇳🇱" },
    { code: "pl-PL", label: "Polish", flag: "🇵🇱" },
  ];
  
  const recognitionRef = useRef(null);
  const gapTimeoutRef = useRef(null);
  const pendingTranscriptRef = useRef('');
  const retryCountRef = useRef(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [interimText, setInterimText] = useState("");
  const [lastCommand, setLastCommand] = useState("");
  const [editingTone, setEditingTone] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [pausedTranscript, setPausedTranscript] = useState("");
  
  // Beam mode state
  const [beamModeEnabled, setBeamModeEnabled] = useState(() => {
    try {
      return localStorage.getItem('voice_beam_mode_enabled') === 'true';
    } catch { return false; }
  });
  const [beamModels, setBeamModels] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('voice_beam_models') || '[]');
    } catch { return []; }
  });
  const [showBeamConfig, setShowBeamConfig] = useState(false);
  const [beamPrompt, setBeamPrompt] = useState("");
  const [showBeamChat, setShowBeamChat] = useState(false);
  const [lastBeamResponses, setLastBeamResponses] = useState([]);

  const [personaModalOpen, setPersonaModalOpen] = useState(false);
  const [personaDraft, setPersonaDraft] = useState(null);

  const GAP_THRESHOLD_MS = 1500; // 1.5 seconds of silence commits the transcript
  const MAX_RETRIES = 15; // Increased for better resilience
  const isListeningRef = useRef(false);
  const restartDelayRef = useRef(100);
  
  // Ollama chat state
  const [ollamaEndpoints, setOllamaEndpoints] = useState([]);
  const [ollamaEndpoint, setOllamaEndpoint] = useState('');
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isSendingToOllama, setIsSendingToOllama] = useState(false);
  const [showOllamaConfig, setShowOllamaConfig] = useState(false);
  const [newEndpoint, setNewEndpoint] = useState('');
  const [isTestingEndpoint, setIsTestingEndpoint] = useState(false);
  
  // Chat sessions
  const [chatSessions, setChatSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameSessionId, setRenameSessionId] = useState(null);
  const [newSessionName, setNewSessionName] = useState('');
  const [sessionFolders, setSessionFolders] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('voice_chat_folders') || '["Uncategorized", "Work", "Personal", "Projects"]');
    } catch { return ["Uncategorized", "Work", "Personal", "Projects"]; }
  });
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [folderSessionId, setFolderSessionId] = useState(null);
  const [newFolder, setNewFolder] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [tagSessionId, setTagSessionId] = useState(null);
  const [newTag, setNewTag] = useState('');
  const [translationSettings, setTranslationSettings] = useState({
    translationEnabled: false,
    targetLanguage: 'en',
    autoTranslate: false,
    showOriginal: true
  });
  const [showSummarizer, setShowSummarizer] = useState(() => {
    try {
      return localStorage.getItem('voice_panel_summarizer') === 'true';
    } catch { return false; }
  });
  const [showVoiceSettings, setShowVoiceSettings] = useState(() => {
    try {
      return localStorage.getItem('voice_panel_settings') === 'true';
    } catch { return false; }
  });
  const [showTranslation, setShowTranslation] = useState(() => {
    try {
      return localStorage.getItem('voice_panel_translation') === 'true';
    } catch { return false; }
  });
  const [showCustomCommands, setShowCustomCommands] = useState(() => {
    try {
      return localStorage.getItem('voice_panel_commands') === 'true';
    } catch { return false; }
  });
  const [customCommands, setCustomCommands] = useState([]);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const [showModelManager, setShowModelManager] = useState(() => {
    try {
      return localStorage.getItem('voice_panel_model_manager') === 'true';
    } catch { return false; }
  });
  const [showVectorRAG, setShowVectorRAG] = useState(() => {
    try {
      return localStorage.getItem('voice_panel_vector_rag') === 'true';
    } catch { return false; }
  });
  const [ragContext, setRagContext] = useState("");
  const [showToolCalling, setShowToolCalling] = useState(() => {
    try {
      return localStorage.getItem('voice_panel_tool_calling') === 'true';
    } catch { return false; }
  });
  const [toolCallingSettings, setToolCallingSettings] = useState({
    toolsEnabled: false,
    enabledTools: [],
    addToLog: null
  });
  const [currentToolCalls, setCurrentToolCalls] = useState([]);
  const [showToolManagement, setShowToolManagement] = useState(() => {
    try {
      return localStorage.getItem('voice_panel_tool_management') === 'true';
    } catch { return false; }
  });
  
  // Persona
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [personas, setPersonas] = useState([]);
  const [personaPopoverOpen, setPersonaPopoverOpen] = useState(false);
  
  // Template
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [templatePopoverOpen, setTemplatePopoverOpen] = useState(false);
  const [showPlaceholderDialog, setShowPlaceholderDialog] = useState(false);
  const [placeholderValues, setPlaceholderValues] = useState({});
  const [placeholderErrors, setPlaceholderErrors] = useState({});
  const [pendingTemplatesForInput, setPendingTemplatesForInput] = useState([]);
  const [placeholderPresets, setPlaceholderPresets] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetType, setNewPresetType] = useState('custom');
  const [newPresetDescription, setNewPresetDescription] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareSessionId, setShareSessionId] = useState(null);
  const [showFolderManager, setShowFolderManager] = useState(false);
  const [enableSuggestions, setEnableSuggestions] = useState(() => {
    try {
      return localStorage.getItem('voice_enable_suggestions') !== 'false';
    } catch { return true; }
  });
  const [showInfoBanner, setShowInfoBanner] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [activeCreativeTool, setActiveCreativeTool] = useState(null);
  const [creativeToolData, setCreativeToolData] = useState(null);
  const [isExecutingTool, setIsExecutingTool] = useState(false);
  
  // Tool Queue
  const [toolQueue, setToolQueue] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('voice_tool_queue')) || [];
    } catch {
      return [];
    }
  });
  const [isExecutingQueue, setIsExecutingQueue] = useState(false);
  const [isQueuePaused, setIsQueuePaused] = useState(false);
  const shouldStopQueueRef = useRef(false);
  const [currentExecutingIndex, setCurrentExecutingIndex] = useState(-1);
  const [queueSuggestions, setQueueSuggestions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('voice_queue_suggestions')) || [];
    } catch {
      return [];
    }
  });
  
  // Audio processing
  const [audioStream, setAudioStream] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  
  const CHAT_SESSIONS_KEY = 'voice_ollama_chat_sessions';
  const CURRENT_SESSION_KEY = 'voice_ollama_current_session';
  const MAX_MESSAGES_PER_SESSION = 100;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await apiClient.auth.me();
        setCurrentUser(user);
      } catch (error) {
        setCurrentUser(null);
      }
    };
    fetchUser();
    loadPlaceholderPresets();
  }, []);

  const loadPlaceholderPresets = async () => {
    try {
      const presets = await apiClient.entities.PlaceholderPreset.list('-last_used', 50);
      setPlaceholderPresets(presets);
      
      // Auto-load saved placeholders for current session
      if (currentSessionId) {
        const saved = localStorage.getItem(`voice_template_placeholders_${currentSessionId}`);
        if (saved) {
          setPlaceholderValues(JSON.parse(saved));
        }
      }
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
        template_ids: pendingTemplatesForInput.map(t => t.id),
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

  const deletePreset = async (preset) => {
    try {
      await apiClient.entities.PlaceholderPreset.delete(preset.id);
      loadPlaceholderPresets();
      if (selectedPreset?.id === preset.id) {
        setSelectedPreset(null);
      }
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

  // Fetch personas and templates
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedPersonas, fetchedTemplates] = await Promise.all([
          apiClient.entities.Persona.list('-use_count'),
          apiClient.entities.Template.list('-use_count')
        ]);
        
        setPersonas(Array.isArray(fetchedPersonas) ? fetchedPersonas : []);
        setTemplates(Array.isArray(fetchedTemplates) ? fetchedTemplates : []);
        
        // Restore saved persona
        const savedPersonaId = localStorage.getItem('voice_selected_persona');
        if (savedPersonaId && fetchedPersonas && Array.isArray(fetchedPersonas)) {
          const savedPersona = fetchedPersonas.find(p => p.id === savedPersonaId);
          if (savedPersona) {
            setSelectedPersona(savedPersona);
          }
        }
        
        // Restore saved templates (multiple)
        const savedTemplateIds = JSON.parse(localStorage.getItem('voice_selected_templates') || '[]');
        if (savedTemplateIds.length > 0 && fetchedTemplates && Array.isArray(fetchedTemplates)) {
          const savedTemplates = fetchedTemplates.filter(t => savedTemplateIds.includes(t.id));
          if (savedTemplates.length > 0) {
            setSelectedTemplates(savedTemplates);
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setPersonas([]);
        setTemplates([]);
      }
    };
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('voice_speech_rate', speechRate);
  }, [speechRate]);

  // Persist panel positions
  useEffect(() => {
    localStorage.setItem('voice_panel_settings', showVoiceSettings);
  }, [showVoiceSettings]);

  useEffect(() => {
    localStorage.setItem('voice_panel_translation', showTranslation);
  }, [showTranslation]);

  useEffect(() => {
    localStorage.setItem('voice_panel_commands', showCustomCommands);
  }, [showCustomCommands]);

  useEffect(() => {
    localStorage.setItem('voice_panel_summarizer', showSummarizer);
  }, [showSummarizer]);

  useEffect(() => {
    localStorage.setItem('voice_panel_model_manager', showModelManager);
  }, [showModelManager]);

  useEffect(() => {
    localStorage.setItem('voice_panel_vector_rag', showVectorRAG);
  }, [showVectorRAG]);

  useEffect(() => {
    localStorage.setItem('voice_panel_tool_calling', showToolCalling);
  }, [showToolCalling]);

  useEffect(() => {
    localStorage.setItem('voice_panel_tool_management', showToolManagement);
  }, [showToolManagement]);

  useEffect(() => {
    localStorage.setItem('voice_enable_suggestions', enableSuggestions);
  }, [enableSuggestions]);

  // Rotate pro tips every 5 seconds
  useEffect(() => {
    if (!showInfoBanner) return;
    const interval = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % proTips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [showInfoBanner]);

  // Persist beam config
  useEffect(() => {
    localStorage.setItem('voice_beam_mode_enabled', beamModeEnabled);
  }, [beamModeEnabled]);

  useEffect(() => {
    localStorage.setItem('voice_beam_models', JSON.stringify(beamModels));
  }, [beamModels]);

  // Persist tool queue
  useEffect(() => {
    localStorage.setItem('voice_tool_queue', JSON.stringify(toolQueue));
  }, [toolQueue]);

  // Persist queue suggestions
  useEffect(() => {
    localStorage.setItem('voice_queue_suggestions', JSON.stringify(queueSuggestions));
  }, [queueSuggestions]);

  // Load chat sessions from database
  const loadChatSessionsFromDB = async () => {
    if (!currentUser) return;
    
    try {
      const sessions = await apiClient.entities.VoiceChat.list('-updated_date');
      const formattedSessions = sessions.map(s => ({
        id: s.id,
        name: s.name,
        messages: s.messages || [],
        model: s.model,
        persona: s.persona_id ? { id: s.persona_id, name: s.persona_name } : null,
        createdAt: s.created_date,
        updatedAt: s.updated_date,
        isFavorite: s.is_favorite,
        is_archived: s.is_archived || false,
        folder: s.folder || 'Uncategorized',
        tags: s.tags || [],
        summary: s.summary || ''
      }));
      
      setChatSessions(formattedSessions);
      
      // Load last active session
      const lastSessionId = localStorage.getItem(CURRENT_SESSION_KEY);
      const sessionToLoad = formattedSessions.find(s => s.id === lastSessionId) || formattedSessions[0];
      
      if (sessionToLoad) {
        setCurrentSessionId(sessionToLoad.id);
        setChatMessages(sessionToLoad.messages);
        if (sessionToLoad.model) setSelectedModel(sessionToLoad.model);
      } else {
        // Create initial session
        const initialSession = await createNewChatSessionDB();
        setChatSessions([initialSession]);
        setCurrentSessionId(initialSession.id);
        localStorage.setItem(CURRENT_SESSION_KEY, initialSession.id);
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    }
  };

  // Load Ollama configuration and chat sessions
  useEffect(() => {
    const settings = getOllamaSettings();
    setOllamaEndpoints(settings.endpoints || []);
    
    if (settings.selectedEndpoint) {
      setOllamaEndpoint(settings.selectedEndpoint);
      loadOllamaModels(settings.selectedEndpoint);
    } else if (settings.endpoints && settings.endpoints.length > 0) {
      const firstEndpoint = typeof settings.endpoints[0] === 'string' ? settings.endpoints[0] : settings.endpoints[0].url;
      setOllamaEndpoint(firstEndpoint);
      loadOllamaModels(firstEndpoint);
    } else {
      // Auto-open config if no endpoints
      setShowOllamaConfig(true);
    }

    // Load saved model preference
    if (settings.selectedModel) {
      setSelectedModel(settings.selectedModel);
    }

    // Load chat sessions from database
    if (currentUser) {
      loadChatSessionsFromDB();
    }

    // Listen for setting changes
    const handleSettingsUpdate = (event) => {
      const settings = event.detail || getOllamaSettings();
      setOllamaEndpoints(settings.endpoints || []);
      if (settings.selectedEndpoint) {
        setOllamaEndpoint(settings.selectedEndpoint);
        if (settings.selectedEndpoint !== ollamaEndpoint) {
          loadOllamaModels(settings.selectedEndpoint);
        }
      }
      if (settings.selectedModel) {
        setSelectedModel(settings.selectedModel);
      }
    };

    window.addEventListener('ollama_settings_updated', handleSettingsUpdate);
    window.addEventListener('storage', (e) => {
      if (e.key === 'ollama_settings_v1') handleSettingsUpdate({ detail: getOllamaSettings() });
    });

    return () => {
      window.removeEventListener('ollama_settings_updated', handleSettingsUpdate);
      window.removeEventListener('storage', handleSettingsUpdate);
    };
  }, [currentUser]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Back Online",
        description: "Processing pending enhancements..."
      });
      processPendingEnhancements();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Offline Mode",
        description: "Voice recognition works offline. Enhancements will process when online.",
        variant: "destructive"
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Process any pending on mount if online
    if (navigator.onLine && pendingEnhancements.length > 0) {
      processPendingEnhancements();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError("Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; 
    recognition.interimResults = true;
    recognition.lang = selectedLanguage;
    recognition.maxAlternatives = 1;

    // Local function to commit pending transcript and send to Ollama
    const commitPendingTranscript = async () => {
      if (pendingTranscriptRef.current.trim()) {
        const textToCommit = pendingTranscriptRef.current.trim();
        pendingTranscriptRef.current = '';
        setInterimText("");

        // Always append to transcript for record keeping
        setTranscript(prev => prev + textToCommit + ' ');

        // Auto-send to Ollama if configured
        if (ollamaEndpoint && selectedModel) {
            setChatInput(textToCommit);
            setTimeout(() => {
              sendToOllama(textToCommit);
            }, 100);
        }
      }
    };

    recognition.onresult = (event) => {
      // Clear any pending gap timeout since we got new speech
      if (gapTimeoutRef.current) {
        clearTimeout(gapTimeoutRef.current);
        gapTimeoutRef.current = null;
      }

      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptText = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptText + ' ';
        } else {
          interimTranscript += transcriptText;
        }
      }

      if (finalTranscript) {
        // handle commands if any; if not handled, append to transcript
        const trimmed = finalTranscript.trim();
        pendingTranscriptRef.current = '';
        setInterimText("");

        // Detect language from speech
        if (trimmed.length > 20) {
          detectLanguage(trimmed);
        }

        // Handle voice command (async)
        handleVoiceCommand(trimmed).then(handled => {
          if (!handled) {
            // If not a command, populate input and auto-submit
            if (ollamaEndpoint && selectedModel) {
                setChatInput(trimmed);
                // Auto-submit after a brief moment to show the input
                setTimeout(() => {
                  sendToOllama(trimmed);
                  setChatInput('');
                }, 100);
            } else {
                setTranscript(prev => prev + trimmed + ' ');
            }
          }
        });
      } else if (interimTranscript) {
        // Store interim and set gap detection timeout
        pendingTranscriptRef.current = interimTranscript;
        setInterimText(interimTranscript);
        
        gapTimeoutRef.current = setTimeout(() => {
          // Gap detected - show pause dialog instead of auto-committing
          if (pendingTranscriptRef.current.trim()) {
            setPausedTranscript(pendingTranscriptRef.current.trim());
            setShowPauseDialog(true);
          }
        }, GAP_THRESHOLD_MS);
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      
      if (event.error === 'not-allowed') {
        setError("Microphone access denied. Please allow microphone access to use voice input.");
        setIsListening(false);
        retryCountRef.current = 0;
        restartDelayRef.current = 100;
      } else if (event.error === 'aborted') {
        // User stopped - do nothing, reset counters
        retryCountRef.current = 0;
        restartDelayRef.current = 100;
      } else if (event.error === 'no-speech') {
        // No speech detected is normal during silence - just restart without counting as error
        // Recognition will auto-restart via onend handler
      } else if (event.error === 'network' || event.error === 'audio-capture') {
        // These errors are recoverable - retry with backoff
        if (isListeningRef.current && retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          // Exponential backoff: 100ms, 200ms, 400ms, etc., capped at 2s
          restartDelayRef.current = Math.min(restartDelayRef.current * 1.5, 2000);
          // Recognition will auto-restart via onend handler
        } else if (retryCountRef.current >= MAX_RETRIES) {
          setError("Voice recognition is having trouble. Please check your internet connection and try again.");
          setIsListening(false);
          retryCountRef.current = 0;
          restartDelayRef.current = 100;
        }
      } else {
        // Unknown error - log but don't stop unless repeated
        console.error('Unknown speech error:', event.error);
        if (isListeningRef.current && retryCountRef.current < 3) {
          retryCountRef.current++;
        } else {
          setError(`Voice recognition error. Please try again.`);
          setIsListening(false);
          retryCountRef.current = 0;
          restartDelayRef.current = 100;
        }
      }
    };

    recognition.onend = () => {
      // Reset counters if user stopped listening
      if (!isListeningRef.current) {
        retryCountRef.current = 0;
        restartDelayRef.current = 100;
        return;
      }
      
      // Auto-restart with current delay
      setTimeout(() => {
        if (isListeningRef.current) {
          try {
            recognition.start();
            // Reset delay on successful start after a brief moment
            setTimeout(() => {
              if (retryCountRef.current === 0) {
                restartDelayRef.current = 100;
              }
            }, 500);
          } catch (e) {
            // Already started or other error - will retry on next onend
            console.warn('Recognition start error:', e);
          }
        }
      }, restartDelayRef.current);
    };

    recognitionRef.current = recognition;

    return () => {
      if (gapTimeoutRef.current) {
        clearTimeout(gapTimeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore stop errors
        }
      }
    };
  }, [selectedLanguage, ollamaEndpoint, selectedModel, chatMessages]); // Add dependencies for commitPendingTranscript

  const setupAudioProcessing = async (stream) => {
    try {
      // Load voice settings
      const noiseReduction = localStorage.getItem('voice_noise_reduction') === 'true';
      const micGain = parseFloat(localStorage.getItem('voice_mic_gain') || '1.0');
      const echoCancel = localStorage.getItem('voice_echo_cancellation') !== 'false';
      const autoGain = localStorage.getItem('voice_auto_gain_control') !== 'false';

      // Create audio context with processing
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);

      // Apply noise reduction filter
      if (noiseReduction) {
        const filter = audioContext.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 100; // Remove low frequency noise
        source.connect(filter);
      }

      // Apply gain control
      const gainNode = audioContext.createGain();
      gainNode.gain.value = micGain;
      (noiseReduction ? source : source).connect(gainNode);

      // Create analyser for level monitoring
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      gainNode.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // Monitor audio levels
      const monitorLevel = () => {
        if (!isListeningRef.current) return;

        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        setAudioLevel(average);

        requestAnimationFrame(monitorLevel);
      };
      monitorLevel();

      audioContextRef.current = audioContext;
      gainNodeRef.current = gainNode;
      setAudioStream(stream);

      return stream;
    } catch (error) {
      console.error('Audio processing setup failed:', error);
      return stream;
    }
  };

  const detectLanguage = async (text) => {
    if (!text || text.length < 20) return; // Need sufficient text

    try {
      const { data: result } = await apiClient.functions.invoke('invokeLLMWithLogging', {
        prompt: `Detect the language of this text and return ONLY the ISO 639-1 language code (e.g., 'en', 'es', 'fr', 'de', 'ja', 'zh', 'ar', 'hi', 'ru'). Text: "${text}"`,
        source_tool: 'voice_chat',
        request_metadata: {}
      });

      const langCode = result.trim().toLowerCase();
      const langMap = {
        'en': 'en-US', 'es': 'es-ES', 'fr': 'fr-FR', 'de': 'de-DE',
        'it': 'it-IT', 'pt': 'pt-BR', 'zh': 'zh-CN', 'ja': 'ja-JP',
        'ko': 'ko-KR', 'hi': 'hi-IN', 'ar': 'ar-SA', 'ru': 'ru-RU',
        'nl': 'nl-NL', 'pl': 'pl-PL'
      };

      const fullLangCode = langMap[langCode];
      if (fullLangCode && fullLangCode !== selectedLanguage) {
        setDetectedLanguage(fullLangCode);
        toast({
          title: "Language Detected",
          description: `Switched to ${SUPPORTED_LANGUAGES.find(l => l.code === fullLangCode)?.label || fullLangCode}`,
        });
        setSelectedLanguage(fullLangCode);
        localStorage.setItem('voice_selected_language', fullLangCode);
      }
    } catch (error) {
      console.error('Language detection failed:', error);
    }
  };

  const toggleListening = async () => {
    if (!isSupported) return;

    setError(null);

    if (isListening) {
      // Commit any pending transcript before stopping
      if (pendingTranscriptRef.current.trim()) {
        const textToCommit = pendingTranscriptRef.current.trim();
        pendingTranscriptRef.current = '';

        // Always append to transcript
        setTranscript(prev => prev + textToCommit + ' ');

        // Auto-send to Ollama if configured
        if (ollamaEndpoint && selectedModel) {
            setChatInput(textToCommit);
            setTimeout(() => {
              sendToOllama(textToCommit);
            }, 100);
        }
      }
      if (gapTimeoutRef.current) {
        clearTimeout(gapTimeoutRef.current);
        gapTimeoutRef.current = null;
      }
      try {
        recognitionRef.current?.stop();
        if (audioStream) {
          audioStream.getTracks().forEach(track => track.stop());
          setAudioStream(null);
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
      } catch (e) {
        // Ignore stop errors
      }
      setInterimText("");
      setIsListening(false);
      setAudioLevel(0);
    } else {
      try {
        // Request microphone permission with audio processing
        const constraints = {
          audio: {
            echoCancellation: localStorage.getItem('voice_echo_cancellation') !== 'false',
            noiseSuppression: localStorage.getItem('voice_noise_reduction') === 'true',
            autoGainControl: localStorage.getItem('voice_auto_gain_control') !== 'false'
          }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        await setupAudioProcessing(stream);

        retryCountRef.current = 0;
        restartDelayRef.current = 100;
        setChatInput(''); // Clear input field when starting to listen
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        if (e.name === 'NotAllowedError') {
          setError("Microphone access denied. Please allow microphone access in your browser settings.");
        } else {
          setError("Failed to start voice recognition. Please try again.");
        }
      }
    }
  };

  // Voice command handlers
  const deleteLastSentence = () => {
    setTranscript(prev => {
      const stripped = prev.trim();
      if (!stripped) return prev;
      const newText = stripped.replace(/[^.!?]*[.!?]\s*$/, '');
      return newText ? newText + ' ' : '';
    });
  };

  const gotoPage = (page) => {
    try { localStorage.setItem('forward_from_voice', JSON.stringify({ text: transcript.trim(), ts: Date.now() })); } catch {}
    navigate(createPageUrl(page) + '?from=voice');
    toast({ title: 'Navigated', description: `Opened ${page}` });
  };

  const parseCommandAction = (commandText) => {
    const cmd = commandText.toLowerCase().trim();
    if (cmd.includes('enhance') || cmd.includes('improve')) return 'enhance';
    if (cmd.includes('save') && cmd.includes('template')) return 'save_template';
    if (cmd.includes('clear')) return 'clear';
    if (cmd.includes('copy')) return 'copy';
    if (cmd.includes('play') || cmd.includes('speak')) return 'play';
    if (cmd.includes('stop')) return 'stop';
    if (cmd.includes('new') && cmd.includes('chat')) return 'new_chat';
    if (cmd.includes('clear') && cmd.includes('chat')) return 'clear_chat';
    if (cmd.includes('history')) return 'show_history';
    if (cmd.includes('summarize')) return 'summarize';
    return null;
  };

  const executeCommandChain = async (actions) => {
    for (const action of actions) {
      switch (action) {
        case 'enhance':
          await handleEnhancePrompt();
          break;
        case 'save_template':
          if (enhancedPrompt.trim()) {
            handleSaveAsTemplate(enhancedPrompt.trim());
          } else if (transcript.trim()) {
            handleSaveAsTemplate(transcript.trim());
          }
          break;
        case 'create_persona':
          if (enhancedPrompt.trim()) {
            openPersonaFromText(enhancedPrompt.trim());
          } else if (transcript.trim()) {
            openPersonaFromText(transcript.trim());
          }
          break;
        case 'clear':
          handleClear();
          break;
        case 'copy':
          if (enhancedPrompt.trim()) await handleCopy(enhancedPrompt);
          else if (transcript.trim()) await handleCopy(transcript);
          break;
        case 'play':
          if (enhancedPrompt.trim()) handleSpeak(enhancedPrompt);
          else handleSpeak(transcript);
          break;
        case 'stop':
          handleStopSpeaking();
          break;
        case 'new_chat':
          startNewOllamaChat();
          break;
        case 'clear_chat':
          clearOllamaChat();
          break;
        case 'show_history':
          setShowChatHistory(true);
          break;
        case 'summarize':
          setShowSummarizer(true);
          break;
        case 'goto_templates':
          gotoPage('Templates');
          break;
        case 'goto_personas':
          gotoPage('PersonasLibrary');
          break;
        case 'goto_tools':
          gotoPage('Tools');
          break;
        default:
          break;
      }
      // Small delay between actions for smoother execution
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  };

  const handleAICommand = async (text) => {
    try {
      const { data: response } = await apiClient.functions.invoke('invokeLLMWithLogging', {
        prompt: `You are a voice command parser. Analyze the following voice command and determine the intent.

Voice command: "${text}"

Current context:
- Chat has ${chatMessages.length} messages
- Last user message: ${chatMessages.filter(m => m.role === 'user').slice(-1)[0]?.content || 'none'}
- Chat session exists: ${currentSessionId ? 'yes' : 'no'}

Identify the command intent and return the action. Possible intents:
1. "summarize_conversation" - User wants a summary of the chat
2. "recall_last_question" - User wants to know their last question
3. "clear_and_new" - User wants to clear chat and start fresh
4. "list_sessions" - User wants to see their chat history
5. "switch_session" - User wants to switch to a different chat
6. "delete_current" - User wants to delete current chat
7. "rename_session" - User wants to rename current chat
8. "not_command" - Not a recognized command

Return only the intent name, nothing else.`,
        source_tool: 'voice_chat',
        request_metadata: {
          chat_messages_count: chatMessages.length
        },
        response_json_schema: {
          type: "object",
          properties: {
            intent: { type: "string" },
            confidence: { type: "number" }
          }
        }
      });

      const { intent, confidence } = response;
      
      if (confidence < 0.6) return false;

      switch (intent) {
        case 'summarize_conversation':
          if (chatMessages.length === 0) {
            toast({ title: 'No conversation', description: 'No messages to summarize' });
            setLastCommand('No conversation');
            return true;
          }
          const { data: summary } = await apiClient.functions.invoke('invokeLLMWithLogging', {
            prompt: `Summarize this conversation concisely in 2-3 sentences:\n\n${chatMessages.map(m => `${m.role}: ${m.content}`).join('\n')}`,
            source_tool: 'voice_chat',
            request_metadata: { action: 'summarize' }
          });
          toast({ title: 'Summary', description: summary, duration: 8000 });
          setLastCommand('Summarized conversation');
          return true;

        case 'recall_last_question':
          const lastQuestion = chatMessages.filter(m => m.role === 'user').slice(-1)[0];
          if (lastQuestion) {
            toast({ title: 'Last Question', description: lastQuestion.content, duration: 6000 });
            setLastCommand('Recalled last question');
          } else {
            toast({ title: 'No questions', description: 'No previous questions found' });
            setLastCommand('No questions');
          }
          return true;

        case 'clear_and_new':
          if (currentSessionId) {
            deleteChatSession(currentSessionId);
            setLastCommand('Cleared and started new chat');
            toast({ title: 'New Chat', description: 'Previous chat cleared' });
          }
          return true;

        case 'list_sessions':
          setShowChatHistory(true);
          setLastCommand('Showing chat history');
          toast({ title: 'Chat History', description: `You have ${chatSessions.length} chat sessions` });
          return true;

        case 'switch_session':
          // For voice commands, we can't easily pick which session, so maybe just open history
          setShowChatHistory(true);
          setLastCommand('Switching sessions (showing history)');
          toast({ title: 'Switch Session', description: 'Please select a session from history' });
          return true;

        case 'delete_current':
          if (currentSessionId && chatMessages.length > 0) {
            deleteChatSession(currentSessionId);
            setLastCommand('Deleted current chat');
          } else {
            toast({ title: 'Nothing to delete', description: 'No active chat session' });
          }
          return true;

        case 'rename_session':
          if (currentSessionId) {
            openRenameDialog(currentSessionId);
            setLastCommand('Opening rename dialog');
          }
          return true;

        case 'not_command':
          return false;

        default:
          return false;
      }
    } catch (error) {
      console.error('AI command error:', error);
      return false;
    }
  };

  const handleVoiceCommand = async (text) => {
    const t = text.trim().toLowerCase();
    
    // Check for Beam-specific commands first
    if (lastBeamResponses.length > 1) {
      // Check for beam comparison commands
      if (t.includes('compare') && (t.includes('beam') || t.includes('response'))) {
        setShowSummarizer(true);
        // Auto-trigger beam comparison
        setTimeout(() => {
          const summarizerEvent = new CustomEvent('beamCompare', { detail: { prompt: text } });
          window.dispatchEvent(summarizerEvent);
        }, 500);
        toast({
          title: "Beam Comparison",
          description: "Opening comparison tool..."
        });
        return true;
      }

      // Check for best response command
      if (t.includes('best') && (t.includes('beam') || t.includes('response'))) {
        setShowSummarizer(true);
        setTimeout(() => {
          const summarizerEvent = new CustomEvent('beamFindBest', { detail: { prompt: text } });
          window.dispatchEvent(summarizerEvent);
        }, 500);
        toast({
          title: "Finding Best Response",
          description: "Analyzing beam results..."
        });
        return true;
      }

      // Check for follow-up questions command
      if (t.includes('follow') || t.includes('what next') || t.includes('suggestions')) {
        setShowSummarizer(true);
        setTimeout(() => {
          const summarizerEvent = new CustomEvent('beamFollowUp');
          window.dispatchEvent(summarizerEvent);
        }, 500);
        toast({
          title: "Generating Follow-ups",
          description: "Creating questions based on beam results..."
        });
        return true;
      }
    }
    
    // Check for wake words first
    const wakeWords = JSON.parse(localStorage.getItem('voice_wake_words') || '["hey assistant", "hello computer", "voice command"]');
    let commandText = t;
    let hasWakeWord = false;
    
    for (const wakeWord of wakeWords) {
      if (t.startsWith(wakeWord)) {
        hasWakeWord = true;
        commandText = t.substring(wakeWord.length).trim();
        setWakeWordDetected(true);
        setTimeout(() => setWakeWordDetected(false), 2000);
        break;
      }
    }
    
    // Check custom commands first
    for (const cmd of customCommands) {
      if (commandText.includes(cmd.trigger.toLowerCase())) {
        await executeCommandChain(cmd.actions);
        setLastCommand(`Executed: ${cmd.trigger}`);
        return true;
      }
    }
    
    // Parse command chaining (e.g., "enhance and save")
    const chainPattern = /(.+?)\s+(?:and|then)\s+(.+)/;
    const chainMatch = commandText.match(chainPattern);
    if (chainMatch) {
      const [, first, second] = chainMatch;
      const firstAction = parseCommandAction(first.trim());
      const secondAction = parseCommandAction(second.trim());
      
      if (firstAction && secondAction) {
        await executeCommandChain([firstAction, secondAction]);
        setLastCommand(`Chained: ${first} → ${second}`);
        return true;
      }
    }
    
    // Accept commands only if short to avoid false positives
    const isShort = commandText.length <= 60;
    const toneMatch = commandText.match(/change tone to (formal|friendly|technical|concise|neutral|casual|enthusiastic|direct|empathetic)/);
    if (isShort && toneMatch) {
      setEditingTone(toneMatch[1]);
      setLastCommand(`Tone set to ${toneMatch[1]}`);
      toast({ title: 'Tone updated', description: toneMatch[1] });
      return true;
    }
    if (!isShort && !hasWakeWord) {
      // Try AI command parsing for longer natural language
      return await handleAICommand(text);
    }
    switch (commandText) {
      case 'save prompt':
      case 'create template':
      case 'save as template':
        if (enhancedPrompt.trim()) {
          handleSaveAsTemplate(enhancedPrompt.trim());
          setLastCommand('Saved enhanced as template');
        } else if (transcript.trim()) {
          handleSaveAsTemplate(transcript.trim());
          setLastCommand('Saved as template');
        }
        return true;
      case 'enhance prompt':
        handleEnhancePrompt();
        setLastCommand('Enhancing...');
        return true;
      case 'clear':
      case 'clear prompt':
        handleClear();
        setLastCommand('Cleared');
        return true;
      case 'delete last sentence':
        deleteLastSentence();
        setLastCommand('Deleted last sentence');
        return true;
      case 'go to tools':
        gotoPage('Tools');
        return true;
      case 'go to templates':
      case 'open templates':
        gotoPage('Templates');
        return true;
      case 'go to personas':
        gotoPage('PersonasLibrary');
        return true;
      case 'go to pipelines':
      case 'go to workspace':
        gotoPage('Workspace');
        return true;
      case 'go home':
        gotoPage('Home');
        return true;
      case 'start listening':
        if (!isListeningRef.current) toggleListening();
        setLastCommand('Started listening');
        return true;
      case 'stop listening':
        if (isListeningRef.current) toggleListening();
        setLastCommand('Stopped listening');
        return true;
      case 'copy':
      case 'copy prompt':
        if (enhancedPrompt.trim()) handleCopy(enhancedPrompt); else if (transcript.trim()) handleCopy(transcript);
        setLastCommand('Copied');
        return true;
      case 'play':
        if (enhancedPrompt.trim()) handleSpeak(enhancedPrompt); else handleSpeak(transcript);
        setLastCommand('Playing');
        return true;
      case 'stop':
      case 'stop playback':
        handleStopSpeaking();
        setLastCommand('Stopped playback');
        return true;
      default:
        // Try AI command parsing as fallback
        return await handleAICommand(text);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!transcript.trim()) return;
    
    // Save to history first
    const historyId = saveToHistory(transcript);
    
    // Check if offline
    if (!navigator.onLine) {
      addToPendingEnhancements(historyId, transcript);
      updateHistoryItem(historyId, { pendingEnhancement: true });
      toast({
        title: "Saved for Later",
        description: "You're offline. Enhancement will process automatically when you're back online.",
      });
      setTranscript("");
      return;
    }
    
    setIsEnhancing(true);
    try {
      const { data: response } = await apiClient.functions.invoke('invokeLLMWithLogging', {
        prompt: `You are a prompt engineering expert. Take this voice-transcribed text and transform it into a well-structured, clear, and effective AI prompt.

      ${editingTone ? `Use a ${editingTone} tone.` : ''}

      Maintain the user's intent but improve:
      - Clarity and specificity
      - Structure and formatting
      - Add helpful context if needed
      - Remove filler words and repetitions

      Voice transcript: "${transcript}"

      Return ONLY the enhanced prompt, nothing else.`,
        source_tool: 'voice_chat',
        request_metadata: {
          tone: editingTone || 'none'
        }
      });
      
      setEnhancedPrompt(response);
      // Update history with enhanced version
      updateHistoryItem(historyId, { enhanced: response });
    } catch (error) {
      // Network error - queue for later
      if (!navigator.onLine || error.message?.includes('network') || error.message?.includes('Network')) {
        addToPendingEnhancements(historyId, transcript);
        updateHistoryItem(historyId, { pendingEnhancement: true });
        toast({
          title: "Saved for Later",
          description: "Connection lost. Enhancement will process when you're back online.",
        });
      } else {
        toast({
          title: "Enhancement Failed",
          description: "Could not enhance the prompt. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleCopy = async (text) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Prompt copied to clipboard"
    });
  };

  const createPersonaMutation = useMutation({
    mutationFn: (data) => apiClient.entities.Persona.create(data),
    onSuccess: () => {
      toast({ title: "Persona Created", description: "Your persona has been saved." });
    },
    onError: () => {
      toast({ title: "Create Failed", description: "Could not create the persona.", variant: "destructive" });
    }
  });

  const saveAsTemplateMutation = useMutation({
    mutationFn: (data) => apiClient.entities.Template.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
      toast({
        title: "Saved!",
        description: "Prompt saved as a new template"
      });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Could not save the prompt. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSaveAsTemplate = (content) => {
    if (!currentUser) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to save templates",
        variant: "destructive"
      });
      return;
    }

    saveAsTemplateMutation.mutate({
      title: content.substring(0, 50) + (content.length > 50 ? "..." : ""),
      content: content,
      category: "Other",
      folder: "Voice Prompts",
      tags: ["voice-generated"]
    });
  };

  const openPersonaFromText = (text) => {
    if (!currentUser) {
      toast({ title: "Sign In Required", description: "Please sign in to create personas", variant: "destructive" });
      return;
    }
    const trimmed = text?.trim();
    if (!trimmed) return;
    setPersonaDraft({
      name: trimmed.length > 40 ? trimmed.slice(0, 40) + "..." : trimmed,
      description: trimmed,
      instructions: trimmed,
      category: "Custom",
      tone: "Professional",
      tags: ["voice-generated"],
    });
    setPersonaModalOpen(true);
  };

  const handleSavePersona = (data) => {
    if (!currentUser) {
      toast({ title: "Sign In Required", description: "Please sign in to create personas", variant: "destructive" });
      return;
    }
    createPersonaMutation.mutate({
      ...data,
      creator_name: currentUser?.full_name || currentUser?.email,
      is_custom: true,
    });
    setPersonaModalOpen(false);
    setPersonaDraft(null);
  };

  const forwardTo = (page, text) => {
    const trimmed = text?.trim();
    if (!trimmed) return;
    try {
      localStorage.setItem('forward_from_voice', JSON.stringify({ text: trimmed, ts: Date.now() }));
    } catch {}
    navigate(createPageUrl(page) + '?from=voice');
    toast({ title: 'Forwarded', description: `Sent to ${page}` });
  };

  const handleClear = () => {
    setTranscript("");
    setEnhancedPrompt("");
    setError(null);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const getSpeechRateValue = () => {
    switch (speechRate) {
      case "slow": return 0.7;
      case "fast": return 1.4;
      default: return 1.0;
    }
  };

  const handleSpeak = (text) => {
    if (!text.trim()) return;
    
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = getSpeechRateValue();
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const saveToHistory = (transcript, enhanced = null) => {
    const newItem = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      transcript,
      enhanced,
      language: SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.label || selectedLanguage
    };
    const updated = [newItem, ...transcriptHistory].slice(0, 50); // Keep last 50
    setTranscriptHistory(updated);
    localStorage.setItem('voice_transcript_history', JSON.stringify(updated));
    return newItem.id;
  };

  const updateHistoryItem = (id, updates) => {
    const updated = transcriptHistory.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    setTranscriptHistory(updated);
    localStorage.setItem('voice_transcript_history', JSON.stringify(updated));
  };

  const deleteHistoryItem = (id) => {
    const updated = transcriptHistory.filter(item => item.id !== id);
    setTranscriptHistory(updated);
    localStorage.setItem('voice_transcript_history', JSON.stringify(updated));
    // Also remove from pending if exists
    const updatedPending = pendingEnhancements.filter(item => item.id !== id);
    setPendingEnhancements(updatedPending);
    localStorage.setItem('voice_pending_enhancements', JSON.stringify(updatedPending));
  };

  const addToPendingEnhancements = (historyId, transcript) => {
    const pending = { id: historyId, transcript, addedAt: new Date().toISOString() };
    const updated = [...pendingEnhancements, pending];
    setPendingEnhancements(updated);
    localStorage.setItem('voice_pending_enhancements', JSON.stringify(updated));
  };

  const removeFromPending = (id) => {
    const updated = pendingEnhancements.filter(item => item.id !== id);
    setPendingEnhancements(updated);
    localStorage.setItem('voice_pending_enhancements', JSON.stringify(updated));
  };

  const processPendingEnhancements = async () => {
    const pending = JSON.parse(localStorage.getItem('voice_pending_enhancements') || '[]');
    if (pending.length === 0) return;

    for (const item of pending) {
      try {
        const { data: response } = await apiClient.functions.invoke('invokeLLMWithLogging', {
          prompt: `You are a prompt engineering expert. Take this voice-transcribed text and transform it into a well-structured, clear, and effective AI prompt. 
          
Maintain the user's intent but improve:
- Clarity and specificity
- Structure and formatting
- Add helpful context if needed
- Remove filler words and repetitions

Voice transcript: "${item.transcript}"

Return ONLY the enhanced prompt, nothing else.`,
          source_tool: 'voice_chat',
          request_metadata: { action: 'pending_enhancement' }
        });
        
        updateHistoryItem(item.id, { enhanced: response, pendingEnhancement: false });
        removeFromPending(item.id);
      } catch (error) {
        console.error('Failed to process pending enhancement:', error);
        // Keep in pending for next attempt
      }
    }

    toast({
      title: "Enhancements Complete",
      description: `Processed ${pending.length} pending transcript(s)`
    });
  };

  const handleReEnhanceFromHistory = async (item) => {
    setIsEnhancing(true);
    try {
      const { data: response } = await apiClient.functions.invoke('invokeLLMWithLogging', {
        prompt: `You are a prompt engineering expert. Take this voice-transcribed text and transform it into a well-structured, clear, and effective AI prompt. 
        
Maintain the user's intent but improve:
- Clarity and specificity
- Structure and formatting
- Add helpful context if needed
- Remove filler words and repetitions

Voice transcript: "${item.transcript}"

Return ONLY the enhanced prompt, nothing else.`,
        source_tool: 'voice_chat',
        request_metadata: { action: 're_enhance' }
      });
      
      updateHistoryItem(item.id, { enhanced: response });
      toast({
        title: "Enhanced!",
        description: "Transcript has been enhanced"
      });
    } catch (error) {
      toast({
        title: "Enhancement Failed",
        description: "Could not enhance the prompt. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const createNewChatSession = () => {
    const now = new Date();
    return {
      id: `session-${Date.now()}`,
      name: `Voice Chat ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
      messages: [],
      model: selectedModel,
      persona: selectedPersona,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      isFavorite: false,
      folder: 'Uncategorized',
      tags: [],
      summary: ''
    };
  };

  const createNewChatSessionDB = async () => {
    const now = new Date();
    const newSession = await apiClient.entities.VoiceChat.create({
      name: `Voice Chat ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
      messages: [],
      model: selectedModel,
      persona_id: selectedPersona?.id,
      persona_name: selectedPersona?.name,
      is_favorite: false,
      is_archived: false,
      folder: 'Uncategorized',
      tags: [],
      summary: ''
    });

    return {
      id: newSession.id,
      name: newSession.name,
      messages: [],
      model: selectedModel,
      persona: selectedPersona,
      createdAt: newSession.created_date,
      updatedAt: newSession.updated_date,
      isFavorite: false,
      is_archived: false,
      folder: 'Uncategorized',
      tags: [],
      summary: ''
    };
  };

  const handlePersonaChange = async (personaId) => {
    const persona = personas.find(p => p.id === personaId);
    setSelectedPersona(persona);
    
    // Save to localStorage
    if (personaId) {
      localStorage.setItem('voice_selected_persona', personaId);
    } else {
      localStorage.removeItem('voice_selected_persona');
    }
    
    toast({
      title: "Persona Updated",
      description: `${persona?.name || 'None'} selected`
    });
  };
  
  const applyPlaceholders = (content, values) => {
    let result = content;
    Object.entries(values).forEach(([key, value]) => {
      // Normalize key to remove any extra braces
      const normalizedKey = key.replace(/^\{+|\}+$/g, '').replace(/\{|\}/g, '');
      // Match both single and double braces for backwards compatibility
      const regex = new RegExp(`\\{\\{?${normalizedKey}\\}?\\}`, 'g');
      result = result.replace(regex, value || '');
    });
    return result;
  };

  const getAllPlaceholders = (templs) => {
    const allPlaceholders = [];
    templs.forEach(template => {
      if (template.placeholders && template.placeholders.length > 0) {
        template.placeholders.forEach(placeholder => {
          // Normalize placeholder.key to remove extra braces
          const normalizedKey = placeholder.key.replace(/^\{+|\}+$/g, '').replace(/\{|\}/g, '');
          if (!allPlaceholders.find(p => p.key === normalizedKey)) {
            allPlaceholders.push({
              ...placeholder,
              key: normalizedKey,
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

  const validateAllPlaceholders = (templs) => {
    const errors = {};
    const allPlaceholders = getAllPlaceholders(templs);
    
    allPlaceholders.forEach(placeholder => {
      const error = validatePlaceholder(placeholder, placeholderValues[placeholder.key]);
      if (error) {
        errors[placeholder.key] = error;
      }
    });
    
    return errors;
  };

  const handleTemplateToggle = async (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    const isSelected = selectedTemplates.some(t => t.id === templateId);
    const newTemplates = isSelected 
      ? selectedTemplates.filter(t => t.id !== templateId)
      : [...selectedTemplates, template];
    
    setSelectedTemplates(newTemplates);
    
    // Save to localStorage
    localStorage.setItem('voice_selected_templates', JSON.stringify(newTemplates.map(t => t.id)));
    
    toast({
      title: isSelected ? "Template Removed" : "Template Added",
      description: template.title
    });
  };
  
  const clearTemplateSelection = () => {
    setSelectedTemplates([]);
    localStorage.removeItem('voice_selected_templates');
  };

  const updateCurrentChatSession = () => {
    setChatSessions(prev => 
      prev.map(session => 
        session.id === currentSessionId
          ? {
              ...session,
              messages: chatMessages.slice(-MAX_MESSAGES_PER_SESSION),
              model: selectedModel,
              updatedAt: new Date().toISOString()
            }
          : session
      )
    );
  };

  const startNewOllamaChat = async () => {
    if (!currentUser) return;
    
    const newSession = await createNewChatSessionDB();
    setChatSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setChatMessages([]);
    localStorage.setItem(CURRENT_SESSION_KEY, newSession.id);
    
    toast({
      title: "New Chat Started",
      description: "Your previous chat has been saved"
    });
  };

  const loadChatSession = (sessionId) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(session.id);
      setChatMessages(session.messages);
      if (session.model) setSelectedModel(session.model);
      localStorage.setItem(CURRENT_SESSION_KEY, session.id);
      setShowChatHistory(false);
    }
  };

  const deleteChatSession = async (sessionId) => {
    try {
      await apiClient.entities.VoiceChat.delete(sessionId);
      
      const updated = chatSessions.filter(s => s.id !== sessionId);
      setChatSessions(updated);
      
      if (currentSessionId === sessionId) {
        if (updated.length > 0) {
          loadChatSession(updated[0].id);
        } else {
          const newSession = await createNewChatSessionDB();
          setChatSessions([newSession]);
          setCurrentSessionId(newSession.id);
          setChatMessages([]);
        }
      }
      
      toast({
        title: "Chat Deleted",
        description: "Chat session has been removed"
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const renameChatSession = async () => {
    if (!newSessionName.trim()) return;
    
    try {
      await apiClient.entities.VoiceChat.update(renameSessionId, {
        name: newSessionName.trim()
      });
      
      setChatSessions(prev =>
        prev.map(session =>
          session.id === renameSessionId
            ? { ...session, name: newSessionName.trim() }
            : session
        )
      );
      
      setShowRenameDialog(false);
      setRenameSessionId(null);
      setNewSessionName('');
      
      toast({
        title: "Chat Renamed",
        description: "Chat name has been updated"
      });
    } catch (error) {
      toast({
        title: "Rename Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleFavoriteSession = async (sessionId) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (!session) return;

    try {
      await apiClient.entities.VoiceChat.update(sessionId, {
        is_favorite: !session.isFavorite
      });

      setChatSessions(prev =>
        prev.map(s =>
          s.id === sessionId
            ? { ...s, isFavorite: !s.isFavorite }
            : s
        )
      );
      
      toast({
        title: session.isFavorite ? "Unfavorited" : "Favorited",
        description: session.isFavorite ? "Removed from favorites" : "Added to favorites"
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const moveSessionToFolder = async (sessionId, folder) => {
    try {
      await apiClient.entities.VoiceChat.update(sessionId, {
        folder
      });

      setChatSessions(prev =>
        prev.map(session =>
          session.id === sessionId
            ? { ...session, folder }
            : session
        )
      );
      
      setShowFolderDialog(false);
      setFolderSessionId(null);
      
      toast({
        title: "Moved",
        description: `Session moved to ${folder}`
      });
    } catch (error) {
      toast({
        title: "Move Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const openFolderDialog = (sessionId) => {
    setFolderSessionId(sessionId);
    setShowFolderDialog(true);
  };

  const addNewFolder = () => {
    if (!newFolder.trim() || sessionFolders.includes(newFolder.trim())) return;
    
    const updated = [...sessionFolders, newFolder.trim()];
    setSessionFolders(updated);
    localStorage.setItem('voice_chat_folders', JSON.stringify(updated));
    setNewFolder('');
    
    toast({
      title: "Folder Created",
      description: "New folder added"
    });
  };

  const openTagDialog = (sessionId) => {
    setTagSessionId(sessionId);
    setShowTagDialog(true);
  };

  const addTagToSession = async (sessionId, tag) => {
    if (!tag.trim()) return;
    
    const session = chatSessions.find(s => s.id === sessionId);
    if (!session) return;

    const updatedTags = [...new Set([...(session.tags || []), tag.trim()])];

    try {
      await apiClient.entities.VoiceChat.update(sessionId, {
        tags: updatedTags
      });

      setChatSessions(prev =>
        prev.map(s =>
          s.id === sessionId
            ? { ...s, tags: updatedTags }
            : s
        )
      );
      
      toast({
        title: "Tag Added",
        description: `Tagged with "${tag}"`
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const removeTagFromSession = async (sessionId, tagToRemove) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (!session) return;

    const updatedTags = (session.tags || []).filter(t => t !== tagToRemove);

    try {
      await apiClient.entities.VoiceChat.update(sessionId, {
        tags: updatedTags
      });

      setChatSessions(prev =>
        prev.map(s =>
          s.id === sessionId
            ? { ...s, tags: updatedTags }
            : s
        )
      );
    } catch (error) {
      console.error('Failed to remove tag:', error);
    }
  };

  const exportSession = async (session, format) => {
    try {
      if (format === 'text') {
        const content = `${session.name}\n${'='.repeat(50)}\n\nCreated: ${new Date(session.createdAt).toLocaleString()}\nModel: ${session.model || 'N/A'}\nMessages: ${session.messages.length}\n${session.tags?.length ? `Tags: ${session.tags.join(', ')}\n` : ''}\n\n${'='.repeat(50)}\n\n${session.messages.map(m => `${m.role.toUpperCase()}: ${m.content}\n\n`).join('')}`;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${session.name.replace(/\s+/g, '-')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'json') {
        const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${session.name.replace(/\s+/g, '-')}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'pdf') {
        // Generate PDF content
        const content = `${session.name}\n\nCreated: ${new Date(session.createdAt).toLocaleString()}\nModel: ${session.model || 'N/A'}\nMessages: ${session.messages.length}\n${session.tags?.length ? `Tags: ${session.tags.join(', ')}\n` : ''}\n\n${session.messages.map(m => `${m.role.toUpperCase()}: ${m.content}\n\n`).join('')}`;
        
        toast({
          title: "PDF Export",
          description: "Exporting as text format (PDF generation requires additional setup)"
        });
        
        // Fallback to text for now
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${session.name.replace(/\s+/g, '-')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      }
      
      toast({
        title: "Exported",
        description: `Session exported as ${format.toUpperCase()}`
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not export session",
        variant: "destructive"
      });
    }
  };

  const searchSessions = (sessions) => {
    if (!searchQuery.trim()) return sessions;
    
    const query = searchQuery.toLowerCase();
    return sessions.filter(session => {
      const nameMatch = session.name.toLowerCase().includes(query);
      const contentMatch = session.messages.some(m => m.content.toLowerCase().includes(query));
      const tagMatch = session.tags?.some(t => t.toLowerCase().includes(query));
      const summaryMatch = session.summary?.toLowerCase().includes(query);
      
      return nameMatch || contentMatch || tagMatch || summaryMatch;
    });
  };

  const openRenameDialog = (sessionId) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setRenameSessionId(sessionId);
      setNewSessionName(session.name);
      setShowRenameDialog(true);
    }
  };

  const archiveChatSession = async (sessionId) => {
    try {
      await apiClient.entities.VoiceChat.update(sessionId, {
        is_archived: true
      });
      
      setChatSessions(prev =>
        prev.map(session =>
          session.id === sessionId
            ? { ...session, is_archived: true }
            : session
        )
      );
      
      toast({
        title: "Chat Archived",
        description: "Session archived and hidden from view"
      });
    } catch (error) {
      toast({
        title: "Archive Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const unarchiveChatSession = async (sessionId) => {
    try {
      await apiClient.entities.VoiceChat.update(sessionId, {
        is_archived: false
      });
      
      setChatSessions(prev =>
        prev.map(session =>
          session.id === sessionId
            ? { ...session, is_archived: false }
            : session
        )
      );
      
      toast({
        title: "Chat Restored",
        description: "Session restored and now visible"
      });
    } catch (error) {
      toast({
        title: "Restore Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const loadOllamaModels = async (endpointUrl) => {
    try {
      const { data } = await apiClient.functions.invoke('ollamaProxy', { endpoint: endpointUrl, action: 'list-models' });
      const models = (data.models || []).map(m => ({ name: m.id }));
      setAvailableModels(models);
      const savedModel = localStorage.getItem('voice_selected_model');
      if (savedModel && models.find(m => m.name === savedModel)) {
        setSelectedModel(savedModel);
      } else if (models.length > 0) {
        setSelectedModel(models[0].name);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
      toast({ title: "Failed to load models", description: "Check Ollama endpoint and ensure models are downloaded.", variant: "destructive" });
    }
  };

  const testEndpoint = async (url) => {
    setIsTestingEndpoint(true);
    try {
      const { data } = await apiClient.functions.invoke('ollamaProxy', { endpoint: url, action: 'test-connection' });
      if (data.success) {
        toast({ title: "Connection Successful", description: "Connected to Ollama" });
        return true;
      }
      throw new Error('Failed to connect');
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
      const settings = getOllamaSettings();
      const updated = [...(settings.endpoints || []), url];
      
      const newSettings = {
        ...settings,
        endpoints: updated,
        selectedEndpoint: settings.selectedEndpoint || url
      };
      saveOllamaSettings(newSettings);
      
      setOllamaEndpoints(updated);
      
      if (!ollamaEndpoint) {
        setOllamaEndpoint(url);
        await loadOllamaModels(url);
      }
      
      setNewEndpoint('');
    }
  };

  const removeEndpoint = (urlToRemove) => {
    const settings = getOllamaSettings();
    const updated = (settings.endpoints || []).filter(e => e !== urlToRemove);
    
    let newSelectedEndpoint = settings.selectedEndpoint;
    if (newSelectedEndpoint === urlToRemove) {
      newSelectedEndpoint = updated.length > 0 ? updated[0] : '';
    }

    const newSettings = {
      ...settings,
      endpoints: updated,
      selectedEndpoint: newSelectedEndpoint
    };
    saveOllamaSettings(newSettings);

    setOllamaEndpoints(updated);
    
    if (ollamaEndpoint === urlToRemove && updated.length > 0) {
      setOllamaEndpoint(updated[0]);
      loadOllamaModels(updated[0]);
    } else if (updated.length === 0) {
      setOllamaEndpoint('');
      setAvailableModels([]);
    }
  };

  const switchEndpoint = (url) => {
    const settings = getOllamaSettings();
    saveOllamaSettings({ ...settings, selectedEndpoint: url });
    setOllamaEndpoint(url);
    loadOllamaModels(url);
  };

  const translateText = async (text, targetLang) => {
    try {
      const { data: result } = await apiClient.functions.invoke('invokeLLMWithLogging', {
        prompt: `Translate the following text to ${targetLang}. Return ONLY the translation, no explanations:\n\n${text}`,
        source_tool: 'voice_chat',
        request_metadata: { action: 'translate', target_language: targetLang }
      });
      return result;
    } catch (error) {
      const errorMsg = error?.message || error?.toString() || 'Translation failed';
      console.error('Translation error:', errorMsg, error);
      return text; // Return original text without showing error
    }
  };

  const abortControllerRef = useRef(null);

  const stopOllamaRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsSendingToOllama(false);
      toast({
        title: "Request Stopped",
        description: "AI response cancelled"
      });
    }
  };

  const sendToOllama = async (text) => {
    if (!text.trim() || !ollamaEndpoint || !selectedModel) {
        toast({
            title: "Ollama not ready",
            description: "Please configure Ollama endpoint and select a model.",
            variant: "warning"
        });
        return;
    }

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();
    
    // Check if tool calling is enabled
    const useToolCalling = toolCallingSettings.toolsEnabled && toolCallingSettings.enabledTools?.length > 0;
    
    // Translate user input if auto-translate is enabled
    let inputText = text.trim();
    if (translationSettings.translationEnabled && translationSettings.autoTranslate && translationSettings.targetLanguage !== 'en') {
      try {
        const translated = await translateText(inputText, translationSettings.targetLanguage);
        inputText = translated;
      } catch (error) {
        console.error('Auto-translate failed:', error);
      }
    }
    
    // Create new chat session on first voice message if current session is empty
    let currentSess = chatSessions.find(s => s.id === currentSessionId);
    if (!currentSess || currentSess.messages.length === 0) {
        const newSession = await createNewChatSessionDB();
        setChatSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);
        localStorage.setItem(CURRENT_SESSION_KEY, newSession.id);
        currentSess = newSession;
    }
    
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputText,
      originalContent: translationSettings.autoTranslate ? text.trim() : null,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setIsSendingToOllama(true);

    const assistantMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      model: selectedModel
    };

    setChatMessages(prev => [...prev, assistantMessage]);

    try {
      // If tool calling is enabled, use the backend function
      if (useToolCalling) {
        const messagesToSend = [];
        
        if (selectedPersona && chatMessages.length === 0) {
          let systemPrompt = `You are ${selectedPersona.name}. ${selectedPersona.description}${selectedPersona.instructions ? '\n\n' + selectedPersona.instructions : ''}`;
          if (selectedPersona.voice_profile?.personality_summary) {
            systemPrompt += `\n\nPersonality: ${selectedPersona.voice_profile.personality_summary}`;
          }
          messagesToSend.push({ role: 'system', content: systemPrompt });
        }

        if (selectedTemplates.length > 0) {
          const templatesContext = `Templates to follow:\n\n${selectedTemplates.map(t => `Template: ${t.title}\nCategory: ${t.category}\nContent: ${t.content}`).join('\n\n---\n\n')}`;
          messagesToSend.push({ role: 'system', content: templatesContext });
        }

        if (ragContext) {
          messagesToSend.push({
            role: 'system',
            content: `Relevant context from knowledge base:\n\n${ragContext}`
          });
        }
        
        messagesToSend.push(
          ...chatMessages
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: userMessage.content }
        );

        const { data } = await apiClient.functions.invoke('ollamaToolCaller', {
          messages: messagesToSend,
          model: selectedModel,
          endpoint: ollamaEndpoint,
          enabledTools: toolCallingSettings.enabledTools
        });

        const fullContent = data.response || '';
        const toolCalls = data.tool_outputs || [];

        // Update current tool calls for display
        if (toolCalls.length > 0) {
          setCurrentToolCalls(toolCalls);
          
          // Show toast notification
          toast({
            title: "Tools Executed",
            description: `${toolCalls.length} tool(s) called successfully`
          });
        }

        setChatMessages(prev => 
          prev.map(m => 
            m.id === assistantMessage.id 
              ? { ...m, content: fullContent, toolCalls: toolCalls }
              : m
          )
        );

        // Log tool calls
        if (toolCalls.length > 0 && toolCallingSettings.addToLog) {
          toolCalls.forEach(output => {
            toolCallingSettings.addToLog({
              tool: output.toolName,
              args: output.args,
              result: output.output,
              timestamp: new Date().toLocaleTimeString()
            });
          });
        }

        if (translationSettings.translationEnabled && translationSettings.targetLanguage !== 'en') {
          try {
            const translated = await translateText(fullContent, translationSettings.targetLanguage);
            setChatMessages(prev => 
              prev.map(m => 
                m.id === assistantMessage.id 
                  ? { ...m, translatedContent: translated }
                  : m
              )
            );
          } catch (error) {
            console.error('Response translation failed:', error);
          }
        }

        setIsSendingToOllama(false);
        return;
      }

      // Build messages array with persona system prompt if available
      const messagesToSend = [];
      
      if (selectedPersona && chatMessages.length === 0) {
        // Add persona instructions as system message for first message
        let systemPrompt = `You are ${selectedPersona.name}. ${selectedPersona.description}${selectedPersona.instructions ? '\n\n' + selectedPersona.instructions : ''}`;

        // Add voice profile if available
        if (selectedPersona.voice_profile) {
          const vp = selectedPersona.voice_profile;
          if (vp.personality_summary) {
            systemPrompt += `\n\nPersonality: ${vp.personality_summary}`;
          }
          if (vp.style_traits?.length > 0) {
            systemPrompt += `\n\nStyle: ${vp.style_traits.join(', ')}`;
          }
          if (vp.vocabulary?.length > 0) {
            systemPrompt += `\n\nPreferred vocabulary: ${vp.vocabulary.join(', ')}`;
          }
          if (vp.dos?.length > 0) {
            systemPrompt += `\n\nDo: ${vp.dos.join('; ')}`;
          }
          if (vp.donts?.length > 0) {
            systemPrompt += `\n\nAvoid: ${vp.donts.join('; ')}`;
          }
        }

        messagesToSend.push({ role: 'system', content: systemPrompt });
      }

      if (selectedTemplates.length > 0) {
        const templatesContext = `Templates to follow:\n\n${selectedTemplates.map(t => `Template: ${t.title}\nCategory: ${t.category}\nContent: ${t.content}`).join('\n\n---\n\n')}`;
        messagesToSend.push({ role: 'system', content: templatesContext });
      }

      // Add RAG context if available
      if (ragContext) {
        messagesToSend.push({
          role: 'system',
          content: `Relevant context from knowledge base:\n\n${ragContext}`
        });
      }
      
      // Filter out tool messages to prevent loops - only send user/assistant messages
      messagesToSend.push(
        ...chatMessages
          .filter(m => m.role === 'user' || m.role === 'assistant')
          .map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage.content }
      );

      // Final validation: ensure no tool messages slip through
      const cleanMessages = messagesToSend.filter(m => m.role !== 'tool');
      
      const response = await fetch(`${ollamaEndpoint}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ollama',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: cleanMessages,
          stream: true
        }),
        signal: abortControllerRef.current?.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.startsWith('data: ') && line !== 'data: [DONE]');

        for (const line of lines) {
          try {
            const json = JSON.parse(line.slice(6));
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              setChatMessages(prev => 
                prev.map(m => 
                  m.id === assistantMessage.id 
                    ? { ...m, content: fullContent }
                    : m
                )
              );
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }

      if (!fullContent) {
        throw new Error('No response from model');
      }

      // Translate response if enabled
      if (translationSettings.translationEnabled && translationSettings.targetLanguage !== 'en') {
        try {
          const translated = await translateText(fullContent, translationSettings.targetLanguage);
          setChatMessages(prev => 
            prev.map(m => 
              m.id === assistantMessage.id 
                ? { ...m, translatedContent: translated }
                : m
            )
          );
        } catch (error) {
          console.error('Response translation failed:', error);
        }
      }

      } catch (error) {
      console.error('Chat error:', error);
      
      // Handle abort separately
      if (error.name === 'AbortError') {
        setChatMessages(prev => 
          prev.map(m => 
            m.id === assistantMessage.id 
              ? { ...m, content: '🛑 Request cancelled', error: true }
              : m
          )
        );
        return;
      }
      
      setChatMessages(prev => 
        prev.map(m => 
          m.id === assistantMessage.id 
            ? { ...m, content: '❌ Error: ' + error.message, error: true }
            : m
        )
      );
      toast({
        title: "Error",
        description: "Failed to get response from Ollama",
        variant: "destructive"
      });
    } finally {
      setIsSendingToOllama(false);
      abortControllerRef.current = null;
    }
  };

  // Auto-generate summary for long sessions
  useEffect(() => {
    const autoSummarize = async () => {
      if (!currentSessionId || chatMessages.length < 10) return;
      
      const currentSession = chatSessions.find(s => s.id === currentSessionId);
      if (!currentSession || currentSession.summary) return; // Skip if already summarized
      
      // Auto-summarize after 15 messages
      if (chatMessages.length === 15 || chatMessages.length === 30) {
        try {
          const { data: summary } = await apiClient.functions.invoke('invokeLLMWithLogging', {
            prompt: `Create a brief summary (1-2 sentences) of this conversation:\n\n${chatMessages.slice(0, 10).map(m => `${m.role}: ${m.content}`).join('\n')}`,
            source_tool: 'voice_chat',
            request_metadata: { action: 'auto_summarize' }
          });
          
          setChatSessions(prev =>
            prev.map(s =>
              s.id === currentSessionId
                ? { ...s, summary, name: summary.substring(0, 60) + '...' }
                : s
            )
          );
        } catch (error) {
          console.error('Auto-summary failed:', error);
        }
      }
    };
    
    autoSummarize();
  }, [chatMessages.length, currentSessionId]);

  // Save current session when messages change
  useEffect(() => {
    if (currentSessionId) { // Check if a session is active
      const updatedSessions = chatSessions.map(session =>
        session.id === currentSessionId
          ? {
              ...session,
              messages: chatMessages.slice(-MAX_MESSAGES_PER_SESSION), // Ensure message limit
              model: selectedModel,
              updatedAt: new Date().toISOString()
            }
          : session
      );
      setChatSessions(updatedSessions);
    }
  }, [chatMessages, currentSessionId, selectedModel]); // Also depend on selectedModel

  // Save sessions to database
  useEffect(() => {
    const saveSessionToDB = async () => {
      if (!currentUser || !currentSessionId) return;
      
      const currentSession = chatSessions.find(s => s.id === currentSessionId);
      if (!currentSession) return;
      
      try {
         await apiClient.entities.VoiceChat.update(currentSession.id, {
          name: currentSession.name,
          messages: currentSession.messages.slice(-MAX_MESSAGES_PER_SESSION),
          model: currentSession.model,
          persona_id: currentSession.persona?.id,
          persona_name: currentSession.persona?.name,
          is_favorite: currentSession.isFavorite,
          is_archived: currentSession.is_archived || false,
          folder: currentSession.folder,
          tags: currentSession.tags,
          summary: currentSession.summary
        });
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    };
    
    // Debounce saves
    const timer = setTimeout(saveSessionToDB, 1000);
    return () => clearTimeout(timer);
  }, [chatSessions, currentSessionId, currentUser]);

  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [chatMessages]);

  const clearOllamaChat = () => {
    if (currentSessionId) {
      deleteChatSession(currentSessionId);
    }
  };

  const [copiedMessageId, setCopiedMessageId] = useState(null);

  const copyOllamaMessage = async (content, id) => {
    await navigator.clipboard.writeText(content);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
    toast({
        title: "Copied!",
        description: "Message copied to clipboard"
    });
  };

  const exportChatToPDF = () => {
    const session = chatSessions.find(s => s.id === currentSessionId);
    if (!session || chatMessages.length === 0) return;

    const doc = new jsPDF();
    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const maxWidth = pageWidth - (margin * 2);
    const lineHeight = 7;

    // Title
    doc.setFont(undefined, 'bold');
    doc.setFontSize(16);
    doc.text(session.name, margin, yPosition);
    yPosition += 10;

    // Metadata
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Created: ${new Date(session.createdAt).toLocaleString()}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Model: ${session.model || 'N/A'}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Messages: ${chatMessages.length}`, margin, yPosition);
    if (session.tags?.length) {
      doc.text(`Tags: ${session.tags.join(', ')}`, margin, yPosition + 6);
      yPosition += 6;
    }
    yPosition += 8;

    // Separator
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Messages
    doc.setTextColor(0, 0, 0);
    chatMessages.forEach((msg, idx) => {
      if (msg.role === 'tool') return; // Skip tool results

      // Role label
      doc.setFont(undefined, 'bold');
      doc.setFontSize(11);
      const roleLabel = msg.role === 'user' ? '👤 User' : '🤖 Assistant';
      doc.text(roleLabel, margin, yPosition);
      yPosition += 6;

      // Message content
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      const splitText = doc.splitTextToSize(msg.content, maxWidth);
      splitText.forEach(line => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });

      // Timestamp
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(8);
      doc.text(new Date(msg.timestamp).toLocaleTimeString(), margin, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 8;

      // Message separator
      if (idx < chatMessages.length - 1) {
        doc.setDrawColor(230, 230, 230);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 6;
      }
    });

    // Footer
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Generated on ${new Date().toLocaleString()}`,
      margin,
      pageHeight - 10
    );

    doc.save(`${session.name.replace(/\s+/g, '-')}.pdf`);
    toast({
      title: "Exported!",
      description: "Chat saved as PDF"
    });
  };

  const startEditingMessage = (message) => {
    setEditingMessageId(message.id);
    setEditedContent(message.content);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditedContent("");
  };

  const saveEditedMessage = async () => {
    if (!editedContent.trim() || !editingMessageId) return;

    // Find the edited message index
    const messageIndex = chatMessages.findIndex(m => m.id === editingMessageId);
    if (messageIndex === -1) return;

    // Remove all messages from edited message onwards
    const messagesToKeep = chatMessages.slice(0, messageIndex);
    setChatMessages(messagesToKeep);

    // Reset editing state
    setEditingMessageId(null);
    setEditedContent("");

    // Resend the edited message
    toast({
      title: "Message Edited",
      description: "Resending to Ollama..."
    });

    await sendToOllama(editedContent.trim());
  };

  const handleCommitPause = async () => {
    const textToCommit = pausedTranscript;
    setShowPauseDialog(false);
    setPausedTranscript("");
    pendingTranscriptRef.current = '';
    setInterimText("");

    setTranscript(prev => prev + textToCommit + ' ');

    if (ollamaEndpoint && selectedModel) {
      setChatInput(textToCommit);
      setTimeout(() => {
        sendToOllama(textToCommit);
      }, 100);
    }
  };

  const handleDiscardPause = () => {
    setShowPauseDialog(false);
    setPausedTranscript("");
    pendingTranscriptRef.current = '';
    setInterimText("");
  };

  const handleContinueListening = () => {
    setShowPauseDialog(false);
    // Keep the paused transcript in pendingTranscriptRef for continuation
    pendingTranscriptRef.current = pausedTranscript;
    setInterimText(pausedTranscript);
    setPausedTranscript("");
  };

  const speakOllamaMessage = async (content, messageId) => {
    // Load settings from localStorage
    const STORAGE_KEY = "prompt_muse_pro_settings";
    let voiceSettings = {
      elevenlabsApiKey: '',
      elevenlabsVoiceId: '',
      elevenlabsModel: 'eleven_multilingual_v2',
      elevenlabsStability: 0.5,
      elevenlabsSimilarity: 0.8,
      elevenlabsStyle: 0,
      elevenlabsSpeakerBoost: true
    };
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const settings = JSON.parse(saved);
        if (settings.voice) {
          voiceSettings = { 
            ...voiceSettings, 
            elevenlabsApiKey: settings.voice.elevenlabsApiKey || '',
            elevenlabsVoiceId: settings.voice.elevenlabsVoiceId || '',
            elevenlabsModel: settings.voice.elevenlabsModel || 'eleven_multilingual_v2',
            elevenlabsStability: settings.voice.elevenlabsStability !== undefined ? settings.voice.elevenlabsStability : 0.5,
            elevenlabsSimilarity: settings.voice.elevenlabsSimilarity !== undefined ? settings.voice.elevenlabsSimilarity : 0.8,
            elevenlabsStyle: settings.voice.elevenlabsStyle !== undefined ? settings.voice.elevenlabsStyle : 0,
            elevenlabsSpeakerBoost: settings.voice.elevenlabsSpeakerBoost !== undefined ? settings.voice.elevenlabsSpeakerBoost : true
          };
        }
      }
    } catch (error) {
      console.error('Failed to load voice settings:', error);
    }

    // Check if ElevenLabs is configured
    if (!voiceSettings.elevenlabsApiKey || !voiceSettings.elevenlabsVoiceId) {
      toast({
        title: "ElevenLabs Not Configured",
        description: "Please configure ElevenLabs API key and voice in Settings",
        variant: "destructive"
      });
      return;
    }

    // Stop any currently playing speech
    if (speakingMessageId !== null) {
      setSpeakingMessageId(null);
      if (speakingMessageId === messageId) {
        return; // Toggle off
      }
    }

    setSpeakingMessageId(messageId);

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceSettings.elevenlabsVoiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': voiceSettings.elevenlabsApiKey
        },
        body: JSON.stringify({
          text: content,
          model_id: voiceSettings.elevenlabsModel,
          voice_settings: {
            stability: voiceSettings.elevenlabsStability,
            similarity_boost: voiceSettings.elevenlabsSimilarity,
            style: voiceSettings.elevenlabsStyle,
            use_speaker_boost: voiceSettings.elevenlabsSpeakerBoost
          }
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail?.message || 'ElevenLabs API error');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setSpeakingMessageId(null);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setSpeakingMessageId(null);
        URL.revokeObjectURL(audioUrl);
        toast({
          title: "Playback Error",
          description: "Failed to play audio",
          variant: "destructive"
        });
      };
      
      await audio.play();
      
    } catch (error) {
      const errorMsg = error?.message || error?.toString() || 'ElevenLabs TTS failed';
      console.error('ElevenLabs TTS error:', errorMsg, error);
      setSpeakingMessageId(null);
      toast({
        title: "ElevenLabs Error",
        description: errorMsg,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex flex-col overflow-hidden">
      {/* Info Banner - Absolutely positioned at top */}
      <AnimatePresence>
        {showInfoBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 p-1 shadow-xl z-50"
          >
            <div className="bg-white/95 backdrop-blur-sm p-4">
              <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    How it Works
                  </h3>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Speak naturally - voice auto-sends after pauses</li>
                    <li>• Configure Ollama for local AI chat</li>
                    <li>• Use personas & templates for context</li>
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
                      <div className="bg-yellow-50 p-2 rounded-lg border border-yellow-200">
                        <h4 className="font-semibold text-xs text-gray-900 mb-1">{proTips[currentTipIndex].title}</h4>
                        <p className="text-xs text-gray-600">{proTips[currentTipIndex].desc}</p>
                        <div className="flex gap-0.5 mt-1.5">
                          {proTips.map((_, idx) => (
                            <div key={idx} className={`h-0.5 flex-1 rounded ${idx === currentTipIndex ? 'bg-yellow-400' : 'bg-yellow-200'}`} />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-600" />
                    Helpful Links
                  </h3>
                  <div className="space-y-2">
                    <a href={createPageUrl('OllamaSettings')} className="block text-xs text-blue-600 hover:text-blue-700 hover:underline">
                      → Ollama Setup Guide
                    </a>
                    <a href={createPageUrl('Documentation')} className="block text-xs text-blue-600 hover:text-blue-700 hover:underline">
                      → Voice Chat Docs
                    </a>
                    <a href={createPageUrl('Settings')} className="block text-xs text-blue-600 hover:text-blue-700 hover:underline">
                      → Voice Settings
                    </a>
                    <a href={createPageUrl('Help')} className="block text-xs text-blue-600 hover:text-blue-700 hover:underline">
                      → Get Help
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 grid grid-cols-12 gap-2 p-2 overflow-hidden min-h-0 max-h-full">
        {/* Left Panel - Toggleable */}
        {(showOllamaConfig || showChatHistory || showModelManager || showVectorRAG) && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="col-span-3 flex flex-col gap-2 overflow-y-auto h-full"
          >
            {/* Ollama Config - Only show when expanded */}
            {showOllamaConfig && (
              <div className={`overflow-auto ${
                [showOllamaConfig, showModelManager, showVectorRAG, showChatHistory].filter(Boolean).length === 1 
                  ? 'h-full' 
                  : [showOllamaConfig, showModelManager, showVectorRAG, showChatHistory].filter(Boolean).length === 2
                  ? 'h-1/2'
                  : ''
              }`}>
              <Card className="h-full flex flex-col border border-orange-300 bg-orange-50">
                <CardHeader className="flex-shrink-0 pb-2 cursor-pointer" onClick={() => setShowOllamaConfig(false)}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Server className="w-4 h-4 text-orange-600" />
                      Ollama Config
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto space-y-3 text-sm p-3">
                  {ollamaEndpoints.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Configured Endpoints:</p>
                      {ollamaEndpoints.map((ep) => {
                        const epUrl = typeof ep === 'string' ? ep : ep.url;
                        return (
                         <div key={epUrl} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                           <div className="flex items-center gap-3 flex-1 min-w-0">
                             <Server className={`w-4 h-4 flex-shrink-0 ${ollamaEndpoint === epUrl ? 'text-green-600' : 'text-gray-400'}`} />
                             <div className="min-w-0 flex-1">
                               <p className="text-sm font-medium truncate">{epUrl}</p>
                               {ollamaEndpoint === epUrl && (
                                 <Badge className="mt-1 h-5 text-xs bg-green-100 text-green-700">Active</Badge>
                               )}
                             </div>
                           </div>
                           <div className="flex gap-2 flex-shrink-0">
                             <Button
                               variant="ghost"
                               size="icon"
                               className="h-8 w-8"
                               onClick={() => {
                                 navigator.clipboard.writeText(epUrl);
                                 toast({ title: "Copied!", description: "Endpoint copied to clipboard" });
                               }}
                               title="Copy URL"
                             >
                               <ClipboardCopy className="w-3 h-3" />
                             </Button>
                             {ollamaEndpoint !== epUrl && (
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => switchEndpoint(epUrl)}
                               >
                                 Use
                               </Button>
                             )}
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => removeEndpoint(epUrl)}
                             >
                               <X className="w-4 h-4" />
                             </Button>
                           </div>
                         </div>
                        );
                        })}
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Add New Endpoint:</p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="http://localhost:11434"
                        value={newEndpoint}
                        onChange={(e) => setNewEndpoint(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addEndpoint()}
                      />
                      <Button
                        onClick={addEndpoint}
                        disabled={!newEndpoint.trim() || isTestingEndpoint}
                        className="bg-gradient-to-r from-orange-600 to-red-600"
                      >
                        {isTestingEndpoint ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Model Manager - Only show when expanded */}
          {showModelManager && (
            <div className={`overflow-auto ${
              [showOllamaConfig, showModelManager, showVectorRAG, showChatHistory].filter(Boolean).length === 1 
                ? 'h-full' 
                : [showOllamaConfig, showModelManager, showVectorRAG, showChatHistory].filter(Boolean).length === 2
                ? 'h-1/2'
                : ''
            }`}>
              <Card className="h-full border border-green-300 transition-all flex flex-col">
                <CardHeader className="pb-2 cursor-pointer flex-shrink-0" onClick={() => setShowModelManager(false)}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Package className="w-4 h-4 text-green-600" />
                      Model Manager
                    </CardTitle>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-3 flex-1 overflow-auto min-h-0">
                  <OllamaModelManager 
                    endpoint={ollamaEndpoint}
                    onModelUpdate={(models) => setAvailableModels(models)}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Vector RAG - Only show when expanded */}
          {showVectorRAG && (
            <div className={`overflow-auto ${
              [showOllamaConfig, showModelManager, showVectorRAG, showChatHistory].filter(Boolean).length === 1 
                ? 'h-full' 
                : [showOllamaConfig, showModelManager, showVectorRAG, showChatHistory].filter(Boolean).length === 2
                ? 'h-1/2'
                : ''
            }`}>
              <Card className="h-full border border-purple-300 transition-all flex flex-col">
                <CardHeader className="pb-2 cursor-pointer flex-shrink-0" onClick={() => setShowVectorRAG(false)}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Database className="w-4 h-4 text-purple-600" />
                      Vector RAG
                    </CardTitle>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-3 flex-1 overflow-auto min-h-0">
                  <EnhancedVectorRAG 
                    endpoint={ollamaEndpoint}
                    selectedModel={selectedModel}
                    onContextRetrieved={setRagContext}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Chat History - Only show when expanded */}
          {showChatHistory && (
            <div className={`overflow-auto ${
              [showOllamaConfig, showModelManager, showVectorRAG, showChatHistory].filter(Boolean).length === 1 
                ? 'h-full' 
                : [showOllamaConfig, showModelManager, showVectorRAG, showChatHistory].filter(Boolean).length === 2
                ? 'h-1/2'
                : ''
            }`}>
              <Card className="h-full flex flex-col border border-purple-300 bg-white">
                <CardHeader className="flex-shrink-0 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <MessageSquare className="w-4 h-4 text-purple-600" />
                      Chat History
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setShowChatHistory(false)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden flex flex-col p-3">
                  <SessionManager
                    sessions={chatSessions}
                    currentSessionId={currentSessionId}
                    folders={sessionFolders}
                    onSessionSelect={loadChatSession}
                    onSessionRename={openRenameDialog}
                    onSessionDelete={deleteChatSession}
                    onSessionArchive={archiveChatSession}
                    onSessionUnarchive={unarchiveChatSession}
                    onSessionMove={openFolderDialog}
                    onSessionTag={openTagDialog}
                    onSessionFavorite={toggleFavoriteSession}
                    onSessionExport={exportSession}
                    onSessionShare={(sessionId) => {
                      setShareSessionId(sessionId);
                      setShowShareModal(true);
                    }}
                  />
                  </CardContent>
                  </Card>
                  </div>
                  )}
                  </motion.div>
                  )}

      {/* Center Chat - Always Visible */}
      <div className={`${(showOllamaConfig || showChatHistory || showModelManager || showVectorRAG) ? 'col-span-6' : 'col-span-9'} flex flex-col gap-2 h-full overflow-hidden`}>
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Chat Window */}
        <Card className="border border-blue-200 bg-white flex-1 flex flex-col min-h-0 overflow-hidden">
          <CardHeader className="pb-2 pt-3 flex-shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <CardTitle className="text-base">Chat</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowInfoBanner(!showInfoBanner)}
                      className="h-8"
                      title="Toggle Tips"
                    >
                      <Info className="w-4 h-4" />
                    </Button>
                    {personas.length > 0 && (
                      <Popover open={personaPopoverOpen} onOpenChange={setPersonaPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs w-[120px]"
                          >
                            {selectedPersona ? (
                              <span className="truncate">
                                {selectedPersona.icon} {selectedPersona.name}
                              </span>
                            ) : (
                              <>
                                <Users className="w-3 h-3 mr-1" />
                                Persona
                              </>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[280px] p-0">
                          <Command>
                            <CommandInput placeholder="Search personas..." className="h-9" />
                            <CommandEmpty>No persona found.</CommandEmpty>
                            <CommandGroup className="max-h-[300px] overflow-auto">
                              <CommandItem
                                key="none"
                                value="none"
                                onSelect={() => {
                                  setSelectedPersona(null);
                                  localStorage.removeItem('voice_selected_persona');
                                  setPersonaPopoverOpen(false);
                                  const newSession = createNewChatSession();
                                  setChatSessions(prev => [newSession, ...prev]);
                                  setCurrentSessionId(newSession.id);
                                  setChatMessages([]);
                                  localStorage.setItem(CURRENT_SESSION_KEY, newSession.id);
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${!selectedPersona ? "opacity-100" : "opacity-0"}`}
                                />
                                No Persona
                              </CommandItem>
                              {personas.map((persona) => (
                                <CommandItem
                                  key={persona.id}
                                  value={persona.name}
                                  onSelect={() => {
                                    handlePersonaChange(persona.id);
                                    setPersonaPopoverOpen(false);
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${selectedPersona?.id === persona.id ? "opacity-100" : "opacity-0"}`}
                                  />
                                  {persona.icon} {persona.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                    {templates.length > 0 && (
                      <Popover open={templatePopoverOpen} onOpenChange={setTemplatePopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs w-[120px]"
                          >
                            {selectedTemplates.length > 0 ? (
                              <span>📝 {selectedTemplates.length}</span>
                            ) : (
                              <>
                                <FileText className="w-3 h-3 mr-1" />
                                Template
                              </>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[280px] p-3 space-y-2">
                          <Command>
                            <CommandInput placeholder="Search templates..." />
                            <CommandEmpty>No template found.</CommandEmpty>
                            <CommandGroup className="max-h-[300px] overflow-auto">
                              {selectedTemplates.length > 0 && (
                                <>
                                  <CommandItem
                                    key="clear-all"
                                    value="clear-all"
                                    onSelect={() => {
                                      clearTemplateSelection();
                                    }}
                                    className="text-red-600"
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    Clear All ({selectedTemplates.length})
                                  </CommandItem>
                                  <div className="h-px bg-gray-200 my-1" />
                                </>
                              )}
                              {templates.map((template) => {
                                const isSelected = selectedTemplates.some(t => t.id === template.id);
                                return (
                                  <CommandItem
                                    key={template.id}
                                    value={template.title}
                                    onSelect={() => handleTemplateToggle(template.id)}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${isSelected ? "opacity-100" : "opacity-0"}`}
                                    />
                                    📝 {template.title}
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </Command>
                          {selectedTemplates.length > 0 && (
                            <Button
                              className="w-full bg-purple-600 hover:bg-purple-700"
                              size="sm"
                              onClick={() => {
                                // Check if any selected template has placeholders
                                const hasPlaceholders = selectedTemplates.some(t => t.placeholders && t.placeholders.length > 0);
                                
                                if (hasPlaceholders) {
                                  // Initialize defaults
                                  const defaults = {};
                                  selectedTemplates.forEach(template => {
                                    if (template.placeholders) {
                                      template.placeholders.forEach(p => {
                                        if (p.default && !placeholderValues[p.key]) {
                                          defaults[p.key] = p.default;
                                        }
                                      });
                                    }
                                  });
                                  if (Object.keys(defaults).length > 0) {
                                    setPlaceholderValues(prev => ({ ...defaults, ...prev }));
                                  }
                                  
                                  setPendingTemplatesForInput(selectedTemplates);
                                  setTemplatePopoverOpen(false);
                                  setShowPlaceholderDialog(true);
                                } else {
                                  // No placeholders - replace chat input directly
                                  const templatesContent = selectedTemplates.map(t => 
                                    `Template: ${t.title}\nCategory: ${t.category}\n\n${t.content}`
                                  ).join('\n\n---\n\n');
                                  
                                  setChatInput(templatesContent);
                                  setTemplatePopoverOpen(false);
                                  
                                  toast({
                                    title: "Templates Loaded",
                                    description: `${selectedTemplates.length} template${selectedTemplates.length > 1 ? 's' : ''} loaded into chat input`
                                  });
                                }
                              }}
                            >
                              {selectedTemplates.some(t => t.placeholders && t.placeholders.length > 0) ? (
                                <>Fill Placeholders & Load</>
                              ) : (
                                <>Load {selectedTemplates.length} Template{selectedTemplates.length > 1 ? 's' : ''}</>
                              )}
                            </Button>
                          )}
                        </PopoverContent>
                      </Popover>
                    )}
                    {availableModels.length > 0 && (
                      <Select 
                        value={selectedModel} 
                        onValueChange={(value) => {
                          setSelectedModel(value);
                          const settings = getOllamaSettings();
                          saveOllamaSettings({ ...settings, selectedModel: value });
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs w-[140px]">
                          <SelectValue placeholder="Model" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableModels.map((model) => (
                            <SelectItem key={model.name} value={model.name}>
                              {model.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8" disabled={chatMessages.length === 0}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setShowSummarizer(!showSummarizer)}>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Summarize
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setShareSessionId(currentSessionId);
                          setShowShareModal(true);
                        }}>
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          const session = chatSessions.find(s => s.id === currentSessionId);
                          if (!session || chatMessages.length === 0) return;
                          const exportData = {
                            sessionName: session.name,
                            createdAt: session.createdAt,
                            model: session.model,
                            persona: session.persona?.name || 'None',
                            messageCount: chatMessages.length,
                            messages: chatMessages.map(m => ({
                              role: m.role,
                              content: m.content,
                              timestamp: m.timestamp,
                              model: m.model
                            }))
                          };
                          const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `voice-chat-${session.name.replace(/\s+/g, '-')}-${Date.now()}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                          toast({ title: "Exported!", description: "Voice chat saved as JSON" });
                        }}>
                          <FileText className="w-4 h-4 mr-2" />
                          Export JSON
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={exportChatToPDF}>
                          <FileText className="w-4 h-4 mr-2" />
                          Export PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={clearOllamaChat} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Clear Chat
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 min-h-0 overflow-hidden flex flex-col">
                <ScrollArea className="flex-1 px-6 py-4 min-h-0">
                  {!ollamaEndpoint ? (
                    <div className="text-center py-12 text-gray-500">
                      <Server className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Ollama Not Configured</p>
                      <p className="text-sm mb-4">Configure your Ollama endpoint to start chatting</p>
                      <Button
                        onClick={() => setShowOllamaConfig(true)}
                        className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                      >
                        <Server className="w-4 h-4 mr-2" />
                        Configure Ollama
                      </Button>
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">No messages yet</p>
                      <p className="text-sm mb-4">Your voice will auto-send to Ollama after pauses</p>
                      <div className="flex flex-col items-center gap-2 text-xs">
                        <Badge variant="outline" className="bg-purple-50">
                          <Mic className="w-3 h-3 mr-1" />
                          Start recording to begin
                        </Badge>
                        <p className="text-gray-400">Try: "summarize the conversation" or "what was my last question?"</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                     <AnimatePresence>
                      {chatMessages.map((message) => {
                                        // Skip tool messages that lack proper toolResult structure
                                        if (message.role === 'tool') {
                                          // Only display if it has valid toolResult data
                                          if (!message.toolResult || typeof message.toolResult !== 'object') {
                                            return null;
                                          }
                                          return (
                                            <motion.div
                                              key={message.id}
                                              initial={{ opacity: 0, y: 10 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              exit={{ opacity: 0 }}
                                            >
                                              <ToolResultDisplay result={message.toolResult} />
                                            </motion.div>
                                          );
                                        }

                        return (
                         <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                         >
                           {message.role === 'assistant' && (
                             <div className="flex-shrink-0">
                               <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
                                 <Bot className="w-5 h-5 text-white" />
                               </div>
                             </div>
                           )}

                           <div className={`max-w-[75%] group ${message.role === 'user' ? 'order-first' : ''}`}>
                             {/* Tool Calls Indicator */}
                             {message.toolCalls && message.toolCalls.length > 0 && (
                               <div className="mb-2 space-y-1">
                                 {message.toolCalls.map((toolCall, idx) => (
                                   <div key={idx} className="flex items-center gap-2 text-xs bg-orange-100 border border-orange-300 rounded-lg px-2 py-1">
                                     <Wrench className="w-3 h-3 text-orange-600" />
                                     <span className="font-medium text-orange-800">
                                       {toolCall.toolName}
                                     </span>
                                     <Badge variant="outline" className="text-xs bg-white">
                                       ✓ Executed
                                     </Badge>
                                   </div>
                                 ))}
                               </div>
                             )}

                             {/* Message Content - Editable for User Messages */}
                             {message.role === 'user' && editingMessageId === message.id ? (
                               <div className="rounded-2xl bg-white border-2 border-purple-400 p-3 space-y-2">
                                 <Textarea
                                   value={editedContent}
                                   onChange={(e) => setEditedContent(e.target.value)}
                                   className="w-full min-h-[80px] border-0 focus-visible:ring-0 resize-none"
                                   autoFocus
                                 />
                                 <div className="flex gap-2">
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={cancelEditing}
                                     className="flex-1"
                                   >
                                     <X className="w-3 h-3 mr-1" />
                                     Cancel
                                   </Button>
                                   <Button
                                     size="sm"
                                     onClick={saveEditedMessage}
                                     className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                                     disabled={!editedContent.trim()}
                                   >
                                     <Send className="w-3 h-3 mr-1" />
                                     Resend
                                   </Button>
                                 </div>
                               </div>
                             ) : (
                               <div className={`rounded-2xl px-4 py-3 ${
                                 message.role === 'user'
                                   ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                                   : message.error
                                   ? 'bg-red-50 border border-red-200 text-red-800'
                                   : 'bg-gray-100 text-gray-900'
                               }`}>
                                 {message.translatedContent && translationSettings.showOriginal ? (
                                   <div className="space-y-2">
                                     <div className="flex items-center gap-2 mb-2">
                                       <Globe className="w-3 h-3 opacity-70" />
                                       <span className="text-xs opacity-70">Translation</span>
                                     </div>
                                     <p className="whitespace-pre-wrap break-words">{message.translatedContent}</p>
                                     <div className="pt-2 mt-2 border-t border-white/20">
                                       <p className="text-xs opacity-60 mb-1">Original:</p>
                                       <p className="whitespace-pre-wrap break-words text-sm opacity-80">{message.content}</p>
                                     </div>
                                   </div>
                                 ) : message.translatedContent ? (
                                   <p className="whitespace-pre-wrap break-words">{message.translatedContent}</p>
                                 ) : (
                                   <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                 )}
                                 {message.originalContent && translationSettings.showOriginal && (
                                   <div className="pt-2 mt-2 border-t border-white/20">
                                     <p className="text-xs opacity-60 mb-1">Original:</p>
                                     <p className="text-sm opacity-80">{message.originalContent}</p>
                                   </div>
                                 )}
                                 {message.model && (
                                   <p className="text-xs mt-2 opacity-70">
                                     {message.model}
                                   </p>
                                 )}
                               </div>
                             )}

                             <div className="flex items-center gap-1 mt-1 px-2 flex-wrap">
                               <span className="text-xs text-gray-500 mr-1">
                                 {new Date(message.timestamp).toLocaleTimeString()}
                               </span>
                               {message.role === 'user' && editingMessageId !== message.id && (
                                 <>
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => startEditingMessage(message)}
                                     className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                     title="Edit and resend"
                                   >
                                     <Edit3 className="w-3 h-3" />
                                   </Button>
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={async () => {
                                       await navigator.clipboard.writeText(message.content);
                                       setCopiedMessageId(message.id);
                                       setTimeout(() => setCopiedMessageId(null), 2000);
                                       toast({ title: "Copied!" });
                                     }}
                                     className={`h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity ${copiedMessageId === message.id ? 'opacity-100 text-green-600' : ''}`}
                                     title="Copy message"
                                   >
                                     {copiedMessageId === message.id ? (
                                       <Check className="w-3 h-3" />
                                     ) : (
                                       <Copy className="w-3 h-3" />
                                     )}
                                   </Button>
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => setChatInput(message.content)}
                                     className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                     title="Copy to input"
                                   >
                                     <Edit3 className="w-3 h-3" />
                                   </Button>
                                   {beamModels.length > 0 && (
                                     <Button
                                       variant="ghost"
                                       size="sm"
                                       onClick={() => {
                                         setBeamPrompt(message.content);
                                         setShowBeamChat(true);
                                       }}
                                       className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                       title="Send to Beam"
                                     >
                                       <Zap className="w-3 h-3" />
                                     </Button>
                                   )}
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => startNewOllamaChat()}
                                     className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                     title="Start new chat"
                                   >
                                     <Plus className="w-3 h-3" />
                                   </Button>
                                 </>
                               )}
                               {message.role === 'assistant' && !message.error && (
                                 <>
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => speakOllamaMessage(message.content, message.id)}
                                     className={`h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity ${speakingMessageId === message.id ? 'opacity-100 text-purple-600' : ''}`}
                                     title="Speak with AI voice"
                                   >
                                     {speakingMessageId === message.id ? (
                                       <Pause className="w-3 h-3" />
                                     ) : (
                                       <Volume2 className="w-3 h-3" />
                                     )}
                                   </Button>
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => copyOllamaMessage(message.content, message.id)}
                                     className={`h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity ${copiedMessageId === message.id ? 'opacity-100 text-green-600' : ''}`}
                                     title="Copy message"
                                   >
                                     {copiedMessageId === message.id ? (
                                       <Check className="w-3 h-3" />
                                     ) : (
                                       <Copy className="w-3 h-3" />
                                     )}
                                   </Button>
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => setChatInput(message.content)}
                                     className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                     title="Copy to input"
                                   >
                                     <Edit3 className="w-3 h-3" />
                                   </Button>
                                   {beamModels.length > 0 && (
                                     <Button
                                       variant="ghost"
                                       size="sm"
                                       onClick={() => {
                                         setBeamPrompt(message.content);
                                         setShowBeamChat(true);
                                       }}
                                       className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                       title="Send to Beam"
                                     >
                                       <Zap className="w-3 h-3" />
                                     </Button>
                                   )}
                                 </>
                               )}
                             </div>
                           </div>

                           {message.role === 'user' && (
                             <div className="flex-shrink-0">
                               <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center">
                                 <User className="w-5 h-5 text-white" />
                               </div>
                             </div>
                           )}
                           </motion.div>
                           );
                           })}
                           </AnimatePresence>
                      
                      {isSendingToOllama && (
                       <motion.div
                         initial={{ opacity: 0, scale: 0.95 }}
                         animate={{ opacity: 1, scale: 1 }}
                         className="flex gap-3"
                       >
                         <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center relative">
                           <Loader2 className="w-5 h-5 text-white animate-spin" />
                           <span className="absolute inset-0 rounded-full bg-purple-500 animate-ping opacity-25"></span>
                         </div>
                         <div className="bg-gradient-to-r from-gray-100 to-purple-50 rounded-2xl px-4 py-3 border border-purple-200">
                           <div className="flex items-center gap-2">
                             <div className="flex gap-1">
                               <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></span>
                               <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                               <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                             </div>
                             <span className="text-xs text-purple-700 font-medium">AI is thinking...</span>
                           </div>
                         </div>
                       </motion.div>
                      )}
                      
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* AI Processing Indicator - Bottom Corner */}
            <AnimatePresence>
              {isSendingToOllama && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  className="fixed bottom-20 right-6 z-20"
                >
                  <Card className="border border-purple-300 bg-white/90 backdrop-blur-sm shadow-lg">
                    <CardContent className="p-2 flex items-center gap-2">
                      <Loader2 className="w-3 h-3 text-purple-600 animate-spin" />
                      <span className="text-xs font-medium text-purple-900">AI Processing...</span>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Fixed Controls Bar - Compact */}
            <Card className="border border-purple-200 bg-white shadow-lg flex-shrink-0">
              <CardContent className="p-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                  {/* Voice Control */}
                  <motion.button
                    onClick={toggleListening}
                    disabled={!isSupported}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative p-2 rounded-full transition-all flex-shrink-0 ${
                      isListening 
                        ? 'bg-red-500 shadow-lg shadow-red-500/40' 
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/25'
                    } ${!isSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-white" />}
                    {isListening && (
                      <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20"></span>
                    )}
                  </motion.button>

                  {/* Audio Level */}
                  {isListening && audioStream && (
                    <div className="flex-shrink-0">
                      <AudioLevelMeter audioStream={audioStream} isActive={isListening} />
                    </div>
                  )}

                  {/* Chat Input */}
                  {ollamaEndpoint && (
                    <>
                      <Input
                        placeholder="Type or speak..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && chatInput.trim()) {
                            e.preventDefault();
                            sendToOllama(chatInput.trim());
                          }
                        }}
                        disabled={isSendingToOllama || !selectedModel}
                        className="flex-1 h-9"
                      />
                      {!isSendingToOllama ? (
                        <>
                          <Button
                            onClick={() => chatInput.trim() && sendToOllama(chatInput.trim())}
                            disabled={!chatInput.trim() || !selectedModel}
                            size="sm"
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-9"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                          {beamModels.length > 0 && (
                            <Button
                              onClick={() => {
                                if (chatInput.trim()) {
                                  setBeamPrompt(chatInput.trim());
                                  setShowBeamChat(true);
                                }
                              }}
                              disabled={!chatInput.trim() || !selectedModel}
                              size="sm"
                              className="bg-gradient-to-r from-indigo-600 to-purple-600 h-9"
                              title="Beam"
                            >
                              <Zap className="w-4 h-4" />
                            </Button>
                          )}
                        </>
                      ) : (
                        <Button
                          onClick={stopOllamaRequest}
                          variant="destructive"
                          size="sm"
                          className="h-9"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </>
                  )}

                  {/* Compact Controls */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setShowVoiceSettings(true)}>
                        <Mic className="w-4 h-4 mr-2" />
                        Voice Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowTranslation(true)}>
                        <Globe className="w-4 h-4 mr-2" />
                        Translation
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowCustomCommands(true)}>
                        <Zap className="w-4 h-4 mr-2" />
                        Commands
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowModelManager(true)}>
                        <Package className="w-4 h-4 mr-2" />
                        Models
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowVectorRAG(true)}>
                        <Database className="w-4 h-4 mr-2" />
                        Vector RAG
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowToolCalling(true)}>
                        <Wrench className="w-4 h-4 mr-2" />
                        Tools
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowBeamConfig(true)}>
                        <Zap className="w-4 h-4 mr-2" />
                        Beam Config
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowOllamaConfig(true)}>
                        <Server className="w-4 h-4 mr-2" />
                        Ollama Config
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowInfoBanner(!showInfoBanner)}>
                        <Info className="w-4 h-4 mr-2" />
                        {showInfoBanner ? 'Hide' : 'Show'} Tips
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {ollamaEndpoints.length > 0 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowChatHistory(!showChatHistory)}
                        className="h-9 relative"
                      >
                        <History className="w-4 h-4" />
                        {chatSessions.length > 1 && (
                          <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[9px] bg-purple-600">
                            {chatSessions.length}
                          </Badge>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={startNewOllamaChat}
                        className="h-9"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
      </div>

      {/* Right Panel - Conditional */}
      {(showBeamConfig || showVoiceSettings || showTranslation || showCustomCommands || showSummarizer || showToolCalling || showToolManagement || enableSuggestions || queueSuggestions.length > 0 || toolQueue.length > 0 || isExecutingTool) && (
      <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="col-span-3 flex flex-col gap-2 overflow-y-auto h-full"
      >
      {/* Beam Configuration - Only show when expanded */}
      {showBeamConfig && (
        <Card className="border border-indigo-300 transition-all">
          <CardHeader className="pb-2 cursor-pointer" onClick={() => setShowBeamConfig(false)}>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-indigo-600" />
                Beam Configuration
                {beamModeEnabled && (
                  <Badge className="bg-indigo-600 text-xs">Active</Badge>
                )}
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <X className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-3 space-y-3">
            <div className="flex items-center justify-between p-2 bg-indigo-50 rounded-lg">
              <Label className="text-sm font-medium">Enable Beam Mode</Label>
              <Switch
                checked={beamModeEnabled}
                onCheckedChange={(checked) => {
                  setBeamModeEnabled(checked);
                  if (!checked) {
                    setBeamModels([]);
                  }
                }}
              />
            </div>

            {beamModeEnabled && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Select Models for Beam</Label>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setBeamModels(availableModels.map(m => m.name))}
                      className="h-6 px-2 text-xs"
                    >
                      Select All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setBeamModels([])}
                      className="h-6 px-2 text-xs"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {availableModels.map((model) => {
                    const isSelected = beamModels.includes(model.name);
                    return (
                      <div
                        key={model.name}
                        onClick={() => {
                          setBeamModels(prev => 
                            prev.includes(model.name)
                              ? prev.filter(m => m !== model.name)
                              : [...prev, model.name]
                          );
                        }}
                        className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-indigo-500 bg-indigo-100' 
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        <span className="text-sm font-medium">{model.name}</span>
                        <Check className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-transparent'}`} />
                      </div>
                    );
                  })}
                </div>
                {beamModels.length > 0 && (
                  <div className="p-2 bg-white rounded border">
                    <p className="text-xs text-gray-600">
                      💰 Selected {beamModels.length} models • Token usage will be {beamModels.length}x
                    </p>
                  </div>
                )}
              </div>
            )}

            {beamModeEnabled && beamModels.length === 0 && (
              <Alert>
                <AlertDescription className="text-xs">
                  Select at least 2 models for best results. Mix different model sizes for diverse perspectives.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Voice Settings - Only show when expanded */}
      {showVoiceSettings && (
        <Card className="border border-purple-300 transition-all">
          <CardHeader className="pb-2 cursor-pointer" onClick={() => setShowVoiceSettings(false)}>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Mic className="w-4 h-4 text-purple-600" />
                Voice Settings
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <X className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-3 max-h-[200px] overflow-auto">
            <VoiceSettings onSettingsChange={(settings) => {}} />
          </CardContent>
        </Card>
      )}

      {/* Translation Panel - Only show when expanded */}
      {showTranslation && (
        <Card className="border border-blue-300 transition-all">
          <CardHeader className="pb-2 cursor-pointer" onClick={() => setShowTranslation(false)}>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4 text-blue-600" />
                Translation
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <X className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-3 max-h-[200px] overflow-auto">
            <TranslationPanel onSettingsChange={setTranslationSettings} />
          </CardContent>
        </Card>
      )}

      {/* Custom Commands - Only show when expanded */}
      {showCustomCommands && (
        <Card className="border border-indigo-300 transition-all">
          <CardHeader className="pb-2 cursor-pointer" onClick={() => setShowCustomCommands(false)}>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-indigo-600" />
                Custom Commands
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <X className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-3 max-h-[500px] overflow-auto">
            <CustomCommandManager onCommandsChange={setCustomCommands} />
          </CardContent>
        </Card>
      )}

      {/* Chat Summarizer - Only show when expanded */}
      {showSummarizer && (
        <Card className="border border-yellow-300 transition-all">
          <CardHeader className="pb-2 cursor-pointer" onClick={() => setShowSummarizer(false)}>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-yellow-600" />
                Chat Summarizer
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <X className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-3 max-h-[300px] overflow-auto">
            <ChatSummarizer 
              messages={chatMessages} 
              sessionName={chatSessions.find(s => s.id === currentSessionId)?.name}
              onSendToOllama={sendToOllama}
              onAppendToChat={(text) => {
                const newMessage = {
                  id: Date.now(),
                  role: 'assistant',
                  content: text,
                  timestamp: new Date().toISOString(),
                  model: 'Summary'
                };
                setChatMessages(prev => [...prev, newMessage]);
              }}
              beamResponses={lastBeamResponses.length > 0 ? lastBeamResponses : undefined}
            />
          </CardContent>
        </Card>
      )}

      {/* Tool Calling Panel - Only show when expanded */}
      {showToolCalling && (
        <Card className="border border-orange-300 transition-all flex flex-col max-h-[600px]">
          <CardHeader className="pb-2 cursor-pointer flex-shrink-0" onClick={() => setShowToolCalling(false)}>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Wrench className="w-4 h-4 text-orange-600" />
                Tool Calling
                {currentToolCalls.length > 0 && (
                  <Badge className="bg-orange-600 text-xs h-5">
                    {currentToolCalls.length}
                  </Badge>
                )}
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <X className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-3 flex-1 overflow-hidden">
            <ToolCallingPanel 
              onSettingsChange={setToolCallingSettings}
              currentToolCalls={currentToolCalls}
              isExecuting={isSendingToOllama && toolCallingSettings.toolsEnabled}
            />
          </CardContent>
        </Card>
      )}

      {/* Tool Management Panel - Only show when expanded */}
      {showToolManagement && (
        <Card className="border border-indigo-300 transition-all flex flex-col max-h-[600px]">
          <CardHeader className="pb-2 cursor-pointer flex-shrink-0" onClick={() => setShowToolManagement(false)}>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-indigo-600" />
                Tool Management
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <X className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-3 flex-1 overflow-hidden">
            <ToolManagement />
          </CardContent>
        </Card>
      )}

      {/* Tool Suggestions */}
      {enableSuggestions && currentSessionId && !activeCreativeTool && !isExecutingTool && (
        <ToolSuggestions
          messages={chatMessages}
          onQueueTools={(jobs) => {
            const queuedJobs = jobs.map(job => ({
              ...job,
              id: `${job.toolId}-${Date.now()}-${Math.random()}`,
              status: 'pending'
            }));
            setToolQueue(prev => [...prev, ...queuedJobs]);
            toast({
              title: "Added to Queue",
              description: `Queued ${jobs.length} tool job${jobs.length > 1 ? 's' : ''}`
            });
          }}
          onUseToolWithData={async (toolId, extractedData, targetMode, globalSettingsSnapshot) => {
            setActiveCreativeTool(toolId);
            setCreativeToolData({ ...extractedData, targetMode, globalSettings: globalSettingsSnapshot });
            setIsExecutingTool(true);

            try {
              if (targetMode === 'beam') {
                const savedBeamModels = JSON.parse(localStorage.getItem('voice_beam_models') || '[]');
                
                if (savedBeamModels.length < 2) {
                  toast({
                    title: "Beam Mode Unavailable",
                    description: "Please configure at least 2 models in Beam settings",
                    variant: "destructive"
                  });
                  setIsExecutingTool(false);
                  setActiveCreativeTool(null);
                  return;
                }

                const result = await executeCreativeTool(toolId, extractedData, false, null, savedBeamModels, ollamaEndpoint);

                if (result?.results?.length > 0) {
                  const formattedContent = result.results.map(r => {
                    if (typeof r === 'string') return { content: r };
                    return {
                      content: r.content || r.text || r.idea || r.description || JSON.stringify(r),
                      title: r.title || r.name || r.platform || r.niche,
                      style_notes: r.reasoning || r.match_reason || r.strategy || r.notes,
                      approach: r.hook_type || r.technique,
                      best_for: r.audience_size || r.engagement
                    };
                  });

                  const gs = globalSettingsSnapshot || {};
                  await apiClient.entities.ContentHistory.create({
                    tool_type: toolId,
                    request_prompt: result.prompt || JSON.stringify(extractedData),
                    topic: gs.topic || extractedData?.topic || extractedData?.niche || extractedData?.content?.substring(0, 100) || 'Beam tool output',
                    tone: gs.tone || extractedData?.tone || '',
                    length: gs.length || '',
                    persona_id: gs.personaId || '',
                    persona_name: gs.personaName || '',
                    template_ids: gs.templateIds || [],
                    custom_instructions: gs.additionalContext || extractedData?.additionalContext || '',
                    use_ollama: false,
                    ollama_model: '',
                    generated_content: formattedContent,
                    status: 'completed',
                    folder: 'Tool Outputs',
                    tags: ['tool-generated', toolId.replace(/_/g, '-'), 'beam', ...(gs.platforms || [])],
                    beam_models_used: savedBeamModels,
                    beam_results: result.beamResults || [],
                    global_inputs: gs
                  });
                }

                const resultMessage = {
                  id: Date.now(),
                  role: 'tool',
                  toolResult: result,
                  timestamp: new Date().toISOString(),
                  model: `Beam (${savedBeamModels.length} models)`
                };
                setChatMessages(prev => [...prev, resultMessage]);

                toast({
                  title: "Beam Tool Complete",
                  description: `Saved to Content Library • ${savedBeamModels.length} models compared`
                });
              } else {
                const useOllama = targetMode === 'ollama';
                const ollamaModel = useOllama ? selectedModel : null;
                const result = await executeCreativeTool(toolId, extractedData, useOllama, ollamaModel);

                if (result?.results?.length > 0) {
                  const formattedContent = result.results.map(r => {
                    if (typeof r === 'string') return { content: r };
                    return {
                      content: r.content || r.text || r.idea || r.description || JSON.stringify(r),
                      title: r.title || r.name || r.platform || r.niche,
                      style_notes: r.reasoning || r.match_reason || r.strategy || r.notes,
                      approach: r.hook_type || r.technique,
                      best_for: r.audience_size || r.engagement
                    };
                  });

                  const gs = globalSettingsSnapshot || {};
                  await apiClient.entities.ContentHistory.create({
                    tool_type: toolId,
                    request_prompt: result.prompt || JSON.stringify(extractedData),
                    topic: gs.topic || extractedData?.topic || extractedData?.niche || extractedData?.content?.substring(0, 100) || 'Tool output',
                    tone: gs.tone || extractedData?.tone || '',
                    length: gs.length || '',
                    persona_id: gs.personaId || '',
                    persona_name: gs.personaName || '',
                    template_ids: gs.templateIds || [],
                    custom_instructions: gs.additionalContext || extractedData?.additionalContext || '',
                    use_ollama: useOllama,
                    ollama_model: useOllama ? selectedModel : '',
                    generated_content: formattedContent,
                    status: 'completed',
                    folder: 'Tool Outputs',
                    tags: ['tool-generated', toolId.replace(/_/g, '-'), useOllama ? 'ollama' : 'Second', ...(gs.platforms || [])],
                    global_inputs: gs
                  });
                }
                
                const resultMessage = {
                  id: Date.now(),
                  role: 'tool',
                  toolResult: result,
                  timestamp: new Date().toISOString(),
                  model: useOllama ? selectedModel : 'Second AI'
                };
                setChatMessages(prev => [...prev, resultMessage]);

                toast({
                  title: "Tool Complete",
                  description: `Saved to Content Library • ${result.results?.length || 0} results with ${useOllama ? 'Ollama' : 'Second'}`
                });
              }
            } catch (error) {
              console.error('Tool execution error:', error);
              toast({
                title: "Tool Failed",
                description: error.message,
                variant: "destructive"
              });
            } finally {
              setActiveCreativeTool(null);
              setCreativeToolData(null);
              setIsExecutingTool(false);
            }
          }}
          sessionId={currentSessionId}
        />
      )}

      {/* Creative Tool Executor - Shows loading state */}
      {isExecutingTool && (
        <Card className="border border-purple-300">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Generating...
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              <span className="text-sm text-gray-600">
                Running {activeCreativeTool?.replace('_', ' ')}...
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tool Queue Manager */}
      <ToolQueueManager
        queue={toolQueue}
        onRestartQueue={() => {
          setToolQueue([]);
          setQueueSuggestions([]);
          setCurrentExecutingIndex(-1);
          setIsQueuePaused(false);
          shouldStopQueueRef.current = false;
          toast({
            title: "Queue Reset",
            description: "Tool queue has been cleared"
          });
        }}
        onPauseQueue={() => {
          shouldStopQueueRef.current = true;
          toast({ title: "Pausing...", description: "Queue will pause after current job" });
        }}
        onResumeQueue={() => {
          shouldStopQueueRef.current = false;
          setIsQueuePaused(false);
          document.getElementById('hidden-resume-trigger')?.click();
        }}
        onExecuteQueue={async () => {
          setIsExecutingQueue(true);
          setIsQueuePaused(false);
          shouldStopQueueRef.current = false;
          setQueueSuggestions([]);

          const globalSettings = JSON.parse(localStorage.getItem(`voice_global_tool_inputs_${currentSessionId || 'default'}`) || '{}');
          const maxConcurrent = globalSettings.maxConcurrentProcess || 1;

          const processJob = async (job, jobIndex) => {
            if (job.status !== 'pending') return null;

            setToolQueue(prev => prev.map((q, idx) => 
              idx === jobIndex ? { ...q, status: 'executing' } : q
            ));

            try {
              const result = await executeCreativeTool(
                job.toolId,
                job.inputData,
                job.targetMode === 'ollama',
                job.targetMode === 'ollama' ? selectedModel : null,
                job.targetMode === 'beam' ? JSON.parse(localStorage.getItem('voice_beam_models') || '[]') : [],
                ollamaEndpoint
              );

              setToolQueue(prev => prev.map((q, idx) => 
                idx === jobIndex ? { ...q, status: 'completed', result } : q
              ));

              if (result?.suggestions && Array.isArray(result.suggestions)) {
                setQueueSuggestions(prev => [
                  ...prev,
                  {
                    toolId: job.toolId,
                    suggestions: result.suggestions,
                    timestamp: new Date().toISOString()
                  }
                ]);
              }

              if (result?.results?.length > 0) {
                const formattedContent = result.results.map(r => {
                  if (typeof r === 'string') return { content: r };
                  return {
                    content: r.content || r.text || r.idea || r.description || JSON.stringify(r),
                    title: r.title || r.name || r.platform || r.niche,
                    style_notes: r.reasoning || r.match_reason || r.strategy || r.notes,
                    approach: r.hook_type || r.technique,
                    best_for: r.audience_size || r.engagement
                  };
                });

                const gs = job.globalSettings || {};
                await apiClient.entities.ContentHistory.create({
                  tool_type: job.toolId,
                  request_prompt: result.prompt || JSON.stringify(job.inputData),
                  topic: gs.topic || job.inputData?.topic || job.inputData?.niche || job.inputData?.content?.substring(0, 100) || 'Tool output',
                  tone: gs.tone || job.inputData?.tone || '',
                  length: gs.length || '',
                  persona_id: gs.personaId || '',
                  persona_name: gs.personaName || '',
                  template_ids: gs.templateIds || [],
                  custom_instructions: gs.additionalContext || job.inputData?.additionalContext || '',
                  use_ollama: job.targetMode === 'ollama',
                  ollama_model: job.targetMode === 'ollama' ? selectedModel : '',
                  generated_content: formattedContent,
                  status: 'completed',
                  folder: 'Tool Outputs',
                  tags: ['tool-generated', job.toolId.replace(/_/g, '-'), ...(gs.platforms || [])],
                  global_inputs: gs,
                  ...(job.targetMode === 'beam' && { 
                    beam_models_used: beamModels,
                    beam_results: result.beamResults || []
                  })
                });
              }

              const resultMessage = {
                id: Date.now() + jobIndex,
                role: 'tool',
                toolResult: result,
                timestamp: new Date().toISOString(),
                model: job.targetMode === 'beam' ? `Beam (${job.platforms?.length || 1} platforms)` : job.targetMode
              };
              setChatMessages(prev => [...prev, resultMessage]);

              return { success: true, jobIndex };
            } catch (error) {
              setToolQueue(prev => prev.map((q, idx) => 
                idx === jobIndex ? { ...q, status: 'failed', error: error.message } : q
              ));
              return { success: false, jobIndex, error: error.message };
            }
          };

          const pendingJobs = toolQueue
            .map((job, idx) => ({ job, idx }))
            .filter(({ job }) => job.status === 'pending');

          for (let i = 0; i < pendingJobs.length; i += maxConcurrent) {
            if (shouldStopQueueRef.current) {
              setIsQueuePaused(true);
              setIsExecutingQueue(false);
              toast({
                title: "Queue Paused",
                description: `Processed ${i} of ${pendingJobs.length} jobs`
              });
              return;
            }

            const batch = pendingJobs.slice(i, Math.min(i + maxConcurrent, pendingJobs.length));

            if (batch.length > 0) {
              setCurrentExecutingIndex(batch[0].idx);
            }

            const results = await Promise.allSettled(
              batch.map(({ job, idx }) => processJob(job, idx))
            );

            results.forEach((result, batchIdx) => {
              if (result.status === 'rejected') {
                console.error(`Job ${batch[batchIdx].idx} failed:`, result.reason);
              }
            });
          }

          setIsExecutingQueue(false);
          setCurrentExecutingIndex(-1);

          toast({
            title: "Queue Complete",
            description: `Processed ${toolQueue.length} tool jobs`
          });
        }}
        onClearQueue={() => {
          setToolQueue([]);
          setIsQueuePaused(false);
          shouldStopQueueRef.current = false;
          toast({ title: "Queue Cleared" });
        }}
        onRemoveFromQueue={(id) => {
          setToolQueue(prev => prev.filter(q => q.id !== id));
        }}
        isExecuting={isExecutingQueue}
        isPaused={isQueuePaused}
        currentExecutingIndex={currentExecutingIndex}
      />

      {/* Queue Suggestions - Show after processing */}
      {queueSuggestions.length > 0 && !isExecutingQueue && (
        <Card className="border border-cyan-300 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-cyan-600" />
              Suggestions from Queue ({queueSuggestions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 max-h-[300px] overflow-auto space-y-2">
            {queueSuggestions.map((item, idx) => (
              <div key={idx} className="space-y-1 p-2 bg-cyan-50 rounded border border-cyan-200">
                <p className="text-xs font-medium text-cyan-700">{item.toolId.replace(/_/g, ' ')}</p>
                <div className="space-y-1">
                  {item.suggestions.map((suggestion, sIdx) => (
                    <div key={sIdx} className="text-xs text-gray-600 flex gap-2">
                      <span className="text-cyan-600">•</span>
                      <span>{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      </motion.div>
      )}
    </div>

      {currentUser && (
        <AddPersonaModal
          open={personaModalOpen}
          onOpenChange={setPersonaModalOpen}
          persona={personaDraft}
          onSave={handleSavePersona}
          isSaving={createPersonaMutation.isPending}
        />
      )}

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
            <DialogDescription>
              Give this chat a memorable name
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="chatName">Chat Name</Label>
              <Input
                id="chatName"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && renameChatSession()}
                placeholder="Enter chat name..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </Button>
            <Button onClick={renameChatSession} disabled={!newSessionName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Folder Dialog */}
      <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move to Folder</DialogTitle>
            <DialogDescription>
              Organize your voice chat sessions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Folder</Label>
              <div className="grid grid-cols-2 gap-2">
                {sessionFolders.map(folder => (
                  <Button
                    key={folder}
                    variant="outline"
                    onClick={() => moveSessionToFolder(folderSessionId, folder)}
                    className="justify-start"
                  >
                    <Folder className="w-4 h-4 mr-2" />
                    {folder}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newFolder">Create New Folder</Label>
              <div className="flex gap-2">
                <Input
                  id="newFolder"
                  value={newFolder}
                  onChange={(e) => setNewFolder(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addNewFolder()}
                  placeholder="Enter folder name..."
                />
                <Button onClick={addNewFolder} disabled={!newFolder.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFolderDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Placeholder Dialog */}
      <Dialog open={showPlaceholderDialog} onOpenChange={setShowPlaceholderDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-purple-600" />
              Fill Template Placeholders
            </DialogTitle>
            <DialogDescription>
              Complete the required fields before loading templates into chat
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
                onClick={() => setShowSavePreset(!showSavePreset)}
              >
                <Save className="w-3 h-3 mr-1" />
                Save Current
              </Button>
            </div>

            {showSavePreset && (
              <div className="space-y-2 p-3 bg-white rounded-lg border">
                <Input
                  placeholder="Preset name (e.g., 'Q1 Marketing Campaign')"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                />
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
                  onChange={(e) => setNewPresetDescription(e.target.value)}
                />
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
            )}

            {placeholderPresets.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {placeholderPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className={`flex items-center justify-between p-2 rounded border bg-white hover:bg-blue-50 transition-colors ${
                      selectedPreset?.id === preset.id ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex-1 cursor-pointer" onClick={() => loadPreset(preset)}>
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-3 h-3 text-blue-600" />
                        <span className="text-sm font-medium">{preset.preset_name}</span>
                        <Badge variant="outline" className="text-xs">{preset.preset_type}</Badge>
                      </div>
                      {preset.description && (
                        <p className="text-xs text-gray-600 ml-5">{preset.description}</p>
                      )}
                      <p className="text-xs text-gray-500 ml-5">Used {preset.use_count || 0} times</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(preset);
                        }}
                        title="Toggle favorite"
                      >
                        <Star className={`w-3 h-3 ${preset.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePreset(preset);
                        }}
                        title="Delete preset"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto py-4 space-y-6">
            {pendingTemplatesForInput.map((template) => {
              const templatePlaceholders = template.placeholders || [];
              if (templatePlaceholders.length === 0) return null;
              
              return (
                <div key={template.id} className="space-y-4 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    {template.title}
                  </h3>
                  
                  <div className="space-y-3">
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
                             {`{${placeholder.key.replace(/^\{+|\}+$/g, '').replace(/\{|\}/g, '')}}`}
                           </code>
                          </Label>
                          {placeholder.description && (
                            <p className="text-xs text-gray-600 mb-1">{placeholder.description}</p>
                          )}
                          
                          {fieldType === 'textarea' ? (
                            <Textarea
                              id={`placeholder-${placeholder.key}`}
                              placeholder={placeholder.default || `Enter ${placeholder.label || placeholder.key}...`}
                              value={placeholderValues[placeholder.key] || ''}
                              onChange={(e) => {
                                setPlaceholderValues(prev => ({
                                  ...prev,
                                  [placeholder.key]: e.target.value
                                }));
                                if (error) {
                                  setPlaceholderErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors[placeholder.key];
                                    return newErrors;
                                  });
                                }
                              }}
                              className={`bg-white ${error ? 'border-red-500' : ''}`}
                              rows={3}
                            />
                          ) : fieldType === 'dropdown' ? (
                            <Select
                              value={placeholderValues[placeholder.key] || ''}
                              onValueChange={(value) => {
                                setPlaceholderValues(prev => ({
                                  ...prev,
                                  [placeholder.key]: value
                                }));
                                if (error) {
                                  setPlaceholderErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors[placeholder.key];
                                    return newErrors;
                                  });
                                }
                              }}
                            >
                              <SelectTrigger className={`bg-white ${error ? 'border-red-500' : ''}`}>
                                <SelectValue placeholder={placeholder.default || "Select an option..."} />
                              </SelectTrigger>
                              <SelectContent>
                                {(placeholder.options || []).map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : fieldType === 'checkbox' ? (
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`placeholder-${placeholder.key}`}
                                checked={placeholderValues[placeholder.key] === 'true' || placeholderValues[placeholder.key] === true}
                                onCheckedChange={(checked) => {
                                  setPlaceholderValues(prev => ({
                                    ...prev,
                                    [placeholder.key]: checked.toString()
                                  }));
                                }}
                              />
                              <Label htmlFor={`placeholder-${placeholder.key}`} className="text-sm text-gray-600">
                                {placeholder.default || 'Enable this option'}
                              </Label>
                            </div>
                          ) : (
                            <Input
                              id={`placeholder-${placeholder.key}`}
                              type={fieldType === 'number' ? 'number' : fieldType === 'email' ? 'email' : fieldType === 'url' ? 'url' : fieldType === 'date' ? 'date' : 'text'}
                              placeholder={placeholder.default || `Enter ${placeholder.label || placeholder.key}...`}
                              value={placeholderValues[placeholder.key] || ''}
                              onChange={(e) => {
                                setPlaceholderValues(prev => ({
                                  ...prev,
                                  [placeholder.key]: e.target.value
                                }));
                                if (error) {
                                  setPlaceholderErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors[placeholder.key];
                                    return newErrors;
                                  });
                                }
                              }}
                              onBlur={() => {
                                const validationError = validatePlaceholder(placeholder, placeholderValues[placeholder.key]);
                                if (validationError) {
                                  setPlaceholderErrors(prev => ({
                                    ...prev,
                                    [placeholder.key]: validationError
                                  }));
                                }
                              }}
                              min={placeholder.min}
                              max={placeholder.max}
                              className={`bg-white ${error ? 'border-red-500' : ''}`}
                            />
                          )}
                          
                          {error && (
                            <p className="text-xs text-red-600 flex items-center gap-1">
                              <X className="w-3 h-3" />
                              {error}
                            </p>
                          )}
                          
                          {!error && (fieldType === 'number' && (placeholder.min !== undefined || placeholder.max !== undefined)) && (
                            <p className="text-xs text-gray-500">
                              {placeholder.min !== undefined && placeholder.max !== undefined 
                                ? `Range: ${placeholder.min} - ${placeholder.max}`
                                : placeholder.min !== undefined 
                                ? `Min: ${placeholder.min}` 
                                : `Max: ${placeholder.max}`}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            
            {getAllPlaceholders(pendingTemplatesForInput).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No placeholders to fill</p>
              </div>
            )}
            
            {/* Live Preview */}
            {getAllPlaceholders(pendingTemplatesForInput).length > 0 && (
              <div className="space-y-3 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Live Preview
                </h3>
                <div className="space-y-3">
                  {pendingTemplatesForInput.map(template => {
                    if (!template.placeholders || template.placeholders.length === 0) return null;
                    const preview = applyPlaceholders(template.content, placeholderValues);
                    const hasUnfilled = template.placeholders.some(p => !placeholderValues[p.key]);

                    return (
                      <div key={template.id} className="bg-white p-4 rounded-lg border-2 border-blue-300">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-gray-900">{template.title}</p>
                          {hasUnfilled && (
                            <Badge variant="outline" className="bg-amber-50 border-amber-300 text-amber-700 text-xs">
                              Incomplete
                            </Badge>
                          )}
                        </div>
                        <div className="bg-gray-50 p-3 rounded border max-h-48 overflow-y-auto">
                         <p className="text-sm text-gray-700 whitespace-pre-wrap">
                           {preview.split(/(\{\{?[^}]+\}?\})/).map((part, idx) => {
                             // Match both {placeholder} and {{placeholder}} for highlighting
                             if (part.match(/^\{\{?[^}]+\}?\}$/)) {
                               return (
                                 <span key={idx} className="bg-yellow-100 text-yellow-800 px-1 rounded font-mono text-xs">
                                   {part}
                                 </span>
                               );
                             }
                             return part;
                           })}
                         </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowPlaceholderDialog(false);
                setPlaceholderValues({});
                setPlaceholderErrors({});
                setPendingTemplatesForInput([]);
              }}
            >
              Cancel
            </Button>
            <Button 
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => {
                const errors = validateAllPlaceholders(pendingTemplatesForInput);
                if (Object.keys(errors).length > 0) {
                  setPlaceholderErrors(errors);
                  toast({
                    title: "Validation Failed",
                    description: `Please fix ${Object.keys(errors).length} error${Object.keys(errors).length > 1 ? 's' : ''} before applying`,
                    variant: "destructive"
                  });
                  return;
                }
                
                // Apply placeholders to templates and replace input
                const templatesContent = pendingTemplatesForInput.map(t => {
                  const content = applyPlaceholders(t.content, placeholderValues);
                  return `Template: ${t.title}\nCategory: ${t.category}\n\n${content}`;
                }).join('\n\n---\n\n');
                
                setChatInput(templatesContent);
                setShowPlaceholderDialog(false);
                setPlaceholderErrors({});
                setPendingTemplatesForInput([]);
                
                // Store filled placeholder values for this session
                localStorage.setItem(`voice_template_placeholders_${currentSessionId}`, JSON.stringify(placeholderValues));
                
                toast({
                  title: "Templates Loaded",
                  description: `Replaced input with ${pendingTemplatesForInput.length} filled template${pendingTemplatesForInput.length > 1 ? 's' : ''}`
                });
              }}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Load Templates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Chat Modal */}
      <ShareChatModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        session={chatSessions.find(s => s.id === shareSessionId)}
        onUpdate={loadChatSessionsFromDB}
      />

      {/* Pause Detection Dialog */}
      <Dialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pause className="w-5 h-5 text-orange-600" />
              Pause Detected
            </DialogTitle>
            <DialogDescription>
              You paused while speaking. What would you like to do?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
              <p className="text-sm text-gray-700 italic">"{pausedTranscript}"</p>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button 
              variant="outline" 
              onClick={handleDiscardPause}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Discard
            </Button>
            <Button 
              variant="outline"
              onClick={handleContinueListening}
              className="flex-1"
            >
              <Mic className="w-4 h-4 mr-2" />
              Continue
            </Button>
            <Button 
              onClick={handleCommitPause}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600"
            >
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Beam Chat Dialog */}
      <Dialog open={showBeamChat} onOpenChange={setShowBeamChat}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <BeamChat
            prompt={beamPrompt}
            selectedModels={beamModels}
            endpoint={ollamaEndpoint}
            onSaveToContent={async (response) => {
              try {
                await apiClient.entities.ContentHistory.create({
                  tool_type: 'beam_chat',
                  topic: beamPrompt.substring(0, 100),
                  beam_results: [{
                    model: response.model,
                    response: response.content,
                    status: 'completed',
                    timestamp: new Date().toISOString(),
                    tokens: response.tokens || { prompt: 0, response: 0 },
                    score: response.score || 0
                  }],
                  beam_models_used: [response.model],
                  generated_content: [{ content: response.content }]
                });
                
                toast({
                  title: "Saved to Content",
                  description: `Response from ${response.model} saved (Score: ${response.score || 0})`
                });
              } catch (error) {
                toast({
                  title: "Save Failed",
                  description: error.message,
                  variant: "destructive"
                });
              }
            }}
            onResponseSelect={(response, allResponses) => {
              // Store all beam responses for later summarization
              setLastBeamResponses(allResponses.filter(r => !r.error));

              // Add the selected response to chat
              const userMessage = {
                id: Date.now(),
                role: 'user',
                content: beamPrompt,
                timestamp: new Date().toISOString()
              };
              const assistantMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                content: response.content,
                timestamp: new Date().toISOString(),
                model: response.model
              };
              setChatMessages(prev => [...prev, userMessage, assistantMessage]);
              setShowBeamChat(false);
              setBeamPrompt("");
              toast({
                title: "Response Selected",
                description: `Continuing chat with ${response.model}'s response`
              });
            }}
            onMerge={async (selectedResponses, mergeStrategy, allBeamResponses) => {
              // Store ALL beam responses (not just selected) for summarizer
              setLastBeamResponses(allBeamResponses.filter(r => !r.error));

              // Merge selected responses using AI
              const responsesText = selectedResponses.map(r => 
                `[${r.model}]\n${r.content}`
              ).join('\n\n---\n\n');

              let mergePrompt = '';
              switch (mergeStrategy) {
                case 'fusion':
                  mergePrompt = `Analyze these ${selectedResponses.length} AI responses and create a single, coherent answer that combines the best insights from each:\n\n${responsesText}\n\nProvide a unified, comprehensive response that leverages the strengths of each perspective.`;
                  break;
                case 'checklist':
                  mergePrompt = `Create a pros/cons checklist comparing these ${selectedResponses.length} AI responses:\n\n${responsesText}\n\nProvide a structured comparison highlighting strengths and weaknesses of each approach.`;
                  break;
                case 'compare':
                  mergePrompt = `Create a side-by-side comparison of these ${selectedResponses.length} AI responses:\n\n${responsesText}\n\nHighlight key differences, similarities, and unique insights from each.`;
                  break;
                case 'custom':
                  mergePrompt = `Synthesize these ${selectedResponses.length} AI responses into a cohesive answer:\n\n${responsesText}\n\nCreate a balanced response that addresses all key points raised.`;
                  break;
              }

              const { data: mergedContent } = await apiClient.functions.invoke('invokeLLMWithLogging', {
                prompt: mergePrompt,
                source_tool: 'beam_merge',
                request_metadata: { 
                  strategy: mergeStrategy,
                  response_count: selectedResponses.length 
                }
              });

              const userMessage = {
                id: Date.now(),
                role: 'user',
                content: beamPrompt,
                timestamp: new Date().toISOString()
              };
              const assistantMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                content: `🔀 Merged Response (${mergeStrategy})\n\n${mergedContent}`,
                timestamp: new Date().toISOString(),
                model: `Beam Merge (${selectedResponses.length} models)`
              };
              setChatMessages(prev => [...prev, userMessage, assistantMessage]);
              setShowBeamChat(false);
              setBeamPrompt("");
              
              toast({
                title: "Responses Merged",
                description: `Combined insights from ${selectedResponses.length} AI models`
              });
            }}
            onCancel={() => {
              setShowBeamChat(false);
              setBeamPrompt("");
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Tag Dialog */}
      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Tags</DialogTitle>
            <DialogDescription>
              Add tags to categorize and search conversations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Tags</Label>
              <div className="flex flex-wrap gap-2">
                {chatSessions.find(s => s.id === tagSessionId)?.tags?.length > 0 ? (
                  chatSessions.find(s => s.id === tagSessionId).tags.map((tag, idx) => (
                    <Badge key={idx} className="pl-2.5 pr-1 py-1 bg-purple-100 text-purple-700">
                      #{tag}
                      <button
                        onClick={() => removeTagFromSession(tagSessionId, tag)}
                        className="ml-1.5 hover:bg-purple-300 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No tags yet</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newTag">Add New Tag</Label>
              <div className="flex gap-2">
                <Input
                  id="newTag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newTag.trim()) {
                      addTagToSession(tagSessionId, newTag);
                      setNewTag('');
                    }
                  }}
                  placeholder="e.g., meeting, research, brainstorm..."
                />
                <Button 
                  onClick={() => {
                    if (newTag.trim()) {
                      addTagToSession(tagSessionId, newTag);
                      setNewTag('');
                    }
                  }} 
                  disabled={!newTag.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowTagDialog(false);
              setNewTag('');
            }}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
