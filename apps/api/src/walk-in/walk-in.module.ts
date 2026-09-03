import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { RolesGuard } from "../common/roles";
import { PatientsModule } from "../patients/patients.module";
import { PrismaModule } from "../prisma/prisma.module";
import { WalkInAssignmentService } from "./walk-in-assignment.service";
import { WalkInController } from "./walk-in.controller";

@Module({
  imports: [AuthModule, PrismaModule, PatientsModule],
  controllers: [WalkInController],
  providers: [WalkInAssignmentService, RolesGuard],
})
export class WalkInModule {}
