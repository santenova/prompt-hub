import React, { useState } from 'react';
import { apiClient } from "@/apis/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Sparkles, Zap, FileText, Lightbulb, History, BookOpen, Info, Edit3, Image, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import AIContentGenerator from "../components/ai/AIContentGenerator";
import CreateContentTab from "../components/ai/CreateContentTab";
import ContentHistoryViewer from "../components/ai/ContentHistoryViewer";
import WritingRefinementTool from "../components/ai/WritingRefinementTool";
import AIImageGenerator from "../components/ai/AIImageGenerator";
import ImageGallery from "../components/ai/ImageGallery";
import AIDataAnalyzer from "../components/ai/AIDataAnalyzer";
import AnalysisHistory from "../components/ai/AnalysisHistory";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";

const proTips = [
{ title: "Mix personas", desc: "Combine different personas for unique content perspectives" },
{ title: "Save to library", desc: "All generated content is automatically saved to your library" },
{ title: "Use variations", desc: "Generate multiple versions and pick the best one" },
{ title: "Templates boost quality", desc: "Select relevant templates for better structured output" },
{ title: "Adjust creativity", desc: "Higher creativity for marketing, lower for technical content" }];


export default function AIContentGeneratorPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showInfoBanner, setShowInfoBanner] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [chatContext, setChatContext] = useState('');

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

  // Rotate pro tips every 5 seconds
  React.useEffect(() => {
    if (!showInfoBanner) return;
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % proTips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [showInfoBanner]);

  const { data: personas = [], isLoading: loadingPersonas } = useQuery({
    queryKey: ['personas'],
    queryFn: () => apiClient.entities.Persona.list('-created_date'),
    initialData: []
  });

  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => apiClient.entities.Template.list('-created_date'),
    initialData: []
  });

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiClient.entities.Project.list('-created_date'),
    initialData: []
  });

  const isLoading = loadingPersonas || loadingTemplates || loadingProjects;

  return (
    <div className="min-h-screen">
      {/* Minimal Compact Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-purple-100 sticky top-16 sm:top-[4.5rem] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                AI Content Generator
              </h1>
              <p className="text-xs sm:text-sm text-gray-600">
                {personas.length} personas • {templates.length} templates available
              </p>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <Zap className="w-3 h-3 mr-1" />
                AI Powered
              </Badge>
              <Badge variant="outline" className="border-purple-300">
                <FileText className="w-3 h-3 mr-1" />
                5+ Content Types
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInfoBanner(!showInfoBanner)}
                className="text-gray-600 hover:text-purple-600"
                title="Show/Hide Info">

                <Info className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ?
        <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-96 w-full rounded-xl" />
          </div> :

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}>

            {/* Info Banner */}
            <AnimatePresence>
              {showInfoBanner &&
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden">

                  <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 rounded-2xl p-1 shadow-xl">
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-purple-600" />
                            How it Works
                          </h3>
                          <ul className="text-xs text-gray-600 space-y-1">
                            <li>• Choose content type</li>
                            <li>• Pick persona & template</li>
                            <li>• Generate AI content</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-yellow-600" />
                            Pro Tip
                          </h3>
                          <AnimatePresence mode="wait">
                            <motion.div
                          key={currentTipIndex}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}>

                              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                <h4 className="font-semibold text-sm text-gray-900 mb-1">{proTips[currentTipIndex].title}</h4>
                                <p className="text-xs text-gray-600">{proTips[currentTipIndex].desc}</p>
                                <div className="flex gap-1 mt-2">
                                  {proTips.map((_, idx) =>
                              <div key={idx} className={`h-1 flex-1 rounded ${idx === currentTipIndex ? 'bg-yellow-400' : 'bg-yellow-200'}`} />
                              )}
                                </div>
                              </div>
                            </motion.div>
                          </AnimatePresence>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-indigo-600" />
                            Perfect For
                          </h3>
                          <ul className="text-xs text-gray-600 space-y-1">
                            <li>• Marketers & agencies</li>
                            <li>• Content creators</li>
                            <li>• Business & HR teams</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                            Quick Links
                          </h3>
                          <div className="space-y-2">
                            <Link to={createPageUrl('Documentation')} className="block text-xs text-blue-600 hover:text-blue-700 hover:underline">
                              → AI Generator Guide
                            </Link>
                            <Link to={createPageUrl('Help')} className="block text-xs text-blue-600 hover:text-blue-700 hover:underline">
                              → Help Center
                            </Link>
                            <Link to={createPageUrl('ContentLibrary')} className="block text-xs text-blue-600 hover:text-blue-700 hover:underline">
                              → Content Library
                            </Link>
                            <Link to={createPageUrl('ContentExamples')} className="block text-xs text-blue-600 hover:text-blue-700 hover:underline">
                              → View Examples
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
            }
            </AnimatePresence>

            {/* Main Tabs */}
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full grid-cols-7 lg:grid-cols-7">
                <TabsTrigger value="create">
                  <Sparkles className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Create</span>
                </TabsTrigger>
                <TabsTrigger value="refine">
                  <Edit3 className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Refine</span>
                </TabsTrigger>
                <TabsTrigger value="images">
                  <Image className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Images</span>
                </TabsTrigger>
                <TabsTrigger value="gallery">
                  <Image className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Gallery</span>
                </TabsTrigger>
                <TabsTrigger value="analyze">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Analyze</span>
                </TabsTrigger>
                <TabsTrigger value="analyses">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Analyses</span>
                </TabsTrigger>
                <TabsTrigger value="history">
                  <History className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">History</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="mt-6">
                <CreateContentTab
                personas={personas}
                templates={templates}
                projects={projects} />

              </TabsContent>

              <TabsContent value="refine" className="mt-6">
                <WritingRefinementTool initialContent={chatContext} />
              </TabsContent>

              <TabsContent value="images" className="mt-6">
                <AIImageGenerator
                personas={personas}
                contextFromChat={chatContext} />

              </TabsContent>

              <TabsContent value="gallery" className="mt-6">
                <ImageGallery />
              </TabsContent>

              <TabsContent value="analyze" className="mt-6">
                <AIDataAnalyzer
                chatMessages={[]}
                personas={personas} />

              </TabsContent>

              <TabsContent value="analyses" className="mt-6">
                <AnalysisHistory />
              </TabsContent>

              <TabsContent value="history" className="mt-6">
                <ContentHistoryViewer
                toolType="ai_content_generator"
                onRegenerate={(item) => {






                  // Switch to generator tab and populate fields
                  // Note: This would require state management
                }} />
              </TabsContent>
            </Tabs>


          </motion.div>}
      </div>
    </div>);}
