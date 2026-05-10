import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

const colorClasses = {
  purple: 'bg-purple-50 border-purple-200 text-purple-600',
  indigo: 'bg-indigo-50 border-indigo-200 text-indigo-600',
  blue: 'bg-blue-50 border-blue-200 text-blue-600',
  green: 'bg-green-50 border-green-200 text-green-600',
};

export default function ProjectStatsCard({ title, value, icon: Icon, color = 'purple' }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className={`border-2 ${colorClasses[color]}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{title}</p>
              <p className={`text-3xl font-bold ${colorClasses[color]}`}>{value}</p>
            </div>
            <Icon className={`w-10 h-10 ${colorClasses[color]}`} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}