import { Catch, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { Response } from "express";
import { ApiError } from "./api-error";

@Catch(ApiError)
export class ApiExceptionFilter implements ExceptionFilter<ApiError> {
  catch(exception: ApiError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    response.status(exception.statusCode).json({
      error: {
        code: exception.code,
        message: exception.message,
        fields: exception.fields,
      },
      meta: {
        requestId: randomUUID(),
      },
    });
  }
}
