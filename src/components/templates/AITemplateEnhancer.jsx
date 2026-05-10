
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Sparkles, CheckCircle2, TrendingUp, Tags, FileText } from "lucide-react";
import { apiClient } from "@/apis/client";

export default function AITemplateEnhancer({ 
  template,
  onApplyEnhancements
}) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [enhancements, setEnhancements] = useState(null);

  const analyzeTemplate = async () => {
    if (!template?.content) return;

    setIsAnalyzing(true);
    setEnhancements(null);

    try {
      const prompt = `You are an expert at analyzing and improving prompts. Analyze this prompt and provide enhancement suggestions.

CURRENT PROMPT:
Title: ${template.title || 'Untitled'}
Description: ${template.description || 'No description'}
Category: ${template.category || 'Other'}
Subcategory: ${template.subcategory || 'None'}
Content: ${template.content}
Tags: ${template.tags?.join(', ') || 'None'}

ANALYZE AND PROVIDE:

1. IMPROVED DESCRIPTION (if current is weak or missing)
   - Clear, concise description of what the prompt does
   - When to use it
   - Expected outcomes

2. CATEGORY & SUBCATEGORY SUGGESTIONS
   - Most appropriate category from: Writing, Coding, Business, Creative, Marketing, Research, Education, Relations, Personas, Health & Wellness, Finance & Investment, Legal, Productivity, Sales, Design, Gaming, Food & Cooking, Travel & Lifestyle, Career Development, Personal Development, Data & Analytics, AI & Machine Learning, Social Media, E-commerce, Other
   - Specific subcategory that fits best
   - Reasoning for the categorization

3. AUTO-GENERATED TAGS (8-12 relevant tags)
   - Keywords that describe the prompt
   - Use cases
   - Target audience
   - Related concepts

4. CONTENT IMPROVEMENTS (optional refinements)
   - Clarity enhancements
   - Missing placeholders that should be added
   - Structure improvements

5. QUALITY SCORE (1-100)
   - Overall prompt quality assessment
   - Strengths
   - Areas for improvement

Return this JSON structure:
{
  "improved_description": "string",
  "suggested_category": "string",
  "suggested_subcategory": "string",
  "category_reasoning": "string",
  "suggested_tags": ["tag1", "tag2", ...],
  "content_improvements": {
    "clarity_suggestions": ["suggestion1", "suggestion2"],
    "missing_placeholders": ["placeholder1", "placeholder2"],
    "structure_suggestions": ["suggestion1", "suggestion2"]
  },
  "quality_score": 85,
  "strengths": ["strength1", "strength2"],
  "improvements_needed": ["improvement1", "improvement2"]
}`;

      const response = await apiClient.integrations.Core.InvokeLLMwithLogging({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            improved_description: { type: "string" },
            suggested_category: { type: "string" },
            suggested_subcategory: { type: "string" },
            category_reasoning: { type: "string" },
            suggested_tags: {
              type: "array",
              items: { type: "string" }
            },
            content_improvements: {
              type: "object",
              properties: {
                clarity_suggestions: {
                  type: "array",
                  items: { type: "string" }
                },
                missing_placeholders: {
                  type: "array",
                  items: { type: "string" }
                },
                structure_suggestions: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            },
            quality_score: { type: "number" },
            strengths: {
              type: "array",
              items: { type: "string" }
            },
            improvements_needed: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setEnhancements(response);
    } catch (error) {
      console.error('Failed to analyze prompt:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyDescription = () => {
    if (enhancements && onApplyEnhancements) {
      onApplyEnhancements({
        description: enhancements.improved_description
      });
    }
  };

  const handleApplyCategory = () => {
    if (enhancements && onApplyEnhancements) {
      onApplyEnhancements({
        category: enhancements.suggested_category,
        subcategory: enhancements.suggested_subcategory
      });
    }
  };

  const handleApplyTags = () => {
    if (enhancements && onApplyEnhancements) {
      onApplyEnhancements({
        tags: enhancements.suggested_tags
      });
    }
  };

  const handleApplyAll = () => {
    if (enhancements && onApplyEnhancements) {
      onApplyEnhancements({
        description: enhancements.improved_description,
        category: enhancements.suggested_category,
        subcategory: enhancements.suggested_subcategory,
        tags: enhancements.suggested_tags
      });
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Prompt Enhancer
          </CardTitle>
          <CardDescription>
            Automatically improve descriptions, categorization, and tags
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={analyzeTemplate}
            disabled={isAnalyzing || !template?.content}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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
                Analyze & Enhance
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {enhancements && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <CardTitle>Enhancement Suggestions</CardTitle>
              </div>
              <div className="flex items-center gap-3">
                <div className={`px-4 py-2 rounded-lg font-bold text-lg ${getScoreColor(enhancements.quality_score)}`}>
                  Score: {enhancements.quality_score}/100
                </div>
                <Button
                  onClick={handleApplyAll}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Apply All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quality Assessment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="space-y-2">
                <h4 className="font-semibold text-green-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Strengths
                </h4>
                <div className="bg-white p-3 rounded-lg border border-green-300">
                  <ul className="space-y-1">
                    {enhancements.strengths.map((strength, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Improvements Needed */}
              <div className="space-y-2">
                <h4 className="font-semibold text-orange-700 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Areas to Improve
                </h4>
                <div className="bg-white p-3 rounded-lg border border-orange-300">
                  <ul className="space-y-1">
                    {enhancements.improvements_needed.map((improvement, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-orange-600">→</span>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Improved Description */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  Improved Description
                </h4>
                <Button onClick={handleApplyDescription} variant="outline" size="sm">
                  Apply
                </Button>
              </div>
              <div className="bg-white p-4 rounded-lg border border-green-300">
                <p className="text-sm">{enhancements.improved_description}</p>
              </div>
              {template.description && (
                <div className="text-xs text-gray-500">
                  <strong>Current:</strong> {template.description}
                </div>
              )}
            </div>

            {/* Category & Subcategory */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">Category & Subcategory</h4>
                <Button onClick={handleApplyCategory} variant="outline" size="sm">
                  Apply
                </Button>
              </div>
              <div className="bg-white p-4 rounded-lg border border-green-300 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-600">{enhancements.suggested_category}</Badge>
                  {enhancements.suggested_subcategory && (
                    <>
                      <span className="text-gray-400">→</span>
                      <Badge variant="outline">{enhancements.suggested_subcategory}</Badge>
                    </>
                  )}
                </div>
                <p className="text-sm text-gray-700">
                  <strong>Reasoning:</strong> {enhancements.category_reasoning}
                </p>
                {(template.category || template.subcategory) && (
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    <strong>Current:</strong> {template.category}
                    {template.subcategory && ` → ${template.subcategory}`}
                  </div>
                )}
              </div>
            </div>

            {/* Suggested Tags */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Tags className="w-4 h-4 text-purple-600" />
                  Suggested Tags
                </h4>
                <Button onClick={handleApplyTags} variant="outline" size="sm">
                  Apply
                </Button>
              </div>
              <div className="bg-white p-4 rounded-lg border border-green-300">
                <div className="flex flex-wrap gap-2">
                  {enhancements.suggested_tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
              {template.tags && template.tags.length > 0 && (
                <div className="text-xs text-gray-500">
                  <strong>Current tags:</strong>{' '}
                  {template.tags.map(t => `#${t}`).join(', ')}
                </div>
              )}
            </div>

            {/* Content Improvements */}
            {(enhancements.content_improvements.clarity_suggestions.length > 0 ||
              enhancements.content_improvements.missing_placeholders.length > 0 ||
              enhancements.content_improvements.structure_suggestions.length > 0) && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Content Improvement Suggestions</h4>
                <div className="bg-white p-4 rounded-lg border border-blue-300 space-y-3">
                  {enhancements.content_improvements.clarity_suggestions.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Clarity:</p>
                      <ul className="space-y-1">
                        {enhancements.content_improvements.clarity_suggestions.map((suggestion, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-blue-600">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {enhancements.content_improvements.missing_placeholders.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Missing Placeholders:</p>
                      <div className="flex flex-wrap gap-2">
                        {enhancements.content_improvements.missing_placeholders.map((ph, idx) => (
                          <Badge key={idx} variant="outline" className="bg-blue-50">
                            {ph}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {enhancements.content_improvements.structure_suggestions.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Structure:</p>
                      <ul className="space-y-1">
                        {enhancements.content_improvements.structure_suggestions.map((suggestion, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-blue-600">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
