import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Zap, 
  Users, 
  FileText, 
  Brain, 
  Globe, 
  Target, 
  TrendingUp,
  Shield,
  Clock,
  Star,
  Check,
  ArrowRight,
  Mic,
  Code,
  Workflow
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function About() {
  const features = [
    {
      icon: FileText,
      title: 'Smart Templates',
      description: 'Pre-built, customizable templates with dynamic placeholders. Auto-map project fields and validate data.',
      color: 'from-purple-500 to-indigo-500'
    },
    {
      icon: Users,
      title: 'AI Personas',
      description: 'Create and manage AI personas that embody specific writing styles, tones, and expertise areas.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Brain,
      title: 'Project Management',
      description: 'Organize content projects with AI-powered categorization, task assignment, and placeholder mapping.',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      icon: Mic,
      title: 'Voice-to-Prompt',
      description: 'Transform voice recordings into structured prompts with AI-powered transcription and enhancement.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Sparkles,
      title: 'AI Content Generation',
      description: 'Generate blog posts, social media content, marketing copy, and more with advanced AI models.',
      color: 'from-pink-500 to-rose-500'
    },
    {
      icon: Workflow,
      title: 'Intelligent Workflows',
      description: 'Chain multiple AI operations together. Auto-categorize projects and suggest optimal task assignments.',
      color: 'from-orange-500 to-amber-500'
    }
  ];

  const benefits = [
    {
      icon: Clock,
      title: '10x Faster Content Creation',
      description: 'Reduce content creation time from hours to minutes with AI-powered automation.'
    },
    {
      icon: Target,
      title: 'Consistent Quality',
      description: 'Maintain brand voice and quality standards across all your content with personas and templates.'
    },
    {
      icon: TrendingUp,
      title: 'Scale Effortlessly',
      description: 'Generate hundreds of content variations without compromising on quality or creativity.'
    },
    {
      icon: Brain,
      title: 'Intelligent Optimization',
      description: 'Built-in SEO analysis, readability scoring, and content optimization suggestions.'
    },
    {
      icon: Shield,
      title: 'Full Control',
      description: 'Local Ollama support and custom model training give you complete control over your AI.'
    },
    {
      icon: Star,
      title: 'Professional Results',
      description: 'Enterprise-grade content that rivals human-written copy in quality and engagement.'
    }
  ];

  const useCases = [
    { icon: '📝', title: 'Content Marketers', description: 'Create blog posts, articles, and thought leadership content at scale' },
    { icon: '💼', title: 'Business Owners', description: 'Generate marketing materials, product descriptions, and sales copy' },
    { icon: '📱', title: 'Social Media Managers', description: 'Produce engaging posts, captions, and content calendars' },
    { icon: '✍️', title: 'Copywriters', description: 'Draft, refine, and iterate on ad copy and landing pages' },
    { icon: '🎓', title: 'Educators', description: 'Create lesson plans, study materials, and educational content' },
    { icon: '📊', title: 'Agencies', description: 'Manage multiple client voices and brand guidelines efficiently' }
  ];

  const stats = [
    { value: 'Early', label: 'Stage Platform' },
    { value: 'Growing', label: 'Community' },
    { value: '50+', label: 'Feature Categories' },
    { value: 'Actively', label: 'Developed' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-600">
        <div className="absolute inset-0 bg-grid-white/[0.2] bg-[size:30px_30px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-purple-600 via-transparent to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 mb-6 text-sm px-4 py-2">
                AI-Powered Content Platform
              </Badge>
            </motion.div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-6 text-white drop-shadow-lg">
              Prompt Hub
            </h1>
            <p className="text-xl md:text-2xl text-purple-100 mb-10 max-w-4xl mx-auto leading-relaxed">
              The ultimate AI-powered platform for content creators, marketers, and businesses. 
              Create exceptional content <span className="text-white font-bold">10x faster</span> with intelligent templates, personas, and AI workflows.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to={createPageUrl('Tools')}>
                <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 shadow-2xl text-lg px-8 py-6">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Get Started Free
                </Button>
              </Link>
              <Link to={createPageUrl('Documentation')}>
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6">
                  <FileText className="w-5 h-5 mr-2" />
                  Documentation
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center gap-6 mt-8 text-sm text-purple-100">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                No credit card required
              </span>
              <span>•</span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Free forever plan
              </span>
              <span>•</span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                5-minute setup
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="text-center"
              >
                <p className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </p>
                <p className="text-gray-600 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Overview */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              What is Prompt Hub?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Prompt Hub is a comprehensive AI content platform that combines the power of large language models 
              with intelligent templates, customizable personas, and advanced workflow automation.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
              <CardContent className="p-8">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Intelligent AI Engine</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Powered by state-of-the-art AI models including GPT-4, Claude, and local Ollama models. 
                  Our platform adapts to your needs, learning from your preferences and improving over time.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Multiple AI model support (OpenAI, Anthropic, Ollama)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Custom model training and fine-tuning</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Real-time web data integration</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
              <CardContent className="p-8">
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Workflow className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Advanced Workflows</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Build sophisticated content pipelines that combine multiple AI operations. From ideation 
                  to final draft, automate your entire content creation process.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Visual pipeline builder with drag-and-drop</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Chain multiple AI operations seamlessly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Save and reuse your best workflows</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to create, manage, and optimize your content workflow
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -8 }}
                >
                  <Card className="h-full border-2 hover:shadow-2xl hover:border-purple-300 transition-all duration-300">
                    <CardContent className="p-8">
                      <motion.div 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={`bg-gradient-to-r ${feature.color} w-14 h-14 rounded-xl flex items-center justify-center mb-5 shadow-lg`}
                      >
                        <Icon className="w-7 h-7 text-white" />
                      </motion.div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose Prompt Hub?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transform your content creation process with measurable results
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="flex gap-4 p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-purple-400 hover:shadow-lg transition-all"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{benefit.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Built for Every Creator
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Whether you're a solo creator or part of a large team, Prompt Hub adapts to your workflow
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((useCase, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="h-full border-2 border-indigo-200 hover:shadow-lg transition-all bg-white">
                  <CardContent className="p-6 text-center">
                    <div className="text-5xl mb-4">{useCase.icon}</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{useCase.title}</h3>
                    <p className="text-gray-600">{useCase.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Built with Cutting-Edge Technology
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Leveraging the best AI models and modern web technologies
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Code className="w-8 h-8 text-blue-600" />
                  <h3 className="text-2xl font-bold text-gray-900">AI Models</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">OpenAI GPT-4, GPT-3.5</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Anthropic Claude 3</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Local Ollama Models (Llama 2, Mistral, etc.)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Google Gemini</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Zap className="w-8 h-8 text-purple-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Platform Features</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Real-time collaboration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Version control & history</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Vector database for knowledge management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Advanced analytics & insights</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="relative py-24 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.2] bg-[size:30px_30px]"></div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Sparkles className="w-16 h-16 mx-auto mb-6 text-white animate-pulse" />
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6 drop-shadow-lg">
              Ready to Transform Your<br />Content Creation?
            </h2>
            <p className="text-xl sm:text-2xl text-purple-100 mb-10 max-w-3xl mx-auto leading-relaxed">
              Join thousands of creators, marketers, and businesses using Prompt Hub to create exceptional content faster.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to={createPageUrl('Tools')}>
                <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 shadow-2xl text-lg px-10 py-6 font-semibold">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Creating Now
                </Button>
              </Link>
              <Link to={createPageUrl('Documentation')}>
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 text-lg px-10 py-6">
                  Learn More
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}