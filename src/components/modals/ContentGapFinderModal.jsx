
import React, { useState } from 'react';
import { apiClient } from '@/apis/client';
import { X, Search, ExternalLink, Save, TrendingUp, Users, Target } from 'lucide-react';

const platformIcons = {
  'YouTube': { icon: '🔴', color: 'bg-red-100 text-red-700' },
  'TikTok': { icon: '⚫', color: 'bg-gray-100 text-gray-700' },
  'Instagram': { icon: '📸', color: 'bg-pink-100 text-pink-700' },
  'LinkedIn': { icon: '💼', color: 'bg-blue-100 text-blue-700' },
  'X': { icon: '✖️', color: 'bg-blue-100 text-blue-600' }
};

export default function ContentGapFinderModal({ onClose }) {
  const [formData, setFormData] = useState({
    niche: '',
    youtubeChannel: '',
    tiktokProfile: '',
    instagramProfile: '',
    linkedinProfile: ''
  });
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [contentGaps, setContentGaps] = useState({
    landscape: null,
    creators: [], // New state for main creators
    examples: [],
    opportunities: []
  });
  const [showToast, setShowToast] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAnalyze = async () => {
    if (!formData.niche.trim()) return;
    
    setIsAnalyzing(true);
    setContentGaps({
      landscape: null,
      creators: [],
      examples: [],
      opportunities: []
    });

    try {
      const userProfiles = [
        formData.youtubeChannel,
        formData.tiktokProfile,
        formData.instagramProfile,
        formData.linkedinProfile
      ].filter(profile => profile.trim()).join(', ');

      const response = await apiClient.integrations.Core.InvokeLLMwithLogging({
        prompt: `You are a content strategy expert and competitive intelligence analyst. Your task is to research and analyze the "${formData.niche}" content space using real, current data from across major social platforms.

**RESEARCH TARGET:**
Niche: "${formData.niche}"
${userProfiles ? `User's Existing Profiles: ${userProfiles}` : 'No existing profiles provided'}

**RESEARCH MISSION:**
Use web search to find REAL, CURRENT information about:

1. **Top creators/channels** actually creating content in "${formData.niche}"
2. **Recent high-performing videos** in this space (with real titles and links)
3. **Trending topics** and content gaps based on actual social media data
4. **Market competition** analysis based on real creator data

**REQUIRED SECTIONS:**

**SECTION 1: COMPETITIVE LANDSCAPE**
- **competition_level**: Low/Medium/High based on actual creator count and market saturation
- **market_insights**: 2-3 sentences about the real competitive landscape
- **top_creators_count**: Estimated number based on actual research
- **barrier_to_entry**: Assessment based on current market conditions

**SECTION 2: MAIN CREATORS**
Find 4-6 real creators/channels in this niche:
- **creator_name**: Real creator/channel name
- **platform_primary**: Their main platform
- **specialty**: What makes them stand out in the niche
- **follower_range**: Approximate follower count (e.g., "100K-500K")
- **content_style**: Their typical content approach

**SECTION 3: HIGH-PERFORMING CONTENT**
Find 4-5 real, recent high-performing videos/posts:
- **title**: Actual video/post title
- **creator**: Who created it
- **platform**: Where it's posted
- **video_url**: Direct link to the content (if available). This MUST be a real, working link found via web search. DO NOT invent a URL.
- **performance_metric**: Why it's considered high-performing (e.g., "5M views in 3 days", "viral shares", "high comments")
- **why_successful**: Analysis of what made it successful

**SECTION 4: CONTENT OPPORTUNITIES**
Generate 8-10 specific opportunities based on your real research:
- **title**: Compelling opportunity title
- **opportunity_type**: Category based on market gaps you found (e.g., Trending Topic, Educational Gap, Format Innovation, Seasonal Trend, Competitor Gap)
- **description**: Specific concept based on real market analysis
- **why_opportunity**: Real evidence from your research (e.g., "Competitor X lacks this type of content", "trending hashtag analysis shows demand")
- **best_platforms**: Array of 2-3 platforms where this would perform best (e.g., ["YouTube", "TikTok"])
- **engagement_potential**: Realistic assessment based on similar content (e.g., "High viral potential", "steady evergreen engagement")
- **content_angle**: Unique positioning based on competitor analysis
- **urgency_level**: Time-sensitivity (High/Medium/Low) based on trend timing and competition
- **competition_difficulty**: How difficult it would be to compete in this specific topic area (Easy/Medium/Hard) based on actual creator analysis

**RESEARCH INSTRUCTIONS:**
- Search for recent content in "${formData.niche}" across YouTube, TikTok, Instagram, LinkedIn, and general web results.
- Find real creator names and actual video titles.
- Look for trending hashtags and topics in this niche.
- Analyze what content gaps exist based on current market.
- CRITICAL: Provide actual, working URLs in the 'video_url' field. A fake or broken link is a failure.
- Base all insights on real, current data.

Generate a comprehensive competitive intelligence report that a professional content strategist would create.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            competitive_landscape: {
              type: "object",
              properties: {
                competition_level: { type: "string", enum: ["Low", "Medium", "High"] },
                market_insights: { type: "string" },
                top_creators_count: { type: "string" },
                barrier_to_entry: { type: "string" }
              },
              required: ["competition_level", "market_insights", "top_creators_count", "barrier_to_entry"]
            },
            main_creators: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  creator_name: { type: "string" },
                  platform_primary: { type: "string" },
                  specialty: { type: "string" },
                  follower_range: { type: "string" },
                  content_style: { type: "string" }
                },
                required: ["creator_name", "platform_primary", "specialty", "follower_range", "content_style"]
              },
              minItems: 4,
              maxItems: 6
            },
            high_performing_content: { // Changed key from high_performing_examples
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" }, // Changed from example_title
                  creator: { type: "string" }, // New field
                  platform: { type: "string" },
                  video_url: { type: "string" }, // Added video_url back
                  performance_metric: { type: "string" }, // New field, replaces engagement_pattern
                  why_successful: { type: "string" }
                },
                required: ["title", "creator", "platform", "performance_metric", "why_successful"]
              },
              minItems: 4, // Changed from 3
              maxItems: 5 // Changed from 4
            },
            opportunities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  opportunity_type: { type: "string" },
                  description: { type: "string" },
                  why_opportunity: { type: "string" },
                  best_platforms: { type: "array", items: { type: "string" } },
                  engagement_potential: { type: "string" },
                  content_angle: { type: "string" },
                  urgency_level: { type: "string" },
                  competition_difficulty: { type: "string" }
                },
                required: ["title", "opportunity_type", "description", "why_opportunity", "best_platforms", "engagement_potential", "content_angle", "urgency_level", "competition_difficulty"]
              },
              minItems: 8,
              maxItems: 10
            }
          },
          required: ["competitive_landscape", "main_creators", "high_performing_content", "opportunities"] // Updated required sections
        }
      });

      if (response.opportunities) {
        setContentGaps({
          landscape: response.competitive_landscape,
          creators: response.main_creators, // Storing main creators
          examples: response.high_performing_content, // Storing high performing content
          opportunities: response.opportunities.map(opp => ({...opp, id: Math.random()}))
        });
      }
    } catch (error) {
      console.error('Error analyzing content gaps:', error);
      showToastMessage('Something went wrong analyzing content gaps. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async (opportunity) => {
    try {
      await apiClient.entities.LibraryItem.create({
        type: 'gap',
        platform_or_style: opportunity.opportunity_type,
        content: `Title: ${opportunity.title}\n\nDescription: ${opportunity.description}\n\nWhy This Opportunity: ${opportunity.why_opportunity}\n\nContent Angle: ${opportunity.content_angle}\n\nBest Platforms: ${opportunity.best_platforms.join(', ')}\n\nEngagement Potential: ${opportunity.engagement_potential}\n\nCompetition Difficulty: ${opportunity.competition_difficulty}`,
        source_module: 'Content Gap Finder',
        title: opportunity.title
      });
      showToastMessage('Opportunity saved to Library');
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

  const getUrgencyColor = (urgency) => {
    switch(urgency?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCompetitionColor = (level) => {
    switch(level?.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700'; 
      case 'high': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getOpportunityIcon = (type) => {
    switch(type) {
      case 'Trending Topic': return <TrendingUp className="w-5 h-5" />;
      case 'Educational Gap': return <Target className="w-5 h-5" />;
      case 'Competitor Gap': return <Users className="w-5 h-5" />;
      default: return <Search className="w-5 h-5" />;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(10, 10, 10, 0.28)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white max-w-6xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto"
        style={{ 
          borderRadius: '24px',
          padding: '32px'
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-gray-900" style={{ fontSize: '32px', fontWeight: 700 }}>
              Content Gap Finder
            </h2>
            <p className="text-gray-600 mt-2">Discover untapped opportunities in your niche.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="mb-8 space-y-6">
          <div>
            <label className="block text-gray-900 mb-2 font-medium subtitle">What's your niche or focus area?*</label>
            <input
              type="text"
              value={formData.niche}
              onChange={(e) => handleInputChange('niche', e.target.value)}
              placeholder="e.g., fitness for busy professionals, gaming tutorials, productivity hacks"
              className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ backgroundColor: '#F9FAFB' }}
            />
            <p className="text-sm text-gray-600 mt-2">Be specific - this helps find more targeted opportunities.</p>
          </div>

          <div>
            <label className="block text-gray-900 mb-3 font-medium subtitle">Add your channel/profile links (optional)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">YouTube Channel</label>
                <input
                  type="url"
                  value={formData.youtubeChannel}
                  onChange={(e) => handleInputChange('youtubeChannel', e.target.value)}
                  placeholder="https://youtube.com/@yourchannel"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">TikTok Profile</label>
                <input
                  type="url"
                  value={formData.tiktokProfile}
                  onChange={(e) => handleInputChange('tiktokProfile', e.target.value)}
                  placeholder="https://tiktok.com/@yourprofile"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Instagram Profile</label>
                <input
                  type="url"
                  value={formData.instagramProfile}
                  onChange={(e) => handleInputChange('instagramProfile', e.target.value)}
                  placeholder="https://instagram.com/yourprofile"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">LinkedIn Profile</label>
                <input
                  type="url"
                  value={formData.linkedinProfile}
                  onChange={(e) => handleInputChange('linkedinProfile', e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">Adding your profiles helps identify what you haven't covered yet.</p>
          </div>
        </div>

        <div className="text-center mb-8">
          <button
            onClick={handleAnalyze}
            disabled={!formData.niche.trim() || isAnalyzing}
            className="px-10 py-4 bg-black text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors text-lg shadow-lg flex items-center gap-3 mx-auto"
          >
            <Search className="w-5 h-5" />
            {isAnalyzing ? 'Analyzing Opportunities...' : 'Find Content Gaps'}
          </button>
          {formData.niche.trim() && (
            <p className="text-sm text-gray-600 mt-2">
              Ready to analyze "{formData.niche}" for content opportunities
            </p>
          )}
        </div>

        {(contentGaps.opportunities?.length > 0 || isAnalyzing) && (
          <div>
            {/* Competitive Landscape Section */}
            {contentGaps.landscape && !isAnalyzing && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Competitive Landscape</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                  <div className="flex items-center gap-4 mb-4 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCompetitionColor(contentGaps.landscape.competition_level)}`}>
                      {contentGaps.landscape.competition_level} Competition
                    </span>
                    <span className="text-sm text-gray-600">
                      ~{contentGaps.landscape.top_creators_count} major creators
                    </span>
                  </div>
                  <p className="text-gray-800 mb-3">{contentGaps.landscape.market_insights}</p>
                  <div className="text-sm text-gray-700">
                    <strong>Barrier to Entry:</strong> {contentGaps.landscape.barrier_to_entry}
                  </div>
                </div>
              </div>
            )}

            {/* Main Creators Section */}
            {contentGaps.creators && !isAnalyzing && contentGaps.creators.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Main Creators in This Niche</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {contentGaps.creators.map((creator, index) => (
                    <div key={index} className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded ${platformIcons[creator.platform_primary]?.color || 'bg-gray-100 text-gray-600'}`}>
                          {platformIcons[creator.platform_primary]?.icon || '📱'} {creator.platform_primary}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {creator.follower_range}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">{creator.creator_name}</h4>
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>Specialty:</strong> {creator.specialty}
                      </p>
                      <p className="text-xs text-purple-700">
                        <strong>Style:</strong> {creator.content_style}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* High-Performing Content Section */}
            {contentGaps.examples && !isAnalyzing && contentGaps.examples.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">High-Performing Content Examples</h3>
                <div className="grid grid-cols-1 gap-4">
                  {contentGaps.examples.map((example, index) => (
                    <div key={index} className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded ${platformIcons[example.platform]?.color || 'bg-gray-100 text-gray-600'}`}>
                            {platformIcons[example.platform]?.icon || '📱'} {example.platform}
                          </span>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {example.performance_metric}
                          </span>
                        </div>
                        {example.video_url && (
                          <a
                            href={example.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Watch
                          </a>
                        )}
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">"{example.title}"</h4>
                      <p className="text-sm text-gray-600 mb-2">by {example.creator}</p>
                      <p className="text-sm text-gray-700">{example.why_successful}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Content Opportunities Section */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Content Opportunities Found</h3>
              <p className="text-gray-600">Strategic gaps and trending opportunities based on real market data</p>
            </div>

            {isAnalyzing ? (
              <div className="space-y-8">
                {/* Loading state for Competitive Landscape */}
                <div className="bg-gray-50 rounded-2xl p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
                
                {/* Loading state for Main Creators */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array(6).fill(0).map((_, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-4 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2 w-1/2"></div>
                      <div className="h-12 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>

                {/* Loading state for High-Performing Content */}
                <div className="grid grid-cols-1 gap-4">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-4 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2 w-1/2"></div>
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>

                {/* Loading state for Content Opportunities */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array(9).fill(0).map((_, i) => (
                    <div key={i} className="bg-gray-50 rounded-2xl p-6 animate-pulse">
                      <div className="h-5 bg-gray-200 rounded mb-3 w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
                      <div className="h-16 bg-gray-200 rounded mb-4"></div>
                      <div className="flex gap-2 mb-4">
                        <div className="h-6 w-16 bg-gray-200 rounded"></div>
                        <div className="h-6 w-16 bg-gray-200 rounded"></div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contentGaps.opportunities?.map(opportunity => (
                  <div key={opportunity.id} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        {getOpportunityIcon(opportunity.opportunity_type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-lg leading-tight">{opportunity.title}</h4>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{opportunity.opportunity_type}</span>
                          <span className={`text-xs px-2 py-1 rounded font-medium ${getUrgencyColor(opportunity.urgency_level)}`}>
                            {opportunity.urgency_level} Priority
                          </span>
                          <span className={`text-xs px-2 py-1 rounded font-medium ${getDifficultyColor(opportunity.competition_difficulty)}`}>
                            {opportunity.competition_difficulty} Competition
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-700 text-sm mb-4 leading-relaxed">{opportunity.description}</p>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <p className="text-blue-800 text-xs font-medium mb-1">Why This is an Opportunity:</p>
                      <p className="text-blue-700 text-xs leading-relaxed">{opportunity.why_opportunity}</p>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-600 mb-2">Best Platforms:</p>
                      <div className="flex flex-wrap gap-2">
                        {opportunity.best_platforms.map(platform => (
                          <span key={platform} className={`text-xs px-2 py-1 rounded-full ${platformIcons[platform]?.color || 'bg-gray-100 text-gray-600'}`}>
                            {platformIcons[platform]?.icon || '📱'} {platform}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-xs text-gray-600 mb-4">
                      <p><strong>Content Angle:</strong> {opportunity.content_angle}</p>
                      <p className="mt-1"><strong>Engagement Potential:</strong> {opportunity.engagement_potential}</p>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleSave(opportunity)}
                        className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save Opportunity
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
