import React, { useState } from 'react';
import { apiClient } from '@/apis/client';
import { X, Copy, Upload, Star, RotateCcw, Download, ChevronDown, ChevronUp } from 'lucide-react';

const platforms = [
  { name: 'YouTube', maxChars: 60, capChars: 70 },
  { name: 'TikTok', maxChars: 40, capChars: 50 },
  { name: 'Instagram Reels', maxChars: 40, capChars: 50 },
  { name: 'Shorts', maxChars: 40, capChars: 50 },
  { name: 'LinkedIn Video', maxChars: 60, capChars: 70 }
];

const styles = [
  'Curiosity Gap',
  'Listicle/Numbered', 
  'Outcome-Driven',
  'How-To',
  'Contrarian/Hot Take',
  'Emotional/Empathy',
  'Urgency/Time-Bound',
  'Teaser/Mystery',
  'Before/After'
];

export default function TitleGeneratorModal({ onClose, initialData }) {
  const [formData, setFormData] = useState({
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
  
  const [uploadedScript, setUploadedScript] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState([]);
  const [showToast, setShowToast] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleScriptUpload = async (file) => {
    if (file && file.type === 'text/plain') {
      try {
        const text = await file.text();
        if (text.length <= 10000) {
          setUploadedScript({ name: file.name, content: text, wordCount: text.split(/\s+/).length });
          handleInputChange('script', text);
        } else {
          showToastMessage('Script too long. Maximum 10,000 characters.');
        }
      } catch (error) {
        showToastMessage('Error reading file.');
      }
    }
  };

  const handleScriptPaste = (e) => {
    const text = e.target.value;
    if (text.length <= 10000) {
      setUploadedScript(text ? { name: 'Pasted Script', content: text, wordCount: text.split(/\s+/).length } : null);
      handleInputChange('script', text);
    }
  };

  const validateForm = () => {
    return formData.description.trim() && 
           formData.description.length >= 20 && 
           formData.description.length <= 400 &&
           formData.platform && 
           formData.style;
  };

  const handleGenerate = async () => {
    if (!validateForm()) return;
    
    setIsGenerating(true);
    setResults([]);

    const platform = platforms.find(p => p.name === formData.platform);
    const maxLength = formData.maxLengthOverride || platform.maxChars;

    try {
      let prompt = `Generate exactly 8 video titles about "${formData.description}" in the "${formData.style}" style for ${formData.platform}.

Platform rules:
- Maximum ${maxLength} characters (hard cap ${platform.capChars})
- ${formData.allowEmojis ? 'Emojis allowed but use sparingly' : 'No emojis'}
- ${formData.titleCase ? 'Use Title Case' : 'Use sentence case'}
- ${formData.includeNumbers ? 'Include numbers when relevant' : 'Avoid numbers unless natural'}
- ${formData.includeBrackets ? 'Use brackets/parentheses when helpful' : 'Avoid brackets'}

Style guidelines for "${formData.style}":
${getStyleGuidelines(formData.style)}

${formData.audience ? `Target audience: ${formData.audience}` : ''}
${formData.primaryKeyword ? `Include keyword/phrase: "${formData.primaryKeyword}"` : ''}
${formData.avoidWords ? `Avoid these words: ${formData.avoidWords}` : ''}

${formData.script ? `
Script context: "${formData.script.substring(0, 2000)}..."

Analyze this script for:
- Unique phrasing and memorable lines
- Core promise or outcome  
- Emotional language or hooks
- Key themes and insights

Use script insights for at least 4 of the 8 titles. Make them feel authentic to the content while following the style rules. Don't spoil the "answer" for curiosity titles.` : ''}

Make each title unique, compelling, and optimized for ${formData.platform}.`;

      const response = await apiClient.integrations.Core.InvokeLLMwithLogging({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            titles: {
              type: "array",
              items: { type: "string" },
              minItems: 8,
              maxItems: 8
            }
          }
        }
      });

      setResults(response.titles?.map(title => ({ 
        title, 
        rating: 0, 
        id: Date.now() + Math.random() 
      })) || []);
    } catch (error) {
      console.error('Error generating titles:', error);
      showToastMessage('Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getStyleGuidelines = (style) => {
    const guidelines = {
      'Curiosity Gap': 'Create intrigue without revealing the answer. Use "Why...", "What happens when...", "The secret to..."',
      'Listicle/Numbered': 'Include specific numbers. "5 Ways...", "Top 10...", "3 Secrets..."',
      'Outcome-Driven': 'Focus on the end result or benefit. Clear value proposition.',
      'How-To': 'Instructional format. "How to...", "The complete guide to..."',
      'Contrarian/Hot Take': 'Challenge conventional wisdom. "Why everyone is wrong about..."',
      'Emotional/Empathy': 'Connect with feelings and experiences. Relatable situations.',
      'Urgency/Time-Bound': 'Create time pressure. "Before it\'s too late", "Right now"',
      'Teaser/Mystery': 'Build suspense. "What nobody tells you...", "The hidden truth..."',
      'Before/After': 'Show transformation. "From X to Y", "How I went from..."'
    };
    return guidelines[style] || '';
  };

  const handleCopy = async (title) => {
    try {
      await navigator.clipboard.writeText(title);
      showToastMessage('Copied');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleSave = async (item) => {
    try {
      await apiClient.entities.LibraryItem.create({
        type: 'title',
        platform_or_style: `${formData.platform} - ${formData.style}`,
        content: item.title,
        source_module: 'Title Generator',
        title: item.title.substring(0, 50) + '...'
      });
      showToastMessage('Saved to Library');
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleRate = (id, rating) => {
    setResults(prev => prev.map(item => 
      item.id === id ? { ...item, rating } : item
    ));
  };

  const handleRegenerate = async (item) => {
    // Regenerate a single title similar to the selected one
    try {
      const response = await apiClient.integrations.Core.InvokeLLMwithLogging({
        prompt: `Generate 3 variations of this title: "${item.title}"
        
Keep the same style, length, and platform (${formData.platform}) but make them unique and fresh.`,
        response_json_schema: {
          type: "object",
          properties: {
            titles: {
              type: "array", 
              items: { type: "string" },
              minItems: 3,
              maxItems: 3
            }
          }
        }
      });
      
      const newTitles = response.titles?.map(title => ({ 
        title, 
        rating: 0, 
        id: Date.now() + Math.random() 
      })) || [];
      
      setResults(prev => [...prev, ...newTitles]);
      showToastMessage('Generated variations');
    } catch (error) {
      console.error('Error regenerating:', error);
    }
  };

  const handleExport = async () => {
    const ratedTitles = results.filter(item => item.rating > 0);
    if (ratedTitles.length === 0) {
      showToastMessage('Please rate some titles first');
      return;
    }
    
    const exportText = ratedTitles
      .sort((a, b) => b.rating - a.rating)
      .map((item, index) => `${index + 1}. ${item.title} (${item.rating}★)`)
      .join('\n');
      
    try {
      await navigator.clipboard.writeText(exportText);
      showToastMessage('Exported to clipboard');
    } catch (error) {
      console.error('Failed to export:', error);
    }
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

  const charCount = formData.description.length;
  const isValidLength = charCount >= 20 && charCount <= 400;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(10, 10, 10, 0.28)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white max-w-3xl w-full mx-4 shadow-xl max-h-[90vh] overflow-auto"
        style={{ 
          borderRadius: '24px',
          padding: '32px',
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 
            className="text-gray-900" // Kept text color class
            style={{ 
              fontSize: '32px', 
              fontWeight: 700,
            }}
          >
            Title Generator
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-6 mb-8">
          {/* Description */}
          <div>
            <label 
              className="block text-gray-900 mb-2 subtitle"
              style={{ 
                fontSize: '16px', 
                fontWeight: 500,
              }}
            >
              What's your video about? *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="E.g., Morning routine for busy founders, productivity tips, ..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20"
              maxLength={400}
            />
            <div className="flex justify-between text-sm mt-1">
              <span className={`${isValidLength ? 'text-gray-500' : 'text-red-500'}`}>
                {charCount < 20 ? `Minimum 20 characters (${20 - charCount} more needed)` : `${charCount}/400 characters`}
              </span>
            </div>
          </div>

          {/* Platform and Style Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label 
                className="block text-gray-900 mb-2 subtitle"
                style={{ 
                  fontSize: '16px', 
                  fontWeight: 500,
                }}
              >
                Platform *
              </label>
              <select
                value={formData.platform}
                onChange={(e) => handleInputChange('platform', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">Choose platform...</option>
                {platforms.map((platform) => (
                  <option key={platform.name} value={platform.name}>
                    {platform.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label 
                className="block text-gray-900 mb-2 subtitle"
                style={{ 
                  fontSize: '16px', 
                  fontWeight: 500,
                }}
              >
                Style *
              </label>
              <select
                value={formData.style}
                onChange={(e) => handleInputChange('style', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">Choose style...</option>
                {styles.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Toggles */}
          <div>
            <label 
              className="block text-gray-900 mb-3 subtitle"
              style={{ 
                fontSize: '16px', 
                fontWeight: 500,
              }}
            >
              Options
            </label>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'includeNumbers', label: 'Include numbers' },
                { key: 'includeBrackets', label: 'Include brackets' },
                { key: 'allowEmojis', label: 'Allow emojis' },
                { key: 'titleCase', label: 'Title Case (default)' }
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData[key]}
                    onChange={(e) => handleInputChange(key, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Script Upload */}
          <div>
            <label 
              className="block text-gray-900 mb-2 subtitle"
              style={{ 
                fontSize: '16px', 
                fontWeight: 500,
              }}
            >
              Script Upload (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6">
              {uploadedScript ? (
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900">{uploadedScript.name}</p>
                  <p className="text-xs text-gray-500">{uploadedScript.wordCount} words</p>
                  <button
                    onClick={() => {
                      setUploadedScript(null);
                      handleInputChange('script', '');
                    }}
                    className="text-red-600 text-sm mt-2 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                      <span>Upload a script file</span>
                      <input
                        type="file"
                        accept=".txt"
                        className="sr-only"
                        onChange={(e) => e.target.files?.[0] && handleScriptUpload(e.target.files[0])}
                      />
                    </label>
                    <p className="pl-1">or paste below</p>
                  </div>
                  <textarea
                    placeholder="Paste your script here (max 10,000 characters)..."
                    className="w-full mt-2 px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows="3"
                    maxLength={10000}
                    value={formData.script}
                    onChange={handleScriptPaste}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Advanced Settings */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center text-gray-900 hover:text-gray-700 subtitle"
              style={{ 
                fontSize: '16px', 
                fontWeight: 500,
              }}
            >
              Advanced Settings
              {showAdvanced ? <ChevronUp className="ml-1 w-4 h-4" /> : <ChevronDown className="ml-1 w-4 h-4" />}
            </button>
            
            {showAdvanced && (
              <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-xl">
                <div>
                  <label 
                    className="block text-sm font-medium text-gray-700 mb-1 subtitle"
                  >
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={formData.audience}
                    onChange={(e) => handleInputChange('audience', e.target.value)}
                    placeholder="e.g., busy entrepreneurs, fitness beginners..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label 
                    className="block text-sm font-medium text-gray-700 mb-1 subtitle"
                  >
                    Primary Keyword
                  </label>
                  <input
                    type="text"
                    value={formData.primaryKeyword}
                    onChange={(e) => handleInputChange('primaryKeyword', e.target.value)}
                    placeholder="SEO keyword to include"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label 
                    className="block text-sm font-medium text-gray-700 mb-1 subtitle"
                  >
                    Avoid Words
                  </label>
                  <input
                    type="text"
                    value={formData.avoidWords}
                    onChange={(e) => handleInputChange('avoidWords', e.target.value)}
                    placeholder="comma, separated, words, to, avoid"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label 
                    className="block text-sm font-medium text-gray-700 mb-1 subtitle"
                  >
                    Max Length Override
                  </label>
                  <input
                    type="number"
                    value={formData.maxLengthOverride}
                    onChange={(e) => handleInputChange('maxLengthOverride', e.target.value)}
                    placeholder="Custom character limit"
                    min="20"
                    max="100"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Generate Button */}
        <div className="text-center mb-8">
          <button
            onClick={handleGenerate}
            disabled={!validateForm() || isGenerating}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          >
            {isGenerating ? 'Generating 8 Titles...' : 'Generate 8 Titles'}
          </button>
        </div>

        {/* Results */}
        {(results.length > 0 || isGenerating) && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Generated Titles</h3>
              {results.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerate}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    Generate 8 More
                  </button>
                  <button
                    onClick={handleExport}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Export
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {isGenerating ? (
                Array(8).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg animate-pulse">
                    <span className="text-gray-400 font-bold w-6">{i + 1}</span>
                    <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                    <div className="flex gap-2">
                      {Array(4).fill(0).map((_, j) => (
                        <div key={j} className="w-8 h-6 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                results.map((item, index) => (
                  <div key={item.id} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="text-gray-600 font-bold w-6 mt-1">{index + 1}</span>
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium leading-relaxed">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.title.length} characters</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Star Rating */}
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleRate(item.id, star)}
                            className="hover:scale-110 transition-transform"
                          >
                            <Star 
                              className={`w-4 h-4 ${star <= item.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                            />
                          </button>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => handleCopy(item.title)}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleSave(item)}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => handleRegenerate(item)}
                        className="px-2 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
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
