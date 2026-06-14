import React, { useState, useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CalendarIcon, X, Filter } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function AdvancedSearchFilters({
  filters,
  onFiltersChange,
  availableCreators,
  availableTags,
  availableCategories
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCreatorChange = (creator) => {
    onFiltersChange({ ...filters, creator });
  };

  const handleTagToggle = (tag) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    onFiltersChange({ ...filters, tags: newTags });
  };

  const handleDateFromChange = (date) => {
    onFiltersChange({ ...filters, dateFrom: date });
  };

  const handleDateToChange = (date) => {
    onFiltersChange({ ...filters, dateTo: date });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      creator: 'All',
      tags: [],
      dateFrom: null,
      dateTo: null
    });
  };

  const activeFilterCount = useMemo(() => {
    return [
      filters.creator && filters.creator !== 'All' ? 1 : 0,
      filters.tags?.length || 0,
      filters.dateFrom ? 1 : 0,
      filters.dateTo ? 1 : 0
    ].reduce((sum, val) => sum + val, 0);
  }, [filters]);

  return (
    <div className="space-y-3">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="relative">
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filters
            {activeFilterCount > 0 && (
              <Badge className="ml-2 bg-purple-600 text-white px-1.5 py-0.5 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Advanced Filters</h4>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-auto py-1 px-2 text-xs"
                >
                  Clear All
                </Button>
              )}
            </div>

            {/* Creator Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Creator</Label>
              <Select
                value={filters.creator || 'All'}
                onValueChange={handleCreatorChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by creator" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  <SelectItem value="All">All Creators</SelectItem>
                  {availableCreators.map((creator) => (
                    <SelectItem key={creator} value={creator}>
                      {creator}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Tags {filters.tags?.length > 0 && `(${filters.tags.length} selected)`}
              </Label>
              <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                {availableTags.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">No tags available</p>
                ) : (
                  availableTags.slice(0, 20).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                        filters.tags?.includes(tag)
                          ? 'bg-purple-100 text-purple-800 font-medium'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Creation Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">From</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateFrom ? format(filters.dateFrom, 'MMM d, yyyy') : 'Select'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateFrom}
                        onSelect={handleDateFromChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">To</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateTo ? format(filters.dateTo, 'MMM d, yyyy') : 'Select'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateTo}
                        onSelect={handleDateToChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filters Display */}
      <AnimatePresence>
        {activeFilterCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            {filters.creator && filters.creator !== 'All' && (
              <Badge variant="secondary" className="flex items-center gap-1 pr-1">
                Creator: {filters.creator}
                <button
                  onClick={() => handleCreatorChange('All')}
                  className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {filters.tags?.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1 pr-1">
                #{tag}
                <button
                  onClick={() => handleTagToggle(tag)}
                  className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            {filters.dateFrom && (
              <Badge variant="secondary" className="flex items-center gap-1 pr-1">
                From: {format(filters.dateFrom, 'MMM d, yyyy')}
                <button
                  onClick={() => handleDateFromChange(null)}
                  className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {filters.dateTo && (
              <Badge variant="secondary" className="flex items-center gap-1 pr-1">
                To: {format(filters.dateTo, 'MMM d, yyyy')}
                <button
                  onClick={() => handleDateToChange(null)}
                  className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}