import React from 'react';
import { Wrench, Plus, Trash2, ToggleLeft, ToggleRight, ChevronDown, ChevronUp, Calculator, Clock, Search, Hash, Type, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';

const BUILT_IN_TOOLS = [
  {
    name: 'calculator',
    description: 'Perform mathematical calculations',
    icon: Calculator,
    parameters: {
      type: 'object',
      properties: {
        expression: { type: 'string', description: 'Math expression to evaluate' }
      },
      required: ['expression']
    }
  },
  {
    name: 'get_current_time',
    description: 'Get the current time',
    icon: Clock,
    parameters: {
      type: 'object',
      properties: {
        timezone: { type: 'string', description: 'Timezone (default: UTC)' }
      }
    }
  },
  {
    name: 'web_search',
    description: 'Search the web for information',
    icon: Search,
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' }
      },
      required: ['query']
    }
  },
  {
    name: 'random_number',
    description: 'Generate a random number',
    icon: Hash,
    parameters: {
      type: 'object',
      properties: {
        min: { type: 'number', description: 'Minimum value' },
        max: { type: 'number', description: 'Maximum value' }
      }
    }
  },
  {
    name: 'string_transform',
    description: 'Transform text (uppercase, lowercase, reverse, etc.)',
    icon: Type,
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to transform' },
        operation: { type: 'string', description: 'Operation: uppercase, lowercase, reverse, length, word_count' }
      },
      required: ['text', 'operation']
    }
  },
  {
    name: 'validate_json',
    description: 'Validate JSON string',
    icon: FileJson,
    parameters: {
      type: 'object',
      properties: {
        json_string: { type: 'string', description: 'JSON string to validate' }
      },
      required: ['json_string']
    }
  }
];

export default function ToolsPanel({ enabledTools, onToggleTool, customTools, onAddTool, onRemoveTool }) {
  const [expanded, setExpanded] = React.useState(true);
  const [showAddTool, setShowAddTool] = React.useState(false);
  const [newTool, setNewTool] = React.useState({ name: '', description: '', parameters: '{}' });

  const handleAddTool = () => {
    if (newTool.name && newTool.description) {
      onAddTool({
        name: newTool.name,
        description: newTool.description,
        parameters: JSON.parse(newTool.parameters || '{}'),
        enabled: true
      });
      setNewTool({ name: '', description: '', parameters: '{}' });
      setShowAddTool(false);
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Wrench className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-zinc-200">Function Tools</p>
            <p className="text-xs text-zinc-500">{enabledTools.length} enabled</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-zinc-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-500" />
        )}
      </button>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ScrollArea className="max-h-64">
              <div className="p-4 pt-0 space-y-2">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                  Built-in Tools
                </p>
                {BUILT_IN_TOOLS.map((tool) => {
                  const Icon = tool.icon;
                  const isEnabled = enabledTools.includes(tool.name);
                  return (
                    <div
                      key={tool.name}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        isEnabled 
                          ? 'bg-amber-500/5 border-amber-500/20' 
                          : 'bg-zinc-800/30 border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isEnabled ? 'bg-amber-500/20' : 'bg-zinc-800'
                        }`}>
                          <Icon className={`w-3.5 h-3.5 ${isEnabled ? 'text-amber-400' : 'text-zinc-500'}`} />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${isEnabled ? 'text-amber-300' : 'text-zinc-400'}`}>
                            {tool.name}
                          </p>
                          <p className="text-xs text-zinc-500 truncate max-w-[180px]">
                            {tool.description}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() => onToggleTool(tool.name)}
                        className="data-[state=checked]:bg-amber-500"
                      />
                    </div>
                  );
                })}
                
                {customTools && customTools.length > 0 && (
                  <>
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-4 mb-3">
                      Custom Tools
                    </p>
                    {customTools.map((tool, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg bg-violet-500/5 border border-violet-500/20"
                      >
                        <div>
                          <p className="text-sm font-medium text-violet-300">{tool.name}</p>
                          <p className="text-xs text-zinc-500">{tool.description}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveTool(idx)}
                          className="h-7 w-7 text-zinc-500 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </>
                )}
                
                <AnimatePresence>
                  {showAddTool && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-3 pt-3 border-t border-zinc-800"
                    >
                      <Input
                        placeholder="Tool name"
                        value={newTool.name}
                        onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
                        className="bg-zinc-800 border-zinc-700 text-zinc-300"
                      />
                      <Input
                        placeholder="Description"
                        value={newTool.description}
                        onChange={(e) => setNewTool({ ...newTool, description: e.target.value })}
                        className="bg-zinc-800 border-zinc-700 text-zinc-300"
                      />
                      <Textarea
                        placeholder='Parameters JSON (e.g., {"type": "object", "properties": {...}})'
                        value={newTool.parameters}
                        onChange={(e) => setNewTool({ ...newTool, parameters: e.target.value })}
                        className="bg-zinc-800 border-zinc-700 text-zinc-300 h-20 font-mono text-xs"
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleAddTool} className="flex-1 bg-violet-500 hover:bg-violet-600">
                          Add Tool
                        </Button>
                        <Button variant="outline" onClick={() => setShowAddTool(false)} className="border-zinc-700 text-zinc-400">
                          Cancel
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {!showAddTool && (
                  <Button
                    variant="outline"
                    onClick={() => setShowAddTool(true)}
                    className="w-full mt-2 border-dashed border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Custom Tool
                  </Button>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { BUILT_IN_TOOLS };