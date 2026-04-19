-- Rename the SQL enum value 'Demon Hunter' (with space) to 'DemonHunter'
-- so it matches the Prisma DSL identifier and removes the need for @map.
ALTER TYPE "character_characterclass_enum" RENAME VALUE 'Demon Hunter' TO 'DemonHunter';
