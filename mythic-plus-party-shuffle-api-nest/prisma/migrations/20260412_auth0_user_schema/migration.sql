-- AlterTable: add oidcSub, make password/salt nullable, drop sessionToken
ALTER TABLE "users" ADD COLUMN "oidcSub" VARCHAR(255);
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;
ALTER TABLE "users" ALTER COLUMN "salt" DROP NOT NULL;
ALTER TABLE "users" DROP COLUMN IF EXISTS "sessionToken";

-- CreateIndex
CREATE UNIQUE INDEX "users_oidcSub_key" ON "users"("oidcSub");
