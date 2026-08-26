import { Injectable } from "@nestjs/common";
import { AccountStatus, type Prisma } from "@prisma/client";
import { ApiError } from "../common/api-error";
import { PrismaService } from "../prisma/prisma.service";

type PatientInput = { fullName?: unknown; phone?: unknown; email?: unknown; dateOfBirth?: unknown; gender?: unknown; address?: unknown; notes?: unknown; status?: unknown };

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  list(q: string | undefined, status: string | undefined, includeRequestedStatus: boolean) {
    return this.prisma.patient.findMany({
      where: { status: includeRequestedStatus && status !== undefined ? this.status(status) : AccountStatus.active, ...(q ? { OR: [{ fullName: { contains: q, mode: "insensitive" } }, { phone: { contains: q, mode: "insensitive" } }] } : {}) },
      orderBy: { fullName: "asc" },
    });
  }

  async patient(id: string) { return this.require(this.prisma.patient.findUnique({ where: { id } })); }

  create(input: PatientInput) {
    return this.prisma.patient.create({ data: this.data(input, true) as unknown as Prisma.PatientCreateInput });
  }

  async update(id: string, input: PatientInput) {
    await this.patient(id);
    return this.prisma.patient.update({ where: { id }, data: this.data(input, false) as Prisma.PatientUpdateInput });
  }

  async deactivate(id: string, actorUserId: string) {
    return this.prisma.$transaction(async (transaction) => {
      const patient = await this.require(transaction.patient.findUnique({ where: { id } }));
      const deactivated = await transaction.patient.update({ where: { id }, data: { status: AccountStatus.inactive } });
      await transaction.auditEvent.create({ data: { actorUserId, entityType: "patient", entityId: patient.id, action: "admin_resource_deactivated" } });
      return deactivated;
    });
  }

  private data(input: PatientInput, create: boolean) {
    const fields = ["fullName", "phone", "email", "gender", "address", "notes"] as const;
    const data = Object.fromEntries(fields.flatMap((field) => input[field] === undefined ? [] : [[field, this.string(input[field]) ?? null]]));
    if (create) {
      const fullName = this.string(input.fullName); const phone = this.string(input.phone);
      if (!fullName || !phone) throw new ApiError(400, "VALIDATION_ERROR", "fullName and phone are required.");
      Object.assign(data, { fullName, phone });
    }
    if (input.dateOfBirth !== undefined) Object.assign(data, { dateOfBirth: this.date(input.dateOfBirth) });
    if (input.status !== undefined) Object.assign(data, { status: this.status(input.status) });
    return data;
  }

  private status(status: unknown): AccountStatus | undefined {
    if (status === undefined) return undefined;
    if (status === AccountStatus.active || status === AccountStatus.inactive || status === AccountStatus.locked) return status;
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid status.");
  }

  private string(value: unknown) { return typeof value === "string" ? value.trim() || undefined : undefined; }
  private date(value: unknown) { const date = typeof value === "string" ? new Date(value) : null; if (!date || Number.isNaN(date.valueOf())) throw new ApiError(400, "VALIDATION_ERROR", "dateOfBirth must be an ISO date."); return date; }
  private async require<T>(value: Promise<T | null>): Promise<T> { const patient = await value; if (!patient) throw new ApiError(404, "NOT_FOUND", "patient was not found."); return patient; }
}
