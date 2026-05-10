import React, { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { apiClient } from "@/apis/client";
import { Send, Loader2, CheckCircle2, Circle } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminSlackMessagesPanel({ webhookUrl, currentUser }) {
  const [sendingState, setSendingState] = useState({});
  const [selectedMessages, setSelectedMessages] = useState({
    sitemap: true,
    tools: true,
    help: true,
    docs: true,
    personas: true,
    templates: true,
  });
  const { toast } = useToast();

  if (!webhookUrl) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <p className="text-sm text-amber-800">
            Please configure admin Slack webhook in settings to send messages.
          </p>
        </CardContent>
      </Card>
    );
  }

  const messages = [
    { id: 'sitemap', label: 'Site Map', fn: 'sendSitemapToSlack', color: 'blue' },
    { id: 'tools', label: 'Tools Summary', fn: 'sendToolsSummaryToSlack', color: 'purple' },
    { id: 'help', label: 'Help Summary', fn: 'sendHelpSummaryToSlack', color: 'green' },
    { id: 'docs', label: 'Documentation Summary', fn: 'sendDocsSummaryToSlack', color: 'amber' },
    { id: 'personas', label: 'Personas Summary', fn: 'sendPersonasSummaryToSlack', color: 'pink' },
    { id: 'templates', label: 'Templates Summary', fn: 'sendTemplatesSummaryToSlack', color: 'indigo' },
  ];

  const sendMessage = async (functionName, messageId) => {
    setSendingState(prev => ({ ...prev, [messageId]: true }));
    try {
      await apiClient.functions.invoke(functionName, { webhookUrl });
      toast({
        title: "Sent to Slack",
        description: `Message posted successfully!`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Send error:', error);
      toast({
        title: "Send Failed",
        description: error.response?.data?.error || error.message,
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setSendingState(prev => ({ ...prev, [messageId]: false }));
    }
  };

  const sendAllMessages = async () => {
    const selectedFunctions = messages
      .filter(msg => selectedMessages[msg.id])
      .map(msg => msg.fn);

    if (selectedFunctions.length === 0) {
      toast({
        title: "No Messages Selected",
        description: "Please select at least one message to send.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setSendingState(prev => ({ ...prev, all: true }));
    let successCount = 0;
    let failCount = 0;

    try {
      const results = await Promise.allSettled(
        selectedFunctions.map(fn => apiClient.functions.invoke(fn, { webhookUrl }))
      );

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          successCount++;
        } else {
          failCount++;
        }
      });

      if (failCount === 0) {
        toast({
          title: "Messages Sent",
          description: `${successCount} message(s) posted to Slack!`,
          duration: 4000,
        });
      } else {
        toast({
          title: "Partial Send",
          description: `${successCount} sent, ${failCount} failed`,
          variant: "destructive",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Send all error:', error);
      toast({
        title: "Send Failed",
        description: error.message,
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setSendingState(prev => ({ ...prev, all: false }));
    }
  };

  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    green: 'bg-green-50 border-green-200 hover:bg-green-100',
    amber: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
    pink: 'bg-pink-50 border-pink-200 hover:bg-pink-100',
    indigo: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
  };

  const buttonColors = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    green: 'bg-green-600 hover:bg-green-700',
    amber: 'bg-amber-600 hover:bg-amber-700',
    pink: 'bg-pink-600 hover:bg-pink-700',
    indigo: 'bg-indigo-600 hover:bg-indigo-700',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Messages to Slack</CardTitle>
        <CardDescription>
          Broadcast summaries and overviews to your admin channel
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={sendAllMessages}
          disabled={sendingState.all}
          className="w-full bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-lg"
        >
          {sendingState.all ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending All Messages...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Send All Summaries to Slack
            </>
          )}
        </motion.button>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Select Messages</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const allSelected = Object.values(selectedMessages).every(v => v);
                const newState = Object.keys(selectedMessages).reduce((acc, key) => {
                  acc[key] = !allSelected;
                  return acc;
                }, {});
                setSelectedMessages(newState);
              }}
              className="text-xs"
            >
              {Object.values(selectedMessages).every(v => v) ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {messages.map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${colorClasses[msg.color]}`}
                onClick={() => setSelectedMessages(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {selectedMessages[msg.id] ? (
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-600" />
                    ) : (
                      <Circle className="w-5 h-5 flex-shrink-0 text-gray-400" />
                    )}
                    <p className="font-medium text-sm">{msg.label}</p>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      sendMessage(msg.fn, msg.id);
                    }}
                    disabled={sendingState[msg.id]}
                    size="sm"
                    className={buttonColors[msg.color]}
                  >
                    {sendingState[msg.id] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
