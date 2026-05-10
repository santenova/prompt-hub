import React, { useState } from "react";
import { apiClient } from "@/apis/client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain, Sparkles, ArrowRight, Users, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import AITemplateGenerator from "../components/templates/AITemplateGenerator";

export default function AIGenerator() {
  const [currentUser, setCurrentUser] = useState(null);
  const [randomTemplateIndex, setRandomTemplateIndex] = useState(0);
  const [randomPersonaIndex, setRandomPersonaIndex] = useState(0);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await apiClient.auth.me();
        setCurrentUser(user);
      } catch (error) {
        setCurrentUser(null);
      }
    };
    fetchUser();
  }, []);

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => apiClient.entities.Template.list('-created_date', 100),
    initialData: [],
  });

  const { data: personas = [] } = useQuery({
    queryKey: ['personas'],
    queryFn: () => apiClient.entities.Persona.list('-created_date', 100),
    initialData: [],
  });

  // Auto-rotate every 5 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (templates.length > 0) {
        setRandomTemplateIndex(prev => (prev + 1) % templates.length);
      }
      if (personas.length > 0) {
        setRandomPersonaIndex(prev => (prev + 1) % personas.length);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [templates.length, personas.length]);

  const createTemplateMutation = useMutation({
    mutationFn: (data) => apiClient.entities.Template.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
      navigate(createPageUrl('Templates'));
    },
  });

  const handleApplyTemplate = (template) => {
    if (currentUser) {
      createTemplateMutation.mutate(template);
    } else {
      apiClient.auth.redirectToLogin(createPageUrl('AIGenerator'));
    }
  };

  const randomTemplate = templates[randomTemplateIndex];
  const randomPersona = personas[randomPersonaIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full mb-4">
            <Brain className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">AI-Powered Prompt Creation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Generate Professional Prompts with AI
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Create, refine, and optimize prompts in seconds using advanced AI technology
          </p>
        </motion.div>

        {/* Inspiration Banner with Auto-Rotation */}
        {(randomTemplate || randomPersona) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 rounded-2xl p-1 shadow-xl">
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    Get Inspired
                  </h2>
                  <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600">
                    Auto-Rotating
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatePresence mode="wait">
                    {randomTemplate && (
                      <motion.div
                        key={randomTemplate.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Link to={createPageUrl('Templates')}>
                          <Card className="hover:shadow-lg transition-all cursor-pointer border-2 border-purple-100 hover:border-purple-300 h-full">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <FileText className="w-4 h-4 text-purple-600" />
                                    <Badge variant="outline" className="text-xs">Random Prompt</Badge>
                                  </div>
                                  <CardTitle className="text-base">{randomTemplate.title}</CardTitle>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <p className="text-sm text-gray-600 line-clamp-2">{randomTemplate.content}</p>
                              <div className="flex gap-2 flex-wrap">
                                <Badge className="text-xs">{randomTemplate.category}</Badge>
                                {randomTemplate.tags?.slice(0, 2).map((tag, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">#{tag}</Badge>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence mode="wait">
                    {randomPersona && (
                      <motion.div
                        key={randomPersona.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Link to={createPageUrl('PersonasLibrary')}>
                          <Card className="hover:shadow-lg transition-all cursor-pointer border-2 border-indigo-100 hover:border-indigo-300 h-full">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Users className="w-4 h-4 text-indigo-600" />
                                    <Badge variant="outline" className="text-xs">Random Persona</Badge>
                                  </div>
                                  <CardTitle className="text-base flex items-center gap-2">
                                    <span>{randomPersona.icon || '🤖'}</span>
                                    {randomPersona.name}
                                  </CardTitle>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <p className="text-sm text-gray-600 line-clamp-2">{randomPersona.description}</p>
                              <div className="flex gap-2 flex-wrap">
                                <Badge className="text-xs">{randomPersona.category}</Badge>
                                <Badge variant="outline" className="text-xs">{randomPersona.tone}</Badge>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          {[
            {
              title: "Create New",
              description: "Generate prompts from scratch based on your requirements",
              icon: Sparkles,
              color: "from-purple-500 to-indigo-500"
            },
            {
              title: "Refine Existing",
              description: "Improve and optimize your current prompts",
              icon: Brain,
              color: "from-indigo-500 to-purple-500"
            },
            {
              title: "Generate Variations",
              description: "Create multiple versions optimized for different use cases",
              icon: ArrowRight,
              color: "from-purple-500 to-pink-500"
            }
          ].map((feature, idx) => (
            <Card key={idx} className="border-2 border-purple-100 hover:border-purple-300 transition-colors">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-3`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </motion.div>

        {/* AI Generator Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AITemplateGenerator
            onApplyTemplate={handleApplyTemplate}
            mode="create"
            existingTemplates={templates}
          />
        </motion.div>

        {!currentUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center"
          >
            <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
              <CardContent className="pt-6">
                <p className="text-gray-700 mb-4">
                  Sign in to save your generated prompts to your library
                </p>
                <button
                  onClick={() => apiClient.auth.redirectToLogin(createPageUrl('AIGenerator'))}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all"
                >
                  Sign In to Continue
                </button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
