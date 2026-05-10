import React, { useState, useMemo } from "react";
import { apiClient } from "@/apis/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Star, Edit, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

import PromptCard from "../components/prompts/PromptCard";
import AddPromptModal from "../components/prompts/AddPromptModal";
import CategoryFilter from "../components/prompts/CategoryFilter";
import SubcategoryFilter from "../components/prompts/SubcategoryFilter";
import TagFilter from "../components/prompts/TagFilter";
import TestPromptModal from "../components/prompts/TestPromptModal";

export default function MyPrompts() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testingPrompt, setTestingPrompt] = useState(null);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSubcategory, setSelectedSubcategory] = useState("All");
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const queryClient = useQueryClient();

  // Fetch current user
  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await apiClient.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  const { data: allPrompts = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => apiClient.entities.Template.list('-created_date'),
    initialData: [],
  });

  // Filter to show only current user's prompts
  const myPrompts = useMemo(() => {
    if (!currentUser) return [];
    return allPrompts.filter(p => p.created_by === currentUser.email);
  }, [allPrompts, currentUser]);

  const createPromptMutation = useMutation({
    mutationFn: (data) => apiClient.entities.Template.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
      setShowAddModal(false);
      setEditingPrompt(null);
    },
  });

  const deletePromptMutation = useMutation({
    mutationFn: (id) => apiClient.entities.Template.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
    },
  });

  const updatePromptMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.entities.Template.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
      setShowAddModal(false);
      setEditingPrompt(null);
    },
  });

  const handleCopyPrompt = (prompt) => {
    updatePromptMutation.mutate({
      id: prompt.id,
      data: { use_count: (prompt.use_count || 0) + 1 }
    });
  };

  const handleToggleFavorite = (prompt) => {
    updatePromptMutation.mutate({
      id: prompt.id,
      data: { is_favorite: !prompt.is_favorite }
    });
  };

  const handleRate = (prompt, newRating) => {
    if (!currentUser) return;

    const userRatings = prompt.user_ratings || {};
    userRatings[currentUser.email] = newRating;
    
    const allRatings = Object.values(userRatings);
    const newAverage = allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length;
    
    updatePromptMutation.mutate({
      id: prompt.id,
      data: {
        user_ratings: userRatings,
        rating: newAverage,
        rating_count: allRatings.length
      }
    });
  };

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleClearTags = () => {
    setSelectedTags([]);
  };

  const handleTestPrompt = (prompt) => {
    setTestingPrompt(prompt);
    setShowTestModal(true);
  };

  const handleEditPrompt = (prompt) => {
    setEditingPrompt(prompt);
    setShowAddModal(true);
  };

  // Note: onAddToMyPrompts not needed here since these are already the user's prompts

  // Reset subcategory when category changes
  React.useEffect(() => {
    setSelectedSubcategory("All");
  }, [selectedCategory]);

  // Filter prompts
  const categoryFilteredPrompts = useMemo(() => {
    return myPrompts.filter(prompt => {
      const categoryMatch = selectedCategory === "All" || prompt.category === selectedCategory;
      const searchMatch = searchQuery === "" || 
        prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (prompt.tags && prompt.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
      const favoriteMatch = !showFavorites || prompt.is_favorite;
      
      return categoryMatch && searchMatch && favoriteMatch;
    });
  }, [myPrompts, selectedCategory, searchQuery, showFavorites]);

  const availableSubcategories = useMemo(() => {
    const subcategoryCounts = {};
    categoryFilteredPrompts.forEach(prompt => {
      if (prompt.subcategory) {
        subcategoryCounts[prompt.subcategory] = (subcategoryCounts[prompt.subcategory] || 0) + 1;
      }
    });
    return Object.entries(subcategoryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [categoryFilteredPrompts]);

  const subcategoryFilteredPrompts = useMemo(() => {
    if (selectedSubcategory === "All") {
      return categoryFilteredPrompts;
    }
    return categoryFilteredPrompts.filter(prompt => prompt.subcategory === selectedSubcategory);
  }, [categoryFilteredPrompts, selectedSubcategory]);

  const availableTags = useMemo(() => {
    const tagCounts = {};
    subcategoryFilteredPrompts.forEach(prompt => {
      if (prompt.tags) {
        prompt.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    return Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [subcategoryFilteredPrompts]);

  const filteredPrompts = useMemo(() => {
    if (selectedTags.length === 0) {
      return subcategoryFilteredPrompts;
    }
    
    return subcategoryFilteredPrompts.filter(prompt => {
      return selectedTags.every(selectedTag => 
        prompt.tags && prompt.tags.includes(selectedTag)
      );
    });
  }, [subcategoryFilteredPrompts, selectedTags]);

  const categoryCounts = myPrompts.reduce((acc, prompt) => {
    acc[prompt.category] = (acc[prompt.category] || 0) + 1;
    acc["All"] = (acc["All"] || 0) + 1;
    return acc;
  }, {});

  // Calculate stats
  const totalUses = myPrompts.reduce((sum, p) => sum + (p.use_count || 0), 0);
  const avgRating = myPrompts.filter(p => p.rating > 0).reduce((sum, p) => sum + p.rating, 0) / myPrompts.filter(p => p.rating > 0).length || 0;
  const favoritesCount = myPrompts.filter(p => p.is_favorite).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-4"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Edit className="w-10 h-10" />
              <h1 className="text-4xl md:text-5xl font-bold">
                My Prompts
              </h1>
            </div>
            <p className="text-xl text-purple-100 max-w-2xl mx-auto">
              Manage and organize your personal prompt collection
            </p>
            <div className="flex flex-wrap gap-3 justify-center pt-4">
              <Button
                onClick={() => {
                  setEditingPrompt(null); // Clear editing prompt when opening for new creation
                  setShowAddModal(true);
                }}
                size="lg"
                className="bg-white text-purple-600 hover:bg-purple-50 font-semibold"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Prompt
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
            <div className="text-2xl font-bold text-purple-600">{myPrompts.length}</div>
            <div className="text-sm text-gray-600">Your Prompts</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
            <div className="text-2xl font-bold text-indigo-600">{totalUses}</div>
            <div className="text-sm text-gray-600">Total Uses</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
            <div className="text-2xl font-bold text-amber-600">
              {avgRating > 0 ? avgRating.toFixed(1) : '—'}
            </div>
            <div className="text-sm text-gray-600">Avg Rating</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
            <div className="text-2xl font-bold text-pink-600">{favoritesCount}</div>
            <div className="text-sm text-gray-600">Favorites</div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search your prompts by title, content, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base border-gray-200 bg-white shadow-sm"
              />
            </div>
            <Button
              variant={showFavorites ? "default" : "outline"}
              onClick={() => setShowFavorites(!showFavorites)}
              className={showFavorites ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700" : ""}
            >
              <Star className={`w-4 h-4 mr-2 ${showFavorites ? 'fill-white' : 'text-yellow-500'}`} />
              Favorites
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <CategoryFilter
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              counts={categoryCounts}
            />

            <SubcategoryFilter
              subcategories={availableSubcategories}
              selectedSubcategory={selectedSubcategory}
              onSelectSubcategory={setSelectedSubcategory}
            />

            <TagFilter
              allTags={availableTags}
              selectedTags={selectedTags}
              onTagToggle={handleTagToggle}
              onClearTags={handleClearTags}
            />
          </div>

          {/* Results count */}
          {(selectedTags.length > 0 || searchQuery || selectedCategory !== "All" || selectedSubcategory !== "All" || showFavorites) && (
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold text-purple-600">{filteredPrompts.length}</span> of {myPrompts.length} prompts
            </div>
          )}
        </motion.div>

        {/* Prompts Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : myPrompts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center">
              <Edit className="w-12 h-12 text-purple-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              No prompts yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start building your personal prompt collection by creating your first prompt
            </p>
            <Button
              onClick={() => {
                setEditingPrompt(null); // Clear editing prompt when opening for new creation
                setShowAddModal(true);
              }}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Prompt
            </Button>
          </motion.div>
        ) : filteredPrompts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center">
              <Search className="w-12 h-12 text-purple-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              No prompts found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your filters or search query
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredPrompts.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  onDelete={(prompt) => deletePromptMutation.mutate(prompt.id)}
                  onCopy={handleCopyPrompt}
                  onToggleFavorite={handleToggleFavorite}
                  onRate={handleRate}
                  onEdit={handleEditPrompt}
                  onTestPrompt={handleTestPrompt}
                  currentUserEmail={currentUser?.email}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Add Prompt Modal */}
      <AddPromptModal
        open={showAddModal}
        onOpenChange={(open) => {
          setShowAddModal(open);
          if (!open) setEditingPrompt(null);
        }}
        onSave={(data) => {
          if (editingPrompt) {
            updatePromptMutation.mutate({ id: editingPrompt.id, data });
          } else {
            createPromptMutation.mutate(data);
          }
        }}
        isSaving={createPromptMutation.isPending || updatePromptMutation.isPending}
        prompt={editingPrompt}
      />

      <TestPromptModal
        open={showTestModal}
        onOpenChange={setShowTestModal}
        prompt={testingPrompt}
      />
    </div>
  );
}
