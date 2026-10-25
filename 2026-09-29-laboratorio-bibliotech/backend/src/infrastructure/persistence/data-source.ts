import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './data-source-options';

export const AppDataSource = new DataSource(
  buildDataSourceOptions({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    username: process.env.DB_USER ?? 'bibliotech',
    password: process.env.DB_PASSWORD ?? 'bibliotech_dev',
    database: process.env.DB_NAME ?? 'bibliotech',
    logging: process.env.DB_LOGGING === 'true',
  }),
);
