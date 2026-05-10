import React from 'react';
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Layers } from "lucide-react";

export default function SubcategoryFilter({ subcategories, selectedSubcategory, onSelectSubcategory }) {
  if (subcategories.length === 0) return null;

  const totalCount = subcategories.reduce((sum, sub) => sum + sub.count, 0);
  
  // Ensure selected value is never empty
  const safeSelectedSubcategory = selectedSubcategory && selectedSubcategory.trim() !== '' ? selectedSubcategory : "All";
  
  // Filter out any subcategories with empty names
  const validSubcategories = subcategories.filter(sub => sub.name && sub.name.trim() !== '');

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Layers className="w-4 h-4 text-gray-500" />
        <span>Subcategory:</span>
      </div>
      <Select value={safeSelectedSubcategory} onValueChange={onSelectSubcategory}>
        <SelectTrigger className="w-[220px] bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          <SelectItem value="All">
            <div className="flex items-center justify-between w-full gap-2">
              <span>All</span>
              <Badge variant="secondary" className="text-xs">
                {totalCount}
              </Badge>
            </div>
          </SelectItem>
          {validSubcategories.map((sub) => (
            <SelectItem key={sub.name} value={sub.name}>
              <div className="flex items-center justify-between w-full gap-2">
                <span>{sub.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {sub.count}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}