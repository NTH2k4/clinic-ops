import { KeyRound } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { isApiMode } from "../../lib/dataSource";
import { useAuth } from "./AuthProvider";

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
        <label className="grid gap-1 text-sm font-medium text-text" htmlFor="current-password">
          Mật khẩu hiện tại
          <input autoComplete="current-password" className="h-11 rounded-md border border-border bg-surface px-3 text-text transition-colors hover:border-border-strong focus:border-accent" id="current-password" onChange={(event) => setCurrentPassword(event.target.value)} required type="password" value={currentPassword} />
        </label>
        <label className="grid gap-1 text-sm font-medium text-text" htmlFor="new-password">
          Mật khẩu mới
          <input autoComplete="new-password" className="h-11 rounded-md border border-border bg-surface px-3 text-text transition-colors hover:border-border-strong focus:border-accent" id="new-password" minLength={8} onChange={(event) => setNewPassword(event.target.value)} required type="password" value={newPassword} />
        </label>
        {authError ? <p className="text-sm text-danger" role="alert">{authError}</p> : null}
        <button className="h-11 rounded-md bg-primary px-4 text-sm font-semibold text-white shadow-panel transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
          Đổi mật khẩu
        </button>
      </form>
    </section>
  );
}
