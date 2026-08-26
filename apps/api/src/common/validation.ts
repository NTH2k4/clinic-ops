import { z } from "zod";
import { ApiError } from "./api-error";

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
const dateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/i;

export const dateOnlySchema = z.string().regex(dateOnlyPattern, "Must use yyyy-MM-dd.").refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}, "Must be a valid calendar date.");

export const dateTimeSchema = z.string().refine((value) => (
  dateTimePattern.test(value)
  && dateOnlySchema.safeParse(value.slice(0, 10)).success
  && !Number.isNaN(new Date(value).valueOf())
), {
  message: "Must be an ISO 8601 datetime with timezone.",
});

export const paginationFields = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
};

export type Pagination = {
  page: number;
  pageSize: number;
};

export function paginationArgs(pagination: Pagination) {
  return {
    skip: (pagination.page - 1) * pagination.pageSize,
    take: pagination.pageSize,
  };
}

export function parseSchema<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (result.success) return result.data;

  const fields = Object.fromEntries(result.error.issues.map((issue) => [issue.path.join(".") || "request", issue.message]));
  throw new ApiError(400, "VALIDATION_ERROR", "Request validation failed.", fields);
}
