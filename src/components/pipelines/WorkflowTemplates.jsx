import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Globe, Languages, Repeat, FileText, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const workflowTemplates = [
  {
    id: 'content-repurposing',
    name: 'Content Repurposing Pipeline',
    description: 'Transform long-form content into multiple formats: social posts, email newsletters, and video scripts',
    category: 'Content Creation',
    icon: Repeat,
    color: 'from-purple-500 to-indigo-500',
    steps: [
      {
        id: 1,
        type: 'ai_prompt',
        custom_prompt: 'Analyze this content and extract key points:\n\n{input}',
        output_variable: 'key_points',
        position: { x: 100, y: 50 }
      },
      {
        id: 2,
        type: 'ai_prompt',
        custom_prompt: 'Create 3 Twitter posts from these key points:\n\n{key_points}',
        output_variable: 'twitter_posts',
        position: { x: 100, y: 220 }
      },
      {
        id: 3,
        type: 'ai_prompt',
        custom_prompt: 'Create a LinkedIn post from these key points:\n\n{key_points}',
        output_variable: 'linkedin_post',
        position: { x: 350, y: 220 }
      },
      {
        id: 4,
        type: 'ai_prompt',
        custom_prompt: 'Create an email newsletter section from these key points:\n\n{key_points}',
        output_variable: 'newsletter',
        position: { x: 600, y: 220 }
      }
    ],
    connections: [
      { from_step: 1, to_step: 2, condition: 'default' },
      { from_step: 1, to_step: 3, condition: 'default' },
      { from_step: 1, to_step: 4, condition: 'default' }
    ]
  },
  {
    id: 'multi-language',
    name: 'Multi-Language Content Generator',
    description: 'Generate content and automatically translate it into multiple languages with cultural adaptations',
    category: 'Translation',
    icon: Languages,
    color: 'from-blue-500 to-cyan-500',
    steps: [
      {
        id: 1,
        type: 'ai_prompt',
        custom_prompt: 'Create engaging content about: {topic}\n\nTarget audience: {audience}',
        output_variable: 'original_content',
        position: { x: 100, y: 50 }
      },
      {
        id: 2,
        type: 'ai_prompt',
        custom_prompt: 'Translate this content to Spanish with cultural adaptations:\n\n{original_content}',
        output_variable: 'spanish_content',
        position: { x: 100, y: 220 }
      },
      {
        id: 3,
        type: 'ai_prompt',
        custom_prompt: 'Translate this content to French with cultural adaptations:\n\n{original_content}',
        output_variable: 'french_content',
        position: { x: 350, y: 220 }
      },
      {
        id: 4,
        type: 'ai_prompt',
        custom_prompt: 'Translate this content to German with cultural adaptations:\n\n{original_content}',
        output_variable: 'german_content',
        position: { x: 600, y: 220 }
      }
    ],
    connections: [
      { from_step: 1, to_step: 2, condition: 'default' },
      { from_step: 1, to_step: 3, condition: 'default' },
      { from_step: 1, to_step: 4, condition: 'default' }
    ]
  },
  {
    id: 'seo-content',
    name: 'SEO Content Pipeline',
    description: 'Research keywords, generate optimized content, create meta descriptions, and suggest internal links',
    category: 'Marketing',
    icon: TrendingUp,
    color: 'from-green-500 to-emerald-500',
    steps: [
      {
        id: 1,
        type: 'ai_prompt',
        custom_prompt: 'Generate 10 SEO keywords for: {topic}',
        output_variable: 'keywords',
        position: { x: 100, y: 50 }
      },
      {
        id: 2,
        type: 'ai_prompt',
        custom_prompt: 'Write an SEO-optimized blog post about {topic} using these keywords:\n\n{keywords}\n\nMake it engaging and informative.',
        output_variable: 'blog_content',
        model_params: { temperature: 0.7, max_tokens: 2000 },
        position: { x: 100, y: 220 }
      },
      {
        id: 3,
        type: 'ai_prompt',
        custom_prompt: 'Create an SEO meta description (155 chars max) for this content:\n\n{blog_content}',
        output_variable: 'meta_description',
        position: { x: 100, y: 390 }
      },
      {
        id: 4,
        type: 'ai_prompt',
        custom_prompt: 'Suggest 5 internal link anchor texts based on this content:\n\n{blog_content}',
        output_variable: 'internal_links',
        position: { x: 350, y: 390 }
      }
    ],
    connections: [
      { from_step: 1, to_step: 2, condition: 'default' },
      { from_step: 2, to_step: 3, condition: 'default' },
      { from_step: 2, to_step: 4, condition: 'default' }
    ]
  },
  {
    id: 'content-qa',
    name: 'Content Quality Assurance',
    description: 'Generate content, check for errors, improve readability, and verify fact accuracy with conditional logic',
    category: 'Analysis',
    icon: FileText,
    color: 'from-orange-500 to-amber-500',
    steps: [
      {
        id: 1,
        type: 'ai_prompt',
        custom_prompt: 'Write content about: {topic}',
        output_variable: 'draft_content',
        position: { x: 100, y: 50 }
      },
      {
        id: 2,
        type: 'condition',
        conditional_logic: {
          enabled: true,
          condition_type: 'length_gt',
          condition_value: '100',
          source_variable: 'draft_content',
          on_success_goto: 3,
          on_failure_goto: 6
        },
        output_variable: 'length_check',
        position: { x: 100, y: 220 }
      },
      {
        id: 3,
        type: 'ai_prompt',
        custom_prompt: 'Check this content for grammar and spelling errors:\n\n{draft_content}\n\nReturn: OK or list of errors.',
        output_variable: 'grammar_check',
        position: { x: 100, y: 390 }
      },
      {
        id: 4,
        type: 'ai_prompt',
        custom_prompt: 'Improve readability of this content:\n\n{draft_content}',
        output_variable: 'improved_content',
        position: { x: 350, y: 390 }
      },
      {
        id: 5,
        type: 'ai_prompt',
        custom_prompt: 'Verify factual accuracy and add citations if needed:\n\n{improved_content}',
        output_variable: 'final_content',
        position: { x: 350, y: 560 }
      },
      {
        id: 6,
        type: 'ai_prompt',
        custom_prompt: 'The content is too short. Expand it with more details:\n\n{draft_content}',
        output_variable: 'expanded_content',
        position: { x: 600, y: 390 }
      }
    ],
    connections: [
      { from_step: 1, to_step: 2, condition: 'default' },
      { from_step: 2, to_step: 3, condition: 'success' },
      { from_step: 2, to_step: 6, condition: 'failure' },
      { from_step: 3, to_step: 4, condition: 'default' },
      { from_step: 4, to_step: 5, condition: 'default' }
    ]
  },
  {
    id: 'api-integration',
    name: 'API Data Enrichment',
    description: 'Fetch data from external APIs and use it to generate personalized content',
    category: 'Development',
    icon: Globe,
    color: 'from-pink-500 to-rose-500',
    steps: [
      {
        id: 1,
        type: 'api_call',
        api_config: {
          url: 'https://api.example.com/user/{user_id}',
          method: 'GET',
          headers: {},
          response_mapping: {
            'name': 'user_name',
            'preferences': 'user_prefs'
          }
        },
        output_variable: 'user_data',
        position: { x: 100, y: 50 }
      },
      {
        id: 2,
        type: 'ai_prompt',
        custom_prompt: 'Create personalized content for {user_name} based on their preferences: {user_prefs}',
        output_variable: 'personalized_content',
        position: { x: 100, y: 220 }
      }
    ],
    connections: [
      { from_step: 1, to_step: 2, condition: 'default' }
    ]
  }
];

export default function WorkflowTemplates({ onSelectTemplate, onClose }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pre-Built Workflow Templates</h2>
          <p className="text-gray-600 mt-1">Start with a proven workflow and customize it to your needs</p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>Back</Button>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workflowTemplates.map((template, idx) => {
          const Icon = template.icon;
          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-all border-2 hover:border-purple-300 cursor-pointer group">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${template.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="min-h-[60px]">{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <Badge variant="outline">{template.category}</Badge>
                      <span>{template.steps.length} steps</span>
                    </div>
                    <Button 
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
                      onClick={() => onSelectTemplate(template)}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}