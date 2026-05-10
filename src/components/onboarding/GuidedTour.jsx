import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  MousePointerClick,
  Check
} from 'lucide-react';

// Tour definitions for different pages/features
export const TOURS = {
  templateCreation: {
    id: 'template-creation',
    title: 'Create Your First Template',
    steps: [
      {
        target: '[data-tour="create-button"]',
        title: 'Start Creating',
        content: 'Click here to create a new template. You can use AI or create manually.',
        placement: 'bottom',
        action: 'click'
      },
      {
        target: '[data-tour="title-field"]',
        title: 'Give it a Name',
        content: 'Add a descriptive title for your template. This helps you find it later.',
        placement: 'bottom',
        action: 'type'
      },
      {
        target: '[data-tour="content-field"]',
        title: 'Add Template Content',
        content: 'Write your prompt here. Use {placeholders} for dynamic values like {topic} or {tone}.',
        placement: 'top',
        action: 'type'
      },
      {
        target: '[data-tour="ai-fill-button"]',
        title: 'AI Fill Placeholders',
        content: 'Let AI automatically suggest contextual values for your placeholders!',
        placement: 'left',
        highlight: true
      },
      {
        target: '[data-tour="save-button"]',
        title: 'Save & Use',
        content: 'Save your template and start using it in your projects.',
        placement: 'top',
        action: 'click'
      }
    ]
  },
  aiGenerator: {
    id: 'ai-generator',
    title: 'Generate Prompts with AI',
    steps: [
      {
        target: '[data-tour="ai-gen-input"]',
        title: 'Describe Your Need',
        content: 'Simply describe what kind of prompt you need in plain English.',
        placement: 'bottom',
        example: 'Try: "Create a prompt for writing engaging blog post introductions"'
      },
      {
        target: '[data-tour="generate-button"]',
        title: 'Generate',
        content: 'Click to let AI create a professional prompt for you in seconds.',
        placement: 'bottom',
        action: 'click'
      },
      {
        target: '[data-tour="result-area"]',
        title: 'Review & Customize',
        content: 'Review the generated prompt. You can edit it or generate variations.',
        placement: 'top'
      },
      {
        target: '[data-tour="save-template"]',
        title: 'Save as Template',
        content: 'Save this prompt to your library for future use.',
        placement: 'left'
      }
    ]
  },
  ollamaSetup: {
    id: 'ollama-setup',
    title: 'Connect Local AI (Ollama)',
    steps: [
      {
        target: '[data-tour="endpoint-input"]',
        title: 'Add Endpoint',
        content: 'Enter your Ollama endpoint URL. Default is http://localhost:11434 if running locally.',
        placement: 'bottom'
      },
      {
        target: '[data-tour="test-connection"]',
        title: 'Test Connection',
        content: 'Test the connection to ensure Ollama is running and accessible.',
        placement: 'bottom',
        action: 'click'
      },
      {
        target: '[data-tour="model-select"]',
        title: 'Choose a Model',
        content: 'Select which AI model to use from your installed models.',
        placement: 'bottom'
      },
      {
        target: '[data-tour="enable-ollama"]',
        title: 'Enable Integration',
        content: 'Turn on Ollama integration to use local AI across the app.',
        placement: 'left',
        action: 'click'
      }
    ]
  },
  collaboration: {
    id: 'collaboration',
    title: 'Share & Collaborate',
    steps: [
      {
        target: '[data-tour="template-menu"]',
        title: 'Open Template Menu',
        content: 'Click the menu button on any template to access sharing options.',
        placement: 'bottom',
        action: 'click'
      },
      {
        target: '[data-tour="share-option"]',
        title: 'Share Settings',
        content: 'Configure who can access your template and their permission level.',
        placement: 'left'
      },
      {
        target: '[data-tour="invite-email"]',
        title: 'Invite Collaborators',
        content: 'Enter email addresses to invite team members to collaborate.',
        placement: 'bottom'
      },
      {
        target: '[data-tour="permission-select"]',
        title: 'Set Permissions',
        content: 'Choose permission level: Viewer, Editor, or Admin for each collaborator.',
        placement: 'bottom'
      }
    ]
  },
  voiceChat: {
    id: 'voice-chat',
    title: 'Voice-Powered AI Chat',
    steps: [
      {
        target: '[data-tour="voice-button"]',
        title: 'Start Voice Input',
        content: 'Click to start speaking. Your voice will be converted to text automatically.',
        placement: 'top',
        action: 'click'
      },
      {
        target: '[data-tour="model-selector"]',
        title: 'Choose AI Model',
        content: 'Select which AI model to chat with. Each has different capabilities.',
        placement: 'bottom'
      },
      {
        target: '[data-tour="beam-mode"]',
        title: 'Beam Mode',
        content: 'Query multiple AI models simultaneously and compare their responses!',
        placement: 'left',
        highlight: true
      },
      {
        target: '[data-tour="save-chat"]',
        title: 'Save Conversation',
        content: 'Save your chat session to review or continue later.',
        placement: 'top'
      }
    ]
  }
};

export default function GuidedTour({ tourId, onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [highlightedElement, setHighlightedElement] = useState(null);

  const tour = TOURS[tourId];

  useEffect(() => {
    if (tour && !isActive) {
      // Check if tour was already completed
      const completedTours = JSON.parse(localStorage.getItem('completedTours') || '{}');
      if (!completedTours[tour.id]) {
        setIsActive(true);
      }
    }
  }, [tour, isActive]);

  useEffect(() => {
    if (isActive && tour) {
      const step = tour.steps[currentStep];
      const element = document.querySelector(step.target);
      
      if (element) {
        setHighlightedElement(element);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add highlight class
        element.classList.add('tour-highlight');
        
        return () => {
          element.classList.remove('tour-highlight');
        };
      }
    }
  }, [currentStep, isActive, tour]);

  const handleNext = () => {
    if (currentStep < tour.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Mark tour as completed
    const completedTours = JSON.parse(localStorage.getItem('completedTours') || '{}');
    completedTours[tour.id] = true;
    localStorage.setItem('completedTours', JSON.stringify(completedTours));
    
    setIsActive(false);
    if (onComplete) onComplete();
  };

  const handleSkipTour = () => {
    handleComplete();
    if (onSkip) onSkip();
  };

  if (!isActive || !tour) return null;

  const step = tour.steps[currentStep];
  const progress = ((currentStep + 1) / tour.steps.length) * 100;

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 pointer-events-none"
      />

      {/* Tour Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed z-[60] pointer-events-auto"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <Card className="w-[90vw] max-w-md border-2 border-purple-300 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  {currentStep + 1} of {tour.steps.length}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSkipTour}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  {step.highlight && <Sparkles className="w-5 h-5 text-purple-600" />}
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.content}</p>
                
                {step.example && (
                  <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm text-purple-800">
                      <span className="font-medium">Example:</span> {step.example}
                    </p>
                  </div>
                )}
              </div>

              <Progress value={progress} className="mb-4 h-2" />

              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  size="sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                
                <div className="flex gap-2">
                  {currentStep < tour.steps.length - 1 && (
                    <Button
                      variant="ghost"
                      onClick={handleSkipTour}
                      size="sm"
                    >
                      Skip Tour
                    </Button>
                  )}
                  <Button
                    onClick={handleNext}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    size="sm"
                  >
                    {currentStep === tour.steps.length - 1 ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Finish
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {step.action && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MousePointerClick className="w-4 h-4 text-purple-600" />
                    <span>
                      {step.action === 'click' && 'Click the highlighted element to continue'}
                      {step.action === 'type' && 'Type in the highlighted field'}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      <style jsx global>{`
        .tour-highlight {
          position: relative;
          z-index: 55 !important;
          box-shadow: 0 0 0 4px rgba(147, 51, 234, 0.4), 0 0 0 8px rgba(147, 51, 234, 0.2) !important;
          border-radius: 8px;
          animation: tour-pulse 2s ease-in-out infinite;
        }
        
        @keyframes tour-pulse {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(147, 51, 234, 0.4), 0 0 0 8px rgba(147, 51, 234, 0.2);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(147, 51, 234, 0.5), 0 0 0 12px rgba(147, 51, 234, 0.3);
          }
        }
      `}</style>
    </>
  );
}

// Hook to easily start tours
export function useGuidedTour(tourId) {
  const [isActive, setIsActive] = useState(false);

  const startTour = () => setIsActive(true);
  const stopTour = () => setIsActive(false);

  return {
    isActive,
    startTour,
    stopTour,
    GuidedTour: () => (
      <GuidedTour
        tourId={tourId}
        onComplete={stopTour}
        onSkip={stopTour}
      />
    )
  };
}