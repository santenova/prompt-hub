/**
 * Hook to use client client with optional logging
 */
import { useState, useEffect } from 'react';
import { client as originalclient } from "@/apis/client";

export function useclient() {
  const [client, setClient] = useState(originalclient);

  useEffect(() => {
    const isLoggingEnabled = localStorage.getItem('advancedLoggingEnabled') === 'true';
    
    if (isLoggingEnabled) {
      // Dynamically import the logging wrapper
      import('../utils/clientClientWithLogging').then(module => {
        setClient(module.client);
      }).catch(() => {
        // Fallback to original client if loading fails
        setClient(originalclient);
      });
    } else {
      setClient(originalclient);
    }
  }, []);

  return client;
}
