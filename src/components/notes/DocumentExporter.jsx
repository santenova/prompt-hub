import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  FileText, 
  FileCode, 
  File,
  Loader2,
  CheckCircle2,
  Settings,
  Database
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/apis/client";
import { useToast } from "@/components/ui/use-toast";

const formats = [
  { value: 'pdf', label: 'PDF', icon: FileText, color: 'text-red-600', customizable: true },
  { value: 'docx', label: 'Word', icon: File, color: 'text-blue-600', customizable: true },
  { value: 'markdown', label: 'Markdown', icon: FileCode, color: 'text-purple-600', customizable: false },
  { value: 'html', label: 'HTML', icon: FileCode, color: 'text-orange-600', customizable: false },
  { value: 'txt', label: 'Plain Text', icon: FileText, color: 'text-gray-600', customizable: false },
  { value: 'rtf', label: 'Rich Text', icon: File, color: 'text-green-600', customizable: false },
  { value: 'gdocs', label: 'Google Docs', icon: Database, color: 'text-blue-500', customizable: false }
];

export default function DocumentExporter({ 
  document, 
  sources,
  onExportComplete 
}) {
  const { toast } = useToast();
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [exportedUrl, setExportedUrl] = useState(null);
  const [tags, setTags] = useState('');
  
  // Customization options
  const [includeEnhancementLog, setIncludeEnhancementLog] = useState(false);
  const [pageOrientation, setPageOrientation] = useState('portrait');
  const [marginSize, setMarginSize] = useState('normal');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState('11');
  const [includeHeader, setIncludeHeader] = useState(false);
  const [includeFooter, setIncludeFooter] = useState(true);
  const [headerText, setHeaderText] = useState('');
  const [footerText, setFooterText] = useState('Page {page} of {total}');

  const prepareContent = () => {
    let content = document.content;
    
    // Add enhancement log if requested
    if (includeEnhancementLog && document.enhancement_log?.length > 0) {
      content += '\n\n---\n\n## AI Enhancement Log\n\n';
      document.enhancement_log.forEach((log, idx) => {
        content += `${idx + 1}. **${log.action}** (${new Date(log.timestamp).toLocaleString()})\n   ${log.details}\n`;
      });
    }

    return content;
  };

  const handleExport = async () => {
    if (!document.title || !document.content) return;

    setIsExporting(true);
    try {
      const finalContent = prepareContent();
      
      // Save to database with customization options
      const exportRecord = await apiClient.entities.DocumentExport.create({
        title: document.title,
        content: finalContent,
        format: selectedFormat,
        sections: document.sections,
        sources: sources,
        ai_enhanced: document.ai_enhanced || false,
        enhancement_log: includeEnhancementLog ? document.enhancement_log : [],
        tags: tags.split(',').map(t => t.trim()).filter(Boolean)
      });

      // Generate download based on format
      let mimeType = 'text/plain';
      let fileExtension = selectedFormat;

      switch (selectedFormat) {
        case 'pdf':
        case 'docx':
          mimeType = 'application/octet-stream';
          break;
        case 'html':
          mimeType = 'text/html';
          break;
        case 'markdown':
          mimeType = 'text/markdown';
          fileExtension = 'md';
          break;
        case 'rtf':
          mimeType = 'application/rtf';
          break;
        case 'gdocs':
          toast({
            title: "Google Docs Export",
            description: "Please use Google Drive integration to export to Google Docs"
          });
          setIsExporting(false);
          return;
      }

      const blob = new Blob([finalContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      setExportedUrl(url);

      toast({
        title: "Export Complete",
        description: `Document exported as ${selectedFormat.toUpperCase()}`
      });

      if (onExportComplete) onExportComplete(exportRecord);
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

  const downloadFile = () => {
    if (!exportedUrl) return;
    const a = document.createElement('a');
    a.href = exportedUrl;
    const ext = selectedFormat === 'markdown' ? 'md' : selectedFormat;
    a.download = `${document.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const selectedFormatConfig = formats.find(f => f.value === selectedFormat);

  return (
    <Card className="border-2 border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5 text-green-600" />
          Export Document
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="format" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="format">Format</TabsTrigger>
            <TabsTrigger value="options">
              <Settings className="w-4 h-4 mr-2" />
              Options
            </TabsTrigger>
          </TabsList>

          <TabsContent value="format" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Export Format</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {formats.map((format) => {
                  const Icon = format.icon;
                  return (
                    <Button
                      key={format.value}
                      variant={selectedFormat === format.value ? "default" : "outline"}
                      className={`w-full ${selectedFormat === format.value ? 'bg-green-600' : ''}`}
                      onClick={() => setSelectedFormat(format.value)}
                    >
                      <Icon className={`w-4 h-4 mr-2 ${format.color}`} />
                      {format.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input
                placeholder="notes, ai-generated, study-material"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <div>
                <Label className="text-sm font-semibold">Include AI Enhancement Log</Label>
                <p className="text-xs text-gray-600 mt-1">Add enhancement history to export</p>
              </div>
              <Switch
                checked={includeEnhancementLog}
                onCheckedChange={setIncludeEnhancementLog}
              />
            </div>
          </TabsContent>

          <TabsContent value="options" className="space-y-4 mt-4">
            {selectedFormatConfig?.customizable ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Page Orientation</Label>
                    <Select value={pageOrientation} onValueChange={setPageOrientation}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Portrait</SelectItem>
                        <SelectItem value="landscape">Landscape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Margins</Label>
                    <Select value={marginSize} onValueChange={setMarginSize}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="narrow">Narrow (0.5")</SelectItem>
                        <SelectItem value="normal">Normal (1")</SelectItem>
                        <SelectItem value="wide">Wide (1.5")</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Font Family</Label>
                    <Select value={fontFamily} onValueChange={setFontFamily}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        <SelectItem value="Calibri">Calibri</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                        <SelectItem value="Courier New">Courier New</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Font Size</Label>
                    <Select value={fontSize} onValueChange={setFontSize}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="9">9pt</SelectItem>
                        <SelectItem value="10">10pt</SelectItem>
                        <SelectItem value="11">11pt</SelectItem>
                        <SelectItem value="12">12pt</SelectItem>
                        <SelectItem value="14">14pt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <Label>Include Header</Label>
                    <Switch checked={includeHeader} onCheckedChange={setIncludeHeader} />
                  </div>
                  {includeHeader && (
                    <Input
                      placeholder="Header text (e.g., {title}, {date})"
                      value={headerText}
                      onChange={(e) => setHeaderText(e.target.value)}
                    />
                  )}

                  <div className="flex items-center justify-between">
                    <Label>Include Footer</Label>
                    <Switch checked={includeFooter} onCheckedChange={setIncludeFooter} />
                  </div>
                  {includeFooter && (
                    <Input
                      placeholder="Footer text (e.g., Page {page} of {total})"
                      value={footerText}
                      onChange={(e) => setFooterText(e.target.value)}
                    />
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Settings className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No customization options for {selectedFormatConfig?.label}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex gap-2">
          <Button
            onClick={handleExport}
            disabled={isExporting || !document.title || !document.content}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : exportedUrl ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Export Complete
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export Document
              </>
            )}
          </Button>
          {exportedUrl && (
            <Button
              onClick={downloadFile}
              variant="outline"
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>

        {document.sources && (
          <div className="pt-3 border-t space-y-2">
            <Label className="text-xs font-semibold">Sources Included</Label>
            <div className="flex flex-wrap gap-1">
              {document.sources.content?.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {document.sources.content.length} content items
                </Badge>
              )}
              {document.sources.tests?.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {document.sources.tests.length} test results
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
