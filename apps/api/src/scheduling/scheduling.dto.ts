import { z } from "zod";
import { dateOnlySchema, paginationFields } from "../common/validation";

const identifier = z.string().trim().min(1).max(200);

export const scheduleListQuerySchema = z.object({
  doctorId: identifier.optional(),
  from: dateOnlySchema.optional(),
  to: dateOnlySchema.optional(),
  ...paginationFields,
}).strict().refine((query) => !query.from || !query.to || query.from <= query.to, {
  message: "from must be before or equal to to.",
  path: ["from"],
});

export const availabilityQuerySchema = z.object({
  serviceId: identifier,
  date: dateOnlySchema,
  doctorId: identifier.optional(),
  ...paginationFields,
}).strict();

export type ScheduleListQuery = z.infer<typeof scheduleListQuerySchema>;
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
