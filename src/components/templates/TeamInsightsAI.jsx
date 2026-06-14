import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles, 
  TrendingUp, 
  Users, 
  Target,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info
} from "lucide-react";
import { client } from "@/apis/client";

export default function TeamInsightsAI({ template, allTemplates = [], onApplySuggestion }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState(null);

  const analyzeTeamUsage = () => {
    if (!template.team_usage_stats) return null;

    const stats = template.team_usage_stats;
    const sharedTemplates = allTemplates.filter(t => 
      t.visibility === 'shared' || (t.collaborators && t.collaborators.length > 0)
    );

    return {
      totalUses: stats.total_uses || 0,
      uniqueUsers: (stats.unique_users || []).length,
      avgRating: stats.avg_rating || 0,
      successRate: stats.success_rate || 0,
      comparisonData: {
        avgSharedTemplateUses: sharedTemplates.reduce((sum, t) => sum + (t.use_count || 0), 0) / (sharedTemplates.length || 1),
        avgSharedTemplateRating: sharedTemplates.reduce((sum, t) => sum + (t.rating || 0), 0) / (sharedTemplates.length || 1)
      }
    };
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setInsights(null);

    try {
      const usageData = analyzeTeamUsage();
      const collaboratorEmails = (template.collaborators || []).map(c => c.email);

      const analysisPrompt = `You are an expert AI collaboration and template optimization specialist. Analyze this team template's usage patterns and provide actionable insights.

Template Information:
Title: ${template.title}
Category: ${template.category}
Current Version: ${template.version || 1}
Collaborators: ${collaboratorEmails.length}
Visibility: ${template.visibility}

Team Usage Statistics:
- Total Uses: ${usageData?.totalUses || 0}
- Unique Team Members: ${usageData?.uniqueUsers || 0}
- Average Team Rating: ${usageData?.avgRating || 0}/5
- Success Rate: ${usageData?.successRate || 0}%

Comparison Data:
- Average shared template uses: ${usageData?.comparisonData.avgSharedTemplateUses.toFixed(1)}
- Average shared template rating: ${usageData?.comparisonData.avgSharedTemplateRating.toFixed(1)}

Current Content:
${template.content}

Analyze and provide:
1. Overall template health (good/needs improvement/poor)
2. Key strengths of the template
3. Specific areas for improvement
4. Team collaboration insights
5. Actionable suggestions to increase adoption and effectiveness
6. Best practices this template follows or should follow

Return JSON with this structure:
{
  "health": "good/needs improvement/poor",
  "healthScore": 0-100,
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "teamInsights": ["insight1", "insight2"],
  "suggestions": [
    {
      "title": "Suggestion Title",
      "description": "Detailed description",
      "priority": "high/medium/low",
      "expectedImpact": "Description of expected improvement"
    }
  ],
  "bestPractices": ["practice1", "practice2"]
}`;

      const response = await client.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            health: { type: "string" },
            healthScore: { type: "number" },
            strengths: { type: "array", items: { type: "string" } },
            improvements: { type: "array", items: { type: "string" } },
            teamInsights: { type: "array", items: { type: "string" } },
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  priority: { type: "string" },
                  expectedImpact: { type: "string" }
                }
              }
            },
            bestPractices: { type: "array", items: { type: "string" } }
          }
        }
      });

      setInsights(response);
    } catch (error) {
      console.error('Failed to analyze template:', error);
      setInsights({
        health: "error",
        healthScore: 0,
        strengths: [],
        improvements: ["Failed to analyze. Please try again."],
        teamInsights: [],
        suggestions: [],
        bestPractices: []
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const usageData = analyzeTeamUsage();

  const getHealthColor = (health) => {
    switch (health) {
      case 'good': return 'text-green-600 bg-green-50 border-green-200';
      case 'needs improvement': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-600';
      case 'medium': return 'bg-yellow-600';
      case 'low': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Team Insights
          </CardTitle>
          <CardDescription>
            Get AI-powered recommendations based on team usage patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Team Usage Stats */}
          {usageData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">{usageData.totalUses}</div>
                <div className="text-xs text-gray-600">Total Uses</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-indigo-200">
                <div className="text-2xl font-bold text-indigo-600">{usageData.uniqueUsers}</div>
                <div className="text-xs text-gray-600">Team Members</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{usageData.avgRating.toFixed(1)}</div>
                <div className="text-xs text-gray-600">Avg Rating</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">{usageData.successRate}%</div>
                <div className="text-xs text-gray-600">Success Rate</div>
              </div>
            </div>
          )}

          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing Team Data...
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5 mr-2" />
                Analyze with AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Insights Results */}
      {insights && (
        <>
          {/* Health Score */}
          <Card className={`border-2 ${getHealthColor(insights.health)}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Template Health Score</CardTitle>
                <Badge className={getPriorityColor(insights.health === 'good' ? 'low' : insights.health === 'needs improvement' ? 'medium' : 'high')}>
                  {insights.health}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={insights.healthScore} className="h-3 mb-2" />
              <p className="text-sm text-gray-600 text-center">
                {insights.healthScore}/100 Health Score
              </p>
            </CardContent>
          </Card>

          {/* Strengths */}
          {insights.strengths?.length > 0 && (
            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {insights.strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Team Insights */}
          {insights.teamInsights?.length > 0 && (
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Team Collaboration Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {insights.teamInsights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Actionable Suggestions */}
          {insights.suggestions?.length > 0 && (
            <Card className="border-2 border-purple-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  Actionable Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {insights.suggestions.map((suggestion, idx) => (
                  <Card key={idx} className="bg-white">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{suggestion.title}</h4>
                            <Badge className={getPriorityColor(suggestion.priority)}>
                              {suggestion.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{suggestion.description}</p>
                          <Alert className="mt-2">
                            <TrendingUp className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              <strong>Expected Impact:</strong> {suggestion.expectedImpact}
                            </AlertDescription>
                          </Alert>
                        </div>
                      </div>
                      {onApplySuggestion && (
                        <Button
                          size="sm"
                          onClick={() => onApplySuggestion(suggestion)}
                          className="w-full"
                        >
                          Apply This Suggestion
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Improvements */}
          {insights.improvements?.length > 0 && (
            <Card className="border-2 border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {insights.improvements.map((improvement, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Best Practices */}
          {insights.bestPractices?.length > 0 && (
            <Card className="border-2 border-indigo-200 bg-indigo-50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  Best Practices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {insights.bestPractices.map((practice, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <span>{practice}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
