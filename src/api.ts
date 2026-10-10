export const PRIMARY_API_URL = (
  import.meta.env.VITE_PRIMARY_API_URL || 
  import.meta.env.PRIMARY_API_URL || 
  import.meta.env.VITE_API_BASE_URL || 
  'https://saree-store-backend-ex17.onrender.com'
).replace(/\/$/, '');

export const SECONDARY_API_URL = (
  import.meta.env.VITE_SECONDARY_API_URL || 
  import.meta.env.SECONDARY_API_URL || 
  'https://saree-store-backend.vercel.app'
).replace(/\/$/, '');

export const API_BASE_URL = PRIMARY_API_URL;

// Silent background pre-warm to wake up serverless backend instance immediately on site load
if (typeof window !== 'undefined') {
  setTimeout(() => {
    fetch(`${PRIMARY_API_URL}/api/categories/`, { method: 'HEAD', credentials: 'include' }).catch(() => {});
  }, 0);
}

function isSecondaryEndpoint(endpoint: string): boolean {
  const secondaryKeywords = [
    '/verify-otp',
    '/resend-otp',
    '/forgot-password',
    '/verify-forgot-otp',
    '/reset-password',
    '/change-mobile',
    '/change-email',
    '/confirm-change',
    '/register',
    '/consultation'
  ];
  return secondaryKeywords.some(keyword => endpoint.includes(keyword));
}

interface CacheEntry {
  data: any;
  timestamp: number;
}

const apiCache = new Map<string, CacheEntry>();
const pendingRequests = new Map<string, Promise<any>>();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds for fast backend sync

export function clearApiCache() {
  apiCache.clear();
  pendingRequests.clear();
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const isNoCache = options.cache === 'no-cache' || options.cache === 'no-store' || options.cache === 'reload';
  const isCacheable = method === 'GET' && !isNoCache;
  const cacheKey = `${endpoint}`;

  if (isCacheable) {
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey);
    }
  } else if (!isCacheable && method !== 'GET') {
    // Clear GET cache when mutations occur
    apiCache.clear();
  }

  const token = localStorage.getItem('access');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  } as Record<string, string>;

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const baseUrl = isSecondaryEndpoint(endpoint) ? SECONDARY_API_URL : PRIMARY_API_URL;

  const requestPromise = (async () => {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        credentials: 'include', // Ensures HttpOnly cookies are always attached
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMsg = `API error: ${response.status}`;
        let isTokenError = false;

        try {
          const errData = await response.json();
          
          if (errData.code === 'token_not_valid') {
            isTokenError = true;
          }
          
          if (errData.error) {
            errorMsg = typeof errData.error === 'string' ? errData.error : (Array.isArray(errData.error) ? errData.error[0] : JSON.stringify(errData.error));
          } else if (errData.detail) {
            errorMsg = errData.detail;
            if (typeof errData.detail === 'string' && errData.detail.includes('token not valid')) {
              isTokenError = true;
            }
          } else if (typeof errData === 'object' && Object.keys(errData).length > 0) {
            const val = Object.values(errData)[0];
            if (Array.isArray(val)) {
              errorMsg = val[0];
            } else if (typeof val === 'string') {
              errorMsg = val;
            } else {
              errorMsg = JSON.stringify(val);
            }
          }
        } catch (e) {}

        // Handle expired token globally if not a silent check
        if (response.status === 401 && isTokenError) {
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          if (endpoint !== '/api/auth/me/') {
            window.location.reload();
            return;
          }
        }

        throw new Error(errorMsg);
      }

      const data = await response.json();
      if (isCacheable) {
        apiCache.set(cacheKey, { data, timestamp: Date.now() });
      }
      return data;
    } finally {
      if (isCacheable) {
        pendingRequests.delete(cacheKey);
      }
    }
  })();

  if (isCacheable) {
    pendingRequests.set(cacheKey, requestPromise);
  }

  return requestPromise;
}