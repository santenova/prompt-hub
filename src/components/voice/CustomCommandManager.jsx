import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Plus, X, Edit2, Save, Trash2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const AVAILABLE_ACTIONS = [
  { value: 'enhance', label: 'Enhance Prompt' },
  { value: 'clear', label: 'Clear Text' },
  { value: 'save_template', label: 'Save as Template' },
  { value: 'create_persona', label: 'Create Persona' },
  { value: 'copy', label: 'Copy to Clipboard' },
  { value: 'play', label: 'Play Text-to-Speech' },
  { value: 'stop', label: 'Stop Playback' },
  { value: 'new_chat', label: 'Start New Chat' },
  { value: 'clear_chat', label: 'Clear Current Chat' },
  { value: 'show_history', label: 'Show Chat History' },
  { value: 'summarize', label: 'Summarize Conversation' },
  { value: 'goto_templates', label: 'Go to Templates' },
  { value: 'goto_personas', label: 'Go to Personas' },
  { value: 'goto_tools', label: 'Go to Tools' },
];

export default function CustomCommandManager({ onCommandsChange }) {
  const [customCommands, setCustomCommands] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('voice_custom_commands') || '[]');
    } catch { return []; }
  });

  const [wakeWords, setWakeWords] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('voice_wake_words') || '["hey assistant", "hello computer", "voice command"]');
    } catch { return ["hey assistant", "hello computer", "voice command"]; }
  });

  const [editingCommand, setEditingCommand] = useState(null);
  const [newCommand, setNewCommand] = useState({ trigger: '', actions: [], description: '' });
  const [newWakeWord, setNewWakeWord] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem('voice_custom_commands', JSON.stringify(customCommands));
    if (onCommandsChange) onCommandsChange(customCommands);
  }, [customCommands]);

  useEffect(() => {
    localStorage.setItem('voice_wake_words', JSON.stringify(wakeWords));
  }, [wakeWords]);

  const addCommand = () => {
    if (!newCommand.trigger.trim() || newCommand.actions.length === 0) {
      toast({
        title: "Invalid Command",
        description: "Please provide a trigger phrase and at least one action",
        variant: "destructive"
      });
      return;
    }

    const command = {
      id: Date.now().toString(),
      trigger: newCommand.trigger.trim().toLowerCase(),
      actions: newCommand.actions,
      description: newCommand.description.trim(),
      createdAt: new Date().toISOString()
    };

    setCustomCommands(prev => [...prev, command]);
    setNewCommand({ trigger: '', actions: [], description: '' });
    
    toast({
      title: "Command Added",
      description: `"${command.trigger}" will trigger ${command.actions.length} action(s)`
    });
  };

  const updateCommand = () => {
    if (!editingCommand) return;

    setCustomCommands(prev =>
      prev.map(cmd =>
        cmd.id === editingCommand.id ? editingCommand : cmd
      )
    );

    setEditingCommand(null);
    toast({ title: "Command Updated" });
  };

  const deleteCommand = (id) => {
    setCustomCommands(prev => prev.filter(cmd => cmd.id !== id));
    toast({ title: "Command Deleted" });
  };

  const addWakeWord = () => {
    if (!newWakeWord.trim()) return;

    const word = newWakeWord.trim().toLowerCase();
    if (wakeWords.includes(word)) {
      toast({
        title: "Duplicate",
        description: "This wake word already exists",
        variant: "destructive"
      });
      return;
    }

    setWakeWords(prev => [...prev, word]);
    setNewWakeWord('');
    toast({ title: "Wake Word Added", description: `"${word}" will activate listening` });
  };

  const removeWakeWord = (word) => {
    if (wakeWords.length === 1) {
      toast({
        title: "Cannot Remove",
        description: "You need at least one wake word",
        variant: "destructive"
      });
      return;
    }

    setWakeWords(prev => prev.filter(w => w !== word));
    toast({ title: "Wake Word Removed" });
  };

  const addActionToCommand = (action) => {
    if (editingCommand) {
      setEditingCommand(prev => ({
        ...prev,
        actions: [...prev.actions, action]
      }));
    } else {
      setNewCommand(prev => ({
        ...prev,
        actions: [...prev.actions, action]
      }));
    }
  };

  const removeActionFromCommand = (index) => {
    if (editingCommand) {
      setEditingCommand(prev => ({
        ...prev,
        actions: prev.actions.filter((_, i) => i !== index)
      }));
    } else {
      setNewCommand(prev => ({
        ...prev,
        actions: prev.actions.filter((_, i) => i !== index)
      }));
    }
  };

  const getActionLabel = (actionValue) => {
    return AVAILABLE_ACTIONS.find(a => a.value === actionValue)?.label || actionValue;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-600" />
          Custom Voice Commands
        </CardTitle>
        <CardDescription>
          Define your own voice commands and wake words for hands-free control
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Wake Words Section */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Wake Words</h3>
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-xs">
              Say any wake word followed by your command (e.g., "hey assistant, enhance prompt")
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-wrap gap-2">
            {wakeWords.map((word, idx) => (
              <Badge key={idx} className="pl-3 pr-1 py-1.5 bg-purple-100 text-purple-700">
                "{word}"
                <button
                  onClick={() => removeWakeWord(word)}
                  className="ml-2 hover:bg-purple-300 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="e.g., computer, jarvis, assistant"
              value={newWakeWord}
              onChange={(e) => setNewWakeWord(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addWakeWord()}
            />
            <Button onClick={addWakeWord} variant="outline" disabled={!newWakeWord.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Custom Commands Section */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Custom Commands ({customCommands.length})</h3>
          
          <ScrollArea className="h-[200px] rounded border p-3">
            {customCommands.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No custom commands yet. Create one below!
              </p>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {customCommands.map((cmd) => (
                    <motion.div
                      key={cmd.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="p-3 rounded-lg border bg-gray-50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">"{cmd.trigger}"</p>
                          {cmd.description && (
                            <p className="text-xs text-gray-600 mt-1">{cmd.description}</p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {cmd.actions.map((action, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {idx + 1}. {getActionLabel(action)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingCommand(cmd)}
                            className="h-7 w-7 p-0"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCommand(cmd.id)}
                            className="h-7 w-7 p-0 text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Add/Edit Command Form */}
        <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
          <h4 className="font-medium text-sm">
            {editingCommand ? 'Edit Command' : 'Add New Command'}
          </h4>
          
          <div className="space-y-2">
            <Label>Trigger Phrase</Label>
            <Input
              placeholder="e.g., quick save, prepare report, smart enhance"
              value={editingCommand?.trigger || newCommand.trigger}
              onChange={(e) => {
                if (editingCommand) {
                  setEditingCommand({ ...editingCommand, trigger: e.target.value });
                } else {
                  setNewCommand({ ...newCommand, trigger: e.target.value });
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Input
              placeholder="What does this command do?"
              value={editingCommand?.description || newCommand.description}
              onChange={(e) => {
                if (editingCommand) {
                  setEditingCommand({ ...editingCommand, description: e.target.value });
                } else {
                  setNewCommand({ ...newCommand, description: e.target.value });
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Actions (in order)</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(editingCommand?.actions || newCommand.actions).map((action, idx) => (
                <Badge key={idx} className="pl-3 pr-1 py-1.5 bg-indigo-100 text-indigo-700">
                  {idx + 1}. {getActionLabel(action)}
                  <button
                    onClick={() => removeActionFromCommand(idx)}
                    className="ml-2 hover:bg-indigo-300 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Select onValueChange={addActionToCommand}>
              <SelectTrigger>
                <SelectValue placeholder="Add action to chain" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_ACTIONS.map((action) => (
                  <SelectItem key={action.value} value={action.value}>
                    {action.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Actions will execute in order. Example: "enhance" → "save_template" → "clear"
            </p>
          </div>

          <div className="flex gap-2">
            {editingCommand ? (
              <>
                <Button onClick={updateCommand} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  Update Command
                </Button>
                <Button onClick={() => setEditingCommand(null)} variant="outline">
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={addCommand} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Command
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}