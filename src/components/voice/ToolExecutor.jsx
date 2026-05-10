import { apiClient } from '@/apis/client';

// Execute Creative Lab tools and return formatted results
export async function executeCreativeTool(toolId, inputData, useOllama = false, ollamaModel = null, beamModels = [], ollamaEndpoint = null) {
  const toolExecutors = {
    content_splitter: executeContentSplitter,
    title_generator: executeTitleGenerator,
    hook_generator: executeHookGenerator,
    idea_brainstorm: executeIdeaBrainstorm,
    idea_rating: executeIdeaRating,
    collab_matchmaker: executeCollabMatchmaker,
    tiny_prompt: executeTinyPrompt,
    creative_playground: executeCreativePlayground,
    newsletter_generator: executeNewsletterGenerator,
  };

  const executor = toolExecutors[toolId];
  if (!executor) {
    throw new Error(`Unknown tool: ${toolId}`);
  }

  // If beam mode, execute across multiple models
  if (beamModels && beamModels.length >= 2) {
    return await executeBeamTool(executor, inputData, beamModels, ollamaEndpoint);
  }

  return await executor(inputData, useOllama, ollamaModel);
}

// Execute tool across multiple models in beam mode
async function executeBeamTool(executor, inputData, beamModels, ollamaEndpoint) {
  const results = await Promise.all(
    beamModels.map(async (model) => {
      try {
        const result = await executor(inputData, true, model, ollamaEndpoint);
        return {
          model,
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        return {
          model,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    })
  );

  return {
    type: 'beam',
    beam_results: results,
    successful_count: results.filter(r => r.success).length,
    total_models: beamModels.length
  };
}

// Content Splitter
async function executeContentSplitter(data, useOllama, ollamaModel, ollamaEndpoint) {
  const { content, platforms, platform, tone, style, keywords, excludeWords, additionalContext, goal } = data;
  
  // Handle both plural (array) and singular (string) platform inputs
  const effectivePlatforms = platforms?.length > 0 
    ? platforms 
    : (platform ? [platform] : []);
    
  const selectedPlatforms = effectivePlatforms.length > 0 
    ? effectivePlatforms.join(', ')
    : 'YouTube Shorts, TikTok, Instagram Reels, X (Twitter), LinkedIn';
  
  const prompt = `Adapt this content for multiple social media platforms. For each platform, create a natural, platform-appropriate version:

Content: "${content}"

Platforms: ${selectedPlatforms}
${goal ? `Primary Goal: ${goal}` : ''}
${tone ? `Tone: ${tone}` : ''}
${style ? `Style: ${style}` : ''}
${keywords ? `Include keywords: ${keywords}` : ''}
${excludeWords ? `Avoid words: ${excludeWords}` : ''}
${additionalContext ? `Additional context: ${additionalContext}` : ''}

For each platform, provide:
- Optimized text/caption
- Hashtag recommendations
- Platform-specific best practices used`;

  const response = await invokeLLM(prompt, useOllama, ollamaModel, ollamaEndpoint, {
    type: "object",
    properties: {
      platforms: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            content: { type: "string" },
            hashtags: { type: "array", items: { type: "string" } },
            notes: { type: "string" }
          }
        }
      }
    }
  });

  return {
    type: 'content_splitter',
    results: response.platforms,
    prompt,
    metadata: { original_content: content }
  };
}

// Title Generator
async function executeTitleGenerator(data, useOllama, ollamaModel, ollamaEndpoint) {
  const { description, platform, style, tone, keywords, excludeWords, goal, additionalContext } = data;
  
  const prompt = `Generate 5 compelling video titles for ${platform || 'YouTube'} in a ${style || 'Curiosity Gap'} style.

Video description: "${description}"
${tone ? `Tone: ${tone}` : ''}
${goal ? `Goal: ${goal}` : ''}
${keywords ? `Must include: ${keywords}` : ''}
${excludeWords ? `Avoid: ${excludeWords}` : ''}
${additionalContext ? `Context: ${additionalContext}` : ''}

For each title, provide:
- The title text
- Why it works
- Estimated engagement potential (Low/Medium/High)`;

  const response = await invokeLLM(prompt, useOllama, ollamaModel, ollamaEndpoint, {
    type: "object",
    properties: {
      titles: {
        type: "array",
        items: {
          type: "object",
          properties: {
            text: { type: "string" },
            reasoning: { type: "string" },
            engagement: { type: "string", enum: ["Low", "Medium", "High"] }
          }
        },
        minItems: 5,
        maxItems: 5
      }
    }
  });

  return {
    type: 'title_generator',
    results: response.titles,
    prompt,
    metadata: { platform, style }
  };
}

// Hook Generator
async function executeHookGenerator(data, useOllama, ollamaModel, ollamaEndpoint) {
  const { content, audience, platform, tone, style, keywords, excludeWords, goal, additionalContext } = data;
  
  const prompt = `Create 6 attention-grabbing opening hooks for ${platform || 'YouTube'}.

Topic: "${content}"
Target Audience: ${audience || 'general viewers'}
Tone: ${tone || 'Professional'}
${style ? `Style: ${style}` : ''}
${goal ? `Goal: ${goal}` : ''}
${keywords ? `Include: ${keywords}` : ''}
${excludeWords ? `Avoid: ${excludeWords}` : ''}
${additionalContext ? `Context: ${additionalContext}` : ''}

For each hook, provide:
- The hook text
- Hook type/strategy
- Why it works for this audience`;

  const response = await invokeLLM(prompt, useOllama, ollamaModel, ollamaEndpoint, {
    type: "object",
    properties: {
      hooks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            text: { type: "string" },
            hook_type: { type: "string" },
            strategy: { type: "string" }
          }
        },
        minItems: 6,
        maxItems: 6
      }
    }
  });

  return {
    type: 'hook_generator',
    results: response.hooks,
    prompt,
    metadata: { platform, audience, tone }
  };
}

// Idea Brainstorm
async function executeIdeaBrainstorm(data, useOllama, ollamaModel, ollamaEndpoint) {
  const { niche, audience, platform, goal, tone, style, keywords, excludeWords, additionalContext } = data;
  
  const prompt = `Brainstorm 8 creative content ideas for ${platform || 'YouTube'}.

Niche: ${niche}
Target Audience: ${audience || 'general viewers'}
Primary Goal: ${goal || 'Engagement'}
${tone ? `Tone: ${tone}` : ''}
${style ? `Style: ${style}` : ''}
${keywords ? `Include themes: ${keywords}` : ''}
${excludeWords ? `Avoid themes: ${excludeWords}` : ''}
${additionalContext ? `Context: ${additionalContext}` : ''}

For each idea, provide:
- Concept title
- Description (2-3 sentences)
- Why it will resonate with the audience
- Potential engagement level (Low/Medium/High)`;

  const response = await invokeLLM(prompt, useOllama, ollamaModel, ollamaEndpoint, {
    type: "object",
    properties: {
      ideas: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            reasoning: { type: "string" },
            engagement: { type: "string", enum: ["Low", "Medium", "High"] }
          }
        },
        minItems: 8,
        maxItems: 8
      }
    }
  });

  return {
    type: 'idea_brainstorm',
    results: response.ideas,
    prompt,
    metadata: { niche, platform, goal }
  };
}

// Idea Rating
async function executeIdeaRating(data, useOllama, ollamaModel, ollamaEndpoint) {
  const { ideas, niche, goal, tone, style, keywords, excludeWords, additionalContext } = data;
  
  const prompt = `Rate and analyze these content ideas for ${niche} with a focus on ${goal || 'Engagement'}.

Ideas:
${ideas}
${tone ? `Tone preference: ${tone}` : ''}
${style ? `Style preference: ${style}` : ''}
${keywords ? `Bonus points for: ${keywords}` : ''}
${excludeWords ? `Penalize for: ${excludeWords}` : ''}
${additionalContext ? `Context: ${additionalContext}` : ''}

For each idea, provide:
- The idea text
- Rating (Strong/Needs Work/Weak)
- Strengths (2-3 points)
- Improvements needed (2-3 points)
- Overall score (1-10)`;

  const response = await invokeLLM(prompt, useOllama, ollamaModel, ollamaEndpoint, {
    type: "object",
    properties: {
      ratings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            idea: { type: "string" },
            rating: { type: "string", enum: ["Strong", "Needs Work", "Weak"] },
            strengths: { type: "array", items: { type: "string" } },
            improvements: { type: "array", items: { type: "string" } },
            score: { type: "number", minimum: 1, maximum: 10 }
          }
        }
      }
    }
  });

  return {
    type: 'idea_rating',
    results: response.ratings,
    prompt,
    metadata: { niche, goal }
  };
}

// Collab Matchmaker
async function executeCollabMatchmaker(data, useOllama, ollamaModel, ollamaEndpoint) {
  const { platform, niche, audience, goal, tone, style, keywords, excludeWords, additionalContext } = data;
  
  const prompt = `Suggest 5 potential collaboration partners for ${platform || 'YouTube'} in the ${niche} niche.
${audience ? `Target audience: ${audience}` : ''}
${goal ? `Collaboration goal: ${goal}` : ''}
${tone ? `Preferred tone match: ${tone}` : ''}
${style ? `Style match: ${style}` : ''}
${additionalContext ? `Context: ${additionalContext}` : ''}

For each creator, provide:
- Creator name/handle (fictional but realistic)
- Niche/specialty
- Why they're a good match
- Collaboration idea
- Estimated audience size range`;

  const response = await invokeLLM(prompt, useOllama, ollamaModel, ollamaEndpoint, {
    type: "object",
    properties: {
      creators: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            niche: { type: "string" },
            match_reason: { type: "string" },
            collab_idea: { type: "string" },
            audience_size: { type: "string" }
          }
        },
        minItems: 5,
        maxItems: 5
      }
    }
  });

  return {
    type: 'collab_matchmaker',
    results: response.creators,
    prompt,
    metadata: { platform, niche }
  };
}

// Tiny Prompt
async function executeTinyPrompt(data, useOllama, ollamaModel, ollamaEndpoint) {
  const { niche, audience, promptType, platform, tone, style, goal, keywords, excludeWords, additionalContext } = data;
  
  const prompt = `Generate 6 engaging ${promptType || 'Community Engagement'} prompts for ${platform || 'Instagram Stories'}.

Niche: ${niche}
Target Audience: ${audience || 'general'}
${tone ? `Tone: ${tone}` : ''}
${style ? `Style: ${style}` : ''}
${goal ? `Goal: ${goal}` : ''}
${keywords ? `Include: ${keywords}` : ''}
${additionalContext ? `Context: ${additionalContext}` : ''}

For each prompt, provide:
- The prompt text
- Why it encourages engagement
- Expected response type`;

  const response = await invokeLLM(prompt, useOllama, ollamaModel, ollamaEndpoint, {
    type: "object",
    properties: {
      prompts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            text: { type: "string" },
            reasoning: { type: "string" },
            response_type: { type: "string" }
          }
        },
        minItems: 6,
        maxItems: 6
      }
    }
  });

  return {
    type: 'tiny_prompt',
    results: response.prompts,
    prompt,
    metadata: { promptType, platform }
  };
}

// Creative Playground
async function executeCreativePlayground(data, useOllama, ollamaModel, ollamaEndpoint) {
  const { topic, technique, tone, style, goal, keywords, excludeWords, additionalContext } = data;
  
  const prompt = `Apply the ${technique || 'SCAMPER'} creative thinking technique to: "${topic}"

${tone ? `Tone: ${tone}` : ''}
${style ? `Style: ${style}` : ''}
${goal ? `Goal: ${goal}` : ''}
${keywords ? `Focus areas: ${keywords}` : ''}
${excludeWords ? `Avoid: ${excludeWords}` : ''}
${additionalContext ? `Context: ${additionalContext}` : ''}

Generate 6 creative variations using this technique. For each:
- The creative idea
- How it applies the technique
- Potential impact/benefit`;

  const response = await invokeLLM(prompt, useOllama, ollamaModel, ollamaEndpoint, {
    type: "object",
    properties: {
      variations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            idea: { type: "string" },
            technique_applied: { type: "string" },
            impact: { type: "string" }
          }
        },
        minItems: 6,
        maxItems: 6
      }
    }
  });

  return {
    type: 'creative_playground',
    results: response.variations,
    prompt,
    metadata: { topic, technique }
  };
}

// Newsletter Generator
async function executeNewsletterGenerator(data, useOllama, ollamaModel, ollamaEndpoint) {
   const { topic, audience, tone, style, goal, keywords, excludeWords, additionalContext } = data;

   const prompt = `Generate a monthly content plan for a newsletter about: "${topic}"

   Target audience: ${audience || 'Professionals'}
   ${keywords ? `Key focus areas: ${keywords}` : ''}
   Tone: ${tone || 'Professional'}
   ${style ? `Style: ${style}` : ''}
   ${goal ? `Goal: ${goal}` : ''}
   ${excludeWords ? `Avoid themes: ${excludeWords}` : ''}
   ${additionalContext ? `Context: ${additionalContext}` : ''}

   Generate exactly 31 newsletter ideas (spread across 4 weeks, roughly 7-8 per week). Each idea must have:
   - Engaging, unique title
   - Compelling description (1-2 sentences)
   - Relevant emoji
   - Item number (1-31, representing the running day of the month)

   IMPORTANT STRUCTURE: Organize items in a logical, compelling progression:
   - Week 1: Introduction and foundational concepts
   - Week 2: Building on foundations with practical applications
   - Week 3: Advanced strategies and deeper dives
   - Week 4: Integration, future trends, and actionable next steps
   - Create natural narrative flow where each item builds on previous ones
   - Group thematically related items within weeks
   - Ensure variety in content types and topics while maintaining coherence

   Return each item's sequential number (Day 1 through Day 31) to track the monthly calendar.
   Make each idea unique, highly valuable, and immediately actionable for the target audience.`;

   const response = await invokeLLM(prompt, useOllama, ollamaModel, ollamaEndpoint, {
     type: "object",
     properties: {
       newsletters: {
         type: "array",
         items: {
           type: "object",
           properties: {
             item_number: { type: "number" },
             title: { type: "string" },
             description: { type: "string" },
             emoji: { type: "string" }
           }
         },
         minItems: 31,
         maxItems: 31
       }
     }
   });

  return {
    type: 'newsletter_generator',
    results: response.newsletters,
    prompt,
    metadata: { topic, audience, tone }
  };
}

// Helper function to invoke LLM
async function invokeLLM(prompt, useOllama, ollamaModel, ollamaEndpoint, responseSchema) {
  if (useOllama && ollamaModel) {
    const endpoint = ollamaEndpoint || (() => {
      const endpoints = JSON.parse(localStorage.getItem('ollama_endpoints') || '[]');
      return endpoints.length > 0
        ? (typeof endpoints[0] === 'string' ? endpoints[0] : endpoints[0].url)
        : '/proxy';
    })();

    const { data } = await apiClient.functions.invoke('ollamaProxy', {
      endpoint,
      action: 'chat',
      model: ollamaModel,
      messages: [{
        role: 'user',
        content: `${prompt}\n\nReturn a valid JSON response matching this structure: ${JSON.stringify(responseSchema)}`
      }],
      options: { stream: false }
    });

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(data.message?.content || '{}');
      if (jsonResponse.properties) {
        const extractedData = {};
        for (const [key, value] of Object.entries(jsonResponse.properties)) {
          if (value.items && Array.isArray(value.items)) extractedData[key] = value.items;
          else if (value.type === 'array' && value.items) extractedData[key] = value.items;
        }
        if (Object.keys(extractedData).length > 0) jsonResponse = extractedData;
      }
    } catch (parseError) {
      throw new Error('Invalid JSON response from Ollama - make sure the model supports JSON format');
    }

    return jsonResponse;
  } else {
    return await apiClient.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: responseSchema
    });
  }
}
