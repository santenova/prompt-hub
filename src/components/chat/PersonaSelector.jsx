import React from 'react';
import { motion } from 'framer-motion';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

const personas = [
  { id: 'default', name: 'Default', emoji: '🧠', color: 'bg-blue-500' },
  { id: 'developer', name: 'Developer', emoji: '👨‍💻', image: true, color: 'bg-white' },
  { id: 'scientist', name: 'Scientist', emoji: '🔬', color: 'bg-white' },
  { id: 'catalyst', name: 'Catalyst', emoji: '🚀', color: 'bg-white' },
  { id: 'executive', name: 'Executive', emoji: '👔', color: 'bg-white' },
  { id: 'custom', name: 'Custom', emoji: '⚡', color: 'bg-white' },
  { id: 'creator', name: 'Persona Creator', emoji: '🎭', color: 'bg-white' },
];

export default function PersonaSelector({ selectedPersona, onSelectPersona }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-600">AI Persona</h2>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600">
          <Pencil className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-3 justify-center">
        {personas.map((persona, index) => (
          <motion.button
            key={persona.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelectPersona(persona.id)}
            className={`
              flex flex-col items-center p-4 rounded-xl transition-all min-w-[90px]
              ${selectedPersona === persona.id 
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                : 'bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md text-gray-700'
              }
            `}
          >
            <div className={`
              w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-2
              ${selectedPersona === persona.id ? 'bg-white/20' : 'bg-gray-50'}
            `}>
              {persona.id === 'developer' ? (
                <img 
                  src="https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=80&h=80&fit=crop" 
                  alt="Developer"
                  className="w-10 h-10 rounded-lg object-cover"
                />
              ) : (
                persona.emoji
              )}
            </div>
            <span className={`text-xs font-medium ${selectedPersona === persona.id ? 'text-white' : 'text-gray-600'}`}>
              {persona.name}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}