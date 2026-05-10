import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Sparkles, X, SlidersHorizontal, TrendingUp, Calendar, Tag, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { generateSimpleEmbedding, findSimilarDocuments } from './VectorUtils.jsx';
import { apiClient } from '@/apis/client';

export default function EnhancedVectorSearch({ 
  items, 
  onResultSelect, 
  placeholder = "AI-powered semantic search...", 
  category = "general",
  availableCategories = [],
  availableTags = []
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    categories: [],
    tags: [],
    dateFrom: null,
    dateTo: null,
    minSimilarity: 0.1
  });
  
  // Sorting
  const [sortBy, setSortBy] = useState('relevance'); // relevance, date, alphabetical
  const [sortOrder, setSortOrder] = useState('desc');
  
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const queryVector = generateSimpleEmbedding(query);
      
      const documents = await apiClient.entities.VectorDocument.filter({ 
        'metadata.category': category 
      });
      
      if (documents && documents.length > 0) {
        const similar = findSimilarDocuments(queryVector, documents, 20);
        
        let matchedResults = similar
          .filter(doc => doc.similarity_score > filters.minSimilarity)
          .map(doc => {
            const item = items.find(t => t.id === doc.metadata?.item_id);
            return item ? { ...item, similarity: doc.similarity_score, vectorDoc: doc } : null;
          })
          .filter(Boolean);
        
        // Apply filters
        matchedResults = applyFilters(matchedResults);
        
        // Apply sorting
        matchedResults = applySorting(matchedResults);
        
        setResults(matchedResults);
        setShowResults(true);
      } else {
        const filtered = items.filter(item => {
          const searchText = `${item.title || item.name} ${item.description || ''} ${item.content || ''}`.toLowerCase();
          return searchText.includes(query.toLowerCase());
        });
        setResults(filtered.slice(0, 10).map(item => ({ ...item, similarity: 0.5 })));
        setShowResults(true);
      }
    } catch (error) {
      console.error('Vector search error:', error);
      const filtered = items.filter(item => {
        const searchText = `${item.title || item.name} ${item.description || ''} ${item.content || ''}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
      });
      setResults(filtered.slice(0, 10).map(item => ({ ...item, similarity: 0.5 })));
      setShowResults(true);
    } finally {
      setIsSearching(false);
    }
  };

  const applyFilters = (results) => {
    return results.filter(item => {
      // Category filter
      if (filters.categories.length > 0) {
        const itemCategory = item.category || item.vectorDoc?.metadata?.subcategory;
        if (!filters.categories.includes(itemCategory)) return false;
      }
      
      // Tags filter
      if (filters.tags.length > 0) {
        const itemTags = item.tags || [];
        const hasTag = filters.tags.some(tag => itemTags.includes(tag));
        if (!hasTag) return false;
      }
      
      // Date filter
      if (filters.dateFrom) {
        const itemDate = new Date(item.created_date);
        if (itemDate < filters.dateFrom) return false;
      }
      
      if (filters.dateTo) {
        const itemDate = new Date(item.created_date);
        if (itemDate > filters.dateTo) return false;
      }
      
      return true;
    });
  };

  const applySorting = (results) => {
    const sorted = [...results];
    
    switch (sortBy) {
      case 'relevance':
        sorted.sort((a, b) => b.similarity - a.similarity);
        break;
      case 'date':
        sorted.sort((a, b) => {
          const dateA = new Date(a.created_date);
          const dateB = new Date(b.created_date);
          return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });
        break;
      case 'alphabetical':
        sorted.sort((a, b) => {
          const nameA = (a.title || a.name || '').toLowerCase();
          const nameB = (b.title || b.name || '').toLowerCase();
          return sortOrder === 'desc' ? nameB.localeCompare(nameA) : nameA.localeCompare(nameB);
        });
        break;
      case 'popularity':
        sorted.sort((a, b) => (b.use_count || 0) - (a.use_count || 0));
        break;
      default:
        break;
    }
    
    return sorted;
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

  const clearFilters = () => {
    setFilters({
      categories: [],
      tags: [],
      dateFrom: null,
      dateTo: null,
      minSimilarity: 0.1
    });
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.categories.length > 0) count++;
    if (filters.tags.length > 0) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.minSimilarity > 0.1) count++;
    return count;
  }, [filters]);

  const getSimilarityColor = (score) => {
    if (score >= 0.7) return 'text-green-700 bg-green-50 border-green-300';
    if (score >= 0.4) return 'text-yellow-700 bg-yellow-50 border-yellow-300';
    return 'text-gray-700 bg-gray-50 border-gray-300';
  };

  return (
    <div className="relative space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Sparkles className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
          <Input
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-11 pr-10 h-11 border-purple-200 focus:border-purple-400 bg-white/80 backdrop-blur-sm"
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
        
        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative h-11">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 bg-purple-600 text-white h-5 w-5 flex items-center justify-center p-0 rounded-full">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Search Filters</h4>
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear All
                  </Button>
                )}
              </div>
              
              <Separator />
              
              {availableCategories.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Categories</Label>
                  <Select
                    value={filters.categories[0] || "all"}
                    onValueChange={(value) => 
                      setFilters(prev => ({
                        ...prev,
                        categories: value === "all" ? [] : [value]
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {availableCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {availableTags.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tags</Label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {availableTags.slice(0, 20).map(tag => (
                      <Badge
                        key={tag}
                        variant={filters.tags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          setFilters(prev => ({
                            ...prev,
                            tags: prev.tags.includes(tag)
                              ? prev.tags.filter(t => t !== tag)
                              : [...prev.tags, tag]
                          }));
                        }}
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Minimum Similarity</Label>
                <Select
                  value={filters.minSimilarity.toString()}
                  onValueChange={(value) => 
                    setFilters(prev => ({ ...prev, minSimilarity: parseFloat(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.1">10% - Show all results</SelectItem>
                    <SelectItem value="0.3">30% - Moderate match</SelectItem>
                    <SelectItem value="0.5">50% - Good match</SelectItem>
                    <SelectItem value="0.7">70% - High match</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        <Button
          onClick={handleSearch}
          disabled={!query.trim() || isSearching}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 h-11 px-6"
        >
          {isSearching ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </div>
      
      {/* Sorting Options */}
      {showResults && results.length > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <Label className="text-gray-600">Sort by:</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3 h-3" />
                  Relevance
                </div>
              </SelectItem>
              <SelectItem value="date">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  Date
                </div>
              </SelectItem>
              <SelectItem value="alphabetical">
                <div className="flex items-center gap-2">
                  <Tag className="w-3 h-3" />
                  A-Z
                </div>
              </SelectItem>
              <SelectItem value="popularity">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3" />
                  Popular
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="shadow-xl border-purple-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {results.length === 0 ? 'No Results Found' : `Found ${results.length} Results`}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="h-7 px-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0 max-h-96 overflow-y-auto">
                {results.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Try adjusting your search or filters
                  </p>
                ) : (
                  <div className="space-y-2">
                    {results.map((item, idx) => (
                      <motion.button
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() => handleResultClick(item)}
                        className="w-full text-left p-3 rounded-lg hover:bg-purple-50 transition-colors border border-transparent hover:border-purple-200"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm text-gray-900 truncate">
                                {item.title || item.name}
                              </h4>
                              {item.category && (
                                <Badge variant="secondary" className="text-xs">
                                  {item.category}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {item.description}
                            </p>
                            {item.tags && item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {item.tags.slice(0, 3).map(tag => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    #{tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`flex-shrink-0 ${getSimilarityColor(item.similarity)}`}
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
