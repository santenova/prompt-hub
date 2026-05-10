import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, ArrowRight, ChevronRight } from "lucide-react";
import { apiClient } from "@/apis/client";
import { motion, AnimatePresence } from "framer-motion";

export default function RealTimeSuggestions({ 
  content, 
  title,
  category,
  onApplySuggestion,
  isEnabled = true 
}) {
  const [suggestions, setSuggestions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAnalyzedContent, setLastAnalyzedContent] = useState('');
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (!isEnabled || !content || content.length < 10) {
      setSuggestions(null);
      return;
    }

    // Don't re-analyze if content hasn't changed significantly
    if (Math.abs(content.length - lastAnalyzedContent.length) < 5 && content === lastAnalyzedContent) {
      return;
    }

    // Debounce the API call
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      analyzeLiveContent();
    }, 1500); // Wait 1.5 seconds after user stops typing

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [content, isEnabled]);

  const analyzeLiveContent = async () => {
    if (content === lastAnalyzedContent) return;
    
    setIsLoading(true);
    
    try {
      const response = await apiClient.integrations.Core.InvokeLLMwithLogging({
        prompt: `You are an AI prompt engineering assistant. Analyze this partial prompt and provide real-time suggestions:

Title: "${title || 'Untitled'}"
Category: ${category || 'General'}
Current Content: "${content}"

Based on what's written so far, provide contextual suggestions in this JSON format:
{
  "completions": [
    {
      "text": "<suggested completion or continuation>",
      "type": "completion",
      "reason": "<why this suggestion makes sense>"
    }
  ],
  "placeholders": [
    {
      "placeholder": "{variable_name}",
      "suggestion": "<where and how to use it>",
      "example": "<example value>"
    }
  ],
  "structure_suggestions": [
    {
      "element": "<what to add next, e.g., 'constraints', 'examples', 'output format'>",
      "template": "<suggested text to add>",
      "benefit": "<why add this>"
    }
  ],
  "quick_fixes": [
    {
      "issue": "<potential issue detected>",
      "fix": "<suggested improvement>"
    }
  ]
}

Focus on practical, actionable suggestions that improve prompt quality.`,
        response_json_schema: {
          type: "object",
          properties: {
            completions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  type: { type: "string" },
                  reason: { type: "string" }
                }
              }
            },
            placeholders: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  placeholder: { type: "string" },
                  suggestion: { type: "string" },
                  example: { type: "string" }
                }
              }
            },
            structure_suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  element: { type: "string" },
                  template: { type: "string" },
                  benefit: { type: "string" }
                }
              }
            },
            quick_fixes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  issue: { type: "string" },
                  fix: { type: "string" }
                }
              }
            }
          }
        }
      });

      setSuggestions(response);
      setLastAnalyzedContent(content);
    } catch (err) {
      console.error("Failed to get suggestions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = (text) => {
    if (onApplySuggestion) {
      onApplySuggestion(text);
    }
  };

  if (!isEnabled) return null;

  return (
    <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white sticky top-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <CardTitle className="text-base">Smart Suggestions</CardTitle>
          </div>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
        {!suggestions && !isLoading && content.length < 10 ? (
          <p className="text-sm text-gray-600 text-center py-4">
            Start typing to get AI-powered suggestions...
          </p>
        ) : isLoading ? (
          <div className="text-center py-6">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Analyzing your prompt...</p>
          </div>
        ) : suggestions ? (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Completions */}
              {suggestions.completions?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-indigo-700 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" />
                    Suggested Continuations
                  </h4>
                  {suggestions.completions.map((item, idx) => (
                    <Card 
                      key={idx} 
                      className="bg-white border-indigo-200 cursor-pointer hover:bg-indigo-50 transition-colors"
                      onClick={() => handleApply(` ${item.text}`)}
                    >
                      <CardContent className="pt-3 pb-3 space-y-2">
                        <p className="text-sm text-gray-800">"{item.text}"</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-600 italic">{item.reason}</p>
                          <Button size="sm" variant="ghost" className="h-6 text-xs">
                            <ArrowRight className="w-3 h-3 mr-1" />
                            Apply
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Placeholders */}
              {suggestions.placeholders?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-purple-700 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" />
                    Dynamic Placeholders
                  </h4>
                  {suggestions.placeholders.map((item, idx) => (
                    <Card 
                      key={idx} 
                      className="bg-purple-50 border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors"
                      onClick={() => handleApply(` ${item.placeholder}`)}
                    >
                      <CardContent className="pt-3 pb-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-purple-600 font-mono text-xs">
                            {item.placeholder}
                          </Badge>
                          <Button size="sm" variant="ghost" className="h-6 text-xs">
                            <ArrowRight className="w-3 h-3 mr-1" />
                            Add
                          </Button>
                        </div>
                        <p className="text-xs text-gray-700">{item.suggestion}</p>
                        <p className="text-xs text-gray-600">Example: "{item.example}"</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Structure Suggestions */}
              {suggestions.structure_suggestions?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-green-700 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" />
                    Structure Improvements
                  </h4>
                  {suggestions.structure_suggestions.map((item, idx) => (
                    <Card 
                      key={idx} 
                      className="bg-green-50 border-green-200 cursor-pointer hover:bg-green-100 transition-colors"
                      onClick={() => handleApply(`\n\n${item.template}`)}
                    >
                      <CardContent className="pt-3 pb-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs border-green-600 text-green-700">
                            Add {item.element}
                          </Badge>
                          <Button size="sm" variant="ghost" className="h-6 text-xs">
                            <ArrowRight className="w-3 h-3 mr-1" />
                            Insert
                          </Button>
                        </div>
                        <p className="text-sm text-gray-800 font-mono bg-white p-2 rounded border border-gray-200">
                          {item.template}
                        </p>
                        <p className="text-xs text-gray-600 italic">💡 {item.benefit}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Quick Fixes */}
              {suggestions.quick_fixes?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-amber-700 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" />
                    Quick Fixes
                  </h4>
                  {suggestions.quick_fixes.map((item, idx) => (
                    <Card 
                      key={idx} 
                      className="bg-amber-50 border-amber-200"
                    >
                      <CardContent className="pt-3 pb-3 space-y-1">
                        <p className="text-xs font-semibold text-amber-800">⚠️ {item.issue}</p>
                        <p className="text-sm text-gray-800">{item.fix}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        ) : null}
      </CardContent>
    </Card>
  );
}
