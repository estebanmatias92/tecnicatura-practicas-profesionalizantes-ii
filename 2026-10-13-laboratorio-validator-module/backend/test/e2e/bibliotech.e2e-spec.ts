import { randomUUID } from 'crypto';
import { rm } from 'fs/promises';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { Role } from '../../src/model/entities/enums';
import { UserService } from '../../src/model/services/user.service';
import { buildDataSourceOptions } from '../../src/infrastructure/persistence/data-source-options';
import {
  FileBlobOrm,
  MaterialOrm,
  UserOrm,
} from '../../src/infrastructure/persistence/typeorm/orm-entities';

const suffix = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const password = 'E2ePassword123!';
const emails = {
  admin: `e2e-admin-${suffix}@bibliotech.local`,
  professor: `e2e-professor-${suffix}@bibliotech.local`,
  student: `e2e-student-${suffix}@bibliotech.local`,
};
const pdf = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF\n', 'utf8');

describe('BiblioTech API (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let users: UserService;
  let adminId: string;
  let professorId: string;
  let studentId: string;
  let adminToken: string;
  let professorToken: string;
  let studentToken: string;
  let materialId: string;
  const extraUserIds: string[] = [];

  async function login(email: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);
    return response.body.accessToken as string;
  }

  beforeAll(async () => {
    const migrationDataSource = new DataSource(
      buildDataSourceOptions({
        host: process.env.DB_HOST ?? '127.0.0.1',
        port: Number(process.env.DB_PORT ?? 3306),
        username: process.env.DB_USER ?? 'bibliotech',
        password: process.env.DB_PASSWORD ?? 'bibliotech_dev',
        database: process.env.DB_NAME ?? 'bibliotech',
      }),
    );
    await migrationDataSource.initialize();
    await migrationDataSource.runMigrations();
    await migrationDataSource.destroy();

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: false },
      }),
    );
    await app.init();

    dataSource = app.get(DataSource);
    users = app.get(UserService);

    const admin = await users.create({ email: emails.admin, password, role: Role.ADMIN });
    const professor = await users.create({
      email: emails.professor,
      password,
      role: Role.PROFESSOR,
    });
    const student = await users.create({
      email: emails.student,
      password,
      role: Role.STUDENT,
    });
    adminId = admin.id;
    professorId = professor.id;
    studentId = student.id;

    adminToken = await login(emails.admin);
    professorToken = await login(emails.professor);
    studentToken = await login(emails.student);
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      const ownerIds = [adminId, professorId, studentId, ...extraUserIds].filter(Boolean);
      const materials = await dataSource.getRepository(MaterialOrm).find({
        where: { ownerId: In(ownerIds) },
      });
      const blobIds = materials
        .map((material) => material.fileBlobId)
        .filter((id): id is string => Boolean(id));

      await dataSource.getRepository(MaterialOrm).delete({ ownerId: In(ownerIds) });
      if (blobIds.length > 0) {
        await dataSource.getRepository(FileBlobOrm).delete(blobIds);
      }
      await dataSource.getRepository(UserOrm).delete(ownerIds);
    }
    await app?.close();
    await rm(process.env.UPLOAD_DIR ?? '/tmp/bibliotech-e2e-uploads', {
      recursive: true,
      force: true,
    });
  });

  it('expone health público y exige sesión para el catálogo', async () => {
    await request(app.getHttpServer()).get('/api/health').expect(200, { status: 'ok' });
    await request(app.getHttpServer()).get('/api/materials').expect(401);
  });

  it('registra siempre Student e ignora el rol enviado', async () => {
    const email = `e2e-register-${suffix}@bibliotech.local`;
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password, role: 'ADMIN' })
      .expect(201);

    expect(response.body.user.role).toBe(Role.STUDENT);
    expect(response.body.accessToken).toEqual(expect.any(String));
    extraUserIds.push(response.body.user.id);

    const me = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${response.body.accessToken}`)
      .expect(200);
    expect(me.body.email).toBe(email);
    expect(me.body.role).toBe(Role.STUDENT);

    await dataSource.getRepository(UserOrm).delete({ email });
  });

  it('permite al Professor crear, publicar, ocultar, eliminar y al Admin restaurar', async () => {
    const title = `Material e2e ${suffix}`;
    const created = await request(app.getHttpServer())
      .post('/api/materials')
      .set('Authorization', `Bearer ${professorToken}`)
      .send({ title, author: 'Docente E2E', subject: 'Pruebas', year: 2026 })
      .expect(201);

    materialId = created.body.id;
    expect(created.body.isDraft).toBe(true);
    expect(created.body.visibility).toBe('OCULTO');
    expect(created.body.publishedAt).toBeNull();

    const uploaded = await request(app.getHttpServer())
      .post(`/api/materials/${materialId}/file`)
      .set('Authorization', `Bearer ${professorToken}`)
      .attach('file', pdf, { filename: 'e2e.pdf', contentType: 'application/pdf' })
      .expect(201);
    expect(uploaded.body.file.mimeType).toBe('application/pdf');
    expect(uploaded.body.file.originalName).toBe('e2e.pdf');

    const published = await request(app.getHttpServer())
      .post(`/api/materials/${materialId}/publish`)
      .set('Authorization', `Bearer ${professorToken}`)
      .expect(201);
    expect(published.body.visibility).toBe('PUBLICO');
    expect(published.body.isDraft).toBe(false);
    expect(published.body.publishedAt).toEqual(expect.any(String));

    const catalog = await request(app.getHttpServer())
      .get('/api/materials')
      .query({ q: suffix })
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    expect(catalog.body.total).toBe(1);
    expect(catalog.body.items[0].id).toBe(materialId);

    const file = await request(app.getHttpServer())
      .get(`/api/materials/${materialId}/file`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    expect(file.headers['content-type']).toContain('application/pdf');
    expect(file.headers['content-disposition']).toContain('inline');
    expect(file.body.subarray(0, 5).toString()).toBe('%PDF-');

    const hidden = await request(app.getHttpServer())
      .post(`/api/materials/${materialId}/hide`)
      .set('Authorization', `Bearer ${professorToken}`)
      .expect(201);
    expect(hidden.body.visibility).toBe('OCULTO');
    expect(hidden.body.isDraft).toBe(false);

    await request(app.getHttpServer())
      .get(`/api/materials/${materialId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(404);

    const afterHide = await request(app.getHttpServer())
      .get('/api/materials')
      .query({ q: suffix })
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    expect(afterHide.body.total).toBe(0);

    await request(app.getHttpServer())
      .delete(`/api/materials/${materialId}`)
      .set('Authorization', `Bearer ${professorToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/api/materials/${materialId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(404);

    const adminList = await request(app.getHttpServer())
      .get('/api/materials/admin')
      .query({ includeDeleted: 'true', limit: 100 })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(adminList.body.items.some((item: { id: string }) => item.id === materialId)).toBe(true);

    const restored = await request(app.getHttpServer())
      .post(`/api/materials/${materialId}/restore`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);
    expect(restored.body.deletedAt).toBeNull();
    expect(restored.body.visibility).toBe('OCULTO');
  });

  it('rechaza publicar sin archivo y respeta los roles', async () => {
    const draft = await request(app.getHttpServer())
      .post('/api/materials')
      .set('Authorization', `Bearer ${professorToken}`)
      .send({ title: `Borrador e2e ${suffix}`, author: 'Docente E2E' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/materials/${draft.body.id}/publish`)
      .set('Authorization', `Bearer ${professorToken}`)
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/materials')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ title: 'No permitido' })
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', `Bearer ${professorToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('permite al Admin crear usuarios y cambiar roles', async () => {
    const email = `e2e-created-${suffix}@bibliotech.local`;
    const created = await request(app.getHttpServer())
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email, password, role: Role.PROFESSOR })
      .expect(201);
    expect(created.body.role).toBe(Role.PROFESSOR);
    extraUserIds.push(created.body.id);

    const updated = await request(app.getHttpServer())
      .patch(`/api/users/${created.body.id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: Role.STUDENT })
      .expect(200);
    expect(updated.body.role).toBe(Role.STUDENT);

    await request(app.getHttpServer())
      .patch(`/api/users/${created.body.id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: Role.ADMIN })
      .expect(200);

    const list = await request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(list.body.items.some((item: { email: string }) => item.email === email)).toBe(true);

    await dataSource.getRepository(UserOrm).delete({ id: created.body.id });
  });
});
