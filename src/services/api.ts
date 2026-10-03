import { SecureStore } from './secureStore';
import type { LoginResponse, User } from '../types/lms';

/**
 * In-Memory Access Token Store (RAM ONLY)
 * Never persisted to localStorage, sessionStorage, or IndexedDB.
 */
let inMemoryAccessToken: string | null = null;
let inMemoryTokenExpiresAt: number | null = null;
let inMemorySessionId: string | null = null;
let lastRotationCount = 0;

// Single-flight refresh promise to prevent concurrent /auth/refresh storms
let singleFlightRefreshPromise: Promise<LoginResponse | null> | null = null;

type SessionExpiredListener = (reason: string) => void;
type TokenStateListener = () => void;

const sessionExpiredListeners = new Set<SessionExpiredListener>();
const tokenStateListeners = new Set<TokenStateListener>();

function notifyTokenStateChange() {
  tokenStateListeners.forEach((cb) => cb());
}

export const AuthTokenManager = {
  getAccessToken(): string | null {
    return inMemoryAccessToken;
  },

  getTokenMetadata() {
    return {
      hasAccessTokenInRam: Boolean(inMemoryAccessToken),
      accessTokenPreview: inMemoryAccessToken
        ? `${inMemoryAccessToken.slice(0, 18)}...${inMemoryAccessToken.slice(-8)}`
        : null,
      expiresAt: inMemoryTokenExpiresAt,
      sessionId: inMemorySessionId,
      rotationCount: lastRotationCount,
    };
  },

  setSessionTokens(accessToken: string, expiresInSeconds: number, sessionId: string) {
    inMemoryAccessToken = accessToken;
    inMemoryTokenExpiresAt = Date.now() + expiresInSeconds * 1000;
    inMemorySessionId = sessionId;
    notifyTokenStateChange();
  },

  clearMemoryTokens() {
    inMemoryAccessToken = null;
    inMemoryTokenExpiresAt = null;
    inMemorySessionId = null;
    notifyTokenStateChange();
  },

  onSessionExpired(listener: SessionExpiredListener) {
    sessionExpiredListeners.add(listener);
    return () => sessionExpiredListeners.delete(listener);
  },

  onTokenStateChange(listener: TokenStateListener) {
    tokenStateListeners.add(listener);
    return () => tokenStateListeners.delete(listener);
  },

  triggerSessionExpired(reason = 'Your session has expired. Please sign in again.') {
    inMemoryAccessToken = null;
    inMemoryTokenExpiresAt = null;
    inMemorySessionId = null;
    SecureStore.deleteRefreshToken();
    SecureStore.clearProtectedCache();
    notifyTokenStateChange();
    sessionExpiredListeners.forEach((cb) => cb(reason));
  },
};

/**
 * Single-Flight Token Rotation
 * Guarantees that if Request A, B, and C receive 401 simultaneously,
 * only ONE POST /api/v1/auth/refresh call is dispatched.
 */
export async function performSingleFlightRefresh(): Promise<LoginResponse | null> {
  if (singleFlightRefreshPromise) {
    return singleFlightRefreshPromise;
  }

  singleFlightRefreshPromise = (async () => {
    try {
      const refreshToken = await SecureStore.getRefreshToken();
      if (!refreshToken) {
        return null;
      }
      const deviceId = await SecureStore.getOrCreateDeviceId();

      const res = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refresh_token: refreshToken,
          device_id: deviceId,
        }),
      });

      if (!res.ok) {
        await SecureStore.deleteRefreshToken();
        await SecureStore.clearProtectedCache();
        AuthTokenManager.clearMemoryTokens();
        return null;
      }

      const data = (await res.json()) as LoginResponse;
      // Rotate refresh token in SecureStore and update RAM access token
      await SecureStore.setRefreshToken(data.refresh_token);
      lastRotationCount += 1;
      AuthTokenManager.setSessionTokens(data.access_token, data.expires_in, data.session_id);
      return data;
    } catch {
      return null;
    } finally {
      singleFlightRefreshPromise = null;
    }
  })();

  return singleFlightRefreshPromise;
}

// Simulated offline toggle for testing offline resilience in preview
let simulatedOffline = false;
const offlineListeners = new Set<(offline: boolean) => void>();

export const NetworkMonitor = {
  isOffline(): boolean {
    return simulatedOffline || (typeof navigator !== 'undefined' && !navigator.onLine);
  },
  setSimulatedOffline(val: boolean) {
    simulatedOffline = val;
    offlineListeners.forEach((cb) => cb(this.isOffline()));
  },
  onChange(cb: (offline: boolean) => void) {
    offlineListeners.add(cb);
    return () => offlineListeners.delete(cb);
  },
};

export interface ApiError extends Error {
  status?: number;
  code?: string;
  errors?: Record<string, string[]>;
}

/**
 * Unified Authenticated API Request Client
 * - Attaches RAM Access Token
 * - Intercepts 401 -> Runs Single-Flight Refresh -> Retries request once
 * - Caches GET responses in encrypted SecureStore for offline resilience
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();

  // Offline handling for GET requests
  if (NetworkMonitor.isOffline()) {
    if (method === 'GET') {
      const cached = await SecureStore.getEncryptedCache<T>(endpoint);
      if (cached) return cached;
    }
    const err: ApiError = new Error(
      "You're offline. Please check your internet connection and try again."
    );
    err.status = 0;
    err.code = 'OFFLINE_ERROR';
    throw err;
  }

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const deviceId = await SecureStore.getOrCreateDeviceId();
    headers.set('X-MLA-Device-Id', deviceId);
    headers.set('X-MLA-Client-Version', 'MLA-Mobile-2.0.4');
  } catch {
    // Fallback if device id unavailable
  }

  const accessToken = AuthTokenManager.getAccessToken();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized via Single-Flight Refresh & Retry Once
  if (
    response.status === 401 &&
    !isRetry &&
    !endpoint.includes('/auth/login') &&
    !endpoint.includes('/auth/refresh')
  ) {
    const refreshed = await performSingleFlightRefresh();
    if (refreshed) {
      return apiRequest<T>(endpoint, options, true);
    } else {
      AuthTokenManager.triggerSessionExpired('Your session has expired. Please sign in again.');
      const err: ApiError = new Error('Your session has expired. Please sign in again.');
      err.status = 401;
      err.code = 'AUTHENTICATION_REQUIRED';
      throw err;
    }
  }

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const err: ApiError = new Error(
      payload?.message || `Request failed with status ${response.status}`
    );
    err.status = response.status;
    err.code = payload?.code || 'API_ERROR';
    err.errors = payload?.errors;
    throw err;
  }

  // Encrypt & cache successful GET responses for offline support
  if (method === 'GET' && payload) {
    await SecureStore.setEncryptedCache(endpoint, payload);
  }

  return payload as T;
}

export const AuthService = {
  async login(schoolId: string, password: string): Promise<LoginResponse> {
    const deviceId = await SecureStore.getOrCreateDeviceId();
    const data = await apiRequest<LoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        school_id: schoolId,
        password,
        device_id: deviceId,
      }),
    });

    await SecureStore.setRefreshToken(data.refresh_token);
    AuthTokenManager.setSessionTokens(data.access_token, data.expires_in, data.session_id);
    return data;
  },

  async register(payload: {
    school_id?: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    email: string;
    contact_number?: string;
    role: 'student' | 'teacher';
    grade_level?: string;
    section?: string;
    department?: string;
    avatar_url?: string;
    password: string;
    confirm_password: string;
  }): Promise<{
    user: User;
    message?: string;
    requires_approval?: boolean;
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
    session_id?: string;
  }> {
    const deviceId = await SecureStore.getOrCreateDeviceId();
    const data = await apiRequest<{
      user: User;
      message?: string;
      requires_approval?: boolean;
      access_token?: string;
      expires_in?: number;
      refresh_token?: string;
      session_id?: string;
    }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        device_id: deviceId,
      }),
    });

    if (data.access_token && data.refresh_token && data.expires_in && data.session_id) {
      await SecureStore.setRefreshToken(data.refresh_token);
      AuthTokenManager.setSessionTokens(data.access_token, data.expires_in, data.session_id);
    }
    return data;
  },

  async logout(): Promise<void> {
    const refreshToken = await SecureStore.getRefreshToken();
    try {
      if (!NetworkMonitor.isOffline()) {
        await apiRequest('/api/v1/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      }
    } catch {
      // Always proceed to clear local state even if server call fails
    } finally {
      await SecureStore.deleteRefreshToken();
      await SecureStore.clearProtectedCache();
      AuthTokenManager.clearMemoryTokens();
    }
  },

  async logoutAllDevices(): Promise<string> {
    const res = await apiRequest<{ message: string }>('/api/v1/auth/logout-all', {
      method: 'POST',
    });
    await SecureStore.deleteRefreshToken();
    await SecureStore.clearProtectedCache();
    AuthTokenManager.clearMemoryTokens();
    return res.message;
  },

  async restoreSessionOnBoot(): Promise<{ user: User; rotated: boolean } | null> {
    const refreshToken = await SecureStore.getRefreshToken();
    if (!refreshToken) return null;
    const rotated = await performSingleFlightRefresh();
    if (!rotated) return null;
    return { user: rotated.user, rotated: true };
  },
};
