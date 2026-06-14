import React from 'react';
import ElasticsearchDataSource from '@/components/admin/ElasticsearchDataSource';

export default function ElasticsearchConfig() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Elasticsearch Configuration</h1>
        <p className="text-gray-500 mt-1">Configure your Elasticsearch proxy endpoint and entity index mappings.</p>
      </div>
      <ElasticsearchDataSource />
    </div>
  );
}