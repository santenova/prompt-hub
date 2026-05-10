import React, { useState, useMemo, useEffect } from "react";
import { apiClient } from "@/apis/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Edit, MessageSquare, Copy, UserPlus, Heart, Shield, Database } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useElasticsearchDataSource } from "../components/admin/ElasticsearchDataSource";

const categoryColors = {
  Writing: "bg-blue-100 text-blue-800",
  Marketing: "bg-purple-100 text-purple-800",
  Coding: "bg-green-100 text-green-800",
  Design: "bg-pink-100 text-pink-800",
  Business: "bg-yellow-100 text-yellow-800",
  Education: "bg-indigo-100 text-indigo-800",
};

export default function SharedTemplates() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [suggestionText, setSuggestionText] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Elasticsearch data source
  const { isEnabled: esEnabled, isEntityEnabled, getEntity, config: esConfig } = useElasticsearchDataSource();
  const [esDataSource, setEsDataSource] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await apiClient.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error fetching user:", error);
        setCurrentUser(null);
      } finally {
        setIsLoadingAuth(false);
      }
    };
    fetchUser();
  }, []);

  // Check if ES is enabled for Templates
  useEffect(() => {
    setEsDataSource(isEntityEnabled('Template'));
  }, [esConfig, isEntityEnabled]);

  // Fetch all templates - from ES
  const { data: allTemplates = [], isLoading } = useQuery({
    queryKey: ['all-templates', esDataSource],
    queryFn: async () => {
      if (esDataSource) {
        const esData = await getEntity('Template');
        if (esData) return esData;
      }
      return apiClient.entities.Template.list('-updated_date');
    },
    initialData: [],
  });

  // Filter templates shared with current user
  const sharedTemplates = useMemo(() => {
    if (!currentUser) return [];
    
    return allTemplates.filter(t => {
      // Not created by me
      if (t.created_by === currentUser.email) return false;
      
      // Shared directly via shared_with array
      if (t.shared_with?.includes(currentUser.email)) return true;
      
      // Has explicit permission in user_permissions object
      if (t.user_permissions && t.user_permissions[currentUser.email]) return true;
      
      // Is a collaborator
      if (t.collaborators?.some(c => c.email === currentUser.email)) return true;
      
      // Public templates (visibility or is_public flag)
      if (t.is_public || t.visibility === 'public') return true;
      
      return false;
    });
  }, [allTemplates, currentUser]);

  // Group by permission level
  const groupedTemplates = useMemo(() => {
    const groups = {
      edit: [],
      contribute: [],
      view: [],
      public: []
    };

    sharedTemplates.forEach(template => {
      if (template.visibility === 'public' || template.is_public) {
        groups.public.push(template);
      } else {
        // Check user_permissions first
        let permission = template.user_permissions?.[currentUser?.email];
        
        // If no permission in user_permissions, check collaborators
        if (!permission && template.collaborators) {
          const collab = template.collaborators.find(c => c.email === currentUser?.email);
          if (collab) {
            // Map collaborator permission to our permission levels
            permission = collab.permission === 'admin' ? 'edit' : collab.permission;
          }
        }
        
        // Default to view if shared but no specific permission
        if (!permission && template.shared_with?.includes(currentUser?.email)) {
          permission = 'view';
        }
        
        if (permission && groups[permission]) {
          groups[permission].push(template);
        } else if (permission) {
          groups.view.push(template);
        }
      }
    });

    return groups;
  }, [sharedTemplates, currentUser]);

  const copyTemplateMutation = useMutation({
    mutationFn: async (template) => {
      const { id, created_date, updated_date, created_by, created_by_id, entity_name, app_id, is_deleted, deleted_date, ...templateData } = template;
      return await apiClient.entities.Template.create({
        ...templateData,
        is_public: false,
        visibility: 'private',
        folder: 'Imported',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
      toast({
        title: "Template Copied",
        description: "Template added to your collection",
      });
    },
  });

  const suggestImprovementMutation = useMutation({
    mutationFn: async ({ templateId, suggestion }) => {
      return await apiClient.entities.TemplateComment.create({
        template_id: templateId,
        comment: `💡 Suggestion: ${suggestion}`,
        author_name: currentUser.full_name || currentUser.email,
        author_email: currentUser.email,
        is_resolved: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['template-comments']);
      setShowSuggestionModal(false);
      setSuggestionText('');
      setSelectedTemplate(null);
      toast({
        title: "Suggestion Submitted",
        description: "Your improvement suggestion has been shared with the owner",
      });
    },
  });

  const handleSuggest = (template) => {
    setSelectedTemplate(template);
    setShowSuggestionModal(true);
  };

  const handleSubmitSuggestion = () => {
    if (!suggestionText.trim()) return;
    suggestImprovementMutation.mutate({
      templateId: selectedTemplate.id,
      suggestion: suggestionText,
    });
  };

  const filteredTemplates = useMemo(() => {
    if (!searchQuery) return sharedTemplates;
    
    const query = searchQuery.toLowerCase();
    return sharedTemplates.filter(t => 
      t.title.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query) ||
      t.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }, [sharedTemplates, searchQuery]);

  const getPermissionBadge = (template) => {
    if (template.visibility === 'public' || template.is_public) {
      return <Badge variant="outline" className="flex items-center gap-1"><Eye className="w-3 h-3" />Public</Badge>;
    }
    
    // Check user_permissions first
    let permission = template.user_permissions?.[currentUser?.email];
    
    // Check collaborators if no direct permission
    if (!permission && template.collaborators) {
      const collab = template.collaborators.find(c => c.email === currentUser?.email);
      if (collab) {
        permission = collab.permission === 'admin' ? 'edit' : collab.permission;
      }
    }
    
    // Default to view
    permission = permission || 'view';
    
    if (permission === 'edit' || permission === 'admin') {
      return <Badge className="bg-green-100 text-green-800 flex items-center gap-1"><Edit className="w-3 h-3" />Can Edit</Badge>;
    } else if (permission === 'contribute' || permission === 'editor') {
      return <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1"><MessageSquare className="w-3 h-3" />Can Suggest</Badge>;
    }
    return <Badge variant="secondary" className="flex items-center gap-1"><Eye className="w-3 h-3" />View Only</Badge>;
  };

  const canEdit = (template) => {
    // Check user_permissions
    if (template.user_permissions?.[currentUser?.email] === 'edit') return true;
    
    // Check collaborators
    const collab = template.collaborators?.find(c => c.email === currentUser?.email);
    if (collab && (collab.permission === 'edit' || collab.permission === 'admin' || collab.permission === 'editor')) {
      return true;
    }
    
    return false;
  };

  const canSuggest = (template) => {
    const permission = template.user_permissions?.[currentUser?.email];
    if (permission === 'contribute' || permission === 'edit') return true;
    
    // Check collaborators
    const collab = template.collaborators?.find(c => c.email === currentUser?.email);
    if (collab) return true;
    
    return template.visibility === 'public';
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to view shared templates</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => apiClient.auth.redirectToLogin()} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <UserPlus className="w-10 h-10" />
              <h1 className="text-4xl md:text-5xl font-bold">Shared with Me</h1>
            </div>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Templates shared by others and available for collaboration
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Data Source Indicator */}
        {esDataSource && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <Badge className="bg-orange-100 text-orange-800 border border-orange-300">
              <Database className="w-3 h-3 mr-1" />
              Data from Elasticsearch ({esConfig?.indices?.Template || 'templates'})
            </Badge>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
        >
          <Card className={esDataSource ? "border-orange-200" : ""}>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-orange-600">{allTemplates.length}</div>
              <div className="text-sm text-gray-600">Total {esDataSource ? "(ES)" : ""}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600">{groupedTemplates.edit.length}</div>
              <div className="text-sm text-gray-600">Can Edit</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-600">{groupedTemplates.contribute.length}</div>
              <div className="text-sm text-gray-600">Can Suggest</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-gray-600">{groupedTemplates.view.length}</div>
              <div className="text-sm text-gray-600">View Only</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-purple-600">{groupedTemplates.public.length}</div>
              <div className="text-sm text-gray-600">Public</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search shared templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
        </div>

        {/* Tabs by Permission */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All ({filteredTemplates.length})</TabsTrigger>
            <TabsTrigger value="edit">Can Edit ({groupedTemplates.edit.length})</TabsTrigger>
            <TabsTrigger value="contribute">Can Suggest ({groupedTemplates.contribute.length})</TabsTrigger>
            <TabsTrigger value="view">View Only ({groupedTemplates.view.length})</TabsTrigger>
            <TabsTrigger value="public">Public ({groupedTemplates.public.length})</TabsTrigger>
          </TabsList>

          {['all', 'edit', 'contribute', 'view', 'public'].map(tab => (
            <TabsContent key={tab} value={tab}>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-64 w-full rounded-xl" />
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  <AnimatePresence>
                    {(tab === 'all' ? filteredTemplates : groupedTemplates[tab] || []).map((template) => (
                      <motion.div
                        key={template.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <Card className="h-full hover:shadow-lg transition-all">
                          <CardHeader>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <CardTitle className="text-lg">{template.title}</CardTitle>
                              {getPermissionBadge(template)}
                            </div>
                            {template.description && (
                              <CardDescription className="line-clamp-2">
                                {template.description}
                              </CardDescription>
                            )}
                            <div className="flex flex-wrap gap-2 mt-3">
                              <Badge className={categoryColors[template.category]}>
                                {template.category}
                              </Badge>
                              {template.tags?.slice(0, 2).map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-4">
                            <p className="text-sm text-gray-700 line-clamp-3 bg-gray-50 p-3 rounded-lg border">
                              {template.content}
                            </p>

                            <div className="text-xs text-gray-500">
                              Shared by {template.created_by?.split('@')[0]}
                            </div>

                            <div className="flex gap-2">
                              <Button
                                onClick={() => copyTemplateMutation.mutate(template)}
                                variant="outline"
                                className="flex-1"
                                size="sm"
                              >
                                <Copy className="w-4 h-4 mr-2" />
                                Copy
                              </Button>
                              
                              {canEdit(template) && (
                                <Button
                                  onClick={() => {/* Handle edit */}}
                                  className="flex-1"
                                  size="sm"
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </Button>
                              )}
                              
                              {canSuggest(template) && (
                                <Button
                                  onClick={() => handleSuggest(template)}
                                  variant="outline"
                                  className="flex-1"
                                  size="sm"
                                >
                                  <MessageSquare className="w-4 h-4 mr-2" />
                                  Suggest
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}

              {!isLoading && (tab === 'all' ? filteredTemplates : groupedTemplates[tab] || []).length === 0 && (
                <div className="text-center py-20">
                  <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">No templates here</h3>
                  <p className="text-gray-600">
                    {tab === 'all' 
                      ? 'No templates have been shared with you yet' 
                      : `No templates with ${tab === 'edit' ? 'edit' : tab === 'contribute' ? 'suggest' : tab === 'view' ? 'view only' : 'public'} permission`}
                  </p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Suggestion Modal */}
      <Dialog open={showSuggestionModal} onOpenChange={setShowSuggestionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suggest Improvement</DialogTitle>
            <DialogDescription>
              Share your ideas to improve "{selectedTemplate?.title}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Your Suggestion</Label>
              <Textarea
                placeholder="Describe your suggested improvement or variation..."
                value={suggestionText}
                onChange={(e) => setSuggestionText(e.target.value)}
                rows={6}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowSuggestionModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitSuggestion}
              disabled={!suggestionText.trim() || suggestImprovementMutation.isPending}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {suggestImprovementMutation.isPending ? 'Submitting...' : 'Submit Suggestion'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
