import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  FileText,
  Users,
  GitBranch,
  Upload,
  Link2,
  Sparkles,
  ArrowRight,
  Zap,
  Target,
  BookOpen,
  Palette,
  Share2,
  Clock,
  UserPlus,
  Shield,
  Package,
  Mic,
  Mail } from
"lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { apiClient } from "@/apis/client";
import NewsletterGeneratorModal from "../components/modals/NewsletterGeneratorModal";

const toolCategories = [
{
  category: "Project Management",
  description: "Organize and enhance your content creation workflow",
  icon: Brain,
  color: "purple",
  tools: [
  {
    id: "projects",
    name: "Project Dashboard",
    description: "Manage content projects with AI-powered categorization and task assignment",
    icon: Brain,
    page: "Projects",
    features: ["AI auto-categorization", "Smart task assignment", "Placeholder mapping", "Progress tracking"],
    quickStart: "Create a project and let AI categorize and suggest task assignments"
  },
  {
    id: "ai-generator",
    name: "AI Prompt Generator",
    description: "Generate professional prompts from scratch using advanced AI",
    icon: Sparkles,
    page: "AIGenerator",
    features: ["Create from description", "Refine existing prompts", "Generate variations"],
    quickStart: "Describe what you need and AI creates a complete prompt in seconds"
  },
  {
    id: "advanced-ai",
    name: "Advanced AI Studio",
    description: "A/B testing, document upload, and external data integration",
    icon: Brain,
    page: "AdvancedAI",
    badge: "Advanced",
    features: ["A/B test variations", "Upload reference docs", "Live data integration"],
    quickStart: "Select a template or persona, then generate optimized variations"
  },
  {
    id: "templates",
    name: "Prompt Library",
    description: "Browse, create, and manage your prompt templates",
    icon: FileText,
    page: "Templates",
    features: ["100+ templates", "Folders & tags", "AI enhancement"],
    quickStart: "Start with templates or create your own from scratch"
  },
  {
    id: "newsletter-generator",
    name: "Newsletter Generator",
    description: "Generate engaging newsletter content with AI",
    icon: Mail,
    badge: "New",
    features: ["7 newsletter ideas", "Audience targeting", "Scheduled dates"],
    quickStart: "Describe your newsletter topic and generate a month's worth of ideas"
  }]

},
{
  category: "Personas & Voice",
  description: "Define who creates your content",
  icon: Users,
  color: "indigo",
  tools: [
  {
    id: "personas",
    name: "Persona Library",
    description: "Create and manage AI personas for consistent voice",
    icon: Users,
    page: "PersonasLibrary",
    features: ["Custom personas", "Voice profiles", "Persona families"],
    quickStart: "Create personas that match your brand voice and expertise"
  },
  {
    id: "voice-tuner",
    name: "Voice Profile Tuner",
    description: "Fine-tune tone, vocabulary, and writing style",
    icon: Palette,
    badge: "Pro",
    features: ["Tone adjustment", "Style consistency", "Voice analysis"],
    quickStart: "Available within persona creation and editing"
  },
  {
    id: "voice-to-prompt",
    name: "Voice to Prompt",
    description: "Speak your ideas and transform them into polished AI prompts with collaboration.",
    icon: Mic,
    page: "VoiceToPrompt",
    badge: "New",
    features: ["Real-time transcription", "Chat folders", "Follow-up suggestions", "Share & collaborate"],
    quickStart: "Click the mic, start speaking, and let AI refine your ideas."
  }]

},
{
  category: "Collaboration",
  description: "Work together on prompts and content",
  icon: UserPlus,
  color: "blue",
  tools: [
  {
    id: "real-time-editing",
    name: "Real-Time Collaboration",
    description: "Edit prompts and chats simultaneously with your team",
    icon: Users,
    features: ["Live editing", "Presence indicators", "Version history", "Chat collaboration"],
    quickStart: "Invite collaborators from any prompt or chat session"
  },
  {
    id: "version-control",
    name: "Version History",
    description: "Track changes and restore previous versions",
    icon: Clock,
    features: ["Change tracking", "Rollback capability", "Author attribution"],
    quickStart: "View history from the prompt menu or collaborative editor"
  },
  {
    id: "sharing",
    name: "Share & Permissions",
    description: "Share prompts and chats publicly or with specific collaborators",
    icon: Share2,
    features: ["Public sharing", "Permission levels", "Email invites", "Chat sharing"],
    quickStart: "Set permissions: viewer or editor for chats, or make public"
  }]

},
{
  category: "Optimization",
  description: "Test and improve your content",
  icon: Target,
  color: "green",
  tools: [
  {
    id: "ab-testing",
    name: "A/B Variations Generator",
    description: "Create multiple versions for testing and optimization",
    icon: GitBranch,
    page: "AdvancedAI",
    features: ["Multiple tones", "Format options", "Conversion scoring"],
    quickStart: "Go to Advanced AI > A/B Variations tab"
  },
  {
    id: "tone-adjustment",
    name: "AI Tone Adjustment",
    description: "Adjust content tone on-the-fly for different audiences",
    icon: Palette,
    features: ["9 tone options", "Audience targeting", "Real-time preview"],
    quickStart: "Available in A/B Variations Generator"
  },
  {
    id: "ai-insights",
    name: "Team Insights AI",
    description: "Get AI-powered suggestions for improving prompts",
    icon: Brain,
    features: ["Performance analysis", "Improvement suggestions", "Usage patterns"],
    quickStart: "Click 'AI Insights' from any prompt card"
  }]

},
{
  category: "Data & Integration",
  description: "Connect external data sources",
  icon: Link2,
  color: "orange",
  tools: [
  {
    id: "document-upload",
    name: "Document Upload",
    description: "Upload brand guides and references for AI context",
    icon: Upload,
    page: "AdvancedAI",
    features: ["PDF, DOCX, TXT support", "Auto content extraction", "Context integration"],
    quickStart: "Go to Advanced AI > Documents tab"
  },
  {
    id: "api-integration",
    name: "Live Data Integration",
    description: "Pull trends and market data from external sources",
    icon: Link2,
    page: "AdvancedAI",
    badge: "New",
    features: ["Social trends", "Market research", "News & events"],
    quickStart: "Go to Advanced AI > External Data tab"
  },
  {
    id: "workflow-automation",
    name: "Workflow & API Chains",
    description: "Build automated AI workflows with external API integrations",
    icon: GitBranch,
    page: "Workspace",
    badge: "Enterprise",
    features: ["API step integration", "Conditional logic", "Error handling & retries"],
    quickStart: "Switch to Chain Mode in Workspace"
  }]

},
{
  category: "Enterprise AI Control",
  description: "Take control of your AI infrastructure",
  icon: Shield,
  color: "slate",
  tools: [
  {
    id: "api-configurations",
    name: "API Configuration Manager",
    description: "Connect and manage external APIs for your workflows",
    icon: Zap,
    page: "Settings",
    features: ["Secure auth storage", "Multiple endpoints", "Usage tracking"],
    quickStart: "Go to Settings > API Config tab"
  },
  {
    id: "workflow-library",
    name: "Reusable Workflows",
    description: "Save complex AI chains as reusable templates",
    icon: GitBranch,
    page: "Workspace",
    features: ["Multi-step chains", "Save & load", "Team sharing"],
    quickStart: "Build a chain in Workspace and click Save"
  },
  {
    id: "ollama-local",
    name: "Local AI with Ollama",
    description: "Run AI models on your own infrastructure",
    icon: Package,
    page: "Settings",
    features: ["Complete data control", "Zero API costs", "Custom models"],
    quickStart: "Configure Ollama in Settings"
  }]

},
{
  category: "Learning",
  description: "Learn and get inspired",
  icon: BookOpen,
  color: "pink",
  tools: [
  {
    id: "examples",
    name: "Content Examples",
    description: "21+ real-world examples across industries",
    icon: FileText,
    page: "ContentExamples",
    features: ["21 examples", "15+ industries", "Copy & download"],
    quickStart: "Browse examples and copy what you need"
  },
  {
    id: "documentation",
    name: "Documentation",
    description: "Comprehensive guides and tutorials",
    icon: BookOpen,
    page: "Documentation",
    features: ["Step-by-step guides", "Video tutorials", "Best practices"],
    quickStart: "Learn how to make the most of every feature"
  }]

}];


export default function Tools() {
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();
  const [showNewsletterModal, setShowNewsletterModal] = useState(false);

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

  const handleToolClick = (tool) => {
    if (tool.id === 'newsletter-generator') {
      setShowNewsletterModal(true);
    } else if (tool.page) {
      navigate(createPageUrl(tool.page));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16">

          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full mb-6 shadow-lg"
          >
            <Zap className="w-5 h-5" />
            <span className="text-sm font-semibold">All Tools & Features</span>
          </motion.div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            Everything You Need to<br />
            <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">
              Create Amazing Content
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Discover powerful AI tools and features designed to supercharge your content creation workflow
          </p>
        </motion.div>

        {/* Enhanced Quick Start Banner - Only for non-logged in users */}
        {!currentUser && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-16">

            <Card className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 border-0 shadow-2xl overflow-hidden relative">
              <div className="absolute inset-0 bg-grid-white/[0.2] bg-[size:20px_20px]"></div>
              <CardContent className="p-8 sm:p-10 relative">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-white">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full mb-3">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-sm font-medium">New Here?</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                      Start Creating in Minutes 🚀
                    </h2>
                    <p className="text-purple-100 text-lg leading-relaxed max-w-xl">
                      Jump into our AI-powered tools and create your first professional content. No learning curve needed.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link to={createPageUrl('AIGenerator')}>
                      <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 shadow-xl">
                        <Sparkles className="w-5 h-5 mr-2" />
                        Start Creating
                      </Button>
                    </Link>
                    <Link to={createPageUrl('ContentExamples')}>
                      <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10">
                        View Examples
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tool Categories */}
        <div className="space-y-12">
          {toolCategories.map((category, catIdx) => {
            const CategoryIcon = category.icon;
            return (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: catIdx * 0.1 }}>

                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-lg bg-${category.color}-100 flex items-center justify-center`}>
                    <CategoryIcon className={`w-6 h-6 text-${category.color}-600`} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{category.category}</h2>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.tools.map((tool) => {
                    const ToolIcon = tool.icon;
                    return (
                      <Card
                        key={tool.id}
                        className="border-2 border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all cursor-pointer group"
                        onClick={() => handleToolClick(tool)}>

                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className={`w-12 h-12 rounded-lg bg-${category.color}-100 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                              <ToolIcon className={`w-6 h-6 text-${category.color}-600`} />
                            </div>
                            {tool.badge &&
                            <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600">
                                {tool.badge}
                              </Badge>
                            }
                          </div>
                          <CardTitle className="text-lg mt-3">{tool.name}</CardTitle>
                          <CardDescription>{tool.description}</CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {/* Features */}
                          <div>
                            <p className="text-xs font-semibold text-gray-600 mb-2">Key Features:</p>
                            <div className="space-y-1">
                              {tool.features.map((feature, idx) =>
                              <div key={idx} className="flex items-center gap-2 text-xs text-gray-700">
                                  <div className={`w-1 h-1 rounded-full bg-${category.color}-600`}></div>
                                  <span>{feature}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quick Start */}
                          {tool.quickStart &&
                          <div className={`bg-${category.color}-50 p-3 rounded-lg border border-${category.color}-200`}>
                              <p className="text-xs font-semibold text-gray-700 mb-1">
                                Quick Start:
                              </p>
                              <p className="text-xs text-gray-600">{tool.quickStart}</p>
                            </div>
                          }

                          {/* CTA */}
                          {tool.page &&
                          <Button
                            variant="outline"
                            className={`w-full group-hover:bg-${category.color}-50 group-hover:border-${category.color}-400`}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(createPageUrl(tool.page));
                            }}>

                              Open Tool
                              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                          }
                        </CardContent>
                      </Card>);

                  })}
                </div>
              </motion.div>);

          })}
        </div>

        {/* Workflow Examples */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16">

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Common Workflows
            </h2>
            <p className="text-lg text-gray-600">
              Popular combinations of tools for specific use cases
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
            {
              title: "Create & Test Marketing Copy",
              steps: [
              { tool: "AI Generator", action: "Generate base copy" },
              { tool: "A/B Variations", action: "Create 5 versions" },
              { tool: "Tone Adjustment", action: "Test different tones" },
              { tool: "Save to Library", action: "Save winning version" }],

              color: "purple"
            },
            {
              title: "Build Branded Content",
              steps: [
              { tool: "Document Upload", action: "Upload brand guide" },
              { tool: "Persona Creation", action: "Define brand voice" },
              { tool: "Template Library", action: "Create templates" },
              { tool: "Share with Team", action: "Collaborate" }],

              color: "blue"
            },
            {
              title: "Data-Driven Content",
              steps: [
              { tool: "API Integration", action: "Fetch market trends" },
              { tool: "AI Generator", action: "Generate content" },
              { tool: "External Data", action: "Enrich with insights" },
              { tool: "Export & Use", action: "Download final version" }],

              color: "green"
            },
            {
              title: "Enterprise AI Workflow",
              steps: [
              { tool: "API Config", action: "Connect data sources" },
              { tool: "Workflow Builder", action: "Create automated chain" },
              { tool: "Conditional Logic", action: "Add smart routing" },
              { tool: "Deploy & Monitor", action: "Run on your infrastructure" }],

              color: "slate"
            },
            {
              title: "Team Collaboration",
              steps: [
              { tool: "Create Prompt", action: "Start with template" },
              { tool: "Invite Team", action: "Add collaborators" },
              { tool: "Real-Time Edit", action: "Edit together" },
              { tool: "Version History", action: "Track changes" }],

              color: "orange"
            }].
            map((workflow, idx) =>
            <Card key={idx} className="border-2 border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg bg-${workflow.color}-100 flex items-center justify-center`}>
                      <Zap className={`w-4 h-4 text-${workflow.color}-600`} />
                    </div>
                    {workflow.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {workflow.steps.map((step, stepIdx) =>
                  <div key={stepIdx} className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full bg-${workflow.color}-100 flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <span className={`text-xs font-bold text-${workflow.color}-700`}>
                            {stepIdx + 1}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{step.tool}</p>
                          <p className="text-xs text-gray-600">{step.action}</p>
                        </div>
                      </div>
                  )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-12">

          <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 border-0 shadow-xl">
            <CardContent className="p-8 text-center text-white">
              <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-90" />
              <h3 className="text-2xl sm:text-3xl font-bold mb-3">
                Ready to Start Creating?
              </h3>
              <p className="text-lg mb-6 opacity-90">
                Pick a tool above or start with AI Generator for guided creation
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to={createPageUrl('AIGenerator')}>
                  <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                    <Brain className="w-5 h-5 mr-2" />
                    AI Generator
                  </Button>
                </Link>
                <Link to={createPageUrl('Templates')}>
                  <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10">
                    <FileText className="w-5 h-5 mr-2" />
                    Browse Prompts
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Newsletter Generator Modal */}
      {showNewsletterModal && (
        <NewsletterGeneratorModal 
          onClose={() => setShowNewsletterModal(false)}
          initialData={{}}
        />
      )}
    </div>);

}
