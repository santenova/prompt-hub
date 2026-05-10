import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  HelpCircle,
  X,
  Lightbulb,
  Video,
  BookOpen,
  MessageSquare,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Contextual help content for different features
const HELP_CONTENT = {
  templatePlaceholders: {
    title: 'Using Placeholders',
    description: 'Placeholders make your templates reusable with dynamic values.',
    tips: [
      'Use {curly braces} to create placeholders like {topic} or {tone}',
      'AI can automatically suggest contextual values for placeholders',
      'Placeholders can have default values and validation rules'
    ],
    videoUrl: null,
    docsUrl: '/Documentation#placeholders'
  },
  aiGeneration: {
    title: 'AI Prompt Generation',
    description: 'Describe what you need in plain English and AI creates a professional prompt.',
    tips: [
      'Be specific about your use case and target audience',
      'Mention tone, format, and any special requirements',
      'You can generate variations to compare different approaches'
    ],
    example: '"Create a prompt for writing persuasive product descriptions for tech gadgets"',
    videoUrl: null,
    docsUrl: '/Documentation#ai-generation'
  },
  ollama: {
    title: 'Ollama Integration',
    description: 'Run powerful AI models locally for complete privacy and unlimited usage.',
    tips: [
      'Download Ollama from ollama.ai and install it',
      'Run "ollama serve" to start the local server',
      'Pull models with "ollama pull llama3.2" or similar',
      'Add your endpoint (usually http://localhost:11434)'
    ],
    videoUrl: null,
    docsUrl: '/Documentation#ollama-setup'
  },
  collaboration: {
    title: 'Team Collaboration',
    description: 'Share templates and work together in real-time.',
    tips: [
      'Invite team members by email with specific permissions',
      'View - can see and copy templates',
      'Edit - can modify templates directly',
      'Admin - full control including managing collaborators',
      'All changes are tracked in the activity log'
    ],
    videoUrl: null,
    docsUrl: '/Documentation#collaboration'
  },
  versionControl: {
    title: 'Version History',
    description: 'Track changes and revert to previous versions anytime.',
    tips: [
      'Every edit creates a new version automatically',
      'View complete history with timestamps and authors',
      'Compare versions side-by-side to see changes',
      'Restore any previous version with one click'
    ],
    videoUrl: null,
    docsUrl: '/Documentation#version-control'
  },
  personas: {
    title: 'AI Personas',
    description: 'Create detailed AI personalities with unique voices and expertise.',
    tips: [
      'Define demographics, behaviors, and communication style',
      'Add voice profiles with vocabulary and tone preferences',
      'Use personas in prompts for consistent character simulation',
      'Share personas with your team for unified AI interactions'
    ],
    videoUrl: null,
    docsUrl: '/Documentation#personas'
  },
  beamMode: {
    title: 'Beam Mode (Multi-Model)',
    description: 'Query multiple AI models simultaneously and compare responses.',
    tips: [
      'Select 2+ models to query at once',
      'Responses appear in real-time side-by-side',
      'Use AI analysis to compare quality and accuracy',
      'Merge best parts from different responses',
      'Great for important decisions or creative brainstorming'
    ],
    videoUrl: null,
    docsUrl: '/Documentation#beam-mode'
  }
};

// Inline help icon with popover
export function InlineHelp({ contentKey, position = 'top' }) {
  const content = HELP_CONTENT[contentKey];
  
  if (!content) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-gray-400 hover:text-purple-600"
        >
          <HelpCircle className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" side={position}>
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{content.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{content.description}</p>
            </div>
          </div>

          {content.tips && (
            <div className="space-y-2">
             <p className="text-xs font-medium text-gray-700">Quick Tips:</p>
              <ul className="space-y-1">
                {content.tips.map((tip, idx) => (
                  <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
              
            </div>
          )}

          {content.example && (
            <div className="p-2 bg-purple-50 border border-purple-200 rounded text-xs">
              <span className="font-medium text-purple-900">Example:</span>
              <p className="text-purple-700 mt-1">{content.example}</p>
            </div>
          )}

          {content.docsUrl && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              asChild
            >
              <a href={content.docsUrl}>
                <BookOpen className="w-3 h-3 mr-2" />
                View Documentation
              </a>
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Contextual help panel that appears based on user activity
export function ContextualHelpPanel({ page, showSuggestions = true }) {
  const [isVisible, setIsVisible] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (!showSuggestions) return;

    // Get user preferences
    const prefs = JSON.parse(localStorage.getItem('user_preferences') || '{}');
    if (prefs.show_feature_tooltips === false) return;

    // Show contextual suggestions based on page
    const pageSuggestions = getPageSuggestions(page);
    if (pageSuggestions.length > 0) {
      setSuggestions(pageSuggestions);
      
      // Show after a delay
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [page, showSuggestions]);

  const getPageSuggestions = (page) => {
    const allSuggestions = {
      Templates: [
        {
          icon: Sparkles,
          title: 'Try AI Generation',
          description: 'Let AI create professional prompts in seconds',
          action: 'Click "AI Generate" button',
          contentKey: 'aiGeneration'
        },
        {
          icon: Lightbulb,
          title: 'Use Placeholders',
          description: 'Make templates reusable with {placeholders}',
          action: 'Add {topic} or {tone} to your content',
          contentKey: 'templatePlaceholders'
        }
      ],
      PersonasLibrary: [
        {
          icon: Sparkles,
          title: 'Create AI Personas',
          description: 'Build detailed personalities for consistent AI interactions',
          action: 'Click "AI Generate" to start',
          contentKey: 'personas'
        }
      ],
      OllamaSettings: [
        {
          icon: Lightbulb,
          title: 'Connect Local AI',
          description: 'Run AI models privately on your machine',
          action: 'Add endpoint and test connection',
          contentKey: 'ollama'
        }
      ],
      VoiceToPrompt: [
        {
          icon: Sparkles,
          title: 'Try Beam Mode',
          description: 'Query multiple AI models at once',
          action: 'Select 2+ models and enable Beam',
          contentKey: 'beamMode'
        }
      ]
    };

    return allSuggestions[page] || [];
  };

  const handleDismiss = (index) => {
    setSuggestions(prev => prev.filter((_, i) => i !== index));
    if (suggestions.length <= 1) {
      setIsVisible(false);
    }
  };

  if (!isVisible || suggestions.length === 0) return null;

  return null;

  // Disabled for now
  /* return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="fixed bottom-4 right-4 z-40 w-80"
      >
      
        <Card className="border-2 border-purple-200 shadow-xl bg-gradient-to-br from-white to-purple-50" >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-purple-600" />
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.map((suggestion, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-3 bg-white rounded-lg border border-purple-100"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <suggestion.icon className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm text-gray-900">{suggestion.title}</h4>
                      {suggestion.contentKey && (
                        <InlineHelp contentKey={suggestion.contentKey} position="left" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{suggestion.description}</p>
                    <Badge variant="secondary" className="text-xs">
                      {suggestion.action}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDismiss(idx)}
                  className="w-full mt-2 text-xs"
                >
                  Got it!
                </Button>
              </motion.div>
            ))}
          </CardContent>
        </Card>
        
      </motion.div>
    </AnimatePresence>
  ); */
}

export default ContextualHelpPanel;