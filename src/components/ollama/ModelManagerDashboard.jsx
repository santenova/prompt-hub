import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Server,
  Download,
  Trash2,
  Info,
  Cpu,
  HardDrive,
  Clock,
  RefreshCw,
  Plus,
  Search,
  Star,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

export default function ModelManagerDashboard({ 
  endpoint, 
  models, 
  onRefresh,
  onPullModel,
  onDeleteModel 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState(null);
  const [showPullDialog, setShowPullDialog] = useState(false);
  const [pullModelName, setPullModelName] = useState('');
  const [isPulling, setIsPulling] = useState(false);
  const { toast } = useToast();

  const filteredModels = models.filter(model =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatBytes = (bytes) => {
    if (!bytes) return 'N/A';
    const gb = bytes / (1024 ** 3);
    return `${gb.toFixed(2)} GB`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString();
  };

  const handlePullModel = async () => {
    if (!pullModelName.trim()) return;
    
    setIsPulling(true);
    try {
      await onPullModel(pullModelName.trim());
      toast({
        title: "Model Download Started",
        description: `Pulling ${pullModelName}... This may take a while.`
      });
      setShowPullDialog(false);
      setPullModelName('');
    } catch (error) {
      toast({
        title: "Pull Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsPulling(false);
    }
  };

  const popularModels = [
    { name: 'llama3.2:latest', description: 'Meta Llama 3.2 - Latest version', size: '2.0GB' },
    { name: 'mistral:latest', description: 'Mistral 7B - Fast and efficient', size: '4.1GB' },
    { name: 'codellama:latest', description: 'Code Llama - Optimized for coding', size: '3.8GB' },
    { name: 'phi3:latest', description: 'Microsoft Phi-3 - Compact and powerful', size: '2.3GB' },
    { name: 'gemma2:latest', description: 'Google Gemma 2 - Latest from Google', size: '5.2GB' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Model Manager</h2>
          <p className="text-sm text-gray-600">Manage your Ollama models and endpoints</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            size="sm" 
            onClick={() => setShowPullDialog(true)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Pull Model
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search models..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredModels.map((model, idx) => (
            <motion.div
              key={model.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="border-2 border-gray-200 hover:border-purple-300 transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg">
                        <Server className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm truncate">{model.name}</CardTitle>
                        <p className="text-xs text-gray-500 mt-1">
                          {model.details?.family || 'Unknown family'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedModel(model)}
                      className="h-7 w-7"
                    >
                      <Info className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1 text-gray-600">
                      <HardDrive className="w-3 h-3" />
                      <span>{formatBytes(model.size)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(model.modified_at)}</span>
                    </div>
                  </div>
                  
                  {model.details?.parameter_size && (
                    <Badge variant="outline" className="text-xs">
                      {model.details.parameter_size}
                    </Badge>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteModel(model.name)}
                    className="w-full text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredModels.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Server className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No models found</p>
          <p className="text-sm">Pull a model to get started</p>
        </div>
      )}

      {/* Pull Model Dialog */}
      <Dialog open={showPullDialog} onOpenChange={setShowPullDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pull Ollama Model</DialogTitle>
            <DialogDescription>
              Download a model from the Ollama library
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                placeholder="e.g., llama3.2:latest"
                value={pullModelName}
                onChange={(e) => setPullModelName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePullModel()}
              />
              <p className="text-xs text-gray-500">
                Visit <a href="https://ollama.com/library" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ollama.com/library</a> to browse available models
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3">Popular Models</h4>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {popularModels.map((model) => (
                    <motion.div
                      key={model.name}
                      whileHover={{ scale: 1.02 }}
                      className="p-3 border rounded-lg cursor-pointer hover:border-purple-300 transition-all"
                      onClick={() => setPullModelName(model.name)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{model.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{model.description}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">{model.size}</Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPullDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handlePullModel} 
              disabled={!pullModelName.trim() || isPulling}
              className="bg-gradient-to-r from-purple-600 to-indigo-600"
            >
              {isPulling ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Pulling...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Pull Model
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Model Details Dialog */}
      <Dialog open={!!selectedModel} onOpenChange={() => setSelectedModel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Model Details</DialogTitle>
          </DialogHeader>
          {selectedModel && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Name:</span>
                  <span className="text-sm font-medium">{selectedModel.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Size:</span>
                  <span className="text-sm font-medium">{formatBytes(selectedModel.size)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Modified:</span>
                  <span className="text-sm font-medium">{formatDate(selectedModel.modified_at)}</span>
                </div>
                {selectedModel.details?.family && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Family:</span>
                    <span className="text-sm font-medium">{selectedModel.details.family}</span>
                  </div>
                )}
                {selectedModel.details?.parameter_size && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Parameters:</span>
                    <span className="text-sm font-medium">{selectedModel.details.parameter_size}</span>
                  </div>
                )}
                {selectedModel.details?.quantization_level && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Quantization:</span>
                    <span className="text-sm font-medium">{selectedModel.details.quantization_level}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}