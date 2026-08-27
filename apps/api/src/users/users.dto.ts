import { AccountStatus, UserRole } from "@prisma/client";
import { z } from "zod";
import { paginationFields } from "../common/validation";

export const userListQuerySchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(AccountStatus).optional(),
  ...paginationFields,
}).strict();

export type UserListQuery = z.infer<typeof userListQuerySchema>;
