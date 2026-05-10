import React, { useState, useEffect } from 'react';
import { apiClient } from '@/apis/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Settings, Users, FolderOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import WorkspaceCard from "../components/workspace/WorkspaceCard";
import TeamMemberManager from "../components/workspace/TeamMemberManager";

export default function TeamWorkspaces() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '🏢',
    color: 'from-blue-500 to-indigo-500',
    is_public: false
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await apiClient.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.error('Auth error:', error);
      }
    };
    fetchUser();
  }, []);

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ['workspaces', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return [];
      return await apiClient.entities.Workspace.filter(
        { owner_email: currentUser.email },
        '-created_date'
      );
    },
    enabled: !!currentUser
  });

  const { data: members = {} } = useQuery({
    queryKey: ['workspaceMembers', selectedWorkspace?.id],
    queryFn: async () => {
      if (!selectedWorkspace) return {};
      const workspaceMembers = await apiClient.entities.WorkspaceMember.filter(
        { workspace_id: selectedWorkspace.id }
      );
      return Object.fromEntries(
        workspaceMembers.map(m => [m.id, m])
      );
    },
    enabled: !!selectedWorkspace
  });

  const createWorkspaceMutation = useMutation({
    mutationFn: (data) => apiClient.entities.Workspace.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['workspaces']);
      setFormData({
        name: '',
        description: '',
        icon: '🏢',
        color: 'from-blue-500 to-indigo-500',
        is_public: false
      });
      setShowCreateDialog(false);
      toast({ title: "Workspace created successfully" });
    }
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ email, role }) =>
      apiClient.entities.WorkspaceMember.create({
        workspace_id: selectedWorkspace.id,
        user_email: email,
        role,
        invited_by: currentUser.email,
        invited_date: new Date().toISOString(),
        status: 'pending'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['workspaceMembers']);
      toast({ title: "Member invited successfully" });
    }
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ memberId, data }) =>
      apiClient.entities.WorkspaceMember.update(memberId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['workspaceMembers']);
      toast({ title: "Member updated successfully" });
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId) =>
      apiClient.entities.WorkspaceMember.delete(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries(['workspaceMembers']);
      toast({ title: "Member removed" });
    }
  });

  const deleteWorkspaceMutation = useMutation({
    mutationFn: (id) => apiClient.entities.Workspace.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['workspaces']);
      setShowDetailsDialog(false);
      setSelectedWorkspace(null);
      toast({ title: "Workspace deleted" });
    }
  });

  const handleCreateWorkspace = () => {
    if (!formData.name.trim()) {
      toast({ title: "Please enter a workspace name" });
      return;
    }
    createWorkspaceMutation.mutate({
      ...formData,
      owner_email: currentUser.email
    });
  };

  const filteredWorkspaces = workspaces.filter(ws =>
    ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ws.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-8 h-8 text-purple-600" />
            Team Workspaces
          </h1>
          <p className="text-gray-600 mt-1">Create and manage collaborative workspaces for your team</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              New Workspace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Workspace</DialogTitle>
              <DialogDescription>
                Set up a new shared workspace for your team
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Workspace Name</label>
                <Input
                  placeholder="e.g., Marketing Team"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <Textarea
                  placeholder="What is this workspace for?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Icon</label>
                  <Input
                    placeholder="🏢"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="mt-1 text-center text-2xl"
                    maxLength="2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Color</label>
                  <Select value={formData.color} onValueChange={(color) => setFormData({ ...formData, color })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="from-blue-500 to-indigo-500">Blue</SelectItem>
                      <SelectItem value="from-purple-500 to-pink-500">Purple</SelectItem>
                      <SelectItem value="from-green-500 to-emerald-500">Green</SelectItem>
                      <SelectItem value="from-orange-500 to-red-500">Orange</SelectItem>
                      <SelectItem value="from-cyan-500 to-blue-500">Cyan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_public" className="text-sm text-gray-700">
                  Make this workspace public and discoverable
                </label>
              </div>
              <Button
                onClick={handleCreateWorkspace}
                disabled={createWorkspaceMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Create Workspace
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search workspaces..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Workspaces Grid */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-24 bg-gray-200"></CardHeader>
                <CardContent className="h-40 bg-gray-100"></CardContent>
              </Card>
            ))}
          </div>
        ) : filteredWorkspaces.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No workspaces yet</h3>
              <p className="text-gray-500 text-center mb-4">Create your first workspace to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkspaces.map((workspace) => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                isOwner={true}
                onSelect={() => {
                  setSelectedWorkspace(workspace);
                  setShowDetailsDialog(true);
                }}
                onEdit={() => {
                  setSelectedWorkspace(workspace);
                  setShowDetailsDialog(true);
                }}
                onDelete={() => deleteWorkspaceMutation.mutate(workspace.id)}
                onInviteMembers={() => {
                  setSelectedWorkspace(workspace);
                  setShowDetailsDialog(true);
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Workspace Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          {selectedWorkspace && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-2xl">{selectedWorkspace.icon}</span>
                  {selectedWorkspace.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedWorkspace.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <TeamMemberManager
                  workspaceId={selectedWorkspace.id}
                  members={Object.values(members)}
                  isAdmin={true}
                  onAddMember={(email, role) =>
                    addMemberMutation.mutate({ email, role })
                  }
                  onUpdateMember={(memberId, data) =>
                    updateMemberMutation.mutate({ memberId, data })
                  }
                  onRemoveMember={(memberId) =>
                    removeMemberMutation.mutate(memberId)
                  }
                  isLoading={isLoading}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
