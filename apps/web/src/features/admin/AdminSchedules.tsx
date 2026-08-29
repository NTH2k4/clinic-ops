import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, RotateCcw, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { ClinicDateField } from "../../components/ClinicDateField";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { StatusBadge } from "../../components/StatusBadge";
import type { ApiListResponse } from "../../lib/api/types";
import type { DoctorSchedule, ScheduleType } from "../../types/models";
import { catalogQueryOptions } from "../catalog/catalogService";
import { schedulingQueryOptions, schedulingService } from "../scheduling/schedulingService";
import type { ScheduleCreateInput, ScheduleListFilters, ScheduleUpdateInput } from "../scheduling/schedulingService";

const dayOptions = [
  { value: 1, label: "Thứ Hai" },
  { value: 2, label: "Thứ Ba" },
  { value: 3, label: "Thứ Tư" },
  { value: 4, label: "Thứ Năm" },
  { value: 5, label: "Thứ Sáu" },
  { value: 6, label: "Thứ Bảy" },
  { value: 7, label: "Chủ Nhật" },
];

const scheduleTypeLabels: Record<ScheduleType, string> = {
  working: "Làm việc",
  blocked: "Chặn lịch",
  leave: "Nghỉ phép",
};

type ScheduleFormState = ScheduleCreateInput;

const defaultForm: ScheduleFormState = {
  doctorId: "",
  type: "blocked",
  dayOfWeek: 2,
  startTime: "10:00",
  endTime: "11:00",
  effectiveFrom: "2026-08-25",
  effectiveTo: "2026-08-25",
};

function doctorName(doctors: Array<{ id: string; fullName: string }>, doctorId: string): string {
  return doctors.find((doctor) => doctor.id === doctorId)?.fullName ?? doctorId;
}

function scheduleMatchesFilters(schedule: DoctorSchedule, filters: ScheduleListFilters): boolean {
  return (!filters.doctorId || schedule.doctorId === filters.doctorId)
    && (!filters.from || schedule.effectiveTo >= filters.from)
    && (!filters.to || schedule.effectiveFrom <= filters.to);
}

export function AdminSchedules() {
  const queryClient = useQueryClient();
  const [draftFilters, setDraftFilters] = useState({ doctorId: "", from: "2026-08-25", to: "2026-08-25" });
  const [appliedFilters, setAppliedFilters] = useState<ScheduleListFilters>({ from: "2026-08-25", to: "2026-08-25", page: 1, pageSize: 100 });
  const [form, setForm] = useState<ScheduleFormState>(defaultForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<DoctorSchedule | null>(null);

  const { data: doctorResponse } = useQuery(catalogQueryOptions.allDoctors({ status: "active" }));
  const doctors = doctorResponse?.data ?? [];
  const { data: scheduleResponse, isLoading, error } = useQuery(schedulingQueryOptions.schedules(appliedFilters));
  const schedules = useMemo(() => scheduleResponse?.data ?? [], [scheduleResponse?.data]);

  const sortedSchedules = useMemo(
    () => [...schedules].sort((left, right) =>
      left.effectiveFrom.localeCompare(right.effectiveFrom)
      || left.dayOfWeek - right.dayOfWeek
      || left.startTime.localeCompare(right.startTime)
      || left.doctorId.localeCompare(right.doctorId)),
    [schedules],
  );

  const refreshSchedules = () => queryClient.invalidateQueries({ queryKey: ["scheduling", "schedules"] });
  const writeScheduleToCache = (updatedSchedule: DoctorSchedule) => {
    queryClient.setQueryData<ApiListResponse<DoctorSchedule>>(schedulingQueryOptions.schedules(appliedFilters).queryKey, (current) => {
      if (!current) return current;

      const hasSchedule = current.data.some((schedule) => schedule.id === updatedSchedule.id);
      const nextData = hasSchedule && !scheduleMatchesFilters(updatedSchedule, appliedFilters)
        ? current.data.filter((schedule) => schedule.id !== updatedSchedule.id)
        : hasSchedule
        ? current.data.map((schedule) => schedule.id === updatedSchedule.id ? updatedSchedule : schedule)
        : scheduleMatchesFilters(updatedSchedule, appliedFilters) ? [updatedSchedule, ...current.data] : current.data;

      const totalDelta = hasSchedule && nextData.length < current.data.length ? -1 : !hasSchedule && nextData.length > current.data.length ? 1 : 0;
      return { ...current, data: nextData, meta: { ...current.meta, total: current.meta.total + totalDelta } };
    });
  };

  const saveMutation = useMutation({
    mutationFn: ({ id, input }: { id?: string; input: ScheduleCreateInput | ScheduleUpdateInput }) =>
      id ? schedulingService.updateSchedule(id, input) : schedulingService.createSchedule(input as ScheduleCreateInput),
    onSuccess: (updatedSchedule) => {
      setForm(defaultForm);
      setEditingId(null);
      setIsFormOpen(false);
      setFormError(null);
      writeScheduleToCache(updatedSchedule);
      refreshSchedules();
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => schedulingService.deactivateSchedule(id),
    onSuccess: (updatedSchedule) => {
      writeScheduleToCache(updatedSchedule);
      refreshSchedules();
      setDeactivateTarget(null);
    },
  });

  function updateForm<K extends keyof ScheduleFormState>(key: K, value: ScheduleFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function applyFilters() {
    setAppliedFilters({
      doctorId: draftFilters.doctorId || undefined,
      from: draftFilters.from || undefined,
      to: draftFilters.to || undefined,
      page: 1,
      pageSize: 100,
    });
  }

  function resetForm() {
    setForm(defaultForm);
    setEditingId(null);
    setIsFormOpen(false);
    setFormError(null);
  }

  function openCreateForm() {
    setForm(defaultForm);
    setEditingId(null);
    setIsFormOpen(true);
    setFormError(null);
  }

  function editSchedule(schedule: DoctorSchedule) {
    setForm({
      doctorId: schedule.doctorId,
      type: schedule.type,
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      effectiveFrom: schedule.effectiveFrom,
      effectiveTo: schedule.effectiveTo,
    });
    setEditingId(schedule.id);
    setIsFormOpen(true);
    setFormError(null);
  }

  function submitSchedule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.doctorId) {
      setFormError("Vui lòng chọn bác sĩ.");
      return;
    }
    if (form.startTime >= form.endTime) {
      setFormError("Giờ kết thúc phải sau giờ bắt đầu.");
      return;
    }
    if (form.effectiveFrom > form.effectiveTo) {
      setFormError("Ngày kết thúc hiệu lực phải bằng hoặc sau ngày bắt đầu.");
      return;
    }

    saveMutation.mutate({ id: editingId ?? undefined, input: form });
  }

  return (
    <section className="mx-auto max-w-7xl">
      <p className="text-sm font-medium text-primary">Quản trị lịch bác sĩ</p>
      <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-semibold text-text">Lịch làm việc</h1>
        <div className="flex flex-col gap-2 sm:items-end">
          <p className="text-sm font-medium text-text-muted">{scheduleResponse?.meta.total ?? schedules.length} mục lịch</p>
          <button className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-white shadow-panel hover:bg-primary-hover" onClick={openCreateForm} type="button"><Plus aria-hidden="true" size={16} />Tạo lịch</button>
        </div>
      </div>

      <fieldset className="mt-5 border-y border-border py-3">
        <legend className="sr-only">Bộ lọc lịch làm việc</legend>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_11rem_11rem_auto]">
          <label className="text-sm font-medium text-text">
            Lọc bác sĩ
            <select className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3" onChange={(event) => setDraftFilters((current) => ({ ...current, doctorId: event.target.value }))} value={draftFilters.doctorId}>
              <option value="">Tất cả bác sĩ</option>
              {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.fullName}</option>)}
            </select>
          </label>
          <ClinicDateField id="schedule-filter-from" label="Lọc từ ngày" onChange={(value) => setDraftFilters((current) => ({ ...current, from: value }))} value={draftFilters.from} />
          <ClinicDateField id="schedule-filter-to" label="Lọc đến ngày" onChange={(value) => setDraftFilters((current) => ({ ...current, to: value }))} value={draftFilters.to} />
          <button className="h-10 self-end rounded-md border border-border bg-surface px-3 text-sm font-semibold text-text hover:bg-surface-muted" onClick={applyFilters} type="button">Áp dụng bộ lọc</button>
        </div>
      </fieldset>

      {isFormOpen ? <form className="mt-5 rounded-md border border-border bg-surface p-4 shadow-sm transition-all duration-200 ease-out animate-in fade-in slide-in-from-top-1" onSubmit={submitSchedule}>
        <div className="flex flex-col gap-1 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-text">{editingId ? "Cập nhật lịch" : "Tạo lịch"}</h2>
          <button className="inline-flex h-8 items-center gap-2 self-start rounded-md border border-border px-2 text-xs font-semibold text-text hover:bg-surface-muted sm:self-auto" onClick={resetForm} type="button"><RotateCcw aria-hidden="true" size={14} />Hủy</button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <label className="text-sm font-medium text-text">
            Bác sĩ
            <select className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3" onChange={(event) => updateForm("doctorId", event.target.value)} value={form.doctorId}>
              <option value="">Chọn bác sĩ</option>
              {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.fullName}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-text">
            Loại lịch
            <select className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3" onChange={(event) => updateForm("type", event.target.value as ScheduleType)} value={form.type}>
              {Object.entries(scheduleTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-text">
            Thứ trong tuần
            <select className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3" onChange={(event) => updateForm("dayOfWeek", Number(event.target.value))} value={form.dayOfWeek}>
              {dayOptions.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-text">
            Giờ bắt đầu
            <input className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3" onChange={(event) => updateForm("startTime", event.target.value)} type="time" value={form.startTime} />
          </label>
          <label className="text-sm font-medium text-text">
            Giờ kết thúc
            <input className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3" onChange={(event) => updateForm("endTime", event.target.value)} type="time" value={form.endTime} />
          </label>
          <ClinicDateField id="schedule-effective-from" label="Hiệu lực từ ngày" onChange={(value) => updateForm("effectiveFrom", value)} value={form.effectiveFrom} />
          <ClinicDateField id="schedule-effective-to" label="Hiệu lực đến ngày" onChange={(value) => updateForm("effectiveTo", value)} value={form.effectiveTo} />
          <button className="h-10 self-end rounded-md bg-primary px-3 text-sm font-semibold text-white shadow-panel hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60" disabled={saveMutation.isPending} type="submit">
            Lưu lịch
          </button>
        </div>
        {formError ? <p className="mt-3 text-sm text-danger" role="alert">{formError}</p> : null}
        {saveMutation.error ? <p className="mt-3 text-sm text-danger" role="alert">{saveMutation.error instanceof Error ? saveMutation.error.message : "Không thể lưu lịch."}</p> : null}
      </form> : null}

      {error ? <p className="mt-4 text-sm text-danger" role="alert">{error instanceof Error ? error.message : "Không thể tải lịch."}</p> : null}
      {deactivateMutation.error ? <p className="mt-4 text-sm text-danger" role="alert">{deactivateMutation.error instanceof Error ? deactivateMutation.error.message : "Không thể vô hiệu hóa lịch."}</p> : null}

      <div className="mt-5 overflow-x-auto rounded-md border border-border bg-surface shadow-sm">
        <table aria-label="Lịch làm việc bác sĩ" className="min-w-full text-left text-sm">
          <thead className="bg-surface-muted text-xs text-text-muted">
            <tr>
              <th className="p-3 font-medium">Bác sĩ</th>
              <th className="p-3 font-medium">Loại lịch</th>
              <th className="p-3 font-medium">Trạng thái</th>
              <th className="p-3 font-medium">Thứ</th>
              <th className="p-3 font-medium">Thời gian</th>
              <th className="p-3 font-medium">Khoảng hiệu lực</th>
              <th className="p-3 text-right font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {sortedSchedules.map((schedule) => (
              <tr className="border-t border-border" key={schedule.id}>
                <td className="p-3 font-medium text-text">{doctorName(doctors, schedule.doctorId)}</td>
                <td className="p-3">{scheduleTypeLabels[schedule.type]}</td>
                <td className="p-3"><StatusBadge status={schedule.status} /></td>
                <td className="p-3">{dayOptions.find((day) => day.value === schedule.dayOfWeek)?.label ?? schedule.dayOfWeek}</td>
                <td className="p-3 tabular-nums">{schedule.startTime}-{schedule.endTime}</td>
                <td className="p-3 tabular-nums">{schedule.effectiveFrom} đến {schedule.effectiveTo}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <button aria-label={`Sửa ${doctorName(doctors, schedule.doctorId)} ${schedule.startTime}-${schedule.endTime}`} className="inline-flex size-8 items-center justify-center rounded-md border border-border text-text hover:bg-surface-muted" onClick={() => editSchedule(schedule)} title="Sửa" type="button">
                      <Pencil aria-hidden="true" size={15} />
                    </button>
                    <button aria-label={`Vô hiệu hóa ${doctorName(doctors, schedule.doctorId)} ${schedule.startTime}-${schedule.endTime}`} className="inline-flex size-8 items-center justify-center rounded-md border border-border text-danger hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50" disabled={schedule.status === "inactive" || deactivateMutation.isPending} onClick={() => setDeactivateTarget(schedule)} title="Vô hiệu hóa" type="button">
                      <XCircle aria-hidden="true" size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isLoading ? <p className="mt-3 text-sm text-text-muted">Đang tải lịch...</p> : null}
      {!isLoading && !sortedSchedules.length ? <p className="mt-3 text-sm text-text-muted">Không có lịch nào khớp bộ lọc.</p> : null}
      <ConfirmDialog
        confirmLabel="Vô hiệu hóa"
        description={`Lịch ${deactivateTarget ? `${doctorName(doctors, deactivateTarget.doctorId)} ${deactivateTarget.startTime}-${deactivateTarget.endTime}` : ""} sẽ không còn ảnh hưởng đến khung giờ đặt lịch mới. Dữ liệu lịch sử và kiểm toán vẫn được giữ lại.`}
        isOpen={Boolean(deactivateTarget)}
        onCancel={() => setDeactivateTarget(null)}
        onConfirm={() => deactivateTarget && deactivateMutation.mutate(deactivateTarget.id)}
        title="Xác nhận vô hiệu hóa lịch làm việc"
      />
    </section>
  );
}
