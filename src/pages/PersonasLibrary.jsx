import React, { useState, useMemo } from "react";
import { apiClient } from "@/apis/client";

export const ENABLE_ELASTICSEARCH = true;
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Star, TrendingUp, Users, Sparkles, Download, Upload, GitBranch, FileJson, Wand2, CheckSquare, XSquare, Edit, Globe, Briefcase, Palette, Code, GraduationCap, Heart, DollarSign, Scale, Megaphone, ShoppingCart, Database, Info, ChevronDown, ChevronUp, BookOpen, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

import AIPersonaGenerator from "../components/personas/AIPersonaGenerator";
import PersonaCard from "../components/personas/PersonaCard";
import AddPersonaModal from "../components/personas/AddPersonaModal";
import PersonaImportExport from "../components/admin/PersonaImportExport";
import CombinePersonasModal from "../components/personas/CombinePersonasModal";
import BatchUpdateModal from "../components/personas/BatchUpdateModal";
import { useElasticsearchDataSource } from "../components/admin/ElasticsearchDataSource";
import CollaborationStatus from "../components/collaboration/CollaborationStatus.jsx";

const categories = ["All", "Science", "Business", "Creative", "Technical", "Education", "Health", "Finance", "Legal", "Marketing", "Sales", "Custom"];

const categoryGradients = {
  "All": "from-gray-500 to-slate-600",
  "Science": "from-sky-500 to-blue-600",
  "Business": "from-green-500 to-emerald-600",
  "Creative": "from-pink-500 to-rose-600",
  "Technical": "from-blue-500 to-cyan-600",
  "Education": "from-indigo-500 to-purple-600",
  "Health": "from-emerald-500 to-teal-600",
  "Finance": "from-yellow-500 to-orange-600",
  "Legal": "from-slate-500 to-gray-600",
  "Marketing": "from-orange-500 to-amber-600",
  "Sales": "from-fuchsia-500 to-purple-600",
  "Custom": "from-purple-500 to-indigo-600",
};

const categoryIcons = {
  "All": Globe,
  "Science": Sparkles,
  "Business": Briefcase,
  "Creative": Palette,
  "Technical": Code,
  "Education": GraduationCap,
  "Health": Heart,
  "Finance": DollarSign,
  "Legal": Scale,
  "Marketing": Megaphone,
  "Sales": ShoppingCart,
  "Custom": Star,
};

const proTips = [
  { title: "Rate personas", desc: "Rate personas to get better AI-powered suggestions" },
  { title: "Combine personas", desc: "Create unique hybrid styles by combining multiple personas" },
  { title: "Batch edit", desc: "Select multiple personas and edit them together for efficiency" },
  { title: "Use voice profiles", desc: "Fine-tune voice characteristics for more consistent outputs" },
  { title: "Collaborate", desc: "Share personas with team members and work together" },
  { title: "Version history", desc: "Track changes and restore previous versions anytime" },
  { title: "AI generate", desc: "Let AI create specialized personas based on your needs" },
  { title: "Tag strategically", desc: "Use tags to organize and quickly find related personas" },
  { title: "Export/Import", desc: "Back up your personas or share entire collections" },
  { title: "Filter by category", desc: "Browse personas by Business, Creative, Technical, and more" }
];

const perfectForItems = [
  { icon: "✍️", title: "Content creators" },
  { icon: "📝", title: "Copywriters" },
  { icon: "📢", title: "Marketers" },
  { icon: "🎨", title: "Creative teams" },
  { icon: "💼", title: "Business writers" },
  { icon: "👥", title: "Collaborators" },
  { icon: "🎓", title: "Educators" },
  { icon: "🔬", title: "Researchers" }
];

// Test comment
export default function PersonasLibrary() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPersona, setEditingPersona] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('search') || "";
  });
  const [showCustomOnly, setShowCustomOnly] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showCombineModal, setShowCombineModal] = useState(false);
      const [showBatchUpdateModal, setShowBatchUpdateModal] = useState(false);
  const [selectedPersonas, setSelectedPersonas] = useState([]);
  const [showInfoBanner, setShowInfoBanner] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const queryClient = useQueryClient();
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
    
    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  const { data: personas = [], isLoading, dataUpdatedAt, isRefetching } = useQuery({
    queryKey: ['personas'],
    queryFn: async () => {
      try {
        if (isEntityEnabled && isEntityEnabled('Persona')) {
          const esData = await getEntity('Persona');
          if (esData && Array.isArray(esData)) return esData;
        }
        const data = await apiClient.entities.Persona.list('-use_count');
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching personas:', error);
        handleRateLimitError(error);
        return [];
      }
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (error?.message?.includes('Rate limit')) return failureCount < 3;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  const { data: prompts = [] } = useQuery({
    queryKey: ['prompts'],
    queryFn: async () => {
      try {
        const data = [];
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching prompts:', error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const createPersonaMutation = useMutation({
    mutationFn: async (data) => {
      if (isEntityEnabled && isEntityEnabled('Persona') && createEntity) {
        const esResult = await createEntity('Persona', data);
        if (esResult) return esResult;
      }
      return apiClient.entities.Persona.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['personas']);
      setShowAddModal(false);
      setEditingPersona(null);
    },
    onError: (error) => {
      handleRateLimitError(error);
    },
  });

  const updatePersonaMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      if (isEntityEnabled && isEntityEnabled('Persona') && updateEntity) {
        const esResult = await updateEntity('Persona', id, data);
        if (esResult) return esResult;
      }
      return apiClient.entities.Persona.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['personas']);
      setShowAddModal(false);
      setEditingPersona(null);
    },
    onError: (error) => {
      handleRateLimitError(error);
    },
  });

  const deletePersonaMutation = useMutation({
    mutationFn: (id) => apiClient.entities.Persona.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['personas']);
    },
    onError: (error) => {
      handleRateLimitError(error);
    },
  });

    const handleSavePersona = (data) => {
    if (editingPersona) {
      updatePersonaMutation.mutate({ id: editingPersona.id, data });
    } else {
      createPersonaMutation.mutate({ ...data, creator_name: currentUser?.full_name || currentUser?.email });
    }
  };

  const handleEditPersona = (persona) => {
    setEditingPersona(persona);
    setShowAddModal(true);
  };

  const handleUpdatePersona = (id, data) => {
    updatePersonaMutation.mutate({ id, data });
  };

  const handleDeletePersona = (id) => {
    deletePersonaMutation.mutate(id);
  };

  const handleUsePersona = (persona) => {
    updatePersonaMutation.mutate({
      id: persona.id,
      data: { use_count: (persona.use_count || 0) + 1 }
    });
  };

  const handleRate = (persona, newRating) => {
    if (!currentUser) return;

    const userRatings = persona.user_ratings || {};
    userRatings[currentUser.email] = newRating;
    
    const allRatings = Object.values(userRatings);
    const newAverage = allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length;
    
    updatePersonaMutation.mutate({
      id: persona.id,
      data: {
        user_ratings: userRatings,
        rating: newAverage,
        rating_count: allRatings.length
      }
    });
  };

  const handleImportPersonas = async (importedData) => {
    for (const persona of importedData) {
      const { id, created_date, updated_date, created_by, created_by_id, entity_name, app_id, is_sample, is_deleted, deleted_date, ...data } = persona.data || persona;
      await createPersonaMutation.mutateAsync(data);
    }
  };

  const handleApplyAIPersona = (personaData) => {
    createPersonaMutation.mutate({ ...personaData, creator_name: currentUser?.full_name || currentUser?.email });
    setShowAIGenerator(false);
  };

  const personasWithCounts = useMemo(() => {
    return personas.map(persona => ({
      ...persona,
      prompt_count: prompts.filter(p => p.persona === persona.name).length
    }));
  }, [personas, prompts]);

  const filteredPersonas = useMemo(() => {
    return personasWithCounts.filter(persona => {
      const categoryMatch = selectedCategory === "All" || persona.category === selectedCategory;
      const searchMatch = searchQuery === "" || 
        persona.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        persona.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (persona.tags && persona.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
      const customMatch = !showCustomOnly || persona.is_custom;
      
      return categoryMatch && searchMatch && customMatch;
    });
  }, [personasWithCounts, selectedCategory, searchQuery, showCustomOnly]);

    const allVisibleSelected = useMemo(() =>
        filteredPersonas.length > 0 &&
        filteredPersonas.every(p => selectedPersonas.some(sp => sp.id === p.id)),
        [filteredPersonas, selectedPersonas]
    );

    const handleSelectAllVisible = () => {
        if (allVisibleSelected) {
            const filteredIds = new Set(filteredPersonas.map(p => p.id));
            setSelectedPersonas(prev => prev.filter(p => !filteredIds.has(p.id)));
        } else {
            const selectedIds = new Set(selectedPersonas.map(p => p.id));
            const newPersonasToAdd = filteredPersonas.filter(p => !selectedIds.has(p.id));
            setSelectedPersonas(prev => [...prev, ...newPersonasToAdd]);
        }
    };

  const categoryCounts = useMemo(() => {
    const counts = { "All": personas.length };
    personas.forEach(p => {
      const cat = p.category || "Custom";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [personas]);

  const stats = {
    total: personas.length,
    custom: personas.filter(p => p.is_custom).length,
    totalPrompts: prompts.length,
    avgRating: personas.filter(p => p.rating > 0).reduce((sum, p) => sum + p.rating, 0) / personas.filter(p => p.rating > 0).length || 0
  };

  return (
    <div className="min-h-screen">
      {/* Minimal Compact Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-purple-100 sticky top-16 sm:top-[4.5rem] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Personas</h1>
                {isEntityEnabled && isEntityEnabled('Persona') && (
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                    <Database className="w-3 h-3 mr-1" />
                    Elasticsearch
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs sm:text-sm text-gray-600">{personas.length} total • {personas.filter(p => p.is_custom).length} custom</p>
                <CollaborationStatus 
                  lastSyncTime={dataUpdatedAt}
                  isRefreshing={isRefetching}
                />
              </div>
            </div>
            {currentUser && (
              <div className="flex gap-2 w-full sm:w-auto">
                  {selectedPersonas.length === 0 &&
                    <Button
                      onClick={() => setShowAIGenerator(!showAIGenerator)}
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/20 flex-1 sm:flex-none"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      AI Generate
                    </Button>
                  }
                  {selectedPersonas.length > 0 &&
                    <Button onClick={() => setShowBatchUpdateModal(true)} size="sm" variant="outline">
                        <Edit className="w-4 h-4 mr-2" />
                        Batch Edit ({selectedPersonas.length})
                    </Button>
                  }
                  {selectedPersonas.length > 1 &&
                    <Button onClick={() => setShowCombineModal(true)} size="sm" className="bg-gradient-to-r from-green-500 to-emerald-500">
                        <Wand2 className="w-4 h-4 mr-2" />
                        Combine ({selectedPersonas.length})
                    </Button>
                  }
                 {filteredPersonas.length > 1 && (searchQuery || filteredPersonas.length < 10) && (
                  <div className="flex gap-2">
                    <Button onClick={handleSelectAllVisible} variant="outline" size="sm" disabled={allVisibleSelected} className="whitespace-nowrap">
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Select All ({filteredPersonas.length})
                   </Button>
                   <Button onClick={() => setSelectedPersonas([])} variant="outline" size="sm" disabled={selectedPersonas.length === 0} className="whitespace-nowrap">
                     <XSquare className="w-4 h-4 mr-2" />
                     Deselect All
                  </Button>
                  </div>
                  )}
                <Button
                  onClick={() => {
                    setEditingPersona(null);
                    setShowAddModal(true);
                    setShowAIGenerator(false);
                  }}
                  size="sm"
                  variant="outline"
                  className="border-purple-300 hover:bg-purple-50 flex-1 sm:flex-none"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create
                </Button>
                <Button
                  onClick={() => setShowImportExport(true)}
                  size="sm"
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-50"
                  title="Import/Export Personas"
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        How it Works
                      </h3>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li>• Browse or search personas</li>
                        <li>• Create custom or AI-generate</li>
                        <li>• Apply to prompts & workflows</li>
                        <li>• Rate and refine over time</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-600" />
                        Pro Tips
                      </h3>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentTipIndex}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                            <h4 className="font-semibold text-sm text-gray-900 mb-1">{proTips[currentTipIndex].title}</h4>
                            <p className="text-xs text-gray-600">{proTips[currentTipIndex].desc}</p>
                            <div className="flex gap-1 mt-2">
                              {proTips.map((_, idx) => (
                                <div key={idx} className={`h-1 flex-1 rounded ${idx === currentTipIndex ? 'bg-yellow-400' : 'bg-yellow-200'}`} />
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-600" />
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
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        Quick Links
                      </h3>
                      <div className="space-y-2">
                        <Link to={createPageUrl('Documentation')} className="block text-xs text-blue-600 hover:text-blue-700 hover:underline">
                          → Personas Documentation
                        </Link>
                        <Link to={createPageUrl('Help')} className="block text-xs text-blue-600 hover:text-blue-700 hover:underline">
                          → Help & Tutorials
                        </Link>
                        <Link to={createPageUrl('Templates')} className="block text-xs text-blue-600 hover:text-blue-700 hover:underline">
                          → View Prompts
                        </Link>
                        <Link to={createPageUrl('VoiceToPrompt')} className="block text-xs text-blue-600 hover:text-blue-700 hover:underline">
                          → Voice Chat
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
              <AIPersonaGenerator onApplyPersona={handleApplyAIPersona} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search and Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4 mb-6"
        >
          {/* Search bar spanning full width */}
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="🔍 Search all personas by name, description, tags, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base border-2 border-purple-200 bg-white shadow-sm hover:border-purple-300 focus:border-purple-400 transition-colors"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Category Filters and Custom Toggle - Compact */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={showCustomOnly ? "default" : "outline"}
              onClick={() => setShowCustomOnly(!showCustomOnly)}
              size="sm"
              className={showCustomOnly ? "bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/20" : ""}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Custom Only
            </Button>
            <div className="h-6 w-px bg-gray-300"></div>
            {categories.slice(0, 3).map((category) => {
              const isSelected = selectedCategory === category;
              const count = categoryCounts[category] || 0;
              const gradient = categoryGradients[category] || categoryGradients["Custom"];
              const Icon = categoryIcons[category] || Star;
              
              return (
                <Button
                  key={category}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={`${isSelected ? `bg-gradient-to-r ${gradient} text-white` : 'bg-white border-gray-200'} transition-all h-7 px-2`}
                >
                  <Icon className="w-3 h-3 sm:mr-1" />
                  <span className="hidden sm:inline text-xs">{category}</span>
                  {count > 0 && (
                    <Badge variant={isSelected ? "secondary" : "outline"} className={`ml-1 text-[10px] px-1 h-3 leading-none ${isSelected ? 'bg-white/20 text-white border-white/30' : ''}`}>
                      {count}
                    </Badge>
                  )}
                </Button>
              );
            })}
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-7 px-2 text-xs border border-gray-200 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {categories.map((category) => {
                const count = categoryCounts[category] || 0;
                return (
                  <option key={category} value={category}>
                    {category} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Results count */}
          {(searchQuery || selectedCategory !== "All" || showCustomOnly) && (
            <div className="text-xs sm:text-sm text-gray-600">
              Showing <span className="font-semibold text-indigo-600">{filteredPersonas.length}</span> of {personas.length} personas
            </div>
          )}
        </motion.div>

        {/* Personas Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        ) : !isLoading && filteredPersonas.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 px-4"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              {searchQuery || showCustomOnly ? 'No personas found' : 'No personas yet'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {searchQuery || showCustomOnly
                ? 'Try adjusting your filters or search query'
                : currentUser ? 'Create your first custom persona to get started' : 'Sign in to create and manage your personas'}
            </p>
            {!searchQuery && !showCustomOnly && currentUser && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => setShowAIGenerator(true)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/20"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Generate
                </Button>
                <Button
                  onClick={() => setShowAddModal(true)}
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence>
              {filteredPersonas.map((persona) => (
                <PersonaCard
                  key={persona.id}
                  persona={persona}
                  onEdit={handleEditPersona}
                  onDelete={handleDeletePersona}
                  onToggleFavorite={handleUsePersona}
                  onUpdate={handleUpdatePersona}
                  onRate={handleRate}
                  currentUserEmail={currentUser?.email}
                  currentUser={currentUser}
                  onSelect={(id, isSelected) => {
                      setSelectedPersonas(prev => 
                          isSelected ? [...prev, filteredPersonas.find(p => p.id === id)] : prev.filter(p => p.id !== id)
                      )
                  }}
                  isSelected={selectedPersonas.some(p => p.id === persona.id)}
                  />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Add/Edit Persona Modal */}
      {currentUser && (
        <AddPersonaModal
          open={showAddModal}
          onOpenChange={(open) => {
            setShowAddModal(open);
            if (!open) setEditingPersona(null);
          }}
          persona={editingPersona}
          onSave={handleSavePersona}
          isSaving={createPersonaMutation.isPending || updatePersonaMutation.isPending}
          />
          )}

          {currentUser && (
          <CombinePersonasModal 
              open={showCombineModal}
              onOpenChange={setShowCombineModal}
              selectedPersonas={selectedPersonas}
              onClearSelection={() => setSelectedPersonas([])}
              currentUser={currentUser}
          />
          )}

          {currentUser && (
          <BatchUpdateModal
              open={showBatchUpdateModal}
              onOpenChange={setShowBatchUpdateModal}
              selectedPersonas={selectedPersonas}
              onClearSelection={() => setSelectedPersonas([])}
          />
          )}



      {/* Import/Export Dialog */}
      <Dialog open={showImportExport} onOpenChange={setShowImportExport}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileJson className="w-5 h-5 text-purple-600" />
              Import / Export Personas
            </DialogTitle>
          </DialogHeader>
          <PersonaImportExport currentUser={currentUser} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
