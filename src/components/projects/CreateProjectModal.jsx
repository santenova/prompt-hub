import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const toneOptions = ['Professional', 'Casual', 'Friendly', 'Enthusiastic', 'Formal', 'Conversational'];
const styleOptions = ['Informative', 'Persuasive', 'Storytelling', 'Educational', 'Entertaining'];

export default function CreateProjectModal({ open, onClose, onSubmit, personas, templates }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    topic: '',
    tone: 'Professional',
    style: 'Informative',
    target_audience: '',
    keywords: '',
    exclude_words: '',
    persona_ids: [],
    template_ids: []
  });
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a project name",
        variant: "destructive"
      });
      return;
    }

    onSubmit({
      ...formData,
      is_active: true
    });
    
    setFormData({
      name: '',
      description: '',
      topic: '',
      tone: 'Professional',
      style: 'Informative',
      target_audience: '',
      keywords: '',
      exclude_words: '',
      persona_ids: [],
      template_ids: []
    });
  };

  const togglePersona = (id) => {
    setFormData(prev => ({
      ...prev,
      persona_ids: prev.persona_ids.includes(id)
        ? prev.persona_ids.filter(pid => pid !== id)
        : [...prev.persona_ids, id]
    }));
  };

  const toggleTemplate = (id) => {
    setFormData(prev => ({
      ...prev,
      template_ids: prev.template_ids.includes(id)
        ? prev.template_ids.filter(tid => tid !== id)
        : [...prev.template_ids, id]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Set up a project to organize your content generation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Project Name *</Label>
            <Input
              placeholder="e.g., Q1 Marketing Campaign"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Describe the project's purpose and goals..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Topic/Niche</Label>
              <Input
                placeholder="e.g., AI & Technology"
                value={formData.topic}
                onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Input
                placeholder="e.g., Tech professionals"
                value={formData.target_audience}
                onChange={(e) => setFormData(prev => ({ ...prev, target_audience: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={formData.tone} onValueChange={(v) => setFormData(prev => ({ ...prev, tone: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {toneOptions.map(tone => (
                    <SelectItem key={tone} value={tone}>{tone}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Style</Label>
              <Select value={formData.style} onValueChange={(v) => setFormData(prev => ({ ...prev, style: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {styleOptions.map(style => (
                    <SelectItem key={style} value={style}>{style}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Keywords (comma-separated)</Label>
            <Input
              placeholder="AI, automation, innovation"
              value={formData.keywords}
              onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Associate Personas (Optional)</Label>
            <div className="border rounded-lg p-3 bg-gray-50 max-h-32 overflow-y-auto space-y-1">
              {personas.slice(0, 10).map(persona => (
                <div
                  key={persona.id}
                  onClick={() => togglePersona(persona.id)}
                  className={`p-2 rounded cursor-pointer transition-colors ${
                    formData.persona_ids.includes(persona.id)
                      ? 'bg-purple-100 border border-purple-300'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <span className="text-sm">{persona.icon} {persona.name}</span>
                </div>
              ))}
            </div>
            {formData.persona_ids.length > 0 && (
              <p className="text-xs text-gray-600">{formData.persona_ids.length} persona(s) selected</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Associate Templates (Optional)</Label>
            <div className="border rounded-lg p-3 bg-gray-50 max-h-32 overflow-y-auto space-y-1">
              {templates.slice(0, 10).map(template => (
                <div
                  key={template.id}
                  onClick={() => toggleTemplate(template.id)}
                  className={`p-2 rounded cursor-pointer transition-colors ${
                    formData.template_ids.includes(template.id)
                      ? 'bg-indigo-100 border border-indigo-300'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <span className="text-sm">{template.title}</span>
                </div>
              ))}
            </div>
            {formData.template_ids.length > 0 && (
              <p className="text-xs text-gray-600">{formData.template_ids.length} template(s) selected</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-gradient-to-r from-purple-600 to-indigo-600">
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}