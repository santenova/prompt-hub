import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, CheckCircle2, User, Brain, Target } from "lucide-react";
import { apiClient } from "@/apis/client";
import { motion, AnimatePresence } from "framer-motion";

const personaCategories = [
  "Personal Development",
  "HR",
  "Marketing", 
  "Sales",
  "Finance",
  "Education",
  "Coding",
  "Design",
  "Creative",
  "Business",
  "Technical",
  "Health",
  "Science"
];

const toneOptions = [
  "Professional",
  "Friendly",
  "Formal",
  "Casual",
  "Enthusiastic",
  "Direct",
  "Empathetic"
];

export default function AIPersonaGenerator({ onApplyPersona }) {
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Marketing');
  const [personaName, setPersonaName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPersona, setGeneratedPersona] = useState(null);

  const generatePersona = async () => {
    if (!description.trim()) return;

    setIsGenerating(true);
    setGeneratedPersona(null);

    try {
      const generationPrompt = `You are an expert persona development specialist. Create a comprehensive, detailed persona based on this description.

USER'S DESCRIPTION:
${description}

CATEGORY: ${selectedCategory}
${personaName ? `SUGGESTED NAME: ${personaName}` : ''}

Create a rich, multi-dimensional persona with the following structure:

{
  "name": "Clear, memorable persona name",
  "tagline": "One-sentence description of who they are",
  "description": "Comprehensive 2-3 sentence description of the persona",
  "category": "${selectedCategory}",
  
  "demographics": {
    "age_range": "Age range (e.g., 25-35)",
    "education": "Education level",
    "location_type": "Urban/Suburban/Rural preferences",
    "income_bracket": "Income range if relevant",
    "occupation": "Job title or role",
    "family_status": "Single/Married/Family details if relevant"
  },
  
  "psychographics": {
    "values": ["Core value 1", "Core value 2", "Core value 3"],
    "motivations": ["Primary motivation 1", "Motivation 2"],
    "personality_traits": ["Trait 1", "Trait 2", "Trait 3"],
    "interests": ["Interest 1", "Interest 2"],
    "lifestyle": "Brief lifestyle description"
  },
  
  "goals": {
    "primary_goals": ["Main goal 1", "Main goal 2"],
    "secondary_goals": ["Supporting goal 1", "Supporting goal 2"],
    "aspirations": ["Long-term aspiration 1", "Aspiration 2"]
  },
  
  "pain_points": {
    "frustrations": ["Frustration 1", "Frustration 2"],
    "challenges": ["Challenge 1", "Challenge 2"],
    "barriers": ["Barrier 1", "Barrier 2"]
  },
  
  "behavioral_patterns": {
    "decision_making": "How they make decisions",
    "information_seeking": "How they research and learn",
    "communication_style": "Preferred communication methods",
    "buying_behavior": "Purchase patterns if relevant",
    "digital_behavior": "Technology and social media usage",
    "work_habits": "Work style and preferences"
  },
  
  "needs": {
    "functional_needs": ["Need 1", "Need 2"],
    "emotional_needs": ["Need 1", "Need 2"],
    "social_needs": ["Need 1", "Need 2"]
  },
  
  "persona_voice": {
    "tone": "One of: Professional, Friendly, Formal, Casual, Enthusiastic, Direct, Empathetic",
    "language_style": "Communication style description",
    "key_phrases": ["Phrase they might use 1", "Phrase 2"]
  },
  
  "expertise_areas": ["Area 1", "Area 2", "Area 3"],
  
  "icon_suggestion": "Single emoji that represents this persona",
  "color_suggestion": "Tailwind gradient (e.g., from-blue-500 to-indigo-600)",
  
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  
  "use_cases": [
    "When to use this persona",
    "Best scenarios for applying this perspective"
  ],
  
  "example_scenarios": [
    {
      "situation": "Example situation",
      "response": "How this persona would respond"
    }
  ]
}

Make the persona realistic, detailed, and actionable. Focus on creating a persona that feels like a real person with depth and nuance.`;

      const response = await apiClient.integrations.Core.InvokeLLM({
        prompt: generationPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            tagline: { type: "string" },
            description: { type: "string" },
            category: { type: "string" },
            demographics: {
              type: "object",
              properties: {
                age_range: { type: "string" },
                education: { type: "string" },
                location_type: { type: "string" },
                income_bracket: { type: "string" },
                occupation: { type: "string" },
                family_status: { type: "string" }
              }
            },
            psychographics: {
              type: "object",
              properties: {
                values: { type: "array", items: { type: "string" } },
                motivations: { type: "array", items: { type: "string" } },
                personality_traits: { type: "array", items: { type: "string" } },
                interests: { type: "array", items: { type: "string" } },
                lifestyle: { type: "string" }
              }
            },
            goals: {
              type: "object",
              properties: {
                primary_goals: { type: "array", items: { type: "string" } },
                secondary_goals: { type: "array", items: { type: "string" } },
                aspirations: { type: "array", items: { type: "string" } }
              }
            },
            pain_points: {
              type: "object",
              properties: {
                frustrations: { type: "array", items: { type: "string" } },
                challenges: { type: "array", items: { type: "string" } },
                barriers: { type: "array", items: { type: "string" } }
              }
            },
            behavioral_patterns: {
              type: "object",
              properties: {
                decision_making: { type: "string" },
                information_seeking: { type: "string" },
                communication_style: { type: "string" },
                buying_behavior: { type: "string" },
                digital_behavior: { type: "string" },
                work_habits: { type: "string" }
              }
            },
            needs: {
              type: "object",
              properties: {
                functional_needs: { type: "array", items: { type: "string" } },
                emotional_needs: { type: "array", items: { type: "string" } },
                social_needs: { type: "array", items: { type: "string" } }
              }
            },
            persona_voice: {
              type: "object",
              properties: {
                tone: { type: "string" },
                language_style: { type: "string" },
                key_phrases: { type: "array", items: { type: "string" } }
              }
            },
            expertise_areas: { type: "array", items: { type: "string" } },
            icon_suggestion: { type: "string" },
            color_suggestion: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            use_cases: { type: "array", items: { type: "string" } },
            example_scenarios: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  situation: { type: "string" },
                  response: { type: "string" }
                }
              }
            }
          }
        }
      });

      setGeneratedPersona(response);
    } catch (error) {
      console.error('Failed to generate persona:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (generatedPersona && onApplyPersona) {
      // Transform to persona entity format
      const personaData = {
        name: generatedPersona.name,
        description: generatedPersona.description,
        category: generatedPersona.category,
        icon: generatedPersona.icon_suggestion || "👤",
        color: generatedPersona.color_suggestion || "from-blue-500 to-indigo-600",
        instructions: `${generatedPersona.tagline}\n\n${generatedPersona.description}`,
        tone: generatedPersona.persona_voice?.tone || "Professional",
        expertise_areas: generatedPersona.expertise_areas || [],
        tags: generatedPersona.tags || [],
        // Store rich data in custom fields
        demographics: generatedPersona.demographics,
        psychographics: generatedPersona.psychographics,
        goals: generatedPersona.goals,
        pain_points: generatedPersona.pain_points,
        behavioral_patterns: generatedPersona.behavioral_patterns,
        needs: generatedPersona.needs,
        use_cases: generatedPersona.use_cases,
        example_scenarios: generatedPersona.example_scenarios
      };

      onApplyPersona(personaData);
      setGeneratedPersona(null);
      setDescription('');
      setPersonaName('');
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Persona Generator
          </CardTitle>
          <CardDescription>
            Describe a persona and AI will create a comprehensive profile with demographics, goals, and behavioral patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="personaName">Persona Name (Optional)</Label>
              <Input
                id="personaName"
                placeholder="e.g., Tech-Savvy Millennial"
                value={personaName}
                onChange={(e) => setPersonaName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {personaCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Persona Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the persona you want to create...

Examples:
- 'A marketing professional who focuses on B2B content strategy and lead generation'
- 'A first-time parent navigating work-life balance and seeking parenting advice'
- 'A software engineer passionate about open source and clean code practices'
- 'A financial advisor serving high-net-worth individuals planning retirement'
- 'A college student interested in sustainability and social impact'

Be specific about their role, goals, challenges, and behaviors."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={8}
              className="resize-none"
            />
          </div>

          <Button
            onClick={generatePersona}
            disabled={isGenerating || !description.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Persona with AI...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Persona
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Persona Result */}
      <AnimatePresence>
        {generatedPersona && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{generatedPersona.icon_suggestion}</div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        {generatedPersona.name}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{generatedPersona.tagline}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-600">{generatedPersona.category}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="demographics">Demographics</TabsTrigger>
                    <TabsTrigger value="psycho">Psychographics</TabsTrigger>
                    <TabsTrigger value="goals">Goals & Pains</TabsTrigger>
                    <TabsTrigger value="behavior">Behavior</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4 mt-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                      <p className="text-sm text-gray-700">{generatedPersona.description}</p>
                    </div>

                    {generatedPersona.expertise_areas?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Expertise Areas</h4>
                        <div className="flex flex-wrap gap-2">
                          {generatedPersona.expertise_areas.map((area, idx) => (
                            <Badge key={idx} variant="secondary">{area}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {generatedPersona.tags?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {generatedPersona.tags.map((tag, idx) => (
                            <Badge key={idx} variant="outline">#{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {generatedPersona.use_cases?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Use Cases</h4>
                        <ul className="space-y-2">
                          {generatedPersona.use_cases.map((useCase, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                              <Target className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              {useCase}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="demographics" className="space-y-4 mt-4">
                    {generatedPersona.demographics && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(generatedPersona.demographics).map(([key, value]) => (
                          <div key={key} className="bg-white p-3 rounded-lg border border-gray-200">
                            <h5 className="text-xs font-semibold text-gray-600 uppercase mb-1">
                              {key.replace(/_/g, ' ')}
                            </h5>
                            <p className="text-sm text-gray-900">{value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="psycho" className="space-y-4 mt-4">
                    {generatedPersona.psychographics && (
                      <>
                        {generatedPersona.psychographics.values && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Values</h4>
                            <div className="flex flex-wrap gap-2">
                              {generatedPersona.psychographics.values.map((value, idx) => (
                                <Badge key={idx} className="bg-blue-100 text-blue-800">{value}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {generatedPersona.psychographics.motivations && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Motivations</h4>
                            <ul className="space-y-1">
                              {generatedPersona.psychographics.motivations.map((motivation, idx) => (
                                <li key={idx} className="text-sm text-gray-700">• {motivation}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {generatedPersona.psychographics.personality_traits && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Personality Traits</h4>
                            <div className="flex flex-wrap gap-2">
                              {generatedPersona.psychographics.personality_traits.map((trait, idx) => (
                                <Badge key={idx} variant="outline">{trait}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {generatedPersona.psychographics.lifestyle && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Lifestyle</h4>
                            <p className="text-sm text-gray-700">{generatedPersona.psychographics.lifestyle}</p>
                          </div>
                        )}
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="goals" className="space-y-4 mt-4">
                    {generatedPersona.goals && (
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <Target className="w-4 h-4 text-green-600" />
                            Primary Goals
                          </h4>
                          <ul className="space-y-1">
                            {generatedPersona.goals.primary_goals?.map((goal, idx) => (
                              <li key={idx} className="text-sm text-gray-700">✓ {goal}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Pain Points</h4>
                          {generatedPersona.pain_points?.frustrations && (
                            <div className="mb-3">
                              <h5 className="text-xs font-semibold text-red-600 uppercase mb-1">Frustrations</h5>
                              <ul className="space-y-1">
                                {generatedPersona.pain_points.frustrations.map((frustration, idx) => (
                                  <li key={idx} className="text-sm text-gray-700">• {frustration}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {generatedPersona.pain_points?.challenges && (
                            <div>
                              <h5 className="text-xs font-semibold text-orange-600 uppercase mb-1">Challenges</h5>
                              <ul className="space-y-1">
                                {generatedPersona.pain_points.challenges.map((challenge, idx) => (
                                  <li key={idx} className="text-sm text-gray-700">• {challenge}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="behavior" className="space-y-4 mt-4">
                    {generatedPersona.behavioral_patterns && (
                      <div className="space-y-4">
                        {Object.entries(generatedPersona.behavioral_patterns).map(([key, value]) => (
                          <div key={key} className="bg-white p-4 rounded-lg border border-gray-200">
                            <h5 className="text-sm font-semibold text-gray-900 mb-2">
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </h5>
                            <p className="text-sm text-gray-700">{value}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {generatedPersona.persona_voice && (
                      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                        <h4 className="font-semibold text-gray-900 mb-3">Communication Style</h4>
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs font-semibold text-gray-600">Tone:</span>
                            <Badge className="ml-2">{generatedPersona.persona_voice.tone}</Badge>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-gray-600">Style:</span>
                            <p className="text-sm text-gray-700 mt-1">{generatedPersona.persona_voice.language_style}</p>
                          </div>
                          {generatedPersona.persona_voice.key_phrases?.length > 0 && (
                            <div>
                              <span className="text-xs font-semibold text-gray-600">Key Phrases:</span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {generatedPersona.persona_voice.key_phrases.map((phrase, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">"{phrase}"</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
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
                  Create This Persona
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
