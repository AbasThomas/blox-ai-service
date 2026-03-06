import { useBloxStore } from './store/app-store';

const BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3333'}/v1`;

// Singleton refresh promise — prevents multiple simultaneous refresh calls
let _tokenRefreshPromise: Promise<string | null> | null = null;
let _sessionInvalidated = false;

const PROTECTED_API_PREFIXES = [
  '/assets',
  '/billing',
  '/analytics',
  '/publish',
  '/collaboration',
  '/integrations',
  '/notifications',
  '/onboarding',
  '/scanner',
] as const;

function isProtectedPath(path: string): boolean {
  return PROTECTED_API_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function invalidateSessionOnce() {
  if (typeof window === 'undefined' || _sessionInvalidated) return;
  _sessionInvalidated = true;
  useBloxStore.getState().logout();
  if (!window.location.pathname.startsWith('/login')) {
    window.location.replace('/login');
  }
}

function parseJwtExpiryEpochMs(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const decoded = atob(padded);
    const parsed = JSON.parse(decoded) as { exp?: number };
    if (typeof parsed.exp !== 'number') return null;
    return parsed.exp * 1000;
  } catch {
    return null;
  }
}

function shouldRefreshAccessToken(token: string | null): boolean {
  if (!token) return true;
  const expiry = parseJwtExpiryEpochMs(token);
  if (!expiry) return true;
  const now = Date.now();
  const safetyWindowMs = 30_000;
  return expiry - now <= safetyWindowMs;
}

async function tryRefreshToken(): Promise<string | null> {
  if (_tokenRefreshPromise) return _tokenRefreshPromise;
  _tokenRefreshPromise = (async () => {
    try {
      const rt =
        (typeof window !== 'undefined' ? localStorage.getItem('blox_refresh_token') : null) ??
        useBloxStore.getState().refreshToken;
      if (!rt) return null;
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { accessToken?: string; refreshToken?: string };
      if (!data.accessToken) return null;
      if (typeof window !== 'undefined') {
        localStorage.setItem('blox_access_token', data.accessToken);
        if (data.refreshToken) localStorage.setItem('blox_refresh_token', data.refreshToken);
      }
      useBloxStore.setState({
        accessToken: data.accessToken,
        ...(data.refreshToken ? { refreshToken: data.refreshToken } : {}),
      });
      _sessionInvalidated = false;
      return data.accessToken;
    } catch {
      return null;
    } finally {
      _tokenRefreshPromise = null;
    }
  })();
  return _tokenRefreshPromise;
}

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;

  const token = localStorage.getItem('blox_access_token');
  if (token) return token;

  const storeToken = useBloxStore.getState().accessToken;
  if (storeToken) {
    localStorage.setItem('blox_access_token', storeToken);
    return storeToken;
  }

  return null;
}

function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const requiresAuth = isProtectedPath(path);
  let accessToken = getAccessToken();

  if (requiresAuth && typeof window !== 'undefined' && shouldRefreshAccessToken(accessToken)) {
    const refreshed = await tryRefreshToken();
    if (!refreshed) {
      invalidateSessionOnce();
      throw new Error('Session expired. Please sign in again.');
    }
    accessToken = refreshed;
  }

  const headers = new Headers(options?.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    let errorMessage = `Request failed: ${response.status}`;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.message ?? errorMessage;
    } catch {
      // ignore json parse error
    }

    if (response.status === 401 && typeof window !== 'undefined' && requiresAuth) {
      // Try to silently refresh the access token, then retry
      const newToken = await tryRefreshToken();
      if (newToken) {
        const retryRes = await fetch(`${BASE_URL}${path}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${newToken}`,
            ...(options?.headers ?? {}),
          },
          cache: 'no-store',
        });
        if (retryRes.ok) return retryRes.json() as Promise<T>;
      }
      // Refresh failed — clear session and redirect once
      invalidateSessionOnce();
    }

    throw new Error(errorMessage);
  }

  if (requiresAuth) {
    _sessionInvalidated = false;
  }

  return response.json() as Promise<T>;
}

async function get<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: 'GET' });
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

async function patch<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'PATCH',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

async function del<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: 'DELETE' });
}

// Auth
export const authApi = {
  signup: (data: { name?: string; fullName?: string; email: string; password: string; persona: string }) =>
    post('/auth/signup', data),
  login: (data: { email: string; password: string; rememberMe?: boolean }) =>
    post('/auth/login', data),
  refresh: (token: string) => post('/auth/refresh', { refreshToken: token }),
  me: () => get('/auth/me'),
  forgotPassword: (email: string) => post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    post('/auth/reset-password', { token, password }),
  setupMfa: () => get('/auth/mfa/setup'),
  verifyMfa: (code: string, challengeId: string) =>
    post('/auth/mfa/verify', { code, challengeId }),
};

// Assets
export const assetsApi = {
  list: (type?: string) => get(`/assets${type ? `?type=${type}` : ''}`),
  listInProgress: () => get('/assets/in-progress'),
  create: (data: unknown) => post('/assets', data),
  getById: (id: string) => get(`/assets/${id}`),
  update: (id: string, data: unknown) => patch(`/assets/${id}`, data),
  delete: (id: string) => del(`/assets/${id}`),
  generate: (id: string, prompt?: string) => post(`/assets/${id}/generate`, { prompt }),
  suggestSeo: (id: string) => post(`/assets/${id}/seo/suggest`, {}),
  generateOgImage: (id: string) => post(`/assets/${id}/seo/og-image`, {}),
  duplicate: (id: string, data?: unknown) => post(`/assets/${id}/duplicate`, data ?? {}),
  listVersions: (id: string) => get(`/assets/${id}/versions`),
  saveVersion: (id: string, data: unknown) => post(`/assets/${id}/versions`, data),
  restoreVersion: (id: string, versionId: string) => post(`/assets/${id}/versions/${versionId}/restore`, {}),
};

// Billing
export const billingApi = {
  getPlans: () => get('/billing/plans'),
  createCheckout: (data: unknown) => post('/billing/checkout', data),
  verifyPayment: (reference: string) => post('/billing/verify', { reference }),
  getSubscription: () => get('/billing/subscription'),
  cancel: (data: unknown) => post('/billing/cancel', data),
};

// Templates
export const templatesApi = {
  list: (params?: Record<string, string>) =>
    get(`/templates${params ? '?' + new URLSearchParams(params) : ''}`),
  getById: (id: string) => get(`/templates/${id}`),
  fork: (id: string) => post(`/templates/${id}/fork`, {}),
  listMarketplace: () => get('/templates/marketplace'),
};

// Scanner
export const scannerApi = {
  scan: (data: unknown) => post('/scanner/scan', data),
  atsScore: (data: unknown) => post('/scanner/ats', data),
};

// Analytics
export const analyticsApi = {
  getAssetAnalytics: (id: string, params?: Record<string, string>) =>
    get(`/analytics/${id}${params ? '?' + new URLSearchParams(params) : ''}`),
  createShortLink: (assetId: string, source: string, targetUrl: string) =>
    post(`/analytics/${assetId}/links`, { source, targetUrl }),
  listShortLinks: (assetId: string) => get(`/analytics/${assetId}/links`),
  /** Best-effort anonymous tracking — never throws */
  trackView: async (subdomain: string, extra?: Record<string, unknown>): Promise<void> => {
    try {
      await post('/analytics/track', {
        event: 'portfolio_view',
        subdomain,
        timestamp: new Date().toISOString(),
        ...extra,
      });
    } catch {
      // silently ignore — tracking must never break the UI
    }
  },
};

// Publish
export const publishApi = {
  publish: (data: unknown) => post('/publish', data),
  unpublish: (assetId: string) => post(`/publish/${assetId}/unpublish`, {}),
  getStatus: (assetId: string) => get(`/publish/${assetId}/status`),
};

// Collaboration
export const collabApi = {
  getComments: (assetId: string) => get(`/collaboration/${assetId}/comments`),
  addComment: (assetId: string, body: string) =>
    post(`/collaboration/${assetId}/comments`, { body }),
  resolveComment: (commentId: string) =>
    post(`/collaboration/comments/${commentId}/resolve`, {}),
};

// Integrations
export const integrationsApi = {
  list: () => get('/integrations'),
  connect: (provider: string) => post(`/integrations/connect/${provider}`, {}),
  disconnect: (provider: string) => del(`/integrations/${provider}`),
  getProviders: () => get('/integrations/providers'),
};

// Notifications
export const notificationsApi = {
  list: (params?: { page?: number; limit?: number; filter?: string }) => {
    const qs = params ? '?' + new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return get(`/notifications${qs}`);
  },
  unreadCount: () => get<{ count: number }>('/notifications/unread-count'),
  markRead: (ids?: string[]) => patch('/notifications/mark-read', { ids }),
};

// Onboarding import flow
export const onboardingApi = {
  startImport: (data: unknown) => post('/onboarding/import/start', data),
  getLatestImport: () => get('/onboarding/import/latest'),
  getImportStatus: (runId: string) => get(`/onboarding/import/${runId}/status`),
  getImportPreview: (runId: string) => get(`/onboarding/import/${runId}/preview`),
  confirmImport: (runId: string, data: unknown) => post(`/onboarding/import/${runId}/confirm`, data),
};
