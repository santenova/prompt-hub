import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, FileText, History, GraduationCap, Brain } from 'lucide-react';
import { apiClient } from '@/apis/client';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import SourceMaterialSelector from '../components/notes/SourceMaterialSelector';
import DocumentComposer from '../components/notes/DocumentComposer';
import DocumentExporter from '../components/notes/DocumentExporter';
import DocumentAnalyzer from '../components/notes/DocumentAnalyzer';

export default function NotesGenerator() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedSources, setSelectedSources] = useState({ 
    content: [], 
    tests: [], 
    voiceChats: [], 
    documentExports: [], 
    bookmarks: [] 
  });
  const [documentSections, setDocumentSections] = useState([]);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [finalDocument, setFinalDocument] = useState({ 
    title: '', 
    content: '', 
    sections: [], 
    ai_enhanced: false,
    sources: { content: [], tests: [] }
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await apiClient.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  const loadSourceContent = async () => {
    setIsGenerating(true);
    try {
      const contentItems = await Promise.all(
        selectedSources.content.map(id => apiClient.entities.ContentHistory.filter({ id }))
      );
      const testItems = await Promise.all(
        selectedSources.tests.map(id => apiClient.entities.TestHistory.filter({ id }))
      );
      const voiceItems = await Promise.all(
        selectedSources.voiceChats.map(id => apiClient.entities.VoiceChat.filter({ id }))
      );
      const docItems = await Promise.all(
        selectedSources.documentExports.map(id => apiClient.entities.DocumentExport.filter({ id }))
      );
      const bookmarkItems = await Promise.all(
        selectedSources.bookmarks.map(id => apiClient.entities.Bookmark.filter({ id }))
      );

      const newSections = [];

      contentItems.flat().forEach((item, idx) => {
        if (item) {
          const content = item.generated_content;
          let textContent = '';
          
          if (Array.isArray(content)) {
            textContent = content.map((v, i) => 
              `### Variation ${i + 1}: ${v.title || ''}\n\n${v.content || ''}`
            ).join('\n\n');
          } else if (typeof content === 'string') {
            textContent = content;
          } else {
            textContent = JSON.stringify(content, null, 2);
          }

          newSections.push({
            id: `content-${idx}`,
            heading: item.topic || `Content ${idx + 1}`,
            content: textContent,
            source_type: 'content',
            source_id: item.id
          });
        }
      });

      testItems.flat().forEach((item, idx) => {
        if (item) {
          newSections.push({
            id: `test-${idx}`,
            heading: item.item_name || `Test Result ${idx + 1}`,
            content: `**User Message:** ${item.user_message}\n\n**Response:** ${item.response}\n\n**Model:** ${item.model}`,
            source_type: 'test',
            source_id: item.id
          });
        }
      });

      voiceItems.flat().forEach((item, idx) => {
        if (item) {
          const transcript = item.messages?.map(m => 
            `**${m.role === 'user' ? 'User' : 'AI'}:** ${m.content}`
          ).join('\n\n') || '';
          
          newSections.push({
            id: `voice-${idx}`,
            heading: item.name || `Voice Chat ${idx + 1}`,
            content: item.summary ? `${item.summary}\n\n---\n\n${transcript}` : transcript,
            source_type: 'voice',
            source_id: item.id
          });
        }
      });

      docItems.flat().forEach((item, idx) => {
        if (item) {
          newSections.push({
            id: `doc-${idx}`,
            heading: item.title || `Document ${idx + 1}`,
            content: item.content,
            source_type: 'document',
            source_id: item.id
          });
        }
      });

      bookmarkItems.flat().forEach((item, idx) => {
        if (item) {
          newSections.push({
            id: `bookmark-${idx}`,
            heading: item.item_title || `Bookmark ${idx + 1}`,
            content: `**Type:** ${item.item_type}\n\n${item.notes || 'No notes'}\n\n**Collection:** ${item.collection || 'Uncategorized'}`,
            source_type: 'bookmark',
            source_id: item.id
          });
        }
      });

      setDocumentSections(newSections);
      toast({
        title: "Sources Loaded",
        description: `Loaded ${newSections.length} sections from sources`
      });
    } catch (error) {
      toast({
        title: "Load Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const enhanceDocument = async (documentContent, settings) => {
    setIsEnhancing(true);
    try {
      const prompt = `You are an expert educational content enhancer. Enhance this document according to these settings:

${settings.improveClarity ? '- Improve clarity and readability' : ''}
${settings.addExamples ? '- Add practical examples and illustrations' : ''}
${settings.expandExplanations ? '- Expand explanations with more detail' : ''}
${settings.addSummaries ? '- Add section summaries and key takeaways' : ''}

Enhancement Level: ${settings.enhancementLevel}% (higher = more elaboration)

DOCUMENT TO ENHANCE:
${documentContent}

Return the enhanced document in markdown format with clear headings, proper structure, and professional formatting.`;

      const enhanced = await apiClient.integrations.Core.InvokeLLM({ prompt });
      
      // Extract title from content if not set
      const titleMatch = enhanced.match(/^#\s+(.+)$/m);
      const docTitle = titleMatch ? titleMatch[1] : 'Enhanced Document';
      
      const enhancedDoc = {
        title: docTitle,
        content: enhanced,
        sections: documentSections,
        ai_enhanced: true,
        sources: selectedSources,
        enhancement_log: [
          ...(finalDocument.enhancement_log || []),
          {
            timestamp: new Date().toISOString(),
            action: 'ai_enhancement',
            details: `Enhanced with level ${settings.enhancementLevel}%`
          }
        ]
      };

      setFinalDocument(enhancedDoc);
      
      toast({
        title: "Enhancement Complete",
        description: "Document enhanced with AI"
      });
    } catch (error) {
      toast({
        title: "Enhancement Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center justify-center gap-3">
            <GraduationCap className="w-10 h-10 text-indigo-600" />
            Smart Notes Generator
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Chain content from your history and tests into comprehensive, AI-enhanced documents
          </p>
        </motion.div>

        {/* Main Tabs */}
        <Tabs defaultValue="sources" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sources">
              <History className="w-4 h-4 mr-2" />
              Sources
            </TabsTrigger>
            <TabsTrigger value="composer">
              <FileText className="w-4 h-4 mr-2" />
              Compose
            </TabsTrigger>
            <TabsTrigger value="analyze">
              <Brain className="w-4 h-4 mr-2" />
              Analyze
            </TabsTrigger>
            <TabsTrigger value="export">
              <Sparkles className="w-4 h-4 mr-2" />
              Export
            </TabsTrigger>
          </TabsList>

          {/* Source Selection */}
          <TabsContent value="sources" className="mt-6 space-y-4">
            <SourceMaterialSelector 
              onSelectionChange={setSelectedSources}
            />
            <div className="flex justify-end">
              <Button
                onClick={loadSourceContent}
                disabled={isGenerating || (
                  selectedSources.content.length === 0 && 
                  selectedSources.tests.length === 0 &&
                  selectedSources.voiceChats.length === 0 &&
                  selectedSources.documentExports.length === 0 &&
                  selectedSources.bookmarks.length === 0
                )}
                className="bg-gradient-to-r from-purple-600 to-indigo-600"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load Selected Sources
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Document Composer */}
          <TabsContent value="composer" className="mt-6">
            <DocumentComposer
              sections={documentSections}
              onSectionsChange={setDocumentSections}
              onEnhance={enhanceDocument}
              isEnhancing={isEnhancing}
            />
          </TabsContent>

          {/* Document Analyzer */}
          <TabsContent value="analyze" className="mt-6">
            <DocumentAnalyzer
              document={finalDocument}
              onAnalysisComplete={(analysis) => {
                if (analysis.keywords || analysis.tags) {
                  setFinalDocument(prev => ({
                    ...prev,
                    keywords: analysis.keywords,
                    tags: analysis.tags
                  }));
                }
              }}
            />
          </TabsContent>

          {/* Export */}
          <TabsContent value="export" className="mt-6">
            <DocumentExporter
              document={finalDocument}
              sources={selectedSources}
              onExportComplete={(record) => {
                toast({
                  title: "Success",
                  description: "Document saved and ready for download"
                });
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
