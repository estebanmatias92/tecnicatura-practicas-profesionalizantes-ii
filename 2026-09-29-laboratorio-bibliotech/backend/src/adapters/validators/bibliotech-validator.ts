// BR-003 + NFR-005 + UC-002/UC-005 [Pure Fabrication + Protected Variations]
// BiblioValidator: modulo central de reglas (charter req 7). Cada regla es
// una Strategy (GoF conductual, ADR-0002): regla nueva = clase nueva, OCP.
// Cohesion note: User/Material guardan invariantes minimos; todo formato,
// rango y limite vive aqui para no esparcir conocimiento (no feature envy).
import { isEmail } from 'class-validator';
import { DomainError } from '../../usecases/errors';
import type { ValidatorPort, MaterialMeta, MaterialPatch } from '../../usecases/ports';

const MAX_FILE_BYTES = 50 * 1024 * 1024; // RST-005
const ALLOWED_MIME = ['application/pdf', 'application/epub+zip'];
const CURRENT_YEAR = new Date().getFullYear();

interface Rule {
  check(): void;
}

class EmailRule implements Rule {
  constructor(private readonly email: string) {}
  check(): void {
    if (!isEmail(this.email ?? '')) throw new DomainError('BAD_REQUEST', 'email invalido (BR-003)');
  }
}

class PasswordRule implements Rule {
  constructor(private readonly password: string) {}
  check(): void {
    if (typeof this.password !== 'string' || this.password.length < 8) {
      throw new DomainError('BAD_REQUEST', 'password >= 8 (BR-003)');
    }
  }
}

class FileRule implements Rule {
  constructor(
    private readonly mime: string,
    private readonly sizeBytes: number,
  ) {}
  check(): void {
    if (!ALLOWED_MIME.includes(this.mime)) {
      throw new DomainError('UNSUPPORTED_MEDIA', `MIME permitido: PDF/EPUB (NFR-005)`);
    }
    if (!Number.isInteger(this.sizeBytes) || this.sizeBytes <= 0 || this.sizeBytes > MAX_FILE_BYTES) {
      throw new DomainError('PAYLOAD_TOO_LARGE', `binario 1..${MAX_FILE_BYTES} bytes (RST-005)`);
    }
  }
}

class MetadataRule implements Rule {
  constructor(private readonly meta: MaterialMeta | MaterialPatch) {}
  check(): void {
    const m = this.meta;
    if (m.title !== undefined && (m.title.trim().length < 1 || m.title.trim().length > 200)) {
      throw new DomainError('BAD_REQUEST', 'title 1..200 (UC-002)');
    }
    if (m.author !== undefined && (m.author.trim().length < 1 || m.author.trim().length > 120)) {
      throw new DomainError('BAD_REQUEST', 'author 1..120 (UC-002)');
    }
    if (m.subject !== undefined && (m.subject.trim().length < 1 || m.subject.trim().length > 120)) {
      throw new DomainError('BAD_REQUEST', 'subject 1..120 (UC-002)');
    }
    if (m.year !== undefined && (!Number.isInteger(m.year) || m.year < 1000 || m.year > CURRENT_YEAR)) {
      throw new DomainError('BAD_REQUEST', `year 1000..${CURRENT_YEAR} (UC-002)`);
    }
    if (m.edition !== undefined && (m.edition.trim().length < 1 || m.edition.trim().length > 40)) {
      throw new DomainError('BAD_REQUEST', 'edition 1..40 (UC-002)');
    }
    if (m.tags !== undefined) {
      if (!Array.isArray(m.tags) || m.tags.length > 10) throw new DomainError('BAD_REQUEST', 'tags <= 10 (UC-002)');
      const seen = new Set<string>();
      for (const t of m.tags) {
        const n = (t ?? '').toLowerCase().trim();
        if (n.length < 1 || n.length > 30 || seen.has(n)) {
          throw new DomainError('BAD_REQUEST', 'tag lowercase 1..30 sin duplicados (UC-002)');
        }
        seen.add(n);
      }
    }
  }
}

export class BiblioValidator implements ValidatorPort {
  validateEmail(email: string): void {
    new EmailRule(email).check();
  }
  validatePassword(password: string): void {
    new PasswordRule(password).check();
  }
  validateMetadata(meta: MaterialMeta | MaterialPatch): void {
    new MetadataRule(meta).check();
  }
  validateFile(mime: string, sizeBytes: number): void {
    new FileRule(mime, sizeBytes).check();
  }
  normalizeFileName(name: string): string {
    // Basename, sin CRLF (NFR-005, BT-10).
    const base = name.replace(/\r\n|\r|\n/g, '').trim();
    const parts = base.split(/[\\/]/);
    return parts[parts.length - 1] || base;
  }
}
