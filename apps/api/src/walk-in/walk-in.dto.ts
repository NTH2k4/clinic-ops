import { z } from "zod";
import { dateOnlySchema } from "../common/validation";

const identifier = z.string().trim().min(1).max(200);
const optionalText = z.string().trim().max(1000).optional();
const nullableText = z.string().trim().max(500).nullable().optional();

export const walkInPatientSchema = z.object({
  fullName: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(1).max(30),
  email: z.string().trim().email().nullable().optional(),
  citizenIdNumber: z.string().trim().min(1).max(30).nullable().optional(),
  healthInsuranceNumber: z.string().trim().min(1).max(30).nullable().optional(),
  dateOfBirth: dateOnlySchema.nullable().optional(),
  gender: nullableText,
  address: nullableText,
  guardianName: nullableText,
  guardianPhone: z.string().trim().min(1).max(30).nullable().optional(),
  identityDocumentType: nullableText,
  notes: nullableText,
}).strict();

export const walkInQuoteSchema = z.object({
  patientId: identifier.optional(),
  patient: walkInPatientSchema.optional(),
  serviceId: identifier,
  specialtyId: identifier.optional(),
  reason: optionalText,
  internalNote: optionalText,
}).strict().refine((input) => Boolean(input.patientId || input.patient), {
  message: "patientId or patient is required.",
  path: ["patient"],
});

export const walkInCreateSchema = walkInQuoteSchema;

export type WalkInPatientInput = z.infer<typeof walkInPatientSchema>;
export type WalkInQuoteInput = z.infer<typeof walkInQuoteSchema>;
export type WalkInCreateInput = z.infer<typeof walkInCreateSchema>;
