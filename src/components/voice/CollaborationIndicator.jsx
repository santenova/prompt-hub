import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Eye, Edit3 } from "lucide-react";
import { apiClient } from "@/apis/client";
import { motion, AnimatePresence } from "framer-motion";

export default function CollaborationIndicator({ sessionId, currentUserEmail }) {
  const [collaborators, setCollaborators] = useState([]);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    // Subscribe to session changes for real-time collaboration
    const unsubscribe = apiClient.entities.VoiceChat.subscribe((event) => {
      if (event.id === sessionId && event.type === 'update') {
        const activeColabs = event.data.active_collaborators || [];
        setCollaborators(activeColabs.filter(email => email !== currentUserEmail));
      }
    });

    // Mark self as active
    markAsActive();

    // Update presence every 30 seconds
    const interval = setInterval(markAsActive, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
      markAsInactive();
    };
  }, [sessionId, currentUserEmail]);

  const markAsActive = async () => {
    if (!sessionId || !currentUserEmail) return;

    try {
      const session = await apiClient.entities.VoiceChat.list();
      const current = session.find(s => s.id === sessionId);
      
      if (current) {
        const activeColabs = current.active_collaborators || [];
        if (!activeColabs.includes(currentUserEmail)) {
          await apiClient.entities.VoiceChat.update(sessionId, {
            active_collaborators: [...activeColabs, currentUserEmail]
          });
        }
      }
      setIsActive(true);
    } catch (error) {
      console.error('Failed to mark active:', error);
    }
  };

  const markAsInactive = async () => {
    if (!sessionId || !currentUserEmail || !isActive) return;

    try {
      const session = await apiClient.entities.VoiceChat.list();
      const current = session.find(s => s.id === sessionId);
      
      if (current) {
        const activeColabs = (current.active_collaborators || []).filter(
          email => email !== currentUserEmail
        );
        await apiClient.entities.VoiceChat.update(sessionId, {
          active_collaborators: activeColabs
        });
      }
    } catch (error) {
      console.error('Failed to mark inactive:', error);
    }
  };

  if (collaborators.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="flex items-center gap-2"
      >
        <Badge variant="outline" className="bg-green-50 border-green-300 text-green-700">
          <Users className="w-3 h-3 mr-1" />
          {collaborators.length} viewing
        </Badge>
        <div className="flex -space-x-2">
          {collaborators.slice(0, 3).map((email, idx) => (
            <Avatar key={email} className="h-6 w-6 border-2 border-white">
              <AvatarFallback className="bg-purple-600 text-white text-xs">
                {email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
          {collaborators.length > 3 && (
            <div className="h-6 w-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center">
              <span className="text-xs text-gray-700">+{collaborators.length - 3}</span>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
