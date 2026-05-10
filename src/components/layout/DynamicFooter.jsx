import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/apis/client';
import { Sparkles } from 'lucide-react';

export default function DynamicFooter({ currentPageName }) {
  const location = useLocation();
  const isVoicePage = currentPageName === 'VoiceToPrompt' || location.pathname.toLowerCase().includes('voicetoprompt');

  const { data: settings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const result = await apiClient.entities.CompanySettings.list();
      return Array.isArray(result) ? result[0] : result.list?.[0];
    }
  });

  const companyName = settings?.company_name || 'Prompt Hub';
  const socialMedia = settings?.social_media || {};

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

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Resources</h3>
            <div className="space-y-2">
              <Link to={createPageUrl('ContentExamples')} className="block text-sm text-gray-600 hover:text-purple-600 transition-colors">
                Examples
              </Link>
              <Link to={createPageUrl('Documentation')} className="block text-sm text-gray-600 hover:text-purple-600 transition-colors">
                Documentation
              </Link>
              <Link to={createPageUrl('Help')} className="block text-sm text-gray-600 hover:text-purple-600 transition-colors">
                Help Center
              </Link>
              <Link to={createPageUrl('Blog')} className="block text-sm text-gray-600 hover:text-purple-600 transition-colors">
                Blog
              </Link>
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Company</h3>
            <div className="space-y-2">
              <Link to={createPageUrl('About')} className="block text-sm text-gray-600 hover:text-purple-600 transition-colors">
                About Us
              </Link>
              <Link to={createPageUrl('Contact')} className="block text-sm text-gray-600 hover:text-purple-600 transition-colors">
                Contact
              </Link>
              <Link to={createPageUrl('InvestorProposal')} className="block text-sm text-gray-600 hover:text-purple-600 transition-colors">
                Investor
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Legal</h3>
            <div className="space-y-2">
              <Link to={createPageUrl('PrivacyPolicy')} className="block text-sm text-gray-600 hover:text-purple-600 transition-colors">
                Privacy Policy
              </Link>
              <Link to={createPageUrl('TermsOfService')} className="block text-sm text-gray-600 hover:text-purple-600 transition-colors">
                Terms of Service
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
            <div className="flex items-center gap-4">
              {socialMedia.twitter && (
                <a href={socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-purple-600 transition-colors">
                  Twitter
                </a>
              )}
              {socialMedia.github && (
                <a href={socialMedia.github} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-purple-600 transition-colors">
                  GitHub
                </a>
              )}
              {socialMedia.discord && (
                <a href={socialMedia.discord} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-purple-600 transition-colors">
                  Discord
                </a>
              )}
              {socialMedia.linkedin && (
                <a href={socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-purple-600 transition-colors">
                  LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
