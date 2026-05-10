import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Download, Upload, FileJson, AlertCircle } from "lucide-react";
import { apiClient } from "@/apis/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ContentExampleImportExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const examples = await apiClient.entities.ContentExample.list();
      
      const dataStr = JSON.stringify(examples, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `content-examples-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Exported ${examples.length} content examples`
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const examples = JSON.parse(text);

      if (!Array.isArray(examples)) {
        throw new Error("Invalid format: Expected an array of content examples");
      }

      let imported = 0;
      let updated = 0;
      let errors = 0;

      for (const example of examples) {
        try {
          const cleanData = { ...example };
          delete cleanData.id;
          delete cleanData.created_date;
          delete cleanData.updated_date;
          delete cleanData.created_by;

          await apiClient.entities.ContentExample.create(cleanData);
          imported++;
        } catch (error) {
          errors++;
          console.error('Failed to import example:', error);
        }
      }

      setImportResult({
        total: examples.length,
        imported,
        updated,
        errors
      });

      toast({
        title: "Import Complete",
        description: `Imported ${imported} content examples${errors > 0 ? `, ${errors} errors` : ''}`
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileJson className="w-5 h-5" />
          Content Example Import/Export
        </CardTitle>
        <CardDescription>
          Export content examples to JSON or import from file
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Section */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Export Content Examples</h3>
          <p className="text-sm text-gray-600">
            Download all content examples as a JSON file
          </p>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export All Content Examples'}
          </Button>
        </div>

        <div className="border-t pt-6 space-y-3">
          <h3 className="font-semibold text-sm">Import Content Examples</h3>
          <p className="text-sm text-gray-600">
            Upload a JSON file to import content examples
          </p>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              This will create new content example records from the JSON file
            </AlertDescription>
          </Alert>

          <Input
            type="file"
            accept=".json"
            onChange={handleImport}
            disabled={isImporting}
          />

          {isImporting && (
            <p className="text-sm text-gray-600">Importing content examples...</p>
          )}

          {importResult && (
            <Alert>
              <AlertDescription className="text-sm">
                <strong>Import Results:</strong>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>Total records: {importResult.total}</li>
                  <li className="text-green-600">Imported: {importResult.imported}</li>
                  {importResult.errors > 0 && (
                    <li className="text-red-600">Errors: {importResult.errors}</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
