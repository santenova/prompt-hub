import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sparkles, 
  Loader2, 
  Trophy, 
  GitCompare, 
  MessageSquare,
  Target,
  Zap,
  Copy,
  ChevronRight,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { apiClient } from "@/apis/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const CRITERIA_OPTIONS = [
  { value: 'conciseness', label: 'Conciseness', description: 'Most direct and brief' },
  { value: 'detail', label: 'Detail', description: 'Most comprehensive' },
  { value: 'creativity', label: 'Creativity', description: 'Most innovative' },
  { value: 'accuracy', label: 'Accuracy', description: 'Most factually correct' },
  { value: 'clarity', label: 'Clarity', description: 'Easiest to understand' },
  { value: 'actionable', label: 'Actionable', description: 'Most practical insights' }
];

export default function BeamAnalyzer({ beamResponses, originalPrompt, onContinueWithResponse }) {
  const [activeTab, setActiveTab] = useState('best');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [bestResponse, setBestResponse] = useState(null);
  const [selectedCriteria, setSelectedCriteria] = useState('detail');
  const [comparisonResult, setComparisonResult] = useState('');
  const [comparisonPrompt, setComparisonPrompt] = useState('');
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [followUpQuestions, setFollowUpQuestions] = useState([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const { toast } = useToast();

  const findBestResponse = async () => {
    if (beamResponses.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      const responsesText = beamResponses
        .filter(r => !r.error)
        .map((r, idx) => `Response ${idx + 1} (${r.model}):\n${r.content}`)
        .join('\n\n---\n\n');

      const criteriaDesc = CRITERIA_OPTIONS.find(c => c.value === selectedCriteria)?.description || selectedCriteria;

      const { data: analysis } = await apiClient.functions.invoke('invokeLLMWithLogging', {
        prompt: `Analyze these ${beamResponses.filter(r => !r.error).length} AI responses to the prompt: "${originalPrompt}"

${responsesText}

Identify the BEST response based on: ${criteriaDesc}

Return a JSON object with:
- best_index: number (0-based index of the best response)
- reasoning: string (why this response is best for the criteria)
- score: number (1-10 rating)
- strengths: array of strings (key strengths)
- improvements: array of strings (potential improvements)`,
        source_tool: 'beam_analyzer',
        request_metadata: {
          criteria: selectedCriteria,
          response_count: beamResponses.length
        },
        response_json_schema: {
          type: "object",
          properties: {
            best_index: { type: "number" },
            reasoning: { type: "string" },
            score: { type: "number" },
            strengths: { type: "array", items: { type: "string" } },
            improvements: { type: "array", items: { type: "string" } }
          }
        }
      });

      const validResponses = beamResponses.filter(r => !r.error);
      const bestResp = validResponses[analysis.best_index];
      
      setBestResponse({
        ...bestResp,
        analysis
      });

      toast({
        title: "Best Response Found",
        description: `${bestResp.model} scored ${analysis.score}/10`
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const compareResponses = async () => {
    if (selectedForComparison.length < 2) {
      toast({
        title: "Select Responses",
        description: "Select at least 2 responses to compare",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const responsesToCompare = beamResponses.filter(r => selectedForComparison.includes(r.id));
      const responsesText = responsesToCompare.map((r, idx) => 
        `Response ${idx + 1} (${r.model}):\n${r.content}`
      ).join('\n\n---\n\n');

      const prompt = comparisonPrompt.trim() || 
        'Compare these responses highlighting key differences, unique insights, and which aspects each handles better';

      const { data: comparison } = await apiClient.functions.invoke('invokeLLMWithLogging', {
        prompt: `${prompt}:\n\n${responsesText}`,
        source_tool: 'beam_comparison',
        request_metadata: {
          response_count: responsesToCompare.length
        }
      });

      setComparisonResult(comparison);
      toast({
        title: "Comparison Complete",
        description: `Analyzed ${responsesToCompare.length} responses`
      });
    } catch (error) {
      toast({
        title: "Comparison Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateFollowUpQuestions = async () => {
    if (beamResponses.length === 0) return;

    setIsGeneratingQuestions(true);
    try {
      const validResponses = beamResponses.filter(r => !r.error);
      const responsesText = validResponses.map((r, idx) => 
        `[${r.model}]: ${r.content}`
      ).join('\n\n');

      const { data: result } = await apiClient.functions.invoke('invokeLLMWithLogging', {
        prompt: `Analyze these ${validResponses.length} AI responses to: "${originalPrompt}"

${responsesText}

Based on the consensus and divergence in these responses, generate 5 insightful follow-up questions that would:
1. Explore areas where models disagree
2. Dive deeper into common themes
3. Address gaps or unexplored angles
4. Challenge assumptions
5. Seek practical applications

Return a JSON object with an array of questions.`,
        source_tool: 'beam_follow_up',
        request_metadata: {
          response_count: validResponses.length
        },
        response_json_schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: { type: "string" }
            },
            reasoning: { type: "string" }
          }
        }
      });

      setFollowUpQuestions(result.questions || []);
      toast({
        title: "Questions Generated",
        description: `${result.questions.length} follow-up questions created`
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const toggleComparisonSelection = (responseId) => {
    setSelectedForComparison(prev => 
      prev.includes(responseId)
        ? prev.filter(id => id !== responseId)
        : [...prev, responseId]
    );
  };

  const validResponses = beamResponses.filter(r => !r.error);

  return (
    <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          AI Beam Analyzer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="best" className="text-xs">
              <Trophy className="w-3 h-3 mr-1" />
              Best Response
            </TabsTrigger>
            <TabsTrigger value="compare" className="text-xs">
              <GitCompare className="w-3 h-3 mr-1" />
              Compare
            </TabsTrigger>
            <TabsTrigger value="followup" className="text-xs">
              <MessageSquare className="w-3 h-3 mr-1" />
              Follow-ups
            </TabsTrigger>
          </TabsList>

          {/* Best Response Tab */}
          <TabsContent value="best" className="space-y-3">
            <div className="space-y-2">
              <Label className="text-sm">Selection Criteria</Label>
              <Select value={selectedCriteria} onValueChange={setSelectedCriteria}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CRITERIA_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label} - {opt.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={findBestResponse}
              disabled={isAnalyzing || validResponses.length === 0}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 mr-2" />
                  Find Best Response
                </>
              )}
            </Button>

            <AnimatePresence>
              {bestResponse && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <Card className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-amber-600" />
                          <span className="font-semibold">{bestResponse.model}</span>
                          <Badge className="bg-amber-600">
                            {bestResponse.analysis.score}/10
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onContinueWithResponse(bestResponse)}
                        >
                          <ChevronRight className="w-3 h-3 mr-1" />
                          Use This
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-1">Reasoning:</p>
                        <p className="text-sm text-gray-800">{bestResponse.analysis.reasoning}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs font-semibold text-green-700 mb-1">Strengths:</p>
                        <ul className="space-y-1">
                          {bestResponse.analysis.strengths.map((strength, idx) => (
                            <li key={idx} className="text-xs text-gray-700 flex items-start gap-1">
                              <span className="text-green-600">✓</span>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {bestResponse.analysis.improvements?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-orange-700 mb-1">Potential Improvements:</p>
                          <ul className="space-y-1">
                            {bestResponse.analysis.improvements.map((improvement, idx) => (
                              <li key={idx} className="text-xs text-gray-700 flex items-start gap-1">
                                <span className="text-orange-600">→</span>
                                {improvement}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Compare Tab */}
          <TabsContent value="compare" className="space-y-3">
            <div className="space-y-2">
              <Label className="text-sm">Select Responses to Compare</Label>
              <div className="space-y-2 max-h-[150px] overflow-y-auto">
                {validResponses.map((response) => (
                  <div
                    key={response.id}
                    onClick={() => toggleComparisonSelection(response.id)}
                    className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-all ${
                      selectedForComparison.includes(response.id)
                        ? 'border-purple-500 bg-purple-100'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <span className="text-sm font-medium">{response.model}</span>
                    <Check className={`w-4 h-4 ${selectedForComparison.includes(response.id) ? 'text-purple-600' : 'text-transparent'}`} />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Comparison Focus (Optional)</Label>
              <Textarea
                placeholder="e.g., 'Compare technical accuracy' or 'Which is more creative?'"
                value={comparisonPrompt}
                onChange={(e) => setComparisonPrompt(e.target.value)}
                rows={2}
              />
            </div>

            <Button
              onClick={compareResponses}
              disabled={isAnalyzing || selectedForComparison.length < 2}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Comparing...
                </>
              ) : (
                <>
                  <GitCompare className="w-4 h-4 mr-2" />
                  Compare Selected ({selectedForComparison.length})
                </>
              )}
            </Button>

            <AnimatePresence>
              {comparisonResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="border-2 border-blue-300 bg-blue-50">
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-semibold">Comparison Results</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(comparisonResult);
                            toast({ title: "Copied", description: "Comparison copied to clipboard" });
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <ScrollArea className="max-h-[300px]">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{comparisonResult}</p>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Follow-up Questions Tab */}
          <TabsContent value="followup" className="space-y-3">
            <Button
              onClick={generateFollowUpQuestions}
              disabled={isGeneratingQuestions || validResponses.length === 0}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
            >
              {isGeneratingQuestions ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Generate Follow-up Questions
                </>
              )}
            </Button>

            <AnimatePresence>
              {followUpQuestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <Label className="text-sm font-semibold">Suggested Questions</Label>
                  {followUpQuestions.map((question, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Card className="border border-green-300 bg-green-50 hover:bg-green-100 cursor-pointer transition-all">
                        <CardContent className="p-3 flex items-start gap-3">
                          <Badge className="bg-green-600 text-xs mt-0.5 flex-shrink-0">
                            Q{idx + 1}
                          </Badge>
                          <p className="text-sm text-gray-800 flex-1">{question}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(question);
                              toast({ title: "Copied", description: "Question copied to clipboard" });
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
