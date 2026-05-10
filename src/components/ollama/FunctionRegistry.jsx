import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Zap, Code, Database, Globe, Mail, FileText, Calendar } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Available function definitions for Ollama
export const AVAILABLE_FUNCTIONS = {
  create_template: {
    name: "create_template",
    description: "Create a new prompt template from provided content",
    icon: FileText,
    color: "from-blue-500 to-cyan-500",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Template title" },
        content: { type: "string", description: "Template content" },
        category: { type: "string", description: "Template category" }
      },
      required: ["title", "content"]
    }
  },
  create_persona: {
    name: "create_persona",
    description: "Create a new AI persona with specified traits",
    icon: Code,
    color: "from-purple-500 to-pink-500",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Persona name" },
        description: { type: "string", description: "Persona description" },
        tone: { type: "string", description: "Communication tone" }
      },
      required: ["name", "description"]
    }
  },
  search_web: {
    name: "search_web",
    description: "Search the web for information using AI-powered search",
    icon: Globe,
    color: "from-green-500 to-emerald-500",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" }
      },
      required: ["query"]
    }
  },
  send_email: {
    name: "send_email",
    description: "Send an email message",
    icon: Mail,
    color: "from-orange-500 to-red-500",
    parameters: {
      type: "object",
      properties: {
        to: { type: "string", description: "Recipient email" },
        subject: { type: "string", description: "Email subject" },
        body: { type: "string", description: "Email body" }
      },
      required: ["to", "subject", "body"]
    }
  },
  query_database: {
    name: "query_database",
    description: "Query templates, personas, or other stored data",
    icon: Database,
    color: "from-indigo-500 to-purple-500",
    parameters: {
      type: "object",
      properties: {
        entity: { type: "string", description: "Entity type (template/persona)" },
        query: { type: "string", description: "Search query" }
      },
      required: ["entity", "query"]
    }
  },
  schedule_reminder: {
    name: "schedule_reminder",
    description: "Schedule a reminder or task",
    icon: Calendar,
    color: "from-yellow-500 to-orange-500",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Reminder title" },
        date: { type: "string", description: "Due date" },
        description: { type: "string", description: "Reminder description" }
      },
      required: ["title", "date"]
    }
  }
};

export default function FunctionRegistry({ enabledFunctions, onToggleFunction }) {
  const { toast } = useToast();
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Function Calling</h3>
          <p className="text-sm text-gray-600">Enable AI to trigger external tools and APIs</p>
        </div>
        <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600">
          {Object.values(enabledFunctions).filter(Boolean).length} Active
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(AVAILABLE_FUNCTIONS).map(([key, func]) => {
          const Icon = func.icon;
          const isEnabled = enabledFunctions[key];
          
          return (
            <Card key={key} className={`border-2 ${isEnabled ? 'border-purple-300 bg-purple-50' : 'border-gray-200'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${func.color}`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <CardTitle className="text-sm">{func.name}</CardTitle>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) => onToggleFunction(key, checked)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600 mb-2">{func.description}</p>
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Parameters:</span> {func.parameters.required.join(', ')}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}