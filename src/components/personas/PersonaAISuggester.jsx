import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Sparkles, CheckCircle2, Brain } from "lucide-react";
import { apiClient } from "@/apis/client";

export default function PersonaAISuggester({ 
  personaName, 
  description, 
  category,
  onApplyInstructions,
  onApplyExpertise,
  onApplyExamples 
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const generateSuggestions = async () => {
    if (!personaName || !description) return;

    setIsGenerating(true);
    setSuggestions(null);

    try {
      const prompt = `You are an expert at defining AI personas. Based on this persona information, generate comprehensive suggestions.

PERSONA INFORMATION:
Name: ${personaName}
Description: ${description}
Category: ${category}

GENERATE:

1. DEFAULT INSTRUCTIONS (3-5 clear, actionable guidelines)
   - How should this persona behave?
   - What principles should it follow?
   - What approach should it take?

2. EXPERTISE AREAS (5-8 specific areas)
   - Core competencies
   - Technical skills
   - Domain knowledge
   - Specialized capabilities

3. EXAMPLE USE CASES (4-6 practical examples)
   - Real-world scenarios where this persona excels
   - Specific tasks or questions
   - Concrete use cases

Make everything:
- Specific and actionable
- Relevant to the persona's role
- Professional and clear
- Practical and useful

Return this JSON structure:
{
  "default_instructions": [
    "Clear instruction 1",
    "Clear instruction 2",
    "Clear instruction 3"
  ],
  "expertise_areas": [
    "Expertise area 1",
    "Expertise area 2",
    "Expertise area 3"
  ],
  "example_use_cases": [
    "Example scenario 1",
    "Example scenario 2",
    "Example scenario 3"
  ],
  "suggested_tone": "Professional/Friendly/Formal/etc",
  "reasoning": "Brief explanation of choices"
}`;

      const response = await apiClient.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            default_instructions: {
              type: "array",
              items: { type: "string" }
            },
            expertise_areas: {
              type: "array",
              items: { type: "string" }
            },
            example_use_cases: {
              type: "array",
              items: { type: "string" }
            },
            suggested_tone: { type: "string" },
            reasoning: { type: "string" }
          }
        }
      });

      setSuggestions(response);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyInstructions = () => {
    if (suggestions?.default_instructions && onApplyInstructions) {
      const instructionsText = suggestions.default_instructions.join('. ') + '.';
      onApplyInstructions(instructionsText);
    }
  };

  const handleApplyExpertise = () => {
    if (suggestions?.expertise_areas && onApplyExpertise) {
      onApplyExpertise(suggestions.expertise_areas);
    }
  };

  const handleApplyExamples = () => {
    if (suggestions?.example_use_cases && onApplyExamples) {
      onApplyExamples(suggestions.example_use_cases);
    }
  };

  const handleApplyAll = () => {
    handleApplyInstructions();
    handleApplyExpertise();
    handleApplyExamples();
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Persona Suggestions
          </CardTitle>
          <CardDescription>
            Let AI generate instructions, expertise areas, and example use cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={generateSuggestions}
            disabled={isGenerating || !personaName || !description}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Suggestions...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate AI Suggestions
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {suggestions && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                AI-Generated Suggestions
              </CardTitle>
              <Button
                onClick={handleApplyAll}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Apply All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Default Instructions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">Default Instructions</h4>
                <Button
                  onClick={handleApplyInstructions}
                  variant="outline"
                  size="sm"
                >
                  Apply
                </Button>
              </div>
              <div className="bg-white p-4 rounded-lg border border-green-300">
                <ul className="space-y-2">
                  {suggestions.default_instructions.map((instruction, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Expertise Areas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">Expertise Areas</h4>
                <Button
                  onClick={handleApplyExpertise}
                  variant="outline"
                  size="sm"
                >
                  Apply
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.expertise_areas.map((area, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-white">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Example Use Cases */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">Example Use Cases</h4>
                <Button
                  onClick={handleApplyExamples}
                  variant="outline"
                  size="sm"
                >
                  Apply
                </Button>
              </div>
              <div className="bg-white p-4 rounded-lg border border-green-300">
                <ul className="space-y-2">
                  {suggestions.example_use_cases.map((example, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-green-600 font-bold">•</span>
                      <span>{example}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Suggested Tone */}
            {suggestions.suggested_tone && (
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Suggested Tone</h4>
                <Badge className="bg-purple-600">{suggestions.suggested_tone}</Badge>
              </div>
            )}

            {/* AI Reasoning */}
            {suggestions.reasoning && (
              <Alert>
                <AlertDescription className="text-sm">
                  <strong>AI Reasoning:</strong> {suggestions.reasoning}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
