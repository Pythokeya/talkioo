// Configuration for Netlify deployment
// This file contains settings for connecting to the backend when deployed to Netlify

// Get the API URL from environment variables
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Configure WebSocket connection
export const getWebSocketUrl = (): string => {
  // Determine WebSocket protocol based on current protocol
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  
  // If API URL is provided via environment variable, use it for WebSocket connection
  if (import.meta.env.VITE_API_URL) {
    const baseUrl = import.meta.env.VITE_API_URL
      .replace('https://', wsProtocol + '//')
      .replace('http://', wsProtocol + '//');
    return `${baseUrl}/ws`;
  }
  
  // Fallback to current host (for local development)
  return `${wsProtocol}//${window.location.host}/ws`;
};

// Helper function to join API URL with endpoint
export const apiUrl = (endpoint: string): string => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // Join base URL with endpoint
  return API_BASE_URL 
    ? `${API_BASE_URL.replace(/\/+$/, '')}/${cleanEndpoint}`
    : `/${cleanEndpoint}`;
};

// Function to determine if we're in a Netlify environment
export const isNetlifyEnvironment = (): boolean => {
  return !!import.meta.env.VITE_API_URL;
};