import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/apis/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Search, Plus, Pencil, Trash2, Eye, Download, Share2, LogIn, LogOut } from 'lucide-react';
import { format } from 'date-fns';

const actionIcons = {
  create: Plus,
  update: Pencil,
  delete: Trash2,
  view: Eye,
  export: Download,
  share: Share2,
  login: LogIn,
  logout: LogOut
};

const actionColors = {
  create: 'bg-green-100 text-green-800 border-green-200',
  update: 'bg-blue-100 text-blue-800 border-blue-200',
  delete: 'bg-red-100 text-red-800 border-red-200',
  view: 'bg-gray-100 text-gray-800 border-gray-200',
  export: 'bg-purple-100 text-purple-800 border-purple-200',
  share: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  login: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  logout: 'bg-orange-100 text-orange-800 border-orange-200'
};

export default function ActivityLogViewer() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['activityLogs'],
    queryFn: () => apiClient.entities.ActivityLog.list('-created_date', 200),
    refetchInterval: 30000
  });

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesEntity = entityFilter === 'all' || log.entity_type === entityFilter;

    return matchesSearch && matchesAction && matchesEntity;
  });

  const entityTypes = [...new Set(logs.map(log => log.entity_type))].filter(Boolean);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            Activity Logs
          </CardTitle>
          <CardDescription>Track all user actions within the app</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="view">View</SelectItem>
                <SelectItem value="export">Export</SelectItem>
                <SelectItem value="share">Share</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
              </SelectContent>
            </Select>

            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {entityTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(searchTerm || actionFilter !== 'all' || entityFilter !== 'all') && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setActionFilter('all');
                  setEntityFilter('all');
                }}
              >
                Clear Filters
              </Button>
              <span className="text-sm text-gray-500">
                Showing {filteredLogs.length} of {logs.length} logs
              </span>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12 text-gray-500">
              Loading activity logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No activity logs found</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {filteredLogs.map((log) => {
                  const ActionIcon = actionIcons[log.action] || Activity;
                  const actionColor = actionColors[log.action] || 'bg-gray-100 text-gray-800';
                  
                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className={`p-2 rounded-lg ${actionColor}`}>
                        <ActionIcon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">
                            {log.user_name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {log.action}
                          </Badge>
                          {log.entity_type && (
                            <Badge variant="secondary" className="text-xs">
                              {log.entity_type}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-1">
                          {log.entity_name && (
                            <span className="font-medium">{log.entity_name}</span>
                          )}
                        </p>
                        
                        {log.details && Object.keys(log.details).length > 0 && (
                          <details className="text-xs text-gray-500 mt-2">
                            <summary className="cursor-pointer hover:text-gray-700">
                              View details
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>{format(new Date(log.created_date), 'PPp')}</span>
                          <span>{log.user_email}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
