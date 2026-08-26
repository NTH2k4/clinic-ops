type ApiAppointmentWorkflowUnavailableProps = {
  title: string;
};

export function ApiAppointmentWorkflowUnavailable({ title }: ApiAppointmentWorkflowUnavailableProps) {
  return (
    <section className="mx-auto max-w-3xl">
      <p className="text-sm font-medium text-primary">Lịch hẹn</p>
      <h1 className="mt-1 text-2xl font-semibold text-text">{title}</h1>
      <p className="mt-3 text-sm text-text-muted">Tính năng này tạm thời chưa khả dụng khi kết nối máy chủ.</p>
    </section>
  );
}
