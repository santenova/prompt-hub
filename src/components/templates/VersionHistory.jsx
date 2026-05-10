import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, GitBranch, User, FileText, RotateCcw } from "lucide-react";
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function VersionHistory({ template, onRestoreVersion, currentUser }) {
  const [showVersionDetails, setShowVersionDetails] = useState(null);
  const [compareVersions, setCompareVersions] = useState([]);
  const versions = template.version_history || [];
  const currentVersion = template.version || 1;

  const canRevert = template.created_by === currentUser?.email || 
                    template.user_permissions?.[currentUser?.email] === 'edit';

  const handleToggleCompare = (version) => {
    if (compareVersions.includes(version.version)) {
      setCompareVersions(compareVersions.filter(v => v !== version.version));
    } else if (compareVersions.length < 2) {
      setCompareVersions([...compareVersions, version.version]);
    }
  };

  const handleRestore = (version) => {
    if (onRestoreVersion) {
      onRestoreVersion(version);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-purple-600" />
              Version History
            </CardTitle>
            <Badge className="bg-purple-600">
              Current: v{currentVersion}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {versions.length === 0 ? (
            <Alert>
              <AlertDescription>
                No version history yet. Changes will be tracked automatically.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              {versions.map((version, idx) => (
                <Card key={idx} className={version.version === currentVersion ? 'border-2 border-purple-300 bg-purple-50' : ''}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={version.version === currentVersion ? "default" : "outline"}>
                            v{version.version}
                          </Badge>
                          {version.version === currentVersion && (
                            <Badge className="bg-green-600">Current</Badge>
                          )}
                        </div>
                        
                        <h4 className="font-semibold text-sm mb-1">{version.title}</h4>
                        
                        <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {version.edited_by_name || version.edited_by}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(version.saved_date), 'MMM d, yyyy h:mm a')}
                          </div>
                        </div>

                        {version.change_notes && (
                          <p className="text-xs text-gray-600 italic">"{version.change_notes}"</p>
                        )}

                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">{version.category}</Badge>
                          {version.subcategory && (
                            <Badge variant="outline" className="text-xs">{version.subcategory}</Badge>
                          )}
                          {version.tags && version.tags.slice(0, 3).map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">#{tag}</Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowVersionDetails(version)}
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        
                        {version.version !== currentVersion && onRestoreVersion && canRevert && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestore(version)}
                            className="text-purple-600 hover:text-purple-700"
                            title="Restore this version"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Restore
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleCompare(version)}
                          disabled={compareVersions.length >= 2 && !compareVersions.includes(version.version)}
                          className={compareVersions.includes(version.version) ? 'bg-blue-50 border-blue-300' : ''}
                          title="Compare versions"
                        >
                          <GitBranch className="w-3 h-3 mr-1" />
                          Compare
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Version Details Dialog */}
      <Dialog open={!!showVersionDetails} onOpenChange={(open) => !open && setShowVersionDetails(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {showVersionDetails?.type === 'compare' 
                ? `Compare v${showVersionDetails.v1?.version} vs v${showVersionDetails.v2?.version}`
                : `Version ${showVersionDetails?.version} - ${showVersionDetails?.title}`}
            </DialogTitle>
          </DialogHeader>

          {showVersionDetails && showVersionDetails.type === 'compare' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-sm mb-2">Version {showVersionDetails.v1?.version}</h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm whitespace-pre-wrap">{showVersionDetails.v1?.content}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-2">Version {showVersionDetails.v2?.version}</h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm whitespace-pre-wrap">{showVersionDetails.v2?.content}</p>
                </div>
              </div>
            </div>
          ) : showVersionDetails && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Content:</p>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm whitespace-pre-wrap">{showVersionDetails.content}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Category:</p>
                  <Badge>{showVersionDetails.category}</Badge>
                </div>
                {showVersionDetails.subcategory && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Subcategory:</p>
                    <Badge variant="outline">{showVersionDetails.subcategory}</Badge>
                  </div>
                )}
              </div>

              {showVersionDetails.tags && showVersionDetails.tags.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {showVersionDetails.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary">#{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {showVersionDetails.change_notes && (
                <Alert>
                  <AlertDescription>
                    <strong>Change Notes:</strong> {showVersionDetails.change_notes}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}