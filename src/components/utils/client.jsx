
import { createClient } from '@apis/client';

// Experimental Elasticsearch Configuration
export const ENABLE_ELASTICSEARCH = true;

// Initialize apiClient client with app credentials
const appId = window.APP_ID || '6901f73a3178f5670b5f2458';
const appOwner = window.APP_OWNER;

export const apiClient = createClient({
  appId,
  appOwner
});
