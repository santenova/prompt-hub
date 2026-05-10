import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Copy,
  Check,
  Link2,
  Share2,
  Globe,
  Users,
  Lock,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { apiClient } from "@/apis/client";

export default function ShareLinkModal({ open, onOpenChange, template, onUpdate }) {
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Generate share link ID if doesn't exist
  useEffect(() => {
    if (open && !template.share_link_id && template.visibility !== 'private') {
      generateShareLink();
    }
  }, [open, template]);

  const generateShareLink = async () => {
    setGenerating(true);
    try {
      // Generate unique ID
      const shareLinkId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      await onUpdate({
        share_link_id: shareLinkId,
        last_shared_date: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to generate share link:', error);
    } finally {
      setGenerating(false);
    }
  };

  const regenerateShareLink = async () => {
    await generateShareLink();
  };

  const getShareUrl = () => {
    if (!template.share_link_id) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}${window.location.pathname}?shared=${template.share_link_id}`;
  };

  const copyShareLink = async () => {
    const shareUrl = getShareUrl();
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // Increment share count
    await onUpdate({
      share_count: (template.share_count || 0) + 1,
      last_shared_date: new Date().toISOString()
    });
  };

  const shareUrl = getShareUrl();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Share Template Link
          </DialogTitle>
          <DialogDescription>
            Anyone with this link can view and copy this template
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Visibility */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {template.visibility === 'public' ? (
                <>
                  <Globe className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium">Public Template</div>
                    <div className="text-sm text-gray-600">Visible to everyone</div>
                  </div>
                </>
              ) : template.visibility === 'shared' ? (
                <>
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Shared Template</div>
                    <div className="text-sm text-gray-600">
                      Shared with {template.shared_with?.length || 0} people
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="font-medium">Private Template</div>
                    <div className="text-sm text-gray-600">Only you can see this</div>
                  </div>
                </>
              )}
            </div>
            <Badge variant={template.visibility === 'public' ? 'default' : 'secondary'}>
              {template.visibility}
            </Badge>
          </div>

          {/* Share Link */}
          {template.visibility !== 'private' && (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Shareable Link</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={regenerateShareLink}
                    disabled={generating}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                    Regenerate
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="flex-1 font-mono text-sm"
                  />
                  <Button
                    onClick={copyShareLink}
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
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

                <Alert>
                  <Share2 className="h-4 w-4" />
                  <AlertDescription>
                    Anyone with this link can view and copy this template. If you regenerate the link, the old link will stop working.
                  </AlertDescription>
                </Alert>
              </div>

              {/* Share Statistics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {template.share_count || 0}
                  </div>
                  <div className="text-xs text-gray-600">Times Shared</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {template.fork_count || 0}
                  </div>
                  <div className="text-xs text-gray-600">Times Copied</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {template.downloads || 0}
                  </div>
                  <div className="text-xs text-gray-600">Downloads</div>
                </div>
              </div>

              {template.last_shared_date && (
                <div className="text-sm text-gray-600 text-center">
                  Last shared: {new Date(template.last_shared_date).toLocaleString()}
                </div>
              )}
            </>
          )}

          {template.visibility === 'private' && (
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                This template is private. Change visibility to "Public" or "Shared" in Share Settings to enable link sharing.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {shareUrl && (
            <Button
              onClick={() => window.open(shareUrl, '_blank')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Link
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
