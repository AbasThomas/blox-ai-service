const BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3333'}/v1`;

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('blox_access_token');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...(options?.headers ?? {}),
    },
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
    throw new Error(errorMessage);
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
  signup: (data: { name: string; email: string; password: string; persona: string }) =>
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
  createShortLink: (assetId: string, source: string) =>
    post('/analytics/links', { assetId, source }),
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
  disconnect: (provider: string) => del(`/integrations/${provider}`),
  getProviders: () => get('/integrations/providers'),
};
