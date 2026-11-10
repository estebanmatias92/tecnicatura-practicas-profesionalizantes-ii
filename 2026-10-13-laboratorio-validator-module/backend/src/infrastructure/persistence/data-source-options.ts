import type { DataSourceOptions } from 'typeorm';
import { InitSchema1729800000000 } from './migrations/1729800000000-init-schema';
import { FileBlobOrm, MaterialOrm, UserOrm } from './typeorm/orm-entities';

export interface DbConnectionConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  logging?: boolean;
}

export function buildDataSourceOptions(config: DbConnectionConfig): DataSourceOptions {
  return {
    type: 'mysql',
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
    entities: [UserOrm, FileBlobOrm, MaterialOrm],
    migrations: [InitSchema1729800000000],
    synchronize: false,
    migrationsRun: false,
    logging: config.logging ?? false,
    charset: 'utf8mb4',
    timezone: 'Z',
    extra: { charset: 'utf8mb4' },
  };
}
