import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, Reply, CheckCircle2, Clock } from "lucide-react";
import { apiClient } from "@/apis/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from 'date-fns';
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

export default function TemplateComments({ templateId, currentUser }) {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ['template-comments', templateId],
    queryFn: () => apiClient.entities.TemplateComment.filter({ template_id: templateId }, '-created_date'),
    initialData: [],
  });

  const createCommentMutation = useMutation({
    mutationFn: (data) => apiClient.entities.TemplateComment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['template-comments', templateId]);
      setNewComment('');
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.entities.TemplateComment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['template-comments', templateId]);
      setReplyingTo(null);
      setReplyText('');
    },
  });

  const handlePostComment = () => {
    if (!newComment.trim() || !currentUser) return;

    createCommentMutation.mutate({
      template_id: templateId,
      comment: newComment,
      author_name: currentUser.full_name || currentUser.email,
      author_email: currentUser.email
    });
  };

  const handlePostReply = (commentId) => {
    if (!replyText.trim() || !currentUser) return;

    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    const newReply = {
      comment: replyText,
      author_name: currentUser.full_name || currentUser.email,
      author_email: currentUser.email,
      created_date: new Date().toISOString()
    };

    updateCommentMutation.mutate({
      id: commentId,
      data: {
        replies: [...(comment.replies || []), newReply]
      }
    });
  };

  const handleResolveComment = (commentId, isResolved) => {
    updateCommentMutation.mutate({
      id: commentId,
      data: { is_resolved: isResolved }
    });
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            Comments & Feedback ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* New Comment Input */}
          {currentUser && (
            <div className="space-y-2">
              <Textarea
                placeholder="Share your feedback, suggestions, or questions about this template..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
              <Button
                onClick={handlePostComment}
                disabled={!newComment.trim() || createCommentMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-indigo-600"
              >
                <Send className="w-4 h-4 mr-2" />
                Post Comment
              </Button>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No comments yet. Be the first to share feedback!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <Card key={comment.id} className={comment.is_resolved ? 'bg-green-50 border-green-200' : ''}>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {/* Comment Header */}
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-purple-100 text-purple-700">
                            {getInitials(comment.author_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-sm">{comment.author_name}</p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(comment.created_date), 'MMM d, yyyy • h:mm a')}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {comment.is_resolved && (
                                <Badge className="bg-green-600">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Resolved
                                </Badge>
                              )}
                              {!comment.is_resolved && (
                                <Badge variant="outline">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Open
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Comment Text */}
                      <p className="text-sm text-gray-700 ml-13">{comment.comment}</p>

                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-13">
                        {currentUser && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                          >
                            <Reply className="w-3 h-3 mr-1" />
                            Reply
                          </Button>
                        )}
                        
                        {currentUser && !comment.is_resolved && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResolveComment(comment.id, true)}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Mark Resolved
                          </Button>
                        )}

                        {currentUser && comment.is_resolved && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResolveComment(comment.id, false)}
                          >
                            Reopen
                          </Button>
                        )}
                      </div>

                      {/* Reply Input */}
                      {replyingTo === comment.id && (
                        <div className="ml-13 space-y-2">
                          <Textarea
                            placeholder="Write your reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handlePostReply(comment.id)}
                              disabled={!replyText.trim()}
                              size="sm"
                            >
                              Post Reply
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyText('');
                              }}
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="ml-13 space-y-3 pt-3 border-t border-gray-200">
                          {comment.replies.map((reply, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">
                                  {getInitials(reply.author_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-xs">{reply.author_name}</p>
                                  <p className="text-xs text-gray-500">
                                    {format(new Date(reply.created_date), 'MMM d, h:mm a')}
                                  </p>
                                </div>
                                <p className="text-sm text-gray-700 mt-1">{reply.comment}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
