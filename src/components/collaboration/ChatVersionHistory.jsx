import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { History, Save, RotateCcw, Clock, User, FileText, X } from "lucide-react";
import { apiClient } from "@/apis/client";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";

export default function ChatVersionHistory({ sessionId, currentMessages, onRestore }) {
  const [versions, setVersions] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [changeSummary, setChangeSummary] = useState('');
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadUser = async () => {
      const user = await apiClient.auth.me();
      setCurrentUser(user);
    };
    loadUser();
    loadVersions();
  }, [sessionId]);

  const loadVersions = async () => {
    try {
      const results = await apiClient.entities.ChatSessionVersion.filter({
        session_id: sessionId
      }, '-version_number');
      setVersions(results);
    } catch (error) {
      console.error('Failed to load versions:', error);
    }
  };

  const createSnapshot = async () => {
    if (!currentUser) return;

    try {
      const nextVersion = versions.length > 0 ? Math.max(...versions.map(v => v.version_number)) + 1 : 1;
      
      await apiClient.entities.ChatSessionVersion.create({
        session_id: sessionId,
        version_number: nextVersion,
        messages: currentMessages,
        snapshot_by: currentUser.email,
        snapshot_name: snapshotName.trim() || `Version ${nextVersion}`,
        change_summary: changeSummary.trim() || 'Manual snapshot',
        metadata: {
          message_count: currentMessages.length,
          created_at: new Date().toISOString()
        }
      });

      setSnapshotName('');
      setChangeSummary('');
      setIsDialogOpen(false);
      loadVersions();
      toast({ title: "Snapshot Created", description: "Version saved successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create snapshot", variant: "destructive" });
    }
  };

  const restoreVersion = async (version) => {
    if (!onRestore) return;

    try {
      onRestore(version.messages);
      toast({ 
        title: "Version Restored", 
        description: `Restored to ${version.snapshot_name}` 
      });
      setSelectedVersion(null);
    } catch (error) {
      toast({ title: "Error", description: "Failed to restore version", variant: "destructive" });
    }
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <History className="w-4 h-4 mr-2" />
            Version History
            {versions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {versions.length}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Version History
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Create new snapshot */}
            <Card className="border-2 border-purple-200 bg-purple-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Create New Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Snapshot Name</Label>
                  <Input
                    value={snapshotName}
                    onChange={(e) => setSnapshotName(e.target.value)}
                    placeholder="e.g., Before major changes..."
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Change Summary</Label>
                  <Textarea
                    value={changeSummary}
                    onChange={(e) => setChangeSummary(e.target.value)}
                    placeholder="Describe what changed..."
                    rows={2}
                    className="text-sm"
                  />
                </div>
                <Button
                  onClick={createSnapshot}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Current State
                </Button>
              </CardContent>
            </Card>

            {/* Version list */}
            <ScrollArea className="h-96">
              <div className="space-y-2">
                <AnimatePresence>
                  {versions.map((version) => (
                    <motion.div
                      key={version.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      <Card 
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedVersion?.id === version.id ? 'border-2 border-purple-500 bg-purple-50' : ''
                        }`}
                        onClick={() => setSelectedVersion(version)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  v{version.version_number}
                                </Badge>
                                <p className="font-semibold text-sm">{version.snapshot_name}</p>
                              </div>
                              <p className="text-xs text-gray-600 mb-2">{version.change_summary}</p>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {version.snapshot_by}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {moment(version.created_date).fromNow()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  {version.messages?.length || 0} messages
                                </span>
                              </div>
                            </div>
                            {selectedVersion?.id === version.id && (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  restoreVersion(version);
                                }}
                                className="bg-gradient-to-r from-green-600 to-emerald-600"
                              >
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Restore
                              </Button>
                            )}
                          </div>

                          {/* Preview if selected */}
                          {selectedVersion?.id === version.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-3 pt-3 border-t border-gray-200"
                            >
                              <p className="text-xs font-semibold mb-2">Message Preview:</p>
                              <ScrollArea className="h-32">
                                <div className="space-y-1 text-xs">
                                  {version.messages?.slice(0, 5).map((msg, idx) => (
                                    <div key={idx} className="p-2 bg-gray-50 rounded">
                                      <span className="font-semibold">{msg.role}:</span>{' '}
                                      <span className="text-gray-600">
                                        {msg.content.substring(0, 100)}
                                        {msg.content.length > 100 ? '...' : ''}
                                      </span>
                                    </div>
                                  ))}
                                  {version.messages?.length > 5 && (
                                    <p className="text-gray-500 italic">
                                      +{version.messages.length - 5} more messages...
                                    </p>
                                  )}
                                </div>
                              </ScrollArea>
                            </motion.div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {versions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No versions yet</p>
                    <p className="text-xs">Create your first snapshot above</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
