import React, { useState, useEffect, useRef } from "react";
import { apiClient } from "@/apis/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Archive,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  ExternalLink,
  Filter,
  Loader2,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function NotificationCenter({ userEmail, isPopover = false, onClose }) {
  const [selectedTab, setSelectedTab] = useState("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const timersRef = useRef({});

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      const allNotifications = await apiClient.entities.Notification.list('-created_date');
      return allNotifications.filter(n => n.user_email === userEmail && !n.is_archived);
    },
    enabled: !!userEmail,
    initialData: [],
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => apiClient.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      for (const notification of unreadNotifications) {
        await apiClient.entities.Notification.update(notification.id, { is_read: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast({
        title: "All marked as read",
        description: "All notifications have been marked as read.",
      });
    },
  });

  const archiveNotificationMutation = useMutation({
    mutationFn: (id) => apiClient.entities.Notification.update(id, { is_archived: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => apiClient.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

    useEffect(() => {
    // Clear all existing timers on change
    Object.values(timersRef.current).forEach(timer => clearTimeout(timer));
    timersRef.current = {};

    const unreadNotifications = notifications.filter(n => !n.is_read);
    
    unreadNotifications.forEach(notification => {
      if (!timersRef.current[notification.id]) {
        // In popover, mark as read. In full view (grid), archive it.
        const callback = isPopover 
          ? () => markAsReadMutation.mutate(notification.id)
          : () => archiveNotificationMutation.mutate(notification.id);

        timersRef.current[notification.id] = setTimeout(() => {
          callback();
          delete timersRef.current[notification.id];
        }, 15000); // 15 seconds to auto-close
      }
    });

    // Cleanup timers on unmount
    return () => {
      Object.values(timersRef.current).forEach(timer => clearTimeout(timer));
      timersRef.current = {};
    };
  }, [notifications, isPopover, markAsReadMutation, archiveNotificationMutation]);

  const getTypeIcon = (type) => {
    const icons = {
      error: <AlertCircle className="w-5 h-5 text-red-600" />,
      warning: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
      success: <CheckCircle2 className="w-5 h-5 text-green-600" />,
      info: <Info className="w-5 h-5 text-blue-600" />
    };
    return icons[type] || icons.info;
  };

  const getTypeColor = (type) => {
    const colors = {
      error: "bg-red-50 border-red-200",
      warning: "bg-yellow-50 border-yellow-200",
      success: "bg-green-50 border-green-200",
      info: "bg-blue-50 border-blue-200"
    };
    return colors[type] || colors.info;
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      urgent: "bg-red-600 text-white",
      high: "bg-orange-600 text-white",
      medium: "bg-blue-600 text-white",
      low: "bg-gray-600 text-white"
    };
    return styles[priority] || styles.medium;
  };

  const filteredNotifications = notifications.filter(n => {
    if (selectedTab === "all") return true;
    if (selectedTab === "unread") return !n.is_read;
    if (selectedTab === "read") return n.is_read;
    return n.category === selectedTab;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotificationClick = (notification) => {
    if (timersRef.current[notification.id]) {
      clearTimeout(timersRef.current[notification.id]);
      delete timersRef.current[notification.id];
    }
    
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }

    if (notification.action_url && isPopover) {
      window.location.href = notification.action_url;
      if (onClose) onClose();
    }
  };

  const handleArchive = (e, notificationId) => {
    e.stopPropagation();
    
    if (timersRef.current[notificationId]) {
      clearTimeout(timersRef.current[notificationId]);
      delete timersRef.current[notificationId];
    }
    
    archiveNotificationMutation.mutate(notificationId);
  };

  if (isPopover) {
    return (
      <div className="w-full max-h-[500px] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex items-center justify-between bg-white sticky top-0 z-10">
          <h3 className="font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge className="bg-red-600">{unreadCount}</Badge>
            )}
          </h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                title="Mark all as read"
              >
                <CheckCheck className="w-4 h-4" />
              </Button>
            )}
            {onClose && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium">No notifications</p>
              <p className="text-xs mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y">
              <AnimatePresence mode="popLayout">
                {filteredNotifications.slice(0, 10).map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0, x: -100 }}
                    transition={{ duration: 0.2 }}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm line-clamp-2">{notification.title}</p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full mt-1" />
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-gray-200"
                              onClick={(e) => handleArchive(e, notification.id)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <p className="text-xs text-gray-500">
                            {new Date(notification.created_date).toLocaleString()}
                          </p>
                          {notification.priority && notification.priority !== 'medium' && (
                            <Badge className={`text-xs ${getPriorityBadge(notification.priority)}`}>
                              {notification.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {filteredNotifications.length > 10 && (
          <div className="p-3 border-t bg-white">
            <Button 
              variant="outline" 
              className="w-full" 
              size="sm"
              onClick={() => {
                window.location.href = '/settings?tab=notifications';
                if (onClose) onClose();
              }}
            >
              View All Notifications
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-7 h-7" />
            Notifications
            {unreadCount > 0 && (
              <Badge className="bg-red-600">{unreadCount}</Badge>
            )}
          </h2>
          <p className="text-gray-600 mt-1">Stay updated with alerts and notifications</p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">
            All ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="rate_limit">
            Rate Limits
          </TabsTrigger>
          <TabsTrigger value="training">
            Training
          </TabsTrigger>
          <TabsTrigger value="usage">
            Usage
          </TabsTrigger>
          <TabsTrigger value="system">
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4 mt-6">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-gray-400 mx-auto" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center text-gray-500">
                <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-semibold mb-2">No notifications</p>
                <p className="text-sm">You're all caught up!</p>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredNotifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className={`border-2 ${getTypeColor(notification.type)} ${
                    !notification.is_read ? 'shadow-md' : ''
                  }`}>
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          {getTypeIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-lg">{notification.title}</h3>
                                {!notification.is_read && (
                                  <Badge variant="outline" className="bg-blue-600 text-white">
                                    New
                                  </Badge>
                                )}
                                <Badge className={getPriorityBadge(notification.priority)}>
                                  {notification.priority}
                                </Badge>
                                {notification.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {notification.category}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-gray-700 mt-2">{notification.message}</p>
                              <p className="text-sm text-gray-500 mt-3">
                                {new Date(notification.created_date).toLocaleString()}
                              </p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  •••
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!notification.is_read && (
                                  <DropdownMenuItem
                                    onClick={() => markAsReadMutation.mutate(notification.id)}
                                  >
                                    <Check className="w-4 h-4 mr-2" />
                                    Mark as Read
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => archiveNotificationMutation.mutate(notification.id)}
                                >
                                  <Archive className="w-4 h-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => deleteNotificationMutation.mutate(notification.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {notification.action_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-4"
                              onClick={() => window.location.href = notification.action_url}
                            >
                              {notification.action_label || 'View Details'}
                              <ExternalLink className="w-4 h-4 ml-2" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
