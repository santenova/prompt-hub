import React from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function TermsOfService() {
  const sections = [
    {
      title: 'Agreement to Terms',
      content: 'By accessing and using Prompt Hub, you accept and agree to be bound by and comply with these Terms of Service. If you do not agree to abide by any of the above, please do not use this service.'
    },
    {
      title: 'Use License',
      content: 'Permission is granted to temporarily download one copy of the materials (information or software) on Prompt Hub for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.'
    },
    {
      title: 'Disclaimer',
      content: 'The materials on Prompt Hub are provided on an "as is" basis. Prompt Hub makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property.'
    },
    {
      title: 'Limitations',
      content: 'In no event shall Prompt Hub or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Prompt Hub.'
    },
    {
      title: 'Accuracy of Materials',
      content: 'The materials appearing on Prompt Hub could include technical, typographical, or photographic errors. Prompt Hub does not warrant that any of the materials on Prompt Hub are accurate, complete, or current. Prompt Hub may make changes to the materials contained on its website at any time without notice.'
    },
    {
      title: 'Links',
      content: 'Prompt Hub has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Prompt Hub of the site. Use of any such linked website is at the user\'s own risk.'
    },
    {
      title: 'Modifications',
      content: 'Prompt Hub may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.'
    },
    {
      title: 'Governing Law',
      content: 'These terms and conditions are governed by and construed in accordance with the laws of Germany, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="flex justify-center mb-4">
            <FileText className="w-16 h-16 text-purple-600" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            Terms of Service
          </h1>
          <p className="text-gray-600">Last updated: January 2026</p>
        </motion.div>

        <div className="space-y-8">
          {sections.map((section, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-all">
                <CardContent className="pt-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{section.title}</h2>
                  <p className="text-gray-600 leading-relaxed">{section.content}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 p-6 bg-purple-50 rounded-lg border border-purple-200"
        >
          <p className="text-gray-700">
            If you have any questions about these Terms of Service, please contact us at <span className="font-semibold">legal@prompthub.com</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}