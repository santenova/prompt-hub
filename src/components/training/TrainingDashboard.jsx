import React, { useState } from "react";
import { apiClient } from "@/apis/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  Play,
  Pause,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Zap,
  Database,
  Settings as SettingsIcon,
  Loader2,
  XCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DatasetUploader from "./DatasetUploader";
import TrainingConfigurator from "./TrainingConfigurator";
import CustomAgentManager from "./CustomAgentManager";

export default function TrainingDashboard({ subscription, packageInfo, userEmail }) {
  const queryClient = useQueryClient();

  const { data: datasets = [], isLoading: datasetsLoading } = useQuery({
    queryKey: ['training-datasets', subscription.id],
    queryFn: async () => {
      const allDatasets = await apiClient.entities.TrainingDataset.list('-created_date');
      return allDatasets.filter(d => d.subscription_id === subscription.id);
    },
    initialData: [],
  });

  const { data: trainings = [], isLoading: trainingsLoading } = useQuery({
    queryKey: ['agent-trainings', subscription.id],
    queryFn: async () => {
      const allTrainings = await apiClient.entities.AgentTraining.list('-created_date');
      return allTrainings.filter(t => t.subscription_id === subscription.id);
    },
    initialData: [],
  });

  const { data: customVersions = [], isLoading: versionsLoading } = useQuery({
    queryKey: ['custom-agent-versions', subscription.id],
    queryFn: async () => {
      const allVersions = await apiClient.entities.CustomAgentVersion.list('-created_date');
      return allVersions.filter(v => v.subscription_id === subscription.id);
    },
    initialData: [],
  });

  const getStatusColor = (status) => {
    const colors = {
      ready: "bg-green-100 text-green-800",
      processing: "bg-blue-100 text-blue-800",
      training: "bg-purple-100 text-purple-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      error: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-gray-100 text-gray-800"
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status) => {
    const icons = {
      ready: <CheckCircle2 className="w-4 h-4" />,
      processing: <Loader2 className="w-4 h-4 animate-spin" />,
      training: <Loader2 className="w-4 h-4 animate-spin" />,
      completed: <CheckCircle2 className="w-4 h-4" />,
      failed: <XCircle className="w-4 h-4" />,
      error: <AlertCircle className="w-4 h-4" />,
      pending: <Clock className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />
    };
    return icons[status] || icons.pending;
  };

  const activeTrainings = trainings.filter(t => ['pending', 'initializing', 'training', 'validating'].includes(t.status));
  const completedTrainings = trainings.filter(t => ['completed', 'failed', 'cancelled'].includes(t.status));
  const readyDatasets = datasets.filter(d => d.status === 'ready');

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-600">{datasets.length}</p>
                <p className="text-xs text-gray-600">Datasets</p>
              </div>
              <Database className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{trainings.length}</p>
                <p className="text-xs text-gray-600">Training Jobs</p>
              </div>
              <Brain className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{customVersions.length}</p>
                <p className="text-xs text-gray-600">Custom Versions</p>
              </div>
              <Zap className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">{activeTrainings.length}</p>
                <p className="text-xs text-gray-600">Active Training</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">
            <Database className="w-4 h-4 mr-2" />
            Upload Data
          </TabsTrigger>
          <TabsTrigger value="train">
            <Brain className="w-4 h-4 mr-2" />
            Train Agent
          </TabsTrigger>
          <TabsTrigger value="versions">
            <Zap className="w-4 h-4 mr-2" />
            Custom Versions
          </TabsTrigger>
          <TabsTrigger value="jobs">
            <TrendingUp className="w-4 h-4 mr-2" />
            Training Jobs
          </TabsTrigger>
        </TabsList>

        {/* Upload Data Tab */}
        <TabsContent value="upload" className="space-y-6">
          <DatasetUploader
            subscription={subscription}
            packageInfo={packageInfo}
            userEmail={userEmail}
          />

          {/* Existing Datasets */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Your Datasets ({datasets.length})</h3>
            {datasets.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  <Database className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No datasets uploaded yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {datasets.map((dataset) => (
                  <Card key={dataset.id} className="border-2">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{dataset.dataset_name}</CardTitle>
                        <Badge className={getStatusColor(dataset.status)}>
                          {getStatusIcon(dataset.status)}
                          <span className="ml-1">{dataset.status}</span>
                        </Badge>
                      </div>
                      {dataset.description && (
                        <CardDescription className="text-sm">{dataset.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">File Type:</span>
                        <Badge variant="outline">{dataset.file_type?.toUpperCase()}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Size:</span>
                        <span className="font-medium">{(dataset.file_size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      {dataset.row_count && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Rows:</span>
                          <span className="font-medium">{dataset.row_count.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Uploaded:</span>
                        <span className="font-medium">{new Date(dataset.created_date).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Train Agent Tab */}
        <TabsContent value="train" className="space-y-6">
          <TrainingConfigurator
            subscription={subscription}
            packageInfo={packageInfo}
            userEmail={userEmail}
            datasets={readyDatasets}
          />
        </TabsContent>

        {/* Custom Versions Tab */}
        <TabsContent value="versions" className="space-y-6">
          <CustomAgentManager
            subscription={subscription}
            packageInfo={packageInfo}
            userEmail={userEmail}
            customVersions={customVersions}
          />
        </TabsContent>

        {/* Training Jobs Tab */}
        <TabsContent value="jobs" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Active Training Jobs</h3>
              <Badge variant="outline">{activeTrainings.length} active</Badge>
            </div>

            {activeTrainings.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No active training jobs</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeTrainings.map((training) => (
                  <Card key={training.id} className="border-2 border-purple-200">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{training.training_name}</CardTitle>
                          {training.description && (
                            <CardDescription>{training.description}</CardDescription>
                          )}
                        </div>
                        <Badge className={getStatusColor(training.status)}>
                          {getStatusIcon(training.status)}
                          <span className="ml-1">{training.status}</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-semibold">{training.progress}%</span>
                        </div>
                        <Progress value={training.progress} className="h-2" />
                      </div>

                      {training.training_metrics && (
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {training.training_metrics.epochs_completed && (
                            <div>
                              <p className="text-gray-600">Epochs</p>
                              <p className="font-semibold">{training.training_metrics.epochs_completed}</p>
                            </div>
                          )}
                          {training.training_metrics.loss && (
                            <div>
                              <p className="text-gray-600">Loss</p>
                              <p className="font-semibold">{training.training_metrics.loss.toFixed(4)}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {training.estimated_completion && (
                        <p className="text-sm text-gray-600">
                          Est. completion: {new Date(training.estimated_completion).toLocaleString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Completed Training Jobs */}
            {completedTrainings.length > 0 && (
              <>
                <div className="flex items-center justify-between mt-8">
                  <h3 className="text-lg font-semibold">Completed Training Jobs</h3>
                  <Badge variant="outline">{completedTrainings.length} completed</Badge>
                </div>

                <div className="space-y-4">
                  {completedTrainings.slice(0, 5).map((training) => (
                    <Card key={training.id} className="border">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base">{training.training_name}</CardTitle>
                          <Badge className={getStatusColor(training.status)}>
                            {getStatusIcon(training.status)}
                            <span className="ml-1">{training.status}</span>
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <Badge variant="outline">{training.training_type}</Badge>
                        </div>
                        {training.end_time && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Completed:</span>
                            <span className="font-medium">{new Date(training.end_time).toLocaleDateString()}</span>
                          </div>
                        )}
                        {training.actual_cost && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Cost:</span>
                            <span className="font-medium">${training.actual_cost.toFixed(2)}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
