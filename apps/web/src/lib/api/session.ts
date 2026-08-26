let sessionToken: string | null = null;

export function getApiSessionToken(): string | null {
  return sessionToken;
}

export function setApiSessionToken(token: string | null): void {
  sessionToken = token;
}
