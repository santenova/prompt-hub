import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Blog() {
  const posts = [
    {
      id: 1,
      title: 'Getting Started with Prompt Hub',
      description: 'Learn the basics of creating prompts, personas, and templates to supercharge your content creation workflow.',
      category: 'Guide',
      author: 'Sarah Chen',
      date: 'Jan 15, 2026',
      readTime: '5 min read',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 2,
      title: 'Mastering AI Personas',
      description: 'Discover how to create effective AI personas that maintain consistent voice and style across all your content.',
      category: 'Tutorial',
      author: 'Marcus Johnson',
      date: 'Jan 12, 2026',
      readTime: '8 min read',
      color: 'from-purple-500 to-indigo-500'
    },
    {
      id: 3,
      title: '10 Content Ideas You Can Generate Today',
      description: 'Explore practical use cases and examples of content you can create instantly with Prompt Hub.',
      category: 'Ideas',
      author: 'Alex Rivera',
      date: 'Jan 8, 2026',
      readTime: '6 min read',
      color: 'from-pink-500 to-rose-500'
    },
    {
      id: 4,
      title: 'Advanced Template Building',
      description: 'Take your template game to the next level with dynamic placeholders and conditional logic.',
      category: 'Advanced',
      author: 'Sam Taylor',
      date: 'Jan 5, 2026',
      readTime: '10 min read',
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 5,
      title: 'Collaborating with Your Team',
      description: 'Best practices for sharing templates, personas, and collaborating on content in real-time.',
      category: 'Collaboration',
      author: 'Emma Wilson',
      date: 'Dec 28, 2025',
      readTime: '7 min read',
      color: 'from-orange-500 to-amber-500'
    },
    {
      id: 6,
      title: 'AI Ethics and Responsible Content Creation',
      description: 'Exploring the ethical implications of AI-generated content and best practices for responsible use.',
      category: 'Insights',
      author: 'James Mitchell',
      date: 'Dec 25, 2025',
      readTime: '12 min read',
      color: 'from-indigo-500 to-blue-500'
    }
  ];

  const categoryColors = {
    'Guide': 'bg-blue-100 text-blue-800',
    'Tutorial': 'bg-purple-100 text-purple-800',
    'Ideas': 'bg-pink-100 text-pink-800',
    'Advanced': 'bg-green-100 text-green-800',
    'Collaboration': 'bg-orange-100 text-orange-800',
    'Insights': 'bg-indigo-100 text-indigo-800'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tips, guides, and insights to help you get the most out of Prompt Hub
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, idx) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="h-full flex flex-col hover:shadow-xl transition-all group">
                <div className={`h-2 bg-gradient-to-r ${post.color}`}></div>
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={categoryColors[post.category]}>
                      {post.category}
                    </Badge>
                    <span className="text-xs text-gray-500">{post.readTime}</span>
                  </div>
                  <CardTitle className="line-clamp-2 group-hover:text-purple-600 transition-colors">
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-gray-600 line-clamp-3 mb-6">
                    {post.description}
                  </p>
                </CardContent>
                <CardContent className="pt-0 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {post.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {post.date}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" className="w-full justify-start text-purple-600 hover:text-purple-700 group/btn">
                    Read More
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}