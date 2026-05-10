import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Users, Shield, Eye, Edit, Trash2, Crown, Clock } from "lucide-react";
import { format } from 'date-fns';

export default function CollaboratorsList({ template, currentUser, onUpdatePermission, onRemoveCollaborator }) {
  const isOwner = template.created_by === currentUser?.email;
  const currentUserCollab = template.collaborators?.find(c => c.email === currentUser?.email);
  const isAdmin = currentUserCollab?.permission === 'admin' || isOwner;

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

  const collaborators = template.collaborators || [];
  const totalCollaborators = collaborators.length + 1; // +1 for owner

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Collaborators ({totalCollaborators})
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Owner */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-gray-900">{template.created_by}</p>
                <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600">
                  <Crown className="w-3 h-3 mr-1" />
                  Owner
                </Badge>
              </div>
              <p className="text-xs text-gray-600">
                Created {format(new Date(template.created_date), 'MMM d, yyyy')}
              </p>
            </div>
          </div>

          {/* Collaborators */}
          {collaborators.map((collab, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-white rounded-lg border hover:border-purple-200 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-gray-900">{collab.email}</p>
                  {template.active_editors?.includes(collab.email) && (
                    <Badge variant="outline" className="bg-green-50 border-green-300 text-green-700">
                      <Clock className="w-3 h-3 mr-1 animate-pulse" />
                      Active
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-xs ${getPermissionColor(collab.permission)}`}>
                    {getPermissionIcon(collab.permission)}
                    <span className="ml-1">{collab.permission}</span>
                  </Badge>
                  {collab.invited_date && (
                    <span className="text-xs text-gray-500">
                      Added {format(new Date(collab.invited_date), 'MMM d, yyyy')}
                    </span>
                  )}
                </div>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2">
                  <Select
                    value={collab.permission}
                    onValueChange={(newPermission) => onUpdatePermission?.(collab.email, newPermission)}
                    disabled={!isOwner && collab.permission === 'admin'}
                  >
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          Viewer
                        </div>
                      </SelectItem>
                      <SelectItem value="editor">
                        <div className="flex items-center gap-1">
                          <Edit className="w-3 h-3" />
                          Editor
                        </div>
                      </SelectItem>
                      {isOwner && (
                        <SelectItem value="admin">
                          <div className="flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Admin
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>

                  {(isOwner || collab.permission !== 'admin') && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Collaborator</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {collab.email} from this prompt? They will no longer have access.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onRemoveCollaborator?.(collab.email)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              )}
            </div>
          ))}

          {collaborators.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No collaborators yet</p>
              <p className="text-xs">Invite others to collaborate on this prompt</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}