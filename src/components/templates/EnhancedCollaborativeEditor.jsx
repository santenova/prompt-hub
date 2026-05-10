import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Eye, Edit, Save, X, Clock, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/apis/client";

export default function EnhancedCollaborativeEditor({ 
  template, 
  currentUser, 
  onSave, 
  onClose 
}) {
  const [title, setTitle] = useState(template.title);
  const [content, setContent] = useState(template.content);
  const [activeUsers, setActiveUsers] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [cursorPositions, setCursorPositions] = useState({});

  // Simulate real-time presence
  useEffect(() => {
    // Add current user to active editors
    const updateActiveEditors = async () => {
      const currentEditors = template.active_editors || [];
      if (!currentEditors.includes(currentUser.email)) {
        await apiClient.entities.Template.update(template.id, {
          active_editors: [...currentEditors, currentUser.email]
        });
      }
    };

    updateActiveEditors();

    // Poll for active editors every 5 seconds
    const interval = setInterval(async () => {
      try {
        const updated = await apiClient.entities.Template.filter({ id: template.id });
        if (updated && updated[0]) {
          const editors = updated[0].active_editors || [];
          const collaborators = updated[0].collaborators || [];
          
          // Get user details for active editors
          const editorDetails = editors
            .filter(email => email !== currentUser.email)
            .map(email => {
              const collab = collaborators.find(c => c.email === email);
              return {
                email,
                name: collab?.invited_by || email.split('@')[0],
                permission: collab?.permission || 'viewer',
                color: getColorForUser(email)
              };
            });
          
          setActiveUsers(editorDetails);
        }
      } catch (error) {
        console.error('Error fetching active editors:', error);
      }
    }, 5000);

    // Cleanup: Remove user from active editors when unmounting
    return () => {
      clearInterval(interval);
      const removeFromActive = async () => {
        try {
          const updated = await apiClient.entities.Template.filter({ id: template.id });
          if (updated && updated[0]) {
            const editors = (updated[0].active_editors || []).filter(e => e !== currentUser.email);
            await apiClient.entities.Template.update(template.id, {
              active_editors: editors
            });
          }
        } catch (error) {
          console.error('Error removing from active editors:', error);
        }
      };
      removeFromActive();
    };
  }, [template.id, currentUser.email]);

  const getColorForUser = (email) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-pink-500', 'bg-purple-500', 'bg-indigo-500'];
    const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const getUserInitials = (email) => {
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  const handleContentChange = (newContent) => {
    setContent(newContent);
    setHasChanges(true);
  };

  const handleTitleChange = (newTitle) => {
    setTitle(newTitle);
    setHasChanges(true);
  };

  const handleSave = async () => {
    const changeLogEntry = {
      timestamp: new Date().toISOString(),
      user_email: currentUser.email,
      user_name: currentUser.full_name || currentUser.email,
      action: 'updated',
      description: 'Template updated in collaborative session',
      field: 'content',
      old_value: template.content,
      new_value: content
    };

    const versionHistoryEntry = {
      version: template.version || 1,
      title: template.title,
      content: template.content,
      category: template.category,
      subcategory: template.subcategory,
      tags: template.tags,
      edited_by: currentUser.email,
      edited_by_name: currentUser.full_name || currentUser.email,
      saved_date: new Date().toISOString(),
      change_notes: 'Collaborative edit'
    };

    await onSave(template.id, {
      title,
      content,
      version: (template.version || 1) + 1,
      version_history: [...(template.version_history || []), versionHistoryEntry],
      change_log: [...(template.change_log || []), changeLogEntry]
    });

    setHasChanges(false);
    setLastSaved(new Date().toISOString());
  };

  const canEdit = () => {
    const isOwner = template.created_by === currentUser.email;
    const collaborator = template.collaborators?.find(c => c.email === currentUser.email);
    return isOwner || collaborator?.permission === 'editor' || collaborator?.permission === 'admin';
  };

  return (
    <div className="space-y-4">
      {/* Active Users Banner */}
      <AnimatePresence>
        {activeUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    {activeUsers.length} {activeUsers.length === 1 ? 'person' : 'people'} viewing this prompt
                  </p>
                  <p className="text-xs text-blue-700">
                    Real-time collaboration active
                  </p>
                </div>
              </div>
              <div className="flex -space-x-2">
                {activeUsers.map((user, idx) => (
                  <div key={user.email} className="relative group">
                    <Avatar className={`w-8 h-8 border-2 border-white ${user.color}`}>
                      <AvatarFallback className="text-white text-xs">
                        {getUserInitials(user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {user.email}
                      <div className="flex items-center gap-1 mt-1">
                        {user.permission === 'viewer' ? <Eye className="w-3 h-3" /> : <Edit className="w-3 h-3" />}
                        <span className="capitalize">{user.permission}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Collaborative Editing</CardTitle>
            <div className="flex items-center gap-2">
              {lastSaved && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>Saved {new Date(lastSaved).toLocaleTimeString()}</span>
                </div>
              )}
              {hasChanges && canEdit() && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  Unsaved changes
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {!canEdit() && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                You have view-only access. Request editor permission to make changes.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              disabled={!canEdit()}
              className="font-semibold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Content</label>
            <Textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              disabled={!canEdit()}
              className="min-h-[400px] font-mono text-sm"
            />
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <User className="w-3 h-3" />
              <span>Editing as {currentUser.full_name || currentUser.email}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
              >
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
              {canEdit() && (
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Version History Preview */}
      {template.version_history && template.version_history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Changes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {template.version_history.slice(-5).reverse().map((version, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">v{version.version}</Badge>
                    <span className="text-gray-700">{version.edited_by_name}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(version.saved_date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
