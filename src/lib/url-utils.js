/**
 * URL parameter utilities for consistent state persistence and sharing
 */

/**
 * Parse URL search parameters into an object
 * @returns {Object} Query parameters
 */
export const getUrlParams = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const params = {};
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }
  return params;
};

/**
 * Get a specific URL parameter
 * @param {string} key - Parameter key
 * @returns {string|null} Parameter value
 */
export const getUrlParam = (key) => {
  return new URLSearchParams(window.location.search).get(key);
};

/**
 * Set URL parameters without page reload
 * @param {Object} params - Parameters to set
 */
export const setUrlParams = (params) => {
  const searchParams = new URLSearchParams(window.location.search);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      searchParams.delete(key);
    } else {
      searchParams.set(key, value);
    }
  });

  const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
  window.history.replaceState({ path: newUrl }, '', newUrl);
};

/**
 * Clear specific URL parameters
 * @param {Array<string>} keys - Parameter keys to remove
 */
export const clearUrlParams = (keys = []) => {
  const searchParams = new URLSearchParams(window.location.search);
  keys.forEach(key => searchParams.delete(key));
  const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
  window.history.replaceState({ path: newUrl }, '', newUrl);
};