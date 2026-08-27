import { currentRequestId } from "./request-context";

export function successEnvelope<T>(data: T) {
  return {
    data,
    meta: {
      requestId: currentRequestId(),
    },
  };
}

export function listEnvelope<T>(data: T[], page: number, pageSize: number, total: number) {
  return {
    data,
    meta: {
      requestId: currentRequestId(),
      page,
      pageSize,
      total,
    },
  };
}
