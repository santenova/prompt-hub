import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  Sparkles, 
  Copy, 
  FileText,
  Hash,
  Lightbulb,
  Loader2
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { apiClient } from "@/apis/client";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const summaryTypes = [
  { value: 'executive', label: 'Executive Summary', description: 'High-level overview for decision makers' },
  { value: 'abstract', label: 'Abstract', description: 'Academic-style concise summary' },
  { value: 'takeaways', label: 'Key Takeaways', description: 'Bullet-point highlights' },
  { value: 'tldr', label: 'TL;DR', description: 'Ultra-brief summary' },
  { value: 'detailed', label: 'Detailed Summary', description: 'Comprehensive recap' }
];

export default function DocumentAnalyzer({ document, onAnalysisComplete }) {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [summaryType, setSummaryType] = useState('executive');
  const [summaryLength, setSummaryLength] = useState([150]);
  const [focusArea, setFocusArea] = useState('general');
  const [analysis, setAnalysis] = useState(null);

  const analyzeSummary = async () => {
    if (!document.content) return;

    setIsAnalyzing(true);
    try {
      const typeConfig = summaryTypes.find(t => t.value === summaryType);
      const prompt = `Generate a ${typeConfig.label} for this document.

Document Title: ${document.title}
Content:
${document.content}

Requirements:
- Type: ${typeConfig.description}
- Target Length: ${summaryLength[0]} words
- Focus: ${focusArea}
- Maintain professional tone
${summaryType === 'takeaways' ? '- Format as bullet points' : ''}
${summaryType === 'abstract' ? '- Include purpose, methods, and conclusions' : ''}

Return only the summary text.`;

      const summary = await apiClient.integrations.Core.InvokeLLMwithLogging({ prompt });
      
      setAnalysis(prev => ({ ...prev, summary }));
      toast({
        title: "Summary Generated",
        description: `Created ${typeConfig.label}`
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

  const extractKeywords = async () => {
    if (!document.content) return;

    setIsAnalyzing(true);
    try {
      const prompt = `Extract relevant keywords and key phrases from this document.

Document:
${document.content}

Requirements:
- Extract 10-15 most important keywords/phrases
- Focus on main topics, concepts, and themes
- Include both single words and multi-word phrases
- Prioritize domain-specific terminology

Return as JSON:
{
  "keywords": ["keyword1", "keyword2", ...],
  "relevance_scores": [0.95, 0.90, ...]
}`;

      const result = await apiClient.integrations.Core.InvokeLLMwithLogging({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            keywords: { type: "array", items: { type: "string" } },
            relevance_scores: { type: "array", items: { type: "number" } }
          }
        }
      });

      setAnalysis(prev => ({ ...prev, keywords: result.keywords, scores: result.relevance_scores }));
      
      if (onAnalysisComplete) {
        onAnalysisComplete({ keywords: result.keywords });
      }

      toast({
        title: "Keywords Extracted",
        description: `Found ${result.keywords.length} keywords`
      });
    } catch (error) {
      toast({
        title: "Extraction Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateTags = async () => {
    if (!document.content) return;

    setIsAnalyzing(true);
    try {
      const prompt = `Generate relevant tags for categorizing this document.

Document Title: ${document.title}
Content:
${document.content}

Requirements:
- Generate 5-10 descriptive tags
- Tags should be single words or short phrases
- Cover topics, document type, audience, and purpose
- Use lowercase, hyphenated format (e.g., "machine-learning", "research-paper")

Return as JSON:
{
  "tags": ["tag1", "tag2", ...],
  "categories": ["category1", "category2", ...]
}`;

      const result = await apiClient.integrations.Core.InvokeLLMwithLogging({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            tags: { type: "array", items: { type: "string" } },
            categories: { type: "array", items: { type: "string" } }
          }
        }
      });

      setAnalysis(prev => ({ ...prev, tags: result.tags, categories: result.categories }));
      
      if (onAnalysisComplete) {
        onAnalysisComplete({ tags: result.tags });
      }

      toast({
        title: "Tags Generated",
        description: `Created ${result.tags.length} tags`
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runFullAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      await Promise.all([
        analyzeSummary(),
        extractKeywords(),
        generateTags()
      ]);
      toast({
        title: "Full Analysis Complete",
        description: "Generated summary, keywords, and tags"
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied" });
  };

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          AI Document Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">
              <FileText className="w-4 h-4 mr-2" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="keywords">
              <Hash className="w-4 h-4 mr-2" />
              Keywords
            </TabsTrigger>
            <TabsTrigger value="tags">
              <Lightbulb className="w-4 h-4 mr-2" />
              Tags
            </TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Summary Type</Label>
                <Select value={summaryType} onValueChange={setSummaryType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {summaryTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-600">
                  {summaryTypes.find(t => t.value === summaryType)?.description}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Target Length: {summaryLength[0]} words</Label>
                <Slider
                  value={summaryLength}
                  onValueChange={setSummaryLength}
                  min={50}
                  max={500}
                  step={25}
                />
              </div>

              <div className="space-y-2">
                <Label>Focus Area</Label>
                <Select value={focusArea} onValueChange={setFocusArea}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Overview</SelectItem>
                    <SelectItem value="technical">Technical Details</SelectItem>
                    <SelectItem value="business">Business Impact</SelectItem>
                    <SelectItem value="methodology">Methodology</SelectItem>
                    <SelectItem value="results">Results & Findings</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={analyzeSummary}
                disabled={isAnalyzing || !document.content}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Summary
                  </>
                )}
              </Button>
            </div>

            {analysis?.summary && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Label>Generated Summary</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(analysis.summary)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <p className="text-sm text-gray-800">{analysis.summary}</p>
                </div>
              </motion.div>
            )}
          </TabsContent>

          {/* Keywords Tab */}
          <TabsContent value="keywords" className="space-y-4 mt-4">
            <Button
              onClick={extractKeywords}
              disabled={isAnalyzing || !document.content}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Hash className="w-4 h-4 mr-2" />
                  Extract Keywords
                </>
              )}
            </Button>

            {analysis?.keywords && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <Label>Extracted Keywords</Label>
                <div className="flex flex-wrap gap-2">
                  {analysis.keywords.map((keyword, idx) => (
                    <Badge 
                      key={idx} 
                      variant="outline"
                      className="text-sm cursor-pointer hover:bg-blue-100"
                      onClick={() => copyToClipboard(keyword)}
                    >
                      {keyword}
                      {analysis.scores?.[idx] && (
                        <span className="ml-1 text-xs text-gray-500">
                          {Math.round(analysis.scores[idx] * 100)}%
                        </span>
                      )}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            )}
          </TabsContent>

          {/* Tags Tab */}
          <TabsContent value="tags" className="space-y-4 mt-4">
            <Button
              onClick={generateTags}
              disabled={isAnalyzing || !document.content}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Generate Tags
                </>
              )}
            </Button>

            {analysis?.tags && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div>
                  <Label>Generated Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {analysis.tags.map((tag, idx) => (
                      <Badge 
                        key={idx}
                        className="bg-green-600 cursor-pointer"
                        onClick={() => copyToClipboard(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {analysis.categories && (
                  <div>
                    <Label>Categories</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {analysis.categories.map((cat, idx) => (
                        <Badge 
                          key={idx}
                          variant="outline"
                          className="cursor-pointer"
                          onClick={() => copyToClipboard(cat)}
                        >
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </TabsContent>
        </Tabs>

        <div className="pt-4 border-t">
          <Button
            onClick={runFullAnalysis}
            disabled={isAnalyzing || !document.content}
            variant="outline"
            className="w-full"
          >
            <Brain className="w-4 h-4 mr-2" />
            Run Full Analysis
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
