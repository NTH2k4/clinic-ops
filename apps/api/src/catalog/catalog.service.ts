import { Injectable } from "@nestjs/common";
import { AppointmentStatus, type Prisma, ServiceStatus } from "@prisma/client";
import { ApiError } from "../common/api-error";
import { paginationArgs, type Pagination } from "../common/validation";
import { PrismaService } from "../prisma/prisma.service";

type CatalogFilters = {
  q?: string;
  specialtyId?: string;
  serviceId?: string;
  status?: string;
  includeRequestedStatus: boolean;
} & Pagination;

type ServiceInput = {
  name?: unknown;
  specialtyId?: unknown;
  durationMinutes?: unknown;
  price?: unknown;
  currency?: unknown;
  description?: unknown;
  status?: unknown;
};

type SpecialtyInput = { name?: unknown; description?: unknown; status?: unknown };

type DoctorInput = {
  fullName?: unknown;
  specialtyId?: unknown;
  phone?: unknown;
  email?: unknown;
  title?: unknown;
  room?: unknown;
  serviceIds?: unknown;
  status?: unknown;
};

const activeAppointmentStatuses: AppointmentStatus[] = [
  AppointmentStatus.requested,
  AppointmentStatus.confirmed,
  AppointmentStatus.checked_in,
  AppointmentStatus.in_progress,
];

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listServices(filters: CatalogFilters) {
    const where: Prisma.ServiceWhereInput = {
      specialtyId: filters.specialtyId,
      status: this.serviceStatus(filters.status, filters.includeRequestedStatus),
      ...(filters.q ? { name: { contains: filters.q, mode: "insensitive" } } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.service.findMany({ where, orderBy: { name: "asc" }, ...paginationArgs(filters) }),
      this.prisma.service.count({ where }),
    ]);
    return { items, total };
  }

  async service(id: string) {
    return this.require(this.prisma.service.findUnique({ where: { id } }), "service");
  }

  async createService(input: ServiceInput, actorUserId: string) {
    const name = this.requiredString(input.name, "name");
    const specialtyId = this.requiredString(input.specialtyId, "specialtyId");
    const durationMinutes = this.positiveInteger(input.durationMinutes, "durationMinutes");
    const price = this.nonNegativeNumber(input.price, "price");
    await this.require(this.prisma.specialty.findUnique({ where: { id: specialtyId } }), "specialty");
    return this.prisma.$transaction(async (transaction) => {
      const service = await transaction.service.create({
        data: {
          name, specialtyId, durationMinutes, price,
          currency: this.optionalString(input.currency) ?? "VND",
          description: this.optionalString(input.description),
          status: this.serviceStatusValue(input.status) ?? ServiceStatus.active,
        },
      });
      await this.audit(transaction, actorUserId, "service", service.id, "admin_resource_created");
      return service;
    });
  }

  async updateService(id: string, input: ServiceInput, actorUserId: string) {
    await this.service(id);
    if (input.status === ServiceStatus.inactive) throw new ApiError(400, "VALIDATION_ERROR", "Use the service deactivate endpoint to set inactive status.");
    const specialtyId = this.optionalString(input.specialtyId);
    if (specialtyId) await this.require(this.prisma.specialty.findUnique({ where: { id: specialtyId } }), "specialty");
    return this.prisma.$transaction(async (transaction) => {
      const service = await transaction.service.update({
        where: { id },
        data: {
          ...this.stringUpdate(input, ["name", "currency", "description"]),
          ...(specialtyId ? { specialtyId } : {}),
          ...(input.durationMinutes !== undefined ? { durationMinutes: this.positiveInteger(input.durationMinutes, "durationMinutes") } : {}),
          ...(input.price !== undefined ? { price: this.nonNegativeNumber(input.price, "price") } : {}),
          ...(input.status !== undefined ? { status: this.serviceStatusValue(input.status) } : {}),
        },
      });
      await this.audit(transaction, actorUserId, "service", service.id, "admin_resource_updated");
      return service;
    });
  }

  async deactivateService(id: string, actorUserId: string) {
    return this.prisma.$transaction(async (transaction) => {
      const service = await this.require(transaction.service.findUnique({ where: { id } }), "service");
      const activeAppointments = await transaction.appointment.count({ where: { serviceId: id, status: { in: activeAppointmentStatuses } } });
      if (activeAppointments) throw new ApiError(409, "RESOURCE_IN_USE", "Service has active appointments.");
      const deactivated = await transaction.service.update({ where: { id }, data: { status: ServiceStatus.inactive } });
      await this.audit(transaction, actorUserId, "service", service.id, "admin_resource_deactivated");
      return deactivated;
    });
  }

  async listSpecialties(filters: CatalogFilters) {
    const where: Prisma.SpecialtyWhereInput = {
      status: this.serviceStatus(filters.status, filters.includeRequestedStatus),
      ...(filters.q ? { name: { contains: filters.q, mode: "insensitive" } } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.specialty.findMany({ where, orderBy: { name: "asc" }, ...paginationArgs(filters) }),
      this.prisma.specialty.count({ where }),
    ]);
    return { items, total };
  }

  async createSpecialty(input: SpecialtyInput, actorUserId: string) {
    return this.prisma.$transaction(async (transaction) => {
      const specialty = await transaction.specialty.create({
        data: {
          name: this.requiredString(input.name, "name"),
          description: this.optionalString(input.description),
          status: this.serviceStatusValue(input.status) ?? ServiceStatus.active,
        },
      });
      await this.audit(transaction, actorUserId, "specialty", specialty.id, "admin_resource_created");
      return specialty;
    });
  }

  async updateSpecialty(id: string, input: SpecialtyInput, actorUserId: string) {
    await this.require(this.prisma.specialty.findUnique({ where: { id } }), "specialty");
    if (input.status === ServiceStatus.inactive) throw new ApiError(400, "VALIDATION_ERROR", "Use the specialty deactivate endpoint to set inactive status.");
    return this.prisma.$transaction(async (transaction) => {
      const specialty = await transaction.specialty.update({
        where: { id },
        data: {
          ...this.stringUpdate(input, ["name", "description"]),
          ...(input.status !== undefined ? { status: this.serviceStatusValue(input.status) } : {}),
        },
      });
      await this.audit(transaction, actorUserId, "specialty", specialty.id, "admin_resource_updated");
      return specialty;
    });
  }

  async deactivateSpecialty(id: string, actorUserId: string) {
    return this.prisma.$transaction(async (transaction) => {
      const specialty = await this.require(transaction.specialty.findUnique({ where: { id } }), "specialty");
      const dependencies = await Promise.all([
        transaction.service.count({ where: { specialtyId: id, status: ServiceStatus.active } }),
        transaction.doctor.count({ where: { specialtyId: id, status: "active" } }),
      ]);
      if (dependencies.some(Boolean)) throw new ApiError(409, "RESOURCE_IN_USE", "Active resources still depend on this specialty.");
      const deactivated = await transaction.specialty.update({ where: { id }, data: { status: ServiceStatus.inactive } });
      await this.audit(transaction, actorUserId, "specialty", specialty.id, "admin_resource_deactivated");
      return deactivated;
    });
  }

  async listDoctors(filters: CatalogFilters) {
    const where: Prisma.DoctorWhereInput = {
      specialtyId: filters.specialtyId,
      status: this.doctorStatus(filters.status, filters.includeRequestedStatus),
      ...(filters.serviceId ? { services: { some: { id: filters.serviceId } } } : {}),
      ...(filters.q ? { fullName: { contains: filters.q, mode: "insensitive" } } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.doctor.findMany({ where, include: { specialty: true, services: true }, orderBy: { fullName: "asc" }, ...paginationArgs(filters) }),
      this.prisma.doctor.count({ where }),
    ]);
    return { items, total };
  }

  async doctor(id: string) {
    return this.require(this.prisma.doctor.findUnique({ where: { id }, include: { specialty: true, services: true } }), "doctor");
  }

  async createDoctor(input: DoctorInput, actorUserId: string) {
    const specialtyId = this.requiredString(input.specialtyId, "specialtyId");
    await this.require(this.prisma.specialty.findUnique({ where: { id: specialtyId } }), "specialty");
    return this.prisma.$transaction(async (transaction) => {
      const doctor = await transaction.doctor.create({
        data: {
          fullName: this.requiredString(input.fullName, "fullName"), specialtyId,
          phone: this.requiredString(input.phone, "phone"), email: this.requiredString(input.email, "email"),
          title: this.optionalString(input.title), room: this.optionalString(input.room),
          status: this.doctorStatusValue(input.status) ?? "active",
          services: { connect: this.serviceIds(input.serviceIds).map((id) => ({ id })) },
        }, include: { specialty: true, services: true },
      });
      await this.audit(transaction, actorUserId, "doctor", doctor.id, "admin_resource_created");
      return doctor;
    });
  }

  async updateDoctor(id: string, input: DoctorInput, actorUserId: string) {
    await this.doctor(id);
    if (input.status === "inactive") throw new ApiError(400, "VALIDATION_ERROR", "Use the doctor deactivate endpoint to set inactive status.");
    const specialtyId = this.optionalString(input.specialtyId);
    if (specialtyId) await this.require(this.prisma.specialty.findUnique({ where: { id: specialtyId } }), "specialty");
    return this.prisma.$transaction(async (transaction) => {
      const doctor = await transaction.doctor.update({
        where: { id },
        data: {
          ...this.stringUpdate(input, ["fullName", "phone", "email", "title", "room"]),
          ...(specialtyId ? { specialtyId } : {}),
          ...(input.status !== undefined ? { status: this.doctorStatusValue(input.status) } : {}),
          ...(input.serviceIds !== undefined ? { services: { set: this.serviceIds(input.serviceIds).map((serviceId) => ({ id: serviceId })) } } : {}),
        }, include: { specialty: true, services: true },
      });
      await this.audit(transaction, actorUserId, "doctor", doctor.id, "admin_resource_updated");
      return doctor;
    });
  }

  async deactivateDoctor(id: string, actorUserId: string) {
    return this.prisma.$transaction(async (transaction) => {
      const doctor = await this.require(transaction.doctor.findUnique({ where: { id } }), "doctor");
      const activeAppointments = await transaction.appointment.count({ where: { doctorId: id, status: { in: activeAppointmentStatuses } } });
      if (activeAppointments) throw new ApiError(409, "RESOURCE_IN_USE", "Doctor has active appointments.");
      const deactivated = await transaction.doctor.update({ where: { id }, data: { status: "inactive" } });
      await this.audit(transaction, actorUserId, "doctor", doctor.id, "admin_resource_deactivated");
      return deactivated;
    });
  }

  private serviceStatus(status: string | undefined, includeRequestedStatus: boolean) {
    return includeRequestedStatus && status !== undefined ? this.serviceStatusValue(status) : ServiceStatus.active;
  }

  private doctorStatus(status: string | undefined, includeRequestedStatus: boolean) {
    return includeRequestedStatus && status !== undefined ? this.doctorStatusValue(status) : "active";
  }

  private serviceStatusValue(status: unknown): ServiceStatus | undefined {
    if (status === undefined) return undefined;
    if (status === ServiceStatus.active || status === ServiceStatus.inactive) return status;
    throw new ApiError(400, "VALIDATION_ERROR", "status must be active or inactive.");
  }

  private doctorStatusValue(status: unknown): "active" | "inactive" | "on_leave" | undefined {
    if (status === undefined) return undefined;
    if (status === "active" || status === "inactive" || status === "on_leave") return status;
    throw new ApiError(400, "VALIDATION_ERROR", "status must be active, inactive, or on_leave.");
  }

  private async require<T>(value: Promise<T | null>, entity: string): Promise<T> {
    const resource = await value;
    if (!resource) throw new ApiError(404, "NOT_FOUND", `${entity} was not found.`);
    return resource;
  }

  private requiredString(value: unknown, field: string) {
    const result = this.optionalString(value);
    if (!result) throw new ApiError(400, "VALIDATION_ERROR", `${field} is required.`, { [field]: "Required" });
    return result;
  }

  private optionalString(value: unknown) { return typeof value === "string" ? value.trim() || undefined : undefined; }

  private positiveInteger(value: unknown, field: string) {
    if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
    throw new ApiError(400, "VALIDATION_ERROR", `${field} must be a positive integer.`, { [field]: "Invalid" });
  }

  private nonNegativeNumber(value: unknown, field: string) {
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) return value;
    throw new ApiError(400, "VALIDATION_ERROR", `${field} must be a non-negative number.`, { [field]: "Invalid" });
  }

  private serviceIds(value: unknown) {
    if (value === undefined) return [];
    if (Array.isArray(value) && value.every((item): item is string => typeof item === "string" && item.length > 0)) return value;
    throw new ApiError(400, "VALIDATION_ERROR", "serviceIds must be an array of identifiers.");
  }

  private stringUpdate(input: Record<string, unknown>, fields: string[]) {
    return Object.fromEntries(fields.flatMap((field) => input[field] === undefined ? [] : [[field, this.optionalString(input[field]) ?? null]]));
  }

  private audit(transaction: Prisma.TransactionClient, actorUserId: string, entityType: string, entityId: string, action: string) {
    return transaction.auditEvent.create({ data: { actorUserId, entityType, entityId, action } });
  }
}
