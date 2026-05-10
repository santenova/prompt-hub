import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, Plus, Trash2, MoreVertical, Mail, Shield, Edit2, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TeamMemberManager({
  workspaceId,
  members,
  isAdmin,
  onAddMember,
  onUpdateMember,
  onRemoveMember,
  isLoading
}) {
  const [newEmail, setNewEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('editor');
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editingRole, setEditingRole] = useState('');

  const handleAddMember = () => {
    if (newEmail.trim()) {
      onAddMember(newEmail, selectedRole);
      setNewEmail('');
      setSelectedRole('editor');
    }
  };

  const handleUpdateRole = (memberId, newRole) => {
    onUpdateMember(memberId, { role: newRole });
    setEditingMemberId(null);
  };

  const roleColors = {
    admin: 'bg-red-100 text-red-700',
    editor: 'bg-blue-100 text-blue-700',
    viewer: 'bg-gray-100 text-gray-700'
  };

  const roleDescriptions = {
    admin: 'Full access and workspace management',
    editor: 'Can create and edit content',
    viewer: 'Can only view content'
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <CardTitle>Team Members</CardTitle>
          </div>
          <Badge variant="secondary">{members.length} members</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Add Member Section */}
        {isAdmin && (
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 space-y-3">
            <p className="text-sm font-semibold text-gray-900">Invite Team Member</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                placeholder="Enter email address"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
                className="flex-1"
              />
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddMember}
                disabled={!newEmail.trim() || isLoading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
            <p className="text-xs text-gray-600">{roleDescriptions[selectedRole]}</p>
          </div>
        )}

        {/* Members List */}
        <div className="space-y-2">
          {isLoading ? (
            <p className="text-center text-gray-500 py-4">Loading members...</p>
          ) : members.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No members yet</p>
          ) : (
            <AnimatePresence mode="popLayout">
              {members.map((member) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {member.user_name || member.user_email}
                        </p>
                        <p className="text-xs text-gray-600 truncate">{member.user_email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {editingMemberId === member.id ? (
                      <div className="flex items-center gap-1">
                        <Select value={editingRole} onValueChange={setEditingRole}>
                          <SelectTrigger className="w-28 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleUpdateRole(member.id, editingRole)}
                        >
                          <Check className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => setEditingMemberId(null)}
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Badge
                          variant="secondary"
                          className={`${roleColors[member.role]} flex items-center gap-1`}
                        >
                          {member.role === 'admin' && <Shield className="w-3 h-3" />}
                          {member.role}
                        </Badge>

                        {isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingMemberId(member.id);
                                  setEditingRole(member.role);
                                }}
                              >
                                <Edit2 className="w-4 h-4 mr-2" />
                                Change Role
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  if (confirm('Remove this member from the workspace?')) {
                                    onRemoveMember(member.id);
                                  }
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Permission Legend */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
          <p className="text-xs font-semibold text-gray-700">Role Permissions:</p>
          <div className="space-y-1 text-xs text-gray-600">
            <p>• <span className="font-medium">Admin:</span> Manage workspace, members, and settings</p>
            <p>• <span className="font-medium">Editor:</span> Create and edit projects, templates, personas</p>
            <p>• <span className="font-medium">Viewer:</span> View shared content only</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}