import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Info, Users, FileText, Sparkles, Calendar, TrendingUp, Eye, Download, ScanSearch, Edit, X, Save } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import ContentScanner from './ContentScanner';
import PlaceholderMappingPanel from './PlaceholderMappingPanel';
import { apiClient } from '@/apis/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';

export default function ProjectDetailModal({ project, open, onClose, contentHistory, personas, templates, onUpdate, onEdit, allContentHistory = [] }) {
  const [showScanner, setShowScanner] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState(project);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  React.useEffect(() => {
    setEditedProject(project);
    setIsEditing(false);
  }, [project]);

  const associatedPersonas = personas.filter(p => project.persona_ids?.includes(p.id));
  const associatedTemplates = templates.filter(t => project.template_ids?.includes(t.id));

  const handleSave = () => {
    onUpdate(editedProject);
    setIsEditing(false);
    toast({
      title: "Project Updated",
      description: "Your changes have been saved successfully",
    });
  };

  const handleCancel = () => {
    setEditedProject(project);
    setIsEditing(false);
  };

  const handleAssignContent = async (contentIds) => {
    try {
      await Promise.all(
        contentIds.map(id =>
          apiClient.entities.ContentHistory.update(id, { project_id: project.id })
        )
      );
      
      queryClient.invalidateQueries({ queryKey: ['content-history'] });
      
      toast({
        title: "Content Assigned",
        description: `Successfully assigned ${contentIds.length} content item(s) to this project`,
      });
    } catch (error) {
      toast({
        title: "Assignment Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Group content by date
  const contentByDate = contentHistory.reduce((acc, content) => {
    const date = new Date(content.created_date).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(contentByDate)
    .map(([date, count]) => ({ date, count }))
    .slice(-7);

  const contentByType = contentHistory.reduce((acc, content) => {
    const type = content.content_type || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const typeChartData = Object.entries(contentByType).map(([type, count]) => ({ type, count }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl flex items-center gap-2">
              {project.name}
              <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600">
                {contentHistory.length} Content
              </Badge>
            </DialogTitle>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSave}
                    size="sm"
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => setShowScanner(true)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <ScanSearch className="w-4 h-4" />
                    Scan & Assign
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="placeholders">Placeholders</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Project Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isEditing ? (
                  <>
                    <div>
                      <Label htmlFor="name" className="text-xs">Project Name</Label>
                      <Input
                        id="name"
                        value={editedProject.name}
                        onChange={(e) => setEditedProject({ ...editedProject, name: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description" className="text-xs">Description</Label>
                      <Textarea
                        id="description"
                        value={editedProject.description || ''}
                        onChange={(e) => setEditedProject({ ...editedProject, description: e.target.value })}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="topic" className="text-xs">Topic</Label>
                        <Input
                          id="topic"
                          value={editedProject.topic || ''}
                          onChange={(e) => setEditedProject({ ...editedProject, topic: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="audience" className="text-xs">Target Audience</Label>
                        <Input
                          id="audience"
                          value={editedProject.target_audience || ''}
                          onChange={(e) => setEditedProject({ ...editedProject, target_audience: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tone" className="text-xs">Tone</Label>
                        <Input
                          id="tone"
                          value={editedProject.tone || ''}
                          onChange={(e) => setEditedProject({ ...editedProject, tone: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="style" className="text-xs">Style</Label>
                        <Input
                          id="style"
                          value={editedProject.style || ''}
                          onChange={(e) => setEditedProject({ ...editedProject, style: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {project.description && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Description</p>
                        <p className="text-sm text-gray-900">{project.description}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      {project.topic && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Topic</p>
                          <Badge variant="outline">{project.topic}</Badge>
                        </div>
                      )}
                      {project.target_audience && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Audience</p>
                          <p className="text-sm text-gray-900">{project.target_audience}</p>
                        </div>
                      )}
                      {project.tone && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Tone</p>
                          <Badge>{project.tone}</Badge>
                        </div>
                      )}
                      {project.style && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Style</p>
                          <Badge>{project.style}</Badge>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-3">
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <Sparkles className="w-8 h-8 text-purple-600" />
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-600">{contentHistory.length}</p>
                      <p className="text-xs text-gray-600">Content Generated</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-indigo-50 border-indigo-200">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <Users className="w-8 h-8 text-indigo-600" />
                    <div className="text-right">
                      <p className="text-2xl font-bold text-indigo-600">{associatedPersonas.length}</p>
                      <p className="text-xs text-gray-600">Personas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{associatedTemplates.length}</p>
                      <p className="text-xs text-gray-600">Templates</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="placeholders" className="space-y-4">
            <PlaceholderMappingPanel 
              project={project} 
              linkedTemplates={associatedTemplates}
            />
          </TabsContent>

          <TabsContent value="content" className="space-y-3">
            {contentHistory.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No content generated yet</p>
                </CardContent>
              </Card>
            ) : (
              contentHistory.map((content, idx) => (
                <Card key={idx} className="border-l-4 border-l-purple-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-sm text-gray-900">{content.topic}</CardTitle>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{content.content_type}</Badge>
                          <Badge variant="outline">{content.tone}</Badge>
                          {content.use_ollama && <Badge className="bg-orange-100 text-orange-700">Ollama</Badge>}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(content.created_date).toLocaleDateString()}
                      </p>
                    </div>
                  </CardHeader>
                  {content.custom_instructions && (
                    <CardContent className="pt-0">
                      <p className="text-xs text-gray-600 line-clamp-2">{content.custom_instructions}</p>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {contentHistory.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No analytics data available yet</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Content Generation Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Content by Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={typeChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#6366f1" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Associated Personas ({associatedPersonas.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {associatedPersonas.length === 0 ? (
                  <p className="text-sm text-gray-500">No personas associated</p>
                ) : (
                  <div className="space-y-2">
                    {associatedPersonas.map(persona => (
                      <div key={persona.id} className="p-2 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-sm font-medium">{persona.icon} {persona.name}</p>
                        <p className="text-xs text-gray-600">{persona.category} • {persona.tone}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Associated Templates ({associatedTemplates.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {associatedTemplates.length === 0 ? (
                  <p className="text-sm text-gray-500">No templates associated</p>
                ) : (
                  <div className="space-y-2">
                    {associatedTemplates.map(template => (
                      <div key={template.id} className="p-2 bg-indigo-50 rounded-lg border border-indigo-200">
                        <p className="text-sm font-medium">{template.title}</p>
                        <p className="text-xs text-gray-600">{template.category}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <ContentScanner
          open={showScanner}
          onClose={() => setShowScanner(false)}
          contentHistory={allContentHistory}
          onAssign={handleAssignContent}
          currentProjectId={project.id}
        />
      </DialogContent>
    </Dialog>
  );
}
