import { Injectable } from "@nestjs/common";
import { AppointmentStatus, type Prisma, ServiceStatus } from "@prisma/client";
import { ApiError } from "../common/api-error";
import { PrismaService } from "../prisma/prisma.service";

type CatalogFilters = {
  q?: string;
  specialtyId?: string;
  serviceId?: string;
  status?: string;
  includeRequestedStatus: boolean;
};

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

  listServices(filters: CatalogFilters) {
    const where: Prisma.ServiceWhereInput = {
      specialtyId: filters.specialtyId,
      status: this.serviceStatus(filters.status, filters.includeRequestedStatus),
      ...(filters.q ? { name: { contains: filters.q, mode: "insensitive" } } : {}),
    };
    return this.prisma.service.findMany({ where, orderBy: { name: "asc" } });
  }

  async service(id: string) {
    return this.require(this.prisma.service.findUnique({ where: { id } }), "service");
  }

  async createService(input: ServiceInput) {
    const name = this.requiredString(input.name, "name");
    const specialtyId = this.requiredString(input.specialtyId, "specialtyId");
    const durationMinutes = this.positiveInteger(input.durationMinutes, "durationMinutes");
    const price = this.nonNegativeNumber(input.price, "price");
    await this.require(this.prisma.specialty.findUnique({ where: { id: specialtyId } }), "specialty");
    return this.prisma.service.create({
      data: {
        name,
        specialtyId,
        durationMinutes,
        price,
        currency: this.optionalString(input.currency) ?? "VND",
        description: this.optionalString(input.description),
        status: this.serviceStatusValue(input.status) ?? ServiceStatus.active,
      },
    });
  }

  async updateService(id: string, input: ServiceInput) {
    await this.service(id);
    const specialtyId = this.optionalString(input.specialtyId);
    if (specialtyId) await this.require(this.prisma.specialty.findUnique({ where: { id: specialtyId } }), "specialty");
    return this.prisma.service.update({
      where: { id },
      data: {
        ...this.stringUpdate(input, ["name", "currency", "description"]),
        ...(specialtyId ? { specialtyId } : {}),
        ...(input.durationMinutes !== undefined ? { durationMinutes: this.positiveInteger(input.durationMinutes, "durationMinutes") } : {}),
        ...(input.price !== undefined ? { price: this.nonNegativeNumber(input.price, "price") } : {}),
        ...(input.status !== undefined ? { status: this.serviceStatusValue(input.status) } : {}),
      },
    });
  }

  async deactivateService(id: string, actorUserId: string) {
    return this.prisma.$transaction(async (transaction) => {
      const service = await this.require(transaction.service.findUnique({ where: { id } }), "service");
      const deactivated = await transaction.service.update({ where: { id }, data: { status: ServiceStatus.inactive } });
      await this.audit(transaction, actorUserId, "service", service.id);
      return deactivated;
    });
  }

  listSpecialties(filters: CatalogFilters) {
    const where: Prisma.SpecialtyWhereInput = {
      status: this.serviceStatus(filters.status, filters.includeRequestedStatus),
      ...(filters.q ? { name: { contains: filters.q, mode: "insensitive" } } : {}),
    };
    return this.prisma.specialty.findMany({ where, orderBy: { name: "asc" } });
  }

  async createSpecialty(input: SpecialtyInput) {
    return this.prisma.specialty.create({
      data: {
        name: this.requiredString(input.name, "name"),
        description: this.optionalString(input.description),
        status: this.serviceStatusValue(input.status) ?? ServiceStatus.active,
      },
    });
  }

  async updateSpecialty(id: string, input: SpecialtyInput) {
    await this.require(this.prisma.specialty.findUnique({ where: { id } }), "specialty");
    return this.prisma.specialty.update({
      where: { id },
      data: {
        ...this.stringUpdate(input, ["name", "description"]),
        ...(input.status !== undefined ? { status: this.serviceStatusValue(input.status) } : {}),
      },
    });
  }

  async deactivateSpecialty(id: string, actorUserId: string) {
    return this.prisma.$transaction(async (transaction) => {
      const specialty = await this.require(transaction.specialty.findUnique({ where: { id } }), "specialty");
      const dependencies = await Promise.all([
        transaction.service.count({ where: { specialtyId: id, status: ServiceStatus.active } }),
        transaction.doctor.count({ where: { specialtyId: id, status: "active" } }),
      ]);
      if (dependencies.some(Boolean)) throw new ApiError(409, "CONFLICT", "Active resources still depend on this specialty.");
      const deactivated = await transaction.specialty.update({ where: { id }, data: { status: ServiceStatus.inactive } });
      await this.audit(transaction, actorUserId, "specialty", specialty.id);
      return deactivated;
    });
  }

  listDoctors(filters: CatalogFilters) {
    const where: Prisma.DoctorWhereInput = {
      specialtyId: filters.specialtyId,
      status: this.doctorStatus(filters.status, filters.includeRequestedStatus),
      ...(filters.serviceId ? { services: { some: { id: filters.serviceId } } } : {}),
      ...(filters.q ? { fullName: { contains: filters.q, mode: "insensitive" } } : {}),
    };
    return this.prisma.doctor.findMany({ where, include: { specialty: true, services: true }, orderBy: { fullName: "asc" } });
  }

  async doctor(id: string) {
    return this.require(this.prisma.doctor.findUnique({ where: { id }, include: { specialty: true, services: true } }), "doctor");
  }

  async createDoctor(input: DoctorInput) {
    const specialtyId = this.requiredString(input.specialtyId, "specialtyId");
    await this.require(this.prisma.specialty.findUnique({ where: { id: specialtyId } }), "specialty");
    return this.prisma.doctor.create({
      data: {
        fullName: this.requiredString(input.fullName, "fullName"), specialtyId,
        phone: this.requiredString(input.phone, "phone"), email: this.requiredString(input.email, "email"),
        title: this.optionalString(input.title), room: this.optionalString(input.room),
        status: this.doctorStatusValue(input.status) ?? "active",
        services: { connect: this.serviceIds(input.serviceIds).map((id) => ({ id })) },
      }, include: { specialty: true, services: true },
    });
  }

  async updateDoctor(id: string, input: DoctorInput) {
    await this.doctor(id);
    const specialtyId = this.optionalString(input.specialtyId);
    if (specialtyId) await this.require(this.prisma.specialty.findUnique({ where: { id: specialtyId } }), "specialty");
    return this.prisma.doctor.update({
      where: { id },
      data: {
        ...this.stringUpdate(input, ["fullName", "phone", "email", "title", "room"]),
        ...(specialtyId ? { specialtyId } : {}),
        ...(input.status !== undefined ? { status: this.doctorStatusValue(input.status) } : {}),
        ...(input.serviceIds !== undefined ? { services: { set: this.serviceIds(input.serviceIds).map((serviceId) => ({ id: serviceId })) } } : {}),
      }, include: { specialty: true, services: true },
    });
  }

  async deactivateDoctor(id: string, actorUserId: string) {
    return this.prisma.$transaction(async (transaction) => {
      const doctor = await this.require(transaction.doctor.findUnique({ where: { id } }), "doctor");
      const activeAppointments = await transaction.appointment.count({ where: { doctorId: id, status: { in: activeAppointmentStatuses } } });
      if (activeAppointments) throw new ApiError(409, "CONFLICT", "Doctor has active appointments.");
      const deactivated = await transaction.doctor.update({ where: { id }, data: { status: "inactive" } });
      await this.audit(transaction, actorUserId, "doctor", doctor.id);
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

  private audit(transaction: Prisma.TransactionClient, actorUserId: string, entityType: string, entityId: string) {
    return transaction.auditEvent.create({ data: { actorUserId, entityType, entityId, action: "admin_resource_deactivated" } });
  }
}
