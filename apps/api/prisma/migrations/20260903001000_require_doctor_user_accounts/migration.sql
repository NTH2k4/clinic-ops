INSERT INTO "User" ("id", "displayName", "email", "phone", "role", "status", "passwordHash", "createdAt", "updatedAt")
SELECT
  CONCAT('user-', d."id"),
  d."fullName",
  d."email",
  d."phone",
  'doctor'::"UserRole",
  'active'::"AccountStatus",
  '$2a$10$H4s5USKgqXcAKRtVmqh9z.fpqi06p8G70VS1WbY9HEvYZLAjVORi2',
  NOW(),
  NOW()
FROM "Doctor" d
WHERE d."userId" IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "User" u
    WHERE u."email" = d."email"
  );

UPDATE "Doctor" d
SET "userId" = u."id"
FROM "User" u
WHERE d."userId" IS NULL
  AND u."email" = d."email"
  AND u."role" = 'doctor'::"UserRole";

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Doctor" WHERE "userId" IS NULL) THEN
    RAISE EXCEPTION 'Cannot require Doctor.userId while doctors without matching doctor users remain.';
  END IF;
END $$;

ALTER TABLE "Doctor" ALTER COLUMN "userId" SET NOT NULL;
