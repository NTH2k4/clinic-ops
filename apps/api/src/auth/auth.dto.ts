import { z } from "zod";

const MAX_BCRYPT_PASSWORD_BYTES = 72;

export function hasBcryptSafeByteLength(value: string) {
  return Buffer.byteLength(value, "utf8") <= MAX_BCRYPT_PASSWORD_BYTES;
}

const newPasswordSchema = z.string().min(8).max(200).refine(hasBcryptSafeByteLength);
const currentPasswordSchema = z.string().min(1).max(200).refine(hasBcryptSafeByteLength);

export const patientRegistrationSchema = z.object({
  displayName: z.string().trim().min(1).max(200),
  email: z.string().trim().email(),
  phone: z.string().trim().min(1).max(30),
  password: newPasswordSchema,
}).strict();

export type PatientRegistrationInput = z.infer<typeof patientRegistrationSchema>;

export const changePasswordSchema = z.object({
  currentPassword: currentPasswordSchema,
  newPassword: newPasswordSchema,
}).strict();

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
