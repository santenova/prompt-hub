import React, { useState } from 'react';
import { apiClient } from '@/apis/client';
import { X, Copy, Download, Youtube, Instagram, MessageCircle } from 'lucide-react';

const platforms = [
  { 
    name: 'YouTube Shorts', 
    icon: <Youtube className="w-6 h-6 text-[#FF0000]" />,
    key: 'youtubeShorts',
  },
  { 
    name: 'TikTok', 
    icon: <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/apiClient-prod/public/68d147008a392237a5abd5a6/cd22fbfb2_TikTokLogo.jpeg" alt="TikTok Logo" className="w-6 h-6 rounded-md" />,
    key: 'tiktok',
  },
  { 
    name: 'Instagram Reels', 
    icon: <Instagram className="w-6 h-6 text-[#E4405F]" />,
    key: 'instagramReels',
  },
  { 
    name: 'X Post', 
    icon: <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/apiClient-prod/public/68d147008a392237a5abd5a6/944c1938b_xlogo.jpg" alt="X Logo" className="w-6 h-6 rounded-md" />,
    key: 'tweetThread',
  }
];

export default function ContentSplitterModal({ onClose }) {
  const [contentInput, setContentInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedOutput, setGeneratedOutput] = useState(null);
  const [showToast, setShowToast] = useState('');

  const handleSplitContent = async () => {
    if (!contentInput.trim()) return;
    
    setIsProcessing(true);
    setGeneratedOutput(null);

    const prompt = `You are an expert content repurposing strategist. Your task is to take a single piece of content and adapt it into unique, platform-specific versions for YouTube Shorts, TikTok, Instagram Reels, and an X Post.

**Original Content:**
"""
${contentInput}
"""

Analyze the core message, key hooks, and highlights from the original content. Then, generate the following four outputs based on the platform rules below.

**Platform Rules:**

1.  **🔴 YouTube Shorts:**
    *   **Format:** A punchy, straightforward script.
    *   **Tone:** Clear, slightly educational.
    *   **Output:** Create a catchy title, the main script body, and a direct Call to Action (e.g., "Subscribe for more tips!").

2.  **🎵 TikTok:**
    *   **Format:** A short script with a strong, trending-style hook.
    *   **Tone:** Casual, energetic, use emojis where appropriate.
    *   **Output:** Create a viral-style hook (e.g., "POV:", "Nobody talks about this..."), the script body, and 3-5 relevant hashtags.

3.  **📸 Instagram Reels:**
    *   **Format:** A polished caption designed for community engagement.
    *   **Tone:** Aesthetic, inspiring, or value-driven.
    *   **Output:** Create a caption, 2-3 engagement prompts (e.g., "Tag a friend who needs this!"), and 3-4 relevant/branded hashtags.

4.  **✖️ X Post:**
    *   **Format:** A thread of multiple tweets (max 280 chars each).
    *   **Tone:** Bite-sized, high-value insights.
    *   **Output:** Create an array of strings. The first tweet must be a strong scroll-stopping hook. The final tweet should be a CTA or question.`;
    
    try {
      const response = await apiClient.integrations.Core.InvokeLLMwithLogging({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            youtubeShorts: {
              type: "object",
              properties: {
                title: { type: "string" },
                script: { type: "string" },
                cta: { type: "string" }
              },
              required: ["title", "script", "cta"]
            },
            tiktok: {
              type: "object",
              properties: {
                hook: { type: "string" },
                script: { type: "string" },
                hashtags: { type: "array", items: { type: "string" } }
              },
              required: ["hook", "script", "hashtags"]
            },
            instagramReels: {
              type: "object",
              properties: {
                caption: { type: "string" },
                engagement_prompts: { type: "array", items: { type: "string" } },
                hashtags: { type: "array", items: { type: "string" } }
              },
              required: ["caption", "engagement_prompts", "hashtags"]
            },
            tweetThread: {
              type: "array",
              items: { type: "string" },
              description: "An array of strings, where each string is a tweet in the thread."
            }
          },
          required: ["youtubeShorts", "tiktok", "instagramReels", "tweetThread"]
        }
      });
      setGeneratedOutput(response);
      
      // Save to ContentHistory
      try {
        const history = await apiClient.entities.ContentHistory.create({
          tool_type: 'content_splitter',
          topic: contentInput.substring(0, 100),
          content: contentInput,
          generated_content: [
            { platform: 'YouTube Shorts', content: JSON.stringify(response.youtubeShorts) },
            { platform: 'TikTok', content: JSON.stringify(response.tiktok) },
            { platform: 'Instagram Reels', content: JSON.stringify(response.instagramReels) },
            { platform: 'X Post', content: JSON.stringify(response.tweetThread) }
          ]
        });
        setHistoryId(history.id);
      } catch (err) {
        console.error('Failed to save to history:', err);
      }
    } catch (error) {
      console.error('Error splitting content:', error);
      showToastMessage('Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const showToastMessage = (message) => {
    setShowToast(message);
    setTimeout(() => setShowToast(''), 2000);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showToastMessage('Copied to clipboard');
    } catch (err) {
      console.error('Failed to copy:', err);
      showToastMessage('Failed to copy');
    }
  };
  
  const handleSave = async (platformKey, content) => {
    let contentToSave, title;
    switch(platformKey) {
        case 'youtubeShorts':
            contentToSave = `Title: ${content.title}\n\nScript:\n${content.script}\n\nCTA: ${content.cta}`;
            title = content.title;
            break;
        case 'tiktok':
            contentToSave = `Hook: ${content.hook}\n\nScript:\n${content.script}\n\nHashtags: ${content.hashtags.join(' ')}`;
            title = content.hook;
            break;
        case 'instagramReels':
            contentToSave = `Caption:\n${content.caption}\n\nPrompts: ${content.engagement_prompts.join(', ')}\n\nHashtags: ${content.hashtags.join(' ')}`;
            title = content.caption.substring(0, 50) + '...';
            break;
        case 'tweetThread':
            contentToSave = content.join('\n\n---\n\n');
            title = content[0];
            break;
        default: return;
    }

    try {
      await apiClient.entities.LibraryItem.create({
        type: 'split',
        platform_or_style: platformKey,
        content: contentToSave,
        source_module: 'Content Splitter',
        title: title
      });
      showToastMessage('Saved to Library');
    } catch (error) {
      console.error('Failed to save to library:', error);
      showToastMessage('Failed to save');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(10, 10, 10, 0.28)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white max-w-5xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto"
        style={{ 
          borderRadius: '24px',
          padding: '32px',
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-gray-900" style={{ fontSize: '32px', fontWeight: 700 }}>
            Content Splitter
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-800 text-lg font-medium mb-3 subtitle">Your Original Content</label>
          <textarea
            value={contentInput}
            onChange={(e) => setContentInput(e.target.value)}
            placeholder="Paste your content here (script, article, video idea)."
            className="w-full h-36 px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            style={{ backgroundColor: '#F4F5F2' }}
          />
        </div>

        <div className="text-center mb-8">
          <button
            onClick={handleSplitContent}
            disabled={!contentInput.trim() || isProcessing}
            className="px-8 py-3 rounded-full font-bold text-white text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{
              backgroundColor: '#8FAFF7',
              borderRadius: '999px',
              height: '48px',
            }}
          >
            {isProcessing ? 'Processing Your Content...' : 'Split For All Platforms'}
          </button>
        </div>
        
        {generatedOutput && !isProcessing && <p className="text-center text-gray-600 mb-6">Your platform-ready version is ready — preview below.</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {platforms.map((platform) => {
            const output = generatedOutput ? generatedOutput[platform.key] : null;
            const isReady = !output && !isProcessing;
            const isGenerated = !!output;

            return (
              <div 
                key={platform.key}
                className="rounded-2xl p-6 relative transition-all duration-300"
                style={{ 
                  backgroundColor: isGenerated ? '#FFFFFF' : '#F4F4F2',
                  border: isGenerated ? '1px solid #E5E7EB' : '1px solid transparent',
                  boxShadow: isGenerated ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  {platform.icon}
                  <h3 className="font-bold text-gray-900 text-lg">{platform.name}</h3>
                </div>

                {isReady && <p className="text-gray-500">Ready To Generate.</p>}
                {isProcessing && <p className="text-blue-600">Analyzing...</p>}
                
                {isGenerated && (
                  <div className="space-y-4 subtitle">
                    {platform.key === 'youtubeShorts' && (
                        <div>
                            <h4 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-1">Title</h4>
                            <p className="font-semibold text-gray-800 mb-3">{output.title}</p>
                            <h4 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-1">Script</h4>
                            <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed mb-3">{output.script}</p>
                            <p className="font-semibold text-blue-600 text-sm">{output.cta}</p>
                        </div>
                    )}
                    {platform.key === 'tiktok' && (
                        <div>
                            <h4 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-1">Hook</h4>
                            <p className="font-semibold text-gray-800 mb-3">{output.hook}</p>
                            <h4 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-1">Script</h4>
                            <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed mb-3">{output.script}</p>
                            <div className="flex flex-wrap gap-2">
                                {output.hashtags.map(tag => <span key={tag} className="text-xs bg-gray-100 px-2 py-1 rounded">#{tag}</span>)}
                            </div>
                        </div>
                    )}
                    {platform.key === 'instagramReels' && (
                        <div>
                            <h4 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-1">Caption</h4>
                            <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed mb-4">{output.caption}</p>
                            <div className="space-y-1 mb-3">
                                {output.engagement_prompts.map(p => <p key={p} className="text-xs text-purple-700">✨ {p}</p>)}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {output.hashtags.map(tag => <span key={tag} className="text-xs bg-gray-100 px-2 py-1 rounded">#{tag}</span>)}
                            </div>
                        </div>
                    )}
                    {platform.key === 'tweetThread' && (
                        <div className="space-y-3">
                            {output.map((tweet, i) => (
                                <div key={i} className="p-2 border-l-2 border-blue-200">
                                    <p className="text-gray-700 text-sm leading-relaxed">{tweet}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <button
                        onClick={() => handleSave(platform.key, output)}
                        className="px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2"
                        style={{ backgroundColor: '#E1F7D5', color: '#108043' }}
                      >
                        <Download className="w-4 h-4" />
                        Save To Library
                      </button>
                      <button
                        onClick={() => handleCopy(
                            platform.key === 'youtubeShorts' ? `${output.title}\n\n${output.script}\n\n${output.cta}` :
                            platform.key === 'tiktok' ? `${output.hook}\n\n${output.script}\n\n${output.hashtags.map(t=>'#'+t).join(' ')}` :
                            platform.key === 'instagramReels' ? `${output.caption}\n\n${output.engagement_prompts.join('\n')}\n\n${output.hashtags.map(t=>'#'+t).join(' ')}` :
                            output.join('\n\n')
                        )}
                        className="p-2 rounded-full hover:bg-gray-100"
                        title="Copy content"
                      >
                        <Copy className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showToast && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {showToast}
        </div>
      )}
    </div>
  );
}
