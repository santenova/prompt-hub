import React, { useState } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/apis/client';

export default function AttachmentPanel({ activeTab, onClose, onFileUploaded }) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = async (file) => {
    if (!file) return;
    
    setIsUploading(true);
    try {
      const { file_url } = await apiClient.integrations.Core.UploadFile({ file });
      onFileUploaded({ type: 'file', url: file_url, name: file.name });
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'file':
        return (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-all
              ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
            `}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-sm text-gray-600">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="w-8 h-8 text-gray-400" />
                <p className="text-sm text-gray-600">
                  Drag and drop files here, or{' '}
                  <label className="text-blue-500 cursor-pointer hover:underline">
                    browse
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files[0])}
                    />
                  </label>
                </p>
                <p className="text-xs text-gray-400">
                  Supports: PDF, Images, Documents, Code files
                </p>
              </div>
            )}
          </div>
        );

      case 'web':
        return (
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-3">Paste a URL to fetch content:</p>
            <input
              type="url"
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value) {
                  onFileUploaded({ type: 'link', url: e.target.value });
                  e.target.value = '';
                }
              }}
            />
          </div>
        );

      case 'paste':
        return (
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-3">Paste content from clipboard:</p>
            <textarea
              placeholder="Paste text, code, or data here..."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              onBlur={(e) => {
                if (e.target.value) {
                  onFileUploaded({ type: 'text', content: e.target.value });
                  e.target.value = '';
                }
              }}
            />
          </div>
        );

      case 'screen':
        return (
          <div className="p-6 text-center">
            <p className="text-sm text-gray-600">
              Screen capture coming soon
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="border-t border-gray-200 bg-gray-50">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 capitalize">
          {activeTab}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      {renderContent()}
    </div>
  );
}
