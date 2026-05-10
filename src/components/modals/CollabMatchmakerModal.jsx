
import React, { useState } from 'react';
import { apiClient } from '@/apis/client';
import { X, Search, ExternalLink, MessageSquare, Users, Mail, Globe, Copy, Star, Youtube, Instagram, Linkedin } from 'lucide-react';

const platforms = [
  { name: 'YouTube', icon: <Youtube className="w-6 h-6 text-red-600" />, color: 'bg-red-100 text-red-700' },
  { name: 'TikTok', icon: <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/apiClient-prod/public/68d147008a392237a5abd5a6/cd22fbfb2_TikTokLogo.jpeg" alt="TikTok" className="w-6 h-6" />, color: 'bg-gray-100 text-gray-800' },
  { name: 'Instagram', icon: <Instagram className="w-6 h-6 text-pink-600" />, color: 'bg-pink-100 text-pink-700' },
  { name: 'LinkedIn', icon: <Linkedin className="w-6 h-6 text-blue-700" />, color: 'bg-blue-100 text-blue-700' },
  { name: 'Twitter/X', icon: <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/apiClient-prod/public/68d147008a392237a5abd5a6/944c1938b_xlogo.jpg" alt="X" className="w-6 h-6 rounded-sm" />, color: 'bg-gray-100 text-gray-800' }
];

export default function CollabMatchmakerModal({ onClose }) {
  const [formData, setFormData] = useState({
    platform: '',
    niche: ''
  });
  
  const [isSearching, setIsSearching] = useState(false);
  const [creators, setCreators] = useState([]);
  const [activeOutreachCreatorId, setActiveOutreachCreatorId] = useState(null); // New state to manage which creator's outreach is shown
  const [outreachData, setOutreachData] = useState({}); // New state to store outreach content for each creator
  const [showToast, setShowToast] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return formData.platform && formData.niche.trim();
  };

  const handleSearch = async () => {
    if (!isFormValid()) return;
    
    setIsSearching(true);
    setCreators([]);
    setActiveOutreachCreatorId(null); // Reset active outreach when starting new search
    setOutreachData({}); // Clear old outreach data

    try {
      const response = await apiClient.integrations.Core.InvokeLLMwithLogging({
        prompt: `You are a professional networking specialist for content creators. Your most critical task is to find the **exact, full, and direct profile URLs** for real creators.

**URL REQUIREMENT - NON-NEGOTIABLE:**
- You MUST provide the direct link to the creator's channel or profile.
- Generic links like 'youtube.com' are an automatic failure.
- **GOOD URL EXAMPLE (YouTube):** \`https://www.youtube.com/@MorySacko\`
- **BAD URL EXAMPLE (YouTube):** \`https://www.youtube.com\`
- **GOOD URL EXAMPLE (TikTok):** \`https://www.tiktok.com/@khaby.lame\`
- **BAD URL EXAMPLE (TikTok):** \`https://www.tiktok.com\`

If you cannot find the direct profile URL for a creator after searching, DO NOT include them in the list. Only list creators for whom you can find a valid, direct, and specific link.

**SEARCH CRITERIA:**
Platform: ${formData.platform}
Niche/Topic: "${formData.niche}"

**RESEARCH MISSION:**
Use your web search capabilities to find 5-7 REAL, ACTIVE creators on ${formData.platform} who fit the niche. For each one, provide the following information.

**REQUIRED INFORMATION FOR EACH CREATOR:**
1.  **creator_name**: The creator's real name or channel/account name.
2.  **profile_url**: The direct, full, and verified profile URL. This is the most important field. Double-check that it is not a generic domain.
3.  **audience_size**: Approximate follower/subscriber count.
4.  **content_focus**: 1-2 sentences describing their specific content.
5.  **collab_suggestion**: A specific, creative collaboration idea.
6.  **email_address**: Their business email address, if publicly available. If not found, return exactly: "No email found". Do not invent emails.
7.  **contact_method**: "Email available" if found, otherwise "Reach via ${formData.platform} DMs".
8.  **why_good_match**: 1-2 sentences explaining the strategic value of the partnership.

Only include creators you can verify exist and for whom you can provide a functional, direct profile link.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            creators: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  creator_name: { type: "string" },
                  profile_url: { type: "string" },
                  audience_size: { type: "string" },
                  content_focus: { type: "string" },
                  collab_suggestion: { type: "string" },
                  email_address: { type: "string" },
                  contact_method: { type: "string" },
                  why_good_match: { type: "string" }
                },
                required: ["creator_name", "profile_url", "audience_size", "content_focus", "collab_suggestion", "email_address", "contact_method", "why_good_match"]
              },
              minItems: 5,
              maxItems: 7
            }
          }
        }
      });

      setCreators(response.creators?.map(creator => ({...creator, id: Math.random(), saved: false})) || []);
    } catch (error) {
      console.error('Error finding creators:', error);
      showToastMessage('Something went wrong. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerateOutreach = async (creatorId) => {
    const creator = creators.find(c => c.id === creatorId);
    if (!creator) return;

    // Toggle active outreach or set new one
    setActiveOutreachCreatorId(prevId => (prevId === creatorId ? null : creatorId));

    // If already generated and just toggling open/close, don't regenerate
    if (outreachData[creatorId] && outreachData[creatorId].content) {
      return;
    }

    setOutreachData(prev => ({
      ...prev,
      [creatorId]: { isLoading: true, content: null, error: null }
    }));

    try {
      const response = await apiClient.integrations.Core.InvokeLLMwithLogging({
        prompt: `You are a professional networking specialist helping creators write collaboration outreach messages. Create a personalized, professional but friendly outreach message.

**CREATOR TO CONTACT:**
Name: ${creator.creator_name}
Platform: ${formData.platform}
Their Content: ${creator.content_focus}
Collaboration Idea: ${creator.collab_suggestion}

**YOUR CLIENT:**
Niche: "${formData.niche}"
Platform: ${formData.platform}

**OUTREACH MESSAGE REQUIREMENTS:**
1. **Professional but warm tone** - not too formal, not too casual
2. **Personalized** - reference their specific content or recent work
3. **Clear value proposition** - explain mutual benefits
4. **Specific collaboration proposal** - based on the suggested collaboration
5. **Easy next steps** - make it simple for them to respond
6. **Appropriate length** - 150-300 words maximum

**MESSAGE STRUCTURE:**
- Engaging opening with genuine compliment about their work
- Brief introduction of yourself and your content
- Specific collaboration proposal
- Clear benefits for both parties and audiences
- Professional but friendly closing
- Clear call to action

**TONE GUIDELINES:**
- Sound like a fellow creator, not a business pitch
- Show genuine interest in their content
- Be confident but respectful
- Make it clear this isn't spam or a generic template

Create a message that feels personal, professional, and actionable - something that would get a positive response from a busy creator.`,
        response_json_schema: {
          type: "object",
          properties: {
            subject_line: { type: "string" },
            message_body: { type: "string" }
          },
          required: ["subject_line", "message_body"]
        }
      });

      setOutreachData(prev => ({
        ...prev,
        [creatorId]: { isLoading: false, content: response, error: null }
      }));
    } catch (error) {
      console.error('Error generating outreach:', error);
      setOutreachData(prev => ({
        ...prev,
        [creatorId]: { isLoading: false, content: null, error: 'Failed to generate message. Please try again.' }
      }));
    }
  };

  const handleSaveCreator = async (creator) => {
    try {
      await apiClient.entities.LibraryItem.create({
        type: 'collaboration',
        platform_or_style: formData.platform,
        // Updated to use new email_address and contact_method fields
        content: `Creator: ${creator.creator_name}\nProfile: ${creator.profile_url}\nAudience: ${creator.audience_size}\nFocus: ${creator.content_focus}\nCollab Idea: ${creator.collab_suggestion}\nEmail: ${creator.email_address}\nContact Method: ${creator.contact_method}`,
        source_module: 'Collab Matchmaker',
        title: creator.creator_name
      });
      setCreators(creators => creators.map(c => c.id === creator.id ? { ...c, saved: true } : c));
      showToastMessage('Creator saved to Library');
    } catch (error) {
      console.error('Failed to save creator:', error);
      showToastMessage('Failed to save creator.');
    }
  };

  const handleCopyOutreach = async (outreachContent) => {
    try {
      const fullMessage = `Subject: ${outreachContent.subject_line}\n\n${outreachContent.message_body}`;
      await navigator.clipboard.writeText(fullMessage);
      showToastMessage('Outreach message copied!');
    } catch (error) {
      console.error('Failed to copy:', error);
      showToastMessage('Failed to copy message.');
    }
  };

  const showToastMessage = (message) => {
    setShowToast(message);
    setTimeout(() => setShowToast(''), 3000);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backgroundColor: 'rgba(10, 10, 10, 0.28)', backdropFilter: 'blur(4px)' }}
        onClick={handleBackdropClick}
      >
        <div 
          className="bg-white max-w-5xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto"
          style={{ 
            borderRadius: '24px',
            padding: '32px'
          }}
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-gray-900" style={{ fontSize: '32px', fontWeight: 700 }}>
                Collab Matchmaker
              </h2>
              <p className="text-gray-600 mt-2">Find and connect with creators for strategic partnerships.</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="mb-8 space-y-6">
            <div>
              <label className="block text-gray-900 mb-3 font-medium subtitle">Select Platform*</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {platforms.map((platform) => (
                  <button
                    key={platform.name}
                    onClick={() => handleInputChange('platform', platform.name)}
                    className={`py-3 px-4 rounded-xl border-2 transition-all text-center flex flex-col items-center justify-center gap-2 ${
                      formData.platform === platform.name
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex-shrink-0">{platform.icon}</div>
                    <div className="text-sm font-medium text-gray-900">{platform.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-gray-900 mb-2 font-medium subtitle">Your Niche or Video Topic*</label>
              <input
                type="text"
                value={formData.niche}
                onChange={(e) => handleInputChange('niche', e.target.value)}
                placeholder="e.g., Productivity hacks for students, Tech reviews, Fitness for parents"
                className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ backgroundColor: '#F9FAFB' }}
              />
            </div>
          </div>

          <div className="text-center mb-8">
            <button
              onClick={handleSearch}
              disabled={!isFormValid() || isSearching}
              className="px-10 py-4 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-colors text-lg shadow-lg flex items-center gap-3 mx-auto"
              style={{ backgroundColor: '#90AFF7' }}
            >
              <Search className="w-5 h-5" />
              {isSearching ? 'Finding Creator Partners...' : 'Find Collaboration Partners'}
            </button>
            {isFormValid() && (
              <p className="text-sm text-gray-600 mt-2">
                Searching {formData.platform} for creators in "{formData.niche}"
              </p>
            )}
          </div>

          {(creators.length > 0 || isSearching) && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Creator Matches Found</h3>
              <p className="text-gray-600 mb-6">Strategic collaboration partners with verified contact information</p>

              {isSearching ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Array(6).fill(0).map((_, i) => (
                    <div key={i} className="bg-gray-50 rounded-2xl p-6 animate-pulse">
                      <div className="h-6 bg-gray-200 rounded mb-3 w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-4 w-full"></div>
                      <div className="h-5 bg-gray-200 rounded mb-3 w-5/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {creators.map(creator => {
                    const isOutreachActive = activeOutreachCreatorId === creator.id;
                    const outreach = outreachData[creator.id] || {};
                    return (
                    <div key={creator.id} className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-gray-900 text-xl">{creator.creator_name}</h4>
                          <p className="text-gray-600 text-sm">{creator.audience_size} followers</p>
                        </div>
                        <a
                          href={creator.profile_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                          title="View Profile"
                        >
                          <ExternalLink className="w-4 h-4 text-gray-500" />
                        </a>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div>
                          <h5 className="font-semibold text-gray-800 text-sm mb-1">Content Focus</h5>
                          <p className="text-gray-700 text-sm leading-relaxed">{creator.content_focus}</p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <h5 className="font-semibold text-blue-900 text-sm mb-1">Collaboration Idea</h5>
                          <p className="text-blue-800 text-sm leading-relaxed">{creator.collab_suggestion}</p>
                        </div>

                        <div>
                          <h5 className="font-semibold text-gray-800 text-sm mb-1">Why This Match</h5>
                          <p className="text-gray-700 text-sm leading-relaxed">{creator.why_good_match}</p>
                        </div>

                        <div className={`border rounded-lg p-3 ${
                          creator.email_address !== "No email found" 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-orange-50 border-orange-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <Mail className={`w-4 h-4 ${
                              creator.email_address !== "No email found" ? 'text-green-600' : 'text-orange-600'
                            }`} />
                            <span className={`font-semibold text-sm ${
                              creator.email_address !== "No email found" ? 'text-green-800' : 'text-orange-800'
                            }`}>
                              Contact Information
                            </span>
                          </div>
                          {creator.email_address !== "No email found" ? (
                            <div>
                              <p className="text-green-700 text-sm font-medium">{creator.email_address}</p>
                              <p className="text-green-600 text-xs mt-1">✓ Email address found</p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-orange-700 text-sm font-medium">{creator.contact_method}</p>
                              <p className="text-orange-600 text-xs mt-1">No public email found - use platform messaging</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <button
                          onClick={() => handleSaveCreator(creator)}
                          disabled={creator.saved}
                          className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${
                            creator.saved
                              ? 'bg-green-100 text-green-700 cursor-not-allowed'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Star className={`w-4 h-4 ${creator.saved ? 'text-green-600' : 'text-gray-500'}`} />
                          {creator.saved ? 'Saved' : 'Save Creator'}
                        </button>
                        <button
                          onClick={() => handleGenerateOutreach(creator.id)}
                          disabled={outreach.isLoading}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-blue-300"
                        >
                          <MessageSquare className="w-4 h-4" />
                          {outreach.isLoading ? 'Generating...' : isOutreachActive && outreach.content ? 'Hide Outreach' : 'Generate Outreach'}
                        </button>
                      </div>

                      {isOutreachActive && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          {outreach.isLoading ? (
                            <div className="text-center py-4">
                              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                              <p className="text-sm text-gray-600 mt-2">Crafting personalized message...</p>
                            </div>
                          ) : outreach.content ? (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Subject Line</label>
                                <div className="bg-gray-100 border border-gray-200 rounded-lg p-3">
                                  <p className="text-gray-800 font-medium">{outreach.content.subject_line}</p>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                                <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{outreach.content.message_body}</p>
                                </div>
                              </div>
                              <div className="flex justify-end">
                                <button
                                  onClick={() => handleCopyOutreach(outreach.content)}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                                >
                                  <Copy className="w-4 h-4" />
                                  Copy Message
                                </button>
                              </div>
                            </div>
                          ) : outreach.error ? (
                            <div className="text-center p-4 bg-red-50 text-red-700 rounded-lg">
                              <p>{outreach.error}</p>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )})}
                </div>
              )}
            </div>
          )}

          {creators.length === 0 && !isSearching && (
            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Select your platform and niche to find collaboration partners.</p>
            </div>
          )}
        </div>
      </div>

      {showToast && (
        <div className="fixed bottom-5 right-5 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg text-sm font-medium z-50 max-w-sm">
          {showToast}
        </div>
      )}
    </>
  );
}
