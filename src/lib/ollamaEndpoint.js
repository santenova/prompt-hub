/**
 * Returns the Ollama base endpoint based on the current hostname.
 * - localhost / 127.0.0.1 → /proxy  (Vite dev-server proxy)
 * - everything else        → the public ngrok URL
 */
export const getOllamaEndpoint = () => {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return '/proxy';
  }
  return 'https://christy-ramentaceous-verbatim.ngrok-free.dev';
};