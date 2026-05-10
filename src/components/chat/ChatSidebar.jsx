import React, { useState } from 'react';
import { Search, Plus, X, MessageSquare, Download, Upload, Trash2, Phone, LayoutGrid, Settings, HelpCircle, Pencil, Copy, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ChatSidebar({ 
  chats, 
  selectedChat, 
  onSelectChat, 
  onNewChat, 
  onDeleteChat,
  isOpen,
  onToggle
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group chats by time
  const groupedChats = {
    'Last Hour': filteredChats.filter(c => {
      const hourAgo = Date.now() - 60 * 60 * 1000;
      return new Date(c.created_date || Date.now()).getTime() > hourAgo;
    }),
    'Today': filteredChats.filter(c => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const chatDate = new Date(c.created_date || Date.now());
      const hourAgo = Date.now() - 60 * 60 * 1000;
      return chatDate >= today && chatDate.getTime() <= hourAgo;
    }),
    'Earlier': filteredChats.filter(c => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(c.created_date || Date.now()) < today;
    })
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : -320 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`
          fixed lg:relative z-50 lg:z-0
          w-80 h-full bg-[#1e1e2e] text-white flex flex-col
          lg:translate-x-0
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-white/10">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10">
            <Menu className="w-5 h-5" />
          </Button>
          <span className="font-medium text-sm">Chats</span>
          <Button variant="ghost" size="icon" onClick={onToggle} className="text-gray-400 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#2a2a3e] border-0 text-white placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-blue-500"
            />
          </div>
        </div>

        {/* New Chat Button */}
        <div className="px-3 pb-3">
          <Button
            onClick={onNewChat}
            variant="ghost"
            className="w-full justify-start text-gray-400 hover:text-white hover:bg-white/5 border border-dashed border-gray-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            New chat
          </Button>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1 px-3">
          {Object.entries(groupedChats).map(([group, groupChats]) => (
            groupChats.length > 0 && (
              <div key={group} className="mb-4">
                <p className="text-xs text-gray-500 px-2 py-2 uppercase tracking-wider">{group}</p>
                <div className="space-y-1">
                  {groupChats.map((chat) => (
                    <motion.div
                      key={chat.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`
                        group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all
                        ${selectedChat?.id === chat.id 
                          ? 'bg-blue-600/20 border border-blue-500/30' 
                          : 'hover:bg-white/5'
                        }
                      `}
                      onClick={() => onSelectChat(chat)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{chat.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Pencil className="w-3 h-3 text-gray-500" />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 h-7 w-7 text-gray-400 hover:text-white hover:bg-white/10"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )
          ))}
        </ScrollArea>

        {/* Sidebar Navigation Icons */}
        <div className="border-t border-white/10">
          <div className="flex items-center justify-around py-3">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5 h-10 w-10">
                <MessageSquare className="w-5 h-5" />
              </Button>
            </Link>
            <Link to={createPageUrl('Calls')}>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5 h-10 w-10">
                <Phone className="w-5 h-5" />
              </Button>
            </Link>
            <Link to={createPageUrl('Apps')}>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5 h-10 w-10">
                <LayoutGrid className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-white/5">
              <Download className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-white/5">
              <Upload className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-400 hover:text-red-400 hover:bg-red-500/10 mt-2"
            onClick={() => selectedChat && onDeleteChat(selectedChat.id)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete chat
          </Button>
        </div>

        {/* Bottom Icons */}
        <div className="border-t border-white/10 p-3 flex items-center justify-around">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5 h-9 w-9">
            <HelpCircle className="w-5 h-5" />
          </Button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
            <span className="text-base">🌟</span>
          </div>
          <Link to={createPageUrl('Settings')}>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5 h-9 w-9">
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </motion.aside>
    </>
  );
}