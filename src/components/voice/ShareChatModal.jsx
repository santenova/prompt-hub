import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Share2, Users, Globe, X, Plus, Mail } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { apiClient } from "@/apis/client";
import { createPageUrl } from "../../utils";

export default function ShareChatModal({ open, onOpenChange, session, onUpdate }) {
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState('viewer');
  const [isPublic, setIsPublic] = useState(session?.is_public || false);
  const [sharing, setSharing] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    if (!shareEmail.trim() || !session) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shareEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setSharing(true);
    try {
      const sharedWith = session.shared_with || [];
      const alreadyShared = sharedWith.find(s => s.email === shareEmail.trim());
      
      if (alreadyShared) {
        toast({
          title: "Already Shared",
          description: "This chat is already shared with this user",
          variant: "destructive"
        });
        return;
      }

      const updatedSharedWith = [
        ...sharedWith,
        {
          email: shareEmail.trim(),
          permission: sharePermission,
          shared_date: new Date().toISOString()
        }
      ];

      await apiClient.entities.VoiceChat.update(session.id, {
        shared_with: updatedSharedWith
      });

      // Send email notification
      await apiClient.integrations.Core.SendEmail({
        to: shareEmail.trim(),
        subject: `Voice chat shared with you: ${session.name}`,
        body: `A voice chat session has been shared with you.\n\nChat: ${session.name}\nPermission: ${sharePermission}\nMessages: ${session.messages.length}\n\nSign in to view the conversation.`
      });

      toast({
        title: "Chat Shared",
        description: `Shared with ${shareEmail} as ${sharePermission}`
      });

      setShareEmail('');
      if (onUpdate) onUpdate();
    } catch (error) {
      toast({
        title: "Share Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSharing(false);
    }
  };

  const handleRemoveShare = async (emailToRemove) => {
    try {
      const updatedSharedWith = (session.shared_with || []).filter(s => s.email !== emailToRemove);
      
      await apiClient.entities.VoiceChat.update(session.id, {
        shared_with: updatedSharedWith
      });

      toast({
        title: "Access Removed",
        description: `Removed ${emailToRemove}`
      });

      if (onUpdate) onUpdate();
    } catch (error) {
      toast({
        title: "Remove Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const togglePublic = async () => {
    try {
      await apiClient.entities.VoiceChat.update(session.id, {
        is_public: !isPublic
      });

      setIsPublic(!isPublic);
      toast({
        title: isPublic ? "Made Private" : "Made Public",
        description: isPublic ? "Only shared users can access" : "Anyone with the link can view"
      });

      if (onUpdate) onUpdate();
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-purple-600" />
            Share Chat
          </DialogTitle>
          <DialogDescription>
            Share "{session.name}" with others
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Public Access Toggle */}
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm font-semibold">Public Access</p>
                <p className="text-xs text-gray-600">Anyone with link can view</p>
              </div>
            </div>
            <Switch checked={isPublic} onCheckedChange={togglePublic} />
          </div>

          {/* Share with Specific Users */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Share with Specific Users
            </Label>
            
            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleShare()}
                />
                <Select value={sharePermission} onValueChange={setSharePermission}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer (Read-only)</SelectItem>
                    <SelectItem value="editor">Editor (Can contribute)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleShare} 
                disabled={!shareEmail.trim() || sharing}
                className="self-start bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Shared Users List */}
          {session.shared_with && session.shared_with.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">Shared With ({session.shared_with.length})</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {session.shared_with.map((share, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                    <div>
                      <p className="text-sm font-medium">{share.email}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {share.permission}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveShare(share.email)}
                      className="h-7 w-7 text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Copy Link */}
          {isPublic && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <Label className="text-xs text-gray-600 mb-1">Public Link</Label>
              <div className="flex gap-2">
                <Input 
                  value={`${window.location.origin}${createPageUrl('SharedChat')}?id=${session.id}`}
                  readOnly
                  className="text-xs"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}${createPageUrl('SharedChat')}?id=${session.id}`);
                    toast({ title: "Link Copied" });
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
