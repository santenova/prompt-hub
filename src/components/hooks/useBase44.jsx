/**
 * Hook to use Base44 client with optional logging
 */
import { useState, useEffect } from 'react';
import { base44 as originalBase44 } from '@/api/base44Client';

export function useBase44() {
  const [client, setClient] = useState(originalBase44);

  useEffect(() => {
    const isLoggingEnabled = localStorage.getItem('advancedLoggingEnabled') === 'true';
    
    if (isLoggingEnabled) {
      // Dynamically import the logging wrapper
      import('../utils/base44ClientWithLogging').then(module => {
        setClient(module.base44);
      }).catch(() => {
        // Fallback to original client if loading fails
        setClient(originalBase44);
      });
    } else {
      setClient(originalBase44);
    }
  }, []);

  return client;
}