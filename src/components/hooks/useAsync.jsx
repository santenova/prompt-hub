import { useState, useEffect, useRef } from 'react';

/**
 * Hook for handling async operations with loading/error states
 * @param {Function} asyncFunction - Async function to execute
 * @param {boolean} immediate - Execute immediately on mount (default: true)
 * @param {Array} dependencies - Dependency array for re-execution
 * @returns {Object} - { data, loading, error }
 */
export function useAsync(asyncFunction, immediate = true, dependencies = []) {
  const [state, setState] = useState({
    data: null,
    loading: immediate,
    error: null,
  });

  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const response = await asyncFunction();
      if (isMountedRef.current) {
        setState({ data: response, loading: false, error: null });
      }
    } catch (error) {
      if (isMountedRef.current) {
        setState({ data: null, loading: false, error });
      }
    }
  };

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, dependencies);

  return { ...state, execute };
}