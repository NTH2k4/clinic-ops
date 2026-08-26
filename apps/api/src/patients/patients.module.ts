import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { RolesGuard } from "../common/roles";
import { PrismaModule } from "../prisma/prisma.module";
import { PatientsController } from "./patients.controller";
import { PatientsService } from "./patients.service";

@Module({ imports: [AuthModule, PrismaModule], controllers: [PatientsController], providers: [PatientsService, RolesGuard] })
export class PatientsModule {}
