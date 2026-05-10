
import React, { useState, useMemo } from "react";
import { apiClient } from "@/apis/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Loader2,
  Target,
  Users,
  Star
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format, subDays } from 'date-fns';

export default function TemplatePerformance() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [dateRange, setDateRange] = useState("30");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const queryClient = useQueryClient();

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await apiClient.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => apiClient.entities.Template.list('-updated_date'),
    initialData: [],
  });

  const myTemplates = useMemo(() => {
    return templates.filter(t => t.created_by === currentUser?.email);
  }, [templates, currentUser]);

  // Performance calculations
  const performanceData = useMemo(() => {
    return myTemplates.map(template => {
      const useCount = template.use_count || 0;
      const rating = template.rating || 0;
      const ratingCount = template.rating_count || 0;
      const engagementScore = (useCount * 0.6) + (rating * ratingCount * 0.4);
      
      return {
        ...template,
        engagementScore,
        performance: rating > 0 ? ((rating / 5) * 100) : 0,
        popularityRank: 0 // Will be calculated after sorting
      };
    }).sort((a, b) => b.engagementScore - a.engagementScore)
      .map((t, idx) => ({ ...t, popularityRank: idx + 1 }));
  }, [myTemplates]);

  // Top performers
  const topPerformers = performanceData.slice(0, 10);
  const underperformers = performanceData.filter(t => t.use_count < 5 && t.rating < 3).slice(0, 10);

  // Category performance
  const categoryPerformance = useMemo(() => {
    const catStats = {};
    myTemplates.forEach(t => {
      if (!catStats[t.category]) {
        catStats[t.category] = {
          count: 0,
          totalUses: 0,
          totalRating: 0,
          ratingCount: 0
        };
      }
      catStats[t.category].count++;
      catStats[t.category].totalUses += (t.use_count || 0);
      if (t.rating > 0) {
        catStats[t.category].totalRating += t.rating;
        catStats[t.category].ratingCount++;
      }
    });

    return Object.entries(catStats).map(([category, stats]) => ({
      category,
      templates: stats.count,
      avgUses: (stats.totalUses / stats.count).toFixed(1),
      avgRating: stats.ratingCount > 0 ? (stats.totalRating / stats.ratingCount).toFixed(1) : 0,
      totalUses: stats.totalUses
    })).sort((a, b) => b.totalUses - a.totalUses);
  }, [myTemplates]);

  const handleAnalyzeWithAI = async () => {
    setIsAnalyzing(true);
    setAiInsights(null);

    try {
      const analysisPrompt = `You are an expert data analyst specializing in AI prompt template performance optimization. Analyze this user's template library and provide actionable insights.

PERFORMANCE DATA:
Total Templates: ${myTemplates.length}
Total Uses: ${myTemplates.reduce((sum, t) => sum + (t.use_count || 0), 0)}
Average Rating: ${(myTemplates.filter(t => t.rating > 0).reduce((sum, t) => sum + t.rating, 0) / myTemplates.filter(t => t.rating > 0).length || 0).toFixed(2)}
Categories: ${[...new Set(myTemplates.map(t => t.category))].join(', ')}

TOP 5 PERFORMERS:
${topPerformers.slice(0, 5).map(t => `- ${t.title}: ${t.use_count} uses, ${t.rating.toFixed(1)}⭐ rating`).join('\n')}

UNDERPERFORMING TEMPLATES:
${underperformers.slice(0, 5).map(t => `- ${t.title}: ${t.use_count} uses, ${t.rating.toFixed(1)}⭐ rating`).join('\n')}

CATEGORY BREAKDOWN:
${categoryPerformance.map(c => `- ${c.category}: ${c.templates} templates, ${c.avgUses} avg uses`).join('\n')}

Provide comprehensive analysis and recommendations:

1. Overall library health
2. Key patterns in top performers vs underperformers
3. Category performance insights
4. Specific templates that need attention
5. Actionable optimization strategies
6. Predicted future performance trends

Return JSON:
{
  "overall_health": {
    "score": 0-100,
    "status": "Excellent/Good/Fair/Poor",
    "summary": "Overall assessment"
  },
  "key_insights": [
    {
      "title": "Insight title",
      "description": "Detailed insight",
      "type": "positive/negative/neutral",
      "impact": "high/medium/low"
    }
  ],
  "optimization_strategies": [
    {
      "strategy": "Strategy name",
      "description": "What to do",
      "expected_improvement": "Expected results",
      "priority": "high/medium/low",
      "steps": ["step1", "step2"]
    }
  ],
  "templates_needing_attention": [
    {
      "template_title": "Title",
      "issue": "What's wrong",
      "recommendation": "How to fix",
      "priority": "high/medium/low"
    }
  ],
  "best_performing_patterns": ["pattern1", "pattern2"],
  "predicted_trends": ["trend1", "trend2"]
}`;

      const response = await apiClient.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            overall_health: {
              type: "object",
              properties: {
                score: { type: "number" },
                status: { type: "string" },
                summary: { type: "string" }
              }
            },
            key_insights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  type: { type: "string" },
                  impact: { type: "string" }
                }
              }
            },
            optimization_strategies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  strategy: { type: "string" },
                  description: { type: "string" },
                  expected_improvement: { type: "string" },
                  priority: { type: "string" },
                  steps: { type: "array", items: { type: "string" } }
                }
              }
            },
            templates_needing_attention: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  template_title: { type: "string" },
                  issue: { type: "string" },
                  recommendation: { type: "string" },
                  priority: { type: "string" }
                }
              }
            },
            best_performing_patterns: { type: "array", items: { type: "string" } },
            predicted_trends: { type: "array", items: { type: "string" } }
          }
        }
      });

      setAiInsights(response);
    } catch (error) {
      console.error('Failed to analyze:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Excellent': return 'bg-green-600';
      case 'Good': return 'bg-blue-600';
      case 'Fair': return 'bg-yellow-600';
      case 'Poor': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getInsightColor = (type) => {
    switch (type) {
      case 'positive': return 'border-green-200 bg-green-50';
      case 'negative': return 'border-red-200 bg-red-50';
      case 'neutral': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold">Template Performance Dashboard</h1>
              <p className="text-purple-100 mt-1">AI-powered insights into your template effectiveness</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-purple-600">{myTemplates.length}</div>
              <div className="text-sm text-gray-600">Your Templates</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-indigo-600">
                {myTemplates.reduce((sum, t) => sum + (t.use_count || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Total Uses</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-amber-600">
                {myTemplates.filter(t => t.rating > 0).length > 0
                  ? (myTemplates.filter(t => t.rating > 0).reduce((sum, t) => sum + t.rating, 0) / myTemplates.filter(t => t.rating > 0).length).toFixed(1)
                  : '—'}
              </div>
              <div className="text-sm text-gray-600">Avg Rating</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600">
                {topPerformers.length}
              </div>
              <div className="text-sm text-gray-600">Top Performers</div>
            </CardContent>
          </Card>
        </div>

        {/* AI Analysis Button */}
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Performance Analysis
            </CardTitle>
            <CardDescription>
              Get comprehensive AI-powered insights into your template library's performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleAnalyzeWithAI}
              disabled={isAnalyzing || myTemplates.length === 0}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing Performance...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Analyze with AI
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* AI Insights */}
        {aiInsights && (
          <>
            {/* Overall Health */}
            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Library Health Score</CardTitle>
                  <Badge className={getStatusColor(aiInsights.overall_health.status)}>
                    {aiInsights.overall_health.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-4xl font-bold text-green-700">
                  {aiInsights.overall_health.score}/100
                </div>
                <p className="text-gray-700">{aiInsights.overall_health.summary}</p>
              </CardContent>
            </Card>

            {/* Key Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {aiInsights.key_insights.map((insight, idx) => (
                  <Card key={idx} className={`border-2 ${getInsightColor(insight.type)}`}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{insight.title}</h4>
                            <Badge className={getPriorityColor(insight.impact)}>
                              {insight.impact} impact
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700">{insight.description}</p>
                        </div>
                        {insight.type === 'positive' && <TrendingUp className="w-5 h-5 text-green-600" />}
                        {insight.type === 'negative' && <TrendingDown className="w-5 h-5 text-red-600" />}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Optimization Strategies */}
            <Card className="border-2 border-indigo-200">
              <CardHeader>
                <CardTitle>AI-Recommended Optimization Strategies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {aiInsights.optimization_strategies.map((strategy, idx) => (
                  <Card key={idx} className="bg-indigo-50">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-lg">{strategy.strategy}</h4>
                            <Badge className={getPriorityColor(strategy.priority)}>
                              {strategy.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-3">{strategy.description}</p>
                          
                          <Alert className="mb-3">
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertDescription>
                              <strong>Expected Improvement:</strong> {strategy.expected_improvement}
                            </AlertDescription>
                          </Alert>

                          <div>
                            <p className="text-sm font-semibold mb-2">Implementation Steps:</p>
                            <ol className="text-sm space-y-1 ml-4">
                              {strategy.steps.map((step, stepIdx) => (
                                <li key={stepIdx} className="list-decimal">{step}</li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Templates Needing Attention */}
            {aiInsights.templates_needing_attention.length > 0 && (
              <Card className="border-2 border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    Templates Needing Attention
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {aiInsights.templates_needing_attention.map((item, idx) => (
                    <Card key={idx} className="bg-white">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{item.template_title}</h4>
                              <Badge className={getPriorityColor(item.priority)}>
                                {item.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">
                              <strong>Issue:</strong> {item.issue}
                            </p>
                            <p className="text-sm text-gray-700">
                              <strong>Recommendation:</strong> {item.recommendation}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Best Performing Patterns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-2 border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    Best Performing Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {aiInsights.best_performing_patterns.map((pattern, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{pattern}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Predicted Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {aiInsights.predicted_trends.map((trend, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span>{trend}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Performance by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="totalUses" fill="#8b5cf6" name="Total Uses" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          {/* Removed Persona Performance Chart as per outline */}
        </div>

        {/* Top & Underperforming Templates */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          <Card className="border-2 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Top Performing Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topPerformers.slice(0, 10).map((template, idx) => (
                  <div key={template.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <Badge variant="secondary">#{idx + 1}</Badge>
                      <div className="flex-1">
                        <p className="font-medium text-sm line-clamp-1">{template.title}</p>
                        <p className="text-xs text-gray-600">{template.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="text-center">
                        <div className="font-bold text-green-600">{template.use_count}</div>
                        <div className="text-xs text-gray-500">uses</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-amber-600">
                          {template.rating > 0 ? template.rating.toFixed(1) : '—'}
                        </div>
                        <div className="text-xs text-gray-500">rating</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Underperformers */}
          <Card className="border-2 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Needs Optimization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {underperformers.length > 0 ? (
                  underperformers.map((template) => (
                    <div key={template.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm line-clamp-1">{template.title}</p>
                        <p className="text-xs text-gray-600">{template.category}</p>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="text-center">
                          <div className="font-bold text-orange-600">{template.use_count}</div>
                          <div className="text-xs text-gray-500">uses</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-amber-600">
                            {template.rating > 0 ? template.rating.toFixed(1) : '—'}
                          </div>
                          <div className="text-xs text-gray-500">rating</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No underperforming templates!</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
