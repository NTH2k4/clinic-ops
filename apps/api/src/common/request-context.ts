import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

type RequestContext = {
  requestId: string;
};

const requestContext = new AsyncLocalStorage<RequestContext>();

export function currentRequestId() {
  return requestContext.getStore()?.requestId ?? randomUUID();
}

export function runWithRequestContext<T>(requestId: string, callback: () => T) {
  return requestContext.run({ requestId }, callback);
}

