import { randomUUID } from "node:crypto";

export function successEnvelope<T>(data: T) {
  return {
    data,
    meta: {
      requestId: randomUUID(),
    },
  };
}
