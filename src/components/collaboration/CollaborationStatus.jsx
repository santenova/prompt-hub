import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

export default function CollaborationStatus({ lastSyncTime, isRefreshing, error, onRefresh }) {
  const [timeSinceSync, setTimeSinceSync] = useState(0);

  useEffect(() => {
    if (!lastSyncTime) return;

    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - lastSyncTime) / 1000);
      setTimeSinceSync(seconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastSyncTime]);

  const getStatusColor = () => {
    if (error) return 'bg-red-500';
    if (timeSinceSync > 30) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (error) return 'Connection error';
    if (isRefreshing) return 'Syncing...';
    if (timeSinceSync < 5) return 'Live';
    if (timeSinceSync < 30) return `Updated ${timeSinceSync}s ago`;
    return 'Checking for updates...';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className="text-xs h-6 px-2 bg-white cursor-pointer hover:bg-purple-50 transition-colors"
            onClick={onRefresh}
          >
            {error ? (
              <WifiOff className="w-3 h-3 mr-1 text-red-500" />
            ) : isRefreshing ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw className="w-3 h-3 mr-1 text-blue-500" />
              </motion.div>
            ) : (
              <>
                <Wifi className="w-3 h-3 mr-1 text-green-500" />
                <motion.span
                  className={`w-1.5 h-1.5 rounded-full ${getStatusColor()} mr-1`}
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </>
            )}
            {getStatusText()}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <p>Real-time collaboration active</p>
            {lastSyncTime && <p>Last sync: {new Date(lastSyncTime).toLocaleTimeString()}</p>}
            <p className="text-gray-400 font-semibold">Click to refresh now</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}