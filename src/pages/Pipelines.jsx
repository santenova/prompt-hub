import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Plus, Sparkles, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PipelineBuilder from '../components/pipelines/PipelineBuilder';
import PipelineList from '../components/pipelines/PipelineList';
import PipelineExecutor from '../components/pipelines/PipelineExecutor';
import WorkflowTemplates from '../components/pipelines/WorkflowTemplates';
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/apis/client";

export default function Pipelines() {
  const [view, setView] = useState('list'); // 'list', 'builder', 'executor', 'templates'
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [executingWorkflow, setExecutingWorkflow] = useState(null);
  const [recentTemplates, setRecentTemplates] = useState(() => {
    const stored = localStorage.getItem('pipelines_recent_templates');
    return stored ? JSON.parse(stored) : [];
  });
  const queryClient = useQueryClient();

  const { data: workflows = [] } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const results = await apiClient.entities.Workflow.list('-updated_date', 50);
      return Array.isArray(results) ? results : [];
    },
  });

  const templates = workflows.filter(w => w.is_template);
  const userWorkflows = workflows.filter(w => !w.is_template);

  const saveMutation = useMutation({
    mutationFn: (workflow) => {
      if (editingWorkflow?.id) {
        return apiClient.entities.Workflow.update(editingWorkflow.id, workflow);
      } else {
        return apiClient.entities.Workflow.create(workflow);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workflows']);
      setView('list');
      setEditingWorkflow(null);
    },
  });

  const handleCreateNew = () => {
    setEditingWorkflow(null);
    setView('builder');
  };

  const handleEdit = (workflow) => {
    setEditingWorkflow(workflow);
    setView('builder');
  };

  const handleExecute = (workflow) => {
    setExecutingWorkflow(workflow);
    setView('executor');
    
    // Save to recent templates if it's a template
    if (workflow.is_template) {
      const templateInfo = {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        category: workflow.category,
        timestamp: new Date().toISOString()
      };
      
      const updated = [templateInfo, ...recentTemplates.filter(t => t.id !== workflow.id)].slice(0, 5);
      setRecentTemplates(updated);
      localStorage.setItem('pipelines_recent_templates', JSON.stringify(updated));
    }
  };

  const handleSave = (workflow) => {
    saveMutation.mutate(workflow);
  };

  const handleSelectTemplate = (template) => {
    setEditingWorkflow({
      name: template.name,
      description: template.description,
      category: template.category,
      steps: template.steps,
      connections: template.connections
    });
    setView('builder');
    
    // Save to recent templates
    const templateInfo = {
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      timestamp: new Date().toISOString()
    };
    
    const updated = [templateInfo, ...recentTemplates.filter(t => t.id !== template.id)].slice(0, 5);
    setRecentTemplates(updated);
    localStorage.setItem('pipelines_recent_templates', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          {view !== 'builder' && view !== 'templates' && (
            <Card className="border-2 border-purple-200 bg-white/80 backdrop-blur-sm mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">AI Pipelines</CardTitle>
                      <CardDescription>
                        Build and execute automated AI workflows
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setView('templates')}
                      variant="outline"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Templates
                    </Button>
                    <Button
                      onClick={handleCreateNew}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Pipeline
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Content */}
          <AnimatePresence mode="wait">
            {view === 'list' && (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {recentTemplates.length > 0 && (
                  <Card className="mb-6 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Zap className="w-5 h-5 text-purple-600" />
                        Recommended For You
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Based on your recent activity
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-3">
                        {recentTemplates.slice(0, 3).map((recentTemplate) => {
                          const template = templates.find(t => t.id === recentTemplate.id);
                          if (!template) return null;
                          return (
                            <Card key={template.id} className="hover:shadow-md transition-shadow bg-white border-purple-200">
                              <CardContent className="p-4">
                                <h4 className="font-semibold text-sm mb-1">{template.name}</h4>
                                <p className="text-xs text-gray-600 mb-3 line-clamp-2">{template.description}</p>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    className="flex-1 bg-purple-600"
                                    onClick={() => handleExecute(template)}
                                  >
                                    <Play className="w-3 h-3 mr-1" />
                                    Run
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleEdit(template)}
                                  >
                                    View
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {templates.length > 0 && (
                  <Card className="mb-6 border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                            Ready-to-Use Pipeline Templates
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Pre-configured workflows with real personas and prompts
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-3">
                        {templates.map((template) => (
                          <Card key={template.id} className="hover:shadow-md transition-shadow bg-white">
                            <CardContent className="p-4">
                              <h4 className="font-semibold text-sm mb-1">{template.name}</h4>
                              <p className="text-xs text-gray-600 mb-3 line-clamp-2">{template.description}</p>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  className="flex-1 bg-indigo-600"
                                  onClick={() => handleExecute(template)}
                                >
                                  <Play className="w-3 h-3 mr-1" />
                                  Run
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleEdit(template)}
                                >
                                  View
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                <PipelineList onEdit={handleEdit} onExecute={handleExecute} workflows={userWorkflows} />
              </motion.div>
            )}

            {view === 'builder' && (
              <motion.div key="builder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <PipelineBuilder
                  workflow={editingWorkflow}
                  onSave={handleSave}
                  onCancel={() => {
                    setEditingWorkflow(null);
                    setView('list');
                  }}
                />
              </motion.div>
            )}

            {view === 'executor' && (
              <motion.div key="executor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <PipelineExecutor
                  workflow={executingWorkflow}
                  onClose={() => {
                    setExecutingWorkflow(null);
                    setView('list');
                  }}
                />
              </motion.div>
            )}

            {view === 'templates' && (
              <motion.div key="templates" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <WorkflowTemplates
                  onSelectTemplate={handleSelectTemplate}
                  onClose={() => setView('list')}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
