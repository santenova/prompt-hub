import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Lightbulb } from 'lucide-react';

export default function FeatureTooltip({ id, title, description, position = 'bottom', children, enabled = true }) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);

  useEffect(() => {
    // Check if this tooltip has been dismissed before
    const dismissedTooltips = JSON.parse(localStorage.getItem('dismissedTooltips') || '{}');
    
    if (!dismissedTooltips[id] && enabled && !hasBeenShown) {
      // Show tooltip after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
        setHasBeenShown(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [id, enabled, hasBeenShown]);

  const handleDismiss = () => {
    setIsVisible(false);
    // Remember that this tooltip was dismissed
    const dismissedTooltips = JSON.parse(localStorage.getItem('dismissedTooltips') || '{}');
    dismissedTooltips[id] = true;
    localStorage.setItem('dismissedTooltips', JSON.stringify(dismissedTooltips));
  };

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2'
  };

  return (
    <div className="relative inline-block">
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: position === 'bottom' ? -10 : 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`absolute ${positionClasses[position]} left-0 z-50 w-64 sm:w-80`}
          >
            <Card className="border-2 border-purple-200 shadow-xl bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
                    <p className="text-sm text-gray-700">{description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDismiss}
                    className="h-6 w-6 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button
                    onClick={handleDismiss}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-xs"
                  >
                    Got it!
                  </Button>
                </div>
              </CardContent>
            </Card>
            {/* Arrow */}
            <div
              className={`absolute ${
                position === 'bottom'
                  ? 'bottom-full left-4 border-l-8 border-r-8 border-b-8 border-transparent border-b-purple-200'
                  : 'top-full left-4 border-l-8 border-r-8 border-t-8 border-transparent border-t-purple-200'
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}