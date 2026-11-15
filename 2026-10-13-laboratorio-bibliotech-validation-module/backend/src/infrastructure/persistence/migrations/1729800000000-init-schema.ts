import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1729800000000 implements MigrationInterface {
  name = 'InitSchema1729800000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE users (
        id varchar(36) NOT NULL,
        email varchar(255) NOT NULL,
        password_hash varchar(255) NOT NULL,
        role varchar(20) NOT NULL,
        token_version int NOT NULL DEFAULT 0,
        created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY uq_users_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE file_blobs (
        id varchar(36) NOT NULL,
        storage_key varchar(255) NOT NULL,
        original_name varchar(255) NOT NULL,
        mime_type varchar(100) NOT NULL,
        size_bytes int NOT NULL,
        created_at datetime(6) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uq_file_blobs_storage_key (storage_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE materials (
        id varchar(36) NOT NULL,
        title varchar(255) NULL,
        author varchar(255) NULL,
        description text NULL,
        subject varchar(120) NULL,
        publication_year int NULL,
        visibility varchar(20) NOT NULL,
        published_at datetime(6) NULL,
        deleted_at datetime(6) NULL,
        created_at datetime(6) NOT NULL,
        updated_at datetime(6) NOT NULL,
        owner_id varchar(36) NOT NULL,
        file_blob_id varchar(36) NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uq_materials_file_blob (file_blob_id),
        KEY idx_materials_visibility (visibility, deleted_at),
        KEY idx_materials_owner (owner_id),
        CONSTRAINT fk_materials_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE RESTRICT,
        CONSTRAINT fk_materials_file FOREIGN KEY (file_blob_id) REFERENCES file_blobs (id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS materials');
    await queryRunner.query('DROP TABLE IF EXISTS file_blobs');
    await queryRunner.query('DROP TABLE IF EXISTS users');
  }
}
