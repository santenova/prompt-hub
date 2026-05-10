/**
 * Enhanced apiClient Client with Advanced Logging
 * Wraps all apiClient SDK methods with detailed console logging
 */

import { apiClient as originalapiClient } from '@/apis/client';
import advancedLogger from './advancedLogger';

// Wrap backend functions
const wrapFunctions = (functionsObj) => {
  return {
    invoke: async (functionName, payload = {}) => {
      const startTime = performance.now();
      
      try {
        const result = await functionsObj.invoke(functionName, payload);
        const duration = Math.round(performance.now() - startTime);
        
        advancedLogger.logFunctionCall(functionName, payload, result, duration);
        return result;
      } catch (error) {
        const duration = Math.round(performance.now() - startTime);
        advancedLogger.logFunctionCall(functionName, payload, null, duration, error);
        throw error;
      }
    }
  };
};

// Wrap entity operations
const wrapEntity = (entityName, entityObj) => {
  const wrappedOperations = {};
  
  const operations = ['list', 'filter', 'create', 'update', 'delete', 'bulkCreate', 'get', 'schema'];
  
  operations.forEach(op => {
    if (typeof entityObj[op] === 'function') {
      wrappedOperations[op] = async (...args) => {
        const startTime = performance.now();
        
        try {
          const result = await entityObj[op](...args);
          const duration = Math.round(performance.now() - startTime);
          
          advancedLogger.logEntityOperation(entityName, op, args, result, duration);
          return result;
        } catch (error) {
          const duration = Math.round(performance.now() - startTime);
          advancedLogger.logEntityOperation(entityName, op, args, null, duration, error);
          throw error;
        }
      };
    }
  });
  
  // Pass through subscribe without logging (to avoid noise)
  if (typeof entityObj.subscribe === 'function') {
    wrappedOperations.subscribe = entityObj.subscribe.bind(entityObj);
  }
  
  return wrappedOperations;
};

// Wrap entities
const wrapEntities = (entitiesObj) => {
  const wrapped = {};
  
  // Get all entity names dynamically
  const entityNames = Object.keys(entitiesObj);
  
  entityNames.forEach(entityName => {
    wrapped[entityName] = wrapEntity(entityName, entitiesObj[entityName]);
  });
  
  return wrapped;
};

// Wrap auth methods
const wrapAuth = (authObj) => {
  return {
    me: async () => {
      try {
        const result = await authObj.me();
        advancedLogger.logAuthActivity('me', {}, result);
        return result;
      } catch (error) {
        advancedLogger.logAuthActivity('me', {}, null, error);
        throw error;
      }
    },
    
    updateMe: async (data) => {
      try {
        const result = await authObj.updateMe(data);
        advancedLogger.logAuthActivity('updateMe', data, result);
        return result;
      } catch (error) {
        advancedLogger.logAuthActivity('updateMe', data, null, error);
        throw error;
      }
    },
    
    logout: (redirectUrl) => {
      advancedLogger.logAuthActivity('logout', { redirectUrl });
      return authObj.logout(redirectUrl);
    },
    
    redirectToLogin: (nextUrl) => {
      advancedLogger.logAuthActivity('redirectToLogin', { nextUrl });
      return authObj.redirectToLogin(nextUrl);
    },
    
    isAuthenticated: async () => {
      try {
        const result = await authObj.isAuthenticated();
        advancedLogger.logAuthActivity('isAuthenticated', {}, { authenticated: result });
        return result;
      } catch (error) {
        advancedLogger.logAuthActivity('isAuthenticated', {}, null, error);
        throw error;
      }
    }
  };
};

// Wrap integrations
const wrapIntegrations = (integrationsObj) => {
  const wrapped = {};
  
  // Get all integration packages
  const packages = Object.keys(integrationsObj);
  
  packages.forEach(packageName => {
    wrapped[packageName] = {};
    const endpoints = Object.keys(integrationsObj[packageName]);
    
    endpoints.forEach(endpoint => {
      wrapped[packageName][endpoint] = async (params) => {
        const startTime = performance.now();
        
        try {
          const result = await integrationsObj[packageName][endpoint](params);
          const duration = Math.round(performance.now() - startTime);
          
          advancedLogger.logIntegrationCall(packageName, endpoint, params, result, duration);
          return result;
        } catch (error) {
          const duration = Math.round(performance.now() - startTime);
          advancedLogger.logIntegrationCall(packageName, endpoint, params, null, duration, error);
          throw error;
        }
      };
    });
  });
  
  return wrapped;
};

// Wrap analytics
const wrapAnalytics = (analyticsObj) => {
  return {
    track: (event) => {
      advancedLogger.logAnalyticsEvent(event.eventName, event.properties);
      return analyticsObj.track(event);
    }
  };
};

// Wrap users
const wrapUsers = (usersObj) => {
  return {
    inviteUser: async (email, role) => {
      try {
        const result = await usersObj.inviteUser(email, role);
        advancedLogger.logUserInvite(email, role);
        return result;
      } catch (error) {
        advancedLogger.logUserInvite(email, role, error);
        throw error;
      }
    }
  };
};

// Create enhanced apiClient client
export const apiClient = {
  entities: wrapEntities(originalapiClient.entities),
  functions: wrapFunctions(originalapiClient.functions),
  auth: wrapAuth(originalapiClient.auth),
  integrations: wrapIntegrations(originalapiClient.integrations),
  analytics: wrapAnalytics(originalapiClient.analytics),
  users: wrapUsers(originalapiClient.users)
};

// Log initial message
console.log('%c✨ Enhanced apiClient Client Active', 'background: #6366f1; color: white; padding: 8px; border-radius: 4px; font-weight: bold');
console.log('%cAll API interactions are being logged with detailed information', 'color: #8b5cf6; font-style: italic');
