// Centralized Ollama settings management

const OLLAMA_SETTINGS_KEY = 'ollama_settings_v1';

const DEFAULT_SETTINGS = {
  useOllama: true,
  endpoints: ['/proxy'],
  selectedEndpoint: '/proxy',
  selectedModel: '',
  temperature: 0.7,
  top_p: 0.9,
  max_tokens: 2048,
  top_k: 40,
  repeat_penalty: 1.1,
};

export const getOllamaSettings = () => {
  try {
    const saved = localStorage.getItem(OLLAMA_SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      
      // Auto-correct old endpoints
      if (parsed.selectedEndpoint && parsed.selectedEndpoint.includes('hq.ngrok.dev')) {
        parsed.selectedEndpoint = '/proxy';
      }
      if (parsed.endpoints) {
        parsed.endpoints = parsed.endpoints.map(e => 
          e.includes('hq.ngrok.dev') ? '/proxy' : e
        );
      }
      
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load Ollama settings:', error);
  }
  return DEFAULT_SETTINGS;
};

export const saveOllamaSettings = (settings) => {
  try {
    localStorage.setItem(OLLAMA_SETTINGS_KEY, JSON.stringify(settings));
    // Dispatch custom event for same-window updates
    window.dispatchEvent(new CustomEvent('ollama_settings_updated', { detail: settings }));
    return true;
  } catch (error) {
    console.error('Failed to save Ollama settings:', error);
    return false;
  }
};

export const isOllamaEnabled = () => {
  const settings = getOllamaSettings();
  return settings.useOllama && settings.selectedEndpoint && settings.selectedModel;
};

export const getOllamaEndpoint = () => {
  const settings = getOllamaSettings();
  return settings.selectedEndpoint;
};

export const getOllamaModel = () => {
  const settings = getOllamaSettings();
  return settings.selectedModel;
};

export const getOllamaParameters = () => {
  const settings = getOllamaSettings();
  return {
    temperature: settings.temperature,
    top_p: settings.top_p,
    max_tokens: settings.max_tokens,
    top_k: settings.top_k,
    repeat_penalty: settings.repeat_penalty,
  };
};

// Helper to make Ollama chat completions calls via proxy
export const callOllamaAPI = async (messages, extraParams = {}) => {
  const settings = getOllamaSettings();
  const { apiClient } = await import('@/apis/client');
  const response = await apiClient.functions.invoke('ollamaProxy', {
    endpoint: settings.selectedEndpoint,
    action: 'chat',
    model: settings.selectedModel,
    messages,
    options: {
      stream: extraParams.stream !== undefined ? extraParams.stream : true,
      temperature: settings.temperature,
      top_p: settings.top_p,
      max_tokens: settings.max_tokens,
    }
  });
  return response;
};

// Helper to list available models via proxy
export const listOllamaModels = async (endpoint) => {
  const { apiClient } = await import('@/apis/client');
  const { data } = await apiClient.functions.invoke('ollamaProxy', { endpoint, action: 'list-models' });
  return (data.models || []).map(m => ({ name: m.id, ...m }));
};
