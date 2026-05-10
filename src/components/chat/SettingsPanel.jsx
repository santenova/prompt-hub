import React from 'react';
import { Settings, Server, Thermometer, FileText, Moon, Sun, Save, X, Zap, Shield, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/apis/client';

export default function SettingsPanel({ settings, onUpdateSettings, onClose }) {
  const [localSettings, setLocalSettings] = React.useState(settings);
  const [testResult, setTestResult] = React.useState(null);
  const [isTesting, setIsTesting] = React.useState(false);

  const handleSave = () => {
    onUpdateSettings(localSettings);
    onClose();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const response = await apiClient.functions.invoke('ollamaProxy', {
        endpoint: localSettings.ollama_endpoint || 'http://localhost:11434',
        action: 'test-connection'
      });
      
      setTestResult(response.data);
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error: ${error.message}`,
        endpoint: localSettings.ollama_endpoint
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Settings</h2>
              <p className="text-sm text-zinc-500">Configure your Ollama connection</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Connection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <Server className="w-4 h-4 text-emerald-400" />
              Connection
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-zinc-500">Ollama Endpoint</Label>
              <div className="flex gap-2">
                <Input
                  value={localSettings.ollama_endpoint || 'http://localhost:11434'}
                  onChange={(e) => {
                    setLocalSettings({ ...localSettings, ollama_endpoint: e.target.value });
                    setTestResult(null);
                  }}
                  placeholder="http://localhost:11434"
                  className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-300 focus:border-emerald-500"
                />
                <Button
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  variant="outline"
                  className="border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-emerald-500"
                >
                  {isTesting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Test'
                  )}
                </Button>
              </div>
              
              <AnimatePresence>
                {testResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex items-start gap-2 p-3 rounded-lg border ${
                      testResult.success
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        testResult.success ? 'text-emerald-300' : 'text-red-300'
                      }`}>
                        {testResult.message}
                      </p>
                      {testResult.version && (
                        <p className="text-xs text-zinc-500 mt-1">
                          Ollama version: {testResult.version}
                        </p>
                      )}
                      {!testResult.success && (
                        <p className="text-xs text-zinc-500 mt-1">
                          Make sure Ollama is running: <code className="text-zinc-400">ollama serve</code>
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <p className="text-xs text-zinc-600">
                Use proxy to bypass CORS: requests go through server
              </p>
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-zinc-300">Use CORS Proxy</span>
              </div>
              <Switch
                checked={localSettings.proxy_enabled !== false}
                onCheckedChange={(checked) => setLocalSettings({ ...localSettings, proxy_enabled: checked })}
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>
          </div>
          
          {/* Model Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <Zap className="w-4 h-4 text-amber-400" />
              Model Parameters
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs text-zinc-500">Temperature</Label>
                  <span className="text-xs text-emerald-400 font-mono">
                    {localSettings.temperature || 0.7}
                  </span>
                </div>
                <Slider
                  value={[localSettings.temperature || 0.7]}
                  onValueChange={([v]) => setLocalSettings({ ...localSettings, temperature: v })}
                  min={0}
                  max={2}
                  step={0.1}
                  className="[&_[role=slider]]:bg-emerald-500"
                />
                <p className="text-xs text-zinc-600">Higher = more creative, Lower = more focused</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs text-zinc-500">Top P</Label>
                  <span className="text-xs text-emerald-400 font-mono">
                    {localSettings.top_p || 0.9}
                  </span>
                </div>
                <Slider
                  value={[localSettings.top_p || 0.9]}
                  onValueChange={([v]) => setLocalSettings({ ...localSettings, top_p: v })}
                  min={0}
                  max={1}
                  step={0.05}
                  className="[&_[role=slider]]:bg-emerald-500"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs text-zinc-500">Max Tokens</Label>
                  <span className="text-xs text-emerald-400 font-mono">
                    {localSettings.max_tokens || 2048}
                  </span>
                </div>
                <Slider
                  value={[localSettings.max_tokens || 2048]}
                  onValueChange={([v]) => setLocalSettings({ ...localSettings, max_tokens: v })}
                  min={256}
                  max={8192}
                  step={256}
                  className="[&_[role=slider]]:bg-emerald-500"
                />
              </div>
            </div>
          </div>
          
          {/* System Prompt */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <FileText className="w-4 h-4 text-violet-400" />
              Default System Prompt
            </div>
            <Textarea
              value={localSettings.default_system_prompt || ''}
              onChange={(e) => setLocalSettings({ ...localSettings, default_system_prompt: e.target.value })}
              placeholder="You are a helpful AI assistant..."
              className="bg-zinc-800 border-zinc-700 text-zinc-300 min-h-[100px] focus:border-violet-500"
            />
          </div>
          
          {/* Default Model */}
          <div className="space-y-3">
            <Label className="text-xs text-zinc-500">Default Model</Label>
            <Input
              value={localSettings.default_model || ''}
              onChange={(e) => setLocalSettings({ ...localSettings, default_model: e.target.value })}
              placeholder="llama3.2"
              className="bg-zinc-800 border-zinc-700 text-zinc-300"
            />
          </div>
        </div>
        
        <div className="flex gap-3 p-6 border-t border-zinc-800 bg-zinc-900/50">
          <Button variant="outline" onClick={onClose} className="flex-1 border-zinc-700 text-zinc-400 hover:text-zinc-200">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400">
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
