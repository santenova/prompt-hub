
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  Copy, 
  Edit, 
  Trash2,
  TestTube,
  Plus,
  Target
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PromptAnalysisTool from "./PromptAnalysisTool";
import AutoTagSuggester from "./AutoTagSuggester";


const categoryColors = {
  Writing: "bg-blue-100 text-blue-800 border-blue-200",
  Marketing: "bg-purple-100 text-purple-800 border-purple-200",
  Development: "bg-green-100 text-green-800 border-green-200",
  Coding: "bg-green-100 text-green-800 border-green-200",
  Design: "bg-pink-100 text-pink-800 border-pink-200",
  Business: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Education: "bg-indigo-100 text-indigo-800 border-indigo-200",
  Personal: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function PromptCard({ prompt, onEdit, onDelete, onToggleFavorite, onAddToMyPrompts, onTestPrompt, onUpdate, currentUserEmail }) {
  const [copied, setCopied] = React.useState(false);
  const [showAnalysis, setShowAnalysis] = React.useState(false);
  const isMyPrompt = prompt.created_by === currentUserEmail;

  const handleCopy = async () => {
    // Load settings from localStorage
    const STORAGE_KEY = "prompt_muse_pro_settings";
    let settings = null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        settings = JSON.parse(saved);
      }
    } catch (error) {
      console.error("Failed to load settings", error);
    }

    // Enhance the prompt with settings if available
    let textToCopy = prompt.content;
    if (settings) {
      const { enhancePromptWithSettings } = await import("../../utils");
      textToCopy = enhancePromptWithSettings(prompt.content, settings);
    }

    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyAnalysisImprovement = (improvement) => {
    if (onUpdate) {
      onUpdate(prompt.id, improvement);
    }
    setShowAnalysis(false);
  };

  const handleApplyTags = (newTags) => {
    if (onUpdate) {
      onUpdate(prompt.id, {
        tags: [...new Set([...(prompt.tags || []), ...newTags])]
      });
    }
  };

  return (
    <>
      <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-400">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                {prompt.title}
              </CardTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge className={categoryColors[prompt.category] || categoryColors.Personal}>
                  {prompt.category}
                </Badge>
                {prompt.subcategory && (
                  <Badge variant="outline" className="text-xs">
                    {prompt.subcategory}
                  </Badge>
                )}
                {prompt.tags && prompt.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleFavorite(prompt)}
              className={prompt.is_favorite ? "text-red-500" : "text-gray-400"}
            >
              <Heart className={`w-5 h-5 ${prompt.is_favorite ? "fill-current" : ""}`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
            {prompt.content}
          </p>

          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
            >
              <Copy className="w-4 h-4 mr-2" />
              {copied ? "Copied!" : "Copy"}
            </Button>

            {onTestPrompt && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onTestPrompt(prompt)}
              >
                <TestTube className="w-4 h-4 mr-2" />
                Test
              </Button>
            )}

            {isMyPrompt && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAnalysis(true)}
                className="text-purple-600 hover:text-purple-700"
              >
                <Target className="w-4 h-4 mr-2" />
                Analyze
              </Button>
            )}

            {!isMyPrompt && onAddToMyPrompts && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddToMyPrompts(prompt)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add to My Prompts
              </Button>
            )}

            {isMyPrompt && onEdit && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(prompt)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Prompt</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{prompt.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(prompt.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Modal */}
      <Dialog open={showAnalysis} onOpenChange={setShowAnalysis}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Analyze: {prompt.title}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="analysis" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
              <TabsTrigger value="tags">Auto-Tag</TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="mt-4">
              <PromptAnalysisTool 
                prompt={prompt} 
                onApplyImprovement={handleApplyAnalysisImprovement}
              />
            </TabsContent>

            <TabsContent value="tags" className="mt-4">
              <AutoTagSuggester
                content={prompt.content}
                title={prompt.title}
                category={prompt.category}
                currentTags={prompt.tags || []}
                onApplyTags={handleApplyTags}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
