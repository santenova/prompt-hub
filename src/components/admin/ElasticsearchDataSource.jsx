import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import esData from '@/apis/entities.json';
import {
  Database,
  Server,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Zap,
  FileText,
  Users,
  Plus,
  Trash2,
  Box
} from "lucide-react";

const ES_CONFIG_KEY = 'elasticsearch_config';

// All available entities in the app
const ALL_ENTITIES = [
    { name: 'AgentMetrics', defaultIndex: 'prompt-hub-agentmetrics', icon: Box },
    { name: 'AgentMonitoringLog', defaultIndex: 'prompt-hub-agentmonitoringlog', icon: Box },
    { name: 'AgentPackage', defaultIndex: 'prompt-hub-agentpackage', icon: Box },
    { name: 'AgentReview', defaultIndex: 'prompt-hub-agentreview', icon: Box },
    { name: 'AgentSubscription', defaultIndex: 'prompt-hub-agentsubscription', icon: Box },
    { name: 'AgentTraining', defaultIndex: 'prompt-hub-agenttraining', icon: Box },
    { name: 'AlertConfiguration', defaultIndex: 'prompt-hub-alertconfiguration', icon: Box },
    { name: 'APIConfiguration', defaultIndex: 'prompt-hub-apiconfiguration', icon: Box },
    { name: 'APIKey', defaultIndex: 'prompt-hub-apikey', icon: Box },
    { name: 'APISettings', defaultIndex: 'prompt-hub-apisettings', icon: Box },
    { name: 'Bookmark', defaultIndex: 'prompt-hub-bookmark', icon: Box },
    { name: 'ChatMessageAnnotation', defaultIndex: 'prompt-hub-chatmessageannotation', icon: Box },
    { name: 'ChatSessionParticipant', defaultIndex: 'prompt-hub-chatsessionparticipant', icon: Box },
    { name: 'ChatSessionVersion', defaultIndex: 'prompt-hub-chatsessionversion', icon: Box },
    { name: 'CompanySettings', defaultIndex: 'prompt-hub-companysettings', icon: Box },
    { name: 'ContentExample', defaultIndex: 'prompt-hub-contentexample', icon: Box },
    { name: 'ContentHistory', defaultIndex: 'prompt-hub-contenthistory', icon: Box },
    { name: 'CustomAgentVersion', defaultIndex: 'prompt-hub-customagentversion', icon: Box },
    { name: 'CustomTool', defaultIndex: 'prompt-hub-customtool', icon: Box },
    { name: 'DocumentExport', defaultIndex: 'prompt-hub-documentexport', icon: Box },
    { name: 'FineTuningJob', defaultIndex: 'prompt-hub-finetuningjob', icon: Box },
    { name: 'KnowledgeBase', defaultIndex: 'prompt-hub-knowledgebase', icon: Box },
    { name: 'LibraryItem', defaultIndex: 'prompt-hub-libraryitem', icon: Box },
    { name: 'LLMLog', defaultIndex: 'prompt-hub-llmlog', icon: Box },
    { name: 'Notification', defaultIndex: 'prompt-hub-notification', icon: Box },
    { name: 'Persona', defaultIndex: 'prompt-hub-persona', icon: Box },
    { name: 'PersonaComment', defaultIndex: 'prompt-hub-personacomment', icon: Box },
    { name: 'PlaceholderPreset', defaultIndex: 'prompt-hub-placeholderpreset', icon: Box },
    { name: 'Project', defaultIndex: 'prompt-hub-project', icon: Box },
    { name: 'PublishingAPIKey', defaultIndex: 'prompt-hub-publishingapikey', icon: Box },
    { name: 'SlackMessage', defaultIndex: 'prompt-hub-slackmessage', icon: Box },
    { name: 'Template', defaultIndex: 'prompt-hub-template', icon: Box },
    { name: 'TemplateComment', defaultIndex: 'prompt-hub-templatecomment', icon: Box },
    { name: 'TestCase', defaultIndex: 'prompt-hub-testcase', icon: Box },
    { name: 'TestHistory', defaultIndex: 'prompt-hub-testhistory', icon: Box },
    { name: 'TrainingDataset', defaultIndex: 'prompt-hub-trainingdataset', icon: Box },
    { name: 'UserAPIKey', defaultIndex: 'prompt-hub-userapikey', icon: Box },
    { name: 'VectorDocument', defaultIndex: 'prompt-hub-vectordocument', icon: Box },
    { name: 'VoiceChat', defaultIndex: 'prompt-hub-voicechat', icon: Box },
    { name: 'Workflow', defaultIndex: 'prompt-hub-workflow', icon: Box },
    { name: 'WorkflowComponent', defaultIndex: 'prompt-hub-workflowcomponent', icon: Box },
    { name: 'WorkspaceMember', defaultIndex: 'prompt-hub-workspacemember', icon: Box },
    { name: 'GenerationPreset', defaultIndex: 'prompt-hub-generationpreset', icon: Box }
  /**
   *
  { name: 'Template', defaultIndex: 'templates', icon: FileText },
  { name: 'Persona', defaultIndex: 'personas', icon: Users },
  { name: 'TestCase', defaultIndex: 'testcases', icon: Box },
  { name: 'TemplateComment', defaultIndex: 'template_comments', icon: Box },
  { name: 'AgentPackage', defaultIndex: 'agent_packages', icon: Box },
  { name: 'AgentSubscription', defaultIndex: 'agent_subscriptions', icon: Box },
  { name: 'AgentReview', defaultIndex: 'agent_reviews', icon: Box },
  { name: 'APIKey', defaultIndex: 'api_keys', icon: Box },
  { name: 'TrainingDataset', defaultIndex: 'training_datasets', icon: Box },
  { name: 'AgentTraining', defaultIndex: 'agent_training', icon: Box },
  { name: 'CustomAgentVersion', defaultIndex: 'custom_agent_versions', icon: Box },
  { name: 'AlertConfiguration', defaultIndex: 'alert_configurations', icon: Box },
  { name: 'Notification', defaultIndex: 'notifications', icon: Box },
  { name: 'AgentMonitoringLog', defaultIndex: 'agent_monitoring_logs', icon: Box },
  { name: 'AgentMetrics', defaultIndex: 'agent_metrics', icon: Box },
  { name: 'Bookmark', defaultIndex: 'bookmarks', icon: Box },
  { name: 'FineTuningJob', defaultIndex: 'fine_tuning_jobs', icon: Box },
  { name: 'VectorDocument', defaultIndex: 'vector_documents', icon: Box },
   * **/
];

const getDefaultIndices = () => {
  const indices = {};
  ALL_ENTITIES.forEach(entity => {
    indices[entity.name] = entity.defaultIndex;
  });
  return indices;
};

const getElasticsearchConfig = () => {
  try {
    const stored = localStorage.getItem(ES_CONFIG_KEY);
    if (stored) {
      const parsed = esData;
      // Migrate old config format
      if (parsed.templatesIndex && !parsed.indices) {
        parsed.indices = {
          ...getDefaultIndices(),
          Template: parsed.templatesIndex,
          Persona: parsed.personasIndex
        };
        parsed.enabledEntities = parsed.enabledEntities || ['Template', 'Persona'];
        delete parsed.templatesIndex;
        delete parsed.personasIndex;
      }
      return {
        endpoint: parsed.endpoint || '',
        enabled: parsed.enabled || false,
        indices: parsed.indices || getDefaultIndices(),
        enabledEntities: parsed.enabledEntities || []
      };
    }
  } catch (error) {
    console.error('Error reading ES config:', error);
  }
  return {
    endpoint: '/db',
    enabled: true,
    indices: getDefaultIndices(),
    enabledEntities: []
  };
};

const saveElasticsearchConfig = (config) => {
  try {
    localStorage.setItem(ES_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Error saving ES config:', error);
  }
};

export const useElasticsearchDataSource = () => {
  const [config, setConfig] = useState(getElasticsearchConfig);

  const isEnabled = () => config.endpoint; // config.enabled && 

  const isEntityEnabled = (entityName) => {
    return isEnabled() && config.enabledEntities?.includes(entityName);
  };

  const fetchFromElasticsearch = async (entityName) => {
    if (!isEntityEnabled(entityName)) return null;
    
    const index = config.indices?.[entityName];
    if (!index) return null;

    try {
      const response = await fetch(`${config.endpoint}/${index}/_search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: { match_all: {} },
          size: 5000
        })
      });

      if (!response.ok) {
        throw new Error(`ES error: ${response.status}`);
      }

      const data = await response.json();
      return data.hits?.hits?.map(hit => ({
        id: hit._id,
        ...hit._source
      })) || [];
    } catch (error) {
      console.error(`Error fetching from ES index ${index}:`, error);
      return null;
    }
  };

  const createInElasticsearch = async (entityName, data) => {
    if (!isEntityEnabled(entityName)) return null;
    
    const index = config.indices?.[entityName];
    if (!index) return null;

    try {
      const response = await fetch(`${config.endpoint}/${index}/_doc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`ES create error: ${response.status}`);
      }

      const result = await response.json();
      return {
        id: result._id,
        ...data
      };
    } catch (error) {
      console.error(`Error creating in ES index ${index}:`, error);
      return null;
    }
  };

  const updateInElasticsearch = async (entityName, id, data) => {
    if (!isEntityEnabled(entityName)) return null;
    
    const index = config.indices?.[entityName];
    if (!index) return null;

    try {
      const response = await fetch(`${config.endpoint}/${index}/_update/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doc: data,
          doc_as_upsert: true
        })
      });

      if (!response.ok) {
        throw new Error(`ES update error: ${response.status}`);
      }

      const result = await response.json();
      return {
        id: result._id,
        ...data
      };
    } catch (error) {
      console.error(`Error updating in ES index ${index}:`, error);
      return null;
    }
  };

  const searchInElasticsearch = async (entityName, searchQuery, options = {}) => {
    if (!isEntityEnabled(entityName)) return null;
    
    const index = config.indices?.[entityName];
    if (!index) return null;

    const {
      filters = {},
      sort = '_score',
      sortOrder = 'desc',
      size = 100,
      from = 0
    } = options;

    try {
      // Build query
      const must = [];
      const filter = [];

      // Full-text search
      if (searchQuery && searchQuery.trim()) {
        must.push({
          multi_match: {
            query: searchQuery,
            fields: ['*'],
            type: 'best_fields',
            fuzziness: 'AUTO'
          }
        });
      }

      // Apply filters
      Object.entries(filters).forEach(([field, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          filter.push({ terms: { [field]: value } });
        } else if (value !== null && value !== undefined && value !== '') {
          filter.push({ term: { [field]: value } });
        }
      });

      const query = must.length > 0 || filter.length > 0 ? {
        bool: {
          ...(must.length > 0 && { must }),
          ...(filter.length > 0 && { filter })
        }
      } : { match_all: {} };

      const body = {
        query,
        size,
        from,
        sort: sort === '_score' ? [{ _score: { order: sortOrder } }] : [{ [sort]: { order: sortOrder } }]
      };

      const response = await fetch(`${config.endpoint}/${index}/_search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`ES search error: ${response.status}`);
      }

      const data = await response.json();
      return {
        results: data.hits?.hits?.map(hit => ({
          id: hit._id,
          score: hit._score,
          ...hit._source
        })) || [],
        total: data.hits?.total?.value || 0
      };
    } catch (error) {
      console.error(`Error searching ES index ${index}:`, error);
      return null;
    }
  };

  const getFacets = async (entityName, field, searchQuery = '') => {
    if (!isEntityEnabled(entityName)) return null;
    
    const index = config.indices?.[entityName];
    if (!index) return null;

    try {
      const query = searchQuery.trim() ? {
        multi_match: {
          query: searchQuery,
          fields: ['*'],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      } : { match_all: {} };

      const body = {
        query,
        size: 0,
        aggs: {
          facets: {
            terms: {
              field: `${field}.keyword`,
              size: 50
            }
          }
        }
      };

      const response = await fetch(`${config.endpoint}/${index}/_search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`ES facet error: ${response.status}`);
      }

      const data = await response.json();
      return data.aggregations?.facets?.buckets?.map(bucket => ({
        key: bucket.key,
        count: bucket.doc_count
      })) || [];
    } catch (error) {
      console.error(`Error getting facets from ES index ${index}:`, error);
      return null;
    }
  };

  // Generic method to get any entity
  const getEntity = async (entityName) => {
    return fetchFromElasticsearch(entityName);
  };

  // Legacy methods for backwards compatibility
  const getTemplates = async () => fetchFromElasticsearch('Template');
  const getPersonas = async () => fetchFromElasticsearch('Persona');

  return {
    config,
    setConfig: (newConfig) => {
      setConfig(newConfig);
      saveElasticsearchConfig(newConfig);
    },
    isEnabled: isEnabled(),
    isEntityEnabled,
    getEntity,
    createEntity: createInElasticsearch,
    updateEntity: updateInElasticsearch,
    searchEntity: searchInElasticsearch,
    getFacets,
    getTemplates,
    getPersonas,
    allEntities: ALL_ENTITIES
  };
};

export default function ElasticsearchDataSource() {
  const [config, setConfigState] = useState(getElasticsearchConfig());
  const [connectionStatus, setConnectionStatus] = useState('unknown'); // unknown, checking, connected, error
  const [indexStats, setIndexStats] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const updateConfig = (updates) => {
    const newConfig = { ...config, ...updates };
    setConfigState(newConfig);
    saveElasticsearchConfig(newConfig);
  };

  const updateIndex = (entityName, indexName) => {
    updateConfig({
      indices: { ...config.indices, [entityName]: indexName }
    });
  };

  const toggleEntityEnabled = (entityName) => {
    const enabledEntities = config.enabledEntities || [];
    const newEnabled = enabledEntities.includes(entityName)
      ? enabledEntities.filter(e => e !== entityName)
      : [...enabledEntities, entityName];
    updateConfig({ enabledEntities: newEnabled });
  };

  const testConnection = async () => {
    if (!config.endpoint) {
      toast({
        title: "No Endpoint",
        description: "Please enter an Elasticsearch endpoint URL",
        variant: "destructive"
      });
      return;
    }

    setConnectionStatus('checking');
    setIsLoading(true);

    try {
      // Test basic connectivity
      const response = await fetch(`${config.endpoint}/_cluster/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const health = await response.json();
      
      // Check all configured indices
      const stats = {};
      for (const entity of ALL_ENTITIES) {
        const indexName = config.indices?.[entity.name] || entity.defaultIndex;
        stats[entity.name] = await getIndexCount(indexName);
      }
      setIndexStats(stats);

      setConnectionStatus('connected');
      toast({
        title: "Connected!",
        description: `Elasticsearch cluster status: ${health.status}`,
      });
    } catch (error) {
      console.error('ES connection error:', error);
      setConnectionStatus('error');
      setIndexStats({});
      toast({
        title: "Connection Failed",
        description: error.message || "Could not connect to Elasticsearch",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getIndexCount = async (index) => {
    try {
      const response = await fetch(`${config.endpoint}/${index}/_count`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (response.ok) {
        const data = await response.json();
        return data.count;
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleToggleEnabled = (enabled) => {
    if (enabled && connectionStatus !== 'connected') {
      toast({
        title: "Test Connection First",
        description: "Please test the connection before enabling",
        variant: "destructive"
      });
      return;
    }
    updateConfig({ enabled });
    toast({
      title: enabled ? "Elasticsearch Enabled" : "Elasticsearch Disabled",
      description: enabled 
        ? "Selected entities will now load from Elasticsearch" 
        : "Data will load from the default apiClient database"
    });
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-yellow-50 border-yellow-300">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <strong>Two Elasticsearch Modes:</strong>
          <br />
          <strong>1. Primary Mode (this UI):</strong> Manually use ES as primary data source for selected entities
          <br />
          <strong>2. Automatic Fallback:</strong> Controlled by ENABLE_ELASTICSEARCH flag in <code>src/api/entities.js</code> - 
          automatically switches to ES when primary DB fails (no admin needed)
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-orange-600" />
            Elasticsearch Configuration
          </CardTitle>
          <CardDescription>
            Connect to your local Elasticsearch instance to use as an alternative data source
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Endpoint Configuration */}
          <div className="space-y-4" >
            <div className="space-y-2">
              <Label htmlFor="es-endpoint">Elasticsearch Endpoint</Label>
              <div className="flex gap-2">
                <Input
                  id="es-endpoint"
                  placeholder="http://localhost:9200"
                  value={config.endpoint}
                  onChange={(e) => updateConfig({ endpoint: e.target.value })}
                  className="flex-1"
                />
                <Button
                  onClick={testConnection}
                  disabled={isLoading || !config.endpoint}
                  variant="outline"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span className="ml-2">Test</span>
                </Button>
              </div>
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
              <Server className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium">Connection Status:</span>
              {connectionStatus === 'unknown' && (
                <Badge variant="secondary">Not Tested</Badge>
              )}
              {connectionStatus === 'checking' && (
                <Badge className="bg-blue-500">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Checking...
                </Badge>
              )}
              {connectionStatus === 'connected' && (
                <Badge className="bg-green-500">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              )}
              {connectionStatus === 'error' && (
                <Badge variant="destructive">
                  <XCircle className="w-3 h-3 mr-1" />
                  Failed
                </Badge>
              )}
            </div>
          </div>

          {/* Entity Index Configuration */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Entity Index Mapping</Label>
            <p className="text-sm text-gray-600">Configure which Elasticsearch indices to use for each entity type</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
              {ALL_ENTITIES.map((entity) => {
                const EntityIcon = entity.icon;
                const isEntityEnabled = config.enabledEntities?.includes(entity.name);
                const docCount = indexStats[entity.name];
                
                
                return (
                  <Card 
                    key={entity.name} 
                    className={`transition-all ${isEntityEnabled ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}
                  >
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <EntityIcon className={`w-4 h-4 ${isEntityEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                          <span className="text-sm font-medium">{entity.name}</span>
                        </div>
                        <Switch
                          checked={isEntityEnabled}
                          onCheckedChange={() => toggleEntityEnabled(entity.name)}
                          disabled={!config.enabled}
                        />
                      </div>
                      
                      <Input
                        value={config.indices?.[entity.name] || entity.defaultIndex}
                        onChange={(e) => updateIndex(entity.name, e.target.value)}
                        placeholder={entity.defaultIndex}
                        className="text-xs h-8"
                        disabled={!isEntityEnabled}
                      />
                      
                      {docCount !== null && docCount !== undefined && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle2 className="w-3 h-3" />
                          {docCount} docs
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Enable/Disable Toggle */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-3">
                <Zap className="w-6 h-6 text-orange-600" />
                <div>
                  <p className="font-semibold text-gray-900">Enable Elasticsearch Data Source</p>
                  <p className="text-sm text-gray-600">
                    When enabled, Templates and Personas pages will load data from Elasticsearch
                  </p>
                </div>
              </div>
              <Switch
                checked={config.enabled}
                onCheckedChange={handleToggleEnabled}
              />
            </div>
          </div>

          {config.enabled && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Active:</strong> Data for {config.enabledEntities?.length || 0} entities is being loaded from Elasticsearch at <code>{config.endpoint}</code>
                {config.enabledEntities?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {config.enabledEntities.map(entity => (
                      <Badge key={entity} variant="secondary" className="text-xs">{entity}</Badge>
                    ))}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <p>
            1. Enter your Elasticsearch endpoint URL (e.g., <code>http://localhost:9200</code>)
          </p>
          <p>
            2. Click "Test" to verify the connection and check for available indices
          </p>
          <p>
            3. Enable the main Elasticsearch toggle
          </p>
          <p>
            4. Toggle individual entities to enable/disable ES data source for each
          </p>
          <p>
            5. Customize index names for each entity type if needed
          </p>
          <p className="text-orange-600 font-medium">
            Note: Changes are stored locally. Refresh pages to see data from Elasticsearch for enabled entities.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
