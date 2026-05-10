import React from "react";
import { motion } from "framer-motion";
import { User, Bot, Copy, Check, Volume2, FileText, Image as ImageIcon, Code, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

export default function MessageBubble({ message, isLast, ttsEnabled }) {
  const [copied, setCopied] = React.useState(false);
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const isUser = message.role === "user";

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const speakMessage = () => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      if (!isSpeaking) {
        const utterance = new SpeechSynthesisUtterance(message.content);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        
        window.speechSynthesis.speak(utterance);
      } else {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    }
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      return <ImageIcon className="w-3 h-3" />;
    } else if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'html', 'css', 'json'].includes(ext)) {
      return <Code className="w-3 h-3" />;
    } else if (['txt', 'md', 'pdf', 'doc', 'docx'].includes(ext)) {
      return <FileText className="w-3 h-3" />;
    }
    return <File className="w-3 h-3" />;
  };

  // Auto-play TTS for AI responses
  React.useEffect(() => {
    if (!isUser && isLast && ttsEnabled && message.content) {
      // Small delay to avoid speaking too quickly
      const timer = setTimeout(() => {
        speakMessage();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLast, ttsEnabled]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-4 mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      
      <div className={`max-w-3xl ${isUser ? 'order-first' : ''}`}>
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm ${
            isUser
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
              : 'bg-white border border-gray-200'
          }`}
        >
          {isUser ? (
            <div className="space-y-2">
              {message.files && message.files.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2 pb-2 border-b border-white/20">
                  {message.files.map((file, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-white/20 text-white text-xs flex items-center gap-1">
                      {getFileIcon(file.name)}
                      {file.name}
                    </Badge>
                  ))}
                </div>
              )}
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-2 px-2">
          <span className="text-xs text-gray-500">
            {format(new Date(message.timestamp), 'HH:mm')}
          </span>
          {!isUser && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-50 hover:opacity-100"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-6 w-6 opacity-50 hover:opacity-100 ${isSpeaking ? 'text-purple-600' : ''}`}
                onClick={speakMessage}
              >
                <Volume2 className={`w-3 h-3 ${isSpeaking ? 'animate-pulse' : ''}`} />
              </Button>
            </>
          )}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-gray-600" />
        </div>
      )}
    </motion.div>
  );
}