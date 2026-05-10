/**
 * Advanced Activity Logger for Console
 * Tracks backend function calls, API interactions, and user activities
 */

class AdvancedLogger {
  constructor() {
    this.logStyles = {
      function: 'background: #9333ea; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold',
      notification: 'background: #f59e0b; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold',
      entity: 'background: #3b82f6; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold',
      auth: 'background: #10b981; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold',
      integration: 'background: #ec4899; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold',
      connector: 'background: #8b5cf6; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold',
      error: 'background: #ef4444; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold',
      success: 'background: #22c55e; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold',
    };
    
    this.sessionStart = Date.now();
    this.callCount = 0;
  }

  getTimestamp() {
    const elapsed = ((Date.now() - this.sessionStart) / 1000).toFixed(2);
    return `[+${elapsed}s]`;
  }

  logGroup(title, style, data) {
    console.groupCollapsed(`%c${title}`, style, this.getTimestamp());
    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          console.log(`${key}:`, value);
        } else {
          console.log(`${key}: ${value}`);
        }
      });
    }
    console.trace('Call Stack');
    console.groupEnd();
  }

  // Backend Function Call Logger
  logFunctionCall(functionName, payload, result, duration, error = null) {
    this.callCount++;
    
    if (error) {
      this.logGroup(
        `🔴 Function Call Failed: ${functionName}`,
        this.logStyles.error,
        {
          'Call #': this.callCount,
          'Function': functionName,
          'Payload': payload,
          'Duration': `${duration}ms`,
          'Error': error.message || error,
          'Stack': error.stack
        }
      );
    } else {
      this.logGroup(
        `⚡ Function Called: ${functionName}`,
        this.logStyles.function,
        {
          'Call #': this.callCount,
          'Function': functionName,
          'Payload': payload,
          'Result': result,
          'Duration': `${duration}ms`,
          'Success': '✓'
        }
      );
    }
  }

  // Notification API Logger
  logNotificationActivity(action, data, result = null, error = null) {
    this.callCount++;
    
    const icon = {
      'create': '🔔',
      'list': '📋',
      'update': '✏️',
      'delete': '🗑️',
      'mark_read': '✅',
      'mark_unread': '📬'
    }[action] || '🔔';

    if (error) {
      this.logGroup(
        `${icon} Notification ${action} Failed`,
        this.logStyles.error,
        {
          'Call #': this.callCount,
          'Action': action,
          'Data': data,
          'Error': error.message || error
        }
      );
    } else {
      this.logGroup(
        `${icon} Notification ${action}`,
        this.logStyles.notification,
        {
          'Call #': this.callCount,
          'Action': action,
          'Data': data,
          'Result': result,
          'Status': '✓'
        }
      );
    }
  }

  // Entity Operations Logger
  logEntityOperation(entityName, operation, params, result, duration, error = null) {
    this.callCount++;
    
    const icon = {
      'list': '📋',
      'filter': '🔍',
      'create': '➕',
      'update': '✏️',
      'delete': '🗑️',
      'bulkCreate': '📦',
      'get': '🔍',
      'schema': '📐'
    }[operation] || '📊';

    if (error) {
      this.logGroup(
        `${icon} ${entityName}.${operation}() Failed`,
        this.logStyles.error,
        {
          'Call #': this.callCount,
          'Entity': entityName,
          'Operation': operation,
          'Parameters': params,
          'Duration': `${duration}ms`,
          'Error': error.message || error
        }
      );
    } else {
      this.logGroup(
        `${icon} ${entityName}.${operation}()`,
        this.logStyles.entity,
        {
          'Call #': this.callCount,
          'Entity': entityName,
          'Operation': operation,
          'Parameters': params,
          'Records': Array.isArray(result) ? result.length : 1,
          'Result': result,
          'Duration': `${duration}ms`,
          'Status': '✓'
        }
      );
    }
  }

  // Authentication Logger
  logAuthActivity(action, data, result = null, error = null) {
    this.callCount++;
    
    const icon = {
      'me': '👤',
      'login': '🔓',
      'logout': '🔒',
      'updateMe': '✏️',
      'isAuthenticated': '🔐',
      'redirectToLogin': '🚪'
    }[action] || '🔐';

    if (error) {
      this.logGroup(
        `${icon} Auth ${action} Failed`,
        this.logStyles.error,
        {
          'Call #': this.callCount,
          'Action': action,
          'Data': data,
          'Error': error.message || error
        }
      );
    } else {
      this.logGroup(
        `${icon} Auth ${action}`,
        this.logStyles.auth,
        {
          'Call #': this.callCount,
          'Action': action,
          'User': result?.email || 'N/A',
          'Role': result?.role || 'N/A',
          'Data': data,
          'Status': '✓'
        }
      );
    }
  }

  // Integration Call Logger
  logIntegrationCall(packageName, endpoint, params, result, duration, error = null) {
    this.callCount++;
    
    if (error) {
      this.logGroup(
        `🔴 Integration Failed: ${packageName}.${endpoint}`,
        this.logStyles.error,
        {
          'Call #': this.callCount,
          'Package': packageName,
          'Endpoint': endpoint,
          'Parameters': params,
          'Duration': `${duration}ms`,
          'Error': error.message || error
        }
      );
    } else {
      this.logGroup(
        `🔌 Integration: ${packageName}.${endpoint}`,
        this.logStyles.integration,
        {
          'Call #': this.callCount,
          'Package': packageName,
          'Endpoint': endpoint,
          'Parameters': params,
          'Result': result,
          'Duration': `${duration}ms`,
          'Status': '✓'
        }
      );
    }
  }

  // Connector Activity Logger
  logConnectorActivity(action, type, data, error = null) {
    this.callCount++;
    
    if (error) {
      this.logGroup(
        `🔴 Connector Failed: ${type}`,
        this.logStyles.error,
        {
          'Call #': this.callCount,
          'Action': action,
          'Type': type,
          'Data': data,
          'Error': error.message || error
        }
      );
    } else {
      this.logGroup(
        `🔗 Connector: ${type}`,
        this.logStyles.connector,
        {
          'Call #': this.callCount,
          'Action': action,
          'Type': type,
          'Data': data,
          'Status': '✓'
        }
      );
    }
  }

  // Analytics Event Logger
  logAnalyticsEvent(eventName, properties = {}) {
    this.callCount++;
    
    this.logGroup(
      `📊 Analytics Event: ${eventName}`,
      this.logStyles.entity,
      {
        'Call #': this.callCount,
        'Event': eventName,
        'Properties': properties,
        'Timestamp': new Date().toISOString()
      }
    );
  }

  // User Invite Logger
  logUserInvite(email, role, error = null) {
    this.callCount++;
    
    if (error) {
      this.logGroup(
        `🔴 User Invite Failed: ${email}`,
        this.logStyles.error,
        {
          'Call #': this.callCount,
          'Email': email,
          'Role': role,
          'Error': error.message || error
        }
      );
    } else {
      this.logGroup(
        `📧 User Invited: ${email}`,
        this.logStyles.success,
        {
          'Call #': this.callCount,
          'Email': email,
          'Role': role,
          'Status': '✓'
        }
      );
    }
  }

  // Generic Activity Logger
  logActivity(title, description, data = {}, type = 'info') {
    this.callCount++;
    
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    
    const style = {
      info: this.logStyles.entity,
      success: this.logStyles.success,
      warning: this.logStyles.notification,
      error: this.logStyles.error
    }[type];

    this.logGroup(
      `${icons[type]} ${title}`,
      style,
      {
        'Call #': this.callCount,
        'Description': description,
        ...data
      }
    );
  }

  // Session Summary
  logSessionSummary() {
    const duration = ((Date.now() - this.sessionStart) / 1000).toFixed(2);
    
    console.log('%c📊 SESSION SUMMARY', 'background: #1e293b; color: #fbbf24; padding: 10px; font-size: 14px; font-weight: bold');
    console.table({
      'Total API Calls': this.callCount,
      'Session Duration': `${duration}s`,
      'Avg Call Rate': `${(this.callCount / duration).toFixed(2)} calls/sec`,
      'Session Started': new Date(this.sessionStart).toLocaleTimeString()
    });
  }
}

// Create singleton instance
const advancedLogger = new AdvancedLogger();

// Log session start
console.log('%c🚀 Advanced Activity Logger Initialized', 'background: #4f46e5; color: white; padding: 10px; font-size: 14px; font-weight: bold');
console.log('%cAll API calls, backend functions, and user activities will be logged with detailed information', 'color: #6366f1; font-size: 12px');

// Log session summary on page unload
window.addEventListener('beforeunload', () => {
  advancedLogger.logSessionSummary();
});

export default advancedLogger;