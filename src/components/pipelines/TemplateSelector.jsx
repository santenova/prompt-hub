import React, { useState, useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/apis/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

export default function TemplateSelector({ value, onChange, pipelineDescription }) {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      try {
        const results = await apiClient.entities.Template.list('-use_count', 100);
        return Array.isArray(results) ? results.filter(t => t.title && t.content) : [];
      } catch {
        return [];
      }
    },
  });

  // Group templates by category
  const groupedTemplates = useMemo(() => {
    return templates.reduce((acc, template) => {
      const category = template.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(template);
      return acc;
    }, {});
  }, [templates]);

  // AI-driven suggestions based on pipeline description
  const suggestedTemplates = useMemo(() => {
    if (!pipelineDescription?.trim()) return [];
    
    const desc = pipelineDescription.toLowerCase();
    return templates
      .filter(t => {
        const title = t.title?.toLowerCase() || '';
        const desc_text = t.description?.toLowerCase() || '';
        const category = t.category?.toLowerCase() || '';
        
        return title.includes(desc) || desc_text.includes(desc) || 
               desc.split(' ').some(word => 
                 title.includes(word) || desc_text.includes(word) || category.includes(word)
               );
      })
      .slice(0, 5);
  }, [templates, pipelineDescription]);

  const selectedTemplate = templates.find(t => t.id === value);

  return (
    <div className="space-y-3">
      {suggestedTemplates.length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900 flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4" />
            AI Suggestions
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {suggestedTemplates.map(t => (
              <button
                key={t.id}
                onClick={() => onChange(t.id)}
                className={`text-left p-2 rounded border transition ${
                  value === t.id 
                    ? 'bg-blue-100 border-blue-400' 
                    : 'bg-white border-blue-100 hover:bg-blue-50'
                }`}
              >
                <p className="text-xs font-medium truncate">{t.title}</p>
                <p className="text-xs text-gray-600">{t.category}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <Select value={value || ''} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a template..." />
        </SelectTrigger>
        <SelectContent className="w-full max-h-96">
          <SelectItem value={null}>None - Use Custom Prompt</SelectItem>
          
          {Object.entries(groupedTemplates).map(([category, cats]) => (
            <div key={category}>
              <div className="px-2 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100">
                {category}
              </div>
              {cats.map(t => (
                <SelectItem key={t.id} value={t.id}>
                  <div className="flex items-center gap-2">
                    <span>{t.title}</span>
                    {t.version && t.version > 1 && (
                      <Badge variant="outline" className="text-xs">v{t.version}</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>

      {selectedTemplate && (
        <Card className="bg-gray-50">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <CardTitle className="text-sm">{selectedTemplate.title}</CardTitle>
                <CardDescription className="text-xs">
                  {selectedTemplate.category}
                  {selectedTemplate.version && selectedTemplate.version > 1 && (
                    <span className="ml-2">• v{selectedTemplate.version}</span>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedTemplate.description && (
              <p className="text-xs text-gray-600">{selectedTemplate.description}</p>
            )}
            {selectedTemplate.version_history && selectedTemplate.version_history.length > 0 && (
              <div className="border-t pt-2">
                <p className="text-xs font-medium text-gray-700 mb-1">Versions:</p>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {selectedTemplate.version_history.map((v) => (
                    <div key={v.version} className="text-xs text-gray-600 flex items-center gap-2">
                      <span className="font-mono">v{v.version}</span>
                      <span>{v.saved_date ? new Date(v.saved_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
