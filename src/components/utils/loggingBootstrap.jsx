/**
 * Logging Bootstrap
 * Initializes advanced logging based on user preference
 */

// Check if logging is enabled in localStorage
if (typeof window !== 'undefined') {
  const isLoggingEnabled = localStorage.getItem('advancedLoggingEnabled') === 'true';
  
  if (isLoggingEnabled) {
    // Import and initialize the advanced logger
    import('./advancedLogger').then(module => {
      const logger = module.default;
      console.log('%c🔥 Advanced Activity Logger Ready', 'background: #10b981; color: white; padding: 8px; border-radius: 4px; font-weight: bold');
      
      // Store logger globally for easy access
      window.activityLogger = logger;
    });
    
    // Replace the apiClient import with the logging wrapper
    import('./apiClientWithLogging').then(module => {
      window.apiClient = module.client;
      console.log('%c✅ Enhanced api Client Loaded', 'background: #3b82f6; color: white; padding: 8px; border-radius: 4px; font-weight: bold');
    });
  }
}

export {};
