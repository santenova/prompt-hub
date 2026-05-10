import { ENABLE_ELASTICSEARCH } from '@/apis/client';

// Elasticsearch REST API configuration
const getESConfig = () => {
  try {
    const config = JSON.parse(localStorage.getItem('elasticsearch_config') || '{}');
    return {
      endpoint: config.endpoint || '/db',
      indices: config.indices || {}
    };
  } catch {
    return {
      endpoint: '/db',
      indices: {}
    };
  }
};

// Get index name for entity
const getIndexName = (entityName) => {
  const { indices } = getESConfig();
  // Try exact match first
  if (indices[entityName]) {
    return indices[entityName];
  }
  
  // Special case mappings (singular to plural)
  const specialMappings = {
    'User': 'users',
    'Notification': 'notification',
    'Persona': 'personas'
  };
  
  const indexSuffix = specialMappings[entityName] || entityName.toLowerCase();
  return `prompt-hub-${indexSuffix}`;
};

// Execute Elasticsearch REST API call
const esApiCall = async (method, path, body = null) => {
  const { endpoint } = getESConfig();
  const url = `${endpoint}${path}`;
  
  const options = {
    method: method || 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(`ES API Error: ${response.status} ${response.statusText}`);
      
      // Generate curl command
      let curlCmd = `curl -X ${options.method} "${url}" \\\n  -H "Content-Type: application/json"`;
      if (body) {
        curlCmd += ` \\\n  -d '${JSON.stringify(body)}'`;
      }
      
      error.request = {
        method: options.method,
        url: url,
        body: body,
        curl: curlCmd
      };
      error.response = {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      };
      throw error;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Elasticsearch API call failed:', error);
    if (!error.request) {
      let curlCmd = `curl -X ${options.method} "${url}" \\\n  -H "Content-Type: application/json"`;
      if (body) {
        curlCmd += ` \\\n  -d '${JSON.stringify(body)}'`;
      }
      error.request = {
        method: options.method,
        url: url,
        body: body,
        curl: curlCmd
      };
    }
    throw error;
  }
};

// Notification operations
export const notificationES = {
  list: async (userEmail, limit = 50) => {
    const index = getIndexName('Notification');
    const result = await esApiCall('POST', `/${index}/_search`, {
      query: {
        term: { 'user_email.keyword': userEmail }
      },
      sort: [{ created_date: { order: 'desc' } }],
      size: limit
    });
    
    return result.hits.hits.map(hit => ({
      id: hit._id,
      ...hit._source
    }));
  },
  
  create: async (notificationData) => {
    const index = getIndexName('Notification');
    const timestamp = new Date().toISOString();
    
    const doc = {
      ...notificationData,
      created_date: timestamp,
      is_read: false
    };
    
    const result = await esApiCall('POST', `/${index}/_doc`, doc);
    
    return {
      id: result._id,
      ...doc
    };
  },
  
  markAsRead: async (notificationId) => {
    const index = getIndexName('Notification');
    
    await esApiCall('POST', `/${index}/_update_by_query?refresh=true`, {
      query: {
        term: {
          "_id": notificationId
        }
      },
      max_docs: 1,
      script: {
        source: "ctx._source.is_read = true; ctx._source.updated_date = params.updated_date",
        params: {
          updated_date: new Date().toISOString()
        }
      }
    });
    
    return { id: notificationId, is_read: true };
  },
  
  delete: async (notificationId) => {
    const index = getIndexName('Notification');
    await esApiCall('POST', `/${index}/_delete_by_query?refresh=true`, {
      query: {
        term: {
          "_id": notificationId
        }
      },
      max_docs: 1
    });
    return { id: notificationId };
  }
};

// User operations
export const userES = {
  get: async (userId) => {
    const index = getIndexName('User');
    
    try {
      const result = await esApiCall('POST', `/${index}/_search`, {
        query: {
          terms: { _id: [userId] }
        },
        size: 1
      });
      
      if (result.hits.hits.length === 0) {
        return null;
      }
      
      return {
        id: result.hits.hits[0]._id,
        ...result.hits.hits[0]._source
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  },
  
  getByEmail: async (email) => {
    const index = getIndexName('User');
    
    const result = await esApiCall('POST', `/${index}/_search`, {
      query: {
        term: { 'email.keyword': email }
      },
      size: 1
    });
    
    if (result.hits.hits.length === 0) {
      return null;
    }
    
    return {
      id: result.hits.hits[0]._id,
      ...result.hits.hits[0]._source
    };
  },
  
  update: async (userId, userData) => {
    const index = getIndexName('User');
    
    await esApiCall('POST', `/${index}/_update_by_query?refresh=true`, {
      query: {
        term: {
          "_id": userId
        }
      },
      max_docs: 1,
      script: {
        source: Object.keys(userData).map(key => `ctx._source.${key} = params.${key}`).join('; ') + '; ctx._source.updated_date = params.updated_date',
        params: {
          ...userData,
          updated_date: new Date().toISOString()
        }
      }
    });
    
    const result = await esApiCall('POST', `/${index}/_search`, {
      query: {
        terms: { _id: [userId] }
      },
      size: 1
    });
    
    if (result.hits.hits.length === 0) {
      throw new Error(`User not found after update: ${userId}`);
    }
    
    return {
      id: result.hits.hits[0]._id,
      ...result.hits.hits[0]._source
    };
  },
  
  create: async (userData) => {
    const index = getIndexName('User');
    const timestamp = new Date().toISOString();
    
    const doc = {
      ...userData,
      created_date: timestamp,
      updated_date: timestamp
    };
    
    const result = await esApiCall('POST', `/${index}/_doc`, doc);
    
    return {
      id: result._id,
      ...doc
    };
  }
};

// Log operations (LLMLog, AgentMonitoringLog, etc.)
export const logES = {
  create: async (logType, logData) => {
    const index = getIndexName(logType);
    const timestamp = new Date().toISOString();
    
    const doc = {
      ...logData,
      timestamp: timestamp,
      created_date: timestamp
    };
    
    const result = await esApiCall('POST', `/${index}/_doc`, doc);
    
    return {
      id: result._id,
      ...doc
    };
  },
  
  query: async (logType, filters = {}, limit = 100) => {
    const index = getIndexName(logType);
    
    const must = [];
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        must.push({
          term: { [`${key}.keyword`]: value }
        });
      }
    });
    
    const result = await esApiCall('POST', `/${index}/_search`, {
      query: must.length ? { bool: { must } } : { match_all: {} },
      sort: [{ timestamp: { order: 'desc' } }],
      size: limit
    });
    
    return result.hits.hits.map(hit => ({
      id: hit._id,
      ...hit._source
    }));
  },
  
  getRecent: async (logType, limit = 50) => {
    const index = getIndexName(logType);
    
    const result = await esApiCall('POST', `/${index}/_search`, {
      query: { match_all: {} },
      sort: [{ timestamp: { order: 'desc' } }],
      size: limit
    });
    
    return result.hits.hits.map(hit => ({
      id: hit._id,
      ...hit._source
    }));
  }
};

// Auto-fallback wrapper for any entity
// This provides AUTOMATIC failover to Elasticsearch when primary DB is down
// Controlled by ENABLE_ELASTICSEARCH flag in src/api/entities.js
export const withElasticsearchFallback = (entityOps, entityName, esOps) => {
  if (!ENABLE_ELASTICSEARCH) {
    console.log(`🔒 [${entityName}] Elasticsearch fallback disabled (ENABLE_ELASTICSEARCH=false)`);
    return entityOps;
  }
  
  console.log(`✅ [${entityName}] Elasticsearch fallback enabled (ENABLE_ELASTICSEARCH=true)`);
  
  let isDowntime = false;
  let lastCheck = 0;
  const CHECK_INTERVAL = 30000; // 30 seconds
  
  const shouldUseES = () => {
    const now = Date.now();
    if (isDowntime && now - lastCheck < CHECK_INTERVAL) {
      return true;
    }
    return false;
  };
  
  const wrapMethod = (methodName, esMethod) => {
    return async (...args) => {
      // If in downtime mode, use ES directly
      if (shouldUseES()) {
        console.log(`📊 [${entityName}] Using Elasticsearch fallback for ${methodName} (downtime mode active)`);
        try {
          return await esMethod(...args);
        } catch (esError) {
          console.error(`❌ [${entityName}] ES fallback failed:`, esError);
          throw esError;
        }
      }
      
      // Try primary database first
      try {
        return await entityOps[methodName](...args);
      } catch (error) {
        // Check if it's a server/network error
        const isServerError = 
          error.message?.includes('fetch') ||
          error.message?.includes('network') ||
          error.message?.includes('Failed to fetch') ||
          error.status >= 500;
        
        if (isServerError && esMethod) {
          console.warn(`⚠️ [${entityName}] Primary DB failed for ${methodName}, activating Elasticsearch fallback`);
          isDowntime = true;
          lastCheck = Date.now();
          
          try {
            return await esMethod(...args);
          } catch (esError) {
            console.error(`❌ [${entityName}] ES fallback also failed:`, esError);
            throw error;
          }
        }
        
        throw error;
      }
    };
  };
  
  const wrappedOps = { ...entityOps };
  
  Object.keys(esOps).forEach(methodName => {
    if (esOps[methodName]) {
      wrappedOps[methodName] = wrapMethod(methodName, esOps[methodName]);
    }
  });
  
  return wrappedOps;
};

// AI Generated Content operations
export const aiContentES = {
  create: async (contentData) => {
    const index = getIndexName('ContentHistory');
    const timestamp = new Date().toISOString();
    
    const doc = {
      ...contentData,
      timestamp: timestamp,
      created_date: timestamp,
      indexed_at: timestamp
    };
    
    const result = await esApiCall('POST', `/${index}/_doc`, doc);
    
    return {
      id: result._id,
      ...doc
    };
  },
  
  search: async (filters = {}, limit = 50) => {
    const index = getIndexName('ContentHistory');
    
    const must = [];
    
    if (filters.tool_type) {
      must.push({ term: { 'tool_type.keyword': filters.tool_type } });
    }
    if (filters.user_email) {
      must.push({ term: { 'created_by.keyword': filters.user_email } });
    }
    if (filters.persona_id) {
      must.push({ term: { 'persona_id.keyword': filters.persona_id } });
    }
    if (filters.project_id) {
      must.push({ term: { 'project_id.keyword': filters.project_id } });
    }
    
    const result = await esApiCall('POST', `/${index}/_search`, {
      query: must.length ? { bool: { must } } : { match_all: {} },
      sort: [{ created_date: { order: 'desc' } }],
      size: limit
    });
    
    return result.hits.hits.map(hit => ({
      id: hit._id,
      ...hit._source
    }));
  }
};

// Health check for Elasticsearch
export const checkElasticsearchHealth = async () => {
  const { endpoint } = getESConfig();
  
  try {
    const result = await esApiCall('GET', '/_cluster/health');
    return {
      available: true,
      status: result.status,
      cluster_name: result.cluster_name
    };
  } catch (error) {
    return {
      available: false,
      error: error.message
    };
  }
};
