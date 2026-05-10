import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { apiClient } from '@/apis/client';
import {
  BookOpen,
  Search,
  Sparkles,
  Users,
  Zap,
  FileText,
  Settings,
  Share2,
  ChevronRight,
  Code,
  Lightbulb,
  Target,
  CheckCircle2,
  AlertCircle,
  Info,
  Layers,
  FolderOpen,
  Star,
  Brain,
  MessageSquare,
  Wand2,
  TrendingUp,
  Shield,
  Clock
} from 'lucide-react';

const documentationSections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Sparkles,
    color: 'from-purple-500 to-indigo-500',
    articles: [
      {
        title: 'Welcome to Prompt Hub',
        content: `Prompt Hub is your AI-powered workspace for creating, managing, organizing prompts, personas, and projects. Whether you're a content creator, developer, or business professional, Prompt Hub helps you harness the power of AI efficiently with advanced project management and AI-powered insights.`,
        tags: ['beginner', 'intro'],
        time: '2 min'
      },
      {
        title: 'Creating Your First Project',
        content: `Projects help you organize all your content creation work:

1. Navigate to the Projects page
2. Click "Create Project"
3. Add project details:
   - Project name and description
   - Target audience and tone
   - Associated personas and templates
4. Use AI to auto-categorize and get task assignments
5. Link templates and track placeholder mappings
6. Monitor content generation progress

Projects integrate with your templates and personas for seamless workflow!`,
        tags: ['beginner', 'projects'],
        time: '4 min'
      },
      {
       title: 'Creating Your First Template',
       content: `1. Click the "Create" button on the Templates (Prompts) page
      2. Enter a title and description for your template
      3. Add your template content with dynamic placeholders like {{topic}} or {{audience}}
      4. Define placeholder types and validation rules
      5. Organize with categories, tags, and folders
      6. Link to projects for automatic placeholder mapping
      7. Save and start using your template!

      Tip: Use the AI Generate feature for instant template creation with smart placeholders.`,
       tags: ['beginner', 'templates'],
       time: '4 min'
      },
      {
        title: 'Building Your First Persona',
        content: `Personas help define consistent voice and style for your content:

1. Navigate to the Personas Library
2. Click "AI Generate" or "Create" manually
3. Define key attributes:
   - Name and description
   - Category and tone
   - Expertise areas
   - Communication style
   - Voice profile details

4. Add example use cases
5. Save and use across your prompts

AI-powered generation creates comprehensive personas in seconds!`,
        tags: ['beginner', 'personas'],
        time: '4 min'
      }
    ]
  },
  {
    id: 'prompts-guide',
    title: 'Prompts Guide',
    icon: FileText,
    color: 'from-blue-500 to-cyan-500',
    articles: [
      {
        title: 'Understanding Prompts',
        content: `Prompts are reusable templates for AI interactions. They can include:

• Dynamic placeholders: {topic}, {style}, {length}
• Instructions and context
• Expected output format
• Examples and constraints

Good prompts are:
✓ Clear and specific
✓ Well-structured with placeholders
✓ Include context and constraints
✓ Easy to reuse and modify`,
        tags: ['prompts', 'basics'],
        time: '5 min'
      },
      {
        title: 'AI Prompt Generation',
        content: `Let AI create professional prompts for you:

1. Click "AI Generate" on the Prompts page
2. Describe what you need (e.g., "blog post introduction")
3. AI analyzes and generates:
   - Optimized structure
   - Smart placeholders
   - Category suggestions
   - Best practices included

4. Review and customize
5. Save to your library

The AI learns from industry best practices to create effective prompts.`,
        tags: ['prompts', 'ai', 'advanced'],
        time: '4 min'
      },
      {
        title: 'Organizing Prompts',
        content: `Keep your workspace organized:

Folders:
• Group related prompts
• Create project-specific collections
• Nest folders for complex structures

Tags:
• Add multiple tags per prompt
• Search by tags using #tagname
• Create custom tag systems

Categories:
• Predefined categories for quick filtering
• Business, Creative, Technical, etc.

Favorites:
• Star your most-used prompts
• Quick access from favorites filter`,
        tags: ['prompts', 'organization'],
        time: '3 min'
      },
      {
        title: 'Prompt Refinement',
        content: `Use AI to improve existing prompts:

Quick Refine:
• Click "Refine" on any prompt card
• AI suggests improvements for clarity, detail, and structure
• Preview changes before applying

Variations:
• Generate multiple versions
• Test different approaches
• Find what works best

Version History:
• Track all changes
• Compare versions
• Revert when needed`,
        tags: ['prompts', 'ai', 'optimization'],
        time: '4 min'
      },
      {
        title: 'Sharing & Collaboration',
        content: `Share your prompts with others:

Public Sharing:
• Make prompts discoverable
• Share via link
• Others can copy and adapt

Private Sharing:
• Share with specific users
• Control access levels
• Track usage

Collaboration:
• Real-time editing
• Comments and feedback
• Team insights with AI analysis`,
        tags: ['prompts', 'sharing', 'collaboration'],
        time: '5 min'
      }
    ]
  },
  {
    id: 'personas-guide',
    title: 'Personas Guide',
    icon: Users,
    color: 'from-indigo-500 to-purple-500',
    articles: [
      {
        title: 'What Are Personas?',
        content: `Personas define the "who" behind your content:

Core Elements:
• Identity (name, role, expertise)
• Communication style and tone
• Goals and motivations
• Behavioral patterns
• Voice profile

Why Use Personas?
✓ Consistent brand voice
✓ Targeted messaging
✓ Better audience connection
✓ Scalable content creation
✓ Team alignment`,
        tags: ['personas', 'basics'],
        time: '4 min'
      },
      {
        title: 'AI Persona Generation',
        content: `Create detailed personas instantly:

1. Click "AI Generate" on Personas page
2. Provide a brief description
3. AI generates:
   - Demographics & psychographics
   - Goals and pain points
   - Communication preferences
   - Behavioral insights
   - Complete voice profile

4. Review and refine
5. Save to your library

AI creates multi-dimensional personas in under 30 seconds.`,
        tags: ['personas', 'ai', 'creation'],
        time: '3 min'
      },
      {
        title: 'Voice Profiles',
        content: `Define how your persona communicates:

Elements:
• Personality summary
• Preferred vocabulary
• Sentence patterns
• Signature phrases
• Style traits
• Tone recommendations

Do's and Don'ts:
• Create clear guidelines
• Specific examples
• Common mistakes to avoid
• Edge case handling

Voice profiles ensure consistent, authentic communication.`,
        tags: ['personas', 'voice', 'advanced'],
        time: '6 min'
      },
      {
        title: 'Using Personas Effectively',
        content: `Get the most from your personas:

Content Creation:
• Select persona before generating
• AI adapts style automatically
• Maintain voice consistency

Testing:
• Use example prompts
• Generate sample content
• Refine based on results

Collaboration:
• Share personas with team
• Central source of truth
• Consistent messaging across channels

Analytics:
• Track usage
• Measure effectiveness
• Iterate and improve`,
        tags: ['personas', 'best-practices'],
        time: '5 min'
      },
      {
        title: 'Persona Families',
        content: `Group related personas:

What Are Families?
• Collections of related personas
• Shared attributes or goals
• Different perspectives on same topic

Use Cases:
• Target audience segments
• Brand voice variations
• Product lines
• Regional adaptations

Benefits:
✓ Better organization
✓ Easy comparison
✓ Coordinated strategy
✓ Comprehensive coverage`,
        tags: ['personas', 'organization', 'advanced'],
        time: '4 min'
      }
    ]
  },
  {
    id: 'ai-features',
    title: 'AI Features',
    icon: Brain,
    color: 'from-pink-500 to-purple-500',
    articles: [
      {
        title: 'AI Content Generator',
        content: `Generate high-quality content with AI:

Features:
• Multi-format support (blog, email, social)
• Persona-driven voice adaptation
• Template-based structure
• Real-time generation
• Customizable parameters

How It Works:
1. Select content type
2. Choose persona (optional)
3. Input topic/requirements
4. AI generates tailored content
5. Edit and export

Supports: blog posts, emails, social media, scripts, and more.`,
        tags: ['ai', 'content', 'generation'],
        time: '4 min'
      },
      {
        title: 'AI Prompt Analyzer',
        content: `Get intelligent feedback on your prompts:

Analysis Includes:
• Clarity score
• Specificity rating
• Structure evaluation
• Missing elements
• Improvement suggestions
• Best practice compliance

Real-Time Suggestions:
• As-you-type recommendations
• Quick fixes
• Alternative phrasings
• Placeholder optimization

Use the analyzer to create better prompts faster.`,
        tags: ['ai', 'prompts', 'analysis'],
        time: '5 min'
      },
      {
        title: 'Smart Tagging',
        content: `AI-powered automatic tagging:

Auto-Suggest:
• Analyzes prompt content
• Suggests relevant tags
• Learns from your patterns
• Industry-standard tags

Benefits:
✓ Save time
✓ Better organization
✓ Improved discoverability
✓ Consistent taxonomy

Manual Override:
• Add custom tags anytime
• Remove suggestions
• Create your own system`,
        tags: ['ai', 'organization', 'tags'],
        time: '3 min'
      },
      {
        title: 'Team Insights',
        content: `AI-driven analytics for teams:

Insights Provided:
• Usage patterns
• Popular prompts/personas
• Collaboration metrics
• Performance analytics
• Optimization opportunities

Recommendations:
• What's working well
• Areas for improvement
• Trending topics
• Team preferences

Make data-driven decisions about your content strategy.`,
        tags: ['ai', 'analytics', 'teams'],
        time: '5 min'
      }
    ]
  },
  {
    id: 'organization',
    title: 'Organization & Search',
    icon: Layers,
    color: 'from-green-500 to-emerald-500',
    articles: [
      {
        title: 'Folder System',
        content: `Organize prompts with folders:

Creating Folders:
• Click folder manager
• Name your folder
• Drag-and-drop prompts
• Nest folders for hierarchy

Best Practices:
• Project-based structure
• Client organizations
• Content type grouping
• Seasonal campaigns

Operations:
• Rename folders
• Move prompts between folders
• Delete empty folders
• Folder tree view`,
        tags: ['organization', 'folders'],
        time: '4 min'
      },
      {
        title: 'Advanced Search',
        content: `Find anything quickly:

Search Syntax:
• Regular text: searches all fields
• #tag: search by tag
• @creator: search by creator
• Quotes: exact phrase match

Filters:
• Category filtering
• Date range
• Creator
• Tag combinations
• Status (favorite, public, etc.)

Tips:
✓ Combine multiple filters
✓ Save common searches
✓ Use keyboard shortcuts
✓ Search in specific folders`,
        tags: ['search', 'organization'],
        time: '3 min'
      },
      {
        title: 'Tags & Categories',
        content: `Flexible organization:

Tags:
• Multiple per item
• Custom creation
• Auto-suggestions
• Search by #tagname

Categories:
• Predefined options
• Single category per item
• Quick filtering
• Visual indicators

Strategy:
• Tags for specific attributes
• Categories for broad classification
• Combine for powerful filtering
• Maintain consistency`,
        tags: ['organization', 'tags', 'categories'],
        time: '4 min'
      }
    ]
  },
  {
    id: 'best-practices',
    title: 'Best Practices',
    icon: Target,
    color: 'from-orange-500 to-red-500',
    articles: [
      {
        title: 'Writing Effective Prompts',
        content: `Create prompts that deliver results:

Structure:
1. Clear objective
2. Context and background
3. Specific requirements
4. Output format
5. Constraints and examples

Placeholders:
• Use descriptive names: {target_audience}
• Provide defaults: {tone:professional}
• Group related: {content.topic}, {content.length}

Clarity:
✓ Be specific, not vague
✓ Include examples
✓ Define terms
✓ Set expectations
✓ Test thoroughly`,
        tags: ['best-practices', 'prompts', 'writing'],
        time: '6 min'
      },
      {
        title: 'Persona Development',
        content: `Build authentic personas:

Research:
• Study real audience data
• Interview stakeholders
• Analyze behavior patterns
• Review existing content

Depth:
• Go beyond demographics
• Include motivations
• Define pain points
• Map user journeys

Testing:
• Generate sample content
• Get team feedback
• A/B test variations
• Iterate based on results

Documentation:
• Clear guidelines
• Specific examples
• Edge cases covered
• Regular updates`,
        tags: ['best-practices', 'personas', 'development'],
        time: '7 min'
      },
      {
        title: 'Team Collaboration',
        content: `Work effectively together:

Setup:
• Define roles and permissions
• Create shared folders
• Establish naming conventions
• Set review processes

Communication:
• Use comments feature
• Request reviews
• Share insights
• Document decisions

Quality Control:
• Peer review prompts
• Test before sharing
• Version control
• Regular audits

Knowledge Sharing:
• Document learnings
• Share best performers
• Train new members
• Build prompt library`,
        tags: ['best-practices', 'collaboration', 'teams'],
        time: '6 min'
      },
      {
        title: 'Optimization Tips',
        content: `Maximize your efficiency:

Workflow:
✓ Start with AI generation
✓ Customize to your needs
✓ Save frequently used items
✓ Create templates
✓ Use keyboard shortcuts

Organization:
✓ Regular cleanup
✓ Archive old content
✓ Consistent naming
✓ Tag everything
✓ Review analytics

Quality:
✓ Test prompts thoroughly
✓ Gather feedback
✓ Iterate based on results
✓ Keep examples updated
✓ Document learnings

Automation:
✓ Use AI refinement
✓ Bulk operations
✓ Import/export data
✓ Template reuse`,
        tags: ['best-practices', 'optimization', 'tips'],
        time: '5 min'
      }
    ]
  },
  {
    id: 'enterprise-control',
    title: 'Enterprise AI Control',
    icon: Shield,
    color: 'from-slate-500 to-gray-600',
    articles: [
      {
        title: 'Taking Control of Your AI',
        content: `Enterprise-grade AI management for businesses:

Why Control Matters:
• Data sovereignty and privacy
• Cost predictability
• Custom model deployment
• Regulatory compliance
• Infrastructure ownership

Capabilities:
✓ Run AI on your infrastructure
✓ Connect proprietary APIs
✓ Build automated workflows
✓ Maintain data control
✓ Custom fine-tuning

Key Features:
• Local Ollama integration
• API configuration manager
• Workflow automation
• Secure credential storage
• Usage monitoring

Perfect for companies that need full control over their AI operations.`,
        tags: ['enterprise', 'ai-control', 'infrastructure'],
        time: '6 min'
      },
      {
        title: 'API Configuration Manager',
        content: `Connect external APIs to your workflows:

Setup Process:
1. Go to Settings > API Config
2. Add new API configuration
3. Set base URL and authentication
4. Configure endpoints
5. Use in workflow chains

Authentication Types:
• API Key (header-based)
• Bearer Token
• Basic Auth
• Custom headers

Security:
✓ Encrypted credential storage
✓ Per-user isolation
✓ Audit logging
✓ Access control

Use Cases:
• CRM data integration
• Market data APIs
• Internal systems
• Third-party services

API responses can feed into AI steps for intelligent processing.`,
        tags: ['enterprise', 'api', 'integration'],
        time: '7 min'
      },
      {
        title: 'Workflow Automation',
        content: `Build complex AI workflows:

Workflow Components:
• AI prompt steps
• API call steps
• Conditional branching
• Error handling
• Variable passing

Advanced Features:
• If/then logic
• Retry mechanisms
• Fallback responses
• Skip on error
• Per-step parameters

Example Workflow:
1. API: Fetch customer data
2. AI: Analyze sentiment
3. Condition: If negative → escalation path
4. AI: Generate response
5. API: Update CRM

Benefits:
✓ Fully automated
✓ Intelligent routing
✓ Fault tolerance
✓ Reusable templates
✓ Team collaboration`,
        tags: ['enterprise', 'workflows', 'automation'],
        time: '8 min'
      },
      {
        title: 'Local AI Deployment',
        content: `Run AI models on your infrastructure:

Ollama Integration:
• Install Ollama locally
• Download open-source models
• Configure endpoints
• Test without API costs
• Complete data privacy

Popular Models:
• Llama 2 (Meta)
• Mistral 7B
• CodeLlama
• Phi-2 (Microsoft)
• Custom fine-tuned models

Enterprise Benefits:
✓ Zero API costs
✓ Data never leaves premises
✓ Unlimited usage
✓ Custom models
✓ Compliance-friendly

Configuration:
Settings > Ollama > Add Endpoint
Test with templates and personas
Monitor performance metrics`,
        tags: ['enterprise', 'ollama', 'local-ai'],
        time: '10 min'
      }
    ]
  },
  {
    id: 'integrations',
    title: 'Integrations & API',
    icon: Code,
    color: 'from-blue-500 to-indigo-500',
    articles: [
      {
        title: 'API Overview',
        content: `Connect Prompt Hub to your workflows:

Capabilities:
• Create/read/update/delete prompts
• Manage personas
• Generate content via API
• Access analytics
• Bulk operations

Authentication:
• API key-based
• Secure token management
• Rate limiting
• Usage tracking

Use Cases:
✓ Automate content creation
✓ Integrate with CMS
✓ Custom workflows
✓ Data synchronization
✓ Third-party tools

Documentation: Full API docs available in API Documentation page.`,
        tags: ['api', 'integrations', 'advanced'],
        time: '4 min'
      },
      {
        title: 'Import & Export',
        content: `Move data in and out easily:

Export:
• JSON format
• All or filtered items
• Include metadata
• Backup creation

Import:
• Bulk persona/prompt import
• Validation before import
• Duplicate detection
• Error reporting

Use Cases:
✓ Data backup
✓ Team migrations
✓ Cross-platform sync
✓ Version control integration`,
        tags: ['integrations', 'data', 'import-export'],
        time: '3 min'
      },
      {
        title: 'Webhooks',
        content: `Get notified of events:

Available Events:
• Prompt created/updated
• Persona modified
• Comment added
• Share activity
• Usage milestones

Configuration:
1. Set webhook URL
2. Choose events
3. Configure payload
4. Test connection
5. Enable

Benefits:
✓ Real-time updates
✓ Workflow automation
✓ Custom integrations
✓ Event tracking`,
        tags: ['integrations', 'webhooks', 'advanced'],
        time: '4 min'
      }
    ]
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: AlertCircle,
    color: 'from-red-500 to-pink-500',
    articles: [
      {
        title: 'Common Issues',
        content: `Quick fixes for common problems:

AI Generation Slow:
• Check internet connection
• Try smaller requests
• Use off-peak hours
• Clear browser cache

Prompts Not Saving:
• Verify all required fields
• Check character limits
• Ensure stable connection
• Try refreshing page

Search Not Working:
• Check spelling
• Remove special characters
• Clear search filters
• Rebuild search index

Sharing Issues:
• Verify permissions
• Check email addresses
• Test share link
• Review privacy settings`,
        tags: ['troubleshooting', 'issues'],
        time: '4 min'
      },
      {
        title: 'Performance Tips',
        content: `Optimize your experience:

Speed Up:
✓ Use Chrome or Edge
✓ Clear cache regularly
✓ Disable browser extensions
✓ Close unused tabs
✓ Update browser

Reduce Load Times:
✓ Archive old content
✓ Limit loaded items
✓ Use pagination
✓ Optimize images
✓ Batch operations

Best Practices:
• Regular maintenance
• Monitor storage usage
• Update regularly
• Report bugs promptly`,
        tags: ['troubleshooting', 'performance'],
        time: '3 min'
      }
    ]
  },
  {
    id: 'faq',
    title: 'FAQ',
    icon: MessageSquare,
    color: 'from-purple-500 to-pink-500',
    articles: [
      {
        title: 'Frequently Asked Questions',
        content: `Quick answers to common questions:

Q: Is my data secure?
A: Yes! All data is encrypted at rest and in transit. We follow industry best practices for security and privacy.

Q: Can I use this offline?
A: Some features work offline, but AI generation requires internet connection.

Q: How many prompts can I create?
A: Unlimited! Your plan may affect AI generation usage.

Q: Can I export my data?
A: Yes, export to JSON anytime from the settings.

Q: Do you offer team plans?
A: Yes! Contact us for team pricing and features.

Q: How does AI generation work?
A: We use advanced language models that have been trained on best practices for prompt engineering and persona development.

Q: Can I cancel anytime?
A: Yes, cancel from account settings. You'll retain access until period ends.

Q: Is there a mobile app?
A: The web app is fully responsive and works great on mobile devices.`,
        tags: ['faq', 'questions'],
        time: '5 min'
      }
    ]
  }
];

export default function Documentation() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState('getting-started');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
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

  // Filter articles based on search
  const filteredSections = searchQuery
    ? documentationSections.map(section => ({
        ...section,
        articles: section.articles.filter(article =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      })).filter(section => section.articles.length > 0)
    : documentationSections;

  const currentSection = documentationSections.find(s => s.id === selectedSection);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Enhanced Hero Section */}
      {!currentUser && (
        <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/[0.2] bg-[size:30px_30px]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-blue-600 via-transparent to-transparent"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
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
                <BookOpen className="w-5 h-5" />
                <span className="text-sm font-semibold">Complete Documentation</span>
              </motion.div>
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extrabold mb-8 drop-shadow-lg">
                Your AI Content<br />Playbook
              </h1>
              <p className="text-xl sm:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed">
                Step-by-step guides, best practices, and expert tips to help you create professional content with AI
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
                <Button
                  size="lg"
                  className="bg-white text-indigo-600 hover:bg-gray-100 text-lg px-10 py-7 shadow-2xl font-semibold"
                  onClick={() => apiClient.auth.redirectToLogin()}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Learning Free
                </Button>
                <Link to={createPageUrl('ContentExamples')}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white/10 text-lg px-10 py-7"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    See Examples
                  </Button>
                </Link>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-blue-100">
                <span className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-current" />
                  4.9/5 rating
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  10,000+ users
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  50+ guides
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Header for logged-in users */}
      {currentUser && (
        <div className="bg-white/80 backdrop-blur-lg border-b border-purple-100 sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-3 rounded-xl">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Documentation</h1>
                    <p className="text-sm text-gray-600">Everything you need to master Prompt Hub</p>
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative max-w-2xl">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base border-gray-200 bg-white shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedArticle ? (
          // Article View
          <div className="max-w-4xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => setSelectedArticle(null)}
              className="mb-6"
            >
              <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
              Back to {currentSection?.title}
            </Button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-2">
                <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-indigo-50">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Clock className="w-4 h-4" />
                    {selectedArticle.time} read
                  </div>
                  <CardTitle className="text-3xl">{selectedArticle.title}</CardTitle>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedArticle.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="prose prose-gray max-w-none">
                    <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                      {selectedArticle.content}
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Was this helpful?
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                          Yes
                        </Button>
                        <Button variant="outline" size="sm">
                          <AlertCircle className="w-4 h-4 mr-2 text-red-600" />
                          No
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        ) : !selectedSection ? (
          // Section Overview - only show when no section selected
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documentationSections.map((section) => {
              const Icon = section.icon;
              return (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card 
                    className="h-full cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-300"
                    onClick={() => setSelectedSection(section.id)}
                  >
                    <CardHeader>
                      <div className={`w-14 h-14 bg-gradient-to-r ${section.color} rounded-xl flex items-center justify-center mb-3`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <CardTitle className="text-xl">{section.title}</CardTitle>
                      <CardDescription>
                        {section.articles.length} {section.articles.length === 1 ? 'article' : 'articles'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {section.articles.slice(0, 3).map((article, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                            <ChevronRight className="w-4 h-4 text-purple-600" />
                            <span className="line-clamp-1">{article.title}</span>
                          </div>
                        ))}
                        {section.articles.length > 3 && (
                          <div className="text-sm text-purple-600 font-medium pt-2">
                            +{section.articles.length - 3} more articles
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          // Articles List - show when section selected or searching
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            {!searchQuery && (
              <div className="lg:col-span-1">
                <Card className="sticky top-32">
                  <CardHeader>
                    <CardTitle className="text-lg">Sections</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-start mb-2"
                      onClick={() => setSelectedSection(null)}
                    >
                      <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                      All Sections
                    </Button>
                    {documentationSections.map((section) => {
                      const Icon = section.icon;
                      return (
                        <Button
                          key={section.id}
                          variant={selectedSection === section.id ? "default" : "ghost"}
                          className={`w-full justify-start ${
                            selectedSection === section.id
                              ? 'bg-purple-600 hover:bg-purple-700'
                              : ''
                          }`}
                          onClick={() => setSelectedSection(section.id)}
                        >
                          <Icon className="w-4 h-4 mr-2" />
                          {section.title}
                        </Button>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Articles List */}
            <div className={searchQuery ? "lg:col-span-4" : "lg:col-span-3"}>
              {filteredSections.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-600">Try adjusting your search query</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {filteredSections
                    .filter(section => searchQuery || section.id === selectedSection)
                    .map((section) => {
                      const Icon = section.icon;
                      return (
                        <div key={section.id}>
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 bg-gradient-to-r ${section.color} rounded-lg flex items-center justify-center`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                          </div>
                          
                          <div className="grid gap-4">
                            {section.articles.map((article, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                              >
                                <Card 
                                  className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500 hover:border-l-purple-600"
                                  onClick={() => setSelectedArticle(article)}
                                >
                                  <CardHeader>
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex-1">
                                        <CardTitle className="text-lg mb-2 group-hover:text-purple-600 transition-colors">
                                          {article.title}
                                        </CardTitle>
                                        <CardDescription className="line-clamp-2">
                                          {article.content.substring(0, 150)}...
                                        </CardDescription>
                                      </div>
                                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                                    </div>
                                    <div className="flex items-center gap-3 mt-3">
                                      <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <Clock className="w-3 h-3" />
                                        {article.time}
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {article.tags.slice(0, 3).map((tag, tagIdx) => (
                                          <Badge key={tagIdx} variant="outline" className="text-xs">
                                            {tag}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </CardHeader>
                                </Card>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced CTA Section for Non-Authenticated Users */}
      {!selectedArticle && !currentUser && (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-16 mt-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <Brain className="w-16 h-16 mx-auto mb-6 animate-pulse" />
              <h2 className="text-3xl sm:text-5xl font-bold mb-6">
                Put This Knowledge Into Action
              </h2>
              <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
                These guides show you everything Prompt Hub can do. Now experience it yourself - completely free.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 max-w-4xl mx-auto">
                {[
                  { 
                    icon: Sparkles, 
                    title: "AI Prompt Generator",
                    desc: "Create professional prompts in seconds",
                    color: "from-yellow-400 to-orange-500"
                  },
                  { 
                    icon: Users, 
                    title: "Custom Personas",
                    desc: "Build unlimited brand voices",
                    color: "from-green-400 to-emerald-500"
                  },
                  { 
                    icon: Code, 
                    title: "API Access",
                    desc: "Integrate with your workflow",
                    color: "from-blue-400 to-cyan-500"
                  }
                ].map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20"
                  >
                    <div className={`w-14 h-14 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                    <p className="text-sm text-purple-100">{feature.desc}</p>
                  </motion.div>
                ))}
              </div>

              <Button
                size="lg"
                className="bg-white text-indigo-600 hover:bg-gray-100 text-lg px-12 py-6 shadow-2xl mb-4"
                onClick={() => apiClient.auth.redirectToLogin()}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Get Started Free - No Credit Card
              </Button>
              <p className="text-purple-100">
                Join 10,000+ content creators already using Prompt Hub ✨
              </p>
            </motion.div>
          </div>
        </div>
      )}

      {/* Help Section - kept for logged-in users */}
      {!selectedArticle && currentUser && (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-12 mt-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Info className="w-12 h-12 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">Still need help?</h2>
            <p className="text-purple-100 mb-6">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button variant="secondary" size="lg">
                <MessageSquare className="w-5 h-5 mr-2" />
                Contact Support
              </Button>
              {/* Added react-router-dom Link */}
              <Link to={createPageUrl('Help')}>
                <Button variant="outline" size="lg" className="text-white border-white hover:bg-white/10">
                  <BookOpen className="w-5 h-5 mr-2" />
                  View Help Center
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
