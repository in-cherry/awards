-- OTP por email (substitui phone)
ALTER TABLE "verification_codes" ADD COLUMN IF NOT EXISTS "email" TEXT;
UPDATE "verification_codes"
SET "email" = COALESCE("email", CONCAT("phone", '@invalid.local'));
ALTER TABLE "verification_codes" ALTER COLUMN "email" SET NOT NULL;
DROP INDEX IF EXISTS "verification_codes_tenantId_phone_idx";
CREATE INDEX IF NOT EXISTS "verification_codes_tenantId_email_idx" ON "verification_codes"("tenantId", "email");
ALTER TABLE "verification_codes" DROP COLUMN IF EXISTS "phone";

-- Slug de rifa por tenant
ALTER TABLE "raffles" ADD COLUMN IF NOT EXISTS "slug" TEXT;
UPDATE "raffles" SET "slug" = COALESCE(NULLIF("slug", ''), "id");
ALTER TABLE "raffles" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "raffles_tenantId_slug_key" ON "raffles"("tenantId", "slug");

-- Numero formatado do bilhete (6 digitos)
ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "numberFormatted" VARCHAR(6);
UPDATE "tickets" SET "numberFormatted" = LPAD(CAST("number" AS TEXT), 6, '0') WHERE "numberFormatted" IS NULL;
ALTER TABLE "tickets" ALTER COLUMN "numberFormatted" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "tickets_raffleId_numberFormatted_key" ON "tickets"("raffleId", "numberFormatted");
