import React, { useMemo, useState } from "react";
import { Folder, ChevronDown, ChevronUp, Database, FileCode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TemplateCard from "./TemplateCard";

const DomainSpecificTemplates = ({ 
  templates, 
  folders, 
  currentUser, 
  onEdit, 
  onDelete, 
  onToggleFavorite, 
  onUse, 
  onShowInsights, 
  onUpdate, 
  onMove, 
  onQuickRefine, 
  onQuickVariations, 
  onShowVersionHistory, 
  onInviteCollaborators, 
  onShowCollaborators, 
  onShowChangeLog 
}) => {
  const [expandedDomains, setExpandedDomains] = useState({});

  const groupedTemplates = useMemo(() => {
    const grouped = {};
    templates.forEach(template => {
      const domain = template.domain && template.domain.trim() !== '' ? template.domain : 'Uncategorized';
      if (!grouped[domain]) {
        grouped[domain] = [];
      }
      grouped[domain].push(template);
    });
    return grouped;
  }, [templates]);

  const toggleDomain = (domain) => {
    setExpandedDomains(prev => ({
      ...prev,
      [domain]: !prev[domain]
    }));
  };

  const expandAll = () => {
    const allExpanded = {};
    Object.keys(groupedTemplates).forEach(domain => {
      allExpanded[domain] = true;
    });
    setExpandedDomains(allExpanded);
  };

  const collapseAll = () => {
    setExpandedDomains({});
  };

  if (templates.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 px-4"
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center">
          <Database className="w-8 h-8 sm:w-10 sm:h-10 text-orange-600" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
          No Domain-Specific Templates
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Templates with a 'domain' value will appear here, grouped by their domain for easy organization.
        </p>
      </motion.div>
    );
  }

  const allExpanded = Object.keys(groupedTemplates).every(d => expandedDomains[d]);

  return (
    <div className="space-y-6">
      {/* Expand/Collapse All */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={allExpanded ? collapseAll : expandAll}
          className="gap-2"
        >
          {allExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {allExpanded ? 'Collapse All' : 'Expand All'}
        </Button>
      </div>

      {/* Domain Groups */}
      <AnimatePresence>
        {Object.entries(groupedTemplates)
          .sort(([domainA, templatesA], [domainB, templatesB]) => templatesB.length - templatesA.length)
          .map(([domain, domainTemplates]) => (
            <motion.div
              key={domain}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-purple-200 shadow-lg overflow-hidden">
                <CardHeader
                  className="flex flex-row items-center justify-between p-4 cursor-pointer bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 transition-all"
                  onClick={() => toggleDomain(domain)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-2 rounded-lg">
                      <FileCode className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-purple-800 font-bold">{domain}</CardTitle>
                      <p className="text-xs text-purple-600 mt-1">{domainTemplates.length} template{domainTemplates.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-white/50">
                      {domainTemplates.filter(t => t.is_favorite).length} ★
                    </Badge>
                    <Button variant="ghost" size="icon" className="hover:bg-purple-200">
                      {expandedDomains[domain] ? 
                        <ChevronUp className="w-5 h-5 text-purple-600" /> : 
                        <ChevronDown className="w-5 h-5 text-purple-600" />
                      }
                    </Button>
                  </div>
                </CardHeader>
                <AnimatePresence>
                  {expandedDomains[domain] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-white">
                        {domainTemplates.map((template) => (
                          <TemplateCard
                            key={template.id}
                            template={template}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onToggleFavorite={onToggleFavorite}
                            onUse={onUse}
                            onShowInsights={onShowInsights}
                            onUpdate={onUpdate}
                            onMove={onMove}
                            folders={folders}
                            currentUserEmail={currentUser?.email}
                            onQuickRefine={onQuickRefine}
                            onQuickVariations={onQuickVariations}
                            onShowVersionHistory={onShowVersionHistory}
                            onInviteCollaborators={onInviteCollaborators}
                            onShowCollaborators={onShowCollaborators}
                            onShowChangeLog={onShowChangeLog}
                            currentUser={currentUser}
                          />
                        ))}
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
};

export default DomainSpecificTemplates;