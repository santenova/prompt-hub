
import React, { useState, useMemo } from 'react';
import { apiClient } from "@/apis/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  TrendingUp, 
  Star, 
  Download, 
  Eye, 
  Copy, 
  Plus,
  Filter,
  Sparkles,
  Users,
  Heart
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CommunityFeed() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('trending');
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  const { data: publicTemplates = [], isLoading } = useQuery({
    queryKey: ['public-templates'],
    queryFn: async () => {
      const all = await apiClient.entities.Template.list('-created_date');
      return all.filter(t => t.visibility === 'public' || t.is_public);
    },
    initialData: [],
  });

  const { data: myTemplates = [] } = useQuery({
    queryKey: ['my-templates'],
    queryFn: () => apiClient.entities.Template.list('-created_date'),
    initialData: [],
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data) => apiClient.entities.Template.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-templates']);
      toast({
        title: "Success!",
        description: "Template added to your library",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.entities.Template.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['public-templates']);
    },
  });

  const handleCopyToLibrary = async (template) => {
    // Check if already copied
    const alreadyExists = myTemplates.some(t => t.forked_from === template.id);
    if (alreadyExists) {
      toast({
        title: "Already in library",
        description: "You've already copied this template",
        variant: "warning"
      });
      return;
    }

    const copiedTemplate = {
      title: `${template.title} (Copy)`,
      content: template.content,
      description: template.description,
      category: template.category,
      subcategory: template.subcategory,
      tags: template.tags || [],
      folder: 'Uncategorized',
      placeholders: template.placeholders || [],
      forked_from: template.id,
      visibility: 'private',
      is_public: false
    };

    await createTemplateMutation.mutateAsync(copiedTemplate);

    // Update original template stats
    await updateTemplateMutation.mutateAsync({
      id: template.id,
      data: {
        copy_count: (template.copy_count || 0) + 1,
        downloads: (template.downloads || 0) + 1,
        trending_score: (template.trending_score || 0) + 5
      }
    });
  };

  const handleViewTemplate = async (template) => {
    if (!currentUser) return;

    const uniqueViewers = template.unique_viewers || [];
    if (!uniqueViewers.includes(currentUser.email)) {
      uniqueViewers.push(currentUser.email);
      
      await updateTemplateMutation.mutateAsync({
        id: template.id,
        data: {
          view_count: (template.view_count || 0) + 1,
          unique_viewers: uniqueViewers,
          trending_score: (template.trending_score || 0) + 1
        }
      });
    }
  };

  const handleRateTemplate = async (template, rating) => {
    if (!currentUser) return;

    const userRatings = template.user_ratings || {};
    userRatings[currentUser.email] = rating;

    const ratings = Object.values(userRatings);
    const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;

    await updateTemplateMutation.mutateAsync({
      id: template.id,
      data: {
        user_ratings: userRatings,
        rating: avgRating,
        rating_count: ratings.length,
        trending_score: (template.trending_score || 0) + 2
      }
    });

    toast({
      title: "Rating submitted",
      description: `You rated this template ${rating} stars`,
    });
  };

  const categories = useMemo(() => {
    const cats = publicTemplates
      .map(t => t.category)
      .filter(cat => cat && cat.trim() !== ''); // Filter out empty/null categories
    return ['All', ...new Set(cats)].sort();
  }, [publicTemplates]);

  const filteredAndSortedTemplates = useMemo(() => {
    let filtered = publicTemplates;

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Filter by tab
    if (activeTab === 'featured') {
      filtered = filtered.filter(t => t.featured);
    } else if (activeTab === 'popular') {
      filtered = filtered.filter(t => (t.copy_count || 0) > 5);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'trending':
          return (b.trending_score || 0) - (a.trending_score || 0);
        case 'popular':
          return (b.copy_count || 0) - (a.copy_count || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'recent':
          return new Date(b.created_date) - new Date(a.created_date);
        default:
          return 0;
      }
    });

    return sorted;
  }, [publicTemplates, searchQuery, selectedCategory, sortBy, activeTab]);

  const categoryColors = {
    Writing: "bg-blue-100 text-blue-800",
    Coding: "bg-green-100 text-green-800",
    Business: "bg-yellow-100 text-yellow-800",
    Creative: "bg-pink-100 text-pink-800",
    Marketing: "bg-purple-100 text-purple-800",
    Research: "bg-cyan-100 text-cyan-800",
    Education: "bg-indigo-100 text-indigo-800",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:32px_32px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4 sm:space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-300" />
              <span className="text-white text-xs sm:text-sm font-medium">Community Prompt Library</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight px-4">
              Discover & Share
              <br />
              <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
                Amazing Prompts
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-purple-100 max-w-2xl mx-auto px-4">
              Browse thousands of community-shared prompts. Copy, customize, and use them instantly.
            </p>

            <div className="flex flex-wrap justify-center gap-3 sm:gap-6 pt-2 sm:pt-4 px-4">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">{publicTemplates.length}</div>
                <div className="text-xs sm:text-sm text-purple-200">Public Prompts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  {publicTemplates.reduce((sum, t) => sum + (t.copy_count || 0), 0)}
                </div>
                <div className="text-xs sm:text-sm text-purple-200">Total Copies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  {new Set(publicTemplates.map(t => t.created_by)).size}
                </div>
                <div className="text-xs sm:text-sm text-purple-200">Contributors</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="featured">
              <Sparkles className="w-4 h-4 mr-2" />
              Featured
            </TabsTrigger>
            <TabsTrigger value="popular">
              <TrendingUp className="w-4 h-4 mr-2" />
              Popular
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 mb-8"
        >
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base border-gray-200 bg-white shadow-sm"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trending">🔥 Trending</SelectItem>
                <SelectItem value="popular">⭐ Most Copied</SelectItem>
                <SelectItem value="rating">⭐ Highest Rated</SelectItem>
                <SelectItem value="recent">🆕 Most Recent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold text-purple-600">{filteredAndSortedTemplates.length}</span> prompts
          </div>
        </motion.div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredAndSortedTemplates.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">No prompts found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredAndSortedTemplates.map((template) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onViewportEnter={() => handleViewTemplate(template)}
                >
                  <Card className="h-full hover:shadow-xl transition-all duration-300 border-l-4 border-l-purple-400">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold line-clamp-2">
                            {template.title}
                          </CardTitle>
                          {template.featured && (
                            <Badge className="mt-2 bg-gradient-to-r from-yellow-400 to-orange-500">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge className={categoryColors[template.category] || categoryColors.Writing}>
                          {template.category}
                        </Badge>
                        {template.tags?.slice(0, 2).map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {template.description || template.content}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {template.view_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {template.copy_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          {template.rating ? template.rating.toFixed(1) : '0.0'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button
                          onClick={() => handleCopyToLibrary(template)}
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                          disabled={createTemplateMutation.isPending}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add to Library
                        </Button>
                        
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => handleRateTemplate(template, star)}
                              className="text-gray-300 hover:text-yellow-400 transition-colors"
                            >
                              <Star 
                                className={`w-4 h-4 ${
                                  (template.user_ratings?.[currentUser?.email] || 0) >= star
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : ''
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
