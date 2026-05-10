import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/apis/client';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Search,
  Calendar,
  Star,
  StarOff,
  TrendingUp,
  Download,
  Loader2,
  FileText
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BarChart, Bar, LineChart, Line, PieChart as RechartPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export default function AnalysisHistory() {
  const [analyses, setAnalyses] = useState([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalyses();
  }, []);

  useEffect(() => {
    filterAnalyses();
  }, [searchQuery, analyses]);

  const loadAnalyses = async () => {
    try {
      setLoading(true);
      const user = await apiClient.auth.me();
      setAnalyses(user.data_analyses || []);
      setFilteredAnalyses(user.data_analyses || []);
    } catch (error) {
      console.error('Failed to load analyses:', error);
      toast({
        title: "Load Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAnalyses = () => {
    if (!searchQuery.trim()) {
      setFilteredAnalyses(analyses);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = analyses.filter(analysis => 
      analysis.summary?.toLowerCase().includes(query) ||
      analysis.data_source?.toLowerCase().includes(query) ||
      analysis.file_name?.toLowerCase().includes(query) ||
      analysis.insights?.some(insight => insight.toLowerCase().includes(query)) ||
      analysis.tags?.some(tag => tag.toLowerCase().includes(query))
    );
    setFilteredAnalyses(filtered);
  };

  const toggleFavorite = async (index) => {
    const updatedAnalyses = [...analyses];
    updatedAnalyses[index].is_favorite = !updatedAnalyses[index].is_favorite;
    
    try {
      await apiClient.auth.updateMe({
        data_analyses: updatedAnalyses
      });
      setAnalyses(updatedAnalyses);
      toast({
        title: updatedAnalyses[index].is_favorite ? "Added to Favorites" : "Removed from Favorites",
        description: "Analysis updated"
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const exportAnalysis = (analysis) => {
    const report = `AI Data Analysis Report
Generated: ${new Date(analysis.created_date).toLocaleString()}
Data Source: ${analysis.data_source}

SUMMARY
${analysis.summary}

KEY METRICS
${analysis.key_metrics?.map(m => `- ${m.name}: ${m.value} (${m.trend})`).join('\n') || 'None'}

INSIGHTS
${analysis.insights?.map((insight, i) => `${i + 1}. ${insight}`).join('\n') || 'None'}

RECOMMENDATIONS
${analysis.recommendations?.map((rec, i) => `${i + 1}. ${rec}`).join('\n') || 'None'}

Data Quality Score: ${analysis.data_quality_score || 0}/100
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: "Analysis report downloaded"
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              Analysis History
            </CardTitle>
            <Badge className="bg-green-600">{analyses.length} total</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by summary, source, insights, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredAnalyses.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">
                {searchQuery ? 'No analyses found' : 'No analyses yet'}
              </p>
              <p className="text-sm">
                {searchQuery ? 'Try a different search term' : 'Start analyzing data with the AI Data Analyzer'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence>
                {filteredAnalyses.map((analysis, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                      <CardContent className="p-4" onClick={() => setSelectedAnalysis(analysis)}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-green-600">
                                {analysis.data_source}
                              </Badge>
                              {analysis.data_quality_score && (
                                <Badge variant="outline">
                                  Quality: {analysis.data_quality_score}%
                                </Badge>
                              )}
                              {analysis.file_name && (
                                <Badge variant="outline" className="bg-blue-50">
                                  <FileText className="w-3 h-3 mr-1" />
                                  {analysis.file_name}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                              {analysis.summary}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                {analysis.insights?.length || 0} insights
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(analysis.created_date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(idx);
                              }}
                            >
                              {analysis.is_favorite ? (
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              ) : (
                                <StarOff className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                exportAnalysis(analysis);
                              }}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {analysis.key_metrics && analysis.key_metrics.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {analysis.key_metrics.slice(0, 3).map((metric, midx) => (
                              <div key={midx} className="px-2 py-1 bg-green-100 rounded text-xs">
                                <span className="font-semibold">{metric.name}:</span> {metric.value}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Detail Modal */}
      <Dialog open={!!selectedAnalysis} onOpenChange={() => setSelectedAnalysis(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              Analysis Details
            </DialogTitle>
          </DialogHeader>
          {selectedAnalysis && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600">{selectedAnalysis.data_source}</Badge>
                {selectedAnalysis.file_name && (
                  <Badge variant="outline">{selectedAnalysis.file_name}</Badge>
                )}
                <Badge variant="outline">
                  Quality: {selectedAnalysis.data_quality_score}%
                </Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Summary</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedAnalysis.summary}</p>
                </div>

                {selectedAnalysis.key_metrics && selectedAnalysis.key_metrics.length > 0 && (
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Key Metrics</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedAnalysis.key_metrics.map((metric, idx) => (
                        <div key={idx} className="p-3 bg-green-50 rounded border">
                          <p className="text-xs text-gray-600">{metric.name}</p>
                          <p className="text-lg font-bold text-gray-900">{metric.value}</p>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {metric.trend}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAnalysis.insights && selectedAnalysis.insights.length > 0 && (
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Insights</Label>
                    <div className="space-y-2">
                      {selectedAnalysis.insights.map((insight, idx) => (
                        <div key={idx} className="p-3 bg-blue-50 rounded border border-blue-200">
                          <p className="text-sm text-gray-700">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAnalysis.recommendations && selectedAnalysis.recommendations.length > 0 && (
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Recommendations</Label>
                    <ul className="space-y-2">
                      {selectedAnalysis.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2 p-3 bg-white rounded border">
                          <span className="text-green-600 font-bold">{idx + 1}.</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedAnalysis.created_date && (
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Created</Label>
                    <p className="text-sm text-gray-900 mt-1">
                      {new Date(selectedAnalysis.created_date).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              <Button
                onClick={() => exportAnalysis(selectedAnalysis)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
