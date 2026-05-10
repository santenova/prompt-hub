import React, { useMemo, useState } from "react";
import { apiClient } from "@/apis/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Download, Star, Users, Sparkles, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const COLORS = ['#8b5cf6', '#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444', '#10b981', '#3b82f6'];

export default function TemplateAnalytics() {
  const [dateRange, setDateRange] = useState("30");
  const [currentUser, setCurrentUser] = useState(null);

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

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => apiClient.entities.Template.list('-created_date'),
    initialData: [],
  });

  const { data: publicTemplates = [] } = useQuery({
    queryKey: ['public-templates'],
    queryFn: async () => {
      const allTemplates = await apiClient.entities.Template.list('-created_date');
      return allTemplates.filter(t => t.is_public === true || t.visibility === 'public');
    },
    initialData: [],
  });

  const myTemplates = useMemo(() => {
    return templates.filter(t => t.created_by === currentUser?.email);
  }, [templates, currentUser]);

  const myPublicTemplates = useMemo(() => {
    return myTemplates.filter(t => t.is_public === true || t.visibility === 'public');
  }, [myTemplates]);

  // Overall stats
  const stats = useMemo(() => {
    return {
      total: myTemplates.length,
      public: myPublicTemplates.length,
      totalDownloads: myPublicTemplates.reduce((sum, t) => sum + (t.downloads || 0), 0),
      totalUses: myTemplates.reduce((sum, t) => sum + (t.use_count || 0), 0),
      avgRating: myPublicTemplates.filter(t => t.rating > 0).length > 0
        ? (myPublicTemplates.reduce((sum, t) => sum + (t.rating || 0), 0) / myPublicTemplates.filter(t => t.rating > 0).length).toFixed(1)
        : 0,
      totalRatings: myPublicTemplates.reduce((sum, t) => sum + (t.rating_count || 0), 0)
    };
  }, [myTemplates, myPublicTemplates]);

  // Most popular templates
  const topTemplates = useMemo(() => {
    return [...myTemplates]
      .sort((a, b) => (b.use_count || 0) - (a.use_count || 0))
      .slice(0, 10);
  }, [myTemplates]);

  // Most downloaded public templates
  const topDownloaded = useMemo(() => {
    return [...myPublicTemplates]
      .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
      .slice(0, 10);
  }, [myPublicTemplates]);

  // Category distribution
  const categoryData = useMemo(() => {
    const counts = {};
    myTemplates.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [myTemplates]);

  // Visibility distribution
  const visibilityData = useMemo(() => {
    const counts = {
      private: 0,
      public: 0,
      shared: 0
    };
    myTemplates.forEach(t => {
      if (t.is_public || t.visibility === 'public') {
        counts.public++;
      } else if (t.visibility === 'shared' || (t.shared_with && t.shared_with.length > 0)) {
        counts.shared++;
      } else {
        counts.private++;
      }
    });
    return [
      { name: 'Private', value: counts.private },
      { name: 'Public', value: counts.public },
      { name: 'Shared', value: counts.shared }
    ];
  }, [myTemplates]);

  // Usage by folder
  const folderUsage = useMemo(() => {
    const folderStats = {};
    myTemplates.forEach(t => {
      const folder = t.folder || 'Uncategorized';
      if (!folderStats[folder]) {
        folderStats[folder] = { count: 0, uses: 0 };
      }
      folderStats[folder].count++;
      folderStats[folder].uses += (t.use_count || 0);
    });
    return Object.entries(folderStats)
      .map(([folder, stats]) => ({
        folder,
        count: stats.count,
        uses: stats.uses
      }))
      .sort((a, b) => b.uses - a.uses)
      .slice(0, 10);
  }, [myTemplates]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <TrendingUp className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold">Template Analytics</h1>
              <p className="text-purple-100 mt-1">Track your template usage and performance</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-purple-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Templates</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-indigo-600">{stats.public}</div>
              <div className="text-sm text-gray-600">Public</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600">{stats.totalUses}</div>
              <div className="text-sm text-gray-600">Total Uses</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-pink-600">{stats.totalDownloads}</div>
              <div className="text-sm text-gray-600">Downloads</div>
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
              <div className="text-3xl font-bold text-blue-600">{stats.totalRatings}</div>
              <div className="text-sm text-gray-600">Total Ratings</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Templates by Category</CardTitle>
              <CardDescription>Distribution across categories</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Visibility Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Template Visibility</CardTitle>
              <CardDescription>Private vs Public vs Shared</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={visibilityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Most Used Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Most Used Templates
            </CardTitle>
            <CardDescription>Your top 10 templates by usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topTemplates.map((template, idx) => (
                <div key={template.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <Badge variant="secondary" className="text-xs">#{idx + 1}</Badge>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{template.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{template.category}</Badge>
                        {(template.is_public || template.visibility === 'public') && (
                          <Badge className="bg-green-100 text-green-800 text-xs">Public</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-purple-600">{template.use_count || 0}</div>
                      <div className="text-xs text-gray-500">Uses</div>
                    </div>
                    {(template.is_public || template.visibility === 'public') && (
                      <>
                        <div className="text-center">
                          <div className="font-bold text-pink-600">{template.downloads || 0}</div>
                          <div className="text-xs text-gray-500">Downloads</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-amber-600">{template.rating ? template.rating.toFixed(1) : '—'}</div>
                          <div className="text-xs text-gray-500">Rating</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Most Downloaded Public Templates */}
        {myPublicTemplates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-pink-600" />
                Most Downloaded Public Templates
              </CardTitle>
              <CardDescription>Community favorites from your collection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topDownloaded.map((template, idx) => (
                  <div key={template.id} className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <Badge className="bg-pink-600">#{idx + 1}</Badge>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{template.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{template.category}</Badge>
                          {template.rating > 0 && (
                            <span className="text-xs text-gray-600">
                              ⭐ {template.rating.toFixed(1)} ({template.rating_count} ratings)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-pink-600">{template.downloads || 0}</div>
                      <div className="text-xs text-gray-500">downloads</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Usage by Folder */}
        <Card>
          <CardHeader>
            <CardTitle>Usage by Folder</CardTitle>
            <CardDescription>Template usage organized by folder</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={folderUsage} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="folder" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="uses" fill="#6366f1" name="Uses" />
                <Bar dataKey="count" fill="#8b5cf6" name="Templates" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
