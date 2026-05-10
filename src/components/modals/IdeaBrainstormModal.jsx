import React, { useState } from 'react';
import { apiClient } from '@/apis/client';
import { X, Copy, RefreshCw, CornerDownRight } from 'lucide-react';

export default function IdeaBrainstormModal({ onClose, initialData }) {
  const [formData, setFormData] = useState({
    seedIdea: initialData?.topic || '',
    targetAudience: initialData?.audience || '',
    topicTheme: initialData?.theme || '',
    primaryPlatform: initialData?.platform || '',
    toneStyle: initialData?.tone || '',
    goalIntent: initialData?.goal || ''
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [concepts, setConcepts] = useState([]);
  const [showToast, setShowToast] = useState('');
  const [historyId, setHistoryId] = useState(null);

  const [activeIndex, setActiveIndex] = useState(null);
  const [expandedContent, setExpandedContent] = useState(null);
  const [isExpanding, setIsExpanding] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return formData.seedIdea.trim() &&
           formData.targetAudience.trim() &&
           formData.topicTheme.trim() &&
           formData.primaryPlatform &&
           formData.toneStyle;
  };

  const handleGenerate = async () => {
    if (!isFormValid()) return;
    
    setIsGenerating(true);
    setConcepts([]);
    setActiveIndex(null);
    setExpandedContent(null);

    try {
      const prompt = `You are a world-class creative strategist and content consultant. A client has hired you to brainstorm innovative content concepts. You must generate 8 distinct, high-quality content ideas based on their strategic brief.

**CLIENT BRIEF:**
• Core Topic: "${formData.seedIdea}"
• Target Audience: "${formData.targetAudience}"
• Content Category: "${formData.topicTheme}"
• Primary Platform: "${formData.primaryPlatform}"
• Brand Voice: "${formData.toneStyle}"
${formData.goalIntent ? `• Strategic Goal: "${formData.goalIntent}"` : ''}

**PLATFORM-SPECIFIC REQUIREMENTS:**
${getPlatformGuidelines(formData.primaryPlatform)}

**AUDIENCE PSYCHOLOGY:**
${getAudienceInsights(formData.targetAudience)}

**STRATEGIC APPROACH:**
1. Each concept must be tailored specifically for ${formData.targetAudience} on ${formData.primaryPlatform}
2. Concepts should reflect a ${formData.toneStyle.toLowerCase()} voice and approach
3. Focus on ${formData.topicTheme} while staying true to the core idea: "${formData.seedIdea}"
${formData.goalIntent ? `4. Optimize for ${formData.goalIntent.toLowerCase()} as the primary objective` : ''}

**DELIVERABLES:**
Generate exactly 8 unique content concepts. Each concept must include:

1. **Title**: A compelling, platform-optimized title (3-10 words)
2. **Pitch**: A strategic one-sentence explanation of why this concept will resonate with your target audience and achieve the goal
3. **Tags**: 2-3 specific content categories or themes that align with the concept

**QUALITY STANDARDS:**
- Ideas must be actionable and specific (not generic)
- Each concept should approach the topic from a different strategic angle
- Consider trending formats and content types for ${formData.primaryPlatform}
- Ensure concepts match the ${formData.toneStyle.toLowerCase()} tone throughout
- Think like a content strategist who understands audience psychology and platform algorithms

Generate concepts that feel fresh, strategic, and ready to execute.`;

      const response = await apiClient.integrations.Core.InvokeLLMwithLogging({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            concepts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  pitch: { type: "string" },
                  tags: { type: "array", items: { type: "string" } }
                },
                required: ["title", "pitch", "tags"]
              },
              minItems: 8,
              maxItems: 8
            }
          }
        }
      });

      const conceptsWithIds = response.concepts?.map(c => ({...c, id: Math.random()})) || [];
      setConcepts(conceptsWithIds);
      
      // Save to ContentHistory
      try {
        const history = await apiClient.entities.ContentHistory.create({
          tool_type: 'idea_brainstorm',
          topic: formData.seedIdea,
          content_type: formData.primaryPlatform,
          tone: formData.toneStyle,
          custom_instructions: `Audience: ${formData.targetAudience}\nTheme: ${formData.topicTheme}\nGoal: ${formData.goalIntent}`,
          generated_content: conceptsWithIds.map(c => ({
            title: c.title,
            content: c.pitch,
            style_notes: c.tags?.join(', ')
          })),
          variations_count: conceptsWithIds.length
        });
        setHistoryId(history.id);
      } catch (err) {
        console.error('Failed to save to history:', err);
      }
    } catch (error) {
      console.error('Error generating concepts:', error);
      showToastMessage('Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper function to provide platform-specific guidelines
  const getPlatformGuidelines = (platform) => {
    const guidelines = {
      'YouTube': 'Focus on longer-form, educational or entertainment content. Titles should be search-friendly and curiosity-driven. Consider series potential and subscriber retention.',
      'TikTok': 'Prioritize viral potential, trending sounds/effects, quick hooks, and scroll-stopping visuals. Content should be snackable and shareable.',
      'Instagram': 'Emphasize visual storytelling, aesthetic appeal, and engagement-driving captions. Consider both feed posts and Stories/Reels formats.',
      'LinkedIn': 'Professional tone, industry insights, thought leadership, and networking value. Focus on career growth, business insights, and professional development.',
      'Twitter/X': 'Concise, conversation-starting content. Focus on real-time commentary, threads, and community engagement. Optimize for retweets and replies.'
    };
    return guidelines[platform] || 'Tailor content for the selected platform\'s unique audience and format preferences.';
  };

  // Helper function to provide audience insights
  const getAudienceInsights = (audience) => {
    const insights = {
      'Gen Z': 'Values authenticity, social causes, quick entertainment, and peer validation. Responds to trending formats, inclusive content, and behind-the-scenes authenticity.',
      'Professionals': 'Seeks career advancement, industry insights, networking opportunities, and practical knowledge. Values expertise, credibility, and time-efficient content.',
      'Parents': 'Prioritizes family-related content, time-saving solutions, parenting tips, and content they can consume during limited free time.',
      'Gamers': 'Interested in gameplay tips, industry news, gaming culture, and competitive content. Values skill improvement and community connection.',
      'Small Business Owners': 'Needs practical business advice, growth strategies, cost-effective solutions, and networking opportunities. Values actionable insights and ROI-focused content.'
    };
    
    // If exact match not found, provide general guidance
    return insights[audience] || `Understand the unique needs, challenges, and interests of ${audience}. Consider their content consumption habits, preferred communication style, and key motivators.`;
  };

  const handleCardClick = (index) => {
    if (activeIndex === index) {
      setActiveIndex(null); // Toggle off if already active
      setExpandedContent(null);
    } else {
      setActiveIndex(index);
      setExpandedContent(null);
    }
  };

  const handleGenerateSimilar = async (concept, e) => {
    e.stopPropagation();
    setActiveIndex(null);
    setIsExpanding(true);
    try {
      const res = await apiClient.integrations.Core.InvokeLLMwithLogging({
        prompt: `Generate 4 more unique concepts similar to this one: "${concept.title} - ${concept.pitch}". Use the same JSON format (title, pitch, tags).`,
        response_json_schema: {
          type: "object",
          properties: { concepts: { type: "array", items: { type: "object", properties: { title: { type: "string" }, pitch: { type: "string" }, tags: { type: "array", items: { type: "string" } } } } } }
        }
      });
      if (res.concepts) {
        setConcepts(prev => [...prev, ...res.concepts.map(c => ({...c, id: Math.random()}))]);
        showToastMessage('Added 4 similar ideas!');
      }
    } catch (err) { showToastMessage('Failed to generate similar ideas.'); }
    finally { setIsExpanding(false); }
  };

  const handleDevelopFurther = async (concept, e) => {
    e.stopPropagation();
    setIsExpanding(true);
    try {
      const res = await apiClient.integrations.Core.InvokeLLMwithLogging({
        prompt: `You are a creative strategist. Develop this idea: "${concept.title} - ${concept.pitch}". Provide a potential hook, 3-5 key talking points, and a call to action.`,
        response_json_schema: {
          type: 'object',
          properties: {
            hook: { type: 'string' },
            talking_points: { type: 'array', items: { type: 'string' } },
            cta: { type: 'string' }
          },
          required: ['hook', 'talking_points', 'cta']
        }
      });
      setExpandedContent(res);
    } catch (err) { showToastMessage('Failed to develop idea.'); }
    finally { setIsExpanding(false); }
  };
  
  const handleCopy = async (text, e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      showToastMessage('Copied');
    } catch (error) { console.error('Failed to copy:', error); }
  };

  const showToastMessage = (message) => {
    setShowToast(message);
    setTimeout(() => setShowToast(''), 2000);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const renderInputField = (label, name, placeholder) => (
    <div>
        <label className="block text-base font-medium text-gray-900 mb-2 subtitle">{label}</label>
        <input
            type="text"
            name={name}
            value={formData[name]}
            onChange={(e) => handleInputChange(name, e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ backgroundColor: '#F4F5F2' }}
        />
    </div>
  );

  const renderSelectField = (label, name, options, placeholder) => (
      <div>
          <label className="block text-base font-medium text-gray-900 mb-2 subtitle">{label}</label>
          <select
              name={name}
              value={formData[name]}
              onChange={(e) => handleInputChange(name, e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none"
              style={{ backgroundColor: '#F4F5F2' }}
          >
              <option value="">{placeholder}</option>
              {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
      </div>
  );

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(10, 10, 10, 0.28)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white max-w-4xl w-full mx-4 shadow-xl max-h-[90vh] overflow-auto"
        style={{ 
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 
            className="text-gray-900"
            style={{ 
              fontSize: '32px', 
              fontWeight: 700,
            }}
          >
            Idea Brainstorm
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Input */}
        <div className="mb-8 space-y-6">
          {renderInputField('Seed Idea*', 'seedIdea', 'Enter your core idea or topic…')}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderInputField('Target Audience*', 'targetAudience', 'e.g., Gen Z, Professionals, Parents')}
            {renderInputField('Topic / Theme*', 'topicTheme', 'e.g., Productivity, Fitness, Comedy')}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderSelectField('Primary Platform*', 'primaryPlatform', ['YouTube', 'TikTok', 'Instagram', 'LinkedIn', 'Twitter/X'], 'Select a platform...')}
              {renderSelectField('Tone / Style*', 'toneStyle', ['Professional', 'Friendly', 'Funny', 'Inspirational', 'Educational', 'Casual'], 'Select a tone...')}
              {renderSelectField('Goal or Intent', 'goalIntent', ['Engagement', 'Education', 'Awareness', 'Sales/Conversion', 'Entertainment'], 'Optional: Select a goal...')}
          </div>
        </div>

        {/* Generate Button */}
        <div className="text-center mb-8">
          <button
            onClick={handleGenerate}
            disabled={!isFormValid() || isGenerating}
            className="px-6 py-3 rounded-full font-bold text-white text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{
              backgroundColor: isFormValid() ? '#7F93F8' : '#9CA3AF',
              borderRadius: '999px',
              height: '44px',
              paddingLeft: '24px',
              paddingRight: '24px'
            }}
          >
            {isGenerating || isExpanding ? 'Generating...' : 'Generate Concepts'}
          </button>
        </div>

        {/* Results Grid */}
        {(concepts.length > 0 || isGenerating) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isGenerating ? (
              Array(8).fill(0).map((_, i) => (
                <div 
                  key={i}
                  className="p-4 border border-gray-200 rounded-xl animate-pulse"
                >
                  <div className="h-5 bg-gray-200 rounded mb-2 w-3/4"></div>
                  <div className="h-4 bg-gray-100 rounded mb-3"></div>
                  <div className="flex gap-2">
                    <div className="h-4 w-12 bg-gray-100 rounded"></div>
                    <div className="h-4 w-16 bg-gray-100 rounded"></div>
                  </div>
                </div>
              ))
            ) : (
              concepts.map((concept, index) => (
                <div 
                  key={concept.id}
                  className={`p-4 border rounded-xl transition-all duration-300 cursor-pointer ${activeIndex === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                  onClick={() => handleCardClick(index)}
                >
                  <h3 className="font-bold text-gray-900 mb-2">{concept.title}</h3>
                  <p className="text-sm text-gray-700 mb-3 leading-relaxed">{concept.pitch}</p>
                  
                  {concept.tags && concept.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {concept.tags.map((tag, tagIndex) => (
                        <span 
                          key={tagIndex}
                          className="px-2 py-1 text-black text-xs font-medium rounded"
                          style={{ backgroundColor: '#eafa7a' }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {activeIndex === index && (
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <div className="flex gap-2 mb-4">
                        <button
                          onClick={(e) => handleGenerateSimilar(concept, e)}
                          className="px-3 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full transition-colors flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Generate similar
                        </button>
                        <button
                          onClick={(e) => handleDevelopFurther(concept, e)}
                          className="px-3 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full transition-colors flex items-center gap-1.5"
                        >
                          <CornerDownRight className="w-3 h-3" />
                          Develop further
                        </button>
                      </div>

                      {isExpanding && <p className="text-sm text-gray-600">Developing...</p>}
                      
                      {expandedContent && (
                        <div className="text-sm space-y-2 text-gray-800 bg-white p-3 rounded-md">
                          <p><strong>Hook:</strong> {expandedContent.hook}</p>
                          <div><strong>Talking Points:</strong>
                            <ul className="list-disc list-inside ml-2">
                              {expandedContent.talking_points?.map((point, i) => <li key={i}>{point}</li>)}
                            </ul>
                          </div>
                          <p><strong>CTA:</strong> {expandedContent.cta}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg">
          {showToast}
        </div>
      )}
    </div>
  );
}
