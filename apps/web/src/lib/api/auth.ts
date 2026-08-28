import type { User } from "../../types/models";
import type { ApiRequest } from "./http";

export type CurrentUser = Pick<User, "id" | "displayName" | "email" | "role"> & {
  status: "active" | "inactive" | "locked";
};

export type LinkedProfileRef =
  | { type: "patient" | "staff" | "doctor"; id: string }
  | null;

export interface AuthSession {
  currentUser: CurrentUser;
  linkedProfile: LinkedProfileRef;
}

export interface AuthLoginResponse extends AuthSession {
  sessionToken: string;
}

export interface AuthApi {
  login(input: { email: string; password: string }): Promise<AuthLoginResponse>;
  register(input: { displayName: string; email: string; phone: string; password: string }): Promise<AuthLoginResponse>;
  changePassword(input: { currentPassword: string; newPassword: string }): Promise<void>;
  logout(): Promise<void>;
  me(): Promise<AuthSession>;
}

export function createAuthApi(request: ApiRequest): AuthApi {
  return {
    login(input) {
      return request<AuthLoginResponse>("/auth/login", { method: "POST", body: JSON.stringify(input) });
    },
    register(input) {
      return request<AuthLoginResponse>("/auth/register", { method: "POST", body: JSON.stringify(input) });
    },
    changePassword(input) {
      return request<void>("/auth/change-password", { method: "POST", body: JSON.stringify(input) });
    },
    logout() {
      return request<void>("/auth/logout", { method: "POST" });
    },
    me() {
      return request<AuthSession>("/auth/me");
    },
  };
}
