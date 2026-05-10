import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Copy, FileText, Zap, Send, Settings, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/components/ui/use-toast";
import { apiClient } from "@/apis/client";
import { motion, AnimatePresence } from "framer-motion";

const OPERATIONS = [
  { value: 'beam_summary', label: '⚡ Beam Results Summary', prompt: 'Analyze these parallel AI responses from different models and provide a comprehensive summary highlighting key insights, differences, and consensus points', beamOnly: true },
  { value: 'summarize', label: 'Summarize', prompt: 'Provide a concise 2-3 sentence summary of this conversation' },
  { value: 'explain', label: 'Explain', prompt: 'Explain the key concepts and ideas discussed in this conversation in clear, simple terms' },
  { value: 'extend', label: 'Extend', prompt: 'Extend the ideas in this conversation with additional insights, examples, and related concepts' },
  { value: 'condense', label: 'Condense', prompt: 'Condense this conversation to its absolute essentials in the most compact form possible' },
  { value: 'simplify', label: 'Simplify', prompt: 'Simplify the concepts in this conversation into easy-to-understand language suitable for a general audience' },
  { value: 'organize', label: 'Organize', prompt: 'Organize the topics and ideas from this conversation into a logical, structured format' },
  { value: 'breakdown', label: 'Break Down', prompt: 'Break down the complex ideas in this conversation into smaller, manageable components' },
  { value: 'outline', label: 'Outline', prompt: 'Create a hierarchical outline of the main topics, subtopics, and key points from this conversation' },
  { value: 'synthesize', label: 'Synthesize', prompt: 'Synthesize the various ideas in this conversation into a cohesive, unified perspective' },
  { value: 'integrate', label: 'Integrate', prompt: 'Integrate the different viewpoints and concepts from this conversation into a comprehensive understanding' },
  { value: 'decompose', label: 'Decompose', prompt: 'Decompose this conversation into its fundamental elements and analyze each component' },
  { value: 'interpret', label: 'Interpret', prompt: 'Interpret the meaning and implications of what was discussed in this conversation' },
  { value: 'analyze', label: 'Analyze', prompt: 'Analyze the conversation, identifying patterns, relationships, and deeper insights' },
  { value: 'adapt', label: 'Adapt', prompt: 'Adapt the concepts from this conversation to different contexts and use cases' },
  { value: 'modify', label: 'Modify', prompt: 'Modify and enhance the ideas from this conversation with improvements and alternatives' },
  { value: 'refine', label: 'Refine', prompt: 'Refine the concepts in this conversation, making them more precise and well-defined' },
  { value: 'transform', label: 'Transform', prompt: 'Transform the ideas in this conversation into actionable frameworks and methodologies' },
  { value: 'bullets', label: 'Bullet Points', prompt: 'Summarize this conversation as clear, concise bullet points' },
  { value: 'actionable', label: 'Action Items', prompt: 'Extract actionable insights, next steps, and recommendations from this conversation' },
  { value: 'detailed', label: 'Detailed Report', prompt: 'Provide a detailed, comprehensive report covering all aspects of this conversation including main topics, key points, insights, and conclusions' }
];

export default function ChatSummarizer({ messages, sessionName, onSendToOllama, onAppendToChat, beamResponses }) {
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [operationType, setOperationType] = useState('summarize');
  const [summaryLength, setSummaryLength] = useState('medium');
  const [focusTopics, setFocusTopics] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { toast } = useToast();

  // Detect if we have beam results
  const hasBeamResults = beamResponses && beamResponses.length > 1;

  // Listen for beam-specific voice commands
  React.useEffect(() => {
    const handleBeamCompare = (e) => {
      setOperationType('beam_summary');
      if (e.detail?.prompt) {
        setFocusTopics(e.detail.prompt);
      }
      processConversation('beam_summary');
    };

    const handleBeamFindBest = () => {
      // Trigger best response analysis
      if (hasBeamResults) {
        toast({
          title: "Best Response Analysis",
          description: "Use the Beam Analyzer in the Beam dialog",
          variant: "default"
        });
      }
    };

    const handleBeamFollowUp = () => {
      // Trigger follow-up generation
      if (hasBeamResults) {
        toast({
          title: "Follow-up Questions",
          description: "Use the Beam Analyzer in the Beam dialog",
          variant: "default"
        });
      }
    };

    window.addEventListener('beamCompare', handleBeamCompare);
    window.addEventListener('beamFindBest', handleBeamFindBest);
    window.addEventListener('beamFollowUp', handleBeamFollowUp);

    return () => {
      window.removeEventListener('beamCompare', handleBeamCompare);
      window.removeEventListener('beamFindBest', handleBeamFindBest);
      window.removeEventListener('beamFollowUp', handleBeamFollowUp);
    };
  }, [hasBeamResults]);

  const processConversation = async (type = operationType) => {
    // Handle beam results processing
    if (type === 'beam_summary' && hasBeamResults) {
      setIsSummarizing(true);
      setOperationType(type);

      try {
        const beamText = beamResponses.map(r => 
          `[Model: ${r.model}]\n${r.content}\n`
        ).join('\n---\n\n');

        const operation = OPERATIONS.find(op => op.value === type);
        let enhancedPrompt = operation.prompt;
        
        if (summaryLength === 'short') {
          enhancedPrompt += '. Keep it brief (2-3 sentences)';
        } else if (summaryLength === 'detailed') {
          enhancedPrompt += '. Provide a comprehensive analysis comparing all perspectives';
        }
        
        if (focusTopics.trim()) {
          enhancedPrompt += `. Focus specifically on: ${focusTopics}`;
        }

        const prompt = `${enhancedPrompt}:\n\n${beamText}`;

        const { data: result } = await apiClient.functions.invoke('invokeLLMWithLogging', {
          prompt,
          source_tool: 'beam_summarizer',
          request_metadata: {
            operation_type: type,
            beam_model_count: beamResponses.length,
            summary_length: summaryLength
          }
        });
        
        setSummary(result);
        toast({
          title: "Beam Summary Generated",
          description: `Analyzed ${beamResponses.length} model responses`
        });
      } catch (error) {
        toast({
          title: "Processing Failed",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setIsSummarizing(false);
      }
      return;
    }

    if (!messages || messages.length === 0) {
      toast({ title: "No Messages", description: "No conversation to process", variant: "destructive" });
      return;
    }

    setIsSummarizing(true);
    setOperationType(type);

    try {
      const conversationText = messages.map(m => `${m.role}: ${m.content}`).join('\n');
      const operation = OPERATIONS.find(op => op.value === type);
      
      // Build enhanced prompt with length and focus
      let enhancedPrompt = operation.prompt;
      
      // Add length instruction
      if (summaryLength === 'short') {
        enhancedPrompt += '. Keep it brief (1-2 sentences)';
      } else if (summaryLength === 'detailed') {
        enhancedPrompt += '. Provide a comprehensive and detailed analysis';
      }
      
      // Add focus topics if specified
      if (focusTopics.trim()) {
        enhancedPrompt += `. Focus specifically on these topics: ${focusTopics}`;
      }
      
      const prompt = `${enhancedPrompt}:\n\n${conversationText}`;

      const { data: result } = await apiClient.functions.invoke('invokeLLMWithLogging', {
        prompt,
        source_tool: 'voice_chat_summarizer',
        request_metadata: {
          operation_type: type,
          message_count: messages.length,
          summary_length: summaryLength,
          has_focus_topics: !!focusTopics.trim()
        }
      });
      setSummary(result);

      toast({
        title: `${operation.label} Generated`,
        description: "Conversation processed successfully"
      });
    } catch (error) {
      const errorMsg = error?.message || error?.toString() || 'Processing failed';
      console.error('Processing error:', errorMsg, error);
      toast({
        title: "Processing Failed",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  const regenerateSummary = () => {
    if (summary) {
      processConversation();
    }
  };

  const copySummary = () => {
    navigator.clipboard.writeText(summary);
    toast({ title: "Copied", description: "Summary copied to clipboard" });
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {hasBeamResults && (
          <Alert className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300">
            <Zap className="h-4 w-4 text-indigo-600" />
            <AlertDescription className="text-sm">
              <strong>Beam results detected!</strong> {beamResponses.length} model responses available for analysis.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={operationType} onValueChange={setOperationType} disabled={isSummarizing}>
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="Select operation" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {OPERATIONS.filter(op => !op.beamOnly || (op.beamOnly && hasBeamResults)).map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => processConversation(operationType)}
            disabled={isSummarizing || !messages || messages.length === 0}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 w-full sm:w-auto"
          >
            {isSummarizing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate
              </>
            )}
          </Button>
        </div>

        {/* Advanced Options */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <Settings className="w-4 h-4 mr-2" />
              Advanced Options
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-3">
            <div className="space-y-2">
              <Label>Summary Length</Label>
              <Select value={summaryLength} onValueChange={setSummaryLength}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short (1-2 sentences)</SelectItem>
                  <SelectItem value="medium">Medium (standard)</SelectItem>
                  <SelectItem value="detailed">Detailed (comprehensive)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Focus on Specific Topics (optional)</Label>
              <Input
                placeholder="e.g., pricing, technical details, decisions"
                value={focusTopics}
                onChange={(e) => setFocusTopics(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Enter topics or entities to focus the summary on
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <AnimatePresence>
          {summary && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <Label>{OPERATIONS.find(op => op.value === operationType)?.label || 'Result'}</Label>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={regenerateSummary}
                    disabled={isSummarizing}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                  {onAppendToChat && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        onAppendToChat(summary);
                        toast({ title: "Appended", description: "Summary added to input" });
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Append
                    </Button>
                  )}
                  {onSendToOllama && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        onSendToOllama(summary);
                        toast({ title: "Sent to Chat", description: "Summary sent to Ollama" });
                      }}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={copySummary}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>
              <Textarea
                value={summary}
                readOnly
                rows={8}
                className="bg-purple-50 border-purple-200"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {!hasBeamResults && messages && messages.length > 0 && (
          <Alert className="bg-gray-50 border-gray-200">
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <strong>{messages.length} messages</strong> ready to process
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
