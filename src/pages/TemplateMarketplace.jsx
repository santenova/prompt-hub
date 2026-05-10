
import React, { useState, useMemo } from "react";
import { apiClient } from "@/apis/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Star, TrendingUp, Clock, Users, Sparkles, Copy, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const categoryColors = {
  Writing: "bg-blue-100 text-blue-800",
  Marketing: "bg-purple-100 text-purple-800",
  Coding: "bg-green-100 text-green-800",
  Design: "bg-pink-100 text-pink-800",
  Business: "bg-yellow-100 text-yellow-800",
  Education: "bg-indigo-100 text-indigo-800",
};

export default function TemplateMarketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("popular");
  const [currentUser, setCurrentUser] = useState(null);
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

  // Fetch public templates
  const { data: publicTemplates = [], isLoading } = useQuery({
    queryKey: ['public-templates'],
    queryFn: async () => {
      const allTemplates = await apiClient.entities.Template.list('-created_date');
      return allTemplates.filter(t => t.is_public === true || t.visibility === 'public');
    },
    initialData: [],
  });

  // Fetch user's templates for comparison
  const { data: myTemplates = [] } = useQuery({
    queryKey: ['my-templates'],
    queryFn: () => apiClient.entities.Template.list('-created_date'),
    initialData: [],
  });

  const downloadTemplateMutation = useMutation({
    mutationFn: async (template) => {
      // Increment download count
      await apiClient.entities.Template.update(template.id, {
        downloads: (template.downloads || 0) + 1
      });

      // Create copy for user
      const { id, created_date, updated_date, created_by, created_by_id, entity_name, app_id, is_deleted, deleted_date, ...templateData } = template;
      return await apiClient.entities.Template.create({
        ...templateData,
        is_public: false,
        visibility: 'private',
        folder: 'Downloaded Templates',
        downloads: 0,
        rating: 0,
        rating_count: 0,
        user_ratings: {}
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-templates']);
      queryClient.invalidateQueries(['templates']);
      toast({
        title: "Template Downloaded",
        description: "Template added to your collection in 'Downloaded Templates' folder",
      });
    },
  });

  const rateTemplateMutation = useMutation({
    mutationFn: async ({ template, rating }) => {
      const userRatings = template.user_ratings || {};
      userRatings[currentUser.email] = rating;
      
      const allRatings = Object.values(userRatings);
      const newAverage = allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length;
      
      return await apiClient.entities.Template.update(template.id, {
        user_ratings: userRatings,
        rating: newAverage,
        rating_count: allRatings.length
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['public-templates']);
      toast({
        title: "Rating Submitted",
        description: "Thank you for your feedback!",
      });
    },
  });

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let filtered = publicTemplates.filter(template => {
      const categoryMatch = selectedCategory === "All" || template.category === selectedCategory;
      const searchMatch = searchQuery === "" || 
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (template.tags && template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
      
      return categoryMatch && searchMatch;
    });

    // Sort
    switch (sortBy) {
      case "popular":
        filtered.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
        break;
      case "rated":
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "recent":
        filtered.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        break;
      case "used":
        filtered.sort((a, b) => (b.use_count || 0) - (a.use_count || 0));
        break;
    }

    return filtered;
  }, [publicTemplates, selectedCategory, searchQuery, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: publicTemplates.length,
      totalDownloads: publicTemplates.reduce((sum, t) => sum + (t.downloads || 0), 0),
      avgRating: publicTemplates.filter(t => t.rating > 0).length > 0 
        ? (publicTemplates.reduce((sum, t) => sum + (t.rating || 0), 0) / publicTemplates.filter(t => t.rating > 0).length).toFixed(1)
        : 0,
      categories: new Set(publicTemplates.map(t => t.category).filter(c => c && c.trim() !== '')).size
    };
  }, [publicTemplates]);

  // Filter out empty categories and ensure valid values
  const categories = useMemo(() => {
    return [...new Set(publicTemplates.map(t => t.category).filter(c => c && c.trim() !== ''))].sort();
  }, [publicTemplates]);

  const hasDownloaded = (template) => {
    return myTemplates.some(t => t.title === template.title && t.created_by === currentUser?.email);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="w-10 h-10" />
              <h1 className="text-4xl md:text-5xl font-bold">Template Marketplace</h1>
            </div>
            <p className="text-xl text-purple-100 max-w-2xl mx-auto">
              Discover and download community-created prompt templates
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-purple-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Public Templates</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-indigo-600">{stats.totalDownloads}</div>
              <div className="text-sm text-gray-600">Total Downloads</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-amber-600">{stats.avgRating}</div>
              <div className="text-sm text-gray-600">Avg Rating</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-pink-600">{stats.categories}</div>
              <div className="text-sm text-gray-600">Categories</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
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
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Most Downloaded
                  </div>
                </SelectItem>
                <SelectItem value="rated">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Highest Rated
                  </div>
                </SelectItem>
                <SelectItem value="recent">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Most Recent
                  </div>
                </SelectItem>
                <SelectItem value="used">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Most Used
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(searchQuery || selectedCategory !== "All") && (
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold text-purple-600">{filteredTemplates.length}</span> templates
            </div>
          )}
        </motion.div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredTemplates.map((template) => {
                const downloaded = hasDownloaded(template);
                const userRating = currentUser ? (template.user_ratings || {})[currentUser.email] : null;

                return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Card className="h-full hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-400">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <CardTitle className="text-lg">{template.title}</CardTitle>
                          {downloaded && (
                            <Badge className="bg-green-100 text-green-800">
                              <Heart className="w-3 h-3 mr-1 fill-current" />
                              In Library
                            </Badge>
                          )}
                        </div>
                        {template.description && (
                          <CardDescription className="line-clamp-2">
                            {template.description}
                          </CardDescription>
                        )}
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Badge className={categoryColors[template.category] || "bg-gray-100 text-gray-800"}>
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

                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Download className="w-4 h-4" />
                              {template.downloads || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-amber-500" />
                              {template.rating ? template.rating.toFixed(1) : '—'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            by {template.created_by?.split('@')[0]}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => downloadTemplateMutation.mutate(template)}
                            disabled={downloaded || downloadTemplateMutation.isPending}
                            className="flex-1"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            {downloaded ? 'Downloaded' : 'Download'}
                          </Button>

                          {!userRating && currentUser && template.created_by !== currentUser.email && (
                            <Select
                              onValueChange={(value) => 
                                rateTemplateMutation.mutate({ template, rating: parseInt(value) })
                              }
                            >
                              <SelectTrigger className="w-[100px]">
                                <SelectValue placeholder="Rate" />
                              </SelectTrigger>
                              <SelectContent>
                                {[5, 4, 3, 2, 1].map(rating => (
                                  <SelectItem key={rating} value={rating.toString()}>
                                    {'⭐'.repeat(rating)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
