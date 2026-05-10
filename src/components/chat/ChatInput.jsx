import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import FileUpload from "./FileUpload";
import VoiceControls from "./VoiceControls";

export default function ChatInput({ 
  onSendMessage, 
  isLoading, 
  disabled,
  ttsEnabled,
  setTtsEnabled 
}) {
  const [message, setMessage] = React.useState("");
  const [attachedFiles, setAttachedFiles] = React.useState([]);
  const [isListening, setIsListening] = React.useState(false);
  const textareaRef = React.useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((message.trim() || attachedFiles.length > 0) && !isLoading) {
      onSendMessage(message.trim(), attachedFiles);
      setMessage("");
      setAttachedFiles([]);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleVoiceTranscript = (transcript) => {
    setMessage(prev => prev ? `${prev} ${transcript}` : transcript);
    textareaRef.current?.focus();
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-2">
        <div className="flex items-end gap-2">
          <FileUpload 
            attachedFiles={attachedFiles}
            onFilesChange={setAttachedFiles}
          />
          <VoiceControls
            onTranscript={handleVoiceTranscript}
            isListening={isListening}
            setIsListening={setIsListening}
            ttsEnabled={ttsEnabled}
            setTtsEnabled={setTtsEnabled}
          />
        </div>
        
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening..." : "Ask Zyphora anything..."}
            disabled={disabled || isLoading || isListening}
            className="min-h-[60px] pr-12 resize-none border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-xl"
            rows={2}
          />
          <Button
            type="submit"
            size="icon"
            disabled={(!message.trim() && attachedFiles.length === 0) || isLoading}
            className="absolute right-2 bottom-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  );
}