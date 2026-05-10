import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, AlertTriangle, Cloud, HardDrive, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const cloudModels = [
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', available: true },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', available: true },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', available: true },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic', available: true },
  { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google', available: false },
];

const localModels = [
  { id: 'llama3.2', name: 'Llama 3.2', size: '3B', available: true },
  { id: 'llama3', name: 'Llama 3', size: '8B', available: true },
  { id: 'mistral', name: 'Mistral', size: '7B', available: true },
  { id: 'codellama', name: 'Code Llama', size: '13B', available: true },
  { id: 'gemma2', name: 'Gemma 2', size: '9B', available: true },
];

export default function ModelSelector({ selectedModel, onSelectModel, hasApiKeys }) {
  const currentModel = [...cloudModels, ...localModels].find(m => m.id === selectedModel) || cloudModels[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="text-amber-600 gap-2">
          {!hasApiKeys && <AlertTriangle className="w-4 h-4" />}
          {currentModel.name}
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Cloud className="w-4 h-4" />
          Cloud Models
        </DropdownMenuLabel>
        {cloudModels.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => model.available && onSelectModel(model.id)}
            className={`cursor-pointer ${!model.available ? 'opacity-50' : ''}`}
            disabled={!model.available}
          >
            <div className="flex flex-col flex-1">
              <span className="font-medium">{model.name}</span>
              <span className="text-xs text-gray-500">{model.provider}</span>
            </div>
            {!model.available && (
              <Badge variant="secondary" className="text-xs">Soon</Badge>
            )}
            {model.id === selectedModel && (
              <Badge variant="default" className="text-xs">Active</Badge>
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="flex items-center gap-2">
          <HardDrive className="w-4 h-4" />
          Local Models (Ollama)
        </DropdownMenuLabel>
        {localModels.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => model.available && onSelectModel(model.id)}
            className={`cursor-pointer ${!model.available ? 'opacity-50' : ''}`}
            disabled={!model.available}
          >
            <div className="flex flex-col flex-1">
              <span className="font-medium">{model.name}</span>
              <span className="text-xs text-gray-500">{model.size}</span>
            </div>
            {!model.available && (
              <Badge variant="secondary" className="text-xs">Pull</Badge>
            )}
            {model.id === selectedModel && (
              <Badge variant="default" className="text-xs">Active</Badge>
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {!hasApiKeys && (
          <Link to={createPageUrl('Settings')}>
            <DropdownMenuItem className="text-amber-600 cursor-pointer">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Add API Keys
            </DropdownMenuItem>
          </Link>
        )}
        
        <Link to={createPageUrl('Settings')}>
          <DropdownMenuItem className="cursor-pointer">
            <Zap className="w-4 h-4 mr-2" />
            Configure Models
          </DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}