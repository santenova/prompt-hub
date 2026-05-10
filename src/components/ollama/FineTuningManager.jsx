
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  Play,
  Plus,
  Settings,
  History,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Rocket
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/apis/client";
import { AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

import DatasetUploader from "./DatasetUploader";
import TrainingJobCard from "./TrainingJobCard";

export default function FineTuningManager({ userEmail, availableModels = [] }) {
  const [showNewJobDialog, setShowNewJobDialog] = useState(false);
  const [uploadedDataset, setUploadedDataset] = useState(null);
  const [trainingConfig, setTrainingConfig] = useState({
    model_name: '',
    fine_tuned_model_name: '',
    epochs: 3,
    batch_size: 4,
    learning_rate: 0.0001,
    validation_split: 0.1,
    endpoint: ''
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get Ollama endpoints from localStorage
  const [ollamaEndpoints, setOllamaEndpoints] = useState([]);
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ollama_endpoints');
      if (stored) {
        const endpoints = JSON.parse(stored);
        setOllamaEndpoints(Array.isArray(endpoints) ? endpoints : ['http://127.0.0.1:11434']);
      } else {
        setOllamaEndpoints(['http://127.0.0.1:11434']);
      }
    } catch (error) {
      setOllamaEndpoints(['http://127.0.0.1:11434']);
    }
  }, []);

  // Fetch training jobs
  const { data: trainingJobs = [], isLoading } = useQuery({
    queryKey: ['fine-tuning-jobs', userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      const jobs = await apiClient.entities.FineTuningJob.list('-created_date');
      return jobs.filter(job => job.created_by === userEmail);
    },
    enabled: !!userEmail,
    refetchInterval: 5000, // Refresh every 5 seconds for progress updates
  });

  // Create training job mutation
  const createJobMutation = useMutation({
    mutationFn: (jobData) => apiClient.entities.FineTuningJob.create(jobData),
    onSuccess: (newJob) => {
      queryClient.invalidateQueries(['fine-tuning-jobs']);
      setShowNewJobDialog(false);
      setUploadedDataset(null);
      setTrainingConfig({
        model_name: '',
        fine_tuned_model_name: '',
        epochs: 3,
        batch_size: 4,
        learning_rate: 0.0001,
        validation_split: 0.1,
        endpoint: ''
      });
      
      toast({
        title: "Training Job Created",
        description: `Fine-tuning ${newJob.fine_tuned_model_name} has been initiated.`,
        duration: 5000,
      });

      // Start simulated training progress
      simulateTrainingProgress(newJob.id);
    },
  });

  // Update job mutation
  const updateJobMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.entities.FineTuningJob.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['fine-tuning-jobs']);
    },
  });

  // Simulate training progress (in real implementation, this would be handled by backend)
  const simulateTrainingProgress = (jobId) => {
    let progress = 0;
    let currentEpoch = 0;
    const totalEpochs = trainingConfig.epochs;

    const interval = setInterval(async () => {
      progress += Math.random() * 15 + 5; // Random progress between 5-20%
      currentEpoch = Math.floor((progress / 100) * totalEpochs);

      if (progress >= 100) {
        clearInterval(interval);
        // Mark as completed
        await apiClient.entities.FineTuningJob.update(jobId, {
          status: 'completed',
          progress: 100,
          current_epoch: totalEpochs,
          completed_at: new Date().toISOString(),
          metrics: {
            loss: 0.15 + Math.random() * 0.1,
            accuracy: 0.85 + Math.random() * 0.1,
            validation_loss: 0.18 + Math.random() * 0.1,
            validation_accuracy: 0.82 + Math.random() * 0.1
          }
        });
        queryClient.invalidateQueries(['fine-tuning-jobs']);
      } else {
        // Update progress
        const status = progress < 10 ? 'preparing' : 'training';
        await apiClient.entities.FineTuningJob.update(jobId, {
          status,
          progress: Math.min(progress, 99),
          current_epoch: currentEpoch,
          metrics: {
            loss: 0.5 - (progress / 100) * 0.35,
            accuracy: 0.5 + (progress / 100) * 0.35,
            validation_loss: 0.55 - (progress / 100) * 0.37,
            validation_accuracy: 0.48 + (progress / 100) * 0.34
          }
        });
        queryClient.invalidateQueries(['fine-tuning-jobs']);
      }
    }, 2000); // Update every 2 seconds
  };

  const handleStartTraining = () => {
    if (!uploadedDataset) {
      toast({
        title: "Dataset Required",
        description: "Please upload a training dataset first.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    if (!trainingConfig.model_name || !trainingConfig.fine_tuned_model_name) {
      toast({
        title: "Configuration Incomplete",
        description: "Please fill in all required fields.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    const estimatedDuration = trainingConfig.epochs * 300000; // 5 minutes per epoch
    const estimatedCompletion = new Date(Date.now() + estimatedDuration);

    createJobMutation.mutate({
      ...trainingConfig,
      dataset_url: uploadedDataset.url,
      dataset_name: uploadedDataset.name,
      dataset_size: uploadedDataset.size,
      training_config: {
        epochs: trainingConfig.epochs,
        batch_size: trainingConfig.batch_size,
        learning_rate: trainingConfig.learning_rate,
        validation_split: trainingConfig.validation_split
      },
      total_epochs: trainingConfig.epochs,
      status: 'pending',
      started_at: new Date().toISOString(),
      estimated_completion: estimatedCompletion.toISOString(),
      endpoint: trainingConfig.endpoint || ollamaEndpoints[0]
    });
  };

  const handleDeploy = (job) => {
    updateJobMutation.mutate({
      id: job.id,
      data: {
        is_deployed: true,
        deployment_endpoint: job.endpoint || ollamaEndpoints[0],
        status: 'deployed'
      }
    });

    toast({
      title: "Model Deployed",
      description: `${job.fine_tuned_model_name} is now available for use.`,
      duration: 5000,
    });
  };

  const handleStop = async (job) => {
    await updateJobMutation.mutateAsync({
      id: job.id,
      data: {
        status: 'failed',
        error_message: 'Training stopped by user',
        completed_at: new Date().toISOString()
      }
    });

    toast({
      title: "Training Stopped",
      description: `${job.fine_tuned_model_name} training has been stopped.`,
      duration: 5000,
    });
  };

  const handleDownload = (job) => {
    toast({
      title: "Download Started",
      description: `Preparing ${job.fine_tuned_model_name} for download...`,
      duration: 5000,
    });
    // In real implementation, this would trigger actual model download
  };

  const activeJobs = trainingJobs.filter(j => j.status === 'training' || j.status === 'preparing');
  const completedJobs = trainingJobs.filter(j => j.status === 'completed' || j.status === 'deployed');
  const failedJobs = trainingJobs.filter(j => j.status === 'failed');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                Fine-Tuning Lab
              </CardTitle>
              <CardDescription>
                Train custom models with your own data
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowNewJobDialog(true)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Training Job
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-8 h-8 text-yellow-600 animate-spin" />
                <div>
                  <p className="text-2xl font-bold text-yellow-900">{activeJobs.length}</p>
                  <p className="text-sm text-yellow-700">Active Jobs</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-900">{completedJobs.length}</p>
                  <p className="text-sm text-green-700">Completed</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Rocket className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-purple-900">
                    {trainingJobs.filter(j => j.is_deployed).length}
                  </p>
                  <p className="text-sm text-purple-700">Deployed</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">
            Active ({activeJobs.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedJobs.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Jobs ({trainingJobs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeJobs.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center text-gray-500">
                <Loader2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-semibold mb-2">No Active Training Jobs</p>
                <p className="text-sm">Start a new fine-tuning job to train your custom model</p>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence>
              {activeJobs.map(job => (
                <TrainingJobCard
                  key={job.id}
                  job={job}
                  onDeploy={handleDeploy}
                  onStop={handleStop}
                  onDownload={handleDownload}
                />
              ))}
            </AnimatePresence>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedJobs.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center text-gray-500">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-semibold mb-2">No Completed Jobs</p>
                <p className="text-sm">Completed training jobs will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence>
              {completedJobs.map(job => (
                <TrainingJobCard
                  key={job.id}
                  job={job}
                  onDeploy={handleDeploy}
                  onStop={handleStop}
                  onDownload={handleDownload}
                />
              ))}
            </AnimatePresence>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {trainingJobs.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center text-gray-500">
                <History className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-semibold mb-2">No Training Jobs</p>
                <p className="text-sm">Create your first fine-tuning job to get started</p>
                <Button
                  onClick={() => setShowNewJobDialog(true)}
                  className="mt-4 bg-gradient-to-r from-purple-600 to-indigo-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Training Job
                </Button>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence>
              {trainingJobs.map(job => (
                <TrainingJobCard
                  key={job.id}
                  job={job}
                  onDeploy={handleDeploy}
                  onStop={handleStop}
                  onDownload={handleDownload}
                />
              ))}
            </AnimatePresence>
          )}
        </TabsContent>
      </Tabs>

      {/* New Training Job Dialog */}
      <Dialog open={showNewJobDialog} onOpenChange={setShowNewJobDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Create Fine-Tuning Job
            </DialogTitle>
            <DialogDescription>
              Upload your dataset and configure training parameters
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <DatasetUploader onDatasetUploaded={setUploadedDataset} />

            {uploadedDataset && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Dataset uploaded: <strong>{uploadedDataset.name}</strong> (
                  {(uploadedDataset.size / 1024 / 1024).toFixed(2)} MB)
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Training Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="base-model">Base Model *</Label>
                    <Select
                      value={trainingConfig.model_name}
                      onValueChange={(value) => setTrainingConfig(prev => ({ ...prev, model_name: value }))}
                    >
                      <SelectTrigger id="base-model">
                        <SelectValue placeholder="Select base model" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModels.length > 0 ? (
                          availableModels.map((model) => (
                            <SelectItem key={model.name} value={model.name}>
                              {model.name}
                            </SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="llama2">llama2</SelectItem>
                            <SelectItem value="mistral">mistral</SelectItem>
                            <SelectItem value="llama3.2">llama3.2</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model-name">Fine-Tuned Model Name *</Label>
                    <Input
                      id="model-name"
                      placeholder="e.g., my-custom-model"
                      value={trainingConfig.fine_tuned_model_name}
                      onChange={(e) => setTrainingConfig(prev => ({ ...prev, fine_tuned_model_name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endpoint">Training Endpoint</Label>
                    <Select
                      value={trainingConfig.endpoint}
                      onValueChange={(value) => setTrainingConfig(prev => ({ ...prev, endpoint: value }))}
                    >
                      <SelectTrigger id="endpoint">
                        <SelectValue placeholder="Select endpoint" />
                      </SelectTrigger>
                      <SelectContent>
                        {ollamaEndpoints.map((endpoint, idx) => (
                          <SelectItem key={idx} value={endpoint}>
                            {endpoint}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Epochs: {trainingConfig.epochs}</Label>
                    </div>
                    <Slider
                      value={[trainingConfig.epochs]}
                      onValueChange={([value]) => setTrainingConfig(prev => ({ ...prev, epochs: value }))}
                      min={1}
                      max={10}
                      step={1}
                    />
                    <p className="text-xs text-gray-500">Number of complete passes through the dataset</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Batch Size: {trainingConfig.batch_size}</Label>
                    </div>
                    <Slider
                      value={[trainingConfig.batch_size]}
                      onValueChange={([value]) => setTrainingConfig(prev => ({ ...prev, batch_size: value }))}
                      min={1}
                      max={32}
                      step={1}
                    />
                    <p className="text-xs text-gray-500">Number of samples per training iteration</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Learning Rate: {trainingConfig.learning_rate}</Label>
                    </div>
                    <Slider
                      value={[trainingConfig.learning_rate * 10000]}
                      onValueChange={([value]) => setTrainingConfig(prev => ({ ...prev, learning_rate: value / 10000 }))}
                      min={1}
                      max={100}
                      step={1}
                    />
                    <p className="text-xs text-gray-500">Controls how much to adjust weights during training</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Validation Split: {(trainingConfig.validation_split * 100).toFixed(0)}%</Label>
                    </div>
                    <Slider
                      value={[trainingConfig.validation_split * 100]}
                      onValueChange={([value]) => setTrainingConfig(prev => ({ ...prev, validation_split: value / 100 }))}
                      min={5}
                      max={30}
                      step={5}
                    />
                    <p className="text-xs text-gray-500">Percentage of data reserved for validation</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewJobDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleStartTraining}
              disabled={!uploadedDataset || !trainingConfig.model_name || !trainingConfig.fine_tuned_model_name || createJobMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-indigo-600"
            >
              {createJobMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Training
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
