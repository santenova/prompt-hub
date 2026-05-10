import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Lightbulb, ArrowRight } from 'lucide-react';
import { apiClient } from '@/apis/client';

// Tooltip definitions for different features
const tooltips = {
  'persona-selector': {
    title: 'Choose a Persona',
    description: 'Select an AI persona to give your content a specific voice and expertise. Each persona has unique traits and knowledge.',
    position: 'bottom',
    highlight: true
  },
  'template-selector': {
    title: 'Use Templates',
    description: 'Templates provide structured prompts with placeholders. They help create consistent, professional content.',
    position: 'bottom',
    highlight: true
  },
  'image-style': {
    title: 'Image Styles',
    description: 'Choose an art style for your AI-generated image. Each style produces a unique visual aesthetic.',
    position: 'left',
    highlight: false
  },
  'data-source': {
    title: 'Select Data Source',
    description: 'Upload a file (CSV, Excel, JSON) or analyze existing chat/persona data. The AI will extract insights automatically.',
    position: 'bottom',
    highlight: true
  },
  'history-tab': {
    title: 'Your History',
    description: 'All generated content is auto-saved here. Search, favorite, and re-use anything you\'ve created.',
    position: 'bottom',
    highlight: true
  },
  'gallery-tab': {
    title: 'Image Gallery',
    description: 'Browse all your AI-generated images. Download, share, or reuse prompts for similar creations.',
    position: 'bottom',
    highlight: true
  },
  'analyses-tab': {
    title: 'Analysis Archive',
    description: 'Review all your data analyses. Re-export reports, view insights, and track data quality scores.',
    position: 'bottom',
    highlight: true
  },
  'generate-variations': {
    title: 'Generate Variations',
    description: 'Create multiple versions of your content at once. Pick the best one or combine elements from different variations.',
    position: 'top',
    highlight: false
  },
  'custom-instructions': {
    title: 'Custom Instructions',
    description: 'Add specific requirements or constraints for the AI. This helps fine-tune the output to your exact needs.',
    position: 'left',
    highlight: false
  },
  'save-favorite': {
    title: 'Save as Favorite',
    description: 'Star items to mark them as favorites. Quickly filter to show only starred content later.',
    position: 'left',
    highlight: false
  }
};

export default function FeatureTooltips({ featureId, children, disabled = false }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipsEnabled, setTooltipsEnabled] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkUserPreference = async () => {
      try {
        const user = await apiClient.auth.me();
        setTooltipsEnabled(user.show_feature_tooltips !== false);
        
        // Check if this specific tooltip was already dismissed
        const dismissedTooltips = JSON.parse(localStorage.getItem('dismissed_tooltips') || '[]');
        setDismissed(dismissedTooltips.includes(featureId));
      } catch (error) {
        console.error('Error checking tooltip preference:', error);
      }
    };
    checkUserPreference();
  }, [featureId]);

  useEffect(() => {
    if (!tooltipsEnabled || dismissed || disabled) return;

    // Show tooltip after a brief delay when component mounts
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [tooltipsEnabled, dismissed, disabled]);

  const handleDismiss = () => {
    setShowTooltip(false);
    setDismissed(true);
    
    // Save dismissed state
    const dismissedTooltips = JSON.parse(localStorage.getItem('dismissed_tooltips') || '[]');
    if (!dismissedTooltips.includes(featureId)) {
      dismissedTooltips.push(featureId);
      localStorage.setItem('dismissed_tooltips', JSON.stringify(dismissedTooltips));
    }
  };

  const tooltip = tooltips[featureId];
  if (!tooltip || !tooltipsEnabled || dismissed || disabled) {
    return <>{children}</>;
  }

  return (
    <div className="relative inline-block">
      {children}
      
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute z-50 ${
              tooltip.position === 'bottom' ? 'top-full mt-2 left-0' :
              tooltip.position === 'top' ? 'bottom-full mb-2 left-0' :
              tooltip.position === 'left' ? 'right-full mr-2 top-0' :
              'left-full ml-2 top-0'
            }`}
            style={{ minWidth: '280px', maxWidth: '320px' }}
          >
            <Card className={`border-2 shadow-xl ${
              tooltip.highlight 
                ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-indigo-50' 
                : 'border-blue-300 bg-white'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      tooltip.highlight ? 'bg-purple-600' : 'bg-blue-600'
                    }`}>
                      <Lightbulb className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm">{tooltip.title}</h4>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDismiss}
                    className="h-6 w-6 -mt-1 -mr-1"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mb-3">{tooltip.description}</p>
                <Button
                  onClick={handleDismiss}
                  size="sm"
                  className={`w-full ${
                    tooltip.highlight 
                      ? 'bg-purple-600 hover:bg-purple-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  Got it
                  <ArrowRight className="w-3 h-3 ml-2" />
                </Button>
              </CardContent>
            </Card>
            
            {/* Arrow pointer */}
            <div className={`absolute ${
              tooltip.position === 'bottom' ? '-top-2 left-4' :
              tooltip.position === 'top' ? '-bottom-2 left-4' :
              tooltip.position === 'left' ? 'top-4 -right-2' :
              'top-4 -left-2'
            } w-4 h-4 rotate-45 ${
              tooltip.highlight ? 'bg-purple-50 border-l-2 border-t-2 border-purple-400' : 'bg-white border-l-2 border-t-2 border-blue-300'
            }`}></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Tooltip trigger component for hover-based tooltips
export function TooltipTrigger({ content, children, position = 'top' }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </div>
      
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 pointer-events-none ${
              position === 'top' ? 'bottom-full mb-2 left-1/2 -translate-x-1/2' :
              position === 'bottom' ? 'top-full mt-2 left-1/2 -translate-x-1/2' :
              position === 'left' ? 'right-full mr-2 top-1/2 -translate-y-1/2' :
              'left-full ml-2 top-1/2 -translate-y-1/2'
            }`}
          >
            <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg max-w-xs whitespace-normal">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
