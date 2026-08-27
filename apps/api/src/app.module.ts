import { MiddlewareConsumer, Module, type NestModule } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { AuthModule } from "./auth/auth.module";
import { AppointmentsModule } from "./appointments/appointments.module";
import { CatalogModule } from "./catalog/catalog.module";
import { ApiExceptionFilter } from "./common/api-exception.filter";
import { RequestLoggingMiddleware } from "./common/request-logging.middleware";
import { DemoAuthRepairService } from "./config/demo-auth-repair";
import { HealthController } from "./health/health.controller";
import { AuditModule } from "./audit/audit.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { PrismaModule } from "./prisma/prisma.module";
import { PatientsModule } from "./patients/patients.module";
import { SchedulingModule } from "./scheduling/scheduling.module";

@Module({
  imports: [PrismaModule, AuthModule, CatalogModule, PatientsModule, AppointmentsModule, SchedulingModule, AuditModule, NotificationsModule],
  controllers: [HealthController],
  providers: [RequestLoggingMiddleware, DemoAuthRepairService, { provide: APP_FILTER, useClass: ApiExceptionFilter }],
  exports: [AuthModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes("*");
  }
}
