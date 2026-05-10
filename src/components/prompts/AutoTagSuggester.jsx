import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Tags, Sparkles, Plus, Check } from "lucide-react";
import { apiClient } from "@/apis/client";

export default function AutoTagSuggester({ content, title, category, currentTags = [], onApplyTags }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  const analyzeTags = async () => {
    setIsAnalyzing(true);
    setSuggestedTags([]);
    setSelectedTags([]);

    try {
      const analysisPrompt = `You are an expert at content analysis and tagging. Analyze this content and suggest relevant, searchable tags.

CONTENT TO ANALYZE:
Title: ${title}
Category: ${category}
Content: ${content}
Existing Tags: ${currentTags.join(', ') || 'None'}

TAGGING CRITERIA:
1. Function-based tags (what it does): e.g., "generation", "analysis", "optimization", "summarization"
2. Domain-specific tags: e.g., "marketing", "technical", "creative", "business"
3. Use-case tags: e.g., "content-creation", "code-review", "email-writing", "planning"
4. Audience tags: e.g., "professional", "beginner", "advanced", "executive"
5. Output tags: e.g., "structured", "creative", "analytical", "strategic"
6. Industry tags: e.g., "tech", "finance", "healthcare", "education"

REQUIREMENTS:
- Suggest 8-12 highly relevant tags
- Tags should be lowercase, hyphenated for multiple words
- Focus on searchability and categorization
- Avoid duplicating existing tags
- Make tags specific but not too niche
- Consider both functional and contextual relevance

Return JSON:
{
  "suggested_tags": [
    {
      "tag": "tag-name",
      "relevance": "high/medium/low",
      "reason": "Why this tag is relevant"
    }
  ],
  "category_tags": ["tags specific to category"],
  "function_tags": ["tags about what it does"],
  "audience_tags": ["tags about who it's for"]
}`;

      const response = await apiClient.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            suggested_tags: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  tag: { type: "string" },
                  relevance: { type: "string" },
                  reason: { type: "string" }
                }
              }
            },
            category_tags: { type: "array", items: { type: "string" } },
            function_tags: { type: "array", items: { type: "string" } },
            audience_tags: { type: "array", items: { type: "string" } }
          }
        }
      });

      setSuggestedTags(response.suggested_tags || []);
    } catch (error) {
      console.error('Failed to suggest tags:', error);
      setSuggestedTags([]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleApplyTags = () => {
    if (onApplyTags) {
      onApplyTags(selectedTags);
    }
  };

  const getRelevanceColor = (relevance) => {
    switch (relevance) {
      case 'high': return 'border-green-500 bg-green-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tags className="w-5 h-5 text-indigo-600" />
            AI Tag Suggester
          </CardTitle>
          <CardDescription>
            Automatically generate relevant tags to improve searchability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentTags.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Current Tags:</p>
              <div className="flex flex-wrap gap-2">
                {currentTags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary">#{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={analyzeTags}
            disabled={isAnalyzing || !content}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Content...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Suggest Tags with AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {suggestedTags.length > 0 && (
        <Card className="border-2 border-purple-200">
          <CardHeader>
            <CardTitle className="text-base">Suggested Tags</CardTitle>
            <CardDescription>
              Click tags to select them, then apply your selection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              {suggestedTags.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => toggleTag(item.tag)}
                  className={`
                    p-3 rounded-lg border-2 cursor-pointer transition-all
                    ${selectedTags.includes(item.tag) 
                      ? 'border-purple-500 bg-purple-100' 
                      : getRelevanceColor(item.relevance)
                    }
                    hover:shadow-md
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">#{item.tag}</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            item.relevance === 'high' ? 'border-green-600 text-green-700' :
                            item.relevance === 'medium' ? 'border-yellow-600 text-yellow-700' :
                            'border-blue-600 text-blue-700'
                          }`}
                        >
                          {item.relevance}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">{item.reason}</p>
                    </div>
                    {selectedTags.includes(item.tag) && (
                      <Check className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {selectedTags.length > 0 && (
              <div className="space-y-3">
                <Alert>
                  <AlertDescription>
                    <strong>{selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} selected</strong>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedTags.map((tag, idx) => (
                        <Badge key={idx} className="bg-purple-600">#{tag}</Badge>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={handleApplyTags}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Apply Selected Tags ({selectedTags.length})
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
