import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, ChevronDown, FileText, Users, Brain, Zap, Sparkles, Wand2 } from "lucide-react";

export default function VoiceActionGroup({
  text,
  onCreateTemplate,
  onCreatePersona,
  onForward,
  disabled,
  label = "Create / Forward",
}) {
  const hasText = !!(text && text.trim());

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || !hasText} className="gap-2">
          <Plus className="w-4 h-4" />
          {label}
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Create</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onCreateTemplate && onCreateTemplate(text)}>
          <FileText className="w-4 h-4 mr-2" />
          Template from text
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onCreatePersona && onCreatePersona(text)}>
          <Users className="w-4 h-4 mr-2" />
          Persona from text
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Forward to tools</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onForward && onForward('Tools', text)}>
          <Brain className="w-4 h-4 mr-2" />
          Tools
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onForward && onForward('Workspace', text)}>
          <Zap className="w-4 h-4 mr-2" />
          Pipelines
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onForward && onForward('AIGenerator', text)}>
          <Sparkles className="w-4 h-4 mr-2" />
          AI Generator
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onForward && onForward('AIContentGenerator', text)}>
          <Wand2 className="w-4 h-4 mr-2" />
          Content Generator
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}