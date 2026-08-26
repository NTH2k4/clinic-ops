import type { Doctor, Service, Specialty } from "../../types/models";
import type { ApiDoctorRecord, ApiServiceRecord, ApiSpecialtyRecord } from "./catalog";

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
