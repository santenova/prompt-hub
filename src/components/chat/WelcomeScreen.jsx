import React from 'react';
import { Bot, Sparkles, Zap, MessageSquare, Wrench, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: MessageSquare,
    title: 'Natural Conversations',
    description: 'Chat naturally with any Ollama model',
    color: 'from-emerald-500 to-teal-500'
  },
  {
    icon: Wrench,
    title: 'Function Calling',
    description: 'Enable tools for enhanced capabilities',
    color: 'from-amber-500 to-orange-500'
  },
  {
    icon: Shield,
    title: 'CORS Proxy',
    description: 'Bypass browser restrictions seamlessly',
    color: 'from-violet-500 to-purple-500'
  },
  {
    icon: Zap,
    title: 'Fast & Local',
    description: 'Run models locally with Ollama',
    color: 'from-pink-500 to-rose-500'
  }
];

const suggestions = [
  "Explain quantum computing in simple terms",
  "Write a Python function to sort a list",
  "What's the current time?",
  "Calculate 15% of 250",
  "Help me debug this code",
  "Tell me a creative story"
];

export default function WelcomeScreen({ onSelectSuggestion }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-emerald-500/25">
          <Bot className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-3">
          Ollama Chat
        </h1>
        <p className="text-lg text-zinc-400 max-w-md mx-auto">
          Your local AI assistant powered by Ollama with OpenAI-compatible features
        </p>
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl w-full mb-12"
      >
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all group"
          >
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <feature.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">{feature.title}</h3>
            <p className="text-xs text-zinc-500">{feature.description}</p>
          </div>
        ))}
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="max-w-2xl w-full"
      >
        <div className="flex items-center gap-2 mb-4 justify-center">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-zinc-400">Try asking</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => onSelectSuggestion(suggestion)}
              className="p-3 text-left text-sm text-zinc-400 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:bg-zinc-800/80 hover:border-zinc-700 hover:text-zinc-200 transition-all"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}