import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Mic, CheckCircle2, MessageSquare, BookOpen, Zap } from "lucide-react";
import { apiClient } from "@/apis/client";

export default function PersonaVoiceTuner({ 
  personaName, 
  description, 
  instructions,
  expertiseAreas,
  currentTone,
  onApplyVoiceProfile
}) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [voiceProfile, setVoiceProfile] = useState(null);

  const analyzeVoice = async () => {
    if (!personaName || !description) return;

    setIsAnalyzing(true);
    setVoiceProfile(null);

    try {
      const prompt = `You are an expert in linguistic analysis and persona design. Analyze this AI persona and provide detailed voice and tone recommendations.

PERSONA DETAILS:
Name: ${personaName}
Description: ${description}
Current Tone: ${currentTone}
Instructions: ${instructions || 'Not specified'}
Expertise Areas: ${expertiseAreas?.join(', ') || 'Not specified'}

ANALYZE AND PROVIDE:

1. VOCABULARY GUIDELINES (8-10 specific words/phrases this persona should use frequently)
   - Industry-specific terminology
   - Power words that convey authority/creativity
   - Phrases that reflect the persona's style

2. SENTENCE STRUCTURE PATTERNS (5-7 patterns)
   - Preferred sentence lengths (short/medium/long)
   - Active vs passive voice preferences
   - Question usage patterns
   - Paragraph structure

3. COMMUNICATION STYLE TRAITS (6-8 traits)
   - Level of formality
   - Use of analogies/metaphors
   - Data vs storytelling preference
   - Direct vs diplomatic approach
   - Emoji/punctuation usage
   - Technical depth level

4. EXAMPLE PHRASES (5-7 signature phrases)
   - Opening statements
   - Transition phrases
   - Closing statements
   - Ways to present information

5. TONE REFINEMENT
   - Recommended tone (Professional/Friendly/Formal/etc)
   - Tone modifiers (Enthusiastic/Cautious/Encouraging/etc)
   - Situations where tone should adjust

6. DO'S AND DON'TS
   - 5 things this persona should do
   - 5 things this persona should avoid

Return comprehensive, actionable suggestions in this JSON format:
{
  "vocabulary": ["word1", "word2", ...],
  "sentence_patterns": ["pattern1", "pattern2", ...],
  "style_traits": ["trait1", "trait2", ...],
  "example_phrases": ["phrase1", "phrase2", ...],
  "tone_recommendation": {
    "primary_tone": "string",
    "modifiers": ["modifier1", "modifier2"],
    "adjustment_rules": ["rule1", "rule2"]
  },
  "dos": ["do1", "do2", ...],
  "donts": ["dont1", "dont2", ...],
  "personality_summary": "Brief description of the persona's voice"
}`;

      const response = await apiClient.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            vocabulary: {
              type: "array",
              items: { type: "string" }
            },
            sentence_patterns: {
              type: "array",
              items: { type: "string" }
            },
            style_traits: {
              type: "array",
              items: { type: "string" }
            },
            example_phrases: {
              type: "array",
              items: { type: "string" }
            },
            tone_recommendation: {
              type: "object",
              properties: {
                primary_tone: { type: "string" },
                modifiers: {
                  type: "array",
                  items: { type: "string" }
                },
                adjustment_rules: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            },
            dos: {
              type: "array",
              items: { type: "string" }
            },
            donts: {
              type: "array",
              items: { type: "string" }
            },
            personality_summary: { type: "string" }
          }
        }
      });

      setVoiceProfile(response);
    } catch (error) {
      console.error('Failed to analyze voice:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyAll = () => {
    if (voiceProfile && onApplyVoiceProfile) {
      onApplyVoiceProfile(voiceProfile);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-indigo-600" />
            Voice & Tone Analyzer
          </CardTitle>
          <CardDescription>
            AI-powered analysis of communication style, vocabulary, and tone
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={analyzeVoice}
            disabled={isAnalyzing || !personaName || !description}
            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing Voice Profile...
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 mr-2" />
                Analyze Voice & Tone
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {voiceProfile && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                Voice Profile Analysis
              </CardTitle>
              <Button
                onClick={handleApplyAll}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Apply Profile
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personality Summary */}
            {voiceProfile.personality_summary && (
              <Alert className="bg-white border-blue-300">
                <MessageSquare className="h-4 w-4" />
                <AlertDescription>
                  <strong>Voice Personality:</strong> {voiceProfile.personality_summary}
                </AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="vocabulary" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="vocabulary">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Vocabulary
                </TabsTrigger>
                <TabsTrigger value="style">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Style
                </TabsTrigger>
                <TabsTrigger value="guidelines">
                  <Zap className="w-4 h-4 mr-2" />
                  Guidelines
                </TabsTrigger>
              </TabsList>

              {/* Vocabulary Tab */}
              <TabsContent value="vocabulary" className="space-y-4 mt-4">
                {/* Vocabulary */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Recommended Vocabulary</h4>
                  <div className="bg-white p-4 rounded-lg border border-blue-300">
                    <div className="flex flex-wrap gap-2">
                      {voiceProfile.vocabulary.map((word, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-indigo-100 text-indigo-800">
                          {word}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Example Phrases */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Signature Phrases</h4>
                  <div className="bg-white p-4 rounded-lg border border-blue-300">
                    <ul className="space-y-2">
                      {voiceProfile.example_phrases.map((phrase, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="text-blue-600 font-bold">💬</span>
                          <span className="italic">"{phrase}"</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>

              {/* Style Tab */}
              <TabsContent value="style" className="space-y-4 mt-4">
                {/* Tone Recommendation */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Tone Recommendation</h4>
                  <div className="bg-white p-4 rounded-lg border border-blue-300">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-blue-600 text-lg px-3 py-1">
                        {voiceProfile.tone_recommendation.primary_tone}
                      </Badge>
                      {voiceProfile.tone_recommendation.modifiers.map((mod, idx) => (
                        <Badge key={idx} variant="outline" className="border-blue-400">
                          {mod}
                        </Badge>
                      ))}
                    </div>
                    {voiceProfile.tone_recommendation.adjustment_rules.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Adjustment Rules:</p>
                        <ul className="space-y-1">
                          {voiceProfile.tone_recommendation.adjustment_rules.map((rule, idx) => (
                            <li key={idx} className="text-xs text-gray-600">• {rule}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sentence Patterns */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Sentence Structure Patterns</h4>
                  <div className="bg-white p-4 rounded-lg border border-blue-300">
                    <ul className="space-y-2">
                      {voiceProfile.sentence_patterns.map((pattern, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <span>{pattern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Style Traits */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Communication Style Traits</h4>
                  <div className="bg-white p-4 rounded-lg border border-blue-300">
                    <div className="flex flex-wrap gap-2">
                      {voiceProfile.style_traits.map((trait, idx) => (
                        <Badge key={idx} variant="outline" className="border-blue-400 text-blue-700">
                          {trait}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Guidelines Tab */}
              <TabsContent value="guidelines" className="space-y-4 mt-4">
                {/* Do's */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 text-green-700">✓ Do's</h4>
                  <div className="bg-white p-4 rounded-lg border border-green-300">
                    <ul className="space-y-2">
                      {voiceProfile.dos.map((item, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Don'ts */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 text-red-700">✗ Don'ts</h4>
                  <div className="bg-white p-4 rounded-lg border border-red-300">
                    <ul className="space-y-2">
                      {voiceProfile.donts.map((item, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="text-red-600 font-bold text-lg">×</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
