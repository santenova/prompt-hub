import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Archive,
  ArchiveRestore,
  Star,
  Folder,
  Tag,
  Search,
  Clock,
  MessageSquare,
  Edit2,
  Share2,
  Trash2,
  FileText,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SessionManager({
  sessions = [],
  currentSessionId,
  folders = [],
  onSessionSelect,
  onSessionRename,
  onSessionDelete,
  onSessionArchive,
  onSessionUnarchive,
  onSessionMove,
  onSessionTag,
  onSessionFavorite,
  onSessionExport,
  onSessionShare,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [showArchived, setShowArchived] = useState(false);

  // Filter sessions
  const filterSessions = () => {
    let filtered = sessions.filter(
      (s) => showArchived ? s.is_archived : !s.is_archived
    );

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((s) => {
        const nameMatch = s.name.toLowerCase().includes(query);
        const contentMatch = s.messages.some((m) =>
          m.content.toLowerCase().includes(query)
        );
        const tagMatch = s.tags?.some((t) => t.toLowerCase().includes(query));
        return nameMatch || contentMatch || tagMatch;
      });
    }

    // Tab filter
    if (activeTab === "favorites") {
      filtered = filtered.filter((s) => s.isFavorite);
    } else if (activeTab === "folders" && folders.length > 0) {
      filtered = filtered.filter((s) => s.folder);
    }

    // Sort
    if (sortBy === "recent") {
      filtered.sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      );
    } else if (sortBy === "oldest") {
      filtered.sort(
        (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt)
      );
    } else if (sortBy === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "messages") {
      filtered.sort((a, b) => b.messages.length - a.messages.length);
    }

    return filtered;
  };

  const filteredSessions = filterSessions();
  const sessionsByFolder = folders.reduce((acc, folder) => {
    acc[folder] = filteredSessions.filter((s) => s.folder === folder);
    return acc;
  }, {});

  const SessionCard = ({ session, isPinned = false }) => (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      onClick={() => onSessionSelect(session.id)}
      className={`p-3 rounded-lg border-2 cursor-pointer transition-all group ${
        currentSessionId === session.id
          ? "border-purple-500 bg-purple-50"
          : "border-gray-200 hover:border-purple-300 bg-white"
      }`}
    >
      <div className="space-y-2">
        {/* Header with title and favorites */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-600 flex-shrink-0" />
              <p className="font-medium text-sm truncate">{session.name}</p>
              {session.isFavorite && (
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
              )}
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-2 items-center text-xs">
          <Badge variant="outline">{session.messages.length} msgs</Badge>
          {session.model && (
            <Badge variant="secondary" className="truncate">
              {session.model}
            </Badge>
          )}
          {session.folder && (
            <Badge variant="outline" className="text-xs">
              📁 {session.folder}
            </Badge>
          )}
        </div>

        {/* Tags */}
        {session.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {session.tags.slice(0, 2).map((tag, idx) => (
              <Badge
                key={idx}
                className="text-xs bg-purple-100 text-purple-700"
              >
                #{tag}
              </Badge>
            ))}
            {session.tags.length > 2 && (
              <Badge className="text-xs bg-gray-100 text-gray-700">
                +{session.tags.length - 2} more
              </Badge>
            )}
          </div>
        )}

        {/* Timestamp */}
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(session.updatedAt).toLocaleDateString()}
        </p>

        {/* Action buttons */}
        <div className="flex gap-1 flex-wrap pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSessionFavorite(session.id);
            }}
            className="h-6 px-2 text-xs"
          >
            <Star
              className={`w-3 h-3 ${
                session.isFavorite ? "text-yellow-500 fill-yellow-500" : ""
              }`}
            />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-6 px-2">
                <ChevronRight className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="right">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onSessionRename(session.id);
                }}
              >
                <Edit2 className="w-3 h-3 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onSessionMove(session.id);
                }}
              >
                <Folder className="w-3 h-3 mr-2" />
                Move to Folder
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onSessionTag(session.id);
                }}
              >
                <Tag className="w-3 h-3 mr-2" />
                Manage Tags
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onSessionShare(session.id);
                }}
              >
                <Share2 className="w-3 h-3 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-100">
                    <FileText className="w-3 h-3" />
                    Export
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onSessionExport(session, "json");
                    }}
                  >
                    JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onSessionExport(session, "text");
                    }}
                  >
                    Text
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onSessionExport(session, "pdf");
                    }}
                  >
                    PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  session.is_archived
                    ? onSessionUnarchive(session.id)
                    : onSessionArchive(session.id);
                }}
              >
                {session.is_archived ? (
                  <>
                    <ArchiveRestore className="w-3 h-3 mr-2" />
                    Unarchive
                  </>
                ) : (
                  <>
                    <Archive className="w-3 h-3 mr-2" />
                    Archive
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onSessionDelete(session.id);
                }}
                className="text-red-600"
              >
                <Trash2 className="w-3 h-3 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="h-full flex flex-col space-y-3">
      {/* Search and Controls */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search sessions, tags, content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2 items-center">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-auto h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="messages">Message Count</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={showArchived ? "default" : "outline"}
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
            className="h-9 text-sm"
          >
            {showArchived ? (
              <>
                <ArchiveRestore className="w-3 h-3 mr-1" />
                Archived
              </>
            ) : (
              <>
                <Archive className="w-3 h-3 mr-1" />
                Active
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="text-xs">
            All
            <Badge variant="outline" className="ml-1 text-xs">
              {filteredSessions.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="favorites" className="text-xs">
            ⭐ Favorites
            <Badge variant="outline" className="ml-1 text-xs">
              {filteredSessions.filter((s) => s.isFavorite).length}
            </Badge>
          </TabsTrigger>
          {folders.length > 0 && (
            <TabsTrigger value="folders" className="text-xs">
              📁 Folders
            </TabsTrigger>
          )}
        </TabsList>

        {/* All Sessions */}
        <TabsContent value="all" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-2 pr-4">
              <AnimatePresence>
                {filteredSessions.length > 0 ? (
                  filteredSessions.map((session) => (
                    <SessionCard key={session.id} session={session} />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">
                      {showArchived
                        ? "No archived sessions"
                        : "No active sessions"}
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Favorites */}
        <TabsContent value="favorites" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-2 pr-4">
              <AnimatePresence>
                {filteredSessions.filter((s) => s.isFavorite).length > 0 ? (
                  filteredSessions
                    .filter((s) => s.isFavorite)
                    .map((session) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        isPinned
                      />
                    ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No favorite sessions yet</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Folders */}
        {folders.length > 0 && (
          <TabsContent value="folders" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-4 pr-4">
                <AnimatePresence>
                  {folders.map((folder) => (
                    <div key={folder} className="space-y-2">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Folder className="w-4 h-4 text-blue-600" />
                        {folder}
                        <Badge variant="outline" className="ml-auto text-xs">
                          {sessionsByFolder[folder]?.length || 0}
                        </Badge>
                      </h4>
                      <div className="space-y-2 ml-2">
                        {(sessionsByFolder[folder] || []).length > 0 ? (
                          (sessionsByFolder[folder] || []).map((session) => (
                            <SessionCard key={session.id} session={session} />
                          ))
                        ) : (
                          <p className="text-xs text-gray-500 italic">
                            No sessions in this folder
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}