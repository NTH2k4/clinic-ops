import { randomUUID } from "node:crypto";

export function successEnvelope<T>(data: T) {
  return {
    data,
    meta: {
      requestId: randomUUID(),
    },
  };
}

export function listEnvelope<T>(data: T[], page: number, pageSize: number, total: number) {
  return {
    data,
    meta: {
      requestId: randomUUID(),
      page,
      pageSize,
      total,
    },
  };
}
