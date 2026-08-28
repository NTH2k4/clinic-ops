import { z } from "zod";
import { ScheduleType } from "@prisma/client";
import { dateOnlySchema, paginationFields } from "../common/validation";

const identifier = z.string().trim().min(1).max(200);
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "time must use HH:mm.");

const scheduleFields = {
  doctorId: identifier,
  dayOfWeek: z.coerce.number().int().min(1).max(7),
  startTime: timeSchema,
  endTime: timeSchema,
  effectiveFrom: dateOnlySchema,
  effectiveTo: dateOnlySchema,
  type: z.nativeEnum(ScheduleType),
};

const validScheduleRange = (schedule: { startTime?: string; endTime?: string; effectiveFrom?: string; effectiveTo?: string }) => (
  (schedule.startTime === undefined || schedule.endTime === undefined || schedule.startTime < schedule.endTime)
  && (schedule.effectiveFrom === undefined || schedule.effectiveTo === undefined || schedule.effectiveFrom <= schedule.effectiveTo)
);

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
  includeUnavailable: z.coerce.boolean().optional(),
  ...paginationFields,
}).strict().refine((query) => !query.includeUnavailable || Boolean(query.doctorId), {
  message: "doctorId is required when includeUnavailable is true.",
  path: ["doctorId"],
});

export const scheduleCreateSchema = z.object(scheduleFields).strict().refine(validScheduleRange, {
  message: "schedule start/end range is invalid.",
});

export const scheduleUpdateSchema = z.object({
  doctorId: identifier.optional(),
  dayOfWeek: z.coerce.number().int().min(1).max(7).optional(),
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
  effectiveFrom: dateOnlySchema.optional(),
  effectiveTo: dateOnlySchema.optional(),
  type: z.nativeEnum(ScheduleType).optional(),
}).strict().refine((input) => Object.keys(input).length > 0, {
  message: "At least one schedule field is required.",
}).refine(validScheduleRange, {
  message: "schedule start/end range is invalid.",
});

export type ScheduleListQuery = z.infer<typeof scheduleListQuerySchema>;
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
export type ScheduleCreateInput = z.infer<typeof scheduleCreateSchema>;
export type ScheduleUpdateInput = z.infer<typeof scheduleUpdateSchema>;
