import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/apis/client';
import { useToast } from '@/components/ui/use-toast';
import { Sparkles, Loader2, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function TaskAssignmentHelper({ task, teamMembers }) {
  const { toast } = useToast();
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);

  const suggestAssignment = async () => {
    setLoading(true);
    try {
      const response = await apiClient.functions.invoke('aiTaskAssignmentSuggester', {
        taskDescription: {
          title: task.title,
          description: task.description
        },
        taskRequiredSkills: task.required_skills || [],
        teamMembers: teamMembers || []
      });

      setSuggestion(response.assignment);
      setShowSuggestion(true);

      toast({
        title: 'Assignment Suggestion Ready',
        description: 'AI has analyzed team skills and workload'
      });
    } catch (error) {
      toast({
        title: 'Suggestion Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={suggestAssignment}
        disabled={loading || !teamMembers?.length}
        variant="ghost"
        size="sm"
        className="gap-2"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        Suggest Assignee
      </Button>

      <Dialog open={showSuggestion} onOpenChange={setShowSuggestion}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Assignment Suggestion
            </DialogTitle>
          </DialogHeader>

          {suggestion && (
            <div className="space-y-4">
              <Card className="border-purple-200 bg-purple-50">
                <CardContent className="pt-6">
                  <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Primary Assignee</p>
                  <Badge className="bg-purple-600 text-white mb-3">
                    {suggestion.primary_assignee}
                  </Badge>
                  <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Secondary Support</p>
                  <Badge variant="outline">{suggestion.secondary_assignee}</Badge>
                </CardContent>
              </Card>

              <div>
                <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Reasoning</p>
                <p className="text-sm text-gray-700">{suggestion.reasoning}</p>
              </div>

              {suggestion.skill_gap_warning && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800">
                    <strong>⚠️ Note:</strong> {suggestion.skill_gap_warning}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuggestion(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
