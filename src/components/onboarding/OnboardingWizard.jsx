import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sparkles,
  Users,
  Store,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Bell,
  Zap,
  Target,
  Rocket,
  Wand2,
  Brain,
  Eye,
  Play,
  Pause,
  Code,
  Pencil,
  TrendingUp,
  Share2,
  BookOpen,
  Layers,
  MousePointer,
  FileText,
  MessageSquare,
  GitBranch,
  Settings,
  Server,
  AlertCircle,
  Image,
  BarChart3,
  History,
  Star,
  Download,
  Search,
  Upload
} from 'lucide-react';
import { apiClient } from '@/apis/client';

// User roles/goals for personalization
const userRoles = [
  {
    id: 'writer',
    label: 'Writer / Content Creator',
    icon: Pencil,
    color: 'from-blue-500 to-cyan-500',
    description: 'Create blog posts, articles, social media content',
    recommendedFeatures: ['prompt-library', 'ai-generator', 'templates'],
    suggestedTemplates: ['Blog Post', 'Social Media', 'Email']
  },
  {
    id: 'developer',
    label: 'Developer',
    icon: Code,
    color: 'from-green-500 to-emerald-500',
    description: 'Generate code, documentation, technical content',
    recommendedFeatures: ['ai-generator', 'personas', 'api'],
    suggestedTemplates: ['Code Review', 'Documentation', 'API Design']
  },
  {
    id: 'marketer',
    label: 'Marketer',
    icon: TrendingUp,
    color: 'from-purple-500 to-pink-500',
    description: 'Create campaigns, copy, and marketing materials',
    recommendedFeatures: ['ai-generator', 'personas', 'marketplace'],
    suggestedTemplates: ['Ad Copy', 'Landing Page', 'Email Campaign']
  },
  {
    id: 'educator',
    label: 'Educator / Trainer',
    icon: BookOpen,
    color: 'from-orange-500 to-yellow-500',
    description: 'Develop learning materials and curriculum',
    recommendedFeatures: ['prompt-library', 'templates', 'sharing'],
    suggestedTemplates: ['Lesson Plan', 'Quiz', 'Explanation']
  },
  {
    id: 'other',
    label: 'Other / Exploring',
    icon: Sparkles,
    color: 'from-indigo-500 to-purple-500',
    description: 'Just exploring what AI prompts can do',
    recommendedFeatures: ['ai-generator', 'marketplace', 'templates'],
    suggestedTemplates: []
  }
];

// Interactive tutorial steps
const interactiveTutorials = {
  'create-prompt': {
    title: 'Create Your First Prompt',
    steps: [
      { action: 'click', target: 'AI Generator button', description: 'Click the AI Generator to start' },
      { action: 'type', target: 'description field', description: 'Describe what you need in plain English' },
      { action: 'click', target: 'Generate button', description: 'Let AI create your prompt' },
      { action: 'review', target: 'result', description: 'Review and customize the generated prompt' }
    ]
  },
  'share-template': {
    title: 'Share a Template',
    steps: [
      { action: 'click', target: 'template menu', description: 'Open the template actions menu' },
      { action: 'click', target: 'Share Settings', description: 'Configure sharing options' },
      { action: 'select', target: 'visibility', description: 'Choose who can access' },
      { action: 'invite', target: 'collaborators', description: 'Add team members by email' }
    ]
  },
  'use-persona': {
    title: 'Create an AI Persona',
    steps: [
      { action: 'navigate', target: 'Personas Library', description: 'Go to the Personas page' },
      { action: 'click', target: 'AI Generate button', description: 'Start the AI persona generator' },
      { action: 'describe', target: 'persona traits', description: 'Describe who you want to simulate' },
      { action: 'customize', target: 'voice profile', description: 'Fine-tune the persona voice' }
    ]
  },
  'generate-image': {
    title: 'Generate AI Images',
    steps: [
      { action: 'navigate', target: 'AI Content Generator', description: 'Go to AI Content Generator' },
      { action: 'click', target: 'Images tab', description: 'Switch to the Images tab' },
      { action: 'describe', target: 'image prompt', description: 'Describe the image you want' },
      { action: 'select', target: 'style', description: 'Choose an art style (optional)' },
      { action: 'generate', target: 'generate button', description: 'Click Generate to create your image' },
      { action: 'save', target: 'auto-saved', description: 'Images are auto-saved to Gallery' }
    ]
  },
  'analyze-data': {
    title: 'Analyze Data with AI',
    steps: [
      { action: 'navigate', target: 'AI Content Generator', description: 'Go to AI Content Generator' },
      { action: 'click', target: 'Analyze tab', description: 'Switch to the Analyze tab' },
      { action: 'upload', target: 'file upload', description: 'Upload CSV, Excel, or JSON file' },
      { action: 'analyze', target: 'analyze button', description: 'Click Analyze to process data' },
      { action: 'review', target: 'insights', description: 'Review AI-generated insights & charts' },
      { action: 'export', target: 'export button', description: 'Download analysis report' }
    ]
  },
  'use-templates': {
    title: 'Work with Templates',
    steps: [
      { action: 'navigate', target: 'Templates page', description: 'Go to Prompts (Templates) page' },
      { action: 'browse', target: 'template list', description: 'Browse or search templates' },
      { action: 'click', target: 'template', description: 'Click a template to open it' },
      { action: 'fill', target: 'placeholders', description: 'Fill in the required fields' },
      { action: 'generate', target: 'execute button', description: 'Click Execute to generate content' },
      { action: 'save', target: 'favorites', description: 'Star templates for quick access' }
    ]
  },
  'view-history': {
    title: 'Access Your History',
    steps: [
      { action: 'navigate', target: 'AI Content Generator', description: 'Go to AI Content Generator' },
      { action: 'click', target: 'History tab', description: 'Switch to History tab to see all content' },
      { action: 'click', target: 'Analyses tab', description: 'View saved data analyses' },
      { action: 'click', target: 'Gallery tab', description: 'Browse generated images' },
      { action: 'favorite', target: 'star icon', description: 'Star items to mark favorites' },
      { action: 'search', target: 'search bar', description: 'Search across all history' }
    ]
  }
};

export default function OnboardingWizard({ open, onComplete, currentUser }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState(null);
  const [activeTutorial, setActiveTutorial] = useState(null);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [ollamaEndpoint, setOllamaEndpoint] = useState('');
  const [testingOllama, setTestingOllama] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const [preferences, setPreferences] = useState({
    show_ai_suggestions: true,
    auto_save_prompts: true,
    show_feature_tooltips: true,
    user_role: null,
    notification_preferences: {
      email_notifications: true,
      weekly_digest: true,
      feature_updates: true
    }
  });

  const steps = [
    { id: 'welcome', title: 'Welcome' },
    { id: 'role', title: 'Your Role' },
    { id: 'core-features', title: 'Core Features' },
    { id: 'persona-creation', title: 'Create Personas' },
    { id: 'template-usage', title: 'Use Templates' },
    { id: 'image-generation', title: 'Generate Images' },
    { id: 'data-analysis', title: 'Analyze Data' },
    { id: 'history-features', title: 'History & Favorites' },
    { id: 'ollama-setup', title: 'Ollama Setup' },
    { id: 'sharing', title: 'Share & Collaborate' },
    { id: 'preferences', title: 'Preferences' },
    { id: 'complete', title: 'Get Started' }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setActiveTutorial(null);
      setTutorialStep(0);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setActiveTutorial(null);
      setTutorialStep(0);
    }
  };

  const handleSkip = async () => {
    await apiClient.auth.updateMe({
      onboarding_skipped: true,
      onboarding_step: currentStep,
      user_role: selectedRole?.id,
      last_onboarding_shown: new Date().toISOString()
    });
    onComplete();
  };

  const handleComplete = async (path) => {
    await apiClient.auth.updateMe({
      ...preferences,
      user_role: selectedRole?.id,
      onboarding_completed: true,
      onboarding_step: steps.length,
      last_onboarding_shown: new Date().toISOString()
    });
    onComplete(path);
  };

  const startTutorial = (tutorialId) => {
    setActiveTutorial(tutorialId);
    setTutorialStep(0);
    setIsPlayingDemo(true);
  };

  const nextTutorialStep = () => {
    const tutorial = interactiveTutorials[activeTutorial];
    if (tutorialStep < tutorial.steps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      setActiveTutorial(null);
      setTutorialStep(0);
      setIsPlayingDemo(false);
    }
  };

  const testOllamaEndpoint = async () => {
    if (!ollamaEndpoint.trim()) return;
    setTestingOllama(true);
    try {
      const { data } = await apiClient.functions.invoke('ollamaProxy', { endpoint: ollamaEndpoint, action: 'test-connection' });
      if (data.success) {
        setOllamaStatus({ success: true, modelCount: data.modelCount || 0 });
        const endpoints = JSON.parse(localStorage.getItem('ollama_endpoints') || '[]');
        if (!endpoints.includes(ollamaEndpoint)) {
          endpoints.push(ollamaEndpoint);
          localStorage.setItem('ollama_endpoints', JSON.stringify(endpoints));
        }
      } else {
        setOllamaStatus({ success: false, error: data.message || 'Connection failed' });
      }
    } catch (error) {
      setOllamaStatus({ success: false, error: 'Could not connect to Ollama' });
    } finally {
      setTestingOllama(false);
    }
  };

  const getStepContent = () => {
    const stepId = steps[currentStep].id;

    switch (stepId) {
      case 'welcome':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.6 }}
                className="w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl"
              >
                <Sparkles className="w-12 h-12 text-white" />
              </motion.div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Welcome to Prompt Hub, {currentUser?.full_name?.split(' ')[0] || 'there'}! 👋
              </h2>
              <p className="text-lg text-gray-600 max-w-xl mx-auto">
                Your AI-powered platform for creating, managing, and sharing professional prompts and personas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              {[
                { icon: Brain, title: 'AI-Powered Creation', desc: 'Generate prompts & personas with AI', color: 'purple' },
                { icon: Share2, title: 'Team Collaboration', desc: 'Share and work together in real-time', color: 'blue' },
                { icon: Store, title: 'Marketplace', desc: 'Discover community templates', color: 'green' }
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                >
                  <Card className="text-center h-full border-2 hover:border-purple-300 transition-colors">
                    <CardContent className="pt-6">
                      <div className={`w-12 h-12 bg-${feature.color}-100 rounded-xl flex items-center justify-center mx-auto mb-3`}>
                        <feature.icon className={`w-6 h-6 text-${feature.color}-600`} />
                      </div>
                      <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{feature.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200 mt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Quick Setup (2 minutes)</h4>
                  <p className="text-sm text-gray-600">We'll personalize your experience based on your goals</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'role':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What brings you here?</h2>
              <p className="text-gray-600">We'll customize your experience based on your role</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userRoles.map((role, idx) => {
                const RoleIcon = role.icon;
                const isSelected = selectedRole?.id === role.id;
                return (
                  <motion.div
                    key={role.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        isSelected
                          ? 'ring-2 ring-purple-500 border-purple-500 bg-purple-50'
                          : 'border-2 hover:border-purple-300'
                      }`}
                      onClick={() => {
                        setSelectedRole(role);
                        setPreferences({ ...preferences, user_role: role.id });
                      }}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 bg-gradient-to-br ${role.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <RoleIcon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-gray-900">{role.label}</h3>
                              {isSelected && <CheckCircle2 className="w-5 h-5 text-purple-600" />}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {selectedRole && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-200 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">
                    Great choice! We'll recommend {selectedRole.label.toLowerCase()} templates and features for you.
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        );

      case 'core-features':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Toolkit</h2>
              <p className="text-gray-600">Three powerful tools at your fingertips</p>
            </div>

            <div className="space-y-4">
              {[
                {
                  icon: Brain,
                  title: 'AI Prompt Generator',
                  description: 'Describe what you need in plain English — AI creates a professional prompt instantly',
                  demo: 'Try: "Create a prompt for writing persuasive product descriptions"',
                  color: 'purple',
                  tutorial: 'create-prompt'
                },
                {
                  icon: Users,
                  title: 'Persona Library',
                  description: 'Build detailed AI personas with demographics, behaviors, and voice profiles',
                  demo: 'Try: "Marketing manager at a B2B SaaS startup"',
                  color: 'blue',
                  tutorial: 'use-persona'
                },
                {
                  icon: FileText,
                  title: 'Template Library',
                  description: 'Organize prompts in folders, add tags, track versions, and collaborate',
                  demo: 'Features: Folders, Tags, Favorites, Version History',
                  color: 'green',
                  tutorial: null
                }
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.15 }}
                >
                  <Card className="border-2 hover:border-purple-300 transition-all">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 bg-${feature.color}-100 rounded-xl flex items-center justify-center flex-shrink-0`}>
                          <feature.icon className={`w-7 h-7 text-${feature.color}-600`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900">{feature.title}</h3>
                          <p className="text-gray-600 mt-1">{feature.description}</p>
                          <div className="mt-3 flex items-center gap-3">
                            <Badge variant="outline" className="bg-gray-50">
                              💡 {feature.demo}
                            </Badge>
                            {feature.tutorial && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startTutorial(feature.tutorial)}
                                className="text-purple-600"
                              >
                                <Play className="w-3 h-3 mr-1" />
                                Watch Demo
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 'ollama-setup':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Local AI</h2>
              <p className="text-gray-600">Optional: Connect Ollama to use local AI models</p>
            </div>

            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Server className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-2">What is Ollama?</h3>
                    <p className="text-sm text-gray-600">
                      Ollama lets you run powerful AI models locally on your computer. This means:
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-gray-700">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        Complete privacy - your data never leaves your device
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        No API costs - unlimited usage
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        Works offline without internet
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Ollama Endpoint URL</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="http://localhost:11434 or https://your-ngrok-url.app"
                        value={ollamaEndpoint}
                        onChange={(e) => {
                          setOllamaEndpoint(e.target.value);
                          setOllamaStatus(null);
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && testOllamaEndpoint()}
                        className="font-mono text-sm"
                      />
                      <Button
                        onClick={testOllamaEndpoint}
                        disabled={!ollamaEndpoint.trim() || testingOllama}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {testingOllama ? (
                          <>
                            <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          'Test Connection'
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Default: http://localhost:11434 (if running locally)
                    </p>
                  </div>

                  {ollamaStatus && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {ollamaStatus.success ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-green-800">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="font-medium">
                              Connected successfully! Found {ollamaStatus.modelCount} model(s)
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-red-800">
                            <AlertCircle className="w-5 h-5" />
                            <span className="font-medium">{ollamaStatus.error}</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Don't have Ollama yet?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Quick setup guide to get started with local AI:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>Download Ollama from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">ollama.ai</a></li>
                  <li>Install and run Ollama on your computer</li>
                  <li>Download a model: <code className="bg-gray-100 px-2 py-1 rounded text-xs">ollama pull llama3.2</code></li>
                  <li>Come back here and test the connection above</li>
                </ol>
                <div className="pt-3 border-t">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer">
                      Visit Ollama Website
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> You can skip this step and configure Ollama later from Settings → Ollama Configuration
              </p>
            </div>
          </div>
        );

      case 'persona-creation':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create AI Personas</h2>
              <p className="text-gray-600">Build powerful AI characters with unique voices and expertise</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Brain className="w-5 h-5 text-blue-600" />
                    What is a Persona?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-gray-700">
                    A persona is an AI character with specific traits, expertise, and communication style.
                  </p>
                  <div className="space-y-2">
                    {[
                      { label: 'Name & Role', example: 'Marketing Expert, Tech Reviewer' },
                      { label: 'Expertise Areas', example: 'SEO, Content Strategy, Analytics' },
                      { label: 'Tone & Voice', example: 'Professional, Friendly, Technical' },
                      { label: 'Instructions', example: 'How the persona should respond' }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">{item.label}</p>
                          <p className="text-xs text-gray-600">{item.example}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    AI-Powered Creation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <div className="bg-white rounded-lg p-4 border">
                      <p className="font-medium text-gray-900 mb-2">Quick Generate</p>
                      <p className="text-xs text-gray-600 mb-3">Just describe who you need:</p>
                      <div className="bg-purple-50 p-2 rounded text-xs font-mono text-purple-800">
                        "A senior software engineer expert in React and TypeScript"
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-purple-600">
                      <Zap className="w-4 h-4" />
                      <span className="text-xs font-medium">AI fills in all details automatically</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startTutorial('use-persona')}
                    className="w-full border-purple-300 hover:bg-purple-50"
                  >
                    <Play className="w-3 h-3 mr-2" />
                    Watch Demo
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">Use Cases for Personas</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {[
                        '📝 Content creation from different viewpoints',
                        '💼 Business analysis & strategy',
                        '🎨 Creative brainstorming sessions',
                        '🔬 Technical documentation & reviews',
                        '📊 Market research & user insights',
                        '✍️ Writing in specific author styles'
                      ].map((useCase, idx) => (
                        <div key={idx} className="text-gray-700">
                          {useCase}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'template-usage':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Using Templates</h2>
              <p className="text-gray-600">Save time with reusable prompt templates</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-2 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5 text-green-600" />
                    Template Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {[
                    { icon: Zap, text: 'Reusable with placeholders like {{topic}}' },
                    { icon: Layers, text: 'Organize in folders and add tags' },
                    { icon: GitBranch, text: 'Track versions and changes' },
                    { icon: Share2, text: 'Share with team or make public' },
                    { icon: Star, text: 'Mark favorites for quick access' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <item.icon className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{item.text}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Wand2 className="w-5 h-5 text-purple-600" />
                    Template Example
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-white rounded-lg p-3 border text-xs font-mono">
                    <p className="text-gray-500 mb-2">Title: Product Description</p>
                    <p className="text-gray-800">
                      Write a compelling description for <span className="bg-purple-100 px-1 rounded">{'{{product_name}}'}</span> that highlights <span className="bg-purple-100 px-1 rounded">{'{{key_features}}'}</span> and targets <span className="bg-purple-100 px-1 rounded">{'{{audience}}'}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-purple-600 text-xs">
                    <Sparkles className="w-3 h-3" />
                    <span>Placeholders auto-fill when executing</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startTutorial('use-templates')}
                    className="w-full border-purple-300"
                  >
                    <Play className="w-3 h-3 mr-2" />
                    See in Action
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">100+</p>
                    <p className="text-sm text-gray-600">Pre-made Templates</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">25+</p>
                    <p className="text-sm text-gray-600">Categories</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">∞</p>
                    <p className="text-sm text-gray-600">Custom Templates</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'image-generation':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Generate AI Images</h2>
              <p className="text-gray-600">Create stunning visuals from text descriptions</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-purple-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Image className="w-5 h-5 text-pink-600" />
                    Image Generator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-700">
                    Describe any image in words, choose a style, and let AI create it for you.
                  </p>
                  <div className="space-y-2 text-sm">
                    {[
                      { label: 'Photorealistic', desc: 'Lifelike photos' },
                      { label: 'Digital Art', desc: 'Modern illustrations' },
                      { label: '3D Render', desc: 'Three-dimensional visuals' },
                      { label: 'Anime', desc: 'Japanese animation style' },
                      { label: 'Oil Painting', desc: 'Classic art style' }
                    ].map((style, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded border">
                        <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                        <span className="font-medium text-gray-900">{style.label}</span>
                        <span className="text-gray-500 text-xs">- {style.desc}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Layers className="w-5 h-5 text-purple-600" />
                    Image Gallery
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-700">
                    All your generated images are automatically saved to your personal gallery.
                  </p>
                  <div className="space-y-2">
                    {[
                      { icon: Star, text: 'Mark favorites for quick access' },
                      { icon: Download, text: 'Download in high quality' },
                      { icon: Share2, text: 'Share with your team' },
                      { icon: FileText, text: 'Reuse prompts for similar images' },
                      { icon: Search, text: 'Search by prompt or style' }
                    ].map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <feature.icon className="w-4 h-4 text-purple-600" />
                        <span className="text-gray-700">{feature.text}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startTutorial('generate-image')}
                    className="w-full border-purple-300"
                  >
                    <Play className="w-3 h-3 mr-2" />
                    Watch Tutorial
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-r from-pink-100 to-purple-100 border-2 border-pink-300">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="w-5 h-5 text-pink-600" />
                  <h4 className="font-semibold text-gray-900">Pro Tip</h4>
                </div>
                <p className="text-sm text-gray-700">
                  Use personas to enhance your image prompts! Select a persona like "Creative Director" to get automatically enhanced descriptions that produce better results.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case 'data-analysis':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Data Analysis</h2>
              <p className="text-gray-600">Turn raw data into actionable insights</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  icon: Upload,
                  title: 'Upload Files',
                  desc: 'CSV, Excel, JSON supported',
                  color: 'blue',
                  examples: ['Sales data', 'Survey results', 'User metrics']
                },
                {
                  icon: BarChart3,
                  title: 'AI Analysis',
                  desc: 'Auto-generate insights',
                  color: 'purple',
                  examples: ['Trends', 'Patterns', 'Anomalies']
                },
                {
                  icon: TrendingUp,
                  title: 'Visual Reports',
                  desc: 'Charts & recommendations',
                  color: 'green',
                  examples: ['Bar charts', 'Line graphs', 'Pie charts']
                }
              ].map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.15 }}
                >
                  <Card className="h-full border-2">
                    <CardContent className="pt-6">
                      <div className={`w-12 h-12 bg-${step.color}-100 rounded-xl flex items-center justify-center mb-3`}>
                        <step.icon className={`w-6 h-6 text-${step.color}-600`} />
                      </div>
                      <h3 className="font-bold text-gray-900 mb-1">{step.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{step.desc}</p>
                      <div className="space-y-1">
                        {step.examples.map((ex, eidx) => (
                          <div key={eidx} className="text-xs text-gray-500">
                            • {ex}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">What You Get</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {[
                        '📊 Automatic chart generation',
                        '🔍 Key metrics extraction',
                        '💡 Actionable insights',
                        '📈 Trend analysis',
                        '⭐ Data quality scoring',
                        '📥 Exportable reports'
                      ].map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startTutorial('analyze-data')}
                      className="mt-4 border-green-300"
                    >
                      <Play className="w-3 h-3 mr-2" />
                      See How It Works
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'history-features':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">History & Organization</h2>
              <p className="text-gray-600">Everything is saved automatically for easy access</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  icon: History,
                  title: 'Content History',
                  desc: 'All generated content',
                  features: ['Search & filter', 'Re-generate', 'Edit & refine', 'Export']
                },
                {
                  icon: Image,
                  title: 'Image Gallery',
                  desc: 'AI-generated images',
                  features: ['Browse all images', 'Filter by style', 'Download HD', 'Reuse prompts']
                },
                {
                  icon: BarChart3,
                  title: 'Analysis Archive',
                  desc: 'Data analysis reports',
                  features: ['View insights', 'Re-export reports', 'Compare analyses', 'Track quality']
                }
              ].map((section, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.15 }}
                >
                  <Card className="h-full border-2">
                    <CardContent className="pt-6">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
                        <section.icon className="w-6 h-6 text-purple-600" />
                      </div>
                      <h3 className="font-bold text-gray-900 mb-1">{section.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{section.desc}</p>
                      <div className="space-y-1.5">
                        {section.features.map((feat, fidx) => (
                          <div key={fidx} className="flex items-center gap-2 text-xs text-gray-600">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            {feat}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">Favorites & Organization</h4>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span>Star any item to mark it as a favorite</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-600" />
                        <span>Add tags for easy searching and filtering</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-blue-600" />
                        <span>Global search across all your content</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startTutorial('view-history')}
                      className="mt-4 border-purple-300"
                    >
                      <Play className="w-3 h-3 mr-2" />
                      Quick Tour
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 mb-1">Everything Saves Automatically</p>
                  <p className="text-blue-800">
                    Your generated content, images, and analyses are automatically saved. Access them anytime from the History, Gallery, and Analyses tabs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'prompt-creation':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Creating Prompts</h2>
              <p className="text-gray-600">Three ways to create perfect prompts</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  icon: Sparkles,
                  title: 'AI Generate',
                  description: 'Describe in plain English',
                  steps: ['Describe your need', 'AI generates prompt', 'Customize & save'],
                  color: 'purple'
                },
                {
                  icon: Wand2,
                  title: 'AI Refine',
                  description: 'Improve existing prompts',
                  steps: ['Select a prompt', 'Choose improvements', 'Apply changes'],
                  color: 'blue'
                },
                {
                  icon: Pencil,
                  title: 'Manual Create',
                  description: 'Write from scratch',
                  steps: ['Add title & content', 'Define placeholders', 'Organize with tags'],
                  color: 'green'
                }
              ].map((method, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.15 }}
                >
                  <Card className="h-full border-2">
                    <CardContent className="pt-6">
                      <div className={`w-12 h-12 bg-${method.color}-100 rounded-xl flex items-center justify-center mb-4`}>
                        <method.icon className={`w-6 h-6 text-${method.color}-600`} />
                      </div>
                      <h3 className="font-bold text-gray-900">{method.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">{method.description}</p>
                      <div className="space-y-2">
                        {method.steps.map((step, stepIdx) => (
                          <div key={stepIdx} className="flex items-center gap-2 text-sm">
                            <div className={`w-5 h-5 rounded-full bg-${method.color}-100 flex items-center justify-center text-xs font-bold text-${method.color}-600`}>
                              {stepIdx + 1}
                            </div>
                            <span className="text-gray-700">{step}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Interactive Demo */}
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MousePointer className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-gray-900">Interactive Demo</h4>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => startTutorial('create-prompt')}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Try It Now
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  Follow along as we show you how to create your first AI-generated prompt step by step.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case 'sharing':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Share & Collaborate</h2>
              <p className="text-gray-600">Work together on prompts in real-time</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-blue-600" />
                    Permission Levels
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { level: 'View', desc: 'Can see and copy', icon: Eye, color: 'gray' },
                    { level: 'Suggest', desc: 'Can propose changes', icon: MessageSquare, color: 'blue' },
                    { level: 'Edit', desc: 'Can modify directly', icon: Pencil, color: 'green' }
                  ].map((perm, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-8 h-8 bg-${perm.color}-100 rounded-lg flex items-center justify-center`}>
                        <perm.icon className={`w-4 h-4 text-${perm.color}-600`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{perm.level}</p>
                        <p className="text-xs text-gray-600">{perm.desc}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-purple-600" />
                    Collaboration Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { title: 'Real-time Editing', desc: 'See changes as they happen' },
                    { title: 'Version History', desc: 'Track and restore previous versions' },
                    { title: 'Comments & Discussion', desc: 'Leave feedback on prompts' },
                    { title: 'Activity Log', desc: 'See who changed what' }
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{feature.title}</p>
                        <p className="text-xs text-gray-600">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Invite Your Team</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Share prompts by email or generate a shareable link. Set permission levels for each collaborator.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startTutorial('share-template')}
                    >
                      <Play className="w-3 h-3 mr-2" />
                      See How to Share
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'marketplace':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Discover & Share</h2>
              <p className="text-gray-600">Find ready-made prompts or share your best work</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="w-5 h-5 text-purple-600" />
                    Community Templates
                  </CardTitle>
                  <CardDescription>Browse public templates from other users</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    'Writing & Content',
                    'Marketing & Sales',
                    'Development & Code',
                    'Business & Strategy'
                  ].map((cat, idx) => (
                    <Badge key={idx} variant="secondary" className="mr-2">
                      {cat}
                    </Badge>
                  ))}
                  <div className="pt-4">
                    <p className="text-sm text-gray-600">
                      ⭐ Rated by the community • One-click import
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-green-600" />
                    Agent Packages
                  </CardTitle>
                  <CardDescription>Pre-built prompt collections for specific use cases</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    'Customer Support Agent',
                    'Content Creator Suite',
                    'Code Assistant Pack',
                    'Marketing Automation'
                  ].map((pkg, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>{pkg}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {selectedRole && selectedRole.suggestedTemplates.length > 0 && (
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-5 h-5 text-yellow-600" />
                    <h4 className="font-semibold text-gray-900">Recommended for {selectedRole.label}s</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedRole.suggestedTemplates.map((template, idx) => (
                      <Badge key={idx} className="bg-yellow-100 text-yellow-800 border-yellow-300">
                        {template}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Customize Your Experience</h2>
              <p className="text-gray-600">Set your preferences (you can change these anytime)</p>
            </div>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-600" />
                  AI Assistant Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Show AI Suggestions</Label>
                    <p className="text-sm text-gray-500">Get real-time AI recommendations</p>
                  </div>
                  <Switch
                    checked={preferences.show_ai_suggestions}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, show_ai_suggestions: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Auto-save Prompts</Label>
                    <p className="text-sm text-gray-500">Automatically save as you type</p>
                  </div>
                  <Switch
                    checked={preferences.auto_save_prompts}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, auto_save_prompts: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Feature Tooltips</Label>
                    <p className="text-sm text-gray-500">Show helpful hints throughout the app</p>
                  </div>
                  <Switch
                    checked={preferences.show_feature_tooltips}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, show_feature_tooltips: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Email Notifications</Label>
                    <p className="text-sm text-gray-500">Important updates via email</p>
                  </div>
                  <Switch
                    checked={preferences.notification_preferences.email_notifications}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        notification_preferences: {
                          ...preferences.notification_preferences,
                          email_notifications: checked
                        }
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Weekly Digest</Label>
                    <p className="text-sm text-gray-500">Summary of your activity</p>
                  </div>
                  <Switch
                    checked={preferences.notification_preferences.weekly_digest}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        notification_preferences: {
                          ...preferences.notification_preferences,
                          weekly_digest: checked
                        }
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.6 }}
                className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"
              >
                <Rocket className="w-12 h-12 text-white" />
              </motion.div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">You're All Set! 🎉</h2>
              <p className="text-lg text-gray-600">Choose where you'd like to start</p>
            </div>

            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-gray-900">Quick Start Guide</h4>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Generate AI Content', path: 'AIContentGenerator', icon: Sparkles, desc: 'Text, images, and analysis', primary: true },
                    { label: 'Create Personas', path: 'PersonasLibrary', icon: Users, desc: 'Build AI characters', primary: false },
                    { label: 'Browse Templates', path: 'Templates', icon: FileText, desc: 'Reusable prompts', primary: false }
                  ].map((action, idx) => (
                    <Button
                      key={idx}
                      onClick={() => handleComplete(action.path)}
                      className={`w-full h-auto p-4 justify-start ${
                        action.primary
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
                          : 'bg-white border-2 border-gray-200 text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <action.icon className="w-5 h-5" />
                          <div className="text-left">
                            <p className="font-medium">{action.label}</p>
                            <p className={`text-xs ${action.primary ? 'text-purple-100' : 'text-gray-500'}`}>
                              {action.desc}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Explore Tools', path: 'Tools', icon: Zap },
                { label: 'View Examples', path: 'ContentExamples', icon: BookOpen }
              ].map((action, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  onClick={() => handleComplete(action.path)}
                  className="h-auto p-4"
                >
                  <action.icon className="w-4 h-4 mr-2" />
                  {action.label}
                </Button>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 mb-1">Tooltips Are Enabled</p>
                  <p className="text-blue-800">
                    You'll see helpful hints as you explore. Disable them anytime in Settings.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => handleComplete('Tools')}
              variant="ghost"
              className="w-full"
            >
              I'll explore on my own
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  // Tutorial overlay
  const renderTutorialOverlay = () => {
    if (!activeTutorial) return null;

    const tutorial = interactiveTutorials[activeTutorial];
    const step = tutorial.steps[tutorialStep];

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center"
      >
        <Card className="max-w-md mx-4 border-2 border-purple-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{tutorial.title}</CardTitle>
              <Badge variant="secondary">
                Step {tutorialStep + 1} of {tutorial.steps.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MousePointer className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{step.description}</p>
                <p className="text-sm text-gray-500 mt-1">Target: {step.target}</p>
              </div>
            </div>

            <Progress value={((tutorialStep + 1) / tutorial.steps.length) * 100} />

            <div className="flex justify-between">
              <Button
                variant="ghost"
                onClick={() => {
                  setActiveTutorial(null);
                  setIsPlayingDemo(false);
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Exit Demo
              </Button>
              <Button onClick={nextTutorialStep}>
                {tutorialStep === tutorial.steps.length - 1 ? 'Finish' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const stepData = steps[currentStep];
  const gradients = [
    'from-purple-500 to-indigo-600',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-yellow-500',
    'from-pink-500 to-rose-500',
    'from-indigo-500 to-purple-500',
    'from-gray-600 to-gray-800',
    'from-purple-600 to-pink-500'
  ];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleSkip()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0 [&>button]:hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${gradients[currentStep]} p-6 text-white relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-grid-white/[0.2]" />
          </div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <Badge className="bg-white/20 text-white border-white/30">
                Step {currentStep + 1} of {steps.length}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkip}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <DialogTitle className="text-2xl font-bold text-white mb-2">
              {stepData.title}
            </DialogTitle>
            <Progress value={progress} className="h-2 bg-white/20" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {getStepContent()}
            </motion.div>
          </AnimatePresence>
          {renderTutorialOverlay()}
        </div>

        {/* Footer */}
        {steps[currentStep].id !== 'complete' && (
          <div className="border-t p-6 flex items-center justify-between bg-gray-50">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex gap-2">
              {currentStep > 0 && currentStep < steps.length - 2 && (
                <Button variant="ghost" onClick={handleSkip}>
                  Skip Tour
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={steps[currentStep].id === 'role' && !selectedRole}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                {currentStep === steps.length - 2 ? 'Finish Setup' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
