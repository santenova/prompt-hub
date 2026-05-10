import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, 
  Copy, 
  Wand2, 
  Trash2, 
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowUpDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TranscriptHistory({ 
  history, 
  onPlay, 
  onCopy, 
  onReEnhance, 
  onDelete,
  isSpeaking 
}) {
  const [expandedId, setExpandedId] = React.useState(null);
  const [sortBy, setSortBy] = React.useState('time'); // 'time' or 'messages'

  const sortedHistory = React.useMemo(() => {
    if (!history) return [];
    
    const historyCopy = [...history];
    
    if (sortBy === 'messages') {
      return historyCopy.sort((a, b) => {
        const aLength = (a.transcript || '').length + (a.enhanced || '').length;
        const bLength = (b.transcript || '').length + (b.enhanced || '').length;
        return bLength - aLength; // Descending order
      });
    }
    
    return historyCopy; // Default time order
  }, [history, sortBy]);

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No history yet</p>
        <p className="text-sm">Your transcripts will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-600">{sortedHistory.length} transcripts</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortBy(sortBy === 'time' ? 'messages' : 'time')}
          className="h-7 text-xs"
        >
          <ArrowUpDown className="w-3 h-3 mr-1" />
          {sortBy === 'time' ? 'By Time' : 'By Length'}
        </Button>
      </div>
      
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          <AnimatePresence>
            {sortedHistory.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border border-gray-200 hover:border-purple-300 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {new Date(item.timestamp).toLocaleString()}
                        </Badge>
                        {item.language && (
                          <Badge variant="secondary" className="text-xs">
                            {item.language}
                          </Badge>
                        )}
                        {item.enhanced && (
                          <Badge className="text-xs bg-green-100 text-green-700">
                            Enhanced
                          </Badge>
                        )}
                        {item.pendingEnhancement && (
                          <Badge className="text-xs bg-orange-100 text-orange-700">
                            ⏳ Pending
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {item.transcript}
                      </p>
                      
                      {expandedId === item.id && item.enhanced && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200"
                        >
                          <p className="text-xs font-medium text-green-700 mb-1">Enhanced:</p>
                          <p className="text-sm text-green-800">{item.enhanced}</p>
                        </motion.div>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      className="shrink-0"
                    >
                      {expandedId === item.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPlay(item.enhanced || item.transcript)}
                      className="h-7 text-xs"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Play
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCopy(item.enhanced || item.transcript)}
                      className="h-7 text-xs"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                    {!item.enhanced && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onReEnhance(item)}
                        className="h-7 text-xs"
                      >
                        <Wand2 className="w-3 h-3 mr-1" />
                        Enhance
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(item.id)}
                      className="h-7 text-xs text-red-500 hover:text-red-700 ml-auto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}