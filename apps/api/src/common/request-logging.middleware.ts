import { Injectable, Logger, type NestMiddleware } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { runWithRequestContext } from "./request-context";

function requestIdFromHeader(header: string | string[] | undefined) {
  const value = Array.isArray(header) ? header[0] : header;
  const trimmed = value?.trim();
  return trimmed && trimmed.length <= 128 ? trimmed : randomUUID();
}

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggingMiddleware.name);

  use(request: Request, response: Response, next: NextFunction) {
    const startedAt = process.hrtime.bigint();
    const requestId = requestIdFromHeader(request.headers["x-request-id"]);
    response.setHeader("x-request-id", requestId);

    return runWithRequestContext(requestId, () => {
      response.on("finish", () => {
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
        this.logger.log(JSON.stringify({
          requestId,
          method: request.method,
          path: request.path,
          statusCode: response.statusCode,
          durationMs: Math.round(durationMs),
        }));
      });

      next();
    });
  }
}
