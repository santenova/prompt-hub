import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Star, Copy, Download, Trash2, Edit, MoreVertical,
  Folder, Tag, Clock, History, FileText, ChevronLeft, ChevronRight,
  Youtube, Twitter, Instagram, Linkedin, Facebook, Mail, Globe, Share2, Video, MessageCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import moment from 'moment';

export default function ContentItemCard({
  item,
  onFavorite,
  onStatusChange,
  onMove,
  onTag,
  onDelete,
  onCopy,
  onDownload,
  onShowHistory,
  allFolders,
  allTags,
  autoRotate = false
}) {
  const [variationIndex, setVariationIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);

  // Normalize variations
  const variations = React.useMemo(() => {
    if (item.generated_content && item.generated_content.length > 0) {
      return item.generated_content;
    }
    return [{ 
      title: item.topic, 
      content: item.content || item.enhanced_content || '' 
    }];
  }, [item]);

  // Auto-rotate effect
  React.useEffect(() => {
    if (!autoRotate || variations.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setVariationIndex((prev) => (prev + 1) % variations.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [autoRotate, variations.length, isHovered]);

  const currentVariation = variations[variationIndex] || variations[0];
  const content = currentVariation.content || '';
  const title = currentVariation.title || item.topic || 'Untitled Content';
  const wordCount = item.word_count || content.split(/\s+/).length;

  const nextVariation = (e) => {
    e.stopPropagation();
    setVariationIndex((prev) => (prev + 1) % variations.length);
  };

  const prevVariation = (e) => {
    e.stopPropagation();
    setVariationIndex((prev) => (prev - 1 + variations.length) % variations.length);
  };

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    published: 'bg-purple-100 text-purple-700',
    archived: 'bg-orange-100 text-orange-700'
  };

  const toolIcons = {
    ai_content_generator: '✨',
    advanced_ai: '🧠',
    voice_template_variation: '🎤',
    ai_image_generator: '🎨'
  };

  const platformIcons = {
    'YouTube': <Youtube className="w-3 h-3" />,
    'YouTube Shorts': <Youtube className="w-3 h-3" />,
    'Twitter': <Twitter className="w-3 h-3" />,
    'X': <Twitter className="w-3 h-3" />,
    'X (Twitter)': <Twitter className="w-3 h-3" />,
    'Instagram': <Instagram className="w-3 h-3" />,
    'Instagram Reels': <Instagram className="w-3 h-3" />,
    'LinkedIn': <Linkedin className="w-3 h-3" />,
    'Facebook': <Facebook className="w-3 h-3" />,
    'Email': <Mail className="w-3 h-3" />,
    'Website': <Globe className="w-3 h-3" />,
    'Blog': <FileText className="w-3 h-3" />,
    'TikTok': <Video className="w-3 h-3" />,
    'Pinterest': <Share2 className="w-3 h-3" />,
    'Snapchat': <MessageCircle className="w-3 h-3" />
  };

  const getPlatformIcon = (p) => {
    // Try exact match
    if (platformIcons[p]) return platformIcons[p];
    // Try checking if key is contained in platform string
    const key = Object.keys(platformIcons).find(k => p.includes(k));
    return key ? platformIcons[key] : <Share2 className="w-3 h-3" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full"
    >
      <Card 
        className="hover:shadow-lg transition-all duration-200 border-2 border-gray-200 hover:border-purple-300 h-full overflow-hidden flex flex-col"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate mb-1">{title}</h3>
              <div className="flex flex-wrap gap-1 items-center">
                <Badge className={statusColors[item.status || 'draft']}>
                  {item.status || 'draft'}
                </Badge>
                {item.tool_type && (
                  <Badge variant="outline" className="text-xs">
                    {toolIcons[item.tool_type]} {item.tool_type.replace('_', ' ')}
                  </Badge>
                )}
                {item.version > 1 && (
                  <Badge variant="outline" className="text-xs">
                    v{item.version}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onFavorite(!item.is_favorite)}
                className="h-8 w-8"
              >
                <Star className={`w-4 h-4 ${item.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onCopy(content)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Content
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDownload(content, title, item)}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onShowHistory}>
                    <History className="w-4 h-4 mr-2" />
                    Version History
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Folder className="w-4 h-4 mr-2" />
                      Move to Folder
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {allFolders.map(folder => (
                        <DropdownMenuItem key={folder} onClick={() => onMove(folder)}>
                          {folder}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Edit className="w-4 h-4 mr-2" />
                      Change Status
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {['draft', 'in_progress', 'completed', 'published', 'archived'].map(status => (
                        <DropdownMenuItem key={status} onClick={() => onStatusChange(status)}>
                          {status}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Content Preview - Expanded */}
          <div className="bg-gray-50 p-4 rounded-lg flex-grow min-h-[100px] relative group">
            {/* Image Preview for AI Image Generator */}
            {item.tool_type === 'ai_image_generator' && item.image_url ? (
              <div className="relative w-full h-48 rounded-lg overflow-hidden">
                <img 
                  src={item.image_url} 
                  alt={item.image_prompt || 'Generated image'} 
                  className="w-full h-full object-cover"
                />
                {item.image_prompt && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <p className="text-xs text-white line-clamp-2">{item.image_prompt}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-[8]">
                {content}
              </p>
            )}
            
            {/* Variation Navigation */}
            {variations.length > 1 && (
              <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full shadow-sm p-1 border border-gray-100 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 rounded-full" 
                  onClick={prevVariation}
                  title="Previous Variation"
                >
                  <ChevronLeft className="w-3 h-3" />
                </Button>
                <span className="text-[10px] font-medium text-gray-500 w-12 text-center">
                  {variationIndex + 1} / {variations.length}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 rounded-full" 
                  onClick={nextVariation}
                  title="Next Variation"
                >
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            )}

            {/* Variation Badge (Top Right) */}
            {variations.length > 1 && (
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 shadow-sm text-[10px] px-1.5 h-5">
                  Variation {variationIndex + 1}
                </Badge>
              </div>
            )}
          </div>

          {/* Consolidated Metadata */}
          <div className="space-y-3 pt-2">
            {/* Primary Attributes (Platform, Tone, Goal) */}
            <div className="flex flex-wrap gap-2 text-xs">
              {(item.global_inputs?.platforms?.length > 0 || item.global_inputs?.platform) && (
                <div className="flex flex-wrap gap-1">
                  {(Array.isArray(item.global_inputs?.platforms) 
                    ? item.global_inputs.platforms 
                    : [item.global_inputs?.platform]
                  ).map((p, i) => (
                    <Badge key={i} variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center gap-1 pr-2">
                      {getPlatformIcon(p)}
                      {p}
                    </Badge>
                  ))}
                </div>
              )}
              {(item.tone || item.global_inputs?.tone) && (
                <Badge variant="secondary" className="bg-pink-50 text-pink-700 hover:bg-pink-100">
                  {item.tone || item.global_inputs?.tone}
                </Badge>
              )}
              {item.global_inputs?.primaryGoal && (
                <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100">
                  {item.global_inputs.primaryGoal}
                </Badge>
              )}
            </div>

            {/* Secondary Attributes (Audience, Topic) - Text only to reduce noise */}
            {(item.global_inputs?.targetAudience || (item.topic && item.topic !== title)) && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                {item.global_inputs?.targetAudience && (
                  <span className="flex items-center gap-1">
                    <span className="font-semibold">Audience:</span> {item.global_inputs.targetAudience}
                  </span>
                )}
                {item.topic && item.topic !== title && (
                   <span className="flex items-center gap-1">
                    <span className="font-semibold">Topic:</span> {item.topic}
                  </span>
                )}
              </div>
            )}

            {/* Folder & Tags */}
            <div className="flex items-center justify-between border-t pt-2 mt-2">
              <div className="flex flex-wrap gap-2 items-center">
                {item.folder && (
                  <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                    <Folder className="w-3 h-3" />
                    <span>{item.folder}</span>
                  </div>
                )}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex items-center gap-1">
                    {item.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-xs text-gray-500 flex items-center bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                        <Tag className="w-2 h-2 mr-1 opacity-50" />
                        {tag}
                      </span>
                    ))}
                    {item.tags.length > 3 && (
                      <span className="text-[10px] text-gray-400">+{item.tags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {moment(item.created_date).fromNow()}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {wordCount} words
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-[10px] px-1.5 h-5 flex items-center">
                  {variations.length} variation{variations.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}