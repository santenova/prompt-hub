import React, { useState } from 'react';
import { Activity, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { apiClient } from '@/apis/client';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConnectionTestButton({ endpoint }) {
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const response = await apiClient.functions.invoke('ollamaProxy', {
        endpoint: endpoint || 'http://localhost:11434',
        action: 'test-connection'
      });
      
      setTestResult(response.data);
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error: ${error.message}`,
        endpoint: endpoint
      });
    } finally {
      setIsTesting(false);
    }
  };

  React.useEffect(() => {
    if (open && !testResult && !isTesting) {
      handleTest();
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-zinc-500 hover:text-zinc-300"
        >
          <Activity className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-80 bg-zinc-900/95 backdrop-blur-xl border-zinc-800 rounded-xl shadow-2xl p-4"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-200">Connection Test</h3>
            <Button
              onClick={handleTest}
              disabled={isTesting}
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-zinc-400 hover:text-zinc-200"
            >
              {isTesting ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
              ) : (
                'Retest'
              )}
            </Button>
          </div>
          
          <div className="text-xs text-zinc-500 font-mono bg-zinc-800/50 px-2 py-1.5 rounded">
            {endpoint || 'http://localhost:11434'}
          </div>

          <AnimatePresence mode="wait">
            {isTesting ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center py-6"
              >
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                  <p className="text-sm text-zinc-400">Testing connection...</p>
                </div>
              </motion.div>
            ) : testResult ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-3 rounded-lg border ${
                  testResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <div className="flex items-start gap-2">
                  {testResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${
                      testResult.success ? 'text-emerald-300' : 'text-red-300'
                    }`}>
                      {testResult.message}
                    </p>
                    {testResult.version && (
                      <p className="text-xs text-zinc-500 mt-2">
                        <span className="text-zinc-400">Version:</span> {testResult.version}
                      </p>
                    )}
                    {testResult.success && (
                      <div className="mt-2 pt-2 border-t border-emerald-500/20">
                        <p className="text-xs text-emerald-400 font-medium">✓ Ollama is running</p>
                        <p className="text-xs text-zinc-500 mt-1">✓ API is accessible</p>
                        <p className="text-xs text-zinc-500">✓ Proxy is working</p>
                      </div>
                    )}
                    {!testResult.success && (
                      <div className="mt-2 pt-2 border-t border-red-500/20">
                        <p className="text-xs text-zinc-400 font-medium">Troubleshooting:</p>
                        <ul className="text-xs text-zinc-500 mt-1 space-y-1 list-disc list-inside">
                          <li>Start Ollama: <code className="text-zinc-400">ollama serve</code></li>
                          <li>Check endpoint URL in settings</li>
                          <li>Verify Ollama is listening on port 11434</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="initial"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-6"
              >
                <p className="text-sm text-zinc-500">Click test to check connection</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PopoverContent>
    </Popover>
  );
}
