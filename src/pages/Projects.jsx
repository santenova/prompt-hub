import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/apis/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FolderOpen, TrendingUp, Users, FileText, Sparkles, BarChart3, Archive, ArchiveRestore } from 'lucide-react';
import { motion } from 'framer-motion';
import ProjectCard from '../components/projects/ProjectCard';
import CreateProjectModal from '../components/projects/CreateProjectModal';
import ProjectDetailModal from '../components/projects/ProjectDetailModal';
import ProjectStatsCard from '../components/projects/ProjectStatsCard';
import StripeProductImporter from '../components/projects/StripeProductImporter';
import ProjectImporter from '../components/projects/ProjectImporter';

export default function Projects() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStripeImporter, setShowStripeImporter] = useState(false);
  const [showProjectImporter, setShowProjectImporter] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiClient.entities.Project.list('-updated_date'),
    initialData: [],
  });

  const { data: contentHistory = [] } = useQuery({
    queryKey: ['content-history'],
    queryFn: () => apiClient.entities.ContentHistory.list('-created_date', 100),
    initialData: [],
  });

  const { data: personas = [] } = useQuery({
    queryKey: ['personas'],
    queryFn: () => apiClient.entities.Persona.list(),
    initialData: [],
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => apiClient.entities.Template.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.entities.Project.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowCreateModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.entities.Project.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.entities.Project.update(id, { is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: (id) => apiClient.entities.Project.update(id, { is_active: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const filteredProjects = projects.filter(project => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      project.name?.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query) ||
      project.topic?.toLowerCase().includes(query)
    );
  });

  const activeProjects = filteredProjects.filter(p => p.is_active !== false);
  const archivedProjects = filteredProjects.filter(p => p.is_active === false);
  const displayProjects = showArchived ? archivedProjects : activeProjects;
  const totalContent = contentHistory.length;
  const projectsWithContent = new Set(contentHistory.filter(c => c.project_id).map(c => c.project_id)).size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <FolderOpen className="w-8 h-8 text-purple-600" />
              Project Management
            </h1>
            <p className="text-gray-600 mt-1">
              Organize content generation by projects
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowArchived(!showArchived)}
              variant={showArchived ? "default" : "outline"}
              className={showArchived ? "bg-orange-600 hover:bg-orange-700" : ""}
            >
              {showArchived ? <ArchiveRestore className="w-4 h-4 mr-2" /> : <Archive className="w-4 h-4 mr-2" />}
              {showArchived ? `Archived (${archivedProjects.length})` : 'View Archived'}
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
            <Button
              onClick={() => setShowProjectImporter(true)}
              variant="outline"
              className="border-green-300 hover:bg-green-50"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Import from URL/JSON
            </Button>
            <Button
              onClick={() => setShowStripeImporter(true)}
              variant="outline"
              className="border-blue-300 hover:bg-blue-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              From Stripe Product
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <ProjectStatsCard
            title="Active Projects"
            value={activeProjects.length}
            icon={FolderOpen}
            color="purple"
          />
          <ProjectStatsCard
            title="Total Content"
            value={totalContent}
            icon={Sparkles}
            color="indigo"
          />
          <ProjectStatsCard
            title="Projects with Content"
            value={projectsWithContent}
            icon={BarChart3}
            color="blue"
          />
          <ProjectStatsCard
            title="Available Templates"
            value={templates.length}
            icon={FileText}
            color="green"
          />
        </div>

        {/* Search */}
        <Card className="border-2 border-purple-200">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search projects by name, description, or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : displayProjects.length === 0 ? (
          <Card className="border-2 border-dashed border-purple-300">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              {showArchived ? <Archive className="w-16 h-16 text-orange-300 mb-4" /> : <FolderOpen className="w-16 h-16 text-purple-300 mb-4" />}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {showArchived ? 'No archived projects' : searchQuery ? 'No projects found' : 'No projects yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {showArchived 
                  ? 'Archived projects will appear here'
                  : searchQuery 
                    ? 'Try adjusting your search query'
                    : 'Create your first project to organize content generation'
                }
              </p>
              {!searchQuery && !showArchived && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {displayProjects.map((project) => {
              const projectContent = contentHistory.filter(c => c.project_id === project.id);
              return (
                <ProjectCard
                  key={project.id}
                  project={project}
                  contentCount={projectContent.length}
                  personas={personas}
                  templates={templates}
                  onView={() => setSelectedProject(project)}
                  onUpdate={(data) => updateMutation.mutate({ id: project.id, data })}
                  onDelete={() => deleteMutation.mutate(project.id)}
                  onUnarchive={() => unarchiveMutation.mutate(project.id)}
                  isArchived={project.is_active === false}
                />
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <CreateProjectModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        personas={personas}
        templates={templates}
      />

      <ProjectImporter
        open={showProjectImporter}
        onClose={() => setShowProjectImporter(false)}
        onProjectCreated={(project) => {
          queryClient.invalidateQueries({ queryKey: ['projects'] });
          setShowProjectImporter(false);
        }}
      />

      <StripeProductImporter
        open={showStripeImporter}
        onClose={() => setShowStripeImporter(false)}
        onImport={(data) => {
          createMutation.mutate(data);
          setShowStripeImporter(false);
        }}
      />

      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          open={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          contentHistory={contentHistory.filter(c => c.project_id === selectedProject.id)}
          allContentHistory={contentHistory}
          personas={personas}
          templates={templates}
          onUpdate={(data) => {
            updateMutation.mutate({ id: selectedProject.id, data });
            setSelectedProject({ ...selectedProject, ...data });
          }}
        />
      )}
    </div>
  );
}
