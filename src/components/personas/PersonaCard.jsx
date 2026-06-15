import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Star,
  Users,
  Eye,
  Sparkles,
  MessageSquare,
  Lightbulb,
  CheckCircle2,
  Copy,
  Info,
  Wand2,
  Loader2,
  Plus,
  BookOpen,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Type,
  Zap,
  Share2,
  TestTube,
  Send,
  Clock
} from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { client } from "@/apis/client";
import { Checkbox } from "@/components/ui/checkbox";
import PersonaChatSession from './PersonaChatSession';

export default function PersonaCard({ persona, onEdit, onDelete, onToggleFavorite, onUpdate, currentUserEmail, currentUser, onSelect, isSelected }) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isGeneratingExamples, setIsGeneratingExamples] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showTalkPicker, setShowTalkPicker] = useState(false);
  const [talkQuestions, setTalkQuestions] = useState([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [showChatSession, setShowChatSession] = useState(false);
  const [chatInitialQuestion, setChatInitialQuestion] = useState('');
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testResponse, setTestResponse] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testError, setTestError] = useState(null);
  const [testHistory, setTestHistory] = useState([]);
  const [customTestMessage, setCustomTestMessage] = useState('');
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [loadingModels, setLoadingModels] = useState(false);
  const [ollamaEndpoints, setOllamaEndpoints] = useState([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState('');
  const [endpointStatus, setEndpointStatus] = useState({});
  const isOwner = persona.created_by === currentUserEmail;
  
  // No need to fetch currentUser here - it's passed as prop from parent

  // Generate sample questions based on persona
  const getPersonaSampleQuestions = () => {
    // Use persona's example_prompts if available
    if (persona.example_prompts && persona.example_prompts.length > 0) {
      return persona.example_prompts;
    }
    
    // Generate questions based on category and expertise
    const categoryQuestions = {
      Business: [
        `How would you approach a strategic business challenge?`,
        `What's your advice on improving team productivity?`,
        `Help me create a business proposal outline`
      ],
      Creative: [
        `Can you help me brainstorm creative ideas?`,
        `What's your approach to overcoming creative blocks?`,
        `Help me develop a unique concept`
      ],
      Technical: [
        `Explain a complex technical concept simply`,
        `What best practices do you recommend?`,
        `Help me troubleshoot this technical issue`
      ],
      Education: [
        `How would you explain this topic to a beginner?`,
        `Create a learning plan for me`,
        `What are the key concepts I should understand?`
      ],
      Health: [
        `What wellness advice can you offer?`,
        `Help me create a healthy routine`,
        `What should I know about maintaining balance?`
      ],
      Finance: [
        `What financial strategies do you recommend?`,
        `Help me understand investment basics`,
        `How should I approach budgeting?`
      ],
      Legal: [
        `What should I consider from a legal perspective?`,
        `Explain this legal concept in simple terms`,
        `What are the key compliance considerations?`
      ],
      Marketing: [
        `How would you approach this marketing challenge?`,
        `Help me craft a compelling message`,
        `What marketing strategies work best?`
      ],
      Sales: [
        `How can I improve my sales approach?`,
        `Help me handle objections effectively`,
        `What's your advice on building client relationships?`
      ],
      Custom: [
        `What can you help me with today?`,
        `Tell me about your expertise`,
        `How would you approach this challenge?`
      ]
    };
    
    return categoryQuestions[persona.category] || categoryQuestions.Custom;
  };

  const getSampleQuestion = () => {
    return 'What can you do for me?';
  };

  // Get Ollama endpoints from localStorage - matches OllamaSettingsCard
  const getOllamaEndpoints = () => {
    try {
      const stored = localStorage.getItem('ollama_endpoints');
      if (stored) {
        const endpoints = JSON.parse(stored);
        if (Array.isArray(endpoints) && endpoints.length > 0) {
          return endpoints;
        }
      }
    } catch (error) {
      console.error('Error reading Ollama endpoints:', error);
    }
    return ['https://christy-ramentaceous-verbatim.ngrok-free.dev'];
  };

  const getDefaultModel = () => {
    try {
      return localStorage.getItem('ollama_default_model') || 'llama3.2';
    } catch {
      return 'llama3.2';
    }
  };

  // Load test history from localStorage, fetch models, and check endpoint status
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`persona_test_history_${persona.id}`);
      if (stored) {
        setTestHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading test history:', error);
    }
    // Set initial model
    setSelectedModel(getDefaultModel());
    // Load endpoints
    const endpoints = getOllamaEndpoints();
    setOllamaEndpoints(endpoints);
    if (endpoints.length > 0) {
      setSelectedEndpoint(endpoints[0]);
    }
  }, [persona.id]);

  // Check endpoint status
  const checkEndpointStatus = async (endpoints) => {
    const status = {};
    for (const endpoint of endpoints) {
      try {
        const res = await fetch(`${endpoint}/v1/models`);
        status[endpoint] = res.ok ? 'online' : 'offline';
      } catch { status[endpoint] = 'offline'; }
    }
    setEndpointStatus(status);
  };

  const fetchAvailableModels = async (endpoint) => {
    const ep = endpoint || selectedEndpoint || ollamaEndpoints[0];
    if (!ep) return;
    setLoadingModels(true);
    try {
      const res = await fetch(`${ep}/v1/models`);
      const data = await res.json();
      setAvailableModels((data.data || []).map(m => ({ name: m.id })));
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally { setLoadingModels(false); }
  };

  const saveTestToHistory = async (userMessage, response) => {
    const modelUsed = selectedModel || getDefaultModel();
    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      userMessage,
      response,
      model: modelUsed,
      user_email: currentUserEmail,
      user_name: currentUser?.full_name || currentUserEmail
    };
    const updated = [newEntry, ...testHistory].slice(0, 10); // Keep last 10
    setTestHistory(updated);
    localStorage.setItem(`persona_test_history_${persona.id}`, JSON.stringify(updated));

    // Also save to database
    try {
      await client.entities.TestHistory.create({
        item_type: 'persona',
        item_id: persona.id,
        item_name: persona.name,
        user_email: currentUserEmail,
        user_name: currentUser?.full_name || currentUserEmail,
        user_message: userMessage,
        response,
        model: modelUsed,
        endpoint: selectedEndpoint
      });
    } catch (error) {
      console.error('Error saving test to database:', error);
    }
  };

  const clearTestHistory = () => {
    setTestHistory([]);
    localStorage.removeItem(`persona_test_history_${persona.id}`);
  };

  const handleTestPersona = async (customMessage) => {
    const endpoint = selectedEndpoint || ollamaEndpoints[0];
    if (!endpoint) {
      setTestError('No Ollama endpoint configured. Go to Settings > Ollama to add one.');
      return;
    }

    setIsTesting(true);
    setTestError(null);
    setTestResponse('');

    const systemPrompt = `You are ${persona.name}. ${persona.description || ''}\n\n${persona.instructions || ''}`;
    const userMessage = customMessage || getSampleQuestion();
    const modelToUse = selectedModel || getDefaultModel();

    try {
      const chatRes = await fetch(`${endpoint}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelToUse, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }], stream: false }),
      });
      if (!chatRes.ok) throw new Error(`Server error: ${chatRes.status}`);
      const chatData = await chatRes.json();
      const fullResponse = chatData?.choices?.[0]?.message?.content || 'No response received';
      setTestResponse(fullResponse);
      saveTestToHistory(userMessage, fullResponse);
      setCustomTestMessage('');
    } catch (error) {
      console.error('Ollama test error:', error);
      setTestError(error.message || 'Failed to connect to Ollama. Make sure it is running.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleOpenTalk = async () => {
    setShowTalkPicker(true);
    setTalkQuestions([]);
    setIsGeneratingQuestions(true);
    const ep = selectedEndpoint || ollamaEndpoints[0];
    try {
      const res = await fetch(`${ep}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel || getDefaultModel(),
          messages: [
            {
              role: 'system',
              content: 'You are an expert at testing AI personas. Return ONLY valid JSON with a "questions" array of exactly 10 strings — no markdown, no explanation.'
            },
            {
              role: 'user',
              content: `Based on the following persona, generate exactly 10 diverse test questions that challenge and reveal its capabilities.

Persona Name: ${persona.name}
Description: ${persona.description}
Instructions: ${persona.instructions || 'N/A'}
Expertise Areas: ${persona.expertise_areas?.join(', ') || 'General'}
Tone: ${persona.tone}

Generate 10 specific, varied questions that:
1. Test the persona's core expertise
2. Cover different difficulty levels
3. Are directly aligned with the instructions
4. Would produce distinct, revealing answers

Return ONLY this JSON: {"questions": ["question1", "question2", ..., "question10"]}`
            }
          ],
          stream: false
        })
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || '';
      // Extract JSON even if model wraps it in markdown
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      setTalkQuestions(parsed.questions || []);
    } catch (error) {
      setTalkQuestions([]);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(persona, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateExamples = async () => {
    setIsGeneratingExamples(true);
    setGenerationError(null);
    const ep = selectedEndpoint || ollamaEndpoints[0];
    try {
      const res = await fetch(`${ep}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel || getDefaultModel(),
          messages: [
            {
              role: 'system',
              content: 'You are an expert AI persona designer. Return ONLY valid JSON with an "examples" array of exactly 5 strings — no markdown, no explanation.'
            },
            {
              role: 'user',
              content: `Generate 5 diverse, high-quality example prompts for the following persona.

Persona Name: ${persona.name}
Description: ${persona.description}
Category: ${persona.category}
Tone: ${persona.tone}
Expertise Areas: ${persona.expertise_areas?.join(', ') || 'General'}
Instructions: ${persona.instructions || 'N/A'}

Each prompt should showcase the persona's expertise, be specific and actionable.

Return ONLY this JSON: {"examples": ["prompt1", "prompt2", "prompt3", "prompt4", "prompt5"]}`
            }
          ],
          stream: false
        })
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      if (parsed.examples?.length > 0 && onUpdate) {
        await onUpdate(persona.id, { example_prompts: parsed.examples });
      }
    } catch (error) {
      console.error('Error generating examples:', error);
      setGenerationError(error.message || 'Failed to generate examples. Please try again.');
    } finally {
      setIsGeneratingExamples(false);
    }
  };

  const hasVoiceProfile = persona.voice_profile && Object.keys(persona.voice_profile).length > 0;
  const hasGuidelines = hasVoiceProfile && (persona.voice_profile.dos?.length > 0 || persona.voice_profile.donts?.length > 0);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="h-full relative"
      >
        {onSelect && (
            <div className="absolute top-2 right-2 z-10">
                <Checkbox 
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelect(persona.id, checked)}
                    className="w-5 h-5"
                />
            </div>
        )}
        <Card className="h-full flex flex-col hover:shadow-xl transition-all duration-300 border-l-4 border-l-purple-400 bg-white group">
          <CardHeader className="pb-3 flex-1 pt-8">
            <div className="flex items-start gap-4 h-full">
              {/* Avatar/Icon */}
              <div
                className={`w-14 h-14 flex-shrink-0 rounded-xl bg-gradient-to-r ${persona.color} flex items-center justify-center text-2xl shadow-md`}
              >
                {persona.icon}
              </div>

              {/* Main Content - Name, Description, Badges */}
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-1">
                    {persona.name}
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(persona);
                    }}
                    className="h-7 w-7 flex-shrink-0"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        persona.is_favorite
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-400'
                      }`}
                    />
                  </Button>
                </div>

                {/* Fixed height description */}
                <p className="text-sm text-gray-600 line-clamp-2 mb-3 h-10">
                  {persona.description}
                </p>

                {/* Category, Tags, and Status - Fixed height row */}
                <div className="flex flex-wrap gap-1.5 mb-3 min-h-[24px]">
                  {/* Show only first category */}
                  <Badge variant="outline" className="text-xs h-6">
                    {persona.category}
                  </Badge>

                  {persona.is_public && (
                    <Badge className="bg-green-600 text-xs h-6">
                      <Users className="w-3 h-3 mr-1" />
                      Public
                    </Badge>
                  )}
                  


                  {/* Show only first tag with count */}
                  {persona.tags && persona.tags.length > 0 && (
                    <>
                      <Badge variant="secondary" className="text-xs h-6">
                        #{persona.tags[0]}
                      </Badge>
                      {persona.tags.length > 1 && (
                        <Badge variant="secondary" className="text-xs h-6">
                          +{persona.tags.length - 1}
                        </Badge>
                      )}
                    </>
                  )}

                  {/* Show first expertise area with count */}
                  {persona.expertise_areas && persona.expertise_areas.length > 0 && (
                    <>
                      <Badge className="bg-indigo-100 text-indigo-800 text-xs h-6">
                        {persona.expertise_areas[0]}
                      </Badge>
                      {persona.expertise_areas.length > 1 && (
                        <Badge className="bg-indigo-100 text-indigo-800 text-xs h-6">
                          +{persona.expertise_areas.length - 1}
                        </Badge>
                      )}
                    </>
                  )}
                </div>

                {/* Meta Info - Fixed height */}
                <div className="flex items-center gap-3 text-xs text-gray-500 h-4">
                  {(persona.creator_name || persona.created_by) && (
                      <span className="truncate">By {persona.creator_name || persona.created_by.split('@')[0]}</span>
                  )}
                  {persona.use_count > 0 && (
                    <span>• Used {persona.use_count}×</span>
                  )}
                  {persona.example_prompts && persona.example_prompts.length > 0 && (
                    <span>• {persona.example_prompts.length} examples</span>
                  )}
                  {hasVoiceProfile && (
                    <span>• Voice profile</span>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0 pb-4">
            {/* Compact Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleOpenTalk}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                size="sm"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Talk
              </Button>
              <Button
                onClick={() => setShowDetails(true)}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                size="sm"
              >
                <Eye className="w-4 h-4 mr-2" />
                Details
              </Button>

              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="px-3">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {/* Test with Ollama */}
                  <DropdownMenuItem onClick={() => { setShowTestDialog(true); fetchAvailableModels(); checkEndpointStatus(ollamaEndpoints); }}>
                    {testHistory.length > 0 && (
                      <Badge variant="secondary" className="ml-auto text-xs">{testHistory.length}</Badge>
                    )}
                    <TestTube className="w-4 h-4 mr-2" />
                    Test with Ollama
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {/* Share option */}
                  <DropdownMenuItem onClick={() => setShowShareModal(true)}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </DropdownMenuItem>
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

                  {isOwner && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEdit(persona)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(persona.id)} className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Enhanced Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-2">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${persona.color} flex items-center justify-center text-4xl shadow-lg`}>
                {persona.icon}
              </div>
              <div className="flex-1">
                <DialogTitle className="text-2xl">{persona.name}</DialogTitle>
                <p className="text-gray-600">{persona.description}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                title="Copy entire persona as JSON"
              >
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
              </Button>
            </div>
          </DialogHeader>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">
                <BookOpen className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="examples">
                <Lightbulb className="w-4 h-4 mr-2" />
                Examples
              </TabsTrigger>
              <TabsTrigger value="voice">
                <MessageSquare className="w-4 h-4 mr-2" />
                Voice Profile
              </TabsTrigger>
              <TabsTrigger value="guidelines">
                <Zap className="w-4 h-4 mr-2" />
                Guidelines
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Instructions</h3>
                </div>
                <p className="text-sm text-gray-700">{persona.instructions}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Category</h3>
                  <Badge className="bg-purple-600">{persona.category}</Badge>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Tone</h3>
                  <Badge variant="outline">{persona.tone}</Badge>
                </div>
              </div>

              {persona.expertise_areas && persona.expertise_areas.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Expertise Areas</h3>
                  <div className="flex flex-wrap gap-2">
                    {persona.expertise_areas.map((area, idx) => (
                      <Badge key={idx} variant="secondary">{area}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {persona.tags && persona.tags.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {persona.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline">#{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="examples" className="space-y-4 mt-4">
              {/* AI Generation Section */}
              {isOwner && (!persona.example_prompts || persona.example_prompts.length === 0) && (
                <Alert className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <AlertDescription className="ml-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-purple-900 mb-1">
                          No examples yet! Let AI help you.
                        </p>
                        <p className="text-sm text-purple-800">
                          Generate smart example prompts based on this persona's expertise and description.
                        </p>
                      </div>
                      <Button
                        onClick={handleGenerateExamples}
                        disabled={isGeneratingExamples}
                        size="sm"
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 flex-shrink-0"
                      >
                        {isGeneratingExamples ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4 mr-2" />
                            Generate Examples
                          </>
                        )}
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {generationError && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {generationError}
                  </AlertDescription>
                </Alert>
              )}

              {persona.example_prompts && persona.example_prompts.length > 0 ? (
                <>
                  {/* Header with regenerate button */}
                  <div className="flex items-center justify-between">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-green-600" />
                        <h3 className="font-semibold text-gray-900">Example Use Cases</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        These examples show how to effectively use this persona with the AI Content Generator.
                      </p>
                    </div>
                    {isOwner && (
                      <Button
                        onClick={handleGenerateExamples}
                        disabled={isGeneratingExamples}
                        variant="outline"
                        size="sm"
                        className="ml-3"
                      >
                        {isGeneratingExamples ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Regenerating...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4 mr-2" />
                            Regenerate
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {persona.example_prompts.map((prompt, idx) => (
                      <div key={idx} className="border-l-4 border-purple-500 pl-4 py-2 bg-purple-50 rounded-r-lg">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-800 leading-relaxed">{prompt}</p>
                            <div className="mt-2 flex gap-2">
                              <Badge variant="outline" className="text-xs">Use with AI Generator</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-1">Pro Tip</h4>
                        <p className="text-sm text-blue-800">
                          Copy any example above and paste it into the AI Content Generator's topic field. Select this persona to ensure the content matches this voice and style perfectly.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : !isOwner && (
                <div className="text-center py-8 text-gray-500">
                  <Lightbulb className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No example scenarios available for this persona yet.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="voice" className="space-y-4 mt-4">
              {hasVoiceProfile ? (
                <>
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-semibold text-gray-900">Complete Voice Profile</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Comprehensive guidelines for maintaining consistent voice, tone, and style when writing as this persona.
                    </p>
                  </div>

                  {/* Personality Summary */}
                  {persona.voice_profile.personality_summary && (
                    <div className="bg-white p-4 rounded-lg border-2 border-purple-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Info className="w-5 h-5 text-purple-600" />
                        <h4 className="font-semibold text-gray-900">Personality Summary</h4>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{persona.voice_profile.personality_summary}</p>
                    </div>
                  )}

                  {/* Vocabulary Section - Enhanced */}
                  {persona.voice_profile.vocabulary && persona.voice_profile.vocabulary.length > 0 && (
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Type className="w-5 h-5 text-indigo-600" />
                        <h4 className="font-semibold text-gray-900">Preferred Vocabulary</h4>
                      </div>
                      <p className="text-xs text-indigo-700 mb-3">
                        Words and phrases that align with this persona's communication style
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {persona.voice_profile.vocabulary.map((word, idx) => (
                          <Badge key={idx} className="bg-indigo-600 text-white text-xs">
                            {word}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sentence Patterns - Enhanced */}
                  {persona.voice_profile.sentence_patterns && persona.voice_profile.sentence_patterns.length > 0 && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="w-5 h-5 text-green-600" />
                        <h4 className="font-semibold text-gray-900">Preferred Sentence Structures</h4>
                      </div>
                      <p className="text-xs text-green-700 mb-3">
                        Sentence patterns that reflect this persona's writing style
                      </p>
                      <div className="space-y-2">
                        {persona.voice_profile.sentence_patterns.map((pattern, idx) => (
                          <div key={idx} className="flex items-start gap-3 bg-white p-3 rounded border border-green-200">
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm text-gray-800 font-medium">{pattern}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Example Phrases */}
                  {persona.voice_profile.example_phrases && persona.voice_profile.example_phrases.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-3">
                        <MessageSquare className="w-5 h-5 text-purple-600" />
                        <h4 className="font-semibold text-gray-900">Signature Phrases</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {persona.voice_profile.example_phrases.map((phrase, idx) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-700 italic">"{phrase}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Style Traits */}
                  {persona.voice_profile.style_traits && persona.voice_profile.style_traits.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-amber-600" />
                        <h4 className="font-semibold text-gray-900">Communication Style Traits</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {persona.voice_profile.style_traits.map((trait, idx) => (
                          <Badge key={idx} variant="outline" className="border-amber-300 text-amber-800">
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tone Recommendation */}
                  {persona.voice_profile.tone_recommendation && (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-5 h-5 text-yellow-600" />
                        <h4 className="font-semibold text-yellow-900">Tone Recommendation</h4>
                      </div>
                      <p className="text-sm text-yellow-800 mb-3">
                        <strong>Primary Tone:</strong> {persona.voice_profile.tone_recommendation.primary_tone}
                      </p>
                      {persona.voice_profile.tone_recommendation.modifiers && persona.voice_profile.tone_recommendation.modifiers.length > 0 && (
                        <div>
                          <p className="text-xs text-yellow-700 mb-2 font-medium">Tone Modifiers:</p>
                          <div className="flex flex-wrap gap-2">
                            {persona.voice_profile.tone_recommendation.modifiers.map((mod, idx) => (
                              <Badge key={idx} className="bg-yellow-200 text-yellow-900">{mod}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {persona.voice_profile.tone_recommendation.adjustment_rules && persona.voice_profile.tone_recommendation.adjustment_rules.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-yellow-200">
                          <p className="text-xs text-yellow-700 mb-2 font-medium">Adjustment Rules:</p>
                          <ul className="space-y-1">
                            {persona.voice_profile.tone_recommendation.adjustment_rules.map((rule, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-yellow-800">
                                <span className="text-yellow-600">→</span>
                                <span>{rule}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No voice profile configured yet</p>
                  <p className="text-sm">Edit this persona to add detailed voice profile settings</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="guidelines" className="space-y-4 mt-4">
              {hasGuidelines ? (
                <>
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-lg border border-emerald-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-emerald-600" />
                      <h3 className="font-semibold text-gray-900">Writing Guidelines</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Essential do's and don'ts to maintain consistency and quality when writing as this persona.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Do's Section - Enhanced */}
                    {persona.voice_profile.dos && persona.voice_profile.dos.length > 0 && (
                      <div className="bg-green-50 p-5 rounded-xl border-2 border-green-200">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="bg-green-600 rounded-full p-2">
                            <ThumbsUp className="w-5 h-5 text-white" />
                          </div>
                          <h4 className="font-bold text-green-900 text-lg">Do's</h4>
                        </div>
                        <ul className="space-y-3">
                          {persona.voice_profile.dos.map((item, idx) => (
                            <motion.li
                              key={idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="flex items-start gap-3 bg-white p-3 rounded-lg border border-green-200"
                            >
                              <span className="text-green-600 font-bold text-xl flex-shrink-0">✓</span>
                              <span className="text-sm text-green-900 leading-relaxed">{item}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Don'ts Section - Enhanced */}
                    {persona.voice_profile.donts && persona.voice_profile.donts.length > 0 && (
                      <div className="bg-red-50 p-5 rounded-xl border-2 border-red-200">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="bg-red-600 rounded-full p-2">
                            <ThumbsDown className="w-5 h-5 text-white" />
                          </div>
                          <h4 className="font-bold text-red-900 text-lg">Don'ts</h4>
                        </div>
                        <ul className="space-y-3">
                          {persona.voice_profile.donts.map((item, idx) => (
                            <motion.li
                              key={idx}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="flex items-start gap-3 bg-white p-3 rounded-lg border border-red-200"
                            >
                              <span className="text-red-600 font-bold text-xl flex-shrink-0">✗</span>
                              <span className="text-sm text-red-900 leading-relaxed">{item}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Quick Reference Card */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-2">Quick Reference</h4>
                        <p className="text-sm text-blue-800 leading-relaxed">
                          These guidelines help maintain consistency across all content created with this persona.
                          Following these rules ensures authentic, on-brand communication that resonates with your audience.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No writing guidelines configured yet</p>
                  <p className="text-sm">Edit this persona to add do's and don'ts for better writing guidance</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>



      {/* Talk Question Picker Dialog */}
      <Dialog open={showTalkPicker} onOpenChange={setShowTalkPicker}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${persona.color} flex items-center justify-center text-2xl flex-shrink-0`}>
                {persona.icon}
              </div>
              <div>
                <DialogTitle className="text-lg">{persona.name}</DialogTitle>
                <p className="text-sm text-gray-500">Pick a question or write your own</p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3">
            {isGeneratingQuestions ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                <p className="text-sm">Generating test questions from persona instructions...</p>
              </div>
            ) : talkQuestions.length > 0 ? (
              <>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">10 Generated Questions</p>
                <ol className="space-y-2">
                  {talkQuestions.map((q, idx) => (
                    <li key={idx}>
                      <button
                        className="w-full text-left flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 transition-colors group"
                        onClick={() => {
                          setChatInitialQuestion(q);
                          setShowTalkPicker(false);
                          setShowChatSession(true);
                        }}
                      >
                        <span className="w-6 h-6 flex-shrink-0 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                          {idx + 1}
                        </span>
                        <span className="text-sm text-gray-700 leading-relaxed">{q}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">Could not generate questions. You can still open the chat below.</p>
            )}

            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                onClick={() => setShowTalkPicker(false)}
              >
                Cancel
              </Button>
              {talkQuestions.length > 0 && (
                <Button
                  variant="outline"
                  className="flex-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => {
                    setChatInitialQuestion('');
                    setShowTalkPicker(false);
                    setShowChatSession(true);
                  }}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send All to Session
                </Button>
              )}
              <Button
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                onClick={() => {
                  setCustomTestMessage('');
                  setShowTalkPicker(false);
                  setShowTestDialog(true);
                  fetchAvailableModels();
                  checkEndpointStatus(ollamaEndpoints);
                }}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Open Chat
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* OpenAI-style Chat Session */}
      <PersonaChatSession
        open={showChatSession}
        onOpenChange={setShowChatSession}
        persona={persona}
        initialQuestion={chatInitialQuestion}
        allQuestions={talkQuestions.length > 0 ? talkQuestions : undefined}
        endpoint={selectedEndpoint || ollamaEndpoints[0]}
        model={selectedModel}
      />

      {/* Ollama Test Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${persona.color} flex items-center justify-center text-2xl`}>
                {persona.icon}
              </div>
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <TestTube className="w-5 h-5 text-purple-600" />
                  Test: {persona.name}
                </DialogTitle>
                <p className="text-sm text-gray-500">Testing persona response with Ollama</p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* System Prompt Preview */}
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
              <p className="text-xs font-medium text-purple-700 mb-1">System Prompt:</p>
              <p className="text-sm text-purple-900">
                You are {persona.name}. {persona.description?.slice(0, 100)}{persona.description?.length > 100 ? '...' : ''}
              </p>
            </div>

            {/* Endpoint Selection */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-700 mb-2">Endpoint:</p>
              <Select 
                value={selectedEndpoint} 
                onValueChange={(ep) => { 
                  setSelectedEndpoint(ep); 
                  fetchAvailableModels(ep); 
                }}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select endpoint" />
                </SelectTrigger>
                <SelectContent>
                  {ollamaEndpoints.map((endpoint) => (
                    <SelectItem key={endpoint} value={endpoint}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          endpointStatus[endpoint] === 'online' ? 'bg-green-500' : 
                          endpointStatus[endpoint] === 'offline' ? 'bg-red-500' : 'bg-gray-300'
                        }`} />
                        <span className="truncate max-w-[200px]">{endpoint}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Model Selection */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-700 mb-2">Model:</p>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
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
                    <SelectItem value={selectedModel || getDefaultModel()}>
                      {selectedModel || getDefaultModel()}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {loadingModels && (
                <p className="text-xs text-gray-500 mt-1">Loading models...</p>
              )}
            </div>

            {/* Custom User Message Input */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-xs font-medium text-blue-700 mb-2">User Message:</p>
              <div className="flex gap-2">
                <Input
                  placeholder={getSampleQuestion()}
                  value={customTestMessage}
                  onChange={(e) => setCustomTestMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isTesting) {
                      handleTestPersona(customTestMessage || getSampleQuestion());
                    }
                  }}
                  className="flex-1 bg-white"
                />
                <Button
                  size="sm"
                  onClick={() => handleTestPersona(customTestMessage || getSampleQuestion())}
                  disabled={isTesting}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              {/* Persona example prompts */}
              {persona.example_prompts && persona.example_prompts.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-blue-600 mb-1">Persona examples:</p>
                  <div className="flex flex-wrap gap-1">
                    {persona.example_prompts.slice(0, 4).map((q, idx) => (
                      <Button
                        key={idx}
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-blue-700 hover:bg-blue-100 px-2"
                        onClick={() => setCustomTestMessage(q)}
                      >
                        {q.length > 35 ? q.slice(0, 35) + '...' : q}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {/* Fallback sample questions if no examples */}
              {(!persona.example_prompts || persona.example_prompts.length === 0) && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {getPersonaSampleQuestions().slice(0, 3).map((q, idx) => (
                    <Button
                      key={idx}
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-blue-700 hover:bg-blue-100 px-2"
                      onClick={() => setCustomTestMessage(q)}
                    >
                      {q.length > 40 ? q.slice(0, 40) + '...' : q}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Response Area */}
            <div id="persona-test-response" className="bg-gray-50 rounded-lg border border-gray-200 min-h-[200px]">
              <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                <p className="text-xs font-medium text-gray-700">Response:</p>
                <div className="flex items-center gap-2">
                  {testResponse && !isTesting && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => {
                        navigator.clipboard.writeText(testResponse);
                      }}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  )}
                  {isTesting && (
                    <Badge variant="secondary" className="text-xs">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Generating...
                    </Badge>
                  )}
                </div>
              </div>
              <ScrollArea className="h-[200px] p-3">
                {testError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>{testError}</AlertDescription>
                  </Alert>
                ) : testResponse ? (
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{testResponse}</p>
                ) : isTesting ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center">Response will appear here...</p>
                )}
              </ScrollArea>
            </div>

            {/* Test History */}
            {testHistory.length > 0 && (
              <div className="border rounded-lg">
                <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-700 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Test History ({testHistory.length})
                  </p>
                  <Button variant="ghost" size="sm" onClick={clearTestHistory} className="h-6 text-xs text-gray-500">
                    Clear
                  </Button>
                </div>
                <ScrollArea className="max-h-[200px]">
                  <div className="divide-y">
                    {testHistory.map((entry) => (
                      <div key={entry.id} className="p-3 hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-gray-500">
                            {new Date(entry.timestamp).toLocaleString()}
                          </p>
                          <Badge variant="outline" className="text-xs">{entry.model}</Badge>
                        </div>
                        <p className="text-sm font-medium text-blue-700 mb-1">Q: {entry.userMessage}</p>
                        <p className="text-sm text-gray-600 line-clamp-3">{entry.response}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-1 h-6 text-xs"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setTestResponse(entry.response);
                            setCustomTestMessage(entry.userMessage);
                            setTimeout(() => {
                              document.getElementById('persona-test-response')?.scrollIntoView({ behavior: 'smooth' });
                            }, 50);
                          }}
                        >
                          <Eye className="w-3 h-3 mr-1" /> View Full
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowTestDialog(false)}>
                Close
              </Button>
            </div>
            </div>
            </DialogContent>
            </Dialog>
    </>
  );
}
