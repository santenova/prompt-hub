import React from 'react';
import { MessageSquare, Plus, Trash2, Archive, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

export default function ConversationList({ 
  conversations, 
  activeId, 
  onSelect, 
  onNew, 
  onDelete,
  onArchive 
}) {
  const activeConversations = conversations.filter(c => !c.is_archived);
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <Button
          onClick={onNew}
          className="w-full h-11 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 rounded-xl transition-all group"
        >
          <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
          New Chat
        </Button>
      </div>
      
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 pb-4">
          <AnimatePresence mode="popLayout">
            {activeConversations.map((conversation) => (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                layout
              >
                <div
                  onClick={() => onSelect(conversation.id)}
                  className={`group relative flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all ${
                    activeId === conversation.id
                      ? 'bg-zinc-800/80 border border-zinc-700'
                      : 'hover:bg-zinc-800/50 border border-transparent'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    activeId === conversation.id
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                      : 'bg-zinc-800'
                  }`}>
                    <MessageSquare className={`w-4 h-4 ${
                      activeId === conversation.id ? 'text-white' : 'text-zinc-500'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      activeId === conversation.id ? 'text-white' : 'text-zinc-300'
                    }`}>
                      {conversation.title || 'New Chat'}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">
                      {conversation.model || 'No model'} • {format(new Date(conversation.created_date), 'MMM d')}
                    </p>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => e.stopPropagation()}
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-300"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 rounded-xl">
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          onArchive(conversation.id);
                        }}
                        className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
                      >
                        <Archive className="w-4 h-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(conversation.id);
                        }}
                        className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {activeConversations.length === 0 && (
            <div className="text-center py-12 px-4">
              <MessageSquare className="w-10 h-10 mx-auto text-zinc-700 mb-3" />
              <p className="text-sm text-zinc-500">No conversations yet</p>
              <p className="text-xs text-zinc-600 mt-1">Start a new chat to begin</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}