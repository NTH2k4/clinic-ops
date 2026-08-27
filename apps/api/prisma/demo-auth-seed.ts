import { AccountStatus, PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();
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

export async function ensureDemoAuthUsers(db: PrismaClient = prisma) {
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

async function main() {
  await ensureDemoAuthUsers();
}

if (require.main === module) {
  main()
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
