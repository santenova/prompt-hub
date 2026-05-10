import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, Wand2, Plus, X, Info, Lightbulb } from "lucide-react";
import { apiClient } from "@/apis/client";

const categories = [
  "Writing", "Coding", "Business", "Creative", "Marketing", "Research", "Education",
  "Relations", "Health & Wellness", "Finance & Investment", "Legal",
  "Productivity", "Sales", "Design", "Gaming", "Food & Cooking", "Travel & Lifestyle",
  "Career Development", "Personal Development", "Data & Analytics", "AI & Machine Learning",
  "Social Media", "E-commerce", "Other"
];

const personas = [
  "None",
  "Expert Advisor",
  "Creative Director",
  "Technical Specialist",
  "Business Analyst",
  "Marketing Strategist",
  "Educator",
  "Life Coach",
  "Career Counselor",
  "Healthcare Professional",
  "Legal Advisor",
  "Financial Analyst",
  "Data Scientist",
  "Content Creator",
  "Social Media Manager",
  "Product Manager",
  "UX Designer",
  "Software Architect",
  "Sales Expert",
  "Customer Success Manager",
  "Entrepreneur",
  "Researcher",
  "Consultant",
  "Project Manager",
  "Team Leader"
];

export default function PromptGeneratorAI({ onApplyPrompt, existingPrompts = [] }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompts, setGeneratedPrompts] = useState([]);
  
  const [formData, setFormData] = useState({
    goal: '',
    category: 'Other',
    persona: 'None',
    keywords: [],
    targetAudience: '',
    desiredOutput: '',
    context: ''
  });
  
  const [keywordInput, setKeywordInput] = useState('');

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  const analyzeExistingPrompts = () => {
    if (existingPrompts.length === 0) return '';
    
    // Get top performing prompts
    const topPrompts = [...existingPrompts]
      .sort((a, b) => (b.use_count || 0) - (a.use_count || 0))
      .slice(0, 5);
    
    // Get common patterns
    const commonPatterns = topPrompts.map(p => ({
      title: p.title,
      category: p.category,
      persona: p.persona,
      structure: p.content.length < 200 ? 'concise' : 'detailed'
    }));
    
    return `\n\nBest Practices from Existing Prompts:\n${JSON.stringify(commonPatterns, null, 2)}`;
  };

  const handleGenerate = async () => {
    if (!formData.goal) return;
    
    setIsGenerating(true);
    setGeneratedPrompts([]);
    
    try {
      const bestPractices = analyzeExistingPrompts();
      
      const prompt = `You are an expert AI prompt engineer. Generate 3 high-quality, professional AI prompts based on the following specifications:

Goal: ${formData.goal}
Category: ${formData.category}
Persona/Role: ${formData.persona}
Keywords: ${formData.keywords.join(', ') || 'None'}
Target Audience: ${formData.targetAudience || 'General'}
Desired Output: ${formData.desiredOutput || 'Any'}
Additional Context: ${formData.context || 'None'}
${bestPractices}

For each prompt, provide:
1. A clear, descriptive title
2. A well-structured prompt with appropriate placeholders (use {input}, {topic}, {context} etc.)
3. Suggested tags
4. A brief explanation of why this prompt works

Make the prompts actionable, clear, and optimized for the specified persona. Include placeholders where user input would be needed.

Return a JSON object with this exact structure:
{
  "prompts": [
    {
      "title": "Prompt Title",
      "content": "The actual prompt text with {placeholders}",
      "tags": ["tag1", "tag2"],
      "explanation": "Why this prompt is effective"
    }
  ]
}`;

      const response = await apiClient.integrations.Core.InvokeLLMwithLogging({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            prompts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  content: { type: "string" },
                  tags: { type: "array", items: { type: "string" } },
                  explanation: { type: "string" }
                }
              }
            }
          }
        }
      });

      setGeneratedPrompts(response.prompts || []);
    } catch (error) {
      console.error('Failed to generate prompts:', error);
      setGeneratedPrompts([{
        title: "Error",
        content: "Failed to generate prompts. Please try again.",
        tags: [],
        explanation: error.message
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Prompt Generator
          </CardTitle>
          <CardDescription>
            Let AI help you create professional prompts based on your goals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              Describe your goal and the AI will generate optimized prompt suggestions with best practices.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="goal">What do you want to achieve? *</Label>
            <Textarea
              id="goal"
              placeholder="e.g., I need to analyze customer feedback and extract actionable insights"
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              rows={3}
              className="text-base"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="persona">Persona/Role</Label>
              <Select
                value={formData.persona}
                onValueChange={(value) => setFormData({ ...formData, persona: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {personas.map(persona => (
                    <SelectItem key={persona} value={persona}>{persona}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">Keywords (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="keywords"
                placeholder="Add keywords (press Enter)"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button type="button" onClick={addKeyword} variant="outline" size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.keywords.map((keyword, idx) => (
                  <Badge key={idx} variant="secondary" className="pl-2.5 pr-1 py-1">
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeKeyword(keyword)}
                      className="ml-1.5 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetAudience">Target Audience (optional)</Label>
              <Input
                id="targetAudience"
                placeholder="e.g., Business professionals"
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desiredOutput">Desired Output Format (optional)</Label>
              <Input
                id="desiredOutput"
                placeholder="e.g., Bullet points, JSON, Report"
                value={formData.desiredOutput}
                onChange={(e) => setFormData({ ...formData, desiredOutput: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="context">Additional Context (optional)</Label>
            <Textarea
              id="context"
              placeholder="Any additional requirements or constraints..."
              value={formData.context}
              onChange={(e) => setFormData({ ...formData, context: e.target.value })}
              rows={2}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!formData.goal || isGenerating}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Prompts...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 mr-2" />
                Generate Prompts with AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Prompts */}
      {generatedPrompts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Generated Prompts
          </h3>
          
          {generatedPrompts.map((prompt, idx) => (
            <Card key={idx} className="border-2 border-purple-200 hover:border-purple-400 transition-all">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-base">{prompt.title}</CardTitle>
                    {prompt.explanation && (
                      <CardDescription className="mt-2">
                        <Info className="w-4 h-4 inline mr-1" />
                        {prompt.explanation}
                      </CardDescription>
                    )}
                  </div>
                  <Button
                    onClick={() => onApplyPrompt({
                      title: prompt.title,
                      content: prompt.content,
                      category: formData.category,
                      persona: formData.persona,
                      tags: prompt.tags || []
                    })}
                    size="sm"
                    className="bg-gradient-to-r from-green-600 to-emerald-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Use This
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <Label className="text-xs text-gray-600 mb-2 block">Prompt:</Label>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{prompt.content}</p>
                </div>
                
                {prompt.tags && prompt.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <Label className="text-xs text-gray-600">Suggested Tags:</Label>
                    {prompt.tags.map((tag, tagIdx) => (
                      <Badge key={tagIdx} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
