import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { AuthModule } from "./auth/auth.module";
import { AppointmentsModule } from "./appointments/appointments.module";
import { CatalogModule } from "./catalog/catalog.module";
import { ApiExceptionFilter } from "./common/api-exception.filter";
import { HealthController } from "./health/health.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { PatientsModule } from "./patients/patients.module";

@Module({
  imports: [PrismaModule, AuthModule, CatalogModule, PatientsModule, AppointmentsModule],
  controllers: [HealthController],
  providers: [{ provide: APP_FILTER, useClass: ApiExceptionFilter }],
  exports: [AuthModule],
})
export class AppModule {}
