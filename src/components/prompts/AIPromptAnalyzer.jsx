import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  Loader2,
  Tag,
  RefreshCw,
  Wand2,
  Lightbulb,
  CheckCircle2,
  Copy
} from "lucide-react";
import { apiClient } from "@/apis/client";
import { motion, AnimatePresence } from "framer-motion";

export default function AIPromptAnalyzer({ 
  content, 
  title,
  currentTags = [], 
  onApplyTags, 
  onApplyRephrase,
  onApplyPlaceholders,
  category
}) {
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const analyzePrompt = async () => {
    if (!content || content.trim().length < 20) {
      setError("Please enter at least 20 characters to analyze");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await apiClient.integrations.Core.InvokeLLMwithLogging({
        prompt: `Analyze this AI prompt and provide improvement suggestions:

Title: "${title || 'Untitled'}"
Category: ${category || 'General'}
Current Tags: ${currentTags.join(', ') || 'None'}
Content: "${content}"

Provide comprehensive analysis in this JSON format:
{
  "suggested_tags": [<array of 3-5 highly relevant, specific tags that describe this prompt better than current ones - avoid generic tags>],
  "tag_reasoning": "<brief explanation why these tags are better>",
  "rephrased_versions": [
    {
      "version": "<improved version of the prompt with better clarity and structure>",
      "improvements": "<what was improved>"
    },
    {
      "version": "<alternative concise version>",
      "improvements": "<what was improved>"
    }
  ],
  "placeholder_suggestions": [
    {
      "placeholder": "{example_placeholder}",
      "position": "<where in the prompt it should go>",
      "description": "<what this placeholder represents>",
      "example_value": "<example value>"
    }
  ],
  "clarity_score": <0-100>,
  "specificity_score": <0-100>,
  "improvements_summary": "<overall summary of suggested improvements>"
}

Focus on making tags specific and actionable, improving clarity without changing the core intent, and identifying opportunities for dynamic placeholders.`,
        response_json_schema: {
          type: "object",
          properties: {
            suggested_tags: { 
              type: "array", 
              items: { type: "string" } 
            },
            tag_reasoning: { type: "string" },
            rephrased_versions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  version: { type: "string" },
                  improvements: { type: "string" }
                }
              }
            },
            placeholder_suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  placeholder: { type: "string" },
                  position: { type: "string" },
                  description: { type: "string" },
                  example_value: { type: "string" }
                }
              }
            },
            clarity_score: { type: "number" },
            specificity_score: { type: "number" },
            improvements_summary: { type: "string" }
          }
        }
      });

      setAnalysis(response);
    } catch (err) {
      setError(err.message || "Failed to analyze prompt");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyTags = (tags) => {
    if (onApplyTags) {
      onApplyTags(tags);
    }
  };

  const handleApplyRephrase = (version) => {
    if (onApplyRephrase) {
      onApplyRephrase(version);
    }
  };

  const handleApplyPlaceholder = (placeholder) => {
    if (onApplyPlaceholders) {
      onApplyPlaceholders(placeholder);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-700 border-green-300';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-red-100 text-red-700 border-red-300';
  };

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <CardTitle>AI Prompt Analyzer</CardTitle>
          </div>
          {analysis && (
            <Button
              onClick={analyzePrompt}
              variant="outline"
              size="sm"
              disabled={isAnalyzing}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Re-analyze
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!analysis ? (
          <Button
            onClick={analyzePrompt}
            disabled={isAnalyzing || !content}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing Prompt...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Analyze & Get Suggestions
              </>
            )}
          </Button>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Quality Scores */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-lg border-2 ${getScoreColor(analysis.clarity_score)}`}>
                  <div className="text-2xl font-bold">{analysis.clarity_score}</div>
                  <div className="text-xs font-medium">Clarity</div>
                </div>
                <div className={`p-3 rounded-lg border-2 ${getScoreColor(analysis.specificity_score)}`}>
                  <div className="text-2xl font-bold">{analysis.specificity_score}</div>
                  <div className="text-xs font-medium">Specificity</div>
                </div>
              </div>

              {analysis.improvements_summary && (
                <Alert className="bg-blue-50 border-blue-200">
                  <Lightbulb className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-sm text-blue-900">
                    {analysis.improvements_summary}
                  </AlertDescription>
                </Alert>
              )}

              <Tabs defaultValue="tags" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="tags">
                    <Tag className="w-4 h-4 mr-1" />
                    Tags
                  </TabsTrigger>
                  <TabsTrigger value="rephrase">
                    <Wand2 className="w-4 h-4 mr-1" />
                    Rephrase
                  </TabsTrigger>
                  <TabsTrigger value="placeholders">
                    <Sparkles className="w-4 h-4 mr-1" />
                    Placeholders
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="tags" className="space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-700">
                      Suggested Tags
                    </h4>
                    <Button
                      onClick={() => handleApplyTags(analysis.suggested_tags)}
                      variant="outline"
                      size="sm"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Apply All
                    </Button>
                  </div>
                  
                  <p className="text-xs text-gray-600 italic">
                    {analysis.tag_reasoning}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {analysis.suggested_tags?.map((tag, idx) => (
                      <Badge
                        key={idx}
                        className="px-3 py-1.5 bg-purple-100 text-purple-800 cursor-pointer hover:bg-purple-200 transition-colors border border-purple-300"
                        onClick={() => handleApplyTags([tag])}
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="rephrase" className="space-y-4 mt-4">
                  {analysis.rephrased_versions?.map((item, idx) => (
                    <Card key={idx} className="bg-green-50 border-green-200">
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            Version {idx + 1}
                          </Badge>
                          <Button
                            onClick={() => handleApplyRephrase(item.version)}
                            variant="default"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Apply
                          </Button>
                        </div>
                        
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">
                          {item.version}
                        </p>

                        <p className="text-xs text-green-700 italic">
                          ✓ {item.improvements}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="placeholders" className="space-y-3 mt-4">
                  {analysis.placeholder_suggestions?.length > 0 ? (
                    <>
                      <p className="text-xs text-gray-600">
                        Click on a suggestion to add it to your prompt
                      </p>
                      
                      {analysis.placeholder_suggestions.map((item, idx) => (
                        <Card 
                          key={idx} 
                          className="bg-indigo-50 border-indigo-200 cursor-pointer hover:bg-indigo-100 transition-colors"
                          onClick={() => handleApplyPlaceholder(item)}
                        >
                          <CardContent className="pt-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge className="bg-indigo-600 text-white font-mono">
                                {item.placeholder}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(item.placeholder);
                                }}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                            
                            <div className="space-y-1 text-sm">
                              <p className="text-gray-700">
                                <span className="font-semibold">Where:</span> {item.position}
                              </p>
                              <p className="text-gray-700">
                                <span className="font-semibold">Purpose:</span> {item.description}
                              </p>
                              <p className="text-gray-600 text-xs">
                                <span className="font-semibold">Example:</span> "{item.example_value}"
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </>
                  ) : (
                    <p className="text-sm text-gray-600 text-center py-4">
                      No placeholder suggestions for this prompt
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>
          </AnimatePresence>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
