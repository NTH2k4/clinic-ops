import { Check, KeyRound, Pencil, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { isApiMode } from "../../lib/dataSource";
import { useAuth } from "./AuthProvider";
import { PasswordField } from "./PasswordField";

const PASSWORD_PATTERN = "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+";
const PASSWORD_POLICY_TITLE = "Mật khẩu cần có ít nhất 10 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.";

const roleLabels = {
  admin: "Quản trị",
  doctor: "Bác sĩ",
  nurse: "Điều dưỡng",
  patient: "Người dùng",
  receptionist: "Lễ tân",
} as const;

const statusLabels = {
  active: "Đang hoạt động",
  inactive: "Ngưng hoạt động",
  locked: "Đã khóa",
} as const;

function passwordIssues(value: string) {
  const issues: string[] = [];
  if (value.length < 10) issues.push("Mật khẩu cần có ít nhất 10 ký tự.");
  if (!/[a-z]/.test(value)) issues.push("Mật khẩu cần có chữ thường.");
  if (!/[A-Z]/.test(value)) issues.push("Mật khẩu cần có chữ hoa.");
  if (!/\d/.test(value)) issues.push("Mật khẩu cần có số.");
  if (!/[^A-Za-z0-9]/.test(value)) issues.push("Mật khẩu cần có ký tự đặc biệt.");
  if (new TextEncoder().encode(value).length > 72) issues.push("Mật khẩu cần tối đa 72 bytes UTF-8.");
  return issues;
}

export function AccountPage() {
  const { authError, changePassword, updateProfile, user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hasTouchedNewPassword, setHasTouchedNewPassword] = useState(false);
  const [hasTouchedConfirmPassword, setHasTouchedConfirmPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const visiblePasswordIssues = hasTouchedNewPassword ? passwordIssues(newPassword) : [];
  const isConfirmPasswordMismatch = hasTouchedConfirmPassword && confirmPassword.length > 0 && newPassword !== confirmPassword;

  useEffect(() => {
    if (!isEditingProfile) {
      setDisplayName(user?.displayName ?? "");
      setEmail(user?.email ?? "");
    }
  }, [isEditingProfile, user?.displayName, user?.email]);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingProfile(true);
    const didUpdate = await updateProfile({ displayName, email });
    setIsSavingProfile(false);
    if (didUpdate) setIsEditingProfile(false);
  }

  function handleProfileCancel() {
    setDisplayName(user?.displayName ?? "");
    setEmail(user?.email ?? "");
    setIsEditingProfile(false);
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setHasTouchedNewPassword(true);
    setHasTouchedConfirmPassword(true);

    if (passwordIssues(newPassword).length > 0) return;
    if (newPassword !== confirmPassword) {
      setFormError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsSubmittingPassword(true);
    const didChange = await changePassword({ currentPassword, newPassword });
    setIsSubmittingPassword(false);

    if (!didChange) return;
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <section className="mx-auto w-full max-w-5xl">
      <p className="text-sm font-medium text-primary">Tài khoản</p>
      <h1 className="mt-1 text-2xl font-semibold text-text">Tài khoản của tôi</h1>
      <p className="mt-2 text-sm text-text-muted">Quản lý thông tin đăng nhập và bảo mật tài khoản.</p>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.75fr)]">
        <section className="rounded-lg border border-border bg-surface p-5 shadow-panel" aria-labelledby="account-profile-title">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-md bg-primary text-white">
                <UserRound size={19} />
              </span>
              <div>
                <p className="text-sm font-medium text-primary">Thông tin cá nhân</p>
                <h2 className="text-lg font-semibold text-text" id="account-profile-title">{user?.displayName ?? "Người dùng"}</h2>
              </div>
            </div>
            {!isEditingProfile ? (
              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-text transition-colors hover:bg-surface-muted" onClick={() => setIsEditingProfile(true)} type="button">
                <Pencil aria-hidden="true" size={16} />
                Sửa thông tin
              </button>
            ) : null}
          </div>
          <form className="mt-5 grid gap-4" onSubmit={handleProfileSubmit}>
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <label className="grid gap-1 font-medium text-text" htmlFor="account-display-name">
                Họ tên
                <input autoComplete="name" className="h-11 rounded-md border border-border bg-surface px-3 text-text transition-colors disabled:bg-surface-muted disabled:text-text-muted hover:border-border-strong focus:border-accent" disabled={!isEditingProfile || isSavingProfile} id="account-display-name" onChange={(event) => setDisplayName(event.target.value)} required value={displayName} />
              </label>
              <label className="grid gap-1 font-medium text-text" htmlFor="account-email">
                Email
                <input autoComplete="email" className="h-11 rounded-md border border-border bg-surface px-3 text-text transition-colors disabled:bg-surface-muted disabled:text-text-muted hover:border-border-strong focus:border-accent" disabled={!isEditingProfile || isSavingProfile} id="account-email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
              </label>
              <label className="grid gap-1 font-medium text-text" htmlFor="account-role">
                Vai trò
                <input className="h-11 rounded-md border border-border bg-surface-muted px-3 text-text-muted" disabled id="account-role" readOnly value={user ? roleLabels[user.role] : "Chưa có thông tin"} />
              </label>
              <label className="grid gap-1 font-medium text-text" htmlFor="account-status">
                Trạng thái
                <input className="h-11 rounded-md border border-border bg-surface-muted px-3 text-text-muted" disabled id="account-status" readOnly value={user ? statusLabels[user.status] : "Chưa có thông tin"} />
              </label>
            </div>
            {authError && isEditingProfile ? <p className="text-sm text-danger" role="alert">{authError}</p> : null}
            {isEditingProfile ? (
              <div className="flex flex-wrap gap-2">
                <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-white shadow-panel transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60" disabled={isSavingProfile} type="submit">
                  <Check aria-hidden="true" size={16} />
                  {isSavingProfile ? "Đang lưu..." : "Xác nhận"}
                </button>
                <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-text transition-colors hover:bg-surface-muted" disabled={isSavingProfile} onClick={handleProfileCancel} type="button">
                  <X aria-hidden="true" size={16} />
                  Hủy
                </button>
              </div>
            ) : null}
          </form>
        </section>

        <section className="rounded-lg border border-border bg-surface p-5 shadow-panel" aria-labelledby="account-password-title">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-md bg-primary text-white">
                <KeyRound size={19} />
              </span>
              <div>
                <p className="text-sm font-medium text-primary">Bảo mật</p>
                <h2 className="text-lg font-semibold text-text" id="account-password-title">Đổi mật khẩu</h2>
              </div>
            </div>
            {isApiMode && !isPasswordFormOpen ? (
              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-text transition-colors hover:bg-surface-muted" onClick={() => setIsPasswordFormOpen(true)} type="button">
                <KeyRound aria-hidden="true" size={16} />
                Đổi mật khẩu
              </button>
            ) : null}
          </div>
          {!isApiMode ? (
            <p className="mt-5 rounded-md border border-border bg-surface-muted p-3 text-sm text-text-muted">
              Đổi mật khẩu chỉ khả dụng khi chạy với backend API.
            </p>
          ) : isPasswordFormOpen ? (
            <form className="mt-5 grid gap-4" onSubmit={handlePasswordSubmit}>
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
                onBlur={() => setHasTouchedNewPassword(true)}
                onChange={setNewPassword}
                pattern={PASSWORD_PATTERN}
                required
                title={PASSWORD_POLICY_TITLE}
                value={newPassword}
              />
              <PasswordField
                autoComplete="new-password"
                id="confirm-new-password"
                label="Nhập lại mật khẩu mới"
                minLength={10}
                onBlur={() => setHasTouchedConfirmPassword(true)}
                onChange={setConfirmPassword}
                pattern={PASSWORD_PATTERN}
                required
                title="Nhập lại đúng mật khẩu mới."
                value={confirmPassword}
              />
              {visiblePasswordIssues.length > 0 || isConfirmPasswordMismatch || formError || authError ? (
                <div className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger" role="alert">
                  {visiblePasswordIssues.length > 0 ? (
                    <ul className="list-disc space-y-1 pl-5">
                      {visiblePasswordIssues.map((issue) => <li key={issue}>{issue}</li>)}
                    </ul>
                  ) : isConfirmPasswordMismatch ? (
                    <p>Mật khẩu xác nhận không khớp.</p>
                  ) : (
                    <p>{formError || authError}</p>
                  )}
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white shadow-panel transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmittingPassword} type="submit">
                  <Check aria-hidden="true" size={16} />
                  {isSubmittingPassword ? "Đang đổi mật khẩu..." : "Xác nhận đổi mật khẩu"}
                </button>
                <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-semibold text-text transition-colors hover:bg-surface-muted" disabled={isSubmittingPassword} onClick={() => setIsPasswordFormOpen(false)} type="button">
                  <X aria-hidden="true" size={16} />
                  Hủy
                </button>
              </div>
            </form>
          ) : (
            <p className="mt-5 rounded-md border border-border bg-surface-muted p-3 text-sm text-text-muted">
              Form đổi mật khẩu sẽ hiển thị sau khi bạn kích hoạt thao tác.
            </p>
          )}
        </section>
      </div>
    </section>
  );
}
