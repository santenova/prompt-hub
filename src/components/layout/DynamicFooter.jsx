import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Sparkles } from 'lucide-react';

export default function DynamicFooter({ currentPageName }) {
  const location = useLocation();
  const isVoicePage = currentPageName === 'VoiceToPrompt' || location.pathname.toLowerCase().includes('voicetoprompt');

  const companyName = 'Prompt Hub';

  if (isVoicePage) return null;

  return (
    <footer className="bg-white/80 backdrop-blur-lg border-t border-purple-100 mt-12 hidden lg:block">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-2 rounded-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">{companyName}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Quick Links</h3>
            <div className="space-y-2">
              <Link to={createPageUrl('Templates')} className="block text-sm text-gray-600 hover:text-purple-600 transition-colors">
                Prompts
              </Link>
              <Link to={createPageUrl('PersonasLibrary')} className="block text-sm text-gray-600 hover:text-purple-600 transition-colors">
                Personas
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <p className="text-sm text-gray-600">
              © 2026 {companyName}. All rights reserved.
            </p>
            <div className="flex items-center gap-4"></div>
          </div>
        </div>
      </div>
    </footer>
  );
}