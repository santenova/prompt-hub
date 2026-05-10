import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, TestTube, Copy, CheckCircle2, Info, Plus, X, Play, AlertCircle, TrendingUp } from "lucide-react";
import { apiClient } from "@/apis/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

export default function TestPromptModal({ open, onOpenChange, prompt }) {
  const [testInput, setTestInput] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('single');
  const [runningTests, setRunningTests] = useState(false);
  const [testResults, setTestResults] = useState([]);
  
  // New test case form
  const [newTestCase, setNewTestCase] = useState({
    name: '',
    input: '',
    expected_output: '',
    notes: ''
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch test cases for this prompt
  const { data: testCases = [] } = useQuery({
    queryKey: ['testCases', prompt?.id],
    queryFn: async () => {
      if (!prompt?.id) return [];
      const allCases = await apiClient.entities.TestCase.list('-created_date');
      return allCases.filter(tc => tc.prompt_id === prompt.id);
    },
    enabled: !!prompt?.id && open,
  });

  const createTestCaseMutation = useMutation({
    mutationFn: (data) => apiClient.entities.TestCase.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['testCases']);
      setNewTestCase({ name: '', input: '', expected_output: '', notes: '' });
      toast({
        title: "Test Case Created",
        description: "New test case added successfully",
      });
    },
  });

  const updateTestCaseMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.entities.TestCase.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['testCases']);
    },
  });

  const deleteTestCaseMutation = useMutation({
    mutationFn: (id) => apiClient.entities.TestCase.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['testCases']);
      toast({
        title: "Test Case Deleted",
        description: "Test case removed successfully",
      });
    },
  });

  const handleTest = async () => {
    setIsLoading(true);
    setResult('');
    
    try {
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

      let enhancedPrompt = prompt.content;
      if (settings) {
        const { enhancePromptWithSettings } = await import("../../utils");
        enhancedPrompt = enhancePromptWithSettings(prompt.content, settings);
      }

      const finalPrompt = enhancedPrompt.replace(/{input}/g, testInput);

      const response = await apiClient.integrations.Core.InvokeLLM({
        prompt: finalPrompt,
        add_context_from_internet: false,
      });

      setResult(response);
    } catch (error) {
      setResult(`Error: ${error.message || 'Failed to test prompt'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunAllTests = async () => {
    if (testCases.length === 0) {
      toast({
        title: "No Test Cases",
        description: "Please create test cases first",
        variant: "destructive"
      });
      return;
    }

    setRunningTests(true);
    setTestResults([]);
    const results = [];

    for (const testCase of testCases) {
      try {
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

        let enhancedPrompt = prompt.content;
        if (settings) {
          const { enhancePromptWithSettings } = await import("../../utils");
          enhancedPrompt = enhancePromptWithSettings(prompt.content, settings);
        }

        const finalPrompt = enhancedPrompt.replace(/{input}/g, testCase.input);

        const response = await apiClient.integrations.Core.InvokeLLM({
          prompt: finalPrompt,
          add_context_from_internet: false,
        });

        // Compare with expected output
        const passed = compareOutputs(response, testCase.expected_output);
        
        // Update test case with results
        const newRunCount = (testCase.run_count || 0) + 1;
        const newSuccessRate = passed 
          ? ((testCase.success_rate || 0) * (newRunCount - 1) + 100) / newRunCount
          : ((testCase.success_rate || 0) * (newRunCount - 1)) / newRunCount;

        await updateTestCaseMutation.mutateAsync({
          id: testCase.id,
          data: {
            actual_output: response,
            status: passed ? 'passed' : 'failed',
            last_run_date: new Date().toISOString(),
            run_count: newRunCount,
            success_rate: newSuccessRate
          }
        });

        results.push({
          testCase,
          passed,
          actual: response
        });
      } catch (error) {
        results.push({
          testCase,
          passed: false,
          actual: `Error: ${error.message}`
        });
      }
    }

    setTestResults(results);
    setRunningTests(false);
    
    const passedCount = results.filter(r => r.passed).length;
    toast({
      title: "Tests Completed",
      description: `${passedCount}/${results.length} tests passed`,
    });
  };

  const compareOutputs = (actual, expected) => {
    if (!expected) return true; // If no expected output, consider it passed
    
    const actualLower = actual.toLowerCase().trim();
    const expectedLower = expected.toLowerCase().trim();
    
    // Check if actual contains expected (fuzzy match)
    return actualLower.includes(expectedLower) || 
           expectedLower.includes(actualLower) ||
           calculateSimilarity(actualLower, expectedLower) > 0.7;
  };

  const calculateSimilarity = (str1, str2) => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  const levenshteinDistance = (str1, str2) => {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  const handleCopyResult = async () => {
    if (result) {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddTestCase = () => {
    if (!newTestCase.name || !newTestCase.input) {
      toast({
        title: "Missing Fields",
        description: "Please provide test case name and input",
        variant: "destructive"
      });
      return;
    }

    createTestCaseMutation.mutate({
      ...newTestCase,
      prompt_id: prompt.id,
      status: 'pending'
    });
  };

  const handleClose = () => {
    setTestInput('');
    setResult('');
    setTestResults([]);
    setActiveTab('single');
    onOpenChange(false);
  };

  if (!prompt) return null;

  const passedTests = testResults.filter(r => r.passed).length;
  const successRate = testResults.length > 0 ? (passedTests / testResults.length) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <TestTube className="w-6 h-6 text-purple-600" />
            Test Prompt
          </DialogTitle>
          <DialogDescription>
            Test your prompt with AI and manage test cases
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Single Test</TabsTrigger>
            <TabsTrigger value="automated">
              Automated Testing
              {testCases.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {testCases.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Single Test Tab */}
          <TabsContent value="single" className="space-y-6">
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="pt-4">
                <h3 className="font-semibold text-gray-900 mb-2">{prompt.title}</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {prompt.content}
                </p>
              </CardContent>
            </Card>

            {prompt.content.includes('{input}') && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This prompt contains <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                    {'{input}'}
                  </code> placeholder. Enter your test input below.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="testInput">
                Test Input {prompt.content.includes('{input}') && '(replaces {input} placeholder)'}
              </Label>
              <Textarea
                id="testInput"
                placeholder="Enter your test input here..."
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <Button
              onClick={handleTest}
              disabled={isLoading || (prompt.content.includes('{input}') && !testInput)}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Testing Prompt...
                </>
              ) : (
                <>
                  <TestTube className="w-5 h-5 mr-2" />
                  Run Test
                </>
              )}
            </Button>

            {result && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Results</Label>
                  <Button
                    onClick={handleCopyResult}
                    variant="outline"
                    size="sm"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {result}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Automated Testing Tab */}
          <TabsContent value="automated" className="space-y-6">
            {/* Add New Test Case */}
            <Card className="border-2 border-dashed border-purple-300">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5 text-purple-600" />
                  Add New Test Case
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Test Case Name *</Label>
                    <Input
                      placeholder="e.g., Test with product description"
                      value={newTestCase.name}
                      onChange={(e) => setNewTestCase({ ...newTestCase, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Input *</Label>
                    <Input
                      placeholder="Test input value"
                      value={newTestCase.input}
                      onChange={(e) => setNewTestCase({ ...newTestCase, input: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Expected Output</Label>
                  <Textarea
                    placeholder="What output do you expect? (Optional - leave empty to just run the test)"
                    value={newTestCase.expected_output}
                    onChange={(e) => setNewTestCase({ ...newTestCase, expected_output: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input
                    placeholder="Additional notes about this test"
                    value={newTestCase.notes}
                    onChange={(e) => setNewTestCase({ ...newTestCase, notes: e.target.value })}
                  />
                </div>
                <Button
                  onClick={handleAddTestCase}
                  disabled={createTestCaseMutation.isPending}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Test Case
                </Button>
              </CardContent>
            </Card>

            {/* Test Cases List */}
            {testCases.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Test Cases ({testCases.length})</h3>
                  <Button
                    onClick={handleRunAllTests}
                    disabled={runningTests}
                    className="bg-gradient-to-r from-green-600 to-emerald-600"
                  >
                    {runningTests ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Running Tests...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Run All Tests
                      </>
                    )}
                  </Button>
                </div>

                {testResults.length > 0 && (
                  <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-lg">Test Results</h4>
                          <Badge className={successRate >= 70 ? "bg-green-600" : successRate >= 50 ? "bg-yellow-600" : "bg-red-600"}>
                            {successRate.toFixed(0)}% Success Rate
                          </Badge>
                        </div>
                        <Progress value={successRate} className="h-3" />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            {passedTests} passed, {testResults.length - passedTests} failed
                          </span>
                          <span className="text-gray-600">
                            {testResults.length} total tests
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-3">
                  {testCases.map((testCase) => {
                    const testResult = testResults.find(r => r.testCase.id === testCase.id);
                    
                    return (
                      <Card key={testCase.id} className={`
                        ${testResult ? (testResult.passed ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50') : ''}
                        ${testCase.status === 'passed' ? 'border-l-4 border-l-green-500' : ''}
                        ${testCase.status === 'failed' ? 'border-l-4 border-l-red-500' : ''}
                      `}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base flex items-center gap-2">
                                {testCase.name}
                                {testResult && (
                                  testResult.passed ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                  ) : (
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                  )
                                )}
                              </CardTitle>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant={testCase.status === 'passed' ? 'default' : testCase.status === 'failed' ? 'destructive' : 'secondary'}>
                                  {testCase.status}
                                </Badge>
                                {testCase.run_count > 0 && (
                                  <>
                                    <Badge variant="outline">
                                      <TrendingUp className="w-3 h-3 mr-1" />
                                      {testCase.success_rate?.toFixed(0)}% success
                                    </Badge>
                                    <Badge variant="outline">
                                      Runs: {testCase.run_count}
                                    </Badge>
                                  </>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteTestCaseMutation.mutate(testCase.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          <div>
                            <Label className="text-xs text-gray-600">Input:</Label>
                            <p className="text-gray-900 bg-white p-2 rounded border mt-1">{testCase.input}</p>
                          </div>
                          {testCase.expected_output && (
                            <div>
                              <Label className="text-xs text-gray-600">Expected Output:</Label>
                              <p className="text-gray-900 bg-white p-2 rounded border mt-1">{testCase.expected_output}</p>
                            </div>
                          )}
                          {testResult && (
                            <div>
                              <Label className="text-xs text-gray-600">Actual Output:</Label>
                              <p className="text-gray-900 bg-white p-2 rounded border mt-1">{testResult.actual}</p>
                            </div>
                          )}
                          {testCase.notes && (
                            <div>
                              <Label className="text-xs text-gray-600">Notes:</Label>
                              <p className="text-gray-600 italic">{testCase.notes}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}

            {testCases.length === 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  No test cases yet. Add test cases above to enable automated testing.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
