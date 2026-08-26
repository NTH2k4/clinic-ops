import { Module } from "@nestjs/common";
import { AppointmentsModule } from "../appointments/appointments.module";
import { AuthModule } from "../auth/auth.module";
import { RolesGuard } from "../common/roles";
import { PrismaModule } from "../prisma/prisma.module";
import { SchedulingController } from "./scheduling.controller";
import { SchedulingService } from "./scheduling.service";

@Module({
  imports: [AuthModule, PrismaModule, AppointmentsModule],
  controllers: [SchedulingController],
  providers: [SchedulingService, RolesGuard],
})
export class SchedulingModule {}
