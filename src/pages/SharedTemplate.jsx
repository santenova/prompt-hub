
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from "@/apis/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Download, 
  Eye, 
  Star, 
  Copy, 
  Plus,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Heart,
  GitBranch,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl } from '../utils';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SharedTemplate() {
  const { shareLink } = useParams();
  const [template, setTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [copied, setCopied] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
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

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setIsLoading(true);
        const allTemplates = await apiClient.entities.Template.list();
        const found = allTemplates.find(t => t.share_link === shareLink);
        
        if (!found) {
          setError('Template not found or link has expired');
          return;
        }

        // Check if link is expired
        if (found.share_link_expires && new Date(found.share_link_expires) < new Date()) {
          setError('This share link has expired');
          return;
        }

        setTemplate(found);

        // Track view
        const uniqueViewers = found.unique_viewers || [];
        if (currentUser && !uniqueViewers.includes(currentUser.email)) {
          uniqueViewers.push(currentUser.email);
          
          await apiClient.entities.Template.update(found.id, {
            view_count: (found.view_count || 0) + 1,
            unique_viewers: uniqueViewers,
            trending_score: (found.trending_score || 0) + 1
          });
        }
      } catch (err) {
        console.error('Error fetching template:', err);
        setError('Failed to load template');
      } finally {
        setIsLoading(false);
      }
    };

    if (shareLink) {
      fetchTemplate();
    }
  }, [shareLink, currentUser]);

  const createTemplateMutation = useMutation({
    mutationFn: (data) => apiClient.entities.Template.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
      toast({
        title: "Success!",
        description: "Template added to your library",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.entities.Template.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
    },
  });

  const handleCopyToLibrary = async () => {
    if (!currentUser) {
      toast({
        title: "Login required",
        description: "Please log in to copy this template",
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

  const handleCopyContent = async () => {
    await navigator.clipboard.writeText(template.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRateTemplate = async (rating) => {
    if (!currentUser) {
      toast({
        title: "Login required",
        description: "Please log in to rate this template",
        variant: "warning"
      });
      return;
    }

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

    setTemplate({
      ...template,
      user_ratings: userRatings,
      rating: avgRating,
      rating_count: ratings.length
    });

    toast({
      title: "Rating submitted",
      description: `You rated this template ${rating} stars`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-8">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="w-16 h-16 mx-auto text-red-500" />
            <h2 className="text-2xl font-bold text-gray-900">{error}</h2>
            <p className="text-gray-600">
              The template you're looking for might have been removed or the link has expired.
            </p>
            <Link to={createPageUrl('CommunityFeed')}>
              <Button className="bg-gradient-to-r from-purple-600 to-indigo-600">
                Browse Community Prompts
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 py-12">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:32px_32px]" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <div className="flex items-center justify-center gap-2">
              <Badge className="bg-white/20 text-white border-white/30">
                <Sparkles className="w-3 h-3 mr-1" />
                Shared Template
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              {template.title}
            </h1>
            {template.description && (
              <p className="text-lg text-purple-100 max-w-2xl mx-auto">
                {template.description}
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <Eye className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold">{template.view_count || 0}</div>
                <div className="text-xs text-gray-600">Views</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Download className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-bold">{template.copy_count || 0}</div>
                <div className="text-xs text-gray-600">Copies</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Star className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                <div className="text-2xl font-bold">
                  {template.rating ? template.rating.toFixed(1) : '0.0'}
                </div>
                <div className="text-xs text-gray-600">{template.rating_count || 0} ratings</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Heart className="w-6 h-6 mx-auto mb-2 text-red-600" />
                <div className="text-2xl font-bold">{template.likes || 0}</div>
                <div className="text-xs text-gray-600">Likes</div>
              </CardContent>
            </Card>
          </div>

          {/* Template Content */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Template Content</CardTitle>
                <Badge className={categoryColors[template.category]}>
                  {template.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                  {template.content}
                </pre>
              </div>

              <Button
                onClick={handleCopyContent}
                variant="outline"
                className="w-full"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Content
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Placeholders */}
          {template.placeholders && template.placeholders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Placeholders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {template.placeholders.map((ph, idx) => (
                  <div key={idx} className="border-l-4 border-purple-400 pl-4 py-2 bg-purple-50 rounded">
                    <div className="font-medium text-sm">
                      <code className="bg-purple-100 px-2 py-0.5 rounded text-purple-700">
                        {ph.key}
                      </code>
                    </div>
                    {ph.description && (
                      <p className="text-xs text-gray-600 mt-1">{ph.description}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {template.tags && template.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {template.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
            <CardContent className="pt-6 space-y-4">
              <Button
                onClick={handleCopyToLibrary}
                size="lg"
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                disabled={createTemplateMutation.isPending}
              >
                <Plus className="w-5 h-5 mr-2" />
                {createTemplateMutation.isPending ? 'Adding...' : 'Add to My Library'}
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Rate this template:</p>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRateTemplate(star)}
                      className="text-gray-300 hover:text-yellow-400 transition-colors transform hover:scale-110"
                    >
                      <Star 
                        className={`w-8 h-8 ${
                          (template.user_ratings?.[currentUser?.email] || 0) >= star
                            ? 'fill-yellow-400 text-yellow-400'
                            : ''
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <Link to={createPageUrl('CommunityFeed')}>
                <Button variant="outline" className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Browse More Templates
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Creator Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Shared by</p>
                  <p className="font-medium">{template.created_by}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-medium">
                    {new Date(template.created_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {template.updated_date && template.created_date && (new Date(template.updated_date).getTime() !== new Date(template.created_date).getTime()) && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Last updated</span>
                    <span className="text-gray-900 font-medium">
                      {new Date(template.updated_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
