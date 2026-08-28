import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { RolesGuard } from "../common/roles";
import { PrismaModule } from "../prisma/prisma.module";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  imports: [AuthModule, AuditModule, PrismaModule],
  controllers: [UsersController],
  providers: [UsersService, RolesGuard],
})
export class UsersModule {}
