import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds DemonHunter_Devourer to the PostgreSQL enum used by character.specialization.
 * (TypeORM name: character_specialization_enum)
 */
export class AddDemonHunterDevourerSpecialization1743785751000
  implements MigrationInterface
{
  name = 'AddDemonHunterDevourerSpecialization1743785751000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "character_specialization_enum" ADD VALUE 'DemonHunter_Devourer'`,
    );
  }

  public async down(): Promise<void> {
    // PostgreSQL does not support dropping a single enum value safely.
  }
}
