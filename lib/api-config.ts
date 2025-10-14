// Client-side API configuration for Next.js
// Using a pattern that works with Next.js build process

// Get environment variables with fallbacks
const getEnvVar = (key: string, fallback: string) => {
  if (typeof window !== "undefined") {
    // Client-side: access from window.__ENV or fallback
    return (window as any).__ENV?.[key] || fallback;
  }
  // Server-side: access from process.env
  return (globalThis as any).process?.env?.[key] || fallback;
};

export const API_CONFIG = {
  BACKEND_URL: getEnvVar(
    "NEXT_PUBLIC_API_URL",
    "https://codejoin-backend.onrender.com"
  ),
  SOCKET_URL: getEnvVar(
    "NEXT_PUBLIC_SOCKET_URL",
    "https://codejoin-backend.onrender.com"
  ),
  SUPABASE_URL: getEnvVar("NEXT_PUBLIC_SUPABASE_URL", ""),
  SUPABASE_ANON_KEY: getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY", ""),
  SITE_URL: getEnvVar(
    "NEXT_PUBLIC_SITE_URL",
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000"
  ),
};

// Helper function to get API URLs with fallback
export const getApiUrl = (path: string) => {
  const baseUrl = API_CONFIG.BACKEND_URL.replace(/\/$/, "");
  return `${baseUrl}${path}`;
};

// Helper function to get Socket.IO URL
export const getSocketUrl = () => {
  return API_CONFIG.SOCKET_URL.replace(/\/$/, "");
};

// Helper function to get site URL for CORS
export const getSiteUrl = () => {
  return API_CONFIG.SITE_URL.replace(/\/$/, "");
};

// Helper function to check if we're in production
export const isProduction = () => {
  return getEnvVar("NODE_ENV", "development") === "production";
};

// Helper function to get WebSocket URL with proper protocol
export const getWebSocketUrl = () => {
  const socketUrl = getSocketUrl();
  // Convert HTTP to HTTPS for WebSocket connections in production
  if (isProduction() && socketUrl.startsWith("http://")) {
    return socketUrl.replace("http://", "wss://");
  }
  if (isProduction() && socketUrl.startsWith("https://")) {
    return socketUrl.replace("https://", "wss://");
  }
  return socketUrl;
};
