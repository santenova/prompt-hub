import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { client } from "@/apis/client";
import { Loader2, Sparkles, Wand2, X, CheckCircle2 } from "lucide-react";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/components/ui/use-toast";

export default function CombinePersonasModal({ open, onOpenChange, selectedPersonas, onClearSelection, currentUser }) {
  const [newName, setNewName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggestingName, setIsSuggestingName] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createPersonaMutation = useMutation({
    mutationFn: (data) => client.entities.Persona.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['personas']);
      setTimeout(() => {
        onOpenChange(false);
        onClearSelection();
      }, 5000);
    },
    onError: (error) => {
        console.error("Failed to create persona:", error);
    },
    onSettled: () => {
        setIsGenerating(false);
    }
  });

  useEffect(() => {
    if (open && selectedPersonas.length > 1) {
      const generateAndSave = async () => {
        setIsSuggestingName(true);
        setNewName("AI is suggesting a name...");
        
        const personaNameSummaries = selectedPersonas.map(p => `"${p.name}" (Description: ${p.description})`).join(', ');
        const namePrompt = `You are an expert in branding and creative naming. Based on the following personas, generate a single, concise, and creative name for a new combined persona. The name should reflect the blend of their skills and purpose.\n\nPersonas to combine: ${personaNameSummaries}\n\nGenerate a single name. For example, if you combine "Creative Writer" and "Technical Analyst", a good name might be "Data Storyteller" or "Analytical Wordsmith".\n\nReturn ONLY the name as a string, without any quotes around it.`;

        let finalName;
        try {
          const suggestedName = await client.integrations.Core.InvokeLLMwithLogging({ prompt: namePrompt });
          finalName = suggestedName.trim().replace(/"/g, '');
          setNewName(finalName);
        } catch (error) {
          console.error("Error generating suggested name:", error);
          const nameParts = selectedPersonas.map(p => p.name.split(' ')[0]);
          const uniqueNameParts = [...new Set(nameParts)];
          finalName = (uniqueNameParts.length === 1) 
            ? `Advanced ${uniqueNameParts[0]} Specialist` 
            : uniqueNameParts.join(' & ') + ' Specialist';
          setNewName(finalName);
        } finally {
          setIsSuggestingName(false);
        }

        if (finalName) {
            setIsGenerating(true);
            
            const personaSummaries = selectedPersonas.map(p => {
                const voiceProfileString = p.voice_profile && Object.keys(p.voice_profile).length > 0 ? `\nVoice Profile: ${JSON.stringify(p.voice_profile, null, 2)}` : '';
                return `Name: ${p.name}\nDescription: ${p.description}\nCategory: ${p.category}\nTone: ${p.tone}\nExpertise: ${p.expertise_areas?.join(', ')}\nInstructions: ${p.instructions}${voiceProfileString}`;
            }).join('\n\n---\n\n');

            const personaDetailsPrompt = `You are an expert at creating AI personas. Your task is to combine the following ${selectedPersonas.length} personas into a single, cohesive new persona named "${finalName}".
      
            Here are the personas to combine:
            ${personaSummaries}
            
            Based on these, generate a complete persona profile. The goal is to blend the strengths and characteristics of all selected personas. The new persona should be a versatile and powerful evolution of its components.
            
            Your main task is to write a new description, a new set of instructions, and a new voice_profile that synthesize the core attributes, purpose, and knowledge of all source personas.
            
            Generate the following fields:
            - description: A detailed description of the new persona's role and purpose.
            - instructions: Detailed instructions for the AI on how to behave as this persona.
            - voice_profile: A detailed voice and tone profile for the persona, with the following structure: { "vocabulary": [], "sentence_patterns": [], "style_traits": [], "example_phrases": [], "tone_recommendation": { "primary_tone": "", "modifiers": [], "adjustment_rules": [] }, "dos": [], "donts": [], "personality_summary": "" }. It should be a blended version of the source voice profiles.
            - icon: A single emoji that represents the new persona.
            - color: A Tailwind CSS gradient (e.g., from-blue-500 to-cyan-600).
            - tone: The most appropriate tone: "Professional", "Friendly", "Formal", "Casual", "Enthusiastic", "Direct", "Empathetic".
            - expertise_areas: An array of strings listing the combined areas of expertise.
            - example_prompts: An array of 3-5 high-quality example prompts that showcase the new persona's capabilities.
            - tags: An array of relevant string tags.
            `;
            
            try {
              const result = await client.integrations.Core.InvokeLLM({
                prompt: personaDetailsPrompt,
                response_json_schema: {
                  type: 'object',
                  properties: {
                    description: { type: 'string' },
                    instructions: { type: 'string' },
                    icon: { type: 'string' },
                    color: { type: 'string' },
                    tone: { type: 'string', enum: ["Professional", "Friendly", "Formal", "Casual", "Enthusiastic", "Direct", "Empathetic"] },
                    expertise_areas: { type: 'array', items: { type: 'string' } },
                    example_prompts: { type: 'array', items: { type: 'string' } },
                    tags: { type: 'array', items: { type: 'string' } },
                    voice_profile: {
                        type: "object",
                        properties: {
                          vocabulary: { type: "array", items: { type: "string" } },
                          sentence_patterns: { type: "array", items: { type: "string" } },
                          style_traits: { type: "array", items: { type: "string" } },
                          example_phrases: { type: "array", items: { type: "string" } },
                          tone_recommendation: {
                            type: "object",
                            properties: {
                              primary_tone: { type: "string" },
                              modifiers: { type: "array", items: { type: "string" } },
                              adjustment_rules: { type: "array", items: { type: "string" } }
                            }
                          },
                          dos: { type: "array", items: { type: "string" } },
                          donts: { type: "array", items: { type: "string" } },
                          personality_summary: { type: "string" }
                        },
                    }
                  },
                  required: ['description', 'instructions', 'icon', 'color', 'tone', 'expertise_areas', 'example_prompts', 'tags', 'voice_profile']
                },
              });
              
              // Merge expertise_areas from all source personas + LLM output
              const sourceExpertise = Array.from(
                new Set(
                  selectedPersonas
                    .flatMap(p => (Array.isArray(p.expertise_areas) ? p.expertise_areas : []))
                    .filter(Boolean)
                    .map(s => s.toString().trim())
                    .filter(Boolean)
                )
              );

              const llmExpertise = Array.isArray(result.expertise_areas) ? result.expertise_areas : [];
              const combinedExpertise = (() => {
                const map = new Map();
                [...sourceExpertise, ...llmExpertise].forEach(item => {
                  if (!item) return;
                  const key = item.toString().trim().toLowerCase();
                  if (!map.has(key)) map.set(key, item.toString().trim());
                });
                return Array.from(map.values());
              })();

              // Merge example_prompts from sources + LLM
              const sourceExamples = selectedPersonas
                .flatMap(p => (Array.isArray(p.example_prompts) ? p.example_prompts : []))
                .filter(Boolean)
                .map(s => s.toString().trim())
                .filter(Boolean);
              const llmExamples = Array.isArray(result.example_prompts)
                ? result.example_prompts.map(s => s && s.toString().trim()).filter(Boolean)
                : [];
              const combinedExamples = (() => {
                const map = new Map();
                [...sourceExamples, ...llmExamples].forEach(item => {
                  const key = item.toLowerCase();
                  if (!map.has(key)) map.set(key, item);
                });
                return Array.from(map.values());
              })();

              // Merge voice_profile.vocabulary from sources + LLM
              const sourceVocab = selectedPersonas
                .flatMap(p => (p.voice_profile && Array.isArray(p.voice_profile.vocabulary) ? p.voice_profile.vocabulary : []))
                .filter(Boolean)
                .map(s => s.toString().trim())
                .filter(Boolean);
              const llmVocab = (result.voice_profile && Array.isArray(result.voice_profile.vocabulary))
                ? result.voice_profile.vocabulary.map(s => s && s.toString().trim()).filter(Boolean)
                : [];
              const combinedVocab = (() => {
                const map = new Map();
                [...sourceVocab, ...llmVocab].forEach(item => {
                  const key = item.toLowerCase();
                  if (!map.has(key)) map.set(key, item);
                });
                return Array.from(map.values());
              })();

              // Merge voice_profile.example_phrases (Signature Phrases)
              const sourceExamplePhrases = selectedPersonas
                .flatMap(p => (p.voice_profile && Array.isArray(p.voice_profile.example_phrases) ? p.voice_profile.example_phrases : []))
                .filter(Boolean)
                .map(s => s.toString().trim())
                .filter(Boolean);
              const llmExamplePhrases = (result.voice_profile && Array.isArray(result.voice_profile.example_phrases))
                ? result.voice_profile.example_phrases.map(s => s && s.toString().trim()).filter(Boolean)
                : [];
              const combinedExamplePhrases = (() => {
                const map = new Map();
                [...sourceExamplePhrases, ...llmExamplePhrases].forEach(item => {
                  const key = item.toLowerCase();
                  if (!map.has(key)) map.set(key, item);
                });
                return Array.from(map.values());
              })();

              const mergedVoiceProfile = {
                ...(result.voice_profile || {}),
                vocabulary: combinedVocab,
                example_phrases: combinedExamplePhrases,
              };

              // Merge default instructions from sources + LLM
              const sourceDefaultFromField = selectedPersonas
                .flatMap(p => (Array.isArray(p.default_instructions) ? p.default_instructions : []))
                .filter(Boolean)
                .map(s => s.toString().trim())
                .filter(Boolean);
              const sourceDefaultFromInstructions = selectedPersonas
                .map(p => p.instructions)
                .filter(Boolean)
                .map(s => s.toString().trim())
                .filter(Boolean);
              const llmDefault = Array.isArray(result.default_instructions)
                ? result.default_instructions.map(s => s && s.toString().trim()).filter(Boolean)
                : [];
              const llmInstructionsAsDefault = result.instructions
                ? [result.instructions.toString().trim()].filter(Boolean)
                : [];
              const combinedDefaultInstructions = (() => {
                const map = new Map();
                [...sourceDefaultFromField, ...sourceDefaultFromInstructions, ...llmDefault, ...llmInstructionsAsDefault].forEach(item => {
                  if (!item) return;
                  const key = item.toLowerCase();
                  if (!map.has(key)) map.set(key, item);
                });
                return Array.from(map.values());
              })();

              // Merge tags from sources + LLM
              const sourceTags = selectedPersonas
                .flatMap(p => (Array.isArray(p.tags) ? p.tags : []))
                .filter(Boolean)
                .map(s => s.toString().trim())
                .filter(Boolean);
              const llmTags = Array.isArray(result.tags)
                ? result.tags.map(s => s && s.toString().trim()).filter(Boolean)
                : [];
              const combinedTags = (() => {
                const map = new Map();
                [...sourceTags, ...llmTags].forEach(item => {
                  const key = item.toLowerCase();
                  if (!map.has(key)) map.set(key, item);
                });
                return Array.from(map.values());
              })();

              const personaData = {
                name: finalName,
                is_custom: true,
                ...result,
                expertise_areas: combinedExpertise,
                example_prompts: combinedExamples,
                tags: combinedTags,
                voice_profile: mergedVoiceProfile,
                default_instructions: combinedDefaultInstructions,
                category: "Custom",
                creator_name: currentUser?.full_name || currentUser?.email,
              };
              
              createPersonaMutation.mutate(personaData);

              // Send to Slack automatically
              if (currentUser?.slack_webhook_url) {
                try {
                  await client.functions.invoke('sendPersonaToSlack', {
                    webhookUrl: currentUser.slack_webhook_url,
                    personaName: finalName,
                    description: result.description,
                    tone: result.tone,
                    expertise: combinedExpertise,
                    combinedFrom: selectedPersonas.map(p => p.name)
                  });

                  toast({
                    title: "Sent to Slack",
                    description: "Combined persona posted successfully"
                  });
                } catch (error) {
                  console.error('Slack send failed:', error);
                }
              }
        
            } catch (error) {
              console.error("Error generating and saving combined persona:", error);
              setIsGenerating(false);
            }
        }
      };

      generateAndSave();
    } else if (!open) {
      setNewName('');
      setIsGenerating(false);
      setIsSuggestingName(false);
    }
  }, [open, selectedPersonas]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-purple-600" />
            Creating New Persona...
          </DialogTitle>
          <DialogDescription>
            AI is blending the selected personas into a new, powerful one. Please wait.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
            <div className="flex flex-col items-center justify-center text-center space-y-4 p-8 bg-gray-50 rounded-lg">
                {(isSuggestingName || isGenerating) && <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />}

                <div className="space-y-2">
                  <p className="font-semibold text-lg">{newName}</p>

                  {isSuggestingName && <p className="text-gray-500 text-sm">Generating a creative name...</p>}

                  {isGenerating && !isSuggestingName && <p className="text-gray-500 text-sm">Building the new persona profile...</p>}

                  {!isGenerating && !isSuggestingName && newName && !createPersonaMutation.isError && (
                      <p className="text-green-600 text-sm flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-4 h-4"/>
                          Persona created successfully! Closing...
                      </p>
                  )}
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                      className="bg-purple-600 h-2.5 rounded-full transition-all duration-500" 
                      style={{ width: isSuggestingName ? '33%' : (isGenerating ? '66%' : (createPersonaMutation.isSuccess ? '100%' : '0%')) }}
                  ></div>
                </div>
            </div>

            <div>
                <h4 className="font-semibold text-sm mb-2">Combining:</h4>
                <div className="space-y-1">
                    {selectedPersonas.map(p => (
                    <div key={p.id} className="flex items-center gap-2 text-sm text-gray-600">
                        <div className={`w-4 h-4 flex-shrink-0 rounded bg-gradient-to-r ${p.color} flex items-center justify-center text-xs`}>
                            {p.icon}
                        </div>
                        <span>{p.name}</span>
                    </div>
                    ))}
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
