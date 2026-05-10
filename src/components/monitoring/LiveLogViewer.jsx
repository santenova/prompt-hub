import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Terminal,
  Search,
  Filter,
  Download,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LiveLogViewer({ logs, subscriptionId, autoRefresh }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef(null);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const getStatusColor = (status) => {
    const colors = {
      success: "bg-green-100 text-green-800",
      error: "bg-red-100 text-red-800",
      timeout: "bg-orange-100 text-orange-800",
      pending: "bg-blue-100 text-blue-800"
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status) => {
    const icons = {
      success: <CheckCircle2 className="w-4 h-4 text-green-600" />,
      error: <XCircle className="w-4 h-4 text-red-600" />,
      timeout: <Clock className="w-4 h-4 text-orange-600" />,
      pending: <AlertCircle className="w-4 h-4 text-blue-600" />
    };
    return icons[status] || icons.pending;
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchQuery || 
      log.request_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.endpoint?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.error_message?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    const matchesMethod = methodFilter === "all" || log.method === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `agent-logs-${subscriptionId}-${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const safeAverage = (arr, key) => {
    const validValues = arr.filter(item => item[key] != null && !isNaN(item[key]));
    if (validValues.length === 0) return 0;
    const sum = validValues.reduce((acc, item) => acc + Number(item[key]), 0);
    return Math.round(sum / validValues.length);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            Live Logs
            {autoRefresh && (
              <Badge className="bg-green-600 animate-pulse">LIVE</Badge>
            )}
          </CardTitle>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoScroll(!autoScroll)}
              className="flex-1 sm:flex-none"
            >
              {autoScroll ? "Auto-scroll ON" : "Auto-scroll OFF"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportLogs}
              className="flex-1 sm:flex-none"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="timeout">Timeout</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-full sm:w-[150px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="invoke">Invoke</SelectItem>
              <SelectItem value="stream">Stream</SelectItem>
              <SelectItem value="batch">Batch</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Log Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
            <p className="text-xs text-gray-600">Total</p>
            <p className="text-lg sm:text-xl font-bold">{filteredLogs.length}</p>
          </div>
          <div className="bg-green-50 p-2 sm:p-3 rounded-lg">
            <p className="text-xs text-gray-600">Success</p>
            <p className="text-lg sm:text-xl font-bold text-green-600">
              {filteredLogs.filter(l => l.status === 'success').length}
            </p>
          </div>
          <div className="bg-red-50 p-2 sm:p-3 rounded-lg">
            <p className="text-xs text-gray-600">Errors</p>
            <p className="text-lg sm:text-xl font-bold text-red-600">
              {filteredLogs.filter(l => l.status === 'error').length}
            </p>
          </div>
          <div className="bg-blue-50 p-2 sm:p-3 rounded-lg">
            <p className="text-xs text-gray-600">Avg Time</p>
            <p className="text-lg sm:text-xl font-bold text-blue-600">
              {safeAverage(filteredLogs, 'response_time_ms')}ms
            </p>
          </div>
        </div>

        {/* Log Entries */}
        <div className="bg-gray-900 rounded-lg p-4 max-h-[500px] overflow-y-auto font-mono text-sm">
          {filteredLogs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Terminal className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No logs to display</p>
              {(searchQuery || statusFilter !== "all" || methodFilter !== "all") && (
                <p className="text-xs mt-2">Try adjusting your filters</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {filteredLogs.map((log, index) => (
                  <motion.div
                    key={log.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="border-b border-gray-700 pb-2 last:border-0"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-1">
                      <Badge className={`${getStatusColor(log.status)} text-xs`}>
                        {getStatusIcon(log.status)}
                        <span className="ml-1">{log.status}</span>
                      </Badge>
                      <span className="text-gray-400 text-xs">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {log.method}
                      </Badge>
                      {log.response_time_ms && (
                        <span className="text-blue-400 text-xs">
                          {log.response_time_ms}ms
                        </span>
                      )}
                    </div>
                    <div className="text-gray-300 text-xs break-all">
                      <span className="text-purple-400">{log.request_id}</span>
                      {' → '}
                      <span className="text-green-400">{log.endpoint}</span>
                    </div>
                    {log.error_message && (
                      <div className="text-red-400 text-xs mt-1">
                        Error: {log.error_message}
                      </div>
                    )}
                    {log.input_tokens && (
                      <div className="text-gray-500 text-xs mt-1">
                        Tokens: {log.input_tokens} in / {log.output_tokens} out
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}