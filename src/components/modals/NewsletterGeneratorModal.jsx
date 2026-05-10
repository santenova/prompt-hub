import React, { useState } from 'react';
import { apiClient } from '@/apis/client';
import { X, Star, Copy } from 'lucide-react';
import { DateTime } from 'luxon';

export default function NewsletterGeneratorModal({ onClose, initialData }) {
  const NEWSLETTER_COUNT = 31; // Configure number of newsletters to generate
  
  const [formData, setFormData] = useState({
    userInput: initialData?.content || '',
    targetAudience: initialData?.audience || '',
    toneStyle: initialData?.tone || '',
    customAudience: '',
    customTone: ''
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNewsletters, setGeneratedNewsletters] = useState([]);
  const [showToast, setShowToast] = useState('');
  const [historyId, setHistoryId] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    const hasContent = formData.userInput.trim();
    const hasAudience = formData.targetAudience && (formData.targetAudience !== 'Other' || formData.customAudience.trim());
    const hasTone = formData.toneStyle && (formData.toneStyle !== 'Other' || formData.customTone.trim());
    
    return hasContent && hasAudience && hasTone;
  };

  const applySecondaryPrompt = async (newsletters, audience, topic) => {
    try {
      const refinedItems = await Promise.all(
        newsletters.map(async (item) => {
          const refinementResponse = await apiClient.integrations.Core.InvokeLLM({
            prompt: `You are an expert newsletter copywriter. Take this newsletter idea and Create a complete structured newsletter for:
      
      Title: "${item.title}"
      Description: "${item.description}"
      
      Context:
      - Field: ${topic}
      - Audience: ${audience}
      - Tone: {tone}
      - Topics: AI, ${topic}
      
      Generate:
      1. A compelling email subject line
      2. An intro_text (2-3 sentences introducing the newsletter)
      3. EXACTLY 4 feature_blocks (this is mandatory), each with:
         - icon (use relevant emojis like 🚀, 💡, 📊, 🔧, 💼, 🎯, 📈, 🛠️, 🌟, 🔍, etc.)
         - title (short, punchy headline - max 6 words)
         - description (2-3 sentences explaining the feature/topic in detail)
      4. call_to_action_text (engaging button text)
      5. call_to_action_url (use placeholder like \"https://prompt.only-agent.ai/aicontentgenerator\")
      
      IMPORTANT: You must generate exactly 4 feature blocks. Each feature should be valuable, actionable, and engaging for the target audience.`,
      response_json_schema:{"type":"object","properties":{"subject":{"type":"string"},"intro_text":{"type":"string"},"feature_blocks":{"type":"array","minItems":4,"maxItems":4,"items":{"type":"object","properties":{"icon":{"type":"string"},"title":{"type":"string"},"description":{"type":"string"}},"required":["icon","title","description"]}},"call_to_action_text":{"type":"string"},"call_to_action_url":{"type":"string"}},"required":["subject","intro_text","feature_blocks","call_to_action_text","call_to_action_url"]}});
      



          return {
            ...item,
            ...refinementResponse
          };
        })
      );
      return refinedItems;
    } catch (error) {
      console.error('Error in secondary refinement:', error);
      return newsletters;
    }
  };

  const handleGenerate = async () => {
    if (!isFormValid()) return;
    
    setIsGenerating(true);
    setGeneratedNewsletters([]);

    try {
      const audience = formData.targetAudience === 'Other' ? formData.customAudience : formData.targetAudience;
      const tone = formData.toneStyle === 'Other' ? formData.customTone : formData.toneStyle;

      const date = DateTime.now().setZone('Europe/Berlin');
      console.log(date.toString()); // Date in Berlin time zone


      const response = await apiClient.integrations.Core.InvokeLLM({
        prompt: `Generate a monthly content plan for a newsletter


**CONTENT ANALYSIS:**
Content Description: "${formData.userInput}"

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
Create exactly ${NEWSLETTER_COUNT} newsletter content ideas that are:
1. **Platform-Native**: Written specifically for ${formData.primaryPlatform}'s format and culture
2. **Audience-Targeted**: Speak directly to ${audience}'s interests, pain points, and language
3. **Tone-Consistent**: Reflect a ${tone.toLowerCase()} voice throughout
4. **Conversion-Focused**: Designed to stop scrolling and compel viewing
5. **Content-Grounded**: Directly tied to the provided content description

**CONTENT CATEGORIES TO EXPLORE:**
- Educational/How-To content
- Industry News & Trends
- Case Studies & Success Stories
- Expert Interviews
- Product/Service Highlights
- Behind-the-Scenes content
- Tips & Best Practices
- Community Spotlights
- Problem/Solution content
- Thought Leadership pieces

**DELIVERABLES:**
For each newsletter idea, provide:
• **title**: Compelling newsletter title
• **description**: Brief 1-2 sentence description
• **emoji**: Relevant emoji
• **scheduled_date**: Suggested publication date (format: YYYY-MM-DD)
• **text**: Preview text for the newsletter
• **strategy**: Why this topic resonates with ${audience}
• **hook_type**: The category/style of content

**QUALITY STANDARDS:**
- Ensure variety across all ${NEWSLETTER_COUNT} ideas covering different aspects of the topic
- Each idea should be unique and valuable
- Consider seasonal relevance and timing
- Match the ${tone.toLowerCase()} brand voice consistently
- Make each title compelling and click-worthy


Generate ${NEWSLETTER_COUNT} newsletter ideas with:
- Engaging title
- Brief description (1-2 sentences)
- Relevant emoji
- Suggested publication date after: ${date.toFormat('yyyy-MM-dd')}

Make each idea unique, valuable, and actionable for the target audience.


`,

        response_json_schema: {
          type: "object",
          properties: {
            newsletters: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  strategy: { type: "string" },
                  hook_type: { type: "string" },  
                  title: { type: "string" },
                  description: { type: "string" },
                  emoji: { type: "string" },
                  scheduled_date: { type: "string" }
                },
                required: ["text", "strategy", "hook_type","title", "description", "emoji", "scheduled_date"]
              },
              minItems: NEWSLETTER_COUNT,
              maxItems: NEWSLETTER_COUNT
            }
          }
        }
      });
      
      const newslettersWithData = response.newsletters.map(n => ({ 
        ...n, 
        id: Math.random(), 
        isFavorited: false
      }));

      // Apply secondary refinement prompt to each newsletter
      const refinedNewsletters = await applySecondaryPrompt(newslettersWithData, audience, formData.userInput);

      console.log(refinedNewsletters.map(n => ({
            title: n.title,
            content: n.description,
            style_notes: n.scheduled_date
          })));
      setGeneratedNewsletters(refinedNewsletters);
      

      // Save to ContentHistory
       try {
         const history = await apiClient.entities.ContentHistory.create({
           tool_type: 'newsletter_generator',
           topic: formData.userInput,
           tone: tone,
           custom_instructions: `Audience: ${audience}`,
           generated_content: refinedNewsletters.map(n => ({
             title: n.title,
             content: n.description,
             style_notes: n.scheduled_date
           })),
           variations_count: refinedNewsletters.length
         });
         setHistoryId(history.id);
       } catch (err) {
         console.error('Failed to save to history:', err);
       }

    } catch (error) {
      console.error('Error generating newsletters:', error);
      showToastMessage('Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };



  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showToastMessage('Copied');
    } catch (err) {
      showToastMessage('Failed to copy');
    }
  };

  const handleSave = async (newsletter) => {
    try {
      await apiClient.entities.LibraryItem.create({
        type: 'newsletter',
        platform_or_style: formData.toneStyle === 'Other' ? formData.customTone : formData.toneStyle,
        content: `${newsletter.emoji} ${newsletter.title}\n\n${newsletter.description}`,
        source_module: 'Newsletter Generator',
        title: newsletter.title
      });
      showToastMessage('Saved to Library');
    } catch (error) {
      console.error('Failed to save:', error);
      showToastMessage('Failed to save');
    }
  };
  
  const toggleFavorite = (id) => {
    setGeneratedNewsletters(newsletters => 
      newsletters.map(n => n.id === id ? { ...n, isFavorited: !n.isFavorited } : n)
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
        className="bg-white max-w-3xl w-full mx-4 shadow-xl max-h-[90vh] overflow-auto"
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
            Newsletter Generator
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-6 mb-8">
          <div>
            <label 
              className="block text-gray-900 mb-2 subtitle"
              style={{ 
                fontSize: '16px', 
                fontWeight: 500,
              }}
            >
              Newsletter Topic*
            </label>
            <textarea
              value={formData.userInput}
              onChange={(e) => handleInputChange('userInput', e.target.value)}
              placeholder="E.g., AI tools and productivity tips for content creators..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label 
                className="block text-gray-900 mb-2 subtitle"
                style={{ 
                  fontSize: '16px', 
                  fontWeight: 500,
                }}
              >
                Target Audience*
              </label>
              <select
                value={formData.targetAudience}
                onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
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
              <label 
                className="block text-gray-900 mb-2 subtitle"
                style={{ 
                  fontSize: '16px', 
                  fontWeight: 500,
                }}
              >
                Tone / Style*
              </label>
              <select
                value={formData.toneStyle}
                onChange={(e) => handleInputChange('toneStyle', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
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
            {isGenerating ? 'Generating...' : 'Generate Newsletter Ideas'}
          </button>
        </div>

        {/* Results */}
        {(generatedNewsletters.length > 0 || isGenerating) && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Generated Newsletter Ideas</h3>
            </div>

            <div className="space-y-3">
              {isGenerating ? (
                Array(NEWSLETTER_COUNT).fill(0).map((_, i) => (
                  <div 
                    key={i}
                    className="p-4 border border-gray-200 rounded-xl animate-pulse"
                  >
                    <div className="h-5 bg-gray-200 rounded mb-2 w-3/4"></div>
                    <div className="h-4 bg-gray-100 rounded mb-3"></div>
                    <div className="flex gap-2">
                      <div className="h-4 w-20 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                ))
              ) : (
                generatedNewsletters.map((newsletter, index) => (
                  <div 
                    key={newsletter.id}
                    className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-2xl">{newsletter.emoji}</span>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 mb-1">{newsletter.title}</h4>
                        <p className="text-sm text-gray-700 leading-relaxed">{newsletter.description}</p>
                        
                        {newsletter.subject && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="mb-2">
                              <p className="text-xs font-semibold text-purple-600 mb-1">📧 Email Subject</p>
                              <p className="text-sm font-medium text-gray-800">{newsletter.subject}</p>
                            </div>
                            
                            <div className="mb-3">
                              <p className="text-xs font-semibold text-purple-600 mb-1">✍️ Intro</p>
                              <p className="text-sm text-gray-700">{newsletter.intro_text}</p>
                            </div>
                            
                            {newsletter.feature_blocks && newsletter.feature_blocks.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-purple-600 mb-1">📦 Features</p>
                                {newsletter.feature_blocks.map((block, idx) => (
                                  <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                                    <div className="flex items-start gap-2">
                                      <span className="text-lg">{block.icon}</span>
                                      <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-900">{block.title}</p>
                                        <p className="text-xs text-gray-600 mt-1">{block.description}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {newsletter.call_to_action_text && (
                              <div className="mt-3">
                                <p className="text-xs font-semibold text-purple-600 mb-1">🎯 Call to Action</p>
                                <p className="text-sm font-medium text-blue-600">{newsletter.call_to_action_text}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span 
                        className="px-2 py-1 text-xs font-medium rounded"
                        style={{ backgroundColor: '#eafa7a', color: '#000' }}
                      >
                        📅 {newsletter.scheduled_date}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleFavorite(newsletter.id)}
                          className="hover:scale-110 transition-transform"
                        >
                          <Star 
                            className={`w-4 h-4 ${newsletter.isFavorited ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                          />
                        </button>
                        
                        <button
                          onClick={() => handleCopy(`${newsletter.emoji} ${newsletter.title}\n\n${newsletter.description}`)}
                          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleSave(newsletter)}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {generatedNewsletters.length === 0 && !isGenerating && (
          <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-gray-500">Fill in all required fields to generate newsletter ideas.</p>
          </div>
        )}
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-60">
          {showToast}
        </div>
      )}
    </div>
  );
}
