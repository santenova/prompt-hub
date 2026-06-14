import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Mail, X, Shield, Eye, Edit } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function InviteCollaboratorModal({ open, onOpenChange, template, onInvite }) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('viewer');
  const [pendingInvites, setPendingInvites] = useState([]);
  const [error, setError] = useState('');

  const handleAddInvite = () => {
    setError('');
    
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (template.created_by === email) {
      setError('Cannot invite the template owner');
      return;
    }

    if (template.collaborators?.some(c => c.email === email)) {
      setError('This user is already a collaborator');
      return;
    }

    if (pendingInvites.some(inv => inv.email === email)) {
      setError('This user is already in the invite list');
      return;
    }

    setPendingInvites([...pendingInvites, { email, permission, invited_date: new Date().toISOString() }]);
    setEmail('');
    setPermission('viewer');
  };

  const handleRemoveInvite = (emailToRemove) => {
    setPendingInvites(pendingInvites.filter(inv => inv.email !== emailToRemove));
  };

  const handleSendInvites = () => {
    if (pendingInvites.length === 0) {
      setError('Add at least one collaborator to invite');
      return;
    }

    if (onInvite) {
      onInvite(pendingInvites);
      setPendingInvites([]);
      setEmail('');
      setPermission('viewer');
    }
  };

  const getPermissionIcon = (perm) => {
    switch (perm) {
      case 'editor': return <Edit className="w-3 h-3" />;
      case 'viewer': return <Eye className="w-3 h-3" />;
      case 'admin': return <Shield className="w-3 h-3" />;
      default: return <Eye className="w-3 h-3" />;
    }
  };

  const getPermissionColor = (perm) => {
    switch (perm) {
      case 'editor': return 'bg-green-100 text-green-800 border-green-200';
      case 'viewer': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-purple-600" />
            Invite Collaborators
          </DialogTitle>
          <DialogDescription>
            Invite others to collaborate on "{template?.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Collaborators */}
          {template?.collaborators && template.collaborators.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 border">
              <Label className="text-sm font-semibold mb-2 block">Current Collaborators</Label>
              <div className="space-y-2">
                {template.collaborators.map((collab, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-700">{collab.email}</span>
                    </div>
                    <Badge variant="outline" className={`text-xs ${getPermissionColor(collab.permission)}`}>
                      {getPermissionIcon(collab.permission)}
                      <span className="ml-1">{collab.permission}</span>
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Invite */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleAddInvite()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="permission">Permission Level</Label>
              <Select value={permission} onValueChange={setPermission}>
                <SelectTrigger id="permission">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <div>
                        <div className="font-medium">Viewer</div>
                        <div className="text-xs text-gray-500">Can view the prompt</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="editor">
                    <div className="flex items-center gap-2">
                      <Edit className="w-4 h-4" />
                      <div>
                        <div className="font-medium">Editor</div>
                        <div className="text-xs text-gray-500">Can view and edit</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      <div>
                        <div className="font-medium">Admin</div>
                        <div className="text-xs text-gray-500">Full access including sharing</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleAddInvite} variant="outline" className="w-full" type="button">
              <UserPlus className="w-4 h-4 mr-2" />
              Add to Invite List
            </Button>
          </div>

          {error && (
            <Alert className="bg-red-50 border-red-200">
              <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {/* Pending Invites */}
          {pendingInvites.length > 0 && (
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
              <Label className="text-sm font-semibold mb-2 block">Pending Invites ({pendingInvites.length})</Label>
              <div className="space-y-2">
                {pendingInvites.map((invite, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border">
                    <div className="flex items-center gap-2 flex-1">
                      <Mail className="w-3 h-3 text-gray-400" />
                      <span className="text-sm text-gray-700">{invite.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${getPermissionColor(invite.permission)}`}>
                        {getPermissionIcon(invite.permission)}
                        <span className="ml-1">{invite.permission}</span>
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveInvite(invite.email)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSendInvites}
            disabled={pendingInvites.length === 0}
            className="bg-gradient-to-r from-purple-600 to-indigo-600"
          >
            <Mail className="w-4 h-4 mr-2" />
            Send {pendingInvites.length > 0 ? `${pendingInvites.length} ` : ''}Invite{pendingInvites.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}