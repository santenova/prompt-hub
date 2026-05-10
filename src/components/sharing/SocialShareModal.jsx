import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Twitter,
  Linkedin,
  Facebook,
  Link as LinkIcon,
  Copy,
  Check,
  Eye,
  Share2,
  Mail,
  MessageCircle,
  Globe,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";

export default function SocialShareModal({ 
  open, 
  onOpenChange, 
  item, // persona or template
  type, // 'persona' or 'template'
  shareUrl 
}) {
  const [copied, setCopied] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [activeTab, setActiveTab] = useState('platforms');

  useEffect(() => {
    if (item) {
      // Generate default message
      const defaultMsg = type === 'persona' 
        ? `Check out this ${item.category} persona: "${item.name}" - ${item.description}`
        : `Check out this ${item.category} template: "${item.title}" - ${item.description}`;
      setCustomMessage(defaultMsg);
    }
  }, [item, type]);

  if (!item) return null;

  const fullShareUrl = shareUrl || `${window.location.origin}/shared/${type}/${item.id}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(fullShareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLinks = {
    twitter: () => {
      const text = customMessage || (type === 'persona' ? item.name : item.title);
      const hashtags = type === 'persona' 
        ? `AIPersona,${item.category}` 
        : `AIPrompt,${item.category}`;
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(fullShareUrl)}&hashtags=${hashtags}`;
    },
    linkedin: () => {
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullShareUrl)}`;
    },
    facebook: () => {
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullShareUrl)}`;
    },
    email: () => {
      const subject = type === 'persona' 
        ? `Check out this AI Persona: ${item.name}`
        : `Check out this AI Template: ${item.title}`;
      const body = `${customMessage}\n\n${fullShareUrl}`;
      return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    },
    whatsapp: () => {
      const text = `${customMessage}\n${fullShareUrl}`;
      return `https://wa.me/?text=${encodeURIComponent(text)}`;
    },
    reddit: () => {
      const title = type === 'persona' ? item.name : item.title;
      return `https://reddit.com/submit?url=${encodeURIComponent(fullShareUrl)}&title=${encodeURIComponent(title)}`;
    }
  };

  const handleShare = (platform) => {
    const url = shareLinks[platform]();
    window.open(url, '_blank', 'width=600,height=400');
    setSelectedPlatform(platform);
  };

  const platforms = [
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'from-blue-400 to-blue-600',
      description: 'Share with your followers',
      action: () => handleShare('twitter')
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'from-blue-600 to-blue-800',
      description: 'Share professionally',
      action: () => handleShare('linkedin')
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'from-blue-500 to-blue-700',
      description: 'Share with friends',
      action: () => handleShare('facebook')
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'from-green-500 to-green-700',
      description: 'Share via message',
      action: () => handleShare('whatsapp')
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'from-gray-500 to-gray-700',
      description: 'Share via email',
      action: () => handleShare('email')
    },
    {
      name: 'Reddit',
      icon: Globe,
      color: 'from-orange-500 to-red-600',
      description: 'Share on Reddit',
      action: () => handleShare('reddit')
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-purple-600" />
            Share {type === 'persona' ? 'Persona' : 'Template'}
          </DialogTitle>
          <DialogDescription>
            Share "{type === 'persona' ? item.name : item.title}" with your network
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="platforms">
              <Share2 className="w-4 h-4 mr-2" />
              Platforms
            </TabsTrigger>
            <TabsTrigger value="customize">
              <Sparkles className="w-4 h-4 mr-2" />
              Customize
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>

          {/* Platforms Tab */}
          <TabsContent value="platforms" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              {platforms.map((platform, idx) => {
                const Icon = platform.icon;
                return (
                  <motion.div
                    key={platform.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Button
                      onClick={platform.action}
                      className={`w-full h-auto p-4 bg-gradient-to-r ${platform.color} hover:opacity-90 transition-all`}
                      variant="default"
                    >
                      <div className="flex flex-col items-center gap-2 w-full">
                        <Icon className="w-6 h-6" />
                        <div className="text-center">
                          <div className="font-semibold">{platform.name}</div>
                          <div className="text-xs opacity-90">{platform.description}</div>
                        </div>
                      </div>
                    </Button>
                  </motion.div>
                );
              })}
            </div>

            <div className="pt-4 border-t">
              <Label className="text-sm font-semibold mb-3 block">Or copy link</Label>
              <div className="flex gap-2">
                <Input
                  value={fullShareUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button onClick={handleCopyLink} variant="outline" className="flex-shrink-0">
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Customize Tab */}
          <TabsContent value="customize" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-message">Custom Message</Label>
                <Textarea
                  id="custom-message"
                  placeholder="Add a personal message..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="min-h-[120px]"
                />
                <p className="text-xs text-gray-500">
                  This message will be included when sharing (character limit may vary by platform)
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Tips for better sharing</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Keep messages concise and engaging</li>
                      <li>• Add relevant hashtags for better reach</li>
                      <li>• Mention the key benefits or use cases</li>
                      <li>• Tag relevant people or communities</li>
                    </ul>
                  </div>
                </div>
              </div>

              {type === 'template' && item.tags && item.tags.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">Suggested Hashtags</Label>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.slice(0, 5).map((tag, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="cursor-pointer hover:bg-purple-200"
                        onClick={() => {
                          const hashtag = `#${tag.replace(/\s+/g, '')}`;
                          if (!customMessage.includes(hashtag)) {
                            setCustomMessage(customMessage + ' ' + hashtag);
                          }
                        }}
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Share Preview</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  This is how your share will appear on social platforms
                </p>
              </div>

              {/* Social Media Card Preview */}
              <Card className="border-2 overflow-hidden">
                <div className={`h-32 bg-gradient-to-r ${type === 'persona' ? item.color : 'from-purple-500 to-indigo-600'} flex items-center justify-center`}>
                  {type === 'persona' ? (
                    <div className="text-6xl">{item.icon}</div>
                  ) : (
                    <Sparkles className="w-16 h-16 text-white" />
                  )}
                </div>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-1">
                      {type === 'persona' ? item.name : item.title}
                    </h3>
                    <Badge className="mb-2">{item.category}</Badge>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  {customMessage && (
                    <div className="pt-3 border-t">
                      <p className="text-sm text-gray-700 italic">
                        "{customMessage}"
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <LinkIcon className="w-3 h-3" />
                      {window.location.hostname}
                    </span>
                    {type === 'template' && item.use_count > 0 && (
                      <span>{item.use_count} uses</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Platform-specific previews */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Twitter className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-semibold">Twitter Preview</span>
                  </div>
                  <p className="text-xs text-gray-700 line-clamp-3">
                    {customMessage || (type === 'persona' ? item.name : item.title)}
                  </p>
                  <p className="text-xs text-blue-600 mt-1 truncate">{fullShareUrl}</p>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Linkedin className="w-4 h-4 text-blue-700" />
                    <span className="text-xs font-semibold">LinkedIn Preview</span>
                  </div>
                  <p className="text-xs text-gray-700 line-clamp-3">
                    {customMessage || item.description}
                  </p>
                  <p className="text-xs text-blue-700 mt-1 truncate">{fullShareUrl}</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={() => handleCopyLink()}
            className="bg-gradient-to-r from-purple-600 to-indigo-600"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}