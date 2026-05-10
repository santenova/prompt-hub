import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Upload, Loader2, AlertCircle, CheckCircle2, FileJson, Sparkles } from "lucide-react";
import { apiClient } from "@/apis/client";
import { useToast } from "@/components/ui/use-toast";

export default function ProjectImporter({ open, onClose, onProjectCreated }) {
  const { toast } = useToast();
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [jsonFile, setJsonFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [step, setStep] = useState('input'); // 'input', 'preview', 'creating'

  const handleAnalyzeWebsite = async () => {
    if (!websiteUrl) {
      toast({
        title: "URL Required",
        description: "Please enter a website URL",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      // Use InvokeLLM with web search to analyze the website
      const result = await apiClient.integrations.Core.InvokeLLM({
        prompt: `Analyze this website: ${websiteUrl}

Extract comprehensive information to create a project profile. Be thorough and accurate.

Return ONLY this JSON structure:
{
  "name": "Company/Project name",
  "about": "Detailed description of what they do",
  "category": "Industry category",
  "industry": "Specific industry",
  "target_audience": "Who they serve",
  "tone": "Communication tone (Professional/Friendly/Formal/Casual)",
  "vision": "Company vision statement",
  "mission": "Company mission",
  "usps": ["unique selling point 1", "unique selling point 2", "unique selling point 3"],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "website": "${websiteUrl}",
  "confidence": "high/medium/low"
}`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            about: { type: "string" },
            category: { type: "string" },
            industry: { type: "string" },
            target_audience: { type: "string" },
            tone: { type: "string" },
            vision: { type: "string" },
            mission: { type: "string" },
            usps: { type: "array", items: { type: "string" } },
            keywords: { type: "array", items: { type: "string" } },
            website: { type: "string" },
            confidence: { type: "string" }
          }
        }
      });

      setExtractedData(result);
      setStep('preview');
      toast({
        title: "Website Analyzed",
        description: "Review the extracted information before creating the project"
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast({
        title: "Invalid File",
        description: "Please upload a JSON file",
        variant: "destructive"
      });
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      setJsonFile(file);
      setExtractedData(data);
      setStep('preview');
      toast({
        title: "JSON Loaded",
        description: "Review the data before creating the project"
      });
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Could not parse the JSON file",
        variant: "destructive"
      });
    }
  };

  const handleCombineBoth = async () => {
    if (!websiteUrl && !jsonFile) {
      toast({
        title: "Input Required",
        description: "Provide a URL and/or JSON file",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      let webData = null;
      let fileData = null;

      // Analyze website if URL provided
      if (websiteUrl) {
        const result = await apiClient.integrations.Core.InvokeLLM({
          prompt: `Analyze this website: ${websiteUrl}

Extract comprehensive information to create a project profile.

Return ONLY this JSON structure:
{
  "name": "Company/Project name",
  "about": "Detailed description",
  "category": "Industry category",
  "industry": "Specific industry",
  "target_audience": "Who they serve",
  "tone": "Communication tone",
  "vision": "Vision statement",
  "mission": "Mission statement",
  "usps": ["usp1", "usp2", "usp3"],
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "website": "${websiteUrl}"
}`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              about: { type: "string" },
              category: { type: "string" },
              industry: { type: "string" },
              target_audience: { type: "string" },
              tone: { type: "string" },
              vision: { type: "string" },
              mission: { type: "string" },
              usps: { type: "array" },
              keywords: { type: "array" },
              website: { type: "string" }
            }
          }
        });
        webData = result;
      }

      // Load JSON if file provided
      if (jsonFile) {
        const text = await jsonFile.text();
        fileData = JSON.parse(text);
      }

      // Merge data - JSON file takes precedence
      const merged = {
        ...webData,
        ...fileData
      };

      setExtractedData(merged);
      setStep('preview');
      toast({
        title: "Data Combined",
        description: "Review the merged information"
      });
    } catch (error) {
      toast({
        title: "Processing Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateProject = async () => {
    if (!extractedData) return;

    setStep('creating');
    try {
      const newProject = await apiClient.entities.Project.create({
        name: extractedData.name || 'Unnamed Project',
        about: extractedData.about || '',
        category: extractedData.category || 'Other',
        industry: extractedData.industry || '',
        target_audience: extractedData.target_audience || '',
        tone: extractedData.tone || 'Professional',
        vision: extractedData.vision || '',
        mission: extractedData.mission || '',
        usps: extractedData.usps || [],
        keywords: extractedData.keywords || [],
        website: extractedData.website || websiteUrl,
        imported_from: websiteUrl ? 'url_analysis' : 'json_file',
        import_metadata: {
          imported_at: new Date().toISOString(),
          source_url: websiteUrl || null,
          source_file: jsonFile?.name || null
        }
      });

      toast({
        title: "Project Created",
        description: `Successfully imported ${newProject.name}`
      });

      onProjectCreated?.(newProject);
      handleClose();
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive"
      });
      setStep('preview');
    }
  };

  const handleClose = () => {
    setWebsiteUrl('');
    setJsonFile(null);
    setExtractedData(null);
    setStep('input');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Import Project
          </DialogTitle>
          <DialogDescription>
            Analyze a website URL and/or upload a JSON file to create a project
          </DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-6 py-4">
            {/* Website URL Input */}
            <Card className="border-2 border-purple-200">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold">Website Analysis</h3>
                  <Badge variant="outline">AI Powered</Badge>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website-url">Website URL</Label>
                  <Input
                    id="website-url"
                    type="url"
                    placeholder="https://example.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    AI will analyze the website to extract company information
                  </p>
                </div>
                <Button
                  onClick={handleAnalyzeWebsite}
                  disabled={isAnalyzing || !websiteUrl}
                  className="w-full"
                  variant="outline"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4 mr-2" />
                      Analyze Website
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* JSON File Upload */}
            <Card className="border-2 border-blue-200">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <FileJson className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold">JSON Import</h3>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="json-file">Upload JSON File</Label>
                  <Input
                    id="json-file"
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                  />
                  {jsonFile && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      {jsonFile.name}
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Upload a JSON file with project data
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Combine Both */}
            {(websiteUrl || jsonFile) && (
              <Card className="border-2 border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <Button
                    onClick={handleCombineBoth}
                    disabled={isAnalyzing}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Combine Both Sources
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-600 mt-2 text-center">
                    Merge website analysis with JSON data (JSON takes priority)
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {step === 'preview' && extractedData && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <p className="text-sm text-blue-900">
                Review the extracted data. You can edit it after creating the project.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-500">Name</Label>
                <p className="font-semibold">{extractedData.name || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Category</Label>
                <p className="font-semibold">{extractedData.category || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Industry</Label>
                <p className="font-semibold">{extractedData.industry || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Tone</Label>
                <p className="font-semibold">{extractedData.tone || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs text-gray-500">About</Label>
                <p className="text-sm">{extractedData.about || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs text-gray-500">Target Audience</Label>
                <p className="text-sm">{extractedData.target_audience || 'N/A'}</p>
              </div>
              {extractedData.vision && (
                <div className="md:col-span-2">
                  <Label className="text-xs text-gray-500">Vision</Label>
                  <p className="text-sm">{extractedData.vision}</p>
                </div>
              )}
              {extractedData.mission && (
                <div className="md:col-span-2">
                  <Label className="text-xs text-gray-500">Mission</Label>
                  <p className="text-sm">{extractedData.mission}</p>
                </div>
              )}
              {extractedData.usps?.length > 0 && (
                <div className="md:col-span-2">
                  <Label className="text-xs text-gray-500">USPs</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {extractedData.usps.map((usp, idx) => (
                      <Badge key={idx} variant="outline">{usp}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {extractedData.keywords?.length > 0 && (
                <div className="md:col-span-2">
                  <Label className="text-xs text-gray-500">Keywords</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {extractedData.keywords.map((kw, idx) => (
                      <Badge key={idx} className="bg-purple-600">{kw}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'creating' && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
              <p className="text-lg font-semibold">Creating Project...</p>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'input' && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('input')}>
                Back
              </Button>
              <Button onClick={handleCreateProject} className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
