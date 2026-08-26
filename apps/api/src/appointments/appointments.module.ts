import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { RolesGuard } from "../common/roles";
import { PrismaModule } from "../prisma/prisma.module";
import { AppointmentConflictsService } from "./appointment-conflicts.service";
import { AppointmentsController } from "./appointments.controller";
import { AppointmentsService } from "./appointments.service";

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentConflictsService, RolesGuard],
  exports: [AppointmentConflictsService],
})
export class AppointmentsModule {}
