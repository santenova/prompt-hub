import { useEffect, useRef } from 'react';

/**
 * Hook to get the previous value of a variable
 * @param {*} value - The value to track
 * @returns {*} The previous value
 */
export function usePrevious(value) {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}