import 'reflect-metadata';
import { hashSync } from 'bcryptjs';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import JSZip from 'jszip';
import { extname, join, resolve } from 'path';
import type { DataSource } from 'typeorm';
import { Role, Visibility } from '../../model/entities/enums';
import { AppDataSource } from './data-source';
import { ensureAdmin } from './seed-admin';
import { FileBlobOrm, MaterialOrm, UserOrm } from './typeorm/orm-entities';

interface DemoFile {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}

interface DemoMaterial {
  title: string;
  author: string;
  description?: string;
  subject?: string;
  year?: number;
  visibility: Visibility;
  publishedAt: Date | null;
  deletedAt?: Date | null;
  file?: DemoFile;
}

function escapePdfText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function createPdf(title: string): Buffer {
  const content = `BT /F1 20 Tf 72 720 Td (${escapePdfText(title)}) Tj ET`;
  const parts = [
    '%PDF-1.4\n',
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n',
    `4 0 obj\n<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];

  let pdf = parts[0];
  const offsets: number[] = [0];
  for (let index = 1; index < parts.length; index += 1) {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += parts[index];
  }

  const xrefStart = Buffer.byteLength(pdf, 'latin1');
  let xref = `xref\n0 ${parts.length}\n0000000000 65535 f \n`;
  for (let index = 1; index < parts.length; index += 1) {
    xref += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `${xref}trailer\n<< /Size ${parts.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function createEpub(title: string, author: string): Promise<Buffer> {
  const zip = new JSZip();
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  zip.file(
    'META-INF/container.xml',
    '<?xml version="1.0" encoding="UTF-8"?>' +
      '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">' +
      '<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>' +
      '</container>',
  );
  zip.file(
    'OEBPS/content.opf',
    '<?xml version="1.0" encoding="UTF-8"?>' +
      '<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="3.0">' +
      '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">' +
      `<dc:identifier id="bookid">urn:uuid:${randomUUID()}</dc:identifier>` +
      `<dc:title>${escapeXml(title)}</dc:title>` +
      '<dc:language>es</dc:language>' +
      `<dc:creator>${escapeXml(author)}</dc:creator>` +
      '<meta property="dcterms:modified">2026-01-01T00:00:00Z</meta>' +
      '</metadata>' +
      '<manifest>' +
      '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>' +
      '<item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>' +
      '</manifest>' +
      '<spine><itemref idref="chapter1"/></spine>' +
      '</package>',
  );
  zip.file(
    'OEBPS/nav.xhtml',
    '<?xml version="1.0" encoding="UTF-8"?>' +
      '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">' +
      `<head><title>${escapeXml(title)}</title></head>` +
      '<body><nav epub:type="toc"><h1>Contenido</h1><ol>' +
      '<li><a href="chapter1.xhtml">Capítulo 1</a></li>' +
      '</ol></nav></body></html>',
  );
  zip.file(
    'OEBPS/chapter1.xhtml',
    '<?xml version="1.0" encoding="UTF-8"?>' +
      '<html xmlns="http://www.w3.org/1999/xhtml">' +
      `<head><title>${escapeXml(title)}</title></head>` +
      `<body><h1>${escapeXml(title)}</h1><p>${escapeXml(author)}</p>` +
      '<p>Material de demostración de BiblioTech.</p></body></html>',
  );
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

async function ensureUser(
  dataSource: DataSource,
  email: string,
  password: string,
  role: Role,
): Promise<string> {
  const repo = dataSource.getRepository(UserOrm);
  const normalized = email.trim().toLowerCase();
  const existing = await repo.findOne({ where: { email: normalized } });
  if (existing) return existing.id;

  const now = new Date();
  const user = await repo.save({
    id: randomUUID(),
    email: normalized,
    passwordHash: hashSync(password, Number(process.env.BCRYPT_COST ?? 10)),
    role,
    tokenVersion: 0,
    createdAt: now,
    updatedAt: now,
  });
  console.log(`Usuario demo asegurado: ${normalized} (${role})`);
  return user.id;
}

async function ensureMaterial(
  dataSource: DataSource,
  ownerId: string,
  input: DemoMaterial,
): Promise<void> {
  const materials = dataSource.getRepository(MaterialOrm);
  const blobs = dataSource.getRepository(FileBlobOrm);
  const existing = await materials.findOne({ where: { title: input.title, ownerId } });
  if (existing) return;

  const now = new Date();
  let fileBlobId: string | null = null;

  if (input.file) {
    const directory = resolve(process.env.UPLOAD_DIR ?? './uploads');
    await mkdir(directory, { recursive: true });
    const storageKey = `${randomUUID()}${extname(input.file.originalName).toLowerCase()}`;
    await writeFile(join(directory, storageKey), input.file.buffer);

    const blob = await blobs.save({
      id: randomUUID(),
      storageKey,
      originalName: input.file.originalName,
      mimeType: input.file.mimeType,
      sizeBytes: input.file.buffer.length,
      createdAt: now,
    });
    fileBlobId = blob.id;
  }

  await materials.save({
    id: randomUUID(),
    title: input.title,
    author: input.author,
    description: input.description ?? null,
    subject: input.subject ?? null,
    year: input.year ?? null,
    visibility: input.visibility,
    publishedAt: input.publishedAt,
    deletedAt: input.deletedAt ?? null,
    createdAt: now,
    updatedAt: now,
    ownerId,
    fileBlobId,
  });
  console.log(`Material demo asegurado: ${input.title}`);
}

async function main(): Promise<void> {
  await AppDataSource.initialize();

  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@bibliotech.local';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin1234!';
  await ensureAdmin(AppDataSource, adminEmail, adminPassword);

  const professorId = await ensureUser(
    AppDataSource,
    'professor@bibliotech.local',
    'Professor1234!',
    Role.PROFESSOR,
  );
  await ensureUser(AppDataSource, 'student@bibliotech.local', 'Student1234!', Role.STUDENT);
  await ensureUser(AppDataSource, 'lucia@bibliotech.local', 'Student1234!', Role.STUDENT);

  const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  await ensureMaterial(AppDataSource, professorId, {
    title: 'Introducción a los Sistemas',
    author: 'Ana Gómez',
    description: 'Un recorrido por los conceptos fundamentales del análisis de sistemas.',
    subject: 'Análisis de Sistemas',
    year: 2024,
    visibility: Visibility.PUBLICO,
    publishedAt: daysAgo(10),
    file: {
      buffer: createPdf('Introduccion a los Sistemas'),
      originalName: 'introduccion-sistemas.pdf',
      mimeType: 'application/pdf',
    },
  });

  await ensureMaterial(AppDataSource, professorId, {
    title: 'Patrones de Diseño en la Práctica',
    author: 'Carlos Ruiz',
    description: 'Ejemplos de patrones creacionales, estructurales y de comportamiento.',
    subject: 'Diseño de Software',
    year: 2025,
    visibility: Visibility.PUBLICO,
    publishedAt: daysAgo(7),
    file: {
      buffer: createPdf('Patrones de Diseno en la Practica'),
      originalName: 'patrones-diseno.pdf',
      mimeType: 'application/pdf',
    },
  });

  await ensureMaterial(AppDataSource, professorId, {
    title: 'Bases de Datos Relacionales',
    author: 'María López',
    description: 'Modelo relacional, normalización y consultas SQL.',
    subject: 'Bases de Datos',
    year: 2023,
    visibility: Visibility.PUBLICO,
    publishedAt: daysAgo(5),
    file: {
      buffer: await createEpub('Bases de Datos Relacionales', 'María López'),
      originalName: 'bases-de-datos.epub',
      mimeType: 'application/epub+zip',
    },
  });

  await ensureMaterial(AppDataSource, professorId, {
    title: 'Apunte en revisión',
    author: 'Ana Gómez',
    description: 'Borrador que todavía no se publicó.',
    subject: 'Análisis de Sistemas',
    year: 2026,
    visibility: Visibility.OCULTO,
    publishedAt: null,
    file: {
      buffer: createPdf('Apunte en revision'),
      originalName: 'apunte-en-revision.pdf',
      mimeType: 'application/pdf',
    },
  });

  await ensureMaterial(AppDataSource, professorId, {
    title: 'Material oculto',
    author: 'Ana Gómez',
    description: 'Publicación oculta temporalmente.',
    subject: 'Análisis de Sistemas',
    year: 2026,
    visibility: Visibility.OCULTO,
    publishedAt: daysAgo(3),
    file: {
      buffer: createPdf('Material oculto'),
      originalName: 'material-oculto.pdf',
      mimeType: 'application/pdf',
    },
  });

  await ensureMaterial(AppDataSource, professorId, {
    title: 'Material eliminado',
    author: 'Ana Gómez',
    description: 'Disponible en la papelera de Admin.',
    subject: 'Análisis de Sistemas',
    year: 2026,
    visibility: Visibility.PUBLICO,
    publishedAt: daysAgo(2),
    deletedAt: daysAgo(1),
    file: {
      buffer: createPdf('Material eliminado'),
      originalName: 'material-eliminado.pdf',
      mimeType: 'application/pdf',
    },
  });

  await AppDataSource.destroy();
  console.log('Seed de desarrollo completo');
}

main().catch((error) => {
  console.error('Error sembrando datos de desarrollo', error);
  process.exit(1);
});
