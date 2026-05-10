import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Zap, CheckCircle2, ArrowRight, TrendingUp } from "lucide-react";
import { apiClient } from "@/apis/client";

export default function PromptEnhancer({ prompt, allPrompts = [], onApplyEnhancement }) {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancement, setEnhancement] = useState(null);

  const analyzeUsagePatterns = () => {
    if (allPrompts.length === 0) return null;
    
    // Get high-performing prompts in same category
    const similarPrompts = allPrompts
      .filter(p => p.category === prompt.category && p.use_count > 0)
      .sort((a, b) => (b.use_count || 0) - (a.use_count || 0))
      .slice(0, 3);
    
    // Get high-rated prompts
    const topRated = allPrompts
      .filter(p => p.rating >= 4)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 3);
    
    return {
      similarPrompts,
      topRated,
      avgLength: Math.floor(allPrompts.reduce((sum, p) => sum + p.content.length, 0) / allPrompts.length),
      avgUseCount: Math.floor(allPrompts.reduce((sum, p) => sum + (p.use_count || 0), 0) / allPrompts.length)
    };
  };

  const handleEnhance = async () => {
    setIsEnhancing(true);
    setEnhancement(null);
    
    try {
      const usageData = analyzeUsagePatterns();
      
      const enhancementPrompt = `You are an expert AI prompt engineer. Analyze and enhance this prompt to make it more effective.

Current Prompt:
Title: ${prompt.title}
Content: ${prompt.content}
Category: ${prompt.category}
Persona: ${prompt.persona || 'None'}
Current Performance: ${prompt.use_count || 0} uses, ${prompt.rating || 0} rating

${usageData ? `
Usage Data Insights:
- Top performing prompts in this category have an average of ${usageData.avgUseCount} uses
- Average prompt length: ${usageData.avgLength} characters
- High-rated prompts (4+ stars) characteristics: ${JSON.stringify(usageData.topRated.map(p => ({ title: p.title, structure: p.content.substring(0, 100) })))}
` : ''}

Best Practices to Apply:
1. Clear structure with explicit instructions
2. Appropriate use of placeholders ({input}, {topic}, etc.)
3. Specific, actionable directives
4. Context-aware language for the persona
5. Output format specification
6. Examples when beneficial

Provide:
1. Enhanced version of the prompt (improved clarity, structure, effectiveness)
2. Specific improvements made (bullet points)
3. Additional placeholders or tags to consider
4. Estimated improvement explanation

Return a JSON object with this structure:
{
  "enhancedPrompt": "The improved prompt text",
  "improvements": ["Improvement 1", "Improvement 2"],
  "suggestedPlaceholders": ["placeholder1", "placeholder2"],
  "suggestedTags": ["tag1", "tag2"],
  "improvementExplanation": "Why these changes will improve performance"
}`;

      const response = await apiClient.integrations.Core.InvokeLLM({
        prompt: enhancementPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            enhancedPrompt: { type: "string" },
            improvements: { type: "array", items: { type: "string" } },
            suggestedPlaceholders: { type: "array", items: { type: "string" } },
            suggestedTags: { type: "array", items: { type: "string" } },
            improvementExplanation: { type: "string" }
          }
        }
      });

      setEnhancement(response);
    } catch (error) {
      console.error('Failed to enhance prompt:', error);
      setEnhancement({
        enhancedPrompt: prompt.content,
        improvements: ["Failed to generate enhancements. Please try again."],
        suggestedPlaceholders: [],
        suggestedTags: [],
        improvementExplanation: error.message
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600" />
            AI Prompt Enhancer
          </CardTitle>
          <CardDescription>
            Improve your prompt with AI-powered suggestions based on best practices and usage data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {allPrompts.length > 0 && (
            <Alert className="bg-blue-50 border-blue-200">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                Enhancement will use insights from {allPrompts.length} existing prompts to optimize performance.
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">Current Prompt:</Label>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{prompt.content}</p>
          </div>

          <Button
            onClick={handleEnhance}
            disabled={isEnhancing}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            size="lg"
          >
            {isEnhancing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing & Enhancing...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Enhance Prompt with AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Enhancement Results */}
      {enhancement && (
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Enhanced Prompt
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-lg border-2 border-green-300">
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">Improved Version:</Label>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{enhancement.enhancedPrompt}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-green-600" />
                Key Improvements:
              </Label>
              <ul className="space-y-2">
                {enhancement.improvements?.map((improvement, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>

            {enhancement.improvementExplanation && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-900 text-sm">
                  <strong>Why this works:</strong> {enhancement.improvementExplanation}
                </AlertDescription>
              </Alert>
            )}

            {enhancement.suggestedPlaceholders && enhancement.suggestedPlaceholders.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Suggested Placeholders:</Label>
                <div className="flex flex-wrap gap-2">
                  {enhancement.suggestedPlaceholders.map((placeholder, idx) => (
                    <Badge key={idx} variant="outline" className="bg-purple-50 border-purple-300">
                      {placeholder}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {enhancement.suggestedTags && enhancement.suggestedTags.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Suggested Tags:</Label>
                <div className="flex flex-wrap gap-2">
                  {enhancement.suggestedTags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={() => onApplyEnhancement({
                content: enhancement.enhancedPrompt,
                tags: [...(prompt.tags || []), ...(enhancement.suggestedTags || [])]
              })}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              size="lg"
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Apply Enhancement
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
