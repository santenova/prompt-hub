import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function CollaborationStatus({ lastSyncTime, isRefreshing, onRefresh }) {
  return (
    <button
      onClick={onRefresh}
      disabled={isRefreshing}
      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
      title="Refresh"
    >
      <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
      {isRefreshing ? 'Syncing...' : lastSyncTime ? `Updated ${new Date(lastSyncTime).toLocaleTimeString()}` : ''}
    </button>
  );
}