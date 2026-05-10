import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CheckCircle, Sparkles, Loader2, Copy, Check, TrendingUp, ArrowDownToLine } from 'lucide-react';
import { apiClient } from '@/apis/client';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function WritingRefinementTool({ initialContent = '' }) {
  const [content, setContent] = useState(() => {
    try {
      const saved = localStorage.getItem('writingRefinement_content');
      return saved || initialContent;
    } catch {
      return initialContent;
    }
  });
  const [refinedContent, setRefinedContent] = useState(() => {
    try {
      return localStorage.getItem('writingRefinement_refined') || '';
    } catch {
      return '';
    }
  });
  const [isRefining, setIsRefining] = useState(false);
  const [grammarIssues, setGrammarIssues] = useState(() => {
    try {
      const saved = localStorage.getItem('writingRefinement_grammar');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [styleScore, setStyleScore] = useState(() => {
    try {
      const saved = localStorage.getItem('writingRefinement_style');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [seoSuggestions, setSeoSuggestions] = useState(() => {
    try {
      const saved = localStorage.getItem('writingRefinement_seo');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [copied, setCopied] = useState(false);
  const [refinementMode, setRefinementMode] = useState('comprehensive');
  const [options, setOptions] = useState(() => {
    try {
      const saved = localStorage.getItem('writingRefinement_options');
      return saved ? JSON.parse(saved) : {
        fixGrammar: true,
        improveStyle: true,
        optimizeSEO: true,
        enhanceReadability: true
      };
    } catch {
      return {
        fixGrammar: true,
        improveStyle: true,
        optimizeSEO: true,
        enhanceReadability: true
      };
    }
  });
  const { toast } = useToast();

  // Persist content
  React.useEffect(() => {
    localStorage.setItem('writingRefinement_content', content);
  }, [content]);

  // Persist refined content
  React.useEffect(() => {
    localStorage.setItem('writingRefinement_refined', refinedContent);
  }, [refinedContent]);

  // Persist grammar issues
  React.useEffect(() => {
    localStorage.setItem('writingRefinement_grammar', JSON.stringify(grammarIssues));
  }, [grammarIssues]);

  // Persist style score
  React.useEffect(() => {
    localStorage.setItem('writingRefinement_style', JSON.stringify(styleScore));
  }, [styleScore]);

  // Persist SEO suggestions
  React.useEffect(() => {
    localStorage.setItem('writingRefinement_seo', JSON.stringify(seoSuggestions));
  }, [seoSuggestions]);

  // Persist options
  React.useEffect(() => {
    localStorage.setItem('writingRefinement_options', JSON.stringify(options));
  }, [options]);

  const refineContent = async () => {
    if (!content.trim()) {
      toast({
        title: "Content Required",
        description: "Please enter content to refine",
        variant: "destructive"
      });
      return;
    }

    setIsRefining(true);
    try {
      const enabledOptions = Object.entries(options)
        .filter(([_, enabled]) => enabled)
        .map(([key]) => key.replace(/([A-Z])/g, ' $1').toLowerCase());

      const result = await apiClient.integrations.Core.InvokeLLM({
        prompt: `You are an expert writing assistant. Analyze and refine this content with focus on: ${enabledOptions.join(', ')}.

Content to refine:
${content}

Mode: ${refinementMode}

Provide a JSON response with:
1. refined_content: The improved version of the content
2. grammar_issues: Array of grammar/spelling corrections made (with before/after)
3. style_score: Overall style quality score (1-100)
4. style_improvements: Array of style enhancements made
5. seo_keywords: Suggested SEO keywords found/added
6. seo_score: SEO optimization score (1-100)
7. readability_grade: Reading ease level (e.g., "8th grade", "College")
8. improvements_summary: Brief summary of changes made`,
        response_json_schema: {
          type: "object",
          properties: {
            refined_content: { type: "string" },
            grammar_issues: { 
              type: "array", 
              items: { 
                type: "object",
                properties: {
                  original: { type: "string" },
                  corrected: { type: "string" },
                  type: { type: "string" }
                }
              }
            },
            style_score: { type: "number" },
            style_improvements: { type: "array", items: { type: "string" } },
            seo_keywords: { type: "array", items: { type: "string" } },
            seo_score: { type: "number" },
            readability_grade: { type: "string" },
            improvements_summary: { type: "string" }
          }
        }
      });

      setRefinedContent(result.refined_content);
      setGrammarIssues(result.grammar_issues || []);
      setStyleScore({
        style: result.style_score || 0,
        seo: result.seo_score || 0,
        readability: result.readability_grade || 'N/A',
        improvements: result.style_improvements || []
      });
      setSeoSuggestions(result.seo_keywords || []);

      toast({
        title: "Content Refined",
        description: result.improvements_summary || "Analysis complete"
      });
    } catch (error) {
      toast({
        title: "Refinement Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRefining(false);
    }
  };

  const handleCopy = async (text) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Refined content copied to clipboard"
    });
  };

  const handleApplyRefinement = () => {
    setContent(refinedContent);
    setRefinedContent('');
    setGrammarIssues([]);
    setStyleScore(null);
    setSeoSuggestions([]);
    toast({
      title: "Applied!",
      description: "Refined content applied. You can refine it further."
    });
  };

  const clearHistory = () => {
    setContent('');
    setRefinedContent('');
    setGrammarIssues([]);
    setStyleScore(null);
    setSeoSuggestions([]);
    localStorage.removeItem('writingRefinement_content');
    localStorage.removeItem('writingRefinement_refined');
    localStorage.removeItem('writingRefinement_grammar');
    localStorage.removeItem('writingRefinement_style');
    localStorage.removeItem('writingRefinement_seo');
    toast({
      title: "Cleared",
      description: "All refinement data has been cleared"
    });
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-white to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Writing Refinement Assistant
          </CardTitle>
          <CardDescription>
            Improve grammar, style, readability, and SEO optimization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Refinement Options */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-white rounded-lg border">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Fix Grammar</Label>
              <Switch
                checked={options.fixGrammar}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, fixGrammar: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Improve Style</Label>
              <Switch
                checked={options.improveStyle}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, improveStyle: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Optimize SEO</Label>
              <Switch
                checked={options.optimizeSEO}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, optimizeSEO: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Readability</Label>
              <Switch
                checked={options.enhanceReadability}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, enhanceReadability: checked }))}
              />
            </div>
          </div>

          {/* Content Input */}
          <div className="space-y-2">
            <Label>Content to Refine</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste or type your content here..."
              className="min-h-[200px] font-mono text-sm"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">{content.length} characters</p>
              <div className="flex gap-2">
                <Button
                  onClick={refineContent}
                  disabled={!content.trim() || isRefining}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  {isRefining ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Refining...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Refine Content
                    </>
                  )}
                </Button>
                <Button
                  onClick={clearHistory}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>

          {/* Results */}
          {refinedContent && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <Tabs defaultValue="refined" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="refined">Refined</TabsTrigger>
                    <TabsTrigger value="analysis">Analysis</TabsTrigger>
                    <TabsTrigger value="seo">SEO</TabsTrigger>
                  </TabsList>

                  <TabsContent value="refined" className="space-y-3">
                    <div className="relative">
                      <Textarea
                        value={refinedContent}
                        onChange={(e) => setRefinedContent(e.target.value)}
                        className="min-h-[250px] font-mono text-sm bg-green-50 border-green-200"
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Button
                          onClick={handleApplyRefinement}
                          size="sm"
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                        >
                          <ArrowDownToLine className="w-4 h-4 mr-1" />
                          Apply to Input
                        </Button>
                        <Button
                          onClick={() => handleCopy(refinedContent)}
                          size="sm"
                          variant="outline"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    {styleScore && (
                      <div className="grid grid-cols-3 gap-3">
                        <Card className="bg-blue-50 border-blue-200">
                          <CardContent className="pt-4 text-center">
                            <p className="text-2xl font-bold text-blue-600">{styleScore.style}%</p>
                            <p className="text-xs text-gray-600">Style Score</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-green-50 border-green-200">
                          <CardContent className="pt-4 text-center">
                            <p className="text-2xl font-bold text-green-600">{styleScore.seo}%</p>
                            <p className="text-xs text-gray-600">SEO Score</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-purple-50 border-purple-200">
                          <CardContent className="pt-4 text-center">
                            <p className="text-sm font-bold text-purple-600">{styleScore.readability}</p>
                            <p className="text-xs text-gray-600">Reading Level</p>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="analysis" className="space-y-3">
                    {grammarIssues.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          Grammar & Spelling ({grammarIssues.length})
                        </h3>
                        <div className="space-y-2">
                          {grammarIssues.map((issue, idx) => (
                            <div key={idx} className="p-3 bg-white rounded-lg border text-sm">
                              <div className="flex items-start gap-2">
                                <Badge variant="outline" className="text-xs">{issue.type}</Badge>
                                <div className="flex-1 space-y-1">
                                  <p className="text-red-600 line-through">{issue.original}</p>
                                  <p className="text-green-600 font-medium">{issue.corrected}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {styleScore?.improvements?.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                          Style Improvements
                        </h3>
                        <ul className="space-y-1">
                          {styleScore.improvements.map((improvement, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-green-600 mt-0.5">•</span>
                              {improvement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="seo" className="space-y-3">
                    {seoSuggestions.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm">Suggested Keywords</h3>
                        <div className="flex flex-wrap gap-2">
                          {seoSuggestions.map((keyword, idx) => (
                            <Badge key={idx} className="bg-indigo-100 text-indigo-700">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <Alert>
                      <AlertDescription className="text-sm">
                        Content has been optimized for search engines while maintaining natural readability.
                      </AlertDescription>
                    </Alert>
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
