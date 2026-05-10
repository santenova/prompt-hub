import React from 'react';
import { motion } from 'framer-motion';
import { User, Bot, Wrench, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';

export default function ChatMessage({ message, onCopy }) {
  const [copied, setCopied] = React.useState(false);
  const isUser = message.role === 'user';
  const isTool = message.role === 'tool';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`group flex gap-4 p-6 ${
        isUser 
          ? 'bg-gradient-to-r from-zinc-900/50 to-transparent' 
          : isTool 
            ? 'bg-gradient-to-r from-amber-500/5 to-transparent border-l-2 border-amber-500/30'
            : 'bg-transparent'
      }`}
    >
      <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
        isUser 
          ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25' 
          : isTool
            ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25'
            : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25'
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : isTool ? (
          <Wrench className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>
      
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            {isUser ? 'You' : isTool ? 'Tool Result' : 'Assistant'}
          </span>
          {message.timestamp && (
            <span className="text-xs text-zinc-600">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>
        
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown
            components={{
              code: ({ node, inline, className, children, ...props }) => {
                if (inline) {
                  return (
                    <code className="px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-400 text-sm" {...props}>
                      {children}
                    </code>
                  );
                }
                return (
                  <pre className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 overflow-x-auto">
                    <code className="text-sm text-zinc-300" {...props}>
                      {children}
                    </code>
                  </pre>
                );
              },
              p: ({ children }) => <p className="text-zinc-300 leading-relaxed mb-3 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="text-zinc-300 space-y-1 mb-3">{children}</ul>,
              ol: ({ children }) => <ol className="text-zinc-300 space-y-1 mb-3">{children}</ol>,
              li: ({ children }) => <li className="text-zinc-300">{children}</li>,
              strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
              a: ({ children, href }) => (
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline">
                  {children}
                </a>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {message.tool_calls && (
          <div className="mt-3 space-y-2">
            {(() => {
              const toolCalls = typeof message.tool_calls === 'string' 
                ? JSON.parse(message.tool_calls) 
                : message.tool_calls;
              return toolCalls.map((tool, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <Wrench className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-mono text-amber-300">
                    {tool.function?.name || tool.name}
                  </span>
                </div>
              ));
            })()}
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleCopy}
        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-zinc-500 hover:text-zinc-300"
      >
        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
      </Button>
    </motion.div>
  );
}