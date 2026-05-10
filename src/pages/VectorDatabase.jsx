import React, { useState, useMemo } from "react";
import { apiClient } from "@/apis/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database,
  Search,
  Upload,
  FileText,
  Sparkles,
  Plus,
  Trash2,
  Filter,
  ArrowRight,
  Target,
  Zap,
  CheckCircle2,
  Info,
  TrendingUp,
  Layers
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  generateSimpleEmbedding, 
  cosineSimilarity, 
  findSimilarDocuments, 
  chunkText,
  getVectorStats 
} from "../components/vector/VectorUtils";

export default function VectorDatabase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [newDocContent, setNewDocContent] = useState("");
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocCategory, setNewDocCategory] = useState("");
  const [newDocTags, setNewDocTags] = useState("");
  const [chunkSize, setChunkSize] = useState(500);
  const [useChunking, setUseChunking] = useState(false);

  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['vector-documents'],
    queryFn: () => apiClient.entities.VectorDocument.list('-created_date'),
    initialData: [],
  });

  const createDocMutation = useMutation({
    mutationFn: (data) => apiClient.entities.VectorDocument.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['vector-documents']);
      setNewDocContent("");
      setNewDocTitle("");
      setNewDocCategory("");
      setNewDocTags("");
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (data) => apiClient.entities.VectorDocument.bulkCreate(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['vector-documents']);
    },
  });

  const deleteDocMutation = useMutation({
    mutationFn: (id) => apiClient.entities.VectorDocument.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['vector-documents']);
    },
  });

  const handleAddDocument = async () => {
    if (!newDocContent.trim()) return;

    const metadata = {
      title: newDocTitle || "Untitled",
      category: newDocCategory || "General",
      tags: newDocTags ? newDocTags.split(',').map(t => t.trim()) : [],
      source: "manual"
    };

    if (useChunking && newDocContent.length > chunkSize) {
      // Chunk the document
      const chunks = chunkText(newDocContent, chunkSize, 50);
      const parentId = Date.now().toString();

      const chunkedDocs = chunks.map((chunk, idx) => ({
        content: chunk,
        vector: generateSimpleEmbedding(chunk),
        metadata: { ...metadata, title: `${metadata.title} (Part ${idx + 1})` },
        chunk_index: idx,
        parent_id: parentId
      }));

      bulkCreateMutation.mutate(chunkedDocs);
    } else {
      // Single document
      const vector = generateSimpleEmbedding(newDocContent);
      createDocMutation.mutate({
        content: newDocContent,
        vector,
        metadata,
        chunk_index: 0
      });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || documents.length === 0) return;

    setIsSearching(true);
    try {
      // Generate embedding for search query
      const queryVector = generateSimpleEmbedding(searchQuery);
      
      // Find similar documents
      const results = findSimilarDocuments(queryVector, documents, 10);
      
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const stats = useMemo(() => {
    const vectors = documents.map(d => d.vector).filter(Boolean);
    return getVectorStats(vectors);
  }, [documents]);

  const categories = useMemo(() => {
    const cats = new Set(documents.map(d => d.metadata?.category).filter(Boolean));
    return Array.from(cats);
  }, [documents]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full mb-4">
            <Database className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-900">Local Vector Database</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Vector Search Engine
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Store documents with embeddings and perform semantic similarity search - no API keys required
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardContent className="pt-6 text-center">
              <Database className="w-10 h-10 text-blue-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-blue-900">{stats.count}</p>
              <p className="text-sm text-gray-600">Documents Stored</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="pt-6 text-center">
              <Layers className="w-10 h-10 text-purple-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-purple-900">{Math.round(stats.avgDimensions)}</p>
              <p className="text-sm text-gray-600">Vector Dimensions</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="pt-6 text-center">
              <TrendingUp className="w-10 h-10 text-green-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-green-900">{categories.length}</p>
              <p className="text-sm text-gray-600">Categories</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="search" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">
              <Search className="w-4 h-4 mr-2" />
              Search
            </TabsTrigger>
            <TabsTrigger value="add">
              <Plus className="w-4 h-4 mr-2" />
              Add Documents
            </TabsTrigger>
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-indigo-600" />
                  Semantic Search
                </CardTitle>
                <CardDescription>
                  Search documents by meaning, not just keywords
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter your search query..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="text-lg"
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim() || documents.length === 0}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-8"
                  >
                    {isSearching ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Search
                      </>
                    )}
                  </Button>
                </div>

                {documents.length === 0 && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      No documents yet. Add some documents to start searching!
                    </AlertDescription>
                  </Alert>
                )}

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-4 mt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Search Results ({searchResults.length})
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchResults([])}
                      >
                        Clear
                      </Button>
                    </div>

                    <AnimatePresence>
                      {searchResults.map((result, idx) => (
                        <motion.div
                          key={result.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <Card className="border-l-4 border-l-indigo-500 hover:shadow-lg transition-all">
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-semibold text-gray-900">
                                      {result.metadata?.title || "Untitled"}
                                    </h4>
                                    <Badge className="bg-indigo-100 text-indigo-800">
                                      {Math.round(result.similarity_score * 100)}% match
                                    </Badge>
                                  </div>
                                  {result.metadata?.category && (
                                    <Badge variant="outline" className="mr-2">
                                      {result.metadata.category}
                                    </Badge>
                                  )}
                                  {result.metadata?.tags?.slice(0, 3).map((tag, i) => (
                                    <Badge key={i} variant="secondary" className="mr-1 text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                                <div className="text-right">
                                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">
                                      #{idx + 1}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-gray-700 text-sm line-clamp-3">
                                {result.content}
                              </p>
                              <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                                <Layers className="w-3 h-3" />
                                Vector dims: {result.vector?.length || 0}
                                {result.chunk_index > 0 && (
                                  <span>• Chunk {result.chunk_index}</span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add Documents Tab */}
          <TabsContent value="add" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-purple-600" />
                  Add New Document
                </CardTitle>
                <CardDescription>
                  Add documents to your vector database with automatic embedding generation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <Input
                    placeholder="Document title"
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <Textarea
                    placeholder="Enter document content..."
                    value={newDocContent}
                    onChange={(e) => setNewDocContent(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {newDocContent.length} characters
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <Input
                      placeholder="e.g., Documentation, Blog, Notes"
                      value={newDocCategory}
                      onChange={(e) => setNewDocCategory(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags (comma-separated)
                    </label>
                    <Input
                      placeholder="e.g., AI, tutorial, guide"
                      value={newDocTags}
                      onChange={(e) => setNewDocTags(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <input
                    type="checkbox"
                    checked={useChunking}
                    onChange={(e) => setUseChunking(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-900 cursor-pointer">
                      Split into chunks (recommended for long documents)
                    </label>
                    {useChunking && (
                      <div className="mt-2">
                        <Input
                          type="number"
                          value={chunkSize}
                          onChange={(e) => setChunkSize(parseInt(e.target.value) || 500)}
                          className="w-32"
                          min="100"
                          max="2000"
                          step="100"
                        />
                        <span className="text-xs text-gray-600 ml-2">words per chunk</span>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleAddDocument}
                  disabled={createDocMutation.isPending || bulkCreateMutation.isPending || !newDocContent.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 py-6"
                  size="lg"
                >
                  {createDocMutation.isPending || bulkCreateMutation.isPending ? (
                    <>
                      <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                      Creating embeddings...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      Add to Vector Database
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* How It Works */}
            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-indigo-600" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-semibold">Text is converted to vectors</p>
                    <p className="text-gray-600">Using a simple TF-IDF-like embedding algorithm</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-semibold">Vectors are stored with metadata</p>
                    <p className="text-gray-600">Each document gets a 128-dimensional vector</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-semibold">Search by semantic similarity</p>
                    <p className="text-gray-600">Find documents by meaning using cosine similarity</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* All Documents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Documents</CardTitle>
                  <CardDescription>
                    {documents.length} documents in your vector database
                  </CardDescription>
                </div>
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat, idx) => (
                      <Badge key={idx} variant="outline">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12 text-gray-500">
                  <Database className="w-12 h-12 animate-pulse text-gray-300 mx-auto mb-3" />
                  <p>Loading documents...</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No documents yet</h3>
                  <p className="mb-6">Add your first document to start using vector search</p>
                  <Button
                    onClick={() => {
                      const addTab = document.querySelector('[value="add"]');
                      addTab?.click();
                    }}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Document
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.map((doc, idx) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      <Card className="h-full hover:shadow-md transition-all border-l-4 border-l-purple-400">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">
                                {doc.metadata?.title || "Untitled"}
                              </h4>
                              {doc.metadata?.category && (
                                <Badge variant="outline" className="text-xs">
                                  {doc.metadata.category}
                                </Badge>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteDocMutation.mutate(doc.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                            {doc.content}
                          </p>

                          {doc.metadata?.tags && doc.metadata.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {doc.metadata.tags.map((tag, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                            <span className="flex items-center gap-1">
                              <Layers className="w-3 h-3" />
                              {doc.vector?.length || 0}D vector
                            </span>
                            {doc.chunk_index > 0 && (
                              <span>Chunk {doc.chunk_index}</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Zap className="w-8 h-8" />
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-bold mb-2">No API Keys Required</h3>
                  <p className="text-indigo-100">
                    This vector database uses a simple, local embedding algorithm. All processing happens in your browser - completely free and private.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>100% Free</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm mt-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>No limits</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
