import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Zap, Play, Edit, Trash2, Star, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/apis/client";
import { format } from "date-fns";

export default function PipelineList({ onEdit, onExecute, workflows: providedWorkflows }) {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: fetchedWorkflows = [], isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const results = await apiClient.entities.Workflow.list('-updated_date', 50);
      return Array.isArray(results) ? results.filter(w => !w.is_template) : [];
    },
    enabled: !providedWorkflows
  });

  const workflows = providedWorkflows || fetchedWorkflows;

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.entities.Workflow.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['workflows']),
  });

  const favoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite }) =>
      apiClient.entities.Workflow.update(id, { is_favorite: !isFavorite }),
    onSuccess: () => queryClient.invalidateQueries(['workflows']),
  });

  const filteredWorkflows = workflows.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const favorites = filteredWorkflows.filter(w => w.is_favorite);
  const regular = filteredWorkflows.filter(w => !w.is_favorite);

  if (isLoading) {
    return <p className="text-center text-gray-500">Loading pipelines...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search pipelines..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredWorkflows.length === 0 ? (
        <Card className="text-center py-12">
          <Zap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-600">No pipelines yet</p>
          <p className="text-sm text-gray-500">Create one to get started</p>
        </Card>
      ) : (
        <>
          {favorites.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-700 uppercase flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-600 fill-yellow-600" />
                Favorites
              </p>
              {favorites.map(workflow => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  onEdit={onEdit}
                  onExecute={onExecute}
                  onDelete={() => deleteMutation.mutate(workflow.id)}
                  onToggleFavorite={() => favoriteMutation.mutate({ id: workflow.id, isFavorite: workflow.is_favorite })}
                />
              ))}
            </div>
          )}

          {regular.length > 0 && (
            <div className="space-y-2">
              {favorites.length > 0 && <p className="text-xs font-semibold text-gray-700 uppercase">Recent</p>}
              {regular.map(workflow => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  onEdit={onEdit}
                  onExecute={onExecute}
                  onDelete={() => deleteMutation.mutate(workflow.id)}
                  onToggleFavorite={() => favoriteMutation.mutate({ id: workflow.id, isFavorite: workflow.is_favorite })}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function WorkflowCard({ workflow, onEdit, onExecute, onDelete, onToggleFavorite }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
                <Badge variant="outline" className="text-xs">{workflow.category}</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-2">{workflow.description}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                <span>{workflow.steps?.length || 0} steps</span>
                <span>•</span>
                <span>Used {workflow.use_count || 0} times</span>
                <span>•</span>
                <span>{format(new Date(workflow.created_date), 'MMM d, yyyy')}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleFavorite}
                className="h-8 w-8"
              >
                <Star className={`w-4 h-4 ${workflow.is_favorite ? 'fill-yellow-600 text-yellow-600' : ''}`} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExecute(workflow)}
              >
                <Play className="w-3 h-3 mr-1" />
                Run
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(workflow)}
              >
                <Edit className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="h-8 w-8 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
