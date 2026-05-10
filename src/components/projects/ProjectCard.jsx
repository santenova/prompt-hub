import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Eye, Edit, Trash2, FileText, Users, Sparkles, TrendingUp, ArchiveRestore } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProjectCard({ project, contentCount, personas, templates, onView, onUpdate, onDelete, onUnarchive, isArchived }) {
  const associatedPersonas = personas.filter(p => 
    project.persona_ids?.includes(p.id)
  );
  const associatedTemplates = templates.filter(t => 
    project.template_ids?.includes(t.id)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.1)' }}
    >
      <Card className="border-2 border-purple-200 hover:border-purple-400 transition-all cursor-pointer relative overflow-hidden h-full flex flex-col">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
        
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1" onClick={onView}>
              <CardTitle className="text-lg text-gray-900 mb-1">{project.name}</CardTitle>
              {project.topic && (
                <Badge variant="outline" className="text-xs">
                  {project.topic}
                </Badge>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onView}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {!isArchived && (
                  <DropdownMenuItem onClick={onView}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Project
                  </DropdownMenuItem>
                )}
                {isArchived ? (
                  <DropdownMenuItem onClick={onUnarchive} className="text-green-600">
                    <ArchiveRestore className="w-4 h-4 mr-2" />
                    Restore
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={onDelete} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent onClick={onView} className="flex-1">
          {project.description && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2 overflow-hidden">
              {project.description}
            </p>
          )}

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-xs text-gray-600">Content</p>
                  <p className="text-lg font-bold text-purple-600">{contentCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg">
                <Users className="w-4 h-4 text-indigo-600" />
                <div>
                  <p className="text-xs text-gray-600">Personas</p>
                  <p className="text-lg font-bold text-indigo-600">{associatedPersonas.length}</p>
                </div>
              </div>
            </div>

            {project.target_audience && (
              <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-gray-600 mb-1">Target Audience</p>
                <p className="text-sm text-gray-900 font-medium line-clamp-1 overflow-hidden">{project.target_audience}</p>
              </div>
            )}

            {project.tone && (
              <div className="flex items-center gap-2">
                <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                  {project.tone} tone
                </Badge>
                {project.style && (
                  <Badge variant="outline">
                    {project.style} style
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}