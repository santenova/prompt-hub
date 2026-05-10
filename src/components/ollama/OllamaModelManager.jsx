import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Download, 
  Trash2, 
  RefreshCw, 
  Loader2, 
  HardDrive,
  Package,
  Search,
  X
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/apis/client";

export default function OllamaModelManager({ endpoint, onModelUpdate }) {
  const [models, setModels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pullingModel, setPullingModel] = useState(null);
  const [pullProgress, setPullProgress] = useState({});
  const [deletingModel, setDeletingModel] = useState(null);
  const { toast } = useToast();

  // Popular models for quick access
  const POPULAR_MODELS = [
    { name: "llama3.2:3b", description: "Fast, efficient 3B model" },
    { name: "llama3.2:1b", description: "Ultra-fast 1B model" },
    { name: "phi3:mini", description: "Microsoft's small model" },
    { name: "mistral:7b", description: "Balanced 7B model" },
    { name: "gemma2:2b", description: "Google's efficient model" },
    { name: "qwen2.5:3b", description: "Alibaba's multilingual model" },
  ];

  useEffect(() => {
    if (endpoint) {
      loadModels();
    }
  }, [endpoint]);

  const loadModels = async () => {
    if (!endpoint) return;
    setIsLoading(true);
    try {
      const { data } = await apiClient.functions.invoke('ollamaProxy', { endpoint, action: 'list-models' });
      const models = (data.models || []).map(m => ({ name: m.id, size: m.size, modified_at: m.created * 1000 }));
      setModels(models);
      if (onModelUpdate) onModelUpdate(models);
    } catch (error) {
      toast({ title: "Load Failed", description: "Could not load models", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const pullModel = async (modelName) => {
    setPullingModel(modelName);
    setPullProgress({ [modelName]: 0 });
    try {
      await apiClient.functions.invoke('ollamaProxy', { endpoint, action: 'pull-model', model: modelName });
      await loadModels();
      toast({ title: "Download Complete", description: `${modelName} is ready to use` });
    } catch (error) {
      toast({ title: "Download Failed", description: error.message, variant: "destructive" });
    } finally {
      setPullingModel(null);
      setPullProgress({});
    }
  };

  const deleteModel = async (modelName) => {
    setDeletingModel(modelName);
    try {
      // Direct delete still needed as proxy doesn't have a delete action - use fetch via proxy approach
      const response = await fetch(`${endpoint}/api/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ollama', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ name: modelName })
      });
      if (response.ok) {
        await loadModels();
        toast({ title: "Deleted", description: `${modelName} removed` });
      }
    } catch (error) {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    } finally {
      setDeletingModel(null);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return 'N/A';
    const gb = bytes / (1024 ** 3);
    return `${gb.toFixed(2)} GB`;
  };

  const filteredPopular = POPULAR_MODELS.filter(m => 
    !models.find(installed => installed.name === m.name) &&
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="h-full flex flex-col border-2 border-green-200 bg-green-50/50">
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Package className="w-4 h-4 text-green-600" />
            Model Manager
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={loadModels}
            disabled={isLoading}
            className="h-6 w-6"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription className="text-xs">
          Download and manage Ollama models
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden flex flex-col p-3 space-y-3">
        <Input
          placeholder="🔍 Search models..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9"
        />

        <ScrollArea className="flex-1">
          <div className="space-y-4">
            {/* Custom Model Pull */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Pull Custom Model
              </h3>
              <div className="flex gap-2">
                <Input
                  placeholder="model-name:tag"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      pullModel(searchQuery.trim());
                      setSearchQuery('');
                    }
                  }}
                  className="h-9"
                />
                <Button
                  onClick={() => {
                    if (searchQuery.trim()) {
                      pullModel(searchQuery.trim());
                      setSearchQuery('');
                    }
                  }}
                  disabled={!searchQuery.trim() || pullingModel}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Installed Models */}
            {models.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Installed ({models.length})
                </h3>
                {models.map((model) => (
                  <motion.div
                    key={model.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-white rounded-lg border border-green-200 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{model.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            <HardDrive className="w-3 h-3 mr-1" />
                            {formatSize(model.size)}
                          </Badge>
                          {model.modified_at && (
                            <span className="text-xs text-gray-500">
                              {new Date(model.modified_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteModel(model.name)}
                        disabled={deletingModel === model.name}
                        className="h-7 w-7 p-0 text-red-600"
                      >
                        {deletingModel === model.name ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Available to Download */}
            {filteredPopular.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Available to Download
                </h3>
                {filteredPopular.map((model) => (
                  <motion.div
                    key={model.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-white rounded-lg border border-gray-200"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{model.name}</p>
                        <p className="text-xs text-gray-600 mt-1">{model.description}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => pullModel(model.name)}
                        disabled={pullingModel === model.name}
                        className="bg-green-600 hover:bg-green-700 h-7"
                      >
                        {pullingModel === model.name ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Download className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                    {pullingModel === model.name && pullProgress[model.name] !== undefined && (
                      <div className="mt-2 space-y-1">
                        <Progress value={pullProgress[model.name]} className="h-1" />
                        <p className="text-xs text-gray-500">
                          {Math.round(pullProgress[model.name])}% downloaded
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
