import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Image as ImageIcon, Sparkles, Download, Copy, Check, Wand2, Users, ChevronsUpDown, FolderOpen } from 'lucide-react';
import { apiClient } from '@/apis/client';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

export default function AIImageGenerator({ personas = [], contextFromChat = '' }) {
  const [prompt, setPrompt] = useState('');
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectContext, setProjectContext] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageStyle, setImageStyle] = useState('realistic');
  const [copied, setCopied] = useState(false);
  const [personaPopoverOpen, setPersonaPopoverOpen] = useState(false);
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [previewPrompt, setPreviewPrompt] = useState('');
  const { toast } = useToast();

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiClient.entities.Project.list(),
    initialData: [],
  });

  const buildFinalPrompt = () => {
    let enhancedPrompt = prompt;

    // Add persona context if selected
    if (selectedPersona) {
      const persona = personas.find(p => p.id === selectedPersona);
      if (persona) {
        enhancedPrompt = `${prompt}. Style based on: ${persona.description}`;
      }
    }

    // Add project context if available
    if (projectContext) {
      enhancedPrompt = `${enhancedPrompt}. Project: ${projectContext}`;
    }

    // Add chat context if available
    if (contextFromChat) {
      enhancedPrompt = `${enhancedPrompt}. Context: ${contextFromChat.substring(0, 200)}`;
    }

    // Add style modifiers
    const styleModifiers = {
      realistic: 'photorealistic, highly detailed, professional photography',
      artistic: 'artistic, creative, expressive, beautiful composition',
      minimalist: 'minimalist, clean, simple, elegant design',
      vibrant: 'vibrant colors, dynamic, energetic, eye-catching',
      professional: 'professional, corporate, polished, business-appropriate'
    };

    return `${enhancedPrompt}. ${styleModifiers[imageStyle] || ''}`;
  };

  const generateImage = async () => {
     if (!prompt.trim()) {
       toast({
         title: "Prompt Required",
         description: "Please describe what you want to visualize",
         variant: "destructive"
       });
       return;
     }

     setIsGenerating(true);
     try {
       const finalPrompt = buildFinalPrompt();

      const response = await apiClient.integrations.Core.GenerateImage({
        prompt: finalPrompt
      });

      const url = response?.url || response;
      setGeneratedImageUrl(url);

      // Save to ContentHistory
      await apiClient.entities.ContentHistory.create({
        type: 'generation',
        source_module: 'ai_image_generator',
        tool_type: 'ai_image_generator',
        image_url: url,
        image_prompt: prompt,
        image_style: imageStyle,
        persona_id: selectedPersona,
        persona_name: personas.find(p => p.id === selectedPersona)?.name,
        project_id: selectedProject,
        project_name: projects.find(p => p.id === selectedProject)?.name,
        request_prompt: finalPrompt,
        status: 'completed'
      });

      // Save to Content Library
      await apiClient.entities.LibraryItem.create({
        title: `AI Image: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`,
        content: url,
        content_type: 'image',
        tags: ['ai-generated', 'image', imageStyle],
        persona_id: selectedPersona,
        persona_name: personas.find(p => p.id === selectedPersona)?.name,
        project_id: selectedProject,
        project_name: projects.find(p => p.id === selectedProject)?.name,
        metadata: {
          prompt: prompt,
          full_prompt: finalPrompt,
          style: imageStyle,
          image_url: url
        }
      });

      // Save to User Profile
      const user = await apiClient.auth.me();
      const currentImages = user.generated_images || [];
      await apiClient.auth.updateMe({
        generated_images: [
          {
            image_url: url,
            prompt: prompt,
            style: imageStyle,
            persona_id: selectedPersona,
            persona_name: personas.find(p => p.id === selectedPersona)?.name,
            project_id: selectedProject,
            project_name: projects.find(p => p.id === selectedProject)?.name,
            created_date: new Date().toISOString(),
            is_favorite: false,
            tags: []
          },
          ...currentImages
        ].slice(0, 1000) // Keep last 1000 images
      });

      toast({
        title: "Image Generated & Saved",
        description: "Your visualization is ready and saved to your history"
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFromPersona = async (personaId) => {
    const persona = personas.find(p => p.id === personaId);
    if (!persona) return;

    const autoPrompt = `Create a visual representation of ${persona.name}: ${persona.description}. ${persona.expertise_areas?.length > 0 ? `Expertise: ${persona.expertise_areas.join(', ')}` : ''}`;
    
    // Append to existing prompt instead of replacing
    setPrompt(prev => {
      if (!prev.trim()) return autoPrompt;
      return `${prev}\n\n${autoPrompt}`;
    });
    
    setSelectedPersona(personaId);

    toast({
      title: "Persona Context Appended",
      description: `Added ${persona.name} persona details to prompt`
    });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedImageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Image URL copied to clipboard"
    });
  };

  const selectedPersonaObj = personas.find(p => p.id === selectedPersona);

  return (
    <div className="space-y-4">
      <Card className="border-2 border-indigo-200 bg-gradient-to-br from-white to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-600" />
            AI Image Generator
          </CardTitle>
          <CardDescription>
            Create visuals from descriptions, personas, or chat context
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           {/* Project Context Loader */}
           {projects.length > 0 && (
             <div className="space-y-2 pb-4 border-b">
               <Label className="text-sm flex items-center gap-2">
                 <FolderOpen className="w-4 h-4 text-purple-600" />
                 Load Project Context (Optional)
               </Label>
               <Select 
                 value={selectedProject || ""} 
                 onValueChange={(value) => {
                   if (value) {
                     setSelectedProject(value);
                     const project = projects.find(p => p.id === value);
                     if (project) {
                       const context = `${project.name}. ${project.description || ''} ${project.about || ''}`.trim();
                       setProjectContext(context.substring(0, 500));

                       // Build detailed image description from project
                       const details = [
                         project.description,
                         project.about && `About: ${project.about}`,
                         project.vision && `Vision: ${project.vision}`,
                         project.topic && `Topic: ${project.topic}`,
                         project.usps?.length > 0 && `Key Features: ${project.usps.join(', ')}`
                       ].filter(Boolean).join('. ');

                       // Append to existing prompt instead of replacing
                       setPrompt(prev => {
                         const newContent = details || '';
                         if (!newContent) return prev;
                         if (!prev.trim()) return newContent;
                         return `${prev}\n\n${newContent}`;
                       });
                     }
                   } else {
                     setSelectedProject(null);
                     setProjectContext('');
                   }
                 }}
               >
                 <SelectTrigger>
                   <SelectValue placeholder="Select a project..." />
                 </SelectTrigger>
                 <SelectContent className="max-h-[200px]">
                   <SelectItem value={null}>No Project</SelectItem>
                   {projects.map(project => (
                     <SelectItem key={project.id} value={project.id}>
                       {project.name}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
               {selectedProject && (
                 <div className="text-xs text-gray-600 p-2 bg-purple-50 rounded border border-purple-200">
                   <strong>Context loaded:</strong> {projectContext.substring(0, 100)}...
                 </div>
               )}
             </div>
           )}

           {/* Quick Persona Selector with Search */}
           {personas.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Generate from Persona (Optional)
              </Label>
              <div className="flex gap-2">
                <Popover open={personaPopoverOpen} onOpenChange={setPersonaPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1 justify-between">
                      {selectedPersonaObj ? (
                        <span className="truncate">{selectedPersonaObj.icon} {selectedPersonaObj.name}</span>
                      ) : (
                        "Select a persona..."
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search personas..." />
                      <CommandEmpty>No personas found.</CommandEmpty>
                      <CommandGroup className="max-h-[200px] overflow-auto">
                        <CommandItem value="none" onSelect={() => { setSelectedPersona(null); setPersonaPopoverOpen(false); }}>
                          <Check className={`mr-2 h-4 w-4 ${!selectedPersona ? "opacity-100" : "opacity-0"}`} />
                          No Persona
                        </CommandItem>
                        {personas.map((persona) => (
                          <CommandItem 
                            key={persona.id} 
                            value={persona.name} 
                            onSelect={() => { 
                              setSelectedPersona(persona.id); 
                              setPersonaPopoverOpen(false); 
                            }}
                          >
                            <Check className={`mr-2 h-4 w-4 ${selectedPersona === persona.id ? "opacity-100" : "opacity-0"}`} />
                            {persona.icon} {persona.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedPersona && (
                  <Button
                    onClick={() => generateFromPersona(selectedPersona)}
                    variant="outline"
                    size="sm"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Auto-Fill
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Image Style */}
          <div className="space-y-2">
            <Label className="text-sm">Image Style</Label>
            <Select value={imageStyle} onValueChange={setImageStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realistic">Realistic</SelectItem>
                <SelectItem value="artistic">Artistic</SelectItem>
                <SelectItem value="minimalist">Minimalist</SelectItem>
                <SelectItem value="vibrant">Vibrant</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <Label>Image Description</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              className="min-h-[120px]"
            />
            <div className="flex gap-2">
              <Button
                onClick={generateImage}
                disabled={!prompt.trim() || isGenerating}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating (5-10s)...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Image
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setPreviewPrompt(buildFinalPrompt());
                  setShowPromptPreview(true);
                }}
                disabled={!prompt.trim()}
                variant="outline"
              >
                View Prompt
              </Button>
            </div>
          </div>

          {/* Prompt Preview Dialog */}
          {showPromptPreview && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-indigo-200 rounded-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-gray-900">Final Prompt Preview</h3>
                <Button
                  onClick={() => setShowPromptPreview(false)}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
              <div className="bg-white p-3 rounded border border-indigo-100 max-h-[200px] overflow-y-auto">
                <p className="text-xs text-gray-700 whitespace-pre-wrap">{previewPrompt}</p>
              </div>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(previewPrompt);
                  toast({ title: "Prompt copied!" });
                }}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Copy className="w-3 h-3 mr-2" />
                Copy Prompt
              </Button>
            </motion.div>
          )}

          {/* Generated Image */}
          {generatedImageUrl && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-3"
              >
                <div className="relative rounded-lg overflow-hidden border-2 border-green-200">
                  <img
                    src={generatedImageUrl}
                    alt="Generated"
                    className="w-full h-auto"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button
                      onClick={handleCopy}
                      size="sm"
                      className="bg-white/90 hover:bg-white"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = generatedImageUrl;
                        a.download = `ai-generated-${Date.now()}.png`;
                        a.click();
                      }}
                      size="sm"
                      className="bg-white/90 hover:bg-white"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Input
                  value={generatedImageUrl}
                  readOnly
                  className="text-xs font-mono"
                />
              </motion.div>
            </AnimatePresence>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
