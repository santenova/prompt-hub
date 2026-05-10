import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/apis/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Slack,
  Link2,
  Unlink2,
  Check,
  AlertCircle,
  Loader2,
  MessageSquare,
  Settings as SettingsIcon,
  ClipboardCopy
} from "lucide-react";
import { motion } from "framer-motion";

export default function SlackIntegrationManager({ currentUser }) {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [autoPostToSlack, setAutoPostToSlack] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load Slack webhook from user data
  useEffect(() => {
    if (currentUser?.slack_webhook_url) {
      setWebhookUrl(currentUser.slack_webhook_url);
      setAutoPostToSlack(currentUser.slack_auto_post === true);
    }
  }, [currentUser]);

  const updateUserMutation = useMutation({
    mutationFn: (data) => apiClient.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['user']);
      toast({
        title: "Settings Saved",
        description: "Your Slack integration settings have been updated.",
        duration: 3000,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save Slack settings.",
        variant: "destructive",
        duration: 3000,
      });
    }
  });

  const handleConnectSlack = async () => {
    if (!webhookUrl.trim()) {
      toast({
        title: "Missing Webhook URL",
        description: "Please enter your Slack webhook URL.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsSaving(true);
    try {
      updateUserMutation.mutate({
        slack_webhook_url: webhookUrl.trim(),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnectSlack = async () => {
    updateUserMutation.mutate({
      slack_webhook_url: null,
      slack_auto_post: false,
    });
    setWebhookUrl('');
    setShowDisconnectDialog(false);
    toast({
      title: "Disconnected",
      description: "Your Slack webhook has been removed.",
      duration: 3000,
    });
  };

  const handleUpdateAutoPost = (enabled) => {
    setAutoPostToSlack(enabled);
    updateUserMutation.mutate({
      slack_auto_post: enabled,
    });
  };

  const handleTestSlack = async () => {
    if (!webhookUrl) {
      toast({
        title: "No Webhook URL",
        description: "Please save a webhook URL first.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    try {
      const response = await apiClient.functions.invoke('testSlackWebhook', {
        webhookUrl: webhookUrl
      });

      toast({
        title: "Test Successful",
        description: "Test message sent to Slack! Check your channel.",
        duration: 5000,
      });
    } catch (error) {
      console.error('Slack test error:', error);
      toast({
        title: "Test Failed",
        description: `Could not send test message. Check your webhook URL. Error: ${error.response?.data?.error || error.message}`,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Slack className="w-5 h-5 text-purple-600" />
                Slack Integration
              </CardTitle>
              <CardDescription>
                Connect your Slack workspace to share content and receive notifications
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!webhookUrl ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Connection Info */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex gap-3">
                  <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-blue-900 font-medium mb-1">Connect Slack to:</p>
                    <ul className="text-blue-800 space-y-1 text-xs">
                      <li>• Post generated content directly to Slack channels</li>
                      <li>• Auto-post generated content (optional)</li>
                      <li>• Send notifications to your workspace</li>
                      <li>• Share and collaborate with your team</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Webhook URL Input */}
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Slack Webhook URL</Label>
                  <input
                    type="password"
                    placeholder="https://hooks.slack.com/services/..."
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Create a webhook at <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">api.slack.com/messaging/webhooks</a>
                  </p>
                </div>
              </div>

              {/* Connect Button */}
              <Button
                onClick={handleConnectSlack}
                disabled={isSaving || !webhookUrl.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 h-10"
                size="lg"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Slack className="w-5 h-5 mr-2" />
                    Connect to Slack
                  </>
                )}
              </Button>
            </motion.div>
          ) : isEditing ? (
           <motion.div
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="space-y-4"
           >
             <div className="space-y-3">
               <Label className="text-sm font-semibold mb-2 block">Update Slack Webhook URL</Label>
               <input
                 type="password"
                 placeholder="https://hooks.slack.com/services/..."
                 value={webhookUrl}
                 onChange={(e) => setWebhookUrl(e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
               />
             </div>

             <div className="flex gap-2">
               <Button
                 onClick={() => {
                   if (!webhookUrl.trim()) {
                     toast({
                       title: "Missing Webhook URL",
                       description: "Please enter your Slack webhook URL.",
                       variant: "destructive",
                     });
                     return;
                   }
                   setIsSaving(true);
                   updateUserMutation.mutate({
                     slack_webhook_url: webhookUrl.trim(),
                   });
                   setIsEditing(false);
                   setIsSaving(false);
                 }}
                 disabled={isSaving}
                 className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
               >
                 {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                 Save Changes
               </Button>
               <Button
                 variant="outline"
                 onClick={() => {
                   setIsEditing(false);
                   if (currentUser?.slack_webhook_url) {
                     setWebhookUrl(currentUser.slack_webhook_url);
                   }
                 }}
                 className="flex-1"
               >
                 Cancel
               </Button>
             </div>
           </motion.div>
          ) : (
           <motion.div
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="space-y-6"
           >
             {/* Connected Status */}
             <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                   <Check className="w-5 h-5 text-green-600" />
                 </div>
                 <div className="flex-1 min-w-0">
                   <p className="font-semibold text-green-900">Connected to Slack</p>
                   <p className="text-sm text-green-700 font-mono text-xs truncate">
                     {webhookUrl.slice(0, 30)}...{webhookUrl.slice(-10)}
                   </p>
                 </div>
                 <Button
                   variant="ghost"
                   size="icon"
                   onClick={() => {
                     navigator.clipboard.writeText(webhookUrl);
                     toast({ title: "Copied!", description: "Webhook URL copied to clipboard" });
                   }}
                   title="Copy Webhook URL"
                 >
                   <ClipboardCopy className="w-4 h-4 text-green-700" />
                 </Button>
               </div>
             </div>

              {/* Auto-Post Setting */}
              <div className="border-t pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="font-medium">Auto-Post Generated Content</Label>
                      <p className="text-xs text-gray-500 mt-1">Automatically send generated content to Slack</p>
                    </div>
                    <Switch
                      checked={autoPostToSlack}
                      onCheckedChange={handleUpdateAutoPost}
                    />
                  </div>

                  {autoPostToSlack && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-xs text-gray-600"
                    >
                      Auto-post enabled. Your generated content will be sent to the configured webhook.
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex gap-3">
                  <SettingsIcon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-purple-900">
                    <p className="font-medium mb-1">Integration Features:</p>
                    <ul className="space-y-1 text-xs text-purple-800">
                      <li>✓ Share content with your team in real-time</li>
                      <li>✓ Auto-post to preferred channels</li>
                      <li>✓ Use /prompt commands to generate content</li>
                      <li>✓ Get instant notifications on new content</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Test, Edit and Disconnect Buttons */}
              <div className="border-t pt-6 space-y-3">
                <Button
                  onClick={handleTestSlack}
                  disabled={isTesting}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Send Test Message
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="w-full border-purple-200 text-purple-600 hover:bg-purple-50"
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Edit Webhook URL
                </Button>
                <Button
                  onClick={() => setShowDisconnectDialog(true)}
                  variant="outline"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Unlink2 className="w-4 h-4 mr-2" />
                  Disconnect Slack
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Slack?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the Slack integration from your account. You can reconnect anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnectSlack}
              className="bg-red-600 hover:bg-red-700"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
