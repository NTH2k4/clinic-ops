import type { AuditEntityType } from "../../types/models";

const entityLabels: Record<AuditEntityType, string> = {
  appointment: "Lịch hẹn",
  patient: "Bệnh nhân",
  doctor: "Bác sĩ",
  service: "Dịch vụ",
  schedule: "Lịch làm việc",
  doctor_schedule: "Lịch làm việc",
  user: "Tài khoản",
};

const actionLabels: Record<string, string> = {
  appointment_created: "Tạo lịch hẹn",
  appointment_updated: "Cập nhật lịch hẹn",
  appointment_status_changed: "Đổi trạng thái lịch hẹn",
  appointment_confirmed: "Xác nhận lịch hẹn",
  appointment_checked_in: "Check-in lịch hẹn",
  appointment_started: "Bắt đầu khám",
  appointment_completed: "Hoàn tất khám",
  appointment_cancelled: "Hủy lịch hẹn",
  appointment_rescheduled: "Đổi lịch hẹn",
  patient_created: "Tạo bệnh nhân",
  patient_updated: "Cập nhật bệnh nhân",
  doctor_schedule_created: "Tạo lịch làm việc bác sĩ",
  doctor_schedule_updated: "Cập nhật lịch làm việc bác sĩ",
  doctor_schedule_deactivated: "Vô hiệu hóa lịch làm việc bác sĩ",
  admin_user_locked: "Khóa tài khoản",
  admin_user_unlocked: "Mở khóa tài khoản",
  admin_user_deactivated: "Vô hiệu hóa tài khoản",
  admin_password_reset: "Đặt lại mật khẩu",
  admin_resource_created: "Tạo cấu hình quản trị",
  admin_resource_updated: "Cập nhật cấu hình quản trị",
  admin_resource_deactivated: "Vô hiệu hóa cấu hình quản trị",
};

export function auditEntityLabel(entityType: AuditEntityType) {
  return entityLabels[entityType] ?? entityType;
}

export function auditActionLabel(action: string) {
  return actionLabels[action] ?? action;
}
