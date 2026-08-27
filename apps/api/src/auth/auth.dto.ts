import { z } from "zod";

export const patientRegistrationSchema = z.object({
  displayName: z.string().trim().min(1).max(200),
  email: z.string().trim().email(),
  phone: z.string().trim().min(1).max(30),
  password: z.string().min(8).max(200),
}).strict();

export type PatientRegistrationInput = z.infer<typeof patientRegistrationSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8).max(200),
}).strict();

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
