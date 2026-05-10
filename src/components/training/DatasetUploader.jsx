import React, { useState } from "react";
import { apiClient } from "@/apis/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  File,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileText,
  Database
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function DatasetUploader({ subscription, packageInfo, userEmail, onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [datasetName, setDatasetName] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const uploadFileMutation = useMutation({
    mutationFn: async (file) => {
      const result = await apiClient.integrations.Core.UploadFile({ file });
      return result.file_url;
    },
  });

  const createDatasetMutation = useMutation({
    mutationFn: (data) => apiClient.entities.TrainingDataset.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['training-datasets']);
      if (onUploadComplete) onUploadComplete();
      resetForm();
      toast({
        title: "Dataset Uploaded!",
        description: "Your dataset is now processing and will be ready soon.",
      });
    },
  });

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    const validTypes = ['text/csv', 'application/json', 'text/plain', 'application/pdf'];
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.jsonl')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload CSV, JSON, JSONL, TXT, or PDF files only.",
        variant: "destructive"
      });
      return;
    }

    // Check file size (max 50MB)
    if (selectedFile.size > 50 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload files smaller than 50MB.",
        variant: "destructive"
      });
      return;
    }

    setFile(selectedFile);
    if (!datasetName) {
      setDatasetName(selectedFile.name.split('.')[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !datasetName) {
      toast({
        title: "Missing Information",
        description: "Please select a file and provide a dataset name.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      // Upload file
      setUploadProgress(30);
      const fileUrl = await uploadFileMutation.mutateAsync(file);
      
      setUploadProgress(60);

      // Determine file type
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const fileTypeMap = {
        'csv': 'csv',
        'json': 'json',
        'jsonl': 'jsonl',
        'txt': 'txt',
        'pdf': 'pdf'
      };

      setUploadProgress(80);

      // Create dataset record
      await createDatasetMutation.mutateAsync({
        user_email: userEmail,
        subscription_id: subscription.id,
        package_id: packageInfo.id,
        dataset_name: datasetName,
        description: description,
        file_url: fileUrl,
        file_type: fileTypeMap[fileExtension] || 'txt',
        file_size: file.size,
        status: 'processing'
      });

      setUploadProgress(100);
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your dataset. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setFile(null);
    setDatasetName("");
    setDescription("");
    setUploadProgress(0);
  };

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-purple-600" />
          Upload Training Dataset
        </CardTitle>
        <CardDescription>
          Upload your custom data for fine-tuning the {packageInfo.name} agent
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFile(null)}
              >
                <X className="w-4 h-4 mr-2" />
                Remove
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Database className="w-12 h-12 mx-auto text-gray-400" />
              <div>
                <p className="text-gray-700 font-medium">
                  Drag and drop your dataset here
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  or click to browse
                </p>
              </div>
              <Input
                type="file"
                accept=".csv,.json,.jsonl,.txt,.pdf"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </span>
                </Button>
              </label>
              <p className="text-xs text-gray-500">
                Supported formats: CSV, JSON, JSONL, TXT, PDF (max 50MB)
              </p>
            </div>
          )}
        </div>

        {/* Dataset Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dataset-name">Dataset Name *</Label>
            <Input
              id="dataset-name"
              placeholder="e.g., Customer Support Conversations"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe what this dataset contains and its intended use..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700">Uploading...</span>
              <span className="font-semibold">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {/* Info Box */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Dataset Guidelines</p>
              <ul className="space-y-1 text-xs">
                <li>• For best results, include at least 50-100 examples</li>
                <li>• Ensure data is clean and properly formatted</li>
                <li>• CSV: Include headers for column names</li>
                <li>• JSON/JSONL: Use consistent structure</li>
                <li>• Remove sensitive or personal information</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleUpload}
          disabled={!file || !datasetName || uploading}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
          size="lg"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Uploading Dataset...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 mr-2" />
              Upload Dataset
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
