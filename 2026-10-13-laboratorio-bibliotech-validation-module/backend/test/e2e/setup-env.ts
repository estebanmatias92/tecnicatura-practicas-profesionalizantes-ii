import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadDevEnv(): void {
  try {
    const content = readFileSync(resolve(__dirname, '../../../.env.dev'), 'utf8');
    for (const rawLine of content.split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#') || !line.includes('=')) continue;
      const separator = line.indexOf('=');
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // Sin .env.dev se usan los valores por defecto de abajo.
  }
}

loadDevEnv();

process.env.NODE_ENV = 'test';
process.env.DB_HOST = process.env.E2E_DB_HOST ?? '127.0.0.1';
process.env.DB_PORT = process.env.DB_PORT ?? '3306';
process.env.DB_NAME = process.env.DB_NAME ?? 'bibliotech';
process.env.DB_USER = process.env.DB_USER ?? 'bibliotech';
process.env.DB_PASSWORD = process.env.DB_PASSWORD ?? 'bibliotech_dev';
process.env.JWT_SECRET =
  process.env.JWT_SECRET ?? 'bibliotech-e2e-secret-with-more-than-32-chars';
process.env.BCRYPT_COST = process.env.BCRYPT_COST ?? '4';
process.env.UPLOAD_DIR = process.env.E2E_UPLOAD_DIR ?? '/tmp/bibliotech-e2e-uploads';
process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'e2e-admin@bibliotech.local';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Admin1234!';
