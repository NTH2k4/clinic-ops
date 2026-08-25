import { Stethoscope } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { mockStore } from "../../mocks/mockStore";
import { roleHomePath } from "../../routes/RoleHomeRedirect";
import { useAuth } from "./AuthProvider";

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  function signInAs(userId: string) {
    const selectedUser = mockStore.users.find((user) => user.id === userId);

    if (!selectedUser) {
      return;
    }

    signIn(selectedUser.id);
    navigate(roleHomePath(selectedUser.role), { replace: true });
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
      </section>
    </main>
  );
}
