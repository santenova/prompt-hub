import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, Lightbulb, Code, PenTool, Calculator, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function WelcomeMessage({ onExampleClick }) {
  const examples = [
    {
      icon: Lightbulb,
      title: "Creative Ideas",
      prompt: "Help me brainstorm creative marketing ideas for a sustainable fashion brand",
      color: "from-yellow-400 to-orange-500"
    },
    {
      icon: Code,
      title: "Code Help",
      prompt: "Explain how React hooks work and show me a practical example",
      color: "from-blue-500 to-purple-600"
    },
    {
      icon: PenTool,
      title: "Writing Assistant",
      prompt: "Help me write a professional email to my boss about taking time off",
      color: "from-green-500 to-teal-600"
    },
    {
      icon: Calculator,
      title: "Problem Solving",
      prompt: "Walk me through solving this math problem step by step: What's the derivative of x³ + 2x² - 5x + 3?",
      color: "from-pink-500 to-red-500"
    }
  ];

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-4xl mx-auto text-center">
    

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
        >
          {examples.map((example, index) => (
            <Card 
              key={index}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm"
              onClick={() => onExampleClick(example.prompt)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${example.color} flex items-center justify-center shadow-md`}>
                    <example.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-800 mb-1">
                      {example.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {example.prompt}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-sm text-gray-500"
        >
          Start a conversation by typing your question below
        </motion.div>
      </div>
    </div>
  );
}
