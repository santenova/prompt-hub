import React, { useState, useMemo, useEffect } from "react";
import { client } from "@/apis/client";;
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { handleRateLimitError } from "../components/utils/rateLimitHandler";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FolderPlus, Star, Layers, Sparkles, Brain, FileJson, Edit, Wand2, CheckSquare, XSquare, Database, Info, Lightbulb, FileText, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TemplateImportExport from "../components/admin/TemplateImportExport";
import { useElasticsearchDataSource } from "../components/admin/ElasticsearchDataSource";
import DomainSpecificTemplates from "../components/templates/DomainSpecificTemplates";
import ContextualHelpPanel from "../components/onboarding/ContextualHelp";
import GuidedTour, { TOURS } from "../components/onboarding/GuidedTour";
import { useMilestoneTracker } from "../components/onboarding/ProgressTracker";

import TemplateCard from "../components/templates/TemplateCard.jsx";
import AddTemplateModal from "../components/templates/AddTemplateModal.jsx";
import CategoryFilter from "../components/prompts/CategoryFilter";
import FolderManager from "../components/templates/FolderManager.jsx";
import CollaborativeEditor from "../components/templates/CollaborativeEditor.jsx";
import TeamInsightsAI from "../components/templates/TeamInsightsAI.jsx";
import AITemplateGenerator from "../components/templates/AITemplateGenerator.jsx";
import FolderTreeView from "../components/templates/FolderTreeView.jsx";
import SearchWithSuggestions from "../components/templates/SearchWithSuggestions.jsx";
import AdvancedSearchFilters from "../components/templates/AdvancedSearchFilters.jsx";
import VersionHistory from "../components/templates/VersionHistory.jsx";
import InviteCollaboratorModal from "../components/templates/InviteCollaboratorModal.jsx";
import CollaboratorsList from "../components/templates/CollaboratorsList.jsx";
import ChangeLog from "../components/templates/ChangeLog.jsx";
import OllamaStatusChip from "../components/ollama/OllamaStatusChip";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

const proTips = [
  { title: "Use placeholders", desc: "Add {{placeholders}} for reusable templates across projects" },
  { title: "Collaborate live", desc: "Multiple users can edit templates simultaneously in real-time" },
  { title: "Version control", desc: "Track all changes and restore any previous version instantly" },
  { title: "Organize with folders", desc: "Create nested folder structures for easy navigation" },
  { title: "Tag everything", desc: "Use tags for cross-category searching and discovery" },
  { title: "Share strategically", desc: "Grant view, edit, or admin permissions to collaborators" },
  { title: "Import/Export", desc: "Backup templates as JSON or migrate between workspaces" },
  { title: "AI suggestions", desc: "Get smart recommendations for template improvements" },
  { title: "Test with Ollama", desc: "Preview template outputs with local AI models" },
  { title: "Batch operations", desc: "Select multiple templates to update categories, tags, or folders at once" }
];

const perfectForItems = [
  { icon: "📝", title: "Marketers" },
  { icon: "💼", title: "Business" },
  { icon: "👨‍💻", title: "Developers" },
  { icon: "📢", title: "Social Media" },
  { icon: "✍️", title: "Writers" },
  { icon: "🎓", title: "Educators" },
  { icon: "💰", title: "Fundraisers" },
  { icon: "🏢", title: "HR Teams" },
  { icon: "🎨", title: "Agencies" },
  { icon: "📊", title: "Analysts" }
];

export default function Templates() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [collaboratingTemplate, setCollaboratingTemplate] = useState(null);
  const [showTeamInsights, setShowTeamInsights] = useState(false);
  const [insightsTemplate, setInsightsTemplate] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedFolder, setSelectedFolder] = useState("All");
  const [searchQuery, setSearchQuery] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('search') || "";
  });
  const [showFavorites, setShowFavorites] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [aiGeneratorMode, setAiGeneratorMode] = useState('create');
  const [showFolderTree, setShowFolderTree] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    creator: 'All',
    tags: [],
    dateFrom: null,
    dateTo: null
  });
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versionHistoryTemplate, setVersionHistoryTemplate] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteTemplate, setInviteTemplate] = useState(null);
  const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false);
  const [collaboratorsTemplate, setCollaboratorsTemplate] = useState(null);
  const [showChangeLogModal, setShowChangeLogModal] = useState(false);
  const [changeLogTemplate, setChangeLogTemplate] = useState(null);
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [showImportExport, setShowImportExport] = useState(false);
  const [activeTour, setActiveTour] = useState(null);
  const [showInfoBanner, setShowInfoBanner] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("allTemplates");

  const queryClient = useQueryClient();
  const { trackMilestone } = useMilestoneTracker();
  const esHook = useElasticsearchDataSource();
  const { isEntityEnabled, getEntity, createEntity, updateEntity } = esHook || { 
    isEntityEnabled: () => false, 
    getEntity: () => null,
    createEntity: () => null,
    updateEntity: () => null
  };



  React.useEffect(() => {
    const fetchUser = async () => {
      setIsLoadingAuth(true);
      try {
        const user = await client.auth.me();
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

  // Rotate pro tips every 5 seconds
  React.useEffect(() => {
    if (!showInfoBanner) return;
    const interval = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % proTips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [showInfoBanner]);

  // Listen for URL search param changes (e.g., from global search)
  React.useEffect(() => {
    const handleUrlChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const searchFromUrl = urlParams.get('search');
      if (searchFromUrl) {
        setSearchQuery(searchFromUrl);
      }
    };
    
    // Check on mount and listen to popstate
    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    
    // Also listen for custom navigation events
    const observer = new MutationObserver(handleUrlChange);
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      observer.disconnect();
    };
  }, []);

  const { data: allTemplates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      try {
        if (isEntityEnabled && isEntityEnabled('Template')) {
          const esData = await getEntity('Template');
          if (esData && Array.isArray(esData)) {
            return esData.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
          }
        }
        const data = await client.entities.Template.list('-created_date');
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching templates:', error);
        handleRateLimitError(error);
        return [];
      }
    },
    staleTime: 180000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    initialData: [],
    retry: (failureCount, error) => {
      if (error?.message?.includes('Rate limit')) return failureCount < 3;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Auto-sync on page load with delay
  React.useEffect(() => {
    if (!isLoading && !isLoadingAuth) {
      const timer = setTimeout(() => {
        queryClient.invalidateQueries(['templates']);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isLoadingAuth, queryClient]);

  const regularTemplates = useMemo(
    () => allTemplates.filter((t) => !t.domain || t.domain.trim() === ""),
    [allTemplates]
  );

  const domainSpecificTemplates = useMemo(
    () => allTemplates.filter((t) => t.domain && t.domain.trim() !== ""),
    [allTemplates]
  );

  const createTemplateMutation = useMutation({
    mutationFn: async (data) => {
      if (isEntityEnabled && isEntityEnabled('Template') && createEntity) {
        const esResult = await createEntity('Template', data);
        if (esResult) return esResult;
      }
      return client.entities.Template.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
      setShowAddModal(false);
      setEditingTemplate(null);
      setShowAIGenerator(false);
    },
    onError: (error) => {
      handleRateLimitError(error);
    },
    retry: (failureCount, error) => {
      if (error?.message?.includes('Rate limit')) return failureCount < 2;
      return false;
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      if (isEntityEnabled && isEntityEnabled('Template') && updateEntity) {
        const esResult = await updateEntity('Template', id, data);
        if (esResult) return esResult;
      }
      return client.entities.Template.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
    },
    onError: (error) => {
      handleRateLimitError(error);
    },
    retry: (failureCount, error) => {
      if (error?.message?.includes('Rate limit')) return failureCount < 2;
      return false;
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => client.entities.Template.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
    },
    onError: (error) => {
      handleRateLimitError(error);
    },
  });

  const handleSaveTemplate = async (data) => {
    if (editingTemplate) {
      const versionHistoryEntry = {
        version: editingTemplate.version || 1,
        title: editingTemplate.title,
        content: editingTemplate.content,
        category: editingTemplate.category,
        subcategory: editingTemplate.subcategory,
        tags: editingTemplate.tags,
        edited_by: currentUser?.email,
        edited_by_name: currentUser?.full_name || currentUser?.email,
        saved_date: new Date().toISOString(),
        change_notes: data.change_notes || 'Updated template'
      };

      // Create change log entry for content update
      const changeLogEntry = {
        timestamp: new Date().toISOString(),
        user_email: currentUser?.email,
        user_name: currentUser?.full_name || currentUser?.email,
        action: 'updated',
        description: data.change_notes || 'Template content updated',
        field: 'content',
        old_value: editingTemplate.content,
        new_value: data.content
      };

      updateTemplateMutation.mutate({
        id: editingTemplate.id,
        data: {
          ...data,
          version: (editingTemplate.version || 1) + 1,
          version_history: [...(editingTemplate.version_history || []), versionHistoryEntry],
          change_log: [...(editingTemplate.change_log || []), changeLogEntry]
        }
      }, {
        onSuccess: () => {
          setShowAddModal(false);
          setEditingTemplate(null);
        }
      });
    } else {
      createTemplateMutation.mutate(data);
      // Track milestone
      await trackMilestone('first-template');
      
      // Check for 10 templates milestone
      if (allTemplates.length + 1 >= 10) {
        await trackMilestone('ten-templates');
      }
    }
  };

  const handleSaveAsVersion = (baseTemplate, newTemplateData) => {
    const versionHistoryEntry = {
      version: baseTemplate.version || 1,
      title: baseTemplate.title,
      content: baseTemplate.content,
      category: baseTemplate.category,
      subcategory: baseTemplate.subcategory,
      tags: baseTemplate.tags,
      edited_by: currentUser?.email,
      edited_by_name: currentUser?.full_name || currentUser?.email,
      saved_date: new Date().toISOString(),
      change_notes: 'AI-generated refinement/variation'
    };

    const changeLogEntry = {
      timestamp: new Date().toISOString(),
      user_email: currentUser?.email,
      user_name: currentUser?.full_name || currentUser?.email,
      action: 'ai_generated_version',
      description: 'AI generated refinement or variation saved as new version',
      field: 'content',
      old_value: baseTemplate.content,
      new_value: newTemplateData.content
    };

    updateTemplateMutation.mutate({
      id: baseTemplate.id,
      data: {
        ...newTemplateData,
        version: (baseTemplate.version || 1) + 1,
        version_history: [...(baseTemplate.version_history || []), versionHistoryEntry],
        change_log: [...(baseTemplate.change_log || []), changeLogEntry]
      }
    }, {
      onSuccess: () => {
        setShowAIGenerator(false);
        setShowAddModal(false);
      }
    });
  };

  const handleRestoreVersion = (template, version) => {
    const versionHistoryEntry = {
      version: template.version || 1,
      title: template.title,
      content: template.content,
      category: template.category,
      subcategory: template.subcategory,
      tags: template.tags,
      edited_by: currentUser?.email,
      edited_by_name: currentUser?.full_name || currentUser?.email,
      saved_date: new Date().toISOString(),
      change_notes: `Reverted to version ${version.version}`
    };

    const changeLogEntry = {
      timestamp: new Date().toISOString(),
      user_email: currentUser?.email,
      user_name: currentUser?.full_name || currentUser?.email,
      action: 'reverted',
      description: `Reverted to version ${version.version}`,
      field: 'content',
      old_value: template.content,
      new_value: version.content
    };

    updateTemplateMutation.mutate({
      id: template.id,
      data: {
        title: version.title,
        content: version.content,
        category: version.category,
        subcategory: version.subcategory,
        tags: version.tags,
        version: (template.version || 1) + 1,
        version_history: [...(template.version_history || []), versionHistoryEntry],
        change_log: [...(template.change_log || []), changeLogEntry]
      }
    }, {
      onSuccess: () => {
        setShowVersionHistory(false);
        setVersionHistoryTemplate(null);
      }
    });
  };

  const handleEditTemplate = (template) => {
    const isOwner = template.created_by === currentUser?.email;
    const collaborator = template.collaborators?.find(c => c.email === currentUser?.email);
    const canEdit = isOwner || collaborator?.permission === 'editor' || collaborator?.permission === 'admin';

    if (canEdit) {
      // Use collaborative editor for templates with collaborators
      if (template.collaborators && template.collaborators.length > 0) {
        setCollaboratingTemplate(template);
      } else {
        setEditingTemplate(template);
        setShowAddModal(true);
        setShowAIGenerator(false);
      }
    } else {
      console.warn("User does not have permission to edit this template.");
      // Optionally show a toast or message to the user
    }
  };

  const handleUpdateTemplate = (id, data) => {
    const template = allTemplates.find(t => t.id === id);
    if (!template) return;

    // Create change log entry base
    const baseChangeLogEntry = {
      timestamp: new Date().toISOString(),
      user_email: currentUser?.email,
      user_name: currentUser?.full_name || currentUser?.email,
      action: 'updated',
      description: 'Template updated'
    };

    // Add field-level changes
    const changes = [];
    if (data.content !== template.content) {
      changes.push({
        ...baseChangeLogEntry,
        field: 'content',
        old_value: template.content,
        new_value: data.content
      });
    }
    if (data.title !== template.title) {
      changes.push({
        ...baseChangeLogEntry,
        field: 'title',
        old_value: template.title,
        new_value: data.title
      });
    }
    // Add other fields to track if needed, e.g., category, tags, etc.
    if (data.category !== template.category) {
      changes.push({
        ...baseChangeLogEntry,
        field: 'category',
        old_value: template.category,
        new_value: data.category
      });
    }
    if (JSON.stringify(data.tags) !== JSON.stringify(template.tags)) {
      changes.push({
        ...baseChangeLogEntry,
        field: 'tags',
        old_value: template.tags,
        new_value: data.tags
      });
    }

    const updatedChangeLog = [...(template.change_log || []), ...changes];

    if (data.content !== template.content) {
      const versionHistoryEntry = {
        version: template.version || 1,
        title: template.title,
        content: template.content,
        category: template.category,
        subcategory: template.subcategory,
        tags: template.tags,
        edited_by: currentUser?.email,
        edited_by_name: currentUser?.full_name || currentUser?.email,
        saved_date: new Date().toISOString(),
        change_notes: 'Template updated'
      };

      updateTemplateMutation.mutate({
        id,
        data: {
          ...data,
          version: (template.version || 1) + 1,
          version_history: [...(template.version_history || []), versionHistoryEntry],
          change_log: updatedChangeLog
        }
      });
    } else {
      updateTemplateMutation.mutate({
        id,
        data: {
          ...data,
          change_log: updatedChangeLog
        }
      });
    }
  };

  const handleDeleteTemplate = (id) => {
    deleteTemplateMutation.mutate(id);
  };

  const handleCreateFolder = (folderName) => {
    setSelectedFolder(folderName);
  };

  const handleRenameFolder = async (oldName, newName) => {
    const templatesInFolder = regularTemplates.filter(t => (t.folder || "Uncategorized") === oldName);

    for (const template of templatesInFolder) {
      const changeLogEntry = {
        timestamp: new Date().toISOString(),
        user_email: currentUser?.email,
        user_name: currentUser?.full_name || currentUser?.email,
        action: 'folder_renamed',
        description: `Folder changed from ${oldName} to ${newName}`,
        field: 'folder',
        old_value: oldName,
        new_value: newName
      };

      await updateTemplateMutation.mutateAsync({
        id: template.id,
        data: {
          folder: newName,
          change_log: [...(template.change_log || []), changeLogEntry]
        }
      });
    }

    if (selectedFolder === oldName) {
      setSelectedFolder(newName);
    }
  };

  const handleDeleteFolder = async (folderName) => {
    const templatesInFolder = regularTemplates.filter(t => (t.folder || "Uncategorized") === folderName);

    for (const template of templatesInFolder) {
      const changeLogEntry = {
        timestamp: new Date().toISOString(),
        user_email: currentUser?.email,
        user_name: currentUser?.full_name || currentUser?.email,
        action: 'folder_removed',
        description: `Template moved from deleted folder ${folderName} to Uncategorized`,
        field: 'folder',
        old_value: folderName,
        new_value: 'Uncategorized'
      };

      await updateTemplateMutation.mutateAsync({
        id: template.id,
        data: {
          folder: 'Uncategorized',
          change_log: [...(template.change_log || []), changeLogEntry]
        }
      });
    }

    setSelectedFolder('All');
  };

  const handleMoveTemplate = async (templateId, newFolder) => {
    const template = allTemplates.find(t => t.id === templateId);
    if (!template) return;

    const oldFolder = template.folder || "Uncategorized";
    const changeLogEntry = {
      timestamp: new Date().toISOString(),
      user_email: currentUser?.email,
      user_name: currentUser?.full_name || currentUser?.email,
      action: 'moved_folder',
      description: `Template moved from folder ${oldFolder} to ${newFolder}`,
      field: 'folder',
      old_value: oldFolder,
      new_value: newFolder
    };

    await updateTemplateMutation.mutateAsync({
      id: templateId,
      data: {
        folder: newFolder,
        change_log: [...(template.change_log || []), changeLogEntry]
      }
    });
  };

  const handleToggleFavorite = (template) => {
    const changeLogEntry = {
      timestamp: new Date().toISOString(),
      user_email: currentUser?.email,
      user_name: currentUser?.full_name || currentUser?.email,
      action: template.is_favorite ? 'unfavorited' : 'favorited',
      description: template.is_favorite ? 'Template removed from favorites' : 'Template added to favorites',
      field: 'is_favorite',
      old_value: template.is_favorite,
      new_value: !template.is_favorite
    };

    updateTemplateMutation.mutate({
      id: template.id,
      data: {
        is_favorite: !template.is_favorite,
        change_log: [...(template.change_log || []), changeLogEntry]
      }
    });
  };

  const handleUseTemplate = (template) => {
    const changeLogEntry = {
      timestamp: new Date().toISOString(),
      user_email: currentUser?.email,
      user_name: currentUser?.full_name || currentUser?.email,
      action: 'used_template',
      description: 'Template was used',
      field: 'use_count',
      old_value: template.use_count || 0,
      new_value: (template.use_count || 0) + 1
    };

    updateTemplateMutation.mutate({
      id: template.id,
      data: {
        use_count: (template.use_count || 0) + 1,
        change_log: [...(template.change_log || []), changeLogEntry]
      }
    });
  };

  const handleShowInsights = (template) => {
    setInsightsTemplate(template);
    setShowTeamInsights(true);
  };

  const handleShowVersionHistory = (template) => {
    setVersionHistoryTemplate(template);
    setShowVersionHistory(true);
  };

  const handleApplyAITemplate = (aiTemplate) => {
    setEditingTemplate(null);
    setShowAddModal(true);

    setTimeout(() => {
      const event = new CustomEvent('prefillTemplate', { detail: aiTemplate });
      window.dispatchEvent(event);
    }, 100);

    setShowAIGenerator(false);
  };

  const handleQuickRefine = (template) => {
    setEditingTemplate(template);
    setAiGeneratorMode('refine');
    setShowAIGenerator(true);
    setShowAddModal(false);
  };

  const handleQuickVariations = (template) => {
    setEditingTemplate(template);
    setAiGeneratorMode('variations');
    setShowAIGenerator(true);
    setShowAddModal(false);
  };

  const handleInviteCollaborators = (template) => {
    setInviteTemplate(template);
    setShowInviteModal(true);
  };

  const handleSendInvites = (invites) => {
    if (!inviteTemplate) return;

    const existingCollaborators = inviteTemplate.collaborators || [];
    const newCollaborators = [...existingCollaborators, ...invites];

    // Create change log entries
    const changeLogEntries = invites.map(invite => ({
      timestamp: new Date().toISOString(),
      user_email: currentUser?.email,
      user_name: currentUser?.full_name || currentUser?.email,
      action: 'collaborator_added',
      description: `Added ${invite.email} as ${invite.permission}`,
      field: 'collaborators',
      new_value: invite.email
    }));

    updateTemplateMutation.mutate({
      id: inviteTemplate.id,
      data: {
        collaborators: newCollaborators,
        change_log: [...(inviteTemplate.change_log || []), ...changeLogEntries]
      }
    }, {
      onSuccess: () => {
        setShowInviteModal(false);
        setInviteTemplate(null);
      }
    });
  };

  const handleUpdatePermission = (templateId, collaboratorEmail, newPermission) => {
    const template = allTemplates.find(t => t.id === templateId);
    if (!template) return;

    const updatedCollaborators = template.collaborators.map(c =>
      c.email === collaboratorEmail ? { ...c, permission: newPermission } : c
    );

    const changeLogEntry = {
      timestamp: new Date().toISOString(),
      user_email: currentUser?.email,
      user_name: currentUser?.full_name || currentUser?.email,
      action: 'permission_changed',
      description: `Changed ${collaboratorEmail}'s permission to ${newPermission}`,
      field: 'permission',
      old_value: template.collaborators.find(c => c.email === collaboratorEmail)?.permission,
      new_value: newPermission
    };

    updateTemplateMutation.mutate({
      id: templateId,
      data: {
        collaborators: updatedCollaborators,
        change_log: [...(template.change_log || []), changeLogEntry]
      }
    });
  };

  const handleRemoveCollaborator = (templateId, collaboratorEmail) => {
    const template = allTemplates.find(t => t.id === templateId);
    if (!template) return;

    const updatedCollaborators = template.collaborators.filter(c => c.email !== collaboratorEmail);

    const changeLogEntry = {
      timestamp: new Date().toISOString(),
      user_email: currentUser?.email,
      user_name: currentUser?.full_name || currentUser?.email,
      action: 'collaborator_removed',
      description: `Removed ${collaboratorEmail} from collaborators`,
      field: 'collaborators',
      old_value: collaboratorEmail,
      new_value: null
    };

    updateTemplateMutation.mutate({
      id: templateId,
      data: {
        collaborators: updatedCollaborators,
        change_log: [...(template.change_log || []), changeLogEntry]
      }
    });
  };

  const handleShowCollaborators = (template) => {
    setCollaboratorsTemplate(template);
    setShowCollaboratorsModal(true);
  };

  const handleShowChangeLog = (template) => {
    setChangeLogTemplate(template);
    setShowChangeLogModal(true);
  };

  const folders = useMemo(() => {
    const folderSet = new Set(
      regularTemplates
        .map(t => t.folder || "Uncategorized")
        .filter(f => f && f.trim() !== '')
    );
    return Array.from(folderSet).sort();
  }, [regularTemplates]);

  const availableCreators = useMemo(() => {
    const creators = new Set(regularTemplates.map(t => t.created_by).filter(Boolean));
    return Array.from(creators).sort();
  }, [regularTemplates]);

  const availableTags = useMemo(() => {
    const tagSet = new Set();
    regularTemplates.forEach(template => {
      if (template.tags) {
        template.tags.forEach(tag => {
          if (tag && tag.trim() !== '') {
            tagSet.add(tag);
          }
        });
      }
    });
    return Array.from(tagSet).sort();
  }, [regularTemplates]);

  const filteredTemplates = useMemo(() => {
    return regularTemplates.filter(template => {
      const categoryMatch = selectedCategory === "All" || template.category === selectedCategory;
      const folderMatch = selectedFolder === "All" || (template.folder || "Uncategorized") === selectedFolder;

      let searchMatch = true;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();

        if (query.startsWith('#')) {
          const tagQuery = query.slice(1);
          searchMatch = template.tags?.some(tag => tag.toLowerCase().includes(tagQuery));
        }
        else if (query.startsWith('@')) {
          const creatorQuery = query.slice(1);
          searchMatch = template.created_by?.toLowerCase().includes(creatorQuery);
        }
        else {
          searchMatch =
            template.title.toLowerCase().includes(query) ||
            template.description?.toLowerCase().includes(query) ||
            template.content.toLowerCase().includes(query) ||
            (template.tags && template.tags.some(tag => tag.toLowerCase().includes(query)));
        }
      }

      const favoriteMatch = !showFavorites || template.is_favorite;

      const creatorMatch = !advancedFilters.creator || advancedFilters.creator === 'All' ||
        template.created_by === advancedFilters.creator;

      const tagsMatch = !advancedFilters.tags || advancedFilters.tags.length === 0 ||
        advancedFilters.tags.every(filterTag => template.tags?.includes(filterTag));

      const dateFromMatch = !advancedFilters.dateFrom ||
        (template.created_date && new Date(template.created_date) >= new Date(advancedFilters.dateFrom));

      const dateToMatch = !advancedFilters.dateTo ||
        (template.created_date && new Date(template.created_date) <= new Date(advancedFilters.dateTo));

      return categoryMatch && folderMatch && searchMatch && favoriteMatch &&
             creatorMatch && tagsMatch && dateFromMatch && dateToMatch;
    });
  }, [regularTemplates, selectedCategory, selectedFolder, searchQuery, showFavorites, advancedFilters]);

  // Derived selection helpers (must come AFTER filteredTemplates to avoid TDZ)
  const allVisibleSelected = useMemo(() =>
    filteredTemplates.length > 0 &&
    filteredTemplates.every(p => selectedTemplates.some(sp => sp.id === p.id)),
    [filteredTemplates, selectedTemplates]
  );

  const handleSelectAllVisible = () => {
    if (allVisibleSelected) {
      const filteredIds = new Set(filteredTemplates.map(p => p.id));
      setSelectedTemplates(prev => prev.filter(p => !filteredIds.has(p.id)));
    } else {
      const selectedIds = new Set(selectedTemplates.map(p => p.id));
      const newTemplatesToAdd = filteredTemplates.filter(p => !selectedIds.has(p.id));
      setSelectedTemplates(prev => [...prev, ...newTemplatesToAdd]);
    }
  };

  const categoryCounts = regularTemplates.reduce((acc, template) => {
    acc[template.category] = (acc[template.category] || 0) + 1;
    acc["All"] = (acc["All"] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen">
      {/* Minimal Compact Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-purple-100 sticky top-16 z-40">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Prompts</h1>
                {isEntityEnabled && isEntityEnabled('Template') && (
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                    <Database className="w-3 h-3 mr-1" />
                    Elasticsearch
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-600">{regularTemplates.length} total • {regularTemplates.filter(t => t.is_favorite).length} favorites</p>
            </div>
            {currentUser && (
              <div className="flex gap-2 w-full sm:w-auto flex-wrap items-center">
                <OllamaStatusChip />
                {selectedTemplates.length === 0 && activeTab === "allTemplates" && (
                  <Button
                    onClick={() => {
                      setShowAIGenerator(!showAIGenerator);
                      setAiGeneratorMode('create');
                    }}
                    size="sm"
                    data-tour="ai-gen-button"
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/20 flex-1 sm:flex-none"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Generate
                  </Button>
                )}

                {filteredTemplates.length > 1 && (searchQuery || filteredTemplates.length < 10) && activeTab === "allTemplates" && (
                  <Button onClick={handleSelectAllVisible} variant="outline" size="sm" className="whitespace-nowrap">
                    {allVisibleSelected ? <XSquare className="w-4 h-4 mr-2" /> : <CheckSquare className="w-4 h-4 mr-2" />}
                    {allVisibleSelected ? 'Deselect All' : 'Select All'} ({filteredTemplates.length})
                  </Button>
                )}

                {activeTab === "allTemplates" && (
                  <Button
                    onClick={() => {
                      setEditingTemplate(null);
                      setShowAddModal(true);
                      setShowAIGenerator(false);
                    }}
                    size="sm"
                    variant="outline"
                    data-tour="create-button"
                    className="border-purple-300 hover:bg-purple-50 flex-1 sm:flex-none"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create
                  </Button>
                )}
                <Button
                  onClick={() => setShowImportExport(true)}
                  size="sm"
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-50"
                  title="Import/Export Templates"
                >
                  <FileJson className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInfoBanner(!showInfoBanner)}
                  className="text-gray-600 hover:text-purple-600"
                  title="Show/Hide Info"
                >
                  <Info className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="allTemplates">All Templates ({regularTemplates.length})</TabsTrigger>
            <TabsTrigger value="domainSpecific">Domain-Specific ({domainSpecificTemplates.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="allTemplates">
        {/* Info Banner */}
        <AnimatePresence>
          {showInfoBanner && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 rounded-2xl p-1 shadow-xl">
                <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-purple-600" />
                        How it Works
                      </h3>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li>• Browse or create prompts</li>
                        <li>• Use placeholders for reusability</li>
                        <li>• Organize with folders & tags</li>
                        <li>• Collaborate with team members</li>
                      </ul>
                    </div>
                    {/* Pro Tips hidden */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        Perfect For
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {perfectForItems.slice(0, 4).map((item, idx) => (
                          <div key={idx} className="bg-indigo-50 p-2 rounded-lg border border-indigo-200 text-center">
                            <div className="text-lg">{item.icon}</div>
                            <p className="text-xs font-medium text-gray-900 mt-1">{item.title}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <Brain className="w-4 h-4 text-blue-600" />
                        Quick Links
                      </h3>
                      <div className="space-y-2">
                        <Link to={createPageUrl('PersonasLibrary')} className="block text-xs text-blue-600 hover:text-blue-700 hover:underline">
                          → Browse Personas
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Generator Section */}
        <AnimatePresence>
          {showAIGenerator && currentUser && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <AITemplateGenerator
                onApplyTemplate={handleApplyAITemplate}
                initialPrompt={editingTemplate?.content}
                mode={aiGeneratorMode}
                existingTemplates={allTemplates}
                onSaveAsVersion={handleSaveAsVersion}
                />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4 mb-6"
        >
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1">
              <SearchWithSuggestions
                value={searchQuery}
                onChange={setSearchQuery}
                templates={regularTemplates}
                placeholder="Search prompts... (use # for tags, @ for creators)"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={showFavorites ? "default" : "outline"}
                onClick={() => setShowFavorites(!showFavorites)}
                className={`${showFavorites ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/20" : ""} whitespace-nowrap`}
                size="sm"
              >
                <Star className={`w-4 h-4 mr-2 ${showFavorites ? 'fill-white' : 'text-yellow-500'}`} />
                <span className="hidden sm:inline">Favorites</span>
              </Button>
              <Button
                variant={showFolderTree ? "default" : "outline"}
                onClick={() => setShowFolderTree(!showFolderTree)}
                size="sm"
                className={showFolderTree ? "bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/20" : ""}
              >
                <Layers className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Tree</span>
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
            <CategoryFilter
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              counts={categoryCounts}
            />

            <FolderManager
              folders={folders}
              selectedFolder={selectedFolder}
              onSelectFolder={setSelectedFolder}
              templates={regularTemplates}
              onCreateFolder={handleCreateFolder}
              onRenameFolder={handleRenameFolder}
              onDeleteFolder={handleDeleteFolder}
            />

            <AdvancedSearchFilters
              filters={advancedFilters}
              onFiltersChange={setAdvancedFilters}
              availableCreators={availableCreators}
              availableTags={availableTags}
              availableCategories={Object.keys(categoryCounts).filter(c => c !== 'All')}
            />
          </div>

          {(searchQuery || selectedCategory !== "All" || selectedFolder !== "All" || showFavorites ||
            advancedFilters.creator !== 'All' || advancedFilters.tags.length > 0 ||
            advancedFilters.dateFrom || advancedFilters.dateTo) && (
            <div className="text-xs sm:text-sm text-gray-600">
              Showing <span className="font-semibold text-purple-600">{filteredTemplates.length}</span> of {regularTemplates.length} prompts
            </div>
          )}
        </motion.div>

        {/* Folder Tree View */}
        <AnimatePresence>
          {showFolderTree && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <FolderTreeView
                folders={folders}
                templates={regularTemplates}
                selectedFolder={selectedFolder}
                onSelectFolder={setSelectedFolder}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        ) : !isLoading && filteredTemplates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 px-4"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center">
              <Layers className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              {searchQuery || showFavorites || advancedFilters.creator !== 'All' || advancedFilters.tags.length > 0 || advancedFilters.dateFrom || advancedFilters.dateTo ? 'No prompts found' : 'No prompts yet'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {searchQuery || showFavorites || advancedFilters.creator !== 'All' || advancedFilters.tags.length > 0 || advancedFilters.dateFrom || advancedFilters.dateTo
                ? 'Try adjusting your filters or search query'
                : currentUser ? 'Create your first prompt to get started' : 'Sign in to create and manage your prompts'}
            </p>
            {!searchQuery && !showFavorites && !advancedFilters.creator && advancedFilters.tags.length === 0 && !advancedFilters.dateFrom && !advancedFilters.dateTo && currentUser && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => {
                    setShowAIGenerator(true);
                    setAiGeneratorMode('create');
                  }}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/20"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Generate
                </Button>
                <Button
                  onClick={() => {
                    setShowAddModal(true);
                    setShowAIGenerator(false);
                  }}
                  variant="outline"
                  className="border-purple-300 hover:bg-purple-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Manually
                </Button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence>
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onEdit={handleEditTemplate}
                  onDelete={handleDeleteTemplate}
                  onToggleFavorite={handleToggleFavorite}
                  onUse={handleUseTemplate}
                  onShowInsights={handleShowInsights}
                  onUpdate={handleUpdateTemplate}
                  onMove={handleMoveTemplate}
                  folders={folders}
                  currentUserEmail={currentUser?.email}
                  currentUser={currentUser}
                  onQuickRefine={handleQuickRefine}
                  onQuickVariations={handleQuickVariations}
                  onShowVersionHistory={handleShowVersionHistory}
                  onInviteCollaborators={handleInviteCollaborators}
                  onShowCollaborators={handleShowCollaborators}
                  onShowChangeLog={handleShowChangeLog}
                  onSelect={(id, isSelected) => {
                    setSelectedTemplates(prev => 
                        isSelected ? [...prev, filteredTemplates.find(p => p.id === id)] : prev.filter(p => p.id !== id)
                    )
                  }}
                  isSelected={selectedTemplates.some(p => p.id === template.id)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
          </TabsContent>

          <TabsContent value="domainSpecific">
            <DomainSpecificTemplates 
              templates={domainSpecificTemplates}
              folders={folders}
              currentUser={currentUser}
              onEdit={handleEditTemplate}
              onDelete={handleDeleteTemplate}
              onToggleFavorite={handleToggleFavorite}
              onUse={handleUseTemplate}
              onShowInsights={handleShowInsights}
              onUpdate={handleUpdateTemplate}
              onMove={handleMoveTemplate}
              onQuickRefine={handleQuickRefine}
              onQuickVariations={handleQuickVariations}
              onShowVersionHistory={handleShowVersionHistory}
              onInviteCollaborators={handleInviteCollaborators}
              onShowCollaborators={handleShowCollaborators}
              onShowChangeLog={handleShowChangeLog}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Template Modal */}
      {currentUser && (
        <AddTemplateModal
          open={showAddModal}
          onOpenChange={(open) => {
            setShowAddModal(open);
            if (!open) setEditingTemplate(null);
          }}
          template={editingTemplate}
          folders={folders}
          onSave={handleSaveTemplate}
          isSaving={createTemplateMutation.isPending || updateTemplateMutation.isPending}
        />
      )}

      {/* Collaborative Editor Dialog */}
      {collaboratingTemplate && currentUser && (
        <Dialog open={!!collaboratingTemplate} onOpenChange={(open) => !open && setCollaboratingTemplate(null)}>
          <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {collaboratingTemplate.title}
              </DialogTitle>
            </DialogHeader>
            <CollaborativeEditor
              template={collaboratingTemplate}
              currentUser={currentUser}
              onSave={(id, data) => {
                handleUpdateTemplate(id, data);
                setCollaboratingTemplate(null);
              }}
              onClose={() => setCollaboratingTemplate(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Team Insights Dialog */}
      {insightsTemplate && currentUser && (
        <Dialog open={showTeamInsights} onOpenChange={setShowTeamInsights}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                Team Insights: {insightsTemplate.title}
              </DialogTitle>
            </DialogHeader>
            <TeamInsightsAI
              template={insightsTemplate}
              allTemplates={allTemplates}
              onApplySuggestion={(suggestion) => {
                console.log('Applying suggestion:', suggestion);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Version History Dialog */}
      {versionHistoryTemplate && currentUser && (
        <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                Version History: {versionHistoryTemplate.title}
              </DialogTitle>
            </DialogHeader>
            <VersionHistory
              template={versionHistoryTemplate}
              onRestoreVersion={(version) => handleRestoreVersion(versionHistoryTemplate, version)}
              currentUser={currentUser}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Invite Collaborators Modal */}
      {inviteTemplate && currentUser && (
        <InviteCollaboratorModal
          open={showInviteModal}
          onOpenChange={setShowInviteModal}
          template={inviteTemplate}
          onInvite={handleSendInvites}
        />
      )}

      {/* Collaborators List Modal */}
      {collaboratorsTemplate && currentUser && (
        <Dialog open={showCollaboratorsModal} onOpenChange={setShowCollaboratorsModal}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                Manage Collaborators: {collaboratorsTemplate.title}
              </DialogTitle>
            </DialogHeader>
            <CollaboratorsList
              template={collaboratorsTemplate}
              currentUser={currentUser}
              onUpdatePermission={(email, permission) => handleUpdatePermission(collaboratorsTemplate.id, email, permission)}
              onRemoveCollaborator={(email) => handleRemoveCollaborator(collaboratorsTemplate.id, email)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Change Log Modal */}
      {changeLogTemplate && currentUser && (
        <Dialog open={showChangeLogModal} onOpenChange={setShowChangeLogModal}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                Change History: {changeLogTemplate.title}
              </DialogTitle>
            </DialogHeader>
            <ChangeLog template={changeLogTemplate} />
          </DialogContent>
        </Dialog>
      )}

      {/* Import/Export Templates Dialog */}
      <Dialog open={showImportExport} onOpenChange={setShowImportExport}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileJson className="w-5 h-5 text-purple-600" />
              Import / Export Templates
            </DialogTitle>
          </DialogHeader>
          <TemplateImportExport currentUser={currentUser} />
        </DialogContent>
      </Dialog>

      {/* Contextual Help */}
      <ContextualHelpPanel page="Templates" showSuggestions={currentUser?.show_feature_tooltips !== false} />

      {/* Guided Tour */}
      {activeTour && (
        <GuidedTour
          tourId={activeTour}
          onComplete={() => setActiveTour(null)}
          onSkip={() => setActiveTour(null)}
        />
      )}
    </div>
  );
}
