import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/apis/client';
import { useToast } from '@/components/ui/use-toast';
import { Sparkles, Loader2, Tag, Users, BarChart3 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export default function AIProjectEnhancer({ project, onProjectUpdate }) {
  const { toast } = useToast();
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState('categorize');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const categorizeProject = async (applyChanges = false) => {
    setLoading(true);
    try {
      const response = await apiClient.functions.invoke('aiProjectCategorizer', {
        projectId: project.id,
        projectName: project.name,
        projectDescription: project.description,
        projectAbout: project.about
      });

      setResults(response.categorization);
      setActiveTab('categorize');
      
      if (applyChanges && onProjectUpdate) {
        await onProjectUpdate({ 
          tags: response.categorization.category_tags,
          project_type: response.categorization.project_type,
          skill_tags: response.categorization.skill_tags
        });
        toast({
          title: 'Suggestions Applied',
          description: 'All AI suggestions have been applied to your project'
        });
        setShowResults(false);
      } else {
        setShowResults(true);
        toast({
          title: 'Project Categorized',
          description: 'AI has suggested tags and categories for your project'
        });
      }
    } catch (error) {
      toast({
        title: 'Categorization Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const applyAllSuggestions = async () => {
    if (activeTab === 'categorize' && results) {
      setLoading(true);
      try {
        const allKeywords = [
          ...(results.category_tags || []),
          ...(results.skill_tags || [])
        ].join(', ');
        
        const allTechStack = [
          ...(results.skill_tags || [])
        ];
        
        await onProjectUpdate({ 
          keywords: allKeywords,
          technology_stack: allTechStack,
          topic: results.project_type
        });
        toast({
          title: 'All Suggestions Applied',
          description: 'Category tags, skill tags, and project type added to project'
        });
        setShowResults(false);
      } catch (error) {
        toast({
          title: 'Failed to Apply Suggestions',
          description: error.message,
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const response = await apiClient.functions.invoke('aiProjectReportGenerator', {
        projectName: project.name,
        projectDescription: project.description,
        tasks: project.tasks || [],
        completionPercentage: project.completion_percentage || 0,
        milestones: project.roadmap || [],
        challenges: project.challenges || '',
        notes: project.notes || ''
      });

      setResults(response.report);
      setActiveTab('report');
      setShowResults(true);

      toast({
        title: 'Report Generated',
        description: 'AI-powered status report created successfully'
      });
    } catch (error) {
      toast({
        title: 'Report Generation Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          onClick={categorizeProject}
          disabled={loading}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {loading && activeTab === 'categorize' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Tag className="w-4 h-4" />
          )}
          Auto-Categorize
        </Button>

        <Button
          onClick={generateReport}
          disabled={loading}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {loading && activeTab === 'report' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <BarChart3 className="w-4 h-4" />
          )}
          Generate Report
        </Button>
      </div>

      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              {activeTab === 'categorize' ? 'Project Categories & Tags' : 'Project Status Report'}
            </DialogTitle>
          </DialogHeader>

          {results && (
            <div className="space-y-4">
              {activeTab === 'categorize' && (
                <>
                  <div>
                    <h3 className="font-semibold text-sm mb-2 text-gray-700">Project Type</h3>
                    <Badge className="bg-purple-600">{results.project_type}</Badge>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm mb-2 text-gray-700">Category Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {results.category_tags?.map((tag, i) => (
                        <Badge key={i} variant="outline" className="bg-blue-50">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm mb-2 text-gray-700">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {results.skill_tags?.map((tag, i) => (
                        <Badge key={i} variant="outline" className="bg-green-50">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'report' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm mb-1 text-gray-900">Executive Summary</h3>
                    <p className="text-sm text-gray-700">{results.executive_summary}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm mb-1 text-gray-900">Progress Overview</h3>
                    <p className="text-sm text-gray-700">{results.progress_overview}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm mb-1 text-gray-900">Current Focus</h3>
                    <p className="text-sm text-gray-700">{results.current_focus}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm mb-1 text-gray-900">Upcoming Milestones</h3>
                    <p className="text-sm text-gray-700">{results.upcoming_milestones}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm mb-1 text-gray-900">Risk Assessment</h3>
                    <p className="text-sm text-gray-700">{results.risk_assessment}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm mb-1 text-gray-900">Recommendations</h3>
                    <p className="text-sm text-gray-700">{results.recommendations}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResults(false)}>
              Close
            </Button>
            {activeTab === 'categorize' && (
              <Button 
                onClick={applyAllSuggestions} 
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Apply All Suggestions
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
