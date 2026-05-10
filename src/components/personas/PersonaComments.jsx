import React, { useState } from 'react';
import { apiClient } from '@/apis/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, CheckCircle, Reply, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PersonaComments({ personaId, currentUser }) {
  const [comment, setComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ['persona-comments', personaId],
    queryFn: async () => {
      const data = await apiClient.entities.PersonaComment.filter({ persona_id: personaId });
      return data.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!personaId
  });

  const createCommentMutation = useMutation({
    mutationFn: (data) => apiClient.entities.PersonaComment.create({
      persona_id: personaId,
      comment: data.comment,
      author_name: currentUser.full_name || currentUser.email,
      author_email: currentUser.email
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['persona-comments', personaId]);
      setComment('');
    }
  });

  const addReplyMutation = useMutation({
    mutationFn: async ({ commentId, reply }) => {
      const commentData = comments.find(c => c.id === commentId);
      const replies = [...(commentData.replies || []), {
        comment: reply,
        author_name: currentUser.full_name || currentUser.email,
        author_email: currentUser.email,
        created_date: new Date().toISOString()
      }];
      return apiClient.entities.PersonaComment.update(commentId, { replies });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['persona-comments', personaId]);
      setReplyTo(null);
      setReplyText('');
    }
  });

  const resolveCommentMutation = useMutation({
    mutationFn: ({ commentId, isResolved }) => 
      apiClient.entities.PersonaComment.update(commentId, { is_resolved: isResolved }),
    onSuccess: () => {
      queryClient.invalidateQueries(['persona-comments', personaId]);
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => apiClient.entities.PersonaComment.delete(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['persona-comments', personaId]);
    }
  });

  if (!currentUser) {
    return (
      <Alert>
        <MessageSquare className="h-4 w-4" />
        <AlertDescription>Sign in to view and add comments.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Comment */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Textarea
              placeholder="Add a comment or suggestion..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end">
              <Button
                onClick={() => createCommentMutation.mutate({ comment })}
                disabled={!comment.trim() || createCommentMutation.isPending}
                size="sm"
              >
                <Send className="w-4 h-4 mr-2" />
                Post Comment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-3 pr-4">
          <AnimatePresence>
            {comments.map((c, idx) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className={c.is_resolved ? 'border-green-200 bg-green-50' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {c.author_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{c.author_name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(c.created_date).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {c.is_resolved ? (
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Resolved
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resolveCommentMutation.mutate({ 
                              commentId: c.id, 
                              isResolved: true 
                            })}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Resolve
                          </Button>
                        )}
                        {c.author_email === currentUser.email && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm('Delete this comment?')) {
                                deleteCommentMutation.mutate(c.id);
                              }
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 mb-3">{c.comment}</p>

                    {/* Replies */}
                    {c.replies && c.replies.length > 0 && (
                      <div className="space-y-2 ml-4 pl-4 border-l-2 border-gray-200">
                        {c.replies.map((reply, rIdx) => (
                          <div key={rIdx} className="bg-gray-50 p-3 rounded">
                            <div className="flex items-center gap-2 mb-1">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {reply.author_name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-medium">{reply.author_name}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(reply.created_date).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{reply.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply Form */}
                    {replyTo === c.id ? (
                      <div className="mt-3 ml-4 space-y-2">
                        <Textarea
                          placeholder="Write a reply..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => addReplyMutation.mutate({ 
                              commentId: c.id, 
                              reply: replyText 
                            })}
                            disabled={!replyText.trim()}
                          >
                            Post Reply
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReplyTo(null);
                              setReplyText('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setReplyTo(c.id)}
                        className="mt-2"
                      >
                        <Reply className="w-3 h-3 mr-1" />
                        Reply
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {comments.length === 0 && (
        <Alert>
          <MessageSquare className="h-4 w-4" />
          <AlertDescription>
            No comments yet. Be the first to share your thoughts!
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
