import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Wrench, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Zap,
  Play,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import moment from 'moment';

export default function ToolExecutionPanel({ toolCalls = [], isExecuting = false }) {
  const [expandedCall, setExpandedCall] = useState(null);
  const [executionLog, setExecutionLog] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('tool_execution_log') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (toolCalls.length > 0) {
      const newLogs = toolCalls.map(call => ({
        id: Date.now() + Math.random(),
        toolName: call.toolName,
        args: call.args,
        output: call.output,
        timestamp: new Date().toISOString(),
        success: !call.output?.toLowerCase().includes('error')
      }));
      
      const updated = [...newLogs, ...executionLog].slice(0, 50);
      setExecutionLog(updated);
      localStorage.setItem('tool_execution_log', JSON.stringify(updated));
    }
  }, [toolCalls]);

  const formatToolName = (name) => {
    return name.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase());
  };

  const getToolIcon = (toolName) => {
    const icons = {
      searchWeb: '🌐',
      getCurrentTime: '⏰',
      getWeather: '🌤️',
      addNumbers: '➕',
      subtractNumbers: '➖',
      multiplyNumbers: '✖️',
      runTest: '🧪',
      listTests: '📋',
      runAllTests: '🔬',
      create_template: '📝',
      create_persona: '👤',
      send_email: '📧',
      query_database: '🗄️',
      schedule_reminder: '📅'
    };
    return icons[toolName] || '🔧';
  };

  const clearLog = () => {
    setExecutionLog([]);
    localStorage.setItem('tool_execution_log', JSON.stringify([]));
  };

  return (
    <Card className="border-2 border-orange-200 bg-orange-50/50 h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Wrench className="w-4 h-4 text-orange-600" />
            Tool Execution
          </CardTitle>
          {executionLog.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearLog} className="h-7 text-xs">
              Clear Log
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-3">
        {isExecuting && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 p-3 bg-yellow-100 border border-yellow-300 rounded-lg flex items-center gap-2"
          >
            <Zap className="w-4 h-4 text-yellow-600 animate-pulse" />
            <span className="text-sm text-yellow-800">Executing tools...</span>
          </motion.div>
        )}

        <ScrollArea className="h-full">
          {executionLog.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No tool executions yet</p>
              <p className="text-xs mt-1 text-gray-400">Tool calls will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {executionLog.map((call) => (
                  <motion.div
                    key={call.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                  >
                    <Card className={`border ${call.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                      <CardContent className="p-3">
                        <div 
                          className="flex items-start justify-between cursor-pointer"
                          onClick={() => setExpandedCall(expandedCall === call.id ? null : call.id)}
                        >
                          <div className="flex items-start gap-2 flex-1">
                            <div className="text-xl">
                              {getToolIcon(call.toolName)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm">{formatToolName(call.toolName)}</p>
                                {call.success ? (
                                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                                ) : (
                                  <XCircle className="w-3 h-3 text-red-600" />
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  {moment(call.timestamp).fromNow()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            {expandedCall === call.id ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        
                        <AnimatePresence>
                          {expandedCall === call.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-3 space-y-2"
                            >
                              {call.args && Object.keys(call.args).length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-gray-700 mb-1">Arguments:</p>
                                  <div className="bg-white/50 p-2 rounded text-xs font-mono">
                                    {JSON.stringify(call.args, null, 2)}
                                  </div>
                                </div>
                              )}
                              <div>
                                <p className="text-xs font-semibold text-gray-700 mb-1">Output:</p>
                                <div className="bg-white/50 p-2 rounded text-xs">
                                  {call.output}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}