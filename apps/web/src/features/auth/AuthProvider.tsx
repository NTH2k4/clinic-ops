import { createContext, useContext, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { mockStore } from "../../mocks/mockStore";
import type { User, UserRole } from "../../types/models";

type AuthContextValue = {
  user: User | null;
  signIn: (userId: string) => void;
  signOut: () => void;
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
  const [user, setUser] = useState<User | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      signIn(userId) {
        setUser(mockStore.users.find((candidate) => candidate.id === userId) ?? null);
      },
      signOut() {
        setUser(null);
      },
      switchRole(role) {
        setUser(userForRole(role) ?? null);
      },
    }),
    [user],
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
