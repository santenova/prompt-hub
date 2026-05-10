import React, { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/apis/client";
import { useMutation } from '@tanstack/react-query';
import { Slack, Loader2, Copy, Send, Unlink2, Link2 } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminSlackWebhookManager({ currentUser }) {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (currentUser?.admin_slack_webhook_url) {
      setWebhookUrl(currentUser.admin_slack_webhook_url);
    }
  }, [currentUser]);

  const updateUserMutation = useMutation({
    mutationFn: (data) => apiClient.auth.updateMe(data),
    onSuccess: async () => {
      // Refresh user data to ensure persistence
      const updatedUser = await apiClient.auth.me();
      
      toast({
        title: "Settings Saved",
        description: "Admin Slack webhook updated.",
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast({
        title: "Error",
        description: "Failed to save admin Slack webhook.",
        variant: "destructive",
        duration: 3000,
      });
    }
  });

  const handleSaveWebhook = async () => {
    if (!webhookUrl.trim()) {
      toast({
        title: "Missing Webhook URL",
        description: "Please enter your Slack webhook URL.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateUserMutation.mutateAsync({
        admin_slack_webhook_url: webhookUrl.trim(),
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendSitemap = async () => {
    if (!webhookUrl) {
      toast({
        title: "No Webhook URL",
        description: "Please save a webhook URL first.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      await apiClient.functions.invoke('sendSitemapToSlack', {
        webhookUrl: webhookUrl
      });

      toast({
        title: "Sent to Slack",
        description: "Site map posted successfully!",
        duration: 5000,
      });
    } catch (error) {
      console.error('Send sitemap error:', error);
      toast({
        title: "Send Failed",
        description: error.response?.data?.error || error.message,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDisconnect = async () => {
    updateUserMutation.mutate({
      admin_slack_webhook_url: null,
    });
    setWebhookUrl('');
    toast({
      title: "Disconnected",
      description: "Admin Slack webhook has been removed.",
      duration: 3000,
    });
  };

  if (!currentUser) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Slack className="w-5 h-5 text-purple-600" />
          Admin Slack Integration
        </CardTitle>
        <CardDescription>
          Send system-wide messages like site map to Slack
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!webhookUrl ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="space-y-3">
              <Label className="text-sm font-semibold mb-2 block">Admin Slack Webhook URL</Label>
              <input
                type="password"
                placeholder="https://hooks.slack.com/services/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-600">
                Create a webhook at <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">api.slack.com/messaging/webhooks</a>
              </p>
            </div>

            <Button
              onClick={handleSaveWebhook}
              disabled={isSaving || !webhookUrl.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4 mr-2" />
                  Connect Admin Webhook
                </>
              )}
            </Button>
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
                  <span className="text-green-600">✓</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-green-900">Admin Webhook Connected</p>
                  <p className="text-sm text-green-700 font-mono text-xs truncate">
                    {webhookUrl.slice(0, 30)}...{webhookUrl.slice(-10)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(webhookUrl);
                    toast({ title: "Copied!", description: "URL copied to clipboard" });
                  }}
                  title="Copy Webhook URL"
                >
                  <Copy className="w-4 h-4 text-green-700" />
                </Button>
              </div>
            </div>

            {/* Send Sitemap Button */}
            <Button
              onClick={handleSendSitemap}
              disabled={isSending}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Site Map to Slack
                </>
              )}
            </Button>

            {/* Manage Buttons */}
            <div className="border-t pt-4 space-y-2">
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="w-full border-purple-200 text-purple-600 hover:bg-purple-50"
              >
                <Link2 className="w-4 h-4 mr-2" />
                Edit Webhook URL
              </Button>
              <Button
                onClick={handleDisconnect}
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
              >
                <Unlink2 className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </motion.div>
        )}

        {isEditing && webhookUrl && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t pt-4 space-y-3"
          >
            <Label className="text-sm font-semibold">Update Webhook URL</Label>
            <input
              type="password"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSaveWebhook}
                disabled={isSaving}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600"
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setWebhookUrl(currentUser.admin_slack_webhook_url || '');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
