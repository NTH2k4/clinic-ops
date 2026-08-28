import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { auditActionLabel, auditEntityLabel } from "../audit/auditLabels";
import { auditQueryOptions } from "../audit/auditService";
import { formatDateTime } from "../../lib/dateTime";
import type { AuditEntityType } from "../../types/models";

export function AuditLog() {
  const [entityType, setEntityType] = useState<"" | AuditEntityType>("");
  const [action, setAction] = useState("");
  const filters = { entityType: entityType || undefined, action: action || undefined, page: 1, pageSize: 100 };
  const { data: auditResponse } = useQuery(auditQueryOptions.list(filters));
  const events = auditResponse?.data ?? [];
  const actions = [...new Set(events.map((event) => event.action))];
  const entityTypes = [...new Set(events.map((event) => event.entityType))];

  function resetFilters() {
    setEntityType("");
    setAction("");
  }

  return (
    <section className="mx-auto max-w-6xl">
      <p className="text-sm font-medium text-primary">Tuân thủ và theo dõi</p>
      <h1 className="mt-1 text-2xl font-semibold text-text">Nhật ký kiểm toán</h1>
      <fieldset className="mt-5 rounded-md border border-border bg-surface p-4 shadow-sm">
        <legend className="px-1 text-base font-semibold text-text">Bộ lọc nhật ký kiểm toán</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <label className="text-sm font-medium text-text">Loại đối tượng<select className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3" onChange={(event) => setEntityType(event.target.value as "" | AuditEntityType)} value={entityType}><option value="">Tất cả đối tượng</option>{entityTypes.map((type) => <option key={type} value={type}>{auditEntityLabel(type)}</option>)}</select></label>
          <label className="text-sm font-medium text-text">Hành động<select className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3" onChange={(event) => setAction(event.target.value)} value={action}><option value="">Tất cả hành động</option>{actions.map((item) => <option key={item} value={item}>{auditActionLabel(item)}</option>)}</select></label>
          <button className="h-10 self-end rounded-md border border-border px-3 text-sm font-semibold text-text hover:bg-surface-muted" onClick={resetFilters} type="button">Xóa bộ lọc</button>
        </div>
        <p className="mt-3 text-sm font-medium text-text">Đang hiển thị {events.length} sự kiện kiểm toán.</p>
      </fieldset>
      <div className="mt-6 overflow-x-auto rounded-md border border-border bg-surface shadow-sm">
        <table aria-label="Sự kiện kiểm toán" className="hidden min-w-full text-left text-sm md:table">
          <thead className="bg-surface-muted text-text-muted"><tr><th className="p-3 font-medium">Thời điểm</th><th className="p-3 font-medium">Loại đối tượng</th><th className="p-3 font-medium">Hành động</th><th className="p-3 font-medium">ID đối tượng</th></tr></thead>
          <tbody>{events.map((event) => <tr className="border-t border-border" key={event.id}><td className="p-3">{formatDateTime(event.timestamp)}</td><td className="p-3">{auditEntityLabel(event.entityType)}</td><td className="p-3">{auditActionLabel(event.action)}</td><td className="p-3 text-text-muted">{event.entityId}</td></tr>)}</tbody>
        </table>
        <ul className="divide-y divide-border md:hidden">{events.map((event) => <li className="p-3" key={event.id}><p className="font-medium text-text">{auditActionLabel(event.action)}</p><p className="mt-1 text-sm text-text-muted">{auditEntityLabel(event.entityType)} · {formatDateTime(event.timestamp)}</p><p className="mt-1 text-xs text-text-muted">{event.entityId}</p></li>)}</ul>
      </div>
      {!events.length ? <p className="mt-4 text-sm text-text-muted">Không có sự kiện kiểm toán phù hợp.</p> : null}
    </section>
  );
}
