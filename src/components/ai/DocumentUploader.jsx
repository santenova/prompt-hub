import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, File, X, Loader2, CheckCircle2, FileText, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/apis/client";

const allowedTypes = {
  'application/pdf': { ext: 'PDF', icon: FileText, color: 'red' },
  'text/plain': { ext: 'TXT', icon: File, color: 'gray' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: 'DOCX', icon: FileText, color: 'blue' },
  'text/markdown': { ext: 'MD', icon: FileText, color: 'purple' },
  'application/json': { ext: 'JSON', icon: File, color: 'green' }
};

export default function DocumentUploader({ onDocumentsUploaded, existingDocuments = [] }) {
  const [documents, setDocuments] = useState(existingDocuments);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState({});
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

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
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files) => {
    setError(null);
    setUploading(true);

    const uploadedDocs = [];

    for (const file of Array.from(files)) {
      // Check file type
      if (!allowedTypes[file.type]) {
        setError(`File type ${file.type} not supported. Please upload PDF, TXT, DOCX, MD, or JSON files.`);
        continue;
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError(`File ${file.name} is too large. Maximum size is 10MB.`);
        continue;
      }

      try {
        // Upload file
        const { file_url } = await apiClient.integrations.Core.UploadFile({ file });

        const docData = {
          id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          url: file_url,
          uploadedAt: new Date().toISOString(),
          processed: false
        };

        uploadedDocs.push(docData);
        setDocuments(prev => [...prev, docData]);

        // Extract content in background
        extractDocumentContent(docData);

      } catch (err) {
        console.error('Upload error:', err);
        setError(`Failed to upload ${file.name}: ${err.message}`);
      }
    }

    setUploading(false);

    if (uploadedDocs.length > 0 && onDocumentsUploaded) {
      onDocumentsUploaded(uploadedDocs);
    }
  };

  const extractDocumentContent = async (doc) => {
    setProcessing(prev => ({ ...prev, [doc.id]: true }));

    try {
      // Extract text content from the document
      const result = await apiClient.integrations.Core.InvokeLLMwithLogging({
        prompt: `Extract and summarize the key information from this document. Focus on:
- Main topics and themes
- Important facts and data
- Key messages and takeaways
- Relevant context for content generation

Provide a structured summary that can be used as context for AI content generation.`,
        file_urls: [doc.url]
      });

      // Update document with extracted content
      setDocuments(prev => prev.map(d => 
        d.id === doc.id 
          ? { ...d, extractedContent: result, processed: true }
          : d
      ));

      // Notify parent component
      if (onDocumentsUploaded) {
        onDocumentsUploaded(documents.map(d => 
          d.id === doc.id 
            ? { ...d, extractedContent: result, processed: true }
            : d
        ));
      }
    } catch (err) {
      console.error('Extraction error:', err);
      setDocuments(prev => prev.map(d => 
        d.id === doc.id 
          ? { ...d, error: 'Failed to extract content', processed: false }
          : d
      ));
    } finally {
      setProcessing(prev => ({ ...prev, [doc.id]: false }));
    }
  };

  const removeDocument = (docId) => {
    const updatedDocs = documents.filter(d => d.id !== docId);
    setDocuments(updatedDocs);
    if (onDocumentsUploaded) {
      onDocumentsUploaded(updatedDocs);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-dashed border-purple-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-purple-600" />
            Upload Reference Documents
          </CardTitle>
          <CardDescription>
            Upload brand guides, past reports, or other documents for AI to reference
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-300 hover:border-purple-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              multiple
              accept=".pdf,.txt,.docx,.md,.json"
              onChange={handleFileInput}
              disabled={uploading}
            />
            
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-purple-600" />
              </div>
              
              <div>
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer text-purple-600 hover:text-purple-700 font-semibold"
                >
                  Click to upload
                </label>
                <span className="text-gray-600"> or drag and drop</span>
              </div>

              <p className="text-sm text-gray-500">
                PDF, DOCX, TXT, MD, JSON (Max 10MB each)
              </p>

              {uploading && (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  <span className="text-sm text-gray-600">Uploading...</span>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Uploaded Documents */}
      <AnimatePresence>
        {documents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Uploaded Documents ({documents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {documents.map((doc) => {
                    const fileInfo = allowedTypes[doc.type];
                    const Icon = fileInfo?.icon || File;

                    return (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Icon className={`w-5 h-5 text-${fileInfo?.color || 'gray'}-600 flex-shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{doc.name}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(doc.size)}
                              {processing[doc.id] && (
                                <span className="ml-2 text-blue-600">• Processing...</span>
                              )}
                              {doc.processed && (
                                <span className="ml-2 text-green-600">• Ready</span>
                              )}
                              {doc.error && (
                                <span className="ml-2 text-red-600">• {doc.error}</span>
                              )}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {doc.processed && (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          )}
                          {processing[doc.id] && (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDocument(doc.id)}
                            className="h-8 w-8 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
