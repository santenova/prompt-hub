import React from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, Edit, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PresenceIndicator({ activeEditors = [], collaborators = [], currentUserEmail, showCount = true }) {
  const activeUsers = Array.isArray(activeEditors) ? activeEditors.filter(email => email !== currentUserEmail) : [];
  const totalCollaborators = Array.isArray(collaborators) ? collaborators.length : 0;

  if (activeUsers.length === 0 && !showCount) return null;

  const getInitials = (email) => {
    if (!email) return '?';
    const name = email.split('@')[0];
    return name.slice(0, 2).toUpperCase();
  };

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-orange-500',
    'bg-cyan-500',
    'bg-indigo-500',
    'bg-rose-500'
  ];

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <AnimatePresence>
          {activeUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex -space-x-2"
            >
              {activeUsers.slice(0, 3).map((email, idx) => (
                <Tooltip key={email}>
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Avatar className={`w-6 h-6 border-2 border-white ${colors[idx % colors.length]} ring-2 ring-green-400 ring-offset-1`}>
                        <AvatarFallback className="text-white text-[10px] font-semibold">
                          {getInitials(email)}
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex items-center gap-2">
                      <Edit className="w-3 h-3" />
                      <span className="text-xs">{email} is editing</span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
              {activeUsers.length > 3 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="w-6 h-6 border-2 border-white bg-gray-500">
                      <AvatarFallback className="text-white text-[10px] font-semibold">
                        +{activeUsers.length - 3}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs max-w-[200px]">
                      {activeUsers.slice(3).join(', ')} are also editing
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {showCount && totalCollaborators > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-xs h-6 px-2 bg-white">
                <Users className="w-3 h-3 mr-1" />
                {totalCollaborators}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                {totalCollaborators} collaborator{totalCollaborators !== 1 ? 's' : ''}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}