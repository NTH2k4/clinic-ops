import { Eye, EyeOff, Stethoscope } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { isApiMode } from "../../lib/dataSource";
import { roleHomePath } from "../../routes/RoleHomeRedirect";
import { useAuth } from "./AuthProvider";

export function RegisterPage() {
  const navigate = useNavigate();
  const { authError, register } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isApiMode) {
    return <Navigate replace to="/login" />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (password !== confirmPassword) {
      setFormError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsSubmitting(true);
    const registeredUser = await register({ displayName, email, phone, password });
    setIsSubmitting(false);

    if (registeredUser) {
      navigate(roleHomePath(registeredUser.role), { replace: true });
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f7fbfb_0%,#edf5f4_100%)] px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-panel">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-md bg-primary text-white shadow-panel">
            <Stethoscope size={22} />
          </span>
          <div>
            <p className="text-sm font-medium text-primary">CareFlow</p>
            <h1 className="text-2xl font-semibold text-text">Đăng ký tài khoản</h1>
          </div>
        </div>
        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-1 text-sm font-medium text-text" htmlFor="register-display-name">
            Họ và tên
            <input autoComplete="name" className="h-11 rounded-md border border-border bg-surface px-3 text-text transition-colors hover:border-border-strong focus:border-accent" id="register-display-name" onChange={(event) => setDisplayName(event.target.value)} required value={displayName} />
          </label>
          <label className="grid gap-1 text-sm font-medium text-text" htmlFor="register-email">
            Email
            <input autoComplete="email" className="h-11 rounded-md border border-border bg-surface px-3 text-text transition-colors hover:border-border-strong focus:border-accent" id="register-email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
          </label>
          <label className="grid gap-1 text-sm font-medium text-text" htmlFor="register-phone">
            Số điện thoại
            <input autoComplete="tel" className="h-11 rounded-md border border-border bg-surface px-3 text-text transition-colors hover:border-border-strong focus:border-accent" id="register-phone" onChange={(event) => setPhone(event.target.value)} required type="tel" value={phone} />
          </label>
          <div className="grid gap-2">
            <label className="grid gap-1 text-sm font-medium text-text" htmlFor="register-password">
              Mật khẩu
              <input autoComplete="new-password" className="h-11 rounded-md border border-border bg-surface px-3 text-text transition-colors hover:border-border-strong focus:border-accent" id="register-password" minLength={10} onChange={(event) => setPassword(event.target.value)} pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+" required title="Mật khẩu cần có ít nhất 10 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt." type={showPassword ? "text" : "password"} value={password} />
            </label>
            <label className="grid gap-1 text-sm font-medium text-text" htmlFor="register-confirm-password">
              Xác nhận mật khẩu
              <input autoComplete="new-password" className="h-11 rounded-md border border-border bg-surface px-3 text-text transition-colors hover:border-border-strong focus:border-accent" id="register-confirm-password" minLength={10} onChange={(event) => setConfirmPassword(event.target.value)} pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+" required title="Nhập lại đúng mật khẩu đã chọn." type={showPassword ? "text" : "password"} value={confirmPassword} />
            </label>
            <button aria-label={showPassword ? "Ẩn mật khẩu đăng ký" : "Hiện mật khẩu đăng ký"} className="inline-flex h-9 w-fit items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-text-muted hover:border-border-strong hover:bg-surface-muted hover:text-text" onClick={() => setShowPassword((visible) => !visible)} type="button">
              {showPassword ? <EyeOff aria-hidden="true" size={16} /> : <Eye aria-hidden="true" size={16} />}
              {showPassword ? "Ẩn" : "Hiện"}
            </button>
          </div>
          {formError || authError ? <p className="text-sm text-danger" role="alert">{formError || authError}</p> : null}
          <button className="h-11 rounded-md bg-primary px-4 text-sm font-semibold text-white shadow-panel transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
            Tạo tài khoản
          </button>
          <p className="text-sm text-text-muted">Đã có tài khoản? <Link className="font-semibold text-primary hover:text-primary-hover hover:underline" to="/login">Đăng nhập</Link></p>
        </form>
      </section>
    </main>
  );
}
