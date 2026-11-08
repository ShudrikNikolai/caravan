import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStatsTables1788253056791 implements MigrationInterface {
  name = 'AddStatsTables1788253056791';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_stats" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,

        "user_id" uuid NOT NULL,
        "games_played" integer NOT NULL DEFAULT 0,
        "wins" integer NOT NULL DEFAULT 0,
        "losses" integer NOT NULL DEFAULT 0,
        "current_win_streak" integer NOT NULL DEFAULT 0,
        "best_win_streak" integer NOT NULL DEFAULT 0,
        "total_duration_seconds" integer NOT NULL DEFAULT 0,
        "last_game_at" TIMESTAMPTZ,

        CONSTRAINT "PK_user_stats_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_user_stats_user_id"
      ON "user_stats" ("user_id")
    `);

    await queryRunner.query(`
      CREATE TABLE "stats_processed_games" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,

        "game_id" uuid NOT NULL,

        CONSTRAINT "PK_stats_processed_games_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_stats_processed_games_game_id"
      ON "stats_processed_games" ("game_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."IDX_stats_processed_games_game_id"
    `);
    await queryRunner.query(`
      DROP TABLE "stats_processed_games"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."IDX_user_stats_user_id"
    `);
    await queryRunner.query(`
      DROP TABLE "user_stats"
    `);
  }
}
