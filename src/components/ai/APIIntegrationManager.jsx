import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link2, TrendingUp, BarChart3, Globe, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/apis/client";

const integrationTypes = [
  {
    id: 'trends',
    name: 'Social Media Trends',
    icon: TrendingUp,
    description: 'Get trending topics and hashtags from social media',
    color: 'blue',
    inputs: [
      { name: 'platform', label: 'Platform', type: 'select', options: ['Twitter', 'Instagram', 'TikTok', 'LinkedIn'] },
      { name: 'category', label: 'Category', type: 'text', placeholder: 'e.g., technology, fashion' }
    ]
  },
  {
    id: 'market',
    name: 'Market Research',
    icon: BarChart3,
    description: 'Access market data and industry insights',
    color: 'green',
    inputs: [
      { name: 'industry', label: 'Industry', type: 'text', placeholder: 'e.g., SaaS, E-commerce' },
      { name: 'region', label: 'Region', type: 'text', placeholder: 'e.g., North America, Global' }
    ]
  },
  {
    id: 'news',
    name: 'News & Current Events',
    icon: Globe,
    description: 'Pull latest news and current events',
    color: 'purple',
    inputs: [
      { name: 'topic', label: 'Topic', type: 'text', placeholder: 'e.g., AI, climate change' },
      { name: 'timeframe', label: 'Timeframe', type: 'select', options: ['Last 24 hours', 'Last week', 'Last month'] }
    ]
  }
];

export default function APIIntegrationManager({ onDataFetched }) {
  const [selectedIntegration, setSelectedIntegration] = useState('trends');
  const [inputs, setInputs] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const currentIntegration = integrationTypes.find(i => i.id === selectedIntegration);

  const handleInputChange = (name, value) => {
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleFetchData = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let prompt = '';

      if (selectedIntegration === 'trends') {
        prompt = `Find the top 10 trending topics on ${inputs.platform || 'social media'} ${inputs.category ? `in the ${inputs.category} category` : ''}.

For each trend, provide:
- Topic name
- Brief description
- Engagement metrics (if available)
- Relevance score (1-10)
- How it could be used for content creation

Return as JSON with structure:
{
  "trends": [
    {
      "topic": "...",
      "description": "...",
      "engagement": "...",
      "relevance": 8,
      "content_ideas": ["...", "..."]
    }
  ],
  "summary": "Overall trends summary"
}`;
      } else if (selectedIntegration === 'market') {
        prompt = `Research the ${inputs.industry || 'general'} industry ${inputs.region ? `in ${inputs.region}` : 'globally'}.

Provide:
- Market size and growth rate
- Key players and competitors
- Emerging trends
- Consumer insights
- Content opportunities

Return as JSON with structure:
{
  "market_overview": "...",
  "market_size": "...",
  "growth_rate": "...",
  "key_players": ["...", "..."],
  "trends": ["...", "..."],
  "content_opportunities": ["...", "..."]
}`;
      } else if (selectedIntegration === 'news') {
        prompt = `Find the most important news stories about ${inputs.topic || 'current events'} from ${inputs.timeframe || 'the last 24 hours'}.

For each story, provide:
- Headline
- Summary
- Source
- Relevance for content creation
- Potential angles

Return as JSON with structure:
{
  "stories": [
    {
      "headline": "...",
      "summary": "...",
      "source": "...",
      "relevance": 8,
      "content_angles": ["...", "..."]
    }
  ],
  "summary": "Overall news summary"
}`;
      }

      // Use LLM with internet context to fetch real data
      const data = await apiClient.integrations.Core.InvokeLLMwithLogging({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            trends: { type: "array" },
            stories: { type: "array" },
            market_overview: { type: "string" },
            summary: { type: "string" }
          }
        }
      });

      setResult(data);
      
      if (onDataFetched) {
        onDataFetched({
          type: selectedIntegration,
          data,
          inputs
        });
      }
    } catch (err) {
      console.error('API integration error:', err);
      setError(err?.message || 'Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-indigo-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-indigo-600" />
          External Data Integration
        </CardTitle>
        <CardDescription>
          Connect to real-time data sources to enrich your content generation
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Integration Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {integrationTypes.map((integration) => {
            const Icon = integration.icon;
            return (
              <Card
                key={integration.id}
                className={`cursor-pointer transition-all ${
                  selectedIntegration === integration.id
                    ? `border-2 border-${integration.color}-500 bg-${integration.color}-50`
                    : 'hover:border-gray-300'
                }`}
                onClick={() => {
                  setSelectedIntegration(integration.id);
                  setInputs({});
                  setResult(null);
                  setError(null);
                }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-${integration.color}-100 flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 text-${integration.color}-600`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1">{integration.name}</h4>
                      <p className="text-xs text-gray-600">{integration.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Input Fields */}
        {currentIntegration && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className={`bg-${currentIntegration.color}-600`}>
                Selected: {currentIntegration.name}
              </Badge>
            </div>

            {currentIntegration.inputs.map((input) => (
              <div key={input.name} className="space-y-2">
                <Label htmlFor={input.name}>{input.label}</Label>
                {input.type === 'select' ? (
                  <Select
                    value={inputs[input.name] || ''}
                    onValueChange={(value) => handleInputChange(input.name, value)}
                  >
                    <SelectTrigger id={input.name}>
                      <SelectValue placeholder={`Select ${input.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {input.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={input.name}
                    type="text"
                    placeholder={input.placeholder}
                    value={inputs[input.name] || ''}
                    onChange={(e) => handleInputChange(input.name, e.target.value)}
                  />
                )}
              </div>
            ))}

            <Button
              onClick={handleFetchData}
              disabled={loading}
              className={`w-full bg-gradient-to-r from-${currentIntegration.color}-600 to-${currentIntegration.color}-700`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Fetching Data...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4 mr-2" />
                  Fetch Data
                </>
              )}
            </Button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Results Display */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold">Data Retrieved Successfully</h4>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border max-h-96 overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap font-mono">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>

              {result.summary && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Summary</p>
                  <p className="text-sm text-gray-700">{result.summary}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
