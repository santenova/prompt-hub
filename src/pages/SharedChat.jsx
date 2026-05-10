import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, Bot, User, Lock, Loader2, Share2, Clock, Globe, Users } from "lucide-react";
import { apiClient } from "@/apis/client";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function SharedChat() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadChat = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const chatId = urlParams.get('id');

      if (!chatId) {
        setError('No chat ID provided');
        setLoading(false);
        return;
      }

      try {
        // Get current user
        const isAuth = await apiClient.auth.isAuthenticated();
        let user = null;
        if (isAuth) {
          user = await apiClient.auth.me();
          setCurrentUser(user);
        }

        // Load the chat session
        const chats = await apiClient.entities.VoiceChat.list();
        const chat = chats.find(c => c.id === chatId);

        if (!chat) {
          setError('Chat not found');
          setLoading(false);
          return;
        }

        // Check access permissions
        const isOwner = user && chat.created_by === user.email;
        const isSharedWith = user && (chat.shared_with || []).some(s => s.email === user.email);
        const isPublic = chat.is_public;

        if (!isPublic && !isOwner && !isSharedWith) {
          setError('You do not have permission to view this chat');
          setHasAccess(false);
          setLoading(false);
          return;
        }

        setSession(chat);
        setHasAccess(true);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadChat();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto" />
          <p className="text-gray-600">Loading shared chat...</p>
        </div>
      </div>
    );
  }

  if (error || !hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Lock className="w-5 h-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                {error || 'You do not have permission to view this chat'}
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => navigate(createPageUrl('VoiceToPrompt'))}
              className="w-full"
            >
              Go to Voice Chat
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Share2 className="w-5 h-5 text-purple-600" />
                  <CardTitle>Shared Voice Chat</CardTitle>
                </div>
                <h2 className="text-xl font-bold text-gray-900">{session.name}</h2>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant="outline">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    {session.messages.length} messages
                  </Badge>
                  {session.model && (
                    <Badge variant="secondary">
                      {session.model}
                    </Badge>
                  )}
                  {session.is_public && (
                    <Badge className="bg-blue-600">
                      <Globe className="w-3 h-3 mr-1" />
                      Public
                    </Badge>
                  )}
                  {session.shared_with && session.shared_with.length > 0 && (
                    <Badge variant="outline">
                      <Users className="w-3 h-3 mr-1" />
                      Shared with {session.shared_with.length}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(session.created_date).toLocaleDateString()}
                  </Badge>
                </div>
                {session.summary && (
                  <p className="text-sm text-gray-600 mt-2">{session.summary}</p>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Messages */}
        <Card className="border-2 border-blue-200">
          <CardContent className="p-6">
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {session.messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    )}

                    <div className={`max-w-[75%] ${message.role === 'user' ? 'order-first' : ''}`}>
                      <div className={`rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        {message.model && (
                          <p className="text-xs mt-2 opacity-70">{message.model}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 px-2">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    {message.role === 'user' && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <Button
            onClick={() => navigate(createPageUrl('VoiceToPrompt'))}
            variant="outline"
          >
            Create Your Own Voice Chat
          </Button>
        </div>
      </div>
    </div>
  );
}
