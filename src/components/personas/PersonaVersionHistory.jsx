import React from 'react';
import { apiClient } from '@/apis/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, RotateCcw, User } from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PersonaVersionHistory({ persona, currentUser }) {
  const queryClient = useQueryClient();

  const restoreMutation = useMutation({
    mutationFn: async (version) => {
      const changeLog = [...(persona.change_log || []), {
        timestamp: new Date().toISOString(),
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email,
        action: 'version_created',
        description: `Restored to version ${version.version}`
      }];

      return apiClient.entities.Persona.update(persona.id, {
        name: version.name,
        description: version.description,
        instructions: version.instructions,
        tone: version.tone,
        expertise_areas: version.expertise_areas,
        example_prompts: version.example_prompts,
        tags: version.tags,
        version: (persona.version || 1) + 1,
        change_log: changeLog
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['personas']);
    }
  });

  const canRestore = () => {
    if (!currentUser) return false;
    if (persona.created_by === currentUser.email) return true;
    
    const collab = (persona.collaborators || []).find(c => c.email === currentUser.email);
    return collab && (collab.permission === 'editor' || collab.permission === 'admin');
  };

  const versions = [...(persona.version_history || [])].reverse();

  if (versions.length === 0) {
    return (
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          No version history available yet. Changes will be tracked as you edit.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-3 pr-4">
        {versions.map((version, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">v{version.version}</Badge>
                    <div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-3 h-3" />
                        <span className="font-medium">{version.edited_by_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {new Date(version.saved_date).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {canRestore() && idx > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (confirm('Restore this version? This will create a new version.')) {
                          restoreMutation.mutate(version);
                        }
                      }}
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Restore
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {version.change_notes && (
                    <p className="text-sm font-medium text-gray-700">{version.change_notes}</p>
                  )}
                  <div className="text-sm space-y-1">
                    <p><strong>Name:</strong> {version.name}</p>
                    {version.description && (
                      <p className="text-gray-600">{version.description.substring(0, 100)}...</p>
                    )}
                    <div className="flex gap-2 flex-wrap mt-2">
                      {version.tags?.slice(0, 3).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                      {version.tags?.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{version.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </ScrollArea>
  );
}
