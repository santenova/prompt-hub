
import React, { useState } from 'react';
import { apiClient } from '@/apis/client';
import { X, Search, Save, TrendingUp, Target, Clock, Lightbulb } from 'lucide-react';

export default function OpportunityExplorerModal({ onClose }) {
  const [formData, setFormData] = useState({
    niche: '',
    targetAudience: ''
  });
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [opportunities, setOpportunities] = useState([]);
  const [showToast, setShowToast] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return formData.niche.trim() && formData.targetAudience.trim();
  };

  const handleExplore = async () => {
    if (!isFormValid()) return;
    
    setIsAnalyzing(true);
    setOpportunities([]);

    try {
      const response = await apiClient.integrations.Core.InvokeLLMwithLogging({
        prompt: `You are a YouTube content strategy expert with deep knowledge of platform trends, audience behavior, and content gaps. Your task is to research and identify specific, underserved content opportunities on YouTube.

**RESEARCH TARGET:**
Niche: "${formData.niche}"
Target Audience: "${formData.targetAudience}"

**RESEARCH MISSION:**
Use web search and YouTube analysis to identify 4-5 specific content opportunities that are:
1. Underserved or poorly covered on YouTube
2. Relevant to "${formData.targetAudience}" interested in "${formData.niche}"
3. Timely and strategically valuable
4. Actionable with clear differentiation angles

**ANALYSIS METHODOLOGY:**
- Search YouTube for recent content in "${formData.niche}" targeting "${formData.targetAudience}"
- Identify topics with low quality coverage, outdated information, or missing angles
- Look for trending subtopics that lack comprehensive coverage
- Find opportunities where competition is weak or approaches are stale
- Consider seasonal trends, recent events, or emerging interests in the space

**DELIVERABLES:**
For each opportunity, provide:

1. **topic_title**: Clear, concise topic name (4-8 words)
2. **fresh_angle**: How to approach this topic differently than existing content (1-2 sentences explaining the unique positioning)
3. **suggested_title**: A compelling, clickable YouTube video title optimized for the algorithm and audience
4. **why_timely**: Specific explanation of current relevance - trends, events, gaps in market, audience demand (1-2 sentences with concrete reasoning)
5. **competition_level**: Assessment of how difficult it would be to rank/succeed with this topic (Low/Medium/High)
6. **potential_views**: Realistic view potential based on similar content performance (e.g., "10K-50K views", "100K+ potential")

**QUALITY STANDARDS:**
- Each opportunity must be specific and actionable, not generic
- Fresh angles should be genuinely different from existing YouTube content
- Suggested titles should follow proven YouTube optimization principles
- Timing explanations must be concrete and research-based
- Avoid obvious or oversaturated topics

**RESEARCH REQUIREMENTS:**
- Base findings on actual YouTube content analysis
- Consider current trends and seasonal patterns
- Account for audience-specific interests and pain points
- Ensure opportunities are realistic for "${formData.targetAudience}"

Generate strategic opportunities that feel like professional market research, not generic suggestions.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            opportunities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  topic_title: { type: "string" },
                  fresh_angle: { type: "string" },
                  suggested_title: { type: "string" },
                  why_timely: { type: "string" },
                  competition_level: { type: "string", enum: ["Low", "Medium", "High"] },
                  potential_views: { type: "string" }
                },
                required: ["topic_title", "fresh_angle", "suggested_title", "why_timely", "competition_level", "potential_views"]
              },
              minItems: 4,
              maxItems: 5
            }
          }
        }
      });

      setOpportunities(response.opportunities?.map(opp => ({...opp, id: Math.random()})) || []);
    } catch (error) {
      console.error('Error exploring opportunities:', error);
      showToastMessage('Something went wrong. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async (opportunity) => {
    try {
      await apiClient.entities.LibraryItem.create({
        type: 'opportunity',
        platform_or_style: 'YouTube',
        content: `Topic: ${opportunity.topic_title}\n\nFresh Angle: ${opportunity.fresh_angle}\n\nSuggested Title: ${opportunity.suggested_title}\n\nWhy Timely: ${opportunity.why_timely}\n\nCompetition: ${opportunity.competition_level}\n\nPotential Views: ${opportunity.potential_views}`,
        source_module: 'Opportunity Explorer',
        title: opportunity.topic_title
      });
      showToastMessage('Saved to Library');
    } catch (error) {
      showToastMessage('Failed to save opportunity');
    }
  };

  const showToastMessage = (message) => {
    setShowToast(message);
    setTimeout(() => setShowToast(''), 3000);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const getCompetitionColor = (level) => {
    switch(level?.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700'; 
      case 'high': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
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
          padding: '32px'
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-gray-900" style={{ fontSize: '32px', fontWeight: 700 }}>
              Opportunity Explorer
            </h2>
            <p className="text-gray-600 mt-2">Discover underserved YouTube opportunities in your niche.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="mb-8 space-y-6">
          <div>
            <label className="block text-gray-900 mb-2 font-medium subtitle">Your Niche*</label>
            <input
              type="text"
              value={formData.niche}
              onChange={(e) => handleInputChange('niche', e.target.value)}
              placeholder="e.g., fitness for busy professionals, crypto investing, parenting toddlers"
              className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ backgroundColor: '#F9FAFB' }}
            />
          </div>

          <div>
            <label className="block text-gray-900 mb-2 font-medium subtitle">Target Audience*</label>
            <input
              type="text"
              value={formData.targetAudience}
              onChange={(e) => handleInputChange('targetAudience', e.target.value)}
              placeholder="e.g., Gen Z beginners, working parents, small business owners"
              className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ backgroundColor: '#F9FAFB' }}
            />
          </div>
        </div>

        <div className="text-center mb-8">
          <button
            onClick={handleExplore}
            disabled={!isFormValid() || isAnalyzing}
            className="px-10 py-4 bg-black text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors text-lg shadow-lg flex items-center gap-3 mx-auto"
          >
            <Search className="w-5 h-5" />
            {isAnalyzing ? 'Analyzing YouTube...' : 'Explore Opportunities'}
          </button>
          {isFormValid() && (
            <p className="text-sm text-gray-600 mt-2">
              Ready to analyze "{formData.niche}" for "{formData.targetAudience}"
            </p>
          )}
        </div>

        {(opportunities.length > 0 || isAnalyzing) && (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">YouTube Opportunities Found</h3>
            <p className="text-gray-600 mb-6">Strategic opportunities based on real YouTube market analysis</p>

            {isAnalyzing ? (
              <div className="grid grid-cols-1 gap-6">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="bg-gray-50 rounded-2xl p-6 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded mb-3 w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4 w-full"></div>
                    <div className="h-5 bg-gray-200 rounded mb-3 w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {opportunities.map(opportunity => (
                  <div key={opportunity.id} className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                          <Target className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-xl">{opportunity.topic_title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded font-medium ${getCompetitionColor(opportunity.competition_level)}`}>
                              {opportunity.competition_level} Competition
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                              {opportunity.potential_views} views
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="w-4 h-4 text-blue-600" />
                          <span className="font-semibold text-blue-900 text-sm">Fresh Angle</span>
                        </div>
                        <p className="text-blue-800 text-sm leading-relaxed">{opportunity.fresh_angle}</p>
                      </div>

                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-gray-900 text-sm">Suggested Working Title</span>
                        </div>
                        <p className="text-gray-800 font-medium">{opportunity.suggested_title}</p>
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-green-600" />
                          <span className="font-semibold text-green-900 text-sm">Why It's Timely</span>
                        </div>
                        <p className="text-green-800 text-sm leading-relaxed">{opportunity.why_timely}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-medium flex items-center gap-1">
                          📺 YouTube Optimized
                        </span>
                      </div>
                      <button
                        onClick={() => handleSave(opportunity)}
                        className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save to Library
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {opportunities.length === 0 && !isAnalyzing && (
          <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
            <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Enter your niche and target audience to discover YouTube opportunities.</p>
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
