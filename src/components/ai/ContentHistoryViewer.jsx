import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  History, 
  Copy, 
  Download, 
  RefreshCw, 
  Trash2, 
  Star, 
  Search,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  FileText,
  Eye,
  Edit
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/apis/client";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

export default function ContentHistoryViewer({ toolType, onRegenerate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['contentHistory', toolType],
    queryFn: async () => {
      const results = await apiClient.entities.ContentHistory.filter(
        { tool_type: toolType },
        '-created_date',
        50
      );
      return Array.isArray(results) ? results : [];
    },
    initialData: [],
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.entities.ContentHistory.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['contentHistory']);
      toast({ title: "Deleted", description: "History item removed" });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite }) => 
      apiClient.entities.ContentHistory.update(id, { is_favorite: !isFavorite }),
    onSuccess: () => {
      queryClient.invalidateQueries(['contentHistory']);
    },
  });

  const copyToClipboard = (content) => {
    const textToCopy = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    navigator.clipboard.writeText(textToCopy);
    toast({ title: "Copied", description: "Content copied to clipboard" });
  };

  const downloadContent = (item) => {
    const content = item.generated_content || item.enhanced_content || '';
    const text = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-${item.created_date}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredHistory = history.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.topic?.toLowerCase().includes(query) ||
      item.persona_name?.toLowerCase().includes(query) ||
      item.template_name?.toLowerCase().includes(query) ||
      item.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  });

  const favorites = filteredHistory.filter(item => item.is_favorite);
  const regular = filteredHistory.filter(item => !item.is_favorite);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">Loading history...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-indigo-200 w-4/5 h-full overflow-hidden flex flex-col mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              Generation History
            </CardTitle>
            <Badge variant="outline">{filteredHistory.length} items</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by topic, persona, template..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {favorites.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-600 fill-yellow-600" />
                  Favorites
                </p>
                {favorites.map((item) => (
                  <HistoryItem
                    key={item.id}
                    item={item}
                    expanded={expandedId === item.id}
                    onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    onCopy={copyToClipboard}
                    onDownload={downloadContent}
                    onDelete={() => deleteMutation.mutate(item.id)}
                    onToggleFavorite={() => toggleFavoriteMutation.mutate({ id: item.id, isFavorite: item.is_favorite })}
                    onRegenerate={onRegenerate}
                  />
                ))}
              </div>
            )}

            {regular.length > 0 && (
              <div className="space-y-2">
                {favorites.length > 0 && (
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Recent</p>
                )}
                {regular.map((item) => (
                  <HistoryItem
                    key={item.id}
                    item={item}
                    expanded={expandedId === item.id}
                    onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    onCopy={copyToClipboard}
                    onDownload={downloadContent}
                    onDelete={() => deleteMutation.mutate(item.id)}
                    onToggleFavorite={() => toggleFavoriteMutation.mutate({ id: item.id, isFavorite: item.is_favorite })}
                    onRegenerate={onRegenerate}
                  />
                ))}
              </div>
            )}

            {filteredHistory.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No history yet</p>
                <p className="text-xs mt-1">Generated content will appear here</p>
              </div>
            )}
          </div>
        </ScrollArea>
        </CardContent>
      </Card>
  );
}

function HistoryItem({ item, expanded, onToggleExpand, onCopy, onDownload, onDelete, onToggleFavorite, onRegenerate }) {
  const content = item.generated_content || item.enhanced_content || item.beam_results;
  const hasMultipleVariations = Array.isArray(content) && content.length > 1;
  const isBeamResults = !!item.beam_results && Array.isArray(item.beam_results);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border rounded-lg p-3 bg-white hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm truncate">{item.topic}</h4>
            {isBeamResults && (
              <Badge className="bg-blue-100 text-blue-700 text-xs">
                {item.beam_results.length} models
              </Badge>
            )}
            {hasMultipleVariations && !isBeamResults && (
              <Badge className="bg-purple-100 text-purple-700 text-xs">
                {content.length} variations
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(item.created_date), 'MMM d, h:mm a')}
            </span>
            {item.persona_name && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {item.persona_name}
              </span>
            )}
            {item.content_type && (
              <Badge variant="outline" className="text-xs">{item.content_type}</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onToggleFavorite()}
            title="Toggle favorite"
          >
            <Star className={`w-4 h-4 ${item.is_favorite ? 'fill-yellow-600 text-yellow-600' : ''}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs gap-1"
            onClick={onToggleExpand}
          >
            <Eye className="w-3 h-3" />
            {expanded ? 'Hide' : 'View'}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 border-t space-y-3">
              {/* Parameters */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {item.tone && (
                  <div>
                    <span className="font-semibold text-gray-700">Tone:</span>
                    <span className="ml-1 text-gray-600">{item.tone}</span>
                  </div>
                )}
                {item.length && (
                  <div>
                    <span className="font-semibold text-gray-700">Length:</span>
                    <span className="ml-1 text-gray-600">{item.length}</span>
                  </div>
                )}
                {item.template_name && (
                  <div className="col-span-2">
                    <span className="font-semibold text-gray-700">Template:</span>
                    <span className="ml-1 text-gray-600">{item.template_name}</span>
                  </div>
                )}
              </div>

              {/* Content Preview */}
              {isBeamResults ? (
                <div className="space-y-2">
                  {item.beam_results.map((result, idx) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded border">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">{result.model}</Badge>
                        <Badge className={`text-xs ${
                          result.status === 'completed' ? 'bg-green-100 text-green-700' :
                          result.status === 'error' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {result.status}
                        </Badge>
                      </div>
                      <pre className="text-xs whitespace-pre-wrap">
                        {result.response?.substring(0, 200) + (result.response?.length > 200 ? '...' : '')}
                      </pre>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 p-3 rounded border max-h-48 overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap">
                    {typeof content === 'string' 
                      ? content.substring(0, 500) + (content.length > 500 ? '...' : '')
                      : JSON.stringify(content, null, 2).substring(0, 500) + '...'
                    }
                  </pre>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {onRegenerate && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onRegenerate(item)}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit & Re-use
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCopy(content)}
                  className="flex-1"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownload(item)}
                  className="flex-1"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
