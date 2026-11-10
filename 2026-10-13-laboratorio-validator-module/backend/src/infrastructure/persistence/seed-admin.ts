import 'reflect-metadata';
import { hashSync } from 'bcryptjs';
import { randomUUID } from 'crypto';
import type { DataSource } from 'typeorm';
import { Role } from '../../model/entities/enums';
import { AppDataSource } from './data-source';
import { UserOrm } from './typeorm/orm-entities';

export async function ensureAdmin(
  dataSource: DataSource,
  email: string,
  password: string,
): Promise<void> {
  if (!email || !password) {
    throw new Error('ADMIN_EMAIL y ADMIN_PASSWORD son obligatorios');
  }

  const repo = dataSource.getRepository(UserOrm);
  const normalized = email.trim().toLowerCase();
  const existing = await repo.findOne({ where: { email: normalized } });
  if (existing) {
    return;
  }

  const now = new Date();
  await repo.save({
    id: randomUUID(),
    email: normalized,
    passwordHash: hashSync(password, Number(process.env.BCRYPT_COST ?? 10)),
    role: Role.ADMIN,
    tokenVersion: 0,
    createdAt: now,
    updatedAt: now,
  });
  console.log(`Admin asegurado: ${normalized}`);
}

async function main(): Promise<void> {
  await AppDataSource.initialize();
  await ensureAdmin(
    AppDataSource,
    process.env.ADMIN_EMAIL ?? '',
    process.env.ADMIN_PASSWORD ?? '',
  );
  await AppDataSource.destroy();
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Error sembrando Admin', error);
    process.exit(1);
  });
}
