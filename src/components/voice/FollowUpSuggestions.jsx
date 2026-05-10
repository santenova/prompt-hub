import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, RefreshCw, Send, Loader2, Sparkles, X, Server } from "lucide-react";
import { apiClient } from "@/apis/client";
import { motion, AnimatePresence } from "framer-motion";
import { getOllamaSettings } from "../utils/ollamaSettings";

export default function FollowUpSuggestions({ messages, onSendMessage, sessionId, autoGenerate = true }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Auto-generate suggestions when NEW messages are added (not on initial load)
    if (autoGenerate && messages.length > lastMessageCount && messages.length >= 2 && lastMessageCount > 0) {
      generateSuggestions();
    }
    setLastMessageCount(messages.length);
  }, [messages.length, autoGenerate]);

  const generateSuggestions = async () => {
    if (messages.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsGenerating(true);
    try {
      // Get last 6 messages for context
      const recentMessages = messages.slice(-6);
      const context = recentMessages.map(m => `${m.role}: ${m.content}`).join('\n');

      // Check if Ollama is configured
      const ollamaSettings = getOllamaSettings();
      const useOllama = ollamaSettings.useOllama && ollamaSettings.selectedEndpoint && ollamaSettings.selectedModel;

      let questions = [];

      if (useOllama) {
        const { data: chatData } = await apiClient.functions.invoke('ollamaProxy', {
          endpoint: ollamaSettings.selectedEndpoint,
          action: 'chat',
          model: ollamaSettings.selectedModel,
          messages: [{
            role: "user",
            content: `Based on this conversation, suggest 3 intelligent follow-up questions the user might want to ask next. 
        
Make them:
- Relevant to the conversation context
- Natural and conversational
- Progressively deeper or broader
- Actionable and specific

Conversation:
${context}

Return ONLY a JSON array of 3 question strings, nothing else.
Example: ["How does this apply to X?", "What are the alternatives?", "Can you explain Y in more detail?"]`
          }],
          options: { stream: false }
        });
        const result = JSON.parse(chatData?.message?.content || '{"suggestions": []}');
        questions = result.suggestions || [];
      } else {
        // Use apiClient AI
        const { data: result } = await apiClient.functions.invoke('invokeLLMWithLogging', {
          prompt: `Based on this conversation, suggest 3 intelligent follow-up questions the user might want to ask next. 
        
Make them:
- Relevant to the conversation context
- Natural and conversational
- Progressively deeper or broader
- Actionable and specific

Conversation:
${context}

Return ONLY a JSON array of 3 question strings, nothing else.
Example: ["How does this apply to X?", "What are the alternatives?", "Can you explain Y in more detail?"]`,
          source_tool: 'voice_chat_suggestions',
          request_metadata: {
            session_id: sessionId,
            message_count: messages.length
          },
          response_json_schema: {
            type: "object",
            properties: {
              suggestions: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        });

        questions = result.suggestions || [];
      }

      setSuggestions(questions);

      // Save to session
      if (sessionId) {
        await apiClient.entities.VoiceChat.update(sessionId, {
          suggested_questions: questions,
          last_suggestion_update: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsGenerating(false);
    }
  };

  if (messages.length < 2 && !isGenerating) {
    return null;
  }

  if (isCollapsed && !isGenerating) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCollapsed(false)}
          className="bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300 hover:bg-yellow-100"
        >
          <Lightbulb className="w-3 h-3 mr-2 text-yellow-600" />
          {suggestions.length > 0 ? `${suggestions.length} Suggestions` : 'Get Suggestions'}
          <Sparkles className="w-3 h-3 ml-2 text-yellow-600" />
        </Button>
      </motion.div>
    );
  }

  const ollamaSettings = getOllamaSettings();
  const useOllama = ollamaSettings.useOllama && ollamaSettings.selectedEndpoint && ollamaSettings.selectedModel;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50 shadow-lg">
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Lightbulb className="w-4 h-4 text-yellow-600" />
              <CardTitle className="text-sm font-semibold">Suggested Questions</CardTitle>
              {suggestions.length > 0 && (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 text-xs">
                  {suggestions.length}
                </Badge>
              )}
              {useOllama && (
                <>
                  <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">🔒 Local</Badge>
                  <Badge className="bg-purple-100 text-purple-700 border-purple-300 text-xs">💰 Free</Badge>
                </>
              )}
              <Badge variant="outline" className={`text-xs ${useOllama ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-purple-100 text-purple-700 border-purple-300'}`}>
                <Server className="w-3 h-3 mr-1" />
                {useOllama ? `Ollama: ${ollamaSettings.selectedModel?.split(':')[0] || 'Local'}` : 'apiClient AI'}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={generateSuggestions}
                disabled={isGenerating}
                className="h-6 w-6"
                title="Refresh suggestions"
              >
                {isGenerating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(true)}
                className="h-6 w-6"
                title="Minimize"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3 pt-2">
          <AnimatePresence mode="popLayout">
            {isGenerating ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-xs text-gray-600 py-3"
              >
                <Sparkles className="w-3 h-3 animate-pulse text-yellow-600" />
                Generating smart suggestions...
              </motion.div>
            ) : suggestions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-gray-500 py-2"
              >
                Keep chatting to get AI-powered suggestions
              </motion.div>
            ) : (
              <div className="space-y-1.5">
                {suggestions.map((suggestion, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <button
                      onClick={() => {
                        onSendMessage(suggestion);
                        setSuggestions(prev => prev.filter((_, i) => i !== idx));
                      }}
                      className="w-full text-left p-2.5 rounded-lg border border-yellow-200 bg-white hover:bg-yellow-50 hover:border-yellow-400 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-yellow-700">{idx + 1}</span>
                        </div>
                        <p className="text-sm text-gray-700 flex-1 group-hover:text-gray-900">
                          {suggestion}
                        </p>
                        <Send className="w-3 h-3 text-gray-400 group-hover:text-yellow-600 flex-shrink-0 transition-colors" />
                      </div>
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
