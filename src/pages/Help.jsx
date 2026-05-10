import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
  Search,
  HelpCircle,
  BookOpen,
  MessageSquare,
  Mail,
  Video,
  Users,
  Zap,
  FileText,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Play,
  Clock,
  Star,
  ChevronDown,
  ChevronUp,
  Sparkles,
  LifeBuoy,
  Phone,
  Send,
  Globe,
  Shield,
  Target,
  TrendingUp,
  User
} from "lucide-react";
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { apiClient } from '@/apis/client'; // Import api client

const helpCategories = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Sparkles,
    color: 'purple',
    articles: [
      {
        title: 'Quick Start Guide',
        description: 'Get up and running in 5 minutes',
        readTime: '3 min',
        popular: true
      },
      {
        title: 'Creating Your First Project',
        description: 'Set up and organize your content projects',
        readTime: '4 min',
        popular: true
      },
      {
        title: 'Creating Your First Template',
        description: 'Step-by-step guide to templates with placeholders',
        readTime: '5 min',
        popular: true
      },
      {
        title: 'Understanding Personas',
        description: 'How to use AI personas effectively',
        readTime: '4 min',
        popular: false
      },
      {
        title: 'AI Content Generator Basics',
        description: 'Generate professional content with AI',
        readTime: '6 min',
        popular: true
      },
      {
        title: 'Voice Chat Collaboration',
        description: 'Share and collaborate on voice chats',
        readTime: '5 min',
        popular: true
      }
    ]
  },
  {
    id: 'templates',
    title: 'Templates & Prompts',
    icon: FileText,
    color: 'blue',
    articles: [
      {
        title: 'Template Best Practices',
        description: 'Tips for creating effective templates',
        readTime: '7 min',
        popular: true
      },
      {
        title: 'Using Dynamic Placeholders',
        description: 'Create reusable templates with smart placeholders and auto-mapping',
        readTime: '5 min',
        popular: true
      },
      {
        title: 'Organizing Templates with Folders',
        description: 'Keep your workspace tidy',
        readTime: '3 min',
        popular: false
      },
      {
        title: 'Sharing Templates with Your Team',
        description: 'Collaboration features explained',
        readTime: '5 min',
        popular: true
      },
      {
        title: 'Template Versioning',
        description: 'Track changes and restore previous versions',
        readTime: '6 min',
        popular: false
      },
      {
        title: 'Using Chat Folders',
        description: 'Organize voice conversations with folders',
        readTime: '3 min',
        popular: false
      }
    ]
  },
  {
    id: 'personas',
    title: 'Personas',
    icon: Users,
    color: 'indigo',
    articles: [
      {
        title: 'Creating Custom Personas',
        description: 'Build personas that match your brand voice',
        readTime: '8 min',
        popular: true
      },
      {
        title: 'Voice Profile Settings',
        description: 'Fine-tune persona communication style',
        readTime: '6 min',
        popular: true
      },
      {
        title: 'Persona Examples & Use Cases',
        description: 'Real-world persona applications',
        readTime: '5 min',
        popular: false
      },
      {
        title: 'AI Persona Generator',
        description: 'Let AI create personas for you',
        readTime: '4 min',
        popular: true
      }
    ]
  },
  {
    id: 'ai-features',
    title: 'AI Features',
    icon: Zap,
    color: 'pink',
    articles: [
      {
        title: 'Testing Templates with Ollama',
        description: 'Local AI testing without API costs',
        readTime: '10 min',
        popular: true
      },
      {
        title: 'AI Content Generation',
        description: 'Create content with AI assistance',
        readTime: '7 min',
        popular: true
      },
      {
        title: 'AI Refinement & Variations',
        description: 'Improve and iterate on content',
        readTime: '5 min',
        popular: false
      },
      {
        title: 'Setting Up Ollama Locally',
        description: 'Install and configure Ollama',
        readTime: '12 min',
        popular: true
      },
      {
        title: 'AI Follow-up Suggestions',
        description: 'Get smart conversation suggestions',
        readTime: '4 min',
        popular: true
      }
    ]
  },
  {
    id: 'enterprise',
    title: 'Enterprise AI Control',
    icon: Shield,
    color: 'slate',
    articles: [
      {
        title: 'AI Infrastructure Control',
        description: 'Manage AI on your own infrastructure',
        readTime: '8 min',
        popular: true
      },
      {
        title: 'API Integration Setup',
        description: 'Connect external APIs to workflows',
        readTime: '10 min',
        popular: true
      },
      {
        title: 'Workflow Automation',
        description: 'Build automated AI chains',
        readTime: '12 min',
        popular: true
      },
      {
        title: 'Local Ollama Deployment',
        description: 'Run AI models without cloud APIs',
        readTime: '15 min',
        popular: true
      }
    ]
  },
  {
    id: 'account',
    title: 'Account & Settings',
    icon: User,
    color: 'green',
    articles: [
      {
        title: 'Account Settings Overview',
        description: 'Manage your profile and preferences',
        readTime: '4 min',
        popular: false
      },
      {
        title: 'Notification Preferences',
        description: 'Control what alerts you receive',
        readTime: '3 min',
        popular: false
      },
      {
        title: 'Privacy & Security',
        description: 'Keep your data safe',
        readTime: '5 min',
        popular: false
      },
      {
        title: 'Subscription & Billing',
        description: 'Manage your plan and payments',
        readTime: '4 min',
        popular: true
      }
    ]
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: LifeBuoy,
    color: 'red',
    articles: [
      {
        title: 'Common Issues & Solutions',
        description: 'Quick fixes for frequent problems',
        readTime: '8 min',
        popular: true
      },
      {
        title: 'Ollama Connection Problems',
        description: 'Troubleshoot local AI issues',
        readTime: '6 min',
        popular: true
      },
      {
        title: 'Template Not Working',
        description: 'Debug template execution issues',
        readTime: '5 min',
        popular: false
      },
      {
        title: 'Performance Optimization',
        description: 'Speed up your workspace',
        readTime: '7 min',
        popular: false
      }
    ]
  }
];

const faqs = [
  {
    question: 'What is Prompt Hub?',
    answer: 'Prompt Hub is a comprehensive platform for managing AI prompts, templates, and personas. It helps you create, organize, and execute professional content using AI, with support for both cloud and local AI models like Ollama.'
  },
  {
    question: 'Is Prompt Hub free to use?',
    answer: 'We offer a free tier with access to core features including template creation, persona management, and basic AI generation. Premium features like advanced AI models, team collaboration, and priority support are available with paid plans.'
  },
  {
    question: 'What is Ollama and why should I use it?',
    answer: 'Ollama is a local AI runtime that lets you run AI models on your own computer. This means no API costs, complete privacy, and the ability to test templates offline. We provide built-in integration with Ollama for seamless local AI testing.'
  },
  {
    question: 'Can I share templates with my team?',
    answer: 'Yes! Templates can be shared publicly, with specific users, or kept private. You can also collaborate in real-time on templates, track changes with version history, and organize shared content in team folders.'
  },
  {
    question: 'How do personas work?',
    answer: 'Personas define the voice, tone, and style for AI-generated content. You can use our pre-built personas (like Software Engineer, Marketing Manager) or create custom ones. Personas include voice profiles, communication guidelines, and example use cases.'
  },
  {
    question: 'Can I import/export my data?',
    answer: 'Absolutely! We support JSON import/export for both templates and personas. This makes it easy to backup your work, migrate between accounts, or share collections with others. Admins have access to bulk import/export tools.'
  },
  {
    question: 'What AI models are supported?',
    answer: 'We support multiple AI providers including OpenAI (GPT-4, GPT-3.5), local Ollama models (Llama 2, Mistral, CodeLlama, etc.), and our built-in AI generation. You can configure which models to use in your settings.'
  },
  {
    question: 'How do I get support?',
    answer: 'We offer multiple support channels: email support (support@prompthub.io), live chat during business hours, comprehensive documentation, video tutorials, and an active community forum. Premium users get priority support with faster response times.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes! We use industry-standard encryption (SSL/TLS) for all data transmission, secure cloud storage with regular backups, and strict access controls. Your templates and personas are private by default, and you control all sharing settings.'
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel your subscription at any time with no penalties. You\'ll retain access to premium features until the end of your billing period. After cancellation, you\'ll be moved to the free tier and keep all your data.'
  }
];

const videoTutorials = [
  {
    title: 'Getting Started with Prompt Hub',
    duration: '5:32',
    thumbnail: '🚀',
    views: '12.5K',
    description: 'Complete walkthrough for new users'
  },
  {
    title: 'Creating Your First Template',
    duration: '8:15',
    thumbnail: '📝',
    views: '8.2K',
    description: 'Step-by-step template creation guide'
  },
  {
    title: 'Setting Up Ollama for Local AI',
    duration: '12:40',
    thumbnail: '🤖',
    views: '15.8K',
    description: 'Install and configure Ollama'
  },
  {
    title: 'Advanced Persona Customization',
    duration: '10:25',
    thumbnail: '👥',
    views: '6.4K',
    description: 'Create brand-specific personas'
  },
  {
    title: 'Team Collaboration Features',
    duration: '7:18',
    thumbnail: '🤝',
    views: '4.9K',
    description: 'Work together on templates'
  },
  {
    title: 'AI Content Generation Tips',
    duration: '9:55',
    thumbnail: '✨',
    views: '11.3K',
    description: 'Get better AI results'
  }
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [currentUser, setCurrentUser] = React.useState(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        // The api client is already imported at the top, no need for dynamic require here.
        const user = await apiClient.auth.me();
        setCurrentUser(user);
      } catch (error) {
        setCurrentUser(null);
      }
    };
    fetchUser();
  }, []);

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const filteredCategories = selectedCategory === 'all' 
    ? helpCategories 
    : helpCategories.filter(cat => cat.id === selectedCategory);

  const searchResults = searchQuery.trim() 
    ? helpCategories.flatMap(cat => 
        cat.articles
          .filter(article => 
            article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.description.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(article => ({ ...article, category: cat.title, categoryColor: cat.color }))
      )
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Enhanced Hero Section */}
      {!currentUser && (
        <div className="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/[0.2] bg-[size:30px_30px]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-purple-600/50 via-transparent to-transparent"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-md rounded-full mb-8 border border-white/30"
              >
                <HelpCircle className="w-5 h-5" />
                <span className="text-sm font-semibold">Help Center</span>
              </motion.div>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold mb-6 drop-shadow-lg">
                Master AI Content Creation
              </h1>
              <p className="text-xl sm:text-2xl text-purple-100 mb-10 max-w-3xl mx-auto leading-relaxed">
                Expert guides, tutorials, and support to help you create professional content with AI
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
                <Button
                  size="lg"
                  className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-10 py-6 shadow-2xl"
                  onClick={() => apiClient.auth.redirectToLogin()}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Free Today
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 text-lg px-10 py-6"
                  onClick={() => {
                    const examplesSection = document.getElementById('help-content');
                    examplesSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Browse Guides
                </Button>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-purple-100">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  No credit card required
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Free forever plan
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  5-minute setup
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Compact Header for logged-in users */}
      {currentUser && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Help Center</h1>
                  <p className="text-sm text-gray-600">Find answers and learn new skills</p>
                </div>
              </div>

              {/* Compact Search Bar */}
              <div className="relative max-w-2xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search for help articles, guides, tutorials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2"
                />
                {searchQuery && searchResults.length > 0 && (
                  <Card className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto z-50 shadow-xl">
                    <CardContent className="p-2">
                      {searchResults.map((result, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSearchQuery('')}
                          className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{result.title}</p>
                              <p className="text-sm text-gray-600">{result.description}</p>
                            </div>
                            <Badge className={`bg-${result.categoryColor}-100 text-${result.categoryColor}-800 flex-shrink-0`}>
                              {result.category}
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}

      <div id="help-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2">
            <TabsTrigger value="browse" className="text-sm">
              <BookOpen className="w-4 h-4 mr-2" />
              Browse Articles
            </TabsTrigger>
            <TabsTrigger value="videos" className="text-sm">
              <Video className="w-4 h-4 mr-2" />
              Video Tutorials
            </TabsTrigger>
            <TabsTrigger value="faq" className="text-sm">
              <HelpCircle className="w-4 h-4 mr-2" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="contact" className="text-sm">
              <MessageSquare className="w-4 h-4 mr-2" />
              Contact Support
            </TabsTrigger>
          </TabsList>

          {/* Browse Articles Tab */}
          <TabsContent value="browse" className="space-y-6">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('all')}
                size="sm"
                className={selectedCategory === 'all' ? 'bg-purple-600' : ''}
              >
                All Categories
              </Button>
              {helpCategories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory(cat.id)}
                    size="sm"
                    className={selectedCategory === cat.id ? `bg-${cat.color}-600` : ''}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {cat.title}
                  </Button>
                );
              })}
            </div>

            {/* Help Categories */}
            <div className="space-y-6">
              {filteredCategories.map((category, catIdx) => {
                const Icon = category.icon;
                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: catIdx * 0.1 }}
                  >
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl bg-${category.color}-100 flex items-center justify-center`}>
                            <Icon className={`w-6 h-6 text-${category.color}-600`} />
                          </div>
                          <div>
                            <CardTitle className="text-2xl">{category.title}</CardTitle>
                            <CardDescription>{category.articles.length} articles</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {category.articles.map((article, idx) => (
                            <button
                              key={idx}
                              className="flex items-start gap-4 p-4 rounded-lg border hover:border-purple-300 hover:bg-purple-50 transition-all text-left group"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                                    {article.title}
                                  </h4>
                                  {article.popular && (
                                    <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                      <Star className="w-3 h-3 mr-1 fill-current" />
                                      Popular
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{article.description}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <Clock className="w-3 h-3" />
                                  {article.readTime}
                                </div>
                              </div>
                              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 flex-shrink-0 mt-1" />
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* Video Tutorials Tab */}
          <TabsContent value="videos" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Video Tutorials</h2>
              <p className="text-gray-600">Watch step-by-step guides to master Prompt Hub</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videoTutorials.map((video, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="hover:shadow-xl transition-all cursor-pointer group">
                    <CardContent className="pt-6">
                      <div className="relative mb-4">
                        <div className="aspect-video bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center text-6xl">
                          {video.thumbnail}
                        </div>
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 rounded-lg flex items-center justify-center transition-colors">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                            <Play className="w-8 h-8 text-purple-600 ml-1" />
                          </div>
                        </div>
                        <Badge className="absolute top-2 right-2 bg-black/70 text-white border-0">
                          <Clock className="w-3 h-3 mr-1" />
                          {video.duration}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg mb-2 group-hover:text-purple-600 transition-colors">
                        {video.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">{video.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {video.views} views
                        </span>
                        <Button variant="ghost" size="sm" className="h-auto p-0 text-purple-600">
                          Watch Now <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0">
              <CardContent className="pt-6 pb-6 text-center">
                <Video className="w-10 h-10 mx-auto mb-3 opacity-90" />
                <h3 className="text-xl font-bold mb-2">Want More Tutorials?</h3>
                <p className="opacity-90 mb-4">Subscribe to our YouTube channel for weekly tips and tricks</p>
                <Button className="bg-white text-purple-600 hover:bg-gray-100">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visit YouTube Channel
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h2>
              <p className="text-gray-600">Quick answers to common questions</p>
            </div>

            <div className="max-w-4xl mx-auto space-y-3">
              {faqs.map((faq, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card
                    className={`cursor-pointer transition-all ${
                      expandedFaq === idx ? 'border-purple-300 shadow-lg' : 'hover:border-purple-200'
                    }`}
                    onClick={() => toggleFaq(idx)}
                  >
                    <CardContent className="pt-6 pb-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 mb-2">
                            {faq.question}
                          </h3>
                          {expandedFaq === idx && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="text-gray-700 leading-relaxed"
                            >
                              {faq.answer}
                            </motion.p>
                          )}
                        </div>
                        {expandedFaq === idx ? (
                          <ChevronUp className="w-5 h-5 text-purple-600 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-start gap-4">
                  <HelpCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-blue-900 mb-2">
                      Still have questions?
                    </h3>
                    <p className="text-blue-800 mb-4">
                      Can't find what you're looking for? Our support team is here to help!
                    </p>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Contact Support
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Support Tab */}
          <TabsContent value="contact" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Get in Touch</h2>
              <p className="text-gray-600">Choose the best way to reach us</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {[
                {
                  icon: Mail,
                  title: 'Email Support',
                  description: 'Get help via email',
                  detail: 'support@prompthub.io',
                  action: 'Send Email',
                  color: 'purple',
                  response: 'Response within 24 hours'
                },
                {
                  icon: MessageSquare,
                  title: 'Live Chat',
                  description: 'Chat with our team',
                  detail: 'Available 9 AM - 6 PM EST',
                  action: 'Start Chat',
                  color: 'blue',
                  response: 'Average response: 5 minutes'
                },
                {
                  icon: Phone,
                  title: 'Phone Support',
                  description: 'Premium members only',
                  detail: '+1 (555) 123-4567',
                  action: 'Call Now',
                  color: 'green',
                  response: 'Mon-Fri, 9 AM - 6 PM EST'
                }
              ].map((option, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className={`hover:shadow-xl transition-all border-2 border-${option.color}-200 hover:border-${option.color}-400`}>
                    <CardContent className="pt-6 text-center">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-${option.color}-100 flex items-center justify-center`}>
                        <option.icon className={`w-8 h-8 text-${option.color}-600`} />
                      </div>
                      <h3 className="text-xl font-bold mb-2">{option.title}</h3>
                      <p className="text-gray-600 mb-2">{option.description}</p>
                      <p className={`text-sm font-semibold text-${option.color}-700 mb-1`}>{option.detail}</p>
                      <p className="text-xs text-gray-500 mb-4">{option.response}</p>
                      <Button className={`w-full bg-${option.color}-600 hover:bg-${option.color}-700`}>
                        {option.action}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contact Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5 text-purple-600" />
                    Send us a Message
                  </CardTitle>
                  <CardDescription>Fill out the form and we'll get back to you soon</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Your Name</label>
                      <Input placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email Address</label>
                      <Input type="email" placeholder="john@example.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Subject</label>
                      <Input placeholder="How can we help?" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Message</label>
                      <textarea
                        className="w-full min-h-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Describe your issue or question..."
                      />
                    </div>
                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Additional Resources */}
              <div className="space-y-4">
                <Card className="bg-gradient-to-br from-purple-100 to-indigo-100 border-purple-200">
                  <CardContent className="pt-6">
                    <Globe className="w-8 h-8 text-purple-600 mb-3" />
                    <h3 className="text-lg font-semibold mb-2">Community Forum</h3>
                    <p className="text-sm text-gray-700 mb-4">
                      Join our community of 10,000+ users. Ask questions, share tips, and connect with other Prompt Hub users.
                    </p>
                    <Button variant="outline" className="w-full border-purple-300 hover:bg-purple-50">
                      Visit Forum
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-100 to-cyan-100 border-blue-200">
                  <CardContent className="pt-6">
                    <BookOpen className="w-8 h-8 text-blue-600 mb-3" />
                    <h3 className="text-lg font-semibold mb-2">Documentation</h3>
                    <p className="text-sm text-gray-700 mb-4">
                      Comprehensive guides, API docs, and technical references for developers and power users.
                    </p>
                    <Link to={createPageUrl('APIDocumentation')}>
                      <Button variant="outline" className="w-full border-blue-300 hover:bg-blue-50">
                        Read Docs
                        <BookOpen className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-100 to-emerald-100 border-green-200">
                  <CardContent className="pt-6">
                    <Target className="w-8 h-8 text-green-600 mb-3" />
                    <h3 className="text-lg font-semibold mb-2">Feature Requests</h3>
                    <p className="text-sm text-gray-700 mb-4">
                      Have an idea for a new feature? Submit your suggestion and vote on others' ideas.
                    </p>
                    <Button variant="outline" className="w-full border-green-300 hover:bg-green-50">
                      Submit Idea
                      <Sparkles className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* CTA Section for Non-Authenticated Users */}
        {!currentUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12"
          >
            <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 shadow-2xl">
              <CardContent className="pt-12 pb-12 text-center">
                <Sparkles className="w-16 h-16 mx-auto mb-6 animate-pulse" />
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  Ready to Transform Your Content Creation?
                </h2>
                <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
                  Join 10,000+ professionals who've unlocked the power of AI-assisted content with Prompt Hub
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-left max-w-4xl mx-auto">
                  {[
                    { icon: Zap, text: "Create prompts in seconds with AI" },
                    { icon: Users, text: "Build custom personas for any brand" },
                    { icon: TrendingUp, text: "Generate professional content instantly" }
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                      <feature.icon className="w-6 h-6 flex-shrink-0 mt-1" />
                      <p className="text-white">{feature.text}</p>
                    </div>
                  ))}
                </div>
                <Button
                  size="lg"
                  className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-12 py-6 shadow-xl"
                  onClick={() => {
                    // apiClient is already imported at the top.
                    apiClient.auth.redirectToLogin();
                  }}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Get Started Free - No Credit Card
                </Button>
                <p className="text-sm text-purple-100 mt-4">
                  Free forever • Premium features available • Cancel anytime
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
