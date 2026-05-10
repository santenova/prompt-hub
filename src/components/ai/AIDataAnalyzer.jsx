import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Loader2, BarChart3, TrendingUp, PieChart, Upload, FileText, Download, Sparkles } from 'lucide-react';
import { apiClient } from '@/apis/client';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, PieChart as RechartPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export default function AIDataAnalyzer({ chatMessages = [], personas = [] }) {
  const [fileUrl, setFileUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [dataSource, setDataSource] = useState('file'); // 'file', 'chat', 'personas'
  const { toast } = useToast();

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await apiClient.integrations.Core.UploadFile({ file });
      setFileUrl(file_url);
      toast({
        title: "File Uploaded",
        description: "Ready to analyze"
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const analyzeData = async () => {
    setIsAnalyzing(true);
    try {
      let dataToAnalyze = '';
      let analysisContext = '';

      if (dataSource === 'file' && fileUrl) {
        // Fetch file content directly
        const response = await fetch(fileUrl);
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('json')) {
          const jsonData = await response.json();
          dataToAnalyze = JSON.stringify(jsonData);
        } else {
          dataToAnalyze = await response.text();
        }
        analysisContext = 'uploaded file data';
      } else if (dataSource === 'chat') {
        dataToAnalyze = chatMessages.map(m => m.content).join('\n');
        analysisContext = 'chat conversation data';
      } else if (dataSource === 'personas') {
        dataToAnalyze = JSON.stringify(personas.map(p => ({
          name: p.name,
          category: p.category,
          expertise: p.expertise_areas,
          use_count: p.use_count,
          rating: p.rating
        })));
        analysisContext = 'personas data';
      }

      const analysis = await apiClient.integrations.Core.InvokeLLM({
        prompt: `You are a data analysis expert. Analyze the following ${analysisContext} and extract meaningful insights.

Data:
${dataToAnalyze.substring(0, 8000)}

Provide a comprehensive analysis in JSON format with:
1. summary: Brief overview of the data
2. key_metrics: Array of {name, value, trend} objects
3. insights: Array of key findings (strings)
4. visualizations: Array of chart configurations with {type: 'bar'|'line'|'pie', title, data: [{name, value}]}
5. recommendations: Array of actionable recommendations
6. data_quality_score: 1-100 rating of data completeness`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            key_metrics: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  value: { type: "string" },
                  trend: { type: "string" }
                }
              }
            },
            insights: { type: "array", items: { type: "string" } },
            visualizations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  title: { type: "string" },
                  data: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        value: { type: "number" }
                      }
                    }
                  }
                }
              }
            },
            recommendations: { type: "array", items: { type: "string" } },
            data_quality_score: { type: "number" }
          }
        }
      });

      setAnalysisResults(analysis);

      // Save to ContentHistory
      await apiClient.entities.ContentHistory.create({
        tool_type: 'ai_data_analyzer',
        analysis_data_source: dataSource,
        analysis_file_url: dataSource === 'file' ? fileUrl : null,
        analysis_results: analysis,
        status: 'completed'
      });

      // Save to User Profile
      const user = await apiClient.auth.me();
      const currentAnalyses = user.data_analyses || [];
      await apiClient.auth.updateMe({
        data_analyses: [
          {
            data_source: dataSource,
            file_url: dataSource === 'file' ? fileUrl : null,
            file_name: dataSource === 'file' ? 'uploaded-file' : dataSource,
            summary: analysis.summary,
            key_metrics: analysis.key_metrics || [],
            insights: analysis.insights || [],
            recommendations: analysis.recommendations || [],
            data_quality_score: analysis.data_quality_score,
            created_date: new Date().toISOString(),
            is_favorite: false,
            tags: []
          },
          ...currentAnalyses
        ].slice(0, 50) // Keep last 50 analyses
      });

      toast({
        title: "Analysis Complete & Saved",
        description: `Found ${analysis.insights?.length || 0} insights and saved to history`
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportReport = () => {
    if (!analysisResults) return;

    const report = `AI Data Analysis Report
Generated: ${new Date().toLocaleString()}

SUMMARY
${analysisResults.summary}

KEY METRICS
${analysisResults.key_metrics?.map(m => `- ${m.name}: ${m.value} (${m.trend})`).join('\n') || 'None'}

INSIGHTS
${analysisResults.insights?.map((insight, i) => `${i + 1}. ${insight}`).join('\n') || 'None'}

RECOMMENDATIONS
${analysisResults.recommendations?.map((rec, i) => `${i + 1}. ${rec}`).join('\n') || 'None'}

Data Quality Score: ${analysisResults.data_quality_score || 0}/100
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-analysis-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: "Analysis report downloaded"
    });
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-green-200 bg-gradient-to-br from-white to-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            AI Data Analysis Tool
          </CardTitle>
          <CardDescription>
            Process and visualize data from files, chats, or personas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Data Source Selection */}
          <div className="space-y-2">
            <Label className="text-sm">Data Source</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={dataSource === 'file' ? 'default' : 'outline'}
                onClick={() => setDataSource('file')}
                size="sm"
                className={dataSource === 'file' ? 'bg-green-600' : ''}
              >
                <Upload className="w-4 h-4 mr-1" />
                File
              </Button>
              <Button
                variant={dataSource === 'chat' ? 'default' : 'outline'}
                onClick={() => setDataSource('chat')}
                size="sm"
                className={dataSource === 'chat' ? 'bg-green-600' : ''}
                disabled={chatMessages.length === 0}
              >
                <FileText className="w-4 h-4 mr-1" />
                Chat
              </Button>
              <Button
                variant={dataSource === 'personas' ? 'default' : 'outline'}
                onClick={() => setDataSource('personas')}
                size="sm"
                className={dataSource === 'personas' ? 'bg-green-600' : ''}
                disabled={personas.length === 0}
              >
                <TrendingUp className="w-4 h-4 mr-1" />
                Personas
              </Button>
            </div>
          </div>

          {/* File Upload */}
          {dataSource === 'file' && (
            <div className="space-y-2">
              <Label>Upload Data File</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls,.json,.txt"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="flex-1"
                />
                {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
              </div>
              {fileUrl && (
                <Badge className="bg-green-100 text-green-700">
                  File ready for analysis
                </Badge>
              )}
            </div>
          )}

          {/* Analyze Button */}
          <Button
            onClick={analyzeData}
            disabled={
              isAnalyzing ||
              (dataSource === 'file' && !fileUrl) ||
              (dataSource === 'chat' && chatMessages.length === 0) ||
              (dataSource === 'personas' && personas.length === 0)
            }
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Data...
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4 mr-2" />
                Analyze with AI
              </>
            )}
          </Button>

          {/* Analysis Results */}
          {analysisResults && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Analysis Results</h3>
                  <Button onClick={exportReport} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>

                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="visualizations">Charts</TabsTrigger>
                    <TabsTrigger value="insights">Insights</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-3">
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="pt-4">
                        <p className="text-sm text-gray-700">{analysisResults.summary}</p>
                      </CardContent>
                    </Card>

                    {analysisResults.key_metrics?.length > 0 && (
                      <div className="grid grid-cols-2 gap-3">
                        {analysisResults.key_metrics.map((metric, idx) => (
                          <Card key={idx} className="bg-white">
                            <CardContent className="pt-4">
                              <p className="text-xs text-gray-500">{metric.name}</p>
                              <p className="text-xl font-bold text-gray-900">{metric.value}</p>
                              <Badge variant="outline" className="mt-1 text-xs">
                                {metric.trend}
                              </Badge>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Data Quality</span>
                          <span className="text-2xl font-bold text-green-600">
                            {analysisResults.data_quality_score || 0}%
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="visualizations" className="space-y-4">
                    {analysisResults.visualizations?.map((viz, idx) => (
                      <Card key={idx}>
                        <CardHeader>
                          <CardTitle className="text-sm">{viz.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={250}>
                            {viz.type === 'bar' && (
                              <BarChart data={viz.data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#8b5cf6" />
                              </BarChart>
                            )}
                            {viz.type === 'line' && (
                              <LineChart data={viz.data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} />
                              </LineChart>
                            )}
                            {viz.type === 'pie' && (
                              <RechartPieChart>
                                <Pie
                                  data={viz.data}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {viz.data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </RechartPieChart>
                            )}
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    ))}
                    {(!analysisResults.visualizations || analysisResults.visualizations.length === 0) && (
                      <p className="text-sm text-gray-500 text-center py-8">No visualizations available</p>
                    )}
                  </TabsContent>

                  <TabsContent value="insights" className="space-y-3">
                    {analysisResults.insights?.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          Key Insights
                        </h3>
                        <div className="space-y-2">
                          {analysisResults.insights.map((insight, idx) => (
                            <Card key={idx} className="bg-blue-50 border-blue-200">
                              <CardContent className="pt-4">
                                <p className="text-sm text-gray-700">{insight}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysisResults.recommendations?.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-600" />
                          Recommendations
                        </h3>
                        <ul className="space-y-2">
                          {analysisResults.recommendations.map((rec, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2 p-3 bg-white rounded-lg border">
                              <span className="text-purple-600 font-bold">{idx + 1}.</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </motion.div>
            </AnimatePresence>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
