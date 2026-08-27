import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { LoginPage } from "../features/auth/LoginPage";
import { RegisterPage } from "../features/auth/RegisterPage";
import { ChangePasswordPage } from "../features/auth/ChangePasswordPage";
import { AdminDashboard } from "../features/admin/AdminDashboard";
import { AdminDoctors } from "../features/admin/AdminDoctors";
import { AdminServices } from "../features/admin/AdminServices";
import { AdminSpecialties } from "../features/admin/AdminSpecialties";
import { AdminStaff } from "../features/admin/AdminStaff";
import { AuditLog } from "../features/admin/AuditLog";
import { AdminAccounts } from "../features/admin/AdminAccounts";
import { DoctorDashboard } from "../features/doctors/DoctorDashboard";
import { DoctorDaySchedule } from "../features/doctors/DoctorDaySchedule";
import { DoctorWeekSchedule } from "../features/doctors/DoctorWeekSchedule";
import { CreateAppointmentPage } from "../features/operations/CreateAppointmentPage";
import { OperationsCalendar } from "../features/operations/OperationsCalendar";
import { OperationsDashboard } from "../features/operations/OperationsDashboard";
import { QueuePage } from "../features/operations/QueuePage";
import { BookAppointmentPage } from "../features/patients/BookAppointmentPage";
import { MyAppointmentsPage } from "../features/patients/MyAppointmentsPage";
import { PatientHome } from "../features/patients/PatientHome";
import { ServicesPage } from "../features/patients/ServicesPage";
import { RequireAuth } from "../routes/RequireAuth";
import { RequireRole } from "../routes/RequireRole";
import { RoleHomeRedirect } from "../routes/RoleHomeRedirect";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<LoginPage />} path="/login" />
      <Route element={<RegisterPage />} path="/register" />
      <Route element={<RequireAuth />}>
        <Route element={<RoleHomeRedirect />} path="/app" />
        <Route element={<AppShell />} path="/app">
          <Route element={<ChangePasswordPage />} path="account/security" />
          <Route element={<PatientHome />} path="patient" />
          <Route element={<ServicesPage />} path="patient/services" />
          <Route element={<BookAppointmentPage />} path="patient/book" />
          <Route element={<MyAppointmentsPage />} path="patient/appointments" />
          <Route element={<DoctorDashboard />} path="doctor" />
          <Route element={<DoctorDaySchedule />} path="doctor/day" />
          <Route element={<DoctorWeekSchedule />} path="doctor/week" />
          <Route element={<RequireRole allowedRoles={["receptionist", "nurse"]} />}>
            <Route element={<OperationsDashboard />} path="operations" />
            <Route element={<QueuePage />} path="operations/queue" />
            <Route element={<OperationsCalendar />} path="operations/calendar" />
            <Route element={<CreateAppointmentPage />} path="operations/appointments/new" />
          </Route>
          <Route element={<RequireRole allowedRoles={["admin"]} />}>
            <Route element={<AdminDashboard />} path="admin" />
            <Route element={<AdminAccounts />} path="admin/accounts" />
            <Route element={<AdminDoctors />} path="admin/doctors" />
            <Route element={<AdminServices />} path="admin/services" />
            <Route element={<AdminSpecialties />} path="admin/specialties" />
            <Route element={<AdminStaff />} path="admin/staff" />
            <Route element={<AuditLog />} path="admin/audit" />
          </Route>
        </Route>
      </Route>
      <Route element={<Navigate replace to="/app" />} path="*" />
    </Routes>
  );
}
