import { AccountStatus, UserRole } from "@prisma/client";
import { z } from "zod";
import { paginationFields } from "../common/validation";

export const userIdParamSchema = z.object({
  id: z.string().min(1).max(100).regex(/^[A-Za-z0-9_-]+$/, "Must be a valid user id."),
}).strict();

export const userListQuerySchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(AccountStatus).optional(),
  ...paginationFields,
}).strict();

export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type UserIdParams = z.infer<typeof userIdParamSchema>;
