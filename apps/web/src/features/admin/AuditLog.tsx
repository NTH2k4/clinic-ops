import { useMemo, useState } from "react";
import { formatDateTime } from "../../lib/dateTime";
import { mockStore } from "../../mocks/mockStore";
import type { AuditEntityType } from "../../types/models";

export function AuditLog() {
  const [entityType, setEntityType] = useState<"" | AuditEntityType>("");
  const [action, setAction] = useState("");
  const actions = useMemo(() => [...new Set(mockStore.auditEvents.map((event) => event.action))], []);
  const events = mockStore.auditEvents.filter((event) => (!entityType || event.entityType === entityType) && (!action || event.action === action));
  const entityTypes = [...new Set(mockStore.auditEvents.map((event) => event.entityType))];

  function resetFilters() {
    setEntityType("");
    setAction("");
  }

  return (
    <section className="mx-auto max-w-6xl">
      <p className="text-sm font-medium text-primary">Tuân thủ và theo dõi</p>
      <h1 className="mt-1 text-2xl font-semibold text-text">Audit log</h1>
      <fieldset className="mt-5 rounded-md border border-border bg-surface p-4 shadow-sm">
        <legend className="px-1 text-base font-semibold text-text">Bộ lọc audit log</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <label className="text-sm font-medium text-text">Entity type<select className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3" onChange={(event) => setEntityType(event.target.value as "" | AuditEntityType)} value={entityType}><option value="">Tất cả entity</option>{entityTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
          <label className="text-sm font-medium text-text">Action<select className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3" onChange={(event) => setAction(event.target.value)} value={action}><option value="">Tất cả action</option>{actions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <button className="h-10 self-end rounded-md border border-border px-3 text-sm font-semibold text-text hover:bg-surface-muted" onClick={resetFilters} type="button">Xóa bộ lọc audit</button>
        </div>
        <p className="mt-3 text-sm font-medium text-text">Đang hiển thị {events.length} audit events.</p>
      </fieldset>
      <div className="mt-6 overflow-x-auto rounded-md border border-border bg-surface shadow-sm">
        <table aria-label="Audit events" className="hidden min-w-full text-left text-sm md:table">
          <thead className="bg-surface-muted text-text-muted"><tr><th className="p-3 font-medium">Thời điểm</th><th className="p-3 font-medium">Entity type</th><th className="p-3 font-medium">Action</th><th className="p-3 font-medium">Entity ID</th></tr></thead>
          <tbody>{events.map((event) => <tr className="border-t border-border" key={event.id}><td className="p-3">{formatDateTime(event.timestamp)}</td><td className="p-3">{event.entityType}</td><td className="p-3">{event.action}</td><td className="p-3 text-text-muted">{event.entityId}</td></tr>)}</tbody>
        </table>
        <ul className="divide-y divide-border md:hidden">{events.map((event) => <li className="p-3" key={event.id}><p className="font-medium text-text">{event.action}</p><p className="mt-1 text-sm text-text-muted">{event.entityType} · {formatDateTime(event.timestamp)}</p><p className="mt-1 text-xs text-text-muted">{event.entityId}</p></li>)}</ul>
      </div>
      {!events.length ? <p className="mt-4 text-sm text-text-muted">Không có audit event phù hợp.</p> : null}
    </section>
  );
}
