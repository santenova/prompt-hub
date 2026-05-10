import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Check, X, Reply } from "lucide-react";
import { apiClient } from "@/apis/client";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";

export default function MessageAnnotations({ sessionId, messageIndex, onClose }) {
  const [annotations, setAnnotations] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadUser = async () => {
      const user = await apiClient.auth.me();
      setCurrentUser(user);
    };
    loadUser();
    loadAnnotations();

    // Real-time updates
    const interval = setInterval(loadAnnotations, 3000);
    return () => clearInterval(interval);
  }, [sessionId, messageIndex]);

  const loadAnnotations = async () => {
    try {
      const results = await apiClient.entities.ChatMessageAnnotation.filter({
        session_id: sessionId,
        message_index: messageIndex
      }, '-created_date');
      setAnnotations(results);
    } catch (error) {
      console.error('Failed to load annotations:', error);
    }
  };

  const addAnnotation = async () => {
    if (!newComment.trim() || !currentUser) return;

    try {
      await apiClient.entities.ChatMessageAnnotation.create({
        session_id: sessionId,
        message_index: messageIndex,
        author_email: currentUser.email,
        author_name: currentUser.full_name,
        comment: newComment.trim()
      });
      
      setNewComment('');
      loadAnnotations();
      toast({ title: "Comment Added", description: "Your annotation has been saved" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add comment", variant: "destructive" });
    }
  };

  const addReply = async (annotationId) => {
    if (!replyText.trim() || !currentUser) return;

    try {
      const annotation = annotations.find(a => a.id === annotationId);
      const updatedReplies = [
        ...(annotation.replies || []),
        {
          author_email: currentUser.email,
          author_name: currentUser.full_name,
          comment: replyText.trim(),
          created_date: new Date().toISOString()
        }
      ];

      await apiClient.entities.ChatMessageAnnotation.update(annotationId, {
        replies: updatedReplies
      });

      setReplyText('');
      setReplyingTo(null);
      loadAnnotations();
      toast({ title: "Reply Added" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add reply", variant: "destructive" });
    }
  };

  const resolveAnnotation = async (annotationId) => {
    try {
      await apiClient.entities.ChatMessageAnnotation.update(annotationId, {
        is_resolved: true,
        resolved_by: currentUser.email,
        resolved_date: new Date().toISOString()
      });
      loadAnnotations();
      toast({ title: "Resolved", description: "Annotation marked as resolved" });
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <Card className="p-4 border-2 border-purple-200 bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold">Annotations</h3>
          <Badge variant="outline">{annotations.length}</Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="h-64 mb-4">
        <div className="space-y-3">
          <AnimatePresence>
            {annotations.map((annotation) => (
              <motion.div
                key={annotation.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`p-3 rounded-lg border ${
                  annotation.is_resolved ? 'bg-gray-50 border-gray-200' : 'bg-purple-50 border-purple-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold">{annotation.author_name}</p>
                    <p className="text-xs text-gray-500">
                      {moment(annotation.created_date).fromNow()}
                    </p>
                  </div>
                  {!annotation.is_resolved && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => resolveAnnotation(annotation.id)}
                      className="h-6 px-2"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Resolve
                    </Button>
                  )}
                </div>
                
                <p className="text-sm text-gray-700 mb-2">{annotation.comment}</p>

                {annotation.is_resolved && (
                  <Badge variant="secondary" className="text-xs">
                    <Check className="w-3 h-3 mr-1" />
                    Resolved
                  </Badge>
                )}

                {/* Replies */}
                {annotation.replies && annotation.replies.length > 0 && (
                  <div className="mt-3 pl-4 border-l-2 border-gray-300 space-y-2">
                    {annotation.replies.map((reply, idx) => (
                      <div key={idx} className="text-sm">
                        <p className="font-semibold text-xs">{reply.author_name}</p>
                        <p className="text-gray-700">{reply.comment}</p>
                        <p className="text-xs text-gray-400">
                          {moment(reply.created_date).fromNow()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply input */}
                {replyingTo === annotation.id ? (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      rows={2}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => addReply(annotation.id)}>
                        <Send className="w-3 h-3 mr-1" />
                        Reply
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setReplyingTo(annotation.id)}
                    className="mt-2 h-6 px-2 text-xs"
                  >
                    <Reply className="w-3 h-3 mr-1" />
                    Reply
                  </Button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* New comment input */}
      <div className="space-y-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment or annotation..."
          rows={3}
          className="text-sm"
        />
        <Button
          onClick={addAnnotation}
          disabled={!newComment.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
        >
          <Send className="w-4 h-4 mr-2" />
          Add Comment
        </Button>
      </div>
    </Card>
  );
}
