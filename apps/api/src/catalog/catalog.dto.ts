import { DoctorStatus, ServiceStatus } from "@prisma/client";
import { z } from "zod";
import { paginationFields } from "../common/validation";

const identifier = z.string().trim().min(1).max(200);
const requiredText = z.string().trim().min(1).max(500);
const optionalText = z.string().trim().max(1000).nullable().optional();
const commonFields = {
  q: z.string().trim().min(1).max(200).optional(),
  specialtyId: identifier.optional(),
  ...paginationFields,
};

export const serviceListQuerySchema = z.object({ ...commonFields, status: z.nativeEnum(ServiceStatus).optional() }).strict();
export const specialtyListQuerySchema = z.object({ q: commonFields.q, status: z.nativeEnum(ServiceStatus).optional(), ...paginationFields }).strict();
export const doctorListQuerySchema = z.object({
  ...commonFields,
  serviceId: identifier.optional(),
  status: z.nativeEnum(DoctorStatus).optional(),
}).strict();

export const serviceCreateSchema = z.object({
  name: requiredText,
  specialtyId: identifier,
  durationMinutes: z.number().int().positive(),
  price: z.number().finite().nonnegative(),
  currency: requiredText.optional(),
  description: optionalText,
  status: z.nativeEnum(ServiceStatus).optional(),
}).strict();

export const serviceUpdateSchema = serviceCreateSchema.partial().refine((input) => Object.keys(input).length > 0, {
  message: "At least one service field is required.",
});

export const specialtyCreateSchema = z.object({
  name: requiredText,
  description: optionalText,
  status: z.nativeEnum(ServiceStatus).optional(),
}).strict();

export const specialtyUpdateSchema = specialtyCreateSchema.partial().refine((input) => Object.keys(input).length > 0, {
  message: "At least one specialty field is required.",
});

export const doctorCreateSchema = z.object({
  fullName: requiredText,
  specialtyId: identifier,
  phone: requiredText,
  email: requiredText,
  title: optionalText,
  room: optionalText,
  serviceIds: z.array(identifier).optional(),
  status: z.nativeEnum(DoctorStatus).optional(),
}).strict();

export const doctorUpdateSchema = doctorCreateSchema.partial().refine((input) => Object.keys(input).length > 0, {
  message: "At least one doctor field is required.",
});
