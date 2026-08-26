import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { RolesGuard } from "../common/roles";
import { PrismaModule } from "../prisma/prisma.module";
import { CatalogService } from "./catalog.service";
import { DoctorsController } from "./doctors.controller";
import { ServicesController } from "./services.controller";
import { SpecialtiesController } from "./specialties.controller";

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [DoctorsController, ServicesController, SpecialtiesController],
  providers: [CatalogService, RolesGuard],
})
export class CatalogModule {}
