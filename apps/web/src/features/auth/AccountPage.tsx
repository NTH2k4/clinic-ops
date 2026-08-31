import { KeyRound, UserRound } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { isApiMode } from "../../lib/dataSource";
import { useAuth } from "./AuthProvider";
import { PasswordField } from "./PasswordField";

const PASSWORD_PATTERN = "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+";

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

const profileTypeLabels = {
  doctor: "Hồ sơ bác sĩ",
  patient: "Hồ sơ bệnh nhân",
  staff: "Hồ sơ nhân sự",
} as const;

export function AccountPage() {
  const { authError, changePassword, linkedProfile, user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    await changePassword({ currentPassword, newPassword });
    setIsSubmitting(false);
  }

  return (
    <section className="mx-auto w-full max-w-5xl">
      <p className="text-sm font-medium text-primary">Tài khoản</p>
      <h1 className="mt-1 text-2xl font-semibold text-text">Tài khoản của tôi</h1>
      <p className="mt-2 text-sm text-text-muted">Quản lý thông tin đăng nhập và bảo mật tài khoản.</p>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.75fr)]">
        <section className="rounded-lg border border-border bg-surface p-5 shadow-panel" aria-labelledby="account-profile-title">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-md bg-primary text-white">
              <UserRound size={19} />
            </span>
            <div>
              <p className="text-sm font-medium text-primary">Thông tin cá nhân</p>
              <h2 className="text-lg font-semibold text-text" id="account-profile-title">{user?.displayName ?? "Người dùng"}</h2>
            </div>
          </div>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-text-muted">Họ tên</dt>
              <dd className="mt-1 font-medium text-text">{user?.displayName ?? "Chưa có thông tin"}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Email</dt>
              <dd className="mt-1 font-medium text-text">{user?.email ?? "Chưa có thông tin"}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Vai trò</dt>
              <dd className="mt-1 font-medium text-text">{user ? roleLabels[user.role] : "Chưa có thông tin"}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Trạng thái</dt>
              <dd className="mt-1 font-medium text-text">{user ? statusLabels[user.status] : "Chưa có thông tin"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-text-muted">Hồ sơ liên kết</dt>
              <dd className="mt-1 font-medium text-text">
                {linkedProfile ? `${profileTypeLabels[linkedProfile.type]} ${linkedProfile.id}` : "Chưa liên kết hồ sơ nghiệp vụ"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-border bg-surface p-5 shadow-panel" aria-labelledby="account-password-title">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-md bg-primary text-white">
              <KeyRound size={19} />
            </span>
            <div>
              <p className="text-sm font-medium text-primary">Bảo mật</p>
              <h2 className="text-lg font-semibold text-text" id="account-password-title">Đổi mật khẩu</h2>
            </div>
          </div>
          {isApiMode ? (
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
                {isSubmitting ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
              </button>
            </form>
          ) : (
            <p className="mt-5 rounded-md border border-border bg-surface-muted p-3 text-sm text-text-muted">
              Đổi mật khẩu chỉ khả dụng khi chạy với backend API.
            </p>
          )}
        </section>
      </div>
    </section>
  );
}
