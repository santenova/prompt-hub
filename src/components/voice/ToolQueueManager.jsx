import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  Pause, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Layers,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ToolQueueManager({ 
  queue, 
  onExecuteQueue, 
  onPauseQueue,
  onResumeQueue,
  onClearQueue, 
  onRemoveFromQueue,
  isExecuting = false,
  isPaused = false,
  currentExecutingIndex = -1
}) {
  // Ensure queue is always an array
  const safeQueue = Array.isArray(queue) ? queue : [];
  
  const completedCount = safeQueue.filter(q => q?.status === 'completed').length;
  const failedCount = safeQueue.filter(q => q?.status === 'failed').length;
  const pendingCount = safeQueue.filter(q => q?.status === 'pending').length;

  // Hidden button to trigger resume from parent
  const handleResume = () => {
    if (onResumeQueue) {
        onResumeQueue();
    } else {
        // Fallback if no resume handler (should not happen with updated parent)
        onExecuteQueue();
    }
  };

  return (
    <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50">
      <CardHeader className="pb-3 pt-3 px-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <CardTitle className="text-sm font-semibold">Queue</CardTitle>
              <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">
                {safeQueue.length}
              </Badge>
              {isPaused && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs border-yellow-300">
                  Paused
                </Badge>
              )}
            </div>
          </div>
          <button id="hidden-resume-trigger" onClick={onExecuteQueue} className="hidden" />
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {isExecuting ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onPauseQueue}
                className="h-7 bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200"
              >
                <Pause className="w-3 h-3 mr-1" />
                Pause
              </Button>
            ) : isPaused ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResume}
                className="h-7 bg-green-100 text-green-700 border-green-300 hover:bg-green-200"
              >
                <Play className="w-3 h-3 mr-1" />
                Resume
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={onExecuteQueue}
                disabled={pendingCount === 0}
                className="h-7 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0"
              >
                <Play className="w-3 h-3 mr-1" />
                Run
              </Button>
            )}
            
            {!isExecuting && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearQueue}
                className="h-7 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
          {/* Local/Secure/Free Banner */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">🔒 Local</Badge>
            <Badge className="bg-blue-100 text-blue-700 border-blue-300 text-xs">🛡️ Secure</Badge>
            <Badge className="bg-purple-100 text-purple-700 border-purple-300 text-xs">💰 Free</Badge>
            <span className="text-xs text-gray-500">• Runs on your Ollama - its free</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-4">
        {/* Stats */}
        <div className="flex items-center gap-4 mb-3 px-2 py-2 bg-white rounded-lg border">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span className="text-xs text-gray-600">{pendingCount} Pending</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-600">{completedCount} Done</span>
          </div>
          {failedCount > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-xs text-gray-600">{failedCount} Failed</span>
            </div>
          )}
        </div>

        {/* Overall Progress - Always visible, sticky */}
        <div className="mb-3 space-y-1 sticky top-0 bg-gradient-to-br from-blue-50 to-cyan-50 z-10 pb-2">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Overall Progress</span>
            <span>{safeQueue.length > 0 ? Math.round((completedCount / safeQueue.length) * 100) : 0}%</span>
          </div>
          <Progress value={safeQueue.length > 0 ? (completedCount / safeQueue.length) * 100 : 0} className="h-2" />
          
          {/* Currently Processing Info */}
          {isExecuting && safeQueue.find(q => q?.status === 'executing') && (
            <div className="mt-2 p-2 bg-blue-100 border border-blue-300 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-xs font-medium text-blue-800">
                  Processing: {safeQueue.find(q => q?.status === 'executing')?.toolName}
                </span>
              </div>
              {safeQueue.find(q => q?.status === 'executing')?.inputData?.platform && (
                <p className="text-xs text-blue-700 mt-1 ml-6">
                  Platform: {safeQueue.find(q => q?.status === 'executing')?.inputData?.platform}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Queue Items */}
        <div className="space-y-2">
          <AnimatePresence>
            {safeQueue.slice(0, isExecuting ? 2 : safeQueue.length).map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <div className={`p-3 rounded-lg border-2 transition-all ${
                    item.status === 'completed' 
                      ? 'border-green-300 bg-green-50' 
                      : item.status === 'failed'
                      ? 'border-red-300 bg-red-50'
                      : item.status === 'executing'
                      ? 'border-blue-400 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        {/* Status Icon */}
                        {item.status === 'completed' ? (
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : item.status === 'failed' ? (
                          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        ) : item.status === 'executing' ? (
                          <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5"></div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-gray-900">{item.toolName}</p>
                            {item.platforms?.length > 0 && (
                              <Badge variant="outline" className="text-xs h-4">
                                {item.platforms.length} platforms
                              </Badge>
                            )}
                          </div>
                          
                          {item.platforms && item.platforms.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-1">
                              {item.platforms.map((platform, pidx) => (
                                <Badge key={pidx} className="bg-indigo-100 text-indigo-700 text-xs h-4">
                                  {platform}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          <p className="text-xs text-gray-600 line-clamp-1">
                            {item.inputData?.content?.substring(0, 60) || 
                             item.inputData?.description?.substring(0, 60) ||
                             item.inputData?.niche || 
                             'No preview'}...
                          </p>
                          
                          {item.error && (
                            <p className="text-xs text-red-600 mt-1">Error: {item.error}</p>
                          )}
                          
                          {item.status === 'executing' && (
                            <div className="mt-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
                                <span className="text-xs text-blue-700 font-medium">
                                  Processing: {item.toolName}
                                </span>
                              </div>
                              <p className="text-xs text-blue-600">
                                {item.targetMode === 'beam' ? 'Running multi-model beam comparison...' : 
                                 item.targetMode === 'ollama' ? 'Generating with Ollama...' : 
                                 'Generating with apiClient AI...'}
                              </p>
                              {item.inputData?.platform && (
                                <p className="text-xs text-gray-500">Platform: {item.inputData.platform}</p>
                              )}
                              {item.inputData?.tone && (
                                <p className="text-xs text-gray-500">Tone: {item.inputData.tone}</p>
                              )}
                            </div>
                          )}
                          
                          {item.status === 'completed' && item.result && (
                            <Badge className="bg-green-600 text-xs mt-1">
                              ✓ {item.result.results?.length || item.result.beam_results?.length || 0} results
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {item.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveFromQueue(item.id)}
                          className="h-6 w-6 text-red-600 hover:bg-red-100 flex-shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
