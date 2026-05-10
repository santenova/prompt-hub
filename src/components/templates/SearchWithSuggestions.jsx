import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Clock, TrendingUp, Hash, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SearchWithSuggestions({
  value,
  onChange,
  templates,
  placeholder = "Search templates..."
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        setRecentSearches([]);
      }
    }
  }, []);

  // Generate suggestions based on input
  useEffect(() => {
    if (!value || value.length < 2) {
      setSuggestions([]);
      return;
    }

    const query = value.toLowerCase();
    const newSuggestions = [];

    // Title matches
    templates.forEach(template => {
      if (template.title.toLowerCase().includes(query)) {
        newSuggestions.push({
          type: 'title',
          text: template.title,
          icon: TrendingUp,
          template
        });
      }
    });

    // Tag matches
    const tagMatches = new Set();
    templates.forEach(template => {
      if (template.tags) {
        template.tags.forEach(tag => {
          if (tag.toLowerCase().includes(query) && !tagMatches.has(tag)) {
            tagMatches.add(tag);
            newSuggestions.push({
              type: 'tag',
              text: tag,
              icon: Hash
            });
          }
        });
      }
    });

    // Creator matches
    const creatorMatches = new Set();
    templates.forEach(template => {
      if (template.created_by && template.created_by.toLowerCase().includes(query) && !creatorMatches.has(template.created_by)) {
        creatorMatches.add(template.created_by);
        newSuggestions.push({
          type: 'creator',
          text: template.created_by,
          icon: User
        });
      }
    });

    setSuggestions(newSuggestions.slice(0, 8));
  }, [value, templates]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = (suggestion) => {
    let searchText = '';
    
    switch (suggestion.type) {
      case 'title':
        searchText = suggestion.text;
        break;
      case 'tag':
        searchText = `#${suggestion.text}`;
        break;
      case 'creator':
        searchText = `@${suggestion.text}`;
        break;
      case 'recent':
        searchText = suggestion.text;
        break;
      default:
        searchText = suggestion.text;
    }

    onChange(searchText);
    addToRecentSearches(searchText);
    setShowSuggestions(false);
  };

  const addToRecentSearches = (search) => {
    if (!search.trim()) return;
    
    const updated = [search, ...recentSearches.filter(s => s !== search)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && value) {
      addToRecentSearches(value);
      setShowSuggestions(false);
    }
  };

  const getSuggestionColor = (type) => {
    switch (type) {
      case 'title':
        return 'text-purple-600 bg-purple-50';
      case 'tag':
        return 'text-blue-600 bg-blue-50';
      case 'creator':
        return 'text-green-600 bg-green-50';
      case 'recent':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          className="pl-10 h-12 text-base border-2 border-gray-200 bg-white shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
        />
      </div>

      <AnimatePresence>
        {showSuggestions && (value || recentSearches.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2"
          >
            <Card className="p-2 shadow-lg border-2 border-gray-200">
              {/* Recent Searches */}
              {!value && recentSearches.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Recent Searches
                  </div>
                  {recentSearches.map((search, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectSuggestion({ type: 'recent', text: search })}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded transition-colors text-left"
                    >
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{search}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div>
                  {!value && recentSearches.length > 0 && (
                    <div className="h-px bg-gray-200 my-2" />
                  )}
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Suggestions
                  </div>
                  {suggestions.map((suggestion, idx) => {
                    const Icon = suggestion.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded transition-colors text-left group"
                      >
                        <div className={`p-1.5 rounded ${getSuggestionColor(suggestion.type)}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                            {suggestion.type === 'tag' && '#'}
                            {suggestion.type === 'creator' && '@'}
                            {suggestion.text}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {suggestion.type}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {value && suggestions.length === 0 && (
                <div className="px-3 py-6 text-center text-sm text-gray-500">
                  No suggestions found
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}