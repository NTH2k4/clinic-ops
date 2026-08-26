import type { Doctor, Patient, User } from "../../types/models";
import type { ApiRequest } from "./http";

export interface AuthSession {
  sessionToken: string;
  user: User;
  linkedProfile?: Patient | Doctor;
}

export interface AuthApi {
  login(input: { email: string; password: string }): Promise<AuthSession>;
  logout(): Promise<void>;
  me(): Promise<Omit<AuthSession, "sessionToken">>;
}

export function createAuthApi(request: ApiRequest): AuthApi {
  return {
    login(input) {
      return request<AuthSession>("/auth/login", { method: "POST", body: JSON.stringify(input) });
    },
    logout() {
      return request<void>("/auth/logout", { method: "POST" });
    },
    me() {
      return request<Omit<AuthSession, "sessionToken">>("/auth/me");
    },
  };
}
