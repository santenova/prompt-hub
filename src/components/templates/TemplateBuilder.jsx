import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  X,
  Sparkles,
  Play,
  Save,
  Eye,
  Code,
  FileText,
  Info,
  Wand2,
  Loader2,
  Brain
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { client } from "@/apis/client";
import { useToast } from "@/components/ui/use-toast";

const COMMON_PLACEHOLDERS = [
  { key: 'topic', label: 'Topic', description: 'Main subject or theme', example: 'artificial intelligence' },
  { key: 'tone', label: 'Tone', description: 'Writing style or mood', example: 'professional' },
  { key: 'length', label: 'Length', description: 'Target word count or size', example: '500 words' },
  { key: 'audience', label: 'Audience', description: 'Target readers or users', example: 'tech professionals' },
  { key: 'format', label: 'Format', description: 'Content type or structure', example: 'blog post' },
  { key: 'goal', label: 'Goal', description: 'Objective or purpose', example: 'increase engagement' },
  { key: 'industry', label: 'Industry', description: 'Business sector', example: 'healthcare' },
  { key: 'product', label: 'Product', description: 'Product or service name', example: 'AI Assistant' },
  { key: 'company', label: 'Company', description: 'Organization name', example: 'TechCorp' },
  { key: 'deadline', label: 'Deadline', description: 'Time constraint', example: 'next week' },
];

export default function TemplateBuilder({ template, onSave, onPreview }) {
  const [content, setContent] = useState(template?.content || '');
  const [placeholders, setPlaceholders] = useState(template?.placeholders || []);
  const [previewValues, setPreviewValues] = useState({});
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [activeTab, setActiveTab] = useState('build');
  const [isAIFilling, setIsAIFilling] = useState(false);
  const { toast } = useToast();

  // Detect placeholders in content
  const detectedPlaceholders = React.useMemo(() => {
    const matches = content.match(/{([^}]+)}/g) || [];
    return [...new Set(matches)].map(p => ({
      key: p,
      label: p.replace(/[{}]/g, ''),
      description: '',
      default: ''
    }));
  }, [content]);

  const insertPlaceholder = (placeholderKey) => {
    const placeholder = `{${placeholderKey}}`;
    const textarea = document.querySelector('textarea[name="template-content"]');
    
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + placeholder + content.substring(end);
      setContent(newContent);
      
      // Set cursor position after inserted placeholder
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 0);
    } else {
      setContent(prev => prev + placeholder);
    }
  };

  const buildPreview = () => {
    let preview = content;
    detectedPlaceholders.forEach(placeholder => {
      const key = placeholder.label;
      const value = previewValues[key] || placeholder.key;
      preview = preview.replaceAll(placeholder.key, value);
    });
    return preview;
  };

  const handleQuickFill = () => {
    const values = {};
    detectedPlaceholders.forEach(placeholder => {
      const commonPlaceholder = COMMON_PLACEHOLDERS.find(p => 
        p.key.toLowerCase() === placeholder.label.toLowerCase()
      );
      values[placeholder.label] = commonPlaceholder?.example || 'example';
    });
    setPreviewValues(values);
    setActiveTab('preview');
  };

  const handleAIFillPlaceholders = async () => {
    if (detectedPlaceholders.length === 0) {
      toast({
        title: "No Placeholders",
        description: "Add placeholders to your template first",
        variant: "destructive"
      });
      return;
    }

    setIsAIFilling(true);

    try {
      const placeholdersList = detectedPlaceholders.map(p => p.label).join(', ');
      
      const prompt = `Given this template:
"${content}"

I need to fill in the following placeholders with realistic, contextually appropriate values: ${placeholdersList}

Analyze the template context and provide suitable values for each placeholder. Return ONLY a JSON object with placeholder names as keys and suggested values as strings. No markdown, no explanation, just the JSON object.

Example format:
{
  "topic": "machine learning",
  "tone": "professional",
  "audience": "software developers"
}`;

      const response = await client.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          additionalProperties: {
            type: "string"
          }
        }
      });

      if (response && typeof response === 'object') {
        setPreviewValues(response);
        setActiveTab('preview');
        toast({
          title: "AI Filled Successfully",
          description: `Generated values for ${Object.keys(response).length} placeholders`
        });
      } else {
        throw new Error('Invalid AI response');
      }
    } catch (error) {
      console.error('AI fill error:', error);
      toast({
        title: "AI Fill Failed",
        description: "Falling back to example values",
        variant: "destructive"
      });
      handleQuickFill();
    } finally {
      setIsAIFilling(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="build">
            <Code className="w-4 h-4 mr-2" />
            Build
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="helpers">
            <Sparkles className="w-4 h-4 mr-2" />
            Helpers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="build" className="space-y-4 mt-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Use <Badge variant="outline" className="mx-1 text-xs">{'{placeholder}'}</Badge> syntax to create dynamic variables.
              Example: "Write a {'{tone}'} {'{format}'} about {'{topic}'}"
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="template-content">Template Content</Label>
              <div className="flex gap-2">
                {detectedPlaceholders.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAIFillPlaceholders}
                      disabled={isAIFilling}
                      data-tour="ai-fill-button"
                      className="text-xs h-7 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border-purple-300"
                    >
                      {isAIFilling ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          AI Filling...
                        </>
                      ) : (
                        <>
                          <Brain className="w-3 h-3 mr-1" />
                          AI Fill
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleQuickFill}
                      className="text-xs h-7"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Quick Test
                    </Button>
                  </>
                )}
              </div>
            </div>
            <Textarea
              id="template-content"
              name="template-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your template here...

Example:
Write a {tone} {format} about {topic} for {audience}.
The content should be {length} and focus on {goal}."
              className="min-h-[300px] font-mono text-sm"
            />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{content.length} characters</span>
              {detectedPlaceholders.length > 0 && (
                <span className="text-purple-600 font-medium">
                  {detectedPlaceholders.length} placeholder{detectedPlaceholders.length !== 1 ? 's' : ''} detected
                </span>
              )}
            </div>
          </div>

          {detectedPlaceholders.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-purple-900 mb-3">
                Detected Placeholders
              </h4>
              <div className="flex flex-wrap gap-2">
                {detectedPlaceholders.map((placeholder, idx) => (
                  <Badge key={idx} variant="outline" className="bg-white border-purple-300 text-purple-700">
                    {placeholder.key}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="preview" className="space-y-4 mt-4">
          {detectedPlaceholders.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-blue-900">
                  Fill Placeholder Values
                </h4>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAIFillPlaceholders}
                    disabled={isAIFilling}
                    className="text-xs h-7 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 border-0"
                  >
                    {isAIFilling ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        AI Filling...
                      </>
                    ) : (
                      <>
                        <Brain className="w-3 h-3 mr-1" />
                        AI Fill
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleQuickFill}
                    className="text-xs h-7"
                  >
                    <Wand2 className="w-3 h-3 mr-1" />
                    Examples
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {detectedPlaceholders.map((placeholder, idx) => {
                  const key = placeholder.label;
                  const commonPlaceholder = COMMON_PLACEHOLDERS.find(p => 
                    p.key.toLowerCase() === key.toLowerCase()
                  );
                  return (
                    <div key={idx} className="space-y-1">
                      <Label className="text-xs text-blue-700">
                        {placeholder.key}
                        {commonPlaceholder && (
                          <span className="text-blue-500 ml-1">({commonPlaceholder.description})</span>
                        )}
                      </Label>
                      <Input
                        placeholder={commonPlaceholder?.example || 'Enter value...'}
                        value={previewValues[key] || ''}
                        onChange={(e) => setPreviewValues(prev => ({
                          ...prev,
                          [key]: e.target.value
                        }))}
                        className="bg-white"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium">Preview Output</Label>
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg border-2 border-gray-200 p-4">
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">
                {buildPreview()}
              </pre>
            </div>
          </div>

          {detectedPlaceholders.length === 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No placeholders detected. Add some using {'{placeholder}'} syntax in the Build tab.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="helpers" className="space-y-4 mt-4">
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="text-base">Quick Insert Placeholders</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {COMMON_PLACEHOLDERS.map((placeholder) => (
                    <motion.div
                      key={placeholder.key}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="outline"
                        onClick={() => insertPlaceholder(placeholder.key)}
                        className="w-full justify-start text-left h-auto py-3 bg-white hover:bg-purple-50 hover:border-purple-300"
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-sm text-gray-900">
                            {'{' + placeholder.key + '}'}
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {placeholder.description}
                          </p>
                          <p className="text-xs text-purple-600 mt-1">
                            e.g., {placeholder.example}
                          </p>
                        </div>
                        <Plus className="w-4 h-4 text-purple-600 ml-2" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="border-indigo-200 bg-indigo-50">
            <CardHeader>
              <CardTitle className="text-base">Template Patterns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={() => setContent('Write a {tone} {format} about {topic} for {audience}.\n\nThe content should:\n- Be {length}\n- Focus on {goal}\n- Include {number} key points\n\nAdditional requirements: {requirements}')}
                  className="w-full justify-start bg-white hover:bg-indigo-50"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Basic Content Template
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setContent('Create a {content_type} for {product} targeting {target_audience}.\n\nKey message: {message}\nCall to action: {action}\nTone: {tone}\nBrand voice: {voice}')}
                  className="w-full justify-start bg-white hover:bg-indigo-50"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Marketing Template
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setContent('Develop {feature} for {platform} using {technology}.\n\nRequirements:\n- {requirement_1}\n- {requirement_2}\n- {requirement_3}\n\nConstraints: {constraints}\nTimeline: {timeline}')}
                  className="w-full justify-start bg-white hover:bg-indigo-50"
                >
                  <Code className="w-4 h-4 mr-2" />
                  Technical Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
