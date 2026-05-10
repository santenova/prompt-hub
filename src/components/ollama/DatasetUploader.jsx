import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Download,
  Info
} from "lucide-react";
import { apiClient } from "@/apis/client";

const ACCEPTED_FORMATS = ['.jsonl', '.json', '.txt', '.csv'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export default function DatasetUploader({ onDatasetUploaded }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const validateFile = (file) => {
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!ACCEPTED_FORMATS.includes(fileExtension)) {
      return `Invalid file format. Please upload ${ACCEPTED_FORMATS.join(', ')} files.`;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `File is too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`;
    }
    
    return null;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
    setUploadSuccess(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload file using apiClient integration
      const { file_url } = await apiClient.integrations.Core.UploadFile({ file: selectedFile });

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadSuccess(true);

      // Pass dataset info to parent
      if (onDatasetUploaded) {
        onDatasetUploaded({
          url: file_url,
          name: selectedFile.name,
          size: selectedFile.size,
        });
      }

      // Reset after 2 seconds
      setTimeout(() => {
        setSelectedFile(null);
        setUploadSuccess(false);
        setUploadProgress(0);
      }, 2000);

    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError(error.message || 'Failed to upload file. Please try again.');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadError(null);
    setUploadSuccess(false);
    setUploadProgress(0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-purple-600" />
          Upload Training Dataset
        </CardTitle>
        <CardDescription>
          Upload your training data in JSONL, JSON, TXT, or CSV format
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Dataset Format:</strong> For best results, use JSONL format with each line containing:
            <code className="block mt-2 p-2 bg-gray-100 rounded text-xs">
              {`{"prompt": "user input", "response": "expected output"}`}
            </code>
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {!selectedFile ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <Label
                htmlFor="dataset-upload"
                className="cursor-pointer text-sm text-gray-600 hover:text-purple-600"
              >
                <span className="font-semibold text-purple-600">Click to upload</span> or drag and drop
                <br />
                <span className="text-xs text-gray-500">
                  {ACCEPTED_FORMATS.join(', ')} (max {formatFileSize(MAX_FILE_SIZE)})
                </span>
              </Label>
              <Input
                id="dataset-upload"
                type="file"
                accept={ACCEPTED_FORMATS.join(',')}
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FileText className="w-10 h-10 text-purple-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                    {!uploading && !uploadSuccess && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveFile}
                        className="flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {uploading && (
                    <div className="mt-3 space-y-2">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-xs text-gray-600">Uploading... {uploadProgress}%</p>
                    </div>
                  )}

                  {uploadSuccess && (
                    <div className="mt-3 flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Upload successful!</span>
                    </div>
                  )}
                </div>
              </div>

              {!uploading && !uploadSuccess && (
                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={handleUpload}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Dataset
                  </Button>
                  <Button variant="outline" onClick={handleRemoveFile}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}

          {uploadError && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {uploadError}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold mb-2">Sample Datasets</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="justify-start"
              onClick={() => window.open('https://example.com/sample-qa.jsonl', '_blank')}
            >
              <Download className="w-4 h-4 mr-2" />
              Q&A Dataset Sample
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="justify-start"
              onClick={() => window.open('https://example.com/sample-instructions.jsonl', '_blank')}
            >
              <Download className="w-4 h-4 mr-2" />
              Instructions Sample
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
