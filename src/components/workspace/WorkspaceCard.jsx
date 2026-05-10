import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, FolderOpen, FileText, User, MoreVertical, Edit, Trash2, Share2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import moment from 'moment';

export default function WorkspaceCard({
  workspace,
  onSelect,
  onEdit,
  onDelete,
  onInviteMembers,
  isOwner
}) {
  const roleColors = {
    admin: 'bg-red-100 text-red-700',
    editor: 'bg-blue-100 text-blue-700',
    viewer: 'bg-gray-100 text-gray-700'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full"
    >
      <Card
        className="hover:shadow-lg transition-all duration-200 border-2 border-gray-200 hover:border-purple-300 h-full overflow-hidden flex flex-col cursor-pointer"
        onClick={onSelect}
      >
        <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`text-3xl flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${workspace.color || 'from-blue-500 to-indigo-500'}`}>
                {workspace.icon || '🏢'}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{workspace.name}</h3>
                {workspace.description && (
                  <p className="text-xs text-gray-600 truncate">{workspace.description}</p>
                )}
              </div>
            </div>
            {!isOwner && (
              <DropdownMenu onClick={(e) => e.stopPropagation()}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}>
                    <Edit className="w-4 h-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onInviteMembers();
                  }}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Invite Members
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {isOwner && (
              <DropdownMenu onClick={(e) => e.stopPropagation()}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Workspace
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onInviteMembers();
                  }}>
                    <Users className="w-4 h-4 mr-2" />
                    Manage Members
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this workspace?')) {
                        onDelete();
                      }
                    }}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Workspace
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-xs text-gray-600">Members</p>
                <p className="font-semibold text-gray-900">{workspace.stats?.member_count || 1}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">Projects</p>
                <p className="font-semibold text-gray-900">{workspace.stats?.project_count || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-600">Templates</p>
                <p className="font-semibold text-gray-900">{workspace.stats?.template_count || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-orange-600" />
              <div>
                <p className="text-xs text-gray-600">Personas</p>
                <p className="font-semibold text-gray-900">{workspace.stats?.persona_count || 0}</p>
              </div>
            </div>
          </div>

          {/* Visibility Badge */}
          <div className="pt-2 border-t">
            <Badge
              variant="secondary"
              className={workspace.is_public ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
            >
              {workspace.is_public ? '🌐 Public' : '🔒 Private'}
            </Badge>
          </div>

          {/* Created Date */}
          <p className="text-xs text-gray-500">
            Created {moment(workspace.created_date).fromNow()}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}