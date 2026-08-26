import { AccountStatus } from "@prisma/client";
import { z } from "zod";
import { dateOnlySchema, paginationFields } from "../common/validation";

const optionalText = z.string().trim().max(500).nullable().optional();

export const patientCreateSchema = z.object({
  fullName: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(1).max(30),
  email: z.string().trim().email().nullable().optional(),
  dateOfBirth: dateOnlySchema.nullable().optional(),
  gender: optionalText,
  address: optionalText,
  notes: optionalText,
}).strict();

export const patientUpdateSchema = patientCreateSchema.partial().refine((input) => Object.keys(input).length > 0, {
  message: "At least one patient field is required.",
});

export const patientOwnerUpdateSchema = patientCreateSchema.omit({ notes: true }).partial().refine((input) => Object.keys(input).length > 0, {
  message: "At least one patient field is required.",
});

export const patientListQuerySchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
  status: z.nativeEnum(AccountStatus).optional(),
  ...paginationFields,
}).strict();

export type PatientCreateInput = z.infer<typeof patientCreateSchema>;
export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>;
export type PatientListQuery = z.infer<typeof patientListQuerySchema>;
