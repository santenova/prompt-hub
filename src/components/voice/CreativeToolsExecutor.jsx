import React, { useState } from 'react';
import { apiClient } from '@/apis/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Star, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CreativeToolsExecutor({ toolId, data, onComplete }) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const executeContentSplitter = async (content) => {
    const prompt = `You are a platform-specific content adapter. Take the following content and adapt it for different social media platforms.

Original Content:
${content}

Create 4 platform-specific versions:
1. YouTube Shorts (60 seconds, punchy opening, visual cues)
2. TikTok (fast-paced, trend-aware, hashtag-ready)
3. Instagram Reels (aesthetic, story-driven, caption-friendly)
4. X/Twitter (concise thread format, under 280 chars per tweet)

Return JSON with: platform, content, hashtags, notes`;

    const response = await apiClient.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          adaptations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                platform: { type: "string" },
                content: { type: "string" },
                hashtags: { type: "array", items: { type: "string" } },
                notes: { type: "string" }
              }
            }
          }
        }
      }
    });

    return response.adaptations || [];
  };

  const executeTitleGenerator = async (description, platform) => {
    const prompt = `You are a viral content title creator. Generate 5 compelling titles for:

Description: ${description}
Platform: ${platform || 'YouTube'}

Each title should be click-worthy, clear, and optimized for the platform.

Return JSON with: title, hook_reason, estimated_ctr`;

    const response = await apiClient.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          titles: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                hook_reason: { type: "string" },
                estimated_ctr: { type: "string" }
              }
            }
          }
        }
      }
    });

    return response.titles || [];
  };

  const executeHookGenerator = async (content, platform, audience, tone) => {
    const prompt = `You are a social media hook expert. Generate 5 powerful opening hooks for:

Content: ${content}
Platform: ${platform || 'TikTok'}
Audience: ${audience || 'general'}
Tone: ${tone || 'engaging'}

Each hook should grab attention in the first 3 seconds.

Return JSON with: hook, why_it_works, engagement_potential`;

    const response = await apiClient.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          hooks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                hook: { type: "string" },
                why_it_works: { type: "string" },
                engagement_potential: { type: "string" }
              }
            }
          }
        }
      }
    });

    return response.hooks || [];
  };

  const executeIdeaBrainstorm = async (topic, audience, platform, tone, goal) => {
    const prompt = `You are a creative content strategist. Generate 5 unique content ideas for:

Topic: ${topic}
Audience: ${audience || 'general audience'}
Platform: ${platform || 'multi-platform'}
Tone: ${tone || 'engaging'}
Goal: ${goal || 'engagement'}

Make ideas specific, actionable, and platform-appropriate.

Return JSON with: idea, angle, why_it_works, estimated_impact`;

    const response = await apiClient.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          ideas: {
            type: "array",
            items: {
              type: "object",
              properties: {
                idea: { type: "string" },
                angle: { type: "string" },
                why_it_works: { type: "string" },
                estimated_impact: { type: "string" }
              }
            }
          }
        }
      }
    });

    return response.ideas || [];
  };

  const executeIdeaRating = async (ideas, niche, goal) => {
    const ideasList = Array.isArray(ideas) ? ideas : ideas.split('\n').filter(i => i.trim());
    
    const prompt = `You are a content strategy analyst. Rate these content ideas:

Ideas:
${ideasList.map((idea, i) => `${i + 1}. ${idea}`).join('\n')}

Niche: ${niche || 'general'}
Goal: ${goal || 'growth'}

For each idea, provide: verdict (Strong/Needs Work/Weak), feedback, suggestions.

Return JSON with: original_idea, verdict, feedback, suggestions (array)`;

    const response = await apiClient.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          rated_ideas: {
            type: "array",
            items: {
              type: "object",
              properties: {
                original_idea: { type: "string" },
                verdict: { type: "string" },
                feedback: { type: "string" },
                suggestions: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      }
    });

    return response.rated_ideas || [];
  };

  const executeCollabMatchmaker = async (niche, platform) => {
    const prompt = `You are a creator collaboration expert. Find 3 ideal collaboration partners for:

Niche: ${niche}
Platform: ${platform || 'YouTube'}

Suggest creators with complementary audiences and content styles.

Return JSON with: creator_profile, why_good_match, collab_ideas, estimated_reach`;

    const response = await apiClient.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          matches: {
            type: "array",
            items: {
              type: "object",
              properties: {
                creator_profile: { type: "string" },
                why_good_match: { type: "string" },
                collab_ideas: { type: "array", items: { type: "string" } },
                estimated_reach: { type: "string" }
              }
            }
          }
        }
      }
    });

    return response.matches || [];
  };

  const executeTinyPrompt = async (niche, audience, platform) => {
    const prompt = `You are a conversation starter expert. Generate 5 engaging prompts for:

Niche: ${niche}
Audience: ${audience || 'general'}
Platform: ${platform || 'social media'}

Create prompts that spark discussions and engagement.

Return JSON with: prompt_text, why_engaging, expected_responses`;

    const response = await apiClient.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          prompts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                prompt_text: { type: "string" },
                why_engaging: { type: "string" },
                expected_responses: { type: "string" }
              }
            }
          }
        }
      }
    });

    return response.prompts || [];
  };

  const executeTool = async () => {
    setIsExecuting(true);
    setError(null);
    setResults(null);

    try {
      let output;
      
      switch (toolId) {
        case 'content_splitter':
          output = await executeContentSplitter(data.content);
          break;
        case 'title_generator':
          output = await executeTitleGenerator(data.description, data.platform);
          break;
        case 'hook_generator':
          output = await executeHookGenerator(data.content, data.platform, data.audience, data.tone);
          break;
        case 'idea_brainstorm':
          output = await executeIdeaBrainstorm(data.topic, data.audience, data.platform, data.tone, data.goal);
          break;
        case 'idea_rating':
          output = await executeIdeaRating(data.ideas, data.niche, data.goal);
          break;
        case 'collab_matchmaker':
          output = await executeCollabMatchmaker(data.niche, data.platform);
          break;
        case 'tiny_prompt':
          output = await executeTinyPrompt(data.niche, data.audience, data.platform);
          break;
        default:
          throw new Error('Unknown tool');
      }

      setResults(output);
      if (onComplete) {
        onComplete(output);
      }
    } catch (err) {
      console.error('Tool execution error:', err);
      setError(err.message || 'Failed to execute tool');
    } finally {
      setIsExecuting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const saveToLibrary = async (item, type) => {
    try {
      await apiClient.entities.LibraryItem.create({
        type: type,
        content: JSON.stringify(item),
        source_module: toolId,
        title: item.title || item.idea || item.hook || 'Saved item'
      });
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  React.useEffect(() => {
    executeTool();
  }, []);

  const getToolName = () => {
    const names = {
      content_splitter: 'Content Splitter',
      title_generator: 'Title Generator',
      hook_generator: 'Hook Generator',
      idea_brainstorm: 'Idea Brainstorm',
      idea_rating: 'Idea Rating',
      collab_matchmaker: 'Collab Matchmaker',
      tiny_prompt: 'Tiny Prompt'
    };
    return names[toolId] || 'Creative Tool';
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold text-purple-900">
              {getToolName()} Results
            </CardTitle>
            {isExecuting && <Loader2 className="w-4 h-4 animate-spin text-purple-600" />}
          </div>
          {results && (
            <Badge variant="outline" className="bg-purple-100 text-purple-800">
              {Array.isArray(results) ? results.length : 1} results
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isExecuting && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Generating with AI...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {results && Array.isArray(results) && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map((result, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-lg p-3 border border-purple-100 hover:shadow-md transition-shadow"
              >
                <div className="space-y-2">
                  <div className="font-medium text-gray-900 text-sm">
                    {result.title || result.idea || result.hook || result.prompt_text || result.content?.substring(0, 100)}
                  </div>
                  {result.hook_reason && (
                    <p className="text-xs text-gray-600">{result.hook_reason}</p>
                  )}
                  {result.why_it_works && (
                    <p className="text-xs text-gray-600">{result.why_it_works}</p>
                  )}
                  {result.why_engaging && (
                    <p className="text-xs text-gray-600">{result.why_engaging}</p>
                  )}
                  {result.feedback && (
                    <p className="text-xs text-gray-600">{result.feedback}</p>
                  )}
                  {result.platform && (
                    <Badge variant="outline" className="text-xs">{result.platform}</Badge>
                  )}
                  {result.verdict && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        result.verdict === 'Strong' ? 'bg-green-100 text-green-800' :
                        result.verdict === 'Weak' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {result.verdict}
                    </Badge>
                  )}
                  <div className="flex gap-1 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(result.content || result.title || result.idea || result.hook || result.prompt_text)}
                      className="h-6 text-xs"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => saveToLibrary(result, 'creative_tool_output')}
                      className="h-6 text-xs"
                    >
                      <Star className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
