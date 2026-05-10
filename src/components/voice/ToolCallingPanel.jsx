import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Wrench, Settings, Info, Calculator, Calendar, MapPin, Cloud, TestTube, List, PlayCircle, Search } from "lucide-react";
import ToolConfigManager from '../tools/ToolConfigManager';
import ToolExecutionPanel from '../tools/ToolExecutionPanel';

const availableTools = [
  { 
    name: 'addNumbers', 
    label: 'Add Numbers', 
    icon: Calculator, 
    description: 'Add two numbers together',
    category: 'Math',
    enabled: true
  },
  { 
    name: 'subtractNumbers', 
    label: 'Subtract Numbers', 
    icon: Calculator, 
    description: 'Subtract two numbers',
    category: 'Math',
    enabled: true
  },
  { 
    name: 'multiplyNumbers', 
    label: 'Multiply Numbers', 
    icon: Calculator, 
    description: 'Multiply two numbers',
    category: 'Math',
    enabled: true
  },
  { 
    name: 'getCurrentTime', 
    label: 'Get Current Time', 
    icon: Calendar, 
    description: 'Get the current date and time',
    category: 'Utility',
    enabled: true
  },
  { 
    name: 'getWeather', 
    label: 'Get Weather', 
    icon: Cloud, 
    description: 'Get weather information (mock)',
    category: 'Utility',
    enabled: false
  },
  { 
    name: 'runTest', 
    label: 'Run Test', 
    icon: TestTube, 
    description: 'Execute a specific test case by ID',
    category: 'Testing',
    enabled: true
  },
  { 
    name: 'listTests', 
    label: 'List Tests', 
    icon: List, 
    description: 'List all available test cases',
    category: 'Testing',
    enabled: true
  },
  { 
    name: 'runAllTests', 
    label: 'Run All Tests', 
    icon: PlayCircle, 
    description: 'Run all tests for a prompt',
    category: 'Testing',
    enabled: true
  },
  { 
    name: 'searchWeb', 
    label: 'Search Web', 
    icon: Search, 
    description: 'Search the web for information',
    category: 'Utility',
    enabled: true
  }
];

export default function ToolCallingPanel({ onSettingsChange, currentToolCalls = [], isExecuting = false }) {
  const [toolsEnabled, setToolsEnabled] = useState(() => {
    try {
      return localStorage.getItem('voice_tools_enabled') === 'true';
    } catch { return false; }
  });

  const [enabledTools, setEnabledTools] = useState(() => {
    try {
      const stored = localStorage.getItem('voice_enabled_tools');
      return stored ? JSON.parse(stored) : availableTools.map(t => t.name);
    } catch { return availableTools.map(t => t.name); }
  });

  const [toolExecutionLog, setToolExecutionLog] = useState([]);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    localStorage.setItem('voice_tools_enabled', toolsEnabled);
    if (onSettingsChange) {
      onSettingsChange({ toolsEnabled, enabledTools });
    }
  }, [toolsEnabled, enabledTools]);

  const toggleTool = (toolName) => {
    setEnabledTools(prev => {
      const newTools = prev.includes(toolName)
        ? prev.filter(t => t !== toolName)
        : [...prev, toolName];
      localStorage.setItem('voice_enabled_tools', JSON.stringify(newTools));
      return newTools;
    });
  };

  const addToLog = (entry) => {
    setToolExecutionLog(prev => [entry, ...prev].slice(0, 10));
  };

  // Expose addToLog via ref or callback
  useEffect(() => {
    if (onSettingsChange) {
      onSettingsChange({ toolsEnabled, enabledTools, addToLog });
    }
  }, [toolsEnabled, enabledTools]);

  return (
    <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wrench className="w-4 h-4 text-orange-600" />
            Tool Calling
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConfig(!showConfig)}
              className="h-6 text-xs"
            >
              <Settings className="w-3 h-3 mr-1" />
              {showConfig ? 'Tools' : 'Config'}
            </Button>
            <Switch
              checked={toolsEnabled}
              onCheckedChange={setToolsEnabled}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-3">
        {showConfig ? (
          <ToolConfigManager onToolsChange={(tools) => {}} />
        ) : toolsEnabled ? (
          <div className="h-full flex flex-col">
            <div className="space-y-2 mb-3">
              <Label className="text-xs font-semibold">Available Tools</Label>
              <ScrollArea className="max-h-[200px]">
              <div className="space-y-3">
                {['Math', 'Utility', 'Testing'].map(category => {
                  const categoryTools = availableTools.filter(t => t.category === category);
                  if (categoryTools.length === 0) return null;
                  
                  return (
                    <div key={category}>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{category}</p>
                      <div className="space-y-2">
                        {categoryTools.map((tool) => {
                          const Icon = tool.icon;
                          const isEnabled = enabledTools.includes(tool.name);
                          return (
                            <div
                              key={tool.name}
                              className={`p-2 border rounded-lg transition-all ${
                                isEnabled ? 'border-orange-300 bg-white' : 'border-gray-200 bg-gray-50 opacity-60'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-2 flex-1">
                                  <Icon className={`w-4 h-4 mt-0.5 ${isEnabled ? 'text-orange-600' : 'text-gray-400'}`} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold">{tool.label}</p>
                                    <p className="text-xs text-gray-600 mt-0.5">{tool.description}</p>
                                  </div>
                                </div>
                                <Switch
                                  checked={isEnabled}
                                  onCheckedChange={() => toggleTool(tool.name)}
                                  className="ml-2"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              </ScrollArea>
            </div>

            <div className="flex-1 min-h-0">
              <ToolExecutionPanel 
                toolCalls={currentToolCalls}
                isExecuting={isExecuting}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium mb-1">Tool Calling Disabled</p>
            <p className="text-xs">Enable to allow AI to use functions and tools</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}