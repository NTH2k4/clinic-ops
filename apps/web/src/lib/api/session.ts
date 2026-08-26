import { queryClient } from "../queryClient";

let sessionToken: string | null = null;

export function getApiSessionToken(): string | null {
  return sessionToken;
}

export function setApiSessionToken(token: string | null): void {
  sessionToken = token;
}

export function clearApiSession(): void {
  setApiSessionToken(null);
  queryClient.clear();
}
