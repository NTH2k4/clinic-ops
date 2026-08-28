import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { createAuthApi } from "../../lib/api/auth";
import type { CurrentUser, LinkedProfileRef } from "../../lib/api/auth";
import { clearApiSession, createSessionApiHttpClient, setApiSessionToken, subscribeToApiSessionCleared } from "../../lib/api/session";
import { isApiMode } from "../../lib/dataSource";
import { mockStore } from "../../mocks/mockStore";
import type { User, UserRole } from "../../types/models";

type SignInInput = string | { email: string; password: string };
type RegisterInput = { displayName: string; email: string; phone: string; password: string };
type ChangePasswordInput = { currentPassword: string; newPassword: string };

type AuthContextValue = {
  user: CurrentUser | null;
  linkedProfile: LinkedProfileRef;
  authError: string | null;
  signIn: (input: SignInInput) => Promise<CurrentUser | null>;
  register: (input: RegisterInput) => Promise<CurrentUser | null>;
  changePassword: (input: ChangePasswordInput) => Promise<boolean>;
  signOut: () => Promise<void>;
  switchRole: (role: UserRole) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function userForRole(role: UserRole): User | undefined {
  const matchingUser = mockStore.users.find((candidate) => candidate.role === role);

  if (matchingUser) {
    return matchingUser;
  }

  if (role === "nurse") {
    const receptionist = mockStore.users.find((candidate) => candidate.role === "receptionist");
    return receptionist ? { ...receptionist, role } : undefined;
  }

  return undefined;
}

function userFacingAuthError(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  if (error.message === "Email or password is incorrect.") {
    return "Email hoặc mật khẩu không đúng.";
  }

  if (error.message === "Authentication is required." || error.message === "Session expired.") {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }

  return error.message;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [linkedProfile, setLinkedProfile] = useState<LinkedProfileRef>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearApiAuthState = useCallback(() => {
    setUser(null);
    setLinkedProfile(null);
  }, []);

  useEffect(() => subscribeToApiSessionCleared(clearApiAuthState), [clearApiAuthState]);

  const authApi = useMemo(() => {
    const client = createSessionApiHttpClient();

    return createAuthApi(client.request);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      linkedProfile,
      authError,
      async signIn(input) {
        setAuthError(null);

        if (!isApiMode) {
          if (typeof input !== "string") {
            return null;
          }

          const selectedUser = mockStore.users.find((candidate) => candidate.id === input) ?? null;
          setUser(selectedUser);
          return selectedUser;
        }

        if (typeof input === "string") {
          return null;
        }

        try {
          const session = await authApi.login(input);
          setApiSessionToken(session.sessionToken);
          setUser(session.currentUser);
          setLinkedProfile(session.linkedProfile);
          return session.currentUser;
        } catch (error) {
          setAuthError(userFacingAuthError(error, "Không thể đăng nhập."));
          return null;
        }
      },
      async signOut() {
        setAuthError(null);

        if (isApiMode) {
          try {
            await authApi.logout();
          } catch (error) {
            setAuthError(userFacingAuthError(error, "Không thể đăng xuất."));
          }
          clearApiSession();
          return;
        }

        setUser(null);
        setLinkedProfile(null);
      },
      async register(input) {
        setAuthError(null);

        if (!isApiMode) {
          return null;
        }

        try {
          const session = await authApi.register(input);
          setApiSessionToken(session.sessionToken);
          setUser(session.currentUser);
          setLinkedProfile(session.linkedProfile);
          return session.currentUser;
        } catch (error) {
          setAuthError(userFacingAuthError(error, "Không thể tạo tài khoản."));
          return null;
        }
      },
      async changePassword(input) {
        setAuthError(null);

        if (!isApiMode) {
          return false;
        }

        try {
          await authApi.changePassword(input);
          clearApiSession();
          return true;
        } catch (error) {
          setAuthError(userFacingAuthError(error, "Không thể đổi mật khẩu."));
          return false;
        }
      },
      switchRole(role) {
        if (isApiMode) {
          throw new Error("Không thể chuyển vai trò trong chế độ API.");
        }
        setUser(userForRole(role) ?? null);
      },
    }),
    [authApi, authError, linkedProfile, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// The hook is intentionally colocated with its provider as the public auth API.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
