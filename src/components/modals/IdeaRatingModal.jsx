import React, { useState } from 'react';
import { apiClient } from '@/apis/client';
import { X, Upload, Star, TrendingUp, Zap, MessageSquare, Edit } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const priorityGoals = [
  { id: 'growth', label: 'Growth', icon: TrendingUp },
  { id: 'engagement', label: 'Engagement', icon: MessageSquare },
  { id: 'authority', label: 'Brand Authority', icon: Zap },
  { id: 'monetization', label: 'Monetization', icon: Zap } // Using Zap for Monetization as well
];

const platformIcons = {
  'TikTok': '🎵',
  'YouTube Shorts': '🎬', 
  'Instagram Reels': '📷',
  'X': '🐦',
  'YouTube': '📺',
  'LinkedIn': '💼'
};

const verdictInfo = {
  'Strong': { icon: '✅', color: 'text-green-600', bgColor: 'bg-green-50' },
  'Needs Work': { icon: '⚠️', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  'Weak': { icon: '❌', color: 'text-red-600', bgColor: 'bg-red-50' },
};

export default function IdeaRatingModal({ onClose, initialData }) {
  const [formData, setFormData] = useState({
    ideas: initialData?.ideas || '',
    niche: initialData?.niche || '',
    priorityGoals: [],
    script: ''
  });
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [ratedIdeas, setRatedIdeas] = useState([]);
  const [showToast, setShowToast] = useState('');
  const [historyId, setHistoryId] = useState(null);

  const { data: brainstormIdeas } = useQuery({
    queryKey: ['libraryItems', 'concept'],
    queryFn: () => apiClient.entities.LibraryItem.filter({ type: 'concept' }),
    initialData: []
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGoalToggle = (goalId) => {
    setFormData(prev => ({
      ...prev,
      priorityGoals: prev.priorityGoals.includes(goalId)
        ? prev.priorityGoals.filter(g => g !== goalId)
        : [...prev.priorityGoals, goalId]
    }));
  };

  const importBrainstormIdeas = () => {
    const ideas = brainstormIdeas.map(item => item.title || item.content.split('\n')[0]).join('\n');
    handleInputChange('ideas', formData.ideas ? `${formData.ideas}\n${ideas}` : ideas);
    showToastMessage('Imported ideas from Brainstorm');
  };

  const handleAnalyzeIdeas = async () => {
    const ideasList = formData.ideas.split('\n').filter(idea => idea.trim());
    if (ideasList.length === 0) return;

    setIsAnalyzing(true);
    setRatedIdeas([]);

    try {
      const prompt = `You are a professional creative strategist and content mentor reviewing a list of video ideas for a creator. Adopt an insightful, direct, and encouraging tone. Avoid generic AI phrasing.

The creator's niche is: "${formData.niche || 'general content'}"
Their priority goals are: ${formData.priorityGoals.length > 0 ? formData.priorityGoals.join(', ') : 'general growth'}
${formData.script ? `Here's some context from their script/outline: "${formData.script.substring(0, 1000)}..."` : ''}

Please review the following content ideas:
${ideasList.map((idea, i) => `${i + 1}. ${idea}`).join('\n')}

For each idea, provide a detailed review based on: Clarity, Audience Resonance, Novelty, Hook Strength, Virality, Effort vs Payoff, and Cross-Platform Adaptability.

Your output for EACH idea must be a JSON object with these fields:
1.  **original_idea**: The exact idea text you are reviewing.
2.  **verdict**: Your overall rating. Must be one of: "Strong", "Needs Work", or "Weak".
3.  **feedback**: 2-3 sentences of professional, mentor-like feedback explaining the strengths and weaknesses.
4.  **suggestions**: An array of 1 or 2 stronger, rewritten versions of the idea.
5.  **platform_fit**: An array of platform names where this would work best (e.g., ["TikTok", "YouTube Shorts"]).
6.  **trend_note**: A brief note on trend or seasonal alignment (e.g., "Matches the 'daily routine' trend on TikTok."). If no specific trend applies, return an empty string.`;

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
                  verdict: { type: "string", enum: ["Strong", "Needs Work", "Weak"] },
                  feedback: { type: "string" },
                  suggestions: { type: "array", items: { type: "string" } },
                  platform_fit: { type: "array", items: { type: "string" } },
                  trend_note: { type: "string" }
                },
                required: ["original_idea", "verdict", "feedback", "suggestions", "platform_fit", "trend_note"]
              }
            }
          }
        }
      });
      
      const ideasWithIds = response.rated_ideas?.map(idea => ({ ...idea, id: Math.random(), isSaved: false })) || [];
      setRatedIdeas(ideasWithIds);
      
      // Save to ContentHistory
      try {
        const history = await apiClient.entities.ContentHistory.create({
          tool_type: 'idea_rating',
          topic: formData.ideas.substring(0, 200),
          custom_instructions: `Niche: ${formData.niche}\nGoals: ${formData.priorityGoals.join(', ')}\nScript context provided: ${!!formData.script}`,
          generated_content: ideasWithIds.map(i => ({
            title: i.original_idea,
            content: i.feedback,
            hook: i.verdict,
            style_notes: `Platform fit: ${i.platform_fit?.join(', ')}\nTrend: ${i.trend_note || 'N/A'}`,
            best_for: i.platform_fit?.join(', ')
          })),
          variations_count: ideasWithIds.length
        });
        setHistoryId(history.id);
      } catch (err) {
        console.error('Failed to save to history:', err);
      }
    } catch (error) {
      console.error('Error analyzing ideas:', error);
      showToastMessage('Something went wrong. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveIdea = async (idea) => {
    try {
      await apiClient.entities.LibraryItem.create({
        type: 'rating',
        platform_or_style: idea.platform_fit.join(', '),
        content: `Idea: ${idea.original_idea}\nVerdict: ${idea.verdict}\nFeedback: ${idea.feedback}`,
        source_module: 'Idea Rating',
        title: idea.original_idea
      });
      setRatedIdeas(ideas => ideas.map(i => i.id === idea.id ? { ...i, isSaved: true } : i));
      showToastMessage('Saved to Library');
    } catch (error) {
      console.error('Failed to save idea:', error);
    }
  };

  const handleSendToTool = (tool) => {
    showToastMessage(`Sent to ${tool}`);
    // In a real implementation, this would open the other modal with the idea pre-filled.
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
            Idea Rating
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Input Section */}
        <div className="space-y-6 mb-8">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-gray-900 font-medium subtitle">Content Ideas*</label>
              {brainstormIdeas.length > 0 && (
                <button
                  onClick={importBrainstormIdeas}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Import from Brainstorm
                </button>
              )}
            </div>
            <textarea
              value={formData.ideas}
              onChange={(e) => handleInputChange('ideas', e.target.value)}
              placeholder="Paste your content ideas here to see which ones have the most potential. One idea per line."
              className="w-full h-32 px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ backgroundColor: '#F9FAFB' }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-900 font-medium mb-2 subtitle">Audience (Optional)</label>
              <input
                type="text"
                value={formData.niche}
                onChange={(e) => handleInputChange('niche', e.target.value)}
                placeholder="e.g., Gen Z fitness fans, startup founders"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-900 font-medium mb-2 subtitle">Priority Goals (Optional)</label>
              <div className="flex flex-wrap gap-2">
                {priorityGoals.map(goal => (
                  <button
                    key={goal.id}
                    onClick={() => handleGoalToggle(goal.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                      formData.priorityGoals.includes(goal.id)
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <goal.icon className="w-4 h-4" />
                    {goal.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-gray-900 font-medium mb-2 subtitle">Script/Outline (Optional)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                <span>Upload a file</span>
                <input type="file" className="sr-only" />
              </label>
              <p className="text-xs text-gray-500 mt-1">TXT, DOCX, SRT</p>
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <button
            onClick={handleAnalyzeIdeas}
            disabled={!formData.ideas.trim() || isAnalyzing}
            className="px-8 py-3 bg-purple-600 text-white font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors"
          >
            {isAnalyzing ? 'Rating Ideas...' : 'Rate My Ideas'}
          </button>
        </div>

        {/* Results Section */}
        {(ratedIdeas.length > 0 || isAnalyzing) && (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">AI Review</h3>
            <p className="text-gray-600 mb-4">It's like having a professional strategist review your ideas.</p>

            <div className="space-y-4">
              {isAnalyzing ? (
                Array(2).fill(0).map((_, i) => (
                  <div key={i} className="p-6 border border-gray-200 rounded-xl animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-8 w-24 bg-gray-200 rounded-full mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                ))
              ) : (
                ratedIdeas.map((idea) => {
                  const verdict = verdictInfo[idea.verdict] || verdictInfo['Needs Work'];
                  return (
                    <div key={idea.id} className="p-6 border border-gray-200 rounded-2xl bg-white hover:shadow-md transition-shadow">
                      <h4 className="font-semibold text-lg text-gray-800 mb-3">{idea.original_idea}</h4>
                      
                      <div className="flex items-center gap-4 mb-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${verdict.bgColor} ${verdict.color}`}>
                          {verdict.icon} {idea.verdict}
                        </span>
                        {idea.trend_note && (
                          <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full flex items-center gap-1.5">
                            <TrendingUp className="w-3 h-3" />
                            {idea.trend_note}
                          </span>
                        )}
                      </div>

                      <div className="mb-4 pl-4 border-l-2 border-gray-200">
                        <p className="text-gray-700 leading-relaxed">{idea.feedback}</p>
                      </div>

                      <div className="space-y-3">
                        <h5 className="font-semibold text-gray-800">Improvement Suggestions:</h5>
                        {idea.suggestions.map((suggestion, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-gray-900 font-medium">{suggestion}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-600">Platform Fit:</span>
                          <div className="flex gap-2">
                            {idea.platform_fit?.map(platform => (
                              <span key={platform} className="text-xl" title={platform}>
                                {platformIcons[platform] || '📺'}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleSaveIdea(idea)}
                            disabled={idea.isSaved}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full flex items-center gap-1.5 transition-colors ${
                              idea.isSaved
                                ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${idea.isSaved ? 'text-green-600' : 'text-gray-500'}`} />
                            {idea.isSaved ? 'Saved' : 'Save'}
                          </button>
                          <button 
                            onClick={() => handleSendToTool('Hook Generator')}
                            className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors flex items-center gap-1.5"
                          >
                            <Zap className="w-3.5 h-3.5" /> Hooks
                          </button>
                          <button 
                            onClick={() => handleSendToTool('Title Generator')}
                            className="px-3 py-1.5 text-xs bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition-colors flex items-center gap-1.5"
                          >
                            <Edit className="w-3.5 h-3.5" /> Titles
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {ratedIdeas.length === 0 && !isAnalyzing && (
            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg mt-8">
              <p className="text-gray-500">Paste your content ideas here to see which ones have the most potential.</p>
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
