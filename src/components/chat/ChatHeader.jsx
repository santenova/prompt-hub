import React from 'react';
import { ChevronDown, LayoutGrid, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ModelSelector from './ModelSelector';

const personas = [
  { id: 'default', name: 'Default', emoji: '🧠' },
  { id: 'developer', name: 'Developer', emoji: '👨‍💻' },
  { id: 'scientist', name: 'Scientist', emoji: '🔬' },
  { id: 'catalyst', name: 'Catalyst', emoji: '🚀' },
  { id: 'executive', name: 'Executive', emoji: '👔' },
  { id: 'custom', name: 'Custom', emoji: '⚡' },
];

export default function ChatHeader({ 
  selectedPersona, 
  onSelectPersona, 
  onToggleSidebar,
  selectedModel,
  onSelectModel,
  hasApiKeys
}) {
  const currentPersona = personas.find(p => p.id === selectedPersona) || personas[0];

  return (
    <header className="h-14 border-b border-gray-100 bg-white/80 backdrop-blur-sm flex items-center justify-between px-4 sticky top-0 z-30">
      <Button 
        variant="ghost" 
        size="icon" 
        className="lg:hidden text-gray-500"
        onClick={onToggleSidebar}
      >
        <Menu className="w-5 h-5" />
      </Button>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {/* Persona Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="text-gray-700 gap-2">
              {currentPersona.name}
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {personas.map((persona) => (
              <DropdownMenuItem 
                key={persona.id}
                onClick={() => onSelectPersona(persona.id)}
                className="cursor-pointer"
              >
                <span className="mr-2">{persona.emoji}</span>
                {persona.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Model Selector */}
        <ModelSelector 
          selectedModel={selectedModel}
          onSelectModel={onSelectModel}
          hasApiKeys={hasApiKeys}
        />

        <Link to={createPageUrl('Apps')}>
          <Button variant="ghost" size="icon" className="text-gray-500">
            <LayoutGrid className="w-5 h-5" />
          </Button>
        </Link>
      </div>
    </header>
  );
}