import { ApiClientError } from "./errors";
import type { ApiErrorEnvelope, ApiSuccess } from "./types";

export interface ApiHttpClientOptions {
  baseUrl: string;
  getToken: () => string | null;
  onUnauthenticated?: () => void;
  fetcher?: typeof fetch;
}

export type ApiRequest = <T>(path: string, init?: RequestInit) => Promise<T>;

function normalizeFields(fields: ApiErrorEnvelope["error"]["fields"]): Record<string, string[]> | undefined {
  return fields && Object.fromEntries(Object.entries(fields).map(([field, message]) => [field, [message]]));
}

export function createApiHttpClient(options: ApiHttpClientOptions) {
  const apiRequest: ApiRequest = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const headers = new Headers(init?.headers);
    headers.set("Accept", "application/json");
    headers.set("Content-Type", "application/json");

    const token = options.getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await (options.fetcher ?? fetch)(`${options.baseUrl}${path}`, { ...init, headers });
    const body = await response.json() as ApiSuccess<T> | ApiErrorEnvelope;

    if (response.ok && "data" in body) {
      return body.data;
    }

    const error = "error" in body ? body.error : { code: "INTERNAL_ERROR", message: "Unexpected API response." };
    const requestId = body.meta?.requestId;
    const clientError = new ApiClientError(error.code, error.message, requestId, normalizeFields(error.fields), response.status);

    if (response.status === 401 && clientError.code === "UNAUTHENTICATED") {
      options.onUnauthenticated?.();
    }

    throw clientError;
  };

  return { request: apiRequest };
}
