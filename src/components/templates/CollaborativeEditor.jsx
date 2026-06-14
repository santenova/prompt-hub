import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Eye, 
  Edit, 
  MessageSquare, 
  Save,
  Sparkles,
  Clock,
  CheckCircle2,
  X,
  Send,
  User,
  Shield
} from "lucide-react";
import { client } from "@/apis/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CollaborativeEditor({ template, currentUser, onSave, onClose }) {
  const [editedContent, setEditedContent] = useState(template.content);
  const [editedTitle, setEditedTitle] = useState(template.title);
  const [changeNotes, setChangeNotes] = useState('');
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');
  const [newCollaboratorRole, setNewCollaboratorRole] = useState('editor');
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState('edit');
  const [isEditing, setIsEditing] = useState(false);
  const [lastSyncedContent, setLastSyncedContent] = useState(template.content);
  const [hasRemoteChanges, setHasRemoteChanges] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Detect remote changes
  useEffect(() => {
    if (template.content !== lastSyncedContent && template.content !== editedContent) {
      setHasRemoteChanges(true);
      toast({
        title: "Remote Changes Detected",
        description: "Someone else updated this template. Review before saving.",
        variant: "default",
      });
    }
  }, [template.content, lastSyncedContent, editedContent]);

  // Fetch comments
  const { data: comments = [] } = useQuery({
    queryKey: ['template-comments', template.id],
    queryFn: async () => {
      const allComments = await client.entities.TemplateComment.list('-created_date');
      return allComments.filter(c => c.template_id === template.id);
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }) => client.entities.Template.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
      toast({
        title: "Template Updated",
        description: "Changes saved successfully",
      });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: (data) => client.entities.TemplateComment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['template-comments']);
      setNewComment('');
      toast({
        title: "Comment Added",
        description: "Your feedback has been posted",
      });
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({ id, data }) => client.entities.TemplateComment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['template-comments']);
    },
  });

  // Update "currently editing" status and real-time polling
  useEffect(() => {
    const updateEditingStatus = async () => {
      if (!isEditing) return;
      
      const currentEditors = template.active_editors || [];
      if (!currentEditors.includes(currentUser.email)) {
        await updateTemplateMutation.mutateAsync({
          id: template.id,
          data: {
            active_editors: [...currentEditors, currentUser.email]
          }
        });
      }
    };

    updateEditingStatus();
    
    // Poll for changes every 2 seconds for real-time updates
    const interval = setInterval(() => {
      queryClient.invalidateQueries(['templates']);
      queryClient.invalidateQueries(['template-comments']);
    }, 2000);

    // Heartbeat to keep user in active_editors
    const heartbeat = setInterval(() => {
      if (isEditing) {
        updateTemplateMutation.mutate({
          id: template.id,
          data: {
            active_editors: [...new Set([...(template.active_editors || []), currentUser.email])]
          }
        });
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearInterval(heartbeat);
      // Remove user from active_editors when unmounting
      const currentEditors = template.active_editors || [];
      updateTemplateMutation.mutate({
        id: template.id,
        data: {
          active_editors: currentEditors.filter(e => e !== currentUser.email)
        }
      });
    };
  }, [isEditing, template.id, currentUser.email]);

  const handleSave = async () => {
    const newVersion = (template.version || 1) + 1;
    const versionHistory = [
      ...(template.version_history || []),
      {
        version: template.version || 1,
        title: template.title,
        content: template.content,
        category: template.category,
        subcategory: template.subcategory,
        tags: template.tags || [],
        edited_by: template.created_by,
        edited_by_name: currentUser.full_name || currentUser.email,
        saved_date: new Date().toISOString(),
        change_notes: changeNotes || 'No notes provided'
      }
    ];

    const changeLogEntry = {
      timestamp: new Date().toISOString(),
      user_email: currentUser.email,
      user_name: currentUser.full_name || currentUser.email,
      action: 'updated',
      description: changeNotes || 'Template updated via collaborative editor',
      field: 'content'
    };

    const data = {
      title: editedTitle,
      content: editedContent,
      version: newVersion,
      version_history: versionHistory,
      change_log: [...(template.change_log || []), changeLogEntry]
    };

    await updateTemplateMutation.mutateAsync({ id: template.id, data });
    setLastSyncedContent(editedContent);
    setHasRemoteChanges(false);
    
    toast({
      title: "Saved Successfully",
      description: "Your changes have been saved and synced.",
    });
    
    if (onSave) onSave();
  };

  const handleAddCollaborator = async () => {
    if (!newCollaboratorEmail || !newCollaboratorEmail.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    const collaborators = template.collaborators || [];
    if (collaborators.some(c => c.email === newCollaboratorEmail)) {
      toast({
        title: "Already Added",
        description: "This user is already a collaborator",
        variant: "destructive"
      });
      return;
    }

    const newCollaborator = {
      email: newCollaboratorEmail,
      role: newCollaboratorRole,
      added_date: new Date().toISOString()
    };

    const shared_with = template.shared_with || [];
    if (!shared_with.includes(newCollaboratorEmail)) {
      shared_with.push(newCollaboratorEmail);
    }

    await updateTemplateMutation.mutateAsync({
      id: template.id,
      data: {
        collaborators: [...collaborators, newCollaborator],
        shared_with: shared_with,
        visibility: 'shared'
      }
    });

    setNewCollaboratorEmail('');
    toast({
      title: "Collaborator Added",
      description: `${newCollaboratorEmail} can now ${newCollaboratorRole === 'viewer' ? 'view' : 'edit'} this template`,
    });
  };

  const handleRemoveCollaborator = async (email) => {
    const collaborators = (template.collaborators || []).filter(c => c.email !== email);
    const shared_with = (template.shared_with || []).filter(e => e !== email);

    await updateTemplateMutation.mutateAsync({
      id: template.id,
      data: {
        collaborators: collaborators,
        shared_with: shared_with,
        visibility: collaborators.length > 0 ? 'shared' : 'private'
      }
    });

    toast({
      title: "Collaborator Removed",
      description: `${email} no longer has access`,
    });
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    await createCommentMutation.mutateAsync({
      template_id: template.id,
      comment: newComment,
      author_name: currentUser.full_name || currentUser.email,
      author_email: currentUser.email
    });
  };

  const handleResolveComment = async (commentId, isResolved) => {
    await updateCommentMutation.mutateAsync({
      id: commentId,
      data: { is_resolved: !isResolved }
    });
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isOwner = template.created_by === currentUser.email;
  const userRole = template.collaborators?.find(c => c.email === currentUser.email)?.role || (isOwner ? 'admin' : 'viewer');
  const canEdit = userRole === 'editor' || userRole === 'admin';

  const activeEditors = (template.currently_editing || []).filter(
    e => e.email !== currentUser.email && 
    new Date(e.timestamp) > new Date(Date.now() - 5 * 60 * 1000)
  );

  const activeEditorsDisplay = (template.active_editors || []).filter(
    e => e !== currentUser.email
  );

  const handleAcceptRemoteChanges = () => {
    setEditedContent(template.content);
    setEditedTitle(template.title);
    setLastSyncedContent(template.content);
    setHasRemoteChanges(false);
    toast({
      title: "Changes Applied",
      description: "Remote changes have been applied to your editor.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Remote Changes Alert */}
      {hasRemoteChanges && (
        <Alert className="bg-yellow-50 border-yellow-300">
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-600" />
                <span className="font-semibold">Remote changes detected!</span>
                <span className="text-sm">Another user updated this template.</span>
              </div>
              <Button size="sm" variant="outline" onClick={handleAcceptRemoteChanges}>
                Accept Changes
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Active Editors Banner */}
      {activeEditorsDisplay.length > 0 && (
        <Alert className="bg-green-50 border-green-200">
          <Users className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="font-semibold">Live:</span>
              </div>
              {activeEditorsDisplay.map((editor, idx) => (
                <Badge key={idx} className="bg-green-500 animate-pulse">
                  {editor.split('@')[0]}
                </Badge>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="edit">
            Edit
            {isEditing && <span className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
          </TabsTrigger>
          <TabsTrigger value="collaborators">
            Collaborators ({(template.collaborators || []).length})
          </TabsTrigger>
          <TabsTrigger value="comments">
            Comments ({comments.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Versions ({template.version || 1})
          </TabsTrigger>
        </TabsList>

        {/* Edit Tab */}
        <TabsContent value="edit" className="space-y-4">
          {!canEdit && (
            <Alert>
              <Eye className="h-4 w-4" />
              <AlertDescription>
                You have {userRole} access to this template. Request edit access from the owner.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template Title</Label>
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                disabled={!canEdit}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Template Content</Label>
                {isEditing && (
                  <Badge variant="outline" className="text-xs">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></span>
                    Editing...
                  </Badge>
                )}
              </div>
              <Textarea
                value={editedContent}
                onChange={(e) => {
                  setEditedContent(e.target.value);
                  setIsEditing(true);
                }}
                onFocus={() => setIsEditing(true)}
                onBlur={() => setIsEditing(false)}
                rows={15}
                disabled={!canEdit}
                className={`font-mono ${hasRemoteChanges ? 'border-yellow-300 border-2' : ''}`}
              />
            </div>

            {canEdit && (
              <>
                <div className="space-y-2">
                  <Label>Change Notes</Label>
                  <Input
                    placeholder="What did you change?"
                    value={changeNotes}
                    onChange={(e) => setChangeNotes(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleSave} 
                    className="flex-1"
                    disabled={updateTemplateMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateTemplateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                  {onClose && (
                    <Button variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* Collaborators Tab */}
        <TabsContent value="collaborators" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add Collaborators</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isOwner || userRole === 'admin' ? (
                <>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Email address"
                      value={newCollaboratorEmail}
                      onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Select value={newCollaboratorRole} onValueChange={setNewCollaboratorRole}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddCollaborator}>Add</Button>
                  </div>
                  <p className="text-xs text-gray-600">
                    Viewers can see the template, Editors can modify it, Admins can manage collaborators.
                  </p>
                </>
              ) : (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Only the owner or admins can add collaborators.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Collaborators</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Owner */}
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{getInitials(template.created_by)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{template.created_by}</p>
                    <p className="text-xs text-gray-600">Owner</p>
                  </div>
                </div>
                <Badge className="bg-purple-600">Owner</Badge>
              </div>

              {/* Collaborators */}
              {(template.collaborators || []).map((collab, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{getInitials(collab.email)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{collab.email}</p>
                      <p className="text-xs text-gray-600">
                        Added {new Date(collab.added_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={collab.role === 'admin' ? 'default' : 'secondary'}>
                      {collab.role}
                    </Badge>
                    {(isOwner || userRole === 'admin') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCollaborator(collab.email)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {(template.collaborators || []).length === 0 && (
                <p className="text-center text-gray-500 py-4">No collaborators yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add Comment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Share your feedback or suggestions..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
              <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                <Send className="w-4 h-4 mr-2" />
                Post Comment
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {comments.map((comment) => (
              <Card key={comment.id} className={comment.is_resolved ? 'bg-gray-50' : ''}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(comment.author_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{comment.author_name}</p>
                          <p className="text-xs text-gray-600">
                            {new Date(comment.created_date).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-800">{comment.comment}</p>
                    </div>
                    {(isOwner || userRole === 'admin') && (
                      <Button
                        variant={comment.is_resolved ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleResolveComment(comment.id, comment.is_resolved)}
                      >
                        {comment.is_resolved ? (
                          <>Reopen</>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Resolve
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {comments.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  No comments yet. Be the first to share feedback!
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Version History</CardTitle>
              <CardDescription>
                Current version: {template.version || 1}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(template.version_history || []).reverse().map((version, idx) => (
                <Card key={idx} className="bg-gray-50">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <Badge>Version {version.version}</Badge>
                        <p className="text-sm font-medium mt-1">{version.title}</p>
                      </div>
                      <p className="text-xs text-gray-600">
                        {new Date(version.saved_date).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      Edited by: {version.edited_by_name || version.edited_by}
                    </p>
                    {version.change_notes && (
                      <p className="text-sm text-gray-700 italic">"{version.change_notes}"</p>
                    )}
                  </CardContent>
                </Card>
              ))}

              {(template.version_history || []).length === 0 && (
                <p className="text-center text-gray-500 py-4">No version history yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
