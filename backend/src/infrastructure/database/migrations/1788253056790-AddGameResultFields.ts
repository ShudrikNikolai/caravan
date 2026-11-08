import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGameResultFields1788253056790 implements MigrationInterface {
  name = 'AddGameResultFields1788253056790';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "game_histories"
      ADD COLUMN "result_reason" varchar(16) NOT NULL DEFAULT 'normal'
    `);

    await queryRunner.query(`
      ALTER TABLE "game_histories"
      ADD COLUMN "duration_seconds" integer NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "game_histories"
      DROP COLUMN "duration_seconds"
    `);

    await queryRunner.query(`
      ALTER TABLE "game_histories"
      DROP COLUMN "result_reason"
    `);
  }
}
