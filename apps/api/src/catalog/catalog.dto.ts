import { DoctorStatus, ServiceStatus } from "@prisma/client";
import { z } from "zod";
import { paginationFields } from "../common/validation";

const identifier = z.string().trim().min(1).max(200);
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
