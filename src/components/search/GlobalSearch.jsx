import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/apis/client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search, FileText, Users, Package, X, Clock, Star, Brain, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";

// Core entities for search - focus on most used
const ENTITY_CONFIG = {
  Template: {
    icon: FileText, bgColor: 'bg-purple-100', textColor: 'text-purple-700', label: 'Prompts',
    searchFields: ['title', 'content', 'description', 'category', 'tags'],
    getLink: (item) => `${createPageUrl('Templates')}?highlight=${item.id}&search=${encodeURIComponent(item.title || item.name || '')}`,
    getSubtitle: (item) => item.category || 'Uncategorized'
  },
  Persona: {
    icon: Users, bgColor: 'bg-indigo-100', textColor: 'text-indigo-700', label: 'Personas',
    searchFields: ['name', 'description', 'instructions', 'category', 'tags'],
    getLink: (item) => `${createPageUrl('PersonasLibrary')}?highlight=${item.id}&search=${encodeURIComponent(item.title || item.name || '')}`,
    getSubtitle: (item) => item.category || 'Custom'
  },
  AgentPackage: {
    icon: Package, bgColor: 'bg-orange-100', textColor: 'text-orange-700', label: 'Agent Packages',
    searchFields: ['name', 'description', 'category', 'tags'],
    getLink: (item) => `${createPageUrl('AgentMarketplace')}?highlight=${item.id}&search=${encodeURIComponent(item.title || item.name || '')}`,
    getSubtitle: (item) => item.category || 'General'
  },
  VoiceChat: {
    icon: MessageSquare, bgColor: 'bg-blue-100', textColor: 'text-blue-700', label: 'Voice Chats',
    searchFields: ['name', 'messages'],
    getLink: (item) => createPageUrl('VoiceToPrompt'),
    getSubtitle: (item) => `${item.messages?.length || 0} messages • ${new Date(item.updatedAt).toLocaleDateString()}`
  }
};

const itemMatchesQuery = (item, query, searchFields) => {
  const lowerQuery = query.toLowerCase();
  for (const field of searchFields) {
    if (field === 'messages' && Array.isArray(item.messages)) {
      if (item.messages.some(m => m.content?.toLowerCase().includes(lowerQuery))) return true;
      continue;
    }
    const value = field.includes('.') 
      ? field.split('.').reduce((obj, key) => obj?.[key], item)
      : item[field];
    if (!value) continue;
    if (Array.isArray(value)) {
      if (value.some(v => String(v).toLowerCase().includes(lowerQuery))) return true;
    } else if (String(value).toLowerCase().includes(lowerQuery)) return true;
  }
  return false;
};

const getItemTitle = (item, entityType) => {
  return item.title || item.name || 'Untitled';
};

export default function GlobalSearch({ trigger, open, onOpenChange }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("all");
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('global_search_recent') || '[]');
    } catch { return []; }
  });
  const navigate = useNavigate();

  const isControlled = open !== undefined;
  const dialogOpen = isControlled ? open : isOpen;
  const setDialogOpen = isControlled ? onOpenChange : setIsOpen;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setDialogOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setDialogOpen]);

  // Only fetch core entities - lazy load on dialog open
  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => apiClient.entities.Template.list(),
    enabled: dialogOpen,
    staleTime: 30000,
  });

  const { data: personas = [] } = useQuery({
    queryKey: ['personas'],
    queryFn: () => apiClient.entities.Persona.list(),
    enabled: dialogOpen,
    staleTime: 30000,
  });

  const { data: agentPackages = [] } = useQuery({
    queryKey: ['agentpackages'],
    queryFn: () => apiClient.entities.AgentPackage.list(),
    enabled: dialogOpen,
    staleTime: 30000,
  });

  // Load voice chat sessions
  const voiceChatSessions = useMemo(() => {
    if (!dialogOpen) return [];
    try {
      return JSON.parse(localStorage.getItem('voice_ollama_chat_sessions') || '[]');
    } catch { return []; }
  }, [dialogOpen, query]); // Re-run when query changes to get fresh data

  const allData = useMemo(() => ({
    Template: templates,
    Persona: personas,
    AgentPackage: agentPackages,
    VoiceChat: voiceChatSessions
  }), [templates, personas, agentPackages, voiceChatSessions]);

  const searchResults = useMemo(() => {
    if (!query.trim() || query.length < 2) return {};
    const results = {};
    for (const [entityType, items] of Object.entries(allData)) {
      const config = ENTITY_CONFIG[entityType];
      if (!config) continue;
      
      // Apply filter
      if (searchFilter !== 'all' && searchFilter !== entityType) continue;
      
      const matches = items.filter(item => itemMatchesQuery(item, query, config.searchFields));
      if (matches.length > 0) results[entityType] = matches.slice(0, 5);
    }
    return results;
  }, [query, allData, searchFilter]);

  const totalResults = Object.values(searchResults).reduce((sum, arr) => sum + arr.length, 0);

  const handleSelect = (item, entityType) => {
    if (entityType === 'VoiceChat') {
      // Load the voice chat session
      localStorage.setItem('voice_ollama_current_session', item.id);
      navigate(createPageUrl('VoiceToPrompt'));
      setDialogOpen(false);
      setQuery('');
      return;
    }
    
    const entry = { query, entityType, itemId: item.id, title: getItemTitle(item, entityType) };
    const newRecent = [entry, ...recentSearches.filter(r => r.itemId !== item.id)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('global_search_recent', JSON.stringify(newRecent));
    setDialogOpen(false);
    setQuery('');
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('global_search_recent');
  };

  return (
    <>
      {trigger || (
        <Button variant="outline" onClick={() => setDialogOpen(true)} className="relative w-full max-w-sm justify-start text-sm text-muted-foreground">
          <Search className="mr-2 h-4 w-4" />
          <span className="hidden lg:inline-flex">Search...</span>
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] sm:flex">⌘K</kbd>
        </Button>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
          <div className="border-b">
            <div className="flex items-center px-3 py-2">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Input 
                placeholder="Search prompts, personas, voice chats..." 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                className="flex-1 h-10 border-0 shadow-none focus-visible:ring-0" 
                autoFocus
              />
              {query && <Button variant="ghost" size="sm" onClick={() => setQuery('')} className="h-6 w-6 p-0"><X className="h-4 w-4" /></Button>}
            </div>
            <div className="flex gap-2 px-3 pb-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'Template', label: 'Prompts' },
                { value: 'Persona', label: 'Personas' },
                { value: 'VoiceChat', label: 'Voice Chats' }
              ].map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setSearchFilter(filter.value)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    searchFilter === filter.value 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {!query.trim() && recentSearches.length > 0 && (
              <div className="p-2">
                <div className="flex items-center justify-between px-2 py-1 text-xs font-medium text-muted-foreground">
                  <span>Recent</span>
                  <Button variant="ghost" size="sm" onClick={clearRecentSearches} className="h-5 text-xs">Clear</Button>
                </div>
                {recentSearches.map((recent, idx) => {
                  const config = ENTITY_CONFIG[recent.entityType];
                  return (
                    <div 
                      key={idx} 
                      className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-accent cursor-pointer"
                      onClick={() => setQuery(recent.query || recent.title)}
                    >
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm truncate flex-1">{recent.title}</span>
                      <span className="text-xs text-muted-foreground">{config?.label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {query.length >= 2 && totalResults === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">No results for "{query}"</div>
            )}

            {Object.entries(searchResults).map(([entityType, items], idx) => {
              const config = ENTITY_CONFIG[entityType];
              if (!config) return null;
              const Icon = config.icon;
              return (
                <div key={entityType} className="p-2">
                  {idx > 0 && <div className="h-px bg-border mb-2" />}
                  <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                    <Icon className={`h-3 w-3 ${config.textColor}`} />
                    {config.label}
                    <Badge variant="secondary" className="text-xs ml-1">{items.length}</Badge>
                  </div>
                  {items.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => {
                        handleSelect(item, entityType);
                        navigate(config.getLink(item));
                      }}
                      className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-accent cursor-pointer"
                    >
                      <div className={`p-1.5 rounded ${config.bgColor}`}><Icon className={`h-3 w-3 ${config.textColor}`} /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{getItemTitle(item, entityType)}</p>
                        <p className="text-xs text-muted-foreground truncate">{config.getSubtitle(item)}</p>
                      </div>
                      {item.is_favorite && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                    </div>
                  ))}
                </div>
              );
            })}

            {!query.trim() && recentSearches.length === 0 && (
              <div className="p-2">
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Quick Actions</div>
                <div onClick={() => { setDialogOpen(false); navigate(createPageUrl('Templates')); }} className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-accent cursor-pointer">
                  <FileText className="h-4 w-4" />Prompts
                </div>
                <div onClick={() => { setDialogOpen(false); navigate(createPageUrl('PersonasLibrary')); }} className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-accent cursor-pointer">
                  <Users className="h-4 w-4" />Personas
                </div>
                <div onClick={() => { setDialogOpen(false); navigate(createPageUrl('VoiceToPrompt')); }} className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-accent cursor-pointer">
                  <MessageSquare className="h-4 w-4" />Voice Chat
                </div>
              </div>
            )}
          </div>

          <div className="border-t px-3 py-1.5 text-xs text-muted-foreground flex items-center justify-between">
            <div className="flex items-center gap-2"><kbd className="rounded border px-1 py-0.5 text-[10px]">esc</kbd>Close</div>
            {totalResults > 0 && <span>{totalResults} found</span>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
