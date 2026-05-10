import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, Eye, Edit3, Circle } from "lucide-react";
import { apiClient } from "@/apis/client";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_COLORS = {
  editing: "bg-green-500",
  viewing: "bg-blue-500",
  idle: "bg-yellow-500",
  offline: "bg-gray-400"
};

const STATUS_ICONS = {
  editing: Edit3,
  viewing: Eye
};

export default function ChatPresenceIndicator({ sessionId, currentUserEmail }) {
  const [participants, setParticipants] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (!sessionId || !currentUserEmail) return;

    const loadUser = async () => {
      const user = await apiClient.auth.me();
      setCurrentUser(user);
    };
    loadUser();

    // Update current user presence
    const updatePresence = async (status = 'viewing') => {
      try {
        const existing = await apiClient.entities.ChatSessionParticipant.filter({
          session_id: sessionId,
          user_email: currentUserEmail
        });

        const participantData = {
          session_id: sessionId,
          user_email: currentUserEmail,
          user_name: currentUser?.full_name || 'Anonymous',
          status: status,
          last_seen: new Date().toISOString()
        };

        if (existing.length > 0) {
          await apiClient.entities.ChatSessionParticipant.update(existing[0].id, participantData);
        } else {
          await apiClient.entities.ChatSessionParticipant.create(participantData);
        }
      } catch (error) {
        console.error('Failed to update presence:', error);
      }
    };

    // Initial presence
    updatePresence();

    // Heartbeat every 10 seconds
    const heartbeat = setInterval(() => updatePresence(), 10000);

    // Load other participants
    const loadParticipants = async () => {
      try {
        const allParticipants = await apiClient.entities.ChatSessionParticipant.filter({
          session_id: sessionId
        });
        
        // Filter out offline participants (no activity in last 30 seconds)
        const now = new Date();
        const active = allParticipants.filter(p => {
          if (p.user_email === currentUserEmail) return false;
          const lastSeen = new Date(p.last_seen);
          return (now - lastSeen) < 30000;
        });
        
        setParticipants(active);
      } catch (error) {
        console.error('Failed to load participants:', error);
      }
    };

    loadParticipants();
    const pollInterval = setInterval(loadParticipants, 5000);

    // Cleanup on unmount
    return () => {
      clearInterval(heartbeat);
      clearInterval(pollInterval);
      updatePresence('offline');
    };
  }, [sessionId, currentUserEmail, currentUser]);

  if (participants.length === 0) return null;

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2"
      >
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4 text-gray-500" />
          <Badge variant="outline" className="text-xs">
            {participants.length}
          </Badge>
        </div>
        
        <div className="flex -space-x-2">
          <AnimatePresence>
            {participants.slice(0, 5).map((participant) => {
              const StatusIcon = STATUS_ICONS[participant.status] || Eye;
              return (
                <Tooltip key={participant.id}>
                  <TooltipTrigger>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="relative"
                    >
                      <Avatar className="w-8 h-8 border-2 border-white bg-gradient-to-r from-blue-500 to-purple-500">
                        <div className="w-full h-full flex items-center justify-center text-white text-xs font-medium">
                          {participant.user_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      </Avatar>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${STATUS_COLORS[participant.status]}`}>
                        <StatusIcon className="w-2 h-2 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      </div>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      <p className="font-semibold">{participant.user_name}</p>
                      <p className="text-gray-500 capitalize">{participant.status}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </AnimatePresence>
          
          {participants.length > 5 && (
            <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
              +{participants.length - 5}
            </div>
          )}
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
