import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Zap, 
  Check, 
  X, 
  Copy, 
  Loader2,
  Sparkles,
  GitMerge,
  Bot,
  ChevronRight,
  Save,
  TrendingUp,
  Hash
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import BeamAnalyzer from "./BeamAnalyzer";

export default function BeamChat({ 
  prompt,
  selectedModels, 
  endpoint,
  onResponseSelect,
  onMerge,
  onCancel,
  onSaveToContent
}) {
  const [beamResponses, setBeamResponses] = useState([]);
  const [beamStatus, setBeamStatus] = useState('idle'); // idle, beaming, completed
  const [selectedResponseIds, setSelectedResponseIds] = useState([]);
  const [mergeOption, setMergeOption] = useState('fusion');
  const [isMerging, setIsMerging] = useState(false);
  const { toast } = useToast();
  const abortControllersRef = React.useRef([]);

  // Auto-start beaming when component mounts
  React.useEffect(() => {
    if (prompt && selectedModels.length > 0) {
      startBeaming();
    }
    
    return () => {
      // Cleanup: abort all ongoing requests
      abortControllersRef.current.forEach(controller => controller.abort());
    };
  }, []);

  const stopAllBeaming = () => {
    abortControllersRef.current.forEach(controller => {
      try {
        controller.abort();
      } catch (e) {
        // Ignore abort errors
      }
    });
    abortControllersRef.current = [];
    setBeamStatus('completed');
    toast({
      title: "Beam Stopped",
      description: "All ongoing requests have been cancelled"
    });
  };

  const startBeaming = async () => {
    if (!prompt.trim() || selectedModels.length === 0) {
      return;
    }

    setBeamStatus('beaming');
    setBeamResponses([]);
    setSelectedResponseIds([]);
    abortControllersRef.current = [];

    // Batch process models with concurrency limit (2 at a time to avoid overloading)
    const CONCURRENT_LIMIT = 2;
    const results = [];
    
    for (let i = 0; i < selectedModels.length; i += CONCURRENT_LIMIT) {
      const batch = selectedModels.slice(i, i + CONCURRENT_LIMIT);
      const batchPromises = batch.map(async (model) => {
      const responseId = `${model}-${Date.now()}`;
      const controller = new AbortController();
      abortControllersRef.current.push(controller);
      
      try {
        const response = await fetch(`${endpoint}/v1/chat/completions`, {
          signal: controller.signal,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ollama',
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            stream: true
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        // Prepend response to the beginning of the list
        setBeamResponses(prev => [{
          id: responseId,
          model: model,
          content: '',
          status: 'streaming',
          tokens: { prompt: 0, response: 0 }
        }, ...prev]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.startsWith('data: ') && line !== 'data: [DONE]');

          for (const line of lines) {
            try {
              const json = JSON.parse(line.slice(6)); // strip "data: "
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) {
                fullContent += delta;
                setBeamResponses(prev => 
                  prev.map(r => r.id === responseId ? { ...r, content: fullContent } : r)
                );
              }
              // Capture token counts from usage
              if (json.usage) {
                setBeamResponses(prev => 
                  prev.map(r => 
                    r.id === responseId 
                      ? { ...r, tokens: { prompt: json.usage.prompt_tokens || 0, response: json.usage.completion_tokens || 0 } }
                      : r
                  )
                );
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }

        // Mark as completed and calculate score
        setBeamResponses(prev => 
          prev.map(r => {
            if (r.id === responseId) {
              const promptTokens = r.tokens?.prompt || 0;
              const responseTokens = r.tokens?.response || 0;
              
              // Check for refusal patterns - eliminate these responses
              const refusalPatterns = [
                /^i am sorry/i,
                /^i'm sorry/i,
                /^sorry, but/i,
                /^i apologize/i,
                /^i cannot/i,
                /^i can't/i
              ];
              
              const isRefusal = refusalPatterns.some(pattern => 
                fullContent.trim().match(pattern)
              );
              
              if (isRefusal) {
                return { ...r, status: 'completed', score: 0 };
              }
              
              // Calculate efficiency score: response tokens / request tokens
              const score = promptTokens > 0 ? Math.round((responseTokens / promptTokens) * 100) / 100 : 0;
              
              return { ...r, status: 'completed', score };
            }
            return r;
          })
        );

        return { id: responseId, model, content: fullContent };
      } catch (error) {
        // Handle abort separately
        if (error.name === 'AbortError') {
          setBeamResponses(prev => 
            prev.map(r => 
              r.id === responseId 
                ? { ...r, status: 'error', content: 'Cancelled', error: true }
                : r
            )
          );
          return { id: responseId, model, content: 'Cancelled', error: true };
        }
        
        setBeamResponses(prev => 
          prev.map(r => 
            r.id === responseId 
              ? { ...r, status: 'error', content: `Error: ${error.message}`, error: true }
              : r
          )
        );
        return { id: responseId, model, content: `Error: ${error.message}`, error: true };
      }
      });

      // Wait for current batch to finish before starting next batch
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    setBeamStatus('completed');
    
    // Auto-select all successful responses
    const successfulIds = results.filter(r => !r.error).map(r => r.id);
    setSelectedResponseIds(successfulIds);
  };

  const toggleResponseSelection = (responseId) => {
    setSelectedResponseIds(prev => 
      prev.includes(responseId) 
        ? prev.filter(id => id !== responseId)
        : [...prev, responseId]
    );
  };

  const handleMerge = async () => {
    if (selectedResponseIds.length === 0) {
      toast({
        title: "No Responses Selected",
        description: "Select at least one response to merge",
        variant: "destructive"
      });
      return;
    }

    const selectedResponses = beamResponses.filter(r => selectedResponseIds.includes(r.id));
    setIsMerging(true);

    try {
      await onMerge(selectedResponses, mergeOption, beamResponses);
    } catch (error) {
      toast({
        title: "Merge Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsMerging(false);
    }
  };

  const allCompleted = beamResponses.length === selectedModels.length && 
    beamResponses.every(r => r.status === 'completed' || r.status === 'error');

  return (
    <div className="space-y-4">
      {/* Beam Control Bar */}
      <Card className="border-2 border-indigo-300 bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-600" />
              <span>Beam Mode</span>
              <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600">
                {selectedModels.length} Models
              </Badge>
            </div>
            <div className="flex gap-2">
              {beamStatus === 'beaming' && (
                <Button
                  onClick={stopAllBeaming}
                  variant="destructive"
                >
                  <X className="w-4 h-4 mr-2" />
                  Stop All
                </Button>
              )}
              {beamStatus === 'completed' && (
                <Button
                  onClick={startBeaming}
                  variant="outline"
                >
                  <Loader2 className="w-4 h-4 mr-2" />
                  Restart Beam
                </Button>
              )}
              {beamStatus === 'completed' && selectedResponseIds.length > 0 && (
                <Button
                  onClick={handleMerge}
                  className="bg-gradient-to-r from-green-600 to-emerald-600"
                  disabled={isMerging}
                >
                  {isMerging ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <GitMerge className="w-4 h-4 mr-2" />
                  )}
                  Merge Selected ({selectedResponseIds.length})
                </Button>
              )}
              {beamResponses.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const allText = beamResponses
                      .filter(r => !r.error)
                      .map(r => `[${r.model}]\n${r.content}`)
                      .join('\n\n---\n\n');
                    navigator.clipboard.writeText(allText);
                    toast({
                      title: "Copied All Results",
                      description: `${beamResponses.filter(r => !r.error).length} model responses copied`
                    });
                  }}
                  disabled={beamResponses.filter(r => !r.error).length === 0}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy All
                </Button>
              )}
              <Button variant="outline" onClick={onCancel}>
                <X className="w-4 h-4 mr-2" />
                Exit Beam
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        {beamStatus === 'completed' && (
          <CardContent className="pt-0">
            <div className="flex items-center gap-3">
              <Label className="text-sm font-medium">Merge Strategy:</Label>
              <Select value={mergeOption} onValueChange={setMergeOption}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fusion">🔀 Fusion (Combine Best)</SelectItem>
                  <SelectItem value="checklist">✅ Checklist (Pros/Cons)</SelectItem>
                  <SelectItem value="compare">📊 Compare Side-by-Side</SelectItem>
                  <SelectItem value="custom">✏️ Custom Merge</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-gray-600">
                {selectedResponseIds.length > 0 
                  ? `${selectedResponseIds.length} selected for merge`
                  : 'Select responses to merge'}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Beam Responses Grid */}
      {beamStatus !== 'idle' && (
        <ScrollArea className="h-[calc(100vh-20rem)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
            <AnimatePresence>
              {beamResponses.map((response) => (
                <motion.div
                  key={response.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card 
                    className={`border-2 transition-all cursor-pointer ${
                      selectedResponseIds.includes(response.id)
                        ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                        : 'border-gray-200 hover:border-indigo-300'
                    } ${response.status === 'error' ? 'border-red-300 bg-red-50' : ''}`}
                    onClick={() => beamStatus === 'completed' && !response.error && toggleResponseSelection(response.id)}
                  >
                    <CardHeader className="pb-3">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <Bot className="w-4 h-4 text-indigo-600" />
                         <span className="font-semibold text-sm">{response.model}</span>
                         {response.score !== undefined && (
                           <Badge className={`text-xs ${
                             response.score >= 80 ? 'bg-green-100 text-green-700 border-green-300' :
                             response.score >= 60 ? 'bg-blue-100 text-blue-700 border-blue-300' :
                             response.score >= 40 ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                             'bg-gray-100 text-gray-700 border-gray-300'
                           }`}>
                             <TrendingUp className="w-3 h-3 mr-1" />
                             {response.score}
                           </Badge>
                         )}
                       </div>
                       <div className="flex items-center gap-2">
                          {response.status === 'streaming' && (
                            <div className="flex gap-1">
                              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
                              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                            </div>
                          )}
                          {response.status === 'completed' && !response.error && (
                            <Button
                              variant={selectedResponseIds.includes(response.id) ? "default" : "ghost"}
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleResponseSelection(response.id);
                              }}
                            >
                              <Check className={`w-4 h-4 ${selectedResponseIds.includes(response.id) ? 'text-white' : 'text-gray-400'}`} />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {response.content ? (
                        <div className="space-y-3">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap break-words max-h-[300px] overflow-y-auto">
                            {response.content}
                          </p>
                          
                          {/* Token Stats */}
                          {response.tokens && (response.tokens.prompt > 0 || response.tokens.response > 0) && (
                            <div className="flex items-center gap-3 text-xs text-gray-600 pt-2 border-t">
                              <div className="flex items-center gap-1">
                                <Hash className="w-3 h-3" />
                                <span>{response.tokens.prompt + response.tokens.response} tokens</span>
                              </div>
                              <div className="text-gray-400">•</div>
                              <div>
                                <span className="text-gray-500">In:</span> {response.tokens.prompt}
                              </div>
                              <div>
                                <span className="text-gray-500">Out:</span> {response.tokens.response}
                              </div>
                              {response.score !== undefined && (
                                <>
                                  <div className="text-gray-400">•</div>
                                  <div className="flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    <span className="font-medium">Score: {response.score}/100</span>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                          
                          {response.status === 'completed' && !response.error && (
                            <div className="flex gap-2 pt-2 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onResponseSelect(response, beamResponses);
                                }}
                                className="flex-1"
                              >
                                <ChevronRight className="w-3 h-3 mr-1" />
                                Continue with This
                              </Button>
                              <Button
                               variant="ghost"
                               size="sm"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 navigator.clipboard.writeText(response.content);
                                 toast({ title: "Copied!", description: "Response copied to clipboard" });
                               }}
                               title="Copy"
                              >
                               <Copy className="w-3 h-3" />
                              </Button>
                              {onSaveToContent && (
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   onSaveToContent(response);
                                 }}
                                 title="Save to Content"
                                 className="text-green-600 hover:text-green-700 hover:bg-green-50"
                               >
                                 <Save className="w-3 h-3" />
                               </Button>
                              )}
                              <Button
                               variant="ghost"
                               size="sm"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setBeamResponses(prev => prev.filter(r => r.id !== response.id));
                                 setSelectedResponseIds(prev => prev.filter(id => id !== response.id));
                                 toast({ title: "Removed", description: `${response.model} response removed` });
                               }}
                               className="text-red-600 hover:text-red-700 hover:bg-red-50"
                               title="Remove"
                              >
                               <X className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Waiting for response...</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      )}

      {/* Beam Analyzer - Show when completed */}
      {beamStatus === 'completed' && beamResponses.filter(r => !r.error).length > 1 && (
        <BeamAnalyzer
          beamResponses={beamResponses}
          originalPrompt={prompt}
          onContinueWithResponse={(response) => onResponseSelect(response, beamResponses)}
        />
      )}
    </div>
  );
}