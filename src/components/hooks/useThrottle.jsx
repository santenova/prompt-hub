import { useState, useEffect, useRef } from 'react';

/**
 * Hook for throttling values - useful for scroll, resize events
 * @param {*} value - The value to throttle
 * @param {number} interval - Interval in milliseconds (default: 500ms)
 * @returns {*} The throttled value
 */
export function useThrottle(value, interval = 500) {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastUpdatedRef = useRef(null);

  useEffect(() => {
    const now = Date.now();

    if (lastUpdatedRef.current && now >= lastUpdatedRef.current + interval) {
      lastUpdatedRef.current = now;
      setThrottledValue(value);
    } else {
      const timer = setTimeout(() => {
        lastUpdatedRef.current = now;
        setThrottledValue(value);
      }, interval);

      return () => clearTimeout(timer);
    }
  }, [value, interval]);

  return throttledValue;
}