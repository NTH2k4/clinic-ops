import { Catch, HttpException, HttpStatus, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import type { Response } from "express";
import { ApiError } from "./api-error";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const mapped = this.map(exception);

    response.status(mapped.statusCode).json({
      error: {
        code: mapped.code,
        message: mapped.message,
        fields: mapped.fields,
      },
      meta: {
        requestId: randomUUID(),
      },
    });
  }

  private map(exception: unknown) {
    if (exception instanceof ApiError) return exception;
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === "P2002" || exception.code === "P2003") {
        return new ApiError(HttpStatus.CONFLICT, "RESOURCE_IN_USE", "Resource conflicts with existing data.");
      }
      if (exception.code === "P2025") return new ApiError(HttpStatus.NOT_FOUND, "NOT_FOUND", "Resource was not found.");
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (status === 429) return new ApiError(status, "RATE_LIMITED", exception.message);
      if (status >= 500) return new ApiError(status, "INTERNAL_ERROR", "An unexpected error occurred.");
      const code = status === 404 ? "NOT_FOUND" : status === 401 ? "UNAUTHENTICATED" : status === 403 ? "FORBIDDEN" : "VALIDATION_ERROR";
      return new ApiError(status, code, exception.message);
    }
    return new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "An unexpected error occurred.");
  }
}
