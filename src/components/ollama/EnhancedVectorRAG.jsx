import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  Database, 
  Upload, 
  Trash2, 
  Search,
  FileText,
  Loader2,
  Settings,
  Plus,
  Folder,
  File,
  Edit2,
  Save,
  X
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/apis/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function EnhancedVectorRAG({ endpoint, selectedModel, onContextRetrieved }) {
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [selectedKB, setSelectedKB] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isIndexing, setIsIndexing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [newKBName, setNewKBName] = useState("");
  const [showNewKB, setShowNewKB] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [processingFile, setProcessingFile] = useState(false);
  const [editingSettings, setEditingSettings] = useState(false);
  const [kbSettings, setKbSettings] = useState({
    chunk_size: 500,
    chunk_overlap: 50,
    similarity_threshold: 0.7,
    max_results: 5
  });
  const { toast } = useToast();

  useEffect(() => {
    loadKnowledgeBases();
  }, []);

  useEffect(() => {
    if (selectedKB) {
      loadDocuments();
      setKbSettings(selectedKB.settings || {
        chunk_size: 500,
        chunk_overlap: 50,
        similarity_threshold: 0.7,
        max_results: 5
      });
    }
  }, [selectedKB]);

  const loadKnowledgeBases = async () => {
    try {
      const kbs = await apiClient.entities.KnowledgeBase.list('-created_date');
      setKnowledgeBases(Array.isArray(kbs) ? kbs : []);
      if (kbs.length > 0 && !selectedKB) {
        setSelectedKB(kbs[0]);
      }
    } catch (error) {
      console.error('Failed to load knowledge bases:', error);
    }
  };

  const loadDocuments = async () => {
    if (!selectedKB) return;
    try {
      const docs = await apiClient.entities.VectorDocument.filter({ 
        knowledge_base_id: selectedKB.id 
      }, '-created_date');
      setDocuments(Array.isArray(docs) ? docs : []);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const createKnowledgeBase = async () => {
    if (!newKBName.trim()) return;
    
    try {
      const newKB = await apiClient.entities.KnowledgeBase.create({
        name: newKBName.trim(),
        description: "",
        settings: kbSettings
      });
      
      await loadKnowledgeBases();
      setSelectedKB(newKB);
      setNewKBName("");
      setShowNewKB(false);
      
      toast({
        title: "Knowledge Base Created",
        description: `${newKBName} is ready to use`
      });
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !selectedKB || !endpoint || !selectedModel) {
      toast({
        title: "Missing Requirements",
        description: "Select a knowledge base and ensure Ollama is configured",
        variant: "destructive"
      });
      return;
    }

    const fileType = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'txt'].includes(fileType)) {
      toast({
        title: "Unsupported Format",
        description: "Please upload PDF, DOCX, or TXT files",
        variant: "destructive"
      });
      return;
    }

    setUploadingFile(true);
    
    try {
      // Upload to MinIO
      const formData = new FormData();
      formData.append('file', file);
      formData.append('knowledge_base_id', selectedKB.id);

      const uploadResponse = await apiClient.functions.invoke('uploadToMinIO', formData);
      
      if (!uploadResponse.data.success) {
        throw new Error('Upload failed');
      }

      setUploadingFile(false);
      setProcessingFile(true);

      // Process document and create embeddings
      const processResponse = await apiClient.functions.invoke('processDocument', {
        file_url: uploadResponse.data.file_url,
        file_type: uploadResponse.data.file_type,
        knowledge_base_id: selectedKB.id,
        title: file.name,
        ollama_endpoint: endpoint,
        model: selectedModel
      });

      if (processResponse.data.success) {
        await loadDocuments();
        toast({
          title: "Document Processed",
          description: `Created ${processResponse.data.chunks_created} chunks`
        });
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploadingFile(false);
      setProcessingFile(false);
    }
  };

  const generateEmbedding = async (text) => {
    const { data } = await apiClient.functions.invoke('ollamaProxy', {
      endpoint,
      action: 'embeddings',
      model: selectedModel,
      messages: text, // proxy uses `messages` as the `input` field for embeddings
    });
    return data.data?.[0]?.embedding;
  };

  const cosineSimilarity = (a, b) => {
    if (!a || !b || a.length !== b.length) return 0;
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magA * magB);
  };

  const searchDocuments = async () => {
    if (!searchQuery.trim() || !endpoint || !selectedModel || !selectedKB) return;

    setIsSearching(true);
    try {
      const queryEmbedding = await generateEmbedding(searchQuery);
      
      const results = documents
        .map(doc => ({
          ...doc,
          similarity: cosineSimilarity(queryEmbedding, doc.vector)
        }))
        .filter(doc => doc.similarity >= kbSettings.similarity_threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, kbSettings.max_results);

      setSearchResults(results);

      if (onContextRetrieved && results.length > 0) {
        const context = results.map(r => r.content).join('\n\n');
        onContextRetrieved(context);
        toast({
          title: "Context Retrieved",
          description: `Found ${results.length} relevant chunks`
        });
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
      
      // Update KB document count
      if (selectedKB) {
        await apiClient.entities.KnowledgeBase.update(selectedKB.id, {
          document_count: Math.max(0, (selectedKB.document_count || 0) - 1)
        });
      }
      
      toast({
        title: "Deleted",
        description: "Document removed from knowledge base"
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const saveSettings = async () => {
    if (!selectedKB) return;
    
    try {
      await apiClient.entities.KnowledgeBase.update(selectedKB.id, {
        settings: kbSettings
      });
      
      setEditingSettings(false);
      toast({
        title: "Settings Saved",
        description: "RAG configuration updated"
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="search" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mb-3">
          <TabsTrigger value="search" className="text-xs">Search</TabsTrigger>
          <TabsTrigger value="manage" className="text-xs">Documents</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="flex-1 overflow-hidden mt-0">
          <div className="space-y-3 h-full flex flex-col">
            <Select value={selectedKB?.id} onValueChange={(id) => {
              const kb = knowledgeBases.find(k => k.id === id);
              setSelectedKB(kb);
            }}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select knowledge base" />
              </SelectTrigger>
              <SelectContent>
                {knowledgeBases.map((kb) => (
                  <SelectItem key={kb.id} value={kb.id}>
                    <div className="flex items-center gap-2">
                      <Folder className="w-3 h-3" />
                      {kb.name} ({kb.document_count || 0})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
                disabled={!searchQuery.trim() || isSearching || !selectedKB}
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
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {result.title || 'Untitled'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className="text-xs bg-purple-100 text-purple-700">
                              {Math.round(result.similarity * 100)}% match
                            </Badge>
                            {result.chunk_index !== undefined && (
                              <Badge variant="outline" className="text-xs">
                                Chunk {result.chunk_index + 1}/{result.total_chunks}
                              </Badge>
                            )}
                          </div>
                        </div>
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
            {!showNewKB ? (
              <Button
                onClick={() => setShowNewKB(true)}
                variant="outline"
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Knowledge Base
              </Button>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Knowledge base name"
                  value={newKBName}
                  onChange={(e) => setNewKBName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createKnowledgeBase()}
                  className="h-9"
                />
                <Button onClick={createKnowledgeBase} disabled={!newKBName.trim()}>
                  <Save className="w-4 h-4" />
                </Button>
                <Button variant="ghost" onClick={() => setShowNewKB(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {selectedKB && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">Upload Document</Label>
                  <Input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileUpload}
                    disabled={uploadingFile || processingFile}
                    className="h-9"
                  />
                  {(uploadingFile || processingFile) && (
                    <p className="text-xs text-gray-600">
                      {uploadingFile && "Uploading..."}
                      {processingFile && "Processing and creating embeddings..."}
                    </p>
                  )}
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
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <File className="w-3 h-3 text-gray-400" />
                                <p className="font-medium text-sm truncate">
                                  {doc.title || 'Untitled'}
                                </p>
                              </div>
                              {doc.file_type && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  {doc.file_type.toUpperCase()}
                                </Badge>
                              )}
                            </div>
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
                        <p className="text-xs mt-1">Upload files to build your knowledge base</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <div className="space-y-4">
              {selectedKB && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm">Chunk Size</Label>
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[kbSettings.chunk_size]}
                        onValueChange={([value]) => setKbSettings({ ...kbSettings, chunk_size: value })}
                        min={100}
                        max={2000}
                        step={100}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium w-12">{kbSettings.chunk_size}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Chunk Overlap</Label>
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[kbSettings.chunk_overlap]}
                        onValueChange={([value]) => setKbSettings({ ...kbSettings, chunk_overlap: value })}
                        min={0}
                        max={200}
                        step={10}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium w-12">{kbSettings.chunk_overlap}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Similarity Threshold</Label>
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[kbSettings.similarity_threshold * 100]}
                        onValueChange={([value]) => setKbSettings({ ...kbSettings, similarity_threshold: value / 100 })}
                        min={0}
                        max={100}
                        step={5}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium w-12">{(kbSettings.similarity_threshold * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Max Results</Label>
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[kbSettings.max_results]}
                        onValueChange={([value]) => setKbSettings({ ...kbSettings, max_results: value })}
                        min={1}
                        max={20}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium w-12">{kbSettings.max_results}</span>
                    </div>
                  </div>

                  <Button
                    onClick={saveSettings}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </Button>
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
