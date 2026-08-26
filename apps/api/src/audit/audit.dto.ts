import { z } from "zod";
import { dateTimeSchema, paginationFields } from "../common/validation";

export const auditListQuerySchema = z.object({
  entityType: z.string().trim().min(1).max(100).optional(),
  entityId: z.string().trim().min(1).max(200).optional(),
  actorUserId: z.string().trim().min(1).max(200).optional(),
  action: z.string().trim().min(1).max(100).optional(),
  from: dateTimeSchema.optional(),
  to: dateTimeSchema.optional(),
  ...paginationFields,
}).strict().refine((query) => !query.from || !query.to || new Date(query.from) <= new Date(query.to), {
  message: "from must be before or equal to to.",
  path: ["from"],
});

export type AuditListQuery = z.infer<typeof auditListQuerySchema>;
