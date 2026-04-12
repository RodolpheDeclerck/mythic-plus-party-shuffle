-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."character_characterclass_enum" AS ENUM ('Warrior', 'Deathknight', 'Paladin', 'Monk', 'Priest', 'Mage', 'Druid', 'Rogue', 'Hunter', 'Demon Hunter', 'Warlock', 'Evoker', 'Shaman');

-- CreateEnum
CREATE TYPE "public"."character_role_enum" AS ENUM ('TANK', 'HEAL', 'CAC', 'DIST');

-- CreateEnum
CREATE TYPE "public"."character_specialization_enum" AS ENUM ('Warrior_Arms', 'Warrior_Fury', 'Warrior_Protection', 'Paladin_Holy', 'Paladin_Protection', 'Paladin_Retribution', 'Hunter_BeastMastery', 'Hunter_Marksmanship', 'Hunter_Survival', 'Rogue_Assassination', 'Rogue_Outlaw', 'Rogue_Subtlety', 'Priest_Discipline', 'Priest_Holy', 'Priest_Shadow', 'DeathKnight_Blood', 'DeathKnight_Frost', 'DeathKnight_Unholy', 'Shaman_Elemental', 'Shaman_Enhancement', 'Shaman_Restoration', 'Mage_Arcane', 'Mage_Fire', 'Mage_Frost', 'Warlock_Affliction', 'Warlock_Demonology', 'Warlock_Destruction', 'Monk_Brewmaster', 'Monk_Mistweaver', 'Monk_Windwalker', 'Druid_Balance', 'Druid_Feral', 'Druid_Guardian', 'Druid_Restoration', 'DemonHunter_Havoc', 'DemonHunter_Vengeance', 'Evoker_Devastation', 'Evoker_Preservation', 'Evoker_Augmentation', 'DemonHunter_Devourer');

-- CreateTable
CREATE TABLE "public"."character" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "characterClass" "public"."character_characterclass_enum" NOT NULL,
    "specialization" "public"."character_specialization_enum" NOT NULL,
    "iLevel" INTEGER NOT NULL,
    "role" "public"."character_role_enum" NOT NULL,
    "bloodLust" BOOLEAN NOT NULL DEFAULT false,
    "battleRez" BOOLEAN NOT NULL DEFAULT false,
    "keystoneMinLevel" INTEGER NOT NULL DEFAULT 2,
    "keystoneMaxLevel" INTEGER NOT NULL DEFAULT 99,
    "eventCode" VARCHAR,

    CONSTRAINT "PK_6c4aec48c564968be15078b8ae5" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_admins" (
    "event_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "PK_a7f2c3c48d438a9430813246aa6" PRIMARY KEY ("event_id","user_id")
);

-- CreateTable
CREATE TABLE "public"."events" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(6),
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "arePartiesVisible" BOOLEAN NOT NULL DEFAULT false,
    "createdById" INTEGER,

    CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."migrations" (
    "id" SERIAL NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "name" VARCHAR NOT NULL,

    CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."parties" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(50),
    "shuffle_round" INTEGER,

    CONSTRAINT "parties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."party_members" (
    "id" SERIAL NOT NULL,
    "party_id" INTEGER,
    "character_name" VARCHAR(255),
    "character_class" VARCHAR(50),
    "specialization" VARCHAR(50),
    "role" VARCHAR(50),
    "item_level" DECIMAL(5,2),
    "keystone_min" INTEGER,
    "keystone_max" INTEGER,
    "raider_io_score" INTEGER,
    "is_melee" BOOLEAN,
    "has_battle_rez" BOOLEAN,
    "has_bloodlust" BOOLEAN,

    CONSTRAINT "party_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."party_modifications" (
    "id" SERIAL NOT NULL,
    "party_id" INTEGER,
    "modified_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "reason" VARCHAR(255),
    "previous_member_id" INTEGER,
    "new_member_id" INTEGER,

    CONSTRAINT "party_modifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR NOT NULL,
    "salt" VARCHAR NOT NULL,
    "sessionToken" VARCHAR,

    CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IDX_46b9b4b7865c81cb4d723a35b7" ON "public"."event_admins"("event_id" ASC);

-- CreateIndex
CREATE INDEX "IDX_6918af9fd3be1ddc04b41d998b" ON "public"."event_admins"("user_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "UQ_0dcf33a3c6edf9ba546f30d801e" ON "public"."events"("code" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "UQ_97672ac88f789774dd47f7c8be3" ON "public"."users"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "UQ_fe0bb3f6520ee0469504521e710" ON "public"."users"("username" ASC);

-- AddForeignKey
ALTER TABLE "public"."character" ADD CONSTRAINT "FK_a2a1e604587dd7415b4964a9e07" FOREIGN KEY ("eventCode") REFERENCES "public"."events"("code") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."event_admins" ADD CONSTRAINT "FK_46b9b4b7865c81cb4d723a35b7e" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_admins" ADD CONSTRAINT "FK_6918af9fd3be1ddc04b41d998b8" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "FK_2fb864f37ad210f4295a09b684d" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."party_members" ADD CONSTRAINT "party_members_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "public"."parties"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."party_modifications" ADD CONSTRAINT "party_modifications_new_member_id_fkey" FOREIGN KEY ("new_member_id") REFERENCES "public"."party_members"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."party_modifications" ADD CONSTRAINT "party_modifications_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "public"."parties"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."party_modifications" ADD CONSTRAINT "party_modifications_previous_member_id_fkey" FOREIGN KEY ("previous_member_id") REFERENCES "public"."party_members"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

