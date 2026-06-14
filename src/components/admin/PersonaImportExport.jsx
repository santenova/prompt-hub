import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  Upload, 
  FileJson, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Users,
  Package,
  Database,
  FileText,
  X
} from "lucide-react";
import { client } from "@/apis/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

export default function PersonaImportExport({ currentUser }) {
  const [importFile, setImportFile] = useState(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const queryClient = useQueryClient();

  const { data: personas = [] } = useQuery({
    queryKey: ['personas'],
    queryFn: () => client.entities.Persona.list('-created_date'),
    initialData: [],
  });

  const createPersonaMutation = useMutation({
    mutationFn: (data) => client.entities.Persona.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['personas']);
    },
  });

  // Export all personas to JSON
  const handleExportPersonas = async () => {
    setIsExporting(true);
    try {
      const exportData = personas.map(persona => {
        // Remove system fields
        const { id, created_date, updated_date, created_by, ...cleanData } = persona;
        return {
          ...cleanData,
          exported_by: currentUser?.email,
          export_date: new Date().toISOString(),
          version: '1.0'
        };
      });

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `personas-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Export specific personas (filtered by category, tags, etc.)
  const handleExportFiltered = async (filter = {}) => {
    setIsExporting(true);
    try {
      let filteredPersonas = [...personas];
      
      if (filter.category) {
        filteredPersonas = filteredPersonas.filter(p => p.category === filter.category);
      }
      
      if (filter.is_custom !== undefined) {
        filteredPersonas = filteredPersonas.filter(p => p.is_custom === filter.is_custom);
      }

      const exportData = filteredPersonas.map(persona => {
        const { id, created_date, updated_date, created_by, ...cleanData } = persona;
        return {
          ...cleanData,
          exported_by: currentUser?.email,
          export_date: new Date().toISOString(),
          version: '1.0'
        };
      });

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      const filterName = filter.category || (filter.is_custom ? 'custom' : 'all');
      link.download = `personas-${filterName}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      setImportFile(file);
      setImportResults(null);
    } else {
      alert('Please select a valid JSON file');
    }
  };

  // Import personas from JSON
  const handleImportPersonas = async () => {
    if (!importFile) return;

    setIsImporting(true);
    setImportProgress(0);
    setImportResults(null);

    try {
      const fileContent = await importFile.text();
      const importedData = JSON.parse(fileContent);
      
      if (!Array.isArray(importedData)) {
        throw new Error('Invalid format: Expected an array of personas');
      }

      const results = {
        total: importedData.length,
        successful: 0,
        failed: 0,
        skipped: 0,
        errors: []
      };

      for (let i = 0; i < importedData.length; i++) {
        const persona = importedData[i];
        setImportProgress(((i + 1) / importedData.length) * 100);

        try {
          // Validate required fields
          if (!persona.name || !persona.description) {
            results.skipped++;
            results.errors.push({
              persona: persona.name || 'Unknown',
              error: 'Missing required fields (name or description)'
            });
            continue;
          }

          // Check if persona already exists
          const existing = personas.find(p => 
            p.name === persona.name && p.category === persona.category
          );

          if (existing) {
            results.skipped++;
            results.errors.push({
              persona: persona.name,
              error: 'Persona already exists'
            });
            continue;
          }

          // Clean data and create persona
          const { exported_by, export_date, version, ...cleanData } = persona;
          await createPersonaMutation.mutateAsync(cleanData);
          results.successful++;

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          results.failed++;
          results.errors.push({
            persona: persona.name || 'Unknown',
            error: error.message || 'Failed to import'
          });
        }
      }

      setImportResults(results);
    } catch (error) {
      setImportResults({
        total: 0,
        successful: 0,
        failed: 1,
        skipped: 0,
        errors: [{ persona: 'File', error: error.message }]
      });
    } finally {
      setIsImporting(false);
      setImportProgress(100);
    }
  };

  const resetImport = () => {
    setImportFile(null);
    setImportProgress(0);
    setImportResults(null);
  };

  const categories = [...new Set(personas.map(p => p.category))].sort();
  const customPersonasCount = personas.filter(p => p.is_custom).length;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="export" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="export">
            <Download className="w-4 h-4 mr-2" />
            Export
          </TabsTrigger>
          <TabsTrigger value="import">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </TabsTrigger>
        </TabsList>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-600" />
                Export Personas
              </CardTitle>
              <CardDescription>
                Download personas as JSON for backup or migration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-900">{personas.length}</p>
                      <p className="text-xs text-purple-700">Total Personas</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-900">{customPersonasCount}</p>
                      <p className="text-xs text-blue-700">Custom Personas</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <FileText className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-900">{categories.length}</p>
                      <p className="text-xs text-green-700">Categories</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Export Options */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold mb-3 block">Export Options</Label>
                  
                  {/* Export All */}
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4 hover:border-purple-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">All Personas</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Export all {personas.length} personas including system and custom personas
                          </p>
                        </div>
                        <Button
                          onClick={handleExportPersonas}
                          disabled={isExporting || personas.length === 0}
                          className="bg-gradient-to-r from-purple-600 to-indigo-600"
                        >
                          {isExporting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Exporting...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-2" />
                              Export All
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Export Custom Only */}
                    <div className="border rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">Custom Personas Only</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Export only custom personas ({customPersonasCount} personas)
                          </p>
                        </div>
                        <Button
                          onClick={() => handleExportFiltered({ is_custom: true })}
                          disabled={isExporting || customPersonasCount === 0}
                          variant="outline"
                          className="border-blue-300 hover:bg-blue-50"
                        >
                          {isExporting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4 mr-2" />
                          )}
                          Export Custom
                        </Button>
                      </div>
                    </div>

                    {/* Export by Category */}
                    {categories.length > 0 && (
                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Export by Category</h4>
                        <div className="flex flex-wrap gap-2">
                          {categories.map(category => {
                            const count = personas.filter(p => p.category === category).length;
                            return (
                              <Button
                                key={category}
                                onClick={() => handleExportFiltered({ category })}
                                disabled={isExporting}
                                variant="outline"
                                size="sm"
                                className="hover:bg-purple-50"
                              >
                                {category} ({count})
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <FileJson className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Export Format:</strong> Personas will be exported as a JSON file containing all persona data. 
                  System fields (ID, dates) are excluded for clean imports.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-600" />
                Import Personas
              </CardTitle>
              <CardDescription>
                Upload a JSON file to import personas in bulk
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="import-file" className="text-sm font-semibold mb-2 block">
                    Select JSON File
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="import-file"
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      disabled={isImporting}
                      className="flex-1"
                    />
                    {importFile && (
                      <Button
                        onClick={resetImport}
                        variant="ghost"
                        size="icon"
                        disabled={isImporting}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {importFile && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 border rounded-lg p-4"
                  >
                    <div className="flex items-center gap-3">
                      <FileJson className="w-8 h-8 text-purple-600" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{importFile.name}</p>
                        <p className="text-sm text-gray-600">
                          {(importFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      {!isImporting && !importResults && (
                        <Button
                          onClick={handleImportPersonas}
                          className="bg-gradient-to-r from-green-600 to-emerald-600"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Start Import
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Progress */}
                {isImporting && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Importing personas...</span>
                      <span className="font-semibold text-purple-600">{Math.round(importProgress)}%</span>
                    </div>
                    <Progress value={importProgress} className="h-2" />
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Please wait while we import your personas
                    </div>
                  </motion.div>
                )}

                {/* Results */}
                <AnimatePresence>
                  {importResults && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <Alert className={importResults.failed === 0 ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}>
                        {importResults.failed === 0 ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                        )}
                        <AlertDescription className={importResults.failed === 0 ? "text-green-800" : "text-yellow-800"}>
                          <strong>Import Complete:</strong> {importResults.successful} successful, 
                          {importResults.skipped > 0 && ` ${importResults.skipped} skipped,`}
                          {importResults.failed > 0 && ` ${importResults.failed} failed`}
                        </AlertDescription>
                      </Alert>

                      {/* Summary Cards */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-green-600">{importResults.successful}</p>
                          <p className="text-xs text-green-700">Imported</p>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-yellow-600">{importResults.skipped}</p>
                          <p className="text-xs text-yellow-700">Skipped</p>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-red-600">{importResults.failed}</p>
                          <p className="text-xs text-red-700">Failed</p>
                        </div>
                      </div>

                      {/* Errors */}
                      {importResults.errors.length > 0 && (
                        <div className="border rounded-lg p-4 bg-red-50 border-red-200 max-h-64 overflow-y-auto">
                          <h4 className="font-semibold text-red-900 mb-3">Import Issues:</h4>
                          <div className="space-y-2">
                            {importResults.errors.map((error, idx) => (
                              <div key={idx} className="text-sm bg-white p-2 rounded border border-red-200">
                                <span className="font-medium text-red-800">{error.persona}:</span>{' '}
                                <span className="text-red-600">{error.error}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={resetImport}
                          variant="outline"
                          className="flex-1"
                        >
                          Import Another File
                        </Button>
                        {importResults.successful > 0 && (
                          <Button
                            onClick={() => window.location.reload()}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            View Imported Personas
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <FileJson className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 space-y-2">
                  <p><strong>File Format:</strong> Upload a JSON file containing an array of persona objects.</p>
                  <p className="text-sm">Duplicate personas (same name and category) will be skipped automatically.</p>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
