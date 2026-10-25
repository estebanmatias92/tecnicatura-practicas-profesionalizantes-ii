import 'reflect-metadata';
import { AppDataSource } from './data-source';

async function main(): Promise<void> {
  await AppDataSource.initialize();
  const executed = await AppDataSource.runMigrations();
  console.log(`Migraciones aplicadas: ${executed.length}`);
  await AppDataSource.destroy();
}

main().catch((error) => {
  console.error('Error ejecutando migraciones', error);
  process.exit(1);
});
