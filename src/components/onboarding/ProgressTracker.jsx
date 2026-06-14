import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Circle,
  Trophy,
  Star,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { client } from '@/apis/client';

// Achievement milestones
const MILESTONES = [
  {
    id: 'first-template',
    title: 'First Template',
    description: 'Create your first prompt template',
    points: 10,
    icon: Sparkles
  },
  {
    id: 'ai-generated',
    title: 'AI Creator',
    description: 'Generate a prompt with AI',
    points: 15,
    icon: Sparkles
  },
  {
    id: 'first-persona',
    title: 'Persona Builder',
    description: 'Create your first AI persona',
    points: 15,
    icon: Sparkles
  },
  {
    id: 'shared-template',
    title: 'Team Player',
    description: 'Share a template with a collaborator',
    points: 20,
    icon: Sparkles
  },
  {
    id: 'ollama-setup',
    title: 'Local AI Pro',
    description: 'Connect and configure Ollama',
    points: 25,
    icon: Sparkles
  },
  {
    id: 'ten-templates',
    title: 'Template Master',
    description: 'Create 10 or more templates',
    points: 30,
    icon: Trophy
  },
  {
    id: 'beam-mode',
    title: 'Multi-Model Expert',
    description: 'Use Beam Mode to query multiple AIs',
    points: 25,
    icon: Sparkles
  },
  {
    id: 'voice-chat',
    title: 'Voice Pioneer',
    description: 'Use voice-to-prompt feature',
    points: 20,
    icon: Sparkles
  }
];

export default function ProgressTracker({ currentUser }) {
  const [completedMilestones, setCompletedMilestones] = useState([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const user = await client.auth.me();
      const completed = user.completed_milestones || [];
      setCompletedMilestones(completed);
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  };

  const completeMilestone = async (milestoneId) => {
    if (completedMilestones.includes(milestoneId)) return;

    try {
      const newCompleted = [...completedMilestones, milestoneId];
      await client.auth.updateMe({
        completed_milestones: newCompleted
      });
      setCompletedMilestones(newCompleted);
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  const totalPoints = MILESTONES.reduce((sum, m) => sum + m.points, 0);
  const earnedPoints = MILESTONES
    .filter(m => completedMilestones.includes(m.id))
    .reduce((sum, m) => sum + m.points, 0);
  const progressPercent = (earnedPoints / totalPoints) * 100;

  const getLevel = () => {
    if (earnedPoints >= 150) return { level: 5, name: 'Expert', color: 'from-purple-600 to-pink-600' };
    if (earnedPoints >= 100) return { level: 4, name: 'Advanced', color: 'from-blue-600 to-indigo-600' };
    if (earnedPoints >= 60) return { level: 3, name: 'Intermediate', color: 'from-green-600 to-emerald-600' };
    if (earnedPoints >= 30) return { level: 2, name: 'Beginner', color: 'from-yellow-500 to-orange-500' };
    return { level: 1, name: 'Novice', color: 'from-gray-500 to-slate-500' };
  };

  if (!isVisible) return null;

  const level = getLevel();
  const remainingMilestones = MILESTONES.filter(m => !completedMilestones.includes(m.id));

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-20 right-4 z-30 w-80"
    >
      <Card className="border-2 border-purple-200 shadow-xl bg-gradient-to-br from-white to-purple-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="w-4 h-4 text-purple-600" />
              Your Progress
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6"
              >
                {isExpanded ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="space-y-4">
            {/* Level & Points */}
            <div className="text-center">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${level.color} text-white mb-2`}>
                <Star className="w-4 h-4" />
                <span className="font-bold text-sm">Level {level.level}: {level.name}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {earnedPoints} <span className="text-sm text-gray-500">/ {totalPoints} XP</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            {/* Milestones */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700 mb-2">
                Next Milestones ({remainingMilestones.length} remaining)
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {remainingMilestones.slice(0, 5).map((milestone) => {
                  const MilestoneIcon = milestone.icon;
                  return (
                    <div
                      key={milestone.id}
                      className="flex items-start gap-3 p-2 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MilestoneIcon className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs text-gray-900">{milestone.title}</p>
                        <p className="text-xs text-gray-600">{milestone.description}</p>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          +{milestone.points} XP
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recently Completed */}
              {completedMilestones.length > 0 && (
                <div className="pt-3 border-t">
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    Recently Completed
                  </p>
                  <div className="space-y-1">
                    {MILESTONES
                      .filter(m => completedMilestones.includes(m.id))
                      .slice(-3)
                      .map((milestone) => (
                        <div
                          key={milestone.id}
                          className="flex items-center gap-2 text-xs text-gray-600"
                        >
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                          <span>{milestone.title}</span>
                          <span className="text-green-600">+{milestone.points}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}

// Hook to track milestone completion
export function useMilestoneTracker() {
  const trackMilestone = async (milestoneId) => {
    try {
      const user = await client.auth.me();
      const completed = user.completed_milestones || [];
      
      if (!completed.includes(milestoneId)) {
        await client.auth.updateMe({
          completed_milestones: [...completed, milestoneId]
        });
        
        // Show celebration notification
        const milestone = MILESTONES.find(m => m.id === milestoneId);
        if (milestone) {
          // Could show a toast notification here
          console.log(`🎉 Milestone completed: ${milestone.title} (+${milestone.points} XP)`);
        }
      }
    } catch (error) {
      console.error('Failed to track milestone:', error);
    }
  };

  return { trackMilestone };
}
