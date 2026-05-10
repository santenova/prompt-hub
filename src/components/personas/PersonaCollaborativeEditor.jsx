import React, { useState, useEffect } from 'react';
import { apiClient } from '@/apis/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Eye, Save, History, MessageSquare, X, Plus, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PersonaVersionHistory from './PersonaVersionHistory';
import PersonaComments from './PersonaComments';

const categories = ["Business", "Creative", "Technical", "Education", "Health", "Finance", "Legal", "Marketing", "Sales", "Custom"];
const tones = ["Professional", "Friendly", "Formal", "Casual", "Enthusiastic", "Direct", "Empathetic"];

export default function PersonaCollaborativeEditor({ open, onOpenChange, persona, currentUser }) {
  const [formData, setFormData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [activeEditors, setActiveEditors] = useState([]);
  const [expertiseInput, setExpertiseInput] = useState('');
  const [exampleInput, setExampleInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [activeTab, setActiveTab] = useState('edit');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open && persona) {
      setFormData({
        name: persona.name || '',
        description: persona.description || '',
        icon: persona.icon || '👤',
        category: persona.category || 'Custom',
        instructions: persona.instructions || '',
        tone: persona.tone || 'Professional',
        expertise_areas: persona.expertise_areas || [],
        example_prompts: persona.example_prompts || [],
        tags: persona.tags || [],
      });
      setHasChanges(false);
      setActiveTab('edit');

      // Announce presence
      if (currentUser) {
        announcePresence();
        const interval = setInterval(announcePresence, 10000);
        return () => {
          clearInterval(interval);
          leaveSession();
        };
      }
    }
  }, [open, persona, currentUser]);

  const announcePresence = async () => {
    if (!persona || !currentUser) return;
    
    const editors = persona.active_editors || [];
    if (!editors.includes(currentUser.email)) {
      editors.push(currentUser.email);
      await apiClient.entities.Persona.update(persona.id, {
        active_editors: editors
      });
      queryClient.invalidateQueries(['personas']);
    }
  };

  const leaveSession = async () => {
    if (!persona || !currentUser) return;
    
    const editors = (persona.active_editors || []).filter(e => e !== currentUser.email);
    await apiClient.entities.Persona.update(persona.id, {
      active_editors: editors
    });
    queryClient.invalidateQueries(['personas']);
  };

  const saveMutation = useMutation({
    mutationFn: async (versionNote) => {
      // Create version snapshot
      const newVersion = {
        version: (persona.version || 1) + 1,
        name: formData.name,
        description: formData.description,
        instructions: formData.instructions,
        tone: formData.tone,
        expertise_areas: formData.expertise_areas,
        example_prompts: formData.example_prompts,
        tags: formData.tags,
        edited_by: currentUser.email,
        edited_by_name: currentUser.full_name || currentUser.email,
        saved_date: new Date().toISOString(),
        change_notes: versionNote
      };

      const versionHistory = [...(persona.version_history || []), newVersion];

      // Track changes
      const changeLog = [...(persona.change_log || [])];
      Object.keys(formData).forEach(field => {
        if (JSON.stringify(formData[field]) !== JSON.stringify(persona[field])) {
          changeLog.push({
            timestamp: new Date().toISOString(),
            user_email: currentUser.email,
            user_name: currentUser.full_name || currentUser.email,
            action: 'updated',
            field,
            old_value: JSON.stringify(persona[field]),
            new_value: JSON.stringify(formData[field]),
            description: `Updated ${field}`
          });
        }
      });

      return apiClient.entities.Persona.update(persona.id, {
        ...formData,
        version: newVersion.version,
        version_history: versionHistory,
        change_log: changeLog
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['personas']);
      setHasChanges(false);
    }
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    const versionNote = prompt('Add a note about this version (optional):');
    saveMutation.mutate(versionNote || 'Updated persona');
  };

  const addExpertise = () => {
    if (expertiseInput.trim() && !formData.expertise_areas.includes(expertiseInput.trim())) {
      handleChange('expertise_areas', [...formData.expertise_areas, expertiseInput.trim()]);
      setExpertiseInput('');
    }
  };

  const removeExpertise = (item) => {
    handleChange('expertise_areas', formData.expertise_areas.filter(e => e !== item));
  };

  const addExample = () => {
    if (exampleInput.trim() && !formData.example_prompts.includes(exampleInput.trim())) {
      handleChange('example_prompts', [...formData.example_prompts, exampleInput.trim()]);
      setExampleInput('');
    }
  };

  const removeExample = (item) => {
    handleChange('example_prompts', formData.example_prompts.filter(e => e !== item));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleChange('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    handleChange('tags', formData.tags.filter(t => t !== tag));
  };

  const getActiveCollaborators = () => {
    return (persona?.active_editors || []).filter(email => email !== currentUser?.email);
  };

  const canEdit = () => {
    if (!currentUser) return false;
    if (persona.created_by === currentUser.email) return true;
    
    const collab = (persona.collaborators || []).find(c => c.email === currentUser.email);
    return collab && (collab.permission === 'editor' || collab.permission === 'admin');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {persona?.name}
            </span>
            <div className="flex items-center gap-2">
              {getActiveCollaborators().map((email, idx) => (
                <motion.div
                  key={email}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="relative"
                >
                  <Avatar className="h-8 w-8 border-2 border-green-500">
                    <AvatarFallback className="bg-green-100 text-green-700 text-xs">
                      {email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </motion.div>
              ))}
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="edit" disabled={!canEdit()}>
              {canEdit() ? <Save className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {canEdit() ? 'Edit' : 'View'}
            </TabsTrigger>
            <TabsTrigger value="collaborators">
              <Users className="w-4 h-4 mr-2" />
              Collaborators
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="comments">
              <MessageSquare className="w-4 h-4 mr-2" />
              Comments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-4 mt-4">
            {!canEdit() && (
              <Alert>
                <Eye className="h-4 w-4" />
                <AlertDescription>
                  You have view-only access to this persona.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Persona Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  disabled={!canEdit()}
                />
              </div>

              <div className="space-y-2">
                <Label>Icon</Label>
                <Input
                  value={formData.icon}
                  onChange={(e) => handleChange('icon', e.target.value)}
                  disabled={!canEdit()}
                  maxLength={2}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                disabled={!canEdit()}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleChange('category', value)}
                  disabled={!canEdit()}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tone</Label>
                <Select
                  value={formData.tone}
                  onValueChange={(value) => handleChange('tone', value)}
                  disabled={!canEdit()}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tones.map(tone => (
                      <SelectItem key={tone} value={tone}>{tone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Instructions</Label>
              <Textarea
                value={formData.instructions}
                onChange={(e) => handleChange('instructions', e.target.value)}
                disabled={!canEdit()}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Expertise Areas</Label>
              {canEdit() && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Add expertise"
                    value={expertiseInput}
                    onChange={(e) => setExpertiseInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
                  />
                  <Button onClick={addExpertise} size="icon" variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
              {formData.expertise_areas?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.expertise_areas.map((item, idx) => (
                    <Badge key={idx} variant="secondary" className="pl-2.5 pr-1">
                      {item}
                      {canEdit() && (
                        <button onClick={() => removeExpertise(item)} className="ml-1.5">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Example Prompts</Label>
              {canEdit() && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Add example"
                    value={exampleInput}
                    onChange={(e) => setExampleInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExample())}
                  />
                  <Button onClick={addExample} size="icon" variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
              {formData.example_prompts?.length > 0 && (
                <div className="space-y-2 mt-2">
                  {formData.example_prompts.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                      <span className="flex-1 text-sm">{item}</span>
                      {canEdit() && (
                        <button onClick={() => removeExample(item)}>
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              {canEdit() && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button onClick={addTag} size="icon" variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
              {formData.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="pl-2.5 pr-1">
                      #{tag}
                      {canEdit() && (
                        <button onClick={() => removeTag(tag)} className="ml-1.5">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {canEdit() && (
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || saveMutation.isPending}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveMutation.isPending ? 'Saving...' : 'Save Version'}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="collaborators" className="mt-4">
            <PersonaCollaboratorsList persona={persona} currentUser={currentUser} />
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <PersonaVersionHistory persona={persona} currentUser={currentUser} />
          </TabsContent>

          <TabsContent value="comments" className="mt-4">
            <PersonaComments personaId={persona?.id} currentUser={currentUser} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function PersonaCollaboratorsList({ persona, currentUser }) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('viewer');
  const queryClient = useQueryClient();

  const addCollaboratorMutation = useMutation({
    mutationFn: async () => {
      const collaborators = [...(persona.collaborators || [])];
      if (!collaborators.find(c => c.email === email)) {
        collaborators.push({
          email,
          permission,
          invited_date: new Date().toISOString(),
          invited_by: currentUser.email
        });

        const changeLog = [...(persona.change_log || []), {
          timestamp: new Date().toISOString(),
          user_email: currentUser.email,
          user_name: currentUser.full_name || currentUser.email,
          action: 'collaborator_added',
          description: `Added ${email} as ${permission}`
        }];

        return apiClient.entities.Persona.update(persona.id, {
          collaborators,
          change_log: changeLog
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['personas']);
      setEmail('');
    }
  });

  const removeCollaboratorMutation = useMutation({
    mutationFn: async (collabEmail) => {
      const collaborators = (persona.collaborators || []).filter(c => c.email !== collabEmail);
      const changeLog = [...(persona.change_log || []), {
        timestamp: new Date().toISOString(),
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email,
        action: 'collaborator_removed',
        description: `Removed ${collabEmail}`
      }];

      return apiClient.entities.Persona.update(persona.id, {
        collaborators,
        change_log: changeLog
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['personas']);
    }
  });

  const isOwner = persona.created_by === currentUser?.email;

  return (
    <div className="space-y-4">
      {isOwner && (
        <div className="flex gap-2">
          <Input
            placeholder="collaborator@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Select value={permission} onValueChange={setPermission}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viewer">Viewer</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => addCollaboratorMutation.mutate()}>
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {(persona.collaborators || []).map((collab, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div>
              <p className="font-medium">{collab.email}</p>
              <p className="text-xs text-gray-500">
                Added {new Date(collab.invited_date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge>{collab.permission}</Badge>
              {isOwner && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeCollaboratorMutation.mutate(collab.email)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
