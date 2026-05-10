import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, X, AlertCircle, Zap } from "lucide-react";

export default function PlaceholderSubstitutionPanel({ placeholders, projectData, placeholderValues }) {
  const [aiEnhancedMappings, setAiEnhancedMappings] = React.useState({});

  // Normalize placeholder keys: lowercase, remove braces, spaces, slashes, underscores
  const normalizeKey = (key) => {
    return key.toLowerCase()
      .replace(/[{}\s\/\-_]/g, '')
      .trim();
  };

  // Define common placeholder patterns that can be auto-filled
  const getCommonMappings = () => {
    const mappings = {};
    
    // Company/Project/Brand/Business name variations
    const nameVariations = [
      'name', 'topic', 'company', 'companyname', 'project', 'projectname',
      'brand', 'brandname', 'organization', 'organizationname', 'business',
      'businessname', 'productservicename', 'productname', 'servicename',
      'product', 'service', 'productservice', 'item', 'item1'
    ];
    nameVariations.forEach(key => {
      mappings[key] = projectData?.name;
    });
    
    // About/Description variations
    const aboutVariations = [
      'about', 'description', 'companyabout', 'projectabout',
      'companydescription', 'projectdescription', 'overview', 'summary'
    ];
    aboutVariations.forEach(key => {
      mappings[key] = projectData?.about;
    });
    
    // Target audience variations
    const audienceVariations = [
      'targetaudience', 'audience', 'customers', 'clients', 'users'
    ];
    audienceVariations.forEach(key => {
      mappings[key] = projectData?.target_audience;
    });
    
    // Tone variations
    const toneVariations = ['tone', 'voice', 'style', 'mood'];
    toneVariations.forEach(key => {
      mappings[key] = projectData?.tone;
    });
    
    // USPs/Keywords variations
    const uspsVariations = [
      'usps', 'keyfeatures', 'features', 'benefits', 'advantages',
      'sellingpoints', 'valueprops', 'valuepropositions'
    ];
    uspsVariations.forEach(key => {
      mappings[key] = Array.isArray(projectData?.usps) ? projectData.usps.join(', ') : projectData?.usps;
    });
    
    const keywordsVariations = ['keywords', 'tags', 'topics'];
    keywordsVariations.forEach(key => {
      mappings[key] = Array.isArray(projectData?.keywords) ? projectData.keywords.join(', ') : projectData?.keywords;
    });
    
    // Vision/Mission variations
    mappings['vision'] = projectData?.vision;
    mappings['mission'] = projectData?.mission;
    mappings['goal'] = projectData?.vision;
    mappings['purpose'] = projectData?.mission;
    
    // Topic/Category/Industry variations
    const industryVariations = ['topic', 'category', 'industry', 'sector', 'field', 'niche'];
    industryVariations.forEach(key => {
      mappings[key] = projectData?.industry || projectData?.category;
    });
    
    // Website variations
    const websiteVariations = ['website', 'url', 'link', 'site'];
    websiteVariations.forEach(key => {
      mappings[key] = projectData?.website;
    });
    
    return mappings;
  };

  const commonMappings = getCommonMappings();

  // Analyze each placeholder
  const analyzePlaceholder = (ph) => {
    const normalizedKey = normalizeKey(ph.key);
    
    // Check if manually filled
    if (placeholderValues[ph.key]) {
      return {
        status: 'manual',
        value: placeholderValues[ph.key],
        source: 'User Input'
      };
    }
    
    // Check if can be auto-filled from common mappings
    if (commonMappings[normalizedKey] && projectData) {
      return {
        status: 'auto',
        value: commonMappings[normalizedKey],
        source: 'Project Data'
      };
    }
    
    // Check AI-enhanced mappings
    if (aiEnhancedMappings[normalizedKey] && projectData) {
      return {
        status: 'auto',
        value: aiEnhancedMappings[normalizedKey],
        source: 'AI Matched'
      };
    }
    
    // Cannot be substituted
    return {
      status: 'missing',
      value: null,
      source: null
    };
  };

  const placeholderAnalysis = placeholders.map(ph => ({
    ...ph,
    analysis: analyzePlaceholder(ph)
  }));

  const canSubstitute = placeholderAnalysis.filter(p => p.analysis.status !== 'missing');
  const cannotSubstitute = placeholderAnalysis.filter(p => p.analysis.status === 'missing');
  const autoFilled = placeholderAnalysis.filter(p => p.analysis.status === 'auto');

  return (
    <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="w-5 h-5 text-amber-600" />
          Placeholder Substitution Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <div className="text-2xl font-bold text-green-600">{canSubstitute.length}</div>
            <div className="text-xs text-gray-600">Can Substitute</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">{cannotSubstitute.length}</div>
            <div className="text-xs text-gray-600">Need Input</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{autoFilled.length}</div>
            <div className="text-xs text-gray-600">Auto-Filled</div>
          </div>
        </div>

        {/* Auto-fill Alert */}
        {autoFilled.length > 0 && (
          <Alert className="bg-blue-50 border-blue-200">
            <Zap className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              {autoFilled.length} placeholder{autoFilled.length > 1 ? 's' : ''} will be automatically filled from project data
            </AlertDescription>
          </Alert>
        )}

        {/* Placeholders List */}
        <div className="space-y-3">
          {/* Can Substitute */}
          {canSubstitute.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-green-700 flex items-center gap-2">
                <Check className="w-4 h-4" />
                Ready for Substitution ({canSubstitute.length})
              </h4>
              <div className="space-y-2">
                {canSubstitute.map(ph => (
                  <div key={ph.key} className="bg-white p-3 rounded-lg border border-green-200">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-purple-600">
                            {ph.key}
                          </code>
                          <Badge variant="outline" className={
                            ph.analysis.status === 'auto' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
                          }>
                            {ph.analysis.source}
                          </Badge>
                          {ph.required && (
                            <Badge variant="outline" className="text-red-600 border-red-300">Required</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mb-1">{ph.label}</p>
                         <div className="text-sm text-gray-800 font-medium truncate">
                           → {String(ph.analysis.value || '').substring(0, 50)}{String(ph.analysis.value || '').length > 50 ? '...' : ''}
                         </div>
                      </div>
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cannot Substitute */}
          {cannotSubstitute.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-orange-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Needs Manual Input ({cannotSubstitute.length})
              </h4>
              <div className="space-y-2">
                {cannotSubstitute.map(ph => (
                  <div key={ph.key} className="bg-white p-3 rounded-lg border border-orange-200">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-purple-600">
                            {ph.key}
                          </code>
                          <Badge variant="outline" className="bg-orange-50 text-orange-700">
                            No Data
                          </Badge>
                          {ph.required && (
                            <Badge variant="outline" className="text-red-600 border-red-300">Required</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-600">{ph.label}</p>
                        {ph.description && (
                          <p className="text-xs text-gray-500 mt-1">{ph.description}</p>
                        )}
                      </div>
                      <X className="w-5 h-5 text-orange-600 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {placeholders.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No placeholders in selected templates</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}