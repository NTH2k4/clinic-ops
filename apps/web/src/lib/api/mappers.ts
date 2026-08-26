import type { Appointment, Doctor, Gender, Patient, Service, Specialty } from "../../types/models";
import type { ApiAppointmentRecord } from "./appointments";
import type { ApiDoctorRecord, ApiServiceRecord, ApiSpecialtyRecord } from "./catalog";
import type { ApiPatientRecord } from "./patients";

export function mapService(record: ApiServiceRecord): Service {
  return { ...record, price: Number(record.price), description: record.description ?? "" };
}

export function mapSpecialty(record: ApiSpecialtyRecord): Specialty {
  return { ...record, description: record.description ?? "" };
}

export function mapDoctor(record: ApiDoctorRecord): Doctor {
  return {
    id: record.id,
    ...(record.userId ? { userId: record.userId } : {}),
    fullName: record.fullName,
    specialtyId: record.specialtyId,
    serviceIds: record.services.map((service) => service.id),
    phone: record.phone,
    email: record.email,
    title: record.title ?? "",
    room: record.room ?? "",
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

const genders: Gender[] = ["female", "male", "other", "prefer_not_to_say"];

export function mapPatient(record: ApiPatientRecord): Patient {
  const gender = genders.find((candidate) => candidate === record.gender) ?? "prefer_not_to_say";

  return {
    id: record.id,
    ...(record.userId ? { userId: record.userId } : {}),
    fullName: record.fullName,
    phone: record.phone,
    ...(record.email ? { email: record.email } : {}),
    dateOfBirth: record.dateOfBirth ?? "",
    gender,
    ...(record.address ? { address: record.address } : {}),
    ...(record.notes ? { notes: record.notes } : {}),
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function mapAppointment(record: ApiAppointmentRecord): Appointment {
  return {
    id: record.id,
    patientId: record.patientId,
    doctorId: record.doctorId,
    serviceId: record.serviceId,
    startAt: record.startAt,
    endAt: record.endAt,
    status: record.status,
    ...(record.reason ? { reason: record.reason } : {}),
    ...(record.internalNote ? { internalNote: record.internalNote } : {}),
    ...(record.cancellationReason ? { cancellationReason: record.cancellationReason } : {}),
    createdByUserId: record.createdByUserId,
    ...(record.updatedByUserId ? { updatedByUserId: record.updatedByUserId } : {}),
    ...(record.checkedInAt ? { checkedInAt: record.checkedInAt } : {}),
    ...(record.startedAt ? { startedAt: record.startedAt } : {}),
    ...(record.completedAt ? { completedAt: record.completedAt } : {}),
    ...(record.cancelledAt ? { cancelledAt: record.cancelledAt } : {}),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    ...(record.patient ? { patient: mapPatient(record.patient) } : {}),
    ...(record.statusHistory ? {
      statusHistory: record.statusHistory.map((item) => ({
        id: item.id,
        appointmentId: item.appointmentId,
        ...(item.fromStatus ? { fromStatus: item.fromStatus } : {}),
        toStatus: item.toStatus,
        actorUserId: item.actorUserId,
        ...(item.note ? { note: item.note } : {}),
        changedAt: item.changedAt,
      })),
    } : {}),
  };
}
