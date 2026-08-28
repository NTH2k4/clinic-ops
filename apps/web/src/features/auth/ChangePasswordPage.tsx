import { KeyRound } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { isApiMode } from "../../lib/dataSource";
import { useAuth } from "./AuthProvider";
import { PasswordField } from "./PasswordField";

const PASSWORD_PATTERN = "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+";

export function ChangePasswordPage() {
  const { authError, changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isApiMode) {
    return <Navigate replace to="/app" />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    await changePassword({ currentPassword, newPassword });
    setIsSubmitting(false);
  }

  return (
    <section className="mx-auto w-full max-w-lg rounded-lg border border-border bg-surface p-5 shadow-panel">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-md bg-primary text-white"><KeyRound size={19} /></span>
        <div>
          <p className="text-sm font-medium text-primary">Tài khoản</p>
          <h1 className="text-xl font-semibold text-text">Đổi mật khẩu</h1>
        </div>
      </div>
      <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
        <PasswordField
          autoComplete="current-password"
          id="current-password"
          label="Mật khẩu hiện tại"
          onChange={setCurrentPassword}
          required
          value={currentPassword}
        />
        <PasswordField
          autoComplete="new-password"
          id="new-password"
          label="Mật khẩu mới"
          minLength={10}
          onChange={setNewPassword}
          pattern={PASSWORD_PATTERN}
          required
          title="Mật khẩu cần có ít nhất 10 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt."
          value={newPassword}
        />
        {authError ? <p className="text-sm text-danger" role="alert">{authError}</p> : null}
        <button className="h-11 rounded-md bg-primary px-4 text-sm font-semibold text-white shadow-panel transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
          Đổi mật khẩu
        </button>
      </form>
    </section>
  );
}
