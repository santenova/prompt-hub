import React, { useState } from 'react';
import { apiClient } from '@/apis/client';
import { X, Copy, Upload, Star, Film, Mic, Twitter, MessageSquare, HelpCircle } from 'lucide-react';
import {groupBy} from 'lodash';

const platformIcons = {
  'YouTube': { icon: <Film className="w-4 h-4" />, color: 'text-red-600' },
  'TikTok': { icon: <Mic className="w-4 h-4" />, color: 'text-black' },
  'Instagram Reels': { icon: <Film className="w-4 h-4" />, color: 'text-pink-600' },
  'LinkedIn': { icon: <MessageSquare className="w-4 h-4" />, color: 'text-blue-700' },
  'X': { icon: <Twitter className="w-4 h-4" />, color: 'text-blue-500' },
};

export default function HookGeneratorModal({ onClose, initialData }) {
  const [formData, setFormData] = useState({
    userInput: initialData?.content || '',
    targetAudience: initialData?.audience || '',
    primaryPlatform: initialData?.platform || '',
    toneStyle: initialData?.tone || '',
    customAudience: '',
    customTone: ''
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHooks, setGeneratedHooks] = useState([]);
  const [showToast, setShowToast] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    const hasContent = formData.userInput.trim();
    const hasAudience = formData.targetAudience && (formData.targetAudience !== 'Other' || formData.customAudience.trim());
    const hasPlatform = formData.primaryPlatform;
    const hasTone = formData.toneStyle && (formData.toneStyle !== 'Other' || formData.customTone.trim());
    
    return hasContent && hasAudience && hasPlatform && hasTone;
  };

  const handleGenerate = async () => {
    if (!isFormValid()) return;
    
    setIsGenerating(true);
    setGeneratedHooks([]);

    try {
      const audience = formData.targetAudience === 'Other' ? formData.customAudience : formData.targetAudience;
      const tone = formData.toneStyle === 'Other' ? formData.customTone : formData.toneStyle;

      const response = await apiClient.integrations.Core.InvokeLLMwithLogging({
        prompt: `You are a master copywriter and content strategist who specializes in creating viral, platform-native opening hooks. You understand audience psychology, platform algorithms, and conversion copywriting.

**CONTENT ANALYSIS:**
Video/Content Description: "${formData.userInput}"

**STRATEGIC CONTEXT:**
• Target Audience: ${audience}
• Primary Platform: ${formData.primaryPlatform}
• Brand Voice/Tone: ${tone}

**PLATFORM-SPECIFIC REQUIREMENTS:**
${getPlatformStrategy(formData.primaryPlatform)}

**AUDIENCE PSYCHOLOGY:**
${getAudienceStrategy(audience)}

**TONE EXECUTION:**
${getToneStrategy(tone)}

**YOUR MISSION:**
Create exactly 6 opening hooks that are:
1. **Platform-Native**: Written specifically for ${formData.primaryPlatform}'s format and culture
2. **Audience-Targeted**: Speak directly to ${audience}'s interests, pain points, and language
3. **Tone-Consistent**: Reflect a ${tone.toLowerCase()} voice throughout
4. **Conversion-Focused**: Designed to stop scrolling and compel viewing
5. **Content-Grounded**: Directly tied to the provided content description

**HOOK CATEGORIES TO EXPLORE:**
- Problem/Solution Hooks (address audience pain points)
- Curiosity Gap Hooks (create intrigue without revealing the answer)
- Contrarian/Hot Take Hooks (challenge common assumptions)
- Story/Scenario Hooks (relatable situations)
- Value-First Hooks (promise immediate benefit)
- Social Proof/Authority Hooks (leverage credibility)

**DELIVERABLES:**
For each hook, provide:
• **text**: The hook itself (optimized for ${formData.primaryPlatform} character limits and style)
• **strategy**: Why this hook works psychologically for ${audience} on ${formData.primaryPlatform}
• **hook_type**: The category/style of hook used

**QUALITY STANDARDS:**
- Each hook should feel like it was written by a copywriter who deeply understands ${formData.primaryPlatform}
- Avoid generic phrases - make every word count
- Consider platform-specific elements (hashtags for TikTok, professional language for LinkedIn, etc.)
- Test different psychological triggers across the 6 hooks
- Ensure hooks match the ${tone.toLowerCase()} brand voice consistently

Generate hooks that feel like they belong natively on ${formData.primaryPlatform} and speak directly to ${audience}.`,
        response_json_schema: {
          type: "object",
          properties: {
            hooks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  strategy: { type: "string" },
                  hook_type: { type: "string" }
                },
                required: ["text", "strategy", "hook_type"]
              },
              minItems: 6,
              maxItems: 6
            }
          }
        }
      });
      
      const hooksWithData = response.hooks.map(h => ({ 
        ...h, 
        id: Math.random(), 
        isFavorited: false, 
        explanation: null, 
        isExplaining: false,
        platforms: [formData.primaryPlatform]
      }));
      setGeneratedHooks(hooksWithData);

    } catch (error) {
      console.error('Error generating hooks:', error);
      showToastMessage('Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper functions for platform-specific strategies
  const getPlatformStrategy = (platform) => {
    const strategies = {
      'YouTube': 'Create curiosity-driven hooks that promise value and encourage click-through. Optimize for search intent and longer attention spans. Focus on educational benefits and outcome promises.',
      'TikTok': 'Generate scroll-stopping, trend-aware hooks under 10 words. Use current slang when appropriate, create pattern interrupts, and optimize for immediate engagement. Consider trending formats and sounds.',
      'Instagram Reels': 'Craft visually-oriented, aesthetic hooks that work with trending audio. Balance entertainment with value, use relevant hashtags strategically, and create shareable moments.',
      'LinkedIn': 'Professional, credibility-building hooks that establish authority. Focus on industry insights, career growth, business results, and networking value. Avoid overly casual language.',
      'X': 'Sharp, debate-worthy hooks under 100 characters that spark conversation. Create hot takes, ask provocative questions, and optimize for retweets and replies.'
    };
    return strategies[platform] || 'Create engaging, platform-appropriate opening hooks.';
  };

  const getAudienceStrategy = (audience) => {
    const strategies = {
      'Gen Z': 'Use authentic, unfiltered language. Reference current events, social issues, and cultural trends. Avoid corporate-speak and embrace vulnerability and relatability.',
      'Professionals': 'Focus on career advancement, industry insights, and ROI. Use business terminology appropriately and emphasize practical value and professional growth.',
      'Parents': 'Address parenting challenges, time constraints, and family priorities. Speak to their desire for practical solutions and work-life balance.',
      'Students': 'Reference academic pressure, financial constraints, and future anxiety. Use energy and optimism while addressing real concerns about careers and success.',
      'Small Business Owners': 'Focus on growth, efficiency, cost-effectiveness, and competitive advantage. Speak to their entrepreneurial mindset and resource constraints.',
      'General Audience': 'Use universal themes like productivity, relationships, health, and personal growth. Keep language accessible and broadly appealing.'
    };
    return strategies[audience] || `Tailor language and topics to resonate with ${audience}'s specific interests and challenges.`;
  };

  const getToneStrategy = (tone) => {
    const strategies = {
      'Professional': 'Use polished, credible language. Avoid slang, maintain authority, and focus on expertise and results. Keep tone confident but not arrogant.',
      'Friendly': 'Conversational and approachable tone. Use inclusive language, personal pronouns, and warm phrasing. Feel like talking to a knowledgeable friend.',
      'Funny': 'Incorporate wit, wordplay, and humor appropriately. Use timing and surprise, but ensure humor serves the message and doesn\'t overshadow value.',
      'Bold/Edgy': 'Take strong stances, challenge conventions, and use powerful language. Be provocative but not offensive, confident but not reckless.',
      'Inspirational': 'Use uplifting, motivational language. Focus on possibility, transformation, and empowerment. Create emotional connection and hope.'
    };
    return strategies[tone] || `Ensure all language reflects a ${tone.toLowerCase()} voice and approach.`;
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showToastMessage('Copied to clipboard');
    } catch (err) {
      showToastMessage('Failed to copy');
    }
  };
  
  const handleGetExplanation = async (hookId) => {
    setGeneratedHooks(hooks => hooks.map(h => h.id === hookId ? { ...h, isExplaining: true } : h));
    
    const hook = generatedHooks.find(h => h.id === hookId);
    if (!hook) return;

    try {
      const prompt = `As a content strategy expert, explain in 1-2 concise sentences why the following hook is effective for grabbing attention: "${hook.text}". Focus on the psychological principle or marketing tactic it uses.`;
      const explanationResponse = await apiClient.integrations.Core.InvokeLLMwithLogging({ prompt });
      
      setGeneratedHooks(hooks => 
        hooks.map(h => h.id === hookId ? { ...h, explanation: explanationResponse, isExplaining: false } : h)
      );

    } catch (error) {
      console.error('Error getting explanation:', error);
      showToastMessage('Could not get explanation.');
      setGeneratedHooks(hooks => hooks.map(h => h.id === hookId ? { ...h, isExplaining: false } : h));
    }
  };

  const toggleFavorite = (id) => {
    setGeneratedHooks(hooks => 
      hooks.map(h => h.id === id ? { ...h, isFavorited: !h.isFavorited } : h)
    );
  };

  const showToastMessage = (message) => {
    setShowToast(message);
    setTimeout(() => setShowToast(''), 2500);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(10, 10, 10, 0.28)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white max-w-4xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto"
        style={{ 
          borderRadius: '24px',
          padding: '32px',
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-gray-900" style={{ fontSize: '32px', fontWeight: 700 }}>
            Hook Generator
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="mb-6 space-y-6">
          <div>
            <label className="block text-gray-900 mb-2 font-medium subtitle">Describe your video or paste your script*</label>
            <textarea
              value={formData.userInput}
              onChange={(e) => handleInputChange('userInput', e.target.value)}
              placeholder="E.g., This video is about how to edit faster in Premiere Pro..."
              className="w-full h-32 px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ backgroundColor: '#F9FAFB' }}
            />
            <div className="text-sm text-gray-600 mt-2">
              Or{' '}
              <label className="relative cursor-pointer font-medium text-blue-600 hover:text-blue-500">
                <span>upload a script file</span>
                <input type="file" className="sr-only" accept=".pdf,.txt,.docx,.srt" />
              </label>
              {' '}(PDF, TXT, DOCX, SRT)
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-gray-900 mb-2 font-medium subtitle">Target Audience*</label>
              <select
                value={formData.targetAudience}
                onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none"
                style={{ backgroundColor: '#F9FAFB' }}
              >
                <option value="">Select audience...</option>
                <option value="Gen Z">Gen Z</option>
                <option value="Professionals">Professionals</option>
                <option value="Parents">Parents</option>
                <option value="Students">Students</option>
                <option value="Small Business Owners">Small Business Owners</option>
                <option value="General Audience">General Audience</option>
                <option value="Other">Other</option>
              </select>
              {formData.targetAudience === 'Other' && (
                <input
                  type="text"
                  value={formData.customAudience}
                  onChange={(e) => handleInputChange('customAudience', e.target.value)}
                  placeholder="Describe your audience..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                />
              )}
            </div>

            <div>
              <label className="block text-gray-900 mb-2 font-medium subtitle">Primary Platform*</label>
              <select
                value={formData.primaryPlatform}
                onChange={(e) => handleInputChange('primaryPlatform', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none"
                style={{ backgroundColor: '#F9FAFB' }}
              >
                <option value="">Select platform...</option>
                <option value="YouTube">YouTube</option>
                <option value="TikTok">TikTok</option>
                <option value="Instagram Reels">Instagram Reels</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="X">X</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-900 mb-2 font-medium subtitle">Tone / Style*</label>
              <select
                value={formData.toneStyle}
                onChange={(e) => handleInputChange('toneStyle', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none"
                style={{ backgroundColor: '#F9FAFB' }}
              >
                <option value="">Select tone...</option>
                <option value="Professional">Professional</option>
                <option value="Friendly">Friendly</option>
                <option value="Funny">Funny</option>
                <option value="Bold/Edgy">Bold/Edgy</option>
                <option value="Inspirational">Inspirational</option>
                <option value="Other">Other</option>
              </select>
              {formData.toneStyle === 'Other' && (
                <input
                  type="text"
                  value={formData.customTone}
                  onChange={(e) => handleInputChange('customTone', e.target.value)}
                  placeholder="Describe your tone..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                />
              )}
            </div>
          </div>
        </div>
        
        <div className="text-center mb-8">
          <button
            onClick={handleGenerate}
            disabled={!isFormValid() || isGenerating}
            className="px-8 py-3 text-white font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#004e37' }}
          >
            {isGenerating ? 'Generating Hooks...' : 'Generate Hooks'}
          </button>
        </div>

        {(generatedHooks.length > 0 || isGenerating) && (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Your Hooks</h3>
            {isGenerating ? (
              <div className="space-y-4">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-6 bg-gray-300 rounded mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {generatedHooks.map(hook => (
                  <div key={hook.id} className="p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow">
                    <p className="text-lg font-medium text-gray-900 mb-3 leading-snug">"{hook.text}"</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1.5">
                        <strong>Type:</strong> {hook.hook_type}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <strong>Platform:</strong>
                        <span className={platformIcons[formData.primaryPlatform]?.color || 'text-gray-500'}>
                          {platformIcons[formData.primaryPlatform]?.icon}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-blue-700 bg-blue-50 p-3 rounded-lg mb-4">
                      <strong>Strategy:</strong> {hook.strategy}
                    </div>
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      <button onClick={() => toggleFavorite(hook.id)} className="p-1.5 rounded-full hover:bg-yellow-100 transition-colors">
                        <Star className={`w-4 h-4 ${hook.isFavorited ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                      </button>
                      <button onClick={() => handleCopy(hook.text)} className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors">Copy</button>
                      {!hook.explanation && (
                        <button 
                          onClick={() => handleGetExplanation(hook.id)} 
                          disabled={hook.isExplaining}
                          className="px-3 py-1 text-xs font-medium text-white rounded-full hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-70"
                          style={{ backgroundColor: '#004e37' }}
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          {hook.isExplaining ? 'Analyzing...' : 'Why this works'}
                        </button>
                      )}
                    </div>
                    {hook.explanation && (
                      <div className="mt-3 p-3 bg-green-50 text-green-800 rounded-lg text-sm border border-green-200">
                        <p className="font-semibold mb-1">Why This Works:</p>
                        <p>{hook.explanation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {generatedHooks.length === 0 && !isGenerating && (
          <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-gray-500">Fill in all required fields to generate platform-specific hooks.</p>
          </div>
        )}
      </div>

      {showToast && (
        <div className="fixed bottom-5 right-5 bg-gray-900 text-white px-5 py-2.5 rounded-lg shadow-lg text-sm font-medium">
          {showToast}
        </div>
      )}
    </div>
  );
}
