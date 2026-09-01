import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateGameHistories1750000000000 implements MigrationInterface {
  name = 'CreateGameHistories1750000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'game_histories',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },

          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },

          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },

          {
            name: 'deleted_at',
            type: 'timestamptz',
            isNullable: true,
          },

          {
            name: 'master_id',
            type: 'uuid',
          },

          {
            name: 'rival_id',
            type: 'uuid',
          },

          {
            name: 'winner_id',
            type: 'uuid',
          },

          {
            name: 'caravan',
            type: 'jsonb',
            default: "'{}'::jsonb",
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'game_histories',
      new TableIndex({
        name: 'IDX_game_histories_master_id',
        columnNames: ['master_id'],
      }),
    );

    await queryRunner.createIndex(
      'game_histories',
      new TableIndex({
        name: 'IDX_game_histories_rival_id',
        columnNames: ['rival_id'],
      }),
    );

    await queryRunner.createIndex(
      'game_histories',
      new TableIndex({
        name: 'IDX_game_histories_winner_id',
        columnNames: ['winner_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('game_histories');
  }
}
