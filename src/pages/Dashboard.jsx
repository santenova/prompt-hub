
import React, { useState, useMemo } from "react";
import { apiClient } from "@/apis/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Settings, 
  Download, 
  Upload, 
  Trash2, 
  Tags, 
  FileText,
  BarChart3,
  User,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Target,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield
} from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { format, subDays } from 'date-fns';

const COLORS = ['#8b5cf6', '#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444', '#10b981', '#3b82f6'];

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTag, setSelectedTag] = useState("All");
  const [dateRange, setDateRange] = useState("30");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await apiClient.auth.me();
        setCurrentUser(user);
        
        // Redirect if not admin
        if (user.role !== 'admin') {
          window.location.href = '/';
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        window.location.href = '/';
      }
    };
    fetchUser();
  }, []);

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => apiClient.entities.Template.list('-created_date'),
    initialData: [],
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const myTemplates = templates.filter(t => t.created_by === currentUser?.email);
      const deletePromises = myTemplates.map(template => 
        apiClient.entities.Template.delete(template.id)
      );
      await Promise.all(deletePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
      toast({
        title: "Success",
        description: "All your templates have been deleted.",
      });
    },
  });

  const handleExport = () => {
    const myTemplates = templates.filter(t => t.created_by === currentUser?.email);
    const dataStr = JSON.stringify(myTemplates, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `template-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exported",
      description: `${myTemplates.length} templates exported successfully.`,
    });
  };

  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target?.result);
        
        for (const template of importedData) {
          const { id, created_date, updated_date, created_by, created_by_id, entity_name, app_id, is_sample, is_deleted, deleted_date, ...data } = template.data || template;
          await apiClient.entities.Template.create(data);
        }
        
        queryClient.invalidateQueries(['templates']);
        toast({
          title: "Imported",
          description: `${importedData.length} templates imported successfully.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to import templates. Please check the file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const filteredTemplatesByDate = useMemo(() => {
    if (dateRange === "all") return templates;
    
    const daysAgo = parseInt(dateRange);
    const startDate = subDays(new Date(), daysAgo);
    
    return templates.filter(t => {
      const createdDate = new Date(t.created_date);
      return createdDate >= startDate;
    });
  }, [templates, dateRange]);

  const filteredTemplates = useMemo(() => {
    let filtered = filteredTemplatesByDate;
    
    if (selectedCategory !== "All") {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }
    
    if (selectedTag !== "All") {
      filtered = filtered.filter(t => t.tags && t.tags.includes(selectedTag));
    }
    
    return filtered;
  }, [filteredTemplatesByDate, selectedCategory, selectedTag]);

  const myTemplates = templates.filter(t => t.created_by === currentUser?.email);
  const totalUses = filteredTemplates.reduce((sum, t) => sum + (t.use_count || 0), 0);
  const avgRating = filteredTemplates.filter(t => t.rating > 0).reduce((sum, t) => sum + t.rating, 0) / filteredTemplates.filter(t => t.rating > 0).length || 0;
  
  const mostUsedTemplates = [...filteredTemplates]
    .sort((a, b) => (b.use_count || 0) - (a.use_count || 0))
    .slice(0, 10);

  const tagUsage = useMemo(() => {
    const tagCounts = {};
    filteredTemplates.forEach(t => {
      if (t.tags) {
        t.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + (t.use_count || 0);
        });
      }
    });
    
    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredTemplates]);

  const categoryData = useMemo(() => {
    const counts = {};
    filteredTemplates.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTemplates]);

  const creationTrend = useMemo(() => {
    const days = parseInt(dateRange === "all" ? "30" : dateRange);
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'MMM d');
      
      const count = templates.filter(t => {
        const created = new Date(t.created_date);
        return format(created, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
      }).length;
      
      data.push({ date: dateStr, templates: count });
    }
    
    return data;
  }, [templates, dateRange]);

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
        popularityRank: 0
      };
    }).sort((a, b) => b.engagementScore - a.engagementScore)
      .map((t, idx) => ({ ...t, popularityRank: idx + 1 }));
  }, [myTemplates]);

  const topPerformers = performanceData.slice(0, 10);
  const underperformers = performanceData.filter(t => t.use_count < 5 && t.rating < 3).slice(0, 10);

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
      const analysisPrompt = `You are an expert data analyst specializing in prompt template performance optimization. Analyze this user's template library and provide actionable insights.

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

Provide comprehensive analysis and recommendations.`;

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
            prompts_needing_attention: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  prompt_title: { type: "string" },
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

  // Filter out empty/null categories and tags
  const allCategories = useMemo(() => {
    return [...new Set(templates.map(t => t.category).filter(c => c && c.trim() !== ''))].sort();
  }, [templates]);

  const allTags = useMemo(() => {
    return [...new Set(templates.flatMap(t => t.tags || []).filter(tag => tag && tag.trim() !== ''))].sort();
  }, [templates]);

  // Don't render anything if user is not loaded or not admin
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <Card className="border-2 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Shield className="w-6 h-6" />
              Admin Access Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">This page is only accessible to administrators.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8" />
              <div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-purple-100 mt-1">Comprehensive analytics, data management & AI insights</p>
              </div>
            </div>
            <Badge className="bg-white/20 text-white border-white/30 text-sm px-4 py-2">
              Admin Only
            </Badge>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto">
            <TabsTrigger value="performance">
              <TrendingUp className="w-4 h-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="data">
              <FileText className="w-4 h-4 mr-2" />
              Data
            </TabsTrigger>
            <TabsTrigger value="tags">
              <Tags className="w-4 h-4 mr-2" />
              Tags
            </TabsTrigger>
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-8">
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
                {aiInsights.prompts_needing_attention && aiInsights.prompts_needing_attention.length > 0 && (
                  <Card className="border-2 border-orange-200 bg-orange-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                        Templates Needing Attention
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {aiInsights.prompts_needing_attention.map((item, idx) => (
                        <Card key={idx} className="bg-white">
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-3">
                              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold">{item.prompt_title}</h4>
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

            {/* Top & Underperforming Templates */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Date Range</Label>
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">Last 7 Days</SelectItem>
                        <SelectItem value="30">Last 30 Days</SelectItem>
                        <SelectItem value="90">Last 90 Days</SelectItem>
                        <SelectItem value="365">Last Year</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        <SelectItem value="All">All Categories</SelectItem>
                        {allCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tag</Label>
                    <Select value={selectedTag} onValueChange={setSelectedTag}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        <SelectItem value="All">All Tags</SelectItem>
                        {allTags.slice(0, 50).map((tag) => (
                          <SelectItem key={tag} value={tag}>#{tag}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{filteredTemplates.length}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {myTemplates.length} created by you
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Uses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-indigo-600">{totalUses}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Across filtered templates
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Avg Rating</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-600">
                    {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {filteredTemplates.filter(t => t.rating > 0).length} rated templates
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Public Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-pink-600">
                    {templates.filter(t => t.visibility === 'public').length}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Shared with community
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    Template Creation Trend
                  </CardTitle>
                  <CardDescription>New templates created over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={creationTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="templates" stroke="#8b5cf6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Category Distribution</CardTitle>
                  <CardDescription>Templates by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Most Used & Top Tags */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Most Used Templates</CardTitle>
                  <CardDescription>Top 10 by usage count</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mostUsedTemplates.length > 0 ? (
                      mostUsedTemplates.map((template, idx) => (
                        <div key={template.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">#{idx + 1}</Badge>
                              <p className="font-medium text-sm text-gray-900 line-clamp-1">
                                {template.title}
                              </p>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {template.category}
                            </p>
                          </div>
                          <Badge className="bg-purple-600 text-white">
                            {template.use_count || 0} uses
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">No usage data yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Tags by Usage</CardTitle>
                  <CardDescription>Tags with most template uses</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={tagUsage} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="tag" type="category" width={100} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Data Management Tab */}
          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Templates</CardTitle>
                <CardDescription>Download your templates as a JSON file</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleExport} className="w-full md:w-auto">
                  <Download className="w-4 h-4 mr-2" />
                  Export My Templates ({myTemplates.length})
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Import Templates</CardTitle>
                <CardDescription>Import templates from a JSON file</CardDescription>
              </CardHeader>
              <CardContent>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                  id="import-file"
                />
                <label htmlFor="import-file">
                  <Button asChild className="w-full md:w-auto cursor-pointer">
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Import Templates
                    </span>
                  </Button>
                </label>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions - proceed with caution</CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full md:w-auto">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete All My Templates
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all {myTemplates.length} of your templates. 
                        This action cannot be undone. Consider exporting first.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteAllMutation.mutate()}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete All My Templates
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tags Tab */}
          <TabsContent value="tags" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Tags</CardTitle>
                <CardDescription>
                  {allTags.length} unique tags across {templates.length} templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {allTags.sort().map((tag, idx) => {
                    const count = templates.filter(t => t.tags?.includes(tag)).length;
                    return (
                      <Badge key={idx} variant="secondary" className="text-sm">
                        #{tag} ({count})
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <p className="text-lg font-semibold mt-1">{currentUser?.email || 'Loading...'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                  <p className="text-lg font-semibold mt-1">{currentUser?.full_name || 'Loading...'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Role</Label>
                  <Badge className="mt-1 bg-purple-600">{currentUser?.role || 'user'}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Contribution</CardTitle>
                <CardDescription>Templates you've created</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-purple-600 mb-2">{myTemplates.length}</div>
                <p className="text-sm text-gray-600">
                  You've contributed {myTemplates.length} templates to your library
                </p>
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Your templates used</p>
                      <p className="text-2xl font-bold text-indigo-600">
                        {myTemplates.reduce((sum, t) => sum + (t.use_count || 0), 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Your favorites</p>
                      <p className="text-2xl font-bold text-pink-600">
                        {templates.filter(t => t.is_favorite).length}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
