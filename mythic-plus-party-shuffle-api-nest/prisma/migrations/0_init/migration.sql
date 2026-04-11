Loaded Prisma config from prisma.config.ts.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "character_characterclass_enum" AS ENUM ('Warrior', 'Deathknight', 'Paladin', 'Monk', 'Priest', 'Mage', 'Druid', 'Rogue', 'Hunter', 'Demon Hunter', 'Warlock', 'Evoker', 'Shaman');

-- CreateEnum
CREATE TYPE "character_role_enum" AS ENUM ('TANK', 'HEAL', 'CAC', 'DIST');

-- CreateEnum
CREATE TYPE "character_specialization_enum" AS ENUM ('Warrior_Arms', 'Warrior_Fury', 'Warrior_Protection', 'Paladin_Holy', 'Paladin_Protection', 'Paladin_Retribution', 'Hunter_BeastMastery', 'Hunter_Marksmanship', 'Hunter_Survival', 'Rogue_Assassination', 'Rogue_Outlaw', 'Rogue_Subtlety', 'Priest_Discipline', 'Priest_Holy', 'Priest_Shadow', 'DeathKnight_Blood', 'DeathKnight_Frost', 'DeathKnight_Unholy', 'Shaman_Elemental', 'Shaman_Enhancement', 'Shaman_Restoration', 'Mage_Arcane', 'Mage_Fire', 'Mage_Frost', 'Warlock_Affliction', 'Warlock_Demonology', 'Warlock_Destruction', 'Monk_Brewmaster', 'Monk_Mistweaver', 'Monk_Windwalker', 'Druid_Balance', 'Druid_Feral', 'Druid_Guardian', 'Druid_Restoration', 'DemonHunter_Havoc', 'DemonHunter_Devourer', 'DemonHunter_Vengeance', 'Evoker_Devastation', 'Evoker_Preservation', 'Evoker_Augmentation');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR NOT NULL,
    "salt" VARCHAR NOT NULL,
    "sessionToken" VARCHAR,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(6),
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "arePartiesVisible" BOOLEAN NOT NULL DEFAULT false,
    "createdById" INTEGER NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "characterClass" "character_characterclass_enum" NOT NULL,
    "specialization" "character_specialization_enum" NOT NULL,
    "iLevel" INTEGER NOT NULL,
    "role" "character_role_enum" NOT NULL,
    "bloodLust" BOOLEAN NOT NULL DEFAULT false,
    "battleRez" BOOLEAN NOT NULL DEFAULT false,
    "keystoneMinLevel" INTEGER NOT NULL DEFAULT 2,
    "keystoneMaxLevel" INTEGER NOT NULL DEFAULT 99,
    "eventCode" TEXT,

    CONSTRAINT "character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_admins" (
    "event_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "event_admins_pkey" PRIMARY KEY ("event_id","user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "events_code_key" ON "events"("code");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character" ADD CONSTRAINT "character_eventCode_fkey" FOREIGN KEY ("eventCode") REFERENCES "events"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_admins" ADD CONSTRAINT "event_admins_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_admins" ADD CONSTRAINT "event_admins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

