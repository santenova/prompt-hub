import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function PrivacyPolicy() {
  const sections = [
    {
      title: 'Introduction',
      content: 'At Prompt Hub, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information.'
    },
    {
      title: 'Information We Collect',
      content: 'We collect information you provide directly such as account registration data, content you create, and communication preferences. We also collect usage data automatically to improve our service.'
    },
    {
      title: 'How We Use Your Information',
      content: 'We use your information to provide, maintain, and improve our services, process transactions, send notifications, and support your requests. Your data helps us understand user needs and develop better features.'
    },
    {
      title: 'Data Security',
      content: 'We implement industry-standard security measures to protect your personal information. However, no method of transmission over the internet is 100% secure. We encourage you to use strong passwords.'
    },
    {
      title: 'Third-Party Services',
      content: 'We may use third-party services for payment processing, analytics, and hosting. These services are bound by confidentiality agreements and are prohibited from using your information for any other purpose.'
    },
    {
      title: 'Your Privacy Rights',
      content: 'You have the right to access, correct, or delete your personal information. You can manage your preferences in account settings or contact us to exercise these rights.'
    },
    {
      title: 'Cookies',
      content: 'We use cookies to enhance your experience. You can control cookie settings in your browser. Some features may not work properly if cookies are disabled.'
    },
    {
      title: 'Changes to This Policy',
      content: 'We may update this policy from time to time. We will notify you of significant changes via email or through the service. Your continued use constitutes acceptance of the updated policy.'
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
            <Shield className="w-16 h-16 text-purple-600" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            Privacy Policy
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
            For questions about this Privacy Policy or our privacy practices, please contact us at <span className="font-semibold">privacy@prompthub.com</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}