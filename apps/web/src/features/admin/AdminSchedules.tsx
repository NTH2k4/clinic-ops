import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, RotateCcw, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { ClinicDateField } from "../../components/ClinicDateField";
import { StatusBadge } from "../../components/StatusBadge";
import type { ApiListResponse } from "../../lib/api/types";
import type { DoctorSchedule, ScheduleType } from "../../types/models";
import { catalogQueryOptions } from "../catalog/catalogService";
import { schedulingQueryOptions, schedulingService } from "../scheduling/schedulingService";
import type { ScheduleCreateInput, ScheduleListFilters, ScheduleUpdateInput } from "../scheduling/schedulingService";

const dayOptions = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
];

const scheduleTypeLabels: Record<ScheduleType, string> = {
  working: "Working",
  blocked: "Blocked",
  leave: "Leave",
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

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
    setFormError(null);
  }

  function submitSchedule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.doctorId) {
      setFormError("Please choose a doctor.");
      return;
    }
    if (form.startTime >= form.endTime) {
      setFormError("End time must be after start time.");
      return;
    }
    if (form.effectiveFrom > form.effectiveTo) {
      setFormError("Effective end date must be on or after the start date.");
      return;
    }

    saveMutation.mutate({ id: editingId ?? undefined, input: form });
  }

  return (
    <section className="mx-auto max-w-7xl">
      <p className="text-sm font-medium text-primary">Quản trị lịch bác sĩ</p>
      <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-semibold text-text">Schedules</h1>
        <p className="text-sm font-medium text-text-muted">{scheduleResponse?.meta.total ?? schedules.length} schedule entries</p>
      </div>

      <fieldset className="mt-5 border-y border-border py-3">
        <legend className="sr-only">Schedule filters</legend>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_11rem_11rem_auto]">
          <label className="text-sm font-medium text-text">
            Filter doctor
            <select className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3" onChange={(event) => setDraftFilters((current) => ({ ...current, doctorId: event.target.value }))} value={draftFilters.doctorId}>
              <option value="">All doctors</option>
              {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.fullName}</option>)}
            </select>
          </label>
          <ClinicDateField id="schedule-filter-from" label="Filter from" onChange={(value) => setDraftFilters((current) => ({ ...current, from: value }))} value={draftFilters.from} />
          <ClinicDateField id="schedule-filter-to" label="Filter to" onChange={(value) => setDraftFilters((current) => ({ ...current, to: value }))} value={draftFilters.to} />
          <button className="h-10 self-end rounded-md border border-border bg-surface px-3 text-sm font-semibold text-text hover:bg-surface-muted" onClick={applyFilters} type="button">Apply filters</button>
        </div>
      </fieldset>

      <form className="mt-5 rounded-md border border-border bg-surface p-4 shadow-sm" onSubmit={submitSchedule}>
        <div className="flex flex-col gap-1 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-text">{editingId ? "Update schedule" : "Create schedule"}</h2>
          {editingId ? <button className="inline-flex h-8 items-center gap-2 self-start rounded-md border border-border px-2 text-xs font-semibold text-text hover:bg-surface-muted sm:self-auto" onClick={resetForm} type="button"><RotateCcw aria-hidden="true" size={14} />Cancel edit</button> : null}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <label className="text-sm font-medium text-text">
            Doctor
            <select className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3" onChange={(event) => updateForm("doctorId", event.target.value)} value={form.doctorId}>
              <option value="">Choose doctor</option>
              {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.fullName}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-text">
            Schedule type
            <select className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3" onChange={(event) => updateForm("type", event.target.value as ScheduleType)} value={form.type}>
              {Object.entries(scheduleTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-text">
            Day of week
            <select className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3" onChange={(event) => updateForm("dayOfWeek", Number(event.target.value))} value={form.dayOfWeek}>
              {dayOptions.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-text">
            Start time
            <input className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3" onChange={(event) => updateForm("startTime", event.target.value)} type="time" value={form.startTime} />
          </label>
          <label className="text-sm font-medium text-text">
            End time
            <input className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3" onChange={(event) => updateForm("endTime", event.target.value)} type="time" value={form.endTime} />
          </label>
          <ClinicDateField id="schedule-effective-from" label="Effective from" onChange={(value) => updateForm("effectiveFrom", value)} value={form.effectiveFrom} />
          <ClinicDateField id="schedule-effective-to" label="Effective to" onChange={(value) => updateForm("effectiveTo", value)} value={form.effectiveTo} />
          <button className="h-10 self-end rounded-md bg-primary px-3 text-sm font-semibold text-white shadow-panel hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60" disabled={saveMutation.isPending} type="submit">
            {editingId ? "Update schedule" : "Create schedule"}
          </button>
        </div>
        {formError ? <p className="mt-3 text-sm text-danger" role="alert">{formError}</p> : null}
        {saveMutation.error ? <p className="mt-3 text-sm text-danger" role="alert">{saveMutation.error instanceof Error ? saveMutation.error.message : "Unable to save schedule."}</p> : null}
      </form>

      {error ? <p className="mt-4 text-sm text-danger" role="alert">{error instanceof Error ? error.message : "Unable to load schedules."}</p> : null}
      {deactivateMutation.error ? <p className="mt-4 text-sm text-danger" role="alert">{deactivateMutation.error instanceof Error ? deactivateMutation.error.message : "Unable to deactivate schedule."}</p> : null}

      <div className="mt-5 overflow-x-auto rounded-md border border-border bg-surface shadow-sm">
        <table aria-label="Doctor schedules" className="min-w-full text-left text-sm">
          <thead className="bg-surface-muted text-xs text-text-muted">
            <tr>
              <th className="p-3 font-medium">Doctor</th>
              <th className="p-3 font-medium">Type</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Day</th>
              <th className="p-3 font-medium">Time</th>
              <th className="p-3 font-medium">Effective range</th>
              <th className="p-3 text-right font-medium">Actions</th>
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
                <td className="p-3 tabular-nums">{schedule.effectiveFrom} to {schedule.effectiveTo}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <button aria-label={`Edit ${doctorName(doctors, schedule.doctorId)} ${schedule.startTime}-${schedule.endTime}`} className="inline-flex size-8 items-center justify-center rounded-md border border-border text-text hover:bg-surface-muted" onClick={() => editSchedule(schedule)} title="Edit" type="button">
                      <Pencil aria-hidden="true" size={15} />
                    </button>
                    <button aria-label={`Deactivate ${doctorName(doctors, schedule.doctorId)} ${schedule.startTime}-${schedule.endTime}`} className="inline-flex size-8 items-center justify-center rounded-md border border-border text-danger hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50" disabled={schedule.status === "inactive" || deactivateMutation.isPending} onClick={() => deactivateMutation.mutate(schedule.id)} title="Deactivate" type="button">
                      <XCircle aria-hidden="true" size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isLoading ? <p className="mt-3 text-sm text-text-muted">Loading schedules...</p> : null}
      {!isLoading && !sortedSchedules.length ? <p className="mt-3 text-sm text-text-muted">No schedules match these filters.</p> : null}
    </section>
  );
}
