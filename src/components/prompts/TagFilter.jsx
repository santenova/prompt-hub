import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

export default function TagFilter({ allTags, selectedTags, onTagToggle, onClearTags }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="border-dashed">
              <Filter className="w-4 h-4 mr-2" />
              Filter by Tags
              {selectedTags.length > 0 && (
                <Badge variant="secondary" className="ml-2 rounded-sm px-1">
                  {selectedTags.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search tags..." />
              <CommandList>
                <CommandEmpty>No tags found.</CommandEmpty>
                <CommandGroup>
                  {allTags.map((tag) => (
                    <CommandItem
                      key={tag.name}
                      onSelect={() => {
                        onTagToggle(tag.name);
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                              selectedTags.includes(tag.name)
                                ? 'bg-purple-600 border-purple-600'
                                : 'border-gray-300'
                            }`}
                          >
                            {selectedTags.includes(tag.name) && (
                              <div className="w-2 h-2 bg-white rounded-sm" />
                            )}
                          </div>
                          <span>#{tag.name}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {tag.count}
                        </Badge>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {selectedTags.length > 0 && (
          <Button
            variant="ghost"
            onClick={onClearTags}
            className="h-8 px-2 lg:px-3 text-xs"
          >
            Clear filters
            <X className="ml-2 h-3 w-3" />
          </Button>
        )}
      </div>

      <AnimatePresence>
        {selectedTags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            {selectedTags.map((tag) => (
              <motion.div
                key={tag}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <Badge
                  variant="secondary"
                  className="pl-2.5 pr-1 py-1.5 bg-purple-100 text-purple-700 border border-purple-200"
                >
                  #{tag}
                  <button
                    onClick={() => onTagToggle(tag)}
                    className="ml-1.5 hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}