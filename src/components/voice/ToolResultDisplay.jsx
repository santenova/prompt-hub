import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Copy, 
  Check, 
  Save, 
  Sparkles,
  Scissors,
  Video,
  Anchor,
  Lightbulb,
  Star,
  Users,
  MessageSquare,
  Zap,
  Palette,
  Mail
} from "lucide-react";
import { motion } from "framer-motion";
import { apiClient } from '@/apis/client';
import { useToast } from "@/components/ui/use-toast";

const toolIcons = {
  content_splitter: Scissors,
  title_generator: Video,
  hook_generator: Anchor,
  idea_brainstorm: Lightbulb,
  idea_rating: Star,
  collab_matchmaker: Users,
  tiny_prompt: MessageSquare,
  creative_playground: Palette,
  newsletter_generator: Mail
};

const toolNames = {
  content_splitter: 'Content Splitter',
  title_generator: 'Title Generator',
  hook_generator: 'Hook Generator',
  idea_brainstorm: 'Idea Brainstorm',
  idea_rating: 'Idea Rating',
  collab_matchmaker: 'Collab Matchmaker',
  tiny_prompt: 'Tiny Prompt',
  creative_playground: 'Creative Playground',
  newsletter_generator: 'Newsletter Generator'
};

export default function ToolResultDisplay({ result }) {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [savedIndexes, setSavedIndexes] = useState(new Set());
  const [selectedBeamModel, setSelectedBeamModel] = useState(0);
  const { toast } = useToast();

  if (!result || (!result.results && !result.beamMode)) {
    return (
      <Card className="bg-red-50 border-2 border-red-200">
        <div className="p-4">
          <p className="text-sm text-red-600">Invalid tool result</p>
        </div>
      </Card>
    );
  }

  // Handle Beam mode results
  if (result.beamMode) {
    const ToolIcon = toolIcons[result.toolId] || Sparkles;
    const toolName = toolNames[result.toolId] || 'Tool Result';
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="my-4"
      >
        <Card className="border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-600" />
                <CardTitle className="text-sm">Beam: {toolName}</CardTitle>
                <Badge className="bg-indigo-600 text-xs">
                  {result.metadata?.successfulModels || 0}/{result.models?.length || 0} models
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Model Selector */}
            <div className="flex gap-2 flex-wrap">
              {result.results?.map((modelResult, idx) => (
                <Button
                  key={idx}
                  variant={selectedBeamModel === idx ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedBeamModel(idx)}
                  className={`text-xs ${modelResult.success ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'opacity-50'}`}
                  disabled={!modelResult.success}
                >
                  {modelResult.model}
                  {modelResult.success && (
                    <Badge className="ml-1 bg-white/20 text-xs h-4">
                      {modelResult.results?.length || 0}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>

            {/* Display Results from Selected Model */}
            {selectedBeamModel !== null && result.results[selectedBeamModel]?.success && (
              <div className="space-y-2">
                {result.results[selectedBeamModel].results.map((item, idx) => (
                  <Card key={idx} className="p-3 bg-white border-indigo-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {renderSingleResult(item, result.toolId)}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            await navigator.clipboard.writeText(JSON.stringify(item, null, 2));
                            setCopiedIndex(idx);
                            setTimeout(() => setCopiedIndex(null), 2000);
                            toast({ title: "Copied!" });
                          }}
                          className="h-7 w-7 p-0"
                        >
                          {copiedIndex === idx ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            try {
                              await apiClient.entities.LibraryItem.create({
                                type: getLibraryItemType(result.toolId),
                                content: JSON.stringify(item),
                                source_module: `${toolName} (Beam)`,
                                title: getItemTitle(item, result.toolId)
                              });
                              setSavedIndexes(prev => new Set(prev).add(idx));
                              setTimeout(() => setSavedIndexes(prev => { const n = new Set(prev); n.delete(idx); return n; }), 2000);
                              toast({ title: "Saved!" });
                            } catch (err) {
                              toast({ title: "Save failed", variant: "destructive" });
                            }
                          }}
                          className="h-7 w-7 p-0"
                        >
                          {savedIndexes.has(idx) ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Save className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {result.results[selectedBeamModel]?.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-700">
                  ❌ {result.results[selectedBeamModel].model} failed: {result.results[selectedBeamModel].error}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Regular single-model results
  const ToolIcon = toolIcons[result.type] || Sparkles;
  const toolName = toolNames[result.type] || 'Tool Result';

  const handleCopy = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      toast({ title: "Copied!" });
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSave = async (item, index) => {
    try {
      await apiClient.entities.LibraryItem.create({
        type: getLibraryItemType(result.type),
        content: JSON.stringify(item),
        source_module: toolName,
        title: getItemTitle(item, result.type)
      });
      setSavedIndexes(prev => new Set(prev).add(index));
      setTimeout(() => {
        setSavedIndexes(prev => {
          const newSet = new Set(prev);
          newSet.delete(index);
          return newSet;
        });
      }, 2000);
      toast({ title: "Saved!" });
    } catch (err) {
      console.error('Failed to save:', err);
      toast({ title: "Save failed", variant: "destructive" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-4"
    >
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="flex items-center gap-2">
            <ToolIcon className="w-5 h-5" />
            <h3 className="font-semibold">{toolName}</h3>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {renderResults(result, handleCopy, handleSave, copiedIndex, savedIndexes)}
        </div>
      </Card>
    </motion.div>
  );
}

function renderResults(result, handleCopy, handleSave, copiedIndex, savedIndexes) {
  if (!result.results || !Array.isArray(result.results)) {
    return <p className="text-sm text-gray-600">No results available</p>;
  }

  switch (result.type) {
    case 'content_splitter':
      return result.results.map((platform, idx) => (
        <Card key={idx} className="p-3 bg-white">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-sm">{platform.name}</h4>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopy(platform.content, idx)}
                className="h-7 w-7 p-0"
              >
                {copiedIndex === idx ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleSave(platform, idx)}
                className="h-7 w-7 p-0"
              >
                {savedIndexes.has(idx) ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-sm mb-2">{platform.content}</p>
          {platform.hashtags && platform.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {platform.hashtags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          {platform.notes && (
            <p className="text-xs text-gray-600 italic">{platform.notes}</p>
          )}
        </Card>
      ));

    case 'title_generator':
      return result.results.map((title, idx) => (
        <Card key={idx} className="p-3 bg-white">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className={`text-xs ${
                  title.engagement === 'High' ? 'bg-green-100 text-green-800' :
                  title.engagement === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {title.engagement}
                </Badge>
              </div>
              <h4 className="font-semibold text-sm mb-1">{title.text}</h4>
              <p className="text-xs text-gray-600">{title.reasoning}</p>
            </div>
            <div className="flex gap-1 ml-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopy(title.text, idx)}
                className="h-7 w-7 p-0"
              >
                {copiedIndex === idx ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleSave(title, idx)}
                className="h-7 w-7 p-0"
              >
                {savedIndexes.has(idx) ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      ));

    case 'hook_generator':
      return result.results.map((hook, idx) => (
        <Card key={idx} className="p-3 bg-white">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <Badge variant="outline" className="text-xs mb-2">{hook.hook_type}</Badge>
              <p className="font-semibold text-sm mb-1">"{hook.text}"</p>
              <p className="text-xs text-gray-600">{hook.strategy}</p>
            </div>
            <div className="flex gap-1 ml-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopy(hook.text, idx)}
                className="h-7 w-7 p-0"
              >
                {copiedIndex === idx ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleSave(hook, idx)}
                className="h-7 w-7 p-0"
              >
                {savedIndexes.has(idx) ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      ));

    case 'idea_brainstorm':
      return result.results.map((idea, idx) => (
        <Card key={idx} className="p-3 bg-white">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-sm">{idea.title}</h4>
                <Badge variant="outline" className={`text-xs ${
                  idea.engagement === 'High' ? 'bg-green-100 text-green-800' :
                  idea.engagement === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {idea.engagement}
                </Badge>
              </div>
              <p className="text-xs text-gray-700 mb-1">{idea.description}</p>
              <p className="text-xs text-gray-600 italic">{idea.reasoning}</p>
            </div>
            <div className="flex gap-1 ml-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopy(`${idea.title}\n\n${idea.description}`, idx)}
                className="h-7 w-7 p-0"
              >
                {copiedIndex === idx ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleSave(idea, idx)}
                className="h-7 w-7 p-0"
              >
                {savedIndexes.has(idx) ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      ));

    case 'idea_rating':
      return result.results.map((rating, idx) => (
        <Card key={idx} className="p-3 bg-white">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`text-xs ${
                  rating.rating === 'Strong' ? 'bg-green-600' :
                  rating.rating === 'Needs Work' ? 'bg-yellow-600' :
                  'bg-red-600'
                }`}>
                  {rating.rating}
                </Badge>
                <span className="text-sm font-semibold">Score: {rating.score}/10</span>
              </div>
              <p className="text-sm font-medium mb-2">{rating.idea}</p>
              <div className="text-xs space-y-1">
                <div>
                  <span className="font-semibold text-green-700">Strengths:</span>
                  <ul className="ml-4 mt-1">
                    {rating.strengths.map((s, i) => (
                      <li key={i} className="text-gray-700">• {s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-semibold text-orange-700">Improvements:</span>
                  <ul className="ml-4 mt-1">
                    {rating.improvements.map((imp, i) => (
                      <li key={i} className="text-gray-700">• {imp}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex gap-1 ml-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopy(rating.idea, idx)}
                className="h-7 w-7 p-0"
              >
                {copiedIndex === idx ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleSave(rating, idx)}
                className="h-7 w-7 p-0"
              >
                {savedIndexes.has(idx) ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      ));

    case 'collab_matchmaker':
      return result.results.map((creator, idx) => (
        <Card key={idx} className="p-3 bg-white">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-sm">{creator.name}</h4>
                <Badge variant="secondary" className="text-xs">{creator.audience_size}</Badge>
              </div>
              <p className="text-xs text-gray-600 mb-1"><span className="font-semibold">Niche:</span> {creator.niche}</p>
              <p className="text-xs text-gray-700 mb-1"><span className="font-semibold">Why match:</span> {creator.match_reason}</p>
              <p className="text-xs text-purple-700"><span className="font-semibold">Collab idea:</span> {creator.collab_idea}</p>
            </div>
            <div className="flex gap-1 ml-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopy(`${creator.name}\n${creator.collab_idea}`, idx)}
                className="h-7 w-7 p-0"
              >
                {copiedIndex === idx ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleSave(creator, idx)}
                className="h-7 w-7 p-0"
              >
                {savedIndexes.has(idx) ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      ));

    case 'tiny_prompt':
      return result.results.map((prompt, idx) => (
        <Card key={idx} className="p-3 bg-white">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <p className="font-semibold text-sm mb-1">"{prompt.text}"</p>
              <p className="text-xs text-gray-600 mb-1">{prompt.reasoning}</p>
              <Badge variant="outline" className="text-xs">{prompt.response_type}</Badge>
            </div>
            <div className="flex gap-1 ml-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopy(prompt.text, idx)}
                className="h-7 w-7 p-0"
              >
                {copiedIndex === idx ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleSave(prompt, idx)}
                className="h-7 w-7 p-0"
              >
                {savedIndexes.has(idx) ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      ));

    case 'creative_playground':
      return result.results.map((variation, idx) => (
        <Card key={idx} className="p-3 bg-white">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">{variation.idea}</h4>
              <p className="text-xs text-gray-600 mb-1"><span className="font-semibold">Technique:</span> {variation.technique_applied}</p>
              <p className="text-xs text-purple-700"><span className="font-semibold">Impact:</span> {variation.impact}</p>
            </div>
            <div className="flex gap-1 ml-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopy(variation.idea, idx)}
                className="h-7 w-7 p-0"
              >
                {copiedIndex === idx ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleSave(variation, idx)}
                className="h-7 w-7 p-0"
              >
                {savedIndexes.has(idx) ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      ));

    case 'newsletter_generator':
      return result.results.map((newsletter, idx) => (
        <Card key={idx} className="p-3 bg-white">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{newsletter.emoji}</span>
                <h4 className="font-semibold text-sm">{newsletter.title}</h4>
                <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">Day {newsletter.item_number}</Badge>
              </div>
              <p className="text-xs text-gray-700 mb-2">{newsletter.description}</p>
            </div>
            <div className="flex gap-1 ml-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopy(`${newsletter.emoji} ${newsletter.title}\n\n${newsletter.description}`, idx)}
                className="h-7 w-7 p-0"
              >
                {copiedIndex === idx ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleSave(newsletter, idx)}
                className="h-7 w-7 p-0"
              >
                {savedIndexes.has(idx) ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      ));

    default:
      return <p className="text-sm text-gray-600">Unknown result type</p>;
  }
}

function getLibraryItemType(toolType) {
  const typeMap = {
    content_splitter: 'split',
    title_generator: 'title',
    hook_generator: 'hook',
    idea_brainstorm: 'concept',
    idea_rating: 'rating',
    collab_matchmaker: 'collaboration',
    tiny_prompt: 'playground_idea',
    creative_playground: 'creative',
    newsletter_generator: 'newsletter'
  };
  return typeMap[toolType] || 'concept';
}

function getItemTitle(item, toolType) {
  if (item.title) return item.title;
  if (item.text) return item.text.substring(0, 50);
  if (item.name) return item.name;
  if (item.idea) return item.idea.substring(0, 50);
  return `${toolType} result`;
}

// Render single result item based on tool type
function renderSingleResult(item, toolId) {
  switch (toolId) {
    case 'title_generator':
      return (
        <div>
          <h4 className="font-semibold text-sm mb-1">{item.text}</h4>
          <p className="text-xs text-gray-600 mb-1">{item.reasoning}</p>
          <Badge className={`text-xs ${
            item.engagement === 'High' ? 'bg-green-100 text-green-700' :
            item.engagement === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {item.engagement}
          </Badge>
        </div>
      );
    case 'hook_generator':
      return (
        <div>
          <Badge variant="outline" className="text-xs mb-1">{item.hook_type}</Badge>
          <p className="font-semibold text-sm mb-1">"{item.text}"</p>
          <p className="text-xs text-gray-600">{item.strategy}</p>
        </div>
      );
    case 'idea_brainstorm':
      return (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm">{item.title}</h4>
            <Badge className={`text-xs ${
              item.engagement === 'High' ? 'bg-green-100 text-green-700' :
              item.engagement === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {item.engagement}
            </Badge>
          </div>
          <p className="text-xs text-gray-700 mb-1">{item.description}</p>
          <p className="text-xs text-gray-600 italic">{item.reasoning}</p>
        </div>
      );
    case 'idea_rating':
      return (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className={`text-xs ${
              item.rating === 'Strong' ? 'bg-green-600' :
              item.rating === 'Needs Work' ? 'bg-yellow-600' :
              'bg-red-600'
            }`}>
              {item.rating}
            </Badge>
            <span className="text-sm font-semibold">Score: {item.score}/10</span>
          </div>
          <p className="text-sm font-medium mb-2">{item.idea}</p>
          <div className="text-xs space-y-1">
            <div>
              <span className="font-semibold text-green-700">Strengths:</span>
              <ul className="ml-4 mt-1">
                {item.strengths?.map((s, i) => (
                  <li key={i} className="text-gray-700">• {s}</li>
                ))}
              </ul>
            </div>
            <div>
              <span className="font-semibold text-orange-700">Improvements:</span>
              <ul className="ml-4 mt-1">
                {item.improvements?.map((imp, i) => (
                  <li key={i} className="text-gray-700">• {imp}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      );
    case 'content_splitter':
      return (
        <div>
          <h4 className="font-semibold text-sm mb-1">{item.name}</h4>
          <p className="text-sm mb-2">{item.content}</p>
          {item.hashtags && item.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {item.hashtags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}
          {item.notes && <p className="text-xs text-gray-600 italic">{item.notes}</p>}
        </div>
      );
    case 'collab_matchmaker':
      return (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm">{item.name}</h4>
            <Badge variant="secondary" className="text-xs">{item.audience_size}</Badge>
          </div>
          <p className="text-xs text-gray-600 mb-1"><span className="font-semibold">Niche:</span> {item.niche}</p>
          <p className="text-xs text-gray-700 mb-1"><span className="font-semibold">Why match:</span> {item.match_reason}</p>
          <p className="text-xs text-purple-700"><span className="font-semibold">Collab idea:</span> {item.collab_idea}</p>
        </div>
      );
    case 'tiny_prompt':
      return (
        <div>
          <p className="font-semibold text-sm mb-1">"{item.text}"</p>
          <p className="text-xs text-gray-600 mb-1">{item.reasoning}</p>
          <Badge variant="outline" className="text-xs">{item.response_type}</Badge>
        </div>
      );
    case 'creative_playground':
      return (
        <div>
          <h4 className="font-semibold text-sm mb-1">{item.idea}</h4>
          <p className="text-xs text-gray-600 mb-1"><span className="font-semibold">Technique:</span> {item.technique_applied}</p>
          <p className="text-xs text-purple-700"><span className="font-semibold">Impact:</span> {item.impact}</p>
        </div>
      );
    case 'newsletter_generator':
      return (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{item.emoji}</span>
            <h4 className="font-semibold text-sm">{item.title}</h4>
            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">Day {item.item_number}</Badge>
          </div>
          <p className="text-xs text-gray-700">{item.description}</p>
        </div>
      );
    default:
      return <p className="text-sm">{JSON.stringify(item, null, 2)}</p>;
  }
}
