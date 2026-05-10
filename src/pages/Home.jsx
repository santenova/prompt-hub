import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/apis/client";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Check,
  X,
  Zap,
  Users,
  FileText,
  Brain,
  TrendingUp,
  Shield,
  Clock,
  Infinity,
  Star,
  Crown,
  ArrowRight,
  Code,
  MessageSquare,
  Globe,
  Target,
  Rocket,
  Heart,
  ChevronRight,
  Loader2
} from "lucide-react";

const pricingFeatures = {
  free: [
    { feature: "Unlimited prompts & templates", included: true },
    { feature: "Unlimited personas", included: true },
    { feature: "Basic AI generation", included: true },
    { feature: "Template folders & organization", included: true },
    { feature: "Search & filtering", included: true },
    { feature: "Public template sharing", included: true },
    { feature: "Community access", included: true },
    { feature: "Mobile responsive", included: true },
    { feature: "Advanced AI models (GPT-4)", included: false },
    { feature: "Ollama local AI integration", included: false },
    { feature: "Team collaboration", included: false },
    { feature: "Version history & rollback", included: false },
    { feature: "AI refinement & variations", included: false },
    { feature: "Priority support", included: false },
    { feature: "API access", included: false },
    { feature: "Custom branding", included: false },
  ],
  professional: [
    { feature: "Everything in Free, plus:", included: true, highlight: true },
    { feature: "Advanced AI models (GPT-4, Claude)", included: true },
    { feature: "Ollama local AI integration", included: true },
    { feature: "Unlimited AI generations", included: true },
    { feature: "Team collaboration & sharing", included: true },
    { feature: "Complete version history", included: true },
    { feature: "AI prompt refinement", included: true },
    { feature: "AI content variations", included: true },
    { feature: "Team insights & analytics", included: true },
    { feature: "Priority email support", included: true },
    { feature: "Full API access", included: true },
    { feature: "Export & import tools", included: true },
    { feature: "Custom persona voices", included: true },
    { feature: "Advanced search filters", included: true },
    { feature: "No watermarks", included: true },
    { feature: "Early access to new features", included: true },
  ]
};

const useCases = [
  {
    icon: FileText,
    title: "Content Creators",
    description: "Generate blog posts, social media content, and newsletters in minutes",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Code,
    title: "Developers",
    description: "Create technical documentation, code comments, and API descriptions",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: Users,
    title: "Marketing Teams",
    description: "Maintain consistent brand voice across all campaigns and channels",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Rocket,
    title: "Startups",
    description: "Scale content production without scaling your team",
    color: "from-orange-500 to-red-500"
  }
];

const testimonials = [
  {
    quote: "Prompt Hub transformed how we create content. What used to take hours now takes minutes.",
    author: "Sarah Chen",
    role: "Content Director",
    company: "TechStartup Inc.",
    avatar: "👩‍💼"
  },
  {
    quote: "The AI personas are incredible. We finally have consistent brand voice across all our marketing.",
    author: "Marcus Johnson",
    role: "Marketing Manager",
    company: "GrowthCo",
    avatar: "👨‍💻"
  },
  {
    quote: "Best investment we made. The time saved on content creation paid for itself in the first week.",
    author: "Alex Rivera",
    role: "Founder",
    company: "CreativeStudio",
    avatar: "🎨"
  }
];

export default function Home() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await apiClient.auth.me();
        setCurrentUser(user);
      } catch (error) {
        setCurrentUser(null);
      } finally {
        setIsLoadingAuth(false);
      }
    };
    fetchUser();
  }, []);

  const handleCheckout = async (priceId, planName, mode) => {
    if (!currentUser) {
      apiClient.auth.redirectToLogin();
      return;
    }
    setSelectedPlan(planName);
    setIsRedirecting(true);
    try {
      const { data } = await apiClient.functions.invoke('createCheckoutSession', { priceId, mode });
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Failed to create checkout session.');
        setIsRedirecting(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setIsRedirecting(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // No redirect for logged in users. They can see the home page.

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600">
        <div className="absolute inset-0 bg-grid-white/[0.2] bg-[length:20px_20px]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center text-white"
          >
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full mb-8">
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">Modern AI-Powered Content Platform</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Create Professional Content
              <br />
              <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                10x Faster with AI
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-purple-100 max-w-3xl mx-auto mb-10">
              Manage prompts, build personas, and generate high-quality content with the most powerful AI tools in one platform
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                size="lg"
                className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-10 py-7 shadow-2xl"
                onClick={() => apiClient.auth.redirectToLogin()}
              >
                <Sparkles className="w-6 h-6 mr-2" />
                Start Free Forever
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10 text-lg px-10 py-7"
                onClick={() => {
                  const pricing = document.getElementById('pricing');
                  pricing?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Crown className="w-6 h-6 mr-2" />
                View Pro Features
              </Button>
            </div>

            <div className="flex items-center justify-center gap-8 text-sm text-purple-100">
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                Free forever
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                Upgrade anytime
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Social Proof Stats */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: Users, value: "Growing", label: "Community" },
              { icon: FileText, value: "50+", label: "Feature Types" },
              { icon: Star, value: "Beta", label: "Stage" },
              { icon: Zap, value: "Built", label: "with React" }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
              >
                <stat.icon className="w-10 h-10 text-purple-600 mx-auto mb-3" />
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Built for Everyone
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Whether you're creating content, building products, or scaling marketing
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {useCases.map((useCase, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
            >
              <Card className="h-full hover:shadow-xl transition-all border-2 hover:border-purple-300">
                <CardContent className="pt-8 text-center">
                  <div className={`w-16 h-16 bg-gradient-to-r ${useCase.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <useCase.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{useCase.title}</h3>
                  <p className="text-gray-600">{useCase.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Pricing Comparison */}
      <div id="pricing" className="bg-gradient-to-br from-gray-50 to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start free, upgrade when you need advanced features
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="relative border-2 border-gray-200 hover:border-purple-300 transition-all h-full">
                <CardHeader className="text-center pb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-3xl">Free Forever</CardTitle>
                  <CardDescription className="text-lg">Perfect for individuals getting started</CardDescription>
                  <div className="pt-6">
                    <div className="text-5xl font-bold text-gray-900">$0</div>
                    <p className="text-gray-600 mt-2">Forever free</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full mb-8 border-2 border-purple-600 text-purple-600 hover:bg-purple-50 py-6 text-lg"
                    onClick={() => apiClient.auth.redirectToLogin()}
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>

                  <div className="space-y-4">
                    <p className="font-semibold text-gray-900 mb-4">What's included:</p>
                    {pricingFeatures.free.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        {item.included ? (
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={item.included ? "text-gray-700" : "text-gray-400"}>
                          {item.feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Professional Plan */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="relative border-4 border-purple-600 shadow-2xl shadow-purple-500/50 h-full">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-2 text-sm font-bold shadow-lg">
                    <Star className="w-4 h-4 mr-1 fill-current" />
                    MOST POPULAR
                  </Badge>
                </div>
                
                <CardHeader className="text-center pb-8 bg-gradient-to-br from-purple-50 to-indigo-50">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-3xl">Professional</CardTitle>
                  <CardDescription className="text-lg">For serious creators and teams</CardDescription>
                  <div className="pt-6">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-5xl font-bold text-gray-900">€45</span>
                      <span className="text-gray-600">/month</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">or $290/year (save 17%)</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    size="lg"
                    className="w-full mb-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 py-6 text-lg shadow-lg shadow-purple-500/30"
                    onClick={() => handleCheckout('price_1S5qhqCg5PV9scPAVgXvaR6L', 'Professional', 'subscription')}
                    disabled={isRedirecting && selectedPlan === 'Professional'}
                  >
                    {isRedirecting && selectedPlan === 'Professional' ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Redirecting...
                        </>
                      ) : (
                        <>
                          <Crown className="w-5 h-5 mr-2" />
                          Start 14-Day Free Trial
                        </>
                      )
                    }
                  </Button>

                  <div className="space-y-4">
                    {pricingFeatures.professional.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${item.highlight ? 'text-purple-600' : 'text-green-600'}`} />
                        <span className={`${item.highlight ? 'font-semibold text-purple-900' : 'text-gray-700'}`}>
                          {item.feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-8 border-t border-purple-100">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                      <Shield className="w-4 h-4 text-green-600" />
                      14-day free trial • Cancel anytime • No credit card required
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Enterprise */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 max-w-4xl mx-auto"
          >
            <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white border-0">
              <CardContent className="py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-bold">Enterprise Plan</h3>
                    </div>
                    <p className="text-gray-300 mb-4">
                      Custom solutions for large teams and organizations
                    </p>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-400" />
                        Unlimited team members
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-400" />
                        SSO & advanced security
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-400" />
                        Dedicated account manager
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-400" />
                        Custom integrations & training
                      </li>
                    </ul>
                  </div>
                  <div className="text-center md:text-right">
                    <p className="text-4xl font-bold mb-4">Custom Pricing</p>
                    <Button
                      size="lg"
                      variant="secondary"
                      className="bg-white text-gray-900 hover:bg-gray-100"
                    >
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Contact Sales
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Key Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Everything You Need to Create Better Content
          </h2>
          <p className="text-xl text-gray-600">
            Powerful features designed for professional results
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: Brain,
              title: "AI-Powered Generation",
              description: "Create prompts, personas, and content with advanced AI that learns your style",
              color: "from-purple-500 to-indigo-500"
            },
            {
              icon: Zap,
              title: "Ollama Integration",
              description: "Test locally with your own AI models - no API costs, complete privacy",
              color: "from-blue-500 to-cyan-500",
              badge: "Pro"
            },
            {
              icon: Users,
              title: "Team Collaboration",
              description: "Work together in real-time with version control and insights",
              color: "from-green-500 to-emerald-500",
              badge: "Pro"
            },
            {
              icon: Target,
              title: "Smart Organization",
              description: "Folders, tags, search, and AI-powered suggestions keep you organized",
              color: "from-pink-500 to-purple-500"
            },
            {
              icon: TrendingUp,
              title: "Analytics & Insights",
              description: "Track usage, measure performance, and optimize with AI recommendations",
              color: "from-orange-500 to-red-500",
              badge: "Pro"
            },
            {
              icon: Code,
              title: "Full API Access",
              description: "Integrate with your workflow, automate tasks, build custom solutions",
              color: "from-indigo-500 to-blue-500",
              badge: "Pro"
            }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + idx * 0.1 }}
            >
              <Card className="h-full hover:shadow-xl transition-all">
                <CardContent className="pt-8">
                  <div className="relative">
                    <div className={`w-14 h-14 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    {feature.badge && (
                      <Badge className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-indigo-600">
                        <Crown className="w-3 h-3 mr-1" />
                        {feature.badge}
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Loved by Creators Worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See what our users are saying
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
              >
                <Card className="h-full bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
                  <CardContent className="pt-8">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-700 italic mb-6 text-lg">
                      "{testimonial.quote}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{testimonial.avatar}</div>
                      <div>
                        <p className="font-semibold text-gray-900">{testimonial.author}</p>
                        <p className="text-sm text-gray-600">{testimonial.role}</p>
                        <p className="text-sm text-gray-500">{testimonial.company}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Detailed Feature Comparison
          </h2>
          <p className="text-xl text-gray-600">
            See exactly what you get with each plan
          </p>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <tr>
                  <th className="text-left p-6 font-semibold text-lg">Feature</th>
                  <th className="text-center p-6 font-semibold text-lg">Free</th>
                  <th className="text-center p-6 font-semibold text-lg">
                    <div className="flex items-center justify-center gap-2">
                      <Crown className="w-5 h-5" />
                      Professional
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  { category: "Core Features", features: [
                    { name: "Prompts & Templates", free: "Unlimited", pro: "Unlimited" },
                    { name: "Personas", free: "Unlimited", pro: "Unlimited" },
                    { name: "Folders & Organization", free: true, pro: true },
                    { name: "Search & Filters", free: "Basic", pro: "Advanced" },
                  ]},
                  { category: "AI Features", features: [
                    { name: "AI Generation", free: "10/month", pro: "Unlimited" },
                    { name: "AI Models", free: "GPT-3.5", pro: "GPT-4, Claude, Custom" },
                    { name: "Ollama Integration", free: false, pro: true },
                    { name: "AI Refinement", free: false, pro: true },
                    { name: "AI Variations", free: false, pro: true },
                  ]},
                  { category: "Collaboration", features: [
                    { name: "Public Sharing", free: true, pro: true },
                    { name: "Team Sharing", free: false, pro: true },
                    { name: "Real-time Editing", free: false, pro: true },
                    { name: "Comments & Feedback", free: false, pro: true },
                    { name: "Version History", free: false, pro: "Complete" },
                  ]},
                  { category: "Advanced", features: [
                    { name: "API Access", free: false, pro: true },
                    { name: "Analytics Dashboard", free: false, pro: true },
                    { name: "Export/Import", free: "Basic", pro: "Advanced" },
                    { name: "Custom Branding", free: false, pro: true },
                    { name: "Priority Support", free: false, pro: true },
                  ]}
                ].map((category, catIdx) => (
                  <React.Fragment key={catIdx}>
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="p-4 font-bold text-gray-900 text-lg">
                        {category.category}
                      </td>
                    </tr>
                    {category.features.map((feature, featIdx) => (
                      <tr key={featIdx} className="hover:bg-purple-50 transition-colors">
                        <td className="p-4 text-gray-700">{feature.name}</td>
                        <td className="p-4 text-center">
                          {typeof feature.free === 'boolean' ? (
                            feature.free ? (
                              <Check className="w-5 h-5 text-green-600 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-gray-300 mx-auto" />
                            )
                          ) : (
                            <span className="text-gray-700">{feature.free}</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {typeof feature.pro === 'boolean' ? (
                            feature.pro ? (
                              <Check className="w-5 h-5 text-purple-600 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-gray-300 mx-auto" />
                            )
                          ) : (
                            <span className="text-purple-900 font-semibold">{feature.pro}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* FAQ */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Can I really use it for free forever?",
                a: "Yes! Our free plan includes unlimited prompts, personas, and core features. You can create and manage as much content as you want, forever."
              },
              {
                q: "What happens after my 14-day trial?",
                a: "If you don't upgrade, you'll automatically move to the free plan. No credit card required for trial, so you'll never be charged unless you choose to upgrade."
              },
              {
                q: "Can I switch between plans?",
                a: "Absolutely! Upgrade or downgrade anytime from your settings. Changes take effect immediately, and we'll prorate any charges."
              },
              {
                q: "What AI models do you support?",
                a: "Free users get GPT-3.5. Professional users get access to GPT-4, Claude, and Ollama integration for local AI models. Enterprise gets custom models."
              },
              {
                q: "Is my data secure?",
                a: "Yes! All data is encrypted, stored securely, and backed up regularly. We never share your prompts or personas with anyone. You own your data."
              },
              {
                q: "Do you offer refunds?",
                a: "Yes! If you're not satisfied within the first 30 days, we'll give you a full refund, no questions asked."
              }
            ].map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + idx * 0.05 }}
              >
                <Card className="hover:shadow-md transition-all">
                  <CardContent className="pt-6">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{faq.q}</h3>
                    <p className="text-gray-600">{faq.a}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Sparkles className="w-20 h-20 mx-auto mb-6 animate-pulse" />
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Start Creating Better Content Today
            </h2>
            <p className="text-2xl text-purple-100 mb-8">
              Join creators building with modern AI tools and open technologies
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-12 py-7 shadow-2xl"
                onClick={() => apiClient.auth.redirectToLogin()}
              >
                <Sparkles className="w-6 h-6 mr-2" />
                Get Started Free
              </Button>
              <Link to={createPageUrl('ContentExamples')}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 text-lg px-12 py-7"
                >
                  <FileText className="w-6 h-6 mr-2" />
                  See Examples
                </Button>
              </Link>
            </div>
            <p className="text-sm text-purple-100 mt-6">
              ✨ No credit card • Free forever • Upgrade anytime
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
