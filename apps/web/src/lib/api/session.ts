import { queryClient } from "../queryClient";
import { apiBaseUrl } from "../dataSource";
import { createApiHttpClient } from "./http";

let sessionToken: string | null = null;
const sessionClearedListeners = new Set<() => void>();

export function getApiSessionToken(): string | null {
  return sessionToken;
}

export function setApiSessionToken(token: string | null): void {
  sessionToken = token;
}

export function clearApiSession(): void {
  setApiSessionToken(null);
  queryClient.clear();
  sessionClearedListeners.forEach((listener) => listener());
}

export function subscribeToApiSessionCleared(listener: () => void): () => void {
  sessionClearedListeners.add(listener);
  return () => sessionClearedListeners.delete(listener);
}

export function createSessionApiHttpClient(fetcher?: typeof fetch) {
  return createApiHttpClient({
    baseUrl: apiBaseUrl,
    getToken: getApiSessionToken,
    onUnauthenticated: clearApiSession,
    fetcher,
  });
}
