import { Bell, LogOut } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import { formatDateTime } from "../lib/dateTime";
import { mockStore } from "../mocks/mockStore";
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
  const { signOut, user } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifications = user ? mockStore.notifications.filter((notification) => notification.recipientUserId === user.id) : [];
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  function handleSignOut() {
    signOut();
    navigate("/login", { replace: true });
  }

  return (
    <header className="flex min-h-16 items-center justify-between gap-3 border-b border-border bg-surface px-4 md:px-6">
      <p className="font-semibold text-text md:hidden">CareFlow</p>
      <div className="ml-auto flex items-center gap-2">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-text">{user?.displayName}</p>
          <p className="text-xs text-text-muted">{user?.role}</p>
        </div>
        <RoleSwitcher />
        <div className="relative">
          <button
            aria-label="Thông báo"
            aria-expanded={notificationsOpen}
            aria-haspopup="dialog"
            className="relative flex h-11 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-text-muted hover:bg-surface-muted hover:text-text"
            onClick={() => setNotificationsOpen((open) => !open)}
            type="button"
          >
            <Bell aria-hidden="true" size={18} />
            <span>Thông báo</span>
            {unreadCount ? <span aria-hidden="true" className="flex size-5 items-center justify-center rounded-full bg-danger text-xs font-semibold text-white">{unreadCount}</span> : null}
          </button>
          {notificationsOpen ? <section aria-label="Thông báo" className="absolute right-0 z-20 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-md border border-border bg-surface p-3 shadow-panel" role="dialog">
            <h2 className="text-base font-semibold text-text">Thông báo</h2>
            <ul className="mt-2 max-h-96 divide-y divide-border overflow-y-auto">
              {notifications.length ? notifications.map((notification) => <li className={`py-3 ${notification.readAt ? "font-normal" : "font-semibold"}`} key={notification.id}>
                <div className="flex items-start gap-2"><span aria-label={notification.readAt ? "Đã đọc" : "Chưa đọc"} className={`mt-1.5 size-2 shrink-0 rounded-full ${notification.readAt ? "bg-border" : "bg-primary"}`} /><div className="min-w-0"><p className="text-sm text-text">{notification.title}</p><p className="mt-1 text-sm font-normal text-text-muted">{notification.message}</p><p className="mt-1 text-xs font-normal text-text-muted">{formatDateTime(notification.createdAt)}</p>{notification.referenceType && user ? <button className="mt-2 text-sm font-semibold text-primary hover:underline" onClick={() => { setNotificationsOpen(false); navigate(notificationDestination(notification.referenceType, user.role)); }} type="button">Mở {notification.referenceType} {notification.referenceId}</button> : null}</div></div>
              </li>) : <li className="py-3 text-sm text-text-muted">Không có thông báo.</li>}
            </ul>
          </section> : null}
        </div>
        <button
          aria-label="Đăng xuất"
          className="flex size-11 items-center justify-center rounded-md border border-border text-text-muted hover:bg-surface-muted hover:text-text"
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
