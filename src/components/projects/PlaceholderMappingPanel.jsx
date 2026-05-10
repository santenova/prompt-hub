import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function PlaceholderMappingPanel({ project, linkedTemplates }) {
  // Extract all placeholders from linked templates
  const allPlaceholders = useMemo(() => {
    const placeholderMap = new Map();
    
    (linkedTemplates || []).forEach(template => {
      if (template.placeholders) {
        template.placeholders.forEach(ph => {
          if (!placeholderMap.has(ph.key)) {
            placeholderMap.set(ph.key, { ...ph, templates: [] });
          }
          placeholderMap.get(ph.key).templates.push(template.id);
        });
      }
    });
    
    return Array.from(placeholderMap.values());
  }, [linkedTemplates]);

  // Map project fields to common placeholder patterns
  const projectFieldMappings = {
    name: ['name', 'title', 'company', 'brand', 'project_name', 'product_name'],
    description: ['description', 'about', 'company_description', 'overview'],
    about: ['about', 'company_about', 'detailed_description'],
    target_audience: ['audience', 'target_audience', 'customers', 'users'],
    tone: ['tone', 'voice', 'style', 'communication_style'],
    topic: ['topic', 'main_topic', 'subject'],
    keywords: ['keywords', 'key_terms', 'tags'],
    usps: ['usps', 'unique_selling_points', 'benefits', 'features'],
    vision: ['vision', 'long_term_goal'],
    mission: ['mission', 'purpose'],
    website: ['website', 'url', 'link'],
  };

  // Check which placeholders can be auto-filled from project
  const placeholderStatus = useMemo(() => {
    return allPlaceholders.map(ph => {
      const key = ph.key.toLowerCase().replace(/[{}]/g, '');
      let status = 'missing';
      let matchedField = null;

      for (const [fieldKey, patterns] of Object.entries(projectFieldMappings)) {
        if (patterns.some(pattern => key.includes(pattern.toLowerCase()))) {
          const fieldValue = project[fieldKey];
          if (fieldValue) {
            status = 'auto-fillable';
            matchedField = fieldKey;
            break;
          }
        }
      }

      return {
        ...ph,
        status,
        matchedField,
        resolvedValue: matchedField ? project[matchedField] : null
      };
    });
  }, [allPlaceholders, project]);

  const autoFillable = placeholderStatus.filter(p => p.status === 'auto-fillable');
  const missing = placeholderStatus.filter(p => p.status === 'missing');

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-600">{autoFillable.length}</p>
                <p className="text-xs text-gray-600">Auto-Fillable</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <AlertCircle className="w-8 h-8 text-amber-600" />
              <div className="text-right">
                <p className="text-2xl font-bold text-amber-600">{missing.length}</p>
                <p className="text-xs text-gray-600">Need Input</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <HelpCircle className="w-8 h-8 text-blue-600" />
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{allPlaceholders.length}</p>
                <p className="text-xs text-gray-600">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auto-Fillable Placeholders */}
      {autoFillable.length > 0 && (
        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Auto-Fillable from Project
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {autoFillable.map((ph, idx) => (
                <div key={idx} className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-medium text-sm text-gray-900">{ph.label}</p>
                    <Badge variant="outline" className="text-emerald-700 bg-emerald-100 text-xs">
                      {ph.matchedField}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{ph.description}</p>
                  <div className="p-2 bg-white rounded border border-emerald-200">
                    <p className="text-xs text-gray-700 line-clamp-2">
                      <strong>Value:</strong> {String(ph.resolvedValue).substring(0, 100)}
                      {String(ph.resolvedValue).length > 100 ? '...' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Missing Placeholders */}
      {missing.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Require Manual Input
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {missing.map((ph, idx) => (
                <TooltipProvider key={idx}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 cursor-help">
                        <div className="flex items-start justify-between">
                          <p className="font-medium text-sm text-gray-900">{ph.label}</p>
                          <Badge variant="outline" className="text-amber-700 bg-amber-100 text-xs">
                            {ph.type || 'text'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600">{ph.description}</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Add this value when generating content</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {allPlaceholders.length === 0 && (
        <Card className="border-dashed border-gray-300">
          <CardContent className="text-center py-8">
            <p className="text-sm text-gray-600">No templates with placeholders linked to this project</p>
            <p className="text-xs text-gray-500 mt-1">Link templates to see placeholder mapping</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}