/**
 * Hook to use apiClient client with optional logging
 */
import { useState, useEffect } from 'react';
import { apiClient as originalapiClient } from '@/apis/client';

export function useapiClient() {
  const [client, setClient] = useState(originalapiClient);

  useEffect(() => {
    const isLoggingEnabled = localStorage.getItem('advancedLoggingEnabled') === 'true';
    
    if (isLoggingEnabled) {
      // Dynamically import the logging wrapper
      import('../utils/apiClientWithLogging').then(module => {
        setClient(module.apiClient);
      }).catch(() => {
        // Fallback to original client if loading fails
        setClient(originalapiClient);
      });
    } else {
      setClient(originalapiClient);
    }
  }, []);

  return client;
}
