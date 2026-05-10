import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Shuffle, Copy, CheckCircle2, Sparkles } from "lucide-react";

const categoryColors = {
  Writing: "bg-blue-100 text-blue-800",
  Marketing: "bg-purple-100 text-purple-800",
  Development: "bg-green-100 text-green-800",
  Coding: "bg-green-100 text-green-800",
  Design: "bg-pink-100 text-pink-800",
  Business: "bg-yellow-100 text-yellow-800",
  Education: "bg-indigo-100 text-indigo-800",
  Personal: "bg-gray-100 text-gray-800",
};

export default function RandomPromptGenerator({ open, onOpenChange, prompts, onCopy }) {
  const [currentPrompt, setCurrentPrompt] = React.useState(null);
  const [copied, setCopied] = React.useState(false);

  const getRandomPrompt = () => {
    if (prompts.length > 0) {
      const randomIndex = Math.floor(Math.random() * prompts.length);
      setCurrentPrompt(prompts[randomIndex]);
    }
  };

  React.useEffect(() => {
    if (open && prompts.length > 0 && !currentPrompt) {
      getRandomPrompt();
    }
  }, [open]);

  const handleCopy = async () => {
    if (currentPrompt) {
      // Load user settings and enhance the prompt
      const STORAGE_KEY = "prompt_muse_pro_settings";
      let settings = null;
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          settings = JSON.parse(saved);
        }
      } catch (error) {
        console.error("Failed to load settings", error);
      }

      let enhancedPrompt = currentPrompt.content;
      if (settings) {
        const { enhancePromptWithSettings } = await import("../../utils");
        enhancedPrompt = enhancePromptWithSettings(currentPrompt.content, settings);
      }
      
      // Copy enhanced prompt to clipboard
      await navigator.clipboard.writeText(enhancedPrompt);
      setCopied(true);
      onCopy(currentPrompt);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Random Prompt Generator
          </DialogTitle>
        </DialogHeader>

        {prompts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No prompts available yet.</p>
          </div>
        ) : currentPrompt ? (
          <div className="space-y-6">
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {currentPrompt.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge className={categoryColors[currentPrompt.category] || categoryColors.Personal}>
                        {currentPrompt.category}
                      </Badge>
                      {currentPrompt.subcategory && (
                        <Badge variant="outline">
                          {currentPrompt.subcategory}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {currentPrompt.content}
                </p>

                {currentPrompt.tags && currentPrompt.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
                    {currentPrompt.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                onClick={getRandomPrompt}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                <Shuffle className="w-5 h-5 mr-2" />
                Get Another
              </Button>
              <Button
                onClick={handleCopy}
                size="lg"
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 mr-2" />
                    Copy Prompt
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}