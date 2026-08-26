import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { createAuthApi } from "../../lib/api/auth";
import type { CurrentUser, LinkedProfileRef } from "../../lib/api/auth";
import { createApiHttpClient } from "../../lib/api/http";
import { apiBaseUrl, isApiMode } from "../../lib/dataSource";
import { queryClient } from "../../lib/queryClient";
import { mockStore } from "../../mocks/mockStore";
import type { User, UserRole } from "../../types/models";

type SignInInput = string | { email: string; password: string };

type AuthContextValue = {
  user: CurrentUser | null;
  linkedProfile: LinkedProfileRef;
  authError: string | null;
  signIn: (input: SignInInput) => Promise<CurrentUser | null>;
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

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [linkedProfile, setLinkedProfile] = useState<LinkedProfileRef>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearApiAuth = useCallback(() => {
    setSessionToken(null);
    setUser(null);
    setLinkedProfile(null);
    queryClient.clear();
  }, []);

  const authApi = useMemo(() => {
    const client = createApiHttpClient({
      baseUrl: apiBaseUrl,
      getToken: () => sessionToken,
      onUnauthenticated: clearApiAuth,
    });

    return createAuthApi(client.request);
  }, [clearApiAuth, sessionToken]);

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
          setSessionToken(session.sessionToken);
          setUser(session.currentUser);
          setLinkedProfile(session.linkedProfile);
          return session.currentUser;
        } catch (error) {
          setAuthError(error instanceof Error ? error.message : "Unable to sign in.");
          return null;
        }
      },
      async signOut() {
        setAuthError(null);

        if (isApiMode) {
          try {
            await authApi.logout();
          } catch (error) {
            setAuthError(error instanceof Error ? error.message : "Unable to sign out.");
          }
          clearApiAuth();
          return;
        }

        setUser(null);
        setLinkedProfile(null);
      },
      switchRole(role) {
        if (isApiMode) {
          throw new Error("Role switching is unavailable in API mode.");
        }
        setUser(userForRole(role) ?? null);
      },
    }),
    [authApi, authError, clearApiAuth, linkedProfile, user],
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
