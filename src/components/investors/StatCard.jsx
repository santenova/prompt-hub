import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from 'framer-motion';

const StatCard = ({ title, value, description, icon: Icon, color }) => {
  return (
    <motion.div whileHover={{ y: -5 }} className="h-full">
      <Card className={`h-full shadow-lg border-t-4 ${color}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
          {Icon && <Icon className="h-5 w-5 text-gray-400" />}
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">{value}</div>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StatCard;