import React, { useState } from 'react';
import { apiClient } from '@/apis/client';
import { X, Copy, MessageCircle, Users, Lightbulb, RefreshCw, Download } from 'lucide-react';

const promptTypes = [
  { id: 'community', label: 'Community Engagement', icon: Users, description: 'Start conversations with your audience' },
  { id: 'storytelling', label: 'Story Prompts', icon: MessageCircle, description: 'Share personal stories and experiences' },
  { id: 'educational', label: 'Educational Q&A', icon: Lightbulb, description: 'Teach and inform your audience' },
  { id: 'interactive', label: 'Interactive Polls', icon: RefreshCw, description: 'Create polls and challenges' }
];

const platforms = [
  { name: 'Instagram Stories', emoji: '📸' },
  { name: 'TikTok Comments', emoji: '🎵' },
  { name: 'YouTube Community', emoji: '📺' },
  { name: 'Twitter/X', emoji: '🐦' },
  { name: 'LinkedIn', emoji: '💼' }
];

export default function ChatPromptsModal({ onClose }) {
  const [formData, setFormData] = useState({
    niche: '',
    audience: '',
    promptType: '',
    platform: ''
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompts, setPrompts] = useState([]);
  const [showToast, setShowToast] = useState('');
  const [historyId, setHistoryId] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return formData.niche.trim() && 
           formData.audience.trim() && 
           formData.promptType && 
           formData.platform;
  };

  const handleGenerate = async () => {
    if (!isFormValid()) return;
    
    setIsGenerating(true);
    setPrompts([]);

    const promptTypeInfo = promptTypes.find(t => t.id === formData.promptType);

    try {
      const prompt = `You are an expert community manager and social media strategist. Create engaging chat prompts that will spark meaningful conversations and boost engagement.

**CONTEXT:**
Niche: "${formData.niche}"
Target Audience: "${formData.audience}"
Prompt Type: ${promptTypeInfo?.label}
Platform: ${formData.platform}

**PROMPT TYPE STRATEGY:**
${getPromptTypeStrategy(formData.promptType)}

**PLATFORM GUIDELINES:**
${getPlatformGuidelines(formData.platform)}

**REQUIREMENTS:**
Generate exactly 8 unique, engaging prompts that:
1. Are specific to the niche and audience
2. Encourage genuine interaction and responses
3. Feel natural and conversational (not corporate or robotic)
4. Are optimized for ${formData.platform}'s format and culture
5. Match the ${promptTypeInfo?.label} category

For each prompt, provide:
- **prompt_text**: The actual prompt/question (conversational and engaging)
- **context**: 1 sentence explaining why this will drive engagement
- **response_starter**: An optional example response or follow-up to show how to engage

**QUALITY STANDARDS:**
- Make them feel authentic and personal, not generic
- Use language that resonates with ${formData.audience}
- Consider trending conversation styles on ${formData.platform}
- Create prompts that make people WANT to respond
- Avoid overused questions or clichés

Generate prompts that feel like they come from a real person who understands the community.`;

      const response = await apiClient.integrations.Core.InvokeLLMwithLogging({
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
                  context: { type: "string" },
                  response_starter: { type: "string" }
                },
                required: ["prompt_text", "context", "response_starter"]
              },
              minItems: 8,
              maxItems: 8
            }
          }
        }
      });

      const promptsWithIds = response.prompts?.map(p => ({ ...p, id: Math.random(), isSaved: false })) || [];
      setPrompts(promptsWithIds);
      
      // Save to ContentHistory
      try {
        const promptTypeInfo = promptTypes.find(t => t.id === formData.promptType);
        const history = await apiClient.entities.ContentHistory.create({
          tool_type: 'tiny_prompt',
          topic: formData.niche,
          content_type: formData.platform,
          custom_instructions: `Audience: ${formData.targetAudience}\nType: ${promptTypeInfo?.label}`,
          generated_content: promptsWithIds.map(p => ({
            title: p.prompt_text,
            content: p.context,
            style_notes: p.response_starter
          })),
          variations_count: promptsWithIds.length
        });
        setHistoryId(history.id);
      } catch (err) {
        console.error('Failed to save to history:', err);
      }
    } catch (error) {
      console.error('Error generating prompts:', error);
      showToastMessage('Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getPromptTypeStrategy = (type) => {
    const strategies = {
      'community': 'Create prompts that foster connection, shared experiences, and community bonding. Focus on relatability and inclusive language that makes everyone feel welcome to participate.',
      'storytelling': 'Generate prompts that encourage authentic personal stories and experiences. Make people feel comfortable sharing vulnerable or memorable moments.',
      'educational': 'Develop prompts that position you as a helpful expert while inviting questions and curiosity. Balance teaching with genuine dialogue.',
      'interactive': 'Create prompts that are fun, game-like, and encourage quick participation. Think polls, this-or-that, challenges, or quick debates.'
    };
    return strategies[type] || 'Create engaging, conversation-starting prompts.';
  };

  const getPlatformGuidelines = (platform) => {
    const guidelines = {
      'Instagram Stories': 'Use emoji-friendly, visually-oriented language. Keep it casual and consider story stickers (polls, questions, sliders). Think quick, tap-friendly engagement.',
      'TikTok Comments': 'Short, snappy, and trend-aware. Use current slang appropriately. Create prompts that fit TikTok\'s playful, fast-paced culture.',
      'YouTube Community': 'More detailed and discussion-oriented. Audience expects thoughtful engagement. Can be longer and more nuanced.',
      'Twitter/X': 'Concise, debate-worthy, and shareable. Create conversation starters that work in 280 characters and encourage quote tweets.',
      'LinkedIn': 'Professional yet personable. Focus on career insights, industry discussions, and professional development. Avoid being too casual.'
    };
    return guidelines[platform] || 'Optimize for the selected platform\'s communication style.';
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showToastMessage('Copied to clipboard');
    } catch (err) {
      showToastMessage('Failed to copy');
    }
  };

  const handleSave = async (prompt) => {
    try {
      await apiClient.entities.LibraryItem.create({
        type: 'hook',
        platform_or_style: formData.platform,
        content: `${prompt.prompt_text}\n\nContext: ${prompt.context}\nExample: ${prompt.response_starter}`,
        source_module: 'Tiny Prompt',
        title: prompt.prompt_text.substring(0, 60) + '...'
      });
      setPrompts(prompts => prompts.map(p => p.id === prompt.id ? { ...p, isSaved: true } : p));
      showToastMessage('Saved to Library');
    } catch (error) {
      console.error('Failed to save:', error);
      showToastMessage('Failed to save');
    }
  };

  const handleExportAll = async () => {
    const exportText = prompts.map((p, i) => 
      `${i + 1}. ${p.prompt_text}\n   Context: ${p.context}\n   Example: ${p.response_starter}\n`
    ).join('\n');
    
    try {
      await navigator.clipboard.writeText(exportText);
      showToastMessage('All prompts exported to clipboard');
    } catch (error) {
      showToastMessage('Failed to export');
    }
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
          <div>
            <h2 className="text-gray-900" style={{ fontSize: '32px', fontWeight: 700 }}>
              Tiny Prompt
            </h2>
            <p className="text-gray-600 mt-1 subtitle">Generate engaging prompts to spark conversations with your audience</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-900 mb-2 font-medium subtitle">Your Niche*</label>
              <input
                type="text"
                value={formData.niche}
                onChange={(e) => handleInputChange('niche', e.target.value)}
                placeholder="e.g., Fitness, Tech reviews, Travel vlogs"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ backgroundColor: '#F9FAFB' }}
              />
            </div>

            <div>
              <label className="block text-gray-900 mb-2 font-medium subtitle">Target Audience*</label>
              <input
                type="text"
                value={formData.audience}
                onChange={(e) => handleInputChange('audience', e.target.value)}
                placeholder="e.g., Busy professionals, College students"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ backgroundColor: '#F9FAFB' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-900 mb-3 font-medium subtitle">Prompt Type*</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {promptTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleInputChange('promptType', type.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    formData.promptType === type.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <type.icon className={`w-5 h-5 mt-0.5 ${formData.promptType === type.id ? 'text-blue-600' : 'text-gray-500'}`} />
                    <div>
                      <div className="font-semibold text-gray-900">{type.label}</div>
                      <div className="text-sm text-gray-600 mt-1">{type.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-gray-900 mb-3 font-medium subtitle">Platform*</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {platforms.map((platform) => (
                <button
                  key={platform.name}
                  onClick={() => handleInputChange('platform', platform.name)}
                  className={`py-3 px-4 rounded-xl border-2 transition-all text-center ${
                    formData.platform === platform.name
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{platform.emoji}</div>
                  <div className="text-xs font-medium text-gray-900">{platform.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <button
            onClick={handleGenerate}
            disabled={!isFormValid() || isGenerating}
            className="px-8 py-3 bg-cyan-500 text-white font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-600 transition-colors"
          >
            {isGenerating ? 'Generating Prompts...' : 'Generate 8 Prompts'}
          </button>
        </div>

        {(prompts.length > 0 || isGenerating) && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Generated Prompts</h3>
              {prompts.length > 0 && (
                <button
                  onClick={handleExportAll}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export All
                </button>
              )}
            </div>

            <div className="space-y-4">
              {isGenerating ? (
                Array(8).fill(0).map((_, i) => (
                  <div key={i} className="p-4 border border-gray-200 rounded-xl animate-pulse">
                    <div className="h-5 bg-gray-200 rounded mb-3 w-3/4"></div>
                    <div className="h-4 bg-gray-100 rounded mb-2 w-full"></div>
                    <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                  </div>
                ))
              ) : (
                prompts.map((prompt, index) => (
                  <div key={prompt.id} className="p-5 border border-gray-200 rounded-xl bg-white hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-gray-400 font-bold text-sm mt-0.5">{index + 1}</span>
                      <div className="flex-1">
                        <p className="text-gray-900 font-semibold text-lg leading-snug mb-2">
                          {prompt.prompt_text}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Why it works:</span> {prompt.context}
                        </p>
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mt-3">
                          <p className="text-xs text-blue-700 font-medium mb-1">Example Response:</p>
                          <p className="text-sm text-blue-900 italic">"{prompt.response_starter}"</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleCopy(prompt.prompt_text)}
                        className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors flex items-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </button>
                      <button
                        onClick={() => handleSave(prompt)}
                        disabled={prompt.isSaved}
                        className={`px-3 py-1.5 text-xs rounded-full transition-colors flex items-center gap-1.5 ${
                          prompt.isSaved
                            ? 'bg-green-100 text-green-700 cursor-not-allowed'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        {prompt.isSaved ? '✓ Saved' : 'Save'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {prompts.length === 0 && !isGenerating && (
          <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
            <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-500">Fill in all fields to generate engaging chat prompts</p>
          </div>
        )}
      </div>

      {showToast && (
        <div className="fixed bottom-5 right-5 bg-gray-900 text-white px-5 py-2.5 rounded-lg shadow-lg text-sm font-medium z-50">
          {showToast}
        </div>
      )}
    </div>
  );
}
