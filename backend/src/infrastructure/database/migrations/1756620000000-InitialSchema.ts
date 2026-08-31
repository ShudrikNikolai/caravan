import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1756620000000 implements MigrationInterface {
  name = 'InitialSchema1756620000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto"
    `);

    await queryRunner.query(`
      CREATE TYPE "users_auth_method_enum"
      AS ENUM ('local', 'oauth', 'email')
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),

        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,

        "email" varchar(64) NOT NULL,
        "username" varchar(64) NOT NULL,

        "auth_method" "users_auth_method_enum"
          NOT NULL DEFAULT 'local',

        "country" varchar(64),
        "city" varchar(64),

        "birth_date" TIMESTAMPTZ,

        "password_hash" text NOT NULL,

        CONSTRAINT "PK_users_id"
          PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_users_email"
      ON "users" ("email")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_users_username"
      ON "users" ("username")
    `);

    await queryRunner.query(`
      CREATE TABLE "user_device" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),

        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,

        "expires_at" TIMESTAMPTZ NOT NULL,
        "device" varchar(255) NOT NULL,

        "user_id" uuid NOT NULL,

        CONSTRAINT "PK_user_device_id"
          PRIMARY KEY ("id"),

        CONSTRAINT "FK_user_device_user"
          FOREIGN KEY ("user_id")
          REFERENCES "users" ("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_device_user_id"
      ON "user_device" ("user_id")
    `);

    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),

        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,

        "user_id" uuid NOT NULL,

        "jti" varchar(64) NOT NULL,

        "is_revoked" boolean
          NOT NULL DEFAULT false,

        "expires_at" TIMESTAMPTZ NOT NULL,

        "revoked_at" TIMESTAMPTZ,
        "revoked_by" varchar(100),
        "revoked_reason" varchar(255),

        CONSTRAINT "PK_refresh_tokens_id"
          PRIMARY KEY ("id"),

        CONSTRAINT "FK_refresh_tokens_user"
          FOREIGN KEY ("user_id")
          REFERENCES "users" ("id")
          ON DELETE CASCADE,

        CONSTRAINT "UQ_refresh_tokens_jti"
          UNIQUE ("jti")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_refresh_tokens_user_id"
      ON "refresh_tokens" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."IDX_refresh_tokens_user_id"
    `);

    await queryRunner.query(`
      DROP TABLE "refresh_tokens"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."IDX_user_device_user_id"
    `);

    await queryRunner.query(`
      DROP TABLE "user_device"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."IDX_users_username"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."IDX_users_email"
    `);

    await queryRunner.query(`
      DROP TABLE "users"
    `);

    await queryRunner.query(`
      DROP TYPE "users_auth_method_enum"
    `);
  }
}
