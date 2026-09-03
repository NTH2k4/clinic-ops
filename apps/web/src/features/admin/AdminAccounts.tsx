import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { ShimmerList } from "../../components/LoadingState";
import type { ApiAccountStatus } from "../../lib/api/users";
import type { ApiListResponse } from "../../lib/api/types";
import type { UserRole } from "../../types/models";
import { adminAccountsQueryOptions, adminAccountsService } from "./adminAccountsService";
import type { AdminAccount } from "./adminAccountsService";

const roles: UserRole[] = ["patient", "doctor", "receptionist", "nurse", "admin"];
const statuses: ApiAccountStatus[] = ["active", "locked", "inactive"];
const roleLabels: Record<UserRole, string> = {
  admin: "Quản trị",
  doctor: "Bác sĩ",
  nurse: "Điều dưỡng",
  patient: "Người dùng",
  receptionist: "Lễ tân",
};
const statusLabels: Record<ApiAccountStatus, string> = {
  active: "Đang hoạt động",
  inactive: "Không hoạt động",
  locked: "Đã khóa",
};
type PendingAccountAction = {
  account: AdminAccount;
  action: "lock" | "unlock" | "deactivate" | "reset-password";
} | null;

const actionDialogCopy: Record<NonNullable<PendingAccountAction>["action"], { title: string; confirmLabel: string; description: (name: string) => string }> = {
  deactivate: {
    title: "Xác nhận vô hiệu hóa tài khoản",
    confirmLabel: "Vô hiệu hóa tài khoản",
    description: (name) => `Tài khoản ${name} sẽ không thể đăng nhập và mọi phiên đang hoạt động sẽ bị hủy.`,
  },
  lock: {
    title: "Xác nhận khóa tài khoản",
    confirmLabel: "Khóa tài khoản",
    description: (name) => `Tài khoản ${name} sẽ bị khóa đăng nhập và mọi phiên đang hoạt động sẽ bị hủy.`,
  },
  "reset-password": {
    title: "Xác nhận đặt lại mật khẩu",
    confirmLabel: "Đặt lại mật khẩu",
    description: (name) => `Mật khẩu của ${name} sẽ được đặt lại thành mật khẩu tạm thời careflow123 và mọi phiên đang hoạt động sẽ bị hủy.`,
  },
  unlock: {
    title: "Xác nhận mở khóa tài khoản",
    confirmLabel: "Mở khóa tài khoản",
    description: (name) => `Tài khoản ${name} sẽ được mở khóa để có thể đăng nhập lại.`,
  },
};

export function AdminAccounts() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<"" | UserRole>("");
  const [status, setStatus] = useState<"" | ApiAccountStatus>("");
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAccountAction>(null);
  const filters = { q: q || undefined, role: role || undefined, status: status || undefined, page: 1, pageSize: 100 };
  const { data: response, isLoading, error } = useQuery(adminAccountsQueryOptions.list(filters));
  const accounts = response?.data ?? [];

  const refreshAccounts = () => queryClient.invalidateQueries({ queryKey: ["admin", "accounts"] });
  const statusAction = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "lock" | "unlock" | "deactivate" }) => {
      if (action === "lock") return adminAccountsService.lockUser(id);
      if (action === "unlock") return adminAccountsService.unlockUser(id);
      return adminAccountsService.deactivateUser(id);
    },
    onSuccess: (updatedAccount) => {
      setResetError(null);
      queryClient.setQueriesData<ApiListResponse<AdminAccount>>({ queryKey: ["admin", "accounts"] }, (current) => current && {
        ...current,
        data: current.data.map((account) => account.id === updatedAccount.id ? updatedAccount : account),
      });
      refreshAccounts();
    },
  });

  async function resetPassword(id: string) {
    setTemporaryPassword(null);
    setResetError(null);
    setIsResettingPassword(true);
    try {
      const result = await adminAccountsService.resetPassword(id);
      setResetError(null);
      setTemporaryPassword(result.temporaryPassword);
    } catch (caughtError) {
      setResetError(caughtError instanceof Error ? caughtError.message : "Không thể đặt lại mật khẩu.");
    } finally {
      setIsResettingPassword(false);
    }
  }

  function confirmPendingAction() {
    if (!pendingAction) return;
    if (pendingAction.action === "reset-password") {
      void resetPassword(pendingAction.account.id);
    } else {
      statusAction.mutate({ id: pendingAction.account.id, action: pendingAction.action });
    }
    setPendingAction(null);
  }

  const pendingActionCopy = pendingAction ? actionDialogCopy[pendingAction.action] : null;

  return (
    <section className="mx-auto max-w-7xl">
      <p className="text-sm font-medium text-primary">Quản trị truy cập</p>
      <h1 className="mt-1 text-2xl font-semibold text-text">Tài khoản</h1>
      <fieldset className="mt-5 border-y border-border py-3">
        <legend className="sr-only">Bộ lọc tài khoản</legend>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_10rem_10rem]">
          <label className="text-sm font-medium text-text">Tìm kiếm<input className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-3" onChange={(event) => setQ(event.target.value)} placeholder="Tên, email, số điện thoại" value={q} /></label>
          <label className="text-sm font-medium text-text">Vai trò<select className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-3" onChange={(event) => setRole(event.target.value as "" | UserRole)} value={role}><option value="">Tất cả vai trò</option>{roles.map((item) => <option key={item} value={item}>{roleLabels[item]}</option>)}</select></label>
          <label className="text-sm font-medium text-text">Trạng thái<select className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-3" onChange={(event) => setStatus(event.target.value as "" | ApiAccountStatus)} value={status}><option value="">Tất cả trạng thái</option>{statuses.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}</select></label>
        </div>
      </fieldset>
      {temporaryPassword ? <div aria-label="Kết quả mật khẩu tạm thời" className="mt-4 flex items-center justify-between gap-3 border border-warning bg-surface px-3 py-2 text-sm" role="status"><span>Mật khẩu tạm thời: <code className="font-semibold text-text">{temporaryPassword}</code></span><button className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-text hover:bg-surface-muted" onClick={() => setTemporaryPassword(null)} type="button">Đóng</button></div> : null}
      {statusAction.error ? <p className="mt-4 text-sm text-danger" role="alert">{statusAction.error instanceof Error ? statusAction.error.message : "Không thể cập nhật trạng thái tài khoản."}</p> : null}
      {resetError ? <p className="mt-4 text-sm text-danger" role="alert">{resetError}</p> : null}
      {error ? <p className="mt-4 text-sm text-danger" role="alert">{error instanceof Error ? error.message : "Không thể tải danh sách tài khoản."}</p> : null}
      {isLoading ? <div className="mt-4"><ShimmerList label="Đang tải tài khoản" rows={5} /></div> : <div className="mt-4 overflow-x-auto border border-border bg-surface">
        <table aria-label="Tài khoản" className="min-w-full text-left text-sm">
          <thead className="bg-surface-muted text-xs text-text-muted"><tr><th className="p-2 font-medium">Tài khoản</th><th className="p-2 font-medium">Email</th><th className="p-2 font-medium">Vai trò</th><th className="p-2 font-medium">Trạng thái</th><th className="p-2 text-right font-medium">Thao tác</th></tr></thead>
          <tbody>{accounts.map((account) => <tr className="border-t border-border" key={account.id}><td className="p-2 font-medium text-text">{account.displayName}</td><td className="p-2 text-text-muted">{account.email}</td><td className="p-2">{roleLabels[account.role]}</td><td className="p-2">{statusLabels[account.status]}</td><td className="p-2"><div className="flex justify-end gap-2">{account.status === "locked" ? <button aria-label={`Mở khóa ${account.displayName}`} className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-text hover:bg-surface-muted" disabled={statusAction.isPending} onClick={() => setPendingAction({ account, action: "unlock" })} type="button">Mở khóa</button> : account.status === "active" ? <button aria-label={`Khóa ${account.displayName}`} className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-text hover:bg-surface-muted" disabled={statusAction.isPending} onClick={() => setPendingAction({ account, action: "lock" })} type="button">Khóa</button> : null}<button aria-label={`Vô hiệu hóa ${account.displayName}`} className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-danger hover:bg-surface-muted" disabled={account.status === "inactive" || statusAction.isPending} onClick={() => setPendingAction({ account, action: "deactivate" })} type="button">Vô hiệu hóa</button><button aria-label={`Đặt lại mật khẩu cho ${account.displayName}`} className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-text hover:bg-surface-muted" disabled={isResettingPassword} onClick={() => setPendingAction({ account, action: "reset-password" })} type="button">Đặt lại mật khẩu</button></div></td></tr>)}</tbody>
        </table>
      </div>}
      {!isLoading && !accounts.length ? <p className="mt-3 text-sm text-text-muted">Không có tài khoản nào khớp bộ lọc.</p> : null}
      <ConfirmDialog
        confirmLabel={pendingActionCopy?.confirmLabel}
        description={pendingAction && pendingActionCopy ? pendingActionCopy.description(pendingAction.account.displayName) : ""}
        isOpen={Boolean(pendingAction)}
        onCancel={() => setPendingAction(null)}
        onConfirm={confirmPendingAction}
        title={pendingActionCopy?.title ?? "Xác nhận thao tác"}
      />
    </section>
  );
}
