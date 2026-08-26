import { AppointmentStatus } from "@prisma/client";
import { z } from "zod";
import { dateTimeSchema, paginationFields } from "../common/validation";

const identifier = z.string().trim().min(1).max(200);
const optionalText = z.string().trim().max(1000).optional();
const sourceSchema = z.enum(["patient_portal", "staff_portal", "operations"]);

const createFields = {
  serviceId: identifier,
  doctorId: identifier.optional(),
  startAt: dateTimeSchema,
  reason: optionalText,
  source: sourceSchema.optional(),
};

export const patientAppointmentCreateSchema = z.object({ patientId: identifier.optional(), ...createFields }).strict();
export const staffAppointmentCreateSchema = z.object({
  patientId: identifier,
  ...createFields,
  internalNote: optionalText,
}).strict();

export const appointmentUpdateSchema = z.object({
  doctorId: identifier.optional(),
  serviceId: identifier.optional(),
  startAt: dateTimeSchema.optional(),
  internalNote: z.string().trim().max(1000).nullable().optional(),
}).strict().refine((input) => Object.keys(input).length > 0, { message: "At least one appointment field is required." });

export const appointmentTransitionSchema = z.object({
  cancellationReason: optionalText,
  note: optionalText,
}).strict();

export const appointmentListQuerySchema = z.object({
  status: z.nativeEnum(AppointmentStatus).optional(),
  patientId: identifier.optional(),
  doctorId: identifier.optional(),
  serviceId: identifier.optional(),
  specialtyId: identifier.optional(),
  from: dateTimeSchema.optional(),
  to: dateTimeSchema.optional(),
  q: z.string().trim().min(1).max(200).optional(),
  ...paginationFields,
}).strict().refine((query) => !query.from || !query.to || new Date(query.from) <= new Date(query.to), {
  message: "from must be before or equal to to.",
  path: ["from"],
});

export type AppointmentCreateInput = z.infer<typeof staffAppointmentCreateSchema> | z.infer<typeof patientAppointmentCreateSchema>;
export type AppointmentUpdateInput = z.infer<typeof appointmentUpdateSchema>;
export type AppointmentTransitionInput = z.infer<typeof appointmentTransitionSchema>;
export type AppointmentListQuery = z.infer<typeof appointmentListQuerySchema>;
