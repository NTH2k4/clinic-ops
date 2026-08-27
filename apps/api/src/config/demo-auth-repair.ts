import { Injectable, Logger, type OnApplicationBootstrap } from "@nestjs/common";
import { AccountStatus, type PrismaClient, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const demoPasswordHash = "$2a$10$Gfgzco0n8DMTE/AqMyfb.ekoNCRoI6QlhM88/1a.dgKwKEkX.Xmwi";

const demoUsers = [
  {
    id: "user-patient-1",
    displayName: "Patient Demo",
    email: "patient@careflow.local",
    phone: "+84910000001",
    role: UserRole.patient,
  },
  {
    id: "user-doctor-1",
    displayName: "Dr. Minh Nguyen",
    email: "minh.nguyen@careflow.local",
    phone: "+84900000001",
    role: UserRole.doctor,
  },
  {
    id: "user-receptionist-1",
    displayName: "Reception Demo",
    email: "reception@careflow.local",
    phone: "+84910000002",
    role: UserRole.receptionist,
  },
  {
    id: "user-nurse-1",
    displayName: "Nurse Demo",
    email: "nurse@careflow.local",
    phone: "+84910000003",
    role: UserRole.nurse,
  },
  {
    id: "user-admin-1",
    displayName: "Admin Demo",
    email: "admin@careflow.local",
    phone: "+84910000004",
    role: UserRole.admin,
  },
];

export function shouldRepairDemoAuthUsers(env: NodeJS.ProcessEnv) {
  return env.SERVE_WEB_APP?.trim().toLowerCase() === "true";
}

export async function ensureDemoAuthUsers(db: PrismaClient) {
  for (const user of demoUsers) {
    await db.user.upsert({
      where: { email: user.email },
      update: {
        displayName: user.displayName,
        passwordHash: demoPasswordHash,
        phone: user.phone,
        role: user.role,
        status: AccountStatus.active,
      },
      create: {
        ...user,
        passwordHash: demoPasswordHash,
        status: AccountStatus.active,
      },
    });
  }
}

@Injectable()
export class DemoAuthRepairService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DemoAuthRepairService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    if (!shouldRepairDemoAuthUsers(process.env)) {
      return;
    }

    await ensureDemoAuthUsers(this.prisma);
    this.logger.log("Demo auth users repaired for hosted demo mode.");
  }
}
