import React, { useState, useEffect } from "react";
import { Settings, Cpu, Cloud, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AIProviderSettings({ currentProvider, onProviderChange, ollamaConfig, onOllamaConfigChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [localConfig, setLocalConfig] = useState(ollamaConfig);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    setLocalConfig(ollamaConfig);
  }, [ollamaConfig]);

  const handleSave = () => {
    onOllamaConfigChange(localConfig);
    setIsOpen(false);
  };

  const testOllamaConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    
    try {
      const baseUrl = localConfig.url.replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/v1/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const count = data.data?.length || 0;
        setTestResult({ 
          success: true, 
          message: `Connected! Found ${count} model${count !== 1 ? 's' : ''}.` 
        });
      } else {
        setTestResult({ 
          success: false, 
          message: `Connection failed: ${response.status} ${response.statusText}` 
        });
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: `Connection error: ${error.message}` 
      });
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="hover:bg-purple-50">
          <Settings className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>AI Provider Settings</SheetTitle>
          <SheetDescription>
            Choose between cloud-based AI or a custom OpenAI-compatible endpoint
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Provider Selection */}
          <div className="space-y-3">
            <Label>AI Provider</Label>
            
            <div 
              className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                currentProvider === 'cloud' 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onProviderChange('cloud')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                  <Cloud className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold">Cloud AI</div>
                  <div className="text-sm text-gray-600">Base44 / OpenAI</div>
                </div>
              </div>
              {currentProvider === 'cloud' && (
                <Check className="w-5 h-5 text-purple-600" />
              )}
            </div>

            <div 
              className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                currentProvider === 'ollama' 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onProviderChange('ollama')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold">Custom Endpoint</div>
                  <div className="text-sm text-gray-600">OpenAI-compatible API / Proxy</div>
                </div>
              </div>
              {currentProvider === 'ollama' && (
                <Check className="w-5 h-5 text-purple-600" />
              )}
            </div>
          </div>

          {/* Custom Endpoint Configuration */}
          {currentProvider === 'ollama' && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-sm">Endpoint Configuration</h3>
              
              <div className="space-y-2">
                <Label htmlFor="ollama-url">Base URL</Label>
                <Input
                  id="ollama-url"
                  type="text"
                  value={localConfig.url}
                  onChange={(e) => setLocalConfig({ ...localConfig, url: e.target.value })}
                  placeholder="/proxy"
                />
                <p className="text-xs text-gray-500">
                  Calls <code>/v1/chat/completions</code> on this base URL
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ollama-model">Model</Label>
                <Input
                  id="ollama-model"
                  type="text"
                  value={localConfig.model}
                  onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
                  placeholder="gpt-3.5-turbo, gpt-4, etc."
                />
                <p className="text-xs text-gray-500">
                  Model name supported by your endpoint
                </p>
              </div>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={testOllamaConnection}
                disabled={testingConnection}
              >
                {testingConnection ? "Testing..." : "Test Connection"}
              </Button>

              {testResult && (
                <Alert className={testResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                  <AlertDescription className={testResult.success ? "text-green-800" : "text-red-800"}>
                    {testResult.message}
                  </AlertDescription>
                </Alert>
              )}

              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-sm text-blue-800">
                  Any OpenAI-compatible endpoint works here — local proxies, self-hosted models, or third-party APIs that follow the <code>/v1/chat/completions</code> standard.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <Button 
            onClick={handleSave} 
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
          >
            Save Settings
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}