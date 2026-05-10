import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/apis/client';

let cachedUser = null;
let cachePromise = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 1 minute

export function useAuthUser() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Return cached user if still valid
        const now = Date.now();
        if (cachedUser && (now - lastFetchTime) < CACHE_DURATION) {
          if (isMountedRef.current) {
            setCurrentUser(cachedUser);
            setIsLoading(false);
          }
          return;
        }

        // If a fetch is already in progress, wait for it
        if (cachePromise) {
          const user = await cachePromise;
          if (isMountedRef.current) {
            setCurrentUser(user);
            setIsLoading(false);
          }
          return;
        }

        // Start new fetch
        cachePromise = (async () => {
          try {
            const isAuth = await apiClient.auth.isAuthenticated();
            if (!isAuth) {
              cachedUser = null;
              lastFetchTime = Date.now();
              return null;
            }
            
            const user = await apiClient.auth.me();
            cachedUser = user;
            lastFetchTime = Date.now();
            return user;
          } catch (error) {
            console.error('Auth error:', error);
            cachedUser = null;
            lastFetchTime = Date.now();
            return null;
          } finally {
            cachePromise = null;
          }
        })();

        const user = await cachePromise;
        if (isMountedRef.current) {
          setCurrentUser(user);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Auth error:', error);
        if (isMountedRef.current) {
          setCurrentUser(null);
          setIsLoading(false);
        }
      }
    };

    fetchUser();
  }, []);

  return { currentUser, isLoading };
}
