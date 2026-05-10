import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Sparkles, X, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { generateSimpleEmbedding, findSimilarDocuments } from './VectorUtils.jsx';
import { apiClient } from '@/apis/client';

export default function VectorSearchBar({ items, onResultSelect, placeholder = "Semantic search...", category = "general" }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const queryVector = generateSimpleEmbedding(query);
      
      const documents = await apiClient.entities.VectorDocument.filter({ 
        'metadata.category': category 
      });
      
      if (documents && documents.length > 0) {
        const similar = findSimilarDocuments(queryVector, documents, 5);
        
        const matchedResults = similar
          .filter(doc => doc.similarity_score > 0.1)
          .map(doc => {
            const item = items.find(t => t.id === doc.metadata?.item_id);
            return item ? { ...item, similarity: doc.similarity_score } : null;
          })
          .filter(Boolean);
        
        setResults(matchedResults);
        setShowResults(true);
      } else {
        const filtered = items.filter(item => {
          const searchText = `${item.title || item.name} ${item.description || ''} ${item.content || ''}`.toLowerCase();
          return searchText.includes(query.toLowerCase());
        });
        setResults(filtered.slice(0, 5).map(item => ({ ...item, similarity: 0.5 })));
        setShowResults(true);
      }
    } catch (error) {
      console.error('Vector search error:', error);
      const filtered = items.filter(item => {
        const searchText = `${item.title || item.name} ${item.description || ''} ${item.content || ''}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
      });
      setResults(filtered.slice(0, 5).map(item => ({ ...item, similarity: 0.5 })));
      setShowResults(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (item) => {
    onResultSelect(item);
    setShowResults(false);
    setQuery('');
    setResults([]);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Sparkles className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
          <Input
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10 pr-10 border-purple-200 focus:border-purple-400 bg-white/80 backdrop-blur-sm"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button
          onClick={handleSearch}
          disabled={!query.trim() || isSearching}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          {isSearching ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
        </Button>
      </div>

      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full z-50"
          >
            <Card className="shadow-xl border-purple-200">
              <CardContent className="p-3">
                {results.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No similar items found. Try different keywords.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-purple-600">
                        Found {results.length} similar items
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        className="h-6 px-2 text-xs"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Clear
                      </Button>
                    </div>
                    {results.map((item, idx) => (
                      <motion.button
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => handleResultClick(item)}
                        className="w-full text-left p-3 rounded-lg hover:bg-purple-50 transition-colors border border-transparent hover:border-purple-200"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-gray-900 truncate">
                              {item.title || item.name}
                            </h4>
                            <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                              {item.description}
                            </p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`flex-shrink-0 ${
                              item.similarity > 0.7 
                                ? 'border-green-300 text-green-700' 
                                : item.similarity > 0.4 
                                ? 'border-yellow-300 text-yellow-700' 
                                : 'border-gray-300 text-gray-700'
                            }`}
                          >
                            {Math.round(item.similarity * 100)}%
                          </Badge>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
