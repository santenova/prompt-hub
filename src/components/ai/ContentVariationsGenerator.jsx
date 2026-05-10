import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { GitBranch, Copy, Download, Loader2, CheckCircle2, FileJson, FileCode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/apis/client";

const toneOptions = [
  { value: "professional", label: "Professional", description: "Formal, authoritative, business-focused" },
  { value: "friendly", label: "Friendly", description: "Warm, approachable, conversational" },
  { value: "casual", label: "Casual", description: "Relaxed, informal, easy-going" },
  { value: "enthusiastic", label: "Enthusiastic", description: "Energetic, passionate, exciting" },
  { value: "persuasive", label: "Persuasive", description: "Compelling, convincing, action-oriented" },
  { value: "empathetic", label: "Empathetic", description: "Understanding, caring, supportive" },
  { value: "humorous", label: "Humorous", description: "Witty, entertaining, lighthearted" },
  { value: "direct", label: "Direct", description: "Straightforward, concise, no-nonsense" },
  { value: "educational", label: "Educational", description: "Informative, clear, teaching-focused" }
];

const outputFormats = [
  { value: "plain", label: "Plain Text", icon: FileCode, description: "Standard unformatted text" },
  { value: "markdown", label: "Markdown", icon: FileCode, description: "With markdown formatting" },
  { value: "json", label: "JSON", icon: FileJson, description: "Structured JSON data" },
  { value: "html", label: "HTML", icon: FileCode, description: "HTML markup" }
];

export default function ContentVariationsGenerator({ baseContent, onSelect }) {
  const [variations, setVariations] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTones, setSelectedTones] = useState(['professional', 'friendly']);
  const [outputFormat, setOutputFormat] = useState('plain');
  const [variationCount, setVariationCount] = useState([3]);
  const [customInstructions, setCustomInstructions] = useState('');
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const getFormatInstructions = (format) => {
    const instructions = {
      plain: "Output as plain text without any special formatting.",
      markdown: "Output using Markdown formatting with headers (##), lists (-), bold (**), and proper structure.",
      html: "Output as valid HTML with proper tags like <h1>, <p>, <ul>, <li>, <strong>, etc. Include only the body content, not full HTML document structure.",
      json: "Output as valid JSON object with structured data fields."
    };
    return instructions[format] || instructions.plain;
  };

  const handleGenerate = async () => {
    if (!baseContent?.trim()) {
      setError("Please provide base content");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setVariations([]);

    try {
      const formatInstruction = getFormatInstructions(outputFormat);
      
      const prompt = `Generate ${variationCount[0]} distinct variations of the following content for A/B testing purposes.

Base Content:
---
${baseContent}
---

Requirements:
• Create ${variationCount[0]} unique variations
• Apply these tones: ${selectedTones.map(t => toneOptions.find(opt => opt.value === t)?.label).join(', ')}
• Each variation should have a different approach while maintaining the core message
• Optimize each for different audience segments
• Format each variation as: ${formatInstruction}
${customInstructions ? `• Additional instructions: ${customInstructions}` : ''}

For each variation, provide:
1. The content in ${outputFormat} format
2. Target audience description
3. Key differentiator from other variations
4. Estimated conversion potential (1-10)

Respond with valid JSON only:
{
  "variations": [
    {
      "id": "var_1",
      "content": "...",
      "tone": "...",
      "target_audience": "...",
      "differentiator": "...",
      "conversion_score": 8,
      "format": "${outputFormat}"
    }
  ]
}`;

      const result = await apiClient.integrations.Core.InvokeLLMwithLogging({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            variations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  content: { type: "string" },
                  tone: { type: "string" },
                  target_audience: { type: "string" },
                  differentiator: { type: "string" },
                  conversion_score: { type: "number" },
                  format: { type: "string" }
                },
                required: ["id", "content", "tone", "target_audience"]
              }
            }
          },
          required: ["variations"]
        }
      });

      setVariations(result.variations || []);
    } catch (error) {
      console.error('Generation error:', error);
      setError(error?.message || 'Failed to generate variations. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (content, id) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadVariation = (variation, index) => {
    const filename = `variation_${index + 1}.${outputFormat === 'json' ? 'json' : 'txt'}`;
    const blob = new Blob([variation.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleToneToggle = (tone) => {
    if (selectedTones.includes(tone)) {
      if (selectedTones.length > 1) {
        setSelectedTones(selectedTones.filter(t => t !== tone));
      }
    } else {
      setSelectedTones([...selectedTones, tone]);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-purple-200">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-purple-600" />
                A/B Testing Variations Generator
              </CardTitle>
              <CardDescription>
                Generate multiple content variations with different tones and formats for testing
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
        
          {/* Output Format */}
          <div className="space-y-2">
            <Label>Output Format</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {outputFormats.map((format) => {
                const Icon = format.icon;
                return (
                  <div key={format.value} className="relative group">
                    <Button
                      variant={outputFormat === format.value ? "default" : "outline"}
                      className={`w-full ${outputFormat === format.value ? "bg-purple-600" : ""}`}
                      onClick={() => setOutputFormat(format.value)}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {format.label}
                    </Button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {format.description}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-600">
              Select the format for AI to generate content in
            </p>
          </div>

          {/* Tone Selection */}
          <div className="space-y-3">
            <Label>Select Tones to Test ({selectedTones.length} selected)</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {toneOptions.map((tone) => (
                <Card
                  key={tone.value}
                  className={`cursor-pointer transition-all ${
                    selectedTones.includes(tone.value)
                      ? 'border-2 border-purple-500 bg-purple-50'
                      : 'hover:border-purple-200'
                  }`}
                  onClick={() => handleToneToggle(tone.value)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">{tone.label}</span>
                      <input
                        type="checkbox"
                        checked={selectedTones.includes(tone.value)}
                        onChange={() => {}}
                        className="w-4 h-4 text-purple-600"
                      />
                    </div>
                    <p className="text-xs text-gray-600">{tone.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Variation Count */}
          <div className="space-y-2">
            <Label>Number of Variations: {variationCount?.[0] || 3}</Label>
            <Slider
              value={variationCount}
              onValueChange={setVariationCount}
              min={2}
              max={6}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-gray-600">
              Generate between 2-6 variations for comprehensive A/B testing
            </p>
          </div>

          {/* Custom Instructions */}
          <div className="space-y-2">
            <Label>Additional Instructions (Optional)</Label>
            <Textarea
              placeholder="e.g., Focus on benefits over features, Include specific call-to-action, Target mobile users..."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              className="h-20"
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !baseContent}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating {variationCount?.[0] || 3} Variations...
              </>
            ) : (
              <>
                <GitBranch className="w-5 h-5 mr-2" />
                Generate Variations
              </>
            )}
          </Button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Variations */}
      <AnimatePresence>
        {variations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Generated {variations.length} Variations
              </h3>
              <p className="text-sm text-gray-600">
                Test these variations to optimize conversion
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {variations.map((variation, index) => (
                <Card key={variation.id} className="border-2 border-purple-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          Variation {index + 1}
                          <Badge className="bg-purple-600">{variation.tone}</Badge>
                          {variation.conversion_score != null && (
                            <Badge variant="outline" className="text-xs">
                              Score: {variation.conversion_score}/10
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          <span className="font-semibold">Target:</span> {variation.target_audience}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-xs text-gray-600">Content</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded border max-h-48 overflow-y-auto">
                        <pre className="text-xs whitespace-pre-wrap font-mono">
                          {variation.content}
                        </pre>
                      </div>
                    </div>

                    {variation.differentiator && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-xs font-semibold text-blue-900 mb-1">
                          Key Differentiator:
                        </p>
                        <p className="text-xs text-gray-700">{variation.differentiator}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(variation.content, variation.id)}
                        className="flex-1"
                      >
                        {copiedId === variation.id ? (
                          <CheckCircle2 className="w-4 h-4 mr-1 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 mr-1" />
                        )}
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadVariation(variation, index)}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      {onSelect && (
                        <Button
                          size="sm"
                          onClick={() => onSelect(variation)}
                          className="flex-1 bg-purple-600"
                        >
                          Use This
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
