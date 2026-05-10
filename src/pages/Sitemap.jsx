import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Users,
  Mic,
  Zap,
  FileText,
  Code,
  HelpCircle,
  UserPlus,
  Shield,
  CreditCard,
  Settings,
  Home,
  Sparkles,
  Store,
  TrendingUp,
  MessageSquare,
  Brain,
  Workflow,
  Database,
  FileJson,
  Map,
  FolderOpen,
  Activity,
  Mail,
  Info,
  ScrollText,
  Building,
  TestTube,
  Lock,
  BookMarked,
  Library,
  LogIn
} from "lucide-react";
import { motion } from "framer-motion";

const pageGroups = [
  {
    title: "Core Features",
    description: "Main application features",
    pages: [
      { name: "Projects", icon: FolderOpen, description: "Manage content projects with AI insights" },
      { name: "Templates", icon: BookOpen, description: "Manage and create AI prompts with placeholders" },
      { name: "PersonasLibrary", icon: Users, description: "AI personas and assistants" },
      { name: "VoiceToPrompt", icon: Mic, description: "Voice-to-text chat interface" },
      { name: "Tools", icon: Zap, description: "AI tools and utilities" },
    ]
  },
  {
    title: "Content & Learning",
    description: "Resources and documentation",
    pages: [
      { name: "ContentExamples", icon: FileText, description: "Example prompts and use cases" },
      { name: "Documentation", icon: Code, description: "Complete documentation" },
      { name: "Help", icon: HelpCircle, description: "Get help and support" },
    ]
  },
  {
    title: "Advanced Tools",
    description: "Advanced AI capabilities",
    pages: [
      { name: "AIGenerator", icon: Sparkles, description: "AI content generator" },
      { name: "AIContentGenerator", icon: Brain, description: "Advanced AI content tools" },
      { name: "AdvancedAI", icon: Brain, description: "Advanced AI features" },
      { name: "NotesGenerator", icon: FileText, description: "Generate notes and documents" },
      { name: "ContentLibrary", icon: Library, description: "Content management library" },
      { name: "OllamaManager", icon: Brain, description: "Manage Ollama models" },
      { name: "OllamaSettings", icon: Settings, description: "Configure Ollama settings" },
      { name: "VectorDatabase", icon: Database, description: "Vector search and embeddings" },
      { name: "Pipelines", icon: Workflow, description: "Workflow automation" },
    ]
  },
  {
    title: "Collaboration",
    description: "Team and sharing features",
    pages: [
      { name: "SharedTemplates", icon: UserPlus, description: "Templates shared with you" },
      { name: "SharedTemplate", icon: BookOpen, description: "View shared template" },
      { name: "SharedChat", icon: MessageSquare, description: "Shared voice chat sessions" },
      { name: "TeamWorkspaces", icon: Users, description: "Collaborative team workspaces" },
      { name: "CommunityFeed", icon: MessageSquare, description: "Community activity" },
      { name: "TemplateMarketplace", icon: Store, description: "Browse template marketplace" },
      { name: "AgentMarketplace", icon: Store, description: "AI agent marketplace" },
    ]
  },
  {
    title: "Account & Settings",
    description: "Manage your account",
    pages: [
      { name: "Settings", icon: Settings, description: "Application settings" },
      { name: "Billing", icon: CreditCard, description: "Subscription and billing" },
      { name: "MySubscriptions", icon: CreditCard, description: "Your subscriptions" },
      { name: "Dashboard", icon: TrendingUp, description: "Analytics dashboard" },
      { name: "ActivityLogs", icon: Activity, description: "View activity logs" },
      { name: "MyPrompts", icon: BookMarked, description: "Your saved prompts" },
    ]
  },
  {
    title: "Administration",
    description: "Admin features",
    pages: [
      { name: "AdminDashboard", icon: Shield, description: "Admin control panel" },
      { name: "ConsoleLogger", icon: Code, description: "System console logs" },
    ]
  },
  {
    title: "Analytics & Performance",
    description: "Track and analyze performance",
    pages: [
      { name: "TemplateAnalytics", icon: TrendingUp, description: "Template analytics" },
      { name: "PromptPerformance", icon: TrendingUp, description: "Prompt performance metrics" },
    ]
  },
  {
    title: "Information & Legal",
    description: "About and legal information",
    pages: [
      { name: "Home", icon: Home, description: "Home page" },
      { name: "About", icon: Info, description: "About Prompt Hub" },
      { name: "Blog", icon: FileText, description: "Blog posts and articles" },
      { name: "Contact", icon: Mail, description: "Contact us" },
      { name: "InvestorProposal", icon: FileJson, description: "Investor information" },
      { name: "PrivacyPolicy", icon: Lock, description: "Privacy policy" },
      { name: "TermsOfService", icon: ScrollText, description: "Terms of service" },
    ]
  },
  {
    title: "Developer & Testing",
    description: "Developer tools and testing",
    pages: [
      { name: "APIDocumentation", icon: Code, description: "API documentation" },
      { name: "TestPage", icon: TestTube, description: "Test page" },
      { name: "ManualLogin", icon: LogIn, description: "Manual login page" },
      { name: "NotFound", icon: Map, description: "404 page" },
    ]
  },
  {
    title: "Payment",
    description: "Payment related pages",
    pages: [
      { name: "PaymentSuccess", icon: CreditCard, description: "Payment successful" },
      { name: "PaymentCancel", icon: CreditCard, description: "Payment cancelled" },
    ]
  }
];

export default function Sitemap() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-3 rounded-xl">
              <Map className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Site Map
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Navigate through all available pages and features in Prompt Hub
          </p>
        </motion.div>

        {/* Page Groups */}
        <div className="space-y-8">
          {pageGroups.map((group, groupIdx) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIdx * 0.1 }}
            >
              <Card className="border-2 border-purple-100 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl">{group.title}</CardTitle>
                  <CardDescription>{group.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.pages.map((page) => {
                      const Icon = page.icon;
                      return (
                        <Link key={page.name} to={createPageUrl(page.name)}>
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Card className="h-full border-2 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer">
                              <CardContent className="pt-4">
                                <div className="flex items-start gap-3">
                                  <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-2 rounded-lg">
                                    <Icon className="w-5 h-5 text-purple-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm mb-1 text-gray-900">
                                      {page.name.replace(/([A-Z])/g, ' $1').trim()}
                                    </h3>
                                    <p className="text-xs text-gray-600 line-clamp-2">
                                      {page.description}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}