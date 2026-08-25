import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { LoginPage } from "../features/auth/LoginPage";
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
import { RoleHomeRedirect } from "../routes/RoleHomeRedirect";

function TemporaryRoutePage({ title }: { title: string }) {
  return (
    <section>
      <h1 className="text-2xl font-semibold text-text">{title}</h1>
    </section>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<LoginPage />} path="/login" />
      <Route element={<RequireAuth />}>
        <Route element={<RoleHomeRedirect />} path="/app" />
        <Route element={<AppShell />} path="/app">
          <Route element={<PatientHome />} path="patient" />
          <Route element={<ServicesPage />} path="patient/services" />
          <Route element={<BookAppointmentPage />} path="patient/book" />
          <Route element={<MyAppointmentsPage />} path="patient/appointments" />
          <Route element={<DoctorDashboard />} path="doctor" />
          <Route element={<DoctorDaySchedule />} path="doctor/day" />
          <Route element={<DoctorWeekSchedule />} path="doctor/week" />
          <Route element={<OperationsDashboard />} path="operations" />
          <Route element={<QueuePage />} path="operations/queue" />
          <Route element={<OperationsCalendar />} path="operations/calendar" />
          <Route element={<CreateAppointmentPage />} path="operations/appointments/new" />
          <Route element={<TemporaryRoutePage title="Admin dashboard" />} path="admin" />
          <Route element={<TemporaryRoutePage title="Doctors" />} path="admin/doctors" />
          <Route element={<TemporaryRoutePage title="Services" />} path="admin/services" />
          <Route element={<TemporaryRoutePage title="Specialties" />} path="admin/specialties" />
          <Route element={<TemporaryRoutePage title="Staff" />} path="admin/staff" />
          <Route element={<TemporaryRoutePage title="Audit log" />} path="admin/audit" />
        </Route>
      </Route>
      <Route element={<Navigate replace to="/app" />} path="*" />
    </Routes>
  );
}
