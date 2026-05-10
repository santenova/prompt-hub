import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useElasticsearchDataSource } from "./ElasticsearchDataSource";
import { useToast } from "@/components/ui/use-toast";
import {
  Search,
  Loader2,
  Filter,
  SortAsc,
  SortDesc,
  X,
  FileText,
  Users,
  Box,
  Sparkles,
  TrendingUp
} from "lucide-react";

const ENTITY_ICONS = {
  Template: FileText,
  Persona: Users,
  default: Box
};

const SORT_OPTIONS = [
  { value: '_score', label: 'Relevance' },
  { value: 'created_date', label: 'Date Created' },
  { value: 'updated_date', label: 'Date Updated' },
  { value: 'title', label: 'Title' },
  { value: 'name', label: 'Name' },
];

export default function ElasticsearchAdvancedSearch() {
  const { config, isEnabled, searchEntity, getFacets, allEntities } = useElasticsearchDataSource();
  const { toast } = useToast();
  
  const [selectedEntity, setSelectedEntity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  
  // Filtering
  const [facets, setFacets] = useState({});
  const [selectedFilters, setSelectedFilters] = useState({});
  const [isLoadingFacets, setIsLoadingFacets] = useState(false);
  
  // Sorting
  const [sortBy, setSortBy] = useState('_score');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const enabledEntities = allEntities.filter(e => 
    config.enabledEntities?.includes(e.name)
  );

  useEffect(() => {
    if (enabledEntities.length > 0 && !selectedEntity) {
      setSelectedEntity(enabledEntities[0].name);
    }
  }, [config.enabledEntities]);

  useEffect(() => {
    if (selectedEntity) {
      loadFacets();
    }
  }, [selectedEntity]);

  const loadFacets = async () => {
    if (!selectedEntity) return;
    
    setIsLoadingFacets(true);
    try {
      // Load facets for common fields
      const facetFields = ['category', 'status', 'tags'];
      const facetResults = {};
      
      for (const field of facetFields) {
        const result = await getFacets(selectedEntity, field, searchQuery);
        if (result && result.length > 0) {
          facetResults[field] = result;
        }
      }
      
      setFacets(facetResults);
    } catch (error) {
      console.error('Error loading facets:', error);
    } finally {
      setIsLoadingFacets(false);
    }
  };

  const handleSearch = async () => {
    if (!selectedEntity) {
      toast({
        title: "Select Entity",
        description: "Please select an entity type to search",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    try {
      const result = await searchEntity(selectedEntity, searchQuery, {
        filters: selectedFilters,
        sort: sortBy,
        sortOrder,
        size: 100
      });

      if (result) {
        setResults(result.results);
        setTotalResults(result.total);
        toast({
          title: "Search Complete",
          description: `Found ${result.total} results`
        });
      } else {
        toast({
          title: "Search Failed",
          description: "Could not perform search",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Error",
        description: error.message || "Search failed",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const toggleFilter = (field, value) => {
    setSelectedFilters(prev => {
      const current = prev[field] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      
      return updated.length > 0 
        ? { ...prev, [field]: updated }
        : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== field));
    });
  };

  const clearFilters = () => {
    setSelectedFilters({});
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
    setTotalResults(0);
    setSelectedFilters({});
  };

  if (!isEnabled) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Elasticsearch is not enabled</p>
          <p className="text-sm text-gray-500 mt-2">Enable Elasticsearch in the configuration to use advanced search</p>
        </CardContent>
      </Card>
    );
  }

  if (enabledEntities.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Filter className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">No entities enabled</p>
          <p className="text-sm text-gray-500 mt-2">Enable at least one entity in the Elasticsearch configuration</p>
        </CardContent>
      </Card>
    );
  }

  const EntityIcon = ENTITY_ICONS[selectedEntity] || ENTITY_ICONS.default;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Advanced Search
          </CardTitle>
          <CardDescription>
            Full-text search with faceted filtering across Elasticsearch entities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Entity Selection */}
          <div className="space-y-2">
            <Label>Entity Type</Label>
            <Select value={selectedEntity} onValueChange={setSelectedEntity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {enabledEntities.map(entity => {
                  const Icon = ENTITY_ICONS[entity.name] || ENTITY_ICONS.default;
                  return (
                    <SelectItem key={entity.name} value={entity.name}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {entity.name}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Search Bar */}
          <div className="space-y-2">
            <Label>Search Query</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter search terms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              {searchQuery && (
                <Button variant="ghost" size="icon" onClick={() => setSearchQuery('')}>
                  <X className="w-4 h-4" />
                </Button>
              )}
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label>Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Order</Label>
              <Button
                variant="outline"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="w-full"
              >
                {sortOrder === 'asc' ? (
                  <><SortAsc className="w-4 h-4 mr-2" /> Ascending</>
                ) : (
                  <><SortDesc className="w-4 h-4 mr-2" /> Descending</>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Faceted Filters */}
      {Object.keys(facets).length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Filter className="w-4 h-4 text-blue-600" />
                Filters
              </CardTitle>
              {Object.keys(selectedFilters).length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-3 h-3 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(facets).map(([field, buckets]) => (
                <div key={field} className="space-y-2">
                  <Label className="capitalize">{field}</Label>
                  <ScrollArea className="h-32 border rounded-md p-2">
                    <div className="space-y-2">
                      {buckets.map(bucket => (
                        <div key={bucket.key} className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedFilters[field]?.includes(bucket.key)}
                            onCheckedChange={() => toggleFilter(field, bucket.key)}
                          />
                          <Label className="flex-1 cursor-pointer text-sm">
                            {bucket.key}
                          </Label>
                          <Badge variant="secondary" className="text-xs">
                            {bucket.count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-4 h-4 text-green-600" />
                Results ({totalResults})
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={clearSearch}>
                Clear Results
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {results.map((result) => (
                  <Card key={result.id} className="border-2 hover:border-purple-300 transition-colors">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <EntityIcon className="w-5 h-5 text-purple-600 mt-1" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold truncate">
                              {result.title || result.name || 'Untitled'}
                            </h3>
                            {result.score && (
                              <Badge variant="outline" className="text-xs">
                                Score: {result.score.toFixed(2)}
                              </Badge>
                            )}
                          </div>
                          {result.description && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                              {result.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1">
                            {result.category && (
                              <Badge variant="secondary" className="text-xs">
                                {result.category}
                              </Badge>
                            )}
                            {result.status && (
                              <Badge variant="outline" className="text-xs">
                                {result.status}
                              </Badge>
                            )}
                            {result.tags && result.tags.slice(0, 3).map((tag, idx) => (
                              <Badge key={idx} className="text-xs bg-purple-100 text-purple-700">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}