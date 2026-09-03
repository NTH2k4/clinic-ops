ALTER TABLE "Patient" ADD COLUMN "citizenIdNumber" TEXT;
ALTER TABLE "Patient" ADD COLUMN "healthInsuranceNumber" TEXT;
ALTER TABLE "Patient" ADD COLUMN "guardianName" TEXT;
ALTER TABLE "Patient" ADD COLUMN "guardianPhone" TEXT;
ALTER TABLE "Patient" ADD COLUMN "identityDocumentType" TEXT;

CREATE UNIQUE INDEX "Patient_citizenIdNumber_key" ON "Patient"("citizenIdNumber");
CREATE UNIQUE INDEX "Patient_healthInsuranceNumber_key" ON "Patient"("healthInsuranceNumber");
