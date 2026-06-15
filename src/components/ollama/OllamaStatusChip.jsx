import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, Loader2, RefreshCw } from 'lucide-react';
import { getOllamaEndpoint } from '@/lib/ollamaEndpoint';

/**
 * Auto-tests the configured Ollama endpoint on mount and shows a connection status chip.
 * Place near any AI Generate button to give users a heads-up before they try.
 */
export default function OllamaStatusChip({ className = '' }) {
  const [status, setStatus] = useState('checking'); // 'checking' | 'ok' | 'error'
  const [modelCount, setModelCount] = useState(0);

  const test = async () => {
    setStatus('checking');
    try {
      const base = getOllamaEndpoint();
      const res = await fetch(`${base}/v1/models`, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error('non-ok');
      const data = await res.json();
      setModelCount((data.data || []).length);
      setStatus('ok');
    } catch {
      setStatus('error');
    }
  };

  useEffect(() => { test(); }, []);

  if (status === 'checking') {
    return (
      <Badge variant="outline" className={`gap-1 text-xs text-gray-500 border-gray-300 ${className}`}>
        <Loader2 className="w-3 h-3 animate-spin" />
        Checking Ollama…
      </Badge>
    );
  }

  if (status === 'ok') {
    return (
      <Badge className={`gap-1 text-xs bg-green-100 text-green-700 border border-green-300 hover:bg-green-100 ${className}`}>
        <Wifi className="w-3 h-3" />
        Ollama connected · {modelCount} model{modelCount !== 1 ? 's' : ''}
      </Badge>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Badge className="gap-1 text-xs bg-red-100 text-red-700 border border-red-300 hover:bg-red-100">
        <WifiOff className="w-3 h-3" />
        Ollama offline
      </Badge>
      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={test} title="Retry">
        <RefreshCw className="w-3 h-3 text-gray-500" />
      </Button>
    </div>
  );
}