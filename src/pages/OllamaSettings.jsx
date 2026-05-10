import React from 'react';
import { ArrowLeft, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import OllamaSettingsManager from '../components/ollama/OllamaSettingsManager';

export default function OllamaSettings() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Settings')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Settings className="w-8 h-8 text-purple-600" />
                Ollama Configuration
              </h1>
              <p className="text-gray-600 mt-1">
                Configure your local Ollama integration for enhanced AI capabilities
              </p>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-r from-purple-100 to-indigo-100 border-2 border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-900 mb-2">About Ollama Integration</h3>
          <p className="text-sm text-purple-800">
            Ollama allows you to run large language models locally on your machine. Configure your 
            Ollama endpoint here to use it across all AI features in the app, including content 
            generation, template creation, and persona interactions.
          </p>
        </div>

        {/* Settings Manager */}
        <OllamaSettingsManager />

        {/* Help Section */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Getting Started</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>1. Install Ollama from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">ollama.ai</a></li>
            <li>2. Run Ollama locally: <code className="bg-gray-100 px-2 py-1 rounded">ollama serve</code></li>
            <li>3. Add your endpoint (default: http://localhost:11434)</li>
            <li>4. Pull a model: <code className="bg-gray-100 px-2 py-1 rounded">ollama pull llama2</code></li>
            <li>5. Enable Ollama integration in Advanced settings</li>
          </ul>
        </div>
      </div>
    </div>
  );
}