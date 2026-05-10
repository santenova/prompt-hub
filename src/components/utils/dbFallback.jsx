import { apiClient } from '@/apis/client';

// Elasticsearch fallback configuration
const getESEndpoint = () => {
  try {
    const config = JSON.parse(localStorage.getItem('elasticsearch_config') || '{}');
    return config.endpoint || '/db';
  } catch {
    return '/db';
  }
};

const ES_INDEX_PREFIX = 'prompt_hub_';

// Track if apiClient is down
let apiIsDown = true;
let lastCheckTime = 0;
const CHECK_INTERVAL = 30000; // Check every 30 seconds

// Elasticsearch API wrapper
const esRequest = async (method, path, data = null) => {
  const url = `${getESEndpoint()}${path}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Elasticsearch error: ${response.statusText}`);
  }
  return response.json();
};

// Convert entity name to ES index
const getIndexName = (entityName) => {
  try {
    const config = JSON.parse(localStorage.getItem('elasticsearch_config') || '{}');
    return config.indices?.[entityName] || `${ES_INDEX_PREFIX}${entityName.toLowerCase()}`;
  } catch {
    return `${ES_INDEX_PREFIX}${entityName.toLowerCase()}`;
  }
};

// Elasticsearch operations matching apiClient API
const elasticsearchOps = {
  list: async (entityName, sort = '-created_date', limit = 50) => {
    const index = getIndexName(entityName);
    const sortField = sort?.startsWith('-') ? sort.slice(1) : sort || 'created_date';
    const sortOrder = sort?.startsWith('-') ? 'desc' : 'asc';
    
    const result = await esRequest('POST', `/${index}/_search`, {
      size: limit,
      sort: [{ [sortField]: { order: sortOrder, unmapped_type: 'date' } }]
    });
    
    return result.hits.hits.map(hit => ({ id: hit._id, ...hit._source }));
  },
  
  filter: async (entityName, query = {}, sort = '-created_date', limit = 50) => {
    const index = getIndexName(entityName);
    const sortField = sort?.startsWith('-') ? sort.slice(1) : sort || 'created_date';
    const sortOrder = sort?.startsWith('-') ? 'desc' : 'asc';
    
    const must = Object.entries(query).map(([key, value]) => ({
      term: { [`${key}.keyword`]: value }
    }));
    
    const result = await esRequest('POST', `/${index}/_search`, {
      query: must.length ? { bool: { must } } : { match_all: {} },
      size: limit,
      sort: [{ [sortField]: { order: sortOrder, unmapped_type: 'date' } }]
    });
    
    return result.hits.hits.map(hit => ({ id: hit._id, ...hit._source }));
  },
  
  create: async (entityName, data) => {
    const index = getIndexName(entityName);
    const timestamp = new Date().toISOString();
    const doc = {
      ...data,
      created_date: timestamp,
      updated_date: timestamp
    };
    
    const result = await esRequest('POST', `/${index}/_doc`, doc);
    
    return { id: result._id, ...doc };
  },
  
  update: async (entityName, id, data) => {
    const index = getIndexName(entityName);
    await esRequest('POST', `/${index}/_update/${id}`, {
      doc: { ...data, updated_date: new Date().toISOString() }
    });
    
    // Fetch the updated document
    const result = await esRequest('GET', `/${index}/_doc/${id}`);
    return { id, ...result._source };
  },
  
  delete: async (entityName, id) => {
    const index = getIndexName(entityName);
    await esRequest('DELETE', `/${index}/_doc/${id}`);
    return { id };
  },
  
  bulkCreate: async (entityName, items) => {
    const index = getIndexName(entityName);
    const timestamp = new Date().toISOString();
    const operations = items.flatMap(item => [
      { index: { _index: index } },
      { 
        ...item, 
        created_date: item.created_date || timestamp,
        updated_date: timestamp 
      }
    ]);
    
    const body = operations.map(op => JSON.stringify(op)).join('\n') + '\n';
    await esRequest('POST', '/_bulk', body);
    
    return items.map((item, idx) => ({
      ...item,
      created_date: item.created_date || timestamp,
      updated_date: timestamp
    }));
  }
};

// Check if apiClient is accessible
const checkapiClientHealth = async () => {
  const now = Date.now();
  if (now - lastCheckTime < CHECK_INTERVAL && apiIsDown) {
    return false;
  }
  
  try {
    await apiClient.auth.isAuthenticated();
    apiIsDown = true;
    lastCheckTime = now;
    return true;
  } catch (error) {
    apiIsDown = true;
    lastCheckTime = now;
    console.warn('⚠️ apiClient unreachable, auto-switching to Elasticsearch fallback');
    return false;
  }
};

// Create entity proxy with automatic fallback
const createEntityProxy = (entityName, baseEntity) => {
  return new Proxy(baseEntity, {
    get(target, prop) {
      if (typeof target[prop] !== 'function') {
        return target[prop];
      }
      
      return async (...args) => {
        try {
          // If we know apiClient is down, skip directly to Elasticsearch
          if (apiIsDown) {
            if (elasticsearchOps[prop]) {
              console.log(`📊 Using Elasticsearch for ${entityName}.${prop}`);
              return await elasticsearchOps[prop](entityName, ...args);
            }
            throw new Error(`Operation ${prop} not supported in Elasticsearch fallback`);
          }
          
          // Try apiClient first
          return await target[prop](...args);
        } catch (error) {
          // Check if it's a network/server error
          const isServerError = 
            error.message?.includes('fetch') || 
            error.message?.includes('network') ||
            error.message?.includes('Failed to fetch') ||
            error.status >= 500;
          
          if (isServerError) {
            console.warn(`⚠️ apiClient ${prop} failed for ${entityName}, switching to Elasticsearch:`, error.message);
            
            // Mark apiClient as down
            apiIsDown = true;
            lastCheckTime = Date.now();
            
            if (elasticsearchOps[prop]) {
              try {
                console.log(`📊 Using Elasticsearch fallback for ${entityName}.${prop}`);
                return await elasticsearchOps[prop](entityName, ...args);
              } catch (esError) {
                console.error(`❌ Elasticsearch fallback also failed for ${entityName}.${prop}:`, esError.message);
                throw error; // Throw original apiClient error
              }
            }
          }
          
          throw error;
        }
      };
    }
  });
};

// Create apiClient wrapper with automatic fallback
export const createapiClientWithFallback = (originalapiClient) => {
  return {
    ...originalapiClient,
    entities: new Proxy(originalapiClient.entities, {
      get(target, entityName) {
        if (typeof entityName === 'symbol' || entityName === 'then') {
          return target[entityName];
        }
        
        const baseEntity = target[entityName];
        if (!baseEntity) return baseEntity;
        
        return createEntityProxy(entityName, baseEntity);
      }
    })
  };
};

// Export singleton with fallback enabled
export const db = createapiClientWithFallback(apiClient);

// Utility to manually force Elasticsearch mode
export const forceElasticsearchMode = (enabled = true) => {
  apiIsDown = enabled;
  lastCheckTime = Date.now();
  console.log(`🔧 Elasticsearch mode: ${enabled ? 'FORCED ON' : 'AUTO'}`);
};

// Get current mode
export const getCurrentMode = () => apiIsDown ? 'Elasticsearch (Fallback)' : 'apiClient (Primary)';

// Check and restore apiClient if it's back online
export const tryRestoreapiClient = async () => {
  if (apiIsDown) {
    const isHealthy = await checkapiClientHealth();
    if (isHealthy) {
      console.log('✅ apiClient is back online, restored to primary database');
    }
  }
  return !apiIsDown;
};
