import React, { useState } from 'react';
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Globe, 
  Users, 
  Lock, 
  Link as LinkIcon, 
  Copy, 
  Check, 
  Calendar,
  Eye,
  Download,
  Share2,
  TrendingUp
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TemplateShareModal({ open, onOpenChange, template, onSave, isSaving }) {
  // Initialize state from template, including collaborators
  const getInitialSharedWith = () => {
    const emails = new Set(template?.shared_with || []);
    // Also include collaborators
    (template?.collaborators || []).forEach(c => emails.add(c.email));
    return Array.from(emails);
  };

  const getInitialPermissions = () => {
    const perms = { ...(template?.user_permissions || {}) };
    // Also include collaborator permissions
    (template?.collaborators || []).forEach(c => {
      if (!perms[c.email]) {
        perms[c.email] = c.permission === 'admin' ? 'edit' : c.permission;
      }
    });
    return perms;
  };

  const [visibility, setVisibility] = useState(template?.visibility || 'private');
  const [sharedWith, setSharedWith] = useState(getInitialSharedWith());
  const [newEmail, setNewEmail] = useState('');
  const [newPermission, setNewPermission] = useState('view');
  const [userPermissions, setUserPermissions] = useState(getInitialPermissions());
  const [shareLinkEnabled, setShareLinkEnabled] = useState(template?.share_link_enabled || false);
  const [linkExpiration, setLinkExpiration] = useState('never');
  const [linkPermission, setLinkPermission] = useState(template?.link_permission || 'view');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('visibility');

  // Reset state when template changes
  React.useEffect(() => {
    if (template) {
      setVisibility(template.visibility || 'private');
      setSharedWith(getInitialSharedWith());
      setUserPermissions(getInitialPermissions());
      setShareLinkEnabled(template.share_link_enabled || false);
      setLinkPermission(template.link_permission || 'view');
    }
  }, [template?.id]);

  const generateShareLink = () => {
    if (!template?.share_link) {
      return `${window.location.origin}/shared/${btoa(template?.id || 'temp')}`;
    }
    return `${window.location.origin}/shared/${template.share_link}`;
  };

  const handleCopyLink = async () => {
    const link = generateShareLink();
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddEmail = () => {
    if (newEmail && newEmail.includes('@') && !sharedWith.includes(newEmail)) {
      setSharedWith([...sharedWith, newEmail]);
      setUserPermissions({...userPermissions, [newEmail]: newPermission});
      setNewEmail('');
      setNewPermission('view');
    }
  };

  const handleUpdatePermission = (email, permission) => {
    setUserPermissions({...userPermissions, [email]: permission});
  };

  const handleRemoveEmail = (email) => {
    setSharedWith(sharedWith.filter(e => e !== email));
    const newPermissions = {...userPermissions};
    delete newPermissions[email];
    setUserPermissions(newPermissions);
  };

  const handleSave = () => {
    // Build collaborators array from shared_with and userPermissions
    const collaborators = sharedWith.map(email => ({
      email,
      permission: userPermissions[email] || 'view',
      invited_date: new Date().toISOString(),
      invited_by: template?.created_by
    }));

    const shareData = {
      visibility,
      shared_with: sharedWith,
      user_permissions: userPermissions,
      collaborators: collaborators,
      share_link_enabled: shareLinkEnabled,
      link_permission: linkPermission,
      is_public: visibility === 'public',
    };

    // Generate share link ID if enabling for first time
    if (shareLinkEnabled && !template?.share_link) {
      shareData.share_link = btoa(`${template.id}-${Date.now()}`).replace(/=/g, '');
    }

    // Set expiration if applicable
    if (shareLinkEnabled && linkExpiration !== 'never') {
      const expirationDate = new Date();
      switch (linkExpiration) {
        case '1day':
          expirationDate.setDate(expirationDate.getDate() + 1);
          break;
        case '7days':
          expirationDate.setDate(expirationDate.getDate() + 7);
          break;
        case '30days':
          expirationDate.setDate(expirationDate.getDate() + 30);
          break;
      }
      shareData.share_link_expires = expirationDate.toISOString();
    }

    // Increment share count if making public or sharing
    if ((visibility === 'public' || shareLinkEnabled) && template?.visibility === 'private') {
      shareData.share_count = (template.share_count || 0) + 1;
    }

    onSave(shareData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-purple-600" />
            Share "{template?.title}"
          </DialogTitle>
          <DialogDescription>
            Control who can access and use this template
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="visibility">
              <Eye className="w-4 h-4 mr-2" />
              Visibility
            </TabsTrigger>
            <TabsTrigger value="link">
              <LinkIcon className="w-4 h-4 mr-2" />
              Share Link
            </TabsTrigger>
            <TabsTrigger value="stats">
              <TrendingUp className="w-4 h-4 mr-2" />
              Stats
            </TabsTrigger>
          </TabsList>

          {/* Visibility Tab */}
          <TabsContent value="visibility" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Who can access this template?</Label>
                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        <div>
                          <div className="font-medium">Private</div>
                          <div className="text-xs text-gray-500">Only you can access</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="shared">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <div>
                          <div className="font-medium">Shared with specific people</div>
                          <div className="text-xs text-gray-500">Only invited users</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        <div>
                          <div className="font-medium">Public</div>
                          <div className="text-xs text-gray-500">Anyone can view and copy</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {visibility === 'shared' && (
                <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                  <Label>Share with specific people</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter email address..."
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                      type="email"
                      className="flex-1"
                    />
                    <Select value={newPermission} onValueChange={setNewPermission}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="view">View only</SelectItem>
                        <SelectItem value="contribute">Can suggest</SelectItem>
                        <SelectItem value="edit">Can edit</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddEmail} size="sm">
                      Add
                    </Button>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>• <strong>View only:</strong> Can see and copy</p>
                    <p>• <strong>Can suggest:</strong> Can suggest improvements</p>
                    <p>• <strong>Can edit:</strong> Can modify directly</p>
                  </div>
                  {sharedWith.length > 0 && (
                    <div className="space-y-2 mt-3">
                      <Label className="text-xs text-gray-600">Shared with ({sharedWith.length}):</Label>
                      {sharedWith.map((email) => (
                        <div key={email} className="flex items-center justify-between p-2 bg-white rounded border">
                          <span className="text-sm flex-1">{email}</span>
                          <Select 
                            value={userPermissions[email] || 'view'} 
                            onValueChange={(val) => handleUpdatePermission(email, val)}
                          >
                            <SelectTrigger className="w-[130px] mr-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="view">View only</SelectItem>
                              <SelectItem value="contribute">Can suggest</SelectItem>
                              <SelectItem value="edit">Can edit</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveEmail(email)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {visibility === 'public' && (
                <Alert>
                  <Globe className="h-4 w-4" />
                  <AlertDescription>
                    Your template will be visible in the public community feed. Anyone can view, copy, and use it.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          {/* Share Link Tab */}
          <TabsContent value="link" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                <div className="flex-1">
                  <Label className="text-base">Enable share link</Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Anyone with the link can view and copy this template
                  </p>
                </div>
                <Switch
                  checked={shareLinkEnabled}
                  onCheckedChange={setShareLinkEnabled}
                />
              </div>

              {shareLinkEnabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Link permission</Label>
                      <Select value={linkPermission} onValueChange={setLinkPermission}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="view">View only</SelectItem>
                          <SelectItem value="contribute">Can suggest</SelectItem>
                          <SelectItem value="edit">Can edit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Link expiration</Label>
                      <Select value={linkExpiration} onValueChange={setLinkExpiration}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="never">Never expires</SelectItem>
                          <SelectItem value="1day">1 day</SelectItem>
                          <SelectItem value="7days">7 days</SelectItem>
                          <SelectItem value="30days">30 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Shareable link</Label>
                    <div className="flex gap-2">
                      <Input
                        value={generateShareLink()}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button onClick={handleCopyLink} variant="outline">
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
                    <p className="text-xs text-gray-500">
                      {linkExpiration === 'never' 
                        ? 'This link will work indefinitely' 
                        : `This link will expire in ${linkExpiration.replace('days', ' days').replace('day', ' day')}`
                      }
                    </p>
                  </div>

                  {template?.share_link_expires && new Date(template.share_link_expires) > new Date() && (
                    <Alert>
                      <Calendar className="h-4 w-4" />
                      <AlertDescription>
                        Current link expires on {new Date(template.share_link_expires).toLocaleDateString()}
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <Eye className="w-4 h-4" />
                  <span className="text-xs font-medium">Views</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{template?.view_count || 0}</div>
                <p className="text-xs text-gray-600 mt-1">
                  {template?.unique_viewers?.length || 0} unique viewers
                </p>
              </div>

              <div className="p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  <Download className="w-4 h-4" />
                  <span className="text-xs font-medium">Copies</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{template?.copy_count || 0}</div>
                <p className="text-xs text-gray-600 mt-1">Times copied to library</p>
              </div>

              <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <Share2 className="w-4 h-4" />
                  <span className="text-xs font-medium">Shares</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{template?.share_count || 0}</div>
                <p className="text-xs text-gray-600 mt-1">Times shared</p>
              </div>

              <div className="p-4 border rounded-lg bg-gradient-to-br from-orange-50 to-yellow-50">
                <div className="flex items-center gap-2 text-orange-600 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-medium">Rating</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {template?.rating ? template.rating.toFixed(1) : '0.0'}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {template?.rating_count || 0} ratings
                </p>
              </div>
            </div>

            {visibility === 'public' && (
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  <strong>Trending Score: {template?.trending_score || 0}</strong>
                  <br />
                  Based on recent views, copies, and ratings. Higher scores appear first in community feed.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}