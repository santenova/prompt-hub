import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Database, 
  Upload, 
  Trash2, 
  Search,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/apis/client";

export default function VectorRAG({ endpoint, selectedModel, onContextRetrieved }) {
  const [documents, setDocuments] = useState([]);
  const [isIndexing, setIsIndexing] = useState(false);
  const [newDocContent, setNewDocContent] = useState("");
  const [newDocTitle, setNewDocTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await apiClient.entities.VectorDocument.list('-created_date');
      setDocuments(Array.isArray(docs) ? docs : []);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const generateEmbedding = async (text) => {
    const { data } = await apiClient.functions.invoke('ollamaProxy', {
      endpoint,
      action: 'embeddings',
      model: selectedModel,
      messages: text,
    });
    return data.data?.[0]?.embedding;
  };

  const addDocument = async () => {
    if (!newDocContent.trim() || !endpoint || !selectedModel) {
      toast({
        title: "Missing Data",
        description: "Please provide content and ensure Ollama is configured",
        variant: "destructive"
      });
      return;
    }

    setIsIndexing(true);
    try {
      const embedding = await generateEmbedding(newDocContent);
      
      await apiClient.entities.VectorDocument.create({
        content: newDocContent,
        vector: embedding,
        metadata: {
          title: newDocTitle || `Document ${documents.length + 1}`,
          source: 'manual',
          model: selectedModel
        }
      });

      await loadDocuments();
      setNewDocContent("");
      setNewDocTitle("");
      
      toast({
        title: "Indexed",
        description: "Document added to vector store"
      });
    } catch (error) {
      toast({
        title: "Indexing Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsIndexing(false);
    }
  };

  const cosineSimilarity = (a, b) => {
    if (!a || !b || a.length !== b.length) return 0;
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magA * magB);
  };

  const searchDocuments = async () => {
    if (!searchQuery.trim() || !endpoint || !selectedModel) return;

    setIsSearching(true);
    try {
      const queryEmbedding = await generateEmbedding(searchQuery);
      
      const results = documents
        .map(doc => ({
          ...doc,
          similarity: cosineSimilarity(queryEmbedding, doc.vector)
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);

      setSearchResults(results);

      // Send top results as context if callback provided
      if (onContextRetrieved && results.length > 0) {
        const context = results
          .filter(r => r.similarity > 0.7)
          .map(r => r.content)
          .join('\n\n');
        
        if (context) {
          onContextRetrieved(context);
          toast({
            title: "Context Retrieved",
            description: `Found ${results.filter(r => r.similarity > 0.7).length} relevant documents`
          });
        }
      }
    } catch (error) {
      toast({
        title: "Search Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const deleteDocument = async (docId) => {
    try {
      await apiClient.entities.VectorDocument.delete(docId);
      await loadDocuments();
      toast({
        title: "Deleted",
        description: "Document removed from vector store"
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="h-full flex flex-col border-2 border-purple-200 bg-purple-50/50">
      <CardHeader className="flex-shrink-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Database className="w-4 h-4 text-purple-600" />
          Vector RAG
        </CardTitle>
        <CardDescription className="text-xs">
          Knowledge base for AI conversations
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-3">
        <Tabs defaultValue="search" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-3">
            <TabsTrigger value="search" className="text-xs">Search</TabsTrigger>
            <TabsTrigger value="manage" className="text-xs">Manage</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="flex-1 overflow-hidden mt-0">
            <div className="space-y-3 h-full flex flex-col">
              <div className="flex gap-2">
                <Input
                  placeholder="Search knowledge base..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchDocuments()}
                  className="h-9"
                />
                <Button
                  onClick={searchDocuments}
                  disabled={!searchQuery.trim() || isSearching}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <ScrollArea className="flex-1">
                {searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map((result) => (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-3 bg-white rounded-lg border"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-sm">
                            {result.metadata?.title || 'Untitled'}
                          </p>
                          <Badge className={`text-xs ${
                            result.similarity > 0.8 ? 'bg-green-100 text-green-700' :
                            result.similarity > 0.6 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {Math.round(result.similarity * 100)}%
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-3">
                          {result.content}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Search to find relevant context</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="manage" className="flex-1 overflow-hidden mt-0">
            <div className="space-y-3 h-full flex flex-col">
              <div className="space-y-2">
                <Input
                  placeholder="Document title"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="h-9"
                />
                <Textarea
                  placeholder="Add knowledge to your AI's context..."
                  value={newDocContent}
                  onChange={(e) => setNewDocContent(e.target.value)}
                  className="h-24 resize-none"
                />
                <Button
                  onClick={addDocument}
                  disabled={!newDocContent.trim() || isIndexing}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isIndexing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Indexing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Add to Knowledge Base
                    </>
                  )}
                </Button>
              </div>

              <ScrollArea className="flex-1">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Documents ({documents.length})
                    </p>
                  </div>
                  
                  {documents.length > 0 ? (
                    documents.map((doc) => (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-3 bg-white rounded-lg border"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-sm">
                            {doc.metadata?.title || 'Untitled'}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDocument(doc.id)}
                            className="h-6 w-6 p-0 text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {doc.content}
                        </p>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No documents yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
