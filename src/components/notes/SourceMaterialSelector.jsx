import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, TestTube, Search, Filter, Mic, Bookmark } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/apis/client";
import { format } from "date-fns";

export default function SourceMaterialSelector({ onSelectionChange }) {
  const [selectedContent, setSelectedContent] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState([]);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [selectedBookmarks, setSelectedBookmarks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: contentHistory = [] } = useQuery({
    queryKey: ['contentHistory'],
    queryFn: () => apiClient.entities.ContentHistory.list('-created_date', 50),
    initialData: [],
  });

  const { data: testHistory = [] } = useQuery({
    queryKey: ['testHistory'],
    queryFn: () => apiClient.entities.TestHistory.list('-created_date', 50),
    initialData: [],
  });

  const { data: voiceChats = [] } = useQuery({
    queryKey: ['voiceChats'],
    queryFn: () => apiClient.entities.VoiceChat.list('-created_date', 50),
    initialData: [],
  });

  const { data: documentExports = [] } = useQuery({
    queryKey: ['documentExports'],
    queryFn: () => apiClient.entities.DocumentExport.list('-created_date', 50),
    initialData: [],
  });

  const { data: bookmarks = [] } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => apiClient.entities.Bookmark.list('-created_date', 50),
    initialData: [],
  });

  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange({
        content: selectedContent,
        tests: selectedTests,
        voiceChats: selectedVoice,
        documentExports: selectedDocs,
        bookmarks: selectedBookmarks
      });
    }
  }, [selectedContent, selectedTests, selectedVoice, selectedDocs, selectedBookmarks]);

  const handleContentToggle = (item) => {
    setSelectedContent(prev =>
      prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
    );
  };

  const handleTestToggle = (item) => {
    setSelectedTests(prev =>
      prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
    );
  };

  const handleVoiceToggle = (item) => {
    setSelectedVoice(prev =>
      prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
    );
  };

  const handleDocToggle = (item) => {
    setSelectedDocs(prev =>
      prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
    );
  };

  const handleBookmarkToggle = (item) => {
    setSelectedBookmarks(prev =>
      prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
    );
  };

  const filteredContent = contentHistory.filter(item => 
    !searchQuery || 
    item.topic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.persona_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTests = testHistory.filter(item =>
    !searchQuery ||
    item.prompt_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.input?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVoice = voiceChats.filter(item =>
    !searchQuery ||
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.summary?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDocs = documentExports.filter(item =>
    !searchQuery ||
    item.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBookmarks = bookmarks.filter(item =>
    !searchQuery ||
    item.item_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-purple-600" />
          Select Source Material
        </CardTitle>
        <div className="mt-2">
          <Input
            placeholder="Search sources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline">{selectedContent.length} content</Badge>
          <Badge variant="outline">{selectedTests.length} tests</Badge>
          <Badge variant="outline">{selectedVoice.length} voice</Badge>
          <Badge variant="outline">{selectedDocs.length} docs</Badge>
          <Badge variant="outline">{selectedBookmarks.length} bookmarks</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="content" className="text-xs">
              <FileText className="w-3 h-3 mr-1" />
              Content
            </TabsTrigger>
            <TabsTrigger value="tests" className="text-xs">
              <TestTube className="w-3 h-3 mr-1" />
              Tests
            </TabsTrigger>
            <TabsTrigger value="voice" className="text-xs">
              <Mic className="w-3 h-3 mr-1" />
              Voice
            </TabsTrigger>
            <TabsTrigger value="docs" className="text-xs">
              <FileText className="w-3 h-3 mr-1" />
              Docs
            </TabsTrigger>
            <TabsTrigger value="bookmarks" className="text-xs">
              <Bookmark className="w-3 h-3 mr-1" />
              Saved
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content">
            <div className="flex justify-end gap-2 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedContent(filteredContent.map(i => i.id))}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedContent([])}
              >
                Unselect All
              </Button>
            </div>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredContent.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedContent.includes(item.id)
                        ? 'border-purple-500 bg-purple-50'
                        : 'hover:border-purple-300'
                    }`}
                    onClick={() => handleContentToggle(item)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedContent.includes(item.id)}
                        onCheckedChange={() => handleContentToggle(item)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{item.topic}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                          <span>{format(new Date(item.created_date), 'MMM d')}</span>
                          {item.content_type && (
                            <Badge variant="outline" className="text-xs">{item.content_type}</Badge>
                          )}
                          {item.persona_name && (
                            <span className="text-gray-500">{item.persona_name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="tests">
            <div className="flex justify-end gap-2 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTests(filteredTests.map(i => i.id))}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTests([])}
              >
                Unselect All
              </Button>
            </div>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredTests.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedTests.includes(item.id)
                        ? 'border-green-500 bg-green-50'
                        : 'hover:border-green-300'
                    }`}
                    onClick={() => handleTestToggle(item)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedTests.includes(item.id)}
                        onCheckedChange={() => handleTestToggle(item)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{item.prompt_title}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                          <span>{format(new Date(item.created_date), 'MMM d')}</span>
                          <Badge 
                            className={`text-xs ${
                              item.status === 'passed' ? 'bg-green-100 text-green-700' :
                              item.status === 'failed' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="voice">
            <div className="flex justify-end gap-2 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedVoice(filteredVoice.map(i => i.id))}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedVoice([])}
              >
                Unselect All
              </Button>
            </div>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredVoice.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedVoice.includes(item.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:border-blue-300'
                    }`}
                    onClick={() => handleVoiceToggle(item)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedVoice.includes(item.id)}
                        onCheckedChange={() => handleVoiceToggle(item)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{item.name || 'Voice Chat'}</p>
                        {item.summary && (
                          <p className="text-xs text-gray-600 line-clamp-2 mt-1">{item.summary}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                          <span>{format(new Date(item.created_date), 'MMM d')}</span>
                          {item.persona_name && (
                            <Badge variant="outline" className="text-xs">{item.persona_name}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="docs">
            <div className="flex justify-end gap-2 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDocs(filteredDocs.map(i => i.id))}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDocs([])}
              >
                Unselect All
              </Button>
            </div>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredDocs.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedDocs.includes(item.id)
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'hover:border-indigo-300'
                    }`}
                    onClick={() => handleDocToggle(item)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedDocs.includes(item.id)}
                        onCheckedChange={() => handleDocToggle(item)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{item.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                          <span>{format(new Date(item.created_date), 'MMM d')}</span>
                          <Badge variant="outline" className="text-xs">{item.format?.toUpperCase()}</Badge>
                          {item.ai_enhanced && (
                            <Badge className="text-xs bg-purple-100 text-purple-700">AI</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="bookmarks">
            <div className="flex justify-end gap-2 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedBookmarks(filteredBookmarks.map(i => i.id))}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedBookmarks([])}
              >
                Unselect All
              </Button>
            </div>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredBookmarks.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedBookmarks.includes(item.id)
                        ? 'border-amber-500 bg-amber-50'
                        : 'hover:border-amber-300'
                    }`}
                    onClick={() => handleBookmarkToggle(item)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedBookmarks.includes(item.id)}
                        onCheckedChange={() => handleBookmarkToggle(item)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{item.item_title}</p>
                        {item.notes && (
                          <p className="text-xs text-gray-600 line-clamp-2 mt-1">{item.notes}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                          <span>{format(new Date(item.created_date), 'MMM d')}</span>
                          <Badge variant="outline" className="text-xs">{item.item_type}</Badge>
                          {item.collection && (
                            <Badge variant="outline" className="text-xs">{item.collection}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
