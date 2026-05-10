import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const examples = [
  { id: 1, label: 'Summarize a document', category: 'productivity' },
  { id: 2, label: 'Write code', category: 'development' },
  { id: 3, label: 'Explain a concept', category: 'learning' },
  { id: 4, label: 'Brainstorm ideas', category: 'creative' },
  { id: 5, label: 'Debug my code', category: 'development' },
];

const prompts = [
  { id: 1, label: 'Act as a senior developer' },
  { id: 2, label: 'Help me with data analysis' },
  { id: 3, label: 'Creative writing assistant' },
  { id: 4, label: 'Research helper' },
];

export default function StartHere({ onSelectExample }) {
  return (
    <div className="flex items-center gap-3 justify-center">
      <span className="text-sm text-gray-500">Start here</span>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="text-gray-600 border-gray-200">
            Examples
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {examples.map((example) => (
            <DropdownMenuItem 
              key={example.id}
              onClick={() => onSelectExample(example.label)}
              className="cursor-pointer"
            >
              {example.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="text-gray-600 border-gray-200">
            Prompt
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {prompts.map((prompt) => (
            <DropdownMenuItem 
              key={prompt.id}
              onClick={() => onSelectExample(prompt.label)}
              className="cursor-pointer"
            >
              {prompt.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}