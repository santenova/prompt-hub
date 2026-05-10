import React, { useState, useEffect, useRef } from "react";
import { apiClient } from '@/apis/client';
import MessageBubble from "../components/chat/MessageBubble";
import ChatInput from "../components/chat/ChatInput";
import WelcomeMessage from "../components/chat/WelcomeMessage";
import AIProviderSettings from "../components/chat/AIProviderSettings";
import { Button } from "@/components/ui/button";
import { Plus, Cpu, Cloud } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const messagesEndRef = useRef(null);
  
  // AI Provider state
  const [aiProvider, setAiProvider] = useState(() => {
    return localStorage.getItem('aiProvider') || 'cloud';
  });
  const [ollamaConfig, setOllamaConfig] = useState(() => {
    const saved = localStorage.getItem('ollamaConfig');
    return saved ? JSON.parse(saved) : {
      url: '/proxy',
      model: 'mistral:7b'
    };
  });
  const [ttsEnabled, setTtsEnabled] = useState(() => {
    return localStorage.getItem('ttsEnabled') === 'true';
  });

  useEffect(() => {
    loadUser();
    checkForExistingConversation();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadUser = async () => {
    try {
      const userData = await apiClient.auth.me();
      setUser(userData);
    } catch (error) {
      console.error("User not authenticated");
    }
  };

  const checkForExistingConversation = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const conversationId = urlParams.get('conversation');
    
    if (conversationId) {
      setIsLoadingConversation(true);
      try {
        const conversations = await apiClient.entities.Conversation.filter({ id: conversationId });
        const conversation = conversations[0];
        if (conversation) {
          setMessages(conversation.messages || []);
          setCurrentConversationId(conversationId);
        }
      } catch (error) {
        console.error("Error loading conversation:", error);
      } finally {
        setIsLoadingConversation(false);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const generateConversationTitle = (messages) => {
    if (messages.length > 0) {
      const firstUserMessage = messages.find(m => m.role === "user");
      if (firstUserMessage) {
        return firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? "..." : "");
      }
    }
    return "New Conversation";
  };

  const handleProviderChange = (provider) => {
    setAiProvider(provider);
    localStorage.setItem('aiProvider', provider);
  };

  const handleOllamaConfigChange = (config) => {
    setOllamaConfig(config);
    localStorage.setItem('ollamaConfig', JSON.stringify(config));
  };

  useEffect(() => {
    localStorage.setItem('ttsEnabled', ttsEnabled);
  }, [ttsEnabled]);

  const processFiles = async (files) => {
    const processedFiles = [];
    
    for (const file of files) {
      try {
        // Upload file
        const { file_url } = await apiClient.integrations.Core.UploadFile({ file });
        
        // Try to get file content
        let content = '';
        const fileType = file.type;
        const fileName = file.name;
        const fileExt = fileName.split('.').pop()?.toLowerCase();
        
        // For text-based files, fetch content directly
        if (
          fileType.startsWith('text/') || 
          ['txt', 'md', 'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'html', 'css', 'json'].includes(fileExt)
        ) {
          const response = await fetch(file_url);
          content = await response.text();
        }
        // For images, just include the URL
        else if (fileType.startsWith('image/')) {
          content = `[Image: ${fileName}]`;
        }
        // For PDFs and other documents, we could use ExtractDataFromUploadedFile
        // but for simplicity, we'll just note the file
        else {
          content = `[Document: ${fileName}]`;
        }
        
        processedFiles.push({
          name: fileName,
          url: file_url,
          content: content,
          type: fileType
        });
      } catch (error) {
        console.error('Error processing file:', file.name, error);
      }
    }
    
    return processedFiles;
  };


  const callOllamaAPI = async (messages, model,temperature=0) => {
    const response = await fetch(`/proxy/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages:messages,
          temperature: temperature ?? 0,
        }),
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Local LMS error: ${response.status} ${response.statusText} — ${errText}`);
      }
      const raw = await response.json();
      let content = raw?.choices?.[0]?.message?.content ?? "{}";
      if (typeof content === "string") {
        content = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
        return content;
      }
      return content;
  };

  const handleSendMessage = async (content, files = []) => {
    if (!content.trim() && files.length === 0) return;

    // Process files first
    let processedFiles = [];
    if (files.length > 0) {
      setIsLoading(true);
      processedFiles = await processFiles(files);
      setIsLoading(false);
    }

    // Build file context for the prompt
    let fileContext = '';
    if (processedFiles.length > 0) {
      fileContext = '\n\nAttached files:\n' + processedFiles.map(f => {
        if (f.content && f.content.length > 0 && !f.content.startsWith('[')) {
          return `\nFile: ${f.name}\nContent:\n${f.content}\n`;
        }
        return `\nFile: ${f.name} (${f.type})\n`;
      }).join('\n');
    }

    const userMessage = {
      role: "user",
      content: content || "Please analyze the attached files.",
      files: processedFiles.map(f => ({ name: f.name, url: f.url })),
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      let response;

      if (aiProvider === 'ollama') {
        // Use Ollama with proper message format
        const systemMessage = {
          role: "system",
          content: "You are a friendly and highly capable AI assistant. You can answer questions, solve problems, write essays, generate code, explain concepts, give advice, and create content. Always respond clearly, accurately, and in a helpful tone. When asked about your creator or who made you, you should mention that you were created by Daniel Njoku."
        };

        const ollamaMessages = [
          systemMessage,
          ...updatedMessages.map(msg => ({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.content + (msg === updatedMessages[updatedMessages.length - 1] ? fileContext : '')
          }))
          
        ];

        response = await callOllamaAPI(ollamaMessages,"llama3:latest");
      } else {
        // Use Cloud AI (InvokeLLM)
        const conversationHistory = updatedMessages.map(msg => 
          `${msg.role === "user" ? "Human" : "Assistant"}: ${msg.content}`
        ).join("\n\n");

        const prompt = `You are Zyphora, a friendly and highly capable AI assistant created by Daniel Njoku. You can answer questions, solve problems, write essays, generate code, explain concepts, give advice, and create content. Always respond clearly, accurately, and in a helpful tone.

When asked about your creator or who made you, you should mention that you were created by Daniel Njoku.

Previous conversation:
${conversationHistory}${fileContext}

Please provide a helpful response to the human's latest message. Be comprehensive but concise, and use markdown formatting when appropriate for better readability.`;

        const fileUrls = processedFiles
          .filter(f => f.url && (f.type.startsWith('image/') || f.type === 'application/pdf'))
          .map(f => f.url);

        response = await apiClient.integrations.Core.InvokeLLM({
          prompt: prompt,
          file_urls: fileUrls.length > 0 ? fileUrls : null
        });
      }

      const assistantMessage = {
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

      // Auto-save conversation
      if (user) {
        const title = generateConversationTitle(finalMessages);
        
        if (currentConversationId) {
          await apiClient.entities.Conversation.update(currentConversationId, {
            title,
            messages: finalMessages
          });
        } else {
          const newConversation = await apiClient.entities.Conversation.create({
            title,
            messages: finalMessages
          });
          setCurrentConversationId(newConversation.id);
          // Update URL to include conversation ID
          window.history.replaceState({}, '', `?conversation=${newConversation.id}`);
        }
      }

    } catch (error) {
      console.error("Error getting AI response:", error);
      
      let errorMessage = "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.";
      
      // Handle specific error types
      if (aiProvider === 'ollama') {
        if (error.message && error.message.includes('Failed to fetch')) {
          errorMessage = `🔌 **Cannot Connect to Proxy**\n\nMake sure the API endpoint is reachable at \`${ollamaConfig.url}/v1/chat/completions\`.\n\nOr switch to Cloud AI in settings.`;
        } else {
          errorMessage = `🔧 **API Error**\n\n${error.message}\n\nCheck that:\n- The endpoint \`${ollamaConfig.url}\` is reachable\n- The model '${ollamaConfig.model}' is available\n\nOr switch to Cloud AI in settings.`;
        }
      } else {
        if (error.message && error.message.includes('quota')) {
          errorMessage = "⚠️ **Service Temporarily Unavailable**\n\nI'm currently experiencing high demand or API limitations. This usually resolves quickly. Please try again in a few minutes, or try switching to local Ollama in settings.\n\n*The conversation has been saved and you can continue once service is restored.*";
        } else if (error.message && error.message.includes('500')) {
          errorMessage = "🔧 **Technical Difficulty**\n\nI'm experiencing a temporary technical issue. Your message has been saved and I'll be back online shortly.\n\n*Please try sending your message again in a few moments, or switch to local Ollama in settings.*";
        } else if (error.message && error.message.includes('RateLimitError')) {
          errorMessage = "🚦 **Rate Limit Reached**\n\nI'm receiving a lot of requests right now. Please wait a moment and try again, or switch to local Ollama in settings.\n\n*Your conversation is saved and will continue once the rate limit resets.*";
        }
      }
      
      const errorResponse = {
        role: "assistant",
        content: errorMessage,
        timestamp: new Date().toISOString()
      };
      setMessages([...updatedMessages, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    // Clear URL parameters
    window.history.replaceState({}, '', window.location.pathname);
  };

  const handleExampleClick = (examplePrompt) => {
    handleSendMessage(examplePrompt);
  };

  // Show loading state when loading an existing conversation
  if (isLoadingConversation) {
    return (
      <div className="h-screen flex flex-col bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600">Loading conversation...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-200 p-4 hidden md:block">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>

           <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-gray-600">
                {messages.length > 0 ? `${messages.length} messages` : "Start a new conversation"}
              </p>
              <Badge variant="outline" className="text-xs gap-1">
                {aiProvider === 'ollama' ? (
                  <>
                    <Cpu className="w-3 h-3" />
                    Local Ollama
                  </>
                ) : (
                  <>
                    <Cloud className="w-3 h-3" />
                    Cloud AI
                  </>
                )}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AIProviderSettings
              currentProvider={aiProvider}
              onProviderChange={handleProviderChange}
              ollamaConfig={ollamaConfig}
              onOllamaConfigChange={handleOllamaConfigChange}
            />
            {messages.length > 0 && (
              <Button
                onClick={startNewChat}
                variant="outline"
                className="gap-2 hover:bg-purple-50"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <WelcomeMessage onExampleClick={handleExampleClick} />
        ) : (
          <div className="max-w-4xl mx-auto p-4">
            {messages.map((message, index) => (
              <MessageBubble
                key={index}
                message={message}
                isLast={index === messages.length - 1}
                ttsEnabled={ttsEnabled}
              />
            ))}
            {isLoading && (
              <div className="flex gap-4 mb-6">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Chat Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        disabled={(!user && messages.length === 0) || isLoadingConversation}
        ttsEnabled={ttsEnabled}
        setTtsEnabled={setTtsEnabled}
      />
    </div>
  );
}
