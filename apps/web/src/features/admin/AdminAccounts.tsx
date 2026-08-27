import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { ApiAccountStatus } from "../../lib/api/users";
import type { ApiListResponse } from "../../lib/api/types";
import type { UserRole } from "../../types/models";
import { adminAccountsQueryOptions, adminAccountsService } from "./adminAccountsService";
import type { AdminAccount } from "./adminAccountsService";

const roles: UserRole[] = ["patient", "doctor", "receptionist", "nurse", "admin"];
const statuses: ApiAccountStatus[] = ["active", "locked", "inactive"];

export function AdminAccounts() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<"" | UserRole>("");
  const [status, setStatus] = useState<"" | ApiAccountStatus>("");
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
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
      setResetError(caughtError instanceof Error ? caughtError.message : "Unable to reset password.");
    } finally {
      setIsResettingPassword(false);
    }
  }

  return (
    <section className="mx-auto max-w-7xl">
      <p className="text-sm font-medium text-primary">Quản trị truy cập</p>
      <h1 className="mt-1 text-2xl font-semibold text-text">Accounts</h1>
      <fieldset className="mt-5 border-y border-border py-3">
        <legend className="sr-only">Account filters</legend>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_10rem_10rem]">
          <label className="text-sm font-medium text-text">Search<input className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-3" onChange={(event) => setQ(event.target.value)} placeholder="Name, email, phone" value={q} /></label>
          <label className="text-sm font-medium text-text">Role<select className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-3" onChange={(event) => setRole(event.target.value as "" | UserRole)} value={role}><option value="">All roles</option>{roles.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label className="text-sm font-medium text-text">Status<select className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-3" onChange={(event) => setStatus(event.target.value as "" | ApiAccountStatus)} value={status}><option value="">All statuses</option>{statuses.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        </div>
      </fieldset>
      {temporaryPassword ? <div aria-label="Temporary password result" className="mt-4 flex items-center justify-between gap-3 border border-warning bg-surface px-3 py-2 text-sm" role="status"><span>Temporary password: <code className="font-semibold text-text">{temporaryPassword}</code></span><button className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-text hover:bg-surface-muted" onClick={() => setTemporaryPassword(null)} type="button">Dismiss</button></div> : null}
      {resetError ? <p className="mt-4 text-sm text-danger" role="alert">{resetError}</p> : null}
      {error ? <p className="mt-4 text-sm text-danger" role="alert">{error instanceof Error ? error.message : "Unable to load accounts."}</p> : null}
      <div className="mt-4 overflow-x-auto border border-border bg-surface">
        <table aria-label="Accounts" className="min-w-full text-left text-sm">
          <thead className="bg-surface-muted text-xs text-text-muted"><tr><th className="p-2 font-medium">Account</th><th className="p-2 font-medium">Email</th><th className="p-2 font-medium">Role</th><th className="p-2 font-medium">Status</th><th className="p-2 text-right font-medium">Actions</th></tr></thead>
          <tbody>{accounts.map((account) => <tr className="border-t border-border" key={account.id}><td className="p-2 font-medium text-text">{account.displayName}</td><td className="p-2 text-text-muted">{account.email}</td><td className="p-2">{account.role}</td><td className="p-2">{account.status}</td><td className="p-2"><div className="flex justify-end gap-2">{account.status === "locked" ? <button aria-label={`Unlock ${account.displayName}`} className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-text hover:bg-surface-muted" disabled={statusAction.isPending} onClick={() => statusAction.mutate({ id: account.id, action: "unlock" })} type="button">Unlock</button> : account.status === "active" ? <button aria-label={`Lock ${account.displayName}`} className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-text hover:bg-surface-muted" disabled={statusAction.isPending} onClick={() => statusAction.mutate({ id: account.id, action: "lock" })} type="button">Lock</button> : null}<button aria-label={`Deactivate ${account.displayName}`} className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-danger hover:bg-surface-muted" disabled={account.status === "inactive" || statusAction.isPending} onClick={() => statusAction.mutate({ id: account.id, action: "deactivate" })} type="button">Deactivate</button><button aria-label={`Reset password for ${account.displayName}`} className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-text hover:bg-surface-muted" disabled={isResettingPassword} onClick={() => { void resetPassword(account.id); }} type="button">Reset password</button></div></td></tr>)}</tbody>
        </table>
      </div>
      {isLoading ? <p className="mt-3 text-sm text-text-muted">Loading accounts...</p> : null}
      {!isLoading && !accounts.length ? <p className="mt-3 text-sm text-text-muted">No accounts match these filters.</p> : null}
    </section>
  );
}
