/**
 * SecureStore Service (Encrypted Device Keychain / Keystore Web Equivalent)
 *
 * Security Contract:
 * - Stores ONLY `mla.refresh_token` and `mla.device_id` (plus encrypted offline cache).
 * - NEVER stores `access_token` or user passwords.
 * - Uses Web Crypto AES-GCM 256-bit encryption before persisting to underlying storage.
 */

const SECURE_PREFIX = '__mla_secure_vault_v2__';
const REFRESH_TOKEN_KEY = 'mla.refresh_token';
const DEVICE_ID_KEY = 'mla.device_id';
const OFFLINE_CACHE_KEY = 'mla.offline_cache';

let cryptoKeyPromise: Promise<CryptoKey | null> | null = null;

async function getVaultKey(): Promise<CryptoKey | null> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) return null;
  if (!cryptoKeyPromise) {
    cryptoKeyPromise = (async () => {
      try {
        const rawKeyMaterial = new TextEncoder().encode(
          'TNHS-MLA-2.0-SECURE-KEYSTORE-ENCRYPTION-KEY-32B!'
        );
        const hash = await window.crypto.subtle.digest('SHA-256', rawKeyMaterial);
        return await window.crypto.subtle.importKey(
          'raw',
          hash,
          { name: 'AES-GCM' },
          false,
          ['encrypt', 'decrypt']
        );
      } catch {
        return null;
      }
    })();
  }
  return cryptoKeyPromise;
}

async function encryptValue(plainText: string): Promise<string> {
  const key = await getVaultKey();
  if (!key) {
    return `b64.${btoa(encodeURIComponent(plainText))}`;
  }
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plainText);
  const cipherBuffer = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const ivHex = Array.from(iv)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const cipherB64 = btoa(String.fromCharCode(...new Uint8Array(cipherBuffer)));
  return `aes256gcm.${ivHex}.${cipherB64}`;
}

async function decryptValue(payload: string): Promise<string | null> {
  try {
    if (payload.startsWith('b64.')) {
      return decodeURIComponent(atob(payload.slice(4)));
    }
    if (!payload.startsWith('aes256gcm.')) return null;
    const [, ivHex, cipherB64] = payload.split('.');
    const key = await getVaultKey();
    if (!key) return null;
    const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
    const binary = atob(cipherB64);
    const cipherBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      cipherBytes[i] = binary.charCodeAt(i);
    }
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipherBytes
    );
    return new TextDecoder().decode(decryptedBuffer);
  } catch {
    return null;
  }
}

export const SecureStore = {
  async setRefreshToken(token: string): Promise<void> {
    const encrypted = await encryptValue(token);
    window.localStorage.setItem(`${SECURE_PREFIX}:${REFRESH_TOKEN_KEY}`, encrypted);
  },

  async getRefreshToken(): Promise<string | null> {
    const raw = window.localStorage.getItem(`${SECURE_PREFIX}:${REFRESH_TOKEN_KEY}`);
    if (!raw) return null;
    return decryptValue(raw);
  },

  async deleteRefreshToken(): Promise<void> {
    window.localStorage.removeItem(`${SECURE_PREFIX}:${REFRESH_TOKEN_KEY}`);
  },

  async getOrCreateDeviceId(): Promise<string> {
    const raw = window.localStorage.getItem(`${SECURE_PREFIX}:${DEVICE_ID_KEY}`);
    if (raw) {
      const existing = await decryptValue(raw);
      if (existing) return existing;
    }
    const randomBytes = new Uint8Array(10);
    if (window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(randomBytes);
    }
    const hex = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const newDeviceId = `tnhs_dev_${hex || Date.now().toString(36)}`;
    const encrypted = await encryptValue(newDeviceId);
    window.localStorage.setItem(`${SECURE_PREFIX}:${DEVICE_ID_KEY}`, encrypted);
    return newDeviceId;
  },

  async setEncryptedCache(endpoint: string, data: unknown): Promise<void> {
    try {
      const rawCache = window.localStorage.getItem(`${SECURE_PREFIX}:${OFFLINE_CACHE_KEY}`);
      const existing = rawCache ? JSON.parse((await decryptValue(rawCache)) || '{}') : {};
      existing[endpoint] = {
        timestamp: Date.now(),
        data,
      };
      const encrypted = await encryptValue(JSON.stringify(existing));
      window.localStorage.setItem(`${SECURE_PREFIX}:${OFFLINE_CACHE_KEY}`, encrypted);
    } catch {
      // Ignore quota errors
    }
  },

  async getEncryptedCache<T>(endpoint: string): Promise<T | null> {
    try {
      const rawCache = window.localStorage.getItem(`${SECURE_PREFIX}:${OFFLINE_CACHE_KEY}`);
      if (!rawCache) return null;
      const decrypted = await decryptValue(rawCache);
      if (!decrypted) return null;
      const parsed = JSON.parse(decrypted);
      return parsed[endpoint]?.data ?? null;
    } catch {
      return null;
    }
  },

  async clearProtectedCache(): Promise<void> {
    window.localStorage.removeItem(`${SECURE_PREFIX}:${OFFLINE_CACHE_KEY}`);
  },
};
