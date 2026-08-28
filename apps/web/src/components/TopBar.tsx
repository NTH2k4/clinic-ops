import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, KeyRound, LogOut, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import { notificationQueryOptions, notificationService } from "../features/notifications/notificationService";
import { formatDateTime } from "../lib/dateTime";
import { isApiMode } from "../lib/dataSource";
import type { ReferenceType, UserRole } from "../types/models";
import { RoleSwitcher } from "./RoleSwitcher";

function notificationDestination(referenceType: ReferenceType | undefined, role: UserRole): string {
  if (referenceType === "appointment") {
    if (role === "patient") return "/app/patient/appointments";
    if (role === "receptionist" || role === "nurse") return "/app/operations/queue";
    if (role === "admin") return "/app/admin/audit";
    return "/app/doctor";
  }

  if (referenceType === "doctor_schedule") return "/app/doctor/day";
  if (referenceType === "audit_event") return "/app/admin/audit";
  return "/app";
}

export function TopBar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { signOut, user } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { data: notificationResponse } = useQuery({ ...notificationQueryOptions.list(user?.id ?? ""), enabled: Boolean(user) });
  const markRead = useMutation({
    mutationFn: notificationService.markRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications", "list", user?.id] });
    },
  });
  const notifications = notificationResponse?.data ?? [];
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  function handleSignOut() {
    signOut();
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between gap-3 border-b border-border bg-white/90 px-4 shadow-[0_1px_0_rgb(212_226_223/0.55)] backdrop-blur md:px-6">
      <p className="font-semibold text-text md:hidden">CareFlow</p>
      <div className="ml-auto flex items-center gap-2">
        <div className="hidden rounded-md border border-border bg-surface px-3 py-1.5 text-right sm:block">
          <p className="text-sm font-medium text-text">{user?.displayName}</p>
          <p className="text-xs text-text-muted">{user?.role}</p>
        </div>
        <RoleSwitcher />
        {isApiMode ? (
          <button
            aria-label="Bảo mật tài khoản"
            className="flex size-11 items-center justify-center rounded-md border border-border bg-surface text-text-muted transition-colors hover:border-border-strong hover:bg-surface-muted hover:text-text"
            onClick={() => navigate("/app/account/security")}
            title="Bảo mật tài khoản"
            type="button"
          >
            <KeyRound aria-hidden="true" size={18} />
          </button>
        ) : null}
        <div className="relative">
          <button
            aria-label="Thông báo"
            aria-expanded={notificationsOpen}
            aria-haspopup="dialog"
            className="relative flex h-11 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-semibold text-text-muted transition-colors hover:border-border-strong hover:bg-surface-muted hover:text-text"
            onClick={() => setNotificationsOpen((open) => !open)}
            type="button"
          >
            <Bell aria-hidden="true" size={18} />
            <span className="hidden sm:inline">Thông báo</span>
            {unreadCount ? <span aria-hidden="true" className="flex size-5 items-center justify-center rounded-full bg-danger text-xs font-semibold text-white shadow-panel">{unreadCount}</span> : null}
          </button>
          {notificationsOpen ? (
            <section aria-label="Thông báo" className="fixed inset-x-4 top-16 z-20 rounded-lg border border-border bg-surface shadow-popover sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[min(22rem,calc(100vw-2rem))]" role="dialog">
              <div className="flex items-start justify-between gap-3 border-b border-border p-4">
                <div>
                  <h2 className="text-base font-semibold text-text">Thông báo</h2>
                  <p className="mt-1 text-sm text-text-muted">
                    {notifications.length} thông báo, {unreadCount} chưa đọc
                  </p>
                </div>
                <button
                  aria-label="Đóng thông báo"
                  className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
                  onClick={() => setNotificationsOpen(false)}
                  type="button"
                >
                  <X aria-hidden="true" size={17} />
                </button>
              </div>
              <ul className="max-h-96 divide-y divide-border overflow-y-auto">
                {notifications.length ? notifications.map((notification) => (
                  <li className={`px-4 py-3 ${notification.readAt ? "font-normal" : "bg-teal-50 font-semibold"}`} key={notification.id}>
                    <div className="flex items-start gap-3">
                      <span aria-label={notification.readAt ? "Đã đọc" : "Chưa đọc"} className={`mt-1.5 size-2.5 shrink-0 rounded-full ${notification.readAt ? "bg-border" : "bg-primary"}`} />
                      <div className="min-w-0">
                        <p className="text-sm text-text">{notification.title}</p>
                        <p className="mt-1 text-sm font-normal text-text-muted">{notification.message}</p>
                        <p className="mt-1 text-xs font-normal text-text-muted">{formatDateTime(notification.createdAt)}</p>
                        {!notification.readAt ? (
                          <button
                            aria-label={`Đánh dấu ${notification.title} là đã đọc`}
                            className="mt-2 flex size-8 items-center justify-center rounded-md border border-border text-text-muted hover:bg-surface-muted hover:text-text disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={markRead.isPending}
                            onClick={() => markRead.mutate(notification.id)}
                            title="Đánh dấu đã đọc"
                            type="button"
                          >
                            <Check aria-hidden="true" size={16} />
                          </button>
                        ) : null}
                        {notification.referenceType && user ? (
                          <button
                            className="mt-2 text-sm font-semibold text-primary transition-colors hover:text-primary-hover hover:underline"
                            onClick={() => {
                              setNotificationsOpen(false);
                              navigate(notificationDestination(notification.referenceType, user.role));
                            }}
                            type="button"
                          >
                            Mở {notification.referenceType} {notification.referenceId}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </li>
                )) : <li className="px-4 py-3 text-sm text-text-muted">Không có thông báo.</li>}
              </ul>
            </section>
          ) : null}
        </div>
        <button
          aria-label="Đăng xuất"
          className="flex size-11 items-center justify-center rounded-md border border-border bg-surface text-text-muted transition-colors hover:border-border-strong hover:bg-surface-muted hover:text-text"
          onClick={handleSignOut}
          title="Đăng xuất"
          type="button"
        >
          <LogOut aria-hidden="true" size={18} />
        </button>
      </div>
    </header>
  );
}
