import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Sparkles, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown,
  Eye,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import ReactMarkdown from "react-markdown";

export default function DocumentComposer({ 
  sections, 
  onSectionsChange, 
  onEnhance,
  isEnhancing 
}) {
  const [title, setTitle] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [enhancementSettings, setEnhancementSettings] = useState({
    improveClarity: true,
    addExamples: true,
    expandExplanations: true,
    addSummaries: true,
    enhancementLevel: 50
  });

  const addSection = () => {
    const newSection = {
      id: Date.now().toString(),
      heading: '',
      content: '',
      source_type: 'manual'
    };
    onSectionsChange([...sections, newSection]);
  };

  const removeSection = (id) => {
    onSectionsChange(sections.filter(s => s.id !== id));
  };

  const updateSection = (id, field, value) => {
    onSectionsChange(
      sections.map(s => s.id === id ? { ...s, [field]: value } : s)
    );
  };

  const moveSection = (index, direction) => {
    const newSections = [...sections];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    onSectionsChange(newSections);
  };

  const getFullDocument = () => {
    return `# ${title}\n\n${sections.map(s => 
      `## ${s.heading}\n\n${s.content}`
    ).join('\n\n')}`;
  };

  return (
    <Card className="border-2 border-indigo-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Document Composer
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
            >
              <Eye className="w-4 h-4 mr-1" />
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
            <Button
              onClick={() => onEnhance(getFullDocument(), enhancementSettings)}
              disabled={isEnhancing || !title || sections.length === 0}
              className="bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              AI Enhance
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!previewMode ? (
          <>
            <div className="space-y-2">
              <Label>Document Title</Label>
              <Input
                placeholder="Enter document title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-semibold"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Sections ({sections.length})</Label>
                <Button onClick={addSection} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Section
                </Button>
              </div>

              <AnimatePresence>
                {sections.map((section, index) => (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="border rounded-lg p-4 bg-white space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Section {index + 1}</Badge>
                        {section.source_type && section.source_type !== 'manual' && (
                          <Badge className="bg-purple-100 text-purple-700 text-xs">
                            {section.source_type}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => moveSection(index, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => moveSection(index, 'down')}
                          disabled={index === sections.length - 1}
                        >
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-600"
                          onClick={() => removeSection(section.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <Input
                      placeholder="Section heading..."
                      value={section.heading}
                      onChange={(e) => updateSection(section.id, 'heading', e.target.value)}
                      className="font-semibold"
                    />
                    <Textarea
                      placeholder="Section content..."
                      value={section.content}
                      onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {sections.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm text-gray-600">No sections yet</p>
                  <Button onClick={addSection} size="sm" className="mt-3" variant="outline">
                    <Plus className="w-4 h-4 mr-1" />
                    Add First Section
                  </Button>
                </div>
              )}
            </div>

            {/* Enhancement Settings */}
            <Card className="bg-purple-50 border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  AI Enhancement Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Improve Clarity</Label>
                    <Switch
                      checked={enhancementSettings.improveClarity}
                      onCheckedChange={(v) => setEnhancementSettings({...enhancementSettings, improveClarity: v})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Add Examples</Label>
                    <Switch
                      checked={enhancementSettings.addExamples}
                      onCheckedChange={(v) => setEnhancementSettings({...enhancementSettings, addExamples: v})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Expand Explanations</Label>
                    <Switch
                      checked={enhancementSettings.expandExplanations}
                      onCheckedChange={(v) => setEnhancementSettings({...enhancementSettings, expandExplanations: v})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Add Summaries</Label>
                    <Switch
                      checked={enhancementSettings.addSummaries}
                      onCheckedChange={(v) => setEnhancementSettings({...enhancementSettings, addSummaries: v})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Enhancement Level: {enhancementSettings.enhancementLevel}%</Label>
                  <Slider
                    value={[enhancementSettings.enhancementLevel]}
                    onValueChange={([v]) => setEnhancementSettings({...enhancementSettings, enhancementLevel: v})}
                    min={0}
                    max={100}
                    step={10}
                  />
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{getFullDocument()}</ReactMarkdown>
          </div>
        )}
      </CardContent>
    </Card>
  );
}