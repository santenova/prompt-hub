import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertCircle, 
  Trash2, 
  MessageSquare, 
  Database,
  TrendingUp,
  RotateCcw
} from "lucide-react";
import { motion } from "framer-motion";

// Token estimation (rough approximation: ~4 chars per token)
const estimateTokens = (text) => {
  return Math.ceil(text.length / 4);
};

export default function ContextManager({ 
  messages, 
  selectedModel, 
  onClearContext,
  onTrimContext,
  contextWindowSize = 4096 
}) {
  const totalTokens = React.useMemo(() => {
    return messages.reduce((sum, msg) => {
      return sum + estimateTokens(msg.content);
    }, 0);
  }, [messages]);

  const usagePercentage = (totalTokens / contextWindowSize) * 100;
  const isNearLimit = usagePercentage > 80;
  const isOverLimit = usagePercentage > 100;

  const getStatusColor = () => {
    if (isOverLimit) return 'text-red-600';
    if (isNearLimit) return 'text-orange-600';
    return 'text-green-600';
  };

  const getStatusBadge = () => {
    if (isOverLimit) return { text: 'Over Limit', class: 'bg-red-100 text-red-700' };
    if (isNearLimit) return { text: 'Near Limit', class: 'bg-orange-100 text-orange-700' };
    return { text: 'Healthy', class: 'bg-green-100 text-green-700' };
  };

  const status = getStatusBadge();

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Context Management</CardTitle>
          </div>
          <Badge className={status.class}>{status.text}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Token Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Context Window Usage</span>
            <span className={`font-medium ${getStatusColor()}`}>
              {totalTokens.toLocaleString()} / {contextWindowSize.toLocaleString()} tokens
            </span>
          </div>
          <Progress 
            value={Math.min(usagePercentage, 100)} 
            className={`h-2 ${isOverLimit ? 'bg-red-200' : isNearLimit ? 'bg-orange-200' : ''}`}
          />
          <p className="text-xs text-gray-500">
            {usagePercentage.toFixed(1)}% of context window used
          </p>
        </div>

        {/* Message Breakdown */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Message Breakdown</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
              <span className="text-gray-600">Total Messages</span>
              <Badge variant="outline">{messages.length}</Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
              <span className="text-gray-600">Avg Tokens/Msg</span>
              <Badge variant="outline">
                {messages.length > 0 ? Math.round(totalTokens / messages.length) : 0}
              </Badge>
            </div>
          </div>
        </div>

        {/* Warning Messages */}
        {isNearLimit && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg"
          >
            <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5" />
            <div className="text-xs text-orange-800">
              <p className="font-medium">Context window is filling up</p>
              <p className="mt-1">Consider trimming older messages to maintain performance</p>
            </div>
          </motion.div>
        )}

        {isOverLimit && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
            <div className="text-xs text-red-800">
              <p className="font-medium">Context window exceeded</p>
              <p className="mt-1">Some messages may be truncated. Trim context to continue</p>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onTrimContext}
            disabled={messages.length < 2}
            className="flex-1"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Trim Old Messages
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearContext}
            disabled={messages.length === 0}
            className="flex-1 text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Clear All
          </Button>
        </div>

        {/* Model Info */}
        {selectedModel && (
          <div className="pt-3 border-t">
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex items-center justify-between">
                <span>Model:</span>
                <span className="font-medium">{selectedModel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Context Window:</span>
                <span className="font-medium">{contextWindowSize.toLocaleString()} tokens</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}