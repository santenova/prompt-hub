import React from 'react';
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, FileText, Code, Briefcase, Palette, Megaphone, Target, BookOpen, Users, DollarSign, Scale, Activity, ShoppingCart, Cpu, Gamepad, UtensilsCrossed, Plane, Heart, BarChart, Sparkles } from "lucide-react";

// Core categories that should always be shown (even if empty)
const coreCategories = [
  "All",
  "Writing", 
  "Coding", 
  "Business", 
  "Creative", 
  "Marketing", 
  "Research", 
  "Education"
];

// Full category list with colors
const categoryColorMap = {
  "All": "from-gray-500 to-slate-600",
  "Writing": "from-purple-500 to-indigo-600",
  "Coding": "from-blue-500 to-cyan-600",
  "Business": "from-green-500 to-emerald-600",
  "Creative": "from-pink-500 to-rose-600",
  "Marketing": "from-orange-500 to-amber-600",
  "Research": "from-cyan-500 to-teal-600",
  "Education": "from-indigo-500 to-purple-600",
  "Relations": "from-rose-500 to-pink-600",
  "Personas": "from-teal-500 to-cyan-600",
  "Health & Wellness": "from-emerald-500 to-green-600",
  "Finance & Investment": "from-yellow-500 to-orange-600",
  "Legal": "from-slate-500 to-gray-600",
  "Productivity": "from-lime-500 to-green-600",
  "Sales": "from-fuchsia-500 to-purple-600",
  "Design": "from-violet-500 to-purple-600",
  "Gaming": "from-red-500 to-orange-600",
  "Food & Cooking": "from-amber-500 to-yellow-600",
  "Travel & Lifestyle": "from-sky-500 to-blue-600",
  "Career Development": "from-purple-500 to-indigo-700",
  "Personal Development": "from-pink-500 to-purple-700",
  "Data & Analytics": "from-blue-500 to-indigo-600",
  "AI & Machine Learning": "from-indigo-500 to-blue-700",
  "Social Media": "from-rose-500 to-pink-700",
  "E-commerce": "from-green-500 to-teal-600",
  "Other": "from-gray-500 to-slate-600",
};

const categoryIcons = {
  "All": Globe,
  "Writing": FileText,
  "Coding": Code,
  "Business": Briefcase,
  "Creative": Palette,
  "Marketing": Megaphone,
  "Research": BookOpen,
  "Education": BookOpen,
  "Relations": Users,
  "Personas": Users,
  "Social Media": Megaphone,
  "Health & Wellness": Heart,
  "Finance & Investment": DollarSign,
  "Legal": Scale,
  "Productivity": Target,
  "Sales": ShoppingCart,
  "Design": Palette,
  "Gaming": Gamepad,
  "Food & Cooking": UtensilsCrossed,
  "Travel & Lifestyle": Plane,
  "Career Development": Briefcase,
  "Personal Development": Activity,
  "Data & Analytics": BarChart,
  "AI & Machine Learning": Cpu,
  "E-commerce": ShoppingCart,
  "Other": Sparkles,
};

export default function CategoryFilter({ selectedCategory, onSelectCategory, counts }) {
  // Filter to only show categories that have templates OR are core categories
  const visibleCategories = React.useMemo(() => {
    const categoriesWithCounts = Object.keys(counts || {})
      .filter(cat => {
        // Filter out any empty category names
        if (!cat || cat.trim() === '') return false;
        
        // Always show "All"
        if (cat === "All") return true;
        
        // Always show core categories
        if (coreCategories.includes(cat)) return true;
        
        // Show other categories only if they have templates
        return counts[cat] > 0;
      })
      .sort((a, b) => {
        // "All" always first
        if (a === "All") return -1;
        if (b === "All") return 1;
        
        // Core categories come before others
        const aIsCore = coreCategories.includes(a);
        const bIsCore = coreCategories.includes(b);
        
        if (aIsCore && !bIsCore) return -1;
        if (!aIsCore && bIsCore) return 1;
        
        // Within same group, sort by count (descending)
        return (counts[b] || 0) - (counts[a] || 0);
      });

    return categoriesWithCounts.map(name => ({
      name,
      color: categoryColorMap[name] || categoryColorMap["Other"]
    }));
  }, [counts]);

  // Ensure selected value is never empty
  const safeSelectedCategory = selectedCategory && selectedCategory.trim() !== '' ? selectedCategory : "All";

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        {visibleCategories.slice(0, 3).map((cat, idx) => {
          const count = counts[cat.name] || 0;
          const isSelected = safeSelectedCategory === cat.name;
          const Icon = categoryIcons[cat.name] || Sparkles;
          
          return (
            <Button
              key={cat.name}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => onSelectCategory(cat.name)}
              className={`${isSelected ? `bg-gradient-to-r ${cat.color} text-white` : 'bg-white border-gray-200'} transition-all h-7 px-2`}
            >
              <Icon className="w-3 h-3 sm:mr-1" />
              <span className="hidden sm:inline text-xs">{cat.name}</span>
              {count > 0 && (
                <Badge variant={isSelected ? "secondary" : "outline"} className={`ml-1 text-[10px] px-1 h-3 leading-none ${isSelected ? 'bg-white/20 text-white border-white/30' : ''}`}>
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
        
        {visibleCategories.length > 3 && (
          <select
            value={safeSelectedCategory}
            onChange={(e) => onSelectCategory(e.target.value)}
            className="h-7 px-2 text-xs border border-gray-200 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {visibleCategories.map((cat) => {
              const count = counts[cat.name] || 0;
              return (
                <option key={cat.name} value={cat.name}>
                  {cat.name} ({count})
                </option>
              );
            })}
          </select>
        )}
      </div>
    </div>
  );
}