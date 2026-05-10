import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Wand2, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  Lightbulb,
  FileEdit
} from "lucide-react";
import { apiClient } from "@/apis/client";
import { motion, AnimatePresence } from "framer-motion";

const improvementAreas = [
  { id: 'clarity', label: 'Improve Clarity', description: 'Make the template clearer and easier to understand' },
  { id: 'detail', label: 'Add More Detail', description: 'Expand with more specific instructions' },
  { id: 'structure', label: 'Better Structure', description: 'Reorganize for better flow and organization' },
  { id: 'placeholders', label: 'Add Placeholders', description: 'Identify and add dynamic placeholders' },
  { id: 'examples', label: 'Include Examples', description: 'Add practical examples and use cases' },
  { id: 'actionable', label: 'More Actionable', description: 'Make instructions more specific and actionable' }
];

export default function AITemplateRefiner({ template, onApplyRefinement }) {
  const [selectedAreas, setSelectedAreas] = useState(['clarity', 'placeholders']);
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refinedTemplate, setRefinedTemplate] = useState(null);

  const toggleArea = (areaId) => {
    setSelectedAreas(prev => 
      prev.includes(areaId)
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    );
  };

  const refineTemplate = async () => {
    if (!template?.content || selectedAreas.length === 0) return;

    setIsRefining(true);
    setRefinedTemplate(null);

    try {
      const improvementsList = improvementAreas
        .filter(area => selectedAreas.includes(area.id))
        .map(area => area.label)
        .join(', ');

      const refinementPrompt = `You are an expert prompt engineer and template optimization specialist. Refine and improve this template based on the specified improvement areas.

CURRENT TEMPLATE:
Title: ${template.title || 'Untitled'}
Category: ${template.category || 'Uncategorized'}
Content:
${template.content}

IMPROVEMENT AREAS REQUESTED:
${improvementsList}

${additionalInstructions ? `ADDITIONAL INSTRUCTIONS:\n${additionalInstructions}\n` : ''}

REQUIREMENTS:
1. Preserve the core intent and purpose of the template
2. Apply the requested improvements comprehensively
3. Make the template more professional and effective
4. Identify opportunities for dynamic placeholders (use {placeholder_name} format)
5. Add structure and organization if needed
6. Suggest better metadata if the current metadata could be improved

Return this JSON structure:
{
  "refined_content": "The improved template content",
  "improvements_made": [
    {
      "area": "clarity/detail/structure/placeholders/etc",
      "description": "Specific improvement made",
      "before_snippet": "Example of what it was",
      "after_snippet": "Example of what it became"
    }
  ],
  "changes_summary": "Overall summary of changes",
  "quality_scores": {
    "before_clarity": 70,
    "after_clarity": 95,
    "before_detail": 60,
    "after_detail": 90,
    "before_structure": 75,
    "after_structure": 95
  },
  "suggested_metadata": {
    "title": "Improved title if needed, otherwise original",
    "description": "Clear description of what the template does",
    "category": "Best category",
    "subcategory": "Specific subcategory",
    "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
  },
  "placeholders_identified": [
    {
      "placeholder": "{example_placeholder}",
      "description": "What this placeholder represents",
      "context": "Where it's used in the template"
    }
  ],
  "usage_tips": [
    "Tip 1 for using this refined template",
    "Tip 2 for best results"
  ]
}`;

      const response = await apiClient.integrations.Core.InvokeLLM({
        prompt: refinementPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            refined_content: { type: "string" },
            improvements_made: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  area: { type: "string" },
                  description: { type: "string" },
                  before_snippet: { type: "string" },
                  after_snippet: { type: "string" }
                }
              }
            },
            changes_summary: { type: "string" },
            quality_scores: {
              type: "object",
              properties: {
                before_clarity: { type: "number" },
                after_clarity: { type: "number" },
                before_detail: { type: "number" },
                after_detail: { type: "number" },
                before_structure: { type: "number" },
                after_structure: { type: "number" }
              }
            },
            suggested_metadata: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                category: { type: "string" },
                subcategory: { type: "string" },
                tags: { type: "array", items: { type: "string" } }
              }
            },
            placeholders_identified: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  placeholder: { type: "string" },
                  description: { type: "string" },
                  context: { type: "string" }
                }
              }
            },
            usage_tips: { type: "array", items: { type: "string" } }
          }
        }
      });

      setRefinedTemplate(response);
    } catch (error) {
      console.error('Failed to refine template:', error);
    } finally {
      setIsRefining(false);
    }
  };

  const handleApply = () => {
    if (refinedTemplate && onApplyRefinement) {
      onApplyRefinement({
        content: refinedTemplate.refined_content,
        title: refinedTemplate.suggested_metadata?.title || template.title,
        description: refinedTemplate.suggested_metadata?.description || template.description,
        category: refinedTemplate.suggested_metadata?.category || template.category,
        subcategory: refinedTemplate.suggested_metadata?.subcategory || template.subcategory,
        tags: refinedTemplate.suggested_metadata?.tags || template.tags || [],
        refinement_data: {
          improvements_made: refinedTemplate.improvements_made,
          changes_summary: refinedTemplate.changes_summary,
          quality_scores: refinedTemplate.quality_scores
        }
      });
      setRefinedTemplate(null);
      setAdditionalInstructions('');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-indigo-600" />
            AI Template Refiner
          </CardTitle>
          <CardDescription>
            Select improvement areas and AI will enhance your template with better clarity, structure, and detail
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              Current template: <strong>{template?.title || 'Untitled'}</strong>
              <br />
              {template?.content?.length || 0} characters
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Improvement Areas</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {improvementAreas.map((area) => (
                <div
                  key={area.id}
                  className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedAreas.includes(area.id)
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-indigo-300'
                  }`}
                  onClick={() => toggleArea(area.id)}
                >
                  <Checkbox
                    checked={selectedAreas.includes(area.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900">{area.label}</div>
                    <div className="text-xs text-gray-600 mt-1">{area.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalInstructions">Additional Instructions (Optional)</Label>
            <Textarea
              id="additionalInstructions"
              placeholder="Any specific improvements or changes you'd like? 

Examples:
- 'Make it more suitable for beginners'
- 'Add more technical detail'
- 'Focus on practical examples'
- 'Include a step-by-step structure'"
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <Button
            onClick={refineTemplate}
            disabled={isRefining || selectedAreas.length === 0 || !template?.content}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            size="lg"
          >
            {isRefining ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Refining Template...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Refine Template with AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Refined Template Result */}
      <AnimatePresence>
        {refinedTemplate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Refined Template
                </CardTitle>
                {refinedTemplate.changes_summary && (
                  <CardDescription className="text-gray-700 mt-2">
                    {refinedTemplate.changes_summary}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="content" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="content">Refined Content</TabsTrigger>
                    <TabsTrigger value="improvements">Improvements</TabsTrigger>
                    <TabsTrigger value="scores">Quality Scores</TabsTrigger>
                    <TabsTrigger value="metadata">Metadata</TabsTrigger>
                  </TabsList>

                  <TabsContent value="content" className="space-y-4 mt-4">
                    <div className="bg-white p-4 rounded-lg border border-green-300">
                      <Label className="text-sm font-semibold mb-2 block">Refined Template Content</Label>
                      <div className="bg-gray-50 p-4 rounded border border-gray-200 max-h-96 overflow-y-auto">
                        <pre className="text-sm whitespace-pre-wrap font-mono text-gray-800">
                          {refinedTemplate.refined_content}
                        </pre>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        {refinedTemplate.refined_content.length} characters
                      </p>
                    </div>

                    {refinedTemplate.placeholders_identified?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Placeholders Identified</h4>
                        <div className="space-y-2">
                          {refinedTemplate.placeholders_identified.map((ph, idx) => (
                            <div key={idx} className="bg-white p-3 rounded border border-gray-200">
                              <code className="text-sm font-mono bg-indigo-100 px-2 py-1 rounded text-indigo-800">
                                {ph.placeholder}
                              </code>
                              <p className="text-sm text-gray-700 mt-1">{ph.description}</p>
                              <p className="text-xs text-gray-500 mt-1">Context: {ph.context}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {refinedTemplate.usage_tips?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Usage Tips</h4>
                        <ul className="space-y-1">
                          {refinedTemplate.usage_tips.map((tip, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                              <Lightbulb className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="improvements" className="space-y-4 mt-4">
                    {refinedTemplate.improvements_made?.map((improvement, idx) => (
                      <Card key={idx} className="bg-white">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Badge className="bg-indigo-600 capitalize">{improvement.area}</Badge>
                            <h4 className="font-medium text-gray-900">{improvement.description}</h4>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs text-gray-600 mb-2 block">Before</Label>
                              <div className="bg-red-50 p-3 rounded border border-red-200">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {improvement.before_snippet}
                                </p>
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-600 mb-2 block flex items-center gap-1">
                                After <ArrowRight className="w-3 h-3" />
                              </Label>
                              <div className="bg-green-50 p-3 rounded border border-green-200">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {improvement.after_snippet}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="scores" className="space-y-4 mt-4">
                    {refinedTemplate.quality_scores && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-600 mb-3">Clarity</h4>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-600">Before</span>
                            <span className={`text-2xl font-bold ${getScoreColor(refinedTemplate.quality_scores.before_clarity)}`}>
                              {refinedTemplate.quality_scores.before_clarity}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">After</span>
                            <span className={`text-2xl font-bold ${getScoreColor(refinedTemplate.quality_scores.after_clarity)}`}>
                              {refinedTemplate.quality_scores.after_clarity}
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-green-600 font-semibold">
                            +{refinedTemplate.quality_scores.after_clarity - refinedTemplate.quality_scores.before_clarity} improvement
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-600 mb-3">Detail</h4>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-600">Before</span>
                            <span className={`text-2xl font-bold ${getScoreColor(refinedTemplate.quality_scores.before_detail)}`}>
                              {refinedTemplate.quality_scores.before_detail}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">After</span>
                            <span className={`text-2xl font-bold ${getScoreColor(refinedTemplate.quality_scores.after_detail)}`}>
                              {refinedTemplate.quality_scores.after_detail}
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-green-600 font-semibold">
                            +{refinedTemplate.quality_scores.after_detail - refinedTemplate.quality_scores.before_detail} improvement
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-600 mb-3">Structure</h4>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-600">Before</span>
                            <span className={`text-2xl font-bold ${getScoreColor(refinedTemplate.quality_scores.before_structure)}`}>
                              {refinedTemplate.quality_scores.before_structure}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">After</span>
                            <span className={`text-2xl font-bold ${getScoreColor(refinedTemplate.quality_scores.after_structure)}`}>
                              {refinedTemplate.quality_scores.after_structure}
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-green-600 font-semibold">
                            +{refinedTemplate.quality_scores.after_structure - refinedTemplate.quality_scores.before_structure} improvement
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="metadata" className="space-y-4 mt-4">
                    {refinedTemplate.suggested_metadata && (
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <Label className="text-sm font-semibold mb-2 block">Suggested Title</Label>
                          <p className="text-base text-gray-900">{refinedTemplate.suggested_metadata.title}</p>
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <Label className="text-sm font-semibold mb-2 block">Suggested Description</Label>
                          <p className="text-sm text-gray-700">{refinedTemplate.suggested_metadata.description}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <Label className="text-sm font-semibold mb-2 block">Category</Label>
                            <Badge className="bg-indigo-600">{refinedTemplate.suggested_metadata.category}</Badge>
                          </div>

                          {refinedTemplate.suggested_metadata.subcategory && (
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                              <Label className="text-sm font-semibold mb-2 block">Subcategory</Label>
                              <Badge variant="outline">{refinedTemplate.suggested_metadata.subcategory}</Badge>
                            </div>
                          )}
                        </div>

                        {refinedTemplate.suggested_metadata.tags?.length > 0 && (
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <Label className="text-sm font-semibold mb-2 block">Suggested Tags</Label>
                            <div className="flex flex-wrap gap-2">
                              {refinedTemplate.suggested_metadata.tags.map((tag, idx) => (
                                <Badge key={idx} variant="secondary">#{tag}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                <Button
                  onClick={handleApply}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  size="lg"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Apply Refined Template
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
