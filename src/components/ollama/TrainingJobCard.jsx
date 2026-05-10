import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Pause,
  StopCircle,
  CheckCircle2,
  XCircle,
  Rocket,
  Download,
  TrendingUp,
  Clock,
  Zap,
  Loader2,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";

export default function TrainingJobCard({ job, onDeploy, onStop, onDownload }) {
  const getStatusIcon = () => {
    const icons = {
      pending: <Clock className="w-5 h-5 text-gray-500" />,
      preparing: <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />,
      training: <Zap className="w-5 h-5 text-yellow-500 animate-pulse" />,
      completed: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      failed: <XCircle className="w-5 h-5 text-red-500" />,
      deployed: <Rocket className="w-5 h-5 text-purple-500" />
    };
    return icons[job.status] || icons.pending;
  };

  const getStatusColor = () => {
    const colors = {
      pending: "bg-gray-100 text-gray-800 border-gray-300",
      preparing: "bg-blue-100 text-blue-800 border-blue-300",
      training: "bg-yellow-100 text-yellow-800 border-yellow-300",
      completed: "bg-green-100 text-green-800 border-green-300",
      failed: "bg-red-100 text-red-800 border-red-300",
      deployed: "bg-purple-100 text-purple-800 border-purple-300"
    };
    return colors[job.status] || colors.pending;
  };

  const formatDuration = (startDate, endDate) => {
    if (!startDate) return 'Not started';
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diff = Math.floor((end - start) / 1000); // seconds
    
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s`;
    return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
  };

  const canDeploy = job.status === 'completed' && !job.is_deployed;
  const canStop = job.status === 'training' || job.status === 'preparing';
  const isActive = job.status === 'training' || job.status === 'preparing';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className={`border-2 ${isActive ? 'shadow-lg' : ''}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {getStatusIcon()}
                {job.fine_tuned_model_name}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Base: {job.model_name} • Dataset: {job.dataset_name}
              </p>
            </div>
            <Badge className={getStatusColor()} variant="outline">
              {job.status.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Bar */}
          {(job.status === 'training' || job.status === 'preparing') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {job.status === 'preparing' ? 'Preparing...' : `Epoch ${job.current_epoch || 0}/${job.total_epochs || 0}`}
                </span>
                <span className="font-semibold text-purple-600">{job.progress || 0}%</span>
              </div>
              <Progress value={job.progress || 0} className="h-2" />
              {job.estimated_completion && (
                <p className="text-xs text-gray-500">
                  Est. completion: {new Date(job.estimated_completion).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Metrics */}
          {job.metrics && Object.keys(job.metrics).length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {job.metrics.loss !== undefined && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">Training Loss</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {job.metrics.loss.toFixed(4)}
                  </p>
                </div>
              )}
              {job.metrics.accuracy !== undefined && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">Accuracy</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {(job.metrics.accuracy * 100).toFixed(2)}%
                  </p>
                </div>
              )}
              {job.metrics.validation_loss !== undefined && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">Val Loss</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {job.metrics.validation_loss.toFixed(4)}
                  </p>
                </div>
              )}
              {job.metrics.validation_accuracy !== undefined && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">Val Accuracy</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {(job.metrics.validation_accuracy * 100).toFixed(2)}%
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Training Config */}
          <div className="flex flex-wrap gap-2 text-xs">
            {job.training_config?.epochs && (
              <Badge variant="outline">
                {job.training_config.epochs} epochs
              </Badge>
            )}
            {job.training_config?.batch_size && (
              <Badge variant="outline">
                Batch: {job.training_config.batch_size}
              </Badge>
            )}
            {job.training_config?.learning_rate && (
              <Badge variant="outline">
                LR: {job.training_config.learning_rate}
              </Badge>
            )}
          </div>

          {/* Duration */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatDuration(job.started_at, job.completed_at)}</span>
            </div>
            {job.endpoint && (
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                <span className="truncate">{job.endpoint}</span>
              </div>
            )}
          </div>

          {/* Error Message */}
          {job.status === 'failed' && job.error_message && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900">Training Failed</p>
                  <p className="text-xs text-red-700 mt-1">{job.error_message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Deployment Info */}
          {job.is_deployed && job.deployment_endpoint && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-sm font-semibold text-purple-900">Deployed</p>
                  <p className="text-xs text-purple-700 mt-1">{job.deployment_endpoint}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            {canDeploy && (
              <Button
                onClick={() => onDeploy(job)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600"
                size="sm"
              >
                <Rocket className="w-4 h-4 mr-2" />
                Deploy Model
              </Button>
            )}

            {canStop && (
              <Button
                onClick={() => onStop(job)}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <StopCircle className="w-4 h-4 mr-2" />
                Stop Training
              </Button>
            )}

            {job.status === 'completed' && (
              <Button
                onClick={() => onDownload(job)}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}