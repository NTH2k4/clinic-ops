import { Injectable } from "@nestjs/common";
import { AccountStatus, type Prisma } from "@prisma/client";
import { ApiError } from "../common/api-error";
import { paginationArgs } from "../common/validation";
import { PrismaService } from "../prisma/prisma.service";
import type { PatientCreateInput, PatientListQuery, PatientUpdateInput } from "./patients.dto";

type PatientRecord = Awaited<ReturnType<PrismaService["patient"]["findFirstOrThrow"]>>;
type PatientListRecord = Omit<PatientRecord, "citizenIdNumber" | "healthInsuranceNumber"> & {
  maskedCitizenIdNumber: string | null;
  maskedHealthInsuranceNumber: string | null;
};

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: PatientListQuery, includeRequestedStatus: boolean) {
    const where: Prisma.PatientWhereInput = {
      status: includeRequestedStatus && query.status !== undefined ? query.status : AccountStatus.active,
      ...(query.q ? { OR: [
        { fullName: { contains: query.q, mode: "insensitive" } },
        { phone: { contains: query.q, mode: "insensitive" } },
        { citizenIdNumber: { contains: query.q, mode: "insensitive" } },
        { healthInsuranceNumber: { contains: query.q, mode: "insensitive" } },
        { guardianName: { contains: query.q, mode: "insensitive" } },
        { guardianPhone: { contains: query.q, mode: "insensitive" } },
      ] } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.patient.findMany({ where, orderBy: { fullName: "asc" }, ...paginationArgs(query) }),
      this.prisma.patient.count({ where }),
    ]);
    return { items: items.map((patient) => this.listRecord(patient)), total };
  }

  async patient(id: string, includeOperationalNotes = true) {
    return this.require(this.prisma.patient.findUnique({
      where: { id },
      ...(includeOperationalNotes ? {} : { omit: { notes: true } }),
    }));
  }

  create(input: PatientCreateInput, actorUserId: string, userId?: string, includeOperationalNotes = true) {
    return this.prisma.$transaction(async (transaction) => {
      const patient = await transaction.patient.create({
        data: {
          ...this.createData(input),
          ...(userId ? { userId } : {}),
        },
      });
      await this.audit(transaction, actorUserId, patient.id, "patient_created");
      return this.detailRecord(patient, includeOperationalNotes);
    });
  }

  async update(id: string, input: PatientUpdateInput, actorUserId: string, includeOperationalNotes = true) {
    return this.prisma.$transaction(async (transaction) => {
      await this.require(transaction.patient.findUnique({ where: { id } }));
      const patient = await transaction.patient.update({ where: { id }, data: this.updateData(input) });
      await this.audit(transaction, actorUserId, patient.id, "patient_updated");
      return this.detailRecord(patient, includeOperationalNotes);
    });
  }

  async deactivate(id: string, actorUserId: string) {
    return this.prisma.$transaction(async (transaction) => {
      const patient = await this.require(transaction.patient.findUnique({ where: { id } }));
      const deactivated = await transaction.patient.update({ where: { id }, data: { status: AccountStatus.inactive } });
      await transaction.auditEvent.create({ data: { actorUserId, entityType: "patient", entityId: patient.id, action: "admin_resource_deactivated" } });
      return deactivated;
    });
  }

  private audit(transaction: Prisma.TransactionClient, actorUserId: string, patientId: string, action: string) {
    return transaction.auditEvent.create({ data: { actorUserId, entityType: "patient", entityId: patientId, action } });
  }

  private createData(input: PatientCreateInput): Prisma.PatientUncheckedCreateInput {
    return {
      fullName: input.fullName,
      phone: input.phone,
      email: input.email,
      citizenIdNumber: input.citizenIdNumber,
      healthInsuranceNumber: input.healthInsuranceNumber,
      guardianName: input.guardianName,
      guardianPhone: input.guardianPhone,
      identityDocumentType: input.identityDocumentType,
      dateOfBirth: input.dateOfBirth === undefined || input.dateOfBirth === null ? input.dateOfBirth : new Date(`${input.dateOfBirth}T00:00:00.000Z`),
      gender: input.gender,
      address: input.address,
      notes: input.notes,
    };
  }

  private updateData(input: PatientUpdateInput): Prisma.PatientUncheckedUpdateInput {
    return {
      fullName: input.fullName,
      phone: input.phone,
      email: input.email,
      citizenIdNumber: input.citizenIdNumber,
      healthInsuranceNumber: input.healthInsuranceNumber,
      guardianName: input.guardianName,
      guardianPhone: input.guardianPhone,
      identityDocumentType: input.identityDocumentType,
      dateOfBirth: input.dateOfBirth === undefined || input.dateOfBirth === null ? input.dateOfBirth : new Date(`${input.dateOfBirth}T00:00:00.000Z`),
      gender: input.gender,
      address: input.address,
      notes: input.notes,
    };
  }

  private omitOperationalNotes<T extends { notes?: string | null }>(patient: T) {
    const publicPatient = { ...patient };
    delete publicPatient.notes;
    return publicPatient;
  }

  private detailRecord<T extends PatientRecord>(patient: T, includeOperationalNotes: boolean) {
    const detail = {
      ...(includeOperationalNotes ? patient : this.omitOperationalNotes(patient)),
      maskedCitizenIdNumber: this.maskIdentityNumber(patient.citizenIdNumber),
      maskedHealthInsuranceNumber: this.maskIdentityNumber(patient.healthInsuranceNumber),
    };
    return detail;
  }

  private listRecord(patient: PatientRecord): PatientListRecord {
    const safePatient = { ...patient } as Omit<PatientRecord, "citizenIdNumber" | "healthInsuranceNumber"> & Partial<Pick<PatientRecord, "citizenIdNumber" | "healthInsuranceNumber">>;
    delete safePatient.citizenIdNumber;
    delete safePatient.healthInsuranceNumber;
    return {
      ...(safePatient as Omit<PatientRecord, "citizenIdNumber" | "healthInsuranceNumber">),
      maskedCitizenIdNumber: this.maskIdentityNumber(patient.citizenIdNumber),
      maskedHealthInsuranceNumber: this.maskIdentityNumber(patient.healthInsuranceNumber),
    };
  }

  maskIdentityNumber(value: string | null | undefined): string | null {
    if (!value) return null;
    const visible = value.slice(-4);
    return `${"*".repeat(Math.max(value.length - visible.length, 0))}${visible}`;
  }

  private async require<T>(value: Promise<T | null>): Promise<T> { const patient = await value; if (!patient) throw new ApiError(404, "NOT_FOUND", "patient was not found."); return patient; }
}
