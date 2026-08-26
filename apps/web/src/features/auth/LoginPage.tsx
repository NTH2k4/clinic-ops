import { Stethoscope } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { isApiMode } from "../../lib/dataSource";
import { mockStore } from "../../mocks/mockStore";
import { roleHomePath } from "../../routes/RoleHomeRedirect";
import { useAuth } from "./AuthProvider";

export function LoginPage() {
  const navigate = useNavigate();
  const { authError, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function signInAs(userId: string) {
    const selectedUser = mockStore.users.find((user) => user.id === userId);

    if (!selectedUser) {
      return;
    }

    void signIn(selectedUser.id);
    navigate(roleHomePath(selectedUser.role), { replace: true });
  }

  async function handleApiSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const signedInUser = await signIn({ email, password });
    setIsSubmitting(false);

    if (signedInUser) {
      navigate(roleHomePath(signedInUser.role), { replace: true });
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-muted px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-panel">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-md bg-primary text-white">
            <Stethoscope size={22} />
          </span>
          <div>
            <p className="text-sm font-medium text-primary">CareFlow</p>
            <h1 className="text-2xl font-semibold text-text">Đăng nhập</h1>
          </div>
        </div>
        {isApiMode ? (
          <form className="mt-6 grid gap-4" onSubmit={handleApiSignIn}>
            <label className="grid gap-1 text-sm font-medium text-text" htmlFor="login-email">
              Email
              <input
                autoComplete="email"
                className="h-11 rounded-md border border-border bg-surface px-3 text-text"
                id="login-email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-text" htmlFor="login-password">
              Mật khẩu
              <input
                autoComplete="current-password"
                className="h-11 rounded-md border border-border bg-surface px-3 text-text"
                id="login-password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>
            {authError ? <p className="text-sm text-danger" role="alert">{authError}</p> : null}
            <button
              className="h-11 rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              Đăng nhập
            </button>
          </form>
        ) : (
          <>
            <p className="mt-4 text-sm text-text-muted">Chọn tài khoản mẫu để vào không gian làm việc tương ứng.</p>
            <div className="mt-6 grid gap-3">
              {mockStore.users.map((user) => (
                <button
                  className="flex items-center justify-between rounded-md border border-border px-4 py-3 text-left text-sm font-medium text-text transition-colors hover:border-primary hover:bg-surface-muted"
                  key={user.id}
                  onClick={() => signInAs(user.id)}
                  type="button"
                >
                  <span>{`${user.role[0].toUpperCase()}${user.role.slice(1)} Demo`}</span>
                  <span className="text-text-muted">{user.displayName}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
