import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, User, Edit, Plus, Trash, FileText, GitBranch } from "lucide-react";
import { format } from 'date-fns';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ChangeLog({ template }) {
  const changes = template.change_log || [];

  const getActionIcon = (action) => {
    switch (action) {
      case 'created': return <Plus className="w-4 h-4 text-green-600" />;
      case 'updated': return <Edit className="w-4 h-4 text-blue-600" />;
      case 'deleted': return <Trash className="w-4 h-4 text-red-600" />;
      case 'version_created': return <GitBranch className="w-4 h-4 text-purple-600" />;
      case 'collaborator_added': return <User className="w-4 h-4 text-indigo-600" />;
      case 'collaborator_removed': return <User className="w-4 h-4 text-gray-600" />;
      case 'permission_changed': return <FileText className="w-4 h-4 text-orange-600" />;
      default: return <History className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'created': return 'bg-green-100 text-green-800 border-green-200';
      case 'updated': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'deleted': return 'bg-red-100 text-red-800 border-red-200';
      case 'version_created': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'collaborator_added': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'collaborator_removed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'permission_changed': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatAction = (action) => {
    return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5 text-purple-600" />
          Change History ({changes.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {changes.length === 0 ? (
          <Alert>
            <AlertDescription>
              No changes recorded yet. All modifications will be tracked here.
            </AlertDescription>
          </Alert>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {changes.map((change, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 p-3 bg-gray-50 rounded-lg border hover:border-purple-200 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getActionIcon(change.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-xs ${getActionColor(change.action)}`}>
                          {formatAction(change.action)}
                        </Badge>
                        {change.field && (
                          <span className="text-xs text-gray-600">
                            • {change.field}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {format(new Date(change.timestamp), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-3 h-3 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {change.user_name || change.user_email}
                      </span>
                    </div>

                    {change.description && (
                      <p className="text-xs text-gray-600 mt-1">{change.description}</p>
                    )}

                    {change.old_value && change.new_value && (
                      <div className="mt-2 space-y-1">
                        <div className="text-xs">
                          <span className="text-gray-500">From:</span>
                          <span className="ml-1 text-gray-700 bg-red-50 px-1 py-0.5 rounded">
                            {String(change.old_value).length > 50 
                              ? String(change.old_value).substring(0, 50) + '...'
                              : String(change.old_value)
                            }
                          </span>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-500">To:</span>
                          <span className="ml-1 text-gray-700 bg-green-50 px-1 py-0.5 rounded">
                            {String(change.new_value).length > 50
                              ? String(change.new_value).substring(0, 50) + '...'
                              : String(change.new_value)
                            }
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}