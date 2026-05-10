import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Sparkles, Calendar, Tag } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function ContentScanner({ open, onClose, contentHistory, onAssign, currentProjectId = null }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContent, setSelectedContent] = useState([]);
  const { toast } = useToast();

  // Filter unassigned content or content not in current project
  const unassignedContent = contentHistory.filter(content => {
    const isUnassigned = !content.project_id || content.project_id === currentProjectId;
    if (!searchQuery.trim()) return isUnassigned;
    
    const query = searchQuery.toLowerCase();
    return isUnassigned && (
      content.topic?.toLowerCase().includes(query) ||
      content.content_type?.toLowerCase().includes(query) ||
      content.persona_name?.toLowerCase().includes(query) ||
      content.custom_instructions?.toLowerCase().includes(query)
    );
  });

  const toggleContent = (contentId) => {
    setSelectedContent(prev =>
      prev.includes(contentId)
        ? prev.filter(id => id !== contentId)
        : [...prev, contentId]
    );
  };

  const toggleAll = () => {
    if (selectedContent.length === unassignedContent.length) {
      setSelectedContent([]);
    } else {
      setSelectedContent(unassignedContent.map(c => c.id));
    }
  };

  const handleAssign = () => {
    if (selectedContent.length === 0) {
      toast({
        title: "No Content Selected",
        description: "Please select at least one content item",
        variant: "destructive"
      });
      return;
    }

    onAssign(selectedContent);
    setSelectedContent([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Scan & Assign Content
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Found {unassignedContent.length} unassigned content items
          </p>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by topic, type, persona..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Select All */}
          {unassignedContent.length > 0 && (
            <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg border border-purple-200">
              <Checkbox
                checked={selectedContent.length === unassignedContent.length}
                onCheckedChange={toggleAll}
              />
              <span className="text-sm font-medium">
                Select All ({selectedContent.length}/{unassignedContent.length})
              </span>
            </div>
          )}

          {/* Content List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {unassignedContent.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">
                    {searchQuery ? 'No matching content found' : 'No unassigned content available'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              unassignedContent.map((content) => (
                <Card
                  key={content.id}
                  className={`cursor-pointer transition-all ${
                    selectedContent.includes(content.id)
                      ? 'border-2 border-purple-400 bg-purple-50'
                      : 'border hover:border-purple-300'
                  }`}
                  onClick={() => toggleContent(content.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedContent.includes(content.id)}
                        onCheckedChange={() => toggleContent(content.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1">
                        <CardTitle className="text-sm text-gray-900 mb-2">
                          {content.topic || 'Untitled Content'}
                        </CardTitle>
                        <div className="flex flex-wrap gap-1.5">
                          {content.content_type && (
                            <Badge variant="outline" className="text-xs">
                              <Tag className="w-3 h-3 mr-1" />
                              {content.content_type}
                            </Badge>
                          )}
                          {content.tone && (
                            <Badge variant="outline" className="text-xs">
                              {content.tone}
                            </Badge>
                          )}
                          {content.persona_name && (
                            <Badge className="bg-purple-100 text-purple-700 text-xs">
                              {content.persona_name}
                            </Badge>
                          )}
                          {content.use_ollama && (
                            <Badge className="bg-orange-100 text-orange-700 text-xs">
                              Ollama
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {new Date(content.created_date).toLocaleDateString()}
                      </div>
                    </div>
                  </CardHeader>
                  {content.custom_instructions && (
                    <CardContent className="pt-0">
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {content.custom_instructions}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={selectedContent.length === 0}
            className="bg-gradient-to-r from-purple-600 to-indigo-600"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Assign {selectedContent.length > 0 && `(${selectedContent.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}