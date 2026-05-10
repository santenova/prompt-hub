import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Info,
  Lightbulb,
  Target,
  MessageSquare,
  Users,
  TrendingUp,
  Sparkles
} from "lucide-react";
import { apiClient } from "@/apis/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PromptAnalysisTool({ prompt, onApplyImprovement }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const analyzePrompt = async () => {
    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const analysisPrompt = `You are an expert prompt engineer and analyzer. Analyze this AI prompt comprehensively and provide actionable feedback.

PROMPT TO ANALYZE:
Title: ${prompt.title}
Category: ${prompt.category}
Persona: ${prompt.persona || 'None'}
Content: ${prompt.content}
Tags: ${prompt.tags?.join(', ') || 'None'}

ANALYSIS CRITERIA:

1. CLARITY SCORE (0-100): How clear and understandable is the prompt?
   - Is the language precise?
   - Are instructions unambiguous?
   - Is it easy to understand what's expected?

2. SPECIFICITY SCORE (0-100): How specific and detailed is the prompt?
   - Does it provide enough context?
   - Are requirements clearly defined?
   - Does it avoid vagueness?

3. PERSONA ALIGNMENT SCORE (0-100): How well does the content match the persona?
   - Does it use appropriate tone for the persona?
   - Does it leverage the persona's expertise?
   - Is the persona even needed?

4. EFFECTIVENESS SCORE (0-100): How likely is this to produce good results?
   - Does it follow prompt engineering best practices?
   - Does it include examples or constraints?
   - Is it structured well?

5. COMPLETENESS SCORE (0-100): Is the prompt complete?
   - Does it specify desired output format?
   - Does it provide necessary context?
   - Are edge cases considered?

Provide detailed analysis in this JSON format:
{
  "overall_score": 0-100,
  "overall_grade": "Excellent/Good/Fair/Poor",
  "clarity": {
    "score": 0-100,
    "issues": ["issue1", "issue2"],
    "strengths": ["strength1", "strength2"]
  },
  "specificity": {
    "score": 0-100,
    "issues": ["issue1", "issue2"],
    "strengths": ["strength1", "strength2"]
  },
  "persona_alignment": {
    "score": 0-100,
    "issues": ["issue1", "issue2"],
    "strengths": ["strength1", "strength2"]
  },
  "effectiveness": {
    "score": 0-100,
    "issues": ["issue1", "issue2"],
    "strengths": ["strength1", "strength2"]
  },
  "completeness": {
    "score": 0-100,
    "issues": ["issue1", "issue2"],
    "strengths": ["strength1", "strength2"]
  },
  "improvements": [
    {
      "title": "Improvement Title",
      "description": "What to change",
      "priority": "high/medium/low",
      "impact": "Expected improvement",
      "before": "Current text snippet",
      "after": "Improved text snippet"
    }
  ],
  "suggested_tags": ["tag1", "tag2", "tag3"],
  "improved_version": "Full improved prompt text",
  "best_practices": ["practice1", "practice2"],
  "warnings": ["warning1", "warning2"]
}`;

      const response = await apiClient.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            overall_score: { type: "number" },
            overall_grade: { type: "string" },
            clarity: {
              type: "object",
              properties: {
                score: { type: "number" },
                issues: { type: "array", items: { type: "string" } },
                strengths: { type: "array", items: { type: "string" } }
              }
            },
            specificity: {
              type: "object",
              properties: {
                score: { type: "number" },
                issues: { type: "array", items: { type: "string" } },
                strengths: { type: "array", items: { type: "string" } }
              }
            },
            persona_alignment: {
              type: "object",
              properties: {
                score: { type: "number" },
                issues: { type: "array", items: { type: "string" } },
                strengths: { type: "array", items: { type: "string" } }
              }
            },
            effectiveness: {
              type: "object",
              properties: {
                score: { type: "number" },
                issues: { type: "array", items: { type: "string" } },
                strengths: { type: "array", items: { type: "string" } }
              }
            },
            completeness: {
              type: "object",
              properties: {
                score: { type: "number" },
                issues: { type: "array", items: { type: "string" } },
                strengths: { type: "array", items: { type: "string" } }
              }
            },
            improvements: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  priority: { type: "string" },
                  impact: { type: "string" },
                  before: { type: "string" },
                  after: { type: "string" }
                }
              }
            },
            suggested_tags: { type: "array", items: { type: "string" } },
            improved_version: { type: "string" },
            best_practices: { type: "array", items: { type: "string" } },
            warnings: { type: "array", items: { type: "string" } }
          }
        }
      });

      setAnalysis(response);
    } catch (error) {
      console.error('Failed to analyze prompt:', error);
      setAnalysis({
        overall_score: 0,
        overall_grade: "Error",
        clarity: { score: 0, issues: ["Analysis failed"], strengths: [] },
        specificity: { score: 0, issues: [], strengths: [] },
        persona_alignment: { score: 0, issues: [], strengths: [] },
        effectiveness: { score: 0, issues: [], strengths: [] },
        completeness: { score: 0, issues: [], strengths: [] },
        improvements: [],
        suggested_tags: [],
        improved_version: prompt.content,
        best_practices: [],
        warnings: ["Failed to analyze. Please try again."]
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'Excellent': return 'bg-green-600';
      case 'Good': return 'bg-blue-600';
      case 'Fair': return 'bg-yellow-600';
      case 'Poor': return 'bg-red-600';
      default: return 'bg-gray-600';
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
            <Target className="w-5 h-5 text-purple-600" />
            AI Prompt Analysis
          </CardTitle>
          <CardDescription>
            Get comprehensive feedback on your prompt's quality and effectiveness
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              This tool analyzes clarity, specificity, persona alignment, effectiveness, and completeness of your prompt.
            </AlertDescription>
          </Alert>

          <Button
            onClick={analyzePrompt}
            disabled={isAnalyzing}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
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
                Analyze with AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <>
          {/* Overall Score */}
          <Card className="border-2 border-indigo-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Overall Score</CardTitle>
                <Badge className={getGradeColor(analysis.overall_grade)}>
                  {analysis.overall_grade}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-indigo-600">{analysis.overall_score}/100</span>
                  <span className="text-sm text-gray-600">Overall Quality</span>
                </div>
                <Progress value={analysis.overall_score} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Detailed Scores */}
          <Tabs defaultValue="scores" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="scores">Scores</TabsTrigger>
              <TabsTrigger value="improvements">Improvements</TabsTrigger>
              <TabsTrigger value="improved">Improved Version</TabsTrigger>
            </TabsList>

            <TabsContent value="scores" className="space-y-4">
              {/* Clarity */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Clarity
                    </CardTitle>
                    <Badge className={getScoreColor(analysis.clarity.score)}>
                      {analysis.clarity.score}/100
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={analysis.clarity.score} className="h-2" />
                  {analysis.clarity.strengths.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-green-700 mb-1">✓ Strengths:</p>
                      <ul className="text-sm space-y-1">
                        {analysis.clarity.strengths.map((s, i) => (
                          <li key={i} className="text-gray-700">• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysis.clarity.issues.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-orange-700 mb-1">⚠ Issues:</p>
                      <ul className="text-sm space-y-1">
                        {analysis.clarity.issues.map((i, idx) => (
                          <li key={idx} className="text-gray-700">• {i}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Specificity */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Specificity
                    </CardTitle>
                    <Badge className={getScoreColor(analysis.specificity.score)}>
                      {analysis.specificity.score}/100
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={analysis.specificity.score} className="h-2" />
                  {analysis.specificity.strengths.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-green-700 mb-1">✓ Strengths:</p>
                      <ul className="text-sm space-y-1">
                        {analysis.specificity.strengths.map((s, i) => (
                          <li key={i} className="text-gray-700">• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysis.specificity.issues.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-orange-700 mb-1">⚠ Issues:</p>
                      <ul className="text-sm space-y-1">
                        {analysis.specificity.issues.map((i, idx) => (
                          <li key={idx} className="text-gray-700">• {i}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Persona Alignment */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Persona Alignment
                    </CardTitle>
                    <Badge className={getScoreColor(analysis.persona_alignment.score)}>
                      {analysis.persona_alignment.score}/100
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={analysis.persona_alignment.score} className="h-2" />
                  {analysis.persona_alignment.strengths.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-green-700 mb-1">✓ Strengths:</p>
                      <ul className="text-sm space-y-1">
                        {analysis.persona_alignment.strengths.map((s, i) => (
                          <li key={i} className="text-gray-700">• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysis.persona_alignment.issues.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-orange-700 mb-1">⚠ Issues:</p>
                      <ul className="text-sm space-y-1">
                        {analysis.persona_alignment.issues.map((i, idx) => (
                          <li key={idx} className="text-gray-700">• {i}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Effectiveness */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Effectiveness
                    </CardTitle>
                    <Badge className={getScoreColor(analysis.effectiveness.score)}>
                      {analysis.effectiveness.score}/100
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={analysis.effectiveness.score} className="h-2" />
                  {analysis.effectiveness.strengths.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-green-700 mb-1">✓ Strengths:</p>
                      <ul className="text-sm space-y-1">
                        {analysis.effectiveness.strengths.map((s, i) => (
                          <li key={i} className="text-gray-700">• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysis.effectiveness.issues.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-orange-700 mb-1">⚠ Issues:</p>
                      <ul className="text-sm space-y-1">
                        {analysis.effectiveness.issues.map((i, idx) => (
                          <li key={idx} className="text-gray-700">• {i}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Completeness */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Completeness
                    </CardTitle>
                    <Badge className={getScoreColor(analysis.completeness.score)}>
                      {analysis.completeness.score}/100
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={analysis.completeness.score} className="h-2" />
                  {analysis.completeness.strengths.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-green-700 mb-1">✓ Strengths:</p>
                      <ul className="text-sm space-y-1">
                        {analysis.completeness.strengths.map((s, i) => (
                          <li key={i} className="text-gray-700">• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysis.completeness.issues.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-orange-700 mb-1">⚠ Issues:</p>
                      <ul className="text-sm space-y-1">
                        {analysis.completeness.issues.map((i, idx) => (
                          <li key={idx} className="text-gray-700">• {i}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Best Practices */}
              {analysis.best_practices.length > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      Best Practices Followed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      {analysis.best_practices.map((practice, i) => (
                        <li key={i} className="text-gray-700">✓ {practice}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Warnings */}
              {analysis.warnings.length > 0 && (
                <Card className="bg-red-50 border-red-200">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      Warnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      {analysis.warnings.map((warning, i) => (
                        <li key={i} className="text-gray-700">⚠ {warning}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="improvements" className="space-y-4">
              {analysis.improvements.map((improvement, idx) => (
                <Card key={idx} className="border-2 border-purple-200">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{improvement.title}</h4>
                          <Badge className={getPriorityColor(improvement.priority)}>
                            {improvement.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{improvement.description}</p>
                        
                        {improvement.before && (
                          <div className="mb-2">
                            <p className="text-xs font-semibold text-red-700 mb-1">Before:</p>
                            <div className="bg-red-50 border border-red-200 p-2 rounded text-sm">
                              {improvement.before}
                            </div>
                          </div>
                        )}
                        
                        {improvement.after && (
                          <div className="mb-2">
                            <p className="text-xs font-semibold text-green-700 mb-1">After:</p>
                            <div className="bg-green-50 border border-green-200 p-2 rounded text-sm">
                              {improvement.after}
                            </div>
                          </div>
                        )}
                        
                        <Alert className="mt-2">
                          <Info className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            <strong>Expected Impact:</strong> {improvement.impact}
                          </AlertDescription>
                        </Alert>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Suggested Tags */}
              {analysis.suggested_tags.length > 0 && (
                <Card className="bg-indigo-50 border-indigo-200">
                  <CardHeader>
                    <CardTitle className="text-base">Suggested Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {analysis.suggested_tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="bg-white">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="improved" className="space-y-4">
              <Card className="border-2 border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green-600" />
                    AI-Improved Version
                  </CardTitle>
                  <CardDescription>
                    This version applies all suggested improvements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-green-300">
                    <p className="text-sm whitespace-pre-wrap">{analysis.improved_version}</p>
                  </div>
                  
                  {onApplyImprovement && (
                    <Button
                      onClick={() => onApplyImprovement({
                        content: analysis.improved_version,
                        tags: [...new Set([...(prompt.tags || []), ...analysis.suggested_tags])]
                      })}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      size="lg"
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Apply This Improved Version
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
