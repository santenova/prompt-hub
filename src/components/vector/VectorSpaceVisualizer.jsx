import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layers, Sparkles, Eye, TrendingUp, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { findSimilarDocuments } from './VectorUtils.jsx';

export default function VectorSpaceVisualizer({ 
  items, 
  currentItem, 
  onItemSelect,
  maxSimilar = 10 
}) {
  const [selectedItem, setSelectedItem] = useState(currentItem);
  const [similarItems, setSimilarItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentItem) {
      setSelectedItem(currentItem);
      findSimilar(currentItem);
    }
  }, [currentItem]);

  const findSimilar = async (item) => {
    if (!item) return;
    
    setIsLoading(true);
    try {
      // In a real implementation, this would use the vector from VectorDocument
      // For now, we'll do a simple text-based similarity
      const itemText = `${item.title || item.name} ${item.description || ''} ${item.content || ''}`.toLowerCase();
      
      const scored = items
        .filter(i => i.id !== item.id)
        .map(i => {
          const iText = `${i.title || i.name} ${i.description || ''} ${i.content || ''}`.toLowerCase();
          
          // Simple word overlap scoring
          const itemWords = new Set(itemText.split(/\s+/));
          const iWords = iText.split(/\s+/);
          const overlap = iWords.filter(w => itemWords.has(w)).length;
          const score = overlap / Math.max(itemWords.size, iWords.length);
          
          // Boost score for matching categories or tags
          if (item.category === i.category) {
            return { item: i, score: score + 0.2 };
          }
          
          const sharedTags = (item.tags || []).filter(t => (i.tags || []).includes(t)).length;
          if (sharedTags > 0) {
            return { item: i, score: score + (sharedTags * 0.1) };
          }
          
          return { item: i, score };
        })
        .filter(s => s.score > 0.1)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxSimilar);
      
      setSimilarItems(scored);
    } catch (error) {
      console.error('Error finding similar items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
    findSimilar(item);
    if (onItemSelect) {
      onItemSelect(item);
    }
  };

  const getSimilarityColor = (score) => {
    if (score >= 0.7) return 'from-green-500 to-emerald-600';
    if (score >= 0.4) return 'from-yellow-500 to-orange-600';
    return 'from-gray-500 to-slate-600';
  };

  const getConnectionOpacity = (score) => {
    return Math.max(0.2, Math.min(1, score));
  };

  if (!selectedItem) {
    return (
      <Card className="border-purple-200">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Layers className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm text-gray-600">
              Select an item to explore similar content in the vector space
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-lg">Similar Items</CardTitle>
          </div>
          {selectedItem !== currentItem && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedItem(currentItem);
                findSimilar(currentItem);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        <CardDescription>
          Exploring vector space around: <strong>{selectedItem.title || selectedItem.name}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent" />
          </div>
        ) : similarItems.length === 0 ? (
          <div className="text-center py-8">
            <Eye className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm text-gray-600">
              No similar items found in the vector space
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">
                Found {similarItems.length} similar items
              </span>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>High</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span>Med</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                  <span>Low</span>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {similarItems.map(({ item, score }, idx) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => handleItemClick(item)}
                  className="w-full text-left"
                >
                  <div className="relative p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all group">
                    {/* Connection line indicator */}
                    <div 
                      className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${getSimilarityColor(score)} rounded-l-lg`}
                      style={{ opacity: getConnectionOpacity(score) }}
                    />
                    
                    <div className="flex items-start justify-between gap-3 pl-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm text-gray-900 truncate group-hover:text-purple-700">
                            {item.title || item.name}
                          </h4>
                          {item.category && (
                            <Badge variant="secondary" className="text-xs flex-shrink-0">
                              {item.category}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {item.description}
                        </p>
                        
                        {/* Matching indicators */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.category === selectedItem.category && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              Same category
                            </Badge>
                          )}
                          {(item.tags || []).some(t => (selectedItem.tags || []).includes(t)) && (
                            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                              Shared tags
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <Badge 
                          className={`bg-gradient-to-r ${getSimilarityColor(score)} text-white`}
                        >
                          {Math.round(score * 100)}%
                        </Badge>
                        <TrendingUp className="w-3 h-3 text-gray-400 group-hover:text-purple-600" />
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}