
import React, { useState } from 'react';
import { apiClient } from '@/apis/client';
import { X, Upload, Link, Copy, Download, RefreshCw, Edit, Save, Youtube, Instagram } from 'lucide-react';

const brandVoices = [
  'Conversational',
  'Authority', 
  'Playful',
  'Clean & Direct',
  'Custom'
];

const tones = [
  'Friendly',
  'Bold', 
  'Empathetic',
  'Data-driven',
  'Witty'
];

const outputFormats = [
  { 
    key: 'tiktok_caption',
    name: 'TikTok Caption',
    description: '≤150 chars, 2-4 hashtags',
    icon: <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/apiClient-prod/public/68d147008a392237a5abd5a6/cd22fbfb2_TikTokLogo.jpeg" alt="TikTok Logo" className="w-6 h-6 rounded-md" />
  },
  {
    key: 'instagram_caption', 
    name: 'Instagram Caption',
    description: '120-220 words, hook + story + CTA',
    icon: <Instagram className="w-6 h-6 text-[#E4405F]" />
  },
  {
    key: 'linkedin_post',
    name: 'LinkedIn Post', 
    description: 'Professional tone, 120-600 words',
    icon: <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/apiClient-prod/public/68d147008a392237a5abd5a6/2cdeacb4f_LinkedInLogo.png" alt="LinkedIn Logo" className="w-6 h-6 rounded-md" />
  },
  {
    key: 'youtube_description',
    name: 'YouTube Description',
    description: 'Hook + takeaways + CTA',
    icon: <Youtube className="w-6 h-6 text-[#FF0000]" />
  },
  {
    key: 'tweet_thread',
    name: 'X Thread',
    description: '6-10 posts, ≤260 chars each',
    icon: <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/apiClient-prod/public/68d147008a392237a5abd5a6/944c1938b_xlogo.jpg" alt="X Logo" className="w-6 h-6 rounded-md" />
  },
  {
    key: 'carousel_outline',
    name: 'Carousel Outline', 
    description: '8-10 slides with bullets',
    icon: '📊'
  },
  {
    key: 'newsletter_draft',
    name: 'Newsletter Draft',
    description: 'Subject + preview + 500-900 words',
    icon: '📧'
  },
  {
    key: 'blog_article',
    name: 'Blog Article',
    description: 'SEO optimized, 1200-1800 words',
    icon: '📝'
  },
  {
    key: 'video_script',
    name: 'Short-Video Script', 
    description: '30-60s script with beat sheet',
    icon: '🎬'
  },
  {
    key: 'podcast_notes',
    name: 'Podcast Show Notes',
    description: 'Summary + takeaways + timestamps', 
    icon: '🎙️'
  }
];

export default function RepurposeWizardModal({ onClose }) {
  const [contentInput, setContentInput] = useState('');
  const [inputType, setInputType] = useState('paste');
  const [preferences, setPreferences] = useState({
    brandVoice: 'Conversational',
    tones: [],
    audience: '',
    emojis: true,
    spelling: 'US',
    titleCase: true,
    description: initialData?.description || '',
    platform: '',
    style: '',
    includeNumbers: false,
    includeBrackets: false,
    allowEmojis: false,
    titleCase: true,
    audience: '',
    primaryKeyword: '',
    avoidWords: '',
    maxLengthOverride: '',
    script: ''
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedContent, setGeneratedContent] = useState({});
  const [showToast, setShowToast] = useState('');
  const [strategicBrief, setStrategicBrief] = useState(null);

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handleToneToggle = (tone) => {
    setPreferences(prev => ({
      ...prev,
      tones: prev.tones.includes(tone) 
        ? prev.tones.filter(t => t !== tone)
        : [...prev.tones, tone]
    }));
  };

  const handleRepurposeContent = async () => {
    if (!contentInput.trim()) return;
    
    setIsProcessing(true);
    setGeneratedContent({});
    setStrategicBrief(null);

    try {
      // Step 1: Build Strategic Brief
      const briefPrompt = `You are a content strategist analyzing source material to create a Strategic Brief. Extract concrete, specific elements from the source content.

**Source Content:**
"""
${contentInput}
"""

Analyze this content deeply and create a strategic brief JSON with the following structure:
- thesis: 1-2 sentence core message
- key_points: 5-12 specific, actionable bullets from the content
- entities: people, brands, products, keywords, numbers mentioned
- quotes_or_phrases: notable lines or phrases (≤15 words each) that could be reused
- claims: declarative statements from the source
- contrasts: before/after, myth/reality, problem/solution pairs found in content
- hooks: 3-6 curiosity-driven opener angles derived from the source
- examples_or_anecdotes: specific scenes, dates, metrics, stories mentioned
- cta_candidates: calls to action present or implied
- observed_tone: tone inferred from the source content

Be concrete and specific. Only include elements that actually exist in the source.`;

      const briefResponse = await apiClient.integrations.Core.InvokeLLMwithLogging({
        prompt: briefPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            thesis: { type: "string" },
            key_points: { type: "array", items: { type: "string" } },
            entities: { type: "array", items: { type: "string" } },
            quotes_or_phrases: { type: "array", items: { type: "string" } },
            claims: { type: "array", items: { type: "string" } },
            contrasts: { type: "array", items: { type: "string" } },
            hooks: { type: "array", items: { type: "string" } },
            examples_or_anecdotes: { type: "array", items: { type: "string" } },
            cta_candidates: { type: "array", items: { type: "string" } },
            observed_tone: { type: "string" }
          },
          required: ["thesis", "key_points", "entities", "quotes_or_phrases", "claims", "contrasts", "hooks", "examples_or_anecdotes", "cta_candidates", "observed_tone"]
        }
      });

      setStrategicBrief(briefResponse);

      // Step 2: Generate Platform-Specific Content
      const contentPrompt = `You are an expert content repurposing strategist. Using the Strategic Brief below, create platform-optimized content that is explicitly grounded in the source material.

**Strategic Brief:**
${JSON.stringify(briefResponse, null, 2)}

**User Preferences:**
- Brand Voice: ${preferences.brandVoice}
- Tones: ${preferences.tones.join(', ') || 'Natural'}
- Audience: ${preferences.audience || 'General'}
- Use Emojis: ${preferences.emojis ? 'Yes' : 'No'}
- Spelling: ${preferences.spelling}
- Title Case for headlines: ${preferences.titleCase ? 'Yes' : 'No'}

**CRITICAL RULES:**
1. Every output must reference at least one concrete element from the Strategic Brief
2. Platform copy must differ by platform logic (TikTok ≠ LinkedIn ≠ Instagram)
3. Include specific "why_this_fits" explanation for each variant
4. Use exact quotes, phrases, entities, or examples from the brief
5. Never invent information not in the source

**Platform Specifications:**

**TikTok Caption:** ≤150 chars (cap 220), 2-4 hashtags, emojis allowed, immediate curiosity/benefit, informal tone, no corporate jargon

**Instagram Caption:** 120-220 words, hook first line, story/value middle, CTA end, 6-12 hashtags, aesthetic friendly tone, line breaks

**LinkedIn Post:** Short (120 words) and Long (300-600 words), professional structured, no emojis by default, lead with thesis, support with 3 key points, end with thoughtful question

**YouTube Description:** First 200 chars = hook, then 3-5 takeaways, keywords from entities, timestamps if available

**X Thread:** 6-10 tweets, ≤260 chars each, ≤2 hashtags total, Tweet 1 = hook, middle tweets = key points, final = CTA, include one direct quote

**Carousel Outline:** 8-10 slides, S1 headline ≤8 words, S2-S9 bullets, S10 CTA

**Newsletter Draft:** Subject + preview + 500-900 words, hook → sections → CTA, include one quote + one example

**Blog Article:** SEO title ≤60 chars, meta 140-160, outline mirrors key points, 1200-1800 words

**Short-Video Script:** 30-60s, Hook (0-3s), Problem (3-10s), Solution (10-40s), CTA (40-60s), on-screen text ≤6 words/line

**Podcast Show Notes:** 120-200 word summary, 5-8 takeaways, timestamps, 2 quotes ≤15 words

Generate 2 variants for each format (1 for long forms). Each variant must be unmistakably different and grounded in the source.`;

      const response = await apiClient.integrations.Core.InvokeLLMwithLogging({
        prompt: contentPrompt,
        response_json_schema: {
          type: "object", 
          properties: {
            tiktok_caption: { 
              type: "object", 
              properties: { 
                variant1: { 
                  type: "object", 
                  properties: { 
                    text: { type: "string" }, 
                    why_this_fits: { type: "string" } 
                  }, 
                  required: ["text", "why_this_fits"] 
                }, 
                variant2: { 
                  type: "object", 
                  properties: { 
                    text: { type: "string" }, 
                    why_this_fits: { type: "string" } 
                  }, 
                  required: ["text", "why_this_fits"] 
                } 
              }, 
              required: ["variant1", "variant2"] 
            },
            instagram_caption: { 
              type: "object", 
              properties: { 
                variant1: { 
                  type: "object", 
                  properties: { 
                    text: { type: "string" }, 
                    why_this_fits: { type: "string" } 
                  }, 
                  required: ["text", "why_this_fits"] 
                }, 
                variant2: { 
                  type: "object", 
                  properties: { 
                    text: { type: "string" }, 
                    why_this_fits: { type: "string" } 
                  }, 
                  required: ["text", "why_this_fits"] 
                } 
              }, 
              required: ["variant1", "variant2"] 
            },
            linkedin_post: { 
              type: "object", 
              properties: { 
                variant1: { 
                  type: "object", 
                  properties: { 
                    text: { type: "string" }, 
                    why_this_fits: { type: "string" } 
                  }, 
                  required: ["text", "why_this_fits"] 
                }, 
                variant2: { 
                  type: "object", 
                  properties: { 
                    text: { type: "string" }, 
                    why_this_fits: { type: "string" } 
                  }, 
                  required: ["text", "why_this_fits"] 
                } 
              }, 
              required: ["variant1", "variant2"] 
            },
            youtube_description: { 
              type: "object", 
              properties: { 
                variant1: { 
                  type: "object", 
                  properties: { 
                    text: { type: "string" }, 
                    why_this_fits: { type: "string" } 
                  }, 
                  required: ["text", "why_this_fits"] 
                }, 
                variant2: { 
                  type: "object", 
                  properties: { 
                    text: { type: "string" }, 
                    why_this_fits: { type: "string" } 
                  }, 
                  required: ["text", "why_this_fits"] 
                } 
              }, 
              required: ["variant1", "variant2"] 
            },
            tweet_thread: { 
              type: "object", 
              properties: { 
                variant1: { 
                  type: "object", 
                  properties: { 
                    thread: { type: "array", items: { type: "string" } }, 
                    why_this_fits: { type: "string" } 
                  }, 
                  required: ["thread", "why_this_fits"] 
                }, 
                variant2: { 
                  type: "object", 
                  properties: { 
                    thread: { type: "array", items: { type: "string" } }, 
                    why_this_fits: { type: "string" } 
                  }, 
                  required: ["thread", "why_this_fits"] 
                } 
              }, 
              required: ["variant1", "variant2"] 
            },
            carousel_outline: { 
              type: "object", 
              properties: { 
                variant1: { 
                  type: "object", 
                  properties: { 
                    outline: { type: "array", items: { type: "string" } }, 
                    why_this_fits: { type: "string" } 
                  }, 
                  required: ["outline", "why_this_fits"] 
                }, 
                variant2: { 
                  type: "object", 
                  properties: { 
                    outline: { type: "array", items: { type: "string" } }, 
                    why_this_fits: { type: "string" } 
                  }, 
                  required: ["outline", "why_this_fits"] 
                } 
              }, 
              required: ["variant1", "variant2"] 
            },
            newsletter_draft: { 
              type: "object", 
              properties: { 
                variant1: { 
                  type: "object", 
                  properties: { 
                    subject: { type: "string" }, 
                    preview: { type: "string" }, 
                    body: { type: "string" }, 
                    why_this_fits: { type: "string" } 
                  }, 
                  required: ["subject", "preview", "body", "why_this_fits"] 
                } 
              }, 
              required: ["variant1"] 
            },
            blog_article: { 
              type: "object", 
              properties: { 
                variant1: { 
                  type: "object", 
                  properties: { 
                    title: { type: "string" }, 
                    meta_description: { type: "string" }, 
                    content: { type: "string" }, 
                    why_this_fits: { type: "string" } 
                  }, 
                  required: ["title", "meta_description", "content", "why_this_fits"] 
                } 
              }, 
              required: ["variant1"] 
            },
            video_script: { 
              type: "object", 
              properties: { 
                variant1: { 
                  type: "object", 
                  properties: { 
                    script: { type: "string" }, 
                    why_this_fits: { type: "string" } 
                  }, 
                  required: ["script", "why_this_fits"] 
                }, 
                variant2: { 
                  type: "object", 
                  properties: { 
                    script: { type: "string" }, 
                    why_this_fits: { type: "string" } 
                  }, 
                  required: ["script", "why_this_fits"] 
                } 
              }, 
              required: ["variant1", "variant2"] 
            },
            podcast_notes: { 
              type: "object", 
              properties: { 
                variant1: { 
                  type: "object", 
                  properties: { 
                    notes: { type: "string" }, 
                    why_this_fits: { type: "string" } 
                  }, 
                  required: ["notes", "why_this_fits"] 
                } 
              }, 
              required: ["variant1"] 
            }
          }
        }
      });

      setGeneratedContent(response);
    } catch (error) {
      console.error('Error repurposing content:', error);
      if (error.message && error.message.includes('context')) {
        showToastMessage('I need more context to ground strong outputs. Please provide more detailed content.');
      } else {
        showToastMessage('Something went wrong. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = async (content) => {
    let textToCopy = '';
    if (typeof content.text === 'string') textToCopy = content.text;
    else if (Array.isArray(content.thread)) textToCopy = content.thread.join('\n\n');
    else if (Array.isArray(content.outline)) textToCopy = content.outline.join('\n');
    else if (content.body) textToCopy = `Subject: ${content.subject}\n\nPreview: ${content.preview}\n\n${content.body}`;
    else if (content.content) textToCopy = `${content.title}\n\n${content.content}`;
    else if (content.script) textToCopy = content.script;
    else if (content.notes) textToCopy = content.notes;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      showToastMessage('Copied to clipboard');
    } catch (error) {
      showToastMessage('Failed to copy');
    }
  };

  const handleSave = async (formatKey, variant, content) => {
    let textToCopy = '';
    let title = '';
    
    if (typeof content.text === 'string') {
      textToCopy = content.text;
      title = content.text.substring(0, 50) + '...';
    } else if (Array.isArray(content.thread)) {
      textToCopy = content.thread.join('\n\n');
      title = content.thread[0].substring(0, 50) + '...';
    } else if (Array.isArray(content.outline)) {
      textToCopy = content.outline.join('\n');
      title = content.outline[0].substring(0, 50) + '...';
    } else if (content.body) {
      textToCopy = `Subject: ${content.subject}\n\nPreview: ${content.preview}\n\n${content.body}`;
      title = content.subject;
    } else if (content.content) {
      textToCopy = `${content.title}\n\n${content.content}`;
      title = content.title;
    } else if (content.script) {
      textToCopy = content.script;
      title = 'Video Script';
    } else if (content.notes) {
      textToCopy = content.notes;
      title = 'Podcast Notes';
    }

    try {
      await apiClient.entities.LibraryItem.create({
        type: 'repurpose',
        platform_or_style: `${formatKey} - ${variant}`,
        content: textToCopy,
        source_module: 'Repurpose Wizard',
        title: title
      });
      showToastMessage('Saved to Library');
    } catch (error) {
      showToastMessage('Failed to save');
    }
  };

  const handleRegenerate = async (formatKey) => {
    if (!strategicBrief) {
      showToastMessage('No strategic brief available for regeneration');
      return;
    }

    const regeneratePrompt = `Regenerate the ${formatKey} content using the same Strategic Brief and preferences, but with different wording and approach. Keep the same plan (hook/points/CTA) but vary the execution.

Strategic Brief: ${JSON.stringify(strategicBrief, null, 2)}

User Preferences: Brand Voice: ${preferences.brandVoice}, Tones: ${preferences.tones.join(', ')}, Emojis: ${preferences.emojis ? 'Yes' : 'No'}

Generate 2 new variants for ${formatKey} that are meaningfully different from the previous ones but still grounded in the source material.`;

    try {
      // This would regenerate just the specific format - implementation would depend on specific format logic
      showToastMessage('Regenerating content...');
      // For now, just show message - full implementation would call LLM again for specific format
    } catch (error) {
      showToastMessage('Failed to regenerate');
    }
  };

  const showToastMessage = (message) => {
    setShowToast(message);
    setTimeout(() => setShowToast(''), 3000);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const renderContent = (content) => {
    if (content.text) return <p className="whitespace-pre-wrap">{content.text}</p>;
    if (content.thread) return content.thread.map((tweet, i) => (
      <div key={i} className="mb-2 pb-2 border-b last:border-b-0 border-gray-200">
        <span className="text-xs text-gray-500">Tweet {i + 1}:</span>
        <p className="text-sm">{tweet}</p>
      </div>
    ));
    if (content.outline) return content.outline.map((slide, i) => (
      <div key={i} className="mb-1">
        <span className="text-xs text-gray-500">Slide {i + 1}:</span> {slide}
      </div>
    ));
    if (content.body) return (
      <div>
        <p><strong>Subject:</strong> {content.subject}</p>
        <p><strong>Preview:</strong> {content.preview}</p>
        <hr className="my-2"/>
        <div className="text-sm whitespace-pre-wrap">{content.body}</div>
      </div>
    );
    if (content.content) return (
      <div>
        <p><strong>Title:</strong> {content.title}</p>
        <p><strong>Meta:</strong> {content.meta_description}</p>
        <hr className="my-2"/>
        <div className="text-sm whitespace-pre-wrap">{content.content}</div>
      </div>
    );
    if (content.script) return <p className="whitespace-pre-wrap text-sm">{content.script}</p>;
    if (content.notes) return <p className="whitespace-pre-wrap text-sm">{content.notes}</p>;
    return <p>Unsupported format</p>;
  };

  const renderVariant = (formatKey, variant, content) => (
    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{variant}</span>
        <div className="flex gap-2">
          <button 
            onClick={() => handleCopy(content)} 
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-md transition-colors"
            title="Copy"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleSave(formatKey, variant, content)} 
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-md transition-colors"
            title="Save to Library"
          >
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="text-sm text-gray-900 max-h-48 overflow-y-auto pr-2">
        {renderContent(content)}
      </div>
      <div className="mt-4 pt-3 border-t border-gray-300">
        <p className="text-xs text-gray-700 leading-relaxed">
          <span className="font-semibold text-blue-700">Why this fits:</span> {content.why_this_fits}
        </p>
      </div>
    </div>
  );

  const renderFormatTile = (format) => {
    const content = generatedContent[format.key];
    const hasContent = content && content.variant1;
    const variantCount = hasContent ? (content.variant2 ? 2 : 1) : 0;

    return (
      <div key={format.key} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{format.icon}</span>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{format.name}</h3>
              <p className="text-sm text-gray-500">{format.description}</p>
            </div>
          </div>
          {hasContent && (
            <button 
              onClick={() => handleRegenerate(format.key)} 
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              title="Regenerate like this"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          )}
        </div>

        {!hasContent && !isProcessing && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-lg font-medium mb-2">Ready To Generate</div>
            <p className="text-sm">Waiting for source content analysis</p>
          </div>
        )}
        
        {isProcessing && !hasContent && (
          <div className="text-center py-12 text-blue-600">
            <div className="text-lg font-medium mb-2">Analyzing source…</div>
            <p className="text-sm">Building strategic brief and platform-specific content</p>
          </div>
        )}

        {hasContent && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                {variantCount} Variant{variantCount > 1 ? 's' : ''} Ready
              </span>
            </div>
            {content.variant1 && renderVariant(format.key, 'Variant 1', content.variant1)}
            {content.variant2 && renderVariant(format.key, 'Variant 2', content.variant2)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(10, 10, 10, 0.28)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white max-w-7xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto"
        style={{
          borderRadius: '24px',
          padding: '32px',
          fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-gray-900" style={{ fontSize: '32px', fontWeight: 700, fontFamily: "'Rubik', sans-serif" }}>
              Repurpose Wizard
            </h2>
            <p className="text-gray-600 mt-2">Transform one piece of content into many formats.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="mb-8">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setInputType('paste')}
              className={`px-6 py-3 rounded-xl font-medium transition-colors ${inputType === 'paste' ? 'bg-blue-100 text-blue-700 border-2 border-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Paste Text
            </button>
            <button
              onClick={() => setInputType('upload')}
              className={`px-6 py-3 rounded-xl font-medium transition-colors ${inputType === 'upload' ? 'bg-blue-100 text-blue-700 border-2 border-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Upload File
            </button>
            <button
              onClick={() => setInputType('link')}
              className={`px-6 py-3 rounded-xl font-medium transition-colors ${inputType === 'link' ? 'bg-blue-100 text-blue-700 border-2 border-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Import Link
            </button>
          </div>

          <div className="mb-6">
            {inputType === 'paste' && (
              <textarea 
                value={contentInput} 
                onChange={(e) => setContentInput(e.target.value)} 
                placeholder="Paste a script or import a link. We'll repurpose it into multiple formats grounded in your content." 
                className="w-full h-48 px-4 py-4 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                style={{ backgroundColor: '#F9FAFB' }}
                maxLength={25000}
              />
            )}
            {inputType === 'upload' && (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition-colors">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                  <span className="text-lg">Upload a file</span>
                  <input 
                    type="file" 
                    accept=".txt,.docx,.pdf,.md,.mp4,.mp3,.wav" 
                    className="sr-only" 
                    onChange={(e) => { 
                      const file = e.target.files?.[0]; 
                      if (file) { 
                        setContentInput(`[File uploaded: ${file.name}]`); 
                      } 
                    }} 
                  />
                </label>
                <p className="text-sm text-gray-500 mt-2">TXT, DOCX, PDF, MD, MP4, MP3, WAV (up to 25k characters)</p>
              </div>
            )}
            {inputType === 'link' && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <input 
                    type="url" 
                    value={contentInput} 
                    onChange={(e) => setContentInput(e.target.value)} 
                    placeholder="https://youtube.com/watch?v=... or podcast/article link" 
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                  />
                </div>
                <button className="px-6 py-4 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors">
                  <Link className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Brand Voice</label>
              <select 
                value={preferences.brandVoice} 
                onChange={(e) => handlePreferenceChange('brandVoice', e.target.value)} 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {brandVoices.map(voice => <option key={voice} value={voice}>{voice}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Audience</label>
              <input 
                type="text" 
                value={preferences.audience} 
                onChange={(e) => handlePreferenceChange('audience', e.target.value)} 
                placeholder="e.g., startup founders, fitness enthusiasts" 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Tone</label>
            <div className="flex flex-wrap gap-2">
              {tones.map(tone => (
                <button 
                  key={tone} 
                  onClick={() => handleToneToggle(tone)} 
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    preferences.tones.includes(tone) 
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-6 mb-8">
            <label className="flex items-center">
              <input 
                type="checkbox" 
                checked={preferences.emojis} 
                onChange={(e) => handlePreferenceChange('emojis', e.target.checked)} 
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2" 
              />
              <span className="text-sm font-medium text-gray-700">Use Emojis</span>
            </label>
            <label className="flex items-center">
              <input 
                type="checkbox" 
                checked={preferences.titleCase} 
                onChange={(e) => handlePreferenceChange('titleCase', e.target.checked)} 
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2" 
              />
              <span className="text-sm font-medium text-gray-700">Title Case</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Spelling:</span>
              <select 
                value={preferences.spelling} 
                onChange={(e) => handlePreferenceChange('spelling', e.target.value)} 
                className="px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="US">US</option>
                <option value="UK">UK</option>
              </select>
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <button 
            onClick={handleRepurposeContent} 
            disabled={!contentInput.trim() || isProcessing} 
            className="px-10 py-4 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors text-lg shadow-lg"
          >
            {isProcessing ? 'Analyzing source…' : 'Repurpose Content'}
          </button>
          {contentInput.trim() && (
            <p className="text-sm text-gray-600 mt-2">
              {contentInput.length} characters • Ready to analyze and repurpose
            </p>
          )}
        </div>

        {(Object.keys(generatedContent).length > 0 || isProcessing) && (
          <div>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Generated Formats</h3>
              <p className="text-gray-600">Each output is explicitly grounded in your source material</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {outputFormats.map(format => renderFormatTile(format))}
            </div>
          </div>
        )}
      </div>

      {showToast && (
        <div className="fixed bottom-5 right-5 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg text-sm font-medium z-50 max-w-sm">
          {showToast}
        </div>
      )}
    </div>
  );
}
