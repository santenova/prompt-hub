import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const categories = ["Science", "Business", "Creative", "Technical", "Education", "Health", "Finance", "Legal", "Marketing", "Sales", "Custom"];
const tones = ["Professional", "Friendly", "Formal", "Casual", "Enthusiastic", "Direct", "Empathetic"];

export default function AddPersonaModal({ open, onOpenChange, persona, onSave, isSaving }) {
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    icon: '👤',
    color: 'from-gray-500 to-slate-500',
    category: 'Custom',
    instructions: '',
    tone: 'Professional',
    expertise_areas: [],
    example_prompts: [],
    tags: [],
    is_custom: true,
    voice_profile: null
  });

  const [expertiseInput, setExpertiseInput] = React.useState('');
  const [exampleInput, setExampleInput] = React.useState('');
  const [tagInput, setTagInput] = React.useState('');
  const [aiTab, setAiTab] = React.useState('form');

  React.useEffect(() => {
    if (open) {
      if (persona) {
        setFormData({
          id: persona.id,
          name: persona.name || '',
          description: persona.description || '',
          icon: persona.icon || '👤',
          color: persona.color || 'from-gray-500 to-slate-500',
          category: persona.category || 'Custom',
          instructions: persona.instructions || '',
          tone: persona.tone || 'Professional',
          expertise_areas: persona.expertise_areas || [],
          example_prompts: persona.example_prompts || [],
          tags: persona.tags || [],
          is_custom: persona.is_custom !== false,
          voice_profile: persona.voice_profile || null
        });
      } else {
        setFormData({
          name: '',
          description: '',
          icon: '👤',
          color: 'from-gray-500 to-slate-500',
          category: 'Custom',
          instructions: '',
          tone: 'Professional',
          expertise_areas: [],
          example_prompts: [],
          tags: [],
          is_custom: true,
          voice_profile: null
        });
      }
      setAiTab('form');
    }
  }, [open, persona]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.description) {
      onSave(formData);
    }
  };

  const addExpertise = () => {
    if (expertiseInput.trim() && !formData.expertise_areas.includes(expertiseInput.trim())) {
      setFormData(prev => ({
        ...prev,
        expertise_areas: [...prev.expertise_areas, expertiseInput.trim()]
      }));
      setExpertiseInput('');
    }
  };

  const removeExpertise = (item) => {
    setFormData(prev => ({
      ...prev,
      expertise_areas: prev.expertise_areas.filter(e => e !== item)
    }));
  };

  const addExample = () => {
    if (exampleInput.trim() && !formData.example_prompts.includes(exampleInput.trim())) {
      setFormData(prev => ({
        ...prev,
        example_prompts: [...prev.example_prompts, exampleInput.trim()]
      }));
      setExampleInput('');
    }
  };

  const removeExample = (item) => {
    setFormData(prev => ({
      ...prev,
      example_prompts: prev.example_prompts.filter(e => e !== item)
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleApplySuggestedTags = (tags) => {
    const newTags = tags.filter(tag => !formData.tags.includes(tag));
    if (newTags.length > 0) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, ...newTags]
      }));
    }
  };

  const handleApplyInstructions = (instructionsText) => {
    setFormData(prev => ({
      ...prev,
      instructions: instructionsText
    }));
  };

  const handleApplyExpertise = (expertiseList) => {
    setFormData(prev => ({
      ...prev,
      expertise_areas: [...new Set([...prev.expertise_areas, ...expertiseList])]
    }));
  };

  const handleApplyExamples = (examplesList) => {
    setFormData(prev => ({
      ...prev,
      example_prompts: [...new Set([...prev.example_prompts, ...examplesList])]
    }));
  };

  const handleApplyVoiceProfile = (voiceProfile) => {
    // Apply tone recommendation
    if (voiceProfile.tone_recommendation?.primary_tone) {
      setFormData(prev => ({
        ...prev,
        tone: voiceProfile.tone_recommendation.primary_tone
      }));
    }

    // Store the full voice profile for reference
    setFormData(prev => ({
      ...prev,
      voice_profile: voiceProfile
    }));

    // Optionally enhance instructions with voice guidelines
    if (voiceProfile.dos && voiceProfile.dos.length > 0) {
      const voiceGuidelines = `\n\nVoice Guidelines:\n${voiceProfile.dos.map(d => `- ${d}`).join('\n')}`;
      setFormData(prev => ({
        ...prev,
        instructions: prev.instructions + voiceGuidelines
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[95vw] lg:max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {persona ? 'Edit Persona' : 'Create Custom Persona'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <Tabs value={aiTab} onValueChange={setAiTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="form">Persona Details</TabsTrigger>
                <TabsTrigger value="ai-tags">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Tags
                </TabsTrigger>
              </TabsList>

              <TabsContent value="form" className="mt-4">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Persona Name *</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Senior Developer, Marketing Expert"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="icon">Icon/Emoji</Label>
                      <Input
                        id="icon"
                        placeholder="👤"
                        value={formData.icon}
                        onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                        maxLength={2}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the persona's role, expertise, and approach..."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      required
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tone">Communication Tone</Label>
                      <Select
                        value={formData.tone}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, tone: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {tones.map(tone => (
                            <SelectItem key={tone} value={tone}>{tone}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instructions">Default Instructions</Label>
                    <Textarea
                      id="instructions"
                      placeholder="How should this persona behave? What guidelines should it follow?"
                      value={formData.instructions}
                      onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expertise">Expertise Areas</Label>
                    <div className="flex gap-2">
                      <Input
                        id="expertise"
                        placeholder="Add an expertise area"
                        value={expertiseInput}
                        onChange={(e) => setExpertiseInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
                      />
                      <Button type="button" onClick={addExpertise} variant="outline" size="icon">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {formData.expertise_areas.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.expertise_areas.map((item, idx) => (
                          <Badge key={idx} variant="secondary" className="pl-2.5 pr-1 py-1">
                            {item}
                            <button
                              type="button"
                              onClick={() => removeExpertise(item)}
                              className="ml-1.5 hover:bg-gray-300 rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="examples">Example Use Cases</Label>
                    <div className="flex gap-2">
                      <Input
                        id="examples"
                        placeholder="Add an example prompt or use case"
                        value={exampleInput}
                        onChange={(e) => setExampleInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExample())}
                      />
                      <Button type="button" onClick={addExample} variant="outline" size="icon">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {formData.example_prompts.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {formData.example_prompts.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                            <span className="flex-1 text-sm">{item}</span>
                            <button
                              type="button"
                              onClick={() => removeExample(item)}
                              className="hover:bg-gray-200 rounded-full p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        id="tags"
                        placeholder="Add a tag"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      />
                      <Button type="button" onClick={addTag} variant="outline" size="icon">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="pl-2.5 pr-1 py-1">
                            #{tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-1.5 hover:bg-gray-300 rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!formData.name || !formData.description || isSaving}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    >
                      {isSaving ? 'Saving...' : 'Save Persona'}
                    </Button>
                  </DialogFooter>
                </form>
              </TabsContent>

              <TabsContent value="ai-tags" className="mt-4">
                <div className="text-sm text-gray-500 p-4">AI tag suggestions unavailable.</div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - AI Assistants removed */}
        </div>
      </DialogContent>
    </Dialog>
  );
}