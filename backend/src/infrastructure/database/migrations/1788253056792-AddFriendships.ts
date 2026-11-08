import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFriendships1788253056792 implements MigrationInterface {
  name = 'AddFriendships1788253056792';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "friendships" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,

        "requester_id" uuid NOT NULL,
        "addressee_id" uuid NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'pending',
        "accepted_at" TIMESTAMPTZ,

        CONSTRAINT "PK_friendships_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_friendships_pair"
      ON "friendships" (
        LEAST("requester_id", "addressee_id"),
        GREATEST("requester_id", "addressee_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_friendships_requester_id"
      ON "friendships" ("requester_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_friendships_addressee_id"
      ON "friendships" ("addressee_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."IDX_friendships_addressee_id"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."IDX_friendships_requester_id"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."IDX_friendships_pair"
    `);
    await queryRunner.query(`
      DROP TABLE "friendships"
    `);
  }
}
